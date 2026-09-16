from __future__ import annotations

import json
import os
import tomllib
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy.dialects.sqlite import insert

from app.database import create_database_engine, create_session_factory, default_database_url
from app.migrations import upgrade_database
from app.models import RecommendationMetric, SearchConversionDaily, SyncRun


SOURCE_SEARCH = "Quick BI MCP/search_drama_conversion_data"
SOURCE_RECOMMENDATION = "Quick BI MCP/recommend_data"


@dataclass(frozen=True)
class McpConfig:
    url: str
    token: str
    user_id: str


@dataclass(frozen=True)
class QuickBiSyncResult:
    search_conversion: int
    recommendation: int
    start_date: date
    end_date: date


def _codex_config_path() -> Path:
    configured = os.environ.get("CODEX_HOME")
    return Path(configured) / "config.toml" if configured else Path.home() / ".codex" / "config.toml"


def load_mcp_config(path: Path | None = None) -> McpConfig:
    url = os.environ.get("QUICKBI_MCP_URL")
    token = os.environ.get("QUICKBI_MCP_TOKEN")
    user_id = os.environ.get("QUICKBI_MCP_USER_ID")
    if url and token and user_id:
        return McpConfig(url=url, token=token.removeprefix("Bearer ").strip(), user_id=user_id)

    config_path = path or _codex_config_path()
    try:
        raw = tomllib.loads(config_path.read_text(encoding="utf-8"))
        server = raw["mcp_servers"]["quickbi-data"]
        headers = server["headers"]
        authorization = str(headers["Authorization"])
        return McpConfig(
            url=str(server["url"]),
            token=authorization.removeprefix("Bearer ").strip(),
            user_id=str(headers["userId"]),
        )
    except (FileNotFoundError, KeyError, tomllib.TOMLDecodeError) as exc:
        raise RuntimeError(
            "未找到 Quick BI MCP 配置。请设置 QUICKBI_MCP_URL、QUICKBI_MCP_TOKEN、"
            "QUICKBI_MCP_USER_ID，或配置 Codex 的 quickbi-data MCP。"
        ) from exc


class QuickBiMcpClient:
    def __init__(self, config: McpConfig, timeout: int = 30):
        self.config = config
        self.timeout = timeout
        self.session_id: str | None = None
        self._request_id = 0

    def _post(self, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.config.token}",
            "userId": self.config.user_id,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        request = Request(
            self.config.url,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        last_error: Exception | None = None
        for _ in range(2):
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    self.session_id = response.headers.get("Mcp-Session-Id", self.session_id)
                    body = response.read().decode("utf-8")
                break
            except (HTTPError, URLError, TimeoutError) as exc:
                last_error = exc
        else:
            raise RuntimeError(f"Quick BI MCP 请求失败：{type(last_error).__name__}") from last_error
        if not body.strip():
            return {}
        if any(line.startswith("data:") for line in body.splitlines()):
            messages = [line[5:].strip() for line in body.splitlines() if line.startswith("data:")]
            body = messages[-1]
        try:
            result = json.loads(body)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Quick BI MCP 返回了无法解析的数据") from exc
        if result.get("error"):
            message = result["error"].get("message", "未知错误")
            raise RuntimeError(f"Quick BI MCP 返回错误：{message}")
        return result

    def _rpc(self, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        self._request_id += 1
        return self._post(
            {"jsonrpc": "2.0", "id": self._request_id, "method": method, "params": params or {}}
        ).get("result", {})

    def initialize(self) -> None:
        if self.session_id:
            return
        self._rpc(
            "initialize",
            {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "signal-studio", "version": "1.0"},
            },
        )
        self._post({"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}})

    def list_tools(self) -> list[dict[str, Any]]:
        self.initialize()
        return list(self._rpc("tools/list").get("tools", []))

    def call(self, name: str, arguments: dict[str, Any]) -> list[dict[str, Any]]:
        self.initialize()
        result = self._rpc("tools/call", {"name": name, "arguments": arguments})
        if result.get("isError"):
            raise RuntimeError(f"Quick BI MCP 工具 {name} 执行失败")
        texts = [item.get("text", "") for item in result.get("content", []) if item.get("type") == "text"]
        if not texts:
            raise RuntimeError(f"Quick BI MCP 工具 {name} 没有返回数据")
        try:
            payload = json.loads(texts[-1])
            rows = payload["Result"]["Values"]
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            raise RuntimeError(f"Quick BI MCP 工具 {name} 返回结构不符合预期") from exc
        if not isinstance(rows, list):
            raise RuntimeError(f"Quick BI MCP 工具 {name} 返回的 Values 不是列表")
        return rows


def _number(value: Any, *, integer: bool = False) -> int | float | None:
    if value in (None, "", "--"):
        return None
    if isinstance(value, str):
        value = value.replace(",", "").strip()
        if value.endswith("%"):
            value = float(value[:-1]) / 100
    return int(float(value)) if integer else float(value)


def _row_date(row: dict[str, Any]) -> date:
    value = str(row.get("date") or row.get("日期") or "")
    try:
        return datetime.strptime(value, "%Y%m%d").date() if "-" not in value else date.fromisoformat(value)
    except ValueError as exc:
        raise RuntimeError(f"MCP 返回了无效日期：{value!r}") from exc


def _assert_range(rows: list[dict[str, Any]], start: date, end: date, dataset: str) -> None:
    if not rows:
        raise RuntimeError(f"{dataset} 在所选日期范围内没有返回数据")
    outside = [row for row in rows if not start <= _row_date(row) <= end]
    if outside:
        raise RuntimeError(f"{dataset} 返回了所选日期范围之外的数据")


SEARCH_FIELDS = (
    "into_search_click_uv",
    "search_suc_uv",
    "search_suc_uv_ratio",
    "result_content_click_uv",
    "result_video_after_ad_play_start_uv",
    "result_play_5mins_uv",
    "ff_play_uv_rate",
    "play_5min_uv_rate",
    "result_play_time_uv",
)


def _fetch_search(client: QuickBiMcpClient, start: date, end: date) -> list[dict[str, Any]]:
    rows = client.call(
        "search_drama_conversion_data",
        {"start_date": start.strftime("%Y%m%d"), "end_date": end.strftime("%Y%m%d")},
    )
    _assert_range(rows, start, end, "search_drama_conversion_data")
    integer_fields = set(SEARCH_FIELDS[:2] + SEARCH_FIELDS[3:6])
    return [
        {
            "date": _row_date(row),
            **{field: _number(row.get(field), integer=field in integer_fields) for field in SEARCH_FIELDS},
        }
        for row in rows
    ]


def _fetch_recommendation(client: QuickBiMcpClient, start: date, end: date) -> list[dict[str, Any]]:
    rows = client.call(
        "recommend_data",
        {
            "start_date": start.strftime("%Y%m%d"),
            "end_date": end.strftime("%Y%m%d"),
            "source_type": "猜你喜欢",
        },
    )
    _assert_range(rows, start, end, "recommend_data")
    # source_type is an input-only filter in the current MCP response; page remains in each row.
    selected = [row for row in rows if row.get("page") == "首页"]
    if len(selected) != len({_row_date(row) for row in selected}):
        raise RuntimeError("recommend_data 同一日期返回了多条首页/猜你喜欢记录")
    if not selected:
        raise RuntimeError("recommend_data 未返回首页/猜你喜欢记录")
    return [
        {
            "date": _row_date(row),
            "page": "首页",
            "source_type": "猜你喜欢",
            "front_tab_uv": _number(row.get("front_tab_uv"), integer=True),
            "content_exposure_uv": _number(row.get("total_content_exposure_uv"), integer=True),
            "content_click_uv": _number(row.get("total_content_click_uv"), integer=True),
            "content_click_rate": _number(row.get("total_content_click_rate")),
            "ff_play_convert_rate": _number(row.get("ff_play_convert_rate")),
            "play_convert_rate": _number(row.get("play_convert_rate")),
            "play_5min_rate_uv": _number(row.get("play_5min_rate_uv")),
            "avg_time_uv": _number(row.get("avg_time_uv")),
        }
        for row in selected
    ]


def sync_quickbi_dashboard(
    start_date: date,
    end_date: date,
    database_url: str | None = None,
    client: QuickBiMcpClient | None = None,
) -> QuickBiSyncResult:
    if end_date < start_date:
        raise ValueError("结束日期不能早于开始日期")
    mcp = client or QuickBiMcpClient(load_mcp_config())

    # All remote reads and validation finish before the write transaction starts.
    search = _fetch_search(mcp, start_date, end_date)
    recommendation = _fetch_recommendation(mcp, start_date, end_date)
    now = datetime.now(UTC)
    for records in (search, recommendation):
        for record in records:
            record["synced_at"] = now

    url = database_url or default_database_url()
    upgrade_database(url)
    engine = create_database_engine(url)
    factory = create_session_factory(engine)
    try:
        with factory.begin() as session:
            jobs = (
                (SearchConversionDaily, search, ["date"], "search_conversion", SOURCE_SEARCH),
                (RecommendationMetric, recommendation, ["date"], "recommendation", SOURCE_RECOMMENDATION),
            )
            for model, records, keys, dataset, source in jobs:
                excluded = insert(model).excluded
                update_fields = [field for field in records[0] if field not in keys]
                statement = insert(model).values(records).on_conflict_do_update(
                    index_elements=keys,
                    set_={field: getattr(excluded, field) for field in update_fields},
                )
                session.execute(statement)
                session.add(
                    SyncRun(
                        dataset=dataset,
                        status="success",
                        row_count=len(records),
                        start_date=start_date,
                        end_date=end_date,
                        source=source,
                        completed_at=now,
                    )
                )
    finally:
        engine.dispose()
    return QuickBiSyncResult(len(search), len(recommendation), start_date, end_date)

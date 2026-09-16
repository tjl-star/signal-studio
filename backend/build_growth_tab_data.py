"""Derive the three content-opportunity tab datasets from verified weekly rows."""

from __future__ import annotations

import json
import os
import tempfile
import time
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dashboard-v2" / "data" / "season_play_weekly_20260706_20260831.json"
OUT = ROOT / "dashboard-v2" / "data" / "content_growth_tabs.json"


def write_atomic(path: Path, text: str) -> None:
    """Write derived output without exposing partial files on Windows."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
        for attempt in range(4):
            try:
                os.replace(temp_name, path)
                break
            except PermissionError:
                if attempt == 3:
                    raise
                time.sleep(0.25 * (attempt + 1))
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
GENRES = {"CHN": "国产", "JP": "日剧", "KR": "韩剧", "TH": "泰剧", "UK": "英剧", "USK": "美剧", "OTHER": "其他"}


def num(value) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def compact(row: dict, **extra) -> dict:
    return {
        "season_id": row.get("season_id"),
        "title": row.get("title") or "未命名内容",
        "season_type": row.get("season_type"),
        "genre": GENRES.get(row.get("season_type"), row.get("season_type") or "其他"),
        "season_classify": row.get("season_classify") or "--",
        "plot_type": row.get("plot_type") or "--",
        "producer_region": row.get("producer_region") or "--",
        "play_count": num(row.get("play_count")),
        "play_uv": num(row.get("play_uv")),
        **extra,
    }


def rank_rows(rows: list[dict], metric: str) -> list[dict]:
    ranked = sorted(rows, key=lambda row: num(row.get(metric)), reverse=True)
    return [{**row, "rank": index} for index, row in enumerate(ranked, 1)]


def main() -> None:
    rows = json.loads(SOURCE.read_text(encoding="utf-8"))
    periods = sorted({(row["period_start"], row["period_end"]) for row in rows})
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in rows:
        grouped[(row["period_start"], row["period_end"])].append(row)

    summaries = []
    genre_top30 = {}
    bl_top20 = {}
    for period_start, period_end in periods:
        period_rows = grouped[(period_start, period_end)]
        total_vv = sum(num(row.get("play_count")) for row in period_rows)
        total_uv = sum(num(row.get("play_uv")) for row in period_rows)
        bl_rows = [row for row in period_rows if "同性" in str(row.get("plot_type") or "").split(",")]
        bl_vv = sum(num(row.get("play_count")) for row in bl_rows)
        bl_uv = sum(num(row.get("play_uv")) for row in bl_rows)
        summaries.append({
            "period_start": period_start,
            "period_end": period_end,
            "total_play_vv": total_vv,
            "total_content_play_uv": total_uv,
            "bl_play_vv": bl_vv,
            "bl_content_play_uv": bl_uv,
            "bl_vv_share": bl_vv / total_vv if total_vv else None,
            "bl_avg_play_count": bl_vv / bl_uv if bl_uv else None,
            "bl_rule": "plot_type contains exact label 同性",
            "source": "data_provider/seasonPlayVV",
        })
        bl_top20[(period_start, period_end)] = rank_rows([compact(row) for row in bl_rows], "play_count")[:20]
        for code, name in GENRES.items():
            genre_rows = [compact(row) for row in period_rows if row.get("season_type") == code]
            vv_ranked = rank_rows(genre_rows, "play_count")
            uv_ranked = rank_rows(genre_rows, "play_uv")
            total_genre_vv = sum(num(row.get("play_count")) for row in genre_rows)
            total_genre_uv = sum(num(row.get("play_uv")) for row in genre_rows)
            top5_vv = sum(num(row.get("play_count")) for row in vv_ranked[:5])
            genre_top30[f"{period_start}|{period_end}|{code}"] = {
                "genre": name,
                "genre_code": code,
                "period_start": period_start,
                "period_end": period_end,
                "total_play_vv": total_genre_vv,
                "total_play_uv": total_genre_uv,
                "top1_contribution": num(vv_ranked[0].get("play_count")) / total_genre_vv if vv_ranked and total_genre_vv else None,
                "top5_contribution": top5_vv / total_genre_vv if total_genre_vv else None,
                "concentration": top5_vv / total_genre_vv if total_genre_vv else None,
                "top30_vv": vv_ranked[:30],
                "top30_uv": uv_ranked[:30],
                "source": "data_provider/seasonPlayVV",
            }

    # Compare only complete calendar weeks; partial boundary periods remain available for BL detail.
    complete = [(start, end) for start, end in periods if start >= "2026-07-06" and end != "2026-08-31"]
    growth = []
    growth_by_period = {}
    for index in range(1, len(complete)):
        previous_key, current_key = complete[index - 1], complete[index]
        previous = {str(row.get("season_id")): row for row in grouped[previous_key] if row.get("season_id")}
        current_ranked = rank_rows([compact(row) for row in grouped[current_key]], "play_count")
        previous_rank = {key: rank for rank, key in enumerate(sorted(previous, key=lambda key: num(previous[key].get("play_count")), reverse=True), 1)}
        period_growth = []
        for current in current_ranked:
            old = previous.get(str(current.get("season_id")))
            old_vv = num(old.get("play_count")) if old else 0
            delta = num(current.get("play_count")) - old_vv
            period_growth.append({**current, "period_start": current_key[0], "period_end": current_key[1], "previous_play_vv": old_vv, "vv_delta": delta, "vv_mom": (delta / old_vv if old_vv else None), "previous_rank": previous_rank.get(str(current.get("season_id"))), "new_top20": current["rank"] <= 20 and (previous_rank.get(str(current.get("season_id"))) or 999) > 20, "continuous_growth": bool(old and delta > 0), "source": "data_provider/seasonPlayVV"})
        growth_by_period[f"{current_key[0]}|{current_key[1]}"] = sorted(period_growth, key=lambda row: num(row.get("vv_delta")), reverse=True)[:20]
        growth.extend(period_growth)
    latest_growth = sorted(growth, key=lambda row: num(row.get("vv_delta")), reverse=True)[:20]

    date_start = min((row["period_start"] for row in rows), default="2026-07-01")
    date_end = max((row["period_end"] for row in rows), default=date_start)
    latest_period = periods[-1] if periods else (date_start, date_end)
    previous_period = periods[-2] if len(periods) > 1 else latest_period
    payload = json.dumps({"date_range": [date_start, date_end], "summaries": summaries, "bl_top20": {"|".join(key): value for key, value in bl_top20.items()}, "genre_top30": genre_top30, "growth_top20": latest_growth, "growth_by_period": growth_by_period, "source": "data_provider/seasonPlayVV", "notes": ["内容级播放UV为seasonPlayVV.play_uv；跨内容UV不做用户去重。", "BL按plot_type中的精确标签同性识别。", f"增长榜比较等长自然周，默认{latest_period[0]}..{latest_period[1]}对比{previous_period[0]}..{previous_period[1]}。"]}, ensure_ascii=False, separators=(",", ":"))
    write_atomic(OUT, payload)
    print(f"wrote {OUT}")
    print(f"summaries={len(summaries)} genre_views={len(genre_top30)} growth={len(latest_growth)}")


if __name__ == "__main__":
    main()

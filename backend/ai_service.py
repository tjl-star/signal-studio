"""Evidence-grounded content briefs with DeepSeek, Gemini, OpenAI and rules fallback."""

from __future__ import annotations

import json
import os
import uuid
from typing import Any

from common import load_env_file, safe_float, safe_int, setup_logging, utc_now
from database import query_all, save_brief


logger = setup_logging("ai_brief")

BRIEF_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "topic_direction": {"type": "string"},
        "business_goal": {"type": "string"},
        "target_audience": {"type": "string"},
        "content_format": {"type": "string"},
        "suggested_duration": {"type": "string"},
        "core_insight": {"type": "string"},
        "title_options": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        "tag_suggestions": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 8},
        "publishing_advice": {"type": "string"},
        "opening_hook": {"type": "string"},
        "content_outline": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 6},
        "evidence": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {"video_id": {"type": "string"}, "fact": {"type": "string"}},
                "required": ["video_id", "fact"],
            },
            "minItems": 1,
        },
        "operational_hypotheses": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        "risks": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "data_gaps": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "topic_direction", "business_goal", "target_audience", "content_format", "suggested_duration",
        "core_insight", "title_options", "tag_suggestions", "publishing_advice", "opening_hook",
        "content_outline", "evidence", "operational_hypotheses", "risks", "confidence", "data_gaps",
    ],
}


def _candidate_rows(video_ids: list[str], max_candidates: int) -> list[dict[str, Any]]:
    joins = """FROM videos v
        LEFT JOIN video_tmdb_links l ON l.platform=v.platform AND l.video_id=v.video_id
        LEFT JOIN tmdb_titles t ON t.tmdb_id=l.tmdb_id"""
    fields = """v.*, t.tmdb_id, t.title AS tmdb_title, t.media_type,
        t.popularity AS tmdb_popularity, t.vote_average AS tmdb_vote_average, t.genres AS tmdb_genres"""
    if video_ids:
        ids = video_ids[:max_candidates]
        placeholders = ",".join("?" for _ in ids)
        order = "CASE v.video_id " + " ".join(f"WHEN ? THEN {index}" for index, _ in enumerate(ids)) + " END"
        return query_all(
            f"SELECT {fields} {joins} WHERE v.video_id IN ({placeholders}) ORDER BY {order}",
            tuple(ids + ids),
        )
    return query_all(
        f"SELECT {fields} {joins} ORDER BY COALESCE(v.heat_score,0) DESC, COALESCE(v.latest_view_count,0) DESC LIMIT ?",
        (max_candidates,),
    )


def _evidence(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = []
    for row in rows:
        views = safe_int(row.get("latest_view_count"))
        likes = safe_int(row.get("latest_like_count"))
        comments = safe_int(row.get("latest_comment_count"))
        result.append({
            "video_id": row["video_id"],
            "title": row["title"],
            "channel": row.get("channel_title") or "",
            "content_type": row.get("content_type") or "other",
            "published_at": row.get("published_at") or "",
            "views": views,
            "likes": likes,
            "comments": comments,
            "engagement_rate": round((likes + comments) / views, 5) if views else 0,
            "heat_score": safe_float(row.get("heat_score")),
            "tmdb": {
                "id": row.get("tmdb_id"),
                "title": row.get("tmdb_title"),
                "media_type": row.get("media_type"),
                "popularity": safe_float(row.get("tmdb_popularity")),
                "vote_average": safe_float(row.get("tmdb_vote_average")),
                "genres": row.get("tmdb_genres"),
            } if row.get("tmdb_id") else None,
        })
    return result


def _rule_fallback(evidence: list[dict[str, Any]], objective: str) -> dict[str, Any]:
    leader = evidence[0]
    ip_title = (leader.get("tmdb") or {}).get("title") or leader["title"]
    facts = [
        {"video_id": item["video_id"], "fact": f"{item['channel']}视频《{item['title']}》播放{item['views']:,}，互动率{item['engagement_rate']:.2%}"}
        for item in evidence
    ]
    return {
        "topic_direction": f"围绕《{ip_title}》的高互动节点承接热点",
        "business_goal": objective,
        "target_audience": "关注海外影视、演员与剧集热点的年轻用户",
        "content_format": "竖屏解说或角色/场景混剪",
        "suggested_duration": "30～45秒",
        "core_insight": "候选内容同时出现较高热度与互动信号，适合优先复盘标题钩子和粉丝讨论点。",
        "title_options": [f"《{ip_title}》为什么又火了？", f"看懂《{ip_title}》这轮海外热度", f"从竞品数据看《{ip_title}》的内容机会"],
        "tag_suggestions": [f"#{ip_title}", "#影视推荐", "#海外影视", "#追剧指南"],
        "publishing_advice": "优先在新物料发布后的24小时内跟进；具体发布时间需结合目标地区账号历史数据验证。",
        "opening_hook": f"同一影视话题下，为什么这条内容能获得{leader['views']:,}次播放？",
        "content_outline": ["用数据指出异常表现", "交代影视IP和内容节点", "拆解标题与互动触发点", "给出可执行的跟进方式"],
        "evidence": facts,
        "operational_hypotheses": ["高互动可能来自粉丝纪念节点、演员话题或强情绪标题，需要结合评论进一步验证。"],
        "risks": ["当前未接入地区热度和完整评论语义，不能将相关性直接解释为因果。", "使用影视片段前需要确认素材版权。"],
        "confidence": 0.62 if len(evidence) >= 3 else 0.48,
        "data_gaps": ["缺少地区分布", "缺少分享次数", "评论主题尚未采样"],
    }


def _prompt(objective: str, evidence: list[dict[str, Any]]) -> str:
    return json.dumps({"objective": objective, "candidates": evidence, "output_schema": BRIEF_SCHEMA}, ensure_ascii=False)


SYSTEM_PROMPT = """你是海外影视内容运营策略分析师。只能使用输入JSON中的事实，不得虚构指标、地区趋势或用户观点。
输出必须是合法JSON并包含给定schema的全部字段。可验证事实放入evidence，解释与建议放入operational_hypotheses。
数据不足必须写入data_gaps并降低confidence。输出中文、简洁、可执行，标题不得承诺证据无法支持的结论。"""


def _deepseek_brief(evidence: list[dict[str, Any]], objective: str, model: str, timeout: float) -> dict[str, Any]:
    import httpx
    from openai import OpenAI
    proxy = os.getenv("API_PROXY", "").strip() or None
    client = OpenAI(
        api_key=os.environ["DEEPSEEK_API_KEY"],
        base_url="https://api.deepseek.com",
        timeout=timeout,
        http_client=httpx.Client(proxy=proxy, timeout=timeout) if proxy else None,
    )
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": _prompt(objective, evidence)}],
        response_format={"type": "json_object"},
        max_tokens=3000,
        stream=False,
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("DeepSeek返回空内容")
    return json.loads(content)


def _openai_brief(evidence: list[dict[str, Any]], objective: str, model: str, timeout: float) -> dict[str, Any]:
    import httpx
    from openai import OpenAI
    proxy = os.getenv("API_PROXY", "").strip() or None
    client = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        timeout=timeout,
        http_client=httpx.Client(proxy=proxy, timeout=timeout) if proxy else None,
    )
    response = client.responses.create(
        model=model,
        instructions=SYSTEM_PROMPT,
        input=_prompt(objective, evidence),
        text={"format": {"type": "json_schema", "name": "content_brief", "strict": True, "schema": BRIEF_SCHEMA}},
    )
    return json.loads(response.output_text)


def _gemini_brief(evidence: list[dict[str, Any]], objective: str, model: str, timeout: float) -> dict[str, Any]:
    import requests
    proxy = os.getenv("API_PROXY", "").strip()
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"], "Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": SYSTEM_PROMPT + "\n\n" + _prompt(objective, evidence)}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        },
        timeout=timeout,
        proxies={"http": proxy, "https": proxy} if proxy else None,
    )
    response.raise_for_status()
    return json.loads(response.json()["candidates"][0]["content"]["parts"][0]["text"])


def _normalize_brief(brief: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    normalized = {**fallback, **(brief or {})}
    for key in ("title_options", "tag_suggestions", "content_outline", "evidence", "operational_hypotheses", "risks", "data_gaps"):
        if not isinstance(normalized.get(key), list):
            normalized[key] = fallback[key]
    normalized["title_options"] = normalized["title_options"][:3]
    while len(normalized["title_options"]) < 3:
        normalized["title_options"].append(fallback["title_options"][len(normalized["title_options"])])
    normalized["confidence"] = max(0.0, min(safe_float(normalized.get("confidence")), 1.0))
    return normalized


def generate_brief(video_ids: list[str] | None = None, objective: str = "提升影视内容曝光与互动") -> dict[str, Any]:
    load_env_file()
    max_candidates = max(1, min(safe_int(os.getenv("AI_MAX_CANDIDATES", "5")), 5))
    rows = _candidate_rows(video_ids or [], max_candidates)
    if not rows:
        raise ValueError("数据库中没有可用于生成选题的候选视频")
    evidence = _evidence(rows)
    fallback = _rule_fallback(evidence, objective)
    providers = [
        ("deepseek", "deepseek", os.getenv("DEEPSEEK_MODEL", "deepseek-chat"), "DEEPSEEK_API_KEY", _deepseek_brief),
        ("gemini", "google", os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"), "GEMINI_API_KEY", _gemini_brief),
        ("openai", "openai", os.getenv("OPENAI_MODEL", "gpt-5-mini"), "OPENAI_API_KEY", _openai_brief),
    ]
    timeout = max(10.0, safe_float(os.getenv("AI_TIMEOUT_SECONDS", "60")))
    brief: dict[str, Any] | None = None
    generation_mode, provider, model = "rule_fallback", "local_rules", providers[0][2]
    errors: list[str] = []
    for mode, provider_name, model_name, env_name, generator in providers:
        if brief is not None or not os.getenv(env_name, "").strip():
            continue
        try:
            brief = generator(evidence, objective, model_name, timeout)
            generation_mode, provider, model = mode, provider_name, model_name
        except Exception as error:
            errors.append(f"{mode} {type(error).__name__}: {error}")
            logger.warning("%s生成失败，尝试下一个提供方：%s", mode, errors[-1])
    normalized = _normalize_brief(brief or fallback, fallback)
    record = {
        "brief_id": uuid.uuid4().hex,
        "created_at": utc_now(),
        "provider": provider,
        "model": model,
        "generation_mode": generation_mode,
        "status": "success",
        "objective": objective,
        "source_video_ids": [item["video_id"] for item in evidence],
        "evidence": evidence,
        "brief": normalized,
        "error_message": " | ".join(errors)[:1000],
    }
    save_brief(record)
    return record

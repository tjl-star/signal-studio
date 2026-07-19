"""Explainable content-type classification for public entertainment videos."""

from __future__ import annotations

import re
from typing import Any


CONTENT_TYPES = {
    "trailer": "预告",
    "clip": "正片片段",
    "behind_the_scenes": "幕后花絮",
    "interview": "采访",
    "announcement": "官宣资讯",
    "short": "短视频",
    "other": "其他",
}

RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("behind_the_scenes", ("behind the scenes", "behind-the-scenes", "bts", "making of", "blooper", "花絮", "幕后")),
    ("interview", ("interview", "cast reacts", "cast answer", "q&a", "访谈", "采访")),
    ("trailer", ("official trailer", "trailer", "teaser", "预告", "先导")),
    ("announcement", ("announcement", "release date", "coming soon", "premiere", "renewed", "官宣", "定档", "上线")),
    ("clip", ("official clip", "exclusive clip", "scene", "opening", "first look", "片段", "名场面")),
)


def duration_seconds(value: Any) -> int:
    """Convert a small ISO-8601 duration subset (PT#H#M#S) to seconds."""
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", str(value or "").upper())
    if not match:
        return 0
    hours, minutes, seconds = (int(part or 0) for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def classify_content(row: dict[str, Any]) -> dict[str, Any]:
    """Return a deterministic label, rule identifier and confidence score."""
    text = " ".join(
        str(row.get(key) or "") for key in ("title", "description", "tags")
    ).casefold()
    for content_type, keywords in RULES:
        matched = next((keyword for keyword in keywords if keyword.casefold() in text), "")
        if matched:
            return {
                "content_type": content_type,
                "content_type_label": CONTENT_TYPES[content_type],
                "classification_method": f"keyword:{matched}",
                "classification_confidence": 0.9,
            }
    seconds = duration_seconds(row.get("duration"))
    if 0 < seconds <= 60:
        return {
            "content_type": "short",
            "content_type_label": CONTENT_TYPES["short"],
            "classification_method": "duration:<=60s",
            "classification_confidence": 0.78,
        }
    return {
        "content_type": "other",
        "content_type_label": CONTENT_TYPES["other"],
        "classification_method": "rule:no_match",
        "classification_confidence": 0.4,
    }

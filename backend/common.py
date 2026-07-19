"""Shared helpers for the content-operations pipeline."""

from __future__ import annotations

import csv
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
LOG_PATH = ROOT / "logs" / "run.log"


def setup_logging(name: str) -> logging.Logger:
    """Create a terminal + UTF-8 file logger without duplicate handlers."""
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    for handler in logger.handlers[:]:
        handler.close()
        logger.removeHandler(handler)
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    file_handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(console)
    logger.addHandler(file_handler)
    return logger


def load_env_file() -> None:
    """Load simple KEY=VALUE pairs without logging or returning secret values."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require_env(name: str) -> str:
    load_env_file()
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"缺少 {name}。请在环境变量或项目根目录 .env 中配置。")
    return value


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S_%fZ")


def save_raw_json(source: str, records: list[dict[str, Any]], metadata: dict[str, Any]) -> Path:
    target_dir = DATA_DIR / "raw" / source
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / f"{source}_{timestamp()}.json"
    document = {
        "code": 0,
        "message": "success",
        "data": {
            "source": source,
            "fetched_at": utc_now(),
            "metadata": metadata,
            "responses": records,
        },
    }
    with path.open("x", encoding="utf-8") as file:
        json.dump(document, file, ensure_ascii=False, indent=2)
    return path


def write_csv(path: Path, rows: Iterable[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def safe_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def safe_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0

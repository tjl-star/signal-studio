"""Fail when the built frontend contains local secrets or absolute Windows paths."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from common import ROOT, load_env_file


def main() -> int:
    dist = ROOT / "dashboard_web" / "dist"
    if not dist.exists():
        print("未找到 dashboard_web/dist，请先运行 npm run build。")
        return 1
    load_env_file()
    import os
    secrets = [os.getenv(name, "").strip() for name in ("YOUTUBE_API_KEY", "TMDB_API_KEY")]
    secrets = [value for value in secrets if len(value) >= 8]
    findings = []
    for path in dist.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if any(secret in text for secret in secrets):
            findings.append(f"{path}: 包含已配置的 API Key")
        if re.search(r"[A-Za-z]:\\Users\\", text, flags=re.IGNORECASE):
            findings.append(f"{path}: 包含本地绝对路径")
        if re.search(r"(?:cookie|bearer|token)\s*[:=]\s*['\"][^'\"]{8,}", text, flags=re.IGNORECASE):
            findings.append(f"{path}: 包含疑似 Cookie/Token")
    if findings:
        print("前端安全检查失败：")
        print("\n".join(findings))
        return 1
    print("前端安全检查通过：未发现 API Key、Cookie、Token 或本地绝对路径。")
    return 0


if __name__ == "__main__":
    sys.exit(main())

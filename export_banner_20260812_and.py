import importlib.util
import json
from pathlib import Path


PROVIDER = Path(r"C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py")
OUTPUT = Path(__file__).parent / "dashboard-v2" / "data" / "banner_click_20260812_and.json"

spec = importlib.util.spec_from_file_location("data_provider", PROVIDER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

rows = module.query(
    "bannerClickData",
    {"startDate": "2026-08-12", "endDate": "2026-08-12", "clienttype": "and"},
)

payload = {
    "manifest": {
        "source": "data-provider /skill/bannerClickData",
        "date": "2026-08-12",
        "clienttype": "and",
        "scope": "all Banner titles and positions; no title filter",
        "row_count": len(rows),
        "field_mapping": {
            "exposure_uv": "uv_expose_count",
            "click_uv": "uv_click_count",
            "exposure_pv": "vv_expose_count",
            "click_pv": "vv_click_count",
            "ctr_uv": "ctr_uv",
            "ctr_pv": "ctr_pv",
        },
    },
    "rows": rows,
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"写入 {OUTPUT}，共 {len(rows)} 条")

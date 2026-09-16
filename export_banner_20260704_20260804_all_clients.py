import importlib.util
import json
from pathlib import Path


PROVIDER = Path(r"C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py")
OUTPUT = Path(__file__).parent / "dashboard-v2" / "data" / "banner_click_20260704_20260804_all_clients.json"

spec = importlib.util.spec_from_file_location("data_provider", PROVIDER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

rows_by_client = {}
for client in ("and", "ios", "web"):
    rows_by_client[client] = module.query(
        "bannerClickData",
        {"startDate": "2026-07-04", "endDate": "2026-08-04", "clienttype": client},
    )

rows = [row for client_rows in rows_by_client.values() for row in client_rows]
payload = {
    "manifest": {
        "source": "data-provider /skill/bannerClickData",
        "start_date": "2026-07-04",
        "end_date": "2026-08-04",
        "date_inclusive": True,
        "clients": ["and", "ios", "web"],
        "scope": "all Banner titles and positions; no title filter",
        "row_count_by_client": {client: len(client_rows) for client, client_rows in rows_by_client.items()},
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
print(json.dumps(payload["manifest"], ensure_ascii=False))

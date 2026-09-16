import json

for date in ("20260805", "20260804"):
    with open(f"season_{date}.json", encoding="utf-8-sig") as f:
        rows = json.load(f)
    top = sorted(rows, key=lambda x: x.get("search_rank", 10**9))[:30]
    print(json.dumps(top, ensure_ascii=False, separators=(",", ":")))

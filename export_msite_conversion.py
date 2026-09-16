import csv, json, os
from datetime import date, timedelta

raw = open('msite_conversion.json', 'rb').read()
enc = 'utf-16' if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig'
data = {row['date']: row for row in json.loads(raw.decode(enc))}
start, end = date(2026, 7, 4), date(2026, 8, 4)
rows = []
cur = start
while cur <= end:
    d = cur.isoformat()
    row = data.get(d)
    rows.append([d, row['search_total_conversion_rate'] if row else '无数据'])
    cur += timedelta(days=1)

out_dir = r'C:\Users\tjldq\Desktop\搜索'
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, '2026年7月4日至8月4日_M站首帧播放UV整体转化率.csv')
with open(path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['日期', '首帧播放UV整体转化率'])
    for d, value in rows:
        w.writerow([d, value if isinstance(value, str) else f'{value:.4%}'])
print(path)
print(f'有数据日期: {sum(1 for _, v in rows if v != "无数据")}, 总日期: {len(rows)}')

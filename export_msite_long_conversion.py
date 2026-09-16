import csv, json, os
from datetime import date, timedelta

raw = open('msite_conversion_5min_check.json', 'rb').read()
enc = 'utf-16' if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig'
data = {row['date']: row for row in json.loads(raw.decode(enc))}
start, end = date(2026, 7, 4), date(2026, 8, 4)
out_dir = r'C:\Users\tjldq\Desktop\搜索'
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, '2026年7月4日至8月4日_M站搜索长视频转化率.csv')
with open(path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['日期', '搜索长视频转化率', '口径说明'])
    cur = start
    while cur <= end:
        d = cur.isoformat()
        row = data.get(d)
        value = f"{row['search_long_video_conversion_rate']:.4%}" if row else '无数据'
        w.writerow([d, value, '数据源原始字段；未明确等同于播放5分钟整体转化率'])
        cur += timedelta(days=1)
print(path)
print(f'有数据日期: {sum(1 for d in data if start.isoformat() <= d <= end.isoformat())}, 总日期: 32')

import csv, json, os

def load(path):
    raw = open(path, 'rb').read()
    enc = 'utf-16' if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig'
    return json.loads(raw.decode(enc))

days = {'20260804': load('season_20260804_full.json'), '20260805': load('season_20260805.json')}
by_day_id = {}
for day, rows in days.items():
    by_day_id[day] = {(r.get('season_id') or ''): r for r in rows if r.get('season_id')}

fields = ['日期','搜索排名','系列名/剧名','系列ID/季ID','搜索次数','搜索设备UV','昨日搜索次数','搜索次数昨日环比百分比','昨日搜索排名','排名较昨日变化','内容类型','题材标签','新老设备属性','新设备搜索次数','新设备搜索UV','老设备搜索次数','老设备搜索UV']
out = []
for day in ('20260804','20260805'):
    prev = '20260803' if day == '20260804' else '20260804'
    prev_index = by_day_id.get(prev, {})
    rows = sorted(days[day], key=lambda r: r.get('search_rank', 10**9))[:30]
    for r in rows:
        sid = r.get('season_id') or ''
        p = prev_index.get(sid)
        prev_cnt = p.get('search_cnt') if p else '不支持（昨日无同一季ID数据）'
        prev_rank = p.get('search_rank') if p else '不支持（昨日无同一季ID数据）'
        if p and p.get('search_cnt'):
            rate = round((r.get('search_cnt', 0) - p['search_cnt']) / p['search_cnt'], 6)
            rank_change = p.get('search_rank') - r.get('search_rank')
        else:
            rate = '不支持（昨日无同一季ID数据）'
            rank_change = '不支持（昨日无同一季ID数据）'
        out.append([day, r.get('search_rank'), r.get('series_name'), sid, r.get('search_cnt'), r.get('search_uv'), prev_cnt, rate, prev_rank, rank_change, '不支持（无关联内容类型字段）', '不支持（无关联题材标签字段）', '不支持（无新老设备维度接口）', '不支持（无新老设备维度接口）', '不支持（无新老设备维度接口）', '不支持（无新老设备维度接口）', '不支持（无新老设备维度接口）'])

out_dir = r'C:\Users\tjldq\Desktop\搜索'
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, '最近两天热搜剧集季维度Top30_字段补齐结果.csv')
with open(path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(fields); w.writerows(out)
print(path, len(out))

import sys
from pathlib import Path
sys.path.insert(0,'dashboard-v2')
import update_daily_data as u
folder=Path('output/refresh_20260910')
for filename,rawfile in [('热搜总榜_20260704_20260804.json','1_seasonSearchAuthInfo.json'),('新用户热搜_词频_20260704_20260804.json','3_seasonSearchAuthInfo.json')]:
 raw=u.load_json(folder/rawfile)['response']; raw=sorted(raw,key=lambda r:int(r.get('search_rank') or 999999))[:31]
 saved=[r for r in u.rows_from(u.load_json(u.DATA_DIR/filename)) if u.row_date(r)=='2026-09-08']
 assert len(saved)==31
 for r,o in zip(saved,raw):
  assert r['search_uv']==o['search_uv'] and r['search_vv']==o['search_cnt'] and r['rank']==o['search_rank']
  assert u.row_date(o)==r['date'] and r['source']
report=u.load_json(folder/'report.json');report['validation']='62 saved rows matched raw search_uv/search_cnt and ds; all passed';report['blocked']['searchHot_20260909']='seasonSearchAuthInfo returned empty for all devices and new_or_old=new';u.atomic_write(folder/'report.json',report);print(report['validation'])

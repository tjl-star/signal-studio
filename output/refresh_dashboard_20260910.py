import sys,json,os,urllib.request,urllib.parse,datetime
from pathlib import Path
sys.path.insert(0,'dashboard-v2')
import update_daily_data as u
out=Path('output/refresh_20260910');out.mkdir(parents=True,exist_ok=True)
audit=[]
def query(endpoint,params=None):
    params={k:v for k,v in (params or {}).items() if v not in (None,'')}
    url=u.data_provider.BASE_URL+'/skill/'+endpoint+'?'+urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url,timeout=30) as response: payload=json.load(response)
    except Exception as e: raise ValueError(endpoint+' request failed: '+type(e).__name__)
    rows=u.rows_from(payload)
    target=params.get('startDate') or params.get('date')
    if target and len(target)==8: target=target[:4]+'-'+target[4:6]+'-'+target[6:]
    dates=sorted({u.row_date(r) for r in rows if u.row_date(r)})
    if dates and dates != [target]: raise ValueError(endpoint+' date mismatch')
    if not rows: raise ValueError(endpoint+' empty data')
    entry={'endpoint':endpoint,'params':params,'data_date':target,'response_dates':dates,'fields':sorted(rows[0]),'rows':len(rows)}
    audit.append(entry)
    u.atomic_write(out/(str(len(audit))+'_'+endpoint+'.json'),{'provenance':entry,'response':payload})
    return payload
u.data_provider.query=query
results=[]
for name,fn in [('searchHot',u.update_search_hot),('newSearchHot',u.update_new_search_hot)]:
    try: results.append(fn('2026-09-08','2026-09-08',True))
    except Exception as e: results.append({'module':name,'status':'pending','error':str(e)})
report={'generated_at':datetime.datetime.now().astimezone().isoformat(),'target_date':'2026-09-09','modules':results,'queries':audit,'coverage':u.coverage_report('2026-09-08','2026-09-09'),'blocked':{'overviewCore':'DATA_PROVIDER_CORE_PASSWORD missing','QuickBI':'MCP not connected'}}
u.atomic_write(out/'report.json',report)
print(json.dumps(report,ensure_ascii=False))


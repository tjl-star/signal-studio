import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dailyDir=path.join(root,'dashboard-v2','data','season_play_daily');
const titleMapPath=path.join(root,'dashboard-v2','data','season_title_map.json');
const dayCache=new Map();
let titleMapPromise;
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const day=async date=>{if(!dayCache.has(date))dayCache.set(date,json(path.join(dailyDir,`${date}.json`)).then(x=>x?.rows||[]).catch(()=>[]));return dayCache.get(date)};
const dates=(start,end)=>{const out=[],cursor=new Date(`${start}T00:00:00`),last=new Date(`${end}T00:00:00`);if(Number.isNaN(cursor.getTime())||Number.isNaN(last.getTime())||cursor>last||((last-cursor)/86400000)>92)throw Error('日期范围无效或超过93天');for(;cursor<=last;cursor.setDate(cursor.getDate()+1))out.push(cursor.toISOString().slice(0,10));return out};
const previousDates=(start,length)=>{const end=new Date(`${start}T00:00:00`);end.setDate(end.getDate()-1);const begin=new Date(end);begin.setDate(begin.getDate()-length+1);return dates(begin.toISOString().slice(0,10),end.toISOString().slice(0,10))};
async function titles(){if(!titleMapPromise)titleMapPromise=json(titleMapPath).then(rows=>new Map(rows.map(row=>[String(row.season_id),row.title||'--']))).catch(()=>new Map());return titleMapPromise}
async function aggregate(dayList){
  const map=new Map(),titleMap=await titles();
  for(const date of dayList){
    const daily=new Map();
    for(const row of await day(date)){const id=String(row.season_id||'').trim();if(!id)continue;const old=daily.get(id);if(!old||((Number(row.play_count)||0)>(Number(old.play_count)||0)))daily.set(id,row)}
    for(const row of daily.values()){const id=String(row.season_id).trim(),out=map.get(id)||{season_id:id,title:titleMap.get(id)||row.title||'--',season_type:row.season_type,season_classify:row.season_classify,plot_type:row.plot_type,producer_region:row.producer_region,play_count:0,play_uv:0};out.play_count+=Number(row.play_count)||0;out.play_uv+=Number(row.play_uv)||0;map.set(id,out)}
  }
  return [...map.values()].sort((a,b)=>(b.play_count||0)-(a.play_count||0)).slice(0,30);
}
const send=(res,status,payload)=>{const body=JSON.stringify(payload);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});res.end(body)};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url||'','http://localhost'),start=url.searchParams.get('start'),end=url.searchParams.get('end'),type=url.searchParams.get('type')||'总榜';if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS'});return res.end()}if(url.pathname!=='/api/hot-ranking')return send(res,404,{code:404,message:'not found'});if(type!=='总榜')return send(res,400,{code:400,message:'新用户榜仍使用单日快照'});const selected=dates(start,end),prior=previousDates(start,selected.length),rows=await aggregate(selected),previous_ids=(await aggregate(prior)).map(row=>String(row.season_id||'').trim()).filter(Boolean);send(res,200,{code:0,message:'success',data:{start,end,rows,previous_ids}})}catch(error){send(res,400,{code:400,message:error.message||'query failed'})}});
server.listen(8010,'0.0.0.0',()=>console.log('hot ranking API listening on 0.0.0.0:8010'));

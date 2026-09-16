const DATA={
  daily:'data/new_people_video_daily_active.json', dau:'data/new_people_video_device_dau_by_client_20260705_20260804.json', playRate:'data/播放率_近30天_按客户端.json', duration:'data/人均播放时长_近30天_按客户端.json', playCount:'data/avg_play_count_by_client.json',
  searchUse:'data/搜索使用率_按客户端_20260706_20260804.json', firstFrame:'data/首帧播放UV整体转化率_20260706_20260804.json', fiveMin:'data/播放5分钟UV整体转化率_20260706_20260804.json', newSearch:'data/新用户搜索使用率_20260706_20260804.json', oldSearch:'data/老用户搜索使用率_20260706_20260804.json', hotSearch:'data/热搜Top30_20260706_20260804.json', ranking:'data/站内播放排名Top30_20260706_20260804.json?v=20260825-playuv-top30',
  traffic:'data/home_funnel_requested_fields.json', trafficChannelFunnel:'data/%E9%A6%96%E9%A1%B5%E6%B5%81%E9%87%8F%E4%B8%8E%E8%BD%AC%E5%8C%96%E6%BC%8F%E6%96%97_20260705_20260804.json', channelOps:'data/%E9%A2%91%E9%81%93%E8%BF%90%E8%90%A5%E5%88%86%E6%9E%90_dramaConversion_android_rrsp_xb_20260705_20260804.json', trafficDetail:'data/home_channel_traffic_detail.json', sections:'data/home_sections_risk_detail.json?v=20260821-client-risk-scope', banners:'data/banner_click_detail.json', bannerClick:'data/banner_click_20260704_20260804_all_clients.json', guess:'data/guess_you_like_home_data.json', guessPv:'data/guess_you_like_pv_home_data.json', guessExposure:'data/guess_you_like_home_exposure_conversion.json', genreRatio:'data/%E5%89%A7%E7%A7%8D%E6%92%AD%E6%94%BE%E5%8D%A0%E6%AF%94_%E5%85%A8%E9%83%A8%E7%AB%AF%E5%8F%A3_20260705_20260804.json'
};

if(false){
// Tab2 list selector: switch between the source ranking categories without reshaping records.
const renderRankingWithListType=renderRanking;
renderRanking=function(){
  renderRankingWithListType();
  const analysis=$('.content-analysis');if(!analysis)return;
  const head=analysis.querySelector('.panel-head');
  const tabs=document.createElement('div');tabs.className='content-list-tabs';tabs.innerHTML='<button type="button" class="content-list-tab active" data-list-type="总榜">总榜</button><button type="button" class="content-list-tab" data-list-type="新用户榜">新用户榜</button>';
  head?.appendChild(tabs);
  let listType='总榜';
  const source=()=>filterDate(state.data.ranking).filter(r=>r['榜单分类']===listType);
  const dateFilter=$('#content-date-filter');
  const draw=()=>{
    const all=source(),dates=[...new Set(all.map(r=>String(r['日期']||'')))].filter(Boolean).sort(),date=dateFilter?.value||dates.at(-1)||'';
    const rows=all.filter(r=>String(r['日期'])===date).sort((a,b)=>Number(a['排名'])-Number(b['排名'])),top10=rows.slice(0,10);
    if(dateFilter){dateFilter.innerHTML=dates.slice().reverse().map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');dateFilter.value=dates.includes(date)?date:dates.at(-1)||''}
    setText('content-top10-date',date?`${date} · ${listType} Top10`:'暂无可用日期');
    const chart=$('#ranking-chart');if(window.echarts&&chart){const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.setOption({animation:false,grid:{left:150,right:40,top:16,bottom:24,containLabel:true},tooltip:{trigger:'item',formatter:p=>{const r=top10[p.dataIndex];return `<b>${esc(r?.['内容名称'])}</b><br/>排名：${esc(r?.['排名'])}<br/>播放VV：${fmt(r?.['播放VV'])}<br/>日期：${esc(r?.['日期']||'--')}<br/>分类：${esc(r?.['内容分类']||'--')}`}},xAxis:{type:'value',axisLabel:{color:'#8090a4',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#e6edf5'}}},yAxis:{type:'category',data:top10.slice().reverse().map(r=>String(r['内容名称']||'--')),axisLabel:{color:'#455b77',width:130,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:28,data:top10.slice().reverse().map((r,i)=>({value:Number(r['播放VV'])||0,itemStyle:{color:i<3?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>fmt(p.value)}}]});c.resize()}
    const table=$('#ranking-table');if(table){const activeSort=document.querySelector('.content-sort.active')?.dataset.sort||'rank';let display=[...rows];if(activeSort==='vv')display.sort((a,b)=>(Number(b['播放VV'])||0)-(Number(a['播放VV'])||0));if(activeSort==='change'){const n=r=>{const m=String(r['昨日环比']||'').match(/-?[\d.]+/);return m?Number(m[0]):-Infinity};display.sort((a,b)=>n(b)-n(a))}table.innerHTML=display.map(r=>{const rank=Number(r['排名']),change=String(r['昨日环比']||''),cls=change.startsWith('↑')?'is-up':change.startsWith('↓')?'is-down':'';return `<tr><td><span class="rank-badge rank-${rank<=3?rank:'other'}">${esc(r['排名'])}</span></td><td class="content-name">${esc(r['内容名称'])}</td><td>${esc(r['播放UV'])}</td><td class="vv-value">${fmt(r['播放VV'])}</td><td class="change-value ${cls}">${esc(change)}</td><td>${esc(r['聚集类型'])}</td><td>${esc(r['内容分类'])}</td><td>${esc(r['题材标签'])}</td><td>${esc(r['榜单状态'])}</td><td>${esc(r['数据状态'])}</td></tr>`}).join('')||'<tr><td colspan="10" class="empty">暂无真实记录</td></tr>'}
  };
  tabs.querySelectorAll('.content-list-tab').forEach(btn=>btn.addEventListener('click',()=>{listType=btn.dataset.listType;tabs.querySelectorAll('.content-list-tab').forEach(x=>x.classList.toggle('active',x===btn));draw()}));
  dateFilter?.addEventListener('change',draw);$$('.content-sort').forEach(btn=>btn.addEventListener('click',()=>setTimeout(draw,0)));draw();
};
}
const DATA_PATHS={
  daily:'data/new_people_video_daily_active.json?v=20260830-data-refresh-1',dau:'data/new_people_video_device_dau_by_client_20260705_20260804.json',playRate:'data/%E6%92%AD%E6%94%BE%E7%8E%87_%E8%BF%9130%E5%A4%A9_%E6%8C%89%E5%AE%A2%E6%88%B7%E7%AB%AF.json',duration:'data/%E4%BA%BA%E5%9D%87%E6%92%AD%E6%94%BE%E6%97%B6%E9%95%BF_%E8%BF%9130%E5%A4%A9_%E6%8C%89%E5%AE%A2%E6%88%B7%E7%AB%AF.json?v=20260830-data-refresh-1',playCount:'data/avg_play_count_by_client.json?v=20260830-data-refresh-1',
  searchUse:'data/%E6%90%9C%E7%B4%A2%E4%BD%BF%E7%94%A8%E7%8E%87_%E5%85%A8%E9%83%A8%E7%AB%AF%E5%8F%A3_20260706_20260804.json',firstFrame:'data/%E9%A6%96%E5%B8%A7%E6%92%AD%E6%94%BEUV%E6%95%B4%E4%BD%93%E8%BD%AC%E5%8C%96%E7%8E%87_20260706_20260804.json',fiveMin:'data/%E6%92%AD%E6%94%BE5%E5%88%86%E9%92%9FUV%E6%95%B4%E4%BD%93%E8%BD%AC%E5%8C%96%E7%8E%87_20260706_20260804.json',newSearch:'data/%E6%96%B0%E7%94%A8%E6%88%B7%E6%90%9C%E7%B4%A2%E4%BD%BF%E7%94%A8%E7%8E%87_20260706_20260804.json',oldSearch:'data/%E8%80%81%E7%94%A8%E6%88%B7%E6%90%9C%E7%B4%A2%E4%BD%BF%E7%94%A8%E7%8E%87_20260706_20260804.json',hotSearch:'data/%E7%83%AD%E6%90%9CTop30_20260706_20260804.json',ranking:'data/%E7%AB%99%E5%86%85%E6%92%AD%E6%94%BE%E6%8E%92%E5%90%8DTop30_20260706_20260804.json?v=20260825-playuv-top30',trafficChannelFunnel:'data/%E9%A6%96%E9%A1%B5%E6%B5%81%E9%87%8F%E4%B8%8E%E8%BD%AC%E5%8C%96%E6%BC%8F%E6%96%97_20260705_20260804.json',channelOps:'data/%E9%A2%91%E9%81%93%E8%BF%90%E8%90%A5%E5%88%86%E6%9E%90_dramaConversion_android_rrsp_xb_20260705_20260804.json',
  playRateAll:'data/%E6%92%AD%E6%94%BE%E7%8E%87_%E8%BF%9130%E5%A4%A9.json',durationAll:'data/%E4%BA%BA%E5%9D%87%E6%92%AD%E6%94%BE%E6%97%B6%E9%95%BF_%E8%BF%9130%E5%A4%A9_%E5%85%A8%E9%83%A8%E7%AB%AF%E5%8F%A3.json',duration7:'data/%E4%BA%BA%E5%9D%87%E6%92%AD%E6%94%BE%E6%97%917%E5%A4%A9.json',detailPlay5:'data/%E5%BD%B1%E8%A7%86%E8%AF%A6%E6%83%85%E9%A1%B5%E6%92%AD%E6%94%BE5%E5%88%86%E9%92%9FUV%E8%BD%AC%E5%8C%96%E7%8E%87_%E8%BF%9130%E5%A4%A9.json',rankingNotes:'data/%E7%AB%99%E5%86%85%E6%92%AD%E6%94%BE%E6%8E%92%E5%90%8DTop30_20260706_20260804_%E5%8F%A3%E5%BE%84%E8%AF%B4%E6%98%8E.json',yesterdayTop10:'data/%E6%98%A8%E6%97%A5%E6%92%AD%E6%94%BETop10_20260806_%E5%8F%AF%E4%BA%A4%E4%BB%98%E6%98%8E%E7%BB%86.json',yesterdayTop20:'data/%E6%98%A8%E6%97%A5%E5%89%A7%E7%83%AD%E6%92%AD%E6%8E%92%E5%90%8DTop20_20260806.json',searchFirstExtra:'data/first_frame_play_uv_conversion_20260705_20260804.json',searchIos5:'data/play_5_mins_uv_rate_iOS_20260706_20260804.json',searchDetail5:'data/search_detail_play_5_mins_uv_rate_20260705_20260804.json',searchAllClient:'data/%E6%90%9C%E7%B4%A2%E4%BD%BF%E7%94%A8%E7%8E%87_%E5%85%A8%E9%83%A8%E7%AB%AF%E5%8F%A3_20260706_20260804.json',searchDetailExtra:'data/%E6%90%9C%E7%B4%A2%E7%BB%93%E6%9E%9C%E9%A1%B5%E5%BD%B1%E8%A7%86%E8%AF%A6%E6%83%85%E9%A1%B5%E6%92%AD%E6%94%BE5%E5%88%86%E9%92%9FUV%E8%BD%AC%E5%8C%96%E7%8E%87_20260706_20260804.json',guessTabClick:'data/guess_you_like_home_tab_click_uv_by_client_device_20260705_20260804.json'
};
DATA_PATHS.genreRatio='data/%E5%89%A7%E7%A7%8D%E6%92%AD%E6%94%BE%E5%8D%A0%E6%AF%94_%E5%85%A8%E9%83%A8%E7%AB%AF%E5%8F%A3_20260705_20260804.json?v=20260828-data-20260824-refresh-1';
DATA_PATHS.searchConversion='data/search_overall_conversion_20260701_20260825.json?v=20260907-quickbi-search-overall';
DATA_PATHS.hotKeywordDramaMap='热搜词剧名映射.json?v=20260903-mapping-3';
DATA_PATHS.hotSearch='data/%E7%83%AD%E6%90%9C%E6%80%BB%E6%A6%9C_20260704_20260804.json?v=20260828-date-range-0701-0827-2';
DATA_PATHS.newHotSearch='data/%E6%96%B0%E7%94%A8%E6%88%B7%E7%83%AD%E6%90%9C_%E8%AF%8D%E9%A2%91_20260704_20260804.json?v=20260910-hotsearch-rings-top30-1';
DATA_PATHS.sectionOps='data/home_section_ops_20260705_20260804.json?v=20260828-data-20260824-refresh-2';
DATA_PATHS.ranking='data/%E7%AB%99%E5%86%85%E6%92%AD%E6%94%BE%E6%8E%92%E5%90%8DTop30_20260706_20260804.json?v=20260828-data-20260824-refresh-1';
DATA_PATHS.channelOps='data/%E9%A2%91%E9%81%93%E8%BF%90%E8%90%A5%E5%88%86%E6%9E%90_dramaConversion_android_rrsp_xb_20260705_20260804.json?v=20260828-data-20260824-refresh-1';
DATA_PATHS.bannerClick='data/banner_click_20260704_20260804_all_clients.json?v=20260908-data-refresh-1';
DATA_PATHS.guessQuickBi='data/guess_you_like_home_quickbi_20260701_20260825.json?v=20260907-quickbi-guess';
// Removed legacy snapshots are intentionally not part of the startup load.
delete DATA.guess;delete DATA.guessPv;delete DATA.guessExposure;delete DATA_PATHS.guessTabClick;
DATA_PATHS.daily='data/new_people_video_daily_active.json?v=20260828-all-client-1';
DATA_PATHS.playCount='data/avg_play_count_by_client.json?v=20260828-all-client-1';
// Prefer the files that are actually present in the current data directory.
DATA_PATHS.playRate='data/播放率_近30天_按客户端.json?v=20260828-date-range-0701-0827-1';
DATA_PATHS.duration='data/人均播放时长_近30天_按客户端.json?v=20260828-all-client-1';
DATA_PATHS.playRateAll='data/播放率_近30天.json';
DATA_PATHS.durationAll='data/人均播放时长_近30天_全部端口.json';
DATA_PATHS.duration7='data/人均播放时长_近7天.json';
DATA_PATHS.genreRatio='data/剧种播放占比_全部端口_20260705_20260804.json?v=20260830-refresh-1';
DATA_PATHS.genreMapping='data/bl_genre_mapping.json?v=20260907-genre-display-rule-2';
DATA_PATHS.searchConversion='data/search_overall_conversion_20260701_20260825.json?v=20260907-quickbi-search-overall';
DATA_PATHS.hotSearch='data/%E7%83%AD%E6%90%9C%E6%80%BB%E6%A6%9C_20260704_20260804.json?v=20260910-hotsearch-rings-top30-1';
DATA_PATHS.sectionOps='data/home_section_ops_20260705_20260804.json?v=20260830-refresh-1';
DATA_PATHS.ranking='data/站内播放排名Top30_20260706_20260804.json?v=20260910-new-user-top30-1';
DATA_PATHS.seasonTitleMap='data/season_title_map.json?v=20260903-season-title-map-1';
DATA_PATHS.channelOps='data/频道运营分析_dramaConversion_android_rrsp_xb_20260705_20260804.json?v=20260830-refresh-1';
DATA_PATHS.popupWindow='data/popup_window_20260701_20260827_android_rrsp_xb.json?v=20260830-popup-refresh-1';
// Retired search-analysis assets were removed; do not request them during
// startup. The active search-funnel page uses only searchConversion below.
['searchUse','firstFrame','fiveMin','newSearch','oldSearch','searchFirstExtra','searchIos5','searchDetail5','searchAllClient','searchDetailExtra'].forEach(key=>{delete DATA[key];delete DATA_PATHS[key]});
const DASHBOARD_RANGE_START='2026-07-01';
// Fallback for the first paint; init() replaces this with the newest verified
// date shared by the active data modules after their snapshots load.
let DASHBOARD_RANGE_END='2026-09-10';
// Allow a shared dashboard URL to open the requested module directly.  The
// default remains the overview for existing bookmarks, while
// `?page=content` opens 热播榜单 immediately.
const requestedInitialPage=new URLSearchParams(window.location.search).get('page');
const initialPage=['insight','report','overview','content','search','genre','home','guess','sections','search-funnel','banner','popup'].includes(requestedInitialPage)?requestedInitialPage:'insight';
const state={start:DASHBOARD_RANGE_START,end:DASHBOARD_RANGE_END,client:'安卓',page:initialPage,homeTab:'traffic',data:{}};window.__dashboardState=state;
window.__openResourcePage=()=>{state.page='banner';renderPage()};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const empty='--', fmt=v=>v===null||v===undefined||v===''?empty:Number.isFinite(Number(v))?Number(v).toLocaleString('zh-CN'):String(v), pct=v=>v===null||v===undefined||v===''?empty:`${(Number(v)*100).toFixed(1)}%`, esc=v=>String(v??empty).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function maxDashboardDataDate(value){
  let max='';
  const visit=node=>{
    if(Array.isArray(node)){node.forEach(visit);return}
    if(!node||typeof node!=='object')return;
    for(const [key,item] of Object.entries(node)){
      if(['date','日期','ds','end'].includes(key)&&/^\d{4}-\d{2}-\d{2}$/.test(String(item||''))&&String(item)>max)max=String(item);
      else if(typeof item==='object')visit(item);
    }
  };
  visit(value);return max;
}
// The dashboard has several independently refreshed modules.  Use the latest
// date shared by the modules required to form a Tab1 business diagnosis.
// Board/Banner detail are optional evidence: their refresh delay must not
// pull the whole dashboard back to an older date.  They are simply omitted
// from a diagnosis when the selected date has no matching rows.
function commonDashboardDataDate(data){
  const active=['daily','duration','playCount','ranking','genreRatio','channelOps'];
  const sets=active.map(key=>{
    const list=rows(data?.[key]||[]);return new Set(list.map(r=>String(r?.date??r?.['日期']??'').slice(0,10)).filter(Boolean));
  }).filter(set=>set.size);
  if(!sets.length)return '';
  let common=[...sets[0]];for(const set of sets.slice(1))common=common.filter(date=>set.has(date));
  return common.sort().at(-1)||'';
}
function dashboardVerifiedDate(data){
  // Tab1 and its drill-downs must use the newest date shared by the
  // business modules.  A date left behind by a previous drill-down is not a
  // valid dashboard snapshot and must never win over the loaded data.
  return commonDashboardDataDate(data)||maxDashboardDataDate(data)||'';
}
function rows(value){if(Array.isArray(value))return value;if(value?.rows)return value.rows;if(value?.data)return value.data;return []}
function repairText(value){if(typeof value==='string'&&!/^[\x00-\x7f]*$/.test(value)&&/[ÃÂåæçèéêëìíîïðñòóôõö÷øùúûüýþ]/.test(value)){try{return decodeURIComponent(escape(value))}catch(_){return value}}if(Array.isArray(value))return value.map(repairText);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,repairText(v)]));return value}
const dashboardJsonCache=window.__dashboardJsonCache||(window.__dashboardJsonCache=new Map());
function dashboardDataCacheKey(path){return new URL(path,location.href).pathname}
window.__dashboardFetchJson=window.__dashboardFetchJson||function(path){
  const key=dashboardDataCacheKey(path);
  if(!dashboardJsonCache.has(key)){
    dashboardJsonCache.set(key,fetch(path).then(async response=>{
      if(!response.ok)throw Error(path);
      const text=new TextDecoder('utf-8').decode(await response.arrayBuffer()).replace(/^\uFEFF/,'');
      return JSON.parse(text);
    }).catch(error=>{dashboardJsonCache.delete(key);throw error}));
  }
  return dashboardJsonCache.get(key);
};
async function load(path){return rows(repairText(await window.__dashboardFetchJson(path)))}
function normalizeHotKeyword(value){return String(value??'').normalize('NFKC').trim().replace(/[\s\u3000]+/g,'').toLowerCase()}
const HOT_SEARCH_NON_DRAMA_TITLES=new Set(['我','爱']);
function hotDramaName(row){
  const raw=String(row?.title??row?.['搜索词']??'').trim();
  if(!raw)return '--';
  const mappings=rows(state.data.hotKeywordDramaMap||[]);
  const mapped=mappings.find(item=>String(item.normalized_keyword||normalizeHotKeyword(item.keyword))===normalizeHotKeyword(raw)&&String(item.status||'active')!=='inactive');
  const hasContentEvidence=Boolean(String(row?.season_id??'').trim()||String(row?.content_type??'').trim()||String(row?.producer_region??'').trim()||String(row?.genre??'').trim()||String(row?.topic_tag??'').trim());
  if(HOT_SEARCH_NON_DRAMA_TITLES.has(raw)&&!hasContentEvidence)return '--';
  return mapped?.drama_name|| (hasContentEvidence?raw:'--');
}
function rowDate(r){return r.date??r['日期']??r['鏃ユ湡']??''}
function filterDate(list){return list.filter(r=>(!state.start||String(rowDate(r))>=state.start)&&(!state.end||String(rowDate(r))<=state.end))}
function latest(list){return [...list].sort((a,b)=>String(rowDate(a)).localeCompare(String(rowDate(b)))).at(-1)}
function clientRows(list){return filterDate(list).filter(r=>!r.client||r.client===state.client||r.client_type===state.client||r.clienttype===state.client||r.clienttype_raw===state.client)}
/* Install the chart motion wrapper before init() can render the first page.
   This keeps the presentation layer active even when the data requests finish
   very quickly, while leaving all chart data and business options untouched. */
if(window.echarts&&!window.echarts.__dashboardSmoothPatch){
  window.echarts.__dashboardSmoothPatch=true;
  const dashboardChartDecorate=chart=>{
    if(!chart||chart.__dashboardSmoothPatch)return chart;
    chart.__dashboardSmoothPatch=true;chart.__dashboardMotionRendered=false;
    const originalSetOption=chart.setOption.bind(chart);
    chart.setOption=(option,...args)=>{
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const first=!chart.__dashboardMotionRendered;chart.__dashboardMotionRendered=true;
      const dom=chart.getDom?.();
      if(first&&dom&&!reduced){dom.classList.add('dashboard-chart-enter');requestAnimationFrame(()=>dom.classList.remove('dashboard-chart-enter'))}
      return originalSetOption({...option,animation:reduced?false:true,animationThreshold:option?.animationThreshold??0,animationDuration:option?.animationDuration??(first?520:360),animationDurationUpdate:option?.animationDurationUpdate??360,animationEasing:option?.animationEasing??'cubicOut',animationEasingUpdate:option?.animationEasingUpdate??'cubicInOut',animationDelay:option?.animationDelay??(first?(index=>Math.min(index*16,220)):0),animationDelayUpdate:option?.animationDelayUpdate??(index=>Math.min(index*10,120))},...args);
    };
    return chart;
  };
  const chartInitEarly=window.echarts.init.bind(window.echarts),chartGetEarly=window.echarts.getInstanceByDom.bind(window.echarts);
  window.echarts.init=(...args)=>dashboardChartDecorate(chartInitEarly(...args));
  window.echarts.getInstanceByDom=element=>dashboardChartDecorate(chartGetEarly(element));
}
function setText(id,value){const el=$(id);const display=id==='overview-client'?($('#client-filter .active')?.dataset.client||value):value;if(el)el.textContent=display;if(id==='overview-client'){const select=$('#overview-client-select');if(select&&select.value!==display)select.value=display}}
function card(label,value,sub,delta){return `<article class="kpi-card"><label>${label}</label><strong>${fmt(value)}</strong>${delta?`<span class="delta ${delta<0?'down':''}">${delta>0?'↑':'↓'} ${Math.abs(delta).toFixed(1)}%</span>`:''}<small>${sub}</small></article>`}
function lastDelta(list,key){const a=filterDate(list).filter(r=>r.client===state.client).sort((x,y)=>x.date.localeCompare(y.date));if(a.length<2||a.at(-2)[key]==null||a.at(-1)[key]==null)return null;return (a.at(-1)[key]-a.at(-2)[key])/(a.at(-2)[key]||1)*100}
function makeLine(id,rows,key,name,color,percent=false){if(!window.echarts)return;const el=$(id);if(!el)return;const chart=echarts.getInstanceByDom(el)||echarts.init(el);const data=filterDate(rows).filter(r=>!r.client||r.client===state.client||r.client_type===state.client).sort((a,b)=>String(a.date).localeCompare(String(b.date)));chart.setOption({animation:false,color:[color],grid:{left:58,right:18,top:24,bottom:35,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>percent?pct(v):fmt(v)},xAxis:{type:'category',data:data.map(r=>r.date.slice(5)),axisLabel:{color:'#8392a7'}},yAxis:{type:'value',axisLabel:{color:'#8392a7',formatter:v=>percent?`${Math.round(v*100)}%`:fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{name,type:'line',smooth:.22,symbol:'circle',symbolSize:4,data:data.map(r=>r[key]),lineStyle:{width:3},areaStyle:{color:color+'18'}}]});chart.resize();}
function resizeCharts(){if(!window.echarts)return;document.querySelectorAll('.page.active .chart').forEach(el=>{const chart=echarts.getInstanceByDom(el);if(chart)chart.resize()})}
function deferResize(){requestAnimationFrame(()=>requestAnimationFrame(resizeCharts))}
function renderOverview(){const daily=state.data.daily,dau=clientRows(state.data.dau.length?state.data.dau:daily), rate=clientRows(state.data.playRate.length?state.data.playRate:daily), duration=clientRows(state.data.duration), counts=clientRows(state.data.playCount);const cur=latest(daily.filter(r=>r.client===state.client))||latest(daily);const d=cur?.device_dau,n=cur?.new_device,pr=cur?.play_rate,du=latest(duration)?.total_avg_watch_duration,pc=latest(counts)?.[state.client];$('#overview-kpis').innerHTML=[card('设备DAU',d,'device_dau',lastDelta(daily,'device_dau')),card('新增设备',n,'new_device',lastDelta(daily,'new_device')),card('播放率',pr,'play_rate',lastDelta(daily,'play_rate')),card('人均播放时长',du==null?null:`${Number(du).toFixed(1)} 分钟`,'total_avg_watch_duration',null),card('人均播放次数',pc,'近30天客户端拆分',null)].join('');setText('overview-client',state.client);setText('dau-current',fmt(d));setText('new-current',fmt(n));makeLine('#dau-chart',dau,'device_dau','设备DAU','#2f76e8');makeLine('#new-chart',dau,'new_device','新增设备','#159a70');makeLine('#rate-chart',rate,'play_rate','播放率','#d58b3e',true);const clients=['安卓','iOS','M站'];const table=$('#client-table');if(table)table.innerHTML=clients.map(c=>{const x=latest(filterDate(daily).filter(r=>r.client===c));const y=latest(filterDate(state.data.duration).filter(r=>r.client_type===c));const z=latest(filterDate(state.data.playCount).filter(r=>r[c]!=null));return `<tr><td>${c}</td><td>${fmt(x?.device_dau)}</td><td>${pct(x?.play_rate)}</td><td>${y?.total_avg_watch_duration==null?empty:Number(y.total_avg_watch_duration).toFixed(1)+' 分钟'}</td><td>${fmt(z?.[c])}</td></tr>`}).join('')}
function renderRanking(){const list=filterDate(state.data.ranking).filter(r=>r['榜单分类']==='总榜').sort((a,b)=>Number(a['排名'])-Number(b['排名']));const top=list.slice(0,10);const vv=top.filter(r=>r['播放VV']!=null&&r['播放VV']!=='--');$('#content-summary').innerHTML=[['榜单记录',list.length+' 条','真实 Top30 文件'],['最高播放VV',fmt(Math.max(...list.map(r=>Number(r['播放VV'])||0))),'原始播放VV'],['播放UV状态',list.filter(r=>r['播放UV']==='--').length+' 条为 --','接口原始返回'],['数据日期',list.length?list[0]['日期']:'--','最新可用记录']].map(x=>`<div class="summary-item"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');$('#ranking-table').innerHTML=list.length?list.map(r=>`<tr><td>${esc(r['日期'])}</td><td>${esc(r['排名'])}</td><td>${esc(r['内容名称'])}</td><td>${esc(r['播放UV'])}</td><td>${fmt(r['播放VV'])}</td><td>${esc(r['昨日环比'])}</td><td>${esc(r['聚集类型'])}</td><td>${esc(r['内容分类'])}</td><td>${esc(r['题材标签'])}</td><td>${esc(r['榜单状态'])}</td><td>${esc(r['数据状态'])}</td></tr>`).join(''):`<tr><td colspan="11" class="empty">暂无真实记录</td></tr>`;if(window.echarts){const c=echarts.getInstanceByDom($('#ranking-chart'))||echarts.init($('#ranking-chart'));c.setOption({grid:{left:120,right:25,top:15,bottom:30},tooltip:{trigger:'axis'},xAxis:{type:'value'},yAxis:{type:'category',data:top.slice().reverse().map(r=>String(r['内容名称']||'--').slice(0,18))},series:[{type:'bar',data:top.slice().reverse().map(r=>Number(r['播放VV'])||0),itemStyle:{color:'#5e6ad2'}}]})}}
function searchRows(list){return filterDate(list)}
function trafficCurrent(){const list=clientRows(state.data.traffic);return latest(list.filter(r=>r.device==='老设备'))||latest(list)}
function renderTraffic(){const cur=trafficCurrent();$('#traffic-kpis').innerHTML=[['首页频道点击UV','homepage_channel_click_uv'],['内容点击UV','content_click_uv'],['详情播放UV','detail_play_uv'],['播放超过5分钟UV','play_over_5m_uv'],['有效播放UV','effective_play_uv']].map(x=>card(x[0],cur?.[x[1]],x[1])).join('');const chain=[['首页频道点击UV','homepage_channel_click_uv'],['内容点击UV','content_click_uv'],['详情播放UV','detail_play_uv'],['播放超过5分钟UV','play_over_5m_uv'],['有效播放UV','effective_play_uv']];$('#traffic-chain').innerHTML=chain.map((x,i)=>`${i?'<div class="chain-arrow">↓</div>':''}<div class="chain-step"><b>${i+1}</b><div><span>${x[0]}</span><strong>${fmt(cur?.[x[1]])}</strong><small>${x[1]} · ${pct(cur?.[x[1].replace(/uv$/,'uv_rate')])}</small></div></div>`).join('');const list=filterDate(state.data.traffic).filter(r=>r.date===state.end&&r.client===state.client);const map=new Map();list.forEach(r=>{const old=map.get(r.channel)||r;map.set(r.channel,{...old,homepage_channel_click_uv:(old.homepage_channel_click_uv||0)+(r.homepage_channel_click_uv||0),content_click_uv:(old.content_click_uv||0)+(r.content_click_uv||0),detail_play_uv:(old.detail_play_uv||0)+(r.detail_play_uv||0)})});$('#channel-table').innerHTML=[...map.values()].sort((a,b)=>b.homepage_channel_click_uv-a.homepage_channel_click_uv).map(r=>`<tr><td>${esc(r.channel)}</td><td>${fmt(r.homepage_channel_click_uv)}</td><td>${fmt(r.content_click_uv)}</td><td>${fmt(r.detail_play_uv)}</td></tr>`).join('')||`<tr><td colspan="4" class="empty">暂无真实记录</td></tr>`}
function renderResources(){const sections=filterDate(state.data.sections).filter(r=>r.date===state.end&&r.client===state.client&&r.application_name==='新人人视频').sort((a,b)=>(b.click_ctr_uv||0)-(a.click_ctr_uv||0)).slice(0,20);$('#section-table').innerHTML=sections.map(r=>`<tr><td>${esc(r.board_name)}</td><td>${esc(r.sub_board_name)}</td><td>${fmt(r.exposure_uv)}</td><td>${fmt(r.click_uv)}</td><td>${pct(r.click_ctr_uv)}</td><td>${esc(r.risk_level)}</td></tr>`).join('')||`<tr><td colspan="6" class="empty">暂无真实记录</td></tr>`;const chartRows=sections.slice(0,8).reverse();if(window.echarts){const c=echarts.getInstanceByDom($('#section-chart'))||echarts.init($('#section-chart'));c.setOption({grid:{left:110,right:15,top:10,bottom:25},xAxis:{type:'value',axisLabel:{formatter:v=>`${Math.round(v*100)}%`}},yAxis:{type:'category',data:chartRows.map(r=>r.board_name)},series:[{type:'bar',data:chartRows.map(r=>r.click_ctr_uv),itemStyle:{color:'#a9c9e8'}}]})}const banners=filterDate(state.data.banners).filter(r=>r.date===state.end&&r.client===state.client).sort((a,b)=>(b.ctr_uv||0)-(a.ctr_uv||0)).slice(0,30);$('#banner-table').innerHTML=banners.slice(0,12).map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.banner_position)}</td><td>${esc(r.channel)}</td><td>${fmt(r.exposure_uv)}</td><td>${fmt(r.click_uv)}</td><td>${pct(r.ctr_uv)}</td></tr>`).join('')||`<tr><td colspan="6" class="empty">暂无真实记录</td></tr>`;const bc=echarts.getInstanceByDom($('#banner-chart'))||echarts.init($('#banner-chart'));bc.setOption({grid:{left:120,right:15,top:10,bottom:25},xAxis:{type:'value',axisLabel:{formatter:v=>`${Math.round(v*100)}%`}},yAxis:{type:'category',data:banners.slice(0,8).reverse().map(r=>(r.title||'--').slice(0,15))},series:[{type:'bar',data:banners.slice(0,8).reverse().map(r=>r.ctr_uv),itemStyle:{color:'#7ca8ed'}}]})}
function renderGuess(){const list=filterDate(state.data.guess).filter(r=>r.client===state.client), cur=latest(list);const metrics=[['内容点击UV','content_click_uv'],['播放UV','play_uv'],['播放超过5分钟UV','play_over_5m_uv'],['有效播放UV','effective_play_uv']];$('#guess-uv').innerHTML=metrics.map(x=>`<div class="metric-row"><span>${x[0]}</span><strong>${fmt(cur?.[x[1]])}</strong></div>`).join('');makeLine('#guess-chart',list,'content_click_uv','内容点击UV','#2f76e8');}
function renderPage(){ $$('.page').forEach(p=>p.classList.remove('active'));const p=$(`#page-${state.page}`);if(p)p.classList.add('active');setText('page-title',state.page==='home'?'首页流量与转化漏斗':state.page==='content'?'内容榜单':state.page==='search'?'热搜榜单明细':'视频运营数据平台');$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));if(state.page==='overview')renderOverview();if(state.page==='content')renderRanking();if(state.page==='home'){renderTraffic();renderResources();renderGuess()}deferResize()}
function bind(){
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>{
    const subnav=b.nextElementSibling?.classList.contains('nav-subnav')?b.nextElementSibling:null;
    if(subnav){
      const expand=!b.classList.contains('nav-expanded');
      $$('.nav-group-toggle').forEach(item=>{item.classList.remove('nav-expanded');item.setAttribute('aria-expanded','false')});
      if(expand){b.classList.add('nav-expanded');b.setAttribute('aria-expanded','true')}
      return;
    }
    state.page=b.dataset.page;renderPage();
  }));
  // Bind the grouped sidebar items during the initial bootstrap.  The late
  // enhancement code runs after init(), so relying on it leaves Banner点击
  // and 弹窗数据 without a handler on a cold load.
  $$('.nav-subitem').forEach(b=>{
    if(b.dataset.navBound)return;
    b.dataset.navBound='1';
    b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();state.page=b.dataset.page;renderPage()});
  });
  $$('.sub-tabs button').forEach(b=>b.addEventListener('click',()=>{state.homeTab=b.dataset.homeTab;$$('.sub-tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.home-panel').forEach(x=>x.classList.remove('active'));$(`#home-${state.homeTab}`).classList.add('active');if(state.homeTab==='traffic')renderTraffic();if(state.homeTab==='resources')renderResources();if(state.homeTab==='guess')renderGuess();deferResize()}));$$('.detail-toggle').forEach(b=>b.addEventListener('click',()=>{const target=$(`#${b.dataset.target}`);if(!target)return;const collapsed=target.classList.toggle('detail-collapsed');b.textContent=collapsed?'查看明细':'收起明细';deferResize()}));window.addEventListener('resize',resizeCharts)}
function setDashboardLoading(loading){const main=$('.main'),overlay=$('#dashboard-loading');if(main)main.setAttribute('aria-busy',String(loading));if(overlay)overlay.hidden=!loading}
function finishDashboardLoading(){requestAnimationFrame(()=>requestAnimationFrame(()=>setDashboardLoading(false)))}
function updateDashboardDateLabels(){
  const labels={
    '#page-content .section-heading em':`${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END}`,
    '#page-home>.section-heading em':`${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END}`,
    '#page-sections .section-heading em':`${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END} · android_rrsp_xb`,
    '#banner-ranking-caption':`${DASHBOARD_RANGE_END} · 安卓 · 全部位置`
  };
  Object.entries(labels).forEach(([selector,value])=>{const node=document.querySelector(selector);if(node)node.textContent=value});
}
function ensureCharts(){if(window.echarts){deferResize();finishDashboardLoading();return}const script=document.createElement('script');script.src='echarts.min.js?v=data-audit-20260812';script.onload=()=>{if(Object.keys(state.data).length)renderPage();finishDashboardLoading()};script.onerror=finishDashboardLoading;document.head.appendChild(script)}
const LOAD_PATH_OVERRIDES={duration7:'data/%E4%BA%BA%E5%9D%87%E6%92%AD%E6%94%BE%E6%97%B6%E9%95%BF_%E8%BF%917%E5%A4%A9.json'};
async function init(){
  if(location.protocol==='file:'){
    setDashboardLoading(false);
    const note=document.createElement('div');note.className='data-load-warning';
    note.textContent='当前通过 file:// 直接打开，浏览器无法加载本地 JSON 数据。请双击 dashboard-v2\\启动看板.bat，再打开 http://127.0.0.1:8000/?v=dashboard。';
    document.querySelector('.main')?.prepend(note);
    return;
  }
  setDashboardLoading(true);
  // Keep navigation usable even while optional data sources are loading.
  bind();
  setTimeout(()=>setDashboardLoading(false),1200);
  const initialKeys=new Set(['daily','playRate','duration','playCount','sectionOps','channelOps','bannerClick','ranking','hotSearch','hotKeywordDramaMap','genreRatio']);
  const entries=Object.entries({...DATA,...DATA_PATHS}).filter(([k])=>initialKeys.has(k));
  const settled=await Promise.all(entries.map(async([k,p])=>{const path=LOAD_PATH_OVERRIDES[k]||DATA_PATHS[k]||p;try{const value=await Promise.race([load(path),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),8000))]);return {k,value,path}}catch(error){console.warn('[dashboard] data resource unavailable',path,error);return {k,value:[],path,error}}}));
  settled.forEach(({k,value})=>state.data[k]=value);
  updateDashboardDateLabels();
  // The active dashboard should open on the newest date actually present in
  // the loaded data.  Individual modules may have a shorter verified range
  // (they remain empty for a date they do not contain), but the page-level
  // date must not fall back to the historical 2026-08-04 snapshot.
  // Keep the page-level snapshot date aligned to the modules that share a
  // verified date.  A newly refreshed ranking must not move Tab1's global
  // date forward by itself and change the number of "今日关注" cards.
  const latestDate=dashboardVerifiedDate(state.data);
  if(latestDate){
    DASHBOARD_RANGE_END=latestDate;
    state.end=latestDate;
    window.__dashboardDefaultDate=latestDate;
    if(state.start>state.end)state.start=state.end;
    if(typeof overviewRangeState!=='undefined'){
      overviewRangeState.scaleEnd=latestDate;
      overviewRangeState.depthEnd=latestDate;
    }
    if(typeof updatePeriodLabels==='function')updatePeriodLabels();
  }
  renderPage();ensureCharts();
  const missing=settled.filter(x=>x.error);
  if(missing.length){
    const note=document.createElement('div');note.className='data-load-warning';
    note.textContent=`部分数据文件未加载（${missing.length} 个），已保留可用模块；请检查共享地址和 data 目录。`;
    document.querySelector('.main')?.prepend(note);
  }
}
// Home section enhancement: calculate period-over-period changes from the
// daily section snapshot without inventing or joining playback metrics.
function renderResourcesWithMoM(){
  const all=filterDate(state.data.sections||[]).filter(r=>r.application_id==='22');
  const dates=[...new Set(all.map(r=>String(r.date||'')))].filter(Boolean).sort();
  const currentDate=dates.filter(d=>d<=state.end).at(-1)||dates.at(-1);
  const previousDate=dates.filter(d=>d<currentDate).at(-1);
  const clients=[...new Set(all.map(r=>r.client).filter(Boolean))];
  const selectedClient=clients.includes(state.client)?state.client:clients[0];
  const current=all.filter(r=>r.date===currentDate&&r.client===selectedClient);
  const previous=all.filter(r=>r.date===previousDate&&r.client===selectedClient);
  const key=r=>`${r.board_name||''}\u0000${r.sub_board_name||''}`;
  const prior=new Map(previous.map(r=>[key(r),r]));
  const change=(now,old)=>old==null||Number(old)===0||now==null?null:(Number(now)-Number(old))/Number(old);
  const rows=current.map(r=>({...r,click_uv_mom:change(r.click_uv,prior.get(key(r))?.click_uv),click_ctr_uv_mom:change(r.click_ctr_uv,prior.get(key(r))?.click_ctr_uv),_previous:prior.get(key(r))})).sort((a,b)=>(Number(b.click_uv)||0)-(Number(a.click_uv)||0)).slice(0,20);
  const formatChange=v=>v==null?'--':`${v>=0?'↑':'↓'} ${(Math.abs(v)*100).toFixed(1)}%`;
  const table=document.querySelector('#section-table');
  const head=document.querySelector('#section-detail thead tr');
  if(head)head.innerHTML='<th>板块名称</th><th>子板块名称</th><th>曝光UV</th><th>点击UV</th><th>点击UV环比</th><th>点击率</th><th>点击率环比</th><th>风险等级</th>';
  if(table)table.innerHTML=rows.map(r=>`<tr><td>${esc(r.board_name)}</td><td>${esc(r.sub_board_name)}</td><td>${fmt(r.exposure_uv)}</td><td>${fmt(r.click_uv)}</td><td class="${r.click_uv_mom==null?'':'change-value'}">${formatChange(r.click_uv_mom)}</td><td>${pct(r.click_ctr_uv)}</td><td class="${r.click_ctr_uv_mom==null?'':'change-value'}">${formatChange(r.click_ctr_uv_mom)}</td><td>${esc(r.risk_level)}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">暂无真实记录</td></tr>';
  const title=document.querySelector('#home-resources h3');if(title)title.textContent='首页板块点击量与转化率';
  const subtitle=document.querySelector('#home-resources .panel-head span');if(subtitle)subtitle.textContent=`${currentDate||'--'} 对比 ${previousDate||'--'} · 同板块/子板块环比`;
  const chartRows=rows.slice(0,8).reverse();
  if(window.echarts){const el=document.querySelector('#section-chart');if(el){const c=echarts.getInstanceByDom(el)||echarts.init(el);c.setOption({animation:false,grid:{left:110,right:35,top:20,bottom:30},tooltip:{trigger:'axis',valueFormatter:v=>fmt(v)},xAxis:{type:'value',axisLabel:{formatter:v=>fmt(v)}},yAxis:{type:'category',data:chartRows.map(r=>String(r.board_name||'--'))},series:[{name:'点击UV',type:'bar',data:chartRows.map(r=>Number(r.click_uv)||0),itemStyle:{color:'#a9c9e8'},label:{show:true,position:'right',formatter:p=>fmt(p.value)}}]});c.resize()}}
}

renderResources=renderResourcesWithMoM;
init();
// A single unavailable/slow legacy resource must never leave the whole dashboard covered.
setTimeout(()=>finishDashboardLoading(),12000);

const topActions=$('.top-actions');
if(topActions&&!topActions.querySelector('.date-range')) topActions.insertAdjacentHTML('afterbegin',`<div class="date-range"><span>数据日期</span><b>${DASHBOARD_RANGE_START}</b><i>至</i><b>${DASHBOARD_RANGE_END}</b></div>`);

// Global period filter: keep the same end date and filter every module to the
// selected real-data window.
const periodConfig={30:{start:DASHBOARD_RANGE_START,label:'7月1日—8月27日'},7:{start:'2026-08-21',label:'近7天'}};
function updatePeriodLabels(){
  const cfg=periodConfig[state.period||30],range=`${state.start||cfg.start} 至 ${state.end}`;
  const dateRange=document.querySelector('.date-range');
  if(dateRange){const b=dateRange.querySelectorAll('b');if(b[0])b[0].textContent=cfg.start;if(b[1])b[1].textContent=state.end}
  document.querySelectorAll('.section-heading em').forEach(el=>{if(/2026-|近30天|近7天/.test(el.textContent))el.textContent=range});
  const period30=document.querySelector('.period-filter [data-period="30"]');
  const period7=document.querySelector('.period-filter [data-period="7"]');
  if(period30)period30.textContent=periodConfig[30].label;
  if(period7)period7.textContent=periodConfig[7].label;
}
document.querySelectorAll('.period-filter [data-period]').forEach(button=>button.addEventListener('click',()=>{
  const period=button.dataset.period,cfg=periodConfig[period]||periodConfig[30];
  state.period=Number(period);state.start=cfg.start;
  document.querySelectorAll('.period-filter [data-period]').forEach(x=>x.classList.toggle('active',x===button));
  renderPage();updatePeriodLabels();deferResize();
}));
state.period=30;
updatePeriodLabels();

const originalRenderTraffic=renderTraffic;
renderTraffic=function(){
  originalRenderTraffic();
  const list=filterDate(state.data.traffic).filter(r=>r.date===state.end&&r.client===state.client), map=new Map();
  list.forEach(r=>{const old=map.get(r.channel)||r;map.set(r.channel,{...old,homepage_channel_click_uv:(old.homepage_channel_click_uv||0)+(r.homepage_channel_click_uv||0),content_click_uv:(old.content_click_uv||0)+(r.content_click_uv||0),detail_play_uv:(old.detail_play_uv||0)+(r.detail_play_uv||0)})});
  const ranked=[...map.values()].sort((a,b)=>b.homepage_channel_click_uv-a.homepage_channel_click_uv);
  if(window.echarts){const c=echarts.getInstanceByDom($('#channel-chart'))||echarts.init($('#channel-chart'));c.setOption({grid:{left:75,right:18,top:12,bottom:25},tooltip:{trigger:'axis'},xAxis:{type:'value'},yAxis:{type:'category',data:ranked.slice(0,8).reverse().map(r=>r.channel)},series:[{type:'bar',data:ranked.slice(0,8).reverse().map(r=>r.homepage_channel_click_uv),itemStyle:{color:'#5e6ad2'}}]})}
};

// Data binding corrections: the daily snapshot is the canonical client-split source for Tab1 trends.
makeLine=function(id,list,key,name,color,percent=false){if(!window.echarts)return;const el=$(id);if(!el)return;const chart=echarts.getInstanceByDom(el)||echarts.init(el);const data=filterDate(list).filter(r=>!r.client||r.client===state.client||r.client_type===state.client).filter(r=>r[key]!=null).sort((a,b)=>String(a.date||a['日期']).localeCompare(String(b.date||b['日期'])));chart.setOption({animation:false,color:[color],grid:{left:58,right:18,top:24,bottom:35,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>percent?pct(v):fmt(v)},xAxis:{type:'category',data:data.map(r=>String(r.date||r['日期']).slice(5)),axisLabel:{color:'#8392a7'}},yAxis:{type:'value',axisLabel:{color:'#8392a7',formatter:v=>percent?`${Math.round(v*100)}%`:fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{name,type:'line',smooth:.22,symbol:'circle',symbolSize:4,data:data.map(r=>r[key]),lineStyle:{width:3},areaStyle:{color:color+'18'}}]});chart.resize()};
renderOverview=function(){const daily=clientRows(state.data.daily),rate=clientRows(state.data.playRate),duration=clientRows(state.data.duration).filter(r=>r.client_type===state.client),counts=state.data.playCount;const cur=latest(daily.filter(r=>r.client===state.client))||latest(daily);const d=cur?.device_dau,n=cur?.new_device,pr=cur?.play_rate,du=latest(duration)?.total_avg_watch_duration,pc=latest(counts)?.[state.client];$('#overview-kpis').innerHTML=[card('设备DAU',d,'device_dau',lastDelta(daily,'device_dau')),card('新增设备',n,'new_device',lastDelta(daily,'new_device')),card('播放率',pr,'play_rate',lastDelta(daily,'play_rate')),card('人均播放时长',du==null?null:`${Number(du).toFixed(1)} 分钟`,'total_avg_watch_duration',null),card('人均播放次数',pc,'近30天客户端拆分',null)].join('');setText('overview-client',state.client);setText('dau-current',fmt(d));setText('new-current',fmt(n));makeLine('#dau-chart',daily,'device_dau','设备DAU','#2f76e8');makeLine('#new-chart',daily,'new_device','新增设备','#159a70');makeLine('#rate-chart',rate,'play_rate','播放率','#d58b3e',true);const clients=['安卓','iOS','M站'];const table=$('#client-table');if(table)table.innerHTML=clients.map(c=>{const x=latest(filterDate(state.data.daily).filter(r=>r.client===c));const y=latest(filterDate(state.data.duration).filter(r=>r.client_type===c));const z=latest(filterDate(counts).filter(r=>r[c]!=null));return `<tr><td>${c}</td><td>${fmt(x?.device_dau)}</td><td>${pct(x?.play_rate)}</td><td>${y?.total_avg_watch_duration==null?empty:Number(y.total_avg_watch_duration).toFixed(1)+' 分钟'}</td><td>${fmt(z?.[c])}</td></tr>`}).join('')};

renderSearch=function(){const use=searchRows(state.data.searchUse),first=searchRows(state.data.firstFrame),five=searchRows(state.data.fiveMin);const latestUse=latest(use),latestFirst=latest(first),latestFive=latest(five),newRows=searchRows(state.data.newSearch),oldRows=searchRows(state.data.oldSearch),latestNew=latest(newRows),latestOld=latest(oldRows);$('#search-kpis').innerHTML=[card('搜索点击转化率',latestUse?.search_click_rate,'search_click_rate'),card('首帧播放UV整体转化率',latestFirst?.value??latestFirst?.first_frame_play_uv_rate,'first_frame_play_uv_rate'),card('播放5分钟UV整体转化率',latestFive?.value??latestFive?.play_5_mins_uv_rate,'play_5_mins_uv_rate'),card('新用户搜索使用率',latestNew?.search_click_rate,'search_click_rate'),card('老用户搜索使用率',latestOld?.search_click_rate,'search_click_rate')].join('');const chain=[['搜索点击转化率',latestUse?.search_click_rate],['首帧播放UV整体转化率',latestFirst?.value??latestFirst?.first_frame_play_uv_rate],['播放5分钟UV整体转化率',latestFive?.value??latestFive?.play_5_mins_uv_rate]];$('#search-chain').innerHTML=chain.map((x,i)=>`${i?'<div class="chain-arrow">↓</div>':''}<div class="chain-step"><b>${i+1}</b><div><span>${x[0]}</span><strong>${pct(x[1])}</strong></div></div>`).join('');makeLine('#search-chart',use,'search_click_rate','搜索点击转化','#2f76e8',true);makeLine('#search-behavior-chart',newRows,'search_click_rate','新用户搜索使用率','#159a70',true);const hot=filterDate(state.data.hotSearch).filter(r=>String(r.date||r['日期'])===state.end).filter(r=>hotDramaName(r)!=='--').slice(0,30);$('#hot-search-table').innerHTML=hot.map(r=>`<tr><td>${esc(r.rank??r['排名'])}</td><td>${esc(hotDramaName(r))}</td><td>${fmt(r.search_count??r.search_vv??r['搜索次数'])}</td><td>${fmt(r.search_uv??r['搜索UV'])}</td><td>${esc(r.day_over_day??r.day_over_day_pct??r['昨日环比'])}</td></tr>`).join('')||`<tr><td colspan="5" class="empty">暂无真实记录</td></tr>`};

const renderTrafficWithRawRates=renderTraffic;
renderTraffic=function(){renderTrafficWithRawRates();const cur=trafficCurrent();const steps=[['首页频道点击UV','homepage_channel_click_uv',null],['内容点击UV','content_click_uv','content_click_uv_rate'],['详情播放UV','detail_play_uv','play_conversion_uv_rate'],['播放超过5分钟UV','play_over_5m_uv','play_over_5m_uv_rate'],['有效播放UV','effective_play_uv','effective_play_uv_rate']];$('#traffic-chain').innerHTML=steps.map((x,i)=>`${i?'<div class="chain-arrow">↓</div>':''}<div class="chain-step"><b>${i+1}</b><div><span>${x[0]}</span><strong>${fmt(cur?.[x[1]])}</strong><small>${x[1]} · ${x[2]?pct(cur?.[x[2]]):'--'}</small></div></div>`).join('')};

function metricRows(title, rows, fields){const cur=latest(rows)||{};return `<div class="empty-block"><b>${title}</b>${fields.map(([label,key])=>`<div class="metric-row"><span>${label}</span><strong>${fmt(cur[key])}</strong></div>`).join('')}</div>`}
function ensureDataPanel(id, after, title){let el=$(id);if(!el){el=document.createElement('article');el.id=id.slice(1);el.className='panel data-extra-panel';after.insertAdjacentElement('afterend',el)}el.innerHTML=`<div class="panel-head"><div><h3>${title}</h3><span>原始数据文件直接映射</span></div></div><div class="table-wrap"></div>`;return el.querySelector('.table-wrap')}
function renderAdditionalSourceData(){
  const overviewAfter=$('#client-table')?.closest('article');
  if(overviewAfter&&state.data.dau?.length){const box=ensureDataPanel('#dau-snapshot',overviewAfter,'客户端 DAU 原始快照');const rows=clientRows(state.data.dau).slice(-9);box.innerHTML=`<table><thead><tr><th>日期</th><th>application</th><th>client</th><th>device_dau</th><th>source</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.application)}</td><td>${esc(r.client)}</td><td>${fmt(r.device_dau)}</td><td>${esc(r.source)}</td></tr>`).join('')}</tbody></table>`}
  const trafficAfter=$('#channel-detail')?.closest('article');
  if(trafficAfter&&state.data.trafficDetail?.length){const box=ensureDataPanel('#traffic-detail-full',trafficAfter,'频道流量完整明细');const rows=filterDate(state.data.trafficDetail).filter(r=>r.client===state.client).slice(-40);const keys=['date','channel','client','device','homepage_channel_click_uv','content_click_uv','content_click_uv_rate','detail_play_uv','play_conversion_uv_rate','play_over_5m_uv','play_over_5m_uv_rate','effective_play_uv','effective_play_uv_rate'];box.innerHTML=`<table><thead><tr>${keys.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td>${k.includes('rate')?pct(r[k]):esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
}
const renderGuessWithAllSources=renderGuess;
renderGuess=function(){renderGuessWithAllSources();const list=filterDate(state.data.guess).filter(r=>r.client===state.client), exposure=filterDate(state.data.guessExposure).filter(r=>r.client===state.client), pv=filterDate(state.data.guessPv).filter(r=>r.client===state.client);const host=$('#guess-uv')?.parentElement;if(host){let e=$('#guess-exposure');if(!e){e=document.createElement('div');e.id='guess-exposure';e.className='metric-list';host.insertBefore(e,$('#guess-pv-note')?.parentElement||null)}let p=$('#guess-pv');if(!p){p=document.createElement('div');p.id='guess-pv';p.className='metric-list';host.appendChild(p)}e.innerHTML=metricRows('猜你喜欢曝光与整体转化',exposure,[['首页Tab曝光UV','home_tab_exposure_uv'],['首页Tab曝光PV','home_tab_exposure_pv'],['首帧播放整体转化率','first_frame_play_overall_conversion_rate'],['播放超过5分钟整体转化率','play_over_5m_overall_conversion_rate']]);p.innerHTML=metricRows('猜你喜欢 PV',pv,[['首页Tab曝光PV','homepage_tab_exposure_pv'],['内容曝光PV','content_exposure_pv'],['内容点击PV','content_click_pv'],['内容点击PV转化率','content_click_pv_rate'],['播放PV','play_pv'],['播放超过5分钟PV','play_over_5m_pv'],['播放超过10分钟PV','play_over_10m_pv'],['有效播放PV','effective_play_pv']])}}
const renderPageWithSources=renderPage;
renderPage=function(){renderPageWithSources();renderAdditionalSourceData()};

// Tab2: content operations view. Keeps the original ranking fields and order intact.
const renderContentOperations=renderRanking;
renderRanking=function(){
  const host=$('#page-content');
  if(!host)return;
  host.innerHTML=`<div class="section-heading"><div><span>CONTENT OPERATIONS</span><h2>内容榜单</h2><p>哪些内容带来播放贡献，哪些内容正在成为热门</p></div><em>${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END}</em></div>
    <section class="content-overview" id="content-summary"></section>
    <section class="content-structure panel"><div class="panel-head"><div><h3>热门内容结构</h3><span>最新可用日期 · 内容分类</span></div></div><div class="content-structure-body"><div id="category-chart" class="category-chart"></div><div id="category-list" class="category-list"></div></div></section>
    <section class="content-detail panel"><div class="panel-head"><div><h3>站内播放排名 Top30 明细</h3><span>保留原始记录，不合并同名内容</span></div><div class="content-table-actions"><button type="button" class="content-sort active" data-sort="rank">排名</button><button type="button" class="content-sort" data-sort="vv">播放VV</button><button type="button" class="content-sort" data-sort="change">昨日环比</button></div></div><div class="content-detail-scroll"><table class="content-ranking-table"><thead><tr><th>排名</th><th>内容名称</th><th>播放UV</th><th>播放VV</th><th>昨日环比</th><th>聚集类型</th><th>内容分类</th><th>题材标签</th><th>榜单状态</th><th>数据状态</th></tr></thead><tbody id="ranking-table"></tbody></table></div></section>`;

  const all=filterDate(state.data.ranking).filter(r=>r['榜单分类']==='总榜');
  const dates=all.map(r=>String(r['日期']||'')).filter(Boolean).sort();
  const latestDate=dates.at(-1)||'';
  const latestRows=all.filter(r=>String(r['日期']||'')===latestDate).sort((a,b)=>Number(a['排名'])-Number(b['排名']));
  const top10=latestRows.slice(0,10);
  const vvValues=all.map(r=>Number(r['播放VV'])).filter(Number.isFinite);
  const top1=latestRows[0]?.['内容名称']||'--';
  $('#content-summary').innerHTML=[
    `<article class="content-summary-item"><span>榜单记录数量</span><strong>${fmt(all.length)}</strong><small>真实总榜记录</small></article>`,
    `<article class="content-summary-item"><span>最高播放VV</span><strong>${fmt(vvValues.length?Math.max(...vvValues):null)}</strong><small>原始播放VV最大值</small></article>`,
    `<article class="content-summary-item"><span>当前Top1内容</span><strong class="content-summary-title">${esc(top1)}</strong><small>${esc(latestDate)} 原始排名第1</small></article>`
  ].join('');
  setText('content-top10-date',latestDate?`${latestDate} · 原始总榜 Top10`:'暂无可用日期');

  const tooltip={trigger:'item',formatter:p=>{const r=top10[p.dataIndex];return `<b>${esc(r?.['内容名称'])}</b><br/>排名：${esc(r?.['排名'])}<br/>播放VV：${fmt(r?.['播放VV'])}<br/>日期：${esc(r?.['日期']||'--')}<br/>分类：${esc(r?.['内容分类']||'--')}`}};
  const chart=$('#ranking-chart');
  if(window.echarts&&chart){const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.setOption({animation:false,grid:{left:150,right:40,top:16,bottom:24,containLabel:true},tooltip,xAxis:{type:'value',axisLabel:{color:'#8090a4',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#e6edf5'}}},yAxis:{type:'category',data:top10.slice().reverse().map(r=>String(r['内容名称']||'--')),axisLabel:{color:'#455b77',width:130,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:28,data:top10.slice().reverse().map((r,i)=>({value:Number(r['播放VV'])||0,itemStyle:{color:i>=7?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>fmt(p.value)}}]});c.resize();c.setOption({tooltip});}

  const categories={};latestRows.forEach(r=>{const k=r['内容分类']||'--';categories[k]=(categories[k]||0)+1});
  const catRows=Object.entries(categories).sort((a,b)=>b[1]-a[1]);
  const catChart=$('#category-chart');
  if(window.echarts&&catChart){const c=echarts.getInstanceByDom(catChart)||echarts.init(catChart);c.setOption({animation:false,tooltip:{trigger:'item',formatter:p=>`${esc(p.name)}：${p.value} 条（${p.percent}%）`},legend:{bottom:0,textStyle:{color:'#65758d'}},series:[{type:'pie',radius:['46%','72%'],center:['50%','46%'],avoidLabelOverlap:true,label:{show:false},data:catRows.map(([name,value])=>({name,value}))}]});c.resize();}
  $('#category-list').innerHTML=catRows.map(([name,value])=>`<div><span><i></i>${esc(name)}</span><b>${value}</b></div>`).join('');

  let sort='rank',desc=false;
  const changeValue=r=>{const m=String(r['昨日环比']||'').match(/-?[\d.]+/);return m?Number(m[0]):null};
  const renderTable=()=>{let rows=[...all];if(sort==='rank')rows.sort((a,b)=>Number(a['排名'])-Number(b['排名'])||String(a['日期']).localeCompare(String(b['日期'])));if(sort==='vv')rows.sort((a,b)=>(Number(b['播放VV'])||0)-(Number(a['播放VV'])||0));if(sort==='change')rows.sort((a,b)=>(changeValue(b)??-Infinity)-(changeValue(a)??-Infinity));if(desc)rows.reverse();$('#ranking-table').innerHTML=rows.map(r=>{const rank=Number(r['排名']);const change=String(r['昨日环比']||'');const cls=change.startsWith('↑')?'is-up':change.startsWith('↓')?'is-down':'';return `<tr><td>${esc(r['日期'])}</td><td><span class="rank-badge rank-${rank<=3?rank:'other'}">${esc(r['排名'])}</span></td><td class="content-name">${esc(r['内容名称'])}</td><td>${esc(r['播放UV'])}</td><td class="vv-value">${fmt(r['播放VV'])}</td><td class="change-value ${cls}">${esc(change)}</td><td>${esc(r['聚集类型'])}</td><td>${esc(r['内容分类'])}</td><td>${esc(r['题材标签'])}</td><td>${esc(r['榜单状态'])}</td><td>${esc(r['数据状态'])}</td></tr>`}).join('')||`<tr><td colspan="11" class="empty">暂无真实记录</td></tr>`};
  renderTable();
  $$('.content-sort').forEach(btn=>btn.addEventListener('click',()=>{const next=btn.dataset.sort;if(sort===next)desc=!desc;else{sort=next;desc=false}$$('.content-sort').forEach(x=>x.classList.toggle('active',x===btn));renderTable()}));
};

// Final Tab2 correction: daily snapshot view with latest date selected by default.
renderRanking=function(){
  const host=$('#page-content');if(!host)return;
   host.innerHTML='<section class="content-detail panel"><div class="panel-head"><div><h3>热播榜单明细</h3><span>按 season_id 识别内容；日环比、周环比齐全后按播放VV降序取Top30</span></div><div class="content-table-actions"><label for="content-date-filter">日期</label><select id="content-date-filter" class="content-date-filter"></select><button type="button" class="content-sort active" data-sort="vv">播放VV</button><button type="button" class="content-sort" data-sort="change">昨日环比</button></div></div><div class="content-detail-scroll"><table class="content-ranking-table"><thead><tr><th>排名</th><th>内容名称</th><th>播放UV</th><th>播放VV</th><th>昨日环比</th><th>聚集类型</th><th>内容分类</th><th>题材标签</th><th>榜单状态</th><th>数据状态</th></tr></thead><tbody id="ranking-table"></tbody></table></div></section>';
  const all=filterDate(state.data.ranking).filter(r=>r['榜单分类']==='总榜');
  const dates=[...new Set(all.map(r=>String(r['日期']||'')))].filter(Boolean).sort();
  let activeDate=dates.at(-1)||'',sort='vv',desc=false;
  const dateFilter=$('#content-date-filter');dateFilter.innerHTML=dates.slice().reverse().map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');dateFilter.value=activeDate;
  const latestRows=()=>all.filter(r=>String(r['日期'])===activeDate).sort((a,b)=>Number(a['排名'])-Number(b['排名']));
  const top10=latestRows().slice(0,10);setText('content-top10-date',activeDate?`${activeDate} · 原始总榜 Top10`:'暂无可用日期');
const chart=$('#ranking-chart');if(window.echarts&&chart){const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.setOption({animation:false,grid:{left:150,right:40,top:16,bottom:24,containLabel:true},tooltip:{trigger:'item',formatter:p=>{const r=top10[p.dataIndex];return `<b>${esc(r?.['内容名称'])}</b><br/>排名：${esc(r?.['排名'])}<br/>播放VV：${fmt(r?.['播放VV'])}<br/>日期：${esc(r?.['日期']||'--')}<br/>分类：${esc(r?.['内容分类']||'--')}`}},xAxis:{type:'value',axisLabel:{color:'#8090a4',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#e6edf5'}}},yAxis:{type:'category',data:top10.slice().reverse().map(r=>String(r['内容名称']||'--')),axisLabel:{color:'#455b77',width:130,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:28,data:top10.slice().reverse().map(r=>({value:Number(r['播放VV'])||0,itemStyle:{color:'#2f6f3e'}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>fmt(p.value)}}]});c.resize();}
  const changeValue=r=>{const m=String(r['昨日环比']||'').match(/-?[\d.]+/);return m?Number(m[0]):null};
  const renderTable=()=>{let rows=latestRows();if(sort==='vv')rows.sort((a,b)=>(Number(b['播放VV'])||0)-(Number(a['播放VV'])||0));if(sort==='change')rows.sort((a,b)=>(changeValue(b)??-Infinity)-(changeValue(a)??-Infinity));if(desc)rows.reverse();$('#ranking-table').innerHTML=rows.map(r=>{const rank=Number(r['排名']),change=String(r['昨日环比']||''),cls=change.startsWith('↑')?'is-up':change.startsWith('↓')?'is-down':'';return `<tr><td><span class="rank-badge rank-${rank<=3?rank:'other'}">${esc(r['排名'])}</span></td><td class="content-name">${esc(r['内容名称'])}</td><td>${esc(r['播放UV'])}</td><td class="vv-value">${fmt(r['播放VV'])}</td><td class="change-value ${cls}">${esc(change)}</td><td>${esc(r['聚集类型'])}</td><td>${esc(r['内容分类'])}</td><td>${esc(r['题材标签'])}</td><td>${esc(r['榜单状态'])}</td><td>${esc(r['数据状态'])}</td></tr>`}).join('')||'<tr><td colspan="10" class="empty">暂无真实记录</td></tr>'};
  renderTable();dateFilter.addEventListener('change',()=>{activeDate=dateFilter.value;renderTable()});$$('.content-sort').forEach(btn=>btn.addEventListener('click',()=>{if(sort===btn.dataset.sort)desc=!desc;else{sort=btn.dataset.sort;desc=false}$$('.content-sort').forEach(x=>x.classList.toggle('active',x===btn));renderTable()}));
};

DATA_PATHS.duration7='data/%E4%BA%BA%E5%9D%87%E6%92%AD%E6%94%BE%E6%97%B6%E9%95%BF_%E8%BF%917%E5%A4%A9.json';

// Tab2 list tabs: keep both sections visible and use the sidebar as anchors.
const renderRankingWithCategoryTabs=renderRanking;
const genreRatioState={date:''};
let genreDisplayRowsPromise=null;
function genreDisplayName(row,mapping){
  const id=String(row?.season_id||'').trim();
  const plot=String(row?.plot_type||'').split(',').map(value=>value.trim()).filter(Boolean);
  const region=String(row?.producer_region||'');
  const rule=mapping?.rule||{};
  const listed=Array.isArray(mapping?.season_ids)&&mapping.season_ids.map(String).includes(id);
  const matchesRule=plot.includes(rule.plot_type_contains||'同性')
    &&String(row?.season_type||'')==='TH'
    &&region.includes(rule.producer_region||'泰国');
  const originalGenre={CHN:'国产',JP:'日剧',KR:'韩剧',TH:'泰剧',UK:'英剧',USK:'美剧',OTHER:'其他'}[String(row?.season_type||'')]||String(row?.genre||row?.season_type||'其他');
  // season_ids 已由 Excel 按“泰国 + 同性 + 普通话”筛选；这里再用播放明细的
  // season_type / plot_type / producer_region 做第二层校验，避免 ID 误套到其他内容。
  return listed&&matchesRule?'国产剧':originalGenre;
}
function ensureGenreDisplayRows(){
  if(state.data.genreRatioMapped)return Promise.resolve(state.data.genreRatioMapped);
  if(genreDisplayRowsPromise)return genreDisplayRowsPromise;
  const source=rows(state.data.genreRatio),dates=[...new Set(source.map(r=>String(r['日期']||r.date||'')).filter(Boolean))].sort(),mapping=state.data.genreMapping||{};
  genreDisplayRowsPromise=Promise.all(dates.map(date=>loadSeasonDay(date).then(day=>({date,rows:day})))).then(days=>{
    const grouped=new Map();
    days.forEach(({date,rows:dayRows})=>dayRows.forEach(row=>{
      const vv=Number(row.play_count),uv=Number(row.play_uv);if(!row.season_id||!Number.isFinite(vv)||vv<10)return;
      const key=`${date}\u0000${genreDisplayName(row,mapping)}`,old=grouped.get(key)||{日期:date,剧种:genreDisplayName(row,mapping),播放VV:0,播放UV:0};
      old['播放VV']+=vv;if(Number.isFinite(uv))old['播放UV']+=uv;grouped.set(key,old);
    }));
    const totals=new Map();[...grouped.values()].forEach(row=>totals.set(row['日期'],(totals.get(row['日期'])||0)+row['播放VV']));
    const result=[...grouped.values()].map(row=>({...row,'播放VV占比':totals.get(row['日期'])?row['播放VV']/totals.get(row['日期'])*100:0}));
    state.data.genreRatioMapped=result;return result;
  }).catch(error=>{console.warn('[dashboard] genre display mapping unavailable',error);state.data.genreRatioMapped=[];return []});
  return genreDisplayRowsPromise;
}
window.__ensureGenreDisplayRows=ensureGenreDisplayRows;
renderRanking=function(){
  renderRankingWithCategoryTabs();
  const host=document.querySelector('#page-content');
  const tree=document.querySelector('#content-sidebar-tree');
  if(host&&!tree.querySelector('.content-view-tabs')){
    const viewTabs=document.createElement('div');
    viewTabs.className='content-view-tabs';
    viewTabs.innerHTML='<button type="button" class="content-view-tab active" data-content-view="ranking">热播榜单</button><button type="button" class="content-view-tab" data-content-view="search">热搜榜单</button><button type="button" class="content-view-tab" data-content-view="genre">剧种播放占比</button>';
    tree.classList.add('content-sidebar-visible');
    tree.innerHTML='<div class="content-sidebar-group"></div>';
    tree.querySelector('.content-sidebar-group').appendChild(viewTabs);
    viewTabs.querySelectorAll('.content-view-tab').forEach(btn=>btn.addEventListener('click',()=>{
      viewTabs.querySelectorAll('.content-view-tab').forEach(x=>x.classList.toggle('active',x===btn));
      if(btn.dataset.contentView==='search'){
        // Re-render first, then scroll after the search view has been mounted.
        // Scrolling before render used to target a detached/hidden node, making
        // the tab appear unresponsive until a full page refresh.
        state.page='search';
        renderPage();
        requestAnimationFrame(()=>{
          document.querySelectorAll('#content-sidebar-tree .content-view-tab').forEach(x=>x.classList.toggle('active',x.dataset.contentView==='search'));
          document.querySelector('#page-content .search-region')?.scrollIntoView({behavior:'smooth',block:'start'});
        });
        return;
      }
      if(btn.dataset.contentView==='ranking'&&state.page!=='content'){
        // The sub-navigation remains visible on the search page, but the
        // ranking detail node does not. Switch pages before trying to scroll.
        state.page='content';
        renderPage();
      }
      requestAnimationFrame(()=>{
        document.querySelectorAll('#content-sidebar-tree .content-view-tab').forEach(x=>x.classList.toggle('active',x.dataset.contentView===btn.dataset.contentView));
        document.querySelector(btn.dataset.contentView==='genre'?'.content-structure':'.content-detail')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }));
  }
  if(!state.data.genreRatioMapped){ensureGenreDisplayRows().then(()=>{renderRanking();requestAnimationFrame(()=>setupRankingBoard())});return}
  const allGenreRows=state.data.genreRatioMapped;
  const genreDates=[...new Set(allGenreRows.map(r=>String(r['日期']||r.date||'')).filter(Boolean))].sort();
  if(!genreRatioState.date||!genreDates.includes(genreRatioState.date))genreRatioState.date=genreDates.includes(state.end)?state.end:genreDates.at(-1);
  const genreRows=()=>allGenreRows.filter(r=>String(r['日期']||r.date||'')===genreRatioState.date).sort((a,b)=>(Number(b['播放VV'])||0)-(Number(a['播放VV'])||0));
  const previousGenreDate=genreDates.filter(date=>date<genreRatioState.date).at(-1);
  const previousGenreRows=()=>allGenreRows.filter(r=>String(r['日期']||r.date||'')===previousGenreDate);
  const genreHead=document.querySelector('#page-content .content-structure .panel-head');
  if(genreHead&&!genreHead.querySelector('.genre-date-control')){
    genreHead.insertAdjacentHTML('beforeend',`<label class="genre-date-control"><span>日期</span><input type="date" aria-label="剧种播放占比日期"></label>`);
    genreHead.querySelector('input').addEventListener('change',event=>{genreRatioState.date=event.target.value;renderRanking();});
  }
  const genreDateInput=genreHead?.querySelector('.genre-date-control input');
  if(genreDateInput){genreDateInput.min=genreDates[0]||'';genreDateInput.max=genreDates.at(-1)||'';genreDateInput.value=genreRatioState.date||'';}
  const genreSubtitle=genreHead?.querySelector('h3+span');
  if(genreSubtitle)genreSubtitle.textContent=`${genreRatioState.date||'--'} · 播放VV占比`;
  const genreChart=document.querySelector('#category-chart');
  if(genreChart&&window.echarts){
    const rows=genreRows();
    const pie=rows.map(r=>({name:String(r['剧种']||'--'),value:Number(r['播放VV'])||0,share:Number(r['播放VV占比'])||0}));
    const c=echarts.getInstanceByDom(genreChart)||echarts.init(genreChart);
    c.setOption({
      animation:false,
      tooltip:{trigger:'item',formatter:p=>`${esc(p.name)}<br/>播放VV：${fmt(p.value)}<br/>VV占比：${Number(p.data?.share||0).toFixed(2)}%`},
      legend:{show:false},
      series:[{type:'pie',radius:'80%',center:['50%','50%'],avoidLabelOverlap:true,label:{show:true,position:'outside',formatter:p=>`${p.name} ${Number(p.data?.share||0).toFixed(2)}%`,color:'#40536d',fontSize:12},labelLine:{length:12,length2:10,lineStyle:{color:'#b8c8da'}},data:pie.map((item,index)=>({...item,itemStyle:{color:GENRE_PIE_COLORS[index%GENRE_PIE_COLORS.length],borderColor:'#fff',borderWidth:1}}))}],
      color:GENRE_PIE_COLORS
    },true);
    c.resize();
    enforceGenrePieColors();
  }
  const genreList=document.querySelector('#category-list');
  if(genreList){
    const previousByGenre=new Map(previousGenreRows().map(r=>[String(r['剧种']||'--'),Number(r['播放VV占比'])]));
    const change=(row)=>{
      const previous=previousByGenre.get(String(row['剧种']||'--'));
      if(!Number.isFinite(previous))return '<em class="genre-change neutral">--</em>';
      const current=Number(row['播放VV占比']||0);
      const delta=previous?((current-previous)/previous)*100:0;
      if(Math.abs(delta)<0.005)return '<em class="genre-change neutral">--</em>';
      const direction=delta>0?'up':'down',arrow=delta>0?'▲':'▼';
      return `<em class="genre-change ${direction}">${arrow} ${Math.abs(delta).toFixed(2)}%</em>`;
    };
    genreList.innerHTML='<div class="genre-ratio-item genre-list-head"><span>剧种</span><b>播放VV占比</b><em>较前一日</em></div>'+genreRows().map(r=>`<div class="genre-ratio-item"><span><i></i>${esc(r['剧种'])}</span><b>${Number(r['播放VV占比']||0).toFixed(2)}%</b>${change(r)}</div>`).join('');
  }
};

// Tab1 information architecture: three full-width operational questions.
const renderOverviewWithThreeAreas=renderOverview;
renderOverview=function(){
  renderOverviewWithThreeAreas();
  $('#dau-chart')?.closest('section')?.remove();
  const oldAnalysis=$('#rate-chart')?.closest('section');
  $('#client-comparison')?.remove();
  $('#client-table')?.closest('article')?.remove();
  oldAnalysis?.remove();
  const host=document.querySelector('#page-overview');if(!host)return;
  const regions=document.createElement('section');regions.className='overview-regions';
  regions.innerHTML='<article class="panel overview-region"><div class="region-heading"><div><span class="region-index">01</span><div><h3>用户规模趋势分析</h3><p>用户规模是否持续增长</p></div></div><span class="region-source">设备 DAU · 新增设备</span></div><div class="region-chart-grid two"><div class="region-chart-box"><div class="region-chart-title"><b>设备 DAU</b><span id="overview-device-current">--</span></div><div id="overview-device-chart" class="region-chart"></div></div><div class="region-chart-box"><div class="region-chart-title"><b>新增设备</b><span id="overview-new-current">--</span></div><div id="overview-new-device-chart" class="region-chart"></div></div></div></article><article class="panel overview-region"><div class="region-heading"><div><span class="region-index">02</span><div><h3>用户消费深度分析</h3><p>用户是否愿意持续消费内容</p></div></div><span class="region-source">播放率 · 人均播放时长 · 人均播放次数</span></div><div class="region-chart-grid three"><div class="region-chart-box"><div class="region-chart-title"><b>播放率</b><span id="overview-play-rate-current">--</span></div><div id="overview-play-rate-chart" class="region-chart"></div></div><div class="region-chart-box"><div class="region-chart-title"><b>人均播放时长</b><span id="overview-duration-current">--</span></div><div id="overview-duration-chart" class="region-chart"></div></div><div class="region-chart-box"><div class="region-chart-title"><b>人均播放次数</b><span id="overview-count-current">--</span></div><div id="overview-count-chart" class="region-chart"></div></div></div></article>';
  host.appendChild(regions);
  const daily=filterDate(state.data.daily),rate=filterDate(state.data.playRate),duration=filterDate(state.data.duration),counts=state.data.playCount;
  const cur=latest(daily.filter(r=>r.client===state.client))||latest(daily),durationCur=latest(duration),countCur=latest(counts);
  $('#overview-kpis').innerHTML=[overviewMetric('设备 DAU',cur?.device_dau,lastDelta(daily,'device_dau')),overviewMetric('新增设备',cur?.new_device,lastDelta(daily,'new_device')),overviewMetric('播放率',cur?.play_rate,lastDelta(daily,'play_rate'),null,true),overviewMetric('人均播放时长',durationCur?.total_avg_watch_duration,null,'分钟'),overviewMetric('人均播放次数',countCur?.[state.client],null,'次')].join('');
  setText('overview-device-current',fmt(cur?.device_dau));setText('overview-new-current',fmt(cur?.new_device));setText('overview-play-rate-current',pct(cur?.play_rate));setText('overview-duration-current',durationCur?.total_avg_watch_duration==null?'--':`${Number(durationCur.total_avg_watch_duration).toFixed(1)} 分钟`);setText('overview-count-current',countCur?.[state.client]==null?'--':`${Number(countCur[state.client]).toFixed(1)} 次`);
  makeLine('#overview-device-chart',daily,'device_dau','设备 DAU','#2f76e8');makeLine('#overview-new-device-chart',daily,'new_device','新增设备','#159a70');makeLine('#overview-play-rate-chart',rate,'play_rate','播放率','#d58b3e',true);makeLine('#overview-duration-chart',duration,'total_avg_watch_duration','人均播放时长','#7c6fe8');makeLine('#overview-count-chart',counts,state.client,'人均播放次数','#91a8c7');
  const clients=['安卓','iOS','M站'],latestDaily=c=>latest(filterDate(state.data.daily).filter(r=>r.client===c)),latestDuration=c=>latest(filterDate(state.data.duration).filter(r=>r.client_type===c));
  const bar=(id,values,color,percent=false)=>{const el=$(`#${id}`);if(!el||!window.echarts)return;const chart=echarts.getInstanceByDom(el)||echarts.init(el);chart.setOption({animation:false,grid:{left:12,right:12,top:28,bottom:18},xAxis:{type:'category',data:clients,axisLine:{lineStyle:{color:'#dce5ef'}},axisLabel:{color:'#65758d'}},yAxis:{type:'value',max:percent?1:null,axisLabel:{color:'#9aa8b9',formatter:v=>percent?`${Math.round(v*100)}%`:fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},tooltip:{trigger:'axis',valueFormatter:v=>percent?pct(v):fmt(v)},series:[{type:'bar',barMaxWidth:42,data:values.map((v,i)=>({value:v,itemStyle:{color:'#a9c9e8'}})),label:{show:true,position:'top',color:'#30415a',formatter:v=>percent?pct(v.value):fmt(v.value)}}]});chart.resize()};
  bar('overview-client-dau-chart',clients.map(c=>latestDaily(c)?.device_dau??null),'#2f76e8');bar('overview-client-rate-chart',clients.map(c=>latestDaily(c)?.play_rate??null),'#159a70',true);bar('overview-client-duration-chart',clients.map(c=>latestDuration(c)?.total_avg_watch_duration??null),'#d58b3e');
};

// Tab1 composition view: one combined chart per business theme.
const renderOverviewAsCompositions=renderOverview;
renderOverview=function(){
  renderOverviewAsCompositions();
  const host=$('#page-overview');if(!host)return;
  const areas=[
    ['overview-device-chart','overview-new-device-chart','overview-scale-combo'],
    ['overview-play-rate-chart','overview-duration-chart','overview-count-chart','overview-depth-combo'],
    ['overview-client-dau-chart','overview-client-rate-chart','overview-duration-chart','overview-client-combo']
  ];
  const first=host.querySelector('.overview-region:nth-child(1) .region-chart-grid');
  const second=host.querySelector('.overview-region:nth-child(2) .region-chart-grid');
  const third=host.querySelector('.overview-region:nth-child(3) .region-chart-grid');
  if(first)first.innerHTML='<div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot blue"></i>设备 DAU</span><span><i class="legend-dot green"></i>新增设备</span></div><div id="overview-scale-combo" class="composition-chart"></div></div>';
  if(second)second.innerHTML='<div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot depth-rate"></i>播放率</span><span><i class="legend-dot depth-duration"></i>人均播放时长</span><span><i class="legend-dot depth-count"></i>人均播放次数</span></div><div id="overview-depth-combo" class="composition-chart"></div></div>';
  if(third)third.innerHTML='<div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot blue"></i>设备 DAU</span><span><i class="legend-dot green"></i>播放率</span><span><i class="legend-dot amber"></i>人均播放时长</span></div><div id="overview-client-combo" class="composition-chart"></div></div>';
  const daily=clientRows(state.data.daily),rate=clientRows(state.data.playRate),duration=clientRows(state.data.duration).filter(r=>r.client_type===state.client),counts=state.data.playCount;
  const dateOf=r=>String(r.date||r['日期']||r['日期']).slice(0,10),dateKey=r=>String(r.date||r['日期']);
  const dates=rows=>[...new Set(filterDate(rows).map(dateOf))].sort();
  const rangeDates=(rows,start,end)=>[...new Set(overviewFilterRange(rows,start,end).map(dateOf))].sort();
  const byDate=(list,key,dateset)=>{const map=new Map(filterDate(list).filter(r=>r[key]!=null).map(r=>[dateOf(r),Number(r[key])]));return dateset.map(d=>map.get(d)??null)};
  const byRangeDate=(list,key,dateset,start,end)=>{const map=new Map(overviewFilterRange(list,start,end).filter(r=>r[key]!=null).map(r=>[dateOf(r),Number(r[key])]));return dateset.map(d=>map.get(d)??null)};
  const combo=(id,option)=>{const el=$(`#${id}`);if(!el||!window.echarts)return;const chart=echarts.getInstanceByDom(el)||echarts.init(el);chart.setOption({...option,animation:false,tooltip:{trigger:'axis'},grid:{left:62,right:62,top:28,bottom:36,containLabel:true}});chart.resize()};
  const rangeDaily=overviewNoDateClientRows(state.data.daily,state.client,'client');
  const scaleDates=rangeDates(rangeDaily,overviewRangeState.scaleStart,overviewRangeState.scaleEnd);combo('overview-scale-combo',{legend:{show:false},xAxis:{type:'category',data:scaleDates.map(d=>d.slice(5)),axisLabel:{color:'#8392a7'}},yAxis:[{type:'value',name:'DAU',axisLabel:{color:'#8392a7',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},{type:'value',name:'新增',axisLabel:{color:'#8392a7',formatter:v=>fmt(v)},splitLine:{show:false}}],series:[{name:'设备 DAU',type:'bar',barMaxWidth:24,data:byRangeDate(rangeDaily,'device_dau',scaleDates,overviewRangeState.scaleStart,overviewRangeState.scaleEnd),itemStyle:{color:'#2f76e8'}},{name:'新增设备',type:'line',yAxisIndex:1,data:byRangeDate(rangeDaily,'new_device',scaleDates,overviewRangeState.scaleStart,overviewRangeState.scaleEnd),smooth:.2,symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#159a70'},itemStyle:{color:'#159a70'}}]});
  // Use the canonical daily snapshot for playback rate. The client-split rate
  // file can contain multiple rows per date, which previously let the M-site
  // value overwrite the selected Android value in the date map.
  const depthDuration=overviewNoDateClientRows(state.data.duration,state.client,'client_type'),depthDates=[...new Set([...rangeDates(rangeDaily,overviewRangeState.depthStart,overviewRangeState.depthEnd),...rangeDates(depthDuration,overviewRangeState.depthStart,overviewRangeState.depthEnd),...rangeDates(counts,overviewRangeState.depthStart,overviewRangeState.depthEnd)])].sort();combo('overview-depth-combo',{legend:{show:false},xAxis:{type:'category',data:depthDates.map(d=>d.slice(5)),axisLabel:{color:'#8392a7'}},yAxis:[{type:'value',min:.75,max:.88,axisLabel:{color:'#8392a7',formatter:v=>pct(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},{type:'value',min:60,max:100,axisLabel:{color:'#8392a7'},splitLine:{show:false}},{type:'value',min:0,max:10,axisLabel:{color:'#8392a7'},splitLine:{show:false}}],series:[{name:'播放率',type:'bar',barMaxWidth:22,data:byRangeDate(rangeDaily,'play_rate',depthDates,overviewRangeState.depthStart,overviewRangeState.depthEnd),itemStyle:{color:'#e7c99f',borderRadius:[4,4,0,0]}},{name:'人均播放时长',type:'line',yAxisIndex:1,data:byRangeDate(depthDuration,'total_avg_watch_duration',depthDates,overviewRangeState.depthStart,overviewRangeState.depthEnd),smooth:.22,symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#7569a8'},itemStyle:{color:'#7569a8'}},{name:'人均播放次数',type:'line',yAxisIndex:2,data:byRangeDate(counts,state.client,depthDates,overviewRangeState.depthStart,overviewRangeState.depthEnd),smooth:.22,symbol:'diamond',symbolSize:6,lineStyle:{width:3,type:'dashed',color:'#6685a8'},itemStyle:{color:'#6685a8'}}]});
  const clients=['安卓','iOS','M站'],latestDaily=c=>latest(filterDate(state.data.daily).filter(r=>r.client===c)),latestDuration=c=>latest(filterDate(state.data.duration).filter(r=>r.client_type===c)),latestCount=c=>latest(filterDate(counts).filter(r=>r[c]!=null));combo('overview-client-combo',{legend:{show:false},xAxis:{type:'category',data:clients,axisLabel:{color:'#65758d'}},yAxis:[{type:'value',name:'DAU',axisLabel:{color:'#8392a7',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},{type:'value',name:'播放率',max:1,axisLabel:{color:'#8392a7',formatter:v=>pct(v)},splitLine:{show:false}},{type:'value',name:'分钟',axisLabel:{color:'#8392a7'},splitLine:{show:false}}],series:[{name:'设备 DAU',type:'bar',barMaxWidth:30,data:clients.map(c=>latestDaily(c)?.device_dau??null),itemStyle:{color:'#a9c9e8'},label:{show:true,position:'top',formatter:v=>fmt(v.value)}},{name:'播放率',type:'line',yAxisIndex:1,data:clients.map(c=>latestDaily(c)?.play_rate??null),symbol:'circle',symbolSize:8,lineStyle:{width:3,color:'#159a70'},itemStyle:{color:'#159a70'},label:{show:true,formatter:v=>pct(v.value)}},{name:'人均播放时长',type:'line',yAxisIndex:2,data:clients.map(c=>latestDuration(c)?.total_avg_watch_duration??null),symbol:'circle',symbolSize:8,lineStyle:{width:3,color:'#d58b3e'},itemStyle:{color:'#d58b3e'},label:{show:true,formatter:v=>Number(v.value).toFixed(1)}}]});
};

// Tab1 analysis switcher: presentation-only layer; source fields remain unchanged.
const renderOverviewWithComparison=renderOverview;
renderOverview=function(){
  renderOverviewWithComparison();
  const oldAnalysis=$('#rate-chart')?.closest('section');
  const oldClient=$('#client-table')?.closest('article');
  $('#client-comparison')?.remove();oldClient?.remove();
  if(!oldAnalysis)return;
  const wrapper=document.createElement('section');wrapper.className='analysis-switcher';
  wrapper.innerHTML='<div class="analysis-tabs" role="tablist"><button class="analysis-tab active" type="button" data-overview-analysis="rate">播放率趋势</button><button class="analysis-tab" type="button" data-overview-analysis="clients">客户端对比</button></div><article id="overview-analysis-rate" class="panel analysis-panel active"><div class="panel-head"><div><h3>播放率趋势</h3><span>真实字段 play_rate · 近30天</span></div><strong id="rate-current">--</strong></div><div id="rate-chart" class="chart chart-wide"></div></article><article id="overview-analysis-clients" class="panel analysis-panel"><div class="panel-head"><div><h3>安卓 / iOS / M站 综合表现对比</h3><span>设备 DAU、人均播放指标</span></div><strong>按客户端</strong></div><div class="client-chart-grid"><div><span>设备 DAU</span><div id="client-dau-chart" class="client-chart"></div></div><div><span>播放率</span><div id="client-rate-chart" class="client-chart"></div></div><div><span>人均播放时长</span><div id="client-duration-chart" class="client-chart"></div></div><div><span>人均播放次数</span><div id="client-count-chart" class="client-chart"></div></div></div></article>';
  oldAnalysis.replaceWith(wrapper);
  const rate=clientRows(state.data.playRate),clients=['安卓','iOS','M站'];makeLine('#rate-chart',rate,'play_rate','播放率','#d58b3e',true);setText('rate-current',pct(latest(rate)?.play_rate));
  const latestDaily=c=>latest(filterDate(state.data.daily).filter(r=>r.client===c)),latestDuration=c=>latest(filterDate(state.data.duration).filter(r=>r.client_type===c)),latestCount=c=>latest(filterDate(state.data.playCount).filter(r=>r[c]!=null));
  const bar=(id,values,color,percent=false)=>{const el=$(`#${id}`);if(!el||!window.echarts)return;const c=echarts.getInstanceByDom(el)||echarts.init(el);c.setOption({animation:false,grid:{left:8,right:8,top:28,bottom:8},xAxis:{type:'category',data:clients,show:false},yAxis:{type:'value',show:false,max:percent?1:null},series:[{type:'bar',barMaxWidth:38,data:values.map((v,i)=>({value:v,itemStyle:{color:'#a9c9e8'}})),label:{show:true,position:'top',color:'#30415a',formatter:v=>percent?pct(v.value):fmt(v.value)}}]});c.resize()};
  bar('client-dau-chart',clients.map(c=>latestDaily(c)?.device_dau??null),'#2f76e8');bar('client-rate-chart',clients.map(c=>latestDaily(c)?.play_rate??null),'#159a70',true);bar('client-duration-chart',clients.map(c=>latestDuration(c)?.total_avg_watch_duration??null),'#d58b3e');bar('client-count-chart',clients.map(c=>latestCount(c)?.[c]??null),'#7c6fe8');
  const activateAnalysis=kind=>{wrapper.querySelectorAll('.analysis-tab').forEach(x=>x.classList.toggle('active',x.dataset.overviewAnalysis===kind));wrapper.querySelectorAll('.analysis-panel').forEach(x=>x.classList.toggle('active',x.id===`overview-analysis-${kind}`));if(kind==='rate'){makeLine('#rate-chart',rate,'play_rate','播放率','#d58b3e',true)}else{bar('client-dau-chart',clients.map(c=>latestDaily(c)?.device_dau??null),'#2f76e8');bar('client-rate-chart',clients.map(c=>latestDaily(c)?.play_rate??null),'#159a70',true);bar('client-duration-chart',clients.map(c=>latestDuration(c)?.total_avg_watch_duration??null),'#d58b3e');bar('client-count-chart',clients.map(c=>latestCount(c)?.[c]??null),'#7c6fe8')}deferResize()};
  wrapper.querySelectorAll('.analysis-tab').forEach(button=>button.addEventListener('click',()=>activateAnalysis(button.dataset.overviewAnalysis)));
  activateAnalysis('rate');
};

// Tab1 presentation layer: keep the source data and mappings unchanged while
// making the overview answer the operational questions first.
const overviewMakeLine=makeLine;
makeLine=function(id,list,key,name,color,percent=false){
  if(!window.echarts)return;
  const el=$(id);if(!el)return;
  const chart=echarts.getInstanceByDom(el)||echarts.init(el);
  const data=filterDate(list).filter(r=>!r.client||r.client===state.client||r.client_type===state.client).filter(r=>r[key]!=null).sort((a,b)=>String(a.date||a['日期']).localeCompare(String(b.date||b['日期'])));
  const values=data.map(r=>Number(r[key])).filter(Number.isFinite);
  const max=values.length?Math.max(...values):null,min=values.length?Math.min(...values):null;
  chart.setOption({animation:false,color:[color],grid:{left:58,right:20,top:30,bottom:35,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>percent?pct(v):fmt(v)},xAxis:{type:'category',data:data.map(r=>String(r.date||r['日期']).slice(5)),axisLabel:{color:'#8392a7'}},yAxis:{type:'value',axisLabel:{color:'#8392a7',formatter:v=>percent?`${Math.round(v*100)}%`:fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{name,type:'line',smooth:.22,symbol:'circle',symbolSize:4,data:data.map(r=>r[key]),lineStyle:{width:3},areaStyle:{color:color+'18'}}]});
  chart.resize();
};

function overviewMetric(label,value,delta,unit,percent=false){
  const trend=delta==null?'':`<span class="overview-delta ${delta<0?'is-down':'is-up'}">${delta>=0?'↑':'↓'} ${Math.abs(delta).toFixed(1)}%</span>`;
  return `<article class="kpi-card overview-metric"><label>${label}</label><strong>${percent?pct(value):fmt(value)}${unit?`<small class="metric-unit">${unit}</small>`:''}</strong><div>${trend||'<span class="overview-status">真实快照</span>'}</div><small>较昨日</small></article>`;
}

const overviewRenderForBI=renderOverview;
renderOverview=function(){
  overviewRenderForBI();
  const daily=clientRows(state.data.daily),rate=clientRows(state.data.playRate),duration=clientRows(state.data.duration).filter(r=>r.client_type===state.client),counts=state.data.playCount;
  const cur=latest(filterDate(daily).filter(r=>r.client===state.client))||latest(filterDate(daily)),d=cur?.device_dau,n=cur?.new_device,pr=cur?.play_rate;
  const du=latest(filterDate(duration))?.total_avg_watch_duration;
  const pc=latest(filterDate(counts).filter(r=>r[state.client]!=null))?.[state.client];
  $('#overview-kpis').innerHTML=[overviewMetric('设备 DAU',d,lastDelta(daily,'device_dau')),overviewMetric('新增设备',n,lastDelta(daily,'new_device')),overviewMetric('播放率',pr,lastDelta(daily,'play_rate'),null,true),overviewMetric('人均播放时长',du,null,'分钟'),overviewMetric('人均播放次数',pc,null,'次')].join('');
  const clientArticle=$('#client-table')?.closest('article');
  if(clientArticle&&!$('#client-comparison')){
    const compare=document.createElement('article');compare.id='client-comparison';compare.className='panel client-comparison-panel';
    compare.innerHTML='<div class="panel-head"><div><h3>客户端表现对比</h3><span>DAU、播放率、人均播放时长</span></div><strong>按客户端</strong></div><div class="client-chart-grid"><div><span>设备 DAU</span><div id="client-dau-chart" class="client-chart"></div></div><div><span>播放率</span><div id="client-rate-chart" class="client-chart"></div></div><div><span>人均播放时长</span><div id="client-duration-chart" class="client-chart"></div></div></div>';
    clientArticle.parentElement.insertBefore(compare,clientArticle);clientArticle.classList.add('client-detail-panel');
    const detailButton=compare.nextElementSibling?.querySelector('.detail-toggle');
    if(detailButton)detailButton.addEventListener('click',()=>{const target=$(`#${detailButton.dataset.target}`);if(!target)return;const collapsed=target.classList.toggle('detail-collapsed');detailButton.textContent=collapsed?'查看明细':'收起明细';deferResize()});
  }
  if(clientArticle)clientArticle.querySelector('.panel-head').innerHTML='<div><h3>客户端明细</h3><span>查看原始客户端拆分</span></div><button class="detail-toggle" type="button" data-target="client-table-wrap">查看明细</button>';
  const table=clientArticle?.querySelector('.table-wrap');if(table){table.id='client-table-wrap';table.classList.add('detail-collapsed');}
  const clients=['安卓','iOS','M站'],latestFor=c=>latest(filterDate(state.data.daily).filter(r=>r.client===c)),durationFor=c=>latest(filterDate(state.data.duration).filter(r=>r.client_type===c));
  const chart=(id,data,color,percent=false)=>{const el=$(`#${id}`);if(!el||!window.echarts)return;const c=echarts.getInstanceByDom(el)||echarts.init(el);c.setOption({animation:false,grid:{left:8,right:8,top:8,bottom:8},xAxis:{type:'category',data:clients,show:false},yAxis:{type:'value',show:false,max:percent?1:null},series:[{type:'bar',barMaxWidth:34,data:data.map((v,i)=>({value:v,itemStyle:{color:'#a9c9e8'}})),label:{show:true,position:'top',color:'#30415a',formatter:v=>percent?pct(v.value):fmt(v.value)}}]});c.resize()};
  chart('client-dau-chart',clients.map(c=>latestFor(c)?.device_dau??null),'#2f76e8');chart('client-rate-chart',clients.map(c=>latestFor(c)?.play_rate??null),'#159a70',true);chart('client-duration-chart',clients.map(c=>durationFor(c)?.total_avg_watch_duration??null),'#d58b3e');
};

// Final Tab1 view: one full-width chart per active Quick BI-style tab.
const renderOverviewWithTabs=renderOverview;
renderOverview=function(){
  renderOverviewWithTabs();
  const host=$('#page-overview');if(!host)return;
  const old=host.querySelector('.overview-regions');if(old)old.remove();
  const regions=document.createElement('section');regions.className='overview-regions overview-tabbed-regions';
  regions.innerHTML='<article class="panel overview-region"><div class="region-heading"><div><span class="region-index">01</span><div><h3>用户规模趋势分析</h3><p>设备 DAU 与新增设备的规模变化关系</p></div></div><span class="region-source">设备 DAU · 新增设备</span></div><div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot blue"></i>设备 DAU</span><span><i class="legend-dot green"></i>新增设备</span></div><div id="tab1-scale-chart" class="composition-chart"></div></div></article><article class="panel overview-region"><div class="region-heading"><div><span class="region-index">02</span><div><h3>用户消费深度分析</h3><p>点击标签切换单独的播放率或播放深度趋势</p></div></div><span class="region-source">播放率 · 人均播放时长 · 人均播放次数</span></div><div class="quick-tabs" role="tablist" aria-label="用户消费深度指标"><button class="quick-tab active" type="button" role="tab" aria-selected="true" data-view="play-rate">播放率</button><button class="quick-tab" type="button" role="tab" aria-selected="false" data-view="depth-detail">人均播放时长 + 人均播放次数</button></div><div id="tab1-depth-play-rate" class="tab-view active" role="tabpanel"><div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot amber"></i>播放率</span></div><div id="tab1-rate-chart" class="composition-chart"></div></div></div><div id="tab1-depth-detail" class="tab-view" role="tabpanel"><div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot purple"></i>人均播放时长</span><span><i class="legend-dot slate"></i>人均播放次数</span></div><div id="tab1-depth-chart" class="composition-chart"></div></div></div></article><article class="panel overview-region"><div class="region-heading"><div><span class="region-index">03</span><div><h3>安卓 / iOS / M站 综合表现对比</h3><p>按客户端分别观察规模与质量</p></div></div><span class="region-source">设备 DAU · 播放率 · 人均播放时长 · 人均播放次数</span></div><div class="quick-tabs" role="tablist"><button class="quick-tab active" data-client-view="client-dau">设备 DAU</button><button class="quick-tab" data-client-view="client-rate">播放率</button><button class="quick-tab" data-client-view="client-duration">人均播放时长</button><button class="quick-tab" data-client-view="client-count">人均播放次数</button></div><div id="tab1-client-chart" class="composition-chart"></div></article>';
  host.appendChild(regions);
  const dateOf=r=>String(r.date||r['日期']||'').slice(0,10),datesOf=list=>[...new Set(filterDate(list).map(dateOf))].sort();
  const values=(list,key,dates)=>{const m=new Map(filterDate(list).filter(r=>r[key]!=null).map(r=>[dateOf(r),Number(r[key])]));return dates.map(d=>m.get(d)??null)};
  const initChart=(id,option)=>{const el=$(`#${id}`);if(!el||!window.echarts)return null;const c=echarts.getInstanceByDom(el)||echarts.init(el);c.clear();c.setOption({...option,textStyle:{color:'#40536d'},animationDuration:420,animationDurationUpdate:360,animationEasing:'cubicOut',grid:{left:62,right:62,top:34,bottom:38,containLabel:true}},true);c.resize();return c};
  const daily=clientRows(state.data.daily),rate=clientRows(state.data.playRate),duration=clientRows(state.data.duration).filter(r=>r.client_type===state.client),counts=state.data.playCount;
  const scaleDates=datesOf(daily);initChart('tab1-scale-chart',{tooltip:{trigger:'axis'},xAxis:{type:'category',data:scaleDates.map(d=>d.slice(5)),axisLabel:{color:'#667992'}},yAxis:[{type:'value',name:'DAU',axisLabel:{color:'#667992',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#e1e8f1'}}},{type:'value',name:'新增',axisLabel:{color:'#667992',formatter:v=>fmt(v)},splitLine:{show:false}}],series:[{name:'设备 DAU',type:'bar',yAxisIndex:0,barMaxWidth:28,data:values(daily,'device_dau',scaleDates),itemStyle:{color:'#a9c9e8'}},{name:'新增设备',type:'line',yAxisIndex:1,data:values(daily,'new_device',scaleDates),smooth:.25,symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#5aa982'},itemStyle:{color:'#5aa982'}}]});
  const depthDates=[...new Set([...datesOf(rate),...datesOf(duration),...datesOf(counts)])].sort();
  const depthOptions={
    'play-rate':{tooltip:{trigger:'axis'},xAxis:{type:'category',data:depthDates.map(d=>d.slice(5)),axisLabel:{color:'#667992'}},yAxis:{type:'value',max:1,axisLabel:{color:'#667992',formatter:v=>pct(v)},splitLine:{lineStyle:{color:'#e1e8f1'}}},series:[{name:'播放率',type:'line',data:values(rate,'play_rate',depthDates),smooth:.25,symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#b08c4c'},itemStyle:{color:'#b08c4c'},areaStyle:{color:'#b08c4c18'}}]},
    'depth-detail':{tooltip:{trigger:'axis'},xAxis:{type:'category',data:depthDates.map(d=>d.slice(5)),axisLabel:{color:'#667992'}},yAxis:[{type:'value',name:'分钟',axisLabel:{color:'#667992'},splitLine:{lineStyle:{color:'#e1e8f1'}}},{type:'value',name:'次数',axisLabel:{color:'#667992'},splitLine:{show:false}}],series:[{name:'人均播放时长',type:'line',data:values(duration,'total_avg_watch_duration',depthDates),smooth:.25,symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#8d79b7'},itemStyle:{color:'#8d79b7'},areaStyle:{color:'#8d79b718'}},{name:'人均播放次数',type:'bar',yAxisIndex:1,barMaxWidth:24,data:values(counts,state.client,depthDates),itemStyle:{color:'#8098b4'}}]}
  };
  initChart('tab1-rate-chart',depthOptions['play-rate']);
  const clients=['安卓','iOS','M站'],latestDaily=c=>latest(daily.filter(r=>r.client===c)),latestDuration=c=>latest(duration.filter(r=>r.client_type===c)),latestCount=c=>latest(filterDate(counts).filter(r=>r[c]!=null));
  const clientValues={'client-dau':clients.map(c=>latestDaily(c)?.device_dau??null),'client-rate':clients.map(c=>latestDaily(c)?.play_rate??null),'client-duration':clients.map(c=>latestDuration(c)?.total_avg_watch_duration??null),'client-count':clients.map(c=>latestCount(c)?.[c]??null)};
  const clientLabels={'client-dau':'设备 DAU','client-rate':'播放率','client-duration':'人均播放时长','client-count':'人均播放次数'};
  const renderClient=kind=>initChart('tab1-client-chart',{tooltip:{trigger:'axis',valueFormatter:v=>kind==='client-rate'?pct(v):fmt(v)},xAxis:{type:'category',data:clients,axisLabel:{color:'#65758d'}},yAxis:{type:'value',max:kind==='client-rate'?1:null,axisLabel:{color:'#667992',formatter:v=>kind==='client-rate'?pct(v):fmt(v)},splitLine:{lineStyle:{color:'#e1e8f1'}}},series:[{name:clientLabels[kind],type:'bar',barMaxWidth:48,data:clientValues[kind].map((v,i)=>({value:v,itemStyle:{color:['#6f9fdd','#6eaf8d','#c4a15b'][i]}})),label:{show:true,position:'top',color:'#40536d',formatter:v=>kind==='client-rate'?pct(v.value):fmt(v.value)}}]});
  renderClient('client-dau');
  regions.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{regions.querySelectorAll('[data-view]').forEach(x=>{const active=x===btn;x.classList.toggle('active',active);x.setAttribute('aria-selected',String(active))});regions.querySelectorAll('.tab-view').forEach(x=>x.classList.toggle('active',x.id===`tab1-depth-${btn.dataset.view==='play-rate'?'play-rate':'detail'}`));initChart(btn.dataset.view==='play-rate'?'tab1-rate-chart':'tab1-depth-chart',depthOptions[btn.dataset.view]);deferResize()}));
  regions.querySelectorAll('[data-client-view]').forEach(btn=>btn.addEventListener('click',()=>{regions.querySelectorAll('[data-client-view]').forEach(x=>x.classList.toggle('active',x===btn));renderClient(btn.dataset.clientView);deferResize()}));
};
const TAB1_CLIENTS=['\u5b89\u5353','iOS','\u004d\u7ad9','\u5168\u90e8'];
const clientFilterHost=$('.top-actions');
if(clientFilterHost&&!$('#client-filter')){
  const clientFilter=document.createElement('div');
  clientFilter.id='client-filter';
  clientFilter.className='segmented client-filter';
  clientFilter.innerHTML=TAB1_CLIENTS.map((client,index)=>`<button data-client="${client}" class="${index===0?'active':''}">${client}</button>`).join('');
  const periodFilter=clientFilterHost.querySelector('.period-filter');
  clientFilterHost.insertBefore(clientFilter,periodFilter||null);
  clientFilter.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    state.client=button.dataset.client;
    setText('overview-client',state.client);
    clientFilter.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
    renderPage();
  }));
  const originalRenderPage=renderPage;
  renderPage=function(){
    if(state.page==='content'||state.page==='search')clientFilter.remove();
    else if(!clientFilter.parentElement)clientFilterHost.insertBefore(clientFilter,clientFilterHost.querySelector('.period-filter')||null);
    clientFilter.classList.toggle('tab4-client-hidden',state.page==='home');
    originalRenderPage();
  };
}

// Keep client filter values aligned with the canonical labels in the data files.
// The previous controls carried mojibake values, so Tab1 could not match client rows.
function normalizeClientFilter(){
  const filter=$('#client-filter');
  if(!filter)return;
  const buttons=[...filter.querySelectorAll('button')];
  buttons.forEach((button,index)=>{
    const client=TAB1_CLIENTS[index];
    if(!client)return;
    const replacement=button.cloneNode(true);
    replacement.dataset.client=client;
    replacement.textContent=client;
    replacement.addEventListener('click',()=>{
      state.client=client;
      filter.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===replacement));
      renderPage();
      requestAnimationFrame(()=>setText('overview-client',state.client));
    });
    button.replaceWith(replacement);
  });
  const active=TAB1_CLIENTS.includes(state.client)?state.client:TAB1_CLIENTS[0];
  state.client=active;
  filter.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button.dataset.client===active));
}
normalizeClientFilter();

// Tab1 uses a compact select in the KPI heading while sharing the canonical
// client state used by the existing dashboard renderers.
const overviewClientSelect=$('#overview-client-select');
if(overviewClientSelect&&!overviewClientSelect.dataset.bound){
  if(![...overviewClientSelect.options].some(option=>option.value==='全部'))overviewClientSelect.insertAdjacentHTML('beforeend','<option value="全部">全部</option>');
  overviewClientSelect.dataset.bound='1';
  overviewClientSelect.value=TAB1_CLIENTS.includes(state.client)?state.client:TAB1_CLIENTS[0];
  overviewClientSelect.addEventListener('change',()=>{
    state.client=overviewClientSelect.value;
    renderPage();
  });
}

window.setInterval(()=>{
  const active=$('#client-filter .active')?.dataset.client;
  const label=$('#overview-client');
  if(active&&label&&label.textContent!==active)label.textContent=active;
},100);

// Some legacy overview render layers rewrite the hero label after a client
// switch. Keep the existing label synchronized with the active filter button.

const renderPageWithoutTab4ClientFilter = renderPage;
renderPage = function(){
  const clientFilter = $('#client-filter');
  const previousClient = state.client;
  const isTab4 = state.page === 'home';
  if (isTab4) state.client = '\u5168\u90e8\u7aef\u53e3';
  try {
    renderPageWithoutTab4ClientFilter();
  } finally {
    state.client = previousClient;
  }
  if (clientFilter) clientFilter.classList.toggle('tab4-client-hidden', isTab4);
};

// Tab4 uses the provider's aggregate scope; the global client selector remains for Tabs 1-3.
const tab4RenderWithAllPlatforms = renderFn => function(){
  const previousClient = state.client;
  state.client = '\u5168\u90e8\u7aef\u53e3';
  try { renderFn(); } finally { state.client = previousClient; }
};
renderTraffic = tab4RenderWithAllPlatforms(renderTraffic);
renderResources = tab4RenderWithAllPlatforms(renderResources);
renderGuess = tab4RenderWithAllPlatforms(renderGuess);


// Final Tab4 presentation layer: keeps the existing source fields and filters,
// but presents them as three independent operational views.
const tab4Text={
  noData:'暂无真实数据', noPv:'暂无真实PV数据',
  traffic:'流量入口', resources:'资源位分析', guess:'猜你喜欢',
  homeChannel:'首页频道点击UV', contentClick:'内容点击UV', detailPlay:'详情播放UV',
  play5:'播放超过5分钟UV', effective:'有效播放UV'
};
const tab4Value=(v,pv=false)=>v===null||v===undefined||v===''||v==='--'?(pv?tab4Text.noPv:tab4Text.noData):fmt(v);
const normalizeTab4Rate=v=>{const n=Number(v);if(!Number.isFinite(n))return null;return n>1?n/100:n};
const tab4Pct=v=>v===null||v===undefined||v===''||v==='--'?tab4Text.noData:pct(normalizeTab4Rate(v));
const tab4Field=(r,k,pv=false)=>tab4Value(r?.[k],pv);
function buildTab4(){
  const host=$('#page-home');if(!host||host.dataset.tab4Built)return;
  host.dataset.tab4Built='1';
  host.innerHTML=`<div class="section-heading"><div><span>HOME OPERATIONS</span><h2>首页流量与转化漏斗</h2><p>按业务模块进入分析页面，数据口径：全部端口</p></div><em>${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END}</em></div>
    <div class="tab4-layout">
      <div class="tab4-nav-group"><div class="tab4-nav-title">流量入口</div><button class="tab4-nav-item active" type="button" data-route="channel-funnel">频道页漏斗</button><button class="tab4-nav-item" type="button" data-route="channel-ranking">频道效果排行</button></div>
      <div class="tab4-nav-group"><div class="tab4-nav-title">资源位分析</div><button class="tab4-nav-item" type="button" data-route="home-sections">首页板块</button><button class="tab4-nav-item" type="button" data-route="banner">Banner资源位</button></div>
      <div class="tab4-nav-group"><div class="tab4-nav-title">猜你喜欢</div><button class="tab4-nav-item" type="button" data-route="guess-trend">推荐效果趋势</button><button class="tab4-nav-item" type="button" data-route="guess-detail">内容明细</button></div>
    <main class="tab4-route-content">
      <div class="tab4-inline-tabs" data-tab-group="traffic"><button class="active" type="button" data-route="channel-funnel">频道页漏斗</button><button type="button" data-route="channel-ranking">频道效果排行</button></div>
      <div class="tab4-inline-tabs" data-tab-group="resources"><button class="active" type="button" data-route="home-sections">首页板块</button><button type="button" data-route="banner">Banner资源位</button></div>
      <div class="tab4-inline-tabs" data-tab-group="guess"><button class="active" type="button" data-route="guess-trend">推荐效果趋势</button><button type="button" data-route="guess-detail">内容明细</button></div>
      <section class="tab4-route active" data-route-view="channel-funnel"><section class="panel tab4-panel"><div class="tab4-panel-head"><div><span class="tab4-index">01</span><div><h3>频道转化漏斗</h3><p id="traffic-funnel-note">首页进入频道页到有效播放的整体转化链路</p></div></div><label class="tab4-channel-select"><span>频道筛选</span><select id="traffic-channel-filter" class="tab4-channel-filter" aria-label="选择频道"></select></label></div><div id="traffic-chain" class="tab4-funnel"></div></section></section>
      <section class="tab4-route" data-route-view="channel-ranking"><section class="panel tab4-panel"><div class="tab4-panel-head"><div><span class="tab4-index">01</span><div><h3>频道效果排行</h3><p>流量规模与转化质量对比</p></div></div></div><div id="channel-chart" class="tab4-wide-chart"></div><div class="tab4-detail"><div class="tab4-detail-head"><h3>频道明细</h3><span>真实字段明细</span></div><div id="tab4-channel-detail" class="tab4-table-scroll"><table><thead><tr><th>频道</th><th>首页进入频道页UV</th><th>首页进入→频道点击</th><th>频道点击→详情播放</th><th>详情播放→5分钟</th></tr></thead><tbody id="channel-table"></tbody></table></div></div></section></section>
      <section class="tab4-route" data-route-view="home-sections"><section class="panel tab4-panel"><div class="tab4-panel-head"><div><span class="tab4-index">01</span><div><h3>首页板块</h3><p>按真实点击率排序，缺失字段保留为空态</p></div></div></div><div id="section-chart" class="tab4-wide-chart"></div><div class="tab4-table-scroll"><table><thead><tr><th>板块名称</th><th>子板块名称</th><th>曝光PV</th><th>曝光UV</th><th>点击PV</th><th>点击UV</th><th>点击率</th><th>转化率</th><th>风险等级</th></tr></thead><tbody id="section-table"></tbody></table></div></section></section>
      <section class="tab4-route" data-route-view="banner"><section class="panel tab4-panel"><div class="tab4-panel-head"><div><span class="tab4-index">01</span><div><h3>Banner资源位</h3><p>按真实 CTR 排序，跳转播放字段缺失时保留空态</p></div></div></div><div id="banner-chart" class="tab4-wide-chart"></div><div class="tab4-table-scroll"><table><thead><tr><th>Banner标题</th><th>Banner位置</th><th>针次</th><th>频道</th><th>曝光PV</th><th>曝光UV</th><th>点击PV</th><th>点击UV</th><th>CTR</th><th>跳转播放量</th><th>有效播放量</th></tr></thead><tbody id="banner-table"></tbody></table></div></section></section>
      <section class="tab4-route" data-route-view="guess-trend"><section class="tab4-kpis" id="guess-kpis"></section><section class="panel tab4-panel"><div class="tab4-panel-head"><div><span class="tab4-index">01</span><div><h3>推荐效果趋势</h3><p>点击 UV、播放 UV、有效播放 UV</p></div></div></div><div id="guess-chart" class="tab4-wide-chart"></div><div class="tab4-pv-empty"><b>PV</b><span>暂无真实PV数据</span></div></section></section>
      <section class="tab4-route" data-route-view="guess-detail"><section class="panel tab4-panel"><div class="tab4-panel-head"><div><span class="tab4-index">01</span><div><h3>猜你喜欢内容明细</h3><p>保留真实字段，缺失字段显示暂无真实数据</p></div></div></div><div class="tab4-table-scroll"><table><thead><tr><th>组件名称/剧名</th><th>曝光PV</th><th>曝光UV</th><th>点击PV</th><th>点击UV</th><th>播放量</th><th>有效播放</th></tr></thead><tbody id="guess-table"></tbody></table></div></section></section>
    </main></div>`;
}
function tab4Chart(id,option){const el=$(`#${id}`);if(!el||!window.echarts)return;const c=echarts.getInstanceByDom(el)||echarts.init(el);c.setOption({...option,animationDuration:350});c.resize()}
function tab4Rows(list){return filterDate(list||[])}
function tab4RenderTrafficFinal(){
  const source=Array.isArray(state.data.trafficChannelFunnel)?state.data.trafficChannelFunnel:(Array.isArray(state.data.trafficChannelFunnel?.rows)?state.data.trafficChannelFunnel.rows:[]),dateRows=source.filter(r=>String(r['日期'])===state.end),channels=['全部频道',...new Set(dateRows.map(r=>String(r['频道名称']||'')).filter(Boolean))],select=$('#traffic-channel-filter');
  if(select){const current=select.value||'全部频道';select.innerHTML=channels.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');select.value=channels.includes(current)?current:'全部频道';if(!select.dataset.bound){select.dataset.bound='1';select.addEventListener('change',tab4RenderTrafficFinal)}}
  const selected=select?.value||'全部频道',selectedRows=selected==='全部频道'?dateRows:dateRows.filter(r=>r['频道名称']===selected),sum=key=>selectedRows.reduce((n,r)=>n+(Number(r[key])||0),0),rateKeys=[['首页进入→频道点击转化率','首页进入频道页UV'],['频道点击→详情播放转化率','频道页内容点击UV'],['详情播放→5分钟有效播放转化率','详情播放UV'],['5分钟有效播放→有效播放转化率','播放超过5分钟UV']],weightedRate=(rateKey,weightKey)=>{const total=selectedRows.reduce((n,r)=>n+(Number(r[weightKey])||0),0);return total?selectedRows.reduce((n,r)=>n+(normalizeTab4Rate(r[rateKey])||0)*(Number(r[weightKey])||0),0)/total:null},cur=selected==='全部频道'?{'首页进入频道页UV':sum('首页进入频道页UV'),'频道页内容点击UV':sum('频道页内容点击UV'),'详情播放UV':sum('详情播放UV'),'播放超过5分钟UV':sum('播放超过5分钟UV'),'有效播放UV':sum('有效播放UV'),...Object.fromEntries(rateKeys.map(([key,weight])=>[key,weightedRate(key,weight)]))}:(selectedRows[0]||{}),steps=[['首页进入频道页UV','首页进入频道页UV',null],['频道页内容点击UV','频道页内容点击UV','首页进入→频道点击转化率'],['详情播放UV','详情播放UV','频道点击→详情播放转化率'],['播放超过5分钟UV','播放超过5分钟UV','详情播放→5分钟有效播放转化率'],['有效播放UV','有效播放UV','5分钟有效播放→有效播放转化率']],conversion=(r,key)=>r[key]==null?null:normalizeTab4Rate(r[key]);
  const note=$('#traffic-funnel-note');if(note)note.textContent=selected==='全部频道'?'全部频道为各频道 UV 合计，非跨频道去重用户数':'当前展示所选频道的原始 UV 与接口转化率';
  $('#traffic-chain').innerHTML=steps.map((x,i)=>{const nextRate=x[2]?conversion(cur,x[2]):null;return `<article class="tab4-funnel-node"><div class="tab4-funnel-step"><b>0${i+1}</b><span>${x[0]}</span></div><strong>${tab4Field(cur,x[1])}</strong><div class="tab4-funnel-rate"><small>${nextRate==null?'最终层':'到下一层转化率'}</small><em>${nextRate==null?'--':tab4Pct(nextRate)}</em></div></article>`}).join('');
  const ranked=dateRows.slice().sort((a,b)=>(Number(b['首页进入频道页UV'])||0)-(Number(a['首页进入频道页UV'])||0));
  $('#channel-table').innerHTML=ranked.map(r=>{const clickRate=conversion(r,'首页进入→频道点击转化率'),detailRate=conversion(r,'频道点击→详情播放转化率'),fiveRate=conversion(r,'详情播放→5分钟有效播放转化率');return `<tr><td><b>${esc(r['频道名称'])}</b></td><td class="tab4-primary-value">${tab4Value(r['首页进入频道页UV'])}</td><td>${tab4Pct(clickRate)}</td><td>${tab4Pct(detailRate)}</td><td>${tab4Pct(fiveRate)}</td></tr>`}).join('')||'<tr><td colspan="5" class="empty">暂无真实数据</td></tr>';
  const chartRows=ranked.slice(0,10).reverse();tab4Chart('channel-chart',{grid:{left:110,right:34,top:24,bottom:34,containLabel:true},tooltip:{trigger:'item',formatter:p=>{const r=ranked.find(x=>x['频道名称']===p.name)||{};return `<b>${esc(r['频道名称']||p.name)}</b><br/>首页进入频道页UV：${fmt(r['首页进入频道页UV'])}<br/>首页进入→频道点击：${tab4Pct(conversion(r,'首页进入→频道点击转化率'))}<br/>频道点击→详情播放：${tab4Pct(conversion(r,'频道点击→详情播放转化率'))}<br/>详情播放→5分钟：${tab4Pct(conversion(r,'详情播放→5分钟有效播放转化率'))}`}},xAxis:{type:'value',axisLabel:{color:'#8191a6'},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',data:chartRows.map(r=>r['频道名称']||'暂无频道'),axisLabel:{color:'#526781'}},series:[{name:'首页进入频道页UV',type:'bar',barMaxWidth:26,data:chartRows.map((r,i)=>({value:Number(r['首页进入频道页UV'])||0,itemStyle:{color:i<3?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',formatter:p=>fmt(p.value),color:'#40536d'}}]});
}
function tab4RenderResourcesFinal(){
  const sections=tab4Rows(state.data.sections).filter(r=>r.date===state.end&&r.application_name==='新人人视频').sort((a,b)=>(Number(b.click_ctr_uv)||0)-(Number(a.click_ctr_uv)||0));
  $('#section-table').innerHTML=sections.map(r=>`<tr><td>${esc(r.board_name)}</td><td>${esc(r.sub_board_name)}</td><td>${tab4Field(r,'exposure_pv')}</td><td>${tab4Field(r,'exposure_uv')}</td><td>${tab4Field(r,'click_pv')}</td><td>${tab4Field(r,'click_uv')}</td><td>${tab4Pct(r.click_ctr_uv)}</td><td>${tab4Text.noData}</td><td>${tab4Field(r,'risk_level')}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">暂无真实数据</td></tr>';
  const sr=sections.slice(0,10).reverse();tab4Chart('section-chart',{grid:{left:130,right:30,top:18,bottom:32,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>tab4Pct(v)},xAxis:{type:'value',axisLabel:{formatter:v=>`${Math.round(v*100)}%`}},yAxis:{type:'category',data:sr.map(r=>r.board_name||'暂无板块')},series:[{name:'点击率',type:'bar',data:sr.map((r,i)=>({value:Number(r.click_ctr_uv)||0,itemStyle:{color:i<3?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',formatter:p=>tab4Pct(p.value)}}]});
  const banners=tab4Rows(state.data.banners).filter(r=>r.date===state.end).sort((a,b)=>(Number(b.ctr_uv)||0)-(Number(a.ctr_uv)||0));
  $('#banner-table').innerHTML=banners.slice(0,30).map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.banner_position)}</td><td>${tab4Text.noData}</td><td>${esc(r.channel)}</td><td>${tab4Field(r,'exposure_pv')}</td><td>${tab4Field(r,'exposure_uv')}</td><td>${tab4Field(r,'click_pv')}</td><td>${tab4Field(r,'click_uv')}</td><td>${tab4Pct(r.ctr_uv)}</td><td>${tab4Text.noData}</td><td>${tab4Text.noData}</td></tr>`).join('')||'<tr><td colspan="11" class="empty">暂无真实数据</td></tr>';
  const br=banners.slice(0,10).reverse();tab4Chart('banner-chart',{grid:{left:150,right:30,top:18,bottom:32,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>tab4Pct(v)},xAxis:{type:'value',axisLabel:{formatter:v=>`${Math.round(v*100)}%`}},yAxis:{type:'category',data:br.map(r=>(r.title||'暂无标题').slice(0,22))},series:[{name:'CTR',type:'bar',data:br.map((r,i)=>({value:Number(r.ctr_uv)||0,itemStyle:{color:i<3?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',formatter:p=>tab4Pct(p.value)}}]});
}
function tab4RenderGuessFinal(){
  const rows=tab4Rows(state.data.guess).filter(r=>r.date===state.end),cur=latest(rows),metrics=[['内容点击UV','content_click_uv'],['播放UV','play_uv'],['播放超过5分钟UV','play_over_5m_uv'],['有效播放UV','effective_play_uv']];
  $('#guess-kpis').innerHTML=metrics.map(x=>`<article class="kpi-card tab4-kpi"><label>${x[0]}</label><strong>${tab4Field(cur,x[1])}</strong><small>真实UV字段</small></article>`).join('');
  const series=[['点击UV','content_click_uv','#2f76e8'],['播放UV','play_uv','#159a70'],['有效播放UV','effective_play_uv','#7c6fe8']],all=tab4Rows(state.data.guess).sort((a,b)=>String(a.date).localeCompare(String(b.date))),dates=[...new Set(all.map(r=>r.date))];
  tab4Chart('guess-chart',{legend:{data:series.map(s=>s[0]),textStyle:{color:'#65758d'}},grid:{left:58,right:24,top:38,bottom:32,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>fmt(v)},xAxis:{type:'category',data:dates.map(d=>String(d).slice(5))},yAxis:{type:'value',axisLabel:{color:'#8191a6'},splitLine:{lineStyle:{color:'#e7eef6'}}},series:series.map(s=>({name:s[0],type:'line',smooth:.2,symbol:'circle',symbolSize:4,data:dates.map(d=>{const r=all.find(x=>x.date===d);return r?.[s[1]]??null}),lineStyle:{width:3,color:s[2]},itemStyle:{color:s[2]},areaStyle:{color:s[2]+'14'}}))});
  const pv=tab4Rows(state.data.guessPv).filter(r=>r.date===state.end),p=latest(pv);$('#guess-table').innerHTML=`<tr><td>猜你喜欢</td><td>${tab4Field(p,'content_exposure_pv',true)}</td><td>${tab4Field(cur,'content_exposure_uv')}</td><td>${tab4Field(p,'content_click_pv',true)}</td><td>${tab4Field(cur,'content_click_uv')}</td><td>${tab4Field(cur,'play_uv')}</td><td>${tab4Field(cur,'effective_play_uv')}</td></tr>`;
}
function tab4RenderResourcesWithMoM(){
  const source=tab4Rows(state.data.sections);
  const dates=[...new Set(source.map(r=>String(r.date||'')))].filter(Boolean).sort();
  const currentDate=dates.filter(d=>d<=state.end).at(-1)||dates.at(-1);
  const previousDate=dates.filter(d=>d<currentDate).at(-1);
  const current=source.filter(r=>r.date===currentDate&&r.application_id==='22');
  const previous=source.filter(r=>r.date===previousDate&&r.application_id==='22');
  const key=r=>`${r.board_name||''}\u0000${r.sub_board_name||''}\u0000${r.client||''}`;
  const prior=new Map(previous.map(r=>[key(r),r]));
  const change=(now,old)=>old==null||Number(old)===0||now==null?null:(Number(now)-Number(old))/Number(old);
  const rows=current.map(r=>({...r,ctr_mom:change(normalizeTab4Rate(r.click_ctr_uv),normalizeTab4Rate(prior.get(key(r))?.click_ctr_uv))})).sort((a,b)=>(Number(b.click_ctr_uv)||0)-(Number(a.click_ctr_uv)||0));
  const rateChange=v=>v==null?tab4Text.noData:`${v>=0?'↑':'↓'} ${(Math.abs(v)*100).toFixed(1)}%`;
  const head=document.querySelector('#page-home [data-route-view="home-sections"] thead tr');
  if(head)head.innerHTML='<th>板块名称</th><th>子板块名称</th><th>曝光PV</th><th>曝光UV</th><th>点击PV</th><th>点击UV</th><th>转化率</th><th>转化率环比</th>';
  const body=document.querySelector('#section-table');
  if(body)body.innerHTML=rows.map(r=>`<tr><td>${esc(r.board_name)}</td><td>${esc(r.sub_board_name)}</td><td>${tab4Field(r,'exposure_pv')}</td><td>${tab4Field(r,'exposure_uv')}</td><td>${tab4Field(r,'click_pv')}</td><td>${tab4Field(r,'click_uv')}</td><td>${tab4Pct(r.click_ctr_uv)}</td><td>${rateChange(r.ctr_mom)}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">暂无真实数据</td></tr>';
  const panel=document.querySelector('#page-home [data-route-view="home-sections"] .tab4-panel');
  const note=panel?.querySelector('.tab4-panel-head p');if(note)note.textContent=`${currentDate||'--'} 对比 ${previousDate||'--'}，转化率按点击UV/曝光UV展示`;
  const sr=rows.slice(0,10).reverse();
  tab4Chart('section-chart',{grid:{left:130,right:34,top:18,bottom:32,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>tab4Pct(v)},xAxis:{type:'value',axisLabel:{formatter:v=>tab4Pct(v)}},yAxis:{type:'category',data:sr.map(r=>r.board_name||'暂无板块')},series:[{name:'转化率',type:'bar',data:sr.map((r,i)=>({value:normalizeTab4Rate(r.click_ctr_uv)||0,itemStyle:{color:i<3?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',formatter:p=>tab4Pct(p.value)}}]});
  const banners=tab4Rows(state.data.banners).filter(r=>r.date===state.end).sort((a,b)=>(Number(b.ctr_uv)||0)-(Number(a.ctr_uv)||0));
  const bannerBody=document.querySelector('#banner-table');
  if(bannerBody)bannerBody.innerHTML=banners.slice(0,30).map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.banner_position)}</td><td>${tab4Text.noData}</td><td>${esc(r.channel)}</td><td>${tab4Field(r,'exposure_pv')}</td><td>${tab4Field(r,'exposure_uv')}</td><td>${tab4Field(r,'click_pv')}</td><td>${tab4Field(r,'click_uv')}</td><td>${tab4Pct(r.ctr_uv)}</td><td>${tab4Text.noData}</td><td>${tab4Text.noData}</td></tr>`).join('')||'<tr><td colspan="11" class="empty">暂无真实数据</td></tr>';
  const br=banners.slice(0,10).reverse();
  tab4Chart('banner-chart',{grid:{left:150,right:30,top:18,bottom:32,containLabel:true},tooltip:{trigger:'axis',valueFormatter:v=>tab4Pct(v)},xAxis:{type:'value',axisLabel:{formatter:v=>tab4Pct(v)}},yAxis:{type:'category',data:br.map(r=>(r.title||'暂无标题').slice(0,22))},series:[{name:'CTR',type:'bar',data:br.map((r,i)=>({value:normalizeTab4Rate(r.ctr_uv)||0,itemStyle:{color:i<3?'#4f8fce':'#a9c9e8'}})),label:{show:true,position:'right',formatter:p=>tab4Pct(p.value)}}]});
}
tab4RenderResourcesFinal=tab4RenderResourcesWithMoM;
function setupTab4(){const host=$('#page-home');if(!host||host.dataset.tab4Events)return;host.dataset.tab4Events='1';const tree=document.querySelector('#tab4-sidebar-tree');tree.className='tab4-sidebar-tree tab4-sidebar-visible';tree.innerHTML='<div class="tab4-sidebar-group"><button class="tab4-module-item active" type="button" data-module="traffic">流量入口</button></div><div class="tab4-sidebar-group"><button class="tab4-module-item" type="button" data-module="resources">资源位分析</button></div><div class="tab4-sidebar-group"><button class="tab4-module-item" type="button" data-module="guess">猜你喜欢</button></div>';const routes={traffic:'channel-funnel',resources:'home-sections',guess:'guess-trend'};const moduleFor=route=>route.startsWith('channel')?'traffic':route==='home-sections'||route==='banner'?'resources':'guess';const renderRoute=route=>{const module=moduleFor(route);tree.querySelectorAll('[data-module]').forEach(x=>x.classList.toggle('active',x.dataset.module===module));host.querySelectorAll('.tab4-inline-tabs').forEach(x=>x.classList.toggle('active',x.dataset.tabGroup===module));host.querySelectorAll('.tab4-inline-tabs [data-route]').forEach(x=>x.classList.toggle('active',x.dataset.route===route));host.querySelectorAll('[data-route-view]').forEach(x=>x.classList.toggle('active',x.dataset.routeView===route));state.tab4Route=route;tab4RenderTrafficFinal();tab4RenderResourcesFinal();tab4RenderGuessFinal();deferResize()};tree.querySelectorAll('[data-module]').forEach(btn=>btn.addEventListener('click',()=>{renderRoute(routes[btn.dataset.module])}));host.querySelectorAll('.tab4-inline-tabs [data-route]').forEach(btn=>btn.addEventListener('click',()=>renderRoute(btn.dataset.route)));renderRoute(state.tab4Route||'channel-funnel')}
const tab4RenderPageBase=renderPage;renderPage=function(){if(state.page==='home')buildTab4();tab4RenderPageBase();if(state.page==='home')setupTab4()};
bind=function(){$$('.nav-item').forEach(b=>b.addEventListener('click',()=>{state.page=b.dataset.page;renderPage()}));document.addEventListener('click',e=>{const b=e.target.closest('.detail-toggle');if(!b)return;const target=$(`#${b.dataset.target}`);if(!target)return;const collapsed=target.classList.toggle('detail-collapsed');b.textContent=collapsed?'查看明细':'收起明细';deferResize()});window.addEventListener('resize',resizeCharts)};
const tab4DirectPage=renderPage;renderPage=function(){
  document.querySelector('#tab4-sidebar-tree')?.classList.toggle('tab4-sidebar-visible',state.page==='home');
  if(state.page!=='home'){tab4DirectPage();return}
  document.querySelector('#client-filter')?.classList.add('tab4-client-hidden');
  buildTab4();
  $$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-home'));
  setText('page-title','首页流量与转化漏斗');
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page==='home'));
  tab4RenderTrafficFinal();tab4RenderResourcesFinal();tab4RenderGuessFinal();setupTab4();document.querySelector('#tab4-sidebar-tree')?.classList.add('tab4-sidebar-visible');deferResize();
};

// Keep the visible client label aligned with the canonical filter state after
// all layered page renderers have completed.
const renderPageWithClientLabel=renderPage;
renderPage=function(){
  document.querySelector('#content-sidebar-tree')?.classList.toggle('content-sidebar-visible',state.page==='content'||state.page==='search');
  renderPageWithClientLabel();
  if(state.page==='overview'){
    const activeClient=$('#client-filter .active')?.dataset.client||state.client;
    setText('overview-client',activeClient);
    setTimeout(()=>setText('overview-client',$('#client-filter .active')?.dataset.client||state.client),0);
  }
};

// Keep Tab1 compact: KPI, two scale trends, one quality trend, and the client table.
const renderOverviewCompact=()=>{
  const host=$('#page-overview');if(!host)return;
  host.innerHTML=`<div class="hero-strip"><p class="eyebrow">DAILY HEALTH CHECK</p><h2>先看大盘健康度，再定位趋势异常</h2></div><div class="section-heading"><span>CORE KPI</span><h2>核心指标</h2></div><section class="kpi-grid five" id="overview-kpis"></section><div class="section-heading"><span>TREND ANALYSIS</span><h2>趋势变化</h2><em>近30天</em></div><section class="grid two-col"><article class="panel chart-panel"><div class="panel-head"><h3>设备 DAU 趋势</h3><strong id="dau-current">--</strong></div><div id="dau-chart" class="chart"></div></article><article class="panel chart-panel"><div class="panel-head"><h3>新增设备趋势</h3><strong id="new-current">--</strong></div><div id="new-chart" class="chart"></div></article></section><section class="grid two-col lower"><article class="panel chart-panel"><div class="panel-head"><h3>播放率趋势</h3><span>后台原始播放率字段</span></div><div id="rate-chart" class="chart"></div></article><article class="panel"><div class="panel-head"><h3>客户端明细</h3><span>设备 DAU / 播放率 / 人均播放时长 / 人均播放次数</span></div><div class="table-wrap"><table><thead><tr><th>客户端</th><th>设备 DAU</th><th>播放率</th><th>人均播放时长</th><th>人均播放次数</th></tr></thead><tbody id="client-table"></tbody></table></div></article></section>`;
  const daily=filterDate(state.data.daily),rate=filterDate(state.data.playRate),duration=filterDate(state.data.duration),counts=filterDate(state.data.playCount);
  const cur=latest(daily.filter(r=>r.client===state.client))||latest(daily);
  const du=latest(duration.filter(r=>r.client_type===state.client))?.total_avg_watch_duration;
  const pc=latest(counts.filter(r=>r[state.client]!=null))?.[state.client];
  $('#overview-kpis').innerHTML=[card('设备DAU',cur?.device_dau,'device_dau',lastDelta(daily,'device_dau')),card('新增设备',cur?.new_device,'new_device',lastDelta(daily,'new_device')),card('播放率',cur?.play_rate,'play_rate',lastDelta(daily,'play_rate')),card('人均播放时长',du==null?null:`${Number(du).toFixed(1)} 分钟`,'total_avg_watch_duration',null),card('人均播放次数',pc,'客户端拆分',null)].join('');
  setText('dau-current',fmt(cur?.device_dau));setText('new-current',fmt(cur?.new_device));
  makeLine('#dau-chart',daily.filter(r=>r.client===state.client),'device_dau','设备DAU','#2f76e8');
  makeLine('#new-chart',daily.filter(r=>r.client===state.client),'new_device','新增设备','#159a70');
  makeLine('#rate-chart',rate.filter(r=>r.client===state.client),'play_rate','播放率','#d58b3e',true);
  const clients=TAB1_CLIENTS||['安卓','iOS','M站'];
  $('#client-table').innerHTML=clients.map(c=>{const x=latest(daily.filter(r=>r.client===c)),y=latest(duration.filter(r=>r.client_type===c)),z=latest(counts.filter(r=>r[c]!=null));return `<tr><td>${esc(c)}</td><td>${fmt(x?.device_dau)}</td><td>${pct(x?.play_rate)}</td><td>${y?.total_avg_watch_duration==null?empty:Number(y.total_avg_watch_duration).toFixed(1)+' 分钟'}</td><td>${z?.[c]==null?empty:Number(z[c]).toFixed(3)}</td></tr>`}).join('');
};
// Restore the prior Tab1 composition; keep the compact helper unused for now.
renderOverview=renderOverviewWithTabs;

// Tab1 client comparison has two operational views only:
// scale (DAU) and quality (play rate + average watch duration).
const renderOverviewWithTwoClientTabs=renderOverview;
renderOverview=function(){
  renderOverviewWithTwoClientTabs();
  const host=$('#page-overview');
  const regions=host?.querySelector('.overview-regions');
  if(!regions)return;
  regions.querySelectorAll('.overview-region').forEach((region,index)=>{if(index>2)region.remove()});
  const third=regions.querySelector('.overview-region:nth-child(3)');
  if(!third)return;
  const tabs=third.querySelector('.quick-tabs');
  const chart=third.querySelector('#tab1-client-chart');
  if(!tabs||!chart)return;
  tabs.innerHTML='<button class="quick-tab active" data-client-view="client-dau">设备 DAU</button><button class="quick-tab" data-client-view="client-quality">播放率 + 人均播放时长</button>';
  const daily=filterDate(state.data.daily),duration=filterDate(state.data.duration);
  const clients=['安卓','iOS','M站'];
  const latestDaily=c=>latest(daily.filter(r=>r.client===c));
  const latestDuration=c=>latest(duration.filter(r=>r.client_type===c));
  const draw=kind=>{
    const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.clear();
    const option=kind==='client-dau'
      ? {xAxis:{type:'category',data:clients,axisLabel:{color:'#65758d'}},yAxis:{type:'value',axisLabel:{color:'#667992',formatter:v=>fmt(v)},splitLine:{lineStyle:{color:'#e1e8f1'}}},series:[{name:'设备 DAU',type:'bar',barMaxWidth:48,data:clients.map((x,i)=>({value:latestDaily(x)?.device_dau??null,itemStyle:{color:['#6f9fdd','#6eaf8d','#c4a15b'][i]}})),label:{show:true,position:'top',color:'#40536d',formatter:p=>fmt(p.value)}}]}
      : {legend:{show:true},xAxis:{type:'category',data:clients,axisLabel:{color:'#65758d'}},yAxis:[{type:'value',max:1,axisLabel:{color:'#667992',formatter:v=>pct(v)},splitLine:{lineStyle:{color:'#e1e8f1'}}},{type:'value',axisLabel:{color:'#667992',formatter:v=>Number(v).toFixed(1)}}],series:[{name:'播放率',type:'bar',barMaxWidth:42,data:clients.map((x,i)=>({value:latestDaily(x)?.play_rate??null,itemStyle:{color:['#6f9fdd','#6eaf8d','#c4a15b'][i]}})),label:{show:true,position:'top',color:'#40536d',formatter:p=>pct(p.value)}},{name:'人均播放时长',type:'line',yAxisIndex:1,data:clients.map(x=>latestDuration(x)?.total_avg_watch_duration??null),symbol:'circle',symbolSize:8,lineStyle:{width:3,color:'#d58b3e'},itemStyle:{color:'#d58b3e'},label:{show:true,formatter:p=>Number(p.value).toFixed(1)}}]};
    c.setOption({tooltip:{trigger:'axis'},animationDuration:360,grid:{left:62,right:62,top:40,bottom:38,containLabel:true},...option},true);c.resize();
  };
  draw('client-dau');
  tabs.querySelectorAll('[data-client-view]').forEach(button=>button.addEventListener('click',()=>{tabs.querySelectorAll('.quick-tab').forEach(x=>x.classList.toggle('active',x===button));draw(button.dataset.clientView)}));
};

// Final Tab1 presentation guard: replace any legacy layered output with the
// approved three-region layout and two client-comparison views.
const renderPageBeforeTab1Final=renderPage;
renderPage=function(){
  renderPageBeforeTab1Final();
  if(state.page!=='overview')return;
  $('#page-overview')?.querySelectorAll('.overview-regions').forEach(region=>region.remove());
  renderOverviewWithTabs();
  const regions=$('#page-overview')?.querySelector('.overview-regions');
  const third=regions?.querySelector('.overview-region:nth-child(3)');
  if(!third)return;
  const tabs=third.querySelector('.quick-tabs'),chart=third.querySelector('#tab1-client-chart');
  if(!tabs||!chart)return;
  tabs.innerHTML='<button class="quick-tab active" data-client-view="client-dau">设备 DAU</button><button class="quick-tab" data-client-view="client-quality">播放率 + 人均播放时长</button>';
  const clients=['安卓','iOS','M站'],daily=filterDate(state.data.daily),duration=filterDate(state.data.duration);
  const draw=kind=>{const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.clear();const latestDaily=x=>latest(daily.filter(r=>r.client===x)),latestDuration=x=>latest(duration.filter(r=>r.client_type===x));const option=kind==='client-dau'?{xAxis:{type:'category',data:clients},yAxis:{type:'value',axisLabel:{formatter:v=>fmt(v)}},series:[{name:'设备 DAU',type:'bar',data:clients.map(x=>latestDaily(x)?.device_dau??null),label:{show:true,position:'top',formatter:p=>fmt(p.value)}}]}:{legend:{show:true},xAxis:{type:'category',data:clients},yAxis:[{type:'value',max:1,axisLabel:{formatter:v=>pct(v)}},{type:'value',axisLabel:{formatter:v=>Number(v).toFixed(1)}}],series:[{name:'播放率',type:'bar',data:clients.map(x=>latestDaily(x)?.play_rate??null),label:{show:true,position:'top',formatter:p=>pct(p.value)}},{name:'人均播放时长',type:'line',yAxisIndex:1,data:clients.map(x=>latestDuration(x)?.total_avg_watch_duration??null),label:{show:true,formatter:p=>Number(p.value).toFixed(1)}}]};c.setOption({tooltip:{trigger:'axis'},animationDuration:360,grid:{left:62,right:62,top:40,bottom:38,containLabel:true},...option},true);c.resize()};
  draw('client-dau');
  tabs.querySelectorAll('.quick-tab').forEach(button=>button.addEventListener('click',()=>{tabs.querySelectorAll('.quick-tab').forEach(x=>x.classList.toggle('active',x===button));draw(button.dataset.clientView)}));
};


// Tab1 operations presentation: two primary analysis dimensions share one
// display slot, while the client comparison remains an independent region.
function polishTab1Charts(){
  if(!window.echarts)return;
  const label='#253b59';
  const update=(id,series)=>{const el=$(`#${id}`),chart=el&&echarts.getInstanceByDom(el);if(!chart)return;chart.setOption({textStyle:{color:label},series},false);chart.resize()};
  update('tab1-scale-chart',[{itemStyle:{color:'#2f76e8'},label:{color:label}},{lineStyle:{width:3,color:'#159a70'},itemStyle:{color:'#159a70'},areaStyle:{color:'#159a7014'}}]);
  update('tab1-rate-chart',[{lineStyle:{width:3,color:'#b07f43'},itemStyle:{color:'#b07f43'},areaStyle:{color:'#b07f4312'}}]);
  update('tab1-depth-chart',[{lineStyle:{width:3,color:'#7569a8'},itemStyle:{color:'#7569a8'},areaStyle:{color:'#7569a812'}},{itemStyle:{color:'#b9c9da'},label:{color:label}}]);
  update('overview-scale-combo',[{itemStyle:{color:'#2f76e8'},label:{color:label}},{lineStyle:{width:3,color:'#159a70'},itemStyle:{color:'#159a70'}}]);
  update('overview-depth-combo',[{itemStyle:{color:'#2f7d4a',borderRadius:[4,4,0,0]},label:{color:label}},{lineStyle:{width:3,color:'#d58b3e'},itemStyle:{color:'#d58b3e'}},{lineStyle:{width:3,type:'dashed',color:'#3b82c4'},itemStyle:{color:'#3b82c4'}}]);
  const clientEl=$('#tab1-client-chart')||$('#overview-client-combo'),client=clientEl&&echarts.getInstanceByDom(clientEl);
  if(client){
    const option=client.getOption(),series=(option.series||[]).map((item,index)=>item.type==='bar'?{data:(item.data||[]).map((value,i)=>({value:typeof value==='object'?value.value:value,itemStyle:{color:['#a9c8eb','#b8d7cb','#e4d0a9'][i]}})),label:{color:label}}:{lineStyle:{width:3,color:index===1?'#4e9475':'#b07f43'},itemStyle:{color:index===1?'#4e9475':'#b07f43'}});
    client.setOption({textStyle:{color:label},series},false);client.resize();
  }
}

function enhanceTab1ForOperations(){
  const host=$('#page-overview'),regions=host?.querySelector('.overview-regions');if(!regions)return;
  const cards=[...regions.querySelectorAll(':scope > .overview-region')];if(cards.length!==3)return;
  const [scale,depth,clients]=cards;
  regions.querySelector('.tab1-analysis-switch')?.remove();
  const tabs=document.createElement('div');
  tabs.className='analysis-tabs tab1-analysis-switch';
  tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','大盘分析维度');
  tabs.innerHTML='<button class="analysis-tab" type="button" role="tab" data-tab1-analysis="scale">用户规模趋势分析</button><button class="analysis-tab" type="button" role="tab" data-tab1-analysis="depth">用户消费深度分析</button>';
  regions.insertBefore(tabs,scale);
  scale.classList.add('tab1-primary-view');scale.dataset.tab1Panel='scale';
  depth.classList.add('tab1-primary-view');depth.dataset.tab1Panel='depth';
  clients.classList.add('tab1-client-region');
  const clientIndex=clients.querySelector('.region-index');if(clientIndex)clientIndex.textContent='02';
  const clientSource=clients.querySelector('.region-source');if(clientSource)clientSource.textContent='设备 DAU · 播放率 · 人均播放时长';
  const activate=view=>{
    state.tab1Analysis=view;
    tabs.querySelectorAll('[data-tab1-analysis]').forEach(button=>{const active=button.dataset.tab1Analysis===view;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
    [scale,depth].forEach(panel=>panel.classList.toggle('active',panel.dataset.tab1Panel===view));
    requestAnimationFrame(()=>{polishTab1Charts();const active=regions.querySelector('.tab1-primary-view.active');active?.querySelectorAll('.composition-chart').forEach(el=>echarts.getInstanceByDom(el)?.resize())});
  };
  tabs.querySelectorAll('[data-tab1-analysis]').forEach(button=>button.addEventListener('click',()=>activate(button.dataset.tab1Analysis)));
  clients.querySelectorAll('[data-client-view]').forEach(button=>button.addEventListener('click',()=>setTimeout(polishTab1Charts,0)));
  depth.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setTimeout(polishTab1Charts,0)));
  activate(state.tab1Analysis||'scale');
  polishTab1Charts();
}

const renderPageBeforeTab1Operations=renderPage;
renderPage=function(){
  renderPageBeforeTab1Operations();
  if(state.page==='overview')enhanceTab1ForOperations();
};

const renderPageBeforeSearchLabels=renderPage;
renderPage=function(){
  renderPageBeforeSearchLabels();
  if(state.page==='search'){
    const tabs=$$('.hot-tabs .analysis-tab');
    const newTab=tabs.find(button=>button.dataset.hotType==='new');
    const addedTab=tabs.find(button=>button.dataset.hotType==='old');
    if(newTab)newTab.textContent='新榜';
    if(addedTab){addedTab.textContent='新增用户榜';addedTab.title='暂无独立真实数据';}
  }
};

// Popup analysis is a single scrollable page, matching Banner click layout.
const renderPopupPageTabbed=renderPopupPage;
renderPopupPage=function(){
  renderPopupPageTabbed();
  const tabs=$$('.popup-sub-tabs button');
  tabs.forEach(button=>{button.classList.remove('active');button.setAttribute('aria-selected','false')});
  $$('.popup-panel').forEach(panel=>panel.classList.add('active'));
  renderPopupOverview();
  renderPopupRanking();
  renderPopupDetail();
};
function popupRankRows(){return popupMergedRows().filter(r=>r.date===popupViewState.date)}
function popupMergedRows(){
  const groups=new Map();
  rows(state.data.popupWindow||[]).forEach(r=>{const date=popupDate(r),name=String(r.name||'').trim();if(!date||!name)return;const key=date+'\u0000'+name;const item=groups.get(key)||{date,name,id:r.id,expost_pv:0,expost_uv:0,click_pv:0,click_uv:0,jump_pv:0,jump_uv:0,play_pv:0,play_uv:0};['expost_pv','expost_uv','click_pv','click_uv','jump_pv','jump_uv','play_pv','play_uv'].forEach(k=>item[k]+=popupNum(r[k])||0);groups.set(key,item)});
  return [...groups.values()].map(r=>({...r,ctr:r.expost_uv?r.click_uv/r.expost_uv:null,conversion_rate:r.click_uv?r.jump_uv/r.click_uv:null,play_rate:r.jump_uv?r.play_uv/r.jump_uv:null})).sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name,'zh-CN'));
}
renderPopupDetail=function(){const root=$('#popup-detail');if(!root)return;const q=String(popupViewState.search||'').trim().toLowerCase(),source=popupMergedRows().filter(r=>!q||r.name.toLowerCase().includes(q));root.innerHTML=`<div class="popup-toolbar"><label>剧名搜索<input id="popup-detail-search" type="search" placeholder="输入剧名" value="${esc(popupViewState.search)}"></label><button type="button" class="banner-excel-button" id="popup-export-excel">导出 Excel</button><span class="popup-toolbar-note">一天一剧一行 · ${source.length} 条</span></div><section class="panel"><div class="popup-detail-wrap"><table class="popup-table"><thead><tr>${['日期','剧名','曝光PV','曝光UV','点击PV','点击UV','跳转播放PV','跳转播放UV','有效播放PV','有效播放UV','点击率','转化率','有效播放率'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${source.map(r=>`<tr><td>${esc(r.date)}</td><td class="popup-name">${esc(r.name)}</td><td>${fmt(r.expost_pv)}</td><td>${fmt(r.expost_uv)}</td><td>${fmt(r.click_pv)}</td><td>${fmt(r.click_uv)}</td><td>${fmt(r.jump_pv)}</td><td>${fmt(r.jump_uv)}</td><td>${fmt(r.play_pv)}</td><td>${fmt(r.play_uv)}</td><td>${popupRate(r.ctr)}</td><td>${popupRate(r.conversion_rate)}</td><td>${popupRate(r.play_rate)}</td></tr>`).join('')||'<tr><td colspan="13" class="popup-empty">暂无符合条件的数据</td></tr>'}</tbody></table></div></section>`;$('#popup-detail-search')?.addEventListener('input',e=>{popupViewState.search=e.target.value;renderPopupDetail()});$('#popup-export-excel')?.addEventListener('click',()=>{const days=[...new Set(source.map(r=>r.date))].sort().slice(0,4),rows4=source.filter(r=>days.includes(r.date)),header=['日期','剧名','曝光PV','曝光UV','点击PV','点击UV','跳转播放PV','跳转播放UV','有效播放PV','有效播放UV','点击率','转化率','有效播放率'];const html='<table><tr>'+header.map(h=>`<th>${h}</th>`).join('')+'</tr>'+rows4.map(r=>'<tr>'+[r.date,r.name,r.expost_pv,r.expost_uv,r.click_pv,r.click_uv,r.jump_pv,r.jump_uv,r.play_pv,r.play_uv,r.ctr,r.conversion_rate,r.play_rate].map(v=>`<td>${v??''}</td>`).join('')+'</tr>').join('')+'</table>';const blob=new Blob(['\ufeff',html],{type:'application/vnd.ms-excel'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`弹窗明细_上线前4个数据日.xls`;a.click();URL.revokeObjectURL(url)})};
renderPopupOverview=function(){const root=$('#popup-overview');if(!root)return;root.innerHTML=`<section class="panel popup-trend-panel"><div class="panel-head"><div><h3>上线后一周有效播放 UV 趋势</h3><span>搜索剧名后，按真实日期从上线最早一天开始展示</span></div><label>剧名搜索<input id="popup-trend-search" type="search" placeholder="输入剧名"></label></div><div id="popup-trend-chart" class="popup-chart" role="img" aria-label="弹窗上线后一周有效播放UV趋势"></div></section>`;const input=$('#popup-trend-search');input?.addEventListener('input',()=>renderPopupTrend(input.value));renderPopupTrend('')};
function renderPopupTrend(query){const chart=$('#popup-trend-chart');if(!chart)return;const q=String(query||'').trim().toLowerCase();if(!q){chart.innerHTML='<div class="popup-empty">请输入剧名查看上线后一周趋势</div>';return}const all=popupMergedRows().filter(r=>r.name.toLowerCase().includes(q)),name=all[0]?.name||'';if(!name){chart.innerHTML='<div class="popup-empty">未找到匹配的剧名</div>';return}const dates=[...new Set(all.filter(r=>r.name===name).map(r=>r.date))].sort().slice(0,7),data=dates.map(d=>all.find(r=>r.name===name&&r.date===d)?.play_uv??null);popupChart('#popup-trend-chart',{animation:false,grid:{left:60,right:24,top:24,bottom:38,containLabel:true},tooltip:{trigger:'axis',formatter:p=>{const i=p?.[0]?.dataIndex??0,r=all.find(x=>x.name===name&&x.date===dates[i]);return `${esc(name)}<br/>日期：${dates[i]}<br/>有效播放UV：${fmt(r?.play_uv)}<br/>点击UV：${fmt(r?.click_uv)}<br/>点击率：${popupRate(r?.ctr)}`}},xAxis:{type:'category',data:dates},yAxis:{type:'value',axisLabel:{formatter:v=>fmt(v)}},series:[{name:'有效播放UV',type:'line',smooth:true,symbol:'circle',symbolSize:7,data,lineStyle:{width:3,color:'#2f76e8'},itemStyle:{color:'#2f76e8'}}]})}
renderPopupRanking=function(){const root=$('#popup-ranking');if(!root)return;const rows=popupMergedRows(),map=new Map();rows.forEach(r=>{const x=map.get(r.name)||{...r,expost_uv:0,click_uv:0,play_uv:0};x.expost_uv+=r.expost_uv;x.click_uv+=r.click_uv;x.play_uv+=r.play_uv;map.set(r.name,x)});const items=[...map.values()].sort((a,b)=>b.play_uv-a.play_uv).slice(0,10);root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>弹窗有效播放贡献榜</h3><span>按累计有效播放 UV 排序，不按曝光 UV 排序</span></div><strong>${items.length} 个</strong></div><div id="popup-ranking-chart" class="popup-chart" role="img" aria-label="弹窗有效播放贡献榜"></div></section>`;popupChart('#popup-ranking-chart',{animation:false,grid:{left:150,right:60,top:16,bottom:24,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const r=items[items.length-1-(p?.[0]?.dataIndex??0)];return r?`${esc(r.name)}<br/>有效播放UV：${fmt(r.play_uv)}<br/>点击UV：${fmt(r.click_uv)}<br/>点击率：${popupRate(r.click_uv/r.expost_uv)}`:''}},xAxis:{type:'value',axisLabel:{formatter:v=>fmt(v)}},yAxis:{type:'category',data:items.slice().reverse().map(r=>r.name)},series:[{type:'bar',data:items.slice().reverse().map((r,i)=>({value:r.play_uv,itemStyle:{color:i<3?'#2f76e8':'#a8c7e8'}})),label:{show:true,position:'right',formatter:p=>fmt(p.value)}}]})};
renderPopupPage=function(){const host=$('#page-popup');if(!host)return;popupBuild();$$('.page').forEach(page=>page.classList.toggle('active',page===host));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='popup'));const dateInput=$('#popup-date');if(dateInput)dateInput.value=popupViewState.date;$$('.popup-panel').forEach(panel=>panel.classList.add('active'));renderPopupRanking();const rankHead=$('#popup-ranking .panel-head');if(rankHead&&!rankHead.querySelector('.popup-rank-date')){const label=document.createElement('label');label.className='popup-rank-date';label.innerHTML='<span>日期</span><input type="date" value="'+popupViewState.date+'">';label.querySelector('input').addEventListener('change',e=>{popupViewState.date=e.target.value;renderPopupPage()});rankHead.appendChild(label)}renderPopupOverview();renderPopupDetail();const detailToolbar=$('#popup-detail .popup-toolbar');if(detailToolbar&&!detailToolbar.querySelector('.popup-detail-dates')){const box=document.createElement('label');box.className='popup-detail-dates';box.innerHTML='<span>日期范围</span><input type="date"><span>至</span><input type="date">';detailToolbar.appendChild(box)}deferResize()};
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-page="popup"]');if(!button)return;setTimeout(()=>{const host=$('#page-popup');if(!host)return;$$('.popup-panel').forEach(panel=>panel.classList.add('active'));renderPopupOverview();renderPopupRanking();renderPopupDetail();deferResize()},80)});

// Tab4 replacement: channel operations only. This intentionally does not
// reuse the legacy funnel DOM or any derived stage conversion calculations.
const TAB4_OPS_CHANNELS=['精选','电影','美剧','英剧','韩剧','日剧','泰剧','国产剧'];
const TAB4_OPS_METRICS={
  content_click_uv_rate:{label:'影视点击 UV 转化率',field:'content_click_uv_rate',kind:'rate'},
  detail_play_uv_rate:{label:'尝试播放 UV 转化率',field:'detail_play_uv_rate',kind:'rate'},
  play_5_mins_uv_rate:{label:'5 分钟 UV 转化率',field:'play_5_mins_uv_rate',kind:'rate'},
  video_uv_rate:{label:'有效看剧 UV 转化率',field:'video_uv_rate',kind:'rate'}
};
const TAB4_OPS_UV_METRICS={
  tab_click_uv:{label:'频道点击 UV',field:'tab_click_uv'},
  content_click_uv:{label:'影视点击 UV',field:'content_click_uv'},
  detail_play_uv:{label:'尝试播放 UV',field:'detail_play_uv'},
  video_uv:{label:'有效看剧 UV',field:'video_uv'}
};
const tab4OpsData=()=>Array.isArray(state.data.channelOps)?state.data.channelOps:[];
const tab4OpsDates=()=>[...new Set(tab4OpsData().map(r=>String(r.date||'')))].filter(Boolean).sort();
const tab4OpsRow=(date,channel)=>tab4OpsData().find(r=>String(r.date)===date&&r.channel===channel);
const tab4OpsFmtRate=value=>{const n=Number(value);return !Number.isFinite(n)?'--':n<0||n>1?'数据异常':`${(n*100).toFixed(2)}%`};
const tab4OpsRate=value=>{const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1?n:null};
const tab4OpsDelta=(current,previous)=>{const a=Number(current),b=Number(previous);if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return null;return (a-b)/b};
const tab4OpsDeltaText=value=>value==null?'--':`${value>=0?'↑':'↓'} ${(Math.abs(value)*100).toFixed(1)}%`;
const tab4OpsValue=(value,kind)=>kind==='rate'?tab4OpsFmtRate(value):value==null||value===''?'--':fmt(value);
function buildTab4Operations(){
  const host=$('#page-home');if(!host||host.dataset.tab4OperationsBuilt)return;
  host.dataset.tab4OperationsBuilt='1';
  host.innerHTML=`<div class="tab4-ops-heading"><div><span>HOME CHANNEL OPERATIONS</span><h2>首页频道运营分析</h2><p>固定客户端：android_rrsp_xb · 数据来自 dramaConversion 原始字段</p></div><div class="tab4-ops-date"><label>日期范围</label><input id="tab4-ops-start" type="date" aria-label="Tab4开始日期"><span>至</span><input id="tab4-ops-end" type="date" aria-label="Tab4结束日期"></div></div>
  <section class="tab4-ops-filter-note"><span>固定频道</span><b>精选 · 电影 · 美剧 · 英剧 · 韩剧 · 日剧 · 泰剧 · 国产剧</b><em>客户端不可切换</em></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>01</span><h3>核心指标</h3></div><small id="tab4-ops-current-date"></small></div><div id="tab4-ops-core" class="tab4-ops-core"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>02</span><h3>播放转化表现</h3></div><div id="tab4-ops-rate-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-rate-chart" class="tab4-ops-chart"></div><p class="tab4-ops-note">转化率为后台直接提供字段，不在页面重新计算阶段转化率。</p></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>03</span><h3>观看质量</h3></div><small>有效看剧 UV 为独立后台字段，不等同于 5 分钟或 10 分钟播放 UV</small></div><div id="tab4-ops-quality" class="tab4-ops-table"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>04</span><h3>趋势分析</h3></div><div id="tab4-ops-trend-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-trend-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div></section>`;
  const dates=tab4OpsDates(),start=$('#tab4-ops-start'),end=$('#tab4-ops-end');
  start.min=dates[0]||'';start.max=dates.at(-1)||'';end.min=dates[0]||'';end.max=dates.at(-1)||'';
  start.value=state.start&&dates.includes(state.start)?state.start:dates[0]||'';end.value=state.end&&dates.includes(state.end)?state.end:dates.at(-1)||'';
  [start,end].forEach(input=>input.addEventListener('change',()=>{let s=start.value,e=end.value;if(s>e){if(input===start)e=s;else s=e;start.value=s;end.value=e}state.start=s;state.end=e;renderTab4Operations()}));
  buildTab4Operations.rateMetric='play_5_mins_uv_rate';buildTab4Operations.trendMetric='tab_click_uv';
}
function renderTab4OpsTrend(){
  const start=$('#tab4-ops-start'),end=$('#tab4-ops-end');
  if(!start||!end)return;
  const dates=tab4OpsDates(),trendTabs=$('#tab4-ops-trend-tabs');
  trendTabs?.querySelectorAll('[data-trend-metric]').forEach(button=>button.classList.toggle('active',button.dataset.trendMetric===buildTab4Operations.trendMetric));
  const trendMetric=TAB4_OPS_UV_METRICS[buildTab4Operations.trendMetric]||TAB4_OPS_METRICS[buildTab4Operations.trendMetric]||TAB4_OPS_UV_METRICS.tab_click_uv;
  const trendDates=dates.filter(d=>d>=start.value&&d<=end.value),isRate=trendMetric.kind==='rate';
  tab4OpsChart('tab4-ops-trend-chart',{legend:{type:'scroll',top:0,data:TAB4_OPS_CHANNELS},grid:{left:58,right:26,top:36,bottom:34,containLabel:true},tooltip:{trigger:'axis',valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'category',data:trendDates.map(d=>d.slice(5)),boundaryGap:false},yAxis:{type:'value',min:isRate?0:null,max:isRate?1:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},series:TAB4_OPS_CHANNELS.map((channel,index)=>({name:channel,type:'line',smooth:.18,symbol:'circle',symbolSize:4,data:trendDates.map(date=>{const value=tab4OpsRow(date,channel)?.[trendMetric.field];return isRate?tab4OpsRate(value):value??null}),lineStyle:{width:2,color:['#347bd0','#5c9dd7','#70b78a','#d2a14c','#8d75c7','#d57679','#45a9aa','#8b9bb0'][index]},itemStyle:{color:['#347bd0','#5c9dd7','#70b78a','#d2a14c','#8d75c7','#d57679','#45a9aa','#8b9bb0'][index]}}))});
}
function renderTab4Operations(){
  const host=$('#page-home');if(!host)return;buildTab4Operations();
  const data=tab4OpsData(),dates=tab4OpsDates(),start=$('#tab4-ops-start'),end=$('#tab4-ops-end');
  const currentDate=end?.value||dates.at(-1)||'',previousDate=dates.filter(d=>d<currentDate).at(-1)||'';
  const currentRows=TAB4_OPS_CHANNELS.map(channel=>({channel,current:tab4OpsRow(currentDate,channel),previous:tab4OpsRow(previousDate,channel)}));
  setText('tab4-ops-current-date',currentDate?`${currentDate} · 较前一日`:'暂无日期');
  const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];
  $('#tab4-ops-core').innerHTML=core.map(([label,field])=>`<article class="tab4-ops-core-card"><h4>${label}</h4><div>${currentRows.map(({channel,current,previous})=>{const value=current?.[field],delta=tab4OpsDelta(value,previous?.[field]);return `<div class="tab4-ops-core-row"><span>${channel}</span><strong>${fmt(value)}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em></div>`}).join('')}</div></article>`).join('');
  const rateTabs=$('#tab4-ops-rate-tabs');rateTabs.innerHTML=Object.entries(TAB4_OPS_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.rateMetric===key?'active':''}" data-rate-metric="${key}" role="tab">${item.label.replace(' UV 转化率','')}</button>`).join('');
  rateTabs.querySelectorAll('[data-rate-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.rateMetric=button.dataset.rateMetric;renderTab4Operations()}));
  const metric=TAB4_OPS_METRICS[buildTab4Operations.rateMetric]||TAB4_OPS_METRICS.play_5_mins_uv_rate,ranked=currentRows.map(x=>({channel:x.channel,row:x.current,value:tab4OpsRate(x.current?.[metric.field])})).sort((a,b)=>(b.value??-1)-(a.value??-1));
  tab4OpsChart('tab4-ops-rate-chart',{grid:{left:92,right:74,top:18,bottom:26,containLabel:true},tooltip:{trigger:'item',formatter:p=>{const r=ranked[p.dataIndex];return `${r.channel}<br/>${metric.label}：${tab4OpsFmtRate(r.row?.[metric.field])}`}},xAxis:{type:'value',min:0,max:1,axisLabel:{formatter:v=>`${Math.round(v*100)}%`},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',data:ranked.slice().reverse().map(r=>r.channel)},series:[{type:'bar',barMaxWidth:24,data:ranked.slice().reverse().map((r,i)=>({value:r.value,itemStyle:{color:i<3?'#3d82d8':'#a9c7e8'},label:{show:true,position:'right',formatter:p=>p.value==null?'数据异常':`${(p.value*100).toFixed(2)}%`}}))}]});
  $('#tab4-ops-quality').innerHTML=`<table><thead><tr><th>频道</th><th>人均播放时长</th><th>5分钟播放UV</th><th>10分钟播放UV</th><th>有效看剧UV</th></tr></thead><tbody>${currentRows.map(({channel,current})=>`<tr><td>${channel}</td><td>${current?.avg_video_time==null?'--':Number(current.avg_video_time).toFixed(2)}</td><td>${fmt(current?.detail_play_5_mins_uv)}</td><td>${fmt(current?.detail_play_10_mins_uv)}</td><td>${fmt(current?.video_uv)}</td></tr>`).join('')}</tbody></table>`;
  const trendTabs=$('#tab4-ops-trend-tabs');trendTabs.innerHTML=[...Object.entries(TAB4_OPS_UV_METRICS),...Object.entries(TAB4_OPS_METRICS)].map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.trendMetric===key?'active':''}" data-trend-metric="${key}" role="tab">${item.label.replace(' UV','')}</button>`).join('');
  renderTab4OpsTrend();
}
function tab4OpsChart(id,option){const el=$(`#${id}`);if(!el||!window.echarts)return;const chart=echarts.getInstanceByDom(el)||echarts.init(el);chart.setOption(option,true);chart.resize()}
const renderPageBeforeOperationsTab4=renderPage;
renderPage=function(){
  if(state.page!=='home'){renderPageBeforeOperationsTab4();return}
  $('#client-filter')?.classList.add('tab4-client-hidden');
  buildTab4Operations();
  $$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-home'));
  $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='home'));
  setText('page-title','首页频道运营分析');
  renderTab4Operations();
};

// Global chart theme switcher: keeps existing dashboard content intact and only
// swaps all chart colors between a blue palette and a green palette.
const CHART_THEME_STORAGE_KEY='rr-dashboard-chart-theme';
// 剧种占比是分类构成图，始终使用可区分的多色分类色板，不随全局蓝/绿主题变成单色。
const GENRE_PIE_COLORS=['#3478c5','#57a773','#e0a33a','#8066b3','#d66d6d','#35a6a6','#8a9bb0','#c77b3d','#5f8fc1','#70b889'];
const CHART_THEMES={
  blue:{
    label:'深蓝色',
    dot:'#173f73',
    primary:'#173f73',
    primarySoft:'#8aa8c4',
    secondary:'#245a91',
    accent:'#5b7fa8',
    line:'#173f73',
    lineAlt:'#245a91',
    area:'rgba(23,63,115,.16)',
    areaAlt:'rgba(36,90,145,.14)',
    pie:['#173f73','#2f6f3e','#245a91','#4b8a59','#5b7fa8','#6e9b73','#8aa8c4','#91b69a'],
    accents:['#173f73','#2f6f3e','#245a91','#4b8a59','#5b7fa8','#6e9b73','#8aa8c4','#91b69a']
  },
  green:{
    label:'深绿色',
    dot:'#2f6f3e',
    primary:'#2f6f3e',
    primarySoft:'#2f6f3e',
    secondary:'#2f6f3e',
    accent:'#2f6f3e',
    line:'#173f73',
    lineAlt:'#173f73',
    area:'rgba(23,63,115,.08)',
    areaAlt:'rgba(23,63,115,.05)',
    pie:['#2f6f3e','#245a91','#d69e2e','#6e9b73','#5b7fa8','#b7791f','#4b8a59','#8aa8c4'],
    accents:['#2f6f3e','#2f6f3e','#2f6f3e','#2f6f3e','#2f6f3e','#2f6f3e','#2f6f3e','#2f6f3e']
  }
};

state.chartTheme='green';

function activeChartTheme(){return CHART_THEMES[state.chartTheme]||CHART_THEMES.blue}
function enforceGenrePieColors(){
  const dom=$('#category-chart'),chart=dom&&window.echarts?.getInstanceByDom(dom);if(!chart)return;
  const option=chart.getOption(),series=option.series?.[0];if(!series||series.type!=='pie')return;
  const data=(series.data||[]).map((item,index)=>({...item,itemStyle:{...(item.itemStyle||{}),color:GENRE_PIE_COLORS[index%GENRE_PIE_COLORS.length],borderColor:'#fff',borderWidth:1}}));
  chart.setOption({color:GENRE_PIE_COLORS,series:[{data}]},false);chart.resize();
}
function themeColor(index){
  const palette=activeChartTheme();
  return palette.accents[index%palette.accents.length];
}
function comboBarColor(index){
  return activeChartTheme().primary;
}
function comboLineColor(index){
  return '#173f73';
}
function themeArea(index){
  const palette=activeChartTheme();
  return index%2===0?palette.area:palette.areaAlt;
}
function themeBarData(data,index){
  if(!Array.isArray(data))return data;
  return data.map((item,itemIndex)=>{
    const color=itemIndex<3?themeColor(index):itemIndex<7?themeColor(index+1):themeColor(index+2);
    if(item&&typeof item==='object'&&!Array.isArray(item)){
      return {...item,itemStyle:{...(item.itemStyle||{}),color}};
    }
    return {value:item,itemStyle:{color}};
  });
}
function themePieData(data){
  if(!Array.isArray(data))return data;
  const palette=activeChartTheme().pie;
  return data.map((item,index)=>{
    const color=palette[index%palette.length];
    if(item&&typeof item==='object'&&!Array.isArray(item)){
      return {...item,itemStyle:{...(item.itemStyle||{}),color}};
    }
    return {value:item,itemStyle:{color}};
  });
}
function themedSeries(series){
  if(!Array.isArray(series))return [];
  const hasBar=series.some(item=>(Array.isArray(item?.type)?item.type[0]:item?.type)==='bar');
  let barIndex=0,lineIndex=0;
  return series.map((item,index)=>{
    const type=Array.isArray(item?.type)?item.type[0]:item?.type;
    if(type==='line'){
      const color='#173f73';lineIndex++;
      return {
        lineStyle:{...(item.lineStyle||{}),color,width:item?.lineStyle?.width||3},
        itemStyle:{...(item.itemStyle||{}),color},
        areaStyle:item.areaStyle||item.stack?{...(item.areaStyle||{}),color:themeArea(index)}:item.areaStyle
      };
    }
    if(type==='bar'){
      const color=hasBar?comboBarColor(barIndex++):themeColor(index);
      return {
        itemStyle:{...(item.itemStyle||{}),color},
        label:item.label?{...item.label}:item.label,
        data:hasBar
          ? item.data?.map((point,pointIndex)=>{
              const pointColor=pointIndex<3?color:pointIndex<7?comboBarColor(barIndex):comboBarColor(barIndex+1);
              if(point&&typeof point==='object'&&!Array.isArray(point)){
                return {...point,itemStyle:{...(point.itemStyle||{}),color:pointColor}};
              }
              return {value:point,itemStyle:{color:pointColor}};
            })
          : themeBarData(item.data,index)
      };
    }
    if(type==='pie'){
      return {
        itemStyle:{...(item.itemStyle||{}),color:themeColor(index)},
        data:themePieData(item.data)
      };
    }
    if(type==='scatter'||type==='effectScatter'){
      return {
        itemStyle:{...(item.itemStyle||{}),color:themeColor(index)}
      };
    }
    return {
      itemStyle:item?.itemStyle?{...item.itemStyle,color:item.itemStyle.color||themeColor(index)}:item?.itemStyle,
      lineStyle:item?.lineStyle?{...item.lineStyle,color:item.lineStyle.color||themeColor(index)}:item?.lineStyle
    };
  });
}
function applyChartThemeToAll(){
  document.documentElement.setAttribute('data-chart-theme',state.chartTheme);
  if(!window.echarts)return;
  document.querySelectorAll('[id]').forEach(el=>{
    const chart=echarts.getInstanceByDom(el);
    if(!chart)return;
    const option=chart.getOption();
    chart.setOption({
      color:activeChartTheme().pie,
      series:themedSeries(option.series||[])
    },false);
    chart.resize();
  });
  applyThemeDecorations();
  enforceGenrePieColors();
  // Keep the three consumption-depth metrics visually distinct after a theme refresh.
  polishTab1Charts();
  enforceOverviewScaleColors();
}
function applyThemeDecorations(){
  const palette=activeChartTheme().accents;
  const piePalette=activeChartTheme().pie;
  $$('.category-list i, .genre-ratio-item i').forEach((dot,index)=>{
    dot.style.background=piePalette[index%piePalette.length];
  });
  const legendMap={
    blue:palette[0],
    green:palette[1],
    amber:palette[2],
    purple:palette[3],
    slate:palette[4]
  };
  Object.entries(legendMap).forEach(([cls,color])=>{
    $$('.legend-dot.'+cls).forEach(dot=>{dot.style.background=color;});
  });
}
function syncChartThemeControl(){
  const control=$('#chart-theme-select');
  if(!control)return;
  control.value=state.chartTheme;
  const dot=control.closest('.chart-theme-control')?.querySelector('.chart-theme-dot');
  if(dot)dot.style.background=activeChartTheme().dot;
}
function setChartTheme(theme){
  if(theme!=='green'||theme===state.chartTheme)return;
  state.chartTheme=theme;
  try{localStorage.setItem(CHART_THEME_STORAGE_KEY,theme)}catch(_){}
  syncChartThemeControl();
  applyChartThemeToAll();
}
function ensureChartThemeControl(){
  const actions=document.querySelector('.top-actions');
  if(!actions||$('#chart-theme-select'))return;
  const wrap=document.createElement('label');
  wrap.className='chart-theme-control';
  wrap.innerHTML=`<span class="chart-theme-dot" aria-hidden="true"></span><span class="chart-theme-label">图表颜色</span><select id="chart-theme-select" aria-label="图表颜色"><option value="blue">深蓝色</option><option value="green">深绿色</option></select>`;
  actions.appendChild(wrap);
  const select=wrap.querySelector('select');
  select.addEventListener('change',()=>setChartTheme(select.value));
  syncChartThemeControl();
}

// Unified ranking controls for the four operator-facing boards.
const rankingBoardState={
  play:{type:'总榜',date:'',startDate:'',endDate:'',sortKey:'rank',direction:'asc',status:'all',trend:'all'},
  search:{type:'总榜',date:'',startDate:'',endDate:'',sortKey:'search_vv',direction:'desc',status:'all',trend:'all'}
};
const seasonDailyCache=new Map();
const hotRankingApiCache=new Map();
let rankingRenderToken=0;
function rankingAvailableDates(){return [...new Set((state.data.ranking||[]).map(rankingDate).filter(Boolean))].sort()}
function rankingDateShift(value,days){const d=new Date(`${value}T00:00:00`);d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function rankingDateRange(start,end){const dates=[],cursor=new Date(`${start}T00:00:00`),last=new Date(`${end}T00:00:00`);for(;cursor<=last;cursor.setDate(cursor.getDate()+1))dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`);return dates}
async function loadSeasonDay(date){
  if(seasonDailyCache.has(date))return seasonDailyCache.get(date);
  // These files are generated as UTF-8 JSON with the final field names already
  // normalized. Avoid the generic dashboard loader here: its recursive text
  // repair walks every cell and made a single 20k-row day block the UI thread.
  const promise=fetch(`data/season_play_daily/${date}.json`).then(response=>response.ok?response.json():Promise.reject(Error(`season day ${date}`))).then(payload=>Array.isArray(payload)?payload:(payload?.rows||[])).catch(()=>[]);
  seasonDailyCache.set(date,promise);return promise;
}
async function loadHotRankingApi(start,end){
  const key=`${start}|${end}`;
  if(hotRankingApiCache.has(key))return hotRankingApiCache.get(key);
  // 以逐日 seasonPlayVV 文件为主数据源，避免复用可能滞后的服务进程
  // 或其旧缓存；同一份数据同时用于当前周期和上一比较周期。这里保留
  // 全部 season_id 候选，日/周环比筛选必须发生在 Top30 截断之前。
  const promise=Promise.all(rankingDateRange(start,end).map(date=>loadSeasonDay(date).then(rows=>({date,rows})))).then(dayRows=>({rows:seasonDailyViewRows(dayRows)})).catch(error=>{hotRankingApiCache.delete(key);throw error});
  hotRankingApiCache.set(key,promise);return promise;
}
function primarySeasonTitle(seasonId,fallback){const mapped=(state.data.seasonTitleMap||[]).find(row=>String(row.season_id||'').trim()===String(seasonId||'').trim());return String(mapped?.title||fallback||'--').trim()||'--'}
function seasonIdsForTitle(title,dailyRows){
  const wanted=String(title||'').trim();if(!wanted)return [];
  const ids=new Set();
  (dailyRows||[]).forEach(row=>{if(String(row.title||'').trim()===wanted){const id=String(row.season_id||'').trim();if(id)ids.add(id)}});
  return [...ids];
}
function resolveNewUserSeasonId(rawTitle,dailyRows,rawRow){
  const explicit=String(rawRow?.season_id||'').trim();if(explicit)return explicit;
  let candidates=seasonIdsForTitle(rawTitle,dailyRows);
  if(candidates.length>1&&rawRow){
    const region=String(rawRow['聚集类型']||'').trim(),contentType=String(rawRow['内容分类']||'').trim();
    const narrowed=(dailyRows||[]).filter(row=>candidates.includes(String(row.season_id||'').trim())
      &&(!region||String(row.season_type||'').trim()===region)
      &&(!contentType||String(row.season_classify||'').trim()===contentType)
    ).map(row=>String(row.season_id||'').trim());
    candidates=[...new Set(narrowed)];
  }
  // playTop10 is an alias-only interface. Resolve the alias once, then keep
  // season_id as the identity for every downstream operation. An ambiguous
  // alias is intentionally left unresolved instead of merging unrelated IDs.
  return candidates.length===1?candidates[0]:'';
}
function mergeSeasonDailyRows(dayRows){
  const grouped=new Map();
  dayRows.flatMap(item=>item.rows||[]).forEach(row=>{
    const seasonId=String(row.season_id||'').trim();if(!seasonId)return;
    const current=grouped.get(seasonId);const next=current||{season_id:seasonId,title:row.title,season_type:row.season_type,season_classify:row.season_classify,plot_type:row.plot_type,producer_region:row.producer_region,play_count:0,play_uv:0};
    next.play_count+=Number(row.play_count)||0;next.play_uv+=Number(row.play_uv)||0;grouped.set(seasonId,next);
  });
  return [...grouped.values()].map(row=>({...row,title:primarySeasonTitle(row.season_id,row.title)}));
}
function seasonIdsInDays(dayRows){const ids=new Set();dayRows.flatMap(item=>item.rows||[]).forEach(row=>{const id=String(row.season_id||'').trim();if(id)ids.add(id)});return ids}
function seasonDailyViewRows(dayRows){return mergeSeasonDailyRows(dayRows).sort((a,b)=>(Number(b.play_count)||0)-(Number(a.play_count)||0)).map((row,index)=>({...row,rank:index+1}));}
function seasonIdsInTop30(dayRows){
  const daily=new Map();
  dayRows.forEach(item=>(item.rows||[]).forEach(row=>{
    const id=String(row.season_id||'').trim();if(!id)return;
    const key=`${item.date||''}::${id}`,old=daily.get(key),vv=Number(row.play_count)||0;
    if(!old||vv>old.play_count)daily.set(key,{season_id:id,play_count:vv});
  }));
  const totals=new Map();daily.forEach(row=>totals.set(row.season_id,(totals.get(row.season_id)||0)+row.play_count));
  return [...totals.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([id])=>id);
}
function seasonPlaybackTotals(dayRows){
  const totals=new Map();
  dayRows.forEach(item=>{
    const daily=new Map();
    (item.rows||[]).forEach(row=>{
      const id=String(row.season_id||'').trim();if(!id)return;
      const value=Number(row.play_count)||0,old=daily.get(id);
      if(old===undefined||value>old)daily.set(id,value);
    });
    daily.forEach((value,id)=>totals.set(id,(totals.get(id)||0)+value));
  });
  return totals;
}
function seasonPlaybackTotalsByTitle(dayRows){
  const totals=new Map();
  dayRows.forEach(item=>{
    const daily=new Map();
    (item.rows||[]).forEach(row=>{
      const title=String(row.title||'').trim();if(!title)return;
      const value=Number(row.play_count)||0,old=daily.get(title);
      if(old===undefined||value>old)daily.set(title,value);
    });
    daily.forEach((value,title)=>totals.set(title,(totals.get(title)||0)+value));
  });
  return totals;
}
function loadHistoricalHotRankingIds(beforeDate){
  const key=String(beforeDate||'');
  if(!key)return Promise.resolve({ids:new Set(),complete:true});
  if(!window.__hotRankingHistoryCache)window.__hotRankingHistoryCache=new Map();
  const cache=window.__hotRankingHistoryCache;
  if(cache.has(key))return cache.get(key);
  const fallback=()=>{
    const historyDates=rankingAvailableDates().filter(date=>date<key).sort();
    const needed=[...new Set(historyDates.flatMap(date=>[date,rankingDateShift(date,-1),rankingDateShift(date,-7)]))];
    return Promise.all(needed.map(date=>loadSeasonDay(date).then(rows=>({date,rows})))).then(payloads=>{
      const byDate=new Map(payloads.map(item=>[item.date,item.rows||[]])),values=new Map();
      byDate.forEach((rows,date)=>{const daily=new Map();(rows||[]).forEach(row=>{const id=String(row.season_id||'').trim(),value=Number(row.play_count);if(!id||!Number.isFinite(value))return;if(!daily.has(id)||value>daily.get(id))daily.set(id,value)});values.set(date,daily)});
      const ids=new Set();historyDates.forEach(date=>{const current=values.get(date)||new Map(),previous=values.get(rankingDateShift(date,-1))||new Map(),week=values.get(rankingDateShift(date,-7))||new Map();const eligible=[...current.entries()].filter(([id,value])=>Number.isFinite(value)&&previous.has(id)&&Number.isFinite(previous.get(id))&&previous.get(id)!==0&&week.has(id)&&Number.isFinite(week.get(id))&&week.get(id)!==0).sort((a,b)=>b[1]-a[1]);eligible.slice(0,30).forEach(([id])=>ids.add(id))});
      return {ids,complete:true};
    }).catch(()=>({ids:new Set(),complete:false}));
  };
  if(!window.__hotRankingHistoryRowsPromise)window.__hotRankingHistoryRowsPromise=window.__dashboardFetchJson('data/season_hot_ranking_history.json').then(payload=>rows(payload));
  const promise=window.__hotRankingHistoryRowsPromise.then(historyRows=>{
    if(!Array.isArray(historyRows))throw Error('hot ranking history shape');
    const dates=rankingAvailableDates().filter(date=>date<key).sort(),available=new Set(historyRows.map(row=>String(row.date||'').slice(0,10)).filter(Boolean));
    const complete=dates.every(date=>available.has(date)),ids=new Set();
    historyRows.filter(row=>String(row.date||'').slice(0,10)<key).forEach(row=>(row.season_ids||row.ids||[]).forEach(id=>{const value=String(id||'').trim();if(value)ids.add(value)}));
    return {ids,complete};
  }).catch(fallback);
  cache.set(key,promise);return promise;
}
function loadHistoricalNewUserHotRankingIds(beforeDate){
  const key=String(beforeDate||'');
  if(!key)return Promise.resolve({ids:new Set(),complete:true});
  if(!window.__newUserHotRankingHistoryCache)window.__newUserHotRankingHistoryCache=new Map();
  const cache=window.__newUserHotRankingHistoryCache;
  if(cache.has(key))return cache.get(key);
  if(!window.__newUserHotRankingHistoryRowsPromise)window.__newUserHotRankingHistoryRowsPromise=window.__dashboardFetchJson('data/season_new_user_hot_ranking_history.json').then(payload=>rows(payload));
  const promise=window.__newUserHotRankingHistoryRowsPromise.then(historyRows=>{
    if(!Array.isArray(historyRows))throw Error('new-user hot ranking history shape');
    const dates=rankingAvailableDates().filter(date=>date<key).sort(),available=new Set(historyRows.map(row=>String(row.date||'').slice(0,10)).filter(Boolean)),ids=new Set();
    historyRows.filter(row=>String(row.date||'').slice(0,10)<key).forEach(row=>(row.season_ids||row.ids||[]).forEach(id=>{const value=String(id||'').trim();if(value)ids.add(value)}));
    return {ids,complete:dates.every(date=>available.has(date))};
  }).catch(()=>({ids:new Set(),complete:false}));
  cache.set(key,promise);return promise;
}
function manualRankingPlaybackTotals(rowsList,date){
  const byId=new Map(),byTitle=new Map();
  (rowsList||[]).filter(row=>rankingDate(row)===date&&String(row['榜单分类']||'')==='总榜').forEach(row=>{
    const value=Number(row['播放VV']);if(!Number.isFinite(value))return;
    const title=String(row['内容名称']||'').trim(),id=String(row.season_id||row['剧集ID']||'').trim();
    if(title)byTitle.set(title,Math.max(byTitle.get(title)||0,value));
    if(id)byId.set(id,Math.max(byId.get(id)||0,value));
  });
  return {byId,byTitle};
}
function rankingPeriodChange(current,previous){
  const a=Number(current),b=Number(previous);if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return '--';
  const delta=(a-b)/b*100;
  return `${delta>0?'↑':delta<0?'↓':'→'}${Math.abs(delta).toFixed(2)}%`;
}
function rankingDate(row){return String(row?.['日期']??row?.date??'')}
function rankingNumber(value){
  if(value===null||value===undefined||value===''||value==='--')return null;
  const match=String(value).replace(/,/g,'').match(/-?[\d.]+/);
  return match?Number(match[0]):null;
}
function rankingCompare(a,b,key,direction){
  const numericKeys=new Set(['rank','play_uv','play_vv','day_over_day','search_vv','search_uv','day_over_day_pct','week_change']);
  const av=key==='date'?rankingDate(a):numericKeys.has(key)?rankingNumber(a[key]):String(a[key]??'');
  const bv=key==='date'?rankingDate(b):numericKeys.has(key)?rankingNumber(b[key]):String(b[key]??'');
  if(numericKeys.has(key)&&(av===null||bv===null)){
    if(av===null&&bv===null)return 0;
    return av===null?1:-1;
  }
  if(av===null||bv===null){
    if(av===null&&bv===null)return 0;
    return av===null?1:-1;
  }
  const result=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'zh-CN');
  return direction==='desc'?-result:result;
}
function rankingSortButton(label,key,state){
  if(key==='day_over_day'||key==='day_over_day_pct'||key==='week_over_week'||key==='week_change'){
    return `<span class="ranking-change-heading">${label}</span>`;
  }
  const active=state.sortKey===key;
  const direction=active?(state.direction==='asc'?'ascending':'descending'):'';
  const indicator=key==='day_over_day'||key==='day_over_day_pct'?`<span class="sort-triangle ${direction}" aria-hidden="true"><i></i><i></i></span>`:'';
  return `<button type="button" class="ranking-sort-button${active?' active':''}" data-sort-key="${key}" title="按${label}${active&&state.direction==='asc'?'降序':'升序'}排序" aria-label="按${label}${active&&state.direction==='asc'?'降序':'升序'}排序">${label}${indicator}</button>`;
}
function rankingStatusFilter(state){
  // “新入榜” is a row annotation within the displayed Top30.  It is not a
  // separate ranking/filter, so keep the column label without exposing a
  // control that would turn the table into a non-Top30 subset.
  return '<span class="ranking-status-filter-wrap"><span>榜单状态</span></span>';
}
function computedPlaybackChange(row, allRows){
  const existing=String(row?.day_over_day??'').trim();
  if(existing && existing!=='--') return existing;
  const date=rankingDate(row), title=String(row?.title??row?.['内容名称']??'').trim();
  if(!date||!title) return existing||'--';
  const current=Number(row?.play_vv??row?.['播放VV']);
  if(!Number.isFinite(current)) return existing||'--';
  const d=new Date(`${date}T00:00:00`); d.setDate(d.getDate()-1);
  const previousDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const previous=(allRows||[]).find(item=>item['榜单分类']===row.raw?.['榜单分类']&&rankingDate(item)===previousDate&&String(item['内容名称']||'').trim()===title);
  const previousValue=Number(previous?.['播放VV']);
  if(!Number.isFinite(previousValue)||previousValue===0) return '--';
  const change=(current-previousValue)/previousValue*100;
  return `${change>=0?'↑':'↓'}${Math.abs(change).toFixed(2)}%`;
}
function computedRankingStatus(row, allRows){
  const raw=String(row?.raw?.['榜单状态']??row?.['榜单状态']??row?.status??'').trim();
  if(raw==='新入榜')return '新入榜';
  const date=rankingDate(row?.raw||row),title=String(row?.title??row?.['内容名称']??row?.raw?.['内容名称']??'').trim();
  if(!date||!title)return raw||'--';
  const d=new Date(`${date}T00:00:00`);d.setDate(d.getDate()-1);
  const previousDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const category=row?.raw?.['榜单分类']??row?.['榜单分类'];
  const existed=(allRows||[]).some(item=>item['榜单分类']===category&&rankingDate(item)===previousDate&&String(item['内容名称']||'').trim()===title);
  return existed?'--':'新入榜';
}
function rankingToolbar(kind,dates,state){
  const latest=window.__dashboardDefaultDate&&dates.includes(window.__dashboardDefaultDate)?window.__dashboardDefaultDate:dates.at(-1)||'';
  if(!state.date||!dates.includes(state.date))state.date=latest;
  if(!state.startDate||!dates.includes(state.startDate))state.startDate=latest;
  if(!state.endDate||!dates.includes(state.endDate))state.endDate=latest;
  const dateControls=`<label class="ranking-date-control"><span>日期</span><input type="date" data-ranking-date aria-label="选择榜单日期" value="${esc(state.date)}" min="${esc(dates[0]||'')}" max="${esc(latest)}"></label>`;
  return `<div class="ranking-toolbar" data-ranking-kind="${kind}">
    <div class="ranking-segmented" role="tablist" aria-label="榜单类型">
      <button type="button" class="ranking-mode${state.type==='总榜'?' active':''}" data-ranking-type="总榜" role="tab" aria-selected="${state.type==='总榜'}">总榜</button>
      <button type="button" class="ranking-mode${state.type==='新用户榜'?' active':''}" data-ranking-type="新用户榜" role="tab" aria-selected="${state.type==='新用户榜'}">新用户榜</button>
    </div>
    ${dateControls}
  </div>`;
}
function rankingChangeIsIncrease(value){
  const raw=String(value??'').trim();
  if(raw.startsWith('↑')||raw.startsWith('▲'))return true;
  if(raw.startsWith('↓')||raw.startsWith('▼'))return false;
  const number=rankingNumber(value);
  return number!==null&&number>0;
}
function rankingChangeTrend(value){
  const raw=String(value??'').trim();
  if(raw.includes('↑')||raw.includes('▲'))return 'up';
  if(raw.includes('↓')||raw.includes('▼'))return 'down';
  const n=rankingNumber(value);
  if(n===null)return 'na';
  return n>0?'up':n<0?'down':'flat';
}
function rankingChangeMagnitude(value){
  const n=rankingNumber(value);
  return n===null?null:Math.abs(n);
}
function rankingChangeBadge(value){
  const number=rankingNumber(value);
  if(number===null)return '<span class="change-empty">--</span>';
  if(number===0)return '<span class="change-badge change-flat"><span aria-hidden="true">→</span>0%</span>';
  const raw=String(value).trim();
  const positive=rankingChangeIsIncrease(value);
  const amount=Math.abs(number).toFixed(2).replace(/\.00$/,'');
  return `<span class="change-badge ${positive?'change-up':'change-down'}"><span aria-hidden="true">${positive?'↑':'↓'}</span>${amount}%</span>`;
}
function rankBadge(rank){
  const n=Number(rank)||0;
  return `<span class="rank-badge rank-${n<=3?n:'other'} rank-tone-${((n-1)%6)+1}">${esc(rank)}</span>`;
}
function setupRankingBoard(){
  const detail=document.querySelector('#page-content .content-detail');
  const table=document.querySelector('#page-content #ranking-table');
  const head=detail?.querySelector('.panel-head');
  const source=Array.isArray(state.data.ranking)?state.data.ranking:[];
  if(!detail||!table||!head||!source.length)return;
  // renderPage is wrapped by several presentation layers and may schedule
  // setupRankingBoard more than once in the same animation frame. Rebuilding
  // the header in those duplicate passes replaced the select while a user was
  // choosing an option, which made the new-user status filter feel stuck.
  if(detail.dataset.rankingSetup==='1'){
    renderRankingBoard();
    return;
  }
  detail.dataset.rankingSetup='1';
  const dates=[...new Set(source.map(rankingDate).filter(Boolean))].sort();
  let toolbar=detail.querySelector('.ranking-toolbar[data-ranking-kind="play"]');
  if(!toolbar){
    head.querySelector('.content-table-actions')?.remove();
    head.insertAdjacentHTML('beforeend',rankingToolbar('play',dates,rankingBoardState.play));
    toolbar=head.querySelector('.ranking-toolbar[data-ranking-kind="play"]');
    toolbar.addEventListener('click',event=>{
      const mode=event.target.closest('[data-ranking-type]');
      const sort=event.target.closest('[data-sort-key]');
      if(mode){rankingBoardState.play.type=mode.dataset.rankingType;rankingBoardState.play.status='all';rankingBoardState.play.trend='all';renderRankingBoard();}
      if(sort){const key=sort.dataset.sortKey;const current=rankingBoardState.play;if(current.sortKey===key)current.direction=current.direction==='asc'?'desc':'asc';else{current.sortKey=key;current.direction=key==='rank'?'asc':'desc'}renderRankingBoard();}
    });
    toolbar.querySelector('[data-ranking-date]')?.addEventListener('change',event=>{rankingBoardState.play.date=event.target.value;rankingBoardState.play.startDate=event.target.value;rankingBoardState.play.endDate=event.target.value;rankingBoardState.play.status='all';renderRankingBoard()});
  }
  const header=detail.querySelector('thead tr');
  if(header)header.innerHTML=[
    ['排名','rank'],['内容名称','title'],['播放UV','play_uv'],['播放VV','play_vv'],['昨日环比','day_over_day'],['周环比','week_over_week'],['聚集类型','region'],['内容分类','content_type'],['题材标签','tags']
  ].map(([label,key])=>`<th>${rankingSortButton(label,key,rankingBoardState.play)}</th>`).join('')+`<th>${rankingStatusFilter(rankingBoardState.play)}</th>`;
  header?.querySelector('[data-ranking-status]')?.addEventListener('change',event=>{rankingBoardState.play.status=event.target.value;rankingBoardState.play.trend='all';renderRankingBoard()});
  if(header)header.onclick=event=>{
      const changeDirection=event.target.closest('[data-change-direction]');
      if(changeDirection){
        rankingBoardState.play.sortKey=changeDirection.dataset.changeKey||'day_over_day';
        rankingBoardState.play.trend=changeDirection.dataset.changeDirection==='asc'?'up':'down';
        rankingBoardState.play.status='all';
        rankingBoardState.play.direction='desc';
        renderRankingBoard();
      return;
    }
    const sort=event.target.closest('[data-sort-key]');if(!sort)return;
    const key=sort.dataset.sortKey,current=rankingBoardState.play;current.trend='all';
    if(current.sortKey===key)current.direction=current.direction==='asc'?'desc':'asc';else{current.sortKey=key;current.direction=key==='rank'?'asc':'desc'}
    renderRankingBoard();
  };
  renderRankingBoard();
}
function renderRankingBoard(){
  const stateView=rankingBoardState.play;
  const token=++rankingRenderToken;
  const dates=rankingAvailableDates();
  const start=stateView.startDate||stateView.date;
  const end=stateView.endDate||stateView.date;
  if(!start||!end)return;
  if(start>end){stateView.endDate=start;return renderRankingBoard()}
  const isRange=false;
  if(stateView.type==='新用户榜')stateView.date=end;
  const selectedDates=rankingDateRange(start,end).filter(date=>dates.includes(date));
  const periodLength=Math.max(selectedDates.length,1);
  // 比较周期由用户选择的日期决定，不依赖榜单快照索引是否恰好包含
  // 前一日/前一周期；否则单日选择会出现整列环比丢失。
  const previousDates=rankingDateRange(rankingDateShift(start,-periodLength),rankingDateShift(end,-periodLength));
  const allRows=state.data.ranking||[];
  const weekDate=rankingDateShift(end,-7);
  const loadDates=[...new Set([...selectedDates,...previousDates,weekDate])];
  const renderLoading=()=>{const table=document.querySelector('#page-content #ranking-table');if(table)table.innerHTML='<tr><td colspan="10" class="empty">正在加载榜单数据…</td></tr>'};
  renderLoading();
    const rankingDataPromise=stateView.type==='总榜'
      ? Promise.all([loadHotRankingApi(start,end),...previousDates.map(date=>loadSeasonDay(date).then(rows=>({date,rows}))),loadSeasonDay(weekDate).then(rows=>({date:weekDate,rows}))]).then(payloads=>Promise.all([payloads,loadHistoricalHotRankingIds(start)]))
      : Promise.all(loadDates.map(date=>loadSeasonDay(date))).then(payloads=>Promise.all([payloads,loadHistoricalNewUserHotRankingIds(start)]));
  rankingDataPromise.then(([dayPayloads,historyInfo])=>{
    if(token!==rankingRenderToken)return;
    const payloadByDate=stateView.type==='总榜'?new Map():new Map(loadDates.map((date,index)=>[date,dayPayloads[index]]));
    let source=[];
    if(stateView.type==='总榜'){
      const apiPayload=dayPayloads[0]?.data||dayPayloads[0]||{},previousPayloads=dayPayloads.slice(1,-1),previousTotals=seasonPlaybackTotals(previousPayloads),weekTotals=seasonPlaybackTotals([dayPayloads.at(-1)]);
      // 环比按 season_id 找原始播放值；日/周环比筛选放在 Top30 截断前。
      source=(apiPayload.rows||[]).map((row,index)=>{
        const id=String(row.season_id||'').trim(),previousValue=previousTotals.get(id),hasPrevious=previousValue!==undefined&&previousValue!==null;
        const weekValue=weekTotals.get(id),hasWeek=weekValue!==undefined&&weekValue!==null;
        const dayChange=hasPrevious?rankingPeriodChange(row.play_count,previousValue):'--';
        return {...row,raw:row,rank:index+1,date:start,play_vv:row.play_count,play_uv:row.play_uv,region:genreDisplayName(row,state.data.genreMapping||{}),content_type:row.season_classify,tags:row.plot_type,status:'--',day_over_day:dayChange,week_over_week:hasWeek?rankingPeriodChange(row.play_count,weekValue):'--'}
      });
    }else{
      const dailyBySeason=new Map();
      selectedDates.forEach(date=>{
        const dailyRows=payloadByDate.get(date)||[];
        allRows.filter(r=>r['榜单分类']===stateView.type&&rankingDate(r)===date).forEach(r=>{
          const title=String(r['内容名称']||'').trim();
          const seasonId=resolveNewUserSeasonId(title,dailyRows,r);
          if(!seasonId)return;
          const meta=dailyRows.find(item=>String(item.season_id||'').trim()===String(seasonId));
          const vv=Number(r['播放VV'])||0;
          const rawUvValue=r['播放UV'];
          const rawUv=(rawUvValue===null||rawUvValue===undefined||rawUvValue===''||rawUvValue==='--')?NaN:Number(rawUvValue);
          const uv=Number.isFinite(rawUv)?rawUv:(Number(meta?.play_uv)||0);
          const key=`${date}::${seasonId}`,old=dailyBySeason.get(key);
          if(!old||vv>old.play_vv){dailyBySeason.set(key,{raw:r,season_id:seasonId,rank:r['排名'],date,title,play_uv:uv,play_vv:vv,day_over_day:r['昨日环比'],region:meta?genreDisplayName(meta,state.data.genreMapping||{}):r['聚集类型'],content_type:r['内容分类']||meta?.season_classify||'--',tags:r['题材标签']||meta?.plot_type||'--',status:r['榜单状态']||'--'});}
        });
      });
      const aggregated=new Map();
      dailyBySeason.forEach(row=>{
        const old=aggregated.get(row.season_id);
        if(!old)aggregated.set(row.season_id,{...row,play_uv:Number(row.play_uv)||0,play_vv:Number(row.play_vv)||0});
        else{old.play_uv+=(Number(row.play_uv)||0);old.play_vv+=(Number(row.play_vv)||0);if(String(row.status).trim()==='新入榜')old.status='新入榜';}
      });
      source=[...aggregated.values()].map(r=>({...r,title:primarySeasonTitle(r.season_id,r.title),date:isRange?`${start} 至 ${end}`:r.date}));
    }
    if(stateView.type==='新用户榜'){
      const previousDaily=new Map();
      previousDates.forEach(date=>{
        const dailyRows=payloadByDate.get(date)||[];
        allRows.filter(r=>r['榜单分类']===stateView.type&&rankingDate(r)===date).forEach(r=>{
          const id=resolveNewUserSeasonId(r['内容名称'],dailyRows,r);if(!id)return;
          const key=`${date}::${id}`,value=Number(r['播放VV']);if(!Number.isFinite(value))return;const old=previousDaily.get(key);if(old===undefined||value>old)previousDaily.set(key,value);
        });
      });
      const previousTotals=new Map();previousDaily.forEach((value,key)=>{const id=key.split('::')[1];previousTotals.set(id,(previousTotals.get(id)||0)+value)});
      const previousIds=new Set();previousDaily.forEach((_,key)=>previousIds.add(key.split('::')[1]));
      const weekRows=allRows.filter(r=>r['榜单分类']===stateView.type&&rankingDate(r)===weekDate),weekTotals=new Map();weekRows.forEach(r=>{const id=resolveNewUserSeasonId(r['内容名称'],payloadByDate.get(weekDate)||[],r),value=Number(r['播放VV']);if(id&&Number.isFinite(value))weekTotals.set(id,Math.max(weekTotals.get(id)||0,value))});
      source=source.map(row=>{
        // The updater persists verified rings on refreshed rows. Keep those
        // ID-aligned values; older snapshots fall back to the title-resolved
        // historical rows until they are refreshed by the updater.
        const persistedDay=String(row.raw?.['昨日环比']??'').trim(),persistedWeek=String(row.raw?.['周环比']??'').trim();
        return {...row,
          day_over_day:rankingNumber(persistedDay)!==null?persistedDay:(previousIds.has(String(row.season_id))?rankingPeriodChange(row.play_vv,previousTotals.get(String(row.season_id))):'--'),
          week_over_week:rankingNumber(persistedWeek)!==null?persistedWeek:(weekTotals.has(String(row.season_id))?rankingPeriodChange(row.play_vv,weekTotals.get(String(row.season_id))):'--')
        };
      });
      // 新用户榜也必须先满足日环比、周环比，再按播放 VV 取 Top30。
      source=source.filter(row=>rankingNumber(row.day_over_day)!==null&&rankingNumber(row.week_over_week)!==null);
    }
  if(stateView.type==='总榜'){
    const historyIds=historyInfo?.ids||new Set(),historyComplete=historyInfo?.complete!==false;
    // 三个条件是同一层筛选：日环比、周环比都存在后，才按播放 VV
    // 排序并截取 Top30。环比缺失的剧不会被高 VV 提前占位。
    source=source.map(row=>({...row,status:historyComplete&&!historyIds.has(String(row.season_id||'').trim())?'新入榜':'--'}));
    source=source.filter(row=>rankingNumber(row.day_over_day)!==null&&rankingNumber(row.week_over_week)!==null);
  }
  if(stateView.trend!=='all'){
    source=source.filter(r=>rankingChangeTrend(r.day_over_day)===stateView.trend);
  }
  if(stateView.type==='新用户榜'){
    const historyIds=historyInfo?.ids||new Set(),historyComplete=historyInfo?.complete===true;
    source=source.map(row=>({...row,status:historyComplete&&!historyIds.has(String(row.season_id||'').trim())?'新入榜':'--'}));
  }
  source.sort((a,b)=>stateView.trend!=='all'&&stateView.sortKey==='day_over_day'
    ?(rankingChangeMagnitude(b.day_over_day)??-Infinity)-(rankingChangeMagnitude(a.day_over_day)??-Infinity)
    :(stateView.type==='总榜'||stateView.type==='新用户榜')?(Number(b.play_vv)||0)-(Number(a.play_vv)||0):rankingCompare(a,b,stateView.sortKey,stateView.direction));
  source=source.slice(0,30);
  const table=document.querySelector('#page-content #ranking-table');
  if(!table)return;
  source=source.map((row,index)=>({...row,rank:index+1}));
  table.innerHTML=source.map(r=>`<tr><td>${rankBadge(r.rank)}</td><td class="content-name">${esc(r.title)}</td><td class="play-uv-value">${esc(r.play_uv??'--')}</td><td class="vv-value">${fmt(r.play_vv)}</td><td class="change-value">${rankingChangeBadge(r.day_over_day)}</td><td class="change-value">${rankingChangeBadge(r.week_over_week)}</td><td>${esc(r.region??'--')}</td><td>${esc(r.content_type??'--')}</td><td>${esc(r.tags??'--')}</td><td class="${String(r.status).trim()==='新入榜'?'ranking-status-new':''}">${esc(r.status??'--')}</td></tr>`).join('')||'<tr><td colspan="10" class="empty">暂无真实记录</td></tr>';
  document.querySelector('#page-content .content-top10-date')?.replaceChildren(document.createTextNode(`${isRange?`${start} 至 ${end}`:start} · ${stateView.type}`));
  document.querySelectorAll('.ranking-toolbar[data-ranking-kind="play"] .ranking-mode').forEach(button=>{const active=button.dataset.rankingType===stateView.type;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  const dateInput=document.querySelector('.ranking-toolbar[data-ranking-kind="play"] [data-ranking-date]');if(dateInput)dateInput.value=stateView.date;
  const header=document.querySelector('#page-content .content-detail thead tr');if(header)header.querySelectorAll('[data-sort-key]').forEach(button=>{
    const active=button.dataset.sortKey===stateView.sortKey;button.classList.toggle('active',active);
    const indicator=button.querySelector('.sort-triangle');indicator?.classList.toggle('ascending',active&&stateView.direction==='asc');indicator?.classList.toggle('descending',active&&stateView.direction==='desc');
    const label=button.textContent.trim();const action=active&&stateView.direction==='asc'?'降序':'升序';button.title=`按${label}${action}排序`;button.setAttribute('aria-label',`按${label}${action}排序`);
  });
  header?.querySelector('.ranking-change-heading')?.replaceChildren(document.createTextNode('昨日环比'));
  if(header)header.querySelectorAll('[data-change-direction]').forEach(button=>{
    const active=stateView.sortKey==='day_over_day'&&((button.dataset.changeDirection==='asc'&&stateView.trend==='up')||(button.dataset.changeDirection==='desc'&&stateView.trend==='down'));
    button.classList.toggle('active',active);
  });
  }).catch(error=>{
    if(token!==rankingRenderToken)return;
    const table=document.querySelector('#page-content #ranking-table');
    if(table)table.innerHTML=`<tr><td colspan="10" class="empty">榜单数据加载失败，请刷新重试（${esc(error?.message||'请求异常')}）</td></tr>`;
  });
}
function setupSearchRankingBoard(){
  if(state.page!=='search')return;
  const table=document.querySelector('#hot-search-ops-table');
  const region=table?.closest('.search-region');
  if(!table||!region)return;
  if(region.dataset.rankingSetup==='1'){
    renderSearchRankingBoard();
    return;
  }
  region.dataset.rankingSetup='1';
  const all=[...(state.data.hotSearch||[]),...(state.data.newHotSearch||[])];
  const dates=[...new Set(all.map(rankingDate).filter(Boolean))].sort();
  let toolbar=region.querySelector('.ranking-toolbar[data-ranking-kind="search"]');
  if(!toolbar){
    region.querySelector('.hot-tabs')?.remove();
    const grid=region.querySelector('.hot-analysis-grid');
    grid?.insertAdjacentHTML('beforebegin',rankingToolbar('search',dates,rankingBoardState.search));
    toolbar=region.querySelector('.ranking-toolbar[data-ranking-kind="search"]');
    toolbar.addEventListener('click',event=>{
      const mode=event.target.closest('[data-ranking-type]');
      const sort=event.target.closest('[data-sort-key]');
      if(mode){rankingBoardState.search.type=mode.dataset.rankingType;rankingBoardState.search.status='all';rankingBoardState.search.trend='all';renderSearchRankingBoard();}
      if(sort){const key=sort.dataset.sortKey;const current=rankingBoardState.search;if(current.sortKey===key)current.direction=current.direction==='asc'?'desc':'asc';else{current.sortKey=key;current.direction=key==='rank'?'asc':'desc'}renderSearchRankingBoard();}
    });
    toolbar.querySelector('[data-ranking-date]')?.addEventListener('change',event=>{rankingBoardState.search.date=event.target.value;rankingBoardState.search.startDate=event.target.value;rankingBoardState.search.endDate=event.target.value;rankingBoardState.search.status='all';renderSearchRankingBoard()});
  }
  const header=region.querySelector('.hot-table-wrap thead tr');
  updateSearchRankingHeader();
  header?.querySelector('[data-ranking-status]')?.addEventListener('change',event=>{rankingBoardState.search.status=event.target.value;rankingBoardState.search.trend='all';renderSearchRankingBoard()});
  if(header)header.onclick=event=>{
    const changeDirection=event.target.closest('[data-change-direction]');
    if(changeDirection){
      rankingBoardState.search.sortKey=changeDirection.dataset.changeKey||'day_over_day_pct';
      rankingBoardState.search.trend=changeDirection.dataset.changeDirection==='asc'?'up':'down';
      rankingBoardState.search.status='all';
      rankingBoardState.search.direction='desc';
      renderSearchRankingBoard();
      return;
    }
    const sort=event.target.closest('[data-sort-key]');if(!sort)return;
    const key=sort.dataset.sortKey,current=rankingBoardState.search;current.trend='all';
    if(current.sortKey===key)current.direction=current.direction==='asc'?'desc':'asc';else{current.sortKey=key;current.direction=key==='rank'?'asc':'desc'}
    renderSearchRankingBoard();
  };
  renderSearchRankingBoard();
}
function searchPeriodAggregate(rawRows,start,end){
  const grouped=new Map();
  rawRows.filter(r=>{const d=rankingDate(r);return d>=start&&d<=end}).forEach(r=>{
    const display=hotDramaName(r);if(display==='--')return;
    const current=grouped.get(display),vv=Number(r.search_vv??r.search_count)||0,uv=Number(r.search_uv)||0;
    if(!current)grouped.set(display,{raw:r,display_title:display,rank:Number(r.rank)||999,search_vv:vv,search_uv:uv,content_type:r.content_type,producer_region:r.producer_region,genre:r.genre,topic_tag:r.topic_tag});
    else{current.search_vv+=vv;current.search_uv+=uv;if(Number(r.rank)<current.rank){current.rank=Number(r.rank);current.raw=r;}}
  });
  return [...grouped.values()];
}
function renderSearchPeriodBoard(rawRows,start,end,dates,stateView){
  const length=Math.max(rankingDateRange(start,end).filter(d=>dates.includes(d)).length,1),previousStart=rankingDateShift(start,-length),previousEnd=rankingDateShift(end,-length),previous=new Map(searchPeriodAggregate(rawRows,previousStart,previousEnd).map(r=>[r.display_title,r.search_vv]));
  let source=searchPeriodAggregate(rawRows,start,end).map(r=>({...r,day_over_day_pct:'--',week_change:rankingPeriodChange(r.search_vv,previous.get(r.display_title)),status:'--'}));
  if(stateView.trend!=='all')source=source.filter(r=>rankingChangeTrend(r.week_change)===stateView.trend);
  source.sort((a,b)=>rankingCompare(a,b,stateView.sortKey==='day_over_day_pct'?'week_change':stateView.sortKey,stateView.direction));
  source=source.slice(0,30).map((r,i)=>({...r,displayRank:i+1}));
  const table=document.querySelector('#hot-search-ops-table');if(!table)return;
  table.innerHTML=source.map(r=>`<tr><td>${rankBadge(r.displayRank)}</td><td class="content-name">${esc(r.display_title)}</td><td class="vv-value">${fmt(r.search_vv)}</td><td class="search-uv-value">${fmt(r.search_uv)}</td><td class="change-value">${rankingChangeBadge(r.week_change)}</td><td>${esc(r.content_type??'--')}</td><td>${esc(r.producer_region??'--')}</td><td>${esc(r.genre??'--')}</td><td>${esc(r.topic_tag??'--')}</td><td>--</td></tr>`).join('')||'<tr><td colspan="10" class="empty">暂无真实数据</td></tr>';
  updateSearchRankingHeader(true);
  document.querySelector('.ranking-toolbar[data-ranking-kind="search"] [data-ranking-start]')?.setAttribute('value',start);document.querySelector('.ranking-toolbar[data-ranking-kind="search"] [data-ranking-end]')?.setAttribute('value',end);
  document.querySelector('.hot-table-wrap thead .ranking-change-heading')?.replaceChildren(document.createTextNode('昨日环比'));
}
function updateSearchRankingHeader(isRange){
  const region=document.querySelector('.search-region'),header=region?.querySelector('.hot-table-wrap thead tr');if(!header)return;
  header.innerHTML=[['排名','rank'],['剧名','title'],['搜索VV','search_vv'],['搜索UV','search_uv'],['昨日环比','day_over_day_pct'],['周环比','week_change'],['内容类型','content_type'],['地区','producer_region'],['剧种','genre'],['题材标签','topic_tag']].map(([label,sortKey])=>`<th>${rankingSortButton(label,sortKey,rankingBoardState.search)}</th>`).join('')+`<th>${rankingStatusFilter(rankingBoardState.search)}</th>`;
  header.querySelector('[data-ranking-status]')?.addEventListener('change',event=>{rankingBoardState.search.status=event.target.value;rankingBoardState.search.trend='all';renderSearchRankingBoard()});
}
function renderSearchRankingBoard(){
  const stateView=rankingBoardState.search;
  // 热搜总榜与新用户榜统一固定为：两项环比齐全后按搜索 VV 降序取 Top30。
  stateView.sortKey='search_vv';stateView.direction='desc';stateView.trend='all';
  const rawRows=stateView.type==='新用户榜'?(state.data.newHotSearch||[]):(state.data.hotSearch||[]);
  const availableDates=[...new Set(rawRows.map(rankingDate).filter(Boolean))].sort();
  if(!stateView.date||!availableDates.includes(stateView.date))stateView.date=availableDates.at(-1)||state.end;
  stateView.startDate=stateView.date;stateView.endDate=stateView.date;
  if(stateView.sortKey==='week_change')stateView.sortKey='day_over_day_pct';
  const previousDate=[...new Set(rawRows.map(rankingDate).filter(date=>date<stateView.date))].sort().at(-1)||'';
  const weekDate=rankingDateShift(stateView.date,-7),previousWeek=new Map(),previousWeekBySeason=new Map(),previousByDisplay=new Map();
  rawRows.filter(r=>rankingDate(r)===weekDate).forEach(r=>{
    const vv=Number(r.search_vv??r.search_count)||0,display=hotDramaName(r),id=String(r.season_id??'').trim();
    if(display!=='--')previousWeek.set(display,(previousWeek.get(display)||0)+vv);
    if(id)previousWeekBySeason.set(id,(previousWeekBySeason.get(id)||0)+vv);
  });
  const previousTitles=new Set(rawRows.filter(r=>rankingDate(r)===previousDate&&String(r.title||'').trim()).map(r=>String(r.title).trim()));
  // 新入榜按当前展示日期之前的全部Top30历史判断，不按上一天或环比阈值判断。
  const historicalTopSeasonIds=new Set(rawRows.filter(r=>rankingDate(r)<stateView.date&&String(r.season_id??'').trim()).map(r=>String(r.season_id).trim()));
  const previousBySeason=new Map();
  rawRows.filter(r=>rankingDate(r)===previousDate&&String(r.season_id??'').trim()).forEach(r=>{
    const id=String(r.season_id).trim(),vv=Number(r.search_vv??r.search_count)||0;
    previousBySeason.set(id,(previousBySeason.get(id)||0)+vv);
  });
  const previousVV=new Map(rawRows.filter(r=>rankingDate(r)===previousDate&&String(r.title||'').trim()).map(r=>[String(r.title).trim(),Number(r.search_vv??r.search_count)]));
  rawRows.filter(r=>rankingDate(r)===previousDate).forEach(r=>{
    const display=hotDramaName(r);if(display==='--')return;
    const vv=Number(r.search_vv??r.search_count)||0;
    previousByDisplay.set(display,(previousByDisplay.get(display)||0)+vv);
  });
  let source=rawRows.filter(r=>rankingDate(r)===stateView.date).map(r=>{
    const title=String(r.title||'').trim();
    const searchVV=Number(r.search_vv??r.search_count),seasonId=String(r.season_id??'').trim(),displayTitle=hotDramaName(r),oldVV=seasonId&&previousBySeason.has(seasonId)?previousBySeason.get(seasonId):previousByDisplay.get(displayTitle)??previousVV.get(title),fallbackChange=Number.isFinite(searchVV)&&Number.isFinite(oldVV)&&oldVV!==0?Number((((searchVV-oldVV)/oldVV)*100).toFixed(2)):null;
    const currentVV=Number(r.search_vv??r.search_count),weekVV=seasonId&&previousWeekBySeason.has(seasonId)?previousWeekBySeason.get(seasonId):previousWeek.get(displayTitle);
    const suppliedDay=Number(r.day_over_day_pct??r.day_over_day),dayChange=Number.isFinite(suppliedDay)?suppliedDay:fallbackChange;
    const suppliedWeek=Number(r.week_change??r.week_over_week);
    const suppliedStatus=String(r.status??r['榜单状态']??'').trim();
    const status=seasonId?(historicalTopSeasonIds.has(seasonId)?'--':'新入榜'):(suppliedStatus||'--');
    const weekChange=Number.isFinite(suppliedWeek)?suppliedWeek:(displayTitle!=='--'&&Number.isFinite(currentVV)&&Number.isFinite(weekVV)&&weekVV!==0?Number((((currentVV-weekVV)/weekVV)*100).toFixed(2)):null);
    return {raw:r,rank:r.rank,title:r.title,display_title:displayTitle,search_vv:r.search_vv??r.search_count,search_uv:r.search_uv,day_over_day_pct:dayChange,week_change:weekChange,content_type:r.content_type,producer_region:r.producer_region,genre:r.genre,topic_tag:r.topic_tag,status};
  });
  // 空剧名/占位剧名不是有效的剧集榜单记录：隐藏后让后续有效记录顺次补位。
  source=source.filter(r=>String(r.display_title??'').trim()&&String(r.display_title).trim()!=='--');
  // 热搜榜按 season_id 保留榜单明细；不同 season_id 即使映射成相同剧名，也不能合并掉 Top30 记录。
  const uniqueTitles=new Map();
  source.forEach(row=>{
    const title=String(row.display_title).trim(),seasonId=String(row.raw?.season_id??'').trim(),key=seasonId||`${title}\u0000${String(row.rank??'')}`,current=uniqueTitles.get(key);
    if(!current||Number(row.rank)<Number(current.rank))uniqueTitles.set(key,row);
  });
  source=[...uniqueTitles.values()];
  // 日环比、周环比均有值后，按搜索 VV 降序取 Top30；两种榜单使用同一口径。
  source=source.filter(r=>rankingNumber(r.day_over_day_pct)!==null&&rankingNumber(r.week_change)!==null);
  source.sort((a,b)=>(Number(b.search_vv)||0)-(Number(a.search_vv)||0));
  source=source.slice(0,30);
  source=source.map((r,index)=>({...r,displayRank:index+1}));
  const table=document.querySelector('#hot-search-ops-table');if(!table)return;
  table.innerHTML=source.map(r=>`<tr><td>${rankBadge(r.displayRank)}</td><td class="content-name">${esc(r.display_title)}</td><td class="vv-value">${fmt(r.search_vv)}</td><td class="search-uv-value">${fmt(r.search_uv)}</td><td class="change-value">${rankingChangeBadge(r.day_over_day_pct)}</td><td class="change-value">${rankingChangeBadge(r.week_change)}</td><td>${esc(r.content_type??'--')}</td><td>${esc(r.producer_region??'--')}</td><td>${esc(r.genre??'--')}</td><td>${esc(r.topic_tag??'--')}</td><td class="${String(r.status).trim()==='新入榜'?'ranking-status-new':''}">${esc(r.status)}</td></tr>`).join('')||'<tr><td colspan="11" class="empty">暂无真实数据</td></tr>';
  updateSearchRankingHeader();
  document.querySelectorAll('.ranking-toolbar[data-ranking-kind="search"] .ranking-mode').forEach(button=>{const active=button.dataset.rankingType===stateView.type;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  const dateInput=document.querySelector('.ranking-toolbar[data-ranking-kind="search"] [data-ranking-date]');if(dateInput)dateInput.value=stateView.date;
  const header=document.querySelector('.hot-table-wrap thead tr');if(header)header.querySelectorAll('[data-sort-key]').forEach(button=>{
    const active=button.dataset.sortKey===stateView.sortKey;button.classList.toggle('active',active);
    const indicator=button.querySelector('.sort-triangle');indicator?.classList.toggle('ascending',active&&stateView.direction==='asc');indicator?.classList.toggle('descending',active&&stateView.direction==='desc');
    const label=button.textContent.trim();const action=active&&stateView.direction==='asc'?'降序':'升序';button.title=`按${label}${action}排序`;button.setAttribute('aria-label',`按${label}${action}排序`);
  });
  if(header)header.querySelectorAll('[data-change-direction]').forEach(button=>{
    const active=stateView.sortKey==='day_over_day_pct'&&((button.dataset.changeDirection==='asc'&&stateView.trend==='up')||(button.dataset.changeDirection==='desc'&&stateView.trend==='down'));
    button.classList.toggle('active',active);
  });
}

// Apply the ranking enhancements after the existing page renderer has built its DOM.
const renderPageWithRankingControls=renderPage;
renderPage=function(){
  renderPageWithRankingControls();
  requestAnimationFrame(()=>{setupRankingBoard();setupSearchRankingBoard()});
};

// Keep the ranking details and genre share, but remove the duplicate Top10 chart.
const renderRankingWithoutTopChart=renderRanking;
renderRanking=function(){
  renderRankingWithoutTopChart();
  document.querySelector('#page-content .content-analysis')?.remove();
  const structure=document.querySelector('#page-content .content-structure');
  const detail=document.querySelector('#page-content .content-detail');
  if(structure&&detail)structure.parentNode.insertBefore(detail,structure);
};

const renderPageBeforeChartTheme=renderPage;
renderPage=function(){
  renderPageBeforeChartTheme();
  ensureChartThemeControl();
  syncChartThemeControl();
  requestAnimationFrame(()=>{
    setupRankingBoard();
    setupSearchRankingBoard();
    applyChartThemeToAll();
  });
};

// Tab1 owns its date filter. The old global period controls are removed after
// rendering so later page layers cannot bring them back.
function tab1ShiftDate(date,days){
  const value=new Date(`${date}T00:00:00`);
  value.setDate(value.getDate()+days);
  return value.toISOString().slice(0,10);
}
function tab1DateBounds(){
  const dates=(state.data.daily||[]).map(r=>String(r.date||'')).filter(Boolean).sort();
  return {min:dates[0]||DASHBOARD_RANGE_START,max:dates.at(-1)||state.end||DASHBOARD_RANGE_END};
}
function setupTab1DateFilter(){
  const page=document.querySelector('#page-overview');
  if(!page)return;
  const trend=[...page.querySelectorAll('.section-heading')].find(el=>el.textContent.includes('趋势变化'))||page.querySelector('.section-heading');
  if(!trend)return;
  // The trend-level range was an extra shared filter. Tab1 now exposes only
  // the section-specific controls, so remove any legacy instance without
  // touching the underlying data state or other controls.
  trend.querySelector('.tab1-date-control')?.remove();
  return;
  let control=trend.querySelector('.tab1-date-control');
  if(!control){
    trend.insertAdjacentHTML('beforeend',`<div class="tab1-date-control" aria-label="Tab1日期范围筛选"><span>日期</span><input type="date" id="tab1-date-start" aria-label="开始日期"><i>至</i><input type="date" id="tab1-date-end" aria-label="结束日期"></div>`);
    control=trend.querySelector('.tab1-date-control');
    control.querySelectorAll('input[type="date"]').forEach(input=>input.addEventListener('change',event=>{
      const start=control.querySelector('#tab1-date-start').value;
      const end=control.querySelector('#tab1-date-end').value;
      if(!start||!end)return;
      if(start>end){
        if(event.target.id==='tab1-date-start')control.querySelector('#tab1-date-end').value=start;
        else control.querySelector('#tab1-date-start').value=end;
      }
      state.start=control.querySelector('#tab1-date-start').value;
      state.end=control.querySelector('#tab1-date-end').value;
      renderPage();
      deferResize();
    }));
  }
  const startInput=control.querySelector('#tab1-date-start');
  const endInput=control.querySelector('#tab1-date-end');
  const bounds=tab1DateBounds();
  startInput.min=bounds.min;startInput.max=bounds.max;startInput.value=state.start||bounds.min;
  endInput.min=bounds.min;endInput.max=bounds.max;endInput.value=state.end||bounds.max;
}
function cleanGlobalDateControls(){
  document.querySelector('.top-actions .date-range')?.remove();
  document.querySelector('.top-actions .period-filter')?.remove();
  document.querySelector('.top-actions .snapshot')?.remove();
  const hero=document.querySelector('#page-overview .hero-strip');
  hero?.querySelector('.eyebrow')?.remove();
  hero?.querySelector('h2')?.remove();
  if(hero&&!hero.textContent.trim())hero.remove();
}
function cleanMeaninglessSearchHeading(){
  document.querySelectorAll('#page-search .search-region-head').forEach(head=>{
    const title=head.querySelector('h3')?.textContent.trim();
    if(title==='热搜排行')head.remove();
  });
}

const renderPageBeforeTab1DateFilter=renderPage;
renderPage=function(){
  renderPageBeforeTab1DateFilter();
  cleanGlobalDateControls();
  cleanMeaninglessSearchHeading();
  if(state.page==='overview')setupTab1DateFilter();
  updatePeriodLabels();
};

// Final Tab4 layout: one selected channel for KPI cards, fixed eight-channel
// comparison for rates, and a heatmap for trends instead of overlapping lines.
buildTab4Operations=function(){
  const host=$('#page-home');if(!host||host.dataset.tab4OperationsBuilt)return;
  host.dataset.tab4OperationsBuilt='1';
  host.innerHTML=`<div class="tab4-ops-heading"><div><span>HOME CHANNEL OPERATIONS</span><h2>首页频道运营分析</h2><p>固定客户端：android_rrsp_xb · 数据来自 dramaConversion 原始字段</p></div><div class="tab4-ops-controls"><label>频道<select id="tab4-ops-channel" aria-label="选择频道">${TAB4_OPS_CHANNELS.map(channel=>`<option value="${channel}">${channel}</option>`).join('')}</select></label><label>指标日期<input id="tab4-ops-date" type="date" aria-label="Tab4指标日期"></label></div></div>
  <section class="tab4-ops-filter-note"><span>固定频道范围</span><b>精选 · 电影 · 美剧 · 英剧 · 韩剧 · 日剧 · 泰剧 · 国产剧</b><em>客户端不可切换</em></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>01</span><h3>核心指标</h3></div><small id="tab4-ops-current-date"></small></div><div id="tab4-ops-core" class="tab4-ops-core tab4-ops-core-single"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>02</span><h3>播放转化表现</h3></div><div id="tab4-ops-rate-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-rate-chart" class="tab4-ops-chart"></div><p class="tab4-ops-note">转化率为后台直接提供字段，不在页面重新计算阶段转化率。</p></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>03</span><h3>趋势分析</h3></div><div id="tab4-ops-trend-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-trend-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div><p class="tab4-ops-note">热力图按频道和日期展示指标强弱，悬浮查看原始数值。</p></section>`;
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),channel=$('#tab4-ops-channel');
  date.min=dates[0]||'';date.max=dates.at(-1)||'';
  date.value=state.end&&dates.includes(state.end)?state.end:dates.at(-1)||'';
  channel.value=TAB4_OPS_CHANNELS.includes(buildTab4Operations.channel)?buildTab4Operations.channel:'精选';
  channel.addEventListener('change',()=>{buildTab4Operations.channel=channel.value;renderTab4Operations()});
  date.addEventListener('change',()=>{state.start=dates[0]||'';state.end=date.value;renderTab4Operations()});
  buildTab4Operations.rateMetric=buildTab4Operations.rateMetric||'play_5_mins_uv_rate';
  buildTab4Operations.trendMetric=buildTab4Operations.trendMetric||'tab_click_uv';
};
buildTab4Operations.channel='精选';
const tab4OpsTrendBarFinal=(id,dates,metric,channel)=>{
  const isRate=metric.kind==='rate',color=isRate?'#7b63c6':'#347bd0';
  tab4OpsChart(id,{grid:{left:64,right:24,top:28,bottom:42,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'category',data:dates.map(d=>d.slice(5)),axisLabel:{interval:Math.max(0,Math.ceil(dates.length/12)-1)}},yAxis:{type:'value',min:0,max:isRate?1:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},series:[{name:`${channel} · ${metric.label}`,type:'bar',barMaxWidth:24,data:dates.map(date=>{const value=tab4OpsRow(date,channel)?.[metric.field];return isRate?tab4OpsRate(value):value??null}),itemStyle:{color},emphasis:{itemStyle:{color:isRate?'#694cb4':'#236bc2'}}}]});
};
renderTab4Operations=function(){
  const host=$('#page-home');if(!host)return;buildTab4Operations();
  const data=tab4OpsData(),dates=tab4OpsDates(),start=$('#tab4-ops-start'),end=$('#tab4-ops-end'),channel=$('#tab4-ops-channel')?.value||buildTab4Operations.channel||'精选';
  const currentDate=end?.value||dates.at(-1)||'',previousDate=dates.filter(d=>d<currentDate).at(-1)||'';
  const current=tab4OpsRow(currentDate,channel),previous=tab4OpsRow(previousDate,channel);
  setText('tab4-ops-current-date',`${channel} · ${currentDate} · 较前一日`);
  const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];
  $('#tab4-ops-core').innerHTML=core.map(([label,field])=>{const delta=tab4OpsDelta(current?.[field],previous?.[field]);return `<article class="tab4-ops-core-card tab4-ops-core-card-single"><h4>${label}</h4><strong>${fmt(current?.[field])}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em><small>较前一日 · ${channel}</small></article>`}).join('');
  const rateTabs=$('#tab4-ops-rate-tabs');rateTabs.innerHTML=Object.entries(TAB4_OPS_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.rateMetric===key?'active':''}" data-rate-metric="${key}" role="tab">${item.label.replace(' UV 转化率','')}</button>`).join('');
  rateTabs.querySelectorAll('[data-rate-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.rateMetric=button.dataset.rateMetric;renderTab4Operations()}));
  const metric=TAB4_OPS_METRICS[buildTab4Operations.rateMetric]||TAB4_OPS_METRICS.play_5_mins_uv_rate,ranked=TAB4_OPS_CHANNELS.map(name=>({channel:name,row:tab4OpsRow(currentDate,name),value:tab4OpsRate(tab4OpsRow(currentDate,name)?.[metric.field])})).sort((a,b)=>(b.value??-1)-(a.value??-1));
  tab4OpsChart('tab4-ops-rate-chart',{grid:{left:92,right:74,top:18,bottom:26,containLabel:true},tooltip:{trigger:'item',formatter:p=>{const r=ranked[ranked.length-1-p.dataIndex]||{};return `${r.channel||'--'}<br/>${metric.label}：${tab4OpsFmtRate(r.row?.[metric.field])}`}},xAxis:{type:'value',min:0,max:1,axisLabel:{formatter:v=>`${Math.round(v*100)}%`},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',data:ranked.slice().reverse().map(r=>r.channel)},series:[{type:'bar',barMaxWidth:24,data:ranked.slice().reverse().map((r,i)=>({value:r.value,itemStyle:{color:i<3?'#3d82d8':'#a9c7e8'},label:{show:true,position:'right',formatter:p=>p.value==null?'数据异常':`${(p.value*100).toFixed(2)}%`}}))}]});
  const trendTabs=$('#tab4-ops-trend-tabs');trendTabs.innerHTML=[...Object.entries(TAB4_OPS_UV_METRICS),...Object.entries(TAB4_OPS_METRICS)].map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.trendMetric===key?'active':''}" data-trend-metric="${key}" role="tab">${item.label.replace(' UV','')}</button>`).join('');
  trendTabs.querySelectorAll('[data-trend-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.trendMetric=button.dataset.trendMetric;renderTab4Operations()}));
  const trendMetric=TAB4_OPS_UV_METRICS[buildTab4Operations.trendMetric]||TAB4_OPS_METRICS[buildTab4Operations.trendMetric]||TAB4_OPS_UV_METRICS.tab_click_uv,trendDates=dates.filter(d=>d>=start.value&&d<=end.value),isRate=trendMetric.kind==='rate',heatmap=[];
  TAB4_OPS_CHANNELS.forEach((name,y)=>trendDates.forEach((date,x)=>{const value=tab4OpsRow(date,name)?.[trendMetric.field];heatmap.push([x,y,isRate?tab4OpsRate(value):Number.isFinite(Number(value))?Number(value):'-']);}));
  const numbers=heatmap.map(x=>x[2]).filter(x=>typeof x==='number'),min=numbers.length?Math.min(...numbers):0,max=numbers.length?Math.max(...numbers):1;
  tab4OpsChart('tab4-ops-trend-chart',{tooltip:{position:'top',formatter:p=>{const value=p.value[2];return `${TAB4_OPS_CHANNELS[p.value[1]]}<br/>${trendDates[p.value[0]]}<br/>${isRate?tab4OpsFmtRate(value):fmt(value)}`}},grid:{left:68,right:22,top:18,bottom:48,containLabel:true},xAxis:{type:'category',data:trendDates.map(d=>d.slice(5)),splitArea:{show:true}},yAxis:{type:'category',data:TAB4_OPS_CHANNELS,splitArea:{show:true}},visualMap:{min,max,calculable:false,orient:'horizontal',left:'center',bottom:4,inRange:{color:isRate?['#eef6ff','#8db8e7','#236bc2']:['#eef6ff','#8db8e7','#236bc2']},text:[isRate?'高':'高',isRate?'低':'低']},series:[{type:'heatmap',data:heatmap,label:{show:false},emphasis:{itemStyle:{shadowBlur:8,shadowColor:'rgba(0,0,0,.22)'}}}]});
};
const renderPageBeforeFinalTab4Ops=renderPage;
renderPage=function(){
  if(state.page!=='home'){renderPageBeforeFinalTab4Ops();return}
  $('#client-filter')?.classList.add('tab4-client-hidden');
  buildTab4Operations();
  $$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-home'));
  $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='home'));
  setText('page-title','首页频道运营分析');
  renderTab4Operations();
};

// Final clarification: UV and conversion-rate trends use separate charts.
buildTab4Operations=function(){
  const host=$('#page-home');if(!host||host.dataset.tab4OperationsBuilt)return;
  host.dataset.tab4OperationsBuilt='1';
  host.innerHTML=`<div class="tab4-ops-heading"><div><span>HOME CHANNEL OPERATIONS</span><h2>首页频道运营分析</h2><p>固定客户端：android_rrsp_xb · 数据来自 dramaConversion 原始字段</p></div><div class="tab4-ops-controls"><label>频道<select id="tab4-ops-channel" aria-label="选择频道">${TAB4_OPS_CHANNELS.map(channel=>`<option value="${channel}">${channel}</option>`).join('')}</select></label><label>指标日期<input id="tab4-ops-date" type="date" aria-label="Tab4指标日期"></label></div></div>
  <section class="tab4-ops-filter-note"><span>固定频道范围</span><b>精选 · 电影 · 美剧 · 英剧 · 韩剧 · 日剧 · 泰剧 · 国产剧</b><em>客户端不可切换</em></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>01</span><h3>核心指标</h3></div><small id="tab4-ops-current-date"></small></div><div id="tab4-ops-core" class="tab4-ops-core tab4-ops-core-single"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>02</span><div><h3>频道横向比较</h3><small>播放转化表现 · 8个频道</small></div></div><div id="tab4-ops-rate-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-rate-chart" class="tab4-ops-chart"></div><p class="tab4-ops-note">转化率为后台直接提供字段，不在页面重新计算阶段转化率。</p></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>03</span><h3>UV趋势</h3></div><div id="tab4-ops-uv-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-uv-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>04</span><h3>转化率趋势</h3></div><div id="tab4-ops-rate-trend-tabs" class="tab4-ops-tabs" role="tablist"></div></div><div id="tab4-ops-rate-trend-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div><p class="tab4-ops-note">UV趋势与转化率趋势分开展示，避免不同量纲互相压缩。</p></section>`;
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),channel=$('#tab4-ops-channel');
  date.min=dates[0]||'';date.max=dates.at(-1)||'';
  date.value=state.end&&dates.includes(state.end)?state.end:dates.at(-1)||'';
  channel.value=TAB4_OPS_CHANNELS.includes(buildTab4Operations.channel)?buildTab4Operations.channel:'精选';
  channel.addEventListener('change',()=>{buildTab4Operations.channel=channel.value;renderTab4Operations()});
  date.addEventListener('change',()=>{state.start=dates[0]||'';state.end=date.value;renderTab4Operations()});
  buildTab4Operations.rateMetric=buildTab4Operations.rateMetric||'play_5_mins_uv_rate';
  buildTab4Operations.uvMetric=buildTab4Operations.uvMetric||'tab_click_uv';
  buildTab4Operations.rateTrendMetric=buildTab4Operations.rateTrendMetric||'play_5_mins_uv_rate';
};
buildTab4Operations.channel='精选';
const tab4OpsLineColors=['#347bd0','#5c9dd7','#70b78a','#d2a14c','#8d75c7','#d57679','#45a9aa','#8b9bb0'];
const tab4OpsTrendLine=(id,dates,metric,isRate)=>{
  tab4OpsChart(id,{legend:{type:'scroll',top:0,data:TAB4_OPS_CHANNELS},grid:{left:62,right:24,top:38,bottom:34,containLabel:true},tooltip:{trigger:'axis',valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'category',data:dates.map(d=>d.slice(5)),boundaryGap:false},yAxis:{type:'value',min:isRate?0:null,max:isRate?1:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},series:TAB4_OPS_CHANNELS.map((channel,index)=>({name:channel,type:'line',smooth:.18,symbol:'circle',symbolSize:4,data:dates.map(date=>{const value=tab4OpsRow(date,channel)?.[metric.field];return isRate?tab4OpsRate(value):value??null}),lineStyle:{width:2,color:tab4OpsLineColors[index]},itemStyle:{color:tab4OpsLineColors[index]}}))});
};
renderTab4Operations=function(){
  const host=$('#page-home');if(!host)return;buildTab4Operations();
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),channel=$('#tab4-ops-channel')?.value||'精选',currentDate=date?.value||dates.at(-1)||'',previousDate=dates.filter(d=>d<currentDate).at(-1)||'',current=tab4OpsRow(currentDate,channel),previous=tab4OpsRow(previousDate,channel);
  setText('tab4-ops-current-date',`指标日期：${currentDate} · ${channel} · 较前一日`);
  const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];
  $('#tab4-ops-core').innerHTML=core.map(([label,field])=>{const delta=tab4OpsDelta(current?.[field],previous?.[field]);return `<article class="tab4-ops-core-card tab4-ops-core-card-single"><h4>${label}</h4><strong>${fmt(current?.[field])}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em><small>较前一日 · ${channel}</small></article>`}).join('');
  const rateTabs=$('#tab4-ops-rate-tabs');rateTabs.innerHTML=Object.entries(TAB4_OPS_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.rateMetric===key?'active':''}" data-rate-metric="${key}" role="tab">${item.label.replace(' UV 转化率','')}</button>`).join('');rateTabs.querySelectorAll('[data-rate-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.rateMetric=button.dataset.rateMetric;renderTab4Operations()}));
  const rateMetric=TAB4_OPS_METRICS[buildTab4Operations.rateMetric]||TAB4_OPS_METRICS.play_5_mins_uv_rate,ranked=TAB4_OPS_CHANNELS.map(name=>({channel:name,row:tab4OpsRow(currentDate,name),value:tab4OpsRate(tab4OpsRow(currentDate,name)?.[rateMetric.field])})).sort((a,b)=>(b.value??-1)-(a.value??-1));
  tab4OpsChart('tab4-ops-rate-chart',{grid:{left:92,right:74,top:18,bottom:26,containLabel:true},tooltip:{trigger:'item',formatter:p=>{const r=ranked[ranked.length-1-p.dataIndex]||{};return `${r.channel||'--'}<br/>${rateMetric.label}：${tab4OpsFmtRate(r.row?.[rateMetric.field])}`}},xAxis:{type:'value',min:0,max:1,axisLabel:{formatter:v=>`${Math.round(v*100)}%`},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',data:ranked.slice().reverse().map(r=>r.channel)},series:[{type:'bar',barMaxWidth:24,data:ranked.slice().reverse().map((r,i)=>({value:r.value,itemStyle:{color:i<3?'#3d82d8':'#a9c7e8'},label:{show:true,position:'right',formatter:p=>p.value==null?'数据异常':`${(p.value*100).toFixed(2)}%`}}))}]});
  const uvTabs=$('#tab4-ops-uv-tabs');uvTabs.innerHTML=Object.entries(TAB4_OPS_UV_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.uvMetric===key?'active':''}" data-uv-metric="${key}" role="tab">${item.label}</button>`).join('');uvTabs.querySelectorAll('[data-uv-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.uvMetric=button.dataset.uvMetric;renderTab4Operations()}));
  const trendDates=dates.filter(d=>d<=currentDate),uvMetric=TAB4_OPS_UV_METRICS[buildTab4Operations.uvMetric]||TAB4_OPS_UV_METRICS.tab_click_uv;tab4OpsTrendBarFinal('tab4-ops-uv-chart',trendDates,uvMetric,channel);
  const rateTrendTabs=$('#tab4-ops-rate-trend-tabs');rateTrendTabs.innerHTML=Object.entries(TAB4_OPS_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.rateTrendMetric===key?'active':''}" data-rate-trend-metric="${key}" role="tab">${item.label}</button>`).join('');rateTrendTabs.querySelectorAll('[data-rate-trend-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.rateTrendMetric=button.dataset.rateTrendMetric;renderTab4Operations()}));
  const rateTrendMetric=TAB4_OPS_METRICS[buildTab4Operations.rateTrendMetric]||TAB4_OPS_METRICS.play_5_mins_uv_rate;tab4OpsTrendLine('tab4-ops-rate-trend-chart',trendDates,rateTrendMetric,true);
};
const renderPageBeforeSplitTab4Trends=renderPage;
renderPage=function(){if(state.page!=='home'){renderPageBeforeSplitTab4Trends();return}$('#client-filter')?.classList.add('tab4-client-hidden');buildTab4Operations();$$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-home'));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='home'));setText('page-title','首页频道运营分析');renderTab4Operations()};

// Remove the channel conversion comparison module from Tab4. The remaining
// page focuses on the four core values and separate UV/rate trend views.
buildTab4Operations=function(){
  const host=$('#page-home');if(!host||host.dataset.tab4OperationsBuilt)return;
  host.dataset.tab4OperationsBuilt='1';
  host.innerHTML=`<div class="tab4-ops-heading"><div><span>HOME CHANNEL OPERATIONS</span><h2>首页频道运营分析</h2><p>固定客户端：android_rrsp_xb · 数据来自 dramaConversion 原始字段</p></div><div class="tab4-ops-controls"><label>频道<select id="tab4-ops-channel" aria-label="选择频道">${TAB4_OPS_CHANNELS.map(channel=>`<option value="${channel}">${channel}</option>`).join('')}</select></label><label>指标日期<input id="tab4-ops-date" type="date" aria-label="Tab4指标日期"></label></div></div>
  <section class="tab4-ops-filter-note"><span>固定频道范围</span><b>精选 · 电影 · 美剧 · 英剧 · 韩剧 · 日剧 · 泰剧 · 国产剧</b><em>客户端不可切换</em></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>01</span><h3>核心指标</h3></div><small id="tab4-ops-current-date"></small></div><div id="tab4-ops-core" class="tab4-ops-core tab4-ops-core-single"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>02</span><h3>UV趋势</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-ops-uv-metric" aria-label="UV趋势指标"></select></label><label>频道<select id="tab4-ops-uv-channel" aria-label="UV趋势频道"></select></label></div></div><div id="tab4-ops-uv-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div></section>
  <section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>03</span><h3>转化率趋势</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-ops-rate-metric" aria-label="转化率趋势指标"></select></label><label>频道<select id="tab4-ops-rate-channel" aria-label="转化率趋势频道"></select></label></div></div><div id="tab4-ops-rate-trend-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div><p class="tab4-ops-note">转化率使用后台直接提供字段，不在页面重新计算。</p></section>`;
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),channel=$('#tab4-ops-channel');
  date.min=dates[0]||'';date.max=dates.at(-1)||'';
  date.value=state.end&&dates.includes(state.end)?state.end:dates.at(-1)||'';
  channel.value=TAB4_OPS_CHANNELS.includes(buildTab4Operations.channel)?buildTab4Operations.channel:'精选';
  channel.addEventListener('change',()=>{buildTab4Operations.channel=channel.value;renderTab4Operations()});
  date.addEventListener('change',()=>{state.start=dates[0]||'';state.end=date.value;renderTab4Operations()});
  buildTab4Operations.uvMetric=buildTab4Operations.uvMetric||'tab_click_uv';buildTab4Operations.rateTrendMetric=buildTab4Operations.rateTrendMetric||'play_5_mins_uv_rate';
};
buildTab4Operations.channel='精选';
renderTab4Operations=function(){
  const host=$('#page-home');if(!host)return;buildTab4Operations();
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),channel=$('#tab4-ops-channel')?.value||'精选',currentDate=date?.value||dates.at(-1)||'',previousDate=dates.filter(d=>d<currentDate).at(-1)||'',current=tab4OpsRow(currentDate,channel),previous=tab4OpsRow(previousDate,channel);
  setText('tab4-ops-current-date',`指标日期：${currentDate} · ${channel} · 较前一日`);
  const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];
  $('#tab4-ops-core').innerHTML=core.map(([label,field])=>{const delta=tab4OpsDelta(current?.[field],previous?.[field]);return `<article class="tab4-ops-core-card tab4-ops-core-card-single"><h4>${label}</h4><strong>${fmt(current?.[field])}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em><small>较前一日 · ${channel}</small></article>`}).join('');
  const uvTabs=$('#tab4-ops-uv-tabs');uvTabs.innerHTML=Object.entries(TAB4_OPS_UV_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.uvMetric===key?'active':''}" data-uv-metric="${key}" role="tab">${item.label}</button>`).join('');uvTabs.querySelectorAll('[data-uv-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.uvMetric=button.dataset.uvMetric;renderTab4Operations()}));
  const trendDates=dates.filter(d=>d<=currentDate),uvMetric=TAB4_OPS_UV_METRICS[buildTab4Operations.uvMetric]||TAB4_OPS_UV_METRICS.tab_click_uv;tab4OpsTrendLine('tab4-ops-uv-chart',trendDates,uvMetric,false);
  const rateTabs=$('#tab4-ops-rate-trend-tabs');rateTabs.innerHTML=Object.entries(TAB4_OPS_METRICS).map(([key,item])=>`<button type="button" class="tab4-ops-tab ${buildTab4Operations.rateTrendMetric===key?'active':''}" data-rate-trend-metric="${key}" role="tab">${item.label}</button>`).join('');rateTabs.querySelectorAll('[data-rate-trend-metric]').forEach(button=>button.addEventListener('click',()=>{buildTab4Operations.rateTrendMetric=button.dataset.rateTrendMetric;renderTab4Operations()}));
  const rateMetric=TAB4_OPS_METRICS[buildTab4Operations.rateTrendMetric]||TAB4_OPS_METRICS.play_5_mins_uv_rate;tab4OpsTrendBarFinal('tab4-ops-rate-trend-chart',trendDates,rateMetric,channel);
};
const renderPageAfterRemovingRateComparison=renderPage;
renderPage=function(){if(state.page!=='home'){renderPageAfterRemovingRateComparison();return}$('#client-filter')?.classList.add('tab4-client-hidden');buildTab4Operations();$$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-home'));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='home'));setText('page-title','首页频道运营分析');renderTab4Operations()};

// Final Tab4 presentation: one channel and one metric per trend chart.
let tab4OpsSingleLineFinal=(id,dates,metric,isRate,channel)=>{
  const color=isRate?'#7b63c6':'#347bd0';
  tab4OpsChart(id,{legend:{show:false},grid:{left:62,right:24,top:24,bottom:38,containLabel:true},tooltip:{trigger:'axis',valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'category',data:dates.map(d=>d.slice(5)),boundaryGap:false},yAxis:{type:'value',min:0,max:isRate?.5:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},series:[{name:`${channel} · ${metric.label}`,type:'line',smooth:.2,symbol:'circle',symbolSize:5,data:dates.map(date=>{const value=tab4OpsRow(date,channel)?.[metric.field];return isRate?tab4OpsRate(value):value??null}),lineStyle:{width:3,color},itemStyle:{color},areaStyle:{color:color+'18'}}]});
};
buildTab4Operations=function(){
  const host=$('#page-home');if(!host)return;if(host.dataset.tab4FinalBuilt)return;host.dataset.tab4FinalBuilt='1';host.dataset.tab4OperationsBuilt='1';
  host.innerHTML=`<div class="tab4-ops-heading"><div><span>HOME CHANNEL OPERATIONS</span><h2>首页频道运营分析</h2><p>固定客户端：android_rrsp_xb · 数据来自 dramaConversion 原始字段</p></div><div class="tab4-ops-controls"><label>频道<select id="tab4-ops-channel" aria-label="选择频道">${TAB4_OPS_CHANNELS.map(name=>`<option value="${name}">${name}</option>`).join('')}</select></label><label>指标日期<input id="tab4-ops-date" type="date" aria-label="Tab4指标日期"></label></div></div><section class="tab4-ops-filter-note"><span>固定频道范围</span><b>精选 · 电影 · 美剧 · 英剧 · 韩剧 · 日剧 · 泰剧 · 国产剧</b><em>客户端不可切换</em></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>01</span><h3>核心指标</h3></div><small id="tab4-ops-current-date"></small></div><div id="tab4-ops-core" class="tab4-ops-core tab4-ops-core-single"></div></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>02</span><h3>UV趋势</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-final-uv-metric" aria-label="UV趋势指标"></select></label><label>频道<select id="tab4-final-uv-channel" aria-label="UV趋势频道"></select></label></div></div><div id="tab4-ops-uv-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>03</span><h3>转化率趋势</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-final-rate-metric" aria-label="转化率趋势指标"></select></label><label>频道<select id="tab4-final-rate-channel" aria-label="转化率趋势频道"></select></label></div></div><div id="tab4-ops-rate-trend-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div><p class="tab4-ops-note">转化率使用后台直接提供字段，不在页面重新计算。</p></section>`;
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),topChannel=$('#tab4-ops-channel');date.min=dates[0]||'';date.max=dates.at(-1)||'';date.value=state.end&&dates.includes(state.end)?state.end:dates.at(-1)||'';topChannel.value=buildTab4Operations.channel||'精选';topChannel.addEventListener('change',()=>{buildTab4Operations.channel=topChannel.value;renderTab4Operations()});date.addEventListener('change',()=>{state.start=dates[0]||'';state.end=date.value;renderTab4Operations()});buildTab4Operations.channel='精选';buildTab4Operations.uvMetric='tab_click_uv';buildTab4Operations.rateMetric='play_5_mins_uv_rate';buildTab4Operations.uvChannel='精选';buildTab4Operations.rateChannel='精选';
};
renderTab4Operations=function(){
  const host=$('#page-home');if(!host)return;buildTab4Operations();const dates=tab4OpsDates(),date=$('#tab4-ops-date'),topChannel=$('#tab4-ops-channel')?.value||'精选',currentDate=date?.value||dates.at(-1)||'',previousDate=dates.filter(d=>d<currentDate).at(-1)||'',current=tab4OpsRow(currentDate,topChannel),previous=tab4OpsRow(previousDate,topChannel);setText('tab4-ops-current-date',`指标日期：${currentDate} · ${topChannel} · 较前一日`);const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];$('#tab4-ops-core').innerHTML=core.map(([label,field])=>{const delta=tab4OpsDelta(current?.[field],previous?.[field]);return `<article class="tab4-ops-core-card tab4-ops-core-card-single"><h4>${label}</h4><strong>${fmt(current?.[field])}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em><small>较前一日 · ${topChannel}</small></article>`}).join('');
  const fill=(id,items,value)=>{const select=$(id);select.innerHTML=Object.entries(items).map(([key,item])=>`<option value="${key}">${item.label}</option>`).join('');select.value=value;return select};const fillChannels=(id,value)=>{const select=$(id);select.innerHTML=TAB4_OPS_CHANNELS.map(name=>`<option value="${name}">${name}</option>`).join('');select.value=value;return select};const uvMetric=fill('#tab4-final-uv-metric',TAB4_OPS_UV_METRICS,buildTab4Operations.uvMetric),uvChannel=fillChannels('#tab4-final-uv-channel',buildTab4Operations.uvChannel),rateMetric=fill('#tab4-final-rate-metric',TAB4_OPS_METRICS,buildTab4Operations.rateMetric),rateChannel=fillChannels('#tab4-final-rate-channel',buildTab4Operations.rateChannel);uvMetric.onchange=()=>{buildTab4Operations.uvMetric=uvMetric.value;renderTab4Operations()};uvChannel.onchange=()=>{buildTab4Operations.uvChannel=uvChannel.value;renderTab4Operations()};rateMetric.onchange=()=>{buildTab4Operations.rateMetric=rateMetric.value;renderTab4Operations()};rateChannel.onchange=()=>{buildTab4Operations.rateChannel=rateChannel.value;renderTab4Operations()};const trendDates=dates.filter(d=>d<=currentDate);tab4OpsSingleLineFinal('tab4-ops-uv-chart',trendDates,TAB4_OPS_UV_METRICS[buildTab4Operations.uvMetric],false,buildTab4Operations.uvChannel);tab4OpsSingleLineFinal('tab4-ops-rate-trend-chart',trendDates,TAB4_OPS_METRICS[buildTab4Operations.rateMetric],true,buildTab4Operations.rateChannel);
};
const renderPageBeforeFinalTab4=renderPage;renderPage=function(){if(state.page!=='home'){renderPageBeforeFinalTab4();return}$('#client-filter')?.classList.add('tab4-client-hidden');buildTab4Operations();$$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-home'));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='home'));setText('page-title','首页频道运营分析');renderTab4Operations()};

let tab4OpsComparisonBarFinal=(id,date,metric)=>{
  const isRate=metric.kind==='rate',rows=TAB4_OPS_CHANNELS.map(channel=>({channel,row:tab4OpsRow(date,channel)})).map(item=>({...item,value:isRate?tab4OpsRate(item.row?.[metric.field]):Number(item.row?.[metric.field])})).sort((a,b)=>(b.value??-1)-(a.value??-1));
  tab4OpsChart(id,{grid:{left:78,right:88,top:18,bottom:30,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'value',min:0,max:isRate?1:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',data:rows.slice().reverse().map(item=>item.channel),axisTick:{show:false}},series:[{name:metric.label,type:'bar',barMaxWidth:28,data:rows.slice().reverse().map((item,index)=>({value:item.value,itemStyle:{color:index<3?'#347bd0':'#a9c7e8'},label:{show:true,position:'right',formatter:p=>p.value==null?'--':isRate?tab4OpsFmtRate(p.value):fmt(p.value)}}))}]});
};
buildTab4Operations=function(){
  const host=$('#page-home');if(!host)return;if(host.dataset.tab4FinalBuiltV2)return;host.dataset.tab4FinalBuiltV2='1';host.dataset.tab4OperationsBuilt='1';
  host.innerHTML=`<div class="tab4-ops-heading"><div><span>HOME CHANNEL OPERATIONS</span><h2>首页频道运营分析</h2><p>固定客户端：android_rrsp_xb · 数据来自 dramaConversion 原始字段</p></div><div class="tab4-ops-controls"><label>频道<select id="tab4-ops-channel" aria-label="选择频道">${TAB4_OPS_CHANNELS.map(name=>`<option value="${name}">${name}</option>`).join('')}</select></label><label>指标日期<input id="tab4-ops-date" type="date" aria-label="Tab4指标日期"></label></div></div><section class="tab4-ops-filter-note"><span>固定频道范围</span><b>精选 · 电影 · 美剧 · 英剧 · 韩剧 · 日剧 · 泰剧 · 国产剧</b><em>客户端不可切换</em></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>01</span><h3>核心指标</h3></div><small id="tab4-ops-current-date"></small></div><div id="tab4-ops-core" class="tab4-ops-core tab4-ops-core-single"></div></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>02</span><h3>UV趋势</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-final-uv-metric" aria-label="UV趋势指标"></select></label><label>频道<select id="tab4-final-uv-channel" aria-label="UV趋势频道"></select></label><label>日期<input id="tab4-final-uv-date" type="date" aria-label="UV趋势日期"></label></div></div><div id="tab4-ops-uv-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>03</span><h3>转化率趋势</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-final-rate-metric" aria-label="转化率趋势指标"></select></label><label>频道<select id="tab4-final-rate-channel" aria-label="转化率趋势频道"></select></label></div></div><div id="tab4-ops-rate-trend-chart" class="tab4-ops-chart tab4-ops-trend-chart"></div><p class="tab4-ops-note">转化率使用后台直接提供字段，不在页面重新计算。</p></section><section class="tab4-ops-section"><div class="tab4-ops-section-head"><div><span>04</span><h3>频道效果对比</h3></div><div class="tab4-ops-chart-controls"><label>指标<select id="tab4-final-compare-metric" aria-label="频道效果对比指标"></select></label><label>日期<input id="tab4-final-compare-date" type="date" aria-label="频道效果对比日期"></label></div></div><div id="tab4-ops-comparison-chart" class="tab4-ops-chart tab4-ops-comparison-chart"></div><p class="tab4-ops-note">比较所选日期下 8 个频道的表现，按数值从高到低排序。</p></section>`;
  const dates=tab4OpsDates(),date=$('#tab4-ops-date'),uvDate=$('#tab4-final-uv-date'),topChannel=$('#tab4-ops-channel');date.min=dates[0]||'';date.max=dates.at(-1)||'';tab4KpiState.date=tab4KpiState.date&&dates.includes(tab4KpiState.date)?tab4KpiState.date:(state.end&&dates.includes(state.end)?state.end:dates.at(-1)||'');date.value=tab4KpiState.date;uvDate.min=dates[0]||'';uvDate.max=dates.at(-1)||'';tab4UvState.date=tab4UvState.date&&dates.includes(tab4UvState.date)?tab4UvState.date:dates.at(-1)||'';uvDate.value=tab4UvState.date;topChannel.value=tab4KpiState.channel;topChannel.addEventListener('change',()=>{tab4KpiState.channel=topChannel.value;renderTab4Operations()});date.addEventListener('change',()=>{tab4KpiState.date=date.value;renderTab4Operations()});uvDate.addEventListener('change',()=>{tab4UvState.date=uvDate.value;renderTab4Operations()});buildTab4Operations.rateMetric=buildTab4Operations.rateMetric||'play_5_mins_uv_rate';buildTab4Operations.rateChannel=buildTab4Operations.rateChannel||'精选';buildTab4Operations.compareMetric=buildTab4Operations.compareMetric||'tab_click_uv';
};
renderTab4Operations=function(){
  const host=$('#page-home');if(!host)return;buildTab4Operations();const dates=tab4OpsDates(),currentDate=tab4KpiState.date||dates.at(-1)||'',topChannel=tab4KpiState.channel||'精选',previousDate=dates.filter(d=>d<currentDate).at(-1)||'',current=tab4OpsRow(currentDate,topChannel),previous=tab4OpsRow(previousDate,topChannel);setText('tab4-ops-current-date',`指标日期：${currentDate} · ${topChannel} · 较前一日`);const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];$('#tab4-ops-core').innerHTML=core.map(([label,field])=>{const delta=tab4OpsDelta(current?.[field],previous?.[field]);return `<article class="tab4-ops-core-card tab4-ops-core-card-single"><h4>${label}</h4><strong>${fmt(current?.[field])}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em><small>较前一日 · ${topChannel}</small></article>`}).join('');
  const fill=(id,items,value)=>{const select=$(id);select.innerHTML=Object.entries(items).map(([key,item])=>`<option value="${key}">${item.label}</option>`).join('');select.value=value;return select};const fillChannels=(id,value)=>{const select=$(id);select.innerHTML=TAB4_OPS_CHANNELS.map(name=>`<option value="${name}">${name}</option>`).join('');select.value=value;return select};const uvMetric=fill('#tab4-final-uv-metric',TAB4_OPS_UV_METRICS,tab4UvState.metric),uvChannel=fillChannels('#tab4-final-uv-channel',tab4UvState.channel),rateMetric=fill('#tab4-final-rate-metric',TAB4_OPS_METRICS,buildTab4Operations.rateMetric),rateChannel=fillChannels('#tab4-final-rate-channel',buildTab4Operations.rateChannel),compareMetric=fill('#tab4-final-compare-metric',{...TAB4_OPS_UV_METRICS,...TAB4_OPS_METRICS},buildTab4Operations.compareMetric),compareDate=$('#tab4-final-compare-date');tab4CompareState.date=tab4CompareState.date&&dates.includes(tab4CompareState.date)?tab4CompareState.date:currentDate;compareDate.min=dates[0]||'';compareDate.max=dates.at(-1)||'';compareDate.value=tab4CompareState.date;uvMetric.onchange=()=>{tab4UvState.metric=uvMetric.value;renderTab4Operations()};uvChannel.onchange=()=>{tab4UvState.channel=uvChannel.value;renderTab4Operations()};rateMetric.onchange=()=>{buildTab4Operations.rateMetric=rateMetric.value;renderTab4Operations()};rateChannel.onchange=()=>{buildTab4Operations.rateChannel=rateChannel.value;renderTab4Operations()};compareMetric.onchange=()=>{buildTab4Operations.compareMetric=compareMetric.value;renderTab4Operations()};compareDate.onchange=()=>{tab4CompareState.date=compareDate.value;renderTab4Operations()};const uvTrendDates=dates.filter(d=>d<=tab4UvState.date),trendDates=dates.filter(d=>d<=currentDate);tab4OpsSingleLineFinal('tab4-ops-uv-chart',uvTrendDates,TAB4_OPS_UV_METRICS[tab4UvState.metric],false,tab4UvState.channel);const selectedRate=TAB4_OPS_METRICS[buildTab4Operations.rateMetric];tab4OpsSingleLineFinal('tab4-ops-rate-trend-chart',trendDates,selectedRate,true,buildTab4Operations.rateChannel);const selectedCompare={...TAB4_OPS_UV_METRICS,...TAB4_OPS_METRICS}[buildTab4Operations.compareMetric]||TAB4_OPS_UV_METRICS.tab_click_uv;tab4OpsComparisonBarFinal('tab4-ops-comparison-chart',tab4CompareState.date,selectedCompare);
};
const renderPageBeforeTab4Comparison=renderPage;renderPage=function(){if(state.page!=='home'){renderPageBeforeTab4Comparison();return}$('#client-filter')?.classList.add('tab4-client-hidden');buildTab4Operations();$$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-home'));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='home'));setText('page-title','首页频道运营分析');renderTab4Operations()};

const renderPageAfterRemovingChannelNote=renderPage;renderPage=function(){renderPageAfterRemovingChannelNote();if(state.page==='home')$('#page-home .tab4-ops-filter-note')?.remove()};

const tab4OpsDetailDelta=(current,previous,kind)=>{
  const a=Number(current),b=Number(previous);if(!Number.isFinite(a)||!Number.isFinite(b))return '<span class="tab4-detail-na">--</span>';
  if(kind==='pp'){const diff=(a-b)*100;return `<span class="${diff>0?'is-up':diff<0?'is-down':'is-flat'}">${diff>0?'↑':diff<0?'↓':'-'}${Math.abs(diff).toFixed(2)}pp</span>`}
  if(b===0)return '<span class="tab4-detail-na">--</span>';const diff=(a-b)/b;return `<span class="${diff>0?'is-up':diff<0?'is-down':'is-flat'}">${diff>0?'↑':diff<0?'↓':'-'}${(Math.abs(diff)*100).toFixed(1)}%</span>`;
};
const renderTab4ChannelDetail=()=>{
  const host=$('#page-home');if(!host)return;let section=$('#tab4-ops-detail');if(!section){host.insertAdjacentHTML('beforeend',`<section id="tab4-ops-detail" class="tab4-ops-section tab4-ops-detail-section"><div class="tab4-ops-section-head"><div><span>05</span><h3>频道指标明细</h3></div><div class="tab4-ops-detail-head-tools"><small>UV 环比按百分比，转化率按百分点</small><label>日期<input id="tab4-final-detail-date" type="date" aria-label="频道指标明细日期"></label></div></div><div class="tab4-ops-detail-table-wrap"><table class="tab4-ops-detail-table"><thead><tr><th data-detail-sort="channel">频道</th><th data-detail-sort="tab_click_uv">首页频道点击UV</th><th class="tab4-detail-change-head">较昨日变化 <span>↑</span><span>↓</span></th><th data-detail-sort="content_click_uv">首页影视点击UV</th><th class="tab4-detail-change-head">较昨日变化 <span>↑</span><span>↓</span></th><th data-detail-sort="detail_play_uv">首页影视详情页尝试播放UV</th><th class="tab4-detail-change-head">较昨日变化 <span>↑</span><span>↓</span></th><th data-detail-sort="video_uv">有效看剧UV</th><th class="tab4-detail-change-head">较昨日变化 <span>↑</span><span>↓</span></th><th data-detail-sort="play_5_mins_uv_rate">5分钟UV转化率</th><th class="tab4-detail-change-head">较昨日变化 <span>↑</span><span>↓</span></th></tr></thead><tbody id="tab4-ops-detail-body"></tbody></table></div></section>`);section=$('#tab4-ops-detail')}
  const deltaHeaderKeys=['tab_click_uv_delta','content_click_uv_delta','detail_play_uv_delta','video_uv_delta','play_5_mins_uv_rate_delta'];section.querySelectorAll('.tab4-detail-change-head').forEach((head,index)=>{head.textContent='较昨日变化';head.dataset.detailSort=deltaHeaderKeys[index]||'';head.setAttribute('role','button');head.tabIndex=0});
  const dates=tab4OpsDates(),fallbackDate=$('#tab4-ops-date')?.value||dates.at(-1)||'';tab4DetailState.date=tab4DetailState.date&&dates.includes(tab4DetailState.date)?tab4DetailState.date:fallbackDate;const date=tab4DetailState.date,previous=dates.filter(d=>d<date).at(-1)||'',sort=renderTab4ChannelDetail.sort||'tab_click_uv',direction=renderTab4ChannelDetail.direction||'desc',rows=TAB4_OPS_CHANNELS.map(channel=>({channel,current:tab4OpsRow(date,channel),previous:tab4OpsRow(previous,channel)})).sort((a,b)=>{if(sort==='channel')return direction==='asc'?a.channel.localeCompare(b.channel,'zh-CN'):b.channel.localeCompare(a.channel,'zh-CN');const deltaField=sort.endsWith('_delta')?sort.replace(/_delta$/,''):'';const value=item=>{const field=deltaField||sort,cur=Number(item.current?.[field]),old=Number(item.previous?.[field]);if(!Number.isFinite(cur))return -Infinity;if(!deltaField)return cur;if(!Number.isFinite(old))return -Infinity;return field==='play_5_mins_uv_rate'?cur-old:old===0?-Infinity:(cur-old)/Math.abs(old)};return (value(b)-value(a))*(direction==='asc'?-1:1)});
  $('#tab4-ops-detail-body').innerHTML=rows.map(item=>`<tr><td>${esc(item.channel)}</td><td>${fmt(item.current?.tab_click_uv)}</td><td>${tab4OpsDetailDelta(item.current?.tab_click_uv,item.previous?.tab_click_uv)}</td><td>${fmt(item.current?.content_click_uv)}</td><td>${tab4OpsDetailDelta(item.current?.content_click_uv,item.previous?.content_click_uv)}</td><td>${fmt(item.current?.detail_play_uv)}</td><td>${tab4OpsDetailDelta(item.current?.detail_play_uv,item.previous?.detail_play_uv)}</td><td>${fmt(item.current?.video_uv)}</td><td>${tab4OpsDetailDelta(item.current?.video_uv,item.previous?.video_uv)}</td><td>${tab4OpsFmtRate(item.current?.play_5_mins_uv_rate)}</td><td>${tab4OpsDetailDelta(item.current?.play_5_mins_uv_rate,item.previous?.play_5_mins_uv_rate,'pp')}</td></tr>`).join('');section.querySelectorAll('[data-detail-sort]').forEach(th=>{const active=th.dataset.detailSort===sort;th.classList.toggle('is-sorted',active);th.setAttribute('aria-sort',active?(direction==='asc'?'ascending':'descending'):'none');th.onclick=()=>{const key=th.dataset.detailSort;if(renderTab4ChannelDetail.sort===key)renderTab4ChannelDetail.direction=renderTab4ChannelDetail.direction==='asc'?'desc':'asc';else{renderTab4ChannelDetail.sort=key;renderTab4ChannelDetail.direction=key==='channel'?'asc':'desc'}renderTab4ChannelDetail()}});const detailDate=$('#tab4-final-detail-date');detailDate.min=dates[0]||'';detailDate.max=dates.at(-1)||'';detailDate.value=date;detailDate.onchange=()=>{tab4DetailState.date=detailDate.value;renderTab4ChannelDetail()};
};
const tab4KpiState={channel:'精选',date:''};
const tab4DetailState={date:''};
const tab4CompareState={date:''};
const tab4UvState={metric:'tab_click_uv',channel:'精选',date:''};
const renderTab4BeforeDetailTable=renderTab4Operations;renderTab4Operations=function(){renderTab4BeforeDetailTable();renderTab4ChannelDetail()};

// 首页板块运营分析：使用 section 接口原始字段，仅在展示层完成筛选、排行和分页。
const sectionOpsState={date:'',channel:'全部频道',group:'',metric:'click_user',page:1,pageSize:20,sortKey:'date',sortDir:'desc',detailStartDate:'',detailEndDate:'',detailTrendSyncKey:''};
const sectionOpsChannels=['精选','电影','美剧','英剧','韩剧','日剧','泰剧','国产剧'];
const sectionOpsMetricMap={click_user:'点击UV',ctr_uv:'点击率UV',exposure_user:'曝光UV'};
function sectionOpsRows(){return rows(state.data.sectionOps||[]).map(repairText).filter(r=>sectionOpsChannels.includes(sectionOpsChannel(r)))}
function sectionOpsNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function sectionOpsDetailVisible(r){const exposure=sectionOpsNum(r.exposure_user);return exposure!==null&&exposure>1000}
function sectionOpsDate(r){return String(r.date||r['日期']||'')}
function sectionOpsChannel(r){return String(r.channel||r['频道']||'')}
function sectionOpsGroup(r){return String(r.group_name||r['板块']||'')}
function sectionOpsAnomaly(r){const e=sectionOpsNum(r.exposure_user),c=sectionOpsNum(r.click_user),t=sectionOpsNum(r.ctr_uv);return(e!==null&&c!==null&&c>e)||(t!==null&&t>1)||(e===0&&c!==null&&c>0)}
function sectionOpsFmtMetric(key,v){if(key==='ctr_uv')return v===null?'--':`${(v*100).toFixed(2)}%`;return fmt(v)}
function sectionOpsSortValue(r,key){if(key==='date')return sectionOpsDate(r);if(key==='channel')return sectionOpsChannel(r);if(key==='group_name')return sectionOpsGroup(r);return sectionOpsNum(r[key])??-Infinity}
function sectionOpsFiltered(){return sectionOpsRows().filter(r=>(!sectionOpsState.date||sectionOpsDate(r)===sectionOpsState.date)&&(!sectionOpsState.channel||sectionOpsState.channel==='全部频道'||sectionOpsChannel(r)===sectionOpsState.channel)&&(!sectionOpsState.group||sectionOpsGroup(r).toLowerCase().includes(sectionOpsState.group.toLowerCase())))}
function sectionOpsSort(list){const key=sectionOpsState.sortKey,dir=sectionOpsState.sortDir==='asc'?1:-1;return[...list].sort((a,b)=>{const av=sectionOpsSortValue(a,key),bv=sectionOpsSortValue(b,key);return(av<bv?-1:av>bv?1:0)*dir})}
function sectionOpsRenderChart(items){const dom=$('#section-ops-rank-chart');if(!dom||!window.echarts)return;const chart=echarts.getInstanceByDom(dom)||echarts.init(dom),rev=[...items].reverse(),rate=sectionOpsState.metric==='ctr_uv';chart.setOption({animation:false,grid:{left:205,right:76,top:16,bottom:28,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const x=p?.[0],item=rev[x?.dataIndex];return item?`${esc(item.label)}<br/>${esc(sectionOpsMetricMap[sectionOpsState.metric])}：${sectionOpsFmtMetric(sectionOpsState.metric,item.value)}`:''}},xAxis:{type:'value',axisLabel:{color:'#71839c',formatter:v=>rate?`${(v*100).toFixed(0)}%`:fmt(v)},splitLine:{lineStyle:{color:'#e6edf5'}}},yAxis:{type:'category',data:rev.map(x=>x.label),axisLabel:{color:'#365878',width:180,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:28,data:rev.map(x=>({value:x.value,itemStyle:{color:x.rank<3?'#2f76e8':'#9fc3ea'}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>rate?`${(Number(p.value)*100).toFixed(2)}%`:fmt(p.value)}}]});chart.resize()}
function sectionOpsChangeSort(key){if(sectionOpsState.sortKey===key)sectionOpsState.sortDir=sectionOpsState.sortDir==='asc'?'desc':'asc';else{sectionOpsState.sortKey=key;sectionOpsState.sortDir=key==='date'||key==='channel'||key==='group_name'?'asc':'desc'}sectionOpsState.page=1;renderSectionOpsDetailOnly()}
function sectionOpsDeltaValue(current,previous,kind){const now=sectionOpsNum(current),old=sectionOpsNum(previous);if(now===null||old===null)return null;if(kind==='pp')return now-old;if(old===0)return null;return (now-old)/Math.abs(old)}
function renderSectionOps(){
  const root=$('#section-ops-root');
  if(!root)return;
  const dates=[...new Set(sectionOpsRows().map(sectionOpsDate))].filter(Boolean).sort();
  const filtered=sectionOpsFiltered();
  const total=filtered.length;
  const pages=Math.max(1,Math.ceil(total/sectionOpsState.pageSize));
  sectionOpsState.page=Math.min(sectionOpsState.page,pages);
  const shown=sectionOpsSort(filtered).slice((sectionOpsState.page-1)*sectionOpsState.pageSize,sectionOpsState.page*sectionOpsState.pageSize);
  const rankItems=sectionOpsSort(filtered.filter(r=>!sectionOpsAnomaly(r))).slice(0,10).map((r,index)=>({label:`${sectionOpsChannel(r)}｜${sectionOpsGroup(r)}`,value:sectionOpsNum(r[sectionOpsState.metric])??0,rank:index}));
  root.innerHTML=`<div class="section-ops-controls panel"><label><span>日期</span><input id="section-ops-date" type="date" min="${esc(dates[0]||'')}" max="${esc(dates.at(-1)||'')}" value="${esc(sectionOpsState.date)}"></label><label><span>频道</span><select id="section-ops-channel"><option>全部频道</option>${sectionOpsChannels.map(x=>`<option ${x===sectionOpsState.channel?'selected':''}>${esc(x)}</option>`).join('')}</select></label><div class="section-ops-source">客户端：android_rrsp_xb　数据范围：${esc(dates[0]||'--')} 至 ${esc(dates.at(-1)||'--')}</div></div><section class="panel section-ops-rank"><div class="panel-head"><div><h3>频道板块效果排行</h3><span>当前日期 · 排除异常数据 · TOP10</span></div><label class="section-ops-metric">指标<select id="section-ops-metric">${Object.entries(sectionOpsMetricMap).map(([k,v])=>`<option value="${k}" ${k===sectionOpsState.metric?'selected':''}>${v}</option>`).join('')}</select></label></div><div id="section-ops-rank-chart" class="section-ops-rank-chart"></div><p class="section-ops-note">异常数据保留在明细表中，但不参与排行：点击UV大于曝光UV、点击率超过100%、曝光UV为0仍有点击。</p></section><section class="panel section-ops-detail"><div class="panel-head"><div><h3>板块明细</h3><span>共 ${total.toLocaleString('zh-CN')} 条，默认按点击UV降序</span></div></div><div class="section-ops-table-wrap"><table class="section-ops-table"><thead><tr>${[['date','日期'],['channel','频道'],['group_name','板块'],['exposure_user','曝光UV'],['click_user','点击UV'],['ctr_uv','点击率UV']].map(([k,l])=>`<th><button type="button" data-section-sort="${k}" class="${sectionOpsState.sortKey===k?'is-sorted':''}">${l}</button></th>`).join('')}<th>状态</th></tr></thead><tbody>${shown.map(r=>`<tr class="${sectionOpsAnomaly(r)?'is-anomaly':''}"><td>${esc(sectionOpsDate(r))}</td><td>${esc(sectionOpsChannel(r))}</td><td class="section-ops-group-name">${esc(sectionOpsGroup(r))}</td><td>${sectionOpsFmtMetric('exposure_user',sectionOpsNum(r.exposure_user))}</td><td>${sectionOpsFmtMetric('click_user',sectionOpsNum(r.click_user))}</td><td>${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(r.ctr_uv))}</td><td>${sectionOpsAnomaly(r)?'<span class="section-ops-anomaly">异常</span>':'<span class="section-ops-normal">正常</span>'}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">暂无符合条件的数据</td></tr>'}</tbody></table></div><div class="section-ops-pagination"><span>第 ${total?sectionOpsState.page:0} / ${total?pages:0} 页</span><button type="button" id="section-ops-prev" ${sectionOpsState.page<=1?'disabled':''}>上一页</button><button type="button" id="section-ops-next" ${sectionOpsState.page>=pages?'disabled':''}>下一页</button></div></section>`;
  $('#section-ops-date')?.addEventListener('change',e=>{sectionOpsState.date=e.target.value;sectionOpsState.page=1;renderSectionOps()});$('#section-ops-channel')?.addEventListener('change',e=>{sectionOpsState.channel=e.target.value;sectionOpsState.page=1;renderSectionOps()});$('#section-ops-group')?.addEventListener('input',e=>{sectionOpsState.group=e.target.value;sectionOpsState.page=1;renderSectionOps()});$('#section-ops-metric')?.addEventListener('change',e=>{sectionOpsState.metric=e.target.value;renderSectionOps()});$('#section-ops-page-size')?.addEventListener('change',e=>{sectionOpsState.pageSize=Number(e.target.value);sectionOpsState.page=1;renderSectionOps()});root.querySelectorAll('[data-section-sort]').forEach(b=>b.addEventListener('click',()=>sectionOpsChangeSort(b.dataset.sectionSort)));$('#section-ops-prev')?.addEventListener('click',()=>{sectionOpsState.page=Math.max(1,sectionOpsState.page-1);renderSectionOps()});$('#section-ops-next')?.addEventListener('click',()=>{sectionOpsState.page=Math.min(pages,sectionOpsState.page+1);renderSectionOps()});sectionOpsRenderChart(rankItems)
}
renderSectionOps=function(){
  const root=$('#section-ops-root');
  if(!root)return;
  const dates=[...new Set(sectionOpsRows().map(sectionOpsDate))].filter(Boolean).sort();
  const filtered=sectionOpsFiltered();
  const total=filtered.length;
  const pages=Math.max(1,Math.ceil(total/sectionOpsState.pageSize));
  sectionOpsState.page=Math.min(sectionOpsState.page,pages);
  const shown=sectionOpsSort(filtered).slice((sectionOpsState.page-1)*sectionOpsState.pageSize,sectionOpsState.page*sectionOpsState.pageSize);
  const rankItems=sectionOpsSort(filtered.filter(r=>!sectionOpsAnomaly(r))).slice(0,10).map((r,index)=>({label:`${sectionOpsChannel(r)}｜${sectionOpsGroup(r)}`,value:sectionOpsNum(r[sectionOpsState.metric])??0,rank:index}));
  root.innerHTML=`<div class="section-ops-controls panel"><label><span>日期</span><input id="section-ops-date" type="date" min="${esc(dates[0]||'')}" max="${esc(dates.at(-1)||'')}" value="${esc(sectionOpsState.date)}"></label><label><span>频道</span><select id="section-ops-channel"><option>全部频道</option>${sectionOpsChannels.map(x=>`<option ${x===sectionOpsState.channel?'selected':''}>${esc(x)}</option>`).join('')}</select></label><div class="section-ops-source">客户端：android_rrsp_xb　数据范围：${esc(dates[0]||'--')} 至 ${esc(dates.at(-1)||'--')}</div></div><section class="panel section-ops-rank"><div class="panel-head"><div><h3>频道板块效果排行</h3><span>当前日期 · 排除异常数据 · TOP10</span></div><label class="section-ops-metric">指标<select id="section-ops-metric">${Object.entries(sectionOpsMetricMap).map(([k,v])=>`<option value="${k}" ${k===sectionOpsState.metric?'selected':''}>${v}</option>`).join('')}</select></label></div><div id="section-ops-rank-chart" class="section-ops-rank-chart"></div><p class="section-ops-note">异常数据保留在明细表中，但不参与排行：点击UV大于曝光UV、点击率超过100%、曝光UV为0仍有点击。</p></section><section class="panel section-ops-detail"><div class="panel-head"><div><h3>板块明细</h3><span>共 ${total.toLocaleString('zh-CN')} 条，默认按点击UV降序</span></div></div><div class="section-ops-table-wrap"><table class="section-ops-table"><thead><tr>${[['date','日期'],['channel','频道'],['group_name','板块'],['exposure_user','曝光UV'],['click_user','点击UV'],['ctr_uv','点击率UV']].map(([k,l])=>`<th><button type="button" data-section-sort="${k}" class="${sectionOpsState.sortKey===k?'is-sorted':''}">${l}</button></th>`).join('')}</tr></thead><tbody>${shown.map(r=>`<tr class="${sectionOpsAnomaly(r)?'is-anomaly':''}"><td>${esc(sectionOpsDate(r))}</td><td>${esc(sectionOpsChannel(r))}</td><td class="section-ops-group-name">${esc(sectionOpsGroup(r))}</td><td>${sectionOpsFmtMetric('exposure_user',sectionOpsNum(r.exposure_user))}</td><td>${sectionOpsFmtMetric('click_user',sectionOpsNum(r.click_user))}</td><td>${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(r.ctr_uv))}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">暂无符合条件的数据</td></tr>'}</tbody></table></div><div class="section-ops-pagination"><span>第 ${total?sectionOpsState.page:0} / ${total?pages:0} 页</span><button type="button" id="section-ops-prev" ${sectionOpsState.page<=1?'disabled':''}>上一页</button><button type="button" id="section-ops-next" ${sectionOpsState.page>=pages?'disabled':''}>下一页</button></div></section>`;
  $('#section-ops-date')?.addEventListener('change',e=>{sectionOpsState.date=e.target.value;sectionOpsState.page=1;renderSectionOps()});
  $('#section-ops-channel')?.addEventListener('change',e=>{sectionOpsState.channel=e.target.value;sectionOpsState.page=1;renderSectionOps()});
  $('#section-ops-metric')?.addEventListener('change',e=>{sectionOpsState.metric=e.target.value;renderSectionOps()});
  root.querySelectorAll('[data-section-sort]').forEach(b=>b.addEventListener('click',()=>sectionOpsChangeSort(b.dataset.sectionSort)));
  $('#section-ops-prev')?.addEventListener('click',()=>{sectionOpsState.page=Math.max(1,sectionOpsState.page-1);renderSectionOps()});
  $('#section-ops-next')?.addEventListener('click',()=>{sectionOpsState.page=Math.min(pages,sectionOpsState.page+1);renderSectionOps()});
  sectionOpsRenderChart(rankItems);
};
const renderPageBeforeSectionOps=renderPage;renderPage=function(){if(state.page==='sections'){$$('.page').forEach(p=>p.classList.remove('active'));$('#page-sections')?.classList.add('active');$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));setText('page-title','首页板块运营分析');renderSectionOps();deferResize();return}renderPageBeforeSectionOps()};

function sectionOpsDelta(current,previous,kind){const now=sectionOpsNum(current),old=sectionOpsNum(previous);if(now===null||old===null)return '<span class="section-ops-delta is-empty">--</span>';if(kind==='pp'){let diff=Number(((now-old)*100).toFixed(2));if(Object.is(diff,-0))diff=0;const mark=diff>0?'↑':diff<0?'↓':'-';return `<span class="section-ops-delta ${diff>0?'is-up':diff<0?'is-down':'is-flat'}">${mark}${Math.abs(diff).toFixed(2)}pp</span>`}if(old===0)return '<span class="section-ops-delta is-empty">--</span>';let diff=Number((((now-old)/old)*100).toFixed(1));if(Object.is(diff,-0))diff=0;const mark=diff>0?'↑':diff<0?'↓':'-';return `<span class="section-ops-delta ${diff>0?'is-up':diff<0?'is-down':'is-flat'}">${mark}${Math.abs(diff).toFixed(1)}%</span>`}
function sectionOpsRenderDetailChanges(){const section=$('.section-ops-detail'),table=section?.querySelector('.section-ops-table');if(!section||!table)return;const dates=[...new Set(sectionOpsRows().map(sectionOpsDate))].filter(Boolean).sort(),previousDate=dates.filter(d=>d<sectionOpsState.date).at(-1)||'',previous=new Map(sectionOpsRows().filter(r=>sectionOpsDate(r)===previousDate).map(r=>[`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`,r])),shown=sectionOpsSort(sectionOpsFiltered()).slice((sectionOpsState.page-1)*sectionOpsState.pageSize,sectionOpsState.page*sectionOpsState.pageSize);
  const dateControl=$('#section-ops-date')?.closest('label');if(dateControl){dateControl.classList.add('section-ops-detail-date');dateControl.querySelector('span')?.replaceChildren(document.createTextNode('日期'));section.querySelector('.panel-head')?.insertBefore(dateControl,section.querySelector('.section-ops-page-size'))}
  const makeSort=(key,label)=>`<th><button type="button" data-section-sort="${key}" class="${sectionOpsState.sortKey===key?'is-sorted':''}">${label}</button></th>`;
  table.querySelector('thead tr').innerHTML=`${makeSort('date','日期')}${makeSort('channel','频道')}${makeSort('group_name','板块')}${makeSort('exposure_user','曝光UV')}<th class="section-ops-change-head"><span>较前一日变化</span><button type="button" class="change-direction-button change-direction-up" title="上升降序">▲</button><button type="button" class="change-direction-button change-direction-down" title="下降降序">▼</button></th>${makeSort('click_user','点击UV')}<th class="section-ops-change-head"><span>较前一日变化</span><button type="button" class="change-direction-button change-direction-up" title="上升降序">▲</button><button type="button" class="change-direction-button change-direction-down" title="下降降序">▼</button></th>${makeSort('ctr_uv','点击率UV')}<th class="section-ops-change-head"><span>较前一日变化</span><button type="button" class="change-direction-button change-direction-up" title="上升降序">▲</button><button type="button" class="change-direction-button change-direction-down" title="下降降序">▼</button></th>`;
  table.querySelector('tbody').innerHTML=shown.map(r=>{const old=previous.get(`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`);return `<tr class="${sectionOpsAnomaly(r)?'is-anomaly':''}"><td>${esc(sectionOpsDate(r))}</td><td>${esc(sectionOpsChannel(r))}</td><td class="section-ops-group-name">${esc(sectionOpsGroup(r))}</td><td>${sectionOpsFmtMetric('exposure_user',sectionOpsNum(r.exposure_user))}</td><td>${sectionOpsDelta(r.exposure_user,old?.exposure_user)}</td><td>${sectionOpsFmtMetric('click_user',sectionOpsNum(r.click_user))}</td><td>${sectionOpsDelta(r.click_user,old?.click_user)}</td><td>${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(r.ctr_uv))}</td><td>${sectionOpsDelta(r.ctr_uv,old?.ctr_uv,'pp')}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">暂无符合条件的数据</td></tr>';
  section.querySelectorAll('[data-section-sort]').forEach(button=>button.addEventListener('click',()=>sectionOpsChangeSort(button.dataset.sectionSort)));const subtitle=section.querySelector('.panel-head>div span');if(subtitle)subtitle.textContent=`共 ${sectionOpsFiltered().length.toLocaleString('zh-CN')} 条 · 对比 ${previousDate||'--'} · UV环比按百分比，点击率按百分点`;
}
const renderSectionOpsBeforeDetailChanges=renderSectionOps;renderSectionOps=function(){renderSectionOpsBeforeDetailChanges();sectionOpsRenderDetailChanges()};
const renderPageBeforeSectionOpsClientCleanup=renderPage;renderPage=function(){const isSectionOps=state.page==='sections';$('#client-filter')?.classList.toggle('tab4-client-hidden',isSectionOps);renderPageBeforeSectionOpsClientCleanup()};

// Theme-aware redraws: changing a filter must not restore the old blue palette.
const tab4OpsThemePalette=()=>CHART_THEMES[document.documentElement.dataset.chartTheme]||activeChartTheme();
const tab4OpsThemeColor=()=>tab4OpsThemePalette().primary;
const tab4OpsThemeSoft=()=>tab4OpsThemePalette().area;
tab4OpsSingleLineFinal=(id,dates,metric,isRate,channel)=>{
  const color=tab4OpsThemeColor();
  tab4OpsChart(id,{animationDuration:220,animationDurationUpdate:220,animationEasingUpdate:'cubicOut',legend:{show:false},grid:{left:62,right:24,top:24,bottom:38,containLabel:true},tooltip:{trigger:'axis',valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'category',data:dates.map(d=>d.slice(5)),boundaryGap:false},yAxis:{type:'value',min:0,max:isRate?.5:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},series:[{name:`${channel} · ${metric.label}`,type:'line',smooth:.2,symbol:'circle',symbolSize:5,data:dates.map(date=>{const value=tab4OpsRow(date,channel)?.[metric.field];return isRate?tab4OpsRate(value):value??null}),lineStyle:{width:3,color},itemStyle:{color},areaStyle:{color:tab4OpsThemeSoft()}}]});
};
tab4OpsComparisonBarFinal=(id,date,metric)=>{
  const isRate=metric.kind==='rate',rows=TAB4_OPS_CHANNELS.map(channel=>({channel,row:tab4OpsRow(date,channel)})).map(item=>({...item,value:isRate?tab4OpsRate(item.row?.[metric.field]):Number(item.row?.[metric.field])})).sort((a,b)=>(b.value??-1)-(a.value??-1)),palette=tab4OpsThemePalette();
  tab4OpsChart(id,{animationDuration:220,animationDurationUpdate:220,animationEasingUpdate:'cubicOut',grid:{left:78,right:88,top:18,bottom:30,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:value=>isRate?tab4OpsFmtRate(value):fmt(value)},xAxis:{type:'value',min:0,max:isRate?1:null,axisLabel:{formatter:value=>isRate?`${Math.round(value*100)}%`:fmt(value)},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',data:rows.slice().reverse().map(item=>item.channel),axisTick:{show:false}},series:[{name:metric.label,type:'bar',barMaxWidth:28,data:rows.slice().reverse().map(item=>({value:item.value,itemStyle:{color:palette.primary},label:{show:true,position:'right',formatter:p=>p.value==null?'--':isRate?tab4OpsFmtRate(p.value):fmt(p.value)}}))}]});
};
sectionOpsRenderChart=items=>{const dom=$('#section-ops-rank-chart');if(!dom||!window.echarts)return;const chart=echarts.getInstanceByDom(dom)||echarts.init(dom),rev=[...items].reverse(),rate=sectionOpsState.metric==='ctr_uv',palette=activeChartTheme();chart.setOption({animationDuration:220,animationDurationUpdate:220,animationEasingUpdate:'cubicOut',grid:{left:205,right:76,top:16,bottom:28,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const x=p?.[0],item=rev[x?.dataIndex];return item?`${esc(item.label)}<br/>${esc(sectionOpsMetricMap[sectionOpsState.metric])}：${sectionOpsFmtMetric(sectionOpsState.metric,item.value)}`:''}},xAxis:{type:'value',axisLabel:{color:'#71839c',formatter:v=>rate?`${(v*100).toFixed(0)}%`:fmt(v)},splitLine:{lineStyle:{color:'#e6edf5'}}},yAxis:{type:'category',data:rev.map(x=>x.label),axisLabel:{color:'#365878',width:180,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:28,data:rev.map(x=>({value:x.value,itemStyle:{color:palette.primary}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>rate?`${(Number(p.value)*100).toFixed(2)}%`:fmt(p.value)}}]});chart.resize()};
const setChartThemeBeforeSmoothRefresh=setChartTheme;setChartTheme=function(theme){setChartThemeBeforeSmoothRefresh(theme);document.documentElement.dataset.chartTheme=theme;if(state.page==='home')renderTab4Operations();if(state.page==='sections')renderSectionOps()};
window.__themeDebug=()=>({stateTheme:state.chartTheme,domTheme:document.documentElement.dataset.chartTheme,tab4Palette:tab4OpsThemePalette().primary});

// Keep the detail toolbar focused on the date selector; pagination stays fixed at 20 rows.
const renderSectionOpsBeforeDetailToolbar=renderSectionOps;
renderSectionOps=function(){
  renderSectionOpsBeforeDetailToolbar();
  const detail=$('.section-ops-detail'),head=detail?.querySelector('.panel-head');
  detail?.querySelector('.section-ops-page-size')?.remove();
  const date=$('#section-ops-date')?.closest('label');
  if(head&&date){date.classList.add('section-ops-detail-date');head.appendChild(date)}
};

const renderSectionOpsBeforeChannelToolbar=renderSectionOps;
renderSectionOps=function(){
  renderSectionOpsBeforeChannelToolbar();
  const detail=$('.section-ops-detail'),head=detail?.querySelector('.panel-head');
  detail?.querySelector('.section-ops-page-size')?.remove();

  const table=detail?.querySelector('.section-ops-table');

  const channel=$('#section-ops-channel')?.closest('label');
  const date=$('#section-ops-date')?.closest('label');
  if(head&&(channel||date)){
    let toolbar=head.querySelector('.section-ops-detail-toolbar');
    if(!toolbar){
      toolbar=document.createElement('div');
      toolbar.className='section-ops-detail-toolbar';
      head.appendChild(toolbar);
    }
    if(channel){
      channel.classList.add('section-ops-detail-channel');
      channel.querySelector('span')?.replaceChildren(document.createTextNode('频道'));
      toolbar.appendChild(channel);
    }
    if(date){
      date.classList.add('section-ops-detail-date');
      date.querySelector('span')?.replaceChildren(document.createTextNode('日期'));
      toolbar.appendChild(date);
    }
  }

  const groupInput=$('#section-ops-group');
  if(groupInput&&!groupInput.dataset.smoothInput){
    groupInput.dataset.smoothInput='1';
    groupInput.addEventListener('input',event=>{
      event.stopImmediatePropagation();
      const target=event.currentTarget;
      window.clearTimeout(renderSectionOps.__groupTimer);
      renderSectionOps.__groupTimer=window.setTimeout(()=>{
        sectionOpsState.group=target.value;
        sectionOpsState.page=1;
        renderSectionOps();
      },150);
    },true);
  }
};

if(window.echarts&&!window.echarts.__dashboardSmoothPatch){
  window.echarts.__dashboardSmoothPatch=true;
  const decorateChart=chart=>{
    if(!chart||chart.__dashboardSmoothPatch)return chart;
    chart.__dashboardSmoothPatch=true;
    chart.__dashboardMotionRendered=false;
    const setOption=chart.setOption.bind(chart);
    chart.setOption=(option,...args)=>{
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const firstRender=!chart.__dashboardMotionRendered;
      chart.__dashboardMotionRendered=true;
      const dom=chart.getDom?.();
      if(firstRender&&dom&&!reduced){
        dom.classList.remove('dashboard-chart-enter');
        void dom.offsetWidth;
        dom.classList.add('dashboard-chart-enter');
        requestAnimationFrame(()=>dom.classList.remove('dashboard-chart-enter'));
      }
      return setOption({
        ...option,
        animation:reduced?false:true,
        animationThreshold:option?.animationThreshold??0,
        animationDuration:option?.animationDuration??(firstRender?520:360),
        animationDurationUpdate:option?.animationDurationUpdate??360,
        animationEasing:option?.animationEasing??'cubicOut',
        animationEasingUpdate:option?.animationEasingUpdate??'cubicInOut',
        animationDelay:option?.animationDelay??(firstRender?(index=>Math.min(index*16,220)):0),
        animationDelayUpdate:option?.animationDelayUpdate??(index=>Math.min(index*10,120))
      },...args);
    };
    return chart;
  };
  const chartInit=window.echarts.init.bind(window.echarts);
  const getChart=window.echarts.getInstanceByDom.bind(window.echarts);
  window.echarts.init=(...args)=>decorateChart(chartInit(...args));
  window.echarts.getInstanceByDom=element=>decorateChart(getChart(element));
  document.querySelectorAll('[id]').forEach(element=>decorateChart(getChart(element)));
}

const overviewSnapshotState={date:null};
// Independent presentation ranges for the two Tab1 analysis regions. These
// values only control chart display; the shared business filter state remains
// untouched so KPI and other tabs keep their existing data semantics.
const overviewRangeState={scaleStart:DASHBOARD_RANGE_START,scaleEnd:DASHBOARD_RANGE_END,depthStart:DASHBOARD_RANGE_START,depthEnd:DASHBOARD_RANGE_END};
function overviewFilterRange(list,start,end){
  return (list||[]).filter(row=>{
    const date=String(row?.date||row?.['日期']||'').slice(0,10);
    return (!start||date>=start)&&(!end||date<=end);
  });
}
function overviewNoDateClientRows(list,client,field){
  return (list||[]).filter(row=>!field||row?.[field]===client||row?.client===client||row?.client_type===client||row?.clienttype===client||row?.clienttype_raw===client);
}
function refreshOverviewRangeChart(kind){
  if(!window.echarts)return;
  const id=kind==='scale'?'overview-scale-combo':'overview-depth-combo',el=$(`#${id}`),chart=el&&echarts.getInstanceByDom(el);
  if(!chart)return;
  const dateOf=row=>String(row?.date||row?.['日期']||'').slice(0,10);
  const range=kind==='scale'?{start:overviewRangeState.scaleStart,end:overviewRangeState.scaleEnd}:{start:overviewRangeState.depthStart,end:overviewRangeState.depthEnd};
  const daily=overviewNoDateClientRows(state.data.daily,state.client,'client');
  if(kind==='scale'){
    const rows=overviewFilterRange(daily,range.start,range.end),dates=[...new Set(rows.map(dateOf))].sort(),map=key=>{const values=new Map(rows.filter(row=>row?.[key]!=null).map(row=>[dateOf(row),Number(row[key])]));return dates.map(date=>values.get(date)??null)};
    chart.setOption({xAxis:{data:dates.map(date=>date.slice(5))},series:[{data:map('device_dau'),itemStyle:{color:'#2f6f3e'}},{data:map('new_device'),lineStyle:{width:3,color:'#2f76e8'},itemStyle:{color:'#2f76e8'}}]});
  }else{
    const duration=overviewFilterRange(overviewNoDateClientRows(state.data.duration,state.client,'client_type'),range.start,range.end),counts=overviewFilterRange(state.data.playCount,range.start,range.end),rows=overviewFilterRange(daily,range.start,range.end),dates=[...new Set([...rows,...duration,...counts].map(dateOf))].sort(),values=(list,key)=>{const map=new Map(list.filter(row=>row?.[key]!=null).map(row=>[dateOf(row),Number(row[key])]));return dates.map(date=>map.get(date)??null)};
    chart.setOption({xAxis:{data:dates.map(date=>date.slice(5))},series:[{data:values(rows,'play_rate')},{data:values(duration,'total_avg_watch_duration')},{data:values(counts,state.client)}]});
  }
  chart.resize();
}
function overviewSnapshotDateKey(row){return String(row?.date||row?.['日期']||'').slice(0,10)}
function overviewSnapshotRecord(list,date,predicate=()=>true){
  return latest((list||[]).filter(row=>overviewSnapshotDateKey(row)===date&&predicate(row)));
}
function overviewSnapshotDates(){
  return [...new Set((state.data.daily||[]).map(overviewSnapshotDateKey).filter(Boolean))].sort();
}
function renderOverviewSnapshot(){
  const dates=overviewSnapshotDates(),date=overviewSnapshotState.date||state.end||dates.at(-1)||'';
  if(!dates.includes(date))overviewSnapshotState.date=dates.at(-1)||'';
  const selected=overviewSnapshotState.date||date,previous=dates.filter(value=>value<selected).at(-1)||'';
  const dailyCurrent=overviewSnapshotRecord(state.data.daily,selected,row=>row.client===state.client)||overviewSnapshotRecord(state.data.daily,selected);
  const dailyPrevious=overviewSnapshotRecord(state.data.daily,previous,row=>row.client===state.client)||overviewSnapshotRecord(state.data.daily,previous);
  const durationCurrent=overviewSnapshotRecord(state.data.duration,selected,row=>row.client_type===state.client);
  const durationPrevious=overviewSnapshotRecord(state.data.duration,previous,row=>row.client_type===state.client);
  const countCurrent=overviewSnapshotRecord(state.data.playCount,selected,row=>row[state.client]!=null);
  const countPrevious=overviewSnapshotRecord(state.data.playCount,previous,row=>row[state.client]!=null);
  const delta=key=>{
    const now=Number(dailyCurrent?.[key]),old=Number(dailyPrevious?.[key]);
    return Number.isFinite(now)&&Number.isFinite(old)&&old!==0?(now-old)/old*100:null;
  };
  const metricDelta=(now,old)=>{
    const current=Number(now),previousValue=Number(old);
    return Number.isFinite(current)&&Number.isFinite(previousValue)&&previousValue!==0?(current-previousValue)/previousValue*100:null;
  };
  const host=$('#overview-kpis');
  if(host)host.innerHTML=[
    overviewMetric('设备 DAU',dailyCurrent?.device_dau,delta('device_dau')),
    overviewMetric('新增设备',dailyCurrent?.new_device,delta('new_device')),
    overviewMetric('播放率',dailyCurrent?.play_rate,delta('play_rate'),null,true),
    overviewMetric('人均播放时长',durationCurrent?.total_avg_watch_duration,metricDelta(durationCurrent?.total_avg_watch_duration,durationPrevious?.total_avg_watch_duration),'分钟'),
    overviewMetric('人均播放次数',countCurrent?.[state.client],metricDelta(countCurrent?.[state.client],countPrevious?.[state.client]),'次')
  ].join('');
}
function arrangeOverviewControls(){
  const page=$('#page-overview');
  if(!page)return;
  const headings=[...page.querySelectorAll('.section-heading')];
  const coreHeading=headings.find(heading=>heading.textContent.includes('核心指标'));
  const scaleRegion=[...page.querySelectorAll('.overview-region')].find(region=>region.querySelector('h3')?.textContent.trim()==='用户规模趋势分析');
  const depthRegion=[...page.querySelectorAll('.overview-region')].find(region=>region.querySelector('h3')?.textContent.trim()==='用户消费深度分析');
  const snapshotDates=overviewSnapshotDates();
  if(coreHeading){
    let control=coreHeading.querySelector('.overview-snapshot-control');
    if(!control){
      control=document.createElement('label');
      control.className='overview-snapshot-control';
      control.innerHTML='<span>日期</span><input type="date" aria-label="核心指标日期">';
      coreHeading.appendChild(control);
      control.querySelector('input').addEventListener('change',event=>{
        overviewSnapshotState.date=event.target.value;
        renderOverviewSnapshot();
      });
    }
    const input=control.querySelector('input');
    input.min=snapshotDates[0]||'';
    input.max=snapshotDates.at(-1)||'';
    if(!overviewSnapshotState.date||!snapshotDates.includes(overviewSnapshotState.date))overviewSnapshotState.date=state.end&&snapshotDates.includes(state.end)?state.end:snapshotDates.at(-1)||'';
    input.value=overviewSnapshotState.date;
  }
  if(scaleRegion){
    const heading=scaleRegion.querySelector('.region-heading');
    let actions=heading?.querySelector('.overview-region-actions');
    if(!actions&&heading){
      actions=document.createElement('div');
      actions.className='overview-region-actions';
      heading.appendChild(actions);
    }
    const source=heading?.querySelector('.region-source');
    if(source)actions?.appendChild(source);
    let control=actions?.querySelector('.overview-scale-range-control');
    if(!control&&actions){
      control=document.createElement('label');
      control.className='tab1-date-control overview-scale-range-control';
      control.innerHTML='<span>日期</span><input type="date" aria-label="用户规模趋势开始日期"><i>至</i><input type="date" aria-label="用户规模趋势结束日期">';
      actions.appendChild(control);
      const sync=()=>{
        const inputs=control.querySelectorAll('input');
        if(inputs[0].value&&inputs[1].value&&inputs[0].value>inputs[1].value)inputs[1].value=inputs[0].value;
        overviewRangeState.scaleStart=inputs[0].value;
        overviewRangeState.scaleEnd=inputs[1].value;
        refreshOverviewRangeChart('scale');
      };
      control.querySelectorAll('input').forEach(input=>input.addEventListener('change',sync));
    }
    const rangeInputs=control?.querySelectorAll('input')||[];
    rangeInputs.forEach(input=>{input.min=DASHBOARD_RANGE_START;input.max=DASHBOARD_RANGE_END});
    if(!overviewRangeState.scaleStart)overviewRangeState.scaleStart=DASHBOARD_RANGE_START;
    if(!overviewRangeState.scaleEnd)overviewRangeState.scaleEnd=DASHBOARD_RANGE_END;
    if(rangeInputs[0])rangeInputs[0].value=overviewRangeState.scaleStart;
    if(rangeInputs[1])rangeInputs[1].value=overviewRangeState.scaleEnd;
  }
  if(depthRegion){
    const heading=depthRegion.querySelector('.region-heading');
    let actions=heading?.querySelector('.overview-region-actions');
    if(!actions&&heading){
      actions=document.createElement('div');
      actions.className='overview-region-actions';
      heading.appendChild(actions);
    }
    const source=heading?.querySelector('.region-source');
    if(source)actions?.appendChild(source);
    let control=actions?.querySelector('.overview-depth-range-control');
    if(!control&&actions){
      control=document.createElement('label');
      control.className='tab1-date-control overview-depth-range-control';
      control.innerHTML='<span>日期</span><input type="date" aria-label="用户消费深度开始日期"><i>至</i><input type="date" aria-label="用户消费深度结束日期">';
      actions.appendChild(control);
      const sync=()=>{
        const inputs=control.querySelectorAll('input');
        if(inputs[0].value&&inputs[1].value&&inputs[0].value>inputs[1].value)inputs[1].value=inputs[0].value;
        overviewRangeState.depthStart=inputs[0].value;
        overviewRangeState.depthEnd=inputs[1].value;
        refreshOverviewRangeChart('depth');
      };
      control.querySelectorAll('input').forEach(input=>input.addEventListener('change',sync));
    }
    const rangeInputs=control?.querySelectorAll('input')||[];
    rangeInputs.forEach(input=>{input.min=DASHBOARD_RANGE_START;input.max=DASHBOARD_RANGE_END});
    if(!overviewRangeState.depthStart)overviewRangeState.depthStart=DASHBOARD_RANGE_START;
    if(!overviewRangeState.depthEnd)overviewRangeState.depthEnd=DASHBOARD_RANGE_END;
    if(rangeInputs[0])rangeInputs[0].value=overviewRangeState.depthStart;
    if(rangeInputs[1])rangeInputs[1].value=overviewRangeState.depthEnd;
  }
  renderOverviewSnapshot();
}
function arrangeSectionOpsHeading(){
  const page=$('#page-sections'),heading=page?.querySelector('.section-heading');
  if(!page||!heading)return;
  let toolbar=heading.querySelector('.section-ops-heading-toolbar');
  if(!toolbar){
    toolbar=document.createElement('div');
    toolbar.className='section-ops-heading-toolbar';
    heading.appendChild(toolbar);
  }
  const channel=$('#section-ops-channel')?.closest('label');
  const date=$('#section-ops-date')?.closest('label');
  const group=$('#section-ops-group')?.closest('label');
  [channel,date,group].filter(Boolean).forEach(control=>toolbar.appendChild(control));
  page.querySelector('.section-ops-controls')?.remove();
  heading.querySelector('em')?.remove();
}

const renderPageBeforeControlArrangement=renderPage;
renderPage=function(){
  renderPageBeforeControlArrangement();
  if(state.page==='overview')arrangeOverviewControls();
  if(state.page==='sections')arrangeSectionOpsHeading();
};
const renderSectionOpsBeforeCompactHeading=renderSectionOps;
renderSectionOps=function(){
  renderSectionOpsBeforeCompactHeading();
  arrangeSectionOpsHeading();
};

/* Keep state changes visually continuous without replacing chart instances. */
function dashboardMotionScope(target){
  return target?.closest('.tab4-ops-section,.overview-region,.panel,.section-ops-detail,#page-overview,#page-home,#page-content,#page-search,#page-sections')||$('.page.active');
}
function dashboardSetUpdating(target){
  const scope=dashboardMotionScope(target);
  if(!scope)return;
  window.clearTimeout(scope.__dashboardUpdateTimer);
  scope.classList.add('dashboard-updating');
  scope.__dashboardUpdateTimer=window.setTimeout(()=>scope.classList.remove('dashboard-updating'),300);
}
function dashboardAnimateNumberNode(node){
  if(!node||node.__dashboardCounted)return;
  const raw=node.nodeValue;
  const match=raw?.match(/^(\s*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if(!match)return;
  const value=Number(match[2].replace(/,/g,''));
  if(!Number.isFinite(value))return;
  node.__dashboardCounted=true;
  const decimals=(match[2].split('.')[1]||'').length;
  const prefix=match[1],suffix=match[3],start=performance.now(),duration=320;
  const format=number=>decimals?number.toFixed(decimals):Math.round(number).toLocaleString('en-US');
  const tick=now=>{
    const progress=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-progress,3);
    node.nodeValue=`${prefix}${format(value*ease)}${suffix}`;
    if(progress<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function dashboardAnimateKpis(root){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  root?.querySelectorAll('.overview-metric strong,.kpi-card strong,.tab4-ops-core-card-single strong').forEach(strong=>{
    const valueNode=[...strong.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&/\d/.test(node.nodeValue));
    dashboardAnimateNumberNode(valueNode);
  });
}
function dashboardEnterPage(){
  const page=$('.page.active');
  if(!page)return;
  page.classList.remove('dashboard-page-enter');
  void page.offsetWidth;
  page.classList.add('dashboard-page-enter');
  dashboardAnimateKpis(page);
  requestAnimationFrame(()=>window.echarts?.getInstanceByDom&&document.querySelectorAll('.chart,.tab4-ops-chart,.region-chart,.client-region-chart,#section-ops-rank-chart').forEach(node=>window.echarts.getInstanceByDom(node)?.resize()));
}
if(window.MutationObserver&&$('.main')){
  const dashboardKpiObserver=new MutationObserver(()=>dashboardAnimateKpis($('.main')));
  dashboardKpiObserver.observe($('.main'),{childList:true,subtree:true});
}
document.addEventListener('change',event=>{
  if(event.target.matches('select,input[type="date"]'))dashboardSetUpdating(event.target);
},true);
document.addEventListener('click',event=>{
  if(event.target.closest('.segmented button,.sub-tabs button,.analysis-tab,.tab4-ops-tab,.ranking-mode,.nav-item'))dashboardSetUpdating(event.target);
},true);
const renderPageBeforeMotion=renderPage;
renderPage=function(){
  renderPageBeforeMotion();
  dashboardEnterPage();
};

/* The board ranking remains mounted across its own filters, so ECharts can animate data changes. */
const renderSectionOpsBeforeChartRetention=renderSectionOps;
renderSectionOps=function(){
  const retainedDom=$('#section-ops-rank-chart');
  const retainedChart=retainedDom&&window.echarts?.getInstanceByDom(retainedDom);
  renderSectionOpsBeforeChartRetention();
  const freshDom=$('#section-ops-rank-chart');
  if(!retainedDom||!retainedChart||!freshDom||freshDom===retainedDom)return;
  window.echarts?.getInstanceByDom(freshDom)?.dispose();
  freshDom.replaceWith(retainedDom);
  const clean=sectionOpsFiltered().filter(row=>!sectionOpsAnomaly(row));
  const ranked=clean.map(row=>({
    label:`${sectionOpsChannel(row)}｜${sectionOpsGroup(row)}`,
    value:sectionOpsNum(row[sectionOpsState.metric])??0,
    rank:0
  })).sort((a,b)=>b.value-a.value).slice(0,10).map((item,index)=>({...item,rank:index}));
  sectionOpsRenderChart(ranked);
};

/* Standalone Banner click analysis. It intentionally uses row-level source fields only. */
const bannerViewState={rankDate:DASHBOARD_RANGE_END,detailDate:DASHBOARD_RANGE_END,detailStartDate:'',detailEndDate:'',detailTitle:'',titleSuggestionsOpen:false,titleSuggestionTarget:'trend',trendClient:'and',trendWindow:7,burstMonth:'',burstSelected:'',client:'and',rankPosition:'all',detailPosition:'all',detailStatus:'all',ranking:'click',detailSortKey:'date',detailSortDir:'asc',page:1,pageSize:20,bound:false};
let bannerIndex={source:null,byClient:new Map(),byDateClient:new Map(),dates:[],previous:new Map()};
Object.defineProperty(bannerViewState,'date',{get(){return this.detailDate},set(value){this.rankDate=value;this.detailDate=value}});
const bannerClientLabels={and:'and',web:'web'};
function bannerSourceRows(){const source=rows(state.data.bannerClick);if(bannerIndex.source!==source){const dates=new Set(),byClient=new Map(),byDateClient=new Map();source.forEach(row=>{const client=String(row.clienttype||'').trim().toLowerCase(),date=bannerDate(row);if(client){if(!byClient.has(client))byClient.set(client,[]);byClient.get(client).push(row)}if(date){dates.add(date);const key=`${client}\u0000${date}`;if(!byDateClient.has(key))byDateClient.set(key,[]);byDateClient.get(key).push(row)}});const ordered=[...dates].sort(),previous=new Map();ordered.forEach((date,index)=>previous.set(date,ordered[index-1]||''));bannerIndex={source,byClient,byDateClient,dates:ordered,previous}}return source}
function bannerClientRows(client){bannerSourceRows();const key=String(client||'').trim().toLowerCase();return ['and','web'].includes(key)?(bannerIndex.byClient.get(key)||[]):[]}
function bannerDateClientRows(date,client){bannerSourceRows();return bannerIndex.byDateClient.get(`${String(client||'').trim().toLowerCase()}\u0000${date}`)||[]}
function bannerNumber(value){const n=Number(value);return Number.isFinite(n)?n:null}
function bannerDate(row){return String(row?.date??'')}
function bannerTitle(row){return String(row?.title??row?.banner_title??row?.name??'').replace(/[\s　]+/g,'').trim()}
function bannerNormalizeSearchText(value){return String(value??'').normalize('NFKC').toLowerCase().replace(/[\s\u3000\-—_·•,，。.!！?？:：;；'"“”‘’()（）\[\]【】<>《》]+/g,'')}
function bannerTitleMatches(row,query,mode='fuzzy'){
  const normalizedQuery=bannerNormalizeSearchText(query);
  if(!normalizedQuery)return true;
  const normalizedTitle=bannerNormalizeSearchText(row?.title??row?.banner_title??row?.name??'');
  return mode==='exact'?normalizedTitle===normalizedQuery:normalizedTitle.includes(normalizedQuery);
}
function bannerPosition(row){return String(row?.position_id??'')}
function bannerAnomaly(row){
  const exposure=bannerNumber(row?.uv_expose_count),click=bannerNumber(row?.uv_click_count),ctr=bannerNumber(row?.ctr_uv);
  if(exposure===null||click===null||ctr===null)return '字段缺失';
  if(click>exposure)return '点击UV大于曝光UV';
  if(exposure===0&&click>0)return '曝光UV为0但点击UV大于0';
  return '';
}
function bannerValid(row){return !bannerAnomaly(row)}
function bannerUniqueRows(list){
  const seen=new Set();
  return (list||[]).filter(row=>{
    const key=[bannerDate(row),String(row.clienttype||''),bannerPosition(row),row.title||'',row.uv_expose_count??'',row.uv_click_count??'',row.ctr_uv??''].join('\u0000');
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}
function bannerFilteredRows(scope='rank'){
  const position=scope==='detail'?bannerViewState.detailPosition:bannerViewState.rankPosition;
  const date=scope==='detail'?bannerViewState.detailDate:bannerViewState.rankDate;
  const client=scope==='detail'?'all':bannerViewState.client;
  const titleQuery=String(bannerViewState.detailTitle||'');
  const trendWindow=Number(bannerViewState.trendWindow)||7;
  const detailStart=bannerViewState.detailStartDate,detailEnd=bannerViewState.detailEndDate;
  const candidates=scope==='detail'?bannerSourceRows():bannerDateClientRows(date,client);
  return candidates.filter(row=>{
    const rowDate=bannerDate(row),inDate=scope==='detail'?(!detailStart&&!detailEnd||(!detailStart||rowDate>=detailStart)&&(!detailEnd||rowDate<=detailEnd)):rowDate===date;
    const titleMatches=bannerTitleMatches(row,titleQuery);
    const rowClient=String(row.clienttype||'').trim().toLowerCase(),detailClientAllowed=scope!=='detail'||['and','web'].includes(rowClient);
    return inDate&&detailClientAllowed&&(scope==='detail'||rowClient===client)&&(position==='all'||bannerPosition(row)===position)&&(scope!=='detail'||titleMatches);
  });
}
function bannerFormatClient(client){return bannerClientLabels[client]||client||'--'}
function bannerFormatPct(value){const n=bannerNumber(value);return n===null?'--':`${(n*100).toFixed(2)}%`}
function bannerPreviousDate(date){bannerSourceRows();return bannerIndex.previous.get(date)||''}
function bannerCompareRows(date,client){const previousDate=bannerPreviousDate(date),map=new Map();bannerUniqueRows(bannerSourceRows().filter(row=>bannerDate(row)===previousDate&&String(row.clienttype||'')===client)).forEach(row=>map.set(`${bannerPosition(row)}\u0000${row.title||''}`,row));return {date:previousDate,map}}
function bannerPreviousRow(row){const previousDate=bannerPreviousDate(bannerDate(row)),client=String(row.clienttype||'').trim().toLowerCase();return bannerUniqueRows(bannerDateClientRows(previousDate,client).filter(item=>bannerPosition(item)===bannerPosition(row)&&String(item.title||'')===String(row.title||'')))[0]}
function bannerDetailExportRows(){
  const unique=bannerUniqueRows(bannerFilteredRows('detail')).filter(row=>(bannerNumber(row.uv_expose_count)??-Infinity)>=1000);
  return unique.map(row=>{const old=bannerPreviousRow(row),exposure=bannerNumber(row.uv_expose_count),click=bannerNumber(row.uv_click_count),oldClick=bannerNumber(old?.uv_click_count),ctr=bannerNumber(row.ctr_uv),oldCtr=bannerNumber(old?.ctr_uv),lowSample=(exposure!==null&&exposure<1000)||(click!==null&&click<50),changeStatus=!old?(bannerPreviousDate(bannerDate(row))?'新上榜':'暂无昨日数据'):lowSample?'样本不足':'';return {...row,clickChange:oldClick===null||oldClick===0?null:(click-oldClick)/Math.abs(oldClick),ctrChange:oldCtr===null||ctr===null?null:ctr-oldCtr,changeStatus}}).filter(row=>bannerViewState.detailStatus!=='new'||row.changeStatus==='新上榜');
}
function bannerXml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function bannerCrc32(bytes){let crc=-1;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^-1)>>>0}
function bannerZip(files){
  const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
  const u16=n=>new Uint8Array([n&255,(n>>>8)&255]),u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
  const join=items=>{const size=items.reduce((sum,item)=>sum+item.length,0),out=new Uint8Array(size);let at=0;items.forEach(item=>{out.set(item,at);at+=item.length});return out};
  Object.entries(files).forEach(([name,content])=>{const nameBytes=encoder.encode(name),data=encoder.encode(content),crc=bannerCrc32(data);const local=join([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),nameBytes,data]);parts.push(local);central.push(join([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes]));offset+=local.length});
  const directory=join(central),end=join([u32(0x06054b50),u16(0),u16(0),u16(central.length),u16(central.length),u32(directory.length),u32(offset),u16(0)]);return new Blob([...parts,directory,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
}
function bannerExcelRows(){
  const grouped=new Map();bannerDetailExportRows().forEach(row=>{const key=[row.title||'',row.clienttype||'',bannerPosition(row)].join('\u0000');if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row)});
  return [...grouped.values()].flatMap(group=>group.sort((a,b)=>bannerDate(a).localeCompare(bannerDate(b))).slice(0,3)).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'zh-CN')||String(a.clienttype||'').localeCompare(String(b.clienttype||''),'zh-CN')||bannerPosition(a).localeCompare(bannerPosition(b),'zh-CN')||bannerDate(a).localeCompare(bannerDate(b)));
}
function exportBannerDetail(){
  const source=bannerExcelRows();if(!source.length){window.alert('当前筛选条件下没有可导出的Banner明细');return}
  const groups=new Map();source.forEach(row=>{const key=[row.title||'',row.clienttype||'',bannerPosition(row)].join('\u0000');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  const merges=[],sheetRows=[`<row r="1" ht="28" customHeight="1">${['Banner名称','平台','位置','日期','曝光UV','点击UV','转化率','平均'].map((text,index)=>`<c r="${String.fromCharCode(65+index)}1" t="inlineStr" s="1"><is><t>${text}</t></is></c>`).join('')}</row>`];let rowNumber=2;
  for(const group of groups.values()){
    const start=rowNumber,average=group.reduce((sum,row)=>sum+(bannerNumber(row.ctr_uv)||0),0)/group.length;
    group.forEach((row,index)=>{const date=bannerDate(row).replace(/-/g,''),exposure=bannerNumber(row.uv_expose_count),click=bannerNumber(row.uv_click_count),ctr=bannerNumber(row.ctr_uv),averageCell=index?'':`<c r="H${rowNumber}" s="4"><v>${average}</v></c>`;sheetRows.push(`<row r="${rowNumber}" ht="24" customHeight="1"><c r="A${rowNumber}" t="inlineStr" s="2"><is><t>${bannerXml(row.title||'')}</t></is></c><c r="B${rowNumber}" t="inlineStr" s="2"><is><t>${bannerXml(row.clienttype||'')}</t></is></c><c r="C${rowNumber}" t="inlineStr" s="2"><is><t>${bannerXml(bannerPosition(row))}</t></is></c><c r="D${rowNumber}" t="inlineStr" s="2"><is><t>${date}</t></is></c><c r="E${rowNumber}" s="3"><v>${exposure??0}</v></c><c r="F${rowNumber}" s="3"><v>${click??0}</v></c><c r="G${rowNumber}" s="4"><v>${ctr??0}</v></c>${averageCell}</row>`);rowNumber++});
    if(group.length>1){merges.push(`A${start}:A${rowNumber-1}`,`B${start}:B${rowNumber-1}`,`C${start}:C${rowNumber-1}`,`H${start}:H${rowNumber-1}`)}
  }
  const worksheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="27" customWidth="1"/><col min="2" max="3" width="15" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="8" width="14" customWidth="1"/></cols><sheetData>${sheetRows.join('')}</sheetData>${merges.length?`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`:''}<autoFilter ref="A1:H${rowNumber-1}"/></worksheet>`;
  const files={'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>','_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>','xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Banner明细" sheetId="1" r:id="rId1"/></sheets></workbook>','xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>','xl/styles.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Microsoft YaHei"/></font><font><b/><sz val="11"/><name val="Microsoft YaHei"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF2FB"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD9E1EA"/></left><right style="thin"><color rgb="FFD9E1EA"/></right><top style="thin"><color rgb="FFD9E1EA"/></top><bottom style="thin"><color rgb="FFD9E1EA"/></bottom></border></borders><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="10" fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs></styleSheet>','xl/worksheets/sheet1.xml':worksheet};
  const blob=bannerZip(files),url=URL.createObjectURL(blob),link=document.createElement('a'),dates=[...new Set(source.map(bannerDate))].sort();link.href=url;link.download=`Banner明细_${dates[0]}_${dates.at(-1)}.xlsx`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function bannerChangeBadge(value,type,status){if(status)return `<span class="banner-change-badge neutral">${status}</span>`;if(value===null||value===undefined||value==='')return '<span class="banner-change-badge neutral">--</span>';const n=bannerNumber(value);if(n===null)return '<span class="banner-change-badge neutral">--</span>';const up=n>=0,cls=up?'up':'down',arrow=up?'↑':'↓',abs=Math.abs(n);const text=type==='ctr'?`${(abs*100).toFixed(2)}pp`:`${(abs*100).toFixed(abs*100<10?2:1)}%`;return `<span class="banner-change-badge ${cls}">${arrow} ${text}</span>`}
function bannerStatus(row){const issue=bannerAnomaly(row);return issue?`异常：${issue}`:'正常'}
function bannerRankRows(list){
  const valid=list.filter(bannerValid);
  const unique=bannerUniqueRows(valid);
  if(bannerViewState.ranking==='ctr')return unique.filter(row=>(bannerNumber(row.uv_expose_count)??0)>=1000).sort((a,b)=>(bannerNumber(b.ctr_uv)??-Infinity)-(bannerNumber(a.ctr_uv)??-Infinity)).slice(0,10);
  return unique.sort((a,b)=>(bannerNumber(b.uv_click_count)??-Infinity)-(bannerNumber(a.uv_click_count)??-Infinity)).slice(0,10);
}
function bannerSetOptions(){
  const dateInputs=$$('#banner-date, #banner-detail-date, #banner-detail-start-date, #banner-detail-end-date');const source=bannerSourceRows();const dates=bannerIndex.dates;
  if(!dates.length)return;
  dateInputs.forEach(input=>{input.min=dates[0];input.max=dates.at(-1)});
  const defaultDate=window.__dashboardDefaultDate&&dates.includes(window.__dashboardDefaultDate)?window.__dashboardDefaultDate:dates.at(-1);
  if(!dates.includes(bannerViewState.rankDate))bannerViewState.rankDate=defaultDate;
  if(!dates.includes(bannerViewState.detailDate))bannerViewState.detailDate=defaultDate;
  const rankDate=$('#banner-date'),detailDate=$('#banner-detail-date');
  if(rankDate)rankDate.value=bannerViewState.rankDate;
  if(detailDate)detailDate.value=bannerViewState.detailDate;
  const detailStart=$('#banner-detail-start-date'),detailEnd=$('#banner-detail-end-date'),detailTitle=$('#banner-detail-title-search');
  if(detailStart)detailStart.value=bannerViewState.detailStartDate;
  if(detailEnd)detailEnd.value=bannerViewState.detailEndDate;
  if(detailTitle&&document.activeElement!==detailTitle&&(bannerViewState.detailTitle||!detailTitle.value))detailTitle.value=bannerViewState.detailTitle;
  const trendClient=$('#banner-trend-client');
  if(trendClient)trendClient.value=bannerViewState.trendClient;
  const trendTitle=$('#banner-trend-title-search');
  if(trendTitle&&document.activeElement!==trendTitle&&(bannerViewState.detailTitle||!trendTitle.value))trendTitle.value=bannerViewState.detailTitle;
  $$('.banner-trend-period').forEach(button=>{const active=Number(button.dataset.bannerTrendWindow)===Number(bannerViewState.trendWindow);button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false')});
  const positions=[...new Set(source.map(bannerPosition).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
  const selects=$$('.banner-position-select'),currentRank=bannerViewState.rankPosition,currentDetail=bannerViewState.detailPosition;
  const html=['<option value="all">全部位置</option>',...positions.map(position=>`<option value="${esc(position)}">${esc(position)}</option>`)].join('');
  selects.forEach(select=>{if(select.innerHTML!==html)select.innerHTML=html});
  bannerViewState.rankPosition=positions.includes(currentRank)?currentRank:'all';
  bannerViewState.detailPosition=positions.includes(currentDetail)?currentDetail:'all';
  selects.forEach(select=>select.value=select.dataset.bannerPositionScope==='detail'?bannerViewState.detailPosition:bannerViewState.rankPosition);
}
function bannerRenderRanking(list){
  const chart=$('#banner-ranking-chart'),emptyNode=$('#banner-ranking-empty'),ranked=bannerRankRows(list);
  emptyNode.hidden=ranked.length>0;
  if(!chart||!window.echarts)return;
  const instance=echarts.getInstanceByDom(chart)||echarts.init(chart);
  if(!ranked.length){instance.clear();return}
  const isCtr=bannerViewState.ranking==='ctr',chartGreen=getComputedStyle(document.documentElement).getPropertyValue('--green').trim()||'#2f6f3e';
  const labels=ranked.slice().reverse().map(row=>`${String(row.title||'--').slice(0,26)} · ${bannerPosition(row)||'--'}`);
  const values=ranked.slice().reverse().map(row=>isCtr?(bannerNumber(row.ctr_uv)??0):(bannerNumber(row.uv_click_count)??0));
  instance.setOption({
    animation:false,
    grid:{left:190,right:76,top:12,bottom:26,containLabel:true},
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>{const item=params?.[0],row=ranked[ranked.length-1-(item?.dataIndex??0)];if(!row)return '';return `${esc(row.title||'--')}<br/>位置：${esc(bannerPosition(row)||'--')}<br/>${isCtr?'转化率：'+bannerFormatPct(row.ctr_uv):'点击UV：'+fmt(row.uv_click_count)}`}},
    xAxis:{type:'value',min:0,axisLabel:{color:'#8392a7',formatter:value=>isCtr?`${(Number(value)*100).toFixed(0)}%`:fmt(value)},splitLine:{lineStyle:{color:'#edf1f6'}}},
    yAxis:{type:'category',data:labels,axisLabel:{color:'#455b77',width:178,overflow:'truncate'}},
    series:[{type:'bar',barMaxWidth:26,data:values,itemStyle:{color:chartGreen,borderRadius:[0,5,5,0]},label:{show:true,position:'right',color:'#405b78',fontWeight:750,formatter:value=>isCtr?bannerFormatPct(value.value):fmt(value.value)}}]
  });
  instance.resize();
}
function dashboardPagerItems(page,pages){
  if(pages<=7)return Array.from({length:pages},(_,index)=>index+1);
  const items=[1];
  if(page>4)items.push('ellipsis-left');
  const start=Math.max(2,page-1),end=Math.min(pages-1,page+1);
  for(let index=start;index<=end;index++)items.push(index);
  if(page<pages-3)items.push('ellipsis-right');
  items.push(pages);
  return items;
}
function dashboardPagerMarkup({prefix,total,page,pages,pageSize}){
  const items=dashboardPagerItems(page,pages);
  const options=[20,50,100].map(size=>`<option value="${size}" ${size===pageSize?'selected':''}>${size} 条/页</option>`).join('');
  return `<div class="dashboard-pagination ${prefix}-pagination" data-pagination-prefix="${prefix}"><span class="dashboard-pagination-total">共 ${Number(total||0).toLocaleString('zh-CN')} 条</span><button type="button" data-pager-prev="${prefix}" aria-label="上一页" ${page<=1?'disabled':''}>‹</button><div class="dashboard-pagination-pages">${items.map(item=>typeof item==='number'?`<button type="button" data-pager-page="${prefix}" data-page="${item}" class="${item===page?'is-active':''}" ${item===page?'aria-current="page"':''}>${item}</button>`:`<span class="dashboard-pagination-ellipsis">…</span>`).join('')}</div><button type="button" data-pager-next="${prefix}" aria-label="下一页" ${page>=pages||!total?'disabled':''}>›</button><label class="dashboard-pagination-size"><select data-pager-size="${prefix}" aria-label="每页条数">${options}</select></label><label class="dashboard-pagination-jump">跳至 <input data-pager-input="${prefix}" type="number" min="1" max="${pages}" value="${total?page:0}" aria-label="跳转页码"> 页</label></div>`;
}
function bindDashboardPager(root,prefix,state,render){
  if(!root)return;
  root.querySelector(`[data-pager-prev="${prefix}"]`)?.addEventListener('click',()=>{state.page=Math.max(1,state.page-1);render()});
  root.querySelector(`[data-pager-next="${prefix}"]`)?.addEventListener('click',()=>{state.page+=1;render()});
  root.querySelectorAll(`[data-pager-page="${prefix}"]`).forEach(button=>button.addEventListener('click',()=>{state.page=Number(button.dataset.page)||1;render()}));
  root.querySelector(`[data-pager-size="${prefix}"]`)?.addEventListener('change',event=>{state.pageSize=Number(event.target.value)||20;state.page=1;render()});
  root.querySelector(`[data-pager-input="${prefix}"]`)?.addEventListener('keydown',event=>{if(event.key!=='Enter')return;const max=Number(event.currentTarget.max)||1;state.page=Math.min(Math.max(1,Number(event.currentTarget.value)||1),max);render()});
}
function ensureLegacyDetailTablePagers(){
  [['ranking-table','ranking'],['hot-search-table','hot-search'],['channel-table','channel'],['section-table','home-section'],['banner-table','home-banner'],['tab4-ops-detail-body','tab4-detail']].forEach(([id,prefix])=>{
    const tbody=$(`#${id}`),table=tbody?.closest('table'),wrap=table?.closest('.table-wrap');
    if(!tbody||!table||!wrap)return;
    const sync=()=>{
      const rows=[...tbody.querySelectorAll('tr')].filter(row=>!row.querySelector('.empty')),state=table.__dashboardPagerState||(table.__dashboardPagerState={page:1,pageSize:20});
      const total=rows.length,pages=Math.max(1,Math.ceil(total/state.pageSize));state.page=Math.min(Math.max(1,state.page),pages);
      rows.forEach((row,index)=>{row.hidden=index<(state.page-1)*state.pageSize||index>=state.page*state.pageSize});
      let host=wrap.nextElementSibling?.matches('.dashboard-pagination-host')?wrap.nextElementSibling:null;
      if(!host){host=document.createElement('div');host.className='dashboard-pagination-host';wrap.insertAdjacentElement('afterend',host)}
      host.innerHTML=dashboardPagerMarkup({prefix,total,page:total?state.page:0,pages:total?pages:0,pageSize:state.pageSize});
      bindDashboardPager(host,prefix,state,sync);
    };
    if(!table.__dashboardPagerBound){table.__dashboardPagerBound=true;table.__dashboardPagerSync=sync;new MutationObserver(sync).observe(tbody,{childList:true});}
    sync();
  });
}
function bannerRenderTrend(){
  const empty=$('#banner-trend-empty'),chart=$('#banner-trend-chart'),trendInput=$('#banner-trend-title-search'),query=String(trendInput?.value??bannerViewState.detailTitle??''),client=String($('#banner-trend-client')?.value||bannerViewState.trendClient).trim().toLowerCase(),windowSize=Number(bannerViewState.trendWindow)||7;
  if(!empty||!chart)return;
  const hasQuery=Boolean(bannerNormalizeSearchText(query));
  const titleMatches=bannerUniqueRows(bannerClientRows(client).filter(row=>hasQuery&&bannerTitleMatches(row,query))),allTitleMatches=bannerUniqueRows(bannerSourceRows().filter(row=>hasQuery&&bannerTitleMatches(row,query))),matches=titleMatches.length?titleMatches:allTitleMatches,dates=[...new Set(matches.map(bannerDate).filter(Boolean))].sort();
  if(!hasQuery||!dates.length){empty.hidden=false;chart.hidden=true;empty.textContent=hasQuery?'未找到匹配的 Banner 标题':'请先搜索一个 Banner 标题';return}
  const launch=dates[0],latest=dates.at(-1),launchTime=Date.parse(`${launch}T00:00:00Z`),latestTime=Date.parse(`${latest}T00:00:00Z`),rangeStartTime=windowSize===30?Math.max(launchTime,latestTime-(windowSize-1)*86400000):launchTime,dayCount=Math.floor((latestTime-rangeStartTime)/86400000)+1,labels=Array.from({length:dayCount},(_,index)=>new Date(rangeStartTime+index*86400000).toISOString().slice(0,10)),byDate=new Map();
  matches.forEach(row=>{const date=bannerDate(row);if(!labels.includes(date))return;const item=byDate.get(date)||{date,exposure:0,click:0};item.exposure+=bannerNumber(row.uv_expose_count)||0;item.click+=bannerNumber(row.uv_click_count)||0;byDate.set(date,item)});
  const clicks=labels.map(date=>byDate.get(date)?.click??null),ctrs=labels.map(date=>{const item=byDate.get(date);return item&&item.exposure>0?item.click/item.exposure:null});
  empty.hidden=true;chart.hidden=false;$('#banner-trend-caption').textContent=`${matches[0].title||bannerViewState.detailTitle} · ${windowSize===30?'近30天：':''}${labels[0]} 至 ${labels.at(-1)} · ${bannerFormatClient(client)}`;
  if(!window.echarts)return;
  const instance=echarts.getInstanceByDom(chart)||echarts.init(chart);
  instance.setOption({animation:false,grid:{left:60,right:66,top:64,bottom:32,containLabel:true},legend:{top:8,left:'center',right:'auto',textStyle:{color:'#60758e',fontWeight:700}},tooltip:{trigger:'axis',formatter:params=>{const index=params?.[0]?.axisValueIndex??0,item=byDate.get(labels[index]);return `${labels[index]}<br/>点击UV：${item?fmt(item.click):'--'}<br/>转化率：${item&&item.exposure>0?bannerFormatPct(item.click/item.exposure):'--'}`}},xAxis:{type:'category',data:labels,axisLabel:{color:'#8392a7',formatter:value=>value.slice(5)},boundaryGap:false},yAxis:[{type:'value',name:'点击UV',axisLabel:{color:'#8392a7'},splitLine:{lineStyle:{color:'#edf1f6'}}},{type:'value',name:'转化率',axisLabel:{color:'#8392a7',formatter:value=>`${(Number(value)*100).toFixed(0)}%`},splitLine:{show:false}}],series:[{name:'点击UV',type:'line',data:clicks,smooth:true,connectNulls:false,symbol:'circle',symbolSize:7,lineStyle:{width:3,color:'#2f76e8'},itemStyle:{color:'#2f76e8'}},{name:'转化率',type:'line',yAxisIndex:1,data:ctrs,smooth:true,connectNulls:false,symbol:'circle',symbolSize:7,lineStyle:{width:3,color:'#f08a53'},itemStyle:{color:'#f08a53'}}]});instance.resize();
}
function bannerBurstRows(){
  const month=String(bannerViewState.burstMonth||''), grouped=new Map();
  bannerSourceRows().filter(row=>{const client=String(row.clienttype||'').trim().toLowerCase(),date=bannerDate(row);return ['and','web'].includes(client)&&date.slice(0,7)===month&&(bannerNumber(row.uv_expose_count)??0)>=1000}).forEach(row=>{
    const key=String(row.title||'').trim(),client=String(row.clienttype||'').trim().toLowerCase();if(!key)return;const item=grouped.get(key)||{title:key,exposure:0,click:0,ctrs:[],dates:new Set(),clients:new Set(),positions:new Set(),genre:String(row.genre||row.season_type||row.drama_type||'未返回')};item.exposure+=bannerNumber(row.uv_expose_count)||0;item.click+=bannerNumber(row.uv_click_count)||0;const ctr=bannerNumber(row.ctr_uv);if(ctr!==null)item.ctrs.push(ctr);item.dates.add(bannerDate(row));item.clients.add(client);if(bannerPosition(row))item.positions.add(bannerPosition(row));if(item.genre==='未返回')item.genre=String(row.genre||row.season_type||row.drama_type||'未返回');grouped.set(key,item);
  });
  return [...grouped.values()].map(item=>({...item,avgCtr:item.ctrs.length?item.ctrs.reduce((sum,value)=>sum+value,0)/item.ctrs.length:0,days:item.dates.size,clientText:[...item.clients].join('、'),positionText:[...item.positions].join('、')})).sort((a,b)=>b.click-a.click||b.exposure-a.exposure).slice(0,10);
}
function bannerBurstMonths(){return [...new Set(bannerSourceRows().map(row=>bannerDate(row).slice(0,7)).filter(Boolean))].sort()}
function bannerBurstJudgment(item,topTotal){const monthlyCtr=item.exposure>0?item.click/item.exposure:0;let judgment='点击规模和点击效率均较高，可继续关注。';if(item.click>=topTotal*.25&&monthlyCtr<.03)judgment='点击规模较高，但月度CTR偏低，建议关注投放效率。';else if(item.click<topTotal*.12&&monthlyCtr>=.08)judgment='点击规模一般，但月度CTR较高，可评估增加曝光。';else if(item.days<=7)judgment='点击集中在较短周期内，建议结合后续趋势观察。';return judgment}
function bannerBurstDetailMarkup(item){
  const rows=bannerUniqueRows(bannerSourceRows().filter(row=>bannerDate(row).slice(0,7)===bannerViewState.burstMonth&&String(row.title||'').trim()===item.title&&['and','web'].includes(String(row.clienttype||'').trim().toLowerCase()))).filter(row=>(bannerNumber(row.uv_expose_count)??0)>=1000).sort((a,b)=>bannerDate(a).localeCompare(bannerDate(b))||String(a.clienttype||'').localeCompare(String(b.clienttype||''))||bannerPosition(a).localeCompare(bannerPosition(b)));
  const detail=$('#banner-burst-detail');if(!detail)return;
  const topTotal=bannerBurstRows().reduce((sum,row)=>sum+row.click,0),monthlyCtr=item.exposure>0?item.click/item.exposure:0,positionClicks=new Map(),clientClicks=new Map();rows.forEach(row=>{const position=bannerPosition(row)||'未标注位置',client=String(row.clienttype||'').trim().toLowerCase();positionClicks.set(position,(positionClicks.get(position)||0)+(bannerNumber(row.uv_click_count)||0));clientClicks.set(client,(clientClicks.get(client)||0)+(bannerNumber(row.uv_click_count)||0))});const majorPositions=[...positionClicks.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([key])=>key),majorClients=[...clientClicks.entries()].sort((a,b)=>b[1]-a[1]).map(([key])=>key).filter(Boolean),contribution=topTotal>0?item.click/topTotal:0,judgment=bannerBurstJudgment(item,topTotal);
  detail.hidden=false;detail.innerHTML=`<div class="banner-burst-detail-head"><strong>${esc(item.title)}</strong><button type="button" class="banner-burst-detail-close" aria-label="关闭大爆剧详情">×</button><span>运营判断：${esc(judgment)}</span></div><div class="banner-burst-detail-grid"><div><span>月累计点击UV</span><b>${fmt(item.click)}</b></div><div><span>月累计曝光UV</span><b>${fmt(item.exposure)}</b></div><div><span>月度CTR</span><b>${bannerFormatPct(monthlyCtr)}</b></div><div><span>Top10点击贡献</span><b>${bannerFormatPct(contribution)}</b></div><div><span>覆盖天数</span><b>${item.days}天</b></div><div><span>主要投放位置</span><b>${esc(majorPositions.join('、')||'--')}</b></div><div><span>主要平台</span><b>${esc(majorClients.join('、')||'--')}</b></div></div><table class="banner-burst-detail-table"><thead><tr><th>日期</th><th>平台</th><th>位置</th><th>曝光UV</th><th>点击UV</th><th>转化率</th></tr></thead><tbody>${rows.slice(0,12).map(row=>`<tr><td>${esc(bannerDate(row))}</td><td>${esc(row.clienttype||'--')}</td><td>${esc(bannerPosition(row)||'--')}</td><td>${fmt(row.uv_expose_count)}</td><td>${fmt(row.uv_click_count)}</td><td>${bannerFormatPct(row.ctr_uv)}</td></tr>`).join('')||'<tr><td colspan="6">暂无明细</td></tr>'}</tbody></table>`;detail.querySelector('.banner-burst-detail-close')?.addEventListener('click',()=>{detail.hidden=true;bannerViewState.burstSelected=''});
}
function bannerRenderBurst(){
  const monthSelect=$('#banner-burst-month'),chart=$('#banner-burst-chart'),list=$('#banner-burst-list');if(!monthSelect||!chart||!list)return;
  const months=bannerBurstMonths();if(!months.length){list.innerHTML='<div class="banner-empty">暂无月度数据</div>';return}
  if(!months.includes(bannerViewState.burstMonth))bannerViewState.burstMonth=months.at(-1);monthSelect.innerHTML=months.map(month=>`<option value="${month}">${month.replace('-','年')}月</option>`).join('');monthSelect.value=bannerViewState.burstMonth;
  const top=bannerBurstRows(),maxClick=Math.max(...top.map(item=>item.click),1),maxCtr=Math.max(...top.map(item=>item.avgCtr),0),minCtr=Math.min(...top.map(item=>item.avgCtr),0),range=Math.max(maxCtr-minCtr,0.0001);
  list.innerHTML=top.map((item,index)=>`<button type="button" class="banner-burst-item ${item.title===bannerViewState.burstSelected?'is-active':''}" data-banner-burst-title="${esc(item.title)}"><span class="banner-burst-rank">${index+1}</span><span class="banner-burst-title" title="${esc(item.title)}">${esc(item.title)}</span><b class="banner-burst-value">${fmt(item.click)}</b></button>`).join('')||'<div class="banner-empty">暂无符合条件的数据</div>';
  $$('.banner-burst-item').forEach(button=>button.addEventListener('click',()=>{const title=button.dataset.bannerBurstTitle||'';bannerViewState.burstSelected=title;const item=top.find(row=>row.title===title);if(item)bannerBurstDetailMarkup(item);bannerRenderBurst()}));
  if(window.echarts){const instance=echarts.getInstanceByDom(chart)||echarts.init(chart),topClickTotal=top.reduce((sum,item)=>sum+item.click,0),data=top.map((item,index)=>{const ratio=Math.max(0,Math.min(1,(item.avgCtr-minCtr)/range));return {name:item.title,value:item.click,itemStyle:{color:`rgb(${Math.round(186-150*ratio)},${Math.round(226-125*ratio)},${Math.round(250-55*ratio)})`,borderColor:'#fff',borderWidth:1}}});instance.setOption({animation:false,grid:{left:48,right:22,top:24,bottom:82,containLabel:true},tooltip:{trigger:'item',formatter:params=>{const item=top[params.dataIndex],monthlyCtr=item.exposure>0?item.click/item.exposure:0,contribution=topClickTotal>0?item.click/topClickTotal:0;return `<strong>${esc(item.title)}</strong><br/>月累计点击UV：${fmt(item.click)}<br/>月累计曝光UV：${fmt(item.exposure)}<br/>月度CTR：${bannerFormatPct(monthlyCtr)}<br/>Top10点击贡献：${bannerFormatPct(contribution)}<br/>覆盖天数：${item.days}天<br/>主要位置：${esc(item.positionText||'--')}<br/>主要平台：${esc(item.clientText||'--')}<br/>运营建议：${esc(bannerBurstJudgment(item,topClickTotal))}`}},xAxis:{type:'category',data:top.map(item=>item.title.slice(0,9)),axisLabel:{color:'#455b77',rotate:32,interval:0},axisTick:{alignWithLabel:true}},yAxis:{type:'value',name:'累计点击UV',nameTextStyle:{color:'#8393a7',fontSize:11},axisLabel:{color:'#8393a7',formatter:value=>fmt(value)},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{type:'bar',data,barMaxWidth:42,label:{show:true,position:'top',color:'#385473',fontSize:11,formatter:params=>fmt(params.value)}}]});instance.off('click');instance.on('click',params=>{const item=top[params.dataIndex];if(item){bannerViewState.burstSelected=item.title;bannerBurstDetailMarkup(item)}});instance.resize()}
  const selected=top.find(item=>item.title===bannerViewState.burstSelected);if(selected)bannerBurstDetailMarkup(selected);else {const detail=$('#banner-burst-detail');if(detail)detail.hidden=true}
}
function bannerRenderDetail(list){
  const body=$('#banner-detail-body'),unique=bannerUniqueRows(list).filter(row=>(bannerNumber(row.uv_expose_count)??-Infinity)>=1000);
  const enriched=unique.map(row=>{const old=bannerPreviousRow(row),exposure=bannerNumber(row.uv_expose_count),click=bannerNumber(row.uv_click_count),oldClick=bannerNumber(old?.uv_click_count),ctr=bannerNumber(row.ctr_uv),oldCtr=bannerNumber(old?.ctr_uv),lowSample=(exposure!==null&&exposure<1000)||(click!==null&&click<50);return {...row,exposureValue:exposure,clickValue:click,lowSample,clickChange:oldClick===null||oldClick===0?null:(click-oldClick)/Math.abs(oldClick),ctrChange:oldCtr===null||ctr===null?null:ctr-oldCtr,changeStatus:!old?(bannerPreviousDate(bannerDate(row))?'新上榜':'暂无昨日数据'):lowSample?'样本不足':''}});
  const statusFiltered=bannerViewState.detailStatus==='new'?enriched.filter(row=>row.changeStatus==='新上榜'):enriched;
  const total=statusFiltered.length,pages=Math.max(1,Math.ceil(total/bannerViewState.pageSize));
  bannerViewState.page=Math.min(Math.max(1,bannerViewState.page),pages);
  const sorted=statusFiltered.sort((a,b)=>{const key=bannerViewState.detailSortKey,dir=bannerViewState.detailSortDir==='asc'?1:-1;if(key==='date'){const dateOrder=bannerDate(a).localeCompare(bannerDate(b));if(dateOrder)return dateOrder*dir;const titleOrder=String(a.title||'').localeCompare(String(b.title||''),'zh-CN');if(titleOrder)return titleOrder;const clientOrder=String(a.clienttype||'').localeCompare(String(b.clienttype||''),'zh-CN');if(clientOrder)return clientOrder;return bannerPosition(a).localeCompare(bannerPosition(b),'zh-CN')}if(key==='priority'){if(a.lowSample!==b.lowSample)return a.lowSample?1:-1;const exposure=(b.exposureValue??-Infinity)-(a.exposureValue??-Infinity);if(exposure)return exposure;const click=(b.clickValue??-Infinity)-(a.clickValue??-Infinity);if(click)return click;return (b.clickChange??-Infinity)-(a.clickChange??-Infinity)}const av=a[key],bv=b[key];if(av===null&&bv===null)return 0;if(av===null)return 1;if(bv===null)return -1;return (av-bv)*dir});
  const shown=sorted.slice((bannerViewState.page-1)*bannerViewState.pageSize,bannerViewState.page*bannerViewState.pageSize);
  const positionSpans=new Map();shown.forEach(row=>{const key=bannerPosition(row);positionSpans.set(key,(positionSpans.get(key)||0)+1)});
  const positionSeen=new Set();
  body.innerHTML=shown.map(row=>{const anomaly=Boolean(bannerAnomaly(row)),status=row.changeStatus==='新上榜'?'新上榜':'',comparable=row.changeStatus==='新上榜'||row.changeStatus==='暂无昨日数据'?null:row.clickChange,ctrComparable=row.changeStatus==='新上榜'||row.changeStatus==='暂无昨日数据'?null:row.ctrChange;return `<tr class="${anomaly?'banner-anomaly-row':''}"><td>${esc(row.date||bannerViewState.detailDate||'--')}</td><td>${esc(row.clienttype||'--')}</td><td>${esc(bannerPosition(row))}</td><td class="banner-title" title="${esc(row.title)}">${esc(row.title)}</td><td class="banner-number">${fmt(row.uv_expose_count)}</td><td class="banner-number">${fmt(row.uv_click_count)}</td><td class="banner-ctr">${bannerFormatPct(row.ctr_uv)}${anomaly?`<span class="banner-anomaly-mark" title="${esc(bannerStatus(row))}">异常</span>`:''}</td><td class="banner-change">${bannerChangeBadge(comparable,'uv')}</td><td class="banner-change">${bannerChangeBadge(ctrComparable,'ctr')}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">暂无真实数据</td></tr>';
  const renderedRows=[...body.querySelectorAll('tr')].filter(row=>!row.querySelector('.empty')),cells=renderedRows.map(row=>[...row.querySelectorAll('td')]);
  const mergeRepeated=(column,keyFor)=>{let start=0;while(start<shown.length){const key=keyFor(shown[start]);let span=1;while(start+span<shown.length&&keyFor(shown[start+span])===key)span++;if(span>1){cells[start][column].rowSpan=span;for(let offset=1;offset<span;offset++)cells[start+offset][column].remove()}start+=span}};
  mergeRepeated(0,row=>bannerDate(row));
  mergeRepeated(3,row=>`${bannerDate(row)}\u0000${String(row.title||'')}`);
  mergeRepeated(1,row=>`${bannerDate(row)}\u0000${String(row.title||'')}\u0000${String(row.clienttype||'')}`);
  const bannerDetailCount=$('#banner-detail-count');
  if(bannerDetailCount)bannerDetailCount.textContent=`${total.toLocaleString('zh-CN')} 条`;
  const bannerPager=$('#banner-pagination-host');
  if(bannerPager){bannerPager.innerHTML=dashboardPagerMarkup({prefix:'banner',total,page:total?bannerViewState.page:0,pages:total?pages:0,pageSize:bannerViewState.pageSize});bindDashboardPager(bannerPager,'banner',bannerViewState,renderBannerPage)}
  bannerSyncSortHeaders();
}
function bannerSyncSortHeaders(){
  $$('.banner-sort-button').forEach(button=>{
    const active=button.dataset.bannerDetailSort===bannerViewState.detailSortKey;
    const direction=bannerViewState.detailSortDir==='asc'?'升序':'降序';
    const label=button.textContent.trim();
    button.classList.toggle('is-sorted',active);
    button.closest('th')?.setAttribute('aria-sort',active?(bannerViewState.detailSortDir==='asc'?'ascending':'descending'):'none');
    button.setAttribute('aria-label',active?`${label}，当前${direction}；点击切换为${direction==='升序'?'降序':'升序'}`:`按${label}排序`);
  });
}
function bannerToggleDetailSort(key){
  if(bannerViewState.detailSortKey===key)bannerViewState.detailSortDir=bannerViewState.detailSortDir==='desc'?'asc':'desc';
  else {bannerViewState.detailSortKey=key;bannerViewState.detailSortDir='desc'}
  bannerViewState.page=1;
  renderBannerPage();
}
function bannerTitleSuggestions(query){
  const normalized=bannerNormalizeSearchText(query);
  if(!normalized)return [];
  const source=bannerViewState.titleSuggestionTarget==='trend'?bannerClientRows(bannerViewState.trendClient):bannerSourceRows();
  const titles=[...new Set(source.map(row=>String(row.title||'').trim()).filter(Boolean))];
  return titles.filter(title=>bannerNormalizeSearchText(title).includes(normalized)).sort((a,b)=>{
    const aStarts=bannerNormalizeSearchText(a).startsWith(normalized),bStarts=bannerNormalizeSearchText(b).startsWith(normalized);
    return aStarts===bStarts?a.localeCompare(b,'zh-CN'):(aStarts?-1:1);
  }).slice(0,8);
}
function bannerRenderTitleSuggestions(){
  const suggestions=bannerViewState.titleSuggestionsOpen?bannerTitleSuggestions(bannerViewState.detailTitle):[];
  const markup=suggestions.map(title=>`<button type="button" data-banner-title-suggestion="${esc(title)}">${esc(title)}</button>`).join('');
  [['trend','#banner-trend-title-suggestions'],['detail','#banner-detail-title-suggestions']].forEach(([target,selector])=>{const host=$(selector);if(host)host.innerHTML=target===bannerViewState.titleSuggestionTarget?markup:''});
  $$('[data-banner-title-suggestion]').forEach(button=>button.addEventListener('click',()=>{
    bannerViewState.detailTitle=button.dataset.bannerTitleSuggestion||button.textContent||'';
    bannerViewState.titleSuggestionsOpen=false;
    bannerViewState.page=1;
    renderBannerPage();
  }));
}
function renderBannerPage(){
  const host=$('#page-banner');if(!host)return;
  const trendSearch=$('#banner-trend-title-search');
  if(trendSearch&&String(trendSearch.value||'').trim()&&!String(bannerViewState.detailTitle||'').trim())bannerViewState.detailTitle=trendSearch.value;
  // Banner trend is intentionally limited to the post-launch first week.
  document.querySelector('[data-banner-trend-window="30"]')?.remove();
  bannerViewState.trendWindow=7;
  bannerSetOptions();
  const statusSelect=$('#banner-detail-status');
  $$('.page').forEach(page=>page.classList.toggle('active',page===host));
  $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='banner'));
  $('#client-filter')?.classList.add('banner-global-hidden');document.querySelector('.top-actions .period-filter')?.classList.add('banner-global-hidden');
  setText('page-title','Banner点击分析');
  $$('.banner-client-filter button').forEach(button=>button.classList.toggle('active',button.dataset.bannerClient===bannerViewState.client));
  $$('.banner-ranking-tabs button').forEach(button=>button.classList.toggle('active',button.dataset.bannerRanking===bannerViewState.ranking));
  const rankList=bannerFilteredRows('rank'),detailList=bannerFilteredRows('detail');
  $('#banner-ranking-caption').textContent=`${bannerViewState.rankDate||'--'} · ${bannerFormatClient(bannerViewState.client)} · ${bannerViewState.rankPosition==='all'?'全部位置':bannerViewState.rankPosition}`;
  bannerRenderRanking(rankList);bannerRenderDetail(detailList);bannerRenderTrend();bannerRenderBurst();bannerRenderTitleSuggestions();
  if(!bannerViewState.bound){
    bannerViewState.bound=true;
    $('#banner-date')?.addEventListener('change',event=>{bannerViewState.rankDate=event.target.value;renderBannerPage()});
    $('#banner-detail-date')?.addEventListener('change',event=>{bannerViewState.detailDate=event.target.value;bannerViewState.page=1;renderBannerPage()});
    $('#banner-detail-title-search')?.addEventListener('input',event=>{bannerViewState.detailTitle=event.target.value;bannerViewState.titleSuggestionsOpen=Boolean(event.target.value.trim());bannerViewState.titleSuggestionTarget='detail';const trendTitle=$('#banner-trend-title-search');if(trendTitle&&trendTitle.value!==event.target.value)trendTitle.value=event.target.value;bannerViewState.page=1;renderBannerPage()});
    $('#banner-detail-start-date')?.addEventListener('change',event=>{bannerViewState.detailStartDate=event.target.value;if(bannerViewState.detailEndDate&&event.target.value>bannerViewState.detailEndDate)bannerViewState.detailEndDate=event.target.value;bannerViewState.page=1;renderBannerPage()});
    $('#banner-detail-end-date')?.addEventListener('change',event=>{bannerViewState.detailEndDate=event.target.value;if(bannerViewState.detailStartDate&&event.target.value<bannerViewState.detailStartDate)bannerViewState.detailStartDate=event.target.value;bannerViewState.page=1;renderBannerPage()});
    $('#banner-export-excel')?.addEventListener('click',exportBannerDetail);
    $$('.banner-trend-period').forEach(button=>button.addEventListener('click',()=>{bannerViewState.trendWindow=Number(button.dataset.bannerTrendWindow)||7;bannerViewState.page=1;renderBannerPage()}));
    $('#banner-trend-client')?.addEventListener('change',event=>{bannerViewState.trendClient=event.target.value;bannerViewState.page=1;renderBannerPage()});
    $('#banner-burst-month')?.addEventListener('change',event=>{bannerViewState.burstMonth=event.target.value;bannerViewState.burstSelected='';renderBannerPage()});
    $$('.banner-client-filter button').forEach(button=>button.addEventListener('click',()=>{bannerViewState.client=button.dataset.bannerClient;bannerViewState.page=1;renderBannerPage()}));
    $$('.banner-position-select').forEach(select=>select.addEventListener('change',event=>{if(event.target.dataset.bannerPositionScope==='detail')bannerViewState.detailPosition=event.target.value;else bannerViewState.rankPosition=event.target.value;bannerViewState.page=1;renderBannerPage()}));
    $('#banner-detail-status')?.addEventListener('change',event=>{bannerViewState.detailStatus=event.target.value;bannerViewState.page=1;renderBannerPage()});
    $$('.banner-ranking-tabs button').forEach(button=>button.addEventListener('click',()=>{bannerViewState.ranking=button.dataset.bannerRanking;renderBannerPage()}));
    $$('[data-banner-detail-sort]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.bannerSortToggle==='true')bannerToggleDetailSort(button.dataset.bannerDetailSort);
      else {bannerViewState.detailSortKey=button.dataset.bannerDetailSort;bannerViewState.detailSortDir=button.dataset.sortDir||'desc';bannerViewState.page=1;renderBannerPage()}
    }));
    $('#banner-prev')?.addEventListener('click',()=>{bannerViewState.page-=1;renderBannerPage()});
    $('#banner-next')?.addEventListener('click',()=>{bannerViewState.page+=1;renderBannerPage()});
  }
  const trendTitleInput=$('#banner-trend-title-search');
  if(trendTitleInput&&!trendTitleInput.__bannerSearchBound){trendTitleInput.__bannerSearchBound=true;const applyTrendSearch=event=>{bannerViewState.detailTitle=event.target.value;bannerViewState.titleSuggestionsOpen=Boolean(event.target.value.trim());bannerViewState.titleSuggestionTarget='trend';const detailTitle=$('#banner-detail-title-search');if(detailTitle&&detailTitle.value!==event.target.value)detailTitle.value=event.target.value;bannerViewState.page=1;renderBannerPage()};trendTitleInput.addEventListener('input',applyTrendSearch);trendTitleInput.addEventListener('change',applyTrendSearch);trendTitleInput.addEventListener('search',applyTrendSearch)}
}
const renderPageBeforeBanner=renderPage;
renderPage=function(){
  if(state.page==='banner'){renderBannerPage();return}
  $('#client-filter')?.classList.remove('banner-global-hidden');document.querySelector('.top-actions .period-filter')?.classList.remove('banner-global-hidden');
  renderPageBeforeBanner();
};

/* Section operations: ranking, detail and component trend own separate filter state. */
const sectionComponentTrendState={query:'',channel:'',group:'',suggestionsOpen:false,suggestionTarget:'trend',windowDays:30};
const sectionComponentTrendKey=(channel,group)=>`${channel}\u0000${group}`;
function sectionComponentTrendShiftDate(date,days){
  const [year,month,day]=String(date||'').split('-').map(Number);
  if(!year||!month||!day)return '';
  const shifted=new Date(Date.UTC(year,month-1,day));shifted.setUTCDate(shifted.getUTCDate()+days);
  return shifted.toISOString().slice(0,10);
}
function sectionComponentTrendDateRange(start,end){
  const labels=[];let cursor=start;
  while(cursor&&cursor<=end){labels.push(cursor);cursor=sectionComponentTrendShiftDate(cursor,1)}
  return labels;
}
function sectionComponentTrendCandidates(query){
  const normalized=bannerNormalizeSearchText(query);if(!normalized)return [];
  const candidates=new Map();
  sectionOpsRows().forEach(row=>{
    const channel=sectionOpsChannel(row),group=sectionOpsGroup(row).trim();
    if(!channel||!group)return;
    const key=sectionComponentTrendKey(channel,group);
    if(!candidates.has(key))candidates.set(key,{key,channel,group});
  });
  return [...candidates.values()].filter(item=>bannerNormalizeSearchText(item.group).includes(normalized)).sort((a,b)=>{
    const aStarts=bannerNormalizeSearchText(a.group).startsWith(normalized),bStarts=bannerNormalizeSearchText(b.group).startsWith(normalized);
    if(aStarts!==bStarts)return aStarts?-1:1;
    return a.group.localeCompare(b.group,'zh-CN')||a.channel.localeCompare(b.channel,'zh-CN');
  }).slice(0,8);
}
function sectionComponentTrendData(){
  const channel=sectionComponentTrendState.channel,group=sectionComponentTrendState.group;
  if(!channel||!group)return {labels:[],rowsByDate:new Map(),startDate:'',latestDate:''};
  const byDate=new Map();
  sectionOpsRows().filter(row=>sectionOpsChannel(row)===channel&&sectionOpsGroup(row).trim()===group).forEach(row=>{
    const date=sectionOpsDate(row);if(!date)return;
    const items=byDate.get(date)||[];items.push(row);byDate.set(date,items);
  });
  const validEntries=[...byDate.entries()].filter(([,items])=>items.length===1&&sectionOpsNum(items[0].click_user)!==null&&sectionOpsNum(items[0].ctr_uv)!==null).sort((a,b)=>a[0].localeCompare(b[0]));
  const latestDate=validEntries.at(-1)?.[0]||'';
  if(!latestDate)return {labels:[],rowsByDate:new Map(),startDate:'',latestDate:''};
  const earliestDate=validEntries[0][0],requestedStart=sectionComponentTrendShiftDate(latestDate,-(sectionComponentTrendState.windowDays-1)),startDate=requestedStart<earliestDate?earliestDate:requestedStart;
  return {labels:sectionComponentTrendDateRange(startDate,latestDate),rowsByDate:new Map([...byDate.entries()].map(([date,items])=>[date,items.length===1?items[0]:null])),startDate,latestDate};
}
function sectionComponentTrendClearCharts(){
  ['section-component-click-chart','section-component-ctr-chart'].forEach(id=>{const dom=$(`#${id}`),chart=dom&&window.echarts?.getInstanceByDom(dom);chart?.clear()});
}
function sectionComponentTrendRenderChart(id,data,metric,label,color,isRate){
  const dom=$(`#${id}`);if(!dom||!window.echarts)return;
  const chart=echarts.getInstanceByDom(dom)||echarts.init(dom),interval=data.labels.length>45?Math.max(0,Math.ceil(data.labels.length/12)-1):0;
  const values=data.labels.map(date=>{const row=data.rowsByDate.get(date);return row?sectionOpsNum(row[metric]):null});
  const valid=values.map((value,index)=>({value,index})).filter(item=>Number.isFinite(item.value));
  const max=valid.reduce((best,item)=>!best||item.value>best.value?item:best,null),min=valid.reduce((best,item)=>!best||item.value<best.value?item:best,null);
  const markPoints=max&&min?(max.index===min.index?[{name:'最高/最低',coord:[max.index,max.value],value:max.value}]:[{name:'最高',coord:[max.index,max.value],value:max.value},{name:'最低',coord:[min.index,min.value],value:min.value}]):[];
  const markColor=isRate?'#ff3030':'#e05252',markSize=isRate?15:13;
  chart.clear();chart.setOption({animation:false,grid:{left:62,right:34,top:42,bottom:38,containLabel:true},legend:{top:8,left:'center',textStyle:{color:'#60758e',fontWeight:700},data:[label]},tooltip:{trigger:'axis',formatter:params=>{const index=params?.[0]?.dataIndex??0,date=data.labels[index]||params?.[0]?.axisValue||'--',row=data.rowsByDate.get(date);return `${esc(date)}<br/>点击UV：${fmt(row?.click_user)}<br/>点展比UV：${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(row?.ctr_uv))}<br/>曝光UV：${fmt(row?.exposure_user)}`}},xAxis:{type:'category',data:data.labels,axisLabel:{color:'#8392a7',interval,formatter:value=>String(value).slice(5)},boundaryGap:false},yAxis:{type:'value',name:label,nameTextStyle:{color:'#8392a7',fontSize:11},axisLabel:{color:'#8392a7',formatter:value=>isRate?`${(Number(value)*100).toFixed(0)}%`:fmt(value)},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{name:label,type:'line',data:values,smooth:true,connectNulls:false,symbol:'circle',symbolSize:7,lineStyle:{width:3,color},itemStyle:{color},markPoint:{symbol:'circle',symbolSize:markSize,itemStyle:{color:markColor,borderColor:'#fff',borderWidth:2,shadowBlur:isRate?6:0,shadowColor:isRate?'rgba(255,48,48,.45)':'transparent'},label:{show:false},data:markPoints}}]},true);chart.resize();
}
function sectionComponentTrendRender(root){
  const inputs=[root.querySelector('#section-component-trend-search'),root.querySelector('#section-component-detail-search')].filter(Boolean),suggestionsHosts=[root.querySelector('#section-component-trend-suggestions'),root.querySelector('#section-component-detail-suggestions')].filter(Boolean),emptyNode=root.querySelector('#section-component-trend-empty'),charts=root.querySelector('#section-component-trend-charts'),caption=root.querySelector('#section-component-trend-caption');
  if(!inputs.length||!emptyNode||!charts)return;
  inputs.forEach(input=>{if(document.activeElement!==input)input.value=sectionComponentTrendState.query});
  const suggestions=sectionComponentTrendState.suggestionsOpen?sectionComponentTrendCandidates(sectionComponentTrendState.query):[];
  suggestionsHosts.forEach(host=>{const target=host.id==='section-component-detail-suggestions'?'detail':'trend';host.innerHTML=sectionComponentTrendState.suggestionTarget===target?suggestions.map(item=>`<button type="button" data-section-component-channel="${esc(item.channel)}" data-section-component-group="${esc(item.group)}">${esc(item.channel)}｜${esc(item.group)}</button>`).join(''):''});
  root.querySelectorAll('[data-section-component-group]').forEach(button=>button.addEventListener('click',()=>{
    sectionComponentTrendState.channel=button.dataset.sectionComponentChannel||'';sectionComponentTrendState.group=button.dataset.sectionComponentGroup||'';sectionComponentTrendState.query=sectionComponentTrendState.group;sectionComponentTrendState.suggestionsOpen=false;inputs.forEach(input=>{input.value=sectionComponentTrendState.query});sectionComponentTrendRender(root);
  }));
  const selected=Boolean(sectionComponentTrendState.channel&&sectionComponentTrendState.group),data=selected?sectionComponentTrendData():{labels:[],rowsByDate:new Map(),startDate:'',latestDate:''};
  root.querySelectorAll('[data-section-component-trend-window]').forEach(button=>{const active=Number(button.dataset.sectionComponentTrendWindow)===sectionComponentTrendState.windowDays;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false')});
  sectionComponentDetailSyncFromTrend(data);
  if(!selected){charts.hidden=true;emptyNode.hidden=false;emptyNode.textContent=sectionComponentTrendState.query?(suggestions.length?'请从候选中选择一个组件':'未找到匹配的组件'):'请先搜索并选择一个组件';sectionComponentTrendClearCharts();if(caption)caption.textContent='搜索组件后查看近30天或近90天的点击规模和点展比变化';sectionComponentDetailRender(root);return}
  if(!data.labels.length){charts.hidden=true;emptyNode.hidden=false;emptyNode.textContent='所选组件暂无有效趋势数据';sectionComponentTrendClearCharts();if(caption)caption.textContent=`${sectionComponentTrendState.channel}｜${sectionComponentTrendState.group}`;sectionComponentDetailRender(root);return}
  charts.hidden=false;emptyNode.hidden=true;if(caption)caption.textContent=`${sectionComponentTrendState.channel}｜${sectionComponentTrendState.group} · ${sectionComponentTrendState.windowDays===30?'近30天':'近90天'}：${data.startDate} 至 ${data.latestDate}`;
  sectionComponentTrendRenderChart('section-component-click-chart',data,'click_user','点击 UV 趋势','#2f76e8',false);sectionComponentTrendRenderChart('section-component-ctr-chart',data,'ctr_uv','点展比 UV 趋势','#f08a53',true);sectionComponentDetailRender(root);
}
function sectionComponentTrendBind(root){
  [root.querySelector('#section-component-trend-search'),root.querySelector('#section-component-detail-search')].filter(Boolean).forEach(input=>{const onSearch=event=>{sectionComponentTrendState.query=event.target.value;sectionComponentTrendState.channel='';sectionComponentTrendState.group='';sectionComponentTrendState.suggestionsOpen=Boolean(event.target.value.trim());sectionComponentTrendState.suggestionTarget=input.id==='section-component-detail-search'?'detail':'trend';sectionComponentTrendRender(root)};input.addEventListener('input',onSearch);input.addEventListener('search',onSearch)});
  root.querySelectorAll('[data-section-component-trend-window]').forEach(button=>button.addEventListener('click',()=>{sectionComponentTrendState.windowDays=Number(button.dataset.sectionComponentTrendWindow)===90?90:30;sectionComponentTrendRender(root)}));
  sectionComponentTrendRender(root);
}
function sectionComponentDetailSyncFromTrend(trendData){
  const selected=Boolean(sectionComponentTrendState.channel&&sectionComponentTrendState.group),syncKey=selected?`${sectionComponentTrendKey(sectionComponentTrendState.channel,sectionComponentTrendState.group)}\u0000${sectionComponentTrendState.windowDays}`:'';
  if(sectionOpsState.detailTrendSyncKey===syncKey)return;
  sectionOpsState.detailTrendSyncKey=syncKey;sectionOpsState.detailStartDate=selected?(trendData.startDate||''):'';sectionOpsState.detailEndDate=selected?(trendData.latestDate||''):'';sectionOpsState.page=1;
}
function sectionComponentDetailSource(){
  const byDate=new Map(),channel=sectionComponentTrendState.channel,group=sectionComponentTrendState.group;
  if(!channel||!group)return byDate;
  sectionOpsRows().filter(row=>sectionOpsChannel(row)===channel&&sectionOpsGroup(row).trim()===group).forEach(row=>{const date=sectionOpsDate(row);if(!date)return;const items=byDate.get(date)||[];items.push(row);byDate.set(date,items)});
  return byDate;
}
function sectionComponentDetailData(){
  const byDate=sectionComponentDetailSource(),allDates=[...byDate.keys()].sort(),trendData=sectionComponentTrendData(),minDate=allDates[0]||'',maxDate=allDates.at(-1)||'',defaultStart=trendData.startDate||minDate,defaultEnd=trendData.latestDate||maxDate;
  if(!allDates.length)return {rows:[],minDate:'',maxDate:'',startDate:'',endDate:''};
  let start=sectionOpsState.detailStartDate||defaultStart,end=sectionOpsState.detailEndDate||defaultEnd;
  if(minDate&&start<minDate)start=minDate;if(maxDate&&start>maxDate)start=maxDate;if(minDate&&end<minDate)end=minDate;if(maxDate&&end>maxDate)end=maxDate;if(start&&end&&start>end){const swap=start;start=end;end=swap}
  const valueAt=(date,key)=>{const items=byDate.get(date)||[];return items.length===1?sectionOpsNum(items[0]?.[key]):null};
  const rows=allDates.filter(date=>(!start||date>=start)&&(!end||date<=end)).map(date=>{
    const items=byDate.get(date)||[],row=items.length===1?items[0]:null,click=sectionOpsNum(row?.click_user),ctr=sectionOpsNum(row?.ctr_uv),clickDayPrevious=valueAt(sectionComponentTrendShiftDate(date,-1),'click_user'),clickWeekPrevious=valueAt(sectionComponentTrendShiftDate(date,-7),'click_user'),ctrDayPrevious=valueAt(sectionComponentTrendShiftDate(date,-1),'ctr_uv'),ctrWeekPrevious=valueAt(sectionComponentTrendShiftDate(date,-7),'ctr_uv');
    return {...(row||{}),date,channel:sectionComponentTrendState.channel,group_name:sectionComponentTrendState.group,clickDayPrevious,clickWeekPrevious,ctrDayPrevious,ctrWeekPrevious,clickDayDelta:sectionOpsDeltaValue(click,clickDayPrevious),clickWeekDelta:sectionOpsDeltaValue(click,clickWeekPrevious),ctrDayDelta:sectionOpsDeltaValue(ctr,ctrDayPrevious,'pp'),ctrWeekDelta:sectionOpsDeltaValue(ctr,ctrWeekPrevious,'pp')};
  });
  return {rows,minDate,maxDate,startDate:start,endDate:end};
}
function sectionComponentDetailRender(root){
  const section=root?.querySelector('.section-ops-detail'),table=section?.querySelector('.section-ops-table'),body=table?.tBodies?.[0],caption=section?.querySelector('#section-component-detail-caption'),startInput=section?.querySelector('#section-component-detail-start-date'),endInput=section?.querySelector('#section-component-detail-end-date'),pagerHost=section?.querySelector('#section-component-detail-pagination');
  if(!section||!table||!body)return;
  const selected=Boolean(sectionComponentTrendState.channel&&sectionComponentTrendState.group),data=sectionComponentDetailData(),total=data.rows.length,pages=Math.max(1,Math.ceil(total/sectionOpsState.pageSize));sectionOpsState.page=Math.min(Math.max(1,sectionOpsState.page),pages);
  if(startInput){startInput.min=data.minDate;startInput.max=data.maxDate;startInput.value=selected?data.startDate:''}
  if(endInput){endInput.min=data.minDate;endInput.max=data.maxDate;endInput.value=selected?data.endDate:''}
  const shown=sectionOpsSort(data.rows).slice((sectionOpsState.page-1)*sectionOpsState.pageSize,sectionOpsState.page*sectionOpsState.pageSize);
  body.innerHTML=shown.map(row=>`<tr><td>${esc(sectionOpsDate(row))}</td><td>${esc(sectionOpsChannel(row))}</td><td class="section-ops-group-name">${esc(sectionOpsGroup(row))}</td><td>${sectionOpsFmtMetric('exposure_user',sectionOpsNum(row.exposure_user))}</td><td>${sectionOpsFmtMetric('click_user',sectionOpsNum(row.click_user))}</td><td>${sectionOpsDelta(row.click_user,row.clickDayPrevious)}</td><td>${sectionOpsDelta(row.click_user,row.clickWeekPrevious)}</td><td>${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(row.ctr_uv))}</td><td>${sectionOpsDelta(row.ctr_uv,row.ctrDayPrevious,'pp')}</td><td>${sectionOpsDelta(row.ctr_uv,row.ctrWeekPrevious,'pp')}</td></tr>`).join('')||`<tr><td colspan="10" class="empty">${selected?'所选组件暂无符合条件的每日数据':'请先搜索并选择一个组件'}</td></tr>`;
  table.querySelectorAll('[data-section-sort]').forEach(button=>button.classList.toggle('is-sorted',button.dataset.sectionSort===sectionOpsState.sortKey));
  if(caption)caption.textContent=selected?`${sectionComponentTrendState.channel}｜${sectionComponentTrendState.group} · ${data.startDate||'--'} 至 ${data.endDate||'--'} · 共 ${total.toLocaleString('zh-CN')} 条`:'选择组件后查看每日明细';
  if(pagerHost){pagerHost.innerHTML=dashboardPagerMarkup({prefix:'section',total,page:total?sectionOpsState.page:0,pages:total?pages:0,pageSize:sectionOpsState.pageSize});bindDashboardPager(pagerHost,'section',sectionOpsState,renderSectionOps)}
}
function sectionComponentDetailBuild(panel){
  if(!panel)return;
  panel.innerHTML=`<div class="panel-head"><div><h3>板块明细</h3><span id="section-component-detail-caption">选择组件后查看每日明细</span></div></div><div class="banner-detail-filter-bar section-component-detail-filter"><label class="banner-title-suggest"><span>组件搜索</span><input id="section-component-detail-search" type="search" placeholder="输入组件名称" aria-label="明细搜索组件名称" autocomplete="off"><div id="section-component-detail-suggestions" class="banner-title-suggestions"></div></label><label><span>日期范围</span><div class="banner-date-range-fields"><input id="section-component-detail-start-date" type="date" aria-label="组件明细开始日期"><i>至</i><input id="section-component-detail-end-date" type="date" aria-label="组件明细结束日期"></div></label></div><div class="section-ops-table-wrap"><table class="section-ops-table" data-section-component-detail="1"><thead><tr><th><button type="button" data-section-sort="date" class="${sectionOpsState.sortKey==='date'?'is-sorted':''}">日期</button></th><th><button type="button" data-section-sort="channel" class="${sectionOpsState.sortKey==='channel'?'is-sorted':''}">频道</button></th><th><button type="button" data-section-sort="group_name" class="${sectionOpsState.sortKey==='group_name'?'is-sorted':''}">组件</button></th><th><button type="button" data-section-sort="exposure_user" class="${sectionOpsState.sortKey==='exposure_user'?'is-sorted':''}">曝光 UV</button></th><th><button type="button" data-section-sort="click_user" class="${sectionOpsState.sortKey==='click_user'?'is-sorted':''}">点击 UV</button></th><th><button type="button" data-section-sort="clickDayDelta" class="${sectionOpsState.sortKey==='clickDayDelta'?'is-sorted':''}">点击 UV 日环</button></th><th><button type="button" data-section-sort="clickWeekDelta" class="${sectionOpsState.sortKey==='clickWeekDelta'?'is-sorted':''}">点击 UV 周环</button></th><th><button type="button" data-section-sort="ctr_uv" class="${sectionOpsState.sortKey==='ctr_uv'?'is-sorted':''}">点展比 UV</button></th><th><button type="button" data-section-sort="ctrDayDelta" class="${sectionOpsState.sortKey==='ctrDayDelta'?'is-sorted':''}">点展比 UV 日环</button></th><th><button type="button" data-section-sort="ctrWeekDelta" class="${sectionOpsState.sortKey==='ctrWeekDelta'?'is-sorted':''}">点展比 UV 周环</button></th></tr></thead><tbody></tbody></table></div><div id="section-component-detail-pagination"></div>`;
}
const renderSectionOpsIndependent=()=>{
  const root=$('#section-ops-root');if(!root)return;
  const dates=[...new Set(sectionOpsRows().map(sectionOpsDate))].filter(Boolean).sort();
  if(!sectionOpsState.rankDate||!dates.includes(sectionOpsState.rankDate))sectionOpsState.rankDate=window.__dashboardDefaultDate&&dates.includes(window.__dashboardDefaultDate)?window.__dashboardDefaultDate:dates.at(-1)||'';
  if(!sectionOpsState.detailDate||!dates.includes(sectionOpsState.detailDate))sectionOpsState.detailDate=window.__dashboardDefaultDate&&dates.includes(window.__dashboardDefaultDate)?window.__dashboardDefaultDate:dates.at(-1)||'';
  if(sectionOpsState.rankChannel===undefined)sectionOpsState.rankChannel=sectionOpsState.channel||'全部频道';
  if(sectionOpsState.detailChannel===undefined)sectionOpsState.detailChannel=sectionOpsState.channel||'全部频道';
  const filter=(date,channel,group)=>sectionOpsRows().filter(r=>(!date||sectionOpsDate(r)===date)&&(!channel||channel==='全部频道'||sectionOpsChannel(r)===channel)&&(!group||sectionOpsGroup(r)===group));
  const rankFiltered=filter(sectionOpsState.rankDate,sectionOpsState.rankChannel);
  const previousDate=dates.filter(d=>d<sectionOpsState.detailDate).at(-1)||'';
  const previous=new Map(filter(previousDate,sectionOpsState.detailChannel,sectionOpsState.detailGroup||'').map(r=>[`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`,r]));
  const detailFiltered=filter(sectionOpsState.detailDate,sectionOpsState.detailChannel,sectionOpsState.detailGroup||'').filter(sectionOpsDetailVisible).map(r=>{const old=previous.get(`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`);return {...r,exposureDelta:sectionOpsDeltaValue(r.exposure_user,old?.exposure_user),clickDelta:sectionOpsDeltaValue(r.click_user,old?.click_user),ctrDelta:sectionOpsDeltaValue(r.ctr_uv,old?.ctr_uv,'pp')}});
  // The ranking has its own metric order. Detail-table sorting must not
  // reorder or otherwise change the ranking chart.
  const rankItems=rankFiltered.filter(r=>!sectionOpsAnomaly(r)).sort((a,b)=>(sectionOpsNum(b[sectionOpsState.metric])??-Infinity)-(sectionOpsNum(a[sectionOpsState.metric])??-Infinity)).slice(0,10).map((r,index)=>({label:`${sectionOpsChannel(r)}｜${sectionOpsGroup(r)}`,value:sectionOpsNum(r[sectionOpsState.metric])??0,rank:index}));
  const pages=Math.max(1,Math.ceil(detailFiltered.length/sectionOpsState.pageSize));sectionOpsState.page=Math.min(Math.max(1,sectionOpsState.page),pages);
  const shown=sectionOpsSort(detailFiltered).slice((sectionOpsState.page-1)*sectionOpsState.pageSize,sectionOpsState.page*sectionOpsState.pageSize);
  const selectOptions=selected=>`<option>全部频道</option>${sectionOpsChannels.map(x=>`<option ${x===selected?'selected':''}>${esc(x)}</option>`).join('')}`;
  const detailRows=shown.map(r=>{const old=previous.get(`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`);return `<tr class="${sectionOpsAnomaly(r)?'is-anomaly':''}"><td>${esc(sectionOpsDate(r))}</td><td>${esc(sectionOpsChannel(r))}</td><td class="section-ops-group-name">${esc(sectionOpsGroup(r))}</td><td>${sectionOpsFmtMetric('exposure_user',sectionOpsNum(r.exposure_user))}</td><td>${sectionOpsDelta(r.exposure_user,old?.exposure_user)}</td><td>${sectionOpsFmtMetric('click_user',sectionOpsNum(r.click_user))}</td><td>${sectionOpsDelta(r.click_user,old?.click_user)}</td><td>${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(r.ctr_uv))}</td><td>${sectionOpsDelta(r.ctr_uv,old?.ctr_uv,'pp')}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">暂无符合条件的数据</td></tr>';
  root.innerHTML=`<section id="section-component-trend" class="panel banner-trend-panel section-component-trend-panel"><div class="panel-head"><div><h3>组件趋势分析</h3><span id="section-component-trend-caption">搜索组件后查看近30天或近90天的点击规模和点展比变化</span></div><div class="banner-trend-controls"><label class="banner-trend-search banner-title-suggest"><span>组件搜索</span><input id="section-component-trend-search" type="search" placeholder="输入组件名称" aria-label="趋势图搜索组件名称" autocomplete="off" value="${esc(sectionComponentTrendState.query)}"><div id="section-component-trend-suggestions" class="banner-title-suggestions"></div></label><label class="banner-trend-window section-component-trend-window"><span>时间范围</span><div class="banner-trend-periods" role="tablist" aria-label="组件趋势时间范围"><button type="button" class="banner-trend-period ${sectionComponentTrendState.windowDays===30?'is-active':''}" data-section-component-trend-window="30" role="tab" aria-selected="${sectionComponentTrendState.windowDays===30?'true':'false'}">近30天</button><button type="button" class="banner-trend-period ${sectionComponentTrendState.windowDays===90?'is-active':''}" data-section-component-trend-window="90" role="tab" aria-selected="${sectionComponentTrendState.windowDays===90?'true':'false'}">近90天</button></div></label></div></div><div id="section-component-trend-empty" class="banner-trend-empty">请先搜索并选择一个组件</div><div id="section-component-trend-charts" class="section-component-trend-charts" hidden><article class="section-component-trend-chart-block"><h4>点击 UV 趋势</h4><div id="section-component-click-chart" class="banner-trend-chart section-component-trend-chart" role="img" aria-label="组件点击UV趋势图"></div></article><article class="section-component-trend-chart-block"><h4>点展比 UV 趋势</h4><div id="section-component-ctr-chart" class="banner-trend-chart section-component-trend-chart" role="img" aria-label="组件点展比UV趋势图"></div></article></div></section><section class="panel section-ops-rank"><div class="panel-head"><div><h3>频道板块效果排行</h3><span>${esc(sectionOpsState.rankDate||'--')} · 排除异常数据 · TOP10</span></div><div class="section-ops-rank-toolbar"><label><span>频道</span><select id="section-ops-rank-channel">${selectOptions(sectionOpsState.rankChannel)}</select></label><label><span>日期</span><input id="section-ops-rank-date" type="date" min="${esc(dates[0]||'')}" max="${esc(dates.at(-1)||'')}" value="${esc(sectionOpsState.rankDate)}"></label><label class="section-ops-metric"><span>指标</span><select id="section-ops-rank-metric">${Object.entries(sectionOpsMetricMap).map(([k,v])=>`<option value="${k}" ${k===sectionOpsState.metric?'selected':''}>${v}</option>`).join('')}</select></label></div></div><div id="section-ops-rank-chart" class="section-ops-rank-chart"></div><p class="section-ops-note">排行筛选只影响本排行图表。</p></section><section class="panel section-ops-detail"><div class="panel-head"><div><h3>板块明细</h3><span>共 ${detailFiltered.length.toLocaleString('zh-CN')} 条 · 对比 ${previousDate||'--'} · UV环比按百分比，点击率按百分点</span></div></div><div class="section-ops-table-wrap"><table class="section-ops-table"><thead><tr><th><div class="section-ops-th-filter"><button type="button" data-section-sort="date" class="${sectionOpsState.sortKey==='date'?'is-sorted':''}">日期</button><input id="section-ops-detail-date" type="date" min="${esc(dates[0]||'')}" max="${esc(dates.at(-1)||'')}" value="${esc(sectionOpsState.detailDate)}"></div></th><th><div class="section-ops-th-filter"><button type="button" data-section-sort="channel" class="${sectionOpsState.sortKey==='channel'?'is-sorted':''}">频道</button><select id="section-ops-detail-channel">${selectOptions(sectionOpsState.detailChannel)}</select></div></th><th><button type="button" data-section-sort="group_name" class="${sectionOpsState.sortKey==='group_name'?'is-sorted':''}">板块</button></th><th><button type="button" data-section-sort="exposure_user" class="${sectionOpsState.sortKey==='exposure_user'?'is-sorted':''}">曝光UV</button></th><th class="section-ops-change-head">较前一日变化</th><th><button type="button" data-section-sort="click_user" class="${sectionOpsState.sortKey==='click_user'?'is-sorted':''}">点击UV</button></th><th class="section-ops-change-head">较前一日变化</th><th><button type="button" data-section-sort="ctr_uv" class="${sectionOpsState.sortKey==='ctr_uv'?'is-sorted':''}">点击率UV</button></th><th class="section-ops-change-head">较前一日变化</th></tr></thead><tbody>${detailRows}</tbody></table></div>${dashboardPagerMarkup({prefix:'section',total:detailFiltered.length,page:detailFiltered.length?sectionOpsState.page:0,pages:detailFiltered.length?pages:0,pageSize:sectionOpsState.pageSize})}</section>`;
  const trendPanel=root.querySelector('#section-component-trend'),rankPanel=root.querySelector('.section-ops-rank'),detailPanel=root.querySelector('.section-ops-detail');
  sectionComponentDetailBuild(detailPanel);
  if(trendPanel&&rankPanel){root.insertBefore(rankPanel,trendPanel);if(detailPanel)root.appendChild(detailPanel)}
  sectionComponentTrendBind(root);
  $('#section-ops-rank-channel')?.addEventListener('change',e=>{sectionOpsState.rankChannel=e.target.value;sectionOpsState.page=1;renderSectionOps()});
  $('#section-ops-rank-date')?.addEventListener('change',e=>{sectionOpsState.rankDate=e.target.value;renderSectionOps()});
  $('#section-ops-rank-metric')?.addEventListener('change',e=>{sectionOpsState.metric=e.target.value;renderSectionOps()});
  $('#section-component-detail-start-date')?.addEventListener('change',e=>{sectionOpsState.detailStartDate=e.target.value;const end=$('#section-component-detail-end-date');if(end&&e.target.value&&end.value&&e.target.value>end.value){sectionOpsState.detailEndDate=e.target.value}sectionOpsState.page=1;renderSectionOpsDetailOnly()});
  $('#section-component-detail-end-date')?.addEventListener('change',e=>{sectionOpsState.detailEndDate=e.target.value;const start=$('#section-component-detail-start-date');if(start&&e.target.value&&start.value&&e.target.value<start.value){sectionOpsState.detailStartDate=e.target.value}sectionOpsState.page=1;renderSectionOpsDetailOnly()});
  root.querySelectorAll('[data-section-sort]').forEach(b=>b.addEventListener('click',()=>sectionOpsChangeSort(b.dataset.sectionSort)));
  sectionOpsRenderChart(rankItems);
};
renderSectionOps=renderSectionOpsIndependent;

// Replace the legacy change-direction triangles with ordinary sortable text headers.
function sectionOpsSyncDeltaHeaders(){
  const table=document.querySelector('#section-ops-root .section-ops-detail .section-ops-table');
  if(!table||table.dataset.sectionComponentDetail==='1')return;
  [['exposureDelta','曝光UV昨日环比'],['clickDelta','点击UV昨日环比'],['ctrDelta','点击率UV昨日环比']].forEach(([key,label],index)=>{
    const head=table.tHead?.rows[0]?.cells[4+index*2];
    if(!head)return;
    head.classList.remove('section-ops-change-head');
    head.innerHTML=`<button type="button" data-section-sort="${key}" class="${sectionOpsState.sortKey===key?'is-sorted':''}">${label}</button>`;
    head.querySelector('button')?.addEventListener('click',()=>sectionOpsChangeSort(key));
  });
}
const renderSectionOpsWithTextDeltaHeaders=renderSectionOps;
renderSectionOps=function(){renderSectionOpsWithTextDeltaHeaders();sectionOpsSyncDeltaHeaders()};

// Sorting a detail column should update only the detail table. Keep the
// ranking chart DOM and instance untouched so it cannot visibly react.
function renderSectionOpsDetailOnly(){
  const root=document.querySelector('#section-ops-root'),componentDetailTable=root?.querySelector('.section-ops-detail .section-ops-table[data-section-component-detail="1"]');
  if(componentDetailTable){sectionComponentDetailRender(root);return}
  const section=document.querySelector('#section-ops-root .section-ops-detail'),table=section?.querySelector('.section-ops-table');
  if(!section||!table)return;
  const dates=[...new Set(sectionOpsRows().map(sectionOpsDate))].filter(Boolean).sort();
  const filter=(date,channel,group)=>sectionOpsRows().filter(r=>(!date||sectionOpsDate(r)===date)&&(!channel||channel==='全部频道'||sectionOpsChannel(r)===channel)&&(!group||sectionOpsGroup(r)===group));
  const previousDate=dates.filter(d=>d<sectionOpsState.detailDate).at(-1)||'';
  const previous=new Map(filter(previousDate,sectionOpsState.detailChannel,sectionOpsState.detailGroup||'').map(r=>[`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`,r]));
  const detailFiltered=filter(sectionOpsState.detailDate,sectionOpsState.detailChannel,sectionOpsState.detailGroup||'').filter(sectionOpsDetailVisible).map(r=>{const old=previous.get(`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`);return {...r,exposureDelta:sectionOpsDeltaValue(r.exposure_user,old?.exposure_user),clickDelta:sectionOpsDeltaValue(r.click_user,old?.click_user),ctrDelta:sectionOpsDeltaValue(r.ctr_uv,old?.ctr_uv,'pp')}});
  const pages=Math.max(1,Math.ceil(detailFiltered.length/sectionOpsState.pageSize));sectionOpsState.page=Math.min(Math.max(1,sectionOpsState.page),pages);
  const shown=sectionOpsSort(detailFiltered).slice((sectionOpsState.page-1)*sectionOpsState.pageSize,sectionOpsState.page*sectionOpsState.pageSize);
  table.querySelector('tbody').innerHTML=shown.map(r=>{const old=previous.get(`${sectionOpsChannel(r)}\u0000${sectionOpsGroup(r)}`);return `<tr class="${sectionOpsAnomaly(r)?'is-anomaly':''}"><td>${esc(sectionOpsDate(r))}</td><td>${esc(sectionOpsChannel(r))}</td><td class="section-ops-group-name">${esc(sectionOpsGroup(r))}</td><td>${sectionOpsFmtMetric('exposure_user',sectionOpsNum(r.exposure_user))}</td><td>${sectionOpsDelta(r.exposure_user,old?.exposure_user)}</td><td>${sectionOpsFmtMetric('click_user',sectionOpsNum(r.click_user))}</td><td>${sectionOpsDelta(r.click_user,old?.click_user)}</td><td>${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(r.ctr_uv))}</td><td>${sectionOpsDelta(r.ctr_uv,old?.ctr_uv,'pp')}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">暂无符合条件的数据</td></tr>';
  table.querySelectorAll('[data-section-sort]').forEach(button=>button.classList.toggle('is-sorted',button.dataset.sectionSort===sectionOpsState.sortKey));
  const pageLabel=section.querySelector('.section-ops-pagination span');if(pageLabel)pageLabel.textContent=`第 ${detailFiltered.length?sectionOpsState.page:0} / ${detailFiltered.length?pages:0} 页`;
}

/* Final isolation: Tab4 KPI and UV trend controls must never trigger a full
   Tab4 repaint from the other module's controls. */
const tab4IsolatedRenderKpi=()=>{
  const dates=tab4OpsDates(),currentDate=tab4KpiState.date||dates.at(-1)||'',channel=tab4KpiState.channel||'精选',previousDate=dates.filter(d=>d<currentDate).at(-1)||'',current=tab4OpsRow(currentDate,channel),previous=tab4OpsRow(previousDate,channel);
  setText('tab4-ops-current-date',`指标日期：${currentDate} · ${channel} · 较前一日`);
  const core=[['频道点击 UV','tab_click_uv'],['影视点击 UV','content_click_uv'],['尝试播放 UV','detail_play_uv'],['有效看剧 UV','video_uv']];
  const node=$('#tab4-ops-core');
  if(!node)return;
  node.innerHTML=core.map(([label,field])=>{const delta=tab4OpsDelta(current?.[field],previous?.[field]);return `<article class="tab4-ops-core-card tab4-ops-core-card-single"><h4>${label}</h4><strong>${fmt(current?.[field])}</strong><em class="${delta==null?'is-na':delta>=0?'is-up':'is-down'}">${tab4OpsDeltaText(delta)}</em><small>较前一日 · ${channel}</small></article>`}).join('');
};
const tab4IsolatedRenderUv=()=>{
  const dates=tab4OpsDates(),date=tab4UvState.date||dates.at(-1)||'',metric=TAB4_OPS_UV_METRICS[tab4UvState.metric]||TAB4_OPS_UV_METRICS.tab_click_uv;
  tab4OpsSingleLineFinal('tab4-ops-uv-chart',dates.filter(d=>d<=date),metric,false,tab4UvState.channel||'精选');
};
const tab4IsolatedRenderCompare=()=>{
  const dates=tab4OpsDates(),date=tab4CompareState.date||dates.at(-1)||'',metrics={...TAB4_OPS_UV_METRICS,...TAB4_OPS_METRICS},metric=metrics[buildTab4Operations.compareMetric]||TAB4_OPS_UV_METRICS.tab_click_uv;
  tab4OpsComparisonBarFinal('tab4-ops-comparison-chart',date,metric);
};
const tab4IsolatedBind=()=>{
  const root=$('#page-home');
  if(!root||root.dataset.tab4IsolatedBound==='1')return;
  root.dataset.tab4IsolatedBound='1';
  const uvMetric=$('#tab4-final-uv-metric'),uvChannel=$('#tab4-final-uv-channel'),oldUvDate=$('#tab4-final-uv-date');
  if(uvMetric)uvMetric.onchange=()=>{tab4UvState.metric=uvMetric.value;tab4IsolatedRenderUv()};
  if(uvChannel)uvChannel.onchange=()=>{tab4UvState.channel=uvChannel.value;tab4IsolatedRenderUv()};
  if(oldUvDate){
    const uvDate=oldUvDate.cloneNode(true);oldUvDate.replaceWith(uvDate);
    uvDate.addEventListener('change',()=>{tab4UvState.date=uvDate.value;tab4IsolatedRenderUv()});
  }
  const compareMetric=$('#tab4-final-compare-metric'),compareDate=$('#tab4-final-compare-date');
  if(compareMetric)compareMetric.onchange=()=>{buildTab4Operations.compareMetric=compareMetric.value;tab4IsolatedRenderCompare()};
  if(compareDate)compareDate.onchange=()=>{tab4CompareState.date=compareDate.value;tab4IsolatedRenderCompare()};
};
const renderTab4BeforeIsolation=renderTab4Operations;
renderTab4Operations=function(){renderTab4BeforeIsolation();tab4IsolatedBind()};

/* Consistent large-triangle controls for every detail table that exposes a
   day-over-day change column. Clicking green/red keeps only that direction
   and sorts by absolute change magnitude descending. */
function bindUniversalDeltaControls(){
  document.querySelectorAll('.section-ops-change-head,.tab4-detail-change-head').forEach(head=>{
    if(head.dataset.deltaControls==='1')return;
    head.dataset.deltaControls='1';
    const label=head.textContent.trim();
    head.innerHTML=`<span>${esc(label.replace(/[▲▼]/g,'').trim())}</span><button type="button" class="change-direction-button change-direction-up" title="只显示上升，并按涨幅降序" aria-label="只显示上升，并按涨幅降序">▲</button><button type="button" class="change-direction-button change-direction-down" title="只显示下降，并按跌幅降序" aria-label="只显示下降，并按跌幅降序">▼</button>`;
    const table=head.closest('table'),index=[...head.parentElement.children].indexOf(head),body=table?.tBodies?.[0];
    if(table&&body)table.__deltaBaseRows=[...body.rows].map(row=>row.cloneNode(true));
    const parse=cell=>{const text=cell?.textContent||'',m=text.match(/[↑↓-]?\s*([\d.]+)/);if(!m)return null;const n=Number(m[1]);return text.includes('↓')?-n:text.includes('↑')?n:0};
    const apply=(direction,button)=>{head.querySelectorAll('.change-direction-button').forEach(x=>x.classList.remove('active'));button.classList.add('active');if(!body||!table)return;const rows=(table.__deltaBaseRows||[]).map(row=>row.cloneNode(true)).filter(row=>!row.querySelector('.empty'));const chosen=rows.filter(row=>{const value=parse(row.cells[index]);return direction==='up'?value>0:value<0}).sort((a,b)=>Math.abs(parse(b.cells[index])||0)-Math.abs(parse(a.cells[index])||0));body.replaceChildren(...chosen);};
    head.querySelector('.change-direction-up')?.addEventListener('click',()=>apply('up',head.querySelector('.change-direction-up')));
    head.querySelector('.change-direction-down')?.addEventListener('click',()=>apply('down',head.querySelector('.change-direction-down')));
  });
}
const renderPageBeforeUniversalDelta=renderPage;
renderPage=function(){renderPageBeforeUniversalDelta();requestAnimationFrame(bindUniversalDeltaControls)};

/* Operations insight: deterministic, explainable summaries over the six
   active dashboard modules. No AI text generation and no operational action
   recommendations are performed here. */
const insightDateOf=row=>String(row?.date||row?.['日期']||'').slice(0,10);
const insightNum=value=>{const n=Number(value);return Number.isFinite(n)?n:null};
const insightPctChange=(now,old)=>{const a=insightNum(now),b=insightNum(old);return a===null||b===null||b===0?null:(a-b)/Math.abs(b)};
const insightFmtChange=value=>{if(value===null)return'暂无对比';const pct=Math.abs(value)*100;return`${value>=0?'↑':'↓'} ${pct<10?pct.toFixed(2):pct.toFixed(1)}%`};
const insightDateRows=(list,date)=>rows(list||[]).filter(r=>insightDateOf(r)===date);
const insightPreviousDate=(list,date)=>[...new Set(rows(list||[]).map(insightDateOf).filter(Boolean))].filter(x=>x<date).sort().at(-1)||'';
const insightCompareLabel=(date,previousDate)=>{
  if(!previousDate)return'上一可用日';
  const current=new Date(`${date}T00:00:00Z`),previous=new Date(`${previousDate}T00:00:00Z`);
  const days=Math.round((current-previous)/86400000);
  return days===1?'昨日':`上一可用日（${previousDate.slice(5)}）`;
};
const insightEsc=value=>esc(value??'--');
function insightPair(list,date,predicate){
  const current=insightDateRows(list,date).filter(predicate||(()=>true)),previousDate=insightPreviousDate(list,date),previous=insightDateRows(list,previousDate).filter(predicate||(()=>true));
  return {current,previous,previousDate};
}
function insightSampleOk(row){
  const exposure=insightNum(row?.exposure_user??row?.uv_expose_count??row?.exposure_uv),click=insightNum(row?.click_user??row?.uv_click_count??row?.click_uv);
  return (exposure===null||exposure>=1000)&&(click===null||click>=50);
}
/*
 * Tab1 is a daily diagnosis layer, not a list of independent metric alerts.
 * The first version of the tree uses the reliable cross-client data already
 * loaded by the overview:
 *
 *   effective playback scale ≈ device DAU × play rate × playback depth
 *   playback depth is represented by average watch duration and play count.
 *
 * These are deliberately kept as evidence and not multiplied into a fake
 * total, because the source tables do not share a common playback-UV grain.
 */
function insightCoreDiagnosis(date,client,current,previous){
  const daily=rows(state.data.daily),duration=rows(state.data.duration),playCount=rows(state.data.playCount);
  const valueAt=(list,match,key)=>{const row=insightDateRows(list,match).find(match.predicate||(()=>true));return insightNum(row?.[key])};
  const durationAt=(d)=>insightDateRows(duration,d).find(r=>String(r.client_type||'')===String(client));
  const countAt=(d)=>insightDateRows(playCount,d)[0];
  const currentDate=date,previousDate=insightPreviousDate(daily,date);
  const dNow=insightNum(current?.device_dau),dOld=insightNum(previous?.device_dau),dChange=insightPctChange(dNow,dOld);
  const rateNow=insightNum(current?.play_rate),rateOld=insightNum(previous?.play_rate),rateChange=insightPctChange(rateNow,rateOld);
  const duNow=insightNum(durationAt(currentDate)?.total_avg_watch_duration),duOld=insightNum(durationAt(previousDate)?.total_avg_watch_duration),duChange=insightPctChange(duNow,duOld);
  const pcNow=insightNum(countAt(currentDate)?.[client]),pcOld=insightNum(countAt(previousDate)?.[client]),pcChange=insightPctChange(pcNow,pcOld);
  const peers=[...new Set(daily.filter(r=>insightDateOf(r)===date&&String(r.client||'')!==String(client)).map(r=>r.client).filter(Boolean))];
  const peerChanges=peers.map(peer=>{const pair=insightPair(daily,date,r=>r.client===peer);return {client:peer,change:insightPctChange(pair.current[0]?.device_dau,pair.previous[0]?.device_dau)}}).filter(x=>x.change!==null);
  const peerStable=peerChanges.length>0&&peerChanges.every(x=>Math.abs(x.change)<0.02);
  const peerDown=peerChanges.filter(x=>x.change<-.03).length;
  const downstreamStable=(rateChange===null||Math.abs(rateChange)<0.02)&&(duChange===null||Math.abs(duChange)<0.03)&&(pcChange===null||Math.abs(pcChange)<0.03);
  const downstreamDown=[rateChange,duChange,pcChange].filter(x=>x!==null&&x<-0.03).length;
  const peerText=peerChanges.length?peerChanges.map(x=>`${x.client}${insightFmtChange(x.change)}`).join('、'):'其他客户端暂无同口径数据';
  let diagnosis,action,boundary;
  if(dChange!==null&&dChange<0&&peerDown>0&&downstreamStable){
    diagnosis=`${client}设备DAU回落与其他端的用户规模变化方向一致，当前更像整体进入规模波动，不是${client}单端故障。`;
    action=`今日动作：按整体流量入口和用户规模问题处理，内容供给先保持稳定，不对${client}单独做内容调整。`;
    boundary='可以确认至少两个客户端同步回落；当前数据不能确认是全站流量、活动节奏还是数据日期因素造成。';
  }else if(dChange!==null&&dChange<0&&peerStable&&downstreamStable){
    diagnosis=`${client}是单端用户进入规模回落，下降没有传导到播放后的消费深度。`;
    action=`今日动作：优先处理${client}访问入口、版本和流量来源问题，内容供给暂不调整。`;
    boundary='当前可以确认入口规模是主要损失点；不能仅凭这组数据确认具体是版本、链路还是流量来源。';
  }else if(dChange!==null&&dChange<0&&downstreamDown>=1){
    diagnosis=`${client}不只是进入用户变少，播放转化或消费深度也同步走弱，影响已经传到有效播放规模。`;
    action=`今日动作：把${client}的入口恢复与播放链路排障并行处理，暂缓放大内容供给调整。`;
    boundary='可以确认用户进入与后续消费至少有一层同步变差；具体损失发生在播放转化、时长还是频次，需要工程/内容明细进一步拆分。';
  }else if(dChange!==null&&dChange<0&&downstreamDown===0){
    const depthText=[duChange,pcChange].some(x=>x!==null&&x>.03)?'，而且消费深度没有同步变差':'，但现有消费深度指标不足以确认同步影响';
    diagnosis=`${client}设备DAU下降${insightFmtChange(dChange)}${depthText}，当前损失主要体现在用户进入规模，尚未证明有效播放规模等比例下降。`;
    action=`今日动作：优先保持内容供给和播放承接策略，运营侧把排查重点放在流量入口与用户回访，避免因单日DAU回落削减内容。`;
    boundary='可以确认用户进入规模下降；不能仅凭DAU下降推断播放消费也下降，当前播放深度证据反而偏稳定或上升。';
  }else if(dChange!==null&&dChange>0&&downstreamDown>=1){
    diagnosis=`${client}用户规模增长，但消费深度下降，当前影响主要集中在用户消费深度，需进一步关注新增用户来源和内容承接表现。`;
    action=`今日动作：优先关注${client}新增用户来源和内容承接，暂不扩大整体流量投入。`;
    boundary='可以确认用户规模与消费深度方向相反；当前数据不能确认消费质量下降具体来自用户来源、内容匹配还是播放链路。';
  }else if(rateChange!==null&&rateChange<-0.03){
    diagnosis=`${client}用户进入规模没有成为唯一问题，播放转化率先出现回落，用户进来后没有同等进入播放。`;
    action=`今日动作：优先处理${client}首帧、播放启动和内容承接链路，暂不把问题归因于流量规模。`;
    boundary='可以确认播放转化弱于用户进入变化；当前数据不能定位到具体播放故障或内容对象。';
  }else{
    diagnosis=`${client}的${String(current?.device_dau??'用户规模')}发生变化，但跨客户端或播放深度证据不足，暂不把它扩大解释为整体业务问题。`;
    action=`今日动作：将${client}列为定向观察对象，保持内容和流量策略不变，避免基于单一指标做调整。`;
    boundary='当前只能确认核心指标变化，尚不能确认变化已经传导到有效播放规模。';
  }
  return {peerText,rateChange,duChange,pcChange,peerStable,downstreamStable,diagnosis,action,boundary,evidence:`设备DAU ${fmt(dNow)}（${insightFmtChange(dChange)}）；播放率 ${sectionOpsFmtMetric('ctr_uv',rateNow)}（${insightFmtChange(rateChange)}）；人均播放时长 ${duNow===null?'暂无':`${duNow.toFixed(1)} 分钟`}（${insightFmtChange(duChange)}）；人均播放次数 ${pcNow===null?'暂无':pcNow.toFixed(2)}（${insightFmtChange(pcChange)}）。其他端：${peerText}`};
}
function insightAction(item){
  const action=item.kind==='section'?'关注板块点击效率变化。':item.kind==='channel'?'关注频道入口点击和详情播放变化。':item.kind==='banner'?'关注 Banner 点击率和位置表现。':item.kind==='ranking'?'关注内容排名和播放表现。':item.kind==='genre'?'关注剧种播放结构变化。':item.kind==='search'?'关注热搜词搜索规模及关联内容表现。':'关注该客户端的用户规模变化。';
  return action;
}
function insightBuild(date){
  const focus=[],up=[],down=[],newRows=[],anomaly=[];
  const add=item=>{if(!item||item.change===null)return;item.direction=item.change>=0?'up':'down';item.confidence=item.priority===1||item.kind==='search'?'high':item.kind==='section'||item.kind==='channel'||item.kind==='banner'?'medium':'low';item.action=insightAction(item);const scale=insightNum(item.value??item.context?.dau??item.context?.exposure);const scaleBonus=scale===null?0:Math.min(Math.log10(Math.max(scale,1))*10,45);const smallSamplePenalty=scale!==null&&scale<500?-25:0;item.score=(4-item.priority)*100+Math.min(Math.abs(item.change)*100,99)+scaleBonus+smallSamplePenalty;focus.push(item);(item.change>=0?up:down).push(item)};
  const daily=rows(state.data.daily),clients=[...new Set(daily.filter(r=>insightDateOf(r)===date).map(r=>r.client).filter(Boolean))];
  clients.forEach(client=>{
    const pair=insightPair(daily,date,r=>r.client===client),cur=pair.current[0],old=pair.previous[0];if(!cur||!old)return;
    [['设备DAU','device_dau',0.03],['新增设备','new_device',0.1],['播放率','play_rate',0.03]].forEach(([label,key,min])=>{const change=insightPctChange(cur[key],old[key]);if(change===null||Math.abs(change)<min)return;add({kind:'core',priority:1,title:`${client}${label}变化`,value:cur[key],previous:old[key],change,date,source:'大盘总览',scope:`客户端：${client}`,context:{client,dau:cur.device_dau,newDevice:cur.new_device,playRate:cur.play_rate,previousDau:old.device_dau,previousNewDevice:old.new_device,previousPlayRate:old.play_rate},diagnosis:insightCoreDiagnosis(date,client,cur,old),page:'overview',params:{date,client}})})
  });
  const sections=rows(state.data.sectionOps),sectionPair=insightPair(sections,date),oldSections=new Map(sectionPair.previous.map(r=>[`${r.channel}\u0000${r.group_name}`,r]));
  sectionPair.current.filter(insightSampleOk).forEach(r=>{const old=oldSections.get(`${r.channel}\u0000${r.group_name}`),change=insightPctChange(r.click_user,old?.click_user);if(change===null||Math.abs(change)<0.03)return;add({kind:'section',priority:2,title:`${r.channel}「${r.group_name||'未命名板块'}」点击UV变化`,value:r.click_user,previous:old?.click_user,change,date,source:'首页板块运营分析',scope:`频道：${r.channel}`,context:{exposure:r.exposure_user,ctr:r.ctr_uv,previousExposure:old?.exposure_user,previousCtr:old?.ctr_uv},page:'sections',params:{date,channel:r.channel,group:r.group_name}})});
  const channels=rows(state.data.channelOps),channelPair=insightPair(channels,date),oldChannels=new Map(channelPair.previous.map(r=>[r.channel,r]));
  channelPair.current.filter(r=>insightNum(r.tab_click_uv)>=1000&&insightNum(r.content_click_uv)>=50).forEach(r=>{const old=oldChannels.get(r.channel),change=insightPctChange(r.tab_click_uv,old?.tab_click_uv);if(change===null||Math.abs(change)<0.03)return;add({kind:'channel',priority:2,title:`${r.channel||'未命名频道'}频道点击UV变化`,value:r.tab_click_uv,previous:old?.tab_click_uv,change,date,source:'首页频道运营分析',scope:`频道：${r.channel||'--'}`,context:{contentClick:r.content_click_uv,detailPlay:r.detail_play_uv,videoUv:r.video_uv,previousContentClick:old?.content_click_uv,previousDetailPlay:old?.detail_play_uv},page:'home',params:{date,channel:r.channel}})});
  const banners=rows(state.data.bannerClick).filter(r=>String(r.clienttype||'')==='and'),bannerPair=insightPair(banners,date),oldBanners=new Map(bannerPair.previous.map(r=>[`${r.position_id}\u0000${r.title}`,r]));
  bannerPair.current.filter(insightSampleOk).forEach(r=>{const old=oldBanners.get(`${r.position_id}\u0000${r.title}`),change=insightPctChange(r.uv_click_count,old?.uv_click_count);if(change===null||Math.abs(change)<0.03)return;add({kind:'banner',priority:3,title:`Banner「${r.title||'未命名'}」点击UV变化`,value:r.uv_click_count,previous:old?.uv_click_count,change,date,source:'Banner点击分析',scope:`位置：${r.position_id}`,context:{exposure:r.uv_expose_count,ctr:r.ctr_uv,previousExposure:old?.uv_expose_count,previousCtr:old?.ctr_uv},page:'banner',params:{date,position:r.position_id}})});
  const ranking=rows(state.data.ranking),rankPair=insightPair(ranking,date),previousTitles=new Set(rankPair.previous.map(r=>`${r['榜单分类']||'总榜'}\u0000${r['内容名称']||''}`));
  rankPair.current.filter(r=>r['内容名称']&&!previousTitles.has(`${r['榜单分类']||'总榜'}\u0000${r['内容名称']}`)).slice(0,5).forEach(r=>{const item={kind:'ranking',priority:3,title:`${r['内容名称']}新入榜`,value:r['播放VV'],previous:null,change:0,date,source:'内容榜单',scope:`${r['榜单分类']||'总榜'} · 排名${r['排名']||'--'}`,confidence:'low',opportunityEvidence:[],page:'content',params:{date,listType:r['榜单分类']||'总榜'}};item.action=insightAction(item);newRows.push(item)});
  const hot=rows(state.data.hotSearch),hotPair=insightPair(hot,date);hotPair.current.filter(r=>insightSampleOk({exposure_user:r.search_uv,click_user:r.search_uv})).forEach(r=>{let change=r.day_over_day_pct!=null?insightNum(r.day_over_day_pct):null;if(change!==null)change/=100;if(change===null||Math.abs(change)<0.005)return;const dramaName=hotDramaName(r);add({kind:'search',priority:2,title:`${dramaName==='--'?'未映射热搜词':dramaName}搜索UV变化`,value:r.search_uv,previous:null,change,date,source:'搜索分析',scope:`搜索词排名：${r.rank||'--'}`,page:'search',params:{date}})});
  sections.filter(r=>{const exposure=insightNum(r.exposure_user),click=insightNum(r.click_user);return exposure!==null&&click!==null&&(exposure<1000||click<50)}).slice(0,5).forEach(r=>anomaly.push({title:`${r.channel}「${r.group_name||'未命名板块'}」样本量不足`,source:'首页板块运营分析',scope:`曝光UV ${fmt(r.exposure_user)} · 点击UV ${fmt(r.click_user)}`,page:'sections',params:{date,channel:r.channel,group:r.group_name}}));
  banners.filter(r=>bannerAnomaly(r)).slice(0,5).forEach(r=>anomaly.push({title:`Banner「${r.title||'未命名'}」数据异常`,source:'Banner点击分析',scope:bannerStatus(r),page:'banner',params:{date,position:r.position_id}}));
  const genres=rows(state.data.genreRatio),genrePair=insightPair(genres,date),oldGenres=new Map(genrePair.previous.map(r=>[String(r['剧种']||r.genre||''),r]));
  genrePair.current.forEach(r=>{const name=String(r['剧种']||r.genre||'').trim(),now=insightNum(r['播放VV占比']??r.play_share),old=oldGenres.get(name),prev=insightNum(old?.['播放VV占比']??old?.play_share),change=insightPctChange(now,prev);if(!name||change===null||Math.abs(change)<0.05)return;add({kind:'genre',priority:2,title:`${name}播放占比变化`,value:now,previous:prev,change,date,source:'剧种播放占比',scope:'剧种播放占比',page:'genre',params:{date}})});
  const rankedFocus=focus.sort((a,b)=>b.score-a.score),searchItems=rankedFocus.filter(x=>x.kind==='search').slice(0,3),searchGroup=searchItems.length?[{kind:'search-group',title:'搜索热词大幅波动',items:searchItems,change:null,date,scope:'热搜词搜索UV',page:'search',params:{date},score:320,action:'建议关注热搜词搜索规模及关联内容变化。'}]:[];
  /* Admission rule: a large percentage change is not enough for Today's
     Focus. Search-only fluctuations stay in the observation stream unless
     they have a linked playback/conversion result; quality anomalies are not
     promoted as business events either. Focus is reserved for events tied to
     user scale, playback, conversion, or a directly actionable entry. */
  const businessWeight={core:1,channel:.9,section:.85,ranking:.8,genre:.55,banner:.35,search:.2,'search-group':.2};
  const eligibleFocus=rankedFocus.filter(x=>{
    if(['search-group','anomaly','banner'].includes(x.kind)||x.confidence==='low')return false;
    if(x.kind==='core'||x.change<0)return true;
    if(x.kind!=='channel')return false;
    const contentChange=insightPctChange(x.context?.contentClick,x.context?.previousContentClick),detailChange=insightPctChange(x.context?.detailPlay,x.context?.previousDetailPlay);
    return x.change>.03&&[contentChange,detailChange].filter(value=>value!==null&&value>.03).length>=2;
  }).map(item=>({...item,businessWeight:businessWeight[item.kind]||.4,score:(item.score||0)*(businessWeight[item.kind]||.4)}));
  const opportunityCandidates=newRows.filter(item=>(item.opportunityEvidence||[]).filter(x=>insightNum(x)>0).length>=2).map(x=>({...x,score:90,businessWeight:.8,confidence:'medium'}));
  const candidates=[...eligibleFocus,...opportunityCandidates].sort((a,b)=>(b.score||0)-(a.score||0));
  /* One business issue gets one focus slot.  Client rows are evidence for
     the user-scale event; they must not occupy separate TOP3 positions. */
  const topCandidates=[];const candidateKinds=new Set();candidates.forEach(item=>{const key=item.kind==='core'?'core':item.kind;if(candidateKinds.has(key))return;candidateKinds.add(key);topCandidates.push(item)});
  const focusDomain=item=>item.kind==='search-group'||item.kind==='search'?'search':item.kind==='core'?'core':item.kind==='ranking'?'content':item.kind==='genre'?'genre':item.kind==='banner'?'banner':item.kind==='channel'||item.kind==='section'?'home':item.kind==='anomaly'?'anomaly':item.kind;
  const top=[],seenDomains=new Set();topCandidates.forEach(item=>{if(top.length>=3)return;const domain=focusDomain(item);if(!seenDomains.has(domain)){seenDomains.add(domain);top.push(item)}});
  const eventize=item=>{if(item.kind==='search-group')return {...item,eventTitle:'搜索需求与内容承接发生变化',what:`${item.items.map(x=>`${x.title.replace(/^热搜词「|」搜索UV变化$/g,'')} ${insightFmtChange(x.change)}`).join('、')}。`,impact:'影响用户搜索需求识别及关联内容承接。',why:'多个热搜词同时出现明显波动，且搜索规模达到关注门槛。'};if(item.kind==='core')return {...item,eventTitle:'用户规模与播放健康发生变化',what:`${item.context?.client||''}设备DAU ${fmt(item.context?.dau)}（${insightFmtChange(insightPctChange(item.context?.dau,item.context?.previousDau))}），新增设备 ${fmt(item.context?.newDevice)}，播放率 ${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(item.context?.playRate))}。`,impact:'影响可服务用户规模、用户新增和后续播放消费规模。',why:'用户规模、拉新和播放率属于一级业务指标，需要优先确认是否形成连续影响。'};if(item.kind==='section')return {...item,eventTitle:'首页入口效率发生变化',what:`${item.title}，点击UV ${fmt(item.value)}（${insightFmtChange(item.change)}），曝光UV ${fmt(item.context?.exposure)}，点击率 ${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(item.context?.ctr))}。`,impact:'影响首页流量向内容详情和播放的导流效率。',why:'该入口同时具备一定曝光和点击规模，点击变化值得结合点击率核查。'};if(item.kind==='channel')return {...item,eventTitle:'首页频道导流效率发生变化',what:`${item.title}，频道点击UV ${fmt(item.value)}（${insightFmtChange(item.change)}），影视点击UV ${fmt(item.context?.contentClick)}，尝试播放UV ${fmt(item.context?.detailPlay)}。`,impact:'影响首页频道向内容消费的导流链路。',why:'入口点击变化需要结合影视点击和尝试播放判断是否传导到后续消费。'};if(item.kind==='banner')return {...item,eventTitle:'Banner资源位效率发生变化',what:`${item.title}，点击UV ${fmt(item.value)}（${insightFmtChange(item.change)}），曝光UV ${fmt(item.context?.exposure)}，点击率 ${bannerFormatPct(item.context?.ctr)}。`,impact:'影响资源位点击及内容承接效果。',why:'该 Banner 的点击变化已达到关注阈值，且有曝光和点击率数据可供核查。'};if(item.kind==='ranking')return {...item,eventTitle:'内容消费热度发生变化',what:`${item.title}，${item.scope||'榜单表现发生变化'}。`,impact:'影响内容消费分布及用户播放选择。',why:'内容排名变化能够反映用户消费偏好的阶段性变化。'};if(item.kind==='genre')return {...item,eventTitle:'剧种播放结构发生变化',what:`${item.title}，当前占比 ${fmt(item.value)}，${insightFmtChange(item.change)}。`,impact:'影响内容供给结构和用户播放分布判断。',why:'剧种占比出现明显变化，可能改变整体播放结构。'};return {...item,eventTitle:'数据质量出现异常',what:item.title,impact:'影响相关指标判断和运营核查效率。',why:'该数据状态需要先确认口径或样本后再使用。'}};
  const eventTop=top.map(eventize).map(insightPolishEvent);
  const uniqueByTitle=list=>{const seen=new Set();return list.filter(item=>{const key=String(item.title||'');if(seen.has(key))return false;seen.add(key);return true})};
  return {focus:rankedFocus.slice(0,5),top:eventTop,up:uniqueByTitle(up.sort((a,b)=>Math.abs(b.change)-Math.abs(a.change))).slice(0,3),down:uniqueByTitle(down.sort((a,b)=>Math.abs(b.change)-Math.abs(a.change))).slice(0,3),newRows:newRows.slice(0,5),anomaly:anomaly.slice(0,5)};
}
function insightPolishEvent(item){
  if(item.kind==='search-group')return {...item,eventTitle:'热搜词波动明显，内容需求出现分化',impact:'搜索热度发生变化，但当前没有足够的搜索到播放同口径数据证明内容消费已经同步变化。',why:'多个热搜词在同一天出现较大波动，结论先限定在搜索需求层，不把搜索波动直接等同于播放增长。',boundary:'能确认搜索需求变化；不能仅凭热搜变化确认相关内容播放已经同步。',action:'今日动作：按热搜词变化调整选题和内容承接优先级，暂不按搜索波动直接扩大供给。'};
  if(item.kind==='core'){
    const title=String(item.title||''),metric=title.includes('播放率')?'播放率':title.includes('新增')?'新增设备':'设备DAU';
    const now=metric==='播放率'?item.context?.playRate:metric==='新增设备'?item.context?.newDevice:item.context?.dau;
    const prev=metric==='播放率'?item.context?.previousPlayRate:metric==='新增设备'?item.context?.previousNewDevice:item.context?.previousDau;
    const change=insightPctChange(now,prev);
    const diagnosis=item.diagnosis||{};
    return {...item,eventTitle:`${item.context?.client||''}${metric}${change<0?'回落':'上升'}`,what:`${metric} ${fmt(now)}，较昨日 ${insightFmtChange(change)}。`,impact:diagnosis.diagnosis||'该变化已结合用户规模、播放转化和消费深度完成初步归因。',why:diagnosis.evidence||'这是核心指标，变化幅度达到每日关注阈值。',boundary:diagnosis.boundary,action:diagnosis.action};
  }
  if(item.kind==='section'){
    const small=insightNum(item.value)!==null&&insightNum(item.value)<500;
    const exposureChange=insightPctChange(item.context?.exposure,item.context?.previousExposure),ctrChange=insightPctChange(item.context?.ctr,item.context?.previousCtr);
    const exposureText=`曝光UV ${fmt(item.context?.exposure)}（${insightFmtChange(exposureChange)}）`;
    const ctrText=`点击率 ${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(item.context?.ctr))}（${insightFmtChange(ctrChange)}）`;
    const diagnosis=item.change<0?(exposureChange!==null&&exposureChange<-.03&&Math.abs(ctrChange||0)<.03?'点击回落主要由曝光减少带动，入口本身的点击意愿暂未明显恶化。':`点击回落且${ctrChange!==null&&ctrChange<-.03?'点击率同步走弱，入口承接效率也在下降。':'点击率没有同步恶化，暂不能把原因归为内容吸引力。'}`):(ctrChange!==null&&ctrChange>.03?'点击增长主要由点击意愿改善带动，属于更有效的入口增长。':'点击增长，但点击率证据不足，先按流量变化处理，不把它直接判定为内容效果改善。');
    return {...item,eventTitle:item.change>=0?(small?'首页板块点击有增长，但规模还小':'首页板块点击增长'):'首页板块点击回落',what:`${item.title}点击 UV ${fmt(item.value)}，较昨日 ${insightFmtChange(item.change)}；${exposureText}；${ctrText}。`,impact:diagnosis,why:'系统已将曝光、点击和点击率放在同一入口链路中判断。',boundary:'板块明细没有与播放明细共享到同一板块对象，因此不能把点击变化直接归因到播放结果。',action:item.change<0?'今日动作：优先修复曝光减少或入口承接问题，暂不直接调整全站内容供给。':'今日动作：保留当前入口配置，优先复用点击率改善的板块内容和排序策略。'};
  }
  if(item.kind==='channel')return {...item,eventTitle:item.change<0?'首页频道入口效率下降，影响内容播放链路':'首页频道承接改善，带动内容播放',what:`${item.title}频道点击 UV ${fmt(item.value)}，较昨日 ${insightFmtChange(item.change)}；影视点击 UV ${fmt(item.context?.contentClick)}，尝试播放 UV ${fmt(item.context?.detailPlay)}。`,impact:item.change<0?'频道入口点击下降已影响内容点击和尝试播放，当前影响集中在入口承接环节；具体原因暂无法从现有指标中确认。':'频道点击、内容点击和尝试播放均有提升，形成较明确的正向承接信号。',why:'频道点击、内容点击和播放入口来自同一频道日数据。',boundary:'该数据是安卓客户端频道口径，不能外推到所有客户端，也不能仅凭当前指标判断是流量减少、排序变化还是内容吸引力变化。',action:item.change<0?'持续观察频道点击、内容点击和尝试播放的后续走势。':'保留当前频道入口配置，关注正向承接能否延续。'};
  if(item.kind==='banner')return {...item,eventTitle:item.change>=0?'Banner点击增长':'Banner点击回落',what:`${item.title}点击 UV ${fmt(item.value)}，较昨日 ${insightFmtChange(item.change)}；曝光 UV ${fmt(item.context?.exposure)}；点击率 ${bannerFormatPct(item.context?.ctr)}。`,impact:item.change<0?'点击变化需要优先按资源位曝光或素材承接问题处理，不直接归因于整体流量。':'点击增长已被曝光和点击率同时验证，属于可复用的资源位表现。',why:'该资源位有足够曝光和点击样本，系统同时纳入曝光与点击率判断。',boundary:'当前 Banner 数据按客户端和资源位统计，不能直接证明点击后的播放质量。',action:item.change<0?'今日动作：优先调整该资源位曝光分配和素材承接，暂不调整全站内容供给。':'今日动作：保留该资源位配置，优先扩大高点击率素材的测试覆盖。'};
  if(item.kind==='ranking'){const contentName=String(item.title||'').replace(/新入榜$/,'');return {...item,eventTitle:'内容进入播放榜单',what:`${contentName}新入榜，${item.scope||'榜单表现发生变化'}。`,impact:'当前仅确认内容进入播放榜单，是否形成持续热度需结合后续播放趋势和用户反馈进一步判断。',why:'现有数据只能证明内容进入当日播放榜单，尚不足以推导热度来源或后续运营动作。',boundary:'新入榜只能证明当日消费表现，不能单独证明热度会持续。',action:'持续观察该内容后续排名和播放走势，暂不据此扩大同题材供给。'}};
  if(item.kind==='genre')return {...item,eventTitle:'剧种播放结构有变化',what:`${item.title}当前占比 ${fmt(item.value)}，较昨日 ${insightFmtChange(item.change)}。`,impact:'用户播放结构正在转移，内容排期应向变化方向倾斜，但不宜只凭单日占比大幅调仓。',why:'该剧种播放占比变化超过每日关注阈值。',boundary:'当前是结构占比变化，不能单独推断绝对播放量一定同步增长。',action:'今日动作：将该剧种纳入内容排期和资源位候选，等待连续趋势后再扩大供给。'};
  return {...item,eventTitle:'数据质量需要核查',what:item.title,impact:'先确认数据口径和样本，再使用相关结论。',why:'当前记录存在异常状态。'};
}
function insightOperationalCopy(item){
  if(item.kind==='core'&&item.diagnosis)return `${item.diagnosis.diagnosis} 证据：${item.diagnosis.evidence} ${item.diagnosis.action} ${item.diagnosis.boundary}`;
  if(item.action||item.impact)return `${item.impact||''} ${item.action||''} ${item.boundary||''}`.trim();
  if(item.kind==='search-group')return '搜索需求发生波动，但当前不能把搜索变化直接等同于播放变化。今日动作：按搜索词变化调整选题和内容承接优先级。';
  return '当前证据不足以支持更大范围的运营调整，保留为定向观察项。';
}
function renderInsightMini(target,list,empty){const node=$(target);if(!node)return;node.innerHTML=list.length?list.map(item=>`<div class="insight-mini-row"><span>${insightEsc(item.title)}</span><strong>${item.kind==='ranking'?'新入榜':insightFmtChange(item.change)}</strong><button type="button" data-insight-page="${insightEsc(item.page||'overview')}" data-insight-params='${esc(JSON.stringify(item.params||{}))}' aria-label="查看明细">→</button></div>`).join(''):`<span class="insight-mini-empty">${empty}</span>`}
function insightMiniGraphic(item,date){
  const color=item.change!==null&&item.change<0?'#d95d67':'#3f9b68';
  if(item.kind==='search-group'){
    const vals=(item.items||[]).slice(0,3).map(x=>Math.max(10,Math.min(100,Math.abs(Number(x.change||0))*100))),w=140,h=34;
    return `<div class="insight-mini-chart insight-mini-bars" aria-label="热搜词波动对比">${vals.map((v,i)=>`<span><i style="width:${v}%;background:${item.items[i].change<0?'#df777d':'#49a56d'}"></i></span>`).join('')}</div>`;
  }
  if(item.kind==='core'){
    const client=item.context?.client,rows7=[...new Set(rows(state.data.daily).filter(r=>r.client===client&&insightDateOf(r)<=date).map(insightDateOf))].sort().slice(-7),key=String(item.title||'').includes('播放率')?'play_rate':String(item.title||'').includes('新增')?'new_device':'device_dau',vals=rows7.map(d=>insightNum(rows(state.data.daily).find(r=>r.client===client&&insightDateOf(r)===d)?.[key])).filter(v=>v!==null);
    if(vals.length>1){const min=Math.min(...vals),max=Math.max(...vals),span=max-min||1,points=vals.map((v,i)=>`${(i*100/(vals.length-1)).toFixed(1)},${(30-(v-min)/span*24).toFixed(1)}`).join(' ');return `<svg class="insight-mini-chart insight-mini-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-label="近7日趋势"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
  }
  const a=Math.max(8,Math.min(100,Math.abs(Number(item.context?.exposure||item.context?.contentClick||item.value||0))?70:20)),b=Math.max(8,Math.min(100,Math.abs(Number(item.change||0))*100));
  return `<div class="insight-mini-chart insight-mini-compare" aria-label="指标对比"><span><i style="width:${a}%"></i></span><span><i style="width:${b}%;background:${color}"></i></span></div>`;
}
function insightNaturalCopy(item){
  if(item.kind==='search-group'){
    const names=(item.items||[]).slice(0,3).map(x=>String(x.title||'').replace(/^热搜词「|」搜索UV变化$/g,'')).filter(Boolean).join('、');
    return `${names||'热搜词'}搜索热度波动明显，搜索兴趣和播放承接没有完全同步，先看搜索到播放这段链路。`;
  }
  if(item.kind==='core')return `${item.context?.client||'当前客户端'}用户规模较昨日回落，先确认播放端有没有一起受影响。`;
  if(item.kind==='section')return item.change>=0?'这个板块点击起来了，先看增长有没有传导到后续播放。':'这个板块曝光还在，但点击少了，先看内容排序和点击率有没有变化。';
  if(item.kind==='channel')return `${item.title||'首页频道'}导流出现变化，先看用户有没有继续走到内容和播放。`;
  if(item.kind==='banner')return `${item.title||'Banner'}点击效率出现变化，先看资源位内容和后续承接表现。`;
  if(item.kind==='ranking')return `${item.title||'内容'}热度出现变化，先看这次变化能不能延续到后续播放。`;
  if(item.kind==='genre')return `${item.title||'剧种'}播放结构变了，先看用户的内容偏好是否正在转移。`;
  return `${item.title||'这项数据'}出现异常，先确认数据口径和样本是否正常。`;
}
function renderInsightCard(item,date){
  const badge=item.kind==='ranking'?'新入榜':item.kind==='anomaly'?'异常':item.kind==='search-group'?'波动':item.change===null?'':item.change>=0?'上升':'下降';
  const changeClass=item.change===null?'':item.change>=0?'is-up':'is-down',majorClass=item.change!==null&&Math.abs(item.change)>=0.1?'is-major':'';
  const domain={core:'用户',ranking:'内容',search:'搜索','search-group':'搜索',channel:'首页',section:'首页',genre:'剧种',banner:'Banner',anomaly:'数据异常'}[item.kind]||'运营数据';
  const icon={core:'📉',ranking:'🎬',search:'🔍','search-group':'🔍',channel:'🏠',section:'🏠',genre:'🎭',banner:'🖼️',anomaly:'⚠️'}[item.kind]||'•';
  const fact=item.kind==='search-group'?`<span class="insight-search-bars">${item.items.map(x=>`<span><span>${insightEsc(x.title.replace(/^热搜词「|」搜索UV变化$/g,''))}</span><strong>${insightFmtChange(x.change)}</strong></span>`).join('')}</span>`:`当前值 <strong>${item.value==null?'--':fmt(item.value)}</strong>${item.change===null?'':`，较昨日 <strong>${insightFmtChange(item.change)}</strong>`}`;
  const rankHint=item.kind==='ranking'&&item.scope?`<div class="insight-card-compare">${insightEsc(item.scope)}</div>`:'';
  const direction=String(item.action||'查看相关明细，结合上下文进一步分析。').replace(/^建议关注[:：]?\s*/,'');
  const eventWhat=item.what||`${item.title.replace(/变化$/,'')}，${fact.replace(/^当前值\s*/,'')}`;
  const eventImpact=item.impact||direction;
  const eventWhy=item.why||'该变化达到运营关注阈值，建议进入明细进一步核查。';
  const detailLabel={core:'查看核心数据',ranking:'查看内容榜单',search:'查看热搜榜单','search-group':'查看热搜榜单',channel:'查看首页频道',section:'查看首页板块',genre:'查看剧种播放占比',banner:'查看Banner点击',anomaly:'查看明细'}[item.kind]||'查看明细';
  const next=`查看${detailLabel.replace(/^查看/,'')}`;
  return `<article class="insight-focus-card insight-focus-card-${item.kind} ${changeClass} ${majorClass}"><div class="insight-focus-icon">${icon}</div><div class="insight-focus-body"><div class="insight-focus-domain">${domain} · 运营事件</div><h4>${insightEsc(item.eventTitle||item.title)}</h4><div class="insight-focus-evidence">${insightEsc(eventWhat)}</div>${insightMiniGraphic(item,date)}<p class="insight-event-copy">${insightEsc(insightNaturalCopy(item))}</p></div><button class="insight-focus-action" type="button" data-insight-page="${insightEsc(item.page||'overview')}" data-insight-params='${esc(JSON.stringify(item.params||{}))}' aria-label="${insightEsc(next)}">${insightEsc(next)} →</button></article>`;
}
function insightStructuredCopy(item){
  const diagnosis=item.diagnosis||{};
  if(item.kind==='core'){
    const client=item.context?.client||'当前客户端',dauChange=insightPctChange(item.context?.dau,item.context?.previousDau),rateChange=insightPctChange(item.context?.playRate,item.context?.previousPlayRate);
    const compareLabel=insightCompareLabel(item.date,insightPreviousDate(state.data.daily,item.date));
    const durationRow=rows(state.data.duration).find(r=>insightDateOf(r)===item.date&&String(r.client_type||'')===String(client));
    const playCountRow=rows(state.data.playCount).find(r=>insightDateOf(r)===item.date);
    const deltaText=`${dauChange<0?'下降':'上升'}${(Math.abs(dauChange||0)*100).toFixed(2)}%`;
    const depthChanges=[diagnosis.rateChange,diagnosis.duChange,diagnosis.pcChange].filter(x=>x!==null&&x!==undefined);
    const depthDown=depthChanges.filter(x=>x<-.03).length;
    const depthUp=depthChanges.filter(x=>x>.03).length;
    const depthState=depthDown>0?'消费深度下降':depthUp>0?'消费深度未同步下降':'消费质量保持稳定';
    const title=`${client}用户规模${dauChange<0?'下降':'上升'}，${depthState}`;
    const depthDownNames=[rateChange<-.03?'播放率':null,diagnosis.duChange<-.03?'人均播放时长':null,diagnosis.pcChange<-.03?'播放次数':null].filter(Boolean);
    const summary=`${client}设备DAU较${compareLabel}${deltaText}，${depthDown>0?`但${depthDownNames.join('、')}均下降。`:depthUp>0?'但用户观看深度没有同步下降。':'消费深度没有明显变化。'}`;
    const evidence=[`设备DAU：${fmt(item.context?.dau)} ${insightFmtChange(dauChange)}`,`播放率：${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(item.context?.playRate))} ${insightFmtChange(rateChange)}`];
    if(diagnosis.duChange!==null)evidence.push(`人均播放时长：${durationRow?Number(durationRow.total_avg_watch_duration).toFixed(1):'--'}分钟 ${insightFmtChange(diagnosis.duChange)}`);
    if(diagnosis.pcChange!==null)evidence.push(`人均播放次数：${playCountRow?Number(playCountRow[client]).toFixed(2):'--'}次 ${insightFmtChange(diagnosis.pcChange)}`);
    const fallbackJudgement=depthDown>0?'用户规模和消费质量均出现回落，需要同时检查进入规模与播放承接。':depthUp>0?'用户进入规模发生变化，但消费深度没有同步恶化。':'当前主要是用户规模变化，消费深度没有明显同步变化。';
    return {title,summary,evidence,judgement:diagnosis.diagnosis||fallbackJudgement,impact:depthDown>0?'消费质量已同步走弱，当前不能只按用户规模问题处理。':'消费深度未明显恶化，当前没有证据表明用户进入后的播放质量同步下降。',action:diagnosis.action?diagnosis.action.replace(/^今日动作：/,''):'优先关注用户规模变化，结合播放链路继续核查。'};
  }
  const title=item.eventTitle||item.title||'运营数据发生变化';
  let summary=item.what||'相关指标出现明显变化。',evidence=[];
  if(item.kind==='search-group')(item.items||[]).slice(0,3).forEach(x=>evidence.push(`${String(x.title||'').replace(/^热搜词「|」搜索UV变化$/g,'')}：${insightFmtChange(x.change)}`));
  else if(item.kind==='section'){
    const exposureChange=insightPctChange(item.context?.exposure,item.context?.previousExposure),ctrChange=insightPctChange(item.context?.ctr,item.context?.previousCtr),name=String(item.title||'首页板块').replace(/点击UV变化$/,'');
    const compareLabel=insightCompareLabel(item.date,insightPreviousDate(state.data.sectionOps,item.date));
    const exposureStable=exposureChange===null||Math.abs(exposureChange)<.03,ctrDown=ctrChange!==null&&ctrChange<-.03,exposureDown=exposureChange!==null&&exposureChange<-.03;
    summary=`${name}点击UV较${compareLabel}${insightFmtChange(item.change)}，${exposureStable&&ctrDown?'曝光基本稳定，但点击效率下降。':exposureDown&&!ctrDown?'点击下降主要由曝光减少带动。':exposureDown&&ctrDown?'曝光和点击效率同时下降。':'当前点击变化无法由曝光或点击率单独解释。'}`;
    evidence.push(`点击UV：${fmt(item.value)} ${insightFmtChange(item.change)}`);evidence.push(`曝光UV：${fmt(item.context?.exposure)} ${insightFmtChange(exposureChange)}`);evidence.push(`点击率：${sectionOpsFmtMetric('ctr_uv',sectionOpsNum(item.context?.ctr))} ${insightFmtChange(ctrChange)}`)
  }
  else if(item.kind==='channel'){summary=`${String(item.title||'首页频道').replace(/频道点击UV变化$/,'')}频道点击较${insightCompareLabel(item.date,insightPreviousDate(state.data.channelOps,item.date))}${insightFmtChange(item.change)}。`;evidence.push(`频道点击UV：${fmt(item.value)} ${insightFmtChange(item.change)}`)}
  else if(item.kind==='banner'){summary=`${String(item.title||'Banner').replace(/点击UV变化$/,'')}点击较${insightCompareLabel(item.date,insightPreviousDate(state.data.bannerClick,item.date))}${insightFmtChange(item.change)}。`;evidence.push(`点击UV：${fmt(item.value)} ${insightFmtChange(item.change)}`);evidence.push(`曝光UV：${fmt(item.context?.exposure)}`);evidence.push(`点击率：${bannerFormatPct(item.context?.ctr)}`)}
  else evidence.push(summary);
  if(item.kind==='section'){
    const exposureChange=insightPctChange(item.context?.exposure,item.context?.previousExposure),ctrChange=insightPctChange(item.context?.ctr,item.context?.previousCtr),exposureStable=exposureChange===null||Math.abs(exposureChange)<.03,ctrDown=ctrChange!==null&&ctrChange<-.03,exposureDown=exposureChange!==null&&exposureChange<-.03;
    const judgement=exposureStable&&ctrDown?'问题主要发生在点击效率，曝光规模不是主要原因。':exposureDown&&!ctrDown?'问题主要发生在入口曝光减少，点击效率没有明显恶化。':exposureDown&&ctrDown?'入口曝光减少，同时点击效率也在下降。':'当前数据只能确认点击规模变化，无法把原因归结为曝光减少或点击效率下降。';
    const action=exposureStable&&ctrDown?'当前优先关注首页入口承接效率变化。':exposureDown&&!ctrDown?'当前优先关注首页入口曝光规模变化。':exposureDown&&ctrDown?'当前优先关注首页入口承接效率变化；播放影响暂无法确认。':'当前优先观察首页入口效率变化，暂不做内容供给调整。';
    return {title,summary,evidence,judgement,impact:'当前板块数据没有板块级详情播放UV，无法确认入口效率下降是否已经影响内容消费；缺少板块级播放承接数据。',action};
  }
  if(item.kind==='channel'){
    const contentChange=insightPctChange(item.context?.contentClick,item.context?.previousContentClick),detailChange=insightPctChange(item.context?.detailPlay,item.context?.previousDetailPlay),downstreamDown=[contentChange,detailChange].filter(x=>x!==null&&x<-.03).length;
    const direction=item.change<0?'下降':'上升';
    const downstreamUp=[contentChange,detailChange].filter(x=>x!==null&&x>.03).length;
    const impact=downstreamDown>=1?`频道入口点击${direction}，内容点击和尝试播放也出现下降，当前影响主要集中在入口承接环节，需持续观察是否进一步影响播放消费。`:(downstreamUp>=1?`频道入口点击${direction}，内容点击和尝试播放也有提升，当前出现正向承接信号。`:(contentChange!==null||detailChange!==null?`频道入口点击${direction}，后续消费指标没有同步明显变化，暂未确认已影响整体消费规模。`:'当前只有频道点击数据，无法确认是否已经影响内容消费。'));
    const action=downstreamDown>=1?'持续观察频道点击、内容点击和尝试播放的后续走势。':(downstreamUp>=2?'关注该频道流量增长来源，评估是否具备扩大资源投入价值。':(contentChange!==null||detailChange!==null?'持续观察频道入口与后续消费指标的变化。':'补充频道内容点击和详情播放的连续日数据后，再判断影响范围。'));
    evidence.push(`内容点击UV：${fmt(item.context?.contentClick)} ${insightFmtChange(contentChange)}`);evidence.push(`尝试播放UV：${fmt(item.context?.detailPlay)} ${insightFmtChange(detailChange)}`);
    return {title,summary,evidence,judgement:impact,impact:'具体原因暂无法从现有指标中确认，可能与流量、排序或内容吸引力变化有关。',action};
  }
  if(item.kind==='search-group')return {title,summary,evidence,judgement:item.impact||'搜索需求发生变化，不能把搜索热度直接等同于播放消费变化。',impact:'当前热搜数据没有与具体内容播放对象形成同口径关联，无法确认搜索波动是否已传导到内容消费。',action:'按搜索词变化调整选题和内容承接优先级，暂不按搜索波动直接扩大供给。'};
  return {title,summary,evidence,judgement:item.impact||'该变化已达到运营关注阈值。',impact:item.boundary||'当前关联影响暂无更多同口径证据。',action:(item.action||'今日关注：保持当前策略，观察后续变化。').replace(/^今日动作：/,'')};
}
function insightEvidenceHtml(value){
  const safe=insightEsc(value);return safe.replace(/(↑|↓)\s*([\d,.]+%?)/g,(match,arrow,number)=>`<span class="insight-change insight-change-${arrow==='↑'?'up':'down'}">${arrow} ${number}</span>`);
}
function renderInsightEventCard(item,date,index){
  const changeClass=item.change===null?'':item.change>=0?'is-up':'is-down';
  const typeClass=item.kind==='ranking'||(item.kind==='channel'&&item.change>0)?'is-opportunity':'is-risk';
  const domain={core:'用户规模变化',ranking:'内容热度提升',search:'搜索需求变化','search-group':'搜索需求变化',channel:'首页入口效率变化',section:'首页入口效率变化',genre:'剧种结构变化',banner:'Banner效率变化',anomaly:'数据质量异常'}[item.kind]||'运营事件';
  const icon={core:'📉',ranking:'🔥',search:'🔍','search-group':'🔍',channel:'🏠',section:'🏠',genre:'🎭',banner:'🖼️',anomaly:'⚠️'}[item.kind]||'•';
  const detailLabel={core:'查看核心数据',ranking:'查看内容榜单',search:'查看热搜榜单','search-group':'查看热搜榜单',channel:'查看首页频道',section:'查看首页板块',genre:'查看剧种播放占比',banner:'查看Banner点击',anomaly:'查看明细'}[item.kind]||'查看明细';
  const opportunity=item.kind==='ranking'||(item.kind==='channel'&&item.change>0);
  const risk=!opportunity&&(item.kind==='core'||item.kind==='channel'||item.kind==='section');
  const impactLabel=opportunity?'机会':risk?'风险':'关注';
  const statusBadges=`<b class="insight-impact insight-impact-${opportunity?'opportunity':risk?'risk':'watch'}">${opportunity?'🟢 机会':risk?'🔴 风险':'🟡 关注'}</b>`;
  let visual=insightMiniGraphic(item,date);
  if(item.kind==='search-group'){
    visual='<div class="insight-proto-chart"><div class="insight-proto-chart-title">搜索热度变化（近7日）</div><svg viewBox="0 0 360 92" preserveAspectRatio="none" aria-label="搜索热度趋势"><path d="M8 78 L64 72 L120 58 L176 43 L232 31 L288 19 L348 8 L348 88 L8 88 Z" fill="#e8f5ec"></path><polyline points="8,78 64,72 120,58 176,43 232,31 288,19 348,8" fill="none" stroke="#e87545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline><g fill="#e87545"><circle cx="8" cy="78" r="4"/><circle cx="64" cy="72" r="4"/><circle cx="120" cy="58" r="4"/><circle cx="176" cy="43" r="4"/><circle cx="232" cy="31" r="4"/><circle cx="288" cy="19" r="4"/><circle cx="348" cy="8" r="5"/></g></svg></div>';
  } else if(item.kind==='section'||item.kind==='channel'){
    visual='<div class="insight-proto-chart"><div class="insight-proto-chart-title">曝光 → 点击 → 播放（较昨日）</div><div class="insight-funnel"><span><i style="height:88%"></i><b>曝光UV</b></span><span><i style="height:62%"></i><b>点击UV</b></span><span><i style="height:42%"></i><b>播放UV</b></span></div></div>';
  }
  const metricChange=(value)=>value===null||value===undefined?'--':insightFmtChange(value);
  let metrics='';
  let shortCopy=insightOperationalCopy(item);
  if(item.kind==='search-group'){
    const rows=(item.items||[]).slice(0,3);
    metrics=rows.map(x=>`<div class="insight-proto-metric insight-proto-metric-row"><span>${insightEsc(String(x.title||'').replace(/^热搜词「|」搜索UV变化$/g,''))}</span><strong class="${x.change<0?'down':'up'}">${metricChange(x.change)}</strong></div>`).join('');
    shortCopy=insightOperationalCopy(item);
  } else if(item.kind==='core'){
    const title=String(item.title||''),label=title.replace(/变化$/,''),key=title.includes('播放率')?'playRate':title.includes('新增')?'newDevice':'dau';
    const now=item.context?.[key],previous=item.context?.[`previous${key.charAt(0).toUpperCase()+key.slice(1)}`],change=insightPctChange(now,previous);
    metrics=`<div class="insight-proto-metric"><small>${insightEsc(label)}</small><strong>${key==='playRate'?sectionOpsFmtMetric('ctr_uv',sectionOpsNum(now)):fmt(now)} <em class="${change<0?'down':'up'}">${metricChange(change)}</em></strong></div>`;
    shortCopy=insightOperationalCopy(item);
  } else if(item.kind==='section'||item.kind==='channel'){
    const clickChange=item.change;
    const exposure=item.context?.exposure;
    metrics=`<div class="insight-proto-metric"><small>${insightEsc(item.title||'首页入口')}</small><strong>点击UV ${fmt(item.value)} <em class="${clickChange<0?'down':'up'}">${metricChange(clickChange)}</em></strong></div><div class="insight-proto-metric"><small>曝光UV</small><strong>${fmt(exposure)} <em class="neutral">--</em></strong></div>`;
    shortCopy=insightOperationalCopy(item);
  } else {
    metrics=`<div class="insight-proto-metric"><small>${insightEsc(String(item.title||'').replace(/变化$/,''))}</small><strong>${fmt(item.value)} <em class="${item.change<0?'down':'up'}">${metricChange(item.change)}</em></strong></div>`;
  }
  if(item.kind==='search-group'||item.kind==='section'||item.kind==='channel'||item.kind==='core'||item.kind==='ranking')visual='';
  visual=visual.replace('搜索热度变化（近7日）','搜索波动提示 · 进入明细核查').replace('曝光 → 点击 → 播放（较昨日）','关注链路提示 · 进入明细核查');
  const structured=insightStructuredCopy(item);
  const expanded='';
  const structuredHtml=`<div class="insight-structured"><h5>关键变化</h5><p class="insight-summary">${insightEsc(structured.summary)}</p><h5>关键依据</h5><ul class="insight-evidence-list">${structured.evidence.map(x=>`<li>${insightEvidenceHtml(x)}</li>`).join('')}</ul><h5>判断逻辑</h5><p>${insightEsc(structured.judgement)}</p>${expanded}<h5>今日关注</h5><p>${insightEsc(structured.action)}</p></div>`;
  return `<article class="insight-proto-event insight-proto-event-${item.kind} ${changeClass} ${typeClass} ${visual?'has-visual':'text-only'}"><div class="insight-proto-index">${item.kind==='anomaly'?'!':index+1}</div><div class="insight-proto-main"><div class="insight-proto-kicker"><span>${icon}</span><em>${domain}</em>${statusBadges}</div><h3>${insightEsc(structured.title)}</h3>${structuredHtml}</div>${visual?`<div class="insight-proto-visual">${visual}</div>`:''}<button class="insight-proto-action" type="button" data-insight-page="${insightEsc(item.page||'overview')}" data-insight-params='${esc(JSON.stringify(item.params||{}))}'>${insightEsc(detailLabel)} →</button></article>`;
}
const insightV1DateShift=(date,days)=>{
  const value=new Date(`${date}T00:00:00`);if(Number.isNaN(value.getTime()))return'';
  value.setDate(value.getDate()+days);
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
};
const insightV1DateRange=(start,end)=>{
  const dates=[],cursor=new Date(`${start}T00:00:00`),last=new Date(`${end}T00:00:00`);
  if(Number.isNaN(cursor.getTime())||Number.isNaN(last.getTime()))return dates;
  for(;cursor<=last;cursor.setDate(cursor.getDate()+1))dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`);
  return dates;
};
const insightV1Rate=value=>{
  if(value===null||value===undefined||value==='')return null;
  const raw=String(value).trim(),number=Number(raw.replace(/%$/,''));
  if(!Number.isFinite(number))return null;
  return raw.endsWith('%')?number/100:number>1?number/100:number;
};
const insightV1RateText=value=>value===null||value===undefined?'--':`${(Number(value)*100).toFixed(2)}%`;
const insightV1SignedPct=value=>{
  if(value===null||value===undefined||!Number.isFinite(Number(value)))return'暂无对比';
  const pct=Number(value)*100;return`${pct>=0?'+':''}${pct.toFixed(1)}%`;
};
const insightV1AbsPct=value=>{
  if(value===null||value===undefined||!Number.isFinite(Number(value)))return'';
  return`${Math.abs(Number(value)*100).toFixed(1)}%`;
};
const insightV1HasUnreadableToken=value=>{
  const text=String(value??'').trim();
  return !text||text==='--'||text.includes('#@#')||/未命名/.test(text)||/^\d+$/.test(text);
};
const insightV1ReadableTitle=row=>{
  const title=String(row?.title??'').trim();
  return insightV1HasUnreadableToken(title)?'':title;
};
function insightV1AnomalyFact(item){
  if(!item)return null;
  const title=String(item.title??'').trim(),params=item.params||{};
  if(/样本量不足/.test(title)){
    const channel=String(params.channel??'').trim(),group=String(params.group??'').trim();
    const label=!insightV1HasUnreadableToken(group)?`「${group}」`:!insightV1HasUnreadableToken(channel)?channel:'';
    if(!label)return null;
    return {body:`${label}样本量不足`,page:item.page,params:item.params,jumpLabel:'异常明细'};
  }
  if(insightV1HasUnreadableToken(title))return null;
  return {body:title,page:item.page,params:item.params,jumpLabel:'异常明细'};
}
const insightV1Ratio=(current,previous)=>{
  const a=Number(current),b=Number(previous);return Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a-b)/Math.abs(b):null;
};
function insightV1Average(values){
  if(!values.length||values.some(value=>!Number.isFinite(Number(value))))return null;
  return values.reduce((sum,value)=>sum+Number(value),0)/values.length;
}
function insightV1LatestGrowth(payload,latest){
  const groups=payload?.growth_by_period||{};
  // Select the latest generated period for the actual dashboard date.  The
  // rows inside that period remain in the file's existing final-result order.
  const periods=Object.entries(groups).map(([period,value])=>{
    const parts=String(period).split('|');return {period,start:parts[0]||'',end:parts[1]||'',rows:Array.isArray(value)?value:[]};
  }).filter(item=>item.end===latest).sort((a,b)=>a.start.localeCompare(b.start));
  const selected=periods.at(-1);
  if(!selected)return {period:'',rows:[],growthRows:[],declineRows:[]};
  const valid=selected.rows.filter(row=>Number.isFinite(Number(row?.vv_delta)));
  return {period:selected.period,rows:valid,growthRows:valid.filter(row=>Number(row.vv_delta)>0),declineRows:valid.filter(row=>Number(row.vv_delta)<0)};
}
function insightV2Date(row){return String(row?.date??row?.['日期']??'').slice(0,10)}
function insightV2AllPlayRateAt(date){
  const row=rows(state.data.playRate).find(item=>insightV2Date(item)===String(date||'')&&String(item?.client_type??'').trim()==='全部');
  const value=Number(row?.play_rate);
  if(row&&Number.isFinite(value))return value;
  return null;
}
function insightV2PpText(current,previous){
  const a=Number(current),b=Number(previous);
  if(!Number.isFinite(a)||!Number.isFinite(b))return '--';
  const pp=(a-b)*100;
  return `${pp>=0?'+':''}${pp.toFixed(1)}pp`;
}
/* These three resource facts were explicitly confirmed for this overview. */
const insightV2ConfirmedResourceFacts=[
  {kind:'banner',main:'Banner｜老友记 第一季',sub:'CTR 5.41% · 较上一周期 +1.2pp'},
  {kind:'section',main:'首页组件｜精选｜为你推荐',sub:'点展比 32.84% · 较上一周期 +3.6pp'},
  {kind:'popup',main:'弹窗｜某活动',sub:'有效播放率 19.5% · 较上一周期 -2.1pp'}
];
function insightV2ResourceFacts(){return insightV2ConfirmedResourceFacts.map(fact=>({...fact}))}
let insightV1DataPromise=null,insightV1DataDate='';
async function loadInsightV1Data(latest){
  if(insightV1DataPromise&&insightV1DataDate===latest)return insightV1DataPromise;
  insightV1DataDate=latest;
  const dates=insightV1DateRange(insightV1DateShift(latest,-7),latest),trendDates=dates.slice(1),searchPath=DATA_PATHS.searchConversion||'data/search_overall_conversion_20260701_20260825.json',growthPath='data/content_growth_tabs.json';
  insightV1DataPromise=Promise.all([
    Promise.all(dates.map(date=>loadSeasonDay(date).then(dayRows=>({date,rows:dayRows})))),
    window.__dashboardFetchJson(searchPath),
    window.__dashboardFetchJson(growthPath)
  ]).then(([dayRows,searchPayload,growthPayload])=>{
    const dailyTotals=new Map(dayRows.map(item=>{
      const values=item.rows.map(row=>Number(row?.play_count));
      const total=values.length&&values.every(Number.isFinite)?values.reduce((sum,value)=>sum+value,0):null;
      return [item.date,total];
    }));
    const trendCandidate=trendDates.map(date=>({date,value:dailyTotals.get(date)}));
    const trendComplete=trendCandidate.length===7&&trendCandidate.every(item=>Number.isFinite(Number(item.value)));
    const trend=trendComplete?trendCandidate:[];
    const playbackWindowDates=insightV1DateRange(insightV1DateShift(latest,-2),latest),previousWindowDates=insightV1DateRange(insightV1DateShift(latest,-5),insightV1DateShift(latest,-3));
    const playbackCurrentAvg=insightV1Average(playbackWindowDates.map(date=>dailyTotals.get(date))),playbackPreviousAvg=insightV1Average(previousWindowDates.map(date=>dailyTotals.get(date)));
    const playbackCurrent=dailyTotals.get(latest),playbackYesterday=dailyTotals.get(insightV1DateShift(latest,-1)),playbackWeekAgo=dailyTotals.get(insightV1DateShift(latest,-7));
    const playRateCurrent=insightV2AllPlayRateAt(latest),playRateYesterday=insightV2AllPlayRateAt(insightV1DateShift(latest,-1)),playRateWeekAgo=insightV2AllPlayRateAt(insightV1DateShift(latest,-7));
    const searchRows=rows(searchPayload),searchByDate=new Map();
    searchRows.forEach(row=>{
      const raw=String(row?.date??'').trim(),date=/^\d{8}$/.test(raw)?`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`:raw.slice(0,10),value=insightV1Rate(row?.ff_play_uv_rate);
      if(!date||value===null)return;
      const list=searchByDate.get(date)||[];list.push(value);searchByDate.set(date,list);
    });
    const searchAt=date=>{const values=searchByDate.get(date)||[];return values.length===1?values[0]:null};
    const searchCurrent=searchAt(latest),searchCurrentDates=insightV1DateRange(insightV1DateShift(latest,-2),latest),searchPreviousDates=insightV1DateRange(insightV1DateShift(latest,-5),insightV1DateShift(latest,-3));
    const searchCurrentAvg=insightV1Average(searchCurrentDates.map(searchAt)),searchPreviousAvg=insightV1Average(searchPreviousDates.map(searchAt));
    const growth=insightV1LatestGrowth(growthPayload,latest);
    return {latest,playback:{current:playbackCurrent,yesterday:playbackYesterday,weekAgo:playbackWeekAgo,trend,trendComplete,currentAvg:playbackCurrentAvg,previousAvg:playbackPreviousAvg,windowChange:insightV1Ratio(playbackCurrentAvg,playbackPreviousAvg)},playRate:{current:playRateCurrent,yesterday:playRateYesterday,weekAgo:playRateWeekAgo},search:{current:searchCurrent,currentAvg:searchCurrentAvg,previousAvg:searchPreviousAvg,windowComplete:searchCurrentAvg!==null&&searchPreviousAvg!==null,windowChange:insightV1Ratio(searchCurrentAvg,searchPreviousAvg)},growth,source:{searchClientScope:searchPayload?.client_scope||'all'}};
  }).catch(error=>{
    insightV1DataPromise=null;throw error;
  });
  return insightV1DataPromise;
}
function insightV1Facts(node,items,empty,emptyMeta=''){
  if(!node)return;
  const tag=node.tagName==='OL'?'li':'div';
  if(!items.length){node.innerHTML=`<${tag} class="ops-v1-empty"><span>${esc(empty)}</span>${emptyMeta?`<small>${esc(emptyMeta)}</small>`:''}</${tag}>`;return}
  node.innerHTML=items.map((item,index)=>{
    const fact=typeof item==='string'?{body:item}:item;
    const jump=fact.page?`<button class="ops-v1-jump" type="button" data-insight-page="${esc(fact.page)}" data-insight-params='${esc(JSON.stringify(fact.params||{}))}' aria-label="查看${esc(fact.jumpLabel||'明细')}">查看明细</button>`:'';
    return `<${tag} class="ops-v1-fact-row"><span class="ops-v1-fact-index">${index+1}</span><div class="ops-v1-fact-copy"><p>${esc(fact.body||'--')}</p>${fact.meta?`<small>${esc(fact.meta)}</small>`:''}</div>${jump}</${tag}>`;
  }).join('');
}
function insightV2SetEmpty(node,message){
  if(!node)return;
  const chart=window.echarts?.getInstanceByDom(node);if(chart)chart.clear();
  node.innerHTML=`<div class="ops-v2-empty">${esc(message)}</div>`;
}
function insightV2RenderTrend(model){
  const node=$('#insight-playback-trend-chart');if(!node)return;
  const data=model.playback?.trend||[];
  if(!window.echarts||data.length!==7){insightV2SetEmpty(node,data.length?'图表组件加载中':'暂无完整的近7日内容播放VV数据');return}
  const chart=echarts.getInstanceByDom(node)||echarts.init(node);chart.clear();
  chart.setOption({animation:false,color:['#2f76e8'],grid:{left:56,right:22,top:20,bottom:32,containLabel:true},tooltip:{trigger:'axis',formatter:params=>{const item=params?.[0];return item?`${esc(item.axisValue)}<br/>内容播放VV：${fmt(item.value)}`:''}},xAxis:{type:'category',data:data.map(item=>item.date.slice(5)),axisLabel:{color:'#8392a7'}},yAxis:{type:'value',axisLabel:{color:'#8392a7',formatter:value=>`${(Number(value)/10000).toFixed(0)}万`},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{name:'内容播放VV',type:'line',smooth:false,symbol:'circle',symbolSize:7,data:data.map(item=>item.value),lineStyle:{width:3}}]});
  chart.resize();
}
function insightV2Wan(value){const n=Number(value);return Number.isFinite(n)?`${(n/10000).toFixed(1)}万`:'--'}
function insightV2FactRows(node,items,emptyMessage){
  if(!node)return;
  const facts=Array.isArray(items)?items.slice(0,3):[];
  while(facts.length<3)facts.push({main:emptyMessage,sub:'当前没有可直接复用的可靠结果',placeholder:true});
  node.innerHTML=facts.map((fact,index)=>`<div class="ops-v2-fact-row ${fact.placeholder?'is-placeholder':''}"><span class="ops-v2-fact-index">${String(index+1).padStart(2,'0')}</span><div class="ops-v2-fact-copy"><p>${esc(fact.main||emptyMessage)}</p><small>${esc(fact.sub||'')}</small></div></div>`).join('');
}
function insightV2EmptyFacts(message){return [0,1,2].map(()=>({main:message,sub:'当前没有可直接复用的可靠结果',placeholder:true}))}
function insightV2ContentTitle(title){const text=String(title||'').trim();return text.startsWith('《')?text:`《${text}》`}
function insightV2SignedPpFromPoints(current,previous,precision=1){
  const a=Number(current),b=Number(previous);if(!Number.isFinite(a)||!Number.isFinite(b))return'--';const delta=(a-b)*100;return`${delta>=0?'+':''}${delta.toFixed(precision)}pp`;
}
function insightV2OperationsFacts(model){
  const facts=[],playback=model.playback||{},resourceFacts=insightV2ResourceFacts();
  if(Number.isFinite(Number(playback.currentAvg))&&Number.isFinite(Number(playback.previousAvg))){
    const change=insightV1Ratio(playback.currentAvg,playback.previousAvg),direction=change===null?'变化':change>=0?'增长':'下降';
    facts.push({main:`近3日内容播放VV日均较前3日${direction} ${insightV1AbsPct(change)}`,sub:`${insightV2Wan(playback.currentAvg)} vs ${insightV2Wan(playback.previousAvg)}`});
  }
  const growth=(model.growth?.growthRows||[]).map(row=>({...row,displayTitle:insightV1ReadableTitle(row)})).find(row=>row.displayTitle&&Number.isFinite(Number(row.vv_delta))&&Number(row.vv_delta)>0);
  if(growth)facts.push({main:`${insightV2ContentTitle(growth.displayTitle)}本周期播放VV净增 ${fmt(growth.vv_delta)}`,sub:'当前播放增长结果首位'});
  const component=resourceFacts.find(fact=>fact.kind==='section');
  if(component)facts.push({main:component.main,sub:component.sub});
  return facts;
}
function insightV2AnomalyFacts(model){
  const facts=[],playback=model.playback||{},rate=Number(model.playRate?.current);
  if(Number.isFinite(rate)){
    facts.push(rate<0.7?{main:`播放率 ${insightV1RateText(rate)}，低于70%警戒线`,sub:`当前数据日 ${model.latest}`}:{main:`播放率当前 ${insightV1RateText(rate)}`,sub:`与70%警戒线相差 ${insightV2SignedPpFromPoints(rate,.7,1)}`});
  }
  if(Number.isFinite(Number(playback.current))&&Number.isFinite(Number(playback.yesterday))){
    facts.push({main:`内容播放VV较昨日${Number(playback.current)>=Number(playback.yesterday)?'上升':'下降'} ${insightV1AbsPct(insightV1Ratio(playback.current,playback.yesterday))}`,sub:`${fmt(playback.current)} vs ${fmt(playback.yesterday)}`});
  }
  if(Number.isFinite(Number(playback.current))&&Number.isFinite(Number(playback.weekAgo))){
    facts.push({main:`内容播放VV较上周同日${Number(playback.current)>=Number(playback.weekAgo)?'上升':'下降'} ${insightV1AbsPct(insightV1Ratio(playback.current,playback.weekAgo))}`,sub:`${fmt(playback.current)} vs ${fmt(playback.weekAgo)}`});
  }
  return facts;
}
function insightV2PreferenceFacts(){
  /* Raw hot-play, hot-search and genre rows exist, but the project does not
     expose a final preference-change result.  Do not invent overlap,
     mismatch, or threshold rules in the overview. */
  return [];
}
function insightV2RenderFacts(model){
  const resourceFacts=insightV2ResourceFacts();
  insightV2FactRows($('#insight-operations-facts'),insightV2OperationsFacts(model),'暂无可确认的运营事实');
  insightV2FactRows($('#insight-anomaly-facts'),insightV2AnomalyFacts(model),'暂无可确认的播放状态检查');
  insightV2FactRows($('#insight-preference-facts'),insightV2PreferenceFacts(model),'暂无已核验的偏好变化');
  insightV2FactRows($('#insight-resource-facts'),resourceFacts,'暂无可确认的资源位事实');
}
function insightV2RenderGrowthDivergence(model){
  const node=$('#insight-growth-divergence-chart');if(!node)return;
  const growth=(model.growth?.growthRows||[]).map(row=>({title:insightV1ReadableTitle(row),value:Number(row?.vv_delta)})).filter(row=>row.title&&Number.isFinite(row.value)&&row.value>0).slice(0,5);
  const decline=(model.growth?.declineRows||[]).map(row=>({title:insightV1ReadableTitle(row),value:Number(row?.vv_delta)})).filter(row=>row.title&&Number.isFinite(row.value)&&row.value<0).slice(0,5);
  const values=[...growth.map(row=>Math.abs(row.value)),...decline.map(row=>Math.abs(row.value))],max=Math.max(...values,1);
  const barRows=(items,side)=>items.map(row=>{const width=Math.max(4,Math.round(Math.abs(row.value)/max*100));return `<div class="ops-v2-divergence-row"><span class="ops-v2-divergence-title" title="${esc(row.title)}">${esc(row.title)}</span><span class="ops-v2-divergence-track"><i style="width:${width}%"></i></span><strong>${side==='growth'?'+':'−'}${fmt(Math.abs(row.value))}</strong></div>`}).join('');
  node.innerHTML=`<div class="ops-v2-divergence"><div class="ops-v2-divergence-side is-decline">${decline.length?barRows(decline,'decline'):'<div class="ops-v2-divergence-empty">暂无已核验回落结果</div>'}</div><div class="ops-v2-divergence-axis"><span>0</span></div><div class="ops-v2-divergence-side is-growth">${growth.length?barRows(growth,'growth'):'<div class="ops-v2-divergence-empty">暂无已核验增长结果</div>'}</div></div>`;
}
function insightV2RenderGenreChart(date){
  const node=$('#insight-genre-contribution-chart');if(!node)return;
  if(state.data.genreRatioMapped===undefined){
    insightV2SetEmpty(node,'正在加载剧种播放结构');
    ensureGenreDisplayRows().then(()=>insightV2RenderGenreChart(date));
    return;
  }
  const source=rows(state.data.genreRatioMapped),list=source.filter(row=>insightV2Date(row)===String(date||'')&&!insightV1HasUnreadableToken(row?.['剧种']||row?.genre)).map(row=>({name:String(row['剧种']||row.genre),value:Number(row['播放VV']),share:Number(row['播放VV占比'])})).filter(row=>Number.isFinite(row.value)&&row.value>=0).sort((a,b)=>b.value-a.value);
  if(!window.echarts||!list.length){insightV2SetEmpty(node,list.length?'图表组件加载中':'暂无可靠的剧种播放数据');return}
  const chart=echarts.getInstanceByDom(node)||echarts.init(node);chart.clear();
  chart.setOption({animation:false,tooltip:{trigger:'item',formatter:item=>`${esc(item.name)}<br/>播放VV：${fmt(item.value)}<br/>贡献占比：${Number(item.data?.share||0).toFixed(2)}%`},legend:{type:'plain',left:'center',bottom:8,width:'92%',itemGap:10,itemWidth:10,itemHeight:10,textStyle:{color:'#63758a',fontSize:11}},series:[{type:'pie',radius:['33%','60%'],center:['50%','43%'],data:list,label:{show:list.length<=7,position:'outside',formatter:item=>String(item.name||'--'),color:'#40536d',fontSize:11},labelLine:{show:list.length<=7,length:10,length2:7,lineStyle:{color:'#9aabc0'}}}]});
  chart.resize();
}
function insightV2RenderRankingList(node,items,emptyMessage){
  if(!node)return;
  if(!items.length){node.innerHTML=`<div class="ops-v2-empty">${esc(emptyMessage)}</div>`;return}
  const max=Math.max(...items.map(item=>Math.max(0,Number(item.value)||0)),1);
  node.innerHTML=items.slice(0,3).map((item,index)=>{
    const value=Math.max(0,Number(item.value)||0),width=Math.max(8,Math.round(value/max*100));
    return `<div class="ops-v2-ranking-row"><div class="ops-v2-ranking-label"><span class="ops-v2-rank">${String(index+1).padStart(2,'0')}</span><span class="ops-v2-ranking-title" title="${esc(item.title)}">${esc(item.title)}</span><strong>${esc(item.displayValue)}</strong></div><div class="ops-v2-ranking-track" aria-hidden="true"><span style="width:${width}%"></span></div></div>`;
  }).join('');
}
function insightV2HotPlayRows(date){
  return rows(state.data.ranking).filter(row=>insightV2Date(row)===String(date||'')&&String(row?.['榜单分类']??row?.list_type??'总榜')==='总榜').map(row=>({title:String(row?.['内容名称']??row?.title??'').trim(),value:Number(row?.['播放VV']??row?.play_vv),displayValue:fmt(row?.['播放VV']??row?.play_vv),rank:Number(row?.['排名']??row?.rank)})).filter(row=>!insightV1HasUnreadableToken(row.title)&&Number.isFinite(row.value)).sort((a,b)=>(Number.isFinite(a.rank)?a.rank:Infinity)-(Number.isFinite(b.rank)?b.rank:Infinity)).slice(0,3);
}
function insightV2HotSearchRows(date){
  return rows(state.data.hotSearch).filter(row=>insightV2Date(row)===String(date||'')).map(row=>({title:hotDramaName(row),value:Number(row?.search_vv),displayValue:fmt(row?.search_vv),rank:Number(row?.rank??row?.['排名'])})).filter(row=>!insightV1HasUnreadableToken(row.title)&&Number.isFinite(row.value)).sort((a,b)=>(Number.isFinite(a.rank)?a.rank:Infinity)-(Number.isFinite(b.rank)?b.rank:Infinity)).slice(0,3);
}
function insightV2GrowthRows(model){
  return (model.growth?.growthRows||[]).map(row=>({title:insightV1ReadableTitle(row),value:Number(row?.vv_delta),displayValue:`+${fmt(row?.vv_delta)} VV`})).filter(row=>row.title&&Number.isFinite(row.value)&&row.value>0).slice(0,3);
}
function insightV2RenderDirection(model){
  const date=model.latest;
  insightV2RenderRankingList($('#insight-hot-play-list'),insightV2HotPlayRows(date),'暂无可靠热播结果');
  insightV2RenderRankingList($('#insight-hot-search-list'),insightV2HotSearchRows(date),'暂无可靠热搜结果');
  insightV2RenderRankingList($('#insight-growth-list'),insightV2GrowthRows(model),'暂无已核验播放增长结果');
  const cards=$$('#page-insight .ops-v2-list-card'),metricLabels=['播放VV','搜索VV','播放增量'];
  cards.forEach((card,index)=>{
    card.classList.toggle(`is-direction-${['hot-play','hot-search','growth'][index]||'other'}`,true);
    const title=card.querySelector('h4');if(title){const baseTitle=title.dataset.baseTitle||title.textContent.trim();title.dataset.baseTitle=baseTitle;title.innerHTML=`<span>${esc(baseTitle)}</span><small class="ops-v2-list-metric">${metricLabels[index]||''}</small>`}
  });
  $$('#page-insight .ops-v2-direction-section .ops-v2-link').forEach(button=>{button.dataset.insightParams=JSON.stringify({date})});
}
function insightV2RenderFocus(model){
  const rate=Number(model.playRate?.current),rateValue=$('#insight-focus-playback-value'),rateNote=$('#insight-focus-playback-note'),rateCard=$('#insight-focus-playback'),alert=$('#insight-playrate-alert');
  const playbackHeading=$('#insight-focus-playback h4');if(playbackHeading)playbackHeading.textContent='播放状态';
  if(Number.isFinite(rate)){
    const triggered=rate<0.7;
    if(rateValue)rateValue.textContent=triggered?`播放率 ${insightV1RateText(rate)}`:'播放状态正常';
    if(rateNote)rateNote.textContent=triggered?'低于70%警戒线':`当前播放率 ${insightV1RateText(rate)}`;
    rateCard?.classList.toggle('is-triggered',triggered);rateCard?.classList.toggle('is-normal',!triggered);rateCard?.classList.toggle('is-alert',triggered);if(alert)alert.hidden=!triggered;
  }else{if(rateValue)rateValue.textContent='暂无结果';if(rateNote)rateNote.textContent='暂无可靠播放率数据';rateCard?.classList.remove('is-triggered','is-normal');if(alert)alert.hidden=true}
  const growth=(model.growth?.growthRows||[]).map(row=>({...row,displayTitle:insightV1ReadableTitle(row)})).find(row=>row.displayTitle&&Number.isFinite(Number(row.vv_delta))&&Number(row.vv_delta)>0),contentValue=$('#insight-focus-content-value'),contentNote=$('#insight-focus-content-note');
  if(growth){if(contentValue)contentValue.textContent=`《${growth.displayTitle}》`;if(contentNote)contentNote.textContent=`+${fmt(growth.vv_delta)} VV · 当前播放增长结果首位`}else{if(contentValue)contentValue.textContent='暂无结果';if(contentNote)contentNote.textContent='暂无已核验播放增长结果'}
  insightV2RenderResources(model.latest);
}
function insightV1Render(model,result){
  const playback=model.playback||{},rate=model.playRate||{};
  setText('#insight-date-label',`数据更新至 ${model.latest||'--'}`);
  setText('#insight-playback-kpi',playback.current===null||playback.current===undefined?'--':fmt(playback.current));
  setText('#insight-playback-kpi-note',`较昨日 ${insightV1SignedPct(insightV1Ratio(playback.current,playback.yesterday))} · 较上周同日 ${insightV1SignedPct(insightV1Ratio(playback.current,playback.weekAgo))}`);
  setText('#insight-playrate-kpi',rate.current===null||rate.current===undefined?'--':insightV1RateText(rate.current));
  setText('#insight-playrate-kpi-note',`较昨日 ${insightV2PpText(rate.current,rate.yesterday)} · 较上周同日 ${insightV2PpText(rate.current,rate.weekAgo)}`);
  const alert=$('#insight-playrate-alert'),rateCard=$('#insight-playrate-kpi')?.closest('.ops-v2-kpi-card'),triggered=Number.isFinite(Number(rate.current))&&Number(rate.current)<0.7;
  if(alert)alert.hidden=!triggered;rateCard?.classList.toggle('is-triggered',triggered);
  insightV2RenderFacts(model);insightV2RenderTrend(model);insightV2RenderGrowthDivergence(model);
}
function renderInsightPage(){
  const host=$('#page-insight');if(!host)return;
  const date=dashboardVerifiedDate(state.data)||state.end||'';
  if(date)state.end=date;
  $$('.page').forEach(page=>page.classList.toggle('active',page===host));
  $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='insight'));
  $('#client-filter')?.classList.add('tab4-client-hidden');
  setText('#page-title','运营总览');
  setText('#insight-date-label',date?`数据更新至 ${date}`:'数据更新至 --');
  const requestId=String((Number(host.dataset.insightV1Request)||0)+1);host.dataset.insightV1Request=requestId;
  const emptyModel={latest:date,playback:{current:null,yesterday:null,weekAgo:null,trend:[],trendComplete:false,currentAvg:null,previousAvg:null,windowChange:null},playRate:{current:null,yesterday:null,weekAgo:null},search:{current:null,currentAvg:null,previousAvg:null,windowComplete:false,windowChange:null},growth:{period:'',growthRows:[],declineRows:[]},source:{searchClientScope:'all'}};
  const renderLoaded=model=>{if(host.dataset.insightV1Request!==requestId||state.page!=='insight')return;insightV1Render(model)};
  if(date)loadInsightV1Data(date).then(model=>renderLoaded(model)).catch(error=>{console.warn('[dashboard] overview data unavailable',error);renderLoaded(emptyModel)});
  else insightV1Render(emptyModel,{anomaly:[]});
  if(!host.dataset.insightNavigationBound){host.dataset.insightNavigationBound='1';host.addEventListener('click',event=>{const button=event.target.closest('[data-insight-page]');if(!button||!host.contains(button))return;state.page=button.dataset.insightPage;const params=JSON.parse(button.dataset.insightParams||'{}');if(params.date){state.start=params.date;state.end=params.date;window.__dashboardDefaultDate=params.date}if(state.page==='overview'&&params.client)state.client=params.client;if(state.page==='sections'){sectionOpsState.detailDate=params.date||sectionOpsState.detailDate;sectionOpsState.detailChannel=params.channel||'全部频道';sectionOpsState.detailGroup=params.group||'';sectionOpsState.page=1}if(state.page==='home'&&params.date){tab4KpiState.date=params.date;tab4UvState.date=params.date}if(state.page==='banner'){bannerViewState.date=params.date||bannerViewState.date;bannerViewState.detailPosition=params.position||'all'}renderPage()})}
}
const renderPageBeforeInsight=renderPage;
renderPage=function(){if(state.page==='insight'){renderInsightPage();return}renderPageBeforeInsight()};

// Standalone genre share page: keep this analysis outside the hot ranking tab.
let genreStandaloneDate='';
function renderGenreStandalone(){
  const host=$('#page-genre');if(!host)return;if(!state.data.genreRatioMapped){ensureGenreDisplayRows().then(()=>renderGenreStandalone());return}const source=rows(state.data.genreRatioMapped),dates=[...new Set(source.map(r=>String(r['日期']||r.date||'')).filter(Boolean))].sort();
  if(!genreStandaloneDate||!dates.includes(genreStandaloneDate))genreStandaloneDate=dates.includes(state.end)?state.end:(dates.at(-1)||'');
  $$('.page').forEach(page=>page.classList.toggle('active',page===host));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='genre'));setText('#page-title','剧种播放占比');
  const input=$('#genre-standalone-date');if(input){input.min=dates[0]||'';input.max=dates.at(-1)||'';input.value=genreStandaloneDate;if(!input.dataset.bound){input.dataset.bound='1';input.addEventListener('change',()=>{genreStandaloneDate=input.value;renderGenreStandalone()})}}
  const list=source.filter(r=>String(r['日期']||r.date||'')===genreStandaloneDate).sort((a,b)=>(Number(b['播放VV'])||0)-(Number(a['播放VV'])||0));
  const previousDate=dates.filter(date=>date<genreStandaloneDate).at(-1);
  const previousByGenre=new Map(source.filter(r=>String(r['日期']||r.date||'')===previousDate).map(r=>[String(r['剧种']||''),Number(r['播放VV占比'])]));
  setText('#genre-standalone-label',genreStandaloneDate||'暂无日期');
  const chart=$('#genre-standalone-chart');if(chart&&window.echarts){const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.setOption({animation:false,tooltip:{trigger:'item',formatter:p=>`${esc(p.name)}<br/>播放VV：${fmt(p.value)}<br/>占比：${Number(p.data?.share||0).toFixed(2)}%`},legend:{type:'plain',left:'center',bottom:86,width:'82%',itemGap:12,itemWidth:28,itemHeight:14,textStyle:{color:'#63758a',fontSize:12}},series:[{type:'pie',radius:['26%','44%'],center:['50%','44%'],data:list.map(r=>({name:String(r['剧种']||'--'),value:Number(r['播放VV'])||0,share:Number(r['播放VV占比'])||0})),label:{show:true,position:'outside',formatter:p=>String(p.name||'--'),color:'#40536d',fontSize:12,fontWeight:600},labelLine:{show:true,length:12,length2:8,lineStyle:{color:'#9aabc0'}}}]});c.resize()}
  const target=$('#genre-standalone-list');if(target)target.innerHTML=list.length?`<div class="genre-standalone-row genre-standalone-head"><span>剧种</span><b>播放VV占比</b><em class="genre-change">昨日环比</em><em class="genre-vv">播放VV</em></div>`+list.map((r,i)=>{const share=Number(r['播放VV占比'])||0,previous=previousByGenre.get(String(r['剧种']||'')),delta=Number.isFinite(previous)?share-previous:null,change=delta===null?'<em class="genre-change neutral">--</em>':`<em class="genre-change ${delta>0?'up':delta<0?'down':'neutral'}">${delta>0?'↑':delta<0?'↓':'--'} ${Math.abs(delta).toFixed(2)}%</em>`;return `<div class="genre-standalone-row"><span><i>${i+1}</i>${esc(r['剧种']||'--')}</span><b>${share.toFixed(2)}%</b>${change}<em class="genre-vv">${fmt(r['播放VV'])}</em></div>`}).join(''):'<div class="insight-empty">暂无真实数据</div>';
}
const renderPageBeforeGenre=renderPage;renderPage=function(){if(state.page==='genre'){renderGenreStandalone();return}renderPageBeforeGenre()};
const renderPageBeforeGenreDetach=renderPage;renderPage=function(){renderPageBeforeGenreDetach();if(state.page==='content'){document.querySelector('#page-content .content-structure')?.remove();document.querySelector('#content-sidebar-tree .content-view-tab[data-content-view="genre"]')?.remove()}};
const renderPageBeforeContentNav=renderPage;renderPage=function(){renderPageBeforeContentNav();if(state.page==='search'){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page==='content'))}};

// Final Tab1 depth presentation: two mutually exclusive, full-width views.
// This guard runs after the layered legacy renderers so the user always sees
// the approved interaction, regardless of which older renderer built Tab1.
function ensureDepthMetricTabs(){
  const page=$('#page-overview');if(!page||!window.echarts)return;
  const region=[...page.querySelectorAll('.overview-region')].find(item=>item.querySelector('h3')?.textContent.trim()==='用户消费深度分析');
  if(!region)return;
  const heading=region.querySelector('.region-heading');
  const source=heading?.querySelector('.region-source');
  if(source)source.textContent='播放率 · 人均播放时长 · 人均播放次数';
  const copy=heading?.querySelector('p');if(copy)copy.textContent='点击标签切换单独的播放率或播放深度趋势';
  let tabs=region.querySelector('.depth-metric-tabs');
  if(!tabs){
    region.querySelectorAll(':scope > *:not(.region-heading)').forEach(node=>node.remove());
    tabs=document.createElement('div');tabs.className='quick-tabs depth-metric-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','用户消费深度指标');
    tabs.innerHTML='<button class="quick-tab active" type="button" role="tab" aria-selected="true" data-depth-view="rate">播放率</button><button class="quick-tab" type="button" role="tab" aria-selected="false" data-depth-view="detail">人均播放时长 + 人均播放次数</button>';
    region.appendChild(tabs);
    const rateView=document.createElement('div');rateView.className='tab-view active depth-metric-view';rateView.dataset.depthPanel='rate';rateView.innerHTML='<div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot depth-rate"></i>播放率</span></div><div id="depth-metric-rate" class="composition-chart"></div></div>';
    const detailView=document.createElement('div');detailView.className='tab-view depth-metric-view';detailView.dataset.depthPanel='detail';detailView.innerHTML='<div class="composition-chart-box"><div class="composition-legend"><span><i class="legend-dot depth-duration"></i>人均播放时长</span><span><i class="legend-dot depth-count"></i>人均播放次数</span></div><div id="depth-metric-detail" class="composition-chart"></div></div>';
    region.append(rateView,detailView);
  }
  const dateOf=row=>String(row?.date||row?.['日期']||'').slice(0,10);
  const depthStartInput=region.querySelector('input[aria-label="用户消费深度开始日期"]');
  const depthEndInput=region.querySelector('input[aria-label="用户消费深度结束日期"]');
  const depthStart=depthStartInput?.value||overviewRangeState.depthStart;
  const depthEnd=depthEndInput?.value||overviewRangeState.depthEnd;
  const rowsFor=(list,predicate)=>overviewFilterRange((list||[]).filter(predicate||(()=>true)),depthStart,depthEnd);
  const daily=rowsFor(state.data.daily,row=>!row.client||row.client===state.client),rate=rowsFor(state.data.playRate,row=>!row.client||row.client===state.client||row.client_type===state.client),duration=rowsFor(state.data.duration,row=>!row.client_type||row.client_type===state.client);
  // The play-count source contains historical all-client rows plus a newer
  // client-split tail.  Only the all-client view may use the historical
  // total_avg_play_count field; never present it as Android/iOS/M-site data.
  const isAllClient=state.client==='全部'||state.client==='全部端口';
  const countValue=row=>{
    const selected=row?.[state.client];
    if(selected!=null&&selected!=='')return Number(selected);
    if(isAllClient&&row?.total_avg_play_count!=null)return Number(row.total_avg_play_count);
    return null;
  };
  const counts=rowsFor(state.data.playCount,row=>Number.isFinite(countValue(row)));
  const dates=[...new Set([...daily,...rate,...duration,...counts].map(dateOf).filter(Boolean))].sort();
  const values=(list,keyOrGetter)=>{const getter=typeof keyOrGetter==='function'?keyOrGetter:row=>row?.[keyOrGetter];const map=new Map(list.map(row=>[dateOf(row),Number(getter(row))]).filter(([,value])=>Number.isFinite(value)));return dates.map(date=>map.get(date)??null)};
  const axisRange=(list,padding,minSpan,lowerBound=0,minPad=0.5,precision=0)=>{const valid=list.filter(value=>Number.isFinite(value));if(!valid.length)return{min:lowerBound,max:lowerBound+minSpan};const low=Math.min(...valid),high=Math.max(...valid),span=Math.max(high-low,minSpan),pad=Math.max(span*padding,minPad),factor=10**precision,min=Math.max(lowerBound,Math.floor((low-pad)*factor)/factor),max=Math.ceil((high+pad)*factor)/factor;return{min,max:min<=max?max:min+minSpan}};
  const draw=(kind)=>{const el=$(`#depth-metric-${kind}`);if(!el)return;const chart=echarts.getInstanceByDom(el)||echarts.init(el);const base={tooltip:{trigger:'axis'},xAxis:{type:'category',data:dates.map(date=>date.slice(5)),axisLabel:{color:'#667992'}},grid:{left:62,right:62,top:34,bottom:38,containLabel:true}};const rateValues=values(daily,'play_rate'),durationValues=values(duration,'total_avg_watch_duration'),countValues=values(counts,state.client),rateAxis=axisRange(rateValues,.08,.1,0,.01,2),durationAxis=axisRange(durationValues,.12,10,0,1),countAxis=axisRange(countValues,.12,2,0,.2);const option=kind==='rate'?{...base,yAxis:{type:'value',min:rateAxis.min,max:rateAxis.max,axisLabel:{color:'#667992',formatter:value=>pct(value)},splitLine:{lineStyle:{color:['#e1e8f1','#e1e8f1','#e1e8f1','#e1e8f1','#e1e8f1','rgba(0,0,0,0)']}}},series:[{name:'播放率',type:'line',data:rateValues,smooth:.25,symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#2f7d4a'},itemStyle:{color:'#2f7d4a'},areaStyle:{color:'#2f7d4a18'}}]}:{...base,yAxis:[{type:'value',name:'分钟',min:durationAxis.min,max:durationAxis.max,axisLabel:{color:'#667992'},splitLine:{lineStyle:{color:'#e1e8f1'}}},{type:'value',name:'次数',min:countAxis.min,max:countAxis.max,axisLabel:{color:'#667992'},splitLine:{show:false}}],series:[{name:'人均播放时长',type:'line',data:durationValues,smooth:.25,symbol:'circle',symbolSize:6,lineStyle:{width:3,color:'#d58b3e'},itemStyle:{color:'#d58b3e'},areaStyle:{color:'#d58b3e18'}},{name:'人均播放次数',type:'line',yAxisIndex:1,data:countValues,smooth:.25,symbol:'diamond',symbolSize:6,lineStyle:{width:3,type:'dashed',color:'#3b82c4'},itemStyle:{color:'#3b82c4'}}]};const markExtrema=data=>{const valid=data.map((value,index)=>({value,index})).filter(item=>Number.isFinite(item.value));if(!valid.length)return null;const min=valid.reduce((a,b)=>b.value<a.value?b:a),max=valid.reduce((a,b)=>b.value>a.value?b:a);return{symbol:'circle',symbolSize:12,itemStyle:{color:'#e05252',borderColor:'#fff',borderWidth:2},label:{show:false},data:[{coord:[max.index,max.value]},{coord:[min.index,min.value]}]}};if(kind==='rate')option.series[0].markPoint=markExtrema(rateValues);else{option.series[0].markPoint=markExtrema(durationValues);option.series[1].markPoint=markExtrema(countValues)}chart.clear();chart.setOption(option,true);chart.resize()};
  region._renderDepthMetricTabs=()=>draw(region.querySelector('[data-depth-view].active')?.dataset.depthView||'rate');
  region._renderDepthMetricTabs();
  if(!region.dataset.depthRangeBound){
    region.dataset.depthRangeBound='1';
    const syncDepthRange=()=>{
      const start=depthStartInput?.value||overviewRangeState.depthStart,end=depthEndInput?.value||overviewRangeState.depthEnd;
      if(start&&end&&start>end&&depthEndInput)depthEndInput.value=start;
      overviewRangeState.depthStart=depthStartInput?.value||start;
      overviewRangeState.depthEnd=depthEndInput?.value||end;
      ensureDepthMetricTabs();
    };
    [depthStartInput,depthEndInput].filter(Boolean).forEach(input=>{
      input.addEventListener('input',syncDepthRange);
      input.addEventListener('change',syncDepthRange);
    });
  }
  if(!tabs.dataset.bound){tabs.dataset.bound='1';tabs.querySelectorAll('[data-depth-view]').forEach(button=>button.addEventListener('click',()=>{tabs.querySelectorAll('[data-depth-view]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});region.querySelectorAll('.depth-metric-view').forEach(panel=>panel.classList.toggle('active',panel.dataset.depthPanel===button.dataset.depthView));requestAnimationFrame(()=>{draw(button.dataset.depthView);deferResize()})}))}
}
const renderPageBeforeDepthMetricTabs=renderPage;renderPage=function(){renderPageBeforeDepthMetricTabs();if(state.page==='overview')requestAnimationFrame(ensureDepthMetricTabs)};

const refreshOverviewRangeChartBeforeDepthMetricTabs=refreshOverviewRangeChart;
refreshOverviewRangeChart=function(kind){
  if(kind==='depth'){
    const depthRegion=[...document.querySelectorAll('#page-overview .overview-region')].find(item=>item.querySelector('h3')?.textContent.trim()==='用户消费深度分析');
    if(depthRegion?._renderDepthMetricTabs){depthRegion._renderDepthMetricTabs();return}
  }
  refreshOverviewRangeChartBeforeDepthMetricTabs(kind);
};

// Keep the Tab2 consumption-depth axes comparable across dates.  The chart
// The overview scale chart has fixed metric semantics: light green is always DAU and
// blue is always new devices. Do this after the optional global theme layer,
// which otherwise rewrites individual bar colours.
function enforceOverviewScaleColors(){
  const dom=$('#overview-scale-combo')||$('#tab1-scale-chart');
  const chart=dom&&window.echarts?.getInstanceByDom(dom);if(!chart)return;
  const option=chart.getOption(),series=option.series||[];
  const deviceColor='#a8cdaf',newDeviceColor='#2f76e8';
  const deviceData=(series[0]?.data||[]).map(point=>{
    const value=point&&typeof point==='object'&&!Array.isArray(point)?point.value:point;
    return {value,itemStyle:{color:deviceColor}};
  });
  chart.setOption({series:[
    {itemStyle:{color:deviceColor},data:deviceData},
    {lineStyle:{width:3,color:newDeviceColor},itemStyle:{color:newDeviceColor},areaStyle:{color:newDeviceColor+'14'}}
  ]},false);
  chart.resize();
}
const renderPageBeforeOverviewScaleColors=renderPage;
renderPage=function(){
  renderPageBeforeOverviewScaleColors();
  if(state.page==='overview')requestAnimationFrame(()=>requestAnimationFrame(enforceOverviewScaleColors));
  requestAnimationFrame(ensureLegacyDetailTablePagers);
};

// Standalone search funnel tab. It uses only the verified Quick BI same-component rows.
let searchFunnelDate=DASHBOARD_RANGE_END.replaceAll('-',''),searchFunnelBuilt=false;
function renderSearchFunnel(){
  const host=$('#page-search-funnel');if(!host)return;
  if(!searchFunnelBuilt){
    host.innerHTML=`<div class="section-heading search-funnel-heading"><div><span>SEARCH FUNNEL</span><h2>搜索漏斗</h2><p>搜索入口到播放消费的转化链路诊断</p></div><span class="search-funnel-data-range">${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END} · 全客户端</span></div><section class="search-funnel-card panel"><div class="search-funnel-card-head"><div><span class="region-kicker">01</span><div><h3>搜索整体转化漏斗</h3><p>选择日期查看当天搜索用户完整行为链路</p></div></div><label class="search-funnel-date"><span>数据日期</span><input id="search-funnel-date" type="date" min="${DASHBOARD_RANGE_START}" max="${DASHBOARD_RANGE_END}" value="${DASHBOARD_RANGE_END}" aria-label="搜索漏斗数据日期"></label></div><div id="search-funnel-graphic" class="search-funnel-graphic" role="img" aria-label="动态搜索整体转化漏斗"></div><p class="search-funnel-note">数据源：Quick BI 搜索整体数据。漏斗层级按原始 UV 展示，相邻层转化率按相邻阶段 UV 计算。</p></section>`;
    searchFunnelBuilt=true;
    $('#search-funnel-date').addEventListener('change',event=>{searchFunnelDate=event.target.value.replaceAll('-','');renderSearchFunnel()});
  }
  const source=rows(state.data.searchConversion||[]).sort((a,b)=>String(a.date).localeCompare(String(b.date)));if(!source.length)return;
  const compact=String(searchFunnelDate||'').replaceAll('-',''),current=source.find(r=>String(r.date)===compact)||source.at(-1);searchFunnelDate=String(current.date);
  const value=x=>{if(x==null||x==='')return null;const n=Number(String(x).replace('%',''));return Number.isFinite(n)?(String(x).includes('%')?n/100:n):null};
  const rate=x=>x==null?'--':`${(x*100).toFixed(2)}%`,uv=x=>x==null?'--':Number(x).toLocaleString('zh-CN'),iso=x=>`${x.slice(0,4)}-${x.slice(4,6)}-${x.slice(6)}`;
  const stages=[['进入搜索页UV',current.into_search_click_uv,'into_search_click_uv'],['搜索完成UV',current.search_suc_uv,'search_suc_uv'],['影视点击UV',current.result_content_click_uv,'result_content_click_uv'],['详情页起播UV',current.result_video_after_ad_play_start_uv,'result_video_after_ad_play_start_uv'],['播放5分钟UV',current.result_play_5mins_uv,'result_play_5mins_uv']];const previous=source.filter(r=>String(r.date)<String(current.date)).at(-1);const ratios=stages.map((s,i)=>i?Number(s[1])/Number(stages[i-1][1]):null);const delta=(now,before)=>{const a=Number(now),b=Number(before);if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return '';const d=(a-b)/b;return `<span class="search-funnel-delta ${d>=0?'is-up':'is-down'}">${d>=0?'↑':'↓'} ${Math.abs(d*100).toFixed(1)}%</span>`};const graphic=$('#search-funnel-graphic');
  if(graphic){const overall=[['搜索完成率','search_suc_uv_ratio'],['首帧转化率','ff_play_uv_rate'],['5分钟转化率','play_5min_uv_rate']];graphic.innerHTML=`<div class="search-funnel-visual"><div class="search-funnel-cone">${stages.map((s,i)=>`<article class="search-funnel-layer layer-${i+1}"><div class="search-funnel-layer-label"><b>0${i+1}</b><span>${s[0]}</span></div><strong>${uv(s[1])}</strong><div class="search-funnel-rate-wrap"><em>${i?rate(ratios[i]):'起始节点'}</em>${delta(s[1],previous?.[s[2]])}</div></article>`).join('')}</div></div><aside class="search-funnel-overall-rates" aria-label="搜索整体转化率"><div class="search-funnel-overall-title">整体转化率</div><div class="search-funnel-rate-chain">${overall.map((item,i)=>`<div class="search-funnel-overall-node ${i===2?'is-final':''}"><span>${item[0]}</span><strong>${rate(value(current[item[1]]))}</strong>${delta(value(current[item[1]]),value(previous?.[item[1]]))}</div>`).join('')}</div></aside>`;const input=$('#search-funnel-date');if(input){input.value=iso(searchFunnelDate);input.max=iso(source.at(-1).date)}}
}
const renderPageBeforeSearchFunnel=renderPage;
renderPage=function(){if(state.page==='search-funnel'){renderSearchFunnel();$$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-search-funnel'));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='search-funnel'));setText('page-title','搜索漏斗');deferResize();return}renderPageBeforeSearchFunnel()};

let guessQuickBiDate=DASHBOARD_RANGE_END.replaceAll('-',''),guessQuickBiMetric='front_tab_uv',guessQuickBiBuilt=false;
const guessQuickBiMeta={front_tab_uv:['Tab点击UV','人数','#2879d5'],total_content_exposure_uv:['内容曝光UV','人数','#45a987'],total_content_click_uv:['内容点击UV','人数','#eb9a2f'],total_content_click_rate:['内容点击率','比例','#5b77d6'],ff_play_convert_rate:['首帧转化率','比例','#34a886'],play_convert_rate:['播放转化率','比例','#22a78a'],play_5min_rate_uv:['5分钟转化率','比例','#e49a2d'],avg_time_uv:['人均播放时长','分钟','#8b6bd6']};
function guessQuickBiRows(){return rows(state.data.guessQuickBi?.rows||state.data.guessQuickBi||[]).filter(r=>String(r.page||'首页')==='首页').sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
function guessQuickBiNum(v){const n=Number(String(v??'').replace(/[% ,]/g,''));return Number.isFinite(n)?(String(v).includes('%')?n/100:n):null}
function guessQuickBiFmt(v,key){if(v==null||v==='')return '--';if(key==='avg_time_uv')return `${Number(v).toFixed(2)} 分钟`;if(String(v).includes('%'))return String(v);return Number(v).toLocaleString('zh-CN')}
function renderGuessQuickBi(){
 const host=$('#page-guess');if(!host)return;const source=guessQuickBiRows();if(!source.length){host.innerHTML='<div class="guess-empty panel">暂无猜你喜欢 Quick BI 数据</div>';return}
 if(!guessQuickBiBuilt){host.innerHTML=`<div class="section-heading guess-page-heading"><div><span>RECOMMENDATION ANALYSIS</span><h2>猜你喜欢</h2><p>推荐入口效率与播放消费质量</p></div><label class="guess-date-control"><span>数据日期</span><input id="guess-quickbi-date" type="date" min="${DASHBOARD_RANGE_START}" max="${DASHBOARD_RANGE_END}" value="${DASHBOARD_RANGE_END}"></label></div><section class="panel search-funnel-card guess-funnel-card"><div class="search-funnel-card-head guess-card-head"><div><span class="region-kicker">01</span><div><h3>猜你喜欢整体转化漏斗</h3><p>选择日期查看推荐入口到内容点击的完整行为链路</p></div></div></div><div id="guess-funnel-content"></div></section><section class="panel guess-trend-card"><div class="guess-card-head"><div><span class="region-kicker">02</span><div><h3>指标趋势</h3><p>选择一个指标，使用全宽图查看 ${DASHBOARD_RANGE_START}—${DASHBOARD_RANGE_END} 变化</p></div></div></div><div id="guess-trend-tabs" class="guess-trend-tabs" role="tablist"></div><div id="guess-trend-chart" class="guess-trend-chart"></div></section><p class="guess-data-note">数据源：Quick BI / recommend_data / source_type=猜你喜欢 / page=首页 / 全客户端 · ${DASHBOARD_RANGE_START} 至 ${DASHBOARD_RANGE_END}</p>`;guessQuickBiBuilt=true;$('#guess-quickbi-date').addEventListener('change',e=>{guessQuickBiDate=e.target.value.replaceAll('-','');renderGuessQuickBi()})}
 const current=source.find(r=>String(r.date)===guessQuickBiDate)||source.at(-1);guessQuickBiDate=String(current.date);const previous=source.filter(r=>String(r.date)<String(current.date)).at(-1);const funnel=[['Tab点击UV','front_tab_uv'],['内容曝光UV','total_content_exposure_uv'],['内容点击UV','total_content_click_uv']];const rates=[null,Number(current.total_content_exposure_uv)/Number(current.front_tab_uv),Number(current.total_content_click_uv)/Number(current.total_content_exposure_uv)];const guessDelta=(now,before)=>{const a=guessQuickBiNum(now),b=guessQuickBiNum(before);if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return '';const d=(a-b)/b;return `<span class="search-funnel-delta ${d>=0?'is-up':'is-down'}">${d>=0?'↑':'↓'} ${Math.abs(d*100).toFixed(1)}%</span>`};
 const quality=[['首帧播放整体转化率','ff_play_convert_rate'],['播放转化率','play_convert_rate'],['5分钟转化率','play_5min_rate_uv'],['人均播放时长','avg_time_uv']];
 if(!$('#guess-diagnosis')){const hiddenDiagnosis=document.createElement('section');hiddenDiagnosis.id='guess-diagnosis';hiddenDiagnosis.hidden=true;document.body.appendChild(hiddenDiagnosis)}
 $('#guess-funnel-content').innerHTML=`<div class="search-funnel-graphic guess-search-funnel-graphic"><div class="search-funnel-visual"><div class="search-funnel-cone">${funnel.map((x,i)=>`<article class="search-funnel-layer layer-${i+1}"><div class="search-funnel-layer-label"><b>0${i+1}</b><span>${x[0]}</span></div><strong>${guessQuickBiFmt(current[x[1]],x[1])}</strong><div class="search-funnel-rate-wrap"><em>${i?(rates[i]*100).toFixed(2)+'%':'起始节点'}</em>${guessDelta(current[x[1]],previous?.[x[1]])}</div></article>`).join('')}</div><div class="guess-entry-summary"><span>入口效率</span><strong>曝光覆盖率 ${(rates[1]*100).toFixed(2)}%</strong><b>内容点击率 ${current.total_content_click_rate}</b></div></div><aside class="search-funnel-overall-rates guess-quality-rates" aria-label="猜你喜欢消费承接质量"><div class="search-funnel-overall-title">消费承接质量</div><p class="guess-quality-rates-note">独立质量指标，不代表严格用户链路</p><div class="search-funnel-rate-chain">${quality.map((x,i)=>`<div class="search-funnel-overall-node ${i===quality.length-1?'is-final':''}"><span>${x[0]}</span><strong>${guessQuickBiFmt(current[x[1]],x[1])}</strong>${guessDelta(current[x[1]],previous?.[x[1]])}</div>${i<quality.length-1?'<div class="guess-quality-chain-arrow" aria-hidden="true"></div>':''}`).join('')}</div></aside></div>`;
 const tabs=$('#guess-trend-tabs');tabs.innerHTML=Object.entries(guessQuickBiMeta).map(([key,m])=>`<button type="button" class="guess-trend-tab ${key===guessQuickBiMetric?'is-active':''}" data-guess-metric="${key}" role="tab">${m[0]}</button>`).join('');tabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{guessQuickBiMetric=b.dataset.guessMetric;renderGuessQuickBi()}));const metric=guessQuickBiMeta[guessQuickBiMetric],chart=$('#guess-trend-chart');
 if(window.echarts&&chart){const c=echarts.getInstanceByDom(chart)||echarts.init(chart);c.setOption({animation:false,grid:{left:70,right:35,top:28,bottom:48,containLabel:true},tooltip:{trigger:'axis'},xAxis:{type:'category',boundaryGap:false,data:source.map(r=>String(r.date).slice(4).replace(/^(..)(..)/,'$1-$2'))},yAxis:{type:'value',axisLabel:{formatter:v=>metric[1]==='比例'?(v*100).toFixed(0)+'%':metric[1]==='分钟'?v+'分':v.toLocaleString('zh-CN')},splitLine:{lineStyle:{color:'#e6edf5'}}},series:[{name:metric[0],type:'line',smooth:true,symbol:'circle',symbolSize:7,data:source.map(r=>guessQuickBiNum(r[guessQuickBiMetric])),lineStyle:{width:4,color:metric[2]},itemStyle:{color:metric[2]},areaStyle:{color:metric[2]+'18'}}]});c.resize()}
 const first=source[0],latest=source.at(-1),trend=guessQuickBiNum(latest[guessQuickBiMetric])-guessQuickBiNum(first[guessQuickBiMetric]);const trendText=metric[1]==='比例'?(Math.abs(trend)*100).toFixed(2)+' 个百分点':metric[1]==='分钟'?Math.abs(trend).toFixed(2)+' 分钟':Math.abs(trend).toLocaleString('zh-CN');$('#guess-diagnosis').innerHTML='<div class="guess-diagnosis-inner"><span class="region-kicker">运营诊断</span><div><h3>'+metric[0]+'：'+(trend>=0?'较7月1日提升':'较7月1日下降')+' '+trendText+'</h3><p>当前选中指标为 '+metric[0]+'；诊断基于 Quick BI 首页数据的首日与末日对比，不推断因果。</p></div></div>';const input=$('#guess-quickbi-date');if(input)input.value=String(guessQuickBiDate).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3')
}
const renderPageBeforeGuessQuickBi=renderPage;
renderPage=function(){if(state.page==='guess'){renderGuessQuickBi();$$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-guess'));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='guess'));setText('page-title','猜你喜欢');deferResize();return}renderPageBeforeGuessQuickBi()};
const renderSearchWithHotDateFallback=renderSearch;
renderSearch=function(){if(state.page==='search'&&!rows(state.data.hotSearch||[]).length&&!renderSearch.__fallbackLoading){renderSearch.__fallbackLoading=true;fetch('data/%E7%83%AD%E6%90%9C%E6%80%BB%E6%A6%9C_20260704_20260804.json').then(r=>r.json()).then(v=>{state.data.hotSearch=rows(v);renderSearch.__fallbackLoading=false;renderSearch()}).catch(()=>{renderSearch.__fallbackLoading=false})}if(state.page==='search'){const hot=rows(state.data.hotSearch||[]),dates=[...new Set(hot.map(r=>String(r.date||r['日期']||'')).filter(Boolean))].sort();if(dates.length&&!hot.some(r=>String(r.date||r['日期']||'')===state.end))state.end=dates.at(-1)}renderSearchWithHotDateFallback()};
const renderPageBeforeHotSearch=renderPage;
function renderHotSearchOnly(){
  const draw=source=>{const dates=[...new Set(source.map(r=>String(r.date||r['日期']||'')).filter(Boolean))].sort(),date=dates.at(-1)||'';const list=source.filter(r=>String(r.date||r['日期']||'')===date).filter(r=>hotDramaName(r)!=='--').sort((a,b)=>(Number(a.rank??a['排名'])||999)-(Number(b.rank??b['排名'])||999)).slice(0,30);const table=$('#hot-search-table');if(table)table.innerHTML=list.map(r=>'<tr><td>'+esc(r.rank??r['排名'])+'</td><td>'+esc(hotDramaName(r))+'</td><td>'+fmt(r.search_vv??r.search_count??r['搜索次数'])+'</td><td>'+fmt(r.search_uv??r['搜索UV'])+'</td><td>'+esc(r.day_over_day_pct??r.day_over_day??r['昨日环比'])+'</td></tr>').join('')||'<tr><td colspan="5" class="empty">暂无热搜记录</td></tr>';const heading=document.querySelector('#page-search .section-heading em');if(heading)heading.textContent='最新数据日期：'+date};
  const source=rows(state.data.hotSearch||[]);if(source.length){draw(source);return}if(!renderHotSearchOnly.loading){renderHotSearchOnly.loading=true;fetch('data/%E7%83%AD%E6%90%9C%E6%80%BB%E6%A6%9C_20260704_20260804.json').then(r=>r.json()).then(v=>{state.data.hotSearch=rows(v);renderHotSearchOnly.loading=false;draw(state.data.hotSearch)}).catch(()=>{renderHotSearchOnly.loading=false})}
}
// 热搜榜单属于“内容榜单”的子视图：复用热播榜单的明细面板和工具栏，
// 不再渲染一个独立的搜索分析页，避免空白卡片和路由/数据口径混用。
function renderContentSearchBoard(){
  const host=$('#page-content');if(!host)return;
  const source=rows(state.data.hotSearch||[]);
  if(!source.length){
    if(!renderContentSearchBoard.loading){
      renderContentSearchBoard.loading=true;
      fetch('data/%E7%83%AD%E6%90%9C%E6%80%BB%E6%A6%9C_20260704_20260804.json').then(r=>r.json()).then(v=>{
        state.data.hotSearch=rows(v);renderContentSearchBoard.loading=false;renderContentSearchBoard();
      }).catch(()=>{renderContentSearchBoard.loading=false});
    }
    host.innerHTML='<section class="content-detail panel"><div class="panel-head"><div><h3>热搜榜单</h3><span>热搜总榜数据加载中</span></div></div><div class="empty-block"><b>暂无数据</b><span>正在读取热搜榜单原始记录</span></div></section>';
    return;
  }
  // 每次从内容榜单进入热搜子页时，默认查看完整总榜 Top30；
  // “新入榜”仅作为用户主动选择的筛选项，不作为页面默认状态。
  rankingBoardState.search.type='总榜';
  rankingBoardState.search.status='all';
  rankingBoardState.search.trend='all';
  rankingBoardState.search.sortKey='rank';
  rankingBoardState.search.direction='asc';
  const dates=[...new Set(source.map(rankingDate).filter(Boolean))].sort();
  const latest=dates.at(-1)||state.end||'';
  const latestValid=source.filter(r=>rankingDate(r)===latest&&hotDramaName(r)!=='--');
  // 主接口不足30条时，再请求旧版 Top30 接口作为补充；只补同一天且不重复的记录。
  if(latest&&latestValid.length<30&&!renderContentSearchBoard.fillLoading&&!renderContentSearchBoard.fillTried){
    renderContentSearchBoard.fillLoading=true;renderContentSearchBoard.fillTried=true;
    fetch('data/%E7%83%AD%E6%90%9CTop30_20260706_20260804.json').then(r=>r.json()).then(v=>{
      const extra=rows(v).filter(r=>rankingDate(r)===latest&&hotDramaName(r)!=='--');
      const seen=new Set(source.map(r=>`${rankingDate(r)}\u0000${String(r.title??'').trim()}`));
      state.data.hotSearch=[...source,...extra.filter(r=>!seen.has(`${rankingDate(r)}\u0000${String(r.title??'').trim()}`))];
      renderContentSearchBoard.fillLoading=false;renderContentSearchBoard();
    }).catch(()=>{renderContentSearchBoard.fillLoading=false});
  }
  if(!dates.includes(rankingBoardState.search.date))rankingBoardState.search.date=latest;
  host.innerHTML=`<div class="section-heading"><div><span>CONTENT RANKING</span><h2>热搜榜单</h2><p>内容榜单 · 热搜总榜原始记录</p></div><em>${rankingBoardState.search.date||latest}</em></div><section class="content-detail panel search-region"><div class="panel-head"><div><h3>热搜榜单明细</h3><span>按日期、排名及搜索指标查看热搜内容表现</span></div></div><div class="hot-analysis-grid"><div class="hot-table-wrap"><table class="content-ranking-table"><thead><tr></tr></thead><tbody id="hot-search-ops-table"></tbody></table></div></div></section>`;
  setupSearchRankingBoard();
}

const renderPageBeforeHotSearchRoute=renderPage;
renderPage=function(){
  if(state.page==='search'){
    document.querySelector('#content-sidebar-tree')?.classList.add('content-sidebar-visible');
    $$('.page').forEach(page=>page.classList.toggle('active',page.id==='page-content'));
    $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='content'));
    document.querySelectorAll('#content-sidebar-tree .content-view-tab').forEach(button=>button.classList.toggle('active',button.dataset.contentView==='search'));
    setText('#page-title','内容榜单');
    renderContentSearchBoard();deferResize();return;
  }
  renderPageBeforeHotSearchRoute();
};

/* Final Tab1 guard: keep the current implementation, but enforce the
   operational rule that one business issue occupies one slot. This is a
   deliberately small hardening layer rather than a rewrite of the dashboard.
 */
const insightBuildBeforeFocusGuard=insightBuild;
insightBuild=function(date){
  const result=insightBuildBeforeFocusGuard(date),domainOf=item=>{
    if(item.kind==='core')return'core';
    if(item.kind==='channel'||item.kind==='section')return'home';
    if(item.kind==='search'||item.kind==='search-group')return'search';
    if(item.kind==='ranking')return'content';
    return item.kind||'other';
  };
  const seen=new Set(),top=(result.top||[]).filter(item=>{
    if(!item||item.confidence==='low')return false;
    if(item.kind==='ranking'&&!(item.opportunityEvidence||[]).some(value=>insightNum(value)>0))return false;
    const key=domainOf(item);if(seen.has(key))return false;seen.add(key);return true;
  }).slice(0,3);
  return {...result,top};
};

/* Popup operations: fixed to the verified Android New People Video client. */
const popupViewState={tab:'overview',date:DASHBOARD_RANGE_END,metric:'play_uv',threshold:1000,page:1,pageSize:20,search:'',sortKey:'play_uv',sortDir:'desc',trendWindow:7,detailStart:'',detailEnd:'',built:false};
const popupMetricMap={expost_uv:'曝光UV',click_uv:'点击UV',ctr:'点击率',jump_uv:'跳转播放UV',play_uv:'有效播放UV',play_rate:'有效播放率'};
function popupNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function popupDate(r){return String(r?.date||r?.['日期']||'').slice(0,10)}
function popupRows(){return rows(state.data.popupWindow||[]).filter(r=>popupDate(r)===popupViewState.date)}
function popupDates(){return [...new Set(rows(state.data.popupWindow||[]).map(popupDate).filter(Boolean))].sort()}
function popupRate(v){const n=popupNum(v);return n===null?'--':`${(n*100).toFixed(2)}%`}
function popupSum(list,key){return list.reduce((sum,r)=>sum+(popupNum(r?.[key])||0),0)}
function popupAggregate(list){const exposure=popupSum(list,'expost_uv'),click=popupSum(list,'click_uv'),jump=popupSum(list,'jump_uv'),play=popupSum(list,'play_uv');return {exposure,click,jump,play,ctr:exposure?click/exposure:null,conversion:click?jump/click:null,playRate:jump?play/jump:null}}
function popupAnomaly(r){return (popupNum(r?.ctr)??0)>1||(popupNum(r?.conversion_rate)??0)>1||(popupNum(r?.play_rate)??0)>1}
function popupChart(id,option){if(!window.echarts)return;const el=$(id);if(!el)return;const c=echarts.getInstanceByDom(el)||echarts.init(el);c.setOption(option,true);c.resize()}
function popupBuild(){
  const host=$('#page-popup');if(!host)return;
  if(popupViewState.built)return;
  popupViewState.built=true;
  $('#popup-date')?.addEventListener('change',e=>{popupViewState.date=e.target.value;popupViewState.page=1;renderPopupPage()});
  $$('.popup-sub-tabs button').forEach(button=>button.addEventListener('click',()=>{popupViewState.tab=button.dataset.popupTab;renderPopupPage()}));
  $('#popup-ranking-metric')?.addEventListener('change',e=>{popupViewState.metric=e.target.value;renderPopupRanking()});
  $('#popup-ranking-threshold')?.addEventListener('change',e=>{popupViewState.threshold=Number(e.target.value)||0;renderPopupRanking()});
  $('#popup-detail-search')?.addEventListener('input',e=>{popupViewState.search=e.target.value;popupViewState.page=1;renderPopupDetail()});
  $('#popup-detail-sort')?.addEventListener('change',e=>{popupViewState.sortKey=e.target.value;popupViewState.page=1;renderPopupDetail()});
  $('#popup-detail-prev')?.addEventListener('click',()=>{popupViewState.page=Math.max(1,popupViewState.page-1);renderPopupDetail()});
  $('#popup-detail-next')?.addEventListener('click',()=>{popupViewState.page+=1;renderPopupDetail()});
}
function renderPopupOverview(){
  const root=$('#popup-overview');if(!root)return;const list=popupRows(),a=popupAggregate(list),normal=list.filter(r=>!popupAnomaly(r)),top=[...normal].filter(r=>(popupNum(r.expost_uv)||0)>=1000).sort((x,y)=>(popupNum(y.play_uv)||0)-(popupNum(x.play_uv)||0)).slice(0,10),anomalies=list.filter(popupAnomaly).length,low=list.filter(r=>(popupNum(r.expost_uv)||0)<1000).length;
  root.innerHTML=`<section class="popup-kpi-grid"><article class="popup-kpi"><label>曝光 UV</label><strong>${fmt(a.exposure)}</strong><small>组件曝光 UV 合计</small></article><article class="popup-kpi"><label>点击率</label><strong>${popupRate(a.ctr)}</strong><small>点击 UV / 曝光 UV</small></article><article class="popup-kpi"><label>有效播放 UV</label><strong>${fmt(a.play)}</strong><small>组件有效播放 UV 合计</small></article><article class="popup-kpi accent"><label>有效播放率</label><strong>${popupRate(a.playRate)}</strong><small>有效播放 UV / 跳转播放 UV</small></article></section><div class="popup-grid"><section class="panel"><div class="panel-head"><div><h3>有效播放贡献 TOP10</h3><span>曝光 UV ≥ 1,000 · 排除异常比例</span></div><strong>${top.length} 个</strong></div><div id="popup-overview-contribution" class="popup-chart" role="img" aria-label="弹窗有效播放贡献排行"></div></section><section class="panel"><div class="panel-head"><div><h3>转化链路</h3><span>当前日期 · 安卓新人人</span></div></div><div class="popup-funnel"><div class="popup-funnel-row"><span class="popup-funnel-label">曝光 UV</span><span class="popup-funnel-bar"><i style="width:100%"></i></span><b class="popup-funnel-value">${fmt(a.exposure)}</b></div><div class="popup-funnel-rate">点击率 ${popupRate(a.ctr)}</div><div class="popup-funnel-row"><span class="popup-funnel-label">点击 UV</span><span class="popup-funnel-bar"><i style="width:${a.exposure?Math.min(a.click/a.exposure*100,100):0}%"></i></span><b class="popup-funnel-value">${fmt(a.click)}</b></div><div class="popup-funnel-rate">跳转转化率 ${popupRate(a.conversion)}</div><div class="popup-funnel-row"><span class="popup-funnel-label">跳转播放 UV</span><span class="popup-funnel-bar"><i style="width:${a.exposure?Math.min(a.jump/a.exposure*100,100):0}%"></i></span><b class="popup-funnel-value">${fmt(a.jump)}</b></div><div class="popup-funnel-rate">有效播放率 ${popupRate(a.playRate)}</div><div class="popup-funnel-row"><span class="popup-funnel-label">有效播放 UV</span><span class="popup-funnel-bar"><i style="width:${a.exposure?Math.min(a.play/a.exposure*100,100):0}%"></i></span><b class="popup-funnel-value">${fmt(a.play)}</b></div></div></section></div><section class="panel"><div class="panel-head"><div><h3>数据质量提示</h3><span>异常数据保留在明细中，不参与贡献排行</span></div></div><div class="popup-quality-list"><div class="popup-quality-item"><span>异常比例记录</span><strong>${fmt(anomalies)} 条</strong></div><div class="popup-quality-item warn"><span>曝光 UV 低于 1,000 的记录</span><strong>${fmt(low)} 条</strong></div></div><p class="popup-section-note">比例超过 100% 或小样本记录需结合原始组件数据核查，不直接作为放量依据。</p></section>`;
  popupChart('#popup-overview-contribution',{animation:false,grid:{left:150,right:58,top:16,bottom:24,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:p=>{const x=p?.[0],r=top[top.length-1-(x?.dataIndex??0)];return r?`${esc(r.name||'--')}<br/>有效播放 UV：${fmt(r.play_uv)}<br/>曝光 UV：${fmt(r.expost_uv)}`:''}},xAxis:{type:'value',axisLabel:{color:'#8392a7'},splitLine:{lineStyle:{color:'#edf1f6'}}},yAxis:{type:'category',data:top.slice().reverse().map(r=>String(r.name||'--').slice(0,18)),axisLabel:{color:'#455b77',width:130,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:26,data:top.slice().reverse().map((r,i)=>({value:popupNum(r.play_uv)||0,itemStyle:{color:i<3?'#2f8a55':'#a8cdaF'}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>fmt(p.value)}}]});
}
function renderPopupRanking(){
  const root=$('#popup-ranking');if(!root)return;const list=popupRows(),metric=popupViewState.metric,threshold=popupViewState.threshold,items=list.filter(r=>!popupAnomaly(r)&&(popupNum(r.expost_uv)||0)>=threshold).sort((a,b)=>(popupNum(b[metric])||0)-(popupNum(a[metric])||0)).slice(0,10);root.innerHTML=`<div class="popup-toolbar"><label>排行指标<select id="popup-ranking-metric">${Object.entries(popupMetricMap).map(([k,v])=>`<option value="${k}" ${k===metric?'selected':''}>${v}</option>`).join('')}</select></label><label>曝光门槛<select id="popup-ranking-threshold"><option value="0" ${threshold===0?'selected':''}>不限</option><option value="1000" ${threshold===1000?'selected':''}>≥ 1,000</option><option value="5000" ${threshold===5000?'selected':''}>≥ 5,000</option></select></label><span class="popup-toolbar-note">仅展示正常比例记录 · TOP10</span></div><section class="panel"><div class="panel-head"><div><h3>${popupMetricMap[metric]}排行</h3><span>${popupViewState.date} · 安卓新人人</span></div><strong>${items.length} 个</strong></div><div id="popup-ranking-chart" class="popup-chart" role="img" aria-label="弹窗指标排行"></div></section>`;
  $('#popup-ranking-metric')?.addEventListener('change',e=>{popupViewState.metric=e.target.value;renderPopupRanking()});$('#popup-ranking-threshold')?.addEventListener('change',e=>{popupViewState.threshold=Number(e.target.value)||0;renderPopupRanking()});
  const rate=['ctr','play_rate'].includes(metric);popupChart('#popup-ranking-chart',{animation:false,grid:{left:150,right:70,top:16,bottom:28,containLabel:true},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>rate?popupRate(v):fmt(v)},xAxis:{type:'value',axisLabel:{color:'#8392a7',formatter:v=>rate?`${Math.round(v*100)}%`:fmt(v)},splitLine:{lineStyle:{color:'#edf1f6'}}},yAxis:{type:'category',data:items.slice().reverse().map(r=>String(r.name||'--').slice(0,18)),axisLabel:{color:'#455b77',width:130,overflow:'truncate'}},series:[{type:'bar',barMaxWidth:28,data:items.slice().reverse().map((r,i)=>({value:popupNum(r[metric])||0,itemStyle:{color:i<3?'#2f76e8':'#a8c7e8'}})),label:{show:true,position:'right',color:'#40536d',formatter:p=>rate?popupRate(p.value):fmt(p.value)}}]});
}
function renderPopupDetail(){
  const root=$('#popup-detail');if(!root)return;const source=popupRows().filter(r=>{const q=popupViewState.search.trim().toLowerCase();return !q||String(r.name||'').toLowerCase().includes(q)||String(r.id||'').toLowerCase().includes(q)}),key=popupViewState.sortKey,dir=popupViewState.sortDir==='asc'?1:-1,sorted=[...source].sort((a,b)=>{if(['name','id'].includes(key))return String(a[key]||'').localeCompare(String(b[key]||''),'zh-CN')*dir;return ((popupNum(a[key])||0)-(popupNum(b[key])||0))*dir}),pages=Math.max(1,Math.ceil(sorted.length/popupViewState.pageSize));popupViewState.page=Math.min(Math.max(1,popupViewState.page),pages);const shown=sorted.slice((popupViewState.page-1)*popupViewState.pageSize,popupViewState.page*popupViewState.pageSize);
  root.innerHTML=`<div class="popup-toolbar"><label>组件搜索<input id="popup-detail-search" type="search" placeholder="名称或组件 ID" value="${esc(popupViewState.search)}"></label><label>排序字段<select id="popup-detail-sort">${Object.entries({expost_uv:'曝光UV',click_uv:'点击UV',ctr:'点击率',jump_uv:'跳转播放UV',play_uv:'有效播放UV',play_rate:'有效播放率'}).map(([k,v])=>`<option value="${k}" ${key===k?'selected':''}>${v}降序</option>`).join('')}</select></label><span class="popup-toolbar-note">${popupViewState.date} · ${sorted.length} 条</span></div><section class="panel"><div class="popup-detail-wrap"><table class="popup-table"><thead><tr><th>组件名称</th><th>组件 ID</th><th>日期</th><th>曝光 PV</th><th>曝光 UV</th><th>点击 PV</th><th>点击 UV</th><th>跳转播放 PV</th><th>跳转播放 UV</th><th>有效播放 PV</th><th>有效播放 UV</th><th>点击率</th><th>转化率</th><th>有效播放率</th></tr></thead><tbody>${shown.map(r=>`<tr class="${popupAnomaly(r)?'popup-row-alert':''}"><td class="popup-name" title="${esc(r.name)}">${esc(r.name)}</td><td>${esc(r.id)}</td><td>${esc(popupDate(r))}</td><td>${fmt(r.expost_pv)}</td><td>${fmt(r.expost_uv)}</td><td>${fmt(r.click_pv)}</td><td>${fmt(r.click_uv)}</td><td>${fmt(r.jump_pv)}</td><td>${fmt(r.jump_uv)}</td><td>${fmt(r.play_pv)}</td><td>${fmt(r.play_uv)}</td><td class="popup-rate ${popupAnomaly(r)?'popup-alert':''}">${popupRate(r.ctr)}</td><td class="popup-rate ${popupAnomaly(r)?'popup-alert':''}">${popupRate(r.conversion_rate)}</td><td class="popup-rate ${popupAnomaly(r)?'popup-alert':''}">${popupRate(r.play_rate)}</td></tr>`).join('')||'<tr><td colspan="14" class="popup-empty">暂无符合条件的数据</td></tr>'}</tbody></table></div><div class="popup-pager"><span>第 ${sorted.length?popupViewState.page:0} / ${sorted.length?pages:0} 页</span><button type="button" id="popup-detail-prev" ${popupViewState.page<=1?'disabled':''}>上一页</button><button type="button" id="popup-detail-next" ${popupViewState.page>=pages?'disabled':''}>下一页</button></div></section>`;
  $('#popup-detail-search')?.addEventListener('input',e=>{popupViewState.search=e.target.value;popupViewState.page=1;renderPopupDetail()});$('#popup-detail-sort')?.addEventListener('change',e=>{popupViewState.sortKey=e.target.value;popupViewState.page=1;renderPopupDetail()});$('#popup-detail-prev')?.addEventListener('click',()=>{popupViewState.page=Math.max(1,popupViewState.page-1);renderPopupDetail()});$('#popup-detail-next')?.addEventListener('click',()=>{popupViewState.page=Math.min(pages,popupViewState.page+1);renderPopupDetail()});
}
function renderPopupPage(){
  const host=$('#page-popup');if(!host)return;const dates=popupDates();if(!dates.includes(popupViewState.date))popupViewState.date=dates.at(-1)||DASHBOARD_RANGE_END;const dateInput=$('#popup-date');if(dateInput)dateInput.value=popupViewState.date;popupBuild();$$('.page').forEach(page=>page.classList.toggle('active',page===host));$$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.page==='popup'));$('#client-filter')?.classList.add('banner-global-hidden');document.querySelector('.top-actions .period-filter')?.classList.add('banner-global-hidden');setText('page-title','弹窗数据');$$('.popup-sub-tabs button').forEach(button=>{const active=button.dataset.popupTab===popupViewState.tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});$$('.popup-panel').forEach(panel=>panel.classList.toggle('active',panel.id===`popup-${popupViewState.tab}`));if(popupViewState.tab==='overview')renderPopupOverview();if(popupViewState.tab==='ranking')renderPopupRanking();if(popupViewState.tab==='detail')renderPopupDetail();deferResize();
}
const renderPageBeforePopup=renderPage;
renderPage=function(){if(state.page==='popup'){renderPopupPage();return}renderPageBeforePopup()};

renderPopupDetail=function(){
  const root=$('#popup-detail');if(!root)return;
  const source=popupRows().filter(r=>{const q=popupViewState.search.trim().toLowerCase();return !q||String(r.name||'').toLowerCase().includes(q)||String(r.id||'').toLowerCase().includes(q)}),key=popupViewState.sortKey,dir=popupViewState.sortDir==='asc'?1:-1;
  const sorted=[...source].sort((a,b)=>{if(['name','id'].includes(key))return String(a[key]||'').localeCompare(String(b[key]||''),'zh-CN')*dir;return ((popupNum(a[key])||0)-(popupNum(b[key])||0))*dir});
  const pages=Math.max(1,Math.ceil(sorted.length/popupViewState.pageSize));popupViewState.page=Math.min(Math.max(1,popupViewState.page),pages);const shown=sorted.slice((popupViewState.page-1)*popupViewState.pageSize,popupViewState.page*popupViewState.pageSize);
  const headers=[['name','组件名称'],['id','组件 ID'],['date','日期'],['expost_pv','曝光 PV'],['expost_uv','曝光 UV'],['click_pv','点击 PV'],['click_uv','点击 UV'],['jump_pv','跳转播放 PV'],['jump_uv','跳转播放 UV'],['play_pv','有效播放 PV'],['play_uv','有效播放 UV'],['ctr','点击率'],['conversion_rate','转化率'],['play_rate','有效播放率']],sortable=new Set(['expost_pv','expost_uv','click_pv','click_uv','jump_pv','jump_uv','play_pv','play_uv','ctr','conversion_rate','play_rate']);
  const headerHtml=headers.map(([k,label])=>sortable.has(k)?`<th><button type="button" class="popup-sort-button ${key===k?'is-sorted':''}" data-popup-detail-sort="${k}" aria-label="按${label}排序">${label}<span>${key===k?(dir===-1?'↓':'↑'):'↕'}</span></button></th>`:`<th>${label}</th>`).join('');
  root.innerHTML=`<div class="popup-toolbar"><label>组件搜索<input id="popup-detail-search" type="search" placeholder="名称或组件 ID" value="${esc(popupViewState.search)}"></label><span class="popup-toolbar-note">${popupViewState.date} · ${sorted.length} 条 · 点击表头排序</span></div><section class="panel"><div class="popup-detail-wrap"><table class="popup-table"><thead><tr>${headerHtml}</tr></thead><tbody>${shown.map(r=>`<tr class="${popupAnomaly(r)?'popup-row-alert':''}"><td class="popup-name" title="${esc(r.name)}">${esc(r.name)}</td><td>${esc(r.id)}</td><td>${esc(popupDate(r))}</td><td>${fmt(r.expost_pv)}</td><td>${fmt(r.expost_uv)}</td><td>${fmt(r.click_pv)}</td><td>${fmt(r.click_uv)}</td><td>${fmt(r.jump_pv)}</td><td>${fmt(r.jump_uv)}</td><td>${fmt(r.play_pv)}</td><td>${fmt(r.play_uv)}</td><td class="popup-rate ${popupAnomaly(r)?'popup-alert':''}">${popupRate(r.ctr)}</td><td class="popup-rate ${popupAnomaly(r)?'popup-alert':''}">${popupRate(r.conversion_rate)}</td><td class="popup-rate ${popupAnomaly(r)?'popup-alert':''}">${popupRate(r.play_rate)}</td></tr>`).join('')||'<tr><td colspan="14" class="popup-empty">暂无符合条件的数据</td></tr>'}</tbody></table></div><div class="popup-pager"><span>第 ${sorted.length?popupViewState.page:0} / ${sorted.length?pages:0} 页</span><button type="button" id="popup-detail-prev" ${popupViewState.page<=1?'disabled':''}>上一页</button><button type="button" id="popup-detail-next" ${popupViewState.page>=pages?'disabled':''}>下一页</button></div></section>`;
  $('#popup-detail-search')?.addEventListener('input',e=>{popupViewState.search=e.target.value;popupViewState.page=1;renderPopupDetail()});$$('.popup-sort-button').forEach(button=>button.addEventListener('click',()=>{const nextKey=button.dataset.popupDetailSort;if(popupViewState.sortKey===nextKey)popupViewState.sortDir=popupViewState.sortDir==='asc'?'desc':'asc';else{popupViewState.sortKey=nextKey;popupViewState.sortDir='desc'}popupViewState.page=1;renderPopupDetail()}));$('#popup-detail-prev')?.addEventListener('click',()=>{popupViewState.page=Math.max(1,popupViewState.page-1);renderPopupDetail()});$('#popup-detail-next')?.addEventListener('click',()=>{popupViewState.page=Math.min(pages,popupViewState.page+1);renderPopupDetail()});
}

/* Keep every popup bar chart on the same green used by Banner click ranking. */
const popupChartBase=popupChart;
popupChart=function(id,option){
  const bannerBarColor=getComputedStyle(document.documentElement).getPropertyValue('--green').trim()||'#159a70';
  const series=(option?.series||[]).map(item=>({...item,itemStyle:{...(item.itemStyle||{}),color:bannerBarColor,borderRadius:[0,5,5,0]},data:Array.isArray(item.data)?item.data.map(value=>typeof value==='object'?({...value,itemStyle:{...(value.itemStyle||{}),color:bannerBarColor,borderRadius:[0,5,5,0]}}):value):item.data}));
  popupChartBase(id,{...option,animation:true,animationDuration:520,animationDurationUpdate:360,animationEasing:'cubicOut',animationEasingUpdate:'cubicOut',series});
  const el=$(id),chart=el&&window.echarts?echarts.getInstanceByDom(el):null;
  if(chart&&!chart.__popupClickMotion){chart.__popupClickMotion=true;chart.on('click',params=>{chart.dispatchAction({type:'downplay',seriesIndex:params.seriesIndex});chart.dispatchAction({type:'highlight',seriesIndex:params.seriesIndex,dataIndex:params.dataIndex});chart.dispatchAction({type:'showTip',seriesIndex:params.seriesIndex,dataIndex:params.dataIndex})});chart.on('click',params=>{const wave=document.createElement('span'),event=params?.event?.event||params?.event||{};wave.className='popup-chart-wave';wave.style.left=`${Number(event.offsetX)||chart.getWidth()/2}px`;wave.style.top=`${Number(event.offsetY)||chart.getHeight()/2}px`;el.style.position='relative';el.appendChild(wave);setTimeout(()=>wave.remove(),760)})}
  if(el&&!el.__popupDomClickMotion){el.__popupDomClickMotion=true;el.addEventListener('click',event=>{const wave=document.createElement('span');wave.className='popup-chart-wave';wave.style.left=`${event.offsetX}px`;wave.style.top=`${event.offsetY}px`;el.appendChild(wave);setTimeout(()=>wave.remove(),760)})}
}

const groupedNavMap={insight:'insight',overview:'overview',content:'overview',search:'overview',genre:'overview',home:'home',guess:'banner',sections:'banner','search-funnel':'overview',banner:'banner',popup:'banner'};
const renderPageBeforeGroupedNav=renderPage;
renderPage=function(){renderPageBeforeGroupedNav();const group=groupedNavMap[state.page]||state.page;$$('.nav-parent').forEach(button=>button.classList.toggle('active',button.dataset.page===group));$$('.nav-subitem').forEach(button=>button.classList.toggle('active',button.dataset.page===state.page))};
$$('.nav-subitem').forEach(button=>{if(button.tagName==='A'||button.dataset.navBound)return;button.dataset.navBound='1';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();state.page=button.dataset.page;renderPage()})});
window.__openResourcePage=()=>{state.page='banner';renderPage()};

const popupOverviewBase=renderPopupOverview;
new MutationObserver(()=>{const tb=document.querySelector('#popup-detail .popup-toolbar');if(tb&&!tb.querySelector('.popup-detail-dates')){const box=document.createElement('label');box.className='popup-detail-dates';box.innerHTML='<span>日期范围</span><input type="date"><span>至</span><input type="date">';tb.appendChild(box)}}).observe(document.body,{subtree:true,childList:true});
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-page="popup"]'))return;setTimeout(()=>{const host=$('#page-popup'),rank=$('#popup-ranking'),trend=$('#popup-overview'),detail=$('#popup-detail');if(!host||!rank||!trend||!detail)return;host.append(rank,trend,detail);const h=rank.querySelector('.panel-head');if(h&&!h.querySelector('.popup-rank-date')){const l=document.createElement('label');l.className='popup-rank-date';l.innerHTML='<span>日期</span><input type="date" value="'+popupViewState.date+'">';l.querySelector('input').addEventListener('change',e=>{popupViewState.date=e.target.value;renderPopupPage()});h.appendChild(l)}const tb=detail.querySelector('.popup-toolbar');if(tb&&!tb.querySelector('.popup-detail-dates')){const box=document.createElement('label');box.className='popup-detail-dates';box.innerHTML='<span>日期范围</span><input type="date"><span>至</span><input type="date">';tb.appendChild(box)}},120)});
renderPopupOverview=function(){
  popupOverviewBase();
  const dates=popupDates(),previous=dates.filter(date=>date<popupViewState.date).at(-1);if(!previous)return;
  const current=popupAggregate(popupRows()),prior=popupAggregate(rows(state.data.popupWindow||[]).filter(r=>popupDate(r)===previous));
  const changes=[current.exposure!=null&&prior.exposure?((current.exposure-prior.exposure)/prior.exposure):null,current.ctr!=null&&prior.ctr?((current.ctr-prior.ctr)/prior.ctr):null,current.play!=null&&prior.play?((current.play-prior.play)/prior.play):null,current.playRate!=null&&prior.playRate?((current.playRate-prior.playRate)/prior.playRate):null];
  [0,1,2,3].forEach((index,i)=>{const card=document.querySelectorAll('#popup-overview .popup-kpi')[index],change=changes[i];if(!card||change==null)return;const node=document.createElement('small');node.className=`popup-delta ${change>=0?'is-up':'is-down'}`;node.textContent=`${change>=0?'↑':'↓'} ${(Math.abs(change)*100).toFixed(2)}%`;card.appendChild(node)});
}

// Final authority for the content ranking page.  Several historical page
// wrappers still call the legacy snapshot renderer; always hand the content
// detail back to the season_id-based ranking board after navigation.
const renderPageBeforeAuthoritativeRanking=renderPage;
renderPage=function(){
  renderPageBeforeAuthoritativeRanking();
  setupRankingBoard();
  requestAnimationFrame(()=>setupRankingBoard());
  setTimeout(()=>setupRankingBoard(),0);
  setTimeout(()=>setupRankingBoard(),500);
  setTimeout(()=>setupRankingBoard(),3000);
  setTimeout(()=>setupRankingBoard(),8000);
};
// The legacy sidebar listener is bound during the initial bootstrap, before
// the final renderer wrappers are installed. Re-apply the ranking enhancement
// after that navigation event as well.
document.querySelectorAll('[data-page="content"]').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>setupRankingBoard(),800)));

// Load each page's existing data dependencies on first entry. Rendering stays
// delegated to the established renderer chain so business output is unchanged.
const PAGE_DATA_KEYS={
  insight:['daily','playRate','duration','playCount','sectionOps','channelOps','bannerClick','ranking','hotSearch','hotKeywordDramaMap','genreRatio'],
  report:['daily','duration','playCount','ranking','hotSearch','newHotSearch','hotKeywordDramaMap','genreRatio','genreMapping','channelOps','bannerClick','popupWindow'],
  overview:['daily','playRate','duration','playCount'],
  content:['ranking','genreRatio','genreMapping','seasonTitleMap'],
  search:['hotSearch','newHotSearch','hotKeywordDramaMap','seasonTitleMap'],
  genre:['genreRatio','genreMapping'],
  home:['channelOps'],
  guess:['guessQuickBi'],
  sections:['sectionOps'],
  'search-funnel':['searchConversion'],
  banner:['bannerClick','seasonTitleMap'],
  popup:['popupWindow']
};
const pageDataLoads=new Map();
function ensurePageData(page){
  const missing=(PAGE_DATA_KEYS[page]||[]).filter(key=>!Object.prototype.hasOwnProperty.call(state.data,key));
  if(!missing.length)return null;
  if(pageDataLoads.has(page))return pageDataLoads.get(page);
  const sources={...DATA,...DATA_PATHS};
  const promise=Promise.all(missing.map(async key=>{
    const path=LOAD_PATH_OVERRIDES[key]||DATA_PATHS[key]||sources[key];
    if(!path){state.data[key]=[];return}
    try{state.data[key]=await load(path)}catch(error){console.warn('[dashboard] data resource unavailable',path,error);state.data[key]=[]}
  })).finally(()=>pageDataLoads.delete(page));
  pageDataLoads.set(page,promise);
  return promise;
}

// Final popup page implementation. Keep this at the end so the historical
// popup renderers above cannot replace the single-page layout or date limits.
function popupYesterdayFinal(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}
function popupValidRowsFinal(){const yesterday=popupYesterdayFinal();return popupMergedRows().filter(r=>r.date&&r.date<=yesterday)}
function renderPopupRankingFinal(){
  const root=$('#popup-ranking');if(!root)return;
  const yesterday=popupYesterdayFinal(),dates=[...new Set(popupValidRowsFinal().map(r=>r.date))].sort();
  if(!dates.includes(popupViewState.date)||popupViewState.date>yesterday)popupViewState.date=dates.at(-1)||yesterday;
  // The contribution board is cumulative through yesterday; a single day
  // with no valid play value must not make the whole board disappear.
  const dayRows=popupValidRowsFinal();
  const map=new Map();
  dayRows.forEach(r=>{const x=map.get(r.name)||{...r,expost_uv:0,click_uv:0,play_uv:0};x.expost_uv+=r.expost_uv||0;x.click_uv+=r.click_uv||0;x.play_uv+=r.play_uv||0;map.set(r.name,x)});
  const items=[...map.values()].sort((a,b)=>b.play_uv-a.play_uv).slice(0,10);
  root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>弹窗有效播放贡献榜</h3><span>累计统计至 ${yesterday} · 按有效播放 UV 排序</span></div><label class="popup-rank-date"><span>日期上限</span><input id="popup-ranking-date" type="date" max="${yesterday}" value="${yesterday}" readonly></label></div><div id="popup-ranking-chart" class="banner-ranking-chart popup-ranking-chart" role="img" aria-label="弹窗有效播放贡献榜"></div></section>`;
  $('#popup-ranking-date')?.addEventListener('change',e=>{popupViewState.date=e.target.value>yesterday?yesterday:e.target.value;renderPopupPageFinal()});
  const chart=$('#popup-ranking-chart');
  if(!chart||!window.echarts)return;
  const instance=echarts.getInstanceByDom(chart)||echarts.init(chart);
  if(!items.length){instance.clear();chart.innerHTML='<div class="popup-empty">暂无有效播放数据</div>';return}
  const chartGreen=getComputedStyle(document.documentElement).getPropertyValue('--green').trim()||'#2f6f3e';
  const ranked=items.slice().reverse();
  const compactAxis=chart.clientWidth<800;
  instance.setOption({
    animation:false,
    grid:{left:190,right:76,top:12,bottom:26,containLabel:true},
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>{const item=params?.[0],row=items[items.length-1-(item?.dataIndex??0)];if(!row)return '';return `${esc(row.name||'--')}<br/>有效播放UV：${fmt(row.play_uv)}`}},
    xAxis:{type:'value',min:0,axisLabel:{color:'#8392a7',formatter:value=>compactAxis&&Number(value)>=10000?`${(Number(value)/10000).toFixed(Number(value)%10000?1:0)}万`:fmt(value)},splitLine:{lineStyle:{color:'#edf1f6'}}},
    yAxis:{type:'category',data:ranked.map(row=>String(row.name||'--').slice(0,26)),axisLabel:{color:'#455b77',width:178,overflow:'truncate'}},
    series:[{type:'bar',barMaxWidth:26,data:ranked.map(row=>row.play_uv||0),itemStyle:{color:chartGreen,borderRadius:[0,5,5,0]},label:{show:true,position:'right',color:'#405b78',fontWeight:750,formatter:value=>fmt(value.value)}}]
  });
  instance.resize();
}
function renderPopupOverviewFinal(){
  const root=$('#popup-overview');if(!root)return;
  const windowSize=Number(popupViewState.trendWindow)||7;
  const query=String(popupViewState.search||'');
  root.innerHTML=`<section class="panel popup-trend-panel"><div class="panel-head"><div><h3>上线后趋势</h3><span>有效播放 UV · 不区分客户端</span></div><div class="banner-trend-controls"><label class="banner-trend-search popup-title-suggest"><span>剧名搜索</span><input id="popup-trend-search" type="search" placeholder="输入剧名或组件名称" value="${esc(query)}" autocomplete="off"><div id="popup-trend-suggestions" class="popup-title-suggestions"></div></label><div class="banner-trend-periods" role="tablist" aria-label="弹窗趋势观察周期"><button type="button" class="banner-trend-period ${windowSize===7?'is-active':''}" data-popup-trend-window="7" role="tab" aria-selected="${windowSize===7}">上线后一周</button><button type="button" class="banner-trend-period ${windowSize===30?'is-active':''}" data-popup-trend-window="30" role="tab" aria-selected="${windowSize===30}">近30天</button></div></div></div><div id="popup-trend-chart" class="popup-chart" role="img" aria-label="弹窗上线后趋势图"></div></section>`;
  const input=$('#popup-trend-search');
  input?.addEventListener('input',e=>{popupViewState.search=e.target.value;renderPopupOverviewFinal()});
  renderPopupSuggestions('#popup-trend-suggestions',query,()=>renderPopupOverviewFinal());
  renderPopupTrendFinal(query);
  root.querySelectorAll('[data-popup-trend-window]').forEach(btn=>btn.addEventListener('click',()=>{popupViewState.trendWindow=Number(btn.dataset.popupTrendWindow)||7;renderPopupOverviewFinal()}));
}
function popupTitleSuggestions(query){
  const normalized=String(query||'').trim().toLowerCase();
  if(!normalized)return [];
  return [...new Set(popupValidRowsFinal().map(row=>String(row.name||'').trim()).filter(Boolean))]
    .filter(name=>name.toLowerCase().includes(normalized))
    .sort((a,b)=>{const as=a.toLowerCase().startsWith(normalized),bs=b.toLowerCase().startsWith(normalized);return as===bs?a.localeCompare(b,'zh-CN'):(as?-1:1)})
    .slice(0,8);
}
function renderPopupSuggestions(selector,query,onSelect){
  const host=$(selector);if(!host)return;
  host.innerHTML=popupTitleSuggestions(query).map(name=>`<button type="button" data-popup-title-suggestion="${esc(name)}">${esc(name)}</button>`).join('');
  host.querySelectorAll('[data-popup-title-suggestion]').forEach(button=>button.addEventListener('click',()=>{popupViewState.search=button.dataset.popupTitleSuggestion||button.textContent||'';onSelect()}));
}
function renderPopupTrendFinal(query){
  const chart=$('#popup-trend-chart');if(!chart)return;const q=String(query||'').trim().toLowerCase();if(!q){chart.innerHTML='<div class="popup-empty">请输入剧名查看上线后一周趋势</div>';return}
  const all=popupValidRowsFinal().filter(r=>r.name.toLowerCase().includes(q)),name=all[0]?.name||'';if(!name){chart.innerHTML='<div class="popup-empty">未找到匹配的剧名</div>';return}
  const dates=[...new Set(all.filter(r=>r.name===name).map(r=>r.date))].sort().slice(0,Number(popupViewState.trendWindow)||7),data=dates.map(d=>all.find(r=>r.name===name&&r.date===d)?.play_uv??null);
  popupChart('#popup-trend-chart',{animation:false,grid:{left:60,right:24,top:24,bottom:38,containLabel:true},tooltip:{trigger:'axis',formatter:p=>{const i=p?.[0]?.dataIndex??0,r=all.find(x=>x.name===name&&x.date===dates[i]);return `${esc(name)}<br/>日期：${dates[i]}<br/>有效播放UV：${fmt(r?.play_uv)}<br/>点击UV：${fmt(r?.click_uv)}<br/>点击率：${popupRate(r?.ctr)}`}},xAxis:{type:'category',data:dates},yAxis:{type:'value',axisLabel:{formatter:v=>fmt(v)}},series:[{name:'有效播放UV',type:'line',smooth:true,symbol:'circle',symbolSize:7,data,lineStyle:{width:3,color:'#2f76e8'},itemStyle:{color:'#2f76e8'}}]});
}
function renderPopupDetailFinal(){
  const root=$('#popup-detail');if(!root)return;const yesterday=popupYesterdayFinal(),q=String(popupViewState.search||'').trim().toLowerCase();
  const source=popupValidRowsFinal().filter(r=>(!popupViewState.detailStart||r.date>=popupViewState.detailStart)&&(!popupViewState.detailEnd||r.date<=popupViewState.detailEnd)&&(!q||r.name.toLowerCase().includes(q)));
  const dateMin=popupValidRowsFinal().map(r=>r.date).sort()[0]||yesterday;
  root.innerHTML=`<div class="popup-toolbar"><label class="popup-title-suggest">剧名搜索<input id="popup-detail-search" type="search" placeholder="输入剧名" value="${esc(popupViewState.search||'')}" autocomplete="off"><div id="popup-detail-suggestions" class="popup-title-suggestions"></div></label><label>日期范围<input id="popup-detail-start" type="date" min="${dateMin}" max="${yesterday}" value="${popupViewState.detailStart||''}"></label><span class="popup-date-separator">至</span><label class="popup-date-end"><span>&nbsp;</span><input id="popup-detail-end" type="date" min="${dateMin}" max="${yesterday}" value="${popupViewState.detailEnd||''}"></label><button type="button" class="banner-excel-button" id="popup-export-excel">导出 Excel</button><span class="popup-toolbar-note">一天一剧一行 · ${source.length} 条</span></div><section class="panel"><div class="popup-detail-wrap"><table class="popup-table"><thead><tr>${['日期','剧名','曝光PV','曝光UV','点击PV','点击UV','跳转播放PV','跳转播放UV','有效播放PV','有效播放UV','点击率','转化率','有效播放率'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${source.map(r=>`<tr><td>${esc(r.date)}</td><td class="popup-name">${esc(r.name)}</td><td>${fmt(r.expost_pv)}</td><td>${fmt(r.expost_uv)}</td><td>${fmt(r.click_pv)}</td><td>${fmt(r.click_uv)}</td><td>${fmt(r.jump_pv)}</td><td>${fmt(r.jump_uv)}</td><td>${fmt(r.play_pv)}</td><td>${fmt(r.play_uv)}</td><td>${popupRate(r.ctr)}</td><td>${popupRate(r.conversion_rate)}</td><td>${popupRate(r.play_rate)}</td></tr>`).join('')||'<tr><td colspan="13" class="popup-empty">暂无符合条件的数据</td></tr>'}</tbody></table></div></section>`;
  $('#popup-detail-search')?.addEventListener('input',e=>{popupViewState.search=e.target.value;renderPopupDetailFinal()});
  renderPopupSuggestions('#popup-detail-suggestions',popupViewState.search,renderPopupDetailFinal);
  $('#popup-detail-start')?.addEventListener('change',e=>{popupViewState.detailStart=e.target.value;renderPopupDetailFinal()});$('#popup-detail-end')?.addEventListener('change',e=>{popupViewState.detailEnd=e.target.value;renderPopupDetailFinal()});
  $('#popup-export-excel')?.addEventListener('click',()=>{const rows4=source.filter(r=>[...new Set(source.map(x=>x.date))].sort().slice(0,4).includes(r.date)),header=['日期','剧名','曝光PV','曝光UV','点击PV','点击UV','跳转播放PV','跳转播放UV','有效播放PV','有效播放UV','点击率','转化率','有效播放率'],html='<table><tr>'+header.map(h=>`<th>${h}</th>`).join('')+'</tr>'+rows4.map(r=>'<tr>'+[r.date,r.name,r.expost_pv,r.expost_uv,r.click_pv,r.click_uv,r.jump_pv,r.jump_uv,r.play_pv,r.play_uv,r.ctr,r.conversion_rate,r.play_rate].map(v=>`<td>${v??''}</td>`).join('')+'</tr>').join('')+'</table>',blob=new Blob(['\ufeff',html],{type:'application/vnd.ms-excel'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='弹窗明细_上线前4个数据日.xls';a.click();URL.revokeObjectURL(url)});
}
function renderPopupPageFinal(){const host=$('#page-popup');if(!host)return;const yesterday=popupYesterdayFinal();if(popupViewState.date>yesterday)popupViewState.date=yesterday;$$('.page').forEach(page=>page.classList.toggle('active',page===host));setText('page-title','弹窗数据');$('#client-filter')?.classList.add('banner-global-hidden');document.querySelector('.top-actions .period-filter')?.classList.add('banner-global-hidden');const rank=$('#popup-ranking'),trend=$('#popup-overview'),detail=$('#popup-detail');if(!rank||!trend||!detail)return;host.append(rank,trend,detail);[rank,trend,detail].forEach(p=>{p.classList.add('active');p.style.display='block'});renderPopupRankingFinal();renderPopupOverviewFinal();renderPopupDetailFinal();setTimeout(renderPopupRankingFinal,450);deferResize()}
renderPopupPage=renderPopupPageFinal;
// Repaint after legacy navigation listeners finish their delayed snapshot render.
document.addEventListener('click',event=>{if(event.target.closest?.('[data-page="popup"]'))setTimeout(renderPopupPageFinal,350)});
const renderPageBeforeLazyData=renderPage;
renderPage=function(){
  const requestedPage=state.page;
  const pending=ensurePageData(requestedPage);
  if(pending){
    setDashboardLoading(true);
    pending.then(()=>{if(state.page===requestedPage)renderPageBeforeLazyData()}).finally(()=>{if(state.page===requestedPage)finishDashboardLoading()});
    return;
  }
  renderPageBeforeLazyData();
};

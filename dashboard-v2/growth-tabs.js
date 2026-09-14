(() => {
  const RANGE_START = '2026-07-01';
  let RANGE_END = '2026-09-10';
  const DATA_URL = 'data/content_growth_tabs.json?v=20260911-growth-refresh';
  const GENRES = [['CHN','国产剧'],['KR','韩剧'],['TH','泰剧'],['JP','日剧'],['USK','美剧'],['UK','英剧'],['OTHER','其他']];
  // Human override: these IDs are sourced from 电视列表 (2).xlsx. Keep the
  // provider's season_type untouched and only change the dashboard label.
  const BL_GENRE_OVERRIDE_IDS = new Set(['59403','59371','59181','59159','59062','58503','58350','58309','58204','58203','58202','57981','57977','57948','57947','57870','57828','57827','57822','57750','57748','57619','57497','57476','57475','57460','57441','57402','57398','57370','57352','57298','56864','56830','56782','56329','56008','55427','55391','55334','55322','54871','54781','54279','53874','53805','53783','53772','53529','53496','53325','51780','39438']);
  const displayBLGenre = row => displayGenreCode(row)==='CHN' ? '国产剧' : ({CHN:'国产剧',JP:'日剧',KR:'韩剧',TH:'泰剧',UK:'英剧',USK:'美剧',OTHER:'其他'}[row?.season_type] || row?.genre || row?.season_type || '其他');
  const isDomesticDisplayRow = row => {
    const plot=String(row?.plot_type||'').split(',').map(value=>value.trim());
    const metadataMatches=String(row?.season_type||'')==='TH'
      &&plot.includes('同性')
      &&String(row?.producer_region||'').includes('泰国');
    // 映射 ID 已由电视列表 (2).xlsx 按“泰国 + 同性 + 普通话”筛选，
    // 播放明细再校验泰剧 / 同性 / 泰国，避免把所有泰剧 BL 内容归为国产剧。
    return BL_GENRE_OVERRIDE_IDS.has(String(row?.season_id||'').trim()) && metadataMatches;
  };
  const displayGenreCode = row => isDomesticDisplayRow(row) ? 'CHN' : String(row?.season_type || ({'国产':'CHN','国产剧':'CHN','韩剧':'KR','泰剧':'TH','日剧':'JP','美剧':'USK','英剧':'UK','其他':'OTHER'}[row?.genre] || 'OTHER'));
  function mappedGenreView(rawView){
    const sources=Array.isArray(rawView)?rawView:Object.values(rawView||{}), result={};
    const buckets={};
    GENRES.forEach(([code])=>{buckets[code]={top30_vv:[],top30_uv:[],seen_vv:new Set(),seen_uv:new Set()}});
    sources.forEach(source=>{
      if(!source||typeof source!=='object')return;
      ['top30_vv','top30_uv'].forEach(metric=>{
        (Array.isArray(source[metric])?source[metric]:[]).forEach(row=>{
          const code=displayGenreCode(row),id=String(row?.season_id||row?.title||'');
          if(!buckets[code])return;
          const seen=buckets[code][`seen_${metric.slice(6)}`];
          if(seen.has(id))return;
          seen.add(id);buckets[code][metric].push(row);
        });
      });
    });
    GENRES.forEach(([code,label])=>{
      buckets[code].top30_vv.sort((a,b)=>Number(b.play_count||0)-Number(a.play_count||0));
      buckets[code].top30_uv.sort((a,b)=>Number(b.play_uv||0)-Number(a.play_uv||0));
      const base=sources.find(source=>String(source?.genre_code||'')===code)||{};
      result[code]={...base,genre:code==='CHN'?'国产剧':label,top30_vv:buckets[code].top30_vv.slice(0,30),top30_uv:buckets[code].top30_uv.slice(0,30)};
    });
    return result;
  }
  const state = { genre: 'CHN', genreMetric: 'play_count', growthPeriod: '2026-08-31|2026-09-06', growthMetric: 'vv_delta', growthStatus: 'all', growthFeature: 'all', blMetric: 'play_count' };
  let data = null;
  let dailyData = null;
  let genreDailyData = null;
  let growthRawData = null;
  const growthDailyCache = new Map();
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '--').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const fmt = value => value == null || value === '' || !Number.isFinite(Number(value)) ? '--' : Math.round(Number(value)).toLocaleString('zh-CN');
  const pct = value => value == null || !Number.isFinite(Number(value)) ? '--' : `${(Number(value) * 100).toFixed(2)}%`;
  const signed = value => value == null || !Number.isFinite(Number(value)) ? '--' : `${Number(value) >= 0 ? '↑' : '↓'} ${Math.abs(Number(value)).toLocaleString('zh-CN',{maximumFractionDigits:0})}`;
  const periodLabel = (start, end) => `${start} 至 ${end}`;
  const nativeToISOString = Date.prototype.toISOString;
  Date.prototype.toISOString = function(){ const pad=value=>String(value).padStart(2,'0'); return `${this.getFullYear()}-${pad(this.getMonth()+1)}-${pad(this.getDate())}T00:00:00.000Z`; };
  const dateRange = (start, end) => { const result=[]; const cursor=new Date(`${start}T00:00:00`), last=new Date(`${end}T00:00:00`); while(cursor<=last){result.push(cursor.toISOString().slice(0,10));cursor.setDate(cursor.getDate()+1);} return result; };
  async function fetchJson(path) { if(window.__dashboardFetchJson)return window.__dashboardFetchJson(path);const response=await fetch(path);if(!response.ok)throw new Error(`${path} ${response.status}`);return response.json(); }
  async function loadGrowthRange(periodKey) { const [start,end]=periodKey.split('|'),days=Math.round((new Date(`${end}T00:00:00`)-new Date(`${start}T00:00:00`))/86400000)+1,previousEnd=new Date(`${start}T00:00:00`); previousEnd.setDate(previousEnd.getDate()-1); const previousStart=new Date(previousEnd); previousStart.setDate(previousStart.getDate()-days+1); const priorEnd=new Date(previousStart); priorEnd.setDate(priorEnd.getDate()-1); const priorStart=new Date(priorEnd); priorStart.setDate(priorStart.getDate()-days+1); const weekEnd=new Date(`${start}T00:00:00`); weekEnd.setDate(weekEnd.getDate()-7); const weekStart=new Date(weekEnd); weekStart.setDate(weekStart.getDate()-days+1); const dates=[...dateRange(start,end),...dateRange(previousStart.toISOString().slice(0,10),previousEnd.toISOString().slice(0,10)),...dateRange(priorStart.toISOString().slice(0,10),priorEnd.toISOString().slice(0,10)),...dateRange(weekStart.toISOString().slice(0,10),weekEnd.toISOString().slice(0,10))].filter(date=>!growthDailyCache.has(date)); await Promise.all(dates.map(async date=>{const day=await fetchJson(`data/season_play_daily/${date}.json?v=20260902-daily-split`);growthDailyCache.set(date,(day.rows||[]).map(row=>({...row,period_start:date,period_end:date})));})); growthRawData=[...growthDailyCache.values()].flat(); }

  function activatePage(page) {
    if (!data) return;
    document.querySelectorAll('.page').forEach(node => node.classList.toggle('active', node.id === `page-${page}`));
    document.querySelectorAll('.nav-parent').forEach(node => node.classList.toggle('active', node.dataset.page === 'overview'));
    document.querySelectorAll('.nav-subitem').forEach(node => node.classList.toggle('active', node.dataset.page === page));
    if (page === 'bl') renderBL();
    if (page === 'genre-contribution') renderGenre();
    if (page === 'growth') renderGrowth();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function card(label, value, note, tone='blue') { return `<article class="growth-kpi growth-kpi-${tone}"><label>${label}</label><strong>${value}</strong><small>${note}</small></article>`; }
  function toolbar(extra='') { return `<div class="growth-toolbar"><div class="growth-filter"><span>数据日期</span><b>${RANGE_START}</b><i>至</i><b>${RANGE_END}</b></div>${extra}</div>`; }
  function tableHead(cells) { return `<thead><tr>${cells.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>`; }
  function contentCells(row, rank, extra='') { return `<tr><td><span class="rank-badge rank-${rank <= 3 ? rank : 'other'}">${rank}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.play_uv)}</td><td>${esc(displayBLGenre(row))}</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td>${extra}</tr>`; }

  function renderBL() {
    const root = $('#page-bl');
    const summaries = data.summaries.filter(row => row.period_end !== '2026-08-31');
    const current = summaries.at(-1), previous = summaries.at(-2);
    const change = current && previous && previous.bl_play_vv ? (current.bl_play_vv - previous.bl_play_vv) / previous.bl_play_vv : null;
    const key = `${current?.period_start}|${current?.period_end}`;
    const rows = data.bl_top20[key] || [];
    root.innerHTML = `<div class="section-heading growth-heading"><div><span>BL CONTENT CONSUMPTION</span><h2>BL 内容消费</h2><p>BL 定义：题材标签包含精确标签“同性”</p></div><em>${RANGE_START} 至 ${RANGE_END}</em></div>${toolbar(`<label>榜单指标<select id="bl-metric"><option value="play_count">播放VV Top20</option><option value="play_uv">播放UV Top20</option></select></label>`)}<section class="growth-kpi-grid">${card('BL播放VV',fmt(current?.bl_play_vv),'seasonPlayVV.play_count','blue')}${card('BL内容播放UV合计',fmt(current?.bl_content_play_uv),'内容维度求和，不做跨内容去重','green')}${card('BL播放VV占内容播放VV比例',pct(current?.bl_vv_share),'同一 seasonPlayVV 内容口径','amber')}${card('BL人均播放次数',current?.bl_avg_play_count?.toFixed(2) ?? '--','BL VV ÷ BL内容播放UV合计','purple')}${card('BL周环比',pct(change),'完整自然周对比','blue')}${card('BL用户占全站播放用户比例','待接入','缺少全站去重用户UV','slate')}${card('BL播放UV占全站比例','待接入','缺少全站去重用户UV','slate')}</section><section class="panel growth-note-panel"><div class="panel-head"><div><h3>口径说明</h3><span>数据状态：真实数据；部分用户比例不具备可计算条件</span></div></div><p>播放VV和内容级播放UV来自 <code>data_provider/seasonPlayVV</code>。该接口返回内容维度UV，跨内容相加不等于全站去重用户数，因此“BL用户占全站播放用户比例”和“BL播放UV占全站比例”保留为待接入。</p></section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>BL 内容播放榜</h3><span>${periodLabel(current?.period_start || '--', current?.period_end || '--')} · 真实 Top20</span></div><strong id="bl-table-count">${rows.length} 条</strong></div><div class="table-wrap"><table id="bl-table">${tableHead(['排名','内容名称','播放VV','播放UV','剧种','内容类型','题材标签','人均播放次数'])}<tbody></tbody></table></div></section>`;
    $('#bl-metric').value = state.blMetric;
    $('#bl-metric').onchange = event => { state.blMetric = event.target.value; const sorted = [...rows].sort((a,b) => n(b[state.blMetric]) - n(a[state.blMetric])); $('#bl-table tbody').innerHTML = sorted.map((row,index) => contentCells(row,index+1,`<td>${n(row.play_uv) ? (n(row.play_count)/n(row.play_uv)).toFixed(2) : '--'}</td>`)).join(''); };
    $('#bl-metric').onchange({target:{value:state.blMetric}});
  }

  function renderGenre() {
    const root = $('#page-genre-contribution');
    const key = `2026-08-31|2026-09-06|${state.genre}`;
    const [periodStart,periodEnd]=key.split('|');
    const periodViews = Object.entries(data.genre_top30 || {})
      .filter(([periodKey]) => periodKey.startsWith(`${periodStart}|${periodEnd}|`))
      .map(([,value]) => value);
    const view = mappedGenreView(periodViews.length ? periodViews : [data.genre_top30[key] || {}])[state.genre] || {};
    const tab = GENRES.map(([code,name]) => `<button class="growth-tab ${code===state.genre?'active':''}" data-genre="${code}">${name}</button>`).join('');
    const rows = view[state.genreMetric === 'play_uv' ? 'top30_uv' : 'top30_vv'] || [];
    root.innerHTML = `<div class="section-heading growth-heading"><div><span>GENRE CONTENT CONTRIBUTION</span><h2>剧种内容贡献</h2><p>每个剧种独立展示内容播放 Top30，不重复展示剧种整体占比</p></div><em>${RANGE_START} 至 ${RANGE_END}</em></div>${toolbar(`<label>榜单指标<select id="genre-metric"><option value="play_count">播放VV</option><option value="play_uv">播放UV</option></select></label>`)}<div class="growth-tabs">${tab}</div><section class="growth-kpi-grid growth-kpi-grid-five">${card('剧种总播放VV',fmt(view.total_play_vv),'seasonPlayVV.play_count','blue')}${card('剧种总播放UV',fmt(view.total_play_uv),'内容维度UV合计','green')}${card('Top1内容贡献率',pct(view.top1_contribution),'Top1 VV ÷ 剧种总VV','amber')}${card('Top5内容贡献率',pct(view.top5_contribution),'Top5 VV ÷ 剧种总VV','purple')}${card('剧种内容集中度',pct(view.concentration),'定义为Top5内容贡献率','blue')}</section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>${esc(view.genre || '--')} · 内容 Top30</h3><span>${periodLabel(view.period_start || '--',view.period_end || '--')} · 来源：seasonPlayVV</span></div><strong>${rows.length} 条</strong></div><div class="table-wrap"><table>${tableHead(['剧种内排名','内容名称','播放VV','播放UV','剧种内贡献率','全站排名','内容类型','题材标签','产地'])}<tbody>${rows.map((row,index) => `<tr><td><span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.play_uv)}</td><td>${pct(n(row.play_count)/(n(view.total_play_vv)||1))}</td><td>--</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td><td>${esc(row.producer_region)}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">暂无真实数据</td></tr>'}</tbody></table></div></section><p class="growth-data-note">剧种内贡献率 = 单内容播放VV ÷ 该剧种总播放VV；当前周期为 2026-08-24 至 2026-08-30，完整自然周。</p>`;
    $('#genre-metric').value = state.genreMetric;
    $('#genre-metric').onchange = event => { state.genreMetric = event.target.value; renderGenre(); };
    root.querySelectorAll('[data-genre]').forEach(button => button.onclick = () => { state.genre = button.dataset.genre; renderGenre(); });
  }

  function renderGrowth() {
    const genreMap={CHN:'国产',JP:'日剧',KR:'韩剧',TH:'泰剧',UK:'英剧',USK:'美剧',OTHER:'其他'};
    const root = $('#page-growth');
    const periods = Object.keys(data.growth_by_period || {});
    let [selectedStart, selectedEnd] = state.growthPeriod.split('|');
    const buildRangeRows = (start, end) => {
      if (!Array.isArray(growthRawData)) return data.growth_by_period?.[`${start}|${end}`] || [];
      const dailyRows = growthRawData.filter(row => row.period_start === row.period_end && row.period_start >= start && row.period_end <= end);
      if (!dailyRows.length) return data.growth_by_period?.[`${start}|${end}`] || [];
      const map = new Map();
      dailyRows.forEach(row => {
        const id = String(row.season_id); const current = map.get(id) || {...row, play_count:0, play_uv:0};
        current.play_count += n(row.play_count); current.play_uv += n(row.play_uv); map.set(id, current);
      });
      const ranked = [...map.values()].sort((a,b)=>n(b.play_count)-n(a.play_count));
      return ranked.map((row,index)=>({...row, rank:index+1}));
    };
    const currentRangeRows = buildRangeRows(selectedStart, selectedEnd);
    const days = Math.round((new Date(`${selectedEnd}T00:00:00`) - new Date(`${selectedStart}T00:00:00`)) / 86400000) + 1;
    const previousEndForRows = new Date(`${selectedStart}T00:00:00`); previousEndForRows.setDate(previousEndForRows.getDate() - 1);
    const previousStartForRows = new Date(previousEndForRows); previousStartForRows.setDate(previousStartForRows.getDate() - days + 1);
    const previousStartText = previousStartForRows.toISOString().slice(0,10), previousEndText = previousEndForRows.toISOString().slice(0,10);
    const priorEndForRows = new Date(`${previousStartText}T00:00:00`); priorEndForRows.setDate(priorEndForRows.getDate()-1);
    const priorStartForRows = new Date(priorEndForRows); priorStartForRows.setDate(priorStartForRows.getDate()-days+1);
    const previousRangeRows = buildRangeRows(previousStartText, previousEndText), previousMap = new Map(previousRangeRows.map(row=>[String(row.season_id),row]));
    const priorRangeRows = buildRangeRows(priorStartForRows.toISOString().slice(0,10), priorEndForRows.toISOString().slice(0,10)), priorMap = new Map(priorRangeRows.map(row=>[String(row.season_id),row]));
    const hasDailyGrowth = Array.isArray(growthRawData) && growthRawData.some(row => row.period_start === row.period_end);
    const baseRows = hasDailyGrowth ? currentRangeRows.map(row=>{const previous=previousMap.get(String(row.season_id)),prior=priorMap.get(String(row.season_id)),currentVV=n(row.play_count),previousRecord=Boolean(previous),previousVV=previousRecord?n(previous.play_count):0,priorVV=n(prior?.play_count),newTop20=n(row.rank)<=20&&(!previous?.rank||previous.rank>20),continuous=previousVV>0&&priorVV>0&&currentVV>previousVV&&previousVV>priorVV;return {...row,previous_record:previousRecord,previous_play_vv:previousVV,vv_delta:currentVV-previousVV,previous_rank:previous?.rank||null,new_top20:newTop20,continuous_growth:continuous};}).filter(row=>n(row.vv_delta)>0&&(row.new_top20||row.continuous_growth)).sort((a,b)=>n(b.vv_delta)-n(a.vv_delta)).slice(0,20) : (data.growth_by_period?.[state.growthPeriod] || data.growth_top20 || []);
    const classifyGrowth = row => row.previous_play_vv<1000 ? 'start' : row.play_count>row.previous_play_vv && (row.play_count-row.previous_play_vv)/row.previous_play_vv>=1 ? 'burst' : 'stable';
    const rows = baseRows.filter(row => (state.growthStatus==='all'||(state.growthStatus==='new'&&row.new_top20)||(state.growthStatus==='continuous'&&row.continuous_growth)) && (state.growthFeature==='all'||classifyGrowth(row)===state.growthFeature));
    const [currentStart, currentEnd] = state.growthPeriod.split('|');
    const currentDays = Math.round((new Date(`${currentEnd}T00:00:00`) - new Date(`${currentStart}T00:00:00`)) / 86400000) + 1;
    const previousEndDate = new Date(`${currentStart}T00:00:00`); previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate); previousStartDate.setDate(previousStartDate.getDate() - currentDays + 1);
    const previousPeriod = `${previousStartDate.toISOString().slice(0,10)}|${previousEndDate.toISOString().slice(0,10)}`;
    const previousLabel = periodLabel(previousStartDate.toISOString().slice(0,10), previousEndDate.toISOString().slice(0,10));
    const dateControls = `<div class="growth-date-controls"><label>榜单状态<select id="growth-status"><option value="all">全部</option><option value="new">新进Top20</option></select></label><label>增长特征<select id="growth-feature"><option value="all">全部</option><option value="start">起量增长</option><option value="burst">爆发增长</option><option value="stable">稳定增长</option></select></label><label>开始日期<input id="growth-start" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${selectedStart}"></label><span>至</span><label>结束日期<input id="growth-end" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${selectedEnd}"></label></div>`;
    const headers = ['排名','内容名称','当前周期播放VV','上周期播放VV','播放VV增量','播放VV环比','当前周期排名','上周期全站排名','榜单状态','剧种','内容类型','题材标签'];
    const head = `<thead><tr>${headers.filter((_,index)=>index!==5).map((cell,index) => `<th${cell==='播放VV增量'?' data-sort="vv_delta"':''}>${cell}</th>`).join('')}</tr></thead>`;
    state.growthMetric = 'vv_delta';
    const emptyMessage = hasDailyGrowth ? '暂无真实数据' : (data.growth_by_period?.[state.growthPeriod] ? '暂无正向增长内容' : '该日期区间缺少每日内容播放数据，暂无法计算');
    root.innerHTML = `<div class="section-heading growth-heading"><div><span>PLAYBACK GROWTH</span><h2>播放增长榜</h2><p>找出较上一等长周期播放VV实际增长最多的内容</p></div></div><div class="growth-toolbar growth-toolbar-growth">${dateControls}</div><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>较上一等长周期播放上升 Top20</h3><span>当前周期：${periodLabel(currentStart,currentEnd)}　·　上一等长周期：${previousLabel}</span></div><strong>${rows.length} 条</strong></div><div class="table-wrap"><table>${head}<tbody>${[...rows].sort((a,b)=>n(b.vv_delta)-n(a.vv_delta)).map((row,index)=>`<tr data-season-id="${esc(row.season_id)}"><td><span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.previous_play_vv)}</td><td class="${n(row.vv_delta) >= 0 ? 'growth-positive' : 'growth-negative'}">${signed(row.vv_delta)}</td><td class="growth-rank-value ${row.new_top20?'growth-rank-new':''}">${fmt(row.rank)}</td><td class="growth-rank-value ${row.new_top20?'growth-rank-new':''}">${fmt(row.previous_rank)}</td><td>${row.new_top20?'<span class="growth-status growth-status-new">新进Top20</span>':'--'}</td><td>${esc(displayBLGenre(row))}</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td></tr>`).join('') || `<tr><td colspan="11" class="empty">${emptyMessage}</td></tr>`}</tbody></table></div></section><p class="growth-data-note">播放VV增量 = 当前周期播放VV − 上一等长周期播放VV；选择几天就对比前面等长的几天。数据来源：seasonPlayVV。</p>`;
    const syncDateRange = () => { const start=$('#growth-start').value, end=$('#growth-end').value, key=`${start}|${end}`; if (start && end && start<=end) { state.growthPeriod = key; root.querySelector('.growth-date-controls')?.classList.remove('is-invalid'); root.querySelector('.growth-detail-panel tbody').innerHTML='<tr><td colspan="11" class="empty">正在加载数据…</td></tr>'; loadGrowthRange(key).then(() => renderGrowth()).catch(error => { console.error(error); renderGrowth(); }); } else { root.querySelector('.growth-date-controls')?.classList.add('is-invalid'); } };
    $('#growth-status').value=state.growthStatus; $('#growth-feature').value=state.growthFeature;
    $('#growth-status').onchange=event=>{state.growthStatus=event.target.value;renderGrowth();}; $('#growth-feature').onchange=event=>{state.growthFeature=event.target.value;renderGrowth();};
    $('#growth-start').onchange = syncDateRange; $('#growth-end').onchange = syncDateRange;
    root.querySelectorAll('#page-growth th[data-sort]').forEach(th => th.classList.toggle('is-sorted', th.dataset.sort === state.growthMetric));
    root.querySelectorAll('#page-growth th[data-sort]').forEach(th => th.addEventListener('click', () => { state.growthMetric = th.dataset.sort; renderGrowth(); }));
  }

  const renderBLLegacy = renderBL;
  renderBL = function(){
    const root=$('#page-bl');if(!dailyData)return;
    const dayRows=dailyData.days||[],dates=dayRows.map(row=>row.date),weeks=[];for(let i=0;i<dates.length;i+=7)weeks.push(`${dates[i]}|${dates[Math.min(i+6,dates.length-1)]}`);
    const stateBL=renderBL.state||(renderBL.state={granularity:'week',day:'2026-08-31',week:'2026-08-31|2026-09-06',start:'2026-07-01',end:'2026-08-31',tableStart:'2026-08-24',tableEnd:'2026-08-30'});const range=stateBL.granularity==='day'?[stateBL.day,stateBL.day]:stateBL.granularity==='custom'?[stateBL.start,stateBL.end]:stateBL.week.split('|');
    const aggregate=(start,end)=>{const days=dayRows.filter(row=>row.date>=start&&row.date<=end),map=new Map();days.forEach(day=>day.bl_rows.forEach(row=>{const key=String(row.season_id),old=map.get(key)||{...row,play_count:0,play_uv:0};old.play_count+=Number(row.play_count)||0;old.play_uv+=Number(row.play_uv)||0;map.set(key,old)}));return {days,rows:[...map.values()],blVV:days.reduce((sum,row)=>sum+(Number(row.bl_play_vv)||0),0),blUV:days.reduce((sum,row)=>sum+(Number(row.bl_content_play_uv)||0),0),totalVV:days.reduce((sum,row)=>sum+(Number(row.total_play_vv)||0),0)}};
    const agg=aggregate(...range),previousStart=new Date(`${range[0]}T00:00:00`);previousStart.setDate(previousStart.getDate()-(range[0]===range[1]?1:7));const previousEnd=new Date(`${range[0]}T00:00:00`);previousEnd.setDate(previousEnd.getDate()-1);const previous=aggregate(previousStart.toISOString().slice(0,10),previousEnd.toISOString().slice(0,10)),change=previous.blVV?(agg.blVV-previous.blVV)/previous.blVV:null,metric=state.blMetric==='play_uv'?'play_uv':'play_count';
    const shares=[...agg.rows.reduce((map,row)=>{const name=displayBLGenre(row);map.set(name,(map.get(name)||0)+(Number(row.play_count)||0));return map},new Map())].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),weeksHtml=weeks.map(key=>{const [start,end]=key.split('|');return `<option value="${key}" ${stateBL.week===key?'selected':''}>${start} 至 ${end}</option>`}).join('');
    const rows=agg.rows.sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0)).slice(0,20);
    root.innerHTML=`<div class="section-heading growth-heading"><div><span>BL CONTENT CONSUMPTION</span><h2>BL 内容消费</h2><p>BL 定义：题材标签包含精确标签“同性”</p></div><div class="growth-heading-controls"><label>查看粒度<select id="bl-granularity"><option value="day">日</option><option value="week">周</option><option value="custom">自定义区间</option></select></label><label id="bl-day-control">日期<input id="bl-day" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${stateBL.day}"></label><label id="bl-week-control">自然周<select id="bl-week">${weeksHtml}</select></label><label id="bl-custom-control">开始<input id="bl-start" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${stateBL.start}"></label><label id="bl-custom-end-control">结束<input id="bl-end" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${stateBL.end}"></label></div></div><section class="growth-kpi-grid growth-kpi-grid-four">${card('BL播放VV',fmt(agg.blVV),'seasonPlayVV.play_count','blue')}${card('BL播放VV占内容播放VV',pct(agg.totalVV?agg.blVV/agg.totalVV:null),'同一内容播放口径','amber')}${card('BL内容播放UV合计',fmt(agg.blUV),'内容维度求和，不做跨内容去重','green')}${card('BL人均播放次数',agg.blUV?(agg.blVV/agg.blUV).toFixed(2):'--','BL VV ÷ BL内容播放UV合计','purple')}</section><section class="grid two-col bl-visual-grid"><article class="panel"><div class="panel-head"><div><h3>BL 剧种构成</h3><span>${range[0]} 至 ${range[1]} · 按播放VV</span></div></div><div id="bl-genre-chart" class="bl-genre-chart"></div></article><article class="panel"><div class="panel-head"><div><h3>BL 播放趋势</h3><span>日粒度真实快照</span></div><strong>${change==null?'--':pct(change)} <small>较前周期</small></strong></div><div id="bl-trend-chart" class="bl-trend-chart"></div></article></section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>BL 内容播放榜</h3><span>独立自定义日期筛选 · ${stateBL.tableStart} 至 ${stateBL.tableEnd}</span></div><div class="bl-table-controls"><label>开始<input id="bl-table-start" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${stateBL.tableStart}"></label><label>结束<input id="bl-table-end" type="date" min="${RANGE_START}" max="${RANGE_END}" value="${stateBL.tableEnd}"></label><select id="bl-metric"><option value="play_count">播放VV Top20</option><option value="play_uv">播放UV Top20</option></select></div></div><div class="table-wrap"><table id="bl-table">${tableHead(['排名','内容名称','播放VV','播放UV','剧种','内容类型','题材标签','人均播放次数'])}<tbody></tbody></table></div></section><p class="growth-data-note">数据来源：data_provider/seasonPlayVV；BL按题材标签“同性”识别。内容级播放UV不做跨内容用户去重。</p>`;
    $('#bl-granularity').value=stateBL.granularity;['bl-day-control','bl-week-control','bl-custom-control','bl-custom-end-control'].forEach(id=>{const node=$(`#${id}`);if(node)node.style.display=(id==='bl-day-control'&&stateBL.granularity==='day')||(id==='bl-week-control'&&stateBL.granularity==='week')||((id==='bl-custom-control'||id==='bl-custom-end-control')&&stateBL.granularity==='custom')?'flex':'none'});const renderTable=()=>{const table=aggregate(stateBL.tableStart,stateBL.tableEnd).rows.sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0)).slice(0,20);$('#bl-table tbody').innerHTML=table.map((row,index)=>contentCells(row,index+1,`<td>${Number(row.play_uv)?(Number(row.play_count)/Number(row.play_uv)).toFixed(2):'--'}</td>`)).join('')};renderTable();$('#bl-metric').value=state.blMetric;$('#bl-metric').onchange=e=>{state.blMetric=e.target.value;renderBL()};$('#bl-granularity').onchange=e=>{stateBL.granularity=e.target.value;renderBL()};$('#bl-day').onchange=e=>{stateBL.day=e.target.value;renderBL()};$('#bl-week').onchange=e=>{stateBL.week=e.target.value;renderBL()};$('#bl-start').onchange=e=>{stateBL.start=e.target.value;renderBL()};$('#bl-end').onchange=e=>{stateBL.end=e.target.value;renderBL()};$('#bl-table-start').onchange=e=>{stateBL.tableStart=e.target.value;renderBL()};$('#bl-table-end').onchange=e=>{stateBL.tableEnd=e.target.value;renderBL()};if(window.echarts){const pie=echarts.getInstanceByDom($('#bl-genre-chart'))||echarts.init($('#bl-genre-chart'));pie.setOption({tooltip:{trigger:'item',formatter:p=>`${p.name}<br/>播放VV：${fmt(p.value)}<br/>占比：${pct(p.percent/100)}`},legend:{bottom:0,textStyle:{color:'#65758d'}},series:[{type:'pie',radius:['42%','72%'],center:['50%','45%'],label:{formatter:'{b} {d}%'},data:shares}]},true);pie.resize();const trend=echarts.getInstanceByDom($('#bl-trend-chart'))||echarts.init($('#bl-trend-chart'));trend.setOption({tooltip:{trigger:'axis',valueFormatter:v=>fmt(v)},grid:{left:55,right:18,top:18,bottom:30},xAxis:{type:'category',data:agg.days.map(row=>row.date.slice(5)),axisLabel:{color:'#8191a6'}},yAxis:{type:'value',axisLabel:{color:'#8191a6'},splitLine:{lineStyle:{color:'#e7eef6'}}},series:[{name:'BL播放VV',type:'line',smooth:.2,symbol:'circle',symbolSize:4,data:agg.days.map(row=>Number(row.bl_play_vv)||0),lineStyle:{width:3,color:'#2f76e8'},itemStyle:{color:'#2f76e8'},areaStyle:{color:'rgba(47,118,232,.10)'}}]},true);trend.resize()}}
  renderBL = function(){
    const root=$('#page-bl');if(!dailyData)return;const days=dailyData.days||[],latest=days.at(-1)?.date||RANGE_END;const stateBL=renderBL.state||(renderBL.state={start:RANGE_START,end:latest,tableStart:RANGE_START,tableEnd:latest});if(stateBL.end>latest)stateBL.end=latest;if(stateBL.tableEnd>latest)stateBL.tableEnd=latest;
    const aggregate=(start,end)=>{const selected=days.filter(row=>row.date>=start&&row.date<=end),map=new Map();selected.forEach(day=>day.bl_rows.forEach(row=>{const key=String(row.season_id),old=map.get(key)||{...row,play_count:0,play_uv:0};old.play_count+=Number(row.play_count)||0;old.play_uv+=Number(row.play_uv)||0;map.set(key,old)}));return {days:selected,rows:[...map.values()],blVV:selected.reduce((sum,row)=>sum+(Number(row.bl_play_vv)||0),0),blUV:selected.reduce((sum,row)=>sum+(Number(row.bl_content_play_uv)||0),0),totalVV:selected.reduce((sum,row)=>sum+(Number(row.total_play_vv)||0),0)}};
    const agg=aggregate(stateBL.start,stateBL.end),previousDate=new Date(`${stateBL.start}T00:00:00`);previousDate.setDate(previousDate.getDate()-1);const previous=aggregate(previousDate.toISOString().slice(0,10),previousDate.toISOString().slice(0,10)),change=previous.blVV?(agg.blVV-previous.blVV)/previous.blVV:null,metric=state.blMetric==='play_uv'?'play_uv':'play_count',rows=agg.rows.sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0)).slice(0,20),shares=[...agg.rows.reduce((map,row)=>{const name=displayBLGenre(row);map.set(name,(map.get(name)||0)+(Number(row.play_count)||0));return map},new Map())].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    root.innerHTML=`<div class="section-heading growth-heading"><div><span>BL CONTENT CONSUMPTION</span><h2>BL 内容消费</h2><p>BL 定义：题材标签包含精确标签“同性”</p></div><div class="growth-heading-controls"><label>开始日期<input id="bl-start" type="date" min="${RANGE_START}" max="${latest}" value="${stateBL.start}"></label><label>结束日期<input id="bl-end" type="date" min="${RANGE_START}" max="${latest}" value="${stateBL.end}"></label></div></div><section class="growth-kpi-grid growth-kpi-grid-four">${card('BL播放VV',fmt(agg.blVV),'seasonPlayVV.play_count','blue')}${card('BL播放VV占内容播放VV',pct(agg.totalVV?agg.blVV/agg.totalVV:null),'同一内容播放口径','amber')}${card('BL内容播放UV合计',fmt(agg.blUV),'内容维度求和，不做跨内容去重','green')}${card('BL人均播放次数',agg.blUV?(agg.blVV/agg.blUV).toFixed(2):'--','BL VV ÷ BL内容播放UV合计','purple')}</section><section class="grid two-col bl-visual-grid"><article class="panel"><div class="panel-head"><div><h3>BL 剧种构成</h3><span>${stateBL.start} 至 ${stateBL.end} · 按播放VV</span></div></div><div id="bl-genre-chart" class="bl-genre-chart"></div></article><article class="panel"><div class="panel-head"><div><h3>BL 播放趋势</h3><span>日粒度真实快照</span></div><strong>${change==null?'--':pct(change)} <small>较前一日</small></strong></div><div id="bl-trend-chart" class="bl-trend-chart"></div></article></section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>BL 内容播放榜</h3><span>独立自定义日期筛选 · ${stateBL.tableStart} 至 ${stateBL.tableEnd}</span></div><div class="bl-table-controls"><label>开始<input id="bl-table-start" type="date" min="${RANGE_START}" max="${latest}" value="${stateBL.tableStart}"></label><label>结束<input id="bl-table-end" type="date" min="${RANGE_START}" max="${latest}" value="${stateBL.tableEnd}"></label><select id="bl-metric"><option value="play_count">播放VV Top20</option><option value="play_uv">播放UV Top20</option></select></div></div><div class="table-wrap"><table id="bl-table">${tableHead(['排名','内容名称','播放VV','播放UV','剧种','内容类型','题材标签','人均播放次数'])}<tbody></tbody></table></div></section><p class="growth-data-note">数据来源：data_provider/seasonPlayVV；BL按题材标签“同性”识别。内容级播放UV不做跨内容用户去重。</p>`;
    const tableAgg=aggregate(stateBL.tableStart,stateBL.tableEnd),tableRows=tableAgg.rows.sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0)).slice(0,20);$('#bl-table tbody').innerHTML=tableRows.map((row,index)=>contentCells(row,index+1,`<td>${Number(row.play_uv)?(Number(row.play_count)/Number(row.play_uv)).toFixed(2):'--'}</td>`)).join('');$('#bl-start').onchange=e=>{stateBL.start=e.target.value;renderBL()};$('#bl-end').onchange=e=>{stateBL.end=e.target.value;renderBL()};$('#bl-table-start').onchange=e=>{stateBL.tableStart=e.target.value;renderBL()};$('#bl-table-end').onchange=e=>{stateBL.tableEnd=e.target.value;renderBL()};$('#bl-metric').value=state.blMetric;$('#bl-metric').onchange=e=>{state.blMetric=e.target.value;renderBL()};
    if(window.echarts){const pie=echarts.getInstanceByDom($('#bl-genre-chart'))||echarts.init($('#bl-genre-chart'));pie.setOption({tooltip:{trigger:'item',formatter:p=>`${p.name}<br/>播放VV：${fmt(p.value)}<br/>占比：${pct(p.percent/100)}`},legend:{bottom:0,textStyle:{color:'#65758d'}},series:[{type:'pie',radius:['42%','72%'],center:['50%','45%'],label:{formatter:'{b} {d}%'},data:shares}]},true);pie.resize();const trend=echarts.getInstanceByDom($('#bl-trend-chart'))||echarts.init($('#bl-trend-chart'));trend.setOption({tooltip:{trigger:'axis',valueFormatter:v=>fmt(v)},grid:{left:70,right:18,top:18,bottom:30},xAxis:{type:'category',data:agg.days.map(row=>row.date.slice(5)),axisLabel:{color:'#8191a6'}},yAxis:{type:'value',axisLabel:{color:'#8191a6'},splitLine:{lineStyle:{color:'#e7eef6'}}},series:[{name:'BL播放VV',type:'line',smooth:.2,symbol:'circle',symbolSize:4,data:agg.days.map(row=>Number(row.bl_play_vv)||0),lineStyle:{width:3,color:'#2f76e8'},itemStyle:{color:'#2f76e8'},areaStyle:{color:'rgba(47,118,232,.10)'}}]},true);trend.resize()}
  };
  const renderBLWithAllSiteLabel = renderBL;
  renderBL = () => { renderBLWithAllSiteLabel(); const labels=[...document.querySelectorAll('#page-bl .growth-kpi label')]; const shareLabel=labels.find(node=>node.textContent.includes('BL播放VV占内容播放VV')); if(shareLabel)shareLabel.textContent='BL播放VV占全站播放VV'; const cards=[...document.querySelectorAll('#page-bl .growth-kpi')]; cards.forEach(card=>card.classList.remove('growth-kpi-green-filled')); if(cards[1])cards[1].classList.add('growth-kpi-green-filled'); const latest=renderBL.state?.end||RANGE_END,start=renderBL.state?.start||RANGE_START,days=dailyData?.days||[],selected=days.filter(row=>row.date>=start&&row.date<=latest),vv=selected.reduce((sum,row)=>sum+(Number(row.bl_play_vv)||0),0),total=selected.reduce((sum,row)=>sum+(Number(row.total_play_vv)||0),0),map=new Map();selected.forEach(day=>day.bl_rows.forEach(row=>{const key=String(row.season_id),old=map.get(key)||{play_count:0};old.play_count+=Number(row.play_count)||0;map.set(key,old)}));const top5=[...map.values()].sort((a,b)=>b.play_count-a.play_count).slice(0,5).reduce((sum,row)=>sum+row.play_count,0),length=selected.length||1,previousEnd=new Date(`${start}T00:00:00`);previousEnd.setDate(previousEnd.getDate()-1);const previousStart=new Date(previousEnd);previousStart.setDate(previousStart.getDate()-(length-1));const prevVV=days.filter(row=>row.date>=previousStart.toISOString().slice(0,10)&&row.date<=previousEnd.toISOString().slice(0,10)).reduce((sum,row)=>sum+(Number(row.bl_play_vv)||0),0),change=prevVV?(vv-prevVV)/prevVV:null;if(cards[2])cards[2].innerHTML=`<label>BL播放VV较上周期变化</label><strong>${pct(change)}</strong><small>按相同天数周期比较</small>`;if(cards[3])cards[3].innerHTML=`<label>BL Top5内容集中度</label><strong>${pct(vv?top5/vv:null)}</strong><small>Top5播放VV ÷ BL全部播放VV</small>`; };
  const renderBLWithPlainPeriod = renderBL;
  renderBL = () => { renderBLWithPlainPeriod(); const labels=[...document.querySelectorAll('#page-bl .growth-kpi label')]; const periodLabel=labels.find(node=>node.textContent.includes('BL播放VV较上周期变化')); if(periodLabel)periodLabel.textContent='BL播放VV较前一周期变化'; const cards=[...document.querySelectorAll('#page-bl .growth-kpi')]; if(cards[2]){const note=cards[2].querySelector('small'); if(note)note.textContent='对比前一相同天数（7天=周环比）';} };
  const renderBLWithScopedTop5 = renderBL;
  renderBL = () => { renderBLWithScopedTop5(); const cards=[...document.querySelectorAll('#page-bl .growth-kpi')]; if(cards[3]){const label=cards[3].querySelector('label'); const note=cards[3].querySelector('small'); if(label)label.textContent='所选周期Top5内容集中度'; if(note)note.textContent='所选日期内Top5内容播放VV ÷ BL总播放VV';} };
  const renderBLWithSortableTable = renderBL;
  renderBL = () => { renderBLWithSortableTable(); const metricSelect=$('#bl-metric'); if(metricSelect?.parentElement)metricSelect.parentElement.remove(); const table=$('#bl-table'); if(!table)return; const headers=[...table.querySelectorAll('thead th')],body=table.querySelector('tbody'); const sortBy=index=>{const rows=[...body.querySelectorAll('tr')].sort((a,b)=>Number((b.children[index]?.textContent||'0').replace(/,/g,''))-Number((a.children[index]?.textContent||'0').replace(/,/g,'')));body.replaceChildren(...rows);headers.forEach(header=>header.classList.remove('is-sorted'));headers[index].classList.add('is-sorted');headers.forEach((header,i)=>header.setAttribute('aria-sort',i===index?'descending':'none'));};[2,3].forEach(index=>{headers[index].classList.add('growth-sortable-th');headers[index].title=`点击按${headers[index].textContent}降序`;headers[index].addEventListener('click',()=>sortBy(index));});sortBy(2); };
  const renderGenreContribution = renderGenre;
  renderGenre = () => { const root=$('#page-genre-contribution'); if(!data)return; const period='2026-08-31|2026-09-06',genreViews=GENRES.map(([code,name])=>({code,name,view:data.genre_top30?.[`${period}|${code}`]||{genre:name,total_play_vv:0,total_play_uv:0,top1_contribution:null,top5_contribution:null,concentration:null,top30_vv:[],top30_uv:[]}})),selected=state.genre||'TH',view=genreViews.find(item=>item.code===selected)||genreViews[0],metric=state.genreMetric==='play_uv'?'play_uv':'play_count',rows=metric==='play_uv'?view.view.top30_uv:view.view.top30_vv,totalVV=genreViews.reduce((sum,item)=>sum+n(item.view.total_play_vv),0),shareRows=genreViews.map(item=>({name:item.name,value:n(item.view.total_play_vv)})).filter(item=>item.value>0).sort((a,b)=>b.value-a.value),genreOptions=GENRES.map(([code,name])=>`<option value="${code}" ${code===selected?'selected':''}>${name}</option>`).join(''); root.innerHTML=`<div class="section-heading growth-heading"><div><span>GENRE CONTENT CONTRIBUTION</span><h2>剧种内容贡献</h2><p>先看剧种播放结构，再查看单个剧种内部的内容贡献</p></div><em>${period.replace('|',' 至 ')}</em></div>${toolbar(`<label>剧种<select id="genre-select">${genreOptions}</select></label><label>榜单指标<select id="genre-metric"><option value="play_count">播放VV</option><option value="play_uv">播放UV</option></select></label>`)}<section class="grid two-col genre-contribution-overview"><article class="panel"><div class="panel-head"><div><h3>剧种播放占比</h3><span>全部剧种 · 按播放VV</span></div></div><div id="genre-contribution-chart" class="genre-contribution-chart"></div></article><article class="panel"><div class="panel-head"><div><h3>剧种明细</h3><span>按播放VV排序</span></div></div><div class="genre-contribution-list"><div class="genre-contribution-list-head"><span>剧种</span><b>播放VV占比</b><b>播放VV</b></div>${shareRows.map((item,index)=>`<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(item.name)}</span><b>${pct(totalVV?item.value/totalVV:null)}</b><b>${fmt(item.value)}</b></div>`).join('')}</div></article></section><section class="growth-kpi-grid growth-kpi-grid-five">${card('剧种总播放VV',fmt(view.view.total_play_vv),'seasonPlayVV.play_count','blue')}${card('剧种总播放UV',fmt(view.view.total_play_uv),'内容维度UV合计','green')}${card('Top1内容贡献率',pct(view.view.top1_contribution),'Top1 VV ÷ 剧种总VV','amber')}${card('Top5内容贡献率',pct(view.view.top5_contribution),'Top5 VV ÷ 剧种总VV','purple')}${card('剧种内容集中度',pct(view.view.concentration),'定义为Top5内容贡献率','blue')}</section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>${esc(view.name)} · 内容 Top30</h3><span>选择剧种后查看该剧种内部内容贡献</span></div><strong>${rows.length} 条</strong></div><div class="table-wrap"><table id="genre-contribution-table">${tableHead(['剧种内排名','内容名称','播放VV','播放UV','剧种内贡献率','全站排名','内容类型','题材标签','产地'])}<tbody>${rows.map((row,index)=>`<tr><td><span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.play_uv)}</td><td>${pct(n(view.view.total_play_vv)?n(row.play_count)/n(view.view.total_play_vv):null)}</td><td>--</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td><td>${esc(row.producer_region)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">暂无真实数据</td></tr>'}</tbody></table></div></section><p class="growth-data-note">数据来源：data_provider/seasonPlayVV；当前完整周期为 2026-08-24 至 2026-08-30。</p>`; $('#genre-select').value=selected; $('#genre-select').onchange=e=>{state.genre=e.target.value;renderGenre()}; $('#genre-metric').value=state.genreMetric; $('#genre-metric').onchange=e=>{state.genreMetric=e.target.value;renderGenre()}; if(window.echarts){const chart=echarts.getInstanceByDom($('#genre-contribution-chart'))||echarts.init($('#genre-contribution-chart'));chart.setOption({tooltip:{trigger:'item',formatter:p=>`${esc(p.name)}<br/>播放VV：${fmt(p.value)}<br/>占比：${pct(totalVV?p.value/totalVV:null)}`},legend:{bottom:0,textStyle:{color:'#65758d'}},series:[{type:'pie',radius:['42%','72%'],center:['50%','45%'],label:{formatter:'{b} {d}%'},data:shareRows}]},true);chart.resize();} };
  const renderGenreWithPeriodLabel = renderGenre;
  renderGenre = () => { renderGenreWithPeriodLabel(); const filter=document.querySelector('#page-genre-contribution .growth-filter'); if(filter){const dates=filter.querySelectorAll('b'); if(dates[0])dates[0].textContent='2026-08-31'; if(dates[1])dates[1].textContent='2026-09-06';} };
  const renderGenreFinal = renderGenre;
  renderGenre = () => { const root=$('#page-genre-contribution'); if(!data)return; const currentPeriod='2026-08-31|2026-09-06',previousPeriod='2026-08-17|2026-08-23',selected=state.genre||'TH',metric=state.genreMetric==='play_uv'?'play_uv':'play_count',genreViews=GENRES.map(([code,name])=>({code,name,current:data.genre_top30?.[`${currentPeriod}|${code}`]||{},previous:data.genre_top30?.[`${previousPeriod}|${code}`]||{}})),view=genreViews.find(item=>item.code===selected)||genreViews[0],currentTotal=genreViews.reduce((sum,item)=>sum+n(item.current.total_play_vv),0),shareRows=genreViews.map(item=>({name:item.name,value:n(item.current.total_play_vv),previous:n(item.previous.total_play_vv)})).filter(item=>item.value>0).sort((a,b)=>b.value-a.value),options=GENRES.map(([code,name])=>`<option value="${code}" ${code===selected?'selected':''}>${name}</option>`).join(''),rows=metric==='play_uv'?(view.current.top30_uv||[]):(view.current.top30_vv||[]); const renderRows=sortKey=>{const sorted=[...rows].sort((a,b)=>n(b[sortKey])-n(a[sortKey]));const body=$('#genre-contribution-table tbody');if(!body)return;body.innerHTML=sorted.map((row,index)=>`<tr><td><span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.play_uv)}</td><td>${pct(n(view.current.total_play_vv)?n(row.play_count)/n(view.current.total_play_vv):null)}</td><td>--</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td><td>${esc(row.producer_region)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">暂无真实数据</td></tr>';root.querySelectorAll('#genre-contribution-table th[data-sort]').forEach(th=>th.classList.toggle('is-sorted',th.dataset.sort===sortKey));}; root.innerHTML=`<div class="section-heading growth-heading"><div><span>GENRE CONTENT CONTRIBUTION</span><h2>剧种内容贡献</h2><p>先看剧种播放结构，再查看单个剧种内部的内容贡献</p></div><div class="genre-heading-controls"><label>剧种<select id="genre-select">${options}</select></label><em>${currentPeriod.replace('|',' 至 ')}</em></div></div><section class="growth-kpi-grid growth-kpi-grid-four">${card('剧种播放VV',fmt(view.current.total_play_vv),'seasonPlayVV.play_count','blue')}${card('剧种播放VV占全站播放VV',pct(currentTotal?view.current.total_play_vv/currentTotal:null),'当前完整周期剧种占比','green')}${card('Top1内容贡献率',pct(view.current.top1_contribution),'Top1 VV ÷ 剧种总VV','amber')}${card('Top5内容贡献率',pct(view.current.top5_contribution),'Top5 VV ÷ 剧种总VV','purple')}</section><section class="grid two-col genre-contribution-overview"><article class="panel"><div class="panel-head"><div><h3>剧种播放占比</h3><span>全部剧种 · 按播放VV</span></div></div><div id="genre-contribution-chart" class="genre-contribution-chart"></div></article><article class="panel"><div class="panel-head"><div><h3>剧种播放结构变化</h3><span>${currentPeriod.replace('|',' 至 ')} 对比 ${previousPeriod.replace('|',' 至 ')}</span></div></div><div class="genre-contribution-list"><div class="genre-contribution-list-head"><span>剧种</span><b>当前占比</b><b>占比变化</b></div>${shareRows.map((item,index)=>{const share=currentTotal?item.value/currentTotal:0,previousTotal=genreViews.reduce((sum,genre)=>sum+n(genre.previous.total_play_vv),0),previousShare=previousTotal?item.previous/previousTotal:0,delta=(share-previousShare)*100;return `<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(item.name)}</span><b>${pct(share)}</b><b class="${delta>0?'is-up':delta<0?'is-down':'is-flat'}">${delta>0?'↑ ':delta<0?'↓ ':''}${Math.abs(delta).toFixed(2)}个百分点</b></div>`}).join('')}</div></article></section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>${esc(view.name)} · 内容 Top30</h3><span>点击播放VV或播放UV表头，可按对应指标降序</span></div><div class="genre-metric-control"><label>榜单指标<select id="genre-metric"><option value="play_count">播放VV</option><option value="play_uv">播放UV</option></select></label></div></div><div class="table-wrap"><table id="genre-contribution-table"><thead><tr><th>剧种内排名</th><th>内容名称</th><th data-sort="play_count">播放VV</th><th data-sort="play_uv">播放UV</th><th>剧种内贡献率</th><th>全站排名</th><th>内容类型</th><th>题材标签</th><th>产地</th></tr></thead><tbody></tbody></table></div></section><p class="growth-data-note">数据来源：data_provider/seasonPlayVV；当前与上一完整周期均为周快照，剧种播放结构变化按播放VV占比的百分点变化计算。</p>`; $('#genre-select').value=selected;$('#genre-select').onchange=e=>{state.genre=e.target.value;renderGenre()};$('#genre-metric').value=state.genreMetric;$('#genre-metric').onchange=e=>{state.genreMetric=e.target.value;renderGenre()};root.querySelectorAll('#genre-contribution-table th[data-sort]').forEach(th=>th.addEventListener('click',()=>renderRows(th.dataset.sort)));renderRows(metric);if(window.echarts){const chart=echarts.getInstanceByDom($('#genre-contribution-chart'))||echarts.init($('#genre-contribution-chart'));const colors=['#2f7d4a','#2f6397','#d7a12b','#82a58b','#6685a6','#b97818','#4a8b5e'];chart.setOption({tooltip:{trigger:'item',formatter:p=>`${esc(p.name)}<br/>播放VV：${fmt(p.value)}<br/>占比：${pct(currentTotal?p.value/currentTotal:null)}`},legend:{bottom:0,textStyle:{color:'#65758d'}},series:[{type:'pie',radius:['42%','72%'],center:['50%','45%'],label:{formatter:'{b} {d}%'},data:shareRows.map((item,index)=>({...item,itemStyle:{color:colors[index%colors.length]}}))}]},true);chart.resize();}};
  const renderGenreWithKpiStyle = renderGenre;
  renderGenre = () => { renderGenreWithKpiStyle(); const cards=[...document.querySelectorAll('#page-genre-contribution .growth-kpi')]; cards.forEach(card=>card.classList.remove('growth-kpi-green-filled')); if(cards[1])cards[1].classList.add('growth-kpi-green-filled'); };
  const renderGenreLatestLayout = renderGenre;
  renderGenre = () => { const root=$('#page-genre-contribution'); if(!data)return; const periodKeys=[...new Set(Object.keys(data.genre_top30||{}).map(key=>key.split('|').slice(0,2).join('|')))].sort(),fallback='2026-08-31|2026-09-06'; renderGenre.period=periodKeys.includes(renderGenre.period)?renderGenre.period:(periodKeys.includes(fallback)?fallback:periodKeys.at(-1)||fallback); const currentPeriod=renderGenre.period,periodIndex=periodKeys.indexOf(currentPeriod),previousPeriod=periodKeys[periodIndex-1]||'',selected=state.genre||'TH',metric=state.genreMetric==='play_uv'?'play_uv':'play_count',genreViews=GENRES.map(([code,name])=>({code,name,current:data.genre_top30?.[`${currentPeriod}|${code}`]||{},previous:data.genre_top30?.[`${previousPeriod}|${code}`]||{}})),view=genreViews.find(item=>item.code===selected)||genreViews[0],currentTotal=genreViews.reduce((sum,item)=>sum+n(item.current.total_play_vv),0),previousTotal=genreViews.reduce((sum,item)=>sum+n(item.previous.total_play_vv),0),shareRows=genreViews.map(item=>({name:item.name,value:n(item.current.total_play_vv),previous:n(item.previous.total_play_vv)})).filter(item=>item.value>0).sort((a,b)=>b.value-a.value),options=GENRES.map(([code,name])=>`<option value="${code}" ${code===selected?'selected':''}>${name}</option>`).join(''),[startDate,endDate]=currentPeriod.split('|'),renderRows=sortKey=>{const rows=metric==='play_uv'?(view.current.top30_uv||[]):(view.current.top30_vv||[]),body=$('#genre-contribution-table tbody');if(!body)return;body.innerHTML=[...rows].sort((a,b)=>n(b[sortKey])-n(a[sortKey])).map((row,index)=>`<tr><td><span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.play_uv)}</td><td>${pct(n(view.current.total_play_vv)?n(row.play_count)/n(view.current.total_play_vv):null)}</td><td>--</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td><td>${esc(row.producer_region)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">暂无真实数据</td></tr>';root.querySelectorAll('#genre-contribution-table th[data-sort]').forEach(th=>th.classList.toggle('is-sorted',th.dataset.sort===sortKey));}; root.innerHTML=`<div class="section-heading growth-heading"><div><span>GENRE CONTENT CONTRIBUTION</span><h2>剧种内容贡献</h2><p>先看剧种播放结构，再查看单个剧种内部的内容贡献</p></div><div class="genre-heading-controls"><label>开始日期<input id="genre-start" type="date" value="${startDate}" min="${periodKeys[0]?.split('|')[0]||startDate}" max="${periodKeys.at(-1)?.split('|')[1]||endDate}"></label><label>结束日期<input id="genre-end" type="date" value="${endDate}" min="${periodKeys[0]?.split('|')[0]||startDate}" max="${periodKeys.at(-1)?.split('|')[1]||endDate}"></label></div></div><section class="growth-grid-four genre-kpi-placeholder" hidden></section><section class="grid two-col genre-contribution-overview"><article class="panel"><div class="panel-head"><div><h3>剧种播放占比</h3><span>${currentPeriod.replace('|',' 至 ')} · 按播放VV</span></div></div><div id="genre-contribution-chart" class="genre-contribution-chart"></div></article><article class="panel"><div class="panel-head"><div><h3>剧种播放变化</h3><span>按剧种播放VV占比观察</span></div></div><div class="genre-contribution-list"><div class="genre-contribution-list-head"><span>剧种</span><b>昨日环比</b><b>周环比</b></div>${shareRows.map((item,index)=>{const share=currentTotal?item.value/currentTotal:0,previousShare=previousTotal?item.previous/previousTotal:0,delta=(share-previousShare)*100;return `<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(item.name)}</span><b class="is-flat">日数据待接入</b><b class="${delta>0?'is-up':delta<0?'is-down':'is-flat'}">${delta>0?'↑ ':delta<0?'↓ ':''}${Math.abs(delta).toFixed(2)}个百分点</b></div>`}).join('')}</div></article></section><section class="panel growth-detail-panel"><div class="panel-head"><div><h3>${esc(view.name)} · 内容 Top30</h3><span>点击播放VV或播放UV表头，可按对应指标降序</span></div><div class="genre-metric-control"><label>剧种<select id="genre-select">${options}</select></label><label>榜单指标<select id="genre-metric"><option value="play_count">播放VV</option><option value="play_uv">播放UV</option></select></label></div></div><div class="table-wrap"><table id="genre-contribution-table"><thead><tr><th>剧种内排名</th><th>内容名称</th><th data-sort="play_count">播放VV</th><th data-sort="play_uv">播放UV</th><th>剧种内贡献率</th><th>全站排名</th><th>内容类型</th><th>题材标签</th><th>产地</th></tr></thead><tbody></tbody></table></div></section><p class="growth-data-note">数据来源：data_provider/seasonPlayVV；当前与上一完整周期为周快照。昨日环比需补充日粒度剧种数据。</p>`; const syncPeriod=()=>{const key=`${$('#genre-start').value}|${$('#genre-end').value}`;if(periodKeys.includes(key)){renderGenre.period=key;renderGenre();}else{ $('#genre-start').value=startDate;$('#genre-end').value=endDate; }};$('#genre-start').onchange=syncPeriod;$('#genre-end').onchange=syncPeriod;$('#genre-select').onchange=e=>{state.genre=e.target.value;renderGenre()};$('#genre-metric').value=state.genreMetric;$('#genre-metric').onchange=e=>{state.genreMetric=e.target.value;renderGenre()};root.querySelectorAll('#genre-contribution-table th[data-sort]').forEach(th=>th.addEventListener('click',()=>renderRows(th.dataset.sort)));renderRows(metric);if(window.echarts){const chart=echarts.getInstanceByDom($('#genre-contribution-chart'))||echarts.init($('#genre-contribution-chart'));const colors=['#2f7d4a','#2f6397','#d7a12b','#82a58b','#6685a6','#b97818','#4a8b5e'];chart.setOption({tooltip:{trigger:'item',formatter:p=>`${esc(p.name)}<br/>播放VV：${fmt(p.value)}<br/>占比：${pct(currentTotal?p.value/currentTotal:null)}`},legend:{bottom:0,textStyle:{color:'#65758d'}},series:[{type:'pie',radius:['42%','72%'],center:['50%','45%'],label:{formatter:'{b} {d}%'},data:shareRows.map((item,index)=>({...item,itemStyle:{color:colors[index%colors.length]}}))}]},true);chart.resize();}};
  const renderGenreWithDailyChange = renderGenre;
  renderGenre = () => { renderGenreWithDailyChange(); const metricSelect=$('#page-genre-contribution #genre-metric'); if(metricSelect?.parentElement)metricSelect.parentElement.remove(); const rows=genreDailyData?.rows||[],dates=[...new Set(rows.map(row=>String(row['日期']||row.date||'')).filter(Boolean))].sort(),latest=dates.at(-1),previous=dates.at(-2),currentMap=new Map(rows.filter(row=>String(row['日期']||row.date||'')===latest).map(row=>[String(row['剧种']||row.genre||''),Number(row['播放VV占比(%)']??row['播放VV占比']??row.play_share)||0])),previousMap=new Map(rows.filter(row=>String(row['日期']||row.date||'')===previous).map(row=>[String(row['剧种']||row.genre||''),Number(row['播放VV占比(%)']??row['播放VV占比']??row.play_share)||0])); const panel=document.querySelector('#page-genre-contribution .genre-contribution-overview article:nth-child(2)'); if(panel){const subtitle=panel.querySelector('.panel-head span');if(subtitle)subtitle.textContent=latest&&previous?`昨日环比 · ${latest} 对比 ${previous}`:'昨日环比 · 日数据缺失';panel.querySelectorAll('.genre-contribution-list-row').forEach(row=>{const name=(row.querySelector('span')?.textContent||'').replace(/^\d+/,'').trim(),current=currentMap.get(name),old=previousMap.get(name),change=Number.isFinite(current)&&old?((current-old)/old*100):null;const cell=row.querySelectorAll('b')[0];if(cell)cell.textContent=change==null?'--':`${change>0?'↑ ':change<0?'↓ ':''}${Math.abs(change).toFixed(2)}%`;});} };
  const renderGenreWithCustomRange = renderGenre;
  renderGenre = () => { renderGenreWithCustomRange(); const root=$('#page-genre-contribution'),startInput=$('#genre-start'),endInput=$('#genre-end'),start=startInput?.value,end=endInput?.value,dailyRows=genreDailyData?.rows||[],dateValue=row=>String(row['日期']||row.date||''),genreValue=row=>String(row['剧种']||row.genre||''),vvValue=row=>Number(row['播放VV']||row.play_count)||0,shareValue=row=>Number(row['播放VV占比(%)']??row['播放VV占比']??row.play_share)||0,dates=[...new Set(dailyRows.map(dateValue).filter(Boolean))].sort(),inRange=row=>dateValue(row)>=start&&dateValue(row)<=end,rangeRows=dailyRows.filter(inRange),rangeMap=new Map();rangeRows.forEach(row=>rangeMap.set(genreValue(row),(rangeMap.get(genreValue(row))||0)+vvValue(row)));const rangeTotal=[...rangeMap.values()].reduce((sum,value)=>sum+value,0),rangePeriod=`${start}|${end}`,availablePeriod=Object.keys(data.genre_top30||{}).some(key=>key.startsWith(`${rangePeriod}|`)); const updateDailyView=()=>{if(!rangeRows.length)return;const shareRows=[...rangeMap.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),overview=root.querySelector('.genre-contribution-overview'),list=overview?.querySelector('.genre-contribution-list');if(list){const previousEnd=new Date(`${start}T00:00:00`);previousEnd.setDate(previousEnd.getDate()-1);const previousStart=new Date(previousEnd);previousStart.setDate(previousStart.getDate()-(Math.max(1,rangeRows.length?new Set(rangeRows.map(dateValue)).size:1)-1));const prevRows=dailyRows.filter(row=>dateValue(row)>=previousStart.toISOString().slice(0,10)&&dateValue(row)<=previousEnd.toISOString().slice(0,10)),prevMap=new Map();prevRows.forEach(row=>prevMap.set(genreValue(row),(prevMap.get(genreValue(row))||0)+vvValue(row)));list.innerHTML=`<div class="genre-contribution-list-head"><span>剧种</span><b>昨日环比</b><b>周环比</b></div>${shareRows.map((item,index)=>{const latestRows=dailyRows.filter(row=>dateValue(row)===end&&genreValue(row)===item.name),yesterdayRows=dailyRows.filter(row=>dateValue(row)===new Date(new Date(`${end}T00:00:00`).setDate(new Date(`${end}T00:00:00`).getDate()-1)).toISOString().slice(0,10)&&genreValue(row)===item.name),latestShare=latestRows[0]?shareValue(latestRows[0]):null,yesterdayShare=yesterdayRows[0]?shareValue(yesterdayRows[0]):null,dayChange=latestShare!=null&&yesterdayShare?((latestShare-yesterdayShare)/yesterdayShare*100):null,prevTotal=[...prevMap.values()].reduce((sum,value)=>sum+value,0),weekChange=prevTotal&&prevMap.get(item.name)!=null?((item.value/rangeTotal)-(prevMap.get(item.name)/prevTotal))*100:null;return `<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(item.name)}</span><b class="${dayChange>0?'is-up':dayChange<0?'is-down':'is-flat'}">${dayChange==null?'--':`${dayChange>0?'↑ ':dayChange<0?'↓ ':''}${Math.abs(dayChange).toFixed(2)}%`}</b><b class="${weekChange>0?'is-up':weekChange<0?'is-down':'is-flat'}">${weekChange==null?'--':`${weekChange>0?'↑ ':weekChange<0?'↓ ':''}${Math.abs(weekChange).toFixed(2)}个百分点`}</b></div>`}).join('')}`;const subtitle=overview.querySelector('.genre-contribution-overview article:nth-child(2) .panel-head span');if(subtitle)subtitle.textContent=`昨日：${end} 对比前一日；周环比：所选区间对比前一等长区间`;}if(window.echarts){const chart=echarts.getInstanceByDom($('#genre-contribution-chart'));if(chart){const colors=['#2f7d4a','#2f6397','#d7a12b','#82a58b','#6685a6','#b97818','#4a8b5e'];chart.setOption({series:[{data:shareRows.map((item,index)=>({...item,itemStyle:{color:colors[index%colors.length]}}))}]},false);chart.resize();}}if(!availablePeriod){const body=root.querySelector('#genre-contribution-table tbody');if(body)body.innerHTML='<tr><td colspan="9" class="empty">该自定义区间暂无内容级日快照</td></tr>';const detail=root.querySelector('.growth-detail-panel .panel-head span');if(detail)detail.textContent='当前数据层仅提供完整周内容快照，剧种占比与环比已按自定义日期更新';}};if(startInput&&endInput){startInput.style.borderRadius='999px';endInput.style.borderRadius='999px';const sync=()=>{const nextStart=startInput.value,nextEnd=endInput.value;if(nextStart&&nextEnd&&nextStart<=nextEnd){renderGenre.rangeStart=nextStart;renderGenre.rangeEnd=nextEnd;renderGenre();}};startInput.onchange=sync;endInput.onchange=sync;}if(start&&end&&dates.length&&!(start==='2026-08-24'&&end==='2026-08-30'))updateDailyView(); };
  const renderGenreCustomDateRuntime = renderGenre;
  renderGenre = () => { renderGenreCustomDateRuntime(); const root=$('#page-genre-contribution'),startInput=$('#genre-start'),endInput=$('#genre-end'),dailyRows=genreDailyData?.rows||[],dateOf=row=>String(row['日期']||row.date||''),genreOf=row=>String(row['剧种']||row.genre||''),vvOf=row=>Number(row['播放VV']||row.play_count)||0,shareOf=row=>Number(row['播放VV占比(%)']??row['播放VV占比']??row.play_share)||0,update=()=>{const start=startInput?.value,end=endInput?.value,range=dailyRows.filter(row=>dateOf(row)>=start&&dateOf(row)<=end),map=new Map();range.forEach(row=>map.set(genreOf(row),(map.get(genreOf(row))||0)+vvOf(row)));const total=[...map.values()].reduce((sum,value)=>sum+value,0);if(!range.length||!root)return;const rows=[...map.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),list=root.querySelector('.genre-contribution-list'),previousEnd=new Date(`${start}T00:00:00`);previousEnd.setDate(previousEnd.getDate()-1);const yesterday=previousEnd.toISOString().slice(0,10),latestMap=new Map(dailyRows.filter(row=>dateOf(row)===end).map(row=>[genreOf(row),shareOf(row)])),yesterdayMap=new Map(dailyRows.filter(row=>dateOf(row)===yesterday).map(row=>[genreOf(row),shareOf(row)]));if(list){list.innerHTML=`<div class="genre-contribution-list-head"><span>剧种</span><b>昨日环比</b><b>周环比</b></div>${rows.map((item,index)=>{const current=latestMap.get(item.name),old=yesterdayMap.get(item.name),dayChange=current!=null&&old?((current-old)/old*100):null;return `<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(item.name)}</span><b class="${dayChange>0?'is-up':dayChange<0?'is-down':'is-flat'}">${dayChange==null?'--':`${dayChange>0?'↑ ':dayChange<0?'↓ ':''}${Math.abs(dayChange).toFixed(2)}%`}</b><b class="is-flat">--</b></div>`}).join('')}`;const subtitle=root.querySelector('.genre-contribution-overview article:nth-child(2) .panel-head span');if(subtitle)subtitle.textContent=`昨日：${end} 对比 ${yesterday}`;}const chart=window.echarts&&echarts.getInstanceByDom($('#genre-contribution-chart'));if(chart){chart.setOption({series:[{data:rows.map(item=>({name:item.name,value:item.value}))}]},false);chart.resize();}const table=root.querySelector('#genre-contribution-table tbody'),periodKey=`${start}|${end}`;if(table&&!Object.keys(data.genre_top30||{}).some(key=>key.startsWith(`${periodKey}|`)))table.innerHTML='<tr><td colspan="9" class="empty">该自定义区间暂无内容级日快照</td></tr>';};if(startInput&&endInput){startInput.onchange=update;endInput.onchange=update;startInput.title='支持自定义日期区间';endInput.title='支持自定义日期区间';} };
  const renderGenreDateComparisonFix = renderGenre;
  renderGenre = () => { renderGenreDateComparisonFix(); const root=$('#page-genre-contribution'),startInput=$('#genre-start'),endInput=$('#genre-end'),dailyRows=genreDailyData?.rows||[],dateOf=row=>String(row['日期']||row.date||''),genreOf=row=>String(row['剧种']||row.genre||''),shareOf=row=>Number(row['播放VV占比(%)']??row['播放VV占比']??row.play_share)||0;const apply=()=>{const start=startInput?.value,end=endInput?.value,previous=new Date(Date.parse(`${end}T00:00:00Z`)-86400000).toISOString().slice(0,10),currentMap=new Map(dailyRows.filter(row=>dateOf(row)===end).map(row=>[genreOf(row),shareOf(row)])),previousMap=new Map(dailyRows.filter(row=>dateOf(row)===previous).map(row=>[genreOf(row),shareOf(row)]));const panel=root.querySelector('.genre-contribution-overview article:nth-child(2)');if(panel){const subtitle=panel.querySelector('.panel-head span');if(subtitle)subtitle.textContent=`昨日：${end} 对比 ${previous}`;panel.querySelectorAll('.genre-contribution-list-row').forEach(row=>{const name=(row.querySelector('span')?.textContent||'').replace(/^\d+/,'').trim(),current=currentMap.get(name),old=previousMap.get(name),change=current!=null&&old?((current-old)/old*100):null,cell=row.querySelectorAll('b')[0];if(cell){cell.className=change>0?'is-up':change<0?'is-down':'is-flat';cell.textContent=change==null?'--':`${change>0?'↑ ':change<0?'↓ ':''}${Math.abs(change).toFixed(2)}%`;}});}};if(startInput&&endInput){startInput.onchange=apply;endInput.onchange=apply;} };
  const renderGenreChangePresentation = renderGenre;
  renderGenre = () => { renderGenreChangePresentation(); const root=$('#page-genre-contribution'); root.querySelectorAll('.genre-contribution-list-head b,.genre-contribution-list-row b').forEach(node=>{node.style.textAlign='left';if(node.textContent.includes('个百分点'))node.textContent=node.textContent.replace('个百分点','pp');if(node.textContent.includes('↑'))node.className='is-up';else if(node.textContent.includes('↓'))node.className='is-down';else if(node.textContent==='--')node.className='is-flat';}); };
  const renderGenrePieDateSync = renderGenre;
  renderGenre = () => { renderGenrePieDateSync(); const startInput=$('#genre-start'),endInput=$('#genre-end'),rows=genreDailyData?.rows||[],dateOf=row=>String(row['日期']||row.date||''),genreOf=row=>String(row['剧种']||row.genre||''),vvOf=row=>Number(row['播放VV']||row.play_count)||0;const refresh=()=>{const start=startInput?.value,end=endInput?.value,map=new Map();rows.filter(row=>dateOf(row)>=start&&dateOf(row)<=end).forEach(row=>map.set(genreOf(row),(map.get(genreOf(row))||0)+vvOf(row)));const chart=window.echarts?.getInstanceByDom($('#genre-contribution-chart'));if(chart&&map.size){chart.setOption({series:[{data:[...map.entries()].sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}))}]},false);chart.resize();}};if(startInput&&endInput){startInput.onchange=refresh;endInput.onchange=refresh;} };
  const renderGenreDateLabelSync = renderGenre;
  renderGenre = () => { renderGenreDateLabelSync(); const startInput=$('#genre-start'),endInput=$('#genre-end'),updateLabel=()=>{const end=endInput?.value,previous=end?new Date(Date.parse(`${end}T00:00:00Z`)-86400000).toISOString().slice(0,10):'--',subtitle=document.querySelector('#page-genre-contribution .genre-contribution-overview article:nth-child(2) .panel-head span');if(subtitle)subtitle.textContent=`昨日：${end||'--'} 对比 ${previous}`;};if(startInput&&endInput){const oldStart=startInput.onchange,oldEnd=endInput.onchange;startInput.onchange=()=>{oldStart?.();updateLabel()};endInput.onchange=()=>{oldEnd?.();updateLabel()};updateLabel();} };
  const renderGenreStableColors = renderGenre;
  renderGenre = () => { renderGenreStableColors(); const chart=window.echarts?.getInstanceByDom($('#genre-contribution-chart')),colors=['#2f7d4a','#2f6397','#d7a12b','#82a58b','#6685a6','#b97818','#4a8b5e'];const applyColors=()=>{if(!chart)return;const existing=chart.getOption()?.series?.[0]?.data||[];chart.setOption({series:[{data:existing.map((item,index)=>({...item,itemStyle:{color:colors[index%colors.length]}}))}]},false);};applyColors();const startInput=$('#genre-start'),endInput=$('#genre-end');if(startInput&&endInput){const oldStart=startInput.onchange,oldEnd=endInput.onchange;startInput.onchange=()=>{oldStart?.();applyColors()};endInput.onchange=()=>{oldEnd?.();applyColors()};} };
  const renderGenreWithUnifiedDate = renderGenre;
  renderGenre = () => { renderGenreWithUnifiedDate(); const root=$('#page-genre-contribution'),startInput=$('#genre-start'),endInput=$('#genre-end'); if(!startInput||!endInput)return; const apply=()=>{const start=startInput.value,end=endInput.value;if(!start||!end||start>end){return;} renderGenre.period=`${start}|${end}`; renderGenre();}; startInput.onchange=apply; endInput.onchange=apply; };
  const renderGenreWithEqualPeriodWording = renderGenre;
  renderGenre = () => { renderGenreWithEqualPeriodWording(); const root=$('#page-genre-contribution'); if(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.nodeValue.includes('周环比'))node.nodeValue=node.nodeValue.replaceAll('周环比','等长周期变化');}} };
  const renderGenreWithUnlockedDates = renderGenre;
  renderGenre = () => { renderGenreWithUnlockedDates(); const startInput=$('#genre-start'),endInput=$('#genre-end'); if(!startInput||!endInput)return; const keepDate=async()=>{const start=startInput.value,end=endInput.value;if(!start||!end||start>end)return;renderGenre.period=`${start}|${end}`;if(typeof loadGrowthRange==='function')await loadGrowthRange(`${start}|${end}`).catch(()=>{});const source=(growthRawData||[]).filter(row=>row.period_start===row.period_end&&row.period_start>=start&&row.period_end<=end),genreMap={CHN:'国产',JP:'日剧',KR:'韩剧',TH:'泰剧',UK:'英剧',USK:'美剧',OTHER:'其他'},map=new Map();source.forEach(row=>{const name=genreMap[row.season_type]||row.season_type||'其他';map.set(name,(map.get(name)||0)+n(row.play_count));});const total=[...map.values()].reduce((a,b)=>a+b,0),chart=window.echarts?.getInstanceByDom($('#genre-contribution-chart'));if(chart&&total)chart.setOption({series:[{data:[...map.entries()].sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}))}]},false);const list=document.querySelector('#page-genre-contribution .genre-contribution-list');if(list&&total){const ordered=[...map.entries()].sort((a,b)=>b[1]-a[1]),days=Math.round((new Date(`${end}T00:00:00`)-new Date(`${start}T00:00:00`))/86400000)+1,prevEnd=new Date(`${start}T00:00:00`);prevEnd.setDate(prevEnd.getDate()-1);const prevStart=new Date(prevEnd);prevStart.setDate(prevStart.getDate()-days+1),prev=source.filter(row=>row.period_start>=prevStart.toISOString().slice(0,10)&&row.period_start<=prevEnd.toISOString().slice(0,10)),prevMap=new Map();prev.forEach(row=>{const name=genreMap[row.season_type]||row.season_type||'其他';prevMap.set(name,(prevMap.get(name)||0)+n(row.play_count));});const prevTotal=[...prevMap.values()].reduce((a,b)=>a+b,0);list.innerHTML=`<div class="genre-contribution-list-head"><span>剧种</span><b>昨日环比</b><b>等长周期变化</b></div>${ordered.map(([name,value],i)=>{const delta=prevTotal?((value/total)-(prevMap.get(name)||0)/prevTotal)*100:null;return `<div class="genre-contribution-list-row"><span><i>${i+1}</i>${esc(name)}</span><b>--</b><b class="${delta>0?'is-up':delta<0?'is-down':'is-flat'}">${delta==null?'--':`${delta>0?'↑ ':delta<0?'↓ ':''}${Math.abs(delta).toFixed(2)}pp`}</b></div>`}).join('')}`;}}; startInput.onchange=keepDate; endInput.onchange=keepDate; };
  const renderGenreWithFinalDateRefresh = renderGenre;
  renderGenre = () => { renderGenreWithFinalDateRefresh(); const startInput=$('#genre-start'),endInput=$('#genre-end'); if(!startInput||!endInput)return; const refresh=async()=>{const start=startInput.value,end=endInput.value;if(!start||!end||start>end)return;renderGenre.period=`${start}|${end}`;await loadGrowthRange(`${start}|${end}`).catch(()=>{});const mapCode={CHN:'国产',JP:'日剧',KR:'韩剧',TH:'泰剧',UK:'英剧',USK:'美剧',OTHER:'其他'},rows=(growthRawData||[]).filter(row=>row.period_start===row.period_end&&row.period_start>=start&&row.period_start<=end),groups=new Map();rows.forEach(row=>{const name=mapCode[row.season_type]||row.season_type||'其他';groups.set(name,(groups.get(name)||0)+n(row.play_count));});const ordered=[...groups.entries()].sort((a,b)=>b[1]-a[1]),total=ordered.reduce((sum,item)=>sum+item[1],0),colors=['#2f7d4a','#2f6397','#d7a12b','#82a58b','#6685a6','#b97818','#4a8b5e'],chart=window.echarts?.getInstanceByDom($('#genre-contribution-chart'));if(chart&&total){chart.setOption({series:[{data:ordered.map(([name,value],index)=>({name,value,itemStyle:{color:colors[index%colors.length]}}))}]},false);chart.resize();}const overview=document.querySelector('#page-genre-contribution .genre-contribution-overview'),subtitle=overview?.querySelector('article:nth-child(1) .panel-head span');if(subtitle)subtitle.textContent=`${start} 至 ${end} · 按播放VV`;const changeSubtitle=overview?.querySelector('article:nth-child(2) .panel-head span');if(changeSubtitle)changeSubtitle.textContent=`昨日：${end} 对比所选结束日前一日；等长周期：${start} 至 ${end} 对比前一等长周期`;const list=overview?.querySelector('.genre-contribution-list');if(list&&total){const days=Math.round((new Date(`${end}T00:00:00`)-new Date(`${start}T00:00:00`))/86400000)+1,prevEnd=new Date(`${start}T00:00:00`);prevEnd.setDate(prevEnd.getDate()-1);const prevStart=new Date(prevEnd);prevStart.setDate(prevStart.getDate()-days+1),prevRows=(growthRawData||[]).filter(row=>row.period_start===row.period_end&&row.period_start>=prevStart.toISOString().slice(0,10)&&row.period_start<=prevEnd.toISOString().slice(0,10)),prevMap=new Map();prevRows.forEach(row=>{const name=mapCode[row.season_type]||row.season_type||'其他';prevMap.set(name,(prevMap.get(name)||0)+n(row.play_count));});const prevTotal=[...prevMap.values()].reduce((sum,value)=>sum+value,0);list.innerHTML=`<div class="genre-contribution-list-head"><span>剧种</span><b>昨日环比</b><b>等长周期变化</b></div>${ordered.map(([name,value],index)=>{const delta=prevTotal?((value/total)-((prevMap.get(name)||0)/prevTotal))*100:null;return `<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(name)}</span><b>--</b><b class="${delta>0?'is-up':delta<0?'is-down':'is-flat'}">${delta==null?'--':`${delta>0?'↑ ':delta<0?'↓ ':''}${Math.abs(delta).toFixed(2)}pp`}</b></div>`}).join('')}`;}};startInput.onchange=refresh;endInput.onchange=refresh; };
  const renderGenreWithYesterdayChange = renderGenre;
  renderGenre = () => { renderGenreWithYesterdayChange(); const startInput=$('#genre-start'),endInput=$('#genre-end'); if(!startInput||!endInput)return; const update=async()=>{const end=endInput.value,previousDate=new Date(`${end}T00:00:00`);previousDate.setDate(previousDate.getDate()-1);const previous=previousDate.toISOString().slice(0,10);await loadGrowthRange(`${previous}|${end}`).catch(()=>{});const mapCode={CHN:'国产',JP:'日剧',KR:'韩剧',TH:'泰剧',UK:'英剧',USK:'美剧',OTHER:'其他'},day=(growthRawData||[]).filter(row=>row.period_start===row.period_end&&row.period_start===end),old=(growthRawData||[]).filter(row=>row.period_start===row.period_end&&row.period_start===previous),sum=list=>list.reduce((total,row)=>total+n(row.play_count),0),group=list=>{const m=new Map();list.forEach(row=>{const name=mapCode[row.season_type]||row.season_type||'其他';m.set(name,(m.get(name)||0)+n(row.play_count));});return m;},current=group(day),prior=group(old),currentTotal=sum(day),priorTotal=sum(old),list=document.querySelector('#page-genre-contribution .genre-contribution-list');if(list&&currentTotal&&priorTotal)list.querySelectorAll('.genre-contribution-list-row').forEach(row=>{const name=(row.querySelector('span')?.textContent||'').replace(/^\d+/,'').trim(),delta=((current.get(name)||0)/currentTotal-(prior.get(name)||0)/priorTotal)*100,cell=row.querySelectorAll('b')[0];if(cell){cell.className=delta>0?'is-up':delta<0?'is-down':'is-flat';cell.textContent=`${delta>0?'↑ ':delta<0?'↓ ':''}${Math.abs(delta).toFixed(2)}pp`;}});};const oldStart=startInput.onchange,oldEnd=endInput.onchange;startInput.onchange=async()=>{await oldStart?.();await update();};endInput.onchange=async()=>{await oldEnd?.();await update();}; };
  const renderBLWithYesterdayMoM = renderBL;
  const renderBLWithEqualPeriodLabel = renderBL;
  renderBL = () => { renderBLWithEqualPeriodLabel(); const note=document.querySelector('#page-bl .growth-kpi:nth-child(3) small'); if(note)note.textContent='对比前一等长周期'; };
  renderBL = () => { renderBLWithYesterdayMoM(); const end=renderBL.state?.end||RANGE_END,days=dailyData?.days||[],current=days.find(row=>row.date===end),date=new Date(`${end}T00:00:00`); date.setDate(date.getDate()-1); const previous=days.find(row=>row.date===date.toISOString().slice(0,10)),currentVV=Number(current?.bl_play_vv)||0,previousVV=Number(previous?.bl_play_vv)||0,change=previousVV?(currentVV-previousVV)/previousVV:null,header=document.querySelector('#page-bl .bl-visual-grid article:nth-child(2) .panel-head strong'); if(header)header.innerHTML=`${pct(change)} <small>昨日环比</small>`; };
  const renderBLWithoutTrendBadge = renderBL;
  renderBL = () => { renderBLWithoutTrendBadge(); const panel=document.querySelector('#page-bl .bl-visual-grid article:nth-child(2)'); const badge=panel?.querySelector('.panel-head strong'); if(badge)badge.remove(); const subtitle=panel?.querySelector('.panel-head span'); if(subtitle)subtitle.textContent='按日展示BL播放VV'; };
  const activatePageWithBLDateBounds = activatePage;
  const renderBLWithFinalEqualPeriodLabel = renderBL;
  renderBL = () => { renderBLWithFinalEqualPeriodLabel(); const note=document.querySelector('#page-bl .growth-kpi-grid .growth-kpi:nth-child(3) small'); if(note)note.textContent='对比前一等长周期'; };
  activatePage = page => { activatePageWithBLDateBounds(page); if(page === 'bl'){ const latest = dailyData?.days?.at(-1)?.date || RANGE_END; document.querySelectorAll('#page-bl input[type="date"]').forEach(input => { input.max = latest; }); } };
  const renderGrowthWithMomColumn = renderGrowth;
  renderGrowth = () => { renderGrowthWithMomColumn(); const table=document.querySelector('#page-growth .growth-detail-panel table'); if(!table)return; const head=table.querySelector('thead tr'); if(head&&head.children[5]?.textContent.trim()!=='播放VV环比'){const th=document.createElement('th');th.textContent='播放VV环比';head.insertBefore(th,head.children[5]);} table.querySelectorAll('tbody tr').forEach(row=>{if(row.children.length<11)return;const current=Number(row.children[2].textContent.replace(/,/g,'')),previous=Number(row.children[3].textContent.replace(/,/g,'')),td=document.createElement('td');td.textContent=previous>0?`${((current-previous)/previous*100).toFixed(2)}%`:'--';td.className='growth-mom';row.insertBefore(td,row.children[5]);}); };
  const renderGrowthWithMomRepair = renderGrowth;
  renderGrowth = () => { renderGrowthWithMomRepair(); const table=document.querySelector('#page-growth .growth-detail-panel table'); if(!table)return; table.querySelectorAll('tbody tr').forEach(row=>{if(row.querySelector('.growth-mom'))return;const current=Number(row.children[2]?.textContent.replace(/,/g,'')),previous=Number(row.children[3]?.textContent.replace(/,/g,'')),td=document.createElement('td');td.className='growth-mom';td.textContent=previous>0?`${((current-previous)/previous*100).toFixed(2)}%`:'--';if(row.children.length>=5)row.insertBefore(td,row.children[5]);}); };
  const renderGrowthWithSummary = renderGrowth;
  renderGrowth = () => { renderGrowthWithSummary(); const root=document.querySelector('#page-growth'),panel=root?.querySelector('.growth-detail-panel'),table=panel?.querySelector('table'); if(!root||!panel||!table)return; root.querySelector('.growth-summary')?.remove(); const items=[...table.querySelectorAll('tbody tr')].filter(row=>row.children.length>5).map(row=>({title:row.children[1].textContent.trim(),delta:Number(row.children[4].textContent.replace(/[↑↓,\s]/g,''))||0,status:row.children[8]?.textContent.trim()||''})).filter(item=>item.delta>0),total=items.reduce((sum,item)=>sum+item.delta,0),top=[...items].sort((a,b)=>b.delta-a.delta).slice(0,5),top1=top[0],newCount=items.filter(item=>item.status.includes('新进')).length,stableCount=items.filter(item=>item.status.includes('持续')).length; const summary=document.createElement('section');summary.className='growth-summary';summary.innerHTML=`<div class="growth-summary-kpis"><article class="growth-summary-kpi"><span>全站正向播放VV净增量</span><strong>${fmt(total)}</strong><small>榜单增长内容净增量合计</small></article><article class="growth-summary-kpi"><span>增长贡献最高内容</span><strong>${esc(top1?.title||'--')}</strong><small>${top1?`净增 ${fmt(top1.delta)} VV`:'暂无数据'}</small></article><article class="growth-summary-kpi"><span>Top1增长贡献占比</span><strong>${pct(total&&top1?top1.delta/total:null)}</strong><small>Top1净增 ÷ 正向净增量</small></article><article class="growth-summary-kpi"><span>增长机会内容数</span><strong>${items.length}</strong><small>新进Top20 ${newCount} · 持续增长 ${stableCount}</small></article></div><article class="panel growth-contribution-chart-panel"><div class="panel-head"><div><h3>Top5增长贡献</h3><span>按播放VV净增量排序</span></div></div><div id="growth-contribution-chart" class="growth-contribution-chart"></div></article>`;panel.before(summary);if(window.echarts&&top.length){const chart=echarts.init(summary.querySelector('#growth-contribution-chart'));chart.setOption({grid:{left:100,right:35,top:10,bottom:24},xAxis:{type:'value',axisLabel:{color:'#71839c'},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',inverse:true,data:top.map(item=>item.title),axisLabel:{color:'#40536d',width:95,overflow:'truncate'}},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>`${esc(params[0].name)}<br/>净增：${fmt(params[0].value)} VV`},series:[{type:'bar',barWidth:18,data:top.map(item=>item.delta),itemStyle:{color:'#2f7d4a',borderRadius:[0,5,5,0]}}]},true);}};
  const renderGrowthWithFinalFields = renderGrowth;
  renderGrowth = () => { renderGrowthWithFinalFields(); const root=document.querySelector('#page-growth'),table=root?.querySelector('.growth-detail-panel table'); if(!root||!table)return; const oldHeaders=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim()); const desired=['内容名称','当前周期播放VV','上周期播放VV','播放VV净增量','播放VV环比','正向增长贡献占比','当前周期全站排名','上周期全站排名','榜单状态','增长特征','剧种','内容类型','题材标签']; const rows=[...table.querySelectorAll('tbody tr')].filter(row=>row.children.length>=11); let positiveTotal=rows.reduce((sum,row)=>sum+(Number(row.children[4]?.textContent.replace(/[↑↓,\s]/g,''))||0),0); const currentStart=root.querySelector('#growth-start')?.value,currentEnd=root.querySelector('#growth-end')?.value; if(currentStart&&currentEnd&&Array.isArray(growthRawData)){const days=Math.round((new Date(`${currentEnd}T00:00:00`)-new Date(`${currentStart}T00:00:00`))/86400000)+1,prevEnd=new Date(`${currentStart}T00:00:00`);prevEnd.setDate(prevEnd.getDate()-1);const prevStart=new Date(prevEnd);prevStart.setDate(prevStart.getDate()-days+1),aggregate=(start,end)=>{const map=new Map();growthRawData.filter(item=>item.period_start===item.period_end&&item.period_start>=start&&item.period_start<=end).forEach(item=>{const id=String(item.season_id),entry=map.get(id)||0;map.set(id,entry+n(item.play_count));});return map;},cur=aggregate(currentStart,currentEnd),prev=aggregate(prevStart.toISOString().slice(0,10),prevEnd.toISOString().slice(0,10));positiveTotal=[...new Set([...cur.keys(),...prev.keys()])].reduce((sum,id)=>sum+Math.max(0,(cur.get(id)||0)-(prev.get(id)||0)),0)||positiveTotal;} table.querySelector('thead tr').innerHTML=desired.map((name,index)=>`<th${name==='播放VV净增量'?' data-sort="vv_delta"':''}>${name}</th>`).join(''); rows.forEach(row=>{const cells=[...row.children],delta=Number(cells[4]?.textContent.replace(/[↑↓,\s]/g,''))||0,current=Number(cells[2]?.textContent.replace(/,/g,''))||0,previous=Number(cells[3]?.textContent.replace(/,/g,''))||0,mom=previous>0?`${((current-previous)/previous*100).toFixed(2)}%`:'--',status=cells[8]?.textContent.trim()||'',feature=previous<=0?'新内容增长':previous<1000?'低基数增长':current>previous&&previous>0&&((current-previous)/previous)>=1?'爆发增长':'稳定增长',values=[cells[1]?.innerHTML||'--',cells[2]?.innerHTML||'--',cells[3]?.innerHTML||'--',cells[4]?.innerHTML||'--',mom,positiveTotal?`${(delta/positiveTotal*100).toFixed(2)}%`:'--',cells[5]?.innerHTML||'--',cells[6]?.innerHTML||'--',status,feature,cells[9]?.innerHTML||'--',cells[10]?.innerHTML||'--',cells[11]?.innerHTML||'--'];row.innerHTML=values.map((value,index)=>`<td${index===5?' class="growth-contribution"':''}>${value}</td>`).join('');}); table.querySelectorAll('th[data-sort]').forEach(th=>th.classList.add('is-sorted')); };
  const renderGrowthWithRankRepair = renderGrowth;
  renderGrowth = () => { renderGrowthWithRankRepair(); const root=document.querySelector('#page-growth'),table=root?.querySelector('.growth-detail-panel table'); if(!root||!table)return; const source=data?.growth_by_period?.[state.growthPeriod]||[],previousByTitle=new Map(source.map(row=>[String(row.title),row.previous_rank])); table.querySelectorAll('tbody tr').forEach(row=>{if(row.children.length!==13)return;const currentRank=row.children[7]?.textContent.trim()||'--',previousRank=previousByTitle.get(row.children[0]?.textContent.trim()),isNew=row.children[8]?.textContent.includes('新进Top20');row.children[6].textContent=currentRank;row.children[7].textContent=previousRank==null?(isNew?'未上榜':'--'):fmt(previousRank);}); };
  const renderGrowthWithOpportunityLayout = renderGrowth;
  renderGrowth = () => { renderGrowthWithOpportunityLayout(); const root=document.querySelector('#page-growth'),table=root?.querySelector('.growth-detail-panel table'); if(!root||!table)return; const head=table.querySelector('thead tr'); if(head&&head.children[0]?.textContent.trim()!=='序号'){const th=document.createElement('th');th.textContent='序号';head.insertBefore(th,head.children[0]);} table.querySelectorAll('tbody tr').forEach((row,index)=>{if(row.children.length===13){const td=document.createElement('td');td.innerHTML=`<span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span>`;row.insertBefore(td,row.children[0]);} const mom=row.children[5];if(mom)mom.classList.add('growth-mom-muted');}); const chartPanel=root.querySelector('.growth-contribution-chart-panel'),chartTitle=chartPanel?.querySelector('h3'),chartSubtitle=chartPanel?.querySelector('.panel-head span');if(chartTitle)chartTitle.textContent='增长来源分析';if(chartSubtitle)chartSubtitle.textContent='按剧种正向播放VV净增量占比';const rows=[...table.querySelectorAll('tbody tr')].filter(row=>row.children.length>=14),groups=new Map();rows.forEach(row=>{const genre=row.children[11]?.textContent.trim()||'其他',delta=Number(row.children[5]?.textContent.replace(/[↑↓,\s]/g,''))||0;groups.set(genre,(groups.get(genre)||0)+Math.max(0,delta));});const total=[...groups.values()].reduce((sum,value)=>sum+value,0),chart=window.echarts?.getInstanceByDom(root.querySelector('#growth-contribution-chart'));if(chart&&total){const ordered=[...groups.entries()].sort((a,b)=>b[1]-a[1]);chart.setOption({grid:{left:75,right:35,top:10,bottom:24},yAxis:{data:ordered.map(item=>item[0])},xAxis:{type:'value'},series:[{type:'bar',data:ordered.map(item=>item[1]),itemStyle:{color:'#2f7d4a',borderRadius:[0,5,5,0]}}],tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>`${esc(params[0].name)}<br/>增长贡献：${(params[0].value/total*100).toFixed(2)}%`}},true);} const cards=root.querySelectorAll('.growth-summary-kpi');if(cards[1]){cards[1].querySelector('span').textContent='最大增长内容';}if(cards[3]){cards[3].querySelector('span').textContent='重点关注内容数';cards[3].querySelector('small').textContent='爆发增长 + 新内容增长';} };
  const renderGrowthWithoutMom = renderGrowth;
  renderGrowth = () => { renderGrowthWithoutMom(); const table=document.querySelector('#page-growth .growth-detail-panel table'); if(!table)return; const head=table.querySelector('thead tr');if(head?.children[5]?.textContent.trim()==='播放VV环比')head.removeChild(head.children[5]);table.querySelectorAll('tbody tr').forEach(row=>{if(row.children[5]?.classList.contains('growth-mom')||row.children[5]?.textContent.trim()==='--'||row.children[5]?.textContent.includes('%'))row.removeChild(row.children[5]);}); };
  const renderGrowthWithVerifiedOpportunityView = renderGrowth;
  renderGrowth = () => { renderGrowthWithVerifiedOpportunityView(); const root=document.querySelector('#page-growth'),table=root?.querySelector('.growth-detail-panel table'); if(!root||!table)return; const rows=[...table.querySelectorAll('tbody tr')].filter(row=>row.children.length>=13),groups=new Map();rows.forEach(row=>{const genre=row.children[10]?.textContent.trim()||'其他',delta=Number(row.children[4]?.textContent.replace(/[↑↓,\s]/g,''))||0;groups.set(genre,(groups.get(genre)||0)+Math.max(0,delta));const feature=row.children[9];if(feature){const text=feature.textContent.trim(),kind=text.includes('新内容')?'new':text.includes('爆发')?'burst':text.includes('低基数')?'low':'stable';feature.innerHTML=`<span class="growth-feature growth-feature-${kind}">${text}</span>`;}});const ordered=[...groups.entries()].sort((a,b)=>b[1]-a[1]),total=ordered.reduce((sum,item)=>sum+item[1],0),top=ordered[0],cards=root.querySelectorAll('.growth-summary-kpi');if(cards[0]){cards[0].querySelector('span').textContent='最大增长内容';cards[0].querySelector('strong').textContent=rows[0]?.children[1]?.textContent.trim()||'--';cards[0].querySelector('small').textContent=rows[0]?`净增 ${rows[0].children[4].textContent.trim()} VV`:'暂无数据';}if(cards[1]){cards[1].querySelector('span').textContent='最大增长来源';cards[1].querySelector('strong').textContent=top?.[0]||'--';cards[1].querySelector('small').textContent=top&&total?`贡献 ${(top[1]/total*100).toFixed(2)}%`:'暂无数据';}if(cards[2]){cards[2].querySelector('span').textContent='重点关注内容数';cards[2].querySelector('strong').textContent=String(rows.length);cards[2].querySelector('small').textContent='爆发增长 + 新内容增长';}if(cards[3])cards[3].remove();const chartPanel=root.querySelector('.growth-contribution-chart-panel'),chartTitle=chartPanel?.querySelector('h3'),chartSubtitle=chartPanel?.querySelector('.panel-head span');if(chartTitle)chartTitle.textContent='增长来源分析';if(chartSubtitle)chartSubtitle.textContent='按剧种正向播放VV净增量占比';const chart=window.echarts?.getInstanceByDom(root.querySelector('#growth-contribution-chart'));if(chart&&ordered.length)chart.setOption({grid:{left:70,right:35,top:10,bottom:24},yAxis:{type:'category',inverse:true,data:ordered.map(item=>item[0])},xAxis:{type:'value',axisLabel:{color:'#71839c'},splitLine:{lineStyle:{color:'#e7eef6'}}},series:[{type:'bar',data:ordered.map(item=>item[1]),itemStyle:{color:'#2f7d4a',borderRadius:[0,5,5,0]}}],tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>`${esc(params[0].name)}<br/>正向增长贡献：${total?(params[0].value/total*100).toFixed(2):0}%`}},true); };
  const renderGrowthWithFinalColumnPolish = renderGrowth;
  renderGrowth = () => { renderGrowthWithFinalColumnPolish(); const root=document.querySelector('#page-growth'),table=root?.querySelector('.growth-detail-panel table'); if(!root||!table)return; const head=table.querySelector('thead tr');if(head?.children[5]?.textContent.trim()==='正向增长贡献占比')head.removeChild(head.children[5]);table.querySelectorAll('tbody tr').forEach(row=>{if(row.children[5]?.classList.contains('growth-contribution')||row.children[5]?.textContent.trim().endsWith('%'))row.removeChild(row.children[5]);const currentRank=row.children[5],previousRank=row.children[6],status=row.children[7];[currentRank,previousRank].forEach(cell=>cell?.classList.add('growth-rank-strong'));if(status){const text=status.textContent.trim();status.innerHTML=text.includes('新进')?`<span class="growth-status growth-status-new">${text}</span>`:text.includes('持续')?`<span class="growth-status growth-status-continuous">${text}</span>`:`<span class="growth-status growth-status-neutral">${text||'--'}</span>`;}}); };
  const renderGrowthWithPinkSourceBars = renderGrowth;
  renderGrowth = () => { renderGrowthWithPinkSourceBars(); const chart=window.echarts?.getInstanceByDom(document.querySelector('#page-growth #growth-contribution-chart')); if(chart)chart.setOption({series:[{type:'bar',barWidth:12,itemStyle:{color:'#e7a0b3',borderRadius:[0,5,5,0]}}]},false); };
  const renderGrowthWithRebuiltPinkChart = renderGrowth;
  renderGrowth = () => { renderGrowthWithRebuiltPinkChart(); const root=document.querySelector('#page-growth'),el=root?.querySelector('#growth-contribution-chart'),table=root?.querySelector('.growth-detail-panel table');if(!el||!table||!window.echarts)return;const rows=[...table.querySelectorAll('tbody tr')].filter(row=>row.children.length>=13),groups=new Map();rows.forEach(row=>{const name=row.children[10]?.textContent.trim()||'其他',delta=Number(row.children[4]?.textContent.replace(/[↑↓,\s]/g,''))||0;groups.set(name,(groups.get(name)||0)+Math.max(0,delta));});const ordered=[...groups.entries()].sort((a,b)=>b[1]-a[1]),old=echarts.getInstanceByDom(el);if(old)old.dispose();const chart=echarts.init(el);chart.setOption({grid:{left:70,right:35,top:10,bottom:24},xAxis:{type:'value',axisLabel:{color:'#71839c'},splitLine:{lineStyle:{color:'#e7eef6'}}},yAxis:{type:'category',inverse:true,data:ordered.map(item=>item[0]),axisLabel:{color:'#40536d'}},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>`${esc(params[0].name)}<br/>正向增长贡献：${ordered.reduce((sum,item)=>sum+item[1],0)?(params[0].value/ordered.reduce((sum,item)=>sum+item[1],0)*100).toFixed(2):0}%`},series:[{type:'bar',barWidth:16,data:ordered.map(item=>item[1]),itemStyle:{color:'#e7a0b3',borderRadius:[0,5,5,0]}}]},true); };
  const renderGrowthWithSafePinkChart = renderGrowth;
  renderGrowth = () => { try{renderGrowthWithSafePinkChart();}catch(error){console.error(error);} const root=document.querySelector('#page-growth'),el=root?.querySelector('#growth-contribution-chart'),table=root?.querySelector('.growth-detail-panel table');if(!el||!table||!window.echarts)return;const groups=new Map();table.querySelectorAll('tbody tr').forEach(row=>{const name=row.children[10]?.textContent.trim()||'其他',delta=Number(row.children[4]?.textContent.replace(/[↑↓,\s]/g,''))||0;groups.set(name,(groups.get(name)||0)+Math.max(0,delta));});const ordered=[...groups.entries()].sort((a,b)=>b[1]-a[1]),chart=echarts.init(el),total=ordered.reduce((sum,item)=>sum+item[1],0);chart.setOption({yAxis:{type:'category',inverse:true,data:ordered.map(item=>item[0])},series:[{type:'bar',barWidth:16,data:ordered.map(item=>item[1]),itemStyle:{color:'#e7a0b3',borderRadius:[0,5,5,0]}}],tooltip:{formatter:params=>`${esc(params[0].name)}<br/>正向增长贡献：${total?(params[0].value/total*100).toFixed(2):0}%`}},false); };
  const renderGenreWithDisplayRule = renderGenre;
  renderGenre = () => {
    renderGenreWithDisplayRule();
    const root=$('#page-genre-contribution');if(!root||!data)return;
    const period=renderGenre.period||'2026-08-31|2026-09-06';
    const sources=Object.entries(data.genre_top30||{}).filter(([key])=>key.startsWith(`${period}|`)).map(([,value])=>value);
    const mapped=mappedGenreView(sources),selected=state.genre||'CHN',view=mapped[selected]||{};
    const originalTotals={},originalUV={};GENRES.forEach(([code])=>{const source=sources.find(item=>String(item?.genre_code||'')===code);originalTotals[code]=n(source?.total_play_vv);originalUV[code]=n(source?.total_play_uv)});
    // genre_top30 totals are raw genre totals. Reclassify all qualifying daily
    // Thai BL rows, not only the rows that happen to be in Top30, so the pie
    // chart and the detail list use one consistent display classification.
    const moved={vv:0,uv:0},periodStart=period.split('|')[0],periodEnd=period.split('|')[1];
    (dailyData?.days||[]).filter(day=>String(day?.date||'')>=periodStart&&String(day?.date||'')<=periodEnd).forEach(day=>{
      const dailyBySeason=new Map();(day.bl_rows||[]).forEach(row=>{const id=String(row?.season_id||'').trim(),old=dailyBySeason.get(id);if(id&&(!old||n(row.play_count)>n(old.play_count)))dailyBySeason.set(id,row)});
      dailyBySeason.forEach(row=>{if(displayGenreCode(row)==='CHN'&&String(row?.season_type||'')==='TH'){moved.vv+=n(row.play_count);moved.uv+=n(row.play_uv)}});
    });
    originalTotals.TH=Math.max(0,originalTotals.TH-moved.vv);originalTotals.CHN=(originalTotals.CHN||0)+moved.vv;
    originalUV.TH=Math.max(0,originalUV.TH-moved.uv);originalUV.CHN=(originalUV.CHN||0)+moved.uv;
    view.total_play_vv=Math.max(0,originalTotals[selected]||0);view.total_play_uv=Math.max(0,originalUV[selected]||0);
    const total=Object.values(originalTotals).reduce((sum,value)=>sum+Math.max(0,value),0),shareRows=GENRES.map(([code,label])=>({code,name:code==='CHN'?'国产剧':label,value:Math.max(0,originalTotals[code]||0)})).filter(item=>item.value>0).sort((a,b)=>b.value-a.value);
    const heading=root.querySelector('.growth-detail-panel h3');if(heading)heading.textContent=`${view.genre||'国产剧'} · 内容 Top30`;
    const body=root.querySelector('#genre-contribution-table tbody'),metric=state.genreMetric==='play_uv'?'play_uv':'play_count',detailRows=metric==='play_uv'?(view.top30_uv||[]):(view.top30_vv||[]);
    const detailHead=root.querySelector('#genre-contribution-table thead tr');if(detailHead?.lastElementChild)detailHead.lastElementChild.textContent='展示剧种';
    if(body)body.innerHTML=detailRows.map((row,index)=>`<tr><td><span class="rank-badge rank-${index<3?index+1:'other'}">${index+1}</span></td><td class="content-name">${esc(row.title)}</td><td>${fmt(row.play_count)}</td><td>${fmt(row.play_uv)}</td><td>${pct(n(view.total_play_vv)?n(row.play_count)/n(view.total_play_vv):null)}</td><td>--</td><td>${esc(row.season_classify)}</td><td>${esc(row.plot_type)}</td><td>${esc(displayBLGenre(row))}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">暂无真实数据</td></tr>';
    const list=root.querySelector('.genre-contribution-list');if(list)list.innerHTML=`<div class="genre-contribution-list-head"><span>剧种</span><b>当前占比</b><b>播放VV</b></div>${shareRows.map((item,index)=>`<div class="genre-contribution-list-row"><span><i>${index+1}</i>${esc(item.name)}</span><b>${pct(total?item.value/total:null)}</b><b>${fmt(item.value)}</b></div>`).join('')}`;
    const chart=window.echarts?.getInstanceByDom($('#genre-contribution-chart'));if(chart)chart.setOption({series:[{data:shareRows.map(item=>({name:item.name,value:item.value}))}]},false);
  };
  const renderGrowthWithHeaderFilters = renderGrowth;
  renderGrowth = () => {
    renderGrowthWithHeaderFilters();
    const root=document.querySelector('#page-growth'), table=root?.querySelector('.growth-detail-panel table'), toolbar=root?.querySelector('.growth-toolbar-growth');
    if(!root||!table||!toolbar)return;
    const moveFilter=(id,label)=>{
      const select=root.querySelector(`#${id}`), header=[...table.querySelectorAll('thead th')].find(th=>th.textContent.trim()===label);
      if(!select||!header)return;
      header.replaceChildren();
      const title=document.createElement('span');title.className='growth-filter-heading';title.textContent=label;
      const wrap=document.createElement('div');wrap.className='growth-header-filter';wrap.append(title,select);header.append(wrap);
    };
    moveFilter('growth-status','榜单状态');
    moveFilter('growth-feature','增长特征');
    toolbar.querySelectorAll('label').forEach(label=>{if(!label.querySelector('input'))label.remove();});
    const applyDetailFilters=()=>{
      const status=selectValue('growth-status'),feature=selectValue('growth-feature');
      const body=table.querySelector('tbody'),rows=[...body.querySelectorAll('tr')].filter(row=>row.children.length>1);
      let visibleRank=0;
      rows.forEach(row=>{
        const cells=row.children,headers=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim()),statusIndex=headers.findIndex(text=>text.includes('榜单状态')),featureIndex=headers.findIndex(text=>text.includes('增长特征')),statusText=statusIndex>=0?cells[statusIndex]?.textContent.trim()||'':'',featureText=featureIndex>=0?cells[featureIndex]?.textContent.trim()||'':'';
        const statusMatch=status==='all'||(status==='new'&&statusText.includes('新进'));
        const featureMatch=feature==='all'||(feature==='start'&&(featureText.includes('起量')||featureText.includes('新内容')||featureText.includes('低基数')))||(feature==='burst'&&featureText.includes('爆发'))||(feature==='stable'&&featureText.includes('稳定'));
        row.hidden=!(statusMatch&&featureMatch);
        if(!row.hidden){visibleRank+=1;const badge=cells[0]?.querySelector('.rank-badge');if(badge)badge.textContent=String(visibleRank);}
      });
      const count=root.querySelector('.growth-detail-panel .panel-head strong');if(count)count.textContent=`${visibleRank} 条`;
    };
    const selectValue=id=>root.querySelector(`#${id}`)?.value||'all';
    const statusSelect=root.querySelector('#growth-status'),featureSelect=root.querySelector('#growth-feature');
    if(statusSelect)statusSelect.onchange=event=>{state.growthStatus=event.target.value;applyDetailFilters();};
    if(featureSelect)featureSelect.onchange=event=>{state.growthFeature=event.target.value;applyDetailFilters();};
    applyDetailFilters();
    // 表头筛选只过滤明细表；增长来源图保持当前周期全量口径，不随下拉条件变化。
    const chart=window.echarts?.getInstanceByDom(root.querySelector('#growth-contribution-chart'));
    const start=root.querySelector('#growth-start')?.value,end=root.querySelector('#growth-end')?.value;
    const chartKey=`${start}|${end}`;
    if(chart&&start&&end){
      renderGrowth._chartSnapshots=renderGrowth._chartSnapshots||new Map();
      const snapshots=renderGrowth._chartSnapshots;
      if(!snapshots.has(chartKey))snapshots.set(chartKey,chart.getOption());
      else chart.setOption(snapshots.get(chartKey),true);
    }
  };
  const renderGrowthWithOperationsLayout = renderGrowth;
  renderGrowth = () => {
    try { renderGrowthWithOperationsLayout(); } catch (error) { console.error(error); }
    const root = document.querySelector('#page-growth'), detail = root?.querySelector('.growth-detail-panel');
    if (!root || !detail) return;
    root.querySelector('.growth-summary')?.remove();
    root.querySelectorAll('.growth-contribution-chart-panel').forEach(panel => panel.remove());
    root.querySelectorAll('.growth-ops-summary,.growth-focus-section,.growth-opportunity-panel').forEach(panel => panel.remove());
    const start = root.querySelector('#growth-start')?.value || state.growthPeriod.split('|')[0];
    const end = root.querySelector('#growth-end')?.value || state.growthPeriod.split('|')[1];
    const days = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;
    const previousEndDate = new Date(`${start}T00:00:00`); previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate); previousStartDate.setDate(previousStartDate.getDate() - days + 1);
    const previousStart = previousStartDate.toISOString().slice(0, 10), previousEnd = previousEndDate.toISOString().slice(0, 10);
    const aggregate = (from, to) => {
      const map = new Map();
      (growthRawData || []).filter(row => row.period_start === row.period_end && row.period_start >= from && row.period_start <= to).forEach(row => {
        const id = String(row.season_id), item = map.get(id) || {...row, play_count: 0, play_uv: 0};
        item.play_count += n(row.play_count); item.play_uv += n(row.play_uv); item.latest = row; map.set(id, item);
      });
      return map;
    };
    let current = aggregate(start, end), previous = aggregate(previousStart, previousEnd);
    const priorEndDate = new Date(`${previousStart}T00:00:00`); priorEndDate.setDate(priorEndDate.getDate() - 1);
    const priorStartDate = new Date(priorEndDate); priorStartDate.setDate(priorStartDate.getDate() - days + 1);
    const priorStart = priorStartDate.toISOString().slice(0, 10), priorEnd = priorEndDate.toISOString().slice(0, 10), prior = aggregate(priorStart, priorEnd);
    const assignRanks = map => [...map.entries()].sort((a, b) => n(b[1].play_count) - n(a[1].play_count)).forEach(([id, row], index) => { row.rank = index + 1; });
    assignRanks(current); assignRanks(previous);
    let opsRows = [...current.entries()].map(([id, row]) => {
      const old = previous.get(id), previousRecord = Boolean(old), currentVV = n(row.play_count), previousVV = previousRecord ? n(old.play_count) : null, delta = currentVV - (previousVV || 0);
      const priorVV = n(prior.get(id)?.play_count), newTop20 = row.rank <= 20 && (!old?.rank || old.rank > 20), continuous = previousVV > 0 && priorVV > 0 && currentVV > previousVV && previousVV > priorVV;
      const feature = !previousRecord || previousVV < 1000 ? 'new' : delta / previousVV >= 1 ? 'burst' : 'stable';
      const growthType = newTop20 ? 'new' : feature === 'burst' ? 'burst' : continuous ? 'stable' : null;
      return {...row, season_id: id, title: row.title || row.latest?.title || '--', previousRecord, currentVV, previousVV, priorVV, delta, feature, growthType, newTop20, continuous, rank: row.rank || null, previousRank: old?.rank || null};
    });
    if (!opsRows.length) {
      opsRows = [...detail.querySelectorAll('tbody tr')].filter(row => row.children.length >= 9).map(row => ({
        title: row.children[1]?.textContent.trim() || '--', currentVV: n(row.children[2]?.textContent.replace(/,/g, '')), previousVV: n(row.children[3]?.textContent.replace(/,/g, '')), delta: n(row.children[4]?.textContent.replace(/[↑↓,\s+]/g, '')), rank: row.children[5]?.textContent.trim(), previousRank: row.children[6]?.textContent.trim(), feature: row.textContent.includes('新内容') ? 'new' : row.textContent.includes('爆发') ? 'burst' : 'stable'
      }));
    }
    const positiveRows = opsRows.filter(row => row.delta > 0);
    const tableHeaders = [...detail.querySelectorAll('thead th')].map(th => th.textContent.trim());
    const titleIndex = tableHeaders.findIndex(text => text.includes('内容名称'));
    const tableIds = new Set([...detail.querySelectorAll('tbody tr')].filter(row => !row.hidden).map(row => row.dataset.seasonId).filter(Boolean));
    const tableTitles = new Set([...detail.querySelectorAll('tbody tr')].filter(row => !row.hidden).map(row => titleIndex >= 0 ? row.children[titleIndex]?.textContent.trim() : '').filter(Boolean));
    // KPI 与明细表共用同一批最终展示内容，避免各自重新取 Top20 导致数量不一致。
    const opportunityRows = positiveRows.filter(row => tableIds.has(String(row.season_id)) || (!row.season_id && tableTitles.has(row.title)));
    const positiveTotal = positiveRows.reduce((sum, row) => sum + row.delta, 0), previousPositiveTotal = opsRows.reduce((sum, row) => sum + Math.max(0, row.previousVV - row.priorVV), 0), positiveMom = previousPositiveTotal ? (positiveTotal - previousPositiveTotal) / previousPositiveTotal : null;
    opportunityRows.forEach(row => { row.growthType = row.feature; });
    const ordered = [...positiveRows].sort((a, b) => b.delta - a.delta), top = ordered[0], top5 = ordered.slice(0, 5).reduce((sum, row) => sum + row.delta, 0);
    const highValue = positiveRows.filter(row => row.currentVV >= 50000 && row.feature !== 'low');
    const pctText = value => `${(value * 100).toFixed(1)}%`, metric = value => fmt(Math.round(value));
    const featureLabel = {new: '起量增长', burst: '爆发增长', stable: '稳定增长', low: '起量增长'};
    const featureClass = {new: 'new', burst: 'burst', stable: 'stable', low: 'low'};
    const spark = (values, color) => { const vals = values.filter(value => Number.isFinite(value)); if (!vals.length) return ''; const max = Math.max(...vals, 1), min = Math.min(...vals, 0), span = max - min || 1; const points = vals.map((value, index) => `${(index / Math.max(vals.length - 1, 1)) * 76 + 2},${28 - ((value - min) / span) * 24}`).join(' '); return `<svg class="growth-ops-sparkline" viewBox="0 0 80 30" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; };
    const focus = kind => ordered.find(row => row.feature === kind);
    const focusCard = (kind, title) => { const row = focus(kind); return `<article class="growth-focus-card growth-focus-${featureClass[kind]}"><div class="growth-focus-tag">${title} TOP1</div><h3>${esc(row?.title || '暂无符合条件内容')}</h3><div class="growth-focus-metrics"><span>VV净增 <b>${row ? `+${metric(row.delta)}` : '--'}</b></span><span>当前VV <b>${row ? metric(row.currentVV) : '--'}</b></span><span>当前排名 <b>${row?.rank || '--'}</b></span></div><small>${row ? `${esc(displayBLGenre(row))} · ${esc(row.season_classify || '内容')}` : '当前周期暂无数据'}</small></article>`; };
    const matrixRows = opsRows.filter(row => row.currentVV > 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 100);
    const xValues = matrixRows.map(row => row.currentVV).sort((a, b) => a - b), xThreshold = 100000;
    const quadrant = row => `${row.currentVV >= xThreshold ? 'high' : 'low'}-${row.delta >= 0 ? 'up' : 'down'}`;
    const quadrantMeta = { 'high-up': ['高播放＋高增长', '#35a86b'], 'low-up': ['低播放＋高增长', '#347ee5'], 'high-down': ['高播放＋低增长', '#e7a34e'], 'low-down': ['低播放＋低增长', '#93a0ae'] };
    const groups = Object.keys(quadrantMeta).map(key => { const allRows = matrixRows.filter(row => quadrant(row) === key); return {key, count:allRows.length, rows:allRows.sort((a, b) => key.endsWith('up') ? b.delta - a.delta : a.delta - b.delta).slice(0, 10)}; });
    const displayGroups = groups.filter(group => group.key !== 'low-down');
    const displayMatrixCount = groups.reduce((sum, group) => sum + group.rows.length, 0);
    const donut = Math.max(0, Math.min(100, top5 && positiveTotal ? top5 / positiveTotal * 100 : 0));
    const ops = document.createElement('section'); ops.className = 'growth-ops-summary';
    const opportunityCounts = {new: opportunityRows.filter(row => row.feature === 'new').length, low: opportunityRows.filter(row => row.feature === 'low').length, burst: opportunityRows.filter(row => row.feature === 'burst').length, stable: opportunityRows.filter(row => row.feature === 'stable').length};
    ops.innerHTML = `<div class="growth-ops-kpis"><article class="growth-ops-kpi growth-ops-kpi-opportunities"><div class="growth-ops-kpi-title">增长机会内容数</div><strong>${opportunityRows.length}</strong><div class="growth-ops-opportunity-counts"><span class="growth-ops-count-new"><i>新内容增长</i><b>${opportunityCounts.new}</b></span><span class="growth-ops-count-low"><i>低基数增长</i><b>${opportunityCounts.low}</b></span><span class="growth-ops-count-burst"><i>爆发增长</i><b>${opportunityCounts.burst}</b></span><span class="growth-ops-count-stable"><i>稳定增长</i><b>${opportunityCounts.stable}</b></span></div><p>与明细表增长特征筛选共用同一批内容</p></article><article class="growth-ops-kpi"><div class="growth-ops-kpi-title">正向增长VV</div><strong>${metric(positiveTotal)}</strong><p>所有内容正向VV增量合计</p><div class="growth-ops-mom ${positiveMom == null ? 'is-flat' : positiveMom >= 0 ? 'is-up' : 'is-down'}">${positiveMom == null ? '--' : `${positiveMom >= 0 ? '↑' : '↓'} ${Math.abs(positiveMom * 100).toFixed(2)}%`} <span>较上一周期</span></div>${spark([positiveTotal * .62, positiveTotal * .78, positiveTotal], '#347ee5')}</article><article class="growth-ops-kpi growth-ops-kpi-donut"><div class="growth-ops-kpi-title">增长集中度</div><div class="growth-ops-donut" style="--growth-donut:${donut}%"><b>${pctText(donut / 100)}</b></div><div class="growth-ops-kpi-side"><span>Top1贡献 <b>${pctText(positiveTotal && top ? top.delta / positiveTotal : 0)}</b></span><span>Top5贡献 <b>${pctText(donut / 100)}</b></span></div><p>Top5净增 ÷ 全部正向净增VV</p></article><article class="growth-ops-kpi"><div class="growth-ops-kpi-title">高价值增长内容数</div><strong>${highValue.length}</strong><p>当前VV ≥ 5万，且不属于低基数增长</p><div class="growth-ops-progress"><i style="width:${positiveRows.length ? Math.min(100, highValue.length / positiveRows.length * 100) : 0}%"></i></div><small>占正向增长内容 ${pctText(positiveRows.length ? highValue.length / positiveRows.length : 0)}</small></article></div>`;
    detail.before(ops);
    const opsCards = [...ops.querySelectorAll('.growth-ops-kpi')];
    opsCards[0]?.classList.add('growth-ops-kpi-opportunities');
    opsCards[1]?.classList.add('growth-ops-kpi-positive');
    opsCards[3]?.classList.add('growth-ops-kpi-high-value');
    if (opsCards[0]) opsCards[0].querySelector('.growth-ops-kpi-title').textContent = '增长机会内容数';
    if (opsCards[1]) opsCards[1].querySelector('.growth-ops-kpi-title').textContent = '正向增长VV';
    opsCards[3]?.remove();
    const groupCard = (card, className, selectors) => { if (!card) return null; const group = document.createElement('div'); group.className = className; selectors.forEach(selector => { const node = card.querySelector(selector); if (node) group.append(node); }); card.append(group); return group; };
    groupCard(opsCards[0], 'growth-ops-card-opportunity', ['.growth-ops-kpi-title', 'strong', '.growth-ops-opportunity-counts', 'p']);
    groupCard(opsCards[1], 'growth-ops-card-positive', ['.growth-ops-kpi-title', 'strong', 'p', '.growth-ops-mom']);
    const positiveVisual = opsCards[1]?.querySelector('.growth-ops-sparkline'); if (positiveVisual) { const visual = document.createElement('div'); visual.className = 'growth-ops-card-visual'; visual.append(positiveVisual); opsCards[1].append(visual); }
    groupCard(opsCards[2], 'growth-ops-card-concentration', ['.growth-ops-kpi-title', '.growth-ops-donut', '.growth-ops-kpi-side', 'p']);
    const focusSection = document.createElement('section'); focusSection.className = 'panel growth-focus-section'; focusSection.innerHTML = `<div class="panel-head"><div><h3>重点关注内容 TOP3</h3><span>按增长特征各取最值得跟进的内容</span></div></div><div class="growth-focus-grid">${focusCard('burst', '爆发增长')}${focusCard('new', '新内容增长')}${focusCard('stable', '稳定增长')}</div>`; ops.after(focusSection);
    const quadrantAction = { 'high-up':'重点加资源', 'low-up':'潜力爆发', 'high-down':'关注回落风险', 'low-down':'低优先级观察' };
    const matrix = document.createElement('section'); matrix.className = 'panel growth-opportunity-panel'; matrix.innerHTML = `<div class="panel-head"><div><h3>增长机会分类观察</h3><span>按播放规模与VV净增量划分，展示各类最值得关注的Top3</span></div><small>原矩阵 ${matrixRows.length} 个内容</small></div><div class="growth-quadrant-grid">${displayGroups.map(group => { const color = quadrantMeta[group.key][1], rows = group.rows.slice(0,3), totalVV = rows.reduce((sum,row)=>sum+n(row.currentVV),0), totalDelta = rows.reduce((sum,row)=>sum+n(row.delta),0); return `<article class="growth-quadrant-card" style="--quadrant-color:${color}"><div class="growth-quadrant-head"><div><span class="growth-quadrant-kicker">${quadrantAction[group.key]}</span><h3>${quadrantMeta[group.key][0]}</h3></div><b>${group.count}个内容</b></div><div class="growth-quadrant-metrics"><span>Top3当前VV<strong>${metric(totalVV)}</strong></span><span>Top3净增<strong class="${totalDelta >= 0 ? 'is-positive' : 'is-negative'}">${totalDelta >= 0 ? '+' : ''}${metric(totalDelta)}</strong></span></div><div class="growth-quadrant-chart-legend"><span><i class="is-current"></i>当前周期VV</span><span><i class="is-previous"></i>上周期VV</span></div><div id="growth-quadrant-chart-${group.key}" class="growth-quadrant-chart" role="img" aria-label="${quadrantMeta[group.key][0]}Top3柱形图"></div></article>`; }).join('')}</div>`; focusSection.after(matrix);
    if (window.echarts) {
      displayGroups.forEach(group => {
        const chartEl = matrix.querySelector(`#growth-quadrant-chart-${group.key}`);
        const old = echarts.getInstanceByDom(chartEl);
        if (old) old.dispose();
        const chart = echarts.init(chartEl);
        const rows = group.rows.slice(0, 3);
        const labels = rows.map(row => row.title.length > 12 ? `${row.title.slice(0, 12)}…` : row.title);
        const isGrowth = group.key.endsWith('up');
        chart.setOption({
          color: ['#2f9b57', '#66717d'],
          barGap: '22%',
          barCategoryGap: '34%',
          grid: {left:48, right:42, top:14, bottom:58},
          tooltip: {trigger:'axis', axisPointer:{type:'shadow'}, formatter: params => { const row = rows[params[0]?.dataIndex || 0]; return row ? `${esc(row.title)}<br/>当前周期VV：${metric(row.currentVV)}<br/>上周期VV：${row.previousRecord===false?'无有效记录':metric(row.previousVV)}<br/>VV净增：${row.delta >= 0 ? '+' : ''}${metric(row.delta)}` : ''; }},
          xAxis: {type:'category', data:labels, axisLabel:{color:'#64788f', fontSize:12, lineHeight:16, margin:12, interval:0, overflow:'truncate'}},
          yAxis: {type:'value', axisLabel:{color:'#71839c', fontSize:10, formatter:value=>fmt(value)}, splitLine:{lineStyle:{color:'#edf2f7'}}},
          series: [
            {name:'当前周期VV', type:'bar', barMaxWidth:18, itemStyle:{color:'#2f9b57', borderColor:'#2f9b57', borderWidth:0, borderRadius:[4,4,0,0]}, emphasis:{itemStyle:{color:'#2f9b57'}}, data:rows.map(row=>({value:n(row.currentVV), itemStyle:{color:'#2f9b57', borderColor:'#2f9b57', borderWidth:0}}))},
            {name:'上周期VV', type:'bar', barMaxWidth:18, itemStyle:{color:'#66717d', borderColor:'#66717d', borderWidth:0, borderRadius:[4,4,0,0]}, emphasis:{itemStyle:{color:'#66717d'}}, data:rows.map(row=>({value:n(row.previousVV), itemStyle:{color:'#66717d', borderColor:'#66717d', borderWidth:0}}))}
          ]
        }, true);
        chart.resize();
      });
    }
    displayGroups.forEach(group => {
      const chartEl = matrix.querySelector(`#growth-quadrant-chart-${group.key}`), rows = group.rows.slice(0, 3);
      if (!chartEl || !rows.length) return;
      const width = 600, height = 175, baseline = 136, plotHeight = 116;
      const maxValue = Math.max(...rows.flatMap(row => [n(row.currentVV), n(row.previousVV)]), 1), slot = width / rows.length, barWidth = Math.min(22, slot * .14), gap = 6;
      const grid = [0, .25, .5, .75, 1].map(ratio => { const y = baseline - plotHeight * ratio; return `<line x1="42" y1="${y}" x2="${width - 12}" y2="${y}" stroke="#edf2f7"/><text x="36" y="${y + 3}" text-anchor="end" fill="#71839c" font-size="10">${fmt(maxValue * ratio)}</text>`; }).join('');
      const bars = rows.map((row, index) => { const center = 70 + index * slot, currentHeight = n(row.currentVV) / maxValue * plotHeight, previousHeight = n(row.previousVV) / maxValue * plotHeight, label = row.title.length > 12 ? `${row.title.slice(0, 12)}…` : row.title; return `<rect x="${center - barWidth - gap / 2}" y="${baseline - currentHeight}" width="${barWidth}" height="${currentHeight}" rx="3" fill="#2f9b57"><title>${esc(row.title)} · 当前周期VV ${metric(row.currentVV)}</title></rect><rect x="${center + gap / 2}" y="${baseline - previousHeight}" width="${barWidth}" height="${previousHeight}" rx="3" fill="#66717d"><title>${esc(row.title)} · 上周期VV ${metric(row.previousVV)}</title></rect><text x="${center}" y="${height - 10}" text-anchor="middle" fill="#64788f" font-size="12">${esc(label)}</text>`; }).join('');
      chartEl.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${grid}<line x1="42" y1="${baseline}" x2="${width - 12}" y2="${baseline}" stroke="#8c98a8"/>${bars}</svg>`;
    });
  };
  // 三个运营 Tab 统一使用“单日选择”。所选日期作为周期结束日，涉及周环比时使用连续 7 天窗口。
  let singleDayEnd = RANGE_END;
  let latestGrowthDate = RANGE_END;
  let latestGrowthDatePromise = null;
  async function discoverLatestGrowthDate() {
    if (latestGrowthDatePromise) return latestGrowthDatePromise;
    latestGrowthDatePromise = (async () => {
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - 1);
      for (let offset = 0; offset < 31; offset += 1) {
        const date = cursor.toISOString().slice(0, 10);
        try {
          const response = await fetch(`data/season_play_daily/${date}.json`, {method: 'HEAD', cache: 'no-store'});
          if (response.ok) return date;
        } catch (_) {}
        cursor.setDate(cursor.getDate() - 1);
      }
      return RANGE_END;
    })().then(date => (latestGrowthDate = date));
    return latestGrowthDatePromise;
  }
  const singleDayStart = day => { const date = new Date(`${day}T00:00:00`); date.setDate(date.getDate() - 6); return date.toISOString().slice(0, 10); };
  const singleDayPeriod = day => `${singleDayStart(day)}|${day}`;
  const removeDateRangeControls = root => {
    if (!root) return;
    root.querySelectorAll('input[type="date"]').forEach(input => {
      const label = input.closest('label');
      if (label) label.remove(); else input.remove();
    });
    root.querySelectorAll('span').forEach(node => { if (node.textContent.trim() === '至') node.remove(); });
  };
  const addSingleDayControl = (root, host, id, currentDay, onChange, maxDay = singleDayEnd) => {
    if (!root) return;
    root.querySelector('.single-day-control')?.remove();
    if (!host) {
      host = document.createElement('div');
      host.className = 'growth-heading-controls';
      root.querySelector('.growth-heading, .section-heading')?.append(host);
    }
    if (!host) return;
    const label = document.createElement('label');
    label.className = 'single-day-control';
    label.innerHTML = `日期<input id="${id}" type="date" min="${RANGE_START}" max="${maxDay}" value="${currentDay || maxDay}">`;
    const input = label.querySelector('input');
    input.addEventListener('change', () => { if (input.value) onChange(input.value); });
    host.append(label);
  };
  const rewriteWeeklyCopy = root => {
    if (!root) return;
    root.querySelectorAll('*').forEach(node => {
      if (node.children.length) return;
      if (node.textContent.includes('昨日环比')) node.textContent = node.textContent.replaceAll('昨日环比', '周环比');
      if (node.textContent.includes('较前一日')) node.textContent = node.textContent.replaceAll('较前一日', '较前7天');
    });
  };
  const removePeriodHelperText = root => {
    if (!root) return;
    const blGenreSubtitle = root.querySelector('.bl-visual-grid article:first-child .panel-head span');
    if (blGenreSubtitle) blGenreSubtitle.textContent = '';
    const genreSubtitle = root.querySelector('.genre-contribution-overview article:first-child .panel-head span');
    if (genreSubtitle) genreSubtitle.textContent = '';
    root.querySelectorAll('.panel-head span').forEach(node => {
      if (node.textContent.includes('昨日：') || node.textContent.includes('对比前一等长周期') || node.textContent.includes('等长周期：')) node.textContent = '';
    });
    root.querySelectorAll('.growth-kpi small').forEach(node => {
      if (node.textContent.includes('对比前一等长周期')) node.remove();
    });
  };
  const normalizeMissingGrowthDisplay = root => {
    if (!root) return;
    root.querySelectorAll('.growth-detail-panel tbody tr').forEach(row => {
      const previousCell = [...row.children].find(cell => cell.textContent.includes('无有效记录'));
      if (!previousCell) return;
      previousCell.classList.add('growth-previous-missing');
      const featureCell = [...row.children].find(cell => cell.textContent.includes('新内容增长') || cell.textContent.includes('低基数增长'));
      if (featureCell) featureCell.textContent = '起量增长';
    });
  };
  const mergeGrowthOpportunityLabels = root => {
    if (!root) return;
    const counts = root.querySelector('.growth-ops-opportunity-counts');
    const newCount = counts?.querySelector('.growth-ops-count-new');
    const lowCount = counts?.querySelector('.growth-ops-count-low');
    if (counts && newCount) {
      const newValue = Number(newCount.querySelector('b')?.textContent || 0) || 0;
      const lowValue = Number(lowCount?.querySelector('b')?.textContent || 0) || 0;
      newCount.classList.add('growth-ops-count-start');
      newCount.innerHTML = `<i>起量增长</i><b>${newValue + lowValue}</b>`;
      lowCount?.remove();
    }
    root.querySelectorAll('.growth-feature').forEach(node => {
      if (node.textContent.includes('新内容增长') || node.textContent.includes('低基数增长')) {
        node.textContent = '起量增长';
        node.classList.remove('growth-feature-stable', 'growth-feature-low', 'growth-feature-burst');
        node.classList.add('growth-feature-new');
      }
    });
    root.querySelectorAll('.growth-focus-new .growth-focus-tag').forEach(node => { node.textContent = '起量增长 TOP1'; });
  };

  const renderBLBeforeSingleDay = renderBL;
  renderBL = () => {
    const stateBL = renderBL.state || (renderBL.state = {});
    const day = stateBL.singleDay || singleDayEnd;
    const period = singleDayPeriod(day);
    stateBL.singleDay = day;
    stateBL.granularity = 'custom';
    stateBL.day = day;
    stateBL.week = period;
    stateBL.start = period.split('|')[0];
    stateBL.end = day;
    stateBL.tableStart = stateBL.start;
    stateBL.tableEnd = day;
    renderBLBeforeSingleDay();
    const root = document.querySelector('#page-bl');
    removeDateRangeControls(root);
    addSingleDayControl(root, root?.querySelector('.growth-heading-controls'), 'bl-single-day', day, value => { renderBL.state.singleDay = value; renderBL(); });
    rewriteWeeklyCopy(root);
    removePeriodHelperText(root);
  };

  const renderGenreBeforeSingleDay = renderGenre;
  renderGenre = () => {
    const day = renderGenre.singleDay || singleDayEnd;
    renderGenre.singleDay = day;
    renderGenre.period = singleDayPeriod(day);
    state.growthPeriod = renderGenre.period;
    renderGenreBeforeSingleDay();
    const root = document.querySelector('#page-genre-contribution');
    removeDateRangeControls(root);
    addSingleDayControl(root, root?.querySelector('.growth-heading-controls'), 'genre-single-day', day, value => {
      renderGenre.singleDay = value;
      renderGenre.period = singleDayPeriod(value);
      state.growthPeriod = renderGenre.period;
      loadGrowthRange(renderGenre.period).then(() => renderGenre()).catch(() => renderGenre());
    });
    rewriteWeeklyCopy(root);
    removePeriodHelperText(root);
  };

  const renderGrowthBeforeSingleDay = renderGrowth;
  renderGrowth = () => {
    const day = state.growthSingleDay || latestGrowthDate;
    state.growthSingleDay = day;
    state.growthPeriod = singleDayPeriod(day);
    renderGrowthBeforeSingleDay();
    const root = document.querySelector('#page-growth');
    removeDateRangeControls(root);
    addSingleDayControl(root, root?.querySelector('.growth-date-controls, .growth-toolbar-growth'), 'growth-single-day', day, value => {
      state.growthSingleDay = value;
      state.growthPeriod = singleDayPeriod(value);
      loadGrowthRange(state.growthPeriod).then(() => renderGrowth()).catch(() => renderGrowth());
    }, latestGrowthDate);
    rewriteWeeklyCopy(root);
    normalizeMissingGrowthDisplay(root);
    mergeGrowthOpportunityLabels(root);
    removePeriodHelperText(root);
  };

  // Final playback-growth view: keep the existing Top20 and status column,
  // remove the opportunity-count card, expose only the burst-growth filter,
  // and add day/week comparisons to every visible row.
  const renderGrowthWithRequestedFields = renderGrowth;
  renderGrowth = () => {
    try { renderGrowthWithRequestedFields(); } catch (error) { console.error(error); }
    const root = document.querySelector('#page-growth');
    if (!root) return;
    root.querySelector('.growth-ops-kpi-opportunities')?.remove();
    root.querySelector('.growth-ops-kpi-positive')?.remove();
    root.querySelector('.growth-ops-kpi-donut')?.remove();
    const featureSelect = root.querySelector('#growth-feature');
    if (featureSelect) {
      [...featureSelect.options].forEach(option => {
        if (!['all', 'burst'].includes(option.value)) option.remove();
      });
      if (!['all', 'burst'].includes(featureSelect.value)) featureSelect.value = 'all';
    }
    const table = root.querySelector('.growth-detail-panel table');
    const header = table?.querySelector('thead tr');
    if (!table || !header || !Array.isArray(growthRawData)) return;
    const headers = [...header.children].map(cell => cell.textContent.trim());
    const deltaIndex = headers.findIndex(text => text.includes('播放VV净增量'));
    if (deltaIndex < 0) return;
    const featureIndex = headers.findIndex(text => text.includes('增长特征'));
    const [start, end] = String(state.growthPeriod || '').split('|');
    if (!start || !end) return;
    const days = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;
    const shift = (value, amount) => { const date = new Date(`${value}T00:00:00`); date.setDate(date.getDate() + amount); return date.toISOString().slice(0, 10); };
    const aggregate = (from, to) => {
      const map = new Map();
      growthRawData.filter(row => row.period_start === row.period_end && row.period_start >= from && row.period_start <= to).forEach(row => {
        const id = String(row.season_id), item = map.get(id) || {play_count: 0};
        item.play_count += n(row.play_count); map.set(id, item);
      });
      return map;
    };
    const current = aggregate(start, end);
    const currentDay = aggregate(end, end);
    const dayBefore = aggregate(shift(end, -1), shift(end, -1));
    const weekBefore = aggregate(shift(start, -7), shift(end, -7));
    const ring = (currentValue, previousValue) => {
      if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) return '--';
      const change = (currentValue - previousValue) / previousValue * 100;
      const arrow = change >= 0 ? '↑' : '↓';
      const className = change >= 0 ? 'growth-positive' : 'growth-negative';
      return `<span class="${className}">${arrow}${Math.abs(change).toFixed(2)}%</span>`;
    };
    const dayHeader = document.createElement('th'); dayHeader.textContent = '日环比';
    const weekHeader = document.createElement('th'); weekHeader.textContent = '周环比';
    const renderedFeatureIndex = featureIndex > deltaIndex ? featureIndex + 2 : featureIndex;
    header.insertBefore(dayHeader, header.children[deltaIndex + 1] || null);
    header.insertBefore(weekHeader, dayHeader.nextSibling);
    table.querySelectorAll('tbody tr').forEach(row => {
      if (row.children.length <= deltaIndex) return;
      const id = String(row.dataset.seasonId || '');
      const currentValue = current.get(id)?.play_count;
      const dayCell = document.createElement('td'); dayCell.className = 'growth-day-mom'; dayCell.innerHTML = ring(currentDay.get(id)?.play_count, dayBefore.get(id)?.play_count);
      const weekCell = document.createElement('td'); weekCell.className = 'growth-week-mom'; weekCell.innerHTML = ring(currentValue, weekBefore.get(id)?.play_count);
      row.insertBefore(dayCell, row.children[deltaIndex + 1] || null);
      row.insertBefore(weekCell, dayCell.nextSibling);
      if (renderedFeatureIndex >= 0) {
        const featureCell = row.children[renderedFeatureIndex];
        if (featureCell && !featureCell.textContent.includes('爆发')) featureCell.textContent = '--';
      }
    });
    const tagIndex = [...header.children].findIndex(cell => cell.textContent.trim() === '题材标签');
    if (tagIndex >= 0) {
      header.children[tagIndex]?.remove();
      table.querySelectorAll('tbody tr').forEach(row => row.children[tagIndex]?.remove());
      const emptyCell = table.querySelector('tbody td.empty');
      if (emptyCell) emptyCell.colSpan = header.children.length;
    }
  };

  let initialLoad=null;
  async function ensureGrowthData() {
    if(data&&dailyData&&genreDailyData)return;
    if(!initialLoad)initialLoad=Promise.all([fetchJson(DATA_URL),fetchJson('data/bl_daily_snapshot_20260701_20260831.json?v=20260911-daily'),fetchJson('data/%E5%89%A7%E7%A7%8D%E6%92%AD%E6%94%BE%E5%8D%A0%E6%AF%94_%E5%85%A8%E9%83%A8%E7%AB%AF%E5%8F%A3_20260705_20260804.json?v=20260911-genre-daily')]).then(values=>{[data,dailyData,genreDailyData]=values;const latest=dailyData?.days?.at(-1)?.date;if(latest){RANGE_END=latest;singleDayEnd=latest;latestGrowthDate=latest;}}).catch(error=>{initialLoad=null;throw error});
    return initialLoad;
  }
  function init() {
    document.querySelectorAll('.nav-subitem[data-page="bl"],.nav-subitem[data-page="genre-contribution"],.nav-subitem[data-page="growth"]').forEach(button => {
      if(button.dataset.growthLazyBound)return;
      button.dataset.growthLazyBound='1';
      button.addEventListener('click', event => {
        event.preventDefault();
        const page=button.dataset.page;
        Promise.all([ensureGrowthData(),page==='growth'?discoverLatestGrowthDate():Promise.resolve()]).then(()=>{
          if(page==='growth'&&!state.growthSingleDay){state.growthSingleDay=latestGrowthDate;state.growthPeriod=singleDayPeriod(latestGrowthDate)}
          activatePage(page);
          if(page==='growth')loadGrowthRange(state.growthPeriod).then(()=>renderGrowth()).catch(error=>console.error(error));
          const latest=dailyData?.days?.at(-1)?.date||RANGE_END;document.querySelectorAll('#page-bl input[type="date"]').forEach(input=>{input.max=latest});
        }).catch(error=>{const root=$(`#page-${page}`);if(root)root.innerHTML='<section class="panel growth-error">真实数据加载失败，请检查数据快照。</section>'});
      });
    });
  }
  window.addEventListener('DOMContentLoaded', init);
})();

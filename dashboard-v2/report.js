(function(){
  const $=s=>document.querySelector(s);
  const arr=v=>Array.isArray(v)?v:(Array.isArray(v?.rows)?v.rows:(Array.isArray(v?.data)?v.data:[]));
  const dateOf=r=>String(r?.date??r?.['日期']??'').slice(0,10);
  const monthRows=(list,m)=>arr(list).filter(r=>dateOf(r).slice(0,7)===m);
  const fmt=v=>v==null||v===''||!Number.isFinite(Number(v))?'':Number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  const pct=v=>v==null||v===''||!Number.isFinite(Number(v))?'':(Number(v)>1?Number(v):Number(v)*100).toFixed(2)+'%';
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const has=v=>v!=null&&v!==''&&Number.isFinite(Number(v));
  const latest=(list,key)=>{const row=[...arr(list)].sort((a,b)=>dateOf(a).localeCompare(dateOf(b))).at(-1);return key?row?.[key]:row};
  const sum=(list,key)=>{const values=arr(list).map(r=>num(r?.[key])).filter(v=>v!=null);return values.length?values.reduce((a,b)=>a+b,0):null};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=v=>String(v??'').normalize('NFKC').trim().replace(/[\s\u3000]+/g,'').toLowerCase();
  const groupSum=(list,nameKey,valueKey)=>Object.values(arr(list).reduce((out,r)=>{const name=String(r?.[nameKey]??'').trim(),value=num(r?.[valueKey]);if(!name||value==null)return out;out[name]??={name,value:0};out[name].value+=value;return out},{}));
  const groupMetric=(list,nameKey,valueKey,exposureKey)=>Object.values(arr(list).reduce((out,r)=>{const name=String(r?.[nameKey]??'').trim(),value=num(r?.[valueKey]);if(!name||value==null)return out;out[name]??={name,value:0,exposure:0};out[name].value+=value;out[name].exposure+=num(r?.[exposureKey])||0;return out},{}));
  const shiftMonth=(month,offset)=>{if(!/^\d{4}-\d{2}$/.test(month))return '';const [year,monthNumber]=month.split('-').map(Number),d=new Date(Date.UTC(year,monthNumber-1+offset,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`};
  const monthDayIndex=date=>{const day=Number(String(date??'').slice(8,10));return Number.isFinite(day)&&day>0?day-1:null};
  const daysInMonth=month=>{if(!/^\d{4}-\d{2}$/.test(month))return 0;const [year,monthNumber]=month.split('-').map(Number);return new Date(Date.UTC(year,monthNumber,0)).getUTCDate()};
  const comparisonRow=(rows,month,offset)=>{const candidates=arr(rows).filter(r=>dateOf(r).slice(0,7)===month&&dateOf(r));if(!candidates.length)return null;if(offset==null)return candidates.sort((a,b)=>dateOf(a).localeCompare(dateOf(b))).at(-1)||null;return candidates.find(r=>monthDayIndex(dateOf(r))===offset)||null};
  const sumNewToOffset=(rows,offset)=>{const values=arr(rows).filter(r=>offset==null||monthDayIndex(dateOf(r))<=offset).map(r=>num(r?.new_device)).filter(v=>v!=null);return values.length?values.reduce((a,b)=>a+b,0):null};
  const changeText=(value,base,label)=>{if(!has(base))return `${label}待接入`;if(Math.abs(base)<Number.EPSILON)return value===base?`${label}持平`:`${label}基准为0，无法计算`;const delta=(value-base)/Math.abs(base);return delta===0?`${label}持平`:`${label}${delta>0?'增长':'下降'}${Math.abs(delta*100).toFixed(2)}%`};
  const metricValueAtOffset=(rows,month,key,offset)=>{const candidates=arr(rows).filter(r=>dateOf(r).slice(0,7)===month&&dateOf(r));if(!candidates.length)return null;const target=offset==null?candidates.map(dateOf).sort().at(-1):candidates.map(dateOf).find(d=>monthDayIndex(d)===offset);if(!target)return null;const row=candidates.filter(r=>dateOf(r)===target).at(-1);return num(row?.[key]??row?.['全部']??row?.['安卓'])};
  function hotFinalName(row,mapping){
    if(typeof hotDramaName==='function'){const resolved=hotDramaName(row);if(resolved&&resolved!=='--')return resolved}
    const raw=String(row?.title??row?.['搜索词']??row?.keyword??'').trim();
    const hit=arr(mapping).find(x=>normalize(x.normalized_keyword??x.keyword)===normalize(raw)&&String(x.status??'active')!=='inactive');
    return hit?.drama_name||row?.drama_name||row?.['剧名']||raw||'';
  }
  // Keep one point per natural day. The explicit all-client row is the board
  // result and must not be added to its client rows a second time.
  function dailyByDate(rows){
    const groups=new Map();arr(rows).forEach(r=>{const d=dateOf(r);if(d){const list=groups.get(d)||[];list.push(r);groups.set(d,list)}});
    return [...groups].map(([date,list])=>{
      const total=list.find(r=>['全部','all','ALL'].includes(String(r?.client??r?.client_type??'').trim()));
      if(total)return {...total,date,device_dau:num(total.device_dau),new_device:num(total.new_device),play_rate:num(total.play_rate)};
      const usable=list.filter(r=>num(r.device_dau)!=null||num(r.new_device)!=null);
      const dau=usable.reduce((v,r)=>v+(num(r.device_dau)||0),0),added=usable.reduce((v,r)=>v+(num(r.new_device)||0),0);
      const weighted=usable.reduce((v,r)=>v+(num(r.play_rate)||0)*(num(r.device_dau)||0),0);
      return {date,device_dau:usable.length?dau:null,new_device:usable.length?added:null,play_rate:dau?weighted/dau:null};
    }).sort((a,b)=>a.date.localeCompare(b.date));
  }
  function fallbackBars(el,items,max,percent){if(!el)return;el.innerHTML=items.map(x=>`<div class="report-bar-row"><span title="${esc(x.name)}">${esc(x.name)}</span><i style="width:${Math.max(1,(x.value/Math.max(max,1))*100).toFixed(1)}%"></i><b>${percent?x.value.toFixed(2)+'%':fmt(x.value)}</b></div>`).join('')||'<p class="report-chart-empty">本周期暂无完整数据。</p>'}
  function drawCharts(daily,top,genres){
    const trend=$('#report-trend-chart'),topEl=$('#report-top-chart'),genreEl=$('#report-genre-chart');
    if(!window.echarts){fallbackBars(topEl,top,Math.max(...top.map(x=>x.value),1),false);fallbackBars(genreEl,genres,Math.max(...genres.map(x=>x.value),1),true);return}
    if(trend){const c=echarts.getInstanceByDom(trend)||echarts.init(trend);c.clear();c.setOption({animation:false,tooltip:{trigger:'axis',valueFormatter:v=>fmt(v)},grid:{left:58,right:18,top:16,bottom:34,containLabel:true},xAxis:{type:'category',data:daily.map(r=>dateOf(r).slice(5))},yAxis:{type:'value',splitLine:{lineStyle:{color:'#edf0ee'}}},series:[{name:'设备DAU',type:'line',smooth:true,data:daily.map(r=>r.device_dau),lineStyle:{color:'#2f6f3e'},itemStyle:{color:'#2f6f3e'}}]});c.resize()}
    if(topEl){const c=echarts.getInstanceByDom(topEl)||echarts.init(topEl);c.clear();c.setOption({animation:false,tooltip:{trigger:'axis',axisPointer:{type:'shadow'},valueFormatter:v=>fmt(v)},grid:{left:148,right:72,top:12,bottom:20,containLabel:true},xAxis:{type:'value'},yAxis:{type:'category',inverse:true,data:top.map(x=>x.name),axisLabel:{width:130,overflow:'truncate'}},series:[{name:'播放VV',type:'bar',barMaxWidth:24,data:top.map(x=>x.value),itemStyle:{color:'#2f6f3e'},label:{show:true,position:'right',formatter:p=>fmt(p.value)}}]});c.resize()}
    if(genreEl){const c=echarts.getInstanceByDom(genreEl)||echarts.init(genreEl);c.clear();c.setOption({animation:false,tooltip:{trigger:'axis',valueFormatter:v=>Number(v).toFixed(2)+'%'},grid:{left:82,right:52,top:12,bottom:20,containLabel:true},xAxis:{type:'value',axisLabel:{formatter:'{value}%'}},yAxis:{type:'category',inverse:true,data:genres.map(x=>x.name)},series:[{name:'播放VV占比',type:'bar',data:genres.map(x=>x.value),itemStyle:{color:'#5d8b68'},label:{show:true,position:'right',formatter:p=>Number(p.value).toFixed(2)+'%'}}]});c.resize()}
  }
  function render(){
    const host=$('#page-report'),data=window.__dashboardState?.data||{};if(!host)return;
    if(!Object.prototype.hasOwnProperty.call(data,'genreRatioMapped')&&typeof window.__ensureGenreDisplayRows==='function'&&!host.dataset.genreLoading){
      host.dataset.genreLoading='1';
      const dataReady=typeof ensurePageData==='function'?ensurePageData('report'):Promise.resolve();
      Promise.resolve(dataReady).then(()=>window.__ensureGenreDisplayRows()).finally(()=>{host.dataset.genreLoading='';render()});
      return;
    }
    const dates=[...new Set(arr(data.daily).map(dateOf).filter(Boolean).map(d=>d.slice(0,7)))].sort();
    const month=host.dataset.month&&dates.includes(host.dataset.month)?host.dataset.month:(dates.at(-1)||'');host.dataset.month=month;
    const daily=dailyByDate(monthRows(data.daily,month)),last=daily.at(-1);
    const ranking=monthRows(data.ranking,month).filter(r=>String(r?.['榜单分类']||'')==='总榜');
    const top=groupSum(ranking,'内容名称','播放VV').sort((a,b)=>b.value-a.value).slice(0,10);
    // genreRatio is already the board's processed result. genreRatioMapped is
    // used only when the genre tab has already materialised the same result.
    const mappedGenres=arr(data.genreRatioMapped),genreSource=mappedGenres.length?mappedGenres:arr(data.genreRatio);
    const genreRows=monthRows(genreSource,month),genreAgg=groupSum(genreRows,'剧种','播放VV'),genreTotal=genreAgg.reduce((n,x)=>n+x.value,0);
    const genres=genreAgg.map(x=>({name:x.name,value:genreTotal?x.value/genreTotal*100:0})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,8);
    const hotMap=data.hotKeywordDramaMap||[],hotGroups=new Map();monthRows(data.hotSearch,month).forEach(r=>{const name=hotFinalName(r,hotMap),value=num(r?.search_uv??r?.['搜索UV']??r?.search_count);if(!name||value==null)return;const item=hotGroups.get(normalize(name))||{name,value:0};item.value+=value;hotGroups.set(normalize(name),item)});
    const hot=[...hotGroups.values()].sort((a,b)=>b.value-a.value).slice(0,10);
    const newHotGroups=new Map();monthRows(data.newHotSearch,month).forEach(r=>{const name=hotFinalName(r,hotMap),value=num(r?.search_uv??r?.['搜索UV']??r?.search_count);if(!name||value==null)return;const item=newHotGroups.get(normalize(name))||{name,value:0};item.value+=value;newHotGroups.set(normalize(name),item)});
    const newHot=[...newHotGroups.values()].sort((a,b)=>b.value-a.value).slice(0,5);
    const hotPlayOverlap=hot.filter(h=>top.some(t=>normalize(t.name)===normalize(h.name)));
    const durationValue=latest(monthRows(data.duration,month),'total_avg_watch_duration');
    const countRow=latest(monthRows(data.playCount,month)),countValue=countRow?.total_avg_play_count??countRow?.['全部']??countRow?.['安卓'];
    const trafficSource=monthRows(data.channelOps?.length?data.channelOps:data.traffic,month),trafficGroups=groupMetric(trafficSource,'channel','video_uv','tab_click_uv').sort((a,b)=>b.value-a.value).slice(0,3);
    const bannerTop=groupMetric(monthRows(data.bannerClick,month),'title','uv_click_count','uv_expose_count').sort((a,b)=>b.value-a.value).slice(0,3);
    const popupTop=groupMetric(monthRows(data.popupWindow,month),'name','play_uv','click_uv').sort((a,b)=>b.value-a.value).slice(0,3);
    const totalAdded=sum(daily,'new_device');
    const cards=[['月末设备 DAU',last?.device_dau],['月度新增设备',totalAdded],['月末播放率',last?.play_rate],['人均播放时长',durationValue],['人均播放次数',countValue]].filter(([,v])=>has(v));
    const summary=[has(last?.device_dau)&&`月末设备 DAU 为 ${fmt(last.device_dau)}。`,has(totalAdded)&&`本月累计新增设备 ${fmt(totalAdded)}。`,has(last?.play_rate)&&`月末播放率为 ${pct(last.play_rate)}。`,has(durationValue)&&`人均播放时长为 ${fmt(durationValue)} 分钟。`,has(countValue)&&`人均播放次数为 ${fmt(countValue)}。`].filter(Boolean).slice(0,5);
    const previousMonth=shiftMonth(month,-1),dayOffset=monthDayIndex(last?.date),completeMonth=dayOffset===daysInMonth(month)-1,comparisonOffset=completeMonth?null:dayOffset;
    const previousDaily=dailyByDate(monthRows(data.daily,previousMonth));
    const previousDailyRow=comparisonRow(previousDaily,previousMonth,comparisonOffset),previousAdded=sumNewToOffset(previousDaily,comparisonOffset);
    const durationDate=monthRows(data.duration,month).map(dateOf).filter(Boolean).sort().at(-1),countDate=monthRows(data.playCount,month).map(dateOf).filter(Boolean).sort().at(-1);
    const durationOffset=monthDayIndex(durationDate),countOffset=monthDayIndex(countDate),durationPrevious=metricValueAtOffset(data.duration,previousMonth,'total_avg_watch_duration',completeMonth?null:durationOffset),countPrevious=metricValueAtOffset(data.playCount,previousMonth,'total_avg_play_count',completeMonth?null:countOffset);
    const comparisonLabel=completeMonth?'环比':'环比（较上月同期）';
    const withChanges=(prefix,value,previous,formatter=fmt)=>has(value)?`${prefix}${formatter(value)}，${changeText(value,previous,comparisonLabel)}。`:'';
    const summaryWithChanges=[withChanges('月末设备 DAU 为 ',last?.device_dau,previousDailyRow?.device_dau),withChanges('本月累计新增设备 ',totalAdded,previousAdded),withChanges('月末播放率为 ',last?.play_rate,previousDailyRow?.play_rate,pct),withChanges('人均播放时长为 ',durationValue,durationPrevious,v=>`${fmt(v)} 分钟`),withChanges('人均播放次数为 ',countValue,countPrevious)].filter(Boolean).slice(0,5);
    const facts=[top[0]&&`热播内容中，${esc(top[0].name)} 的报告周期播放 VV 最高（${fmt(top[0].value)}）。`,hot[0]&&`热搜内容中，${esc(hot[0].name)} 的搜索 UV 最高（${fmt(hot[0].value)}）。`,genres[0]&&`剧种播放结构中，${esc(genres[0].name)} 占比最高（${genres[0].value.toFixed(2)}%）。`,hotPlayOverlap.length&&`热搜与热播 Top10 有 ${hotPlayOverlap.length} 个最终剧名重合。`,bannerTop[0]&&`Banner 点击贡献最高内容为 ${esc(bannerTop[0].name)}（点击 UV ${fmt(bannerTop[0].value)}）。`,popupTop[0]&&`弹窗有效播放贡献最高组件为 ${esc(popupTop[0].name)}（有效播放 UV ${fmt(popupTop[0].value)}）。`].filter(Boolean).slice(0,5);
    host.innerHTML=`<div class="report-toolbar"><label>报告月份<select id="report-month">${dates.map(d=>`<option value="${d}" ${d===month?'selected':''}>${d}</option>`).join('')}</select></label><button type="button" class="report-export" id="report-export">导出 PDF</button></div><article class="report-sheet"><header class="report-lead"><div class="report-kicker">VIDEO OPERATIONS REPORT</div><h2>${esc(month||'运营')}运营月报</h2><p>本报告只呈现看板最终数据层中已核验的事实与变化，不输出运营动作建议。</p></header>
      <section class="report-section"><h3>一、月度整体表现</h3><p class="report-intro">本月大盘指标按自然日整理；同一天只保留看板“全部”口径的一条记录。</p>${summaryWithChanges.length?`<ul class="report-summary-text">${summaryWithChanges.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<div id="report-trend-chart" class="report-chart" aria-label="设备 DAU 日趋势"></div></section>
      <section class="report-section"><h3>二、内容侧变化</h3><p class="report-intro">哪些内容贡献了本月播放规模，内容结构如何分布？</p>${top.length?'<h4>热播内容 Top10 · 报告周期播放 VV</h4><div id="report-top-chart" class="report-chart report-chart-top" aria-label="热播内容 Top10 横向条形图"></div>':''}${genres.length?'<h4>剧种结构 · 报告周期播放 VV 占比</h4><div id="report-genre-chart" class="report-chart report-chart-small" aria-label="剧种播放占比横向条形图"></div>':''}</section>
      <section class="report-section"><h3>三、用户主动需求</h3><p class="report-intro">热搜结果沿用看板最终剧名映射并按最终剧名聚合，同一剧名在本周期只出现一次。</p>${hot.length?`<ol class="report-list report-hot-list">${hot.map(r=>`<li>${esc(r.name)}：搜索 UV ${fmt(r.value)}</li>`).join('')}</ol>`:'<p class="report-chart-empty">本周期暂无完整热搜数据。</p>'}${newHot.length?`<p class="report-intro">新用户热搜靠前：${newHot.slice(0,3).map(r=>esc(r.name)).join('、')}。</p>`:''}${hotPlayOverlap.length?`<p class="report-intro">热搜与热播 Top10 重合 ${hotPlayOverlap.length} 个最终剧名：${hotPlayOverlap.slice(0,3).map(r=>esc(r.name)).join('、')}。</p>`:''}</section>
      <section class="report-section"><h3>四、运营资源承接</h3><p class="report-intro">只呈现看板最终结果中具备明确业务指标的资源位内容。</p>${trafficGroups.length?`<div class="report-resource-block"><h4>首页频道有效播放表现</h4>${trafficGroups.map(x=>`<p>${esc(x.name)}：有效看剧 UV ${fmt(x.value)}${x.exposure?`，频道 Tab 点击 UV ${fmt(x.exposure)}`:''}</p>`).join('')}</div>`:''}${bannerTop.length?`<div class="report-resource-block"><h4>Banner 点击贡献 Top3</h4>${bannerTop.map(x=>`<p>${esc(x.name)}：点击 UV ${fmt(x.value)}${x.exposure?`，CTR ${pct(x.value/x.exposure)}`:''}</p>`).join('')}</div>`:''}${popupTop.length?`<div class="report-resource-block"><h4>弹窗有效播放贡献 Top3</h4>${popupTop.map(x=>`<p>${esc(x.name)}：有效播放 UV ${fmt(x.value)}</p>`).join('')}</div>`:''}${!trafficGroups.length&&!bannerTop.length&&!popupTop.length?'<p class="report-chart-empty">本周期暂无具备明确月度运营价值的资源位结果。</p>':''}</section>
      <section class="report-section"><h3>五、本月重点变化与关注项</h3><ul class="report-list">${facts.map(x=>`<li>${x}</li>`).join('')||'<li>本周期暂无达到展示条件的重点事实。</li>'}</ul></section><p class="report-note">月报与看板复用同一最终数据层；不读取页面 DOM 临时状态，不绕过看板映射、人工修正和业务规则重新计算。来源映射：大盘=日报最终快照；热播=总榜；热搜=看板剧名映射；剧种=看板剧种结果；资源位=频道、Banner、弹窗最终结果。</p></article>`;
    window.__reportChartData={daily,top,genres};
    window.__reportPdfModel={month,summary,cards,daily,top,genres,hot,newHot,hotPlayOverlap,trafficGroups,bannerTop,popupTop,facts};
    drawCharts(daily,top,genres);
    $('#report-month')?.addEventListener('change',e=>{host.dataset.month=e.target.value;render()});
    $('#report-export')?.addEventListener('click',()=>window.__exportReportPdf?.());
  }

  // Draw a print-safe report directly on clean canvases. This avoids reading
  // ECharts' possibly tainted canvas while keeping the same final data arrays.
  function pdfPages(model){
    if(!model)throw Error('月报尚未渲染');
    const W=1190,H=1684,M=92,pages=[];let canvas,ctx,y;
    const page=()=>{canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#171b1c';y=M;pages.push(canvas)};
    const font=(size,weight=400)=>{ctx.font=weight+' '+size+'px Arial,"Microsoft YaHei",sans-serif';ctx.fillStyle='#20252a'};
    const wrap=(value,max)=>{font(22);const out=[];let line='';for(const ch of String(value)){if(ctx.measureText(line+ch).width>max&&line){out.push(line);line=ch}else line+=ch}if(line)out.push(line);return out};
    const text=(value,max=W-M*2,lh=34)=>{wrap(value,max).forEach(line=>{if(y>H-M-lh)page();ctx.fillText(line,M,y);y+=lh})};
    const heading=value=>{if(y>H-M-70)page();font(30,700);ctx.fillText(value,M,y);y+=48;ctx.strokeStyle='#d8ddda';ctx.beginPath();ctx.moveTo(M,y-18);ctx.lineTo(W-M,y-18);ctx.stroke();font(22)};
    const chartTitle=value=>{if(y>H-M-50)page();font(20,700);ctx.fillText(value,M,y);y+=30};
    page();font(42,700);ctx.fillText((model.month||'')+'运营月报',M,y);y+=42;font(17);ctx.fillStyle='#69716f';ctx.fillText('本报告只呈现看板最终数据层中已核验的事实与变化，不输出运营动作建议。',M,y);y+=34;ctx.strokeStyle='#20252a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(M,y);ctx.lineTo(W-M,y);ctx.stroke();y+=48;
    heading('一、月度整体表现');text('本月大盘指标按自然日整理；同一天只保留看板“全部”口径的一条记录。');model.summary.forEach(s=>text('• '+s));
    if(model.cards&&model.cards.length){const gap=12,cw=(W-M*2-gap*(model.cards.length-1))/model.cards.length;model.cards.forEach((item,i)=>{const x=M+i*(cw+gap);ctx.strokeStyle='#e4e7e4';ctx.strokeRect(x,y-4,cw,86);font(16);ctx.fillStyle='#6f7874';ctx.fillText(item[0],x+14,y+20);font(25,700);const value=item[0]==='月末播放率'?pct(item[1]):item[0]==='人均播放时长'?fmt(item[1])+' 分钟':fmt(item[1]);ctx.fillText(value,x+14,y+57)});y+=116}
    chartTitle('设备 DAU 日趋势');const chartH=190,x0=M+30,x1=W-M-20,y0=y+chartH-28,y1=y+16;ctx.strokeStyle='#d8ddda';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.moveTo(x0,y1);ctx.lineTo(x0,y0);ctx.stroke();const vals=(model.daily||[]).map(r=>Number(r.device_dau)||0),max=Math.max(...vals,1),points=vals.map((v,i)=>[x0+(x1-x0)*(vals.length<=1?0:i/(vals.length-1)),y0-(v/max)*(chartH-28)]);ctx.strokeStyle='#2f6f3e';ctx.lineWidth=3;ctx.beginPath();points.forEach((point,i)=>i?ctx.lineTo(point[0],point[1]):ctx.moveTo(point[0],point[1]));ctx.stroke();points.forEach(point=>{ctx.fillStyle='#2f6f3e';ctx.beginPath();ctx.arc(point[0],point[1],4,0,Math.PI*2);ctx.fill()});y+=chartH+30;
    heading('二、内容侧变化');text('哪些内容贡献了本月播放规模，内容结构如何分布？');
    if(model.top&&model.top.length){chartTitle('热播内容 Top10 · 报告周期播放 VV');const maxTop=Math.max(...model.top.map(x=>x.value),1);model.top.forEach((x,i)=>{const yy=y+i*27;font(16);ctx.fillText((i+1)+'. '+String(x.name).slice(0,24),M,yy);ctx.fillStyle='#5d8b68';ctx.fillRect(M+280,yy-15,360*(x.value/maxTop),12);ctx.fillStyle='#3f4945';ctx.fillText(fmt(x.value),M+660,yy)});y+=model.top.length*27+28}
    if(model.genres&&model.genres.length){chartTitle('剧种结构 · 报告周期播放 VV 占比');const maxGenre=Math.max(...model.genres.map(x=>x.value),1);model.genres.forEach((x,i)=>{const yy=y+i*27;font(16);ctx.fillStyle='#59635f';ctx.fillText(String(x.name),M,yy);ctx.fillStyle='#5d8b68';ctx.fillRect(M+140,yy-15,500*(x.value/maxGenre),12);ctx.fillStyle='#3f4945';ctx.fillText(x.value.toFixed(2)+'%',M+660,yy)});y+=model.genres.length*27+30}
    heading('三、用户主动需求');text('热搜结果沿用看板最终剧名映射并按最终剧名聚合，同一剧名在本周期只出现一次。');(model.hot||[]).forEach((x,i)=>text((i+1)+'. '+x.name+'：搜索 UV '+fmt(x.value)));if(model.newHot&&model.newHot.length)text('新用户热搜靠前：'+model.newHot.slice(0,3).map(x=>x.name).join('、')+'。');if(model.hotPlayOverlap&&model.hotPlayOverlap.length)text('热搜与热播 Top10 重合 '+model.hotPlayOverlap.length+' 个最终剧名。');
    heading('四、运营资源承接');text('只呈现看板最终结果中具备明确业务指标的资源位内容。');if(model.trafficGroups&&model.trafficGroups.length){chartTitle('首页频道有效播放表现');model.trafficGroups.forEach(x=>text(x.name+'：有效看剧 UV '+fmt(x.value)+(x.exposure?'，频道 Tab 点击 UV '+fmt(x.exposure):'')))}if(model.bannerTop&&model.bannerTop.length){chartTitle('Banner 点击贡献 Top3');model.bannerTop.forEach(x=>text(x.name+'：点击 UV '+fmt(x.value)+(x.exposure?'，CTR '+pct(x.value/x.exposure):'')))}if(model.popupTop&&model.popupTop.length){chartTitle('弹窗有效播放贡献 Top3');model.popupTop.forEach(x=>text(x.name+'：有效播放 UV '+fmt(x.value)))}
    heading('五、本月重点变化与关注项');(model.facts&&model.facts.length?model.facts:['本周期暂无达到展示条件的重点事实。']).forEach(x=>text('• '+x));font(16);ctx.fillStyle='#818a86';text('月报与看板复用同一最终数据层；来源映射为日报快照、总榜、看板剧名映射、剧种结果及频道/Banner/弹窗最终结果。',W-M*2,26);
    return pages.map(c=>{const data=c.toDataURL('image/jpeg',.92).split(',')[1],raw=atob(data),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return {bytes,width:c.width,height:c.height}});
  }
  function makePdf(pages){const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;const push=v=>{const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);length+=b.length},obj=(id,body,stream)=>{offsets[id]=length;push(`${id} 0 obj\n${body}`);if(stream){push('\nstream\n');push(stream);push('\nendstream')}push('\nendobj\n')};push('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');const pageIds=[],imageIds=[];let next=3;pages.forEach(()=>{pageIds.push(next++);imageIds.push(next++);});const contentIds=pages.map(()=>next++);const kids=pageIds.map(id=>`${id} 0 R`).join(' ');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);pages.forEach((p,i)=>{const w=595,h=842;obj(pageIds[i],`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`);const content=`q\n${w} 0 0 ${h} 0 0 cm\n/Im${i} Do\nQ\n`;obj(contentIds[i],`<< /Length ${enc.encode(content).length} >>`,content);obj(imageIds[i],`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>`,p.bytes)});const xref=length;push(`xref\n0 ${next}\n0000000000 65535 f \n`);for(let i=1;i<next;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);push(`trailer\n<< /Size ${next} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);const out=new Uint8Array(length);let at=0;chunks.forEach(b=>{out.set(b,at);at+=b.length});return out}

  window.__exportReportPdf=async()=>{const button=$('#report-export');if(button){button.disabled=true;button.textContent='正在生成 PDF…'}try{const pages=pdfPages(window.__reportPdfModel);const blob=new Blob([makePdf(pages)],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='运营月报-'+($('#report-month')?.value||'当前')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}catch(error){console.error('[report] pdf export failed',error);if(button)button.dataset.error=String(error?.message||'未知错误')}finally{if(button){button.disabled=false;button.textContent='导出 PDF'}}};
  window.__renderReport=render;document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="report"]'))setTimeout(render,60)});
  let renderSignature='';
  const wait=setInterval(()=>{const state=window.__dashboardState;if(!state||state.page!=='report')return;const signature=Object.keys(state.data||{}).sort().join('|');if(signature!==renderSignature){renderSignature=signature;render()}},300);
})();

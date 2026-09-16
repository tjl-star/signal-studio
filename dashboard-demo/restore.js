(function(){
  const data=window.__REAL_DATA__?.core_dashboard;
  const fmt=n=>n==null?'暂无真实快照数据':Number(n).toLocaleString('zh-CN');
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  function renderLegacy(){
    if(!data)return;
    const client='android'; const k=data.kpis?.by_client?.[client];
    set('legacy-dau',fmt(k?.device_dau?.value)); set('legacy-new',fmt(k?.new_device?.value));
    set('legacy-dau-current',fmt(k?.device_dau?.value)); set('legacy-new-current',fmt(k?.new_device?.value));
    const trend=(data.trend_30d||[]).filter(r=>r.client_type===client||r.client_type==null).slice(-30);
    if(window.echarts){
      const common={grid:{left:55,right:16,top:18,bottom:30},xAxis:{type:'category',data:trend.map(r=>r.date.slice(5)),axisLabel:{color:'#8190a4'}},yAxis:{type:'value',axisLabel:{color:'#8190a4'},splitLine:{lineStyle:{color:'#edf1f6'}}},tooltip:{trigger:'axis'}};
      const a=echarts.init(document.getElementById('legacy-dau-chart'));a.setOption({...common,series:[{type:'line',smooth:true,data:trend.map(r=>r.device_dau),symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#2f76e8'},areaStyle:{color:'rgba(47,118,232,.08)'}}]});
      const b=echarts.init(document.getElementById('legacy-new-chart'));b.setOption({...common,series:[{type:'line',smooth:true,data:trend.map(r=>r.new_device),symbol:'circle',symbolSize:5,lineStyle:{width:3,color:'#1d9c72'},areaStyle:{color:'rgba(29,156,114,.08)'}}]});
    }
  }
  document.querySelectorAll('.sidebar nav a').forEach(link=>link.addEventListener('click',function(){
    document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.remove('active'));this.classList.add('active');
    const isFunnel=this.dataset.view==='funnel';document.body.classList.toggle('legacy-active',!isFunnel);document.body.classList.toggle('home-active',isFunnel);
    document.querySelector('.topbar h1').textContent=isFunnel?'首页流量与转化漏斗':'视频产品运营驾驶舱';
    window.scrollTo({top:0,behavior:'smooth'});
    if(!isFunnel)renderLegacy();
  }));
  renderLegacy();
})();

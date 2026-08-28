(function(){
  window.TrendChart={
    render:function(id,rows,key,name,color,percent){
      var el=document.querySelector(id);if(!el||!window.echarts)return;
      var data=(rows||[]).filter(function(r){return r[key]!==null&&r[key]!==undefined&&r[key]!==''});
      if(!data.length){el.innerHTML=window.EmptyState.html('当前日期范围暂无数据');return;}
      var chart=echarts.getInstanceByDom(el)||echarts.init(el);
      chart.setOption({animation:false,color:[color],grid:{left:58,right:18,top:28,bottom:38,containLabel:true},legend:{show:false},tooltip:{trigger:'axis',valueFormatter:function(v){return percent?window.formatPercent(v):window.formatMetric(v)}},xAxis:{type:'category',data:data.map(function(r){return String(r.date).slice(5)}),axisLabel:{color:'#8392a7'}},yAxis:{type:'value',axisLabel:{color:'#8392a7',formatter:function(v){return percent?(Math.round(v*100)+'%'):window.formatMetric(v)}},splitLine:{lineStyle:{color:'#edf1f6'}}},series:[{name:name,type:'line',smooth:.2,symbol:'circle',symbolSize:4,data:data.map(function(r){return r[key]}),lineStyle:{width:3},areaStyle:{color:color+'18'}}]});chart.resize();
    }
  };
})();

(function(){
  window.MetricCard={
    render:function(label,value,sub,delta,unit){
      var trend=delta==null?'':('<span class="metric-trend '+(delta<0?'is-negative':'')+'">'+(delta>0?'↑':'↓')+' '+Math.abs(delta).toFixed(1)+'%</span>');
      return '<article class="metric-card"><span class="metric-label">'+label+'</span><div class="metric-value"><strong>'+window.formatMetric(value)+'</strong>'+(unit?'<em>'+unit+'</em>':'')+'</div>'+trend+'<small class="metric-note">'+(sub||'')+'</small></article>';
    }
  };
})();

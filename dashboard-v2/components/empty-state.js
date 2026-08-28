(function(){
  window.EmptyState={
    html:function(reason){return '<div class="empty-state"><span class="empty-state-mark">--</span><strong>'+String(reason||'暂无真实数据')+'</strong></div>'}
  };
})();

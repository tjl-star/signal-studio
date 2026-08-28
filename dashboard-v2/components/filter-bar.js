(function(){
  window.FilterBar={
    init:function(){
      var help=document.querySelector('[data-help]');if(help)help.addEventListener('click',function(){var note=document.querySelector('[data-help-note]');if(note)note.hidden=!note.hidden});
    }
  };
})();

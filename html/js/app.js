$(function() { 
  var dataURL = '../scripts/traffic.js/data/json';
  var viz;

  function update(resp) {
    if(!viz) {
      viz =  new Vizceral.default($('#vizceral')[0]);
      if(resp.styles) viz.updateStyles(resp.styles);
      if(resp.definitions) viz.updateDefinitions(resp.definitions);
      if(resp.data) viz.updateData(resp.data);
      viz.setView();
      viz.animate();
    } else {
      if(resp.styles) viz.updateStyles(resp.styles);
      if(resp.definitions) viz.updateDefinitions(resp.definitions);
      if(resp.data) viz.updateData(resp.data);
    }
  }

  function poll() {
    $.ajax({
      url: dataURL,
      success: function(resp) {
        update(resp);
        if(resp.poll) setTimeout(poll, resp.poll * 1000);
      },
      error: function(result,status,errorThrown) {
        setTimeout(poll,10000);
      },
      timeout: 60000
    });
  }

  poll();
  $(document).keyup(function(e) {
    if(viz && e.keyCode == 27) viz.zoomOutViewLevel();
  });
});

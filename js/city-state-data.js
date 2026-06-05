(function(){
  var d;
  window.__onCityDataReady = function(cb){ if(window.__STATES__){cb();}else{d?d.push(cb):(d=[cb]);} };
  var x=new XMLHttpRequest();
  x.open('GET','/data/city-state-data.json',true);
  x.onload=function(){if(x.status===200){var r=JSON.parse(x.responseText);window.__STATES__=r.states;window.__CITIES__=r.cities;if(d){d.forEach(function(fn){fn();});d=null;}}};
  x.send();
})();
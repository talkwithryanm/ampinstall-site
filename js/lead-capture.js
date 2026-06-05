// Lead capture - saves to ampinstall API server
const LEAD_WEBHOOK = '/api/lead';

function OPEN_LEAD(){var m=document.getElementById('leadModal');if(m)m.classList.add('active')}
function CLOSE_LEAD(){var m=document.getElementById('leadModal');if(m)m.classList.remove('active')}

document.addEventListener('DOMContentLoaded',function(){
  var overlay=document.getElementById('leadModal');
  if(overlay)overlay.addEventListener('click',function(e){if(e.target===this)CLOSE_LEAD()});
  
  var shown=sessionStorage.getItem('lead_shown');
  if(!shown&&(window.location.pathname.includes('/states/')||window.location.pathname.includes('/installers/')||window.location.pathname.includes('/blog/'))){
    setTimeout(function(){OPEN_LEAD()},30000);
  }
});

function SUBMIT_LEAD(e){
  e.preventDefault();
  var form=e.target;
  var data={};
  for(var i=0;i<form.elements.length;i++){
    var el=form.elements[i];
    if(el.name)data[el.name]=el.value;
  }
  data.timestamp=new Date().toISOString();
  data.page=window.location.pathname;
  
  // Submit to API server
  fetch(LEAD_WEBHOOK,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  }).catch(function(){
    // Fallback: save to session storage if API is down
    try{sessionStorage.setItem('lead_backup',JSON.stringify(data))}catch(e){}
  });
  // Also fire-and-forget as beacon fallback
  try{navigator.sendBeacon(LEAD_WEBHOOK,JSON.stringify(data))}catch(e){}
  
  document.getElementById('leadFormContainer').style.display='none';
  document.getElementById('leadSuccessContainer').style.display='block';
  sessionStorage.setItem('lead_shown','1');
  
  setTimeout(function(){CLOSE_LEAD()},3000);
  return false;
}
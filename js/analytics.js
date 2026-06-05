// Lightweight analytics for ampinstall.com
(function(){
  var page = window.location.pathname;
  var ref = document.referrer;
  
  // Skip tracking bots (basic check)
  if(navigator.userAgent && /bot|crawl|spider|scrape|googlebot|bingbot/i.test(navigator.userAgent)) return;
  
  // 1. Tracking pixel (works everywhere, no CORS issues)
  var img = new Image();
  img.src = '/amp-track.gif?r=' + encodeURIComponent(ref) + '&p=' + encodeURIComponent(page);
  img.style.display = 'none';
  document.body.appendChild(img);
  
  // 2. Beacon fallback (async, no page load impact)
  try {
    navigator.sendBeacon('/api/track', JSON.stringify({page: page, ref: ref}));
  } catch(e){}
})();

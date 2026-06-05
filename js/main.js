// Mobile nav toggle
function toggleNav(){
  document.getElementById('mobileNav').classList.toggle('open');
  document.getElementById('navOverlay').classList.toggle('active');
  document.getElementById('hamburgerBtn').classList.toggle('active');
  document.body.style.overflow=document.getElementById('mobileNav').classList.contains('open')?'hidden':'';
}

document.addEventListener('DOMContentLoaded',function(){
  // Close mobile nav on link click
  document.querySelectorAll('#mobileNav a').forEach(function(a){
    a.addEventListener('click',function(){if(window.innerWidth<=768)toggleNav()});
  });
  document.getElementById('hamburgerBtn').addEventListener('click',toggleNav);
  document.getElementById('navOverlay').addEventListener('click',toggleNav);
  var si=document.querySelector('.hero-search input');
  var sb=document.querySelector('.hero-search button');
  function doHeroSearch(){
    var q=si.value.trim();
    if(!q){window.location.href='/states/';return;}
    // ZIP code check (5 digits)
    if(/^\d{5}$/.test(q)){
      window.location.href='/tools/zip-search.html?zip='+q;
      return;
    }
    var lq=q.toLowerCase();
    var st=window.__STATES__||[];
    // Try exact state match first
    var bestState=null;
    var exactState=null;
    for(var i=0;i<st.length;i++){
      var slug=st[i][0],full=st[i][1].toLowerCase(),abbr=st[i][2].toLowerCase();
      if(full===lq||slug===lq||abbr===lq){exactState=st[i];break;}
      if(full.indexOf(lq)>=0||slug.indexOf(lq)>=0){if(!bestState)bestState=st[i];}
    }
    if(exactState){
      window.location.href='/states/'+exactState[0]+'/';
      return;
    }
    // Try city match — prefer exact match
    var ct=window.__CITIES__||[];
    var exactMatches=[];
    var fuzzyMatches=[];
    for(var i=0;i<ct.length;i++){
      var cname=ct[i][0].toLowerCase();
      if(cname===lq){
        exactMatches.push(ct[i]);
      }else if(cname.indexOf(lq)>=0||lq.indexOf(cname)>=0){
        fuzzyMatches.push(ct[i]);
      }
    }
    // If one exact city match, go straight to that city page
    if(exactMatches.length===1){
      window.location.href='/states/'+exactMatches[0][1]+'/'+exactMatches[0][2]+'.html';
      return;
    }
    // If multiple exact matches (e.g. "Los Angeles" in CA and TX), go to state page of highest-population one
    if(exactMatches.length>1){
      window.location.href='/states/'+exactMatches[0][1]+'/';
      return;
    }
    // Fuzzy matches
    if(fuzzyMatches.length===1){
      window.location.href='/states/'+fuzzyMatches[0][1]+'/'+fuzzyMatches[0][2]+'.html';
      return;
    }else if(fuzzyMatches.length>1){
      window.location.href='/states/'+fuzzyMatches[0][1]+'/';
      return;
    }
    // State partial match fallback
    if(bestState){
      window.location.href='/states/'+bestState[0]+'/';
      return;
    }
    // Nothing found — go to all states
    window.location.href='/states/';
  }
  if(si&&sb){
    sb.addEventListener('click',function(e){
      e.preventDefault();
      if(window.__STATES__&&window.__CITIES__){
        doHeroSearch();
      }else if(window.__onCityDataReady){
        window.__onCityDataReady(doHeroSearch);
      }else{
        setTimeout(doHeroSearch,1500);
      }
    });
    si.addEventListener('keypress',function(e){if(e.key==='Enter')sb.click()});
  }
});

function setFilterRating(btn){
  document.querySelectorAll('.fpill').forEach(function(p){p.classList.remove('active')});
  btn.classList.add('active');
  filterCards();
}
function getFilterRating(){
  var act=document.querySelector('.fpill.active');
  return act?parseFloat(act.getAttribute('data-rating'))||0:0;
}
function filterCards(){
  var grid=document.getElementById('installerGrid');
  if(!grid)return;
  var minRating=getFilterRating();
  var sortBy=document.getElementById('sortBy').value;
  var cards=Array.from(grid.children);

  // Filter
  cards.forEach(function(c){
    var badge=c.querySelector('.installer-rating-badge');
    var rating=badge?parseFloat(badge.textContent):0;
    c.style.display=rating>=minRating?'':'none';
  });

  // Sort
  var visible=cards.filter(function(c){return c.style.display!=='none'});
  visible.sort(function(a,b){
    if(sortBy==='rating'){
      var ra=parseFloat(a.querySelector('.installer-rating-badge')?.textContent||0);
      var rb=parseFloat(b.querySelector('.installer-rating-badge')?.textContent||0);
      return rb-ra;
    }else if(sortBy==='reviews'){
      var rva=parseInt(a.querySelector('.rating')?.textContent.match(/(\\d+)/)?.[1]||0);
      var rvb=parseInt(b.querySelector('.rating')?.textContent.match(/(\\d+)/)?.[1]||0);
      return rvb-rva;
    }else{ // name
      var na=a.querySelector('h3')?.textContent||'';
      var nb=b.querySelector('h3')?.textContent||'';
      return na.localeCompare(nb);
    }
  });
  visible.forEach(function(c){grid.appendChild(c)});
}

// Blog category filter
function filterBlog(cat){
  document.querySelectorAll('.blog-filter-pill').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.blog-filter-pill[data-cat="'+cat+'"]').forEach(function(p){p.classList.add('active')});
  document.querySelectorAll('.blog-article-card').forEach(function(c){
    var cc=c.getAttribute('data-cat');
    c.style.display=(cat==='All'||cc===cat)?'':'none';
  });
}

// Blog reading progress
if(typeof window !== 'undefined'){
  window.addEventListener('scroll',function(){
    var pb=document.getElementById('bProgress');
    if(!pb)return;
    var st=window.scrollY||document.documentElement.scrollTop;
    var sb=document.documentElement.scrollHeight-window.innerHeight;
    var pct=sb>0?(st/sb)*100:0;
    pb.style.width=Math.min(pct,100)+'%';
  });
}
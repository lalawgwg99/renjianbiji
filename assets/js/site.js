
(function(){
  "use strict";
  /* mobile nav */
  var t = document.getElementById('nav-toggle'), m = document.getElementById('mobile-nav');
  if (t && m) t.addEventListener('click', function(){
    var open = m.classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* old #art-<slug> anchors (old sitemap / old links) -> new article page */
  if (location.hash && location.hash.indexOf('#art-') === 0) {
    var slug = location.hash.slice(5).replace(/[^a-z0-9-]/g, '');
    if (slug && !document.getElementById('art-' + slug)) {
      var lang = document.documentElement.lang === 'en' ? '/en' : '';
      location.replace(lang + '/articles/' + slug + '/');
    }
  }
  /* newsletter: not wired yet - say so, never fake success */
  var nf = document.querySelector('.news-form');
  if (nf) nf.addEventListener('submit', function(ev){
    ev.preventDefault();
    var note = nf.parentElement.querySelector('.news-note');
    if (note) note.textContent = nf.getAttribute('data-pending');
  });
  /* ---------- article page ---------- */
  var bar = document.getElementById('progress');
  var topBtn = document.getElementById('to-top');
  function onScroll(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (topBtn) topBtn.classList.toggle('show', h.scrollTop > 600);
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  if (topBtn) topBtn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  /* font size */
  var body = document.querySelector('.article-body');
  var saved = null;
  try { saved = localStorage.getItem('rjb-font'); } catch(e){}
  if (body && saved) body.style.setProperty('--art-size', saved + 'px');
  var cur = saved ? parseInt(saved, 10) : 19;
  function setSize(n){
    cur = Math.min(23, Math.max(16, n));
    if (body) body.style.setProperty('--art-size', cur + 'px');
    try { localStorage.setItem('rjb-font', String(cur)); } catch(e){}
  }
  var fsDown = document.getElementById('font-down'), fsUp = document.getElementById('font-up');
  if (fsDown) fsDown.addEventListener('click', function(){ setSize(cur - 1); });
  if (fsUp) fsUp.addEventListener('click', function(){ setSize(cur + 1); });
  /* dark reading mode */
  var darkBtn = document.getElementById('dark-toggle');
  var dark = null;
  try { dark = localStorage.getItem('rjb-dark'); } catch(e){}
  if (dark === '1') { document.body.classList.add('dark-read'); if (darkBtn) darkBtn.setAttribute('aria-pressed','true'); }
  if (darkBtn) darkBtn.addEventListener('click', function(){
    var on = document.body.classList.toggle('dark-read');
    darkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem('rjb-dark', on ? '1' : '0'); } catch(e){}
  });
  /* bookmark */
  var bm = document.getElementById('bookmark');
  if (bm) {
    var key = 'rjb-bookmark-' + bm.getAttribute('data-slug');
    var marked = null;
    try { marked = localStorage.getItem(key); } catch(e){}
    if (marked === '1') { bm.setAttribute('aria-pressed','true'); bm.textContent = bm.getAttribute('data-on'); }
    bm.addEventListener('click', function(){
      var on = bm.getAttribute('aria-pressed') !== 'true';
      bm.setAttribute('aria-pressed', on ? 'true' : 'false');
      bm.textContent = on ? bm.getAttribute('data-on') : bm.getAttribute('data-off');
      try { localStorage.setItem(key, on ? '1' : '0'); } catch(e){}
    });
  }
  /* copy link */
  var cp = document.getElementById('copy-link');
  if (cp) cp.addEventListener('click', function(){
    var url = location.href.split('#')[0];
    function done(){ cp.textContent = cp.getAttribute('data-done'); setTimeout(function(){ cp.textContent = cp.getAttribute('data-label'); }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(e){} document.body.removeChild(ta); done(); }
  });
  /* ---------- search page ---------- */
  var sq = document.getElementById('search-q'), sr = document.getElementById('search-results');
  if (sq && sr) {
    var data = null, lang = document.documentElement.lang === 'en' ? 'en' : 'zh';
    function render(q){
      q = (q || '').trim().toLowerCase();
      if (!q || !data) { sr.innerHTML = ''; return; }
      var hits = data.filter(function(it){
        var hay = (it.title + ' ' + it.title_en + ' ' + it.subtitle + ' ' + it.subtitle_en + ' ' + it.excerpt + ' ' + (it.excerpt_en || '') + ' ' + it.cat + ' ' + it.cat_en + ' ' + (it.tags || '')).toLowerCase();
        return q.split(/\s+/).every(function(w){ return hay.indexOf(w) !== -1; });
      }).slice(0, 20);
      if (!hits.length) { sr.innerHTML = '<li class="search-hint">' + sr.getAttribute('data-empty') + '</li>'; return; }
      sr.innerHTML = hits.map(function(it){
        var u = lang === 'en' ? it.url_en : it.url;
        var ti = lang === 'en' ? it.title_en : it.title;
        var sub = lang === 'en' ? it.subtitle_en : it.subtitle;
        var cat = lang === 'en' ? it.cat_en : it.cat;
        return '<li><h3><a href="' + u + '">' + ti + '</a></h3><p>' + sub + '</p><p class="art-meta"><span class="cat">' + cat + '</span> · ' + it.date + '</p></li>';
      }).join('');
    }
    fetch('/search.json').then(function(r){ return r.json(); }).then(function(j){ data = j; render(sq.value); });
    var deb = null;
    sq.addEventListener('input', function(){ clearTimeout(deb); deb = setTimeout(function(){ render(sq.value); }, 150); });
    var params = new URLSearchParams(location.search);
    if (params.get('q')) { sq.value = params.get('q'); }
  }
})();

  var toc = document.querySelector('.toc');
  if (toc && window.innerWidth >= 1100) toc.setAttribute('open', '');

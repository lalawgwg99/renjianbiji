
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
    updateProgLabel();
  }
  /* progress label: current chapter + minutes left. Chapters are the h2[id] inside
     .article-body; prologue/epilogue by id suffix (-pro / -epi / -end) or chno text,
     numbered chapters count in DOM order (ids vary: 'zh-1' vs '<slug>-zh-1'). */
  var progLabel = document.getElementById('progress-label');
  var progLang = document.documentElement.lang === 'en' ? 'en' : 'zh';
  var progMin = progLabel ? parseInt(progLabel.getAttribute('data-minutes'), 10) || 0 : 0;
  var progHeads = [];
  var progBody = document.querySelector('.article-body');
  if (progBody) progHeads = Array.prototype.slice.call(progBody.querySelectorAll('h2[id]'));
  var progNums = [];
  (function(){
    var c = 0;
    progHeads.forEach(function(h){
      var chno = h.querySelector('.chno');
      var num = chno ? chno.textContent.trim() : '';
      var id = h.id || '';
      var kind = (/-pro$/.test(id) || num === '序章' || num === 'PROLOGUE') ? 'pro'
        : ((/-epi$/.test(id) || /-end$/.test(id) || num === '終章' || num === 'EPILOGUE') ? 'end' : 'num');
      if (kind === 'num') c += 1;
      progNums.push({kind:kind, n:c, title:h.textContent.replace(num, '').trim()});
    });
  })();
  function progCurrent(){
    var y = window.scrollY + 140, cur = 0;
    progHeads.forEach(function(h, i){ if (h.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
    return cur;
  }
  function progHeadText(info){
    if (progLang === 'en') {
      if (info.kind === 'pro') return 'Prologue ' + info.title;
      if (info.kind === 'end') return 'Epilogue ' + info.title;
      return 'Ch. ' + info.n + ' ' + info.title;
    }
    if (info.kind === 'pro') return '序章 ' + info.title;
    if (info.kind === 'end') return '終章 ' + info.title;
    return (info.n < 10 ? '0' + info.n : '' + info.n) + ' ' + info.title;
  }
  function updateProgLabel(){
    if (!progLabel || !progHeads.length) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? h.scrollTop / max : 0;
    var done = (h.scrollTop + h.clientHeight >= h.scrollHeight - 2);
    var el = progLabel.querySelector('.pl-in');
    if (!el) return;
    if (done) {
      el.textContent = (progLang === 'en' ? 'Finished' : '已讀完');
    } else {
      var left = Math.max(1, Math.ceil((1 - p) * progMin));
      el.textContent = progHeadText(progNums[progCurrent()]) + (progLang === 'en' ? ' · ' + left + ' min left' : ' · 剩 ' + left + ' 分鐘');
    }
    progLabel.style.visibility = (h.scrollTop > 240) ? 'visible' : 'hidden';
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
  /* reading tone (2.2): day / warm paper / dark — three-state cycle on one button.
     Old 'rjb-dark' pref migrates to the new 'rjb-mode' key. Classes stay mutually
     exclusive, so the dark-read var redefinition is never overridden by warm paper. */
  var modeBtn = document.getElementById('dark-toggle');
  var MODES = ['day', 'warm', 'dark'];
  var MODE_LABEL = {
    day: {zh: '☀', en: '☀'},
    warm: {zh: '◑', en: '◑'},
    dark: {zh: '◐', en: '◐'}
  };
  var pageLang = document.documentElement.lang === 'en' ? 'en' : 'zh';
  var mode = 'day';
  try {
    mode = localStorage.getItem('rjb-mode') || 'day';
    if (mode === 'day' && localStorage.getItem('rjb-dark') === '1') mode = 'dark';
  } catch(e){}
  if (MODES.indexOf(mode) < 0) mode = 'day';
  function applyMode(m){
    document.body.classList.toggle('warm-paper', m === 'warm');
    document.body.classList.toggle('dark-read', m === 'dark');
    if (modeBtn) modeBtn.textContent = MODE_LABEL[m][pageLang];
    try { localStorage.setItem('rjb-mode', m); } catch(e){}
  }
  applyMode(mode);
  if (modeBtn) modeBtn.addEventListener('click', function(){
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    applyMode(mode);
  });
  /* resume reading (2.2): remember the chapter in progress; offer to jump back */
  var resumeBar = document.getElementById('resume-bar');
  var artBody = document.querySelector('.article-body');
  var bmForSlug = document.getElementById('bookmark');
  var progSlug = bmForSlug ? bmForSlug.getAttribute('data-slug') : null;
  if (artBody && progSlug) {
    var progKey = 'rjb-progress-' + progSlug;
    var heads = Array.prototype.slice.call(artBody.querySelectorAll('h2[id]'));
    function currentChapter(){
      var y = window.scrollY + 140, cur = heads[0] || null;
      heads.forEach(function(h){ if (h.getBoundingClientRect().top + window.scrollY <= y) cur = h; });
      return cur;
    }
    function chapterLabel(h){
      if (!h) return '';
      var chno = h.querySelector('.chno');
      var num = chno ? chno.textContent.trim() : '';
      var title = h.textContent.replace(num, '').trim();
      if (!num) return title;
      return pageLang === 'en' ? num + ': ' + title : '〈' + num + '：' + title + '〉';
    }
    function saveProgress(){
      var h = currentChapter();
      if (!h) return;
      try { localStorage.setItem(progKey, JSON.stringify({id: h.id, label: chapterLabel(h), y: Math.round(window.scrollY), at: Date.now()})); } catch(e){}
    }
    var saveTimer = null;
    window.addEventListener('scroll', function(){
      if (saveTimer) return;
      saveTimer = setTimeout(function(){ saveTimer = null; saveProgress(); }, 1500);
    }, {passive:true});
    window.addEventListener('beforeunload', saveProgress);
    if (resumeBar) {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(progKey) || 'null'); } catch(e){}
      var firstId = heads.length ? heads[0].id : null;
      var fresh = saved && (Date.now() - (saved.at || 0) < 30 * 24 * 3600 * 1000);
      if (fresh && saved.id && saved.id !== firstId && saved.y > 400) {
        var target = document.getElementById(saved.id);
        if (target) {
          var msg = resumeBar.querySelector('.resume-msg');
          if (msg) msg.textContent = (pageLang === 'en'
            ? 'Last time you reached ' + saved.label + ' — tap to jump back'
            : '上次讀到' + saved.label + '，點擊跳轉');
          resumeBar.hidden = false;
          var go = resumeBar.querySelector('.resume-go');
          if (go) go.addEventListener('click', function(){
            target.scrollIntoView({behavior:'smooth', block:'start'});
            resumeBar.hidden = true;
          });
          var dis = resumeBar.querySelector('.resume-dismiss');
          if (dis) dis.addEventListener('click', function(){ resumeBar.hidden = true; });
        }
      }
    }
  }
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
  /* print / save as PDF */
  var pb = document.getElementById('print-btn');
  if (pb) pb.addEventListener('click', function(){ window.print(); });
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
      var cnt = document.getElementById('search-count');
      if (!q || !data) { sr.innerHTML = ''; if (cnt) cnt.textContent = ''; return; }
      var all = data.filter(function(it){
        var hay = (it.title + ' ' + it.title_en + ' ' + it.subtitle + ' ' + it.subtitle_en + ' ' + it.excerpt + ' ' + (it.excerpt_en || '') + ' ' + it.cat + ' ' + it.cat_en + ' ' + (it.tags || '') + ' ' + (it.text || '') + ' ' + (it.text_en || '')).toLowerCase();
        return q.split(/\s+/).every(function(w){ return hay.indexOf(w) !== -1; });
      });
      if (cnt) cnt.textContent = all.length ? (lang === 'en' ? 'Found ' + all.length + ' article' + (all.length > 1 ? 's' : '') + (all.length > 20 ? ', showing first 20' : '') : '找到 ' + all.length + ' 篇文章' + (all.length > 20 ? '，顯示前 20 篇' : '')) : '';
      var hits = all.slice(0, 20);
      if (!hits.length) { sr.innerHTML = '<li class="search-hint">' + sr.getAttribute('data-empty') + '</li>'; return; }
      sr.innerHTML = hits.map(function(it){
        var u = lang === 'en' ? it.url_en : it.url;
        var ti = lang === 'en' ? it.title_en : it.title;
        var sub = lang === 'en' ? it.subtitle_en : it.subtitle;
        var cat = lang === 'en' ? it.cat_en : it.cat;
        var im = lang === 'en' ? (it.img_en || it.img) : it.img;
        return '<li><img src="/' + im + '" alt="" loading="lazy" /><div><p class="art-meta"><span class="cat">' + cat + '</span></p><h3><a href="' + u + '">' + ti + '</a></h3><p>' + sub + '</p></div></li>';
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

  /* sources: collapsed <details>; open it when a [N] cite is clicked or the URL hash points at a source */
  var srcDet = document.querySelector('.src-details');
  if (srcDet) {
    document.querySelectorAll('a.cite').forEach(function(c){
      c.addEventListener('click', function(){ srcDet.setAttribute('open', ''); });
    });
    if (location.hash && /^#src-\d+$/.test(location.hash)) {
      srcDet.setAttribute('open', '');
      var srcT = document.getElementById(location.hash.slice(1));
      if (srcT) srcT.scrollIntoView();
    }
  }

  /* bookshelf: drag-to-scroll (mouse only; touch uses native swipe) + arrow buttons */
  var shelf = document.getElementById('bookshelf');
  if (shelf) {
    var shelfDrag = false, shelfMoved = false, shelfStartX = 0, shelfStartL = 0;
    var shelfArrows = document.querySelectorAll('[data-shelf-dir]');
    function updateShelfArrows(){
      var canScroll = shelf.scrollWidth > shelf.clientWidth + 1;
      var atStart = shelf.scrollLeft <= 0;
      var atEnd = shelf.scrollLeft + shelf.clientWidth >= shelf.scrollWidth - 1;
      shelfArrows.forEach(function(btn){
        var dir = parseInt(btn.getAttribute('data-shelf-dir'), 10);
        btn.disabled = !canScroll || (dir < 0 ? atStart : atEnd);
      });
    }
    shelf.addEventListener('pointerdown', function(ev){
      if (ev.pointerType !== 'mouse') return;
      shelfDrag = true; shelfMoved = false;
      shelfStartX = ev.clientX; shelfStartL = shelf.scrollLeft;
      shelf.classList.add('dragging');
    });
    shelf.addEventListener('pointermove', function(ev){
      if (!shelfDrag) return;
      if (Math.abs(ev.clientX - shelfStartX) > 6) shelfMoved = true;
      shelf.scrollLeft = shelfStartL - (ev.clientX - shelfStartX);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(evt){
      shelf.addEventListener(evt, function(){ shelfDrag = false; shelf.classList.remove('dragging'); });
    });
    shelf.addEventListener('click', function(ev){
      if (shelfMoved) { ev.preventDefault(); shelfMoved = false; }
    }, true);
    shelfArrows.forEach(function(btn){
      btn.addEventListener('click', function(){
        var card = shelf.querySelector('.shelf-card');
        var step = card ? card.getBoundingClientRect().width + 20 : 200;
        shelf.scrollBy({left: step * parseInt(btn.getAttribute('data-shelf-dir'), 10), behavior: 'smooth'});
      });
    });
    /* bookshelf auto-rotate: one card every 4s, step by step (not a marquee).
       Pauses while the user interacts, on hover/focus, when the tab is hidden
       or the shelf is off-screen; resumes 5s after the interaction ends.
       Disabled when the shelf cannot scroll, with prefers-reduced-motion,
       or on touch devices (pointer: coarse) — auto-rotate fights the user's
       own swipe there. Arrows and swipe still work on touch. */
    var shelfAutoTimer = null, shelfResumeTimer = null;
    var shelfHover = false, shelfFocus = false, shelfInView = true;
    var shelfReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var shelfCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    function shelfCanAuto(){
      return !shelfReducedMotion && !shelfCoarsePointer && shelfInView && !document.hidden &&
        shelf.scrollWidth > shelf.clientWidth + 1;
    }
    function shelfStep(){
      if (!shelfCanAuto()) { shelfStopAuto(); return; }
      var card = shelf.querySelector('.shelf-card');
      var step = card ? card.getBoundingClientRect().width + 20 : 200;
      var atEnd = shelf.scrollLeft + shelf.clientWidth >= shelf.scrollWidth - 1;
      if (atEnd) shelf.scrollTo({left: 0, behavior: 'smooth'});
      else shelf.scrollBy({left: step, behavior: 'smooth'});
    }
    function shelfStopAuto(){
      if (shelfAutoTimer) { clearInterval(shelfAutoTimer); shelfAutoTimer = null; }
      if (shelfResumeTimer) { clearTimeout(shelfResumeTimer); shelfResumeTimer = null; }
    }
    function shelfStartAuto(){
      shelfStopAuto();
      if (shelfCanAuto()) shelfAutoTimer = setInterval(shelfStep, 4000);
    }
    function shelfPauseForAWhile(){
      shelfStopAuto();
      shelfResumeTimer = setTimeout(shelfStartAuto, 5000);
    }
    shelf.addEventListener('pointerdown', shelfPauseForAWhile);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(evt){
      shelf.addEventListener(evt, shelfPauseForAWhile);
    });
    shelf.addEventListener('mouseenter', function(){ shelfHover = true; shelfStopAuto(); });
    shelf.addEventListener('mouseleave', function(){ shelfHover = false; shelfPauseForAWhile(); });
    shelf.addEventListener('focusin', function(){ shelfFocus = true; shelfStopAuto(); });
    shelf.addEventListener('focusout', function(){ shelfFocus = false; shelfPauseForAWhile(); });
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) shelfStopAuto(); else shelfStartAuto();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries){
        shelfInView = entries[0].isIntersecting;
        if (shelfInView) shelfStartAuto(); else shelfStopAuto();
      }, {threshold: 0.2}).observe(shelf);
    }
    shelfArrows.forEach(function(btn){
      btn.addEventListener('click', shelfPauseForAWhile);
    });
    window.addEventListener('resize', function(){
      if (!shelfHover && !shelfFocus && !shelfDrag) shelfStartAuto();
    });
    shelfStartAuto();
    shelf.addEventListener('scroll', updateShelfArrows);
    window.addEventListener('load', updateShelfArrows);
    window.addEventListener('resize', updateShelfArrows);
    updateShelfArrows();
  }

  /* audio player (2.3 + 2c): zh article pages only. Play/pause, click-to-seek
     track, speed cycle 1.0 -> 1.25 -> 1.5 -> 2.0 -> 0.8, Media Session API,
     auto-play next article (data-next) on ended. */
  var ap = document.querySelector('.audio-player');
  if (ap) {
    var au = ap.querySelector('audio');
    var playBtn = ap.querySelector('.ap-play');
    var track = ap.querySelector('.ap-track');
    var fill = ap.querySelector('.ap-fill');
    var curEl = ap.querySelector('.ap-cur');
    var rateBtn = ap.querySelector('.ap-rate');
    var RATES = [1, 1.25, 1.5, 2, 0.8];
    var rateIdx = 0;
    function apFmt(s){ s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function apSync(){
      var d = au.duration || parseFloat(ap.getAttribute('data-duration')) || 0;
      var c = au.currentTime || 0;
      if (fill) fill.style.width = (d > 0 ? (c / d) * 100 : 0) + '%';
      if (curEl) curEl.textContent = apFmt(c);
      if (track) track.setAttribute('aria-valuenow', String(Math.floor(c)));
    }
    var lastSave = 0;
    function apSave(force){
      try {
        var now = Date.now();
        if (!force && now - lastSave < 5000) return;
        lastSave = now;
        var h1t = document.querySelector('h1');
        localStorage.setItem('sf-last-listen', JSON.stringify({ slug: au.getAttribute('data-slug') || '', url: window.location.pathname, title: h1t ? h1t.textContent.trim() : document.title, seconds: Math.floor(au.currentTime) }));
      } catch (e) {}
    }
    if (playBtn) playBtn.addEventListener('click', function(){ if (au.paused) { playBtn.textContent = '…'; var pr = au.play(); if (pr && pr.catch) pr.catch(function(){ playBtn.textContent = '▶'; }); } else { au.pause(); } });
    au.addEventListener('play', function(){ if (playBtn) playBtn.textContent = '❚❚'; });
    au.addEventListener('pause', function(){ if (playBtn) playBtn.textContent = '▶'; });
    au.addEventListener('waiting', function(){ if (playBtn) playBtn.textContent = '…'; });
    au.addEventListener('playing', function(){ if (playBtn) playBtn.textContent = '❚❚'; });
    au.addEventListener('ended', function(){
      if (playBtn) playBtn.textContent = '▶';
      au.currentTime = 0; apSync();
      try { localStorage.removeItem('sf-last-listen'); } catch (e) {}
      var nxt = null;
      try {
        var pl = JSON.parse(localStorage.getItem('sf-playlist') || 'null');
        if (pl && pl.length) {
          var idx = pl.indexOf(window.location.pathname);
          if (idx >= 0 && idx + 1 < pl.length) { nxt = pl[idx + 1]; }
          else { localStorage.removeItem('sf-playlist'); }
        }
      } catch (e) {}
      if (!nxt) nxt = au.getAttribute('data-next');
      if (nxt) {
        try { sessionStorage.setItem('sf-autoplay', '1'); } catch (e) {}
        window.location.href = nxt;
      }
    });
    au.addEventListener('timeupdate', apSync);
    au.addEventListener('loadedmetadata', apSync);
    if (track) track.addEventListener('click', function(ev){
      var r = track.getBoundingClientRect();
      var d = au.duration || parseFloat(ap.getAttribute('data-duration')) || 0;
      if (d > 0) au.currentTime = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * d;
      apSync();
    });
    if (track) track.addEventListener('keydown', function(ev){
      var d = au.duration || 0;
      if (ev.key === 'ArrowRight') { au.currentTime = Math.min(d, au.currentTime + 10); apSync(); ev.preventDefault(); }
      if (ev.key === 'ArrowLeft') { au.currentTime = Math.max(0, au.currentTime - 10); apSync(); ev.preventDefault(); }
    });
    if (rateBtn) rateBtn.addEventListener('click', function(){
      rateIdx = (rateIdx + 1) % RATES.length;
      au.playbackRate = RATES[rateIdx];
      rateBtn.textContent = RATES[rateIdx].toFixed(2).replace(/0$/, '') + 'x';
    });
    au.addEventListener('timeupdate', function(){ apSave(false); });
    au.addEventListener('pause', function(){ apSave(true); });
    try {
      var pl0 = JSON.parse(localStorage.getItem('sf-playlist') || 'null');
      if (pl0 && pl0.indexOf(window.location.pathname) < 0) localStorage.removeItem('sf-playlist');
    } catch (e) {}
    var lm = location.hash.match(/^#listen=(\d+(?:\.\d+)?)$/);
    if (lm) {
      var seekTo = parseFloat(lm[1]);
      var applySeek = function(){
        var d = au.duration || parseFloat(ap.getAttribute('data-duration')) || 0;
        if (d > 0) { au.currentTime = Math.max(0, Math.min(d - 1, seekTo)); apSync(); }
      };
      if (au.readyState >= 1) applySeek(); else au.addEventListener('loadedmetadata', applySeek, { once: true });
    }
    if ('mediaSession' in navigator) {
      try {
        var h1 = document.querySelector('h1');
        navigator.mediaSession.metadata = new MediaMetadata({ title: (h1 ? h1.textContent : document.title).trim(), artist: 'SlowFolio 人間手札', album: 'Slowfolio' });
        navigator.mediaSession.setActionHandler('play', function(){ au.play(); });
        navigator.mediaSession.setActionHandler('pause', function(){ au.pause(); });
        navigator.mediaSession.setActionHandler('seekto', function(d){ if (d && typeof d.seekTime === 'number') au.currentTime = d.seekTime; });
      } catch (e) {}
    }
    try {
      if (sessionStorage.getItem('sf-autoplay') === '1') {
        sessionStorage.removeItem('sf-autoplay');
        var p = au.play();
        if (p && p.catch) p.catch(function(){});
      }
    } catch (e) {}
    apSync();
  }

  /* resume listening strip (batch 7): home page only; series play button. */
  (function(){
    function fmt(s){ s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    var rl = document.getElementById('resume-listen');
    if (rl) {
      try {
        var data = JSON.parse(localStorage.getItem('sf-last-listen') || 'null');
        if (data && data.url && data.seconds >= 0) {
          var title = null;
          var cands = [data.url, data.url.replace('/articles/', '/en/articles/')];
          for (var i = 0; i < cands.length; i++) {
            var a = document.querySelector('a[href="' + cands[i] + '"]');
            if (a) { title = a.textContent.trim(); break; }
          }
          rl.href = data.url + '#listen=' + Math.floor(data.seconds);
          rl.querySelector('.rl-title').textContent = title || data.title || '';
          rl.querySelector('.rl-time').textContent = fmt(data.seconds);
          rl.hidden = false;
        }
      } catch (e) {}
    }
    var pb = document.querySelector('.series-play');
    if (pb) {
      pb.addEventListener('click', function(){
        try {
          var list = JSON.parse(pb.getAttribute('data-playlist') || '[]');
          if (list.length) {
            localStorage.setItem('sf-playlist', JSON.stringify(list));
            try { sessionStorage.setItem('sf-autoplay', '1'); } catch (e) {}
            window.location.href = list[0];
          }
        } catch (e) {}
      });
    }
  })();

  /* quote card (batch 8): select text in .article-body -> floating button ->
     canvas card (paper style, quote + title + SlowFolio mark), download/share. */
  (function(){
    var body = document.querySelector('.article-body');
    if (!body) return;
    var zh = document.documentElement.lang.indexOf('zh') === 0;
    var T = {
      make: zh ? '製成圖卡' : 'Make a card',
      download: zh ? '下載圖片' : 'Download image',
      share: zh ? '分享' : 'Share',
      close: zh ? '關閉' : 'Close',
      mark: zh ? 'SlowFolio 人間手札' : 'Slowfolio',
      title: zh ? '書摘圖卡' : 'Quote Card'
    };
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quote-btn';
    btn.textContent = T.make;
    btn.hidden = true;
    document.body.appendChild(btn);
    var currentQuote = '';
    function hideBtn(){ btn.hidden = true; }
    function onSel(){
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) { hideBtn(); return; }
      var text = sel.toString().replace(/\s+/g, ' ').trim();
      if (text.length < 10) { hideBtn(); return; }
      var node = sel.anchorNode;
      if (!node || !body.contains(node.nodeType === 1 ? node : node.parentNode)) { hideBtn(); return; }
      currentQuote = text;
      try {
        var r = sel.getRangeAt(0).getBoundingClientRect();
        var x = Math.max(8, Math.min(window.innerWidth - 140, r.left + window.scrollX + r.width / 2 - 60));
        var y = r.bottom + window.scrollY + 10;
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
      } catch (e) {}
      btn.hidden = false;
    }
    document.addEventListener('mouseup', function(){ setTimeout(onSel, 10); });
    document.addEventListener('touchend', function(){ setTimeout(onSel, 10); });
    document.addEventListener('selectionchange', function(){
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) hideBtn();
    });
    var overlay = document.createElement('div');
    overlay.className = 'quote-modal';
    overlay.hidden = true;
    overlay.innerHTML = '<div class="quote-card-box" role="dialog" aria-label="' + T.title + '">' +
      '<canvas class="quote-canvas" width="1080" height="1350"></canvas>' +
      '<div class="quote-actions">' +
      '<button type="button" class="quote-download">' + T.download + '</button>' +
      '<button type="button" class="quote-share">' + T.share + '</button>' +
      '<button type="button" class="quote-close">' + T.close + '</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    var canvas = overlay.querySelector('.quote-canvas');
    function wrapText(ctx, text, maxW){
      var lines = [], cur = '';
      var chars = text.split('');
      for (var i = 0; i < chars.length; i++) {
        var test = cur + chars[i];
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = chars[i]; }
        else cur = test;
      }
      if (cur) lines.push(cur);
      return lines;
    }
    function drawCard(quote){
      var ctx = canvas.getContext('2d');
      var W = 1080, H = 1350;
      ctx.fillStyle = '#FDFCF8'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#B89B5E'; ctx.lineWidth = 3;
      ctx.strokeRect(48, 48, W - 96, H - 96);
      ctx.fillStyle = '#1B1B18'; ctx.fillRect(90, 90, 72, 72);
      ctx.fillStyle = '#FDFCF8'; ctx.font = '700 44px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('S', 126, 128);
      ctx.fillStyle = '#8A8578'; ctx.font = '24px Georgia, "Songti TC", "Noto Serif TC", serif';
      ctx.textAlign = 'left'; ctx.fillText(T.mark, 182, 128);
      ctx.fillStyle = '#B89B5E'; ctx.fillRect(90, 200, 120, 4);
      var title = (document.querySelector('h1') || {}).textContent || '';
      ctx.fillStyle = '#1B1B18';
      ctx.font = '44px Georgia, "Songti TC", "Noto Serif TC", serif';
      ctx.textBaseline = 'top';
      var lines = wrapText(ctx, '「' + quote + '」', W - 180);
      if (lines.length > 12) { lines = lines.slice(0, 12); lines[11] += '…'; }
      var lineH = 72, startY = 330;
      for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], 90, startY + i * lineH);
      var ty = H - 220;
      ctx.fillStyle = '#B89B5E'; ctx.fillRect(90, ty - 24, 120, 4);
      ctx.fillStyle = '#1B1B18'; ctx.font = '34px Georgia, "Songti TC", "Noto Serif TC", serif';
      var tlines = wrapText(ctx, title, W - 180);
      if (tlines.length > 2) tlines = tlines.slice(0, 2);
      for (var j = 0; j < tlines.length; j++) ctx.fillText(tlines[j], 90, ty + j * 52);
      ctx.fillStyle = '#8A8578'; ctx.font = '24px Georgia, serif';
      ctx.fillText('slowfolio.app', 90, H - 110);
    }
    function cardBlob(cb){ canvas.toBlob(cb, 'image/png'); }
    function downloadBlob(blob){
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'slowfolio-card.png';
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
    }
    overlay.querySelector('.quote-download').addEventListener('click', function(){
      cardBlob(function(blob){ if (blob) downloadBlob(blob); });
    });
    overlay.querySelector('.quote-share').addEventListener('click', function(){
      cardBlob(function(blob){
        if (!blob) return;
        var file = new File([blob], 'slowfolio-card.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: document.title }).catch(function(){});
        } else {
          downloadBlob(blob);
        }
      });
    });
    overlay.querySelector('.quote-close').addEventListener('click', function(){ overlay.hidden = true; });
    overlay.addEventListener('click', function(ev){ if (ev.target === overlay) overlay.hidden = true; });
    btn.addEventListener('click', function(){
      if (!currentQuote) return;
      drawCard(currentQuote);
      overlay.hidden = false;
      hideBtn();
      try { window.getSelection().removeAllRanges(); } catch (e) {}
    });
  })();

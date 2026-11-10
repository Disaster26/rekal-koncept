(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* menu mobilne */
  var burger = $('.burger'), nav = $('#nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
      document.body.style.overflow = o ? 'hidden' : '';
    });
  }
  $$('.sub-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentNode, o = !li.classList.contains('open');
      $$('.has-sub.open').forEach(function (x) { if (x !== li) { x.classList.remove('open'); x.firstChild.setAttribute('aria-expanded', 'false'); } });
      li.classList.toggle('open', o);
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (window.innerWidth > 1020 && !e.target.closest('.has-sub')) $$('.has-sub.open').forEach(function (x) { x.classList.remove('open'); });
  });
  // w menu mobilnym rozwiń grupę z bieżącą stroną
  if (window.innerWidth <= 1020) $$('.has-sub.act').forEach(function (li) { li.classList.add('open'); li.firstChild.setAttribute('aria-expanded', 'true'); });

  /* przeciąganie myszą + blokada kliknięcia po przeciągnięciu */
  function dragScroll(el) {
    var down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; el.classList.add('drag'); }
      if (moved) { el.scrollLeft = sl - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) {
        el.classList.remove('drag');
        var w = el.firstElementChild ? el.firstElementChild.getBoundingClientRect().width : el.clientWidth;
        var gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        var step = w + gap;
        el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: 'smooth' });
      }
    });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* karuzele w kartach */
  $$('.car').forEach(function (c) {
    var t = $('.car-track', c), n = $('.car-n', c), slides = $$('.slide', t), cnt = slides.length;
    dragScroll(t);
    function idx() { return Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); }
    function go(i) { i = (i + cnt) % cnt; t.scrollTo({ left: i * t.clientWidth, behavior: 'smooth' }); }
    var p = $('.car-p', c), x = $('.car-nx', c);
    if (p) p.addEventListener('click', function () { go(idx() - 1); });
    if (x) x.addEventListener('click', function () { go(idx() + 1); });
    if (n) t.addEventListener('scroll', function () { n.textContent = (idx() + 1) + '/' + cnt; }, { passive: true });
    t.setAttribute('tabindex', '-1');
  });

  /* pas realizacji */
  $$('[data-rail]').forEach(function (r) {
    var t = $('.rail-track', r);
    dragScroll(t);
    function step() { var c = $('.rcard', t); return c ? c.getBoundingClientRect().width + 18 : 300; }
    $('.rail-p', r).addEventListener('click', function () { t.scrollBy({ left: -step(), behavior: 'smooth' }); });
    $('.rail-n', r).addEventListener('click', function () { t.scrollBy({ left: step(), behavior: 'smooth' }); });
  });
  $$('[data-drag]').forEach(dragScroll);

  /* hero - zmiana zdjęć (auto + przesunięcie palcem) */
  var hero = $('[data-hero]');
  if (hero) {
    var hs = $$('.hs', hero), dots = $$('.hs-dots button', hero), cur = 0, timer;
    function show(i) {
      cur = (i + hs.length) % hs.length;
      hs.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
      dots.forEach(function (d, k) { if (k === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      var im = $('img', hs[(cur + 1) % hs.length]); if (im) im.loading = 'eager';
    }
    function auto() { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(function () { show(cur + 1); }, 5500); }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); auto(); }); });
    var tx = null;
    hero.addEventListener('pointerdown', function (e) { tx = e.clientX; });
    hero.addEventListener('pointerup', function (e) { if (tx === null) return; var dx = e.clientX - tx; tx = null; if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); auto(); } });
    hero.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); auto(); } }, { passive: true });
    auto();
  }

  /* lightbox */
  var sets = {};
  $$('script[data-lbset]').forEach(function (s) { try { sets[s.getAttribute('data-lbset')] = JSON.parse(s.textContent); } catch (e) {} });
  var lb = $('#lb'), tr = $('#lbTrack'), cap = $('#lbCap'), curSet = null, last = null;
  function lbIdx() { return Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); }
  function lbCap() { if (curSet) { var i = lbIdx(), it = curSet[i]; if (it) cap.textContent = it[1] + '  (' + (i + 1) + '/' + curSet.length + ')'; } }
  function openLb(name, i) {
    curSet = sets[name]; if (!curSet || !lb) return;
    last = document.activeElement;
    tr.innerHTML = curSet.map(function (it) { return '<figure><img src="' + it[0] + '" alt="' + it[1].replace(/"/g, '&quot;') + '" loading="lazy" decoding="async"></figure>'; }).join('');
    lb.hidden = false; document.body.style.overflow = 'hidden';
    tr.scrollLeft = i * tr.clientWidth; lbCap();
    $('.lb-x', lb).focus();
  }
  function closeLb() { lb.hidden = true; tr.innerHTML = ''; document.body.style.overflow = ''; if (last) last.focus(); }
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.slide[data-lb]');
    if (s) openLb(s.getAttribute('data-lb'), +s.getAttribute('data-i'));
  });
  if (lb) {
    dragScroll(tr);
    tr.addEventListener('scroll', lbCap, { passive: true });
    $('.lb-x', lb).addEventListener('click', closeLb);
    $('.lb-prev', lb).addEventListener('click', function () { tr.scrollTo({ left: Math.max(0, lbIdx() - 1) * tr.clientWidth, behavior: 'smooth' }); });
    $('.lb-next', lb).addEventListener('click', function () { tr.scrollTo({ left: Math.min(curSet.length - 1, lbIdx() + 1) * tr.clientWidth, behavior: 'smooth' }); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') $('.lb-next', lb).click();
      if (e.key === 'ArrowLeft') $('.lb-prev', lb).click();
    });
    tr.addEventListener('click', function (e) { if (e.target === tr || e.target.tagName === 'FIGURE') closeLb(); });
  }

  /* dolny pasek na telefonie - po przewinięciu za przycisk */
  var bar = $('#mobBar');
  if (bar && 'IntersectionObserver' in window) {
    var anchor = $('#heroCta') || $('.phero-txt') || $('main');
    var seen = false;
    new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) seen = true; bar.classList.toggle('widac', !x.isIntersecting && (seen || x.boundingClientRect.top < 0)); });
    }).observe(anchor);
  }

  /* formularz pokazowy */
  var f = $('#formularz');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var em = f.email;
    if (!em.value || !em.checkValidity()) { em.focus(); em.setCustomValidity(''); em.reportValidity && em.reportValidity(); return; }
    $('.form-msg', f).hidden = false;
  });
})();

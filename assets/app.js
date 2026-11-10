(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('.yr').forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* nagłówek: przezroczysty na hero, pełny po przewinięciu */
  var top = $('#top');
  function hdr() { if (top) top.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', hdr, { passive: true }); hdr();

  /* menu mobilne */
  var burger = $('.burger'), nav = $('#nav');
  function closeNav() { if (!nav) return; nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); document.body.style.overflow = ''; }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
      document.body.style.overflow = o ? 'hidden' : '';
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); burger.focus(); } });
  }

  /* podświetlenie bieżącej sekcji w menu (strona główna) */
  if ('IntersectionObserver' in window && document.body.classList.contains('home')) {
    var links = $$('.nav a[href^="#"]');
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting && map[x.target.id]) { links.forEach(function (l) { l.classList.remove('on'); }); map[x.target.id].classList.add('on'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* wejście sekcji */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); ro.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { ro.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* przeciąganie myszą + blokada kliknięcia po przeciągnięciu */
  function dragScroll(el) {
    var down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; el.classList.add('drag'); }
      if (moved) { el.scrollLeft = sl - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) {
        el.classList.remove('drag');
        var f = el.firstElementChild, w = f ? f.getBoundingClientRect().width : el.clientWidth;
        var gap = parseFloat(getComputedStyle(el).columnGap) || 0, step = w + gap;
        el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: 'smooth' });
      }
    });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  $$('[data-drag], .bento').forEach(dragScroll);

  /* karuzele (podstrony) */
  $$('.car').forEach(function (c) {
    var t = $('.car-track', c), n = $('.car-n', c), cnt = $$('.slide', t).length;
    dragScroll(t);
    function idx() { return Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); }
    function go(i) { i = (i + cnt) % cnt; t.scrollTo({ left: i * t.clientWidth, behavior: 'smooth' }); }
    var p = $('.car-p', c), x = $('.car-nx', c);
    if (p) p.addEventListener('click', function () { go(idx() - 1); });
    if (x) x.addEventListener('click', function () { go(idx() + 1); });
    if (n) t.addEventListener('scroll', function () { n.textContent = (idx() + 1) + '/' + cnt; }, { passive: true });
  });
  $$('[data-rail]').forEach(function (r) {
    var t = $('.rail-track', r); dragScroll(t);
    function step() { var c = $('.rcard', t); return c ? c.getBoundingClientRect().width + 14 : 300; }
    var p = $('.rail-p', r), n = $('.rail-n', r);
    if (p) p.addEventListener('click', function () { t.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (n) n.addEventListener('click', function () { t.scrollBy({ left: step(), behavior: 'smooth' }); });
  });

  /* ===== lightbox ===== */
  var sets = {};
  $$('script[data-lbset]').forEach(function (s) { try { sets[s.getAttribute('data-lbset')] = JSON.parse(s.textContent); } catch (e) {} });
  var lb = $('#lb'), tr = $('#lbTrack'), cap = $('#lbCap'), curSet = null, last = null;
  function lbIdx() { return Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); }
  function lbCap() { if (curSet) { var i = lbIdx(), it = curSet[i]; if (it) cap.textContent = it[1] + '  (' + (i + 1) + '/' + curSet.length + ')'; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function openLb(list, i) {
    curSet = list; if (!curSet || !lb) return;
    last = document.activeElement;
    tr.innerHTML = curSet.map(function (it, k) { return '<figure><img src="' + it[0] + '" alt="' + esc(it[1]) + '"' + (Math.abs(k - i) > 1 ? ' loading="lazy"' : '') + ' decoding="async"></figure>'; }).join('');
    lb.hidden = false; document.body.style.overflow = 'hidden';
    tr.scrollLeft = i * tr.clientWidth; lbCap();
    $('.lb-x', lb).focus();
  }
  function closeLb() { lb.hidden = true; tr.innerHTML = ''; document.body.style.overflow = ''; if (last) last.focus(); }
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.slide[data-lb]');
    if (s) openLb(sets[s.getAttribute('data-lb')], +s.getAttribute('data-i'));
  });
  if (lb) {
    dragScroll(tr);
    tr.addEventListener('scroll', lbCap, { passive: true });
    $('.lb-x', lb).addEventListener('click', closeLb);
    function lbGo(d) { tr.scrollTo({ left: Math.max(0, Math.min(curSet.length - 1, lbIdx() + d)) * tr.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }
    $('.lb-prev', lb).addEventListener('click', function () { lbGo(-1); });
    $('.lb-next', lb).addEventListener('click', function () { lbGo(1); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbGo(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lbGo(-1); }
      else if (e.key === 'Tab') { // pułapka fokusu
        var f = $$('button', lb), a = f[0], z = f[f.length - 1];
        f = f.filter(function (b) { return b.offsetParent !== null; }); a = f[0]; z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    tr.addEventListener('click', function (e) { if (e.target === tr || e.target.tagName === 'FIGURE') closeLb(); });
  }

  /* ===== GALERIA z filtrami ===== */
  var gal = $('#gal'), fil = $('#filters'), more = $('#galMore');
  if (gal && sets.gal) {
    var all = sets.gal, cats = [
      ['all', 'Wszystkie'], ['szyldy', 'Szyldy i kasetony'], ['litery', 'Litery i logo 3D'], ['pylony', 'Pylony i tablice'],
      ['oklej', 'Oklejanie i banery'], ['wnetrza', 'Wnętrza i meble'], ['arch', 'Elementy architektury'], ['konst', 'Konstrukcje']
    ];
    var cur = 'all', shown = 0;
    function per() { return window.innerWidth < 761 ? 10 : 16; }
    function list() { return cur === 'all' ? all : all.filter(function (x) { return x[2] === cur; }); }
    fil.innerHTML = cats.map(function (c) {
      var n = c[0] === 'all' ? all.length : all.filter(function (x) { return x[2] === c[0]; }).length;
      return n ? '<button type="button" data-c="' + c[0] + '" aria-pressed="' + (c[0] === cur) + '">' + c[1] + '<small>' + n + '</small></button>' : '';
    }).join('');
    function render(reset) {
      var l = list();
      if (reset) { gal.innerHTML = ''; shown = 0; }
      var to = Math.min(l.length, shown + per()), h = '';
      for (var i = shown; i < to; i++) {
        h += '<figure class="gi" style="animation-delay:' + ((i - shown) * 35) + 'ms"><button type="button" data-gi="' + i + '" aria-label="Powiększ: ' + esc(l[i][1]) + '"><img src="' + l[i][0] + '" alt="' + esc(l[i][1]) + '" loading="lazy" decoding="async" width="400" height="300"></button><figcaption>' + esc(l[i][1]) + '</figcaption></figure>';
      }
      gal.insertAdjacentHTML('beforeend', h);
      shown = to;
      more.hidden = shown >= l.length;
      more.textContent = 'Pokaż więcej (' + (l.length - shown) + ')';
    }
    fil.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      cur = b.getAttribute('data-c');
      $$('button', fil).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render(true);
      if (b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    });
    more.addEventListener('click', function () { var f = shown; render(false); var nb = gal.querySelector('[data-gi="' + f + '"]'); if (nb) nb.focus({ preventScroll: true }); });
    gal.addEventListener('click', function (e) { var b = e.target.closest('[data-gi]'); if (b) openLb(list(), +b.getAttribute('data-gi')); });
    render(true);
  }

  /* ===== PORÓWNANIE dzień / noc ===== */
  var cmp = $('#cmp');
  if (cmp) {
    var rng = $('input', cmp);
    var setP = function () { cmp.style.setProperty('--p', rng.value + '%'); };
    rng.addEventListener('input', setP); setP();
  }

  /* ===== STUDIO NAPISU ===== */
  var stage = $('#stage');
  if (stage) {
    var sign = $('#sign'), txt = $('#sgText'), inp = $('#sgIn'), lit = $('#sgLit'), swName = $('#swName');
    var sf = $('#studioForm');
    function hexMix(hex, w, amt) { // miesza kolor z bielą (w=255) lub czernią (w=0)
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      r = Math.round(r + (w - r) * amt); g = Math.round(g + (w - g) * amt); b = Math.round(b + (w - b) * amt);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    function isWhite(c) { return c === '#EAF4FF' || c === '#FFE2B0'; }
    function fit() {
      var w = sign.clientWidth, h = sign.clientHeight; if (!w) return;
      txt.style.fontSize = '100px';
      var tw = txt.offsetWidth || 1, th = txt.offsetHeight || 1;
      var s = Math.min((w * 0.96) / tw, (h * 0.86) / th) * 100;
      txt.style.fontSize = Math.max(8, Math.min(s, h * 0.7)) + 'px';
    }
    function upd() {
      var style = sf.sgStyle.value, c = sf.led.value, white = isWhite(c);
      var t = inp.value.trim() || 'TWOJA FIRMA';
      txt.textContent = t;
      txt.className = 'sg ' + (style === 'kaseton' ? 'sg-box' : 'sg-letters');
      stage.classList.toggle('box', style === 'kaseton');
      stage.classList.toggle('lit', lit.checked);
      stage.style.setProperty('--led', c);
      // litery: dzień = lico w kolorze akrylu, boki ciemne; noc = świecące lico
      stage.style.setProperty('--face', stage.classList.contains('night') ? hexMix(c, 255, white ? 0.2 : 0.55) : (white ? '#F7F7F5' : c));
      stage.style.setProperty('--side', white ? '#9DA2A8' : hexMix(c, 0, 0.45));
      stage.style.setProperty('--side2', white ? '#7F848A' : hexMix(c, 0, 0.6));
      // kaseton: dzień = białe lico i grafika w kolorze; noc = lico świeci kolorem
      stage.style.setProperty('--boxface', '#F4F4F2');
      stage.style.setProperty('--boxtx', white ? '#16181B' : c);
      stage.style.setProperty('--boxglow', white ? c : hexMix(c, 255, 0.35));
      var r = $('input[name="led"]:checked', sf);
      swName.textContent = 'Wybrany: ' + (r ? r.getAttribute('data-name') : '');
      fit();
    }
    $$('.daynight button', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        var night = b.getAttribute('data-dn') === 'night';
        stage.classList.toggle('night', night);
        $$('.daynight button', stage).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        upd();
      });
    });
    sf.addEventListener('input', upd); sf.addEventListener('change', upd);
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    upd();
    // jeden raz pokaż efekt nocy, gdy studio wjedzie na ekran
    if ('IntersectionObserver' in window && !reduce) {
      var once = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { once.disconnect(); setTimeout(function () { if (!stage.dataset.touched) $('.daynight .moon', stage).click(); }, 900); }
      }, { threshold: 0.6 });
      once.observe(stage);
      stage.addEventListener('pointerdown', function () { stage.dataset.touched = 1; });
      sf.addEventListener('input', function () { stage.dataset.touched = 1; });
    }
    var toWiz = $('#toWiz');
    if (toWiz) toWiz.addEventListener('click', function () {
      var w = $('#wiz'); if (!w) return;
      var style = sf.sgStyle.value, r = $('input[name="led"]:checked', sf);
      $('input[name="rodzaj"][value="' + (style === 'kaseton' ? 'Kaseton' : 'Litery 3D') + '"]', w).checked = true;
      $('#wOpis').value = 'Napis: ' + (inp.value.trim() || 'TWOJA FIRMA');
      var led = $('input[name="led"][value="' + (lit.checked ? 'Tak, podświetlane LED' : 'Bez podświetlenia') + '"]', w); if (led) led.checked = true;
      if (lit.checked && r) { var k = $('input[name="ledkolor"][value="' + r.getAttribute('data-name') + '"]', w); if (k) k.checked = true; }
      w.dispatchEvent(new Event('change'));
      document.getElementById('zapytanie').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      window.__wizGo && window.__wizGo(1);
    });
  }

  /* ===== KREATOR ZAPYTANIA ===== */
  var wiz = $('#wiz');
  if (wiz) {
    var steps = $$('.wstep', wiz), sb = $$('#steps button'), at = 0, maxAt = 0;
    var prev = $('#wPrev'), next = $('#wNext'), reset = $('#wReset'), err = $('#werr'), bar = $('#wbar');
    var val = function (n) { var e = wiz.elements[n]; if (!e) return ''; if (e.length !== undefined && !e.tagName) { var c = $('input[name="' + n + '"]:checked', wiz); return c ? c.value : ''; } return e.type === 'checkbox' ? e.checked : (e.value || '').trim(); };
    function toggles() {
      $('#wLedKol').hidden = val('led') !== 'Tak, podświetlane LED';
      $('#wMonWys').hidden = val('montaz') !== 'Tak, z montażem';
      $('#wDataF').hidden = val('termin') !== 'data';
      var pom = val('pomiar');
      ['wSz', 'wWy'].forEach(function (id) { $('#' + id).disabled = pom; });
    }
    wiz.addEventListener('change', toggles); wiz.addEventListener('input', function () { err.textContent = ''; });
    function check(i) {
      if (i === 0 && !val('rodzaj')) return 'Wybierz rodzaj reklamy.';
      if (i === 1 && !val('pomiar') && (!val('szer') || !val('wys'))) return 'Podaj przybliżoną szerokość i wysokość albo zaznacz pomiar na miejscu.';
      if (i === 2 && !val('led')) return 'Wybierz, czy reklama ma być podświetlana.';
      if (i === 3 && !val('montaz')) return 'Wybierz, czy montaż ma być po naszej stronie.';
      if (i === 4 && !val('miejsce')) return 'Podaj miejscowość lub adres montażu.';
      return '';
    }
    function code() {
      var k = ($('input[name="rodzaj"]:checked', wiz) || {}).getAttribute ? $('input[name="rodzaj"]:checked', wiz).getAttribute('data-k') : 'X';
      var s = [val('rodzaj'), val('szer'), val('wys'), val('led'), val('ledkolor'), val('montaz'), val('wysmont'), val('miejsce'), val('termin'), new Date().toDateString()].join('|');
      var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      var a = 'ABCDEFGHJKLMNPRSTUWXYZ23456789', o = ''; h = h >>> 0;
      for (var j = 0; j < 4; j++) { o += a[h % a.length]; h = Math.floor(h / a.length); }
      return 'RK-' + k + '-' + o;
    }
    function rows() {
      var r = [['Rodzaj', val('rodzaj')]];
      if (val('opis')) r.push(['Opis', val('opis')]);
      r.push(['Wymiary', val('pomiar') ? 'do pomiaru na miejscu' : val('szer') + ' x ' + val('wys') + ' cm' + (val('ilosc') && val('ilosc') !== '1' ? ', ' + val('ilosc') + ' szt.' : '')]);
      r.push(['Podświetlenie', val('led') + (val('led') === 'Tak, podświetlane LED' && val('ledkolor') ? ', ' + val('ledkolor') : '')]);
      r.push(['Montaż', val('montaz') + (val('montaz') === 'Tak, z montażem' && val('wysmont') ? ', ' + val('wysmont') : '')]);
      r.push(['Miejsce', val('miejsce')]);
      var t = val('termin'); r.push(['Termin', t === 'data' ? (val('data') || 'konkretna data') : (t || 'nie podano')]);
      var f = $('#wFile').files; r.push(['Pliki', f && f.length ? f.length + ' (do przesłania mailem)' : 'brak']);
      return r;
    }
    function summary() {
      var c = code(); $('#wCode').textContent = c;
      $('#wSum').innerHTML = rows().map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
      mailLink();
    }
    function txtSum() {
      var t = 'Zapytanie ' + $('#wCode').textContent + '\n' + rows().map(function (x) { return x[0] + ': ' + x[1]; }).join('\n');
      if (val('imie')) t += '\nImię / firma: ' + val('imie');
      if (val('tel')) t += '\nTelefon: ' + val('tel');
      return t;
    }
    function mailLink() { $('#wMail').href = 'mailto:info@rekal.biz?subject=' + encodeURIComponent('Zapytanie ' + $('#wCode').textContent) + '&body=' + encodeURIComponent(txtSum()); }
    $('#wImie').addEventListener('input', mailLink); $('#wTel').addEventListener('input', mailLink);
    function go(i, noFocus) {
      at = Math.max(0, Math.min(steps.length - 1, i)); maxAt = Math.max(maxAt, at);
      steps.forEach(function (s, k) { s.hidden = k !== at; });
      sb.forEach(function (b, k) {
        b.disabled = k > maxAt;
        b.classList.toggle('done', k < maxAt || (k <= maxAt && k !== at));
        if (k === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      var cb = sb[at]; if (cb && cb.scrollIntoView && window.innerWidth <= 1020) cb.parentNode.parentNode.scrollTo({ left: cb.parentNode.offsetLeft - 16, behavior: 'smooth' });
      bar.style.width = ((at + 1) / steps.length * 100) + '%';
      prev.hidden = at === 0;
      next.hidden = at === steps.length - 1;
      reset.hidden = at !== steps.length - 1;
      $('span', next).textContent = at === steps.length - 2 ? 'Pokaż podsumowanie' : (at === 5 ? 'Dalej' : 'Dalej');
      if (at === steps.length - 1) summary();
      err.textContent = '';
      toggles();
      if (!noFocus) { var h = $('h3', steps[at]); if (h) h.focus({ preventScroll: true }); }
    }
    window.__wizGo = function (i) { if (!check(0)) go(i); };
    next.addEventListener('click', function () { var e = check(at); if (e) { err.textContent = e; var f = $('input,select,textarea', steps[at]); return; } go(at + 1); });
    prev.addEventListener('click', function () { go(at - 1); });
    sb.forEach(function (b, k) { b.addEventListener('click', function () { if (k <= maxAt) go(k); }); });
    reset.addEventListener('click', function () { wiz.reset(); $('#thumbs').innerHTML = ''; maxAt = 0; go(0); });
    wiz.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file') { e.preventDefault(); next.hidden || next.click(); } });
    // pliki: tylko lokalny podgląd
    var file = $('#wFile'), drop = $('#drop'), th = $('#thumbs');
    function showFiles(fl) {
      th.innerHTML = '';
      Array.prototype.slice.call(fl, 0, 6).forEach(function (f) {
        var fig = document.createElement('figure');
        if (/^image\//.test(f.type)) { var im = new Image(); im.alt = ''; im.src = URL.createObjectURL(f); im.onload = function () { URL.revokeObjectURL(im.src); }; fig.appendChild(im); }
        else { var d = document.createElement('div'); d.style.cssText = 'width:110px;height:82px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);border-radius:3px;font-family:var(--fm);font-size:13px'; d.textContent = 'PDF'; fig.appendChild(d); }
        var c = document.createElement('figcaption'); c.textContent = f.name; fig.appendChild(c); th.appendChild(fig);
      });
    }
    file.addEventListener('change', function () { showFiles(file.files); });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { try { file.files = e.dataTransfer.files; } catch (x) {} showFiles(e.dataTransfer.files); } });
    $('#wCopy').addEventListener('click', function () {
      var t = txtSum(), m = $('#wCopyMsg');
      var ok = function () { m.textContent = 'Skopiowano podsumowanie do schowka.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { m.textContent = 'Nie udało się skopiować. Zaznacz tekst ręcznie.'; });
      else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (x) {} ta.remove(); }
    });
    go(0, true);
  }

  /* dolny pasek na telefonie */
  var mbar = $('#mobBar');
  if (mbar && 'IntersectionObserver' in window) {
    var anchor = $('#heroCta') || $('.phero-txt') || $('main');
    new IntersectionObserver(function (en) { en.forEach(function (x) { mbar.classList.toggle('widac', !x.isIntersecting && x.boundingClientRect.top < 0); }); }).observe(anchor);
  }

  /* formularz pokazowy (podstrona kontakt) */
  var f = $('#formularz');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var em = f.email;
    if (!em.value || !em.checkValidity()) { em.focus(); em.reportValidity && em.reportValidity(); return; }
    $('.form-msg', f).hidden = false;
  });
})();

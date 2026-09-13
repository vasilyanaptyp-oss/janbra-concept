/* JanBra OÜ. Kontseptsioon. Ilma JS-ita on kapp kokku pandud ja kõik tekstid nähtavad. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = function () { return window.innerWidth >= 900; };
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var hdrH = function () { var hd = document.querySelector('.hdr'); return hd ? Math.round(hd.getBoundingClientRect().height) + 'px' : '0px'; };

  /* ---------- 1. Lava: kapp paneb end kokku kerimisel ---------- */
  if (hasGsap && !reduce) {
    root.classList.add('gs');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var $ = function (id) { return document.getElementById(id); };
    /* laual on pealkiri kapi kohal: vertikaalsed nihked väiksemad, et osad ei roniks pealkirja peale */
    var mv = function (mob, desk) { return function () { return desktop() ? desk : mob; }; };
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#lava', start: function () { return 'top ' + hdrH(); }, end: '+=260%', pin: '#stage', scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (st) {
          var pct = $('stage-pct'); if (pct) pct.textContent = Math.round(st.progress * 100) + ' %';
          var rf = $('ruler-fill'); if (rf) rf.style.transform = 'scaleX(' + st.progress.toFixed(3) + ')';
        }
      }
    });
    /* lahti võetud algseis: karkass tuleb kokku, siis riiulid, siis uksed, siis käepidemed */
    tl.from('#p-back', { opacity: 0.25, scale: 0.94, transformOrigin: '50% 50%', duration: 0.35 }, 0)
      .from('#p-side-l', { x: -130, duration: 0.35 }, 0)
      .from('#p-side-r', { x: 130, duration: 0.35 }, 0)
      .from('#p-top', { y: mv(-120, -70), duration: 0.35 }, 0.02)
      .from('#p-bottom', { y: mv(100, 50), duration: 0.35 }, 0.02)
      .from('#p-plinth', { y: mv(140, 85), duration: 0.35 }, 0.04)
      .from('#p-shelf1', { x: -170, rotation: -6, transformOrigin: '50% 50%', duration: 0.25 }, 0.36)
      .from('#p-shelf2', { x: 170, rotation: 6, transformOrigin: '50% 50%', duration: 0.25 }, 0.4)
      .from('#p-shelf3', { x: -170, rotation: -6, transformOrigin: '50% 50%', duration: 0.25 }, 0.44)
      .from('#p-door-l', { x: -210, rotation: -8, transformOrigin: '0% 50%', duration: 0.3 }, 0.62)
      .from('#p-door-r', { x: 210, rotation: 8, transformOrigin: '100% 50%', duration: 0.3 }, 0.62)
      .from('#p-hd-l', { x: -260, duration: 0.14 }, 0.9)
      .from('#p-hd-r', { x: 260, duration: 0.14 }, 0.9)
      .from('#p-dim', { opacity: 0, duration: 0.1 }, 0.94)
      /* pealkirjad: kolm lauset kolme faasi peale */
      .set('#cap0', { autoAlpha: 1 }, 0)
      .to('#cap0', { autoAlpha: 0, duration: 0.08 }, 0.3)
      .fromTo('#cap1', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.32)
      .to('#cap1', { autoAlpha: 0, duration: 0.08 }, 0.64)
      .fromTo('#cap2', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.66);
  }

  /* ---------- 2. Teenused: lint liigub külgsuunas ainult laual ---------- */
  /* telefonis on lint keritav ja klaviatuuriga fookustatav; laual pole kerimist, seega fookuspeatust ei vaja */
  var rail = document.getElementById('rail');
  if (rail && desktop()) rail.removeAttribute('tabindex');
  if (hasGsap && !reduce && desktop()) {
    var track = document.getElementById('track');
    var wrap = document.getElementById('svc-wrap');
    if (track && wrap) {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: { trigger: wrap, start: function () { return 'top ' + hdrH(); }, end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    }
  }

  /* ---------- 3. Atklāšana kerimisel: ilma IntersectionObserverita, kindlustusega ---------- */
  var rv = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var check = function () {
    var vh = window.innerHeight;
    for (var i = 0; i < rv.length; i++) {
      var el = rv[i];
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh) el.classList.add('in');
    }
  };
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  window.addEventListener('load', check);
  check();
  setTimeout(check, 1200);
  /* lindi kaardid laual on nihutatud transformiga: näita need kohe, kui lava on ekraanil */
  if (desktop()) {
    var svcCards = Array.prototype.slice.call(document.querySelectorAll('#track .rv'));
    var showCards = function () {
      var w = document.getElementById('svc-wrap');
      if (w && w.getBoundingClientRect().top < window.innerHeight) svcCards.forEach(function (c) { c.classList.add('in'); });
    };
    window.addEventListener('scroll', showCards, { passive: true });
    window.addEventListener('load', showCards);
    showCards();
  }

  /* ---------- 4. Viisard: neli sammu, siis päring ---------- */
  var wiz = document.getElementById('wiz');
  if (wiz) {
    var steps = Array.prototype.slice.call(wiz.querySelectorAll('.wstep'));
    var back = document.getElementById('wiz-back'), next = document.getElementById('wiz-next');
    var bar = document.getElementById('wiz-bar'), lbl = document.getElementById('wiz-step'), hint = document.getElementById('wiz-hint');
    var hints = ['Mis on vaja teha?', 'Kui palju?', 'Kus?', 'Millal?', 'Kontrollige ja saatke'];
    var cur = 0;
    var val = function (name) { var el = wiz.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
    var esc = function (s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    var render = function () {
      steps.forEach(function (s, i) { s.classList.toggle('on', i === cur); });
      bar.style.transform = 'scaleX(' + ((cur + 1) / 5) + ')';
      lbl.textContent = cur < 4 ? 'Samm ' + (cur + 1) + ' / 4' : 'Valmis';
      hint.textContent = hints[cur];
      back.hidden = cur === 0;
      next.hidden = cur === 4;
      next.textContent = cur === 3 ? 'Näita päringut' : 'Edasi';
      if (cur === 4) {
        var too = val('too') || 'täpsustan kirjas', maht = val('maht') || 'täpsustan', koht = val('koht') || 'täpsustan', aeg = val('aeg') || 'kokkuleppel';
        document.getElementById('summary').innerHTML =
          '<div><dt>Töö</dt><dd>' + esc(too) + '</dd></div>' +
          '<div><dt>Maht</dt><dd>' + esc(maht) + '</dd></div>' +
          '<div><dt>Koht</dt><dd>' + esc(koht) + '</dd></div>' +
          '<div><dt>Aeg</dt><dd>' + esc(aeg) + '</dd></div>';
        var body = 'Tere!\nSoovin pakkumist.\nTöö: ' + too + '\nMaht: ' + maht + '\nKoht: ' + koht + '\nAeg: ' + aeg + '\nLisan joonised või fotod.\n[Nimi ja telefon]';
        document.getElementById('mail-link').href = 'mailto:janbraoy@gmail.com?subject=' + encodeURIComponent('Pakkumise päring: ' + too) + '&body=' + encodeURIComponent(body);
        document.getElementById('sms-link').href = 'sms:+3725243278?&body=' + encodeURIComponent('Tere! Soovin pakkumist. Töö: ' + too + '. Maht: ' + maht + '. Koht: ' + koht + '. Aeg: ' + aeg + '. [Nimi]');
      }
    };
    next.addEventListener('click', function () { if (cur < 4) { cur++; render(); } });
    back.addEventListener('click', function () { if (cur > 0) { cur--; render(); } });
    wiz.addEventListener('change', function (e) {
      /* valik viib automaatselt edasi, aga mitte viimasel sammul */
      if (e.target && e.target.type === 'radio' && cur < 4) { setTimeout(function () { cur++; render(); }, 260); }
    });
    wiz.addEventListener('submit', function (e) { e.preventDefault(); });
    render();
  }
})();

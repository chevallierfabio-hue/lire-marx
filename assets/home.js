/* =========================================================================
   home.js — mouvement de la page d'accueil (/index.html)
   DA « Rouge Internationale » (fond clair). Chargé en `defer`, après
   vendor/three.min.js.

   - reveal()        : IntersectionObserver (root = .hw) → classe .in
                       (couvre aussi .circuit-band → déclenche l'étincelle)
   - marquee()       : duplique le bandeau de concepts pour une boucle nette
   - heroBg()        : fond WebGL discret — feuillets pâles qui dérivent
                       (coupé si reduced-motion ou < 768px ; pause hors-écran)

   La révélation orchestrée du héros (classe .lit sur .hs-hero) est pilotée
   par le script inline en bas de index.html (fiable, non différé).

   Contraintes : 100 % statique, seul vendor/three.min.js est réutilisé.
   Toutes les fonctions sortent proprement si leur cible manque.
   ========================================================================= */
(function () {
  'use strict';

  var REDUCE = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* Conteneur de défilement : .hw quand elle défile réellement (accueil
     immergé depuis l'intro), sinon le viewport (mode no-anim / mobile). */
  var scroller = null;
  function scrollRoot() {
    return (scroller && scroller.scrollHeight > scroller.clientHeight + 4) ? scroller : null;
  }
  function scrollPos() {
    var r = scrollRoot();
    return r ? r.scrollTop : (window.scrollY || window.pageYOffset || 0);
  }

  /* --------------------------------------------------------------------- */
  function reveal() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger, .circuit-band');
    if (!els.length) return;
    if (REDUCE || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
      });
    }, { root: scrollRoot(), threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* --------------------------------------------------------------------- */
  /* Topbar : transparente sur le héros, opaque au scroll. */
  function topbarSolid() {
    var tb = document.querySelector('header.topbar');
    if (!tb) return;
    function upd() {
      var hero = document.querySelector('.hs-hero');
      var trip = hero ? hero.offsetHeight - 90 : 200;
      tb.classList.toggle('tb-solid', scrollPos() > trip);
    }
    upd();
    (scrollRoot() || window).addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
  }

  /* --------------------------------------------------------------------- */
  function marquee() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;
    if (REDUCE) { track.style.animation = 'none'; return; }
    track.innerHTML += track.innerHTML;      /* deux copies → translateX(-50%) */
    track.setAttribute('aria-hidden', 'true');
  }

  /* --------------------------------------------------------------------- */
  /* Fond WebGL : feuillets d'archive pâles qui dérivent derrière le héros. */
  function heroBg() {
    if (REDUCE || window.innerWidth < 768) return;
    var canvas = document.getElementById('hero-bg');
    if (!canvas || typeof THREE === 'undefined') return;
    if (!canvas.getContext ||
        !(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) return;

    var BG = 0x0d0a07;
    var renderer, scene, camera, sheets = [], raf = null;
    var running = false, onScreen = true, active = false;
    var mx = 0, my = 0, tmx = 0, tmy = 0, scrollK = 0;

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(BG, 0);

    scene = new THREE.Scene();
    if (THREE.Fog) scene.fog = new THREE.Fog(BG, 8, 26);
    camera = new THREE.PerspectiveCamera(56, 1, 0.1, 60);
    camera.position.set(0, 0, 12);

    /* texture « feuillet » — papier crème éclairé à la bougie + encre discrète */
    function sheetTexture(seed) {
      var S = 256;
      var cv = document.createElement('canvas'); cv.width = S; cv.height = S;
      var g = cv.getContext('2d');
      var grad = g.createLinearGradient(0, 0, 0, S);
      grad.addColorStop(0, '#efe2c4'); grad.addColorStop(1, '#dcc9a0');
      g.fillStyle = grad; g.fillRect(0, 0, S, S);
      var i;
      for (i = 0; i < 16; i++) {
        g.fillStyle = 'rgba(150,110,60,' + (0.03 + Math.random() * 0.05) + ')';
        g.beginPath();
        g.arc(Math.random() * S, Math.random() * S, 3 + Math.random() * 10, 0, 7);
        g.fill();
      }
      g.strokeStyle = 'rgba(58,38,20,0.5)'; g.lineWidth = 1.5; g.lineCap = 'round';
      var y = 30 + (seed % 9);
      while (y < S - 22) {
        var x = 24 + (Math.random() < 0.22 ? 20 : 0);
        var end = S - 38 - Math.random() * 60;
        g.beginPath(); g.moveTo(x, y);
        while (x < end) {
          var nx = x + 7 + Math.random() * 6;
          var ny = y + (Math.random() * 3 - 1.5);
          g.quadraticCurveTo(x + 3, y + (Math.random() * 3 - 1.5), nx, ny);
          x = nx;
        }
        g.stroke();
        y += 13 + (Math.random() < 0.14 ? 9 : 0);
      }
      var t = new THREE.CanvasTexture(cv);
      t.generateMipmaps = false;
      if (THREE.LinearFilter) t.minFilter = THREE.LinearFilter;
      if (THREE.ClampToEdgeWrapping) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.anisotropy = 2;
      return t;
    }

    var geo = new THREE.PlaneGeometry(2.4, 3.1, 1, 1);
    var COUNT = window.innerWidth < 1100 ? 9 : 13;
    for (var k = 0; k < COUNT; k++) {
      var mat = new THREE.MeshBasicMaterial({
        map: sheetTexture(k * 17),
        transparent: true, opacity: 0.82,
        depthWrite: false, side: THREE.DoubleSide
      });
      var m = new THREE.Mesh(geo, mat);
      /* biais vers la droite : le texte du héros est à gauche */
      m.position.set(1 + Math.random() * 18, (Math.random() - 0.5) * 15, 2 - Math.random() * 20);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, (Math.random() - 0.5) * 0.8);
      m.userData = {
        rot: (Math.random() - 0.5) * 0.09,
        rotY: (Math.random() - 0.5) * 0.08,
        drift: 0.10 + Math.random() * 0.18,
        sway: 0.3 + Math.random() * 0.7,
        phase: Math.random() * 6.28
      };
      sheets.push(m); scene.add(m);
    }

    function resize() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    var last = performance.now();
    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      for (var i = 0; i < sheets.length; i++) {
        var s = sheets[i], u = s.userData;
        s.position.y += u.drift * dt;
        s.position.x += Math.sin(now * 0.0002 + u.phase) * u.sway * dt;
        s.rotation.z += u.rot * dt;
        s.rotation.y += u.rotY * dt;
        if (s.position.y > 9.5) { s.position.y = -9.5; s.position.x = 1 + Math.random() * 18; }
      }
      camera.position.x += (mx * 1.2 - camera.position.x) * 0.05;
      camera.position.y += ((-my * 0.8) - scrollK * 2.4 - camera.position.y) * 0.05;
      camera.lookAt(0, scrollK * -1, 0);
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || !active || !onScreen) return;
      running = true; last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    window.addEventListener('resize', function () {
      resize(); if (!running) renderer.render(scene, camera);
    });
    window.addEventListener('mousemove', function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    function onScroll() {
      var hero = document.querySelector('.hs-hero');
      var span = hero ? hero.offsetHeight : 700;
      scrollK = Math.min(scrollPos() / span, 1);
    }
    (scrollRoot() || window).addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        onScreen = ents[0].isIntersecting;
        if (onScreen) start(); else stop();
      }, { threshold: 0.01 }).observe(canvas);
    }

    /* ne s'anime qu'une fois la homepage réellement affichée */
    function activate() { active = true; resize(); start(); }
    if (document.body.classList.contains('shell-active')) {
      activate();
    } else {
      var mo = new MutationObserver(function () {
        if (document.body.classList.contains('shell-active')) { mo.disconnect(); activate(); }
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      setTimeout(activate, 9000);
    }
  }

  /* --------------------------------------------------------------------- */
  /* Catalogue piloté par oeuvres/bibliotheque.json — source unique.
     Deux niveaux : « Disponibles » (cartes riches) + « En préparation »
     (index typographique par année). */
  function catalogue() {
    var availEl = document.getElementById('lib-available');
    var planEl = document.getElementById('lib-planned');
    var countEl = document.getElementById('lib-count');
    if (!availEl && !planEl) return;

    var CAT = {
      'critique-economie-politique': "Critique de l'économie politique",
      'philosophie': 'Jeune Marx',
      'philosophie-histoire': 'Jeune Marx et histoire',
      'politique': 'Écrits politiques',
      'histoire-politique': 'Histoire politique',
      'manuscrits-economie': 'Brouillons et ateliers'
    };
    var IMG = {
      'capital-1': 'manufacture',
      'manuscrits-1844': 'marx-jeune'
    };
    var FALLBACK = { works: [
      { id: 'capital-1', title: 'Le Capital — Livre I', author: 'Karl Marx', year: 1867,
        status: 'available', category: 'critique-economie-politique', path: 'oeuvres/capital-1.html',
        description: 'Marchandise, monnaie, plus-value, journée de travail, machinisme et accumulation.',
        concepts: ['marchandise', 'valeur', 'plus-value', 'capital'] },
      { id: 'manuscrits-1844', title: 'Manuscrits de 1844', author: 'Karl Marx', year: 1844,
        status: 'available', category: 'philosophie', path: 'oeuvres/manuscrits-1844.html',
        description: 'Les carnets de jeunesse : travail aliéné, propriété privée, dépassement communiste.',
        concepts: ['aliénation', 'travail', 'propriété privée'] }
    ] };

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function catLabel(c) { return CAT[c] || 'Œuvre'; }
    function localPath(p) {
      p = String(p || '');
      return p.indexOf('oeuvres/') === 0 ? p : ('oeuvres/' + p);
    }

    function availCard(w) {
      var img = IMG[w.id];
      var concepts = (w.concepts || []).slice(0, 4).map(function (c) {
        return '<span class="hs-w-tag">' + esc(c) + '</span>';
      }).join('');
      var pic = img
        ? '<div class="hs-w-img"><picture>' +
            '<source srcset="assets/img/archive/' + img + '.webp" type="image/webp">' +
            '<img src="assets/img/archive/' + img + '.jpg" alt="" loading="lazy"></picture></div>'
        : '';
      return '<a class="hs-w-card" href="' + esc(localPath(w.path)) + '">' + pic +
        '<div class="hs-w-body">' +
          '<div class="hs-w-meta"><span class="hs-w-status hs-w-ok">Disponible</span>' +
            '<span class="hs-w-year">' + esc(w.year) + '</span></div>' +
          '<h4 class="hs-w-title">' + esc(w.title) + '</h4>' +
          '<div class="hs-w-cat">' + esc(catLabel(w.category)) + '</div>' +
          (w.description ? '<p class="hs-w-desc">' + esc(w.description) + '</p>' : '') +
          (concepts ? '<div class="hs-w-tags">' + concepts + '</div>' : '') +
          '<span class="hs-w-go">Ouvrir l’atelier →</span>' +
        '</div></a>';
    }
    function planRow(w) {
      return '<li class="hs-p-row">' +
        '<span class="hs-p-year">' + esc(w.year) + '</span>' +
        '<span class="hs-p-title">' + esc(w.title) + '</span>' +
        '<span class="hs-p-cat">' + esc(catLabel(w.category)) + '</span>' +
      '</li>';
    }

    function render(works) {
      var avail = works.filter(function (w) { return w.status === 'available'; })
                       .sort(function (a, b) { return a.year - b.year; });
      var plan = works.filter(function (w) { return w.status !== 'available'; })
                      .sort(function (a, b) { return a.year - b.year; });
      if (availEl) availEl.innerHTML = avail.map(availCard).join('');
      if (planEl) planEl.innerHTML = plan.map(planRow).join('');
      if (countEl) {
        countEl.textContent = avail.length + (avail.length > 1 ? ' œuvres disponibles' : ' œuvre disponible') +
          ' · ' + plan.length + ' en préparation';
      }
    }

    fetch('oeuvres/bibliotheque.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { render(d && Array.isArray(d.works) ? d.works : FALLBACK.works); })
      .catch(function () { render(FALLBACK.works); });
  }

  /* --------------------------------------------------------------------- */
  function init() {
    window.__homeReady = true;   // désarme le filet inline de index.html
    scroller = document.querySelector('.hw');
    try { reveal(); } catch (e) { fallbackReveal(); }
    try { marquee(); } catch (e) { /* non bloquant */ }
    try { topbarSolid(); } catch (e) { /* non bloquant */ }
    try { catalogue(); } catch (e) { /* non bloquant */ }
    try { heroBg(); } catch (e) { /* non bloquant */ }
  }
  function fallbackReveal() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger, .circuit-band');
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

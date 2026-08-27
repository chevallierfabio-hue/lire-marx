/* =========================================================================
   home.js — mouvement de la page d'accueil (/index.html)
   DA « sombre-chaude » (atelier à la bougie). Chargé en `defer`, après
   vendor/three.min.js.

   - reveal()        : IntersectionObserver (root = .hw) → classe .in
   - marquee()       : duplique le bandeau de concepts pour une boucle nette
   - heroBg()        : fond WebGL discret — feuillets pâles qui dérivent
                       (coupé si reduced-motion ou < 768px ; pause hors-écran)

   « Plus vivant » (inspiration zonixlab.com) — un seul pilote de
   défilement (rAF + abonnés), tout se coupe sous no-motion / < 768 px :
   - scrubReveal()    : titres révélés mot à mot au défilement
   - circuitScrub()   : « circuit du capital » — le scroll déplie
                        A→M→P→M′→A′ (barre + nœuds + paliers de texte)
   - countUp()        : comptage animé des chiffres clés à l'entrée en vue
   - cardFx()         : inclinaison + lueur des cartes sous le curseur
   - heroParallax()   : parallaxe fine du portrait du héros
   - developImages()  : photos d'archive du catalogue révélées par balayage
   - magneticButtons(): CTA principaux attirés vers le curseur
   - timelineStrip()  : « en préparation » = frise chronologique horizontale
                        (défilement natif + glisser souris + flèches clavier)

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
      return '<div class="hs-tl-card" role="listitem">' +
        '<span class="hs-tl-year">' + esc(w.year) + '</span>' +
        '<span class="hs-tl-title">' + esc(w.title) + '</span>' +
        '<span class="hs-tl-cat">' + esc(catLabel(w.category)) + '</span>' +
      '</div>';
    }

    function render(works) {
      var avail = works.filter(function (w) { return w.status === 'available'; })
                       .sort(function (a, b) { return a.year - b.year; });
      var plan = works.filter(function (w) { return w.status !== 'available'; })
                      .sort(function (a, b) { return a.year - b.year; });
      if (availEl) { availEl.innerHTML = avail.map(availCard).join(''); try { armDev(availEl); } catch (e) {} }
      if (planEl) { planEl.innerHTML = plan.map(planRow).join(''); try { timelineStrip(); } catch (e) {} }
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

  /* ═══════════════════════════════════════════════════════════════════════
     « PLUS VIVANT » — inspiration zonixlab.com, transposée à l'atelier.
     Un seul pilote de défilement (rAF, plusieurs abonnés). Tout se coupe
     proprement sous prefers-reduced-motion ou en dessous de 768 px.
     ═══════════════════════════════════════════════════════════════════════ */

  var scrollSubs = [], scrollQueued = false, driverWired = false;
  function runScrollSubs() {
    scrollQueued = false;
    var y = scrollPos(), vh = window.innerHeight || 1;
    for (var i = scrollSubs.length - 1; i >= 0; i--) {
      var keep = true;
      try { keep = scrollSubs[i](y, vh); } catch (e) {}
      if (keep === false) scrollSubs.splice(i, 1);
    }
  }
  function onScrollDriver() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(runScrollSubs);
  }
  function addScrollSub(fn) {
    scrollSubs.push(fn);
    if (!driverWired) {
      driverWired = true;
      /* capture : attrape le scroll de .hw comme celui du viewport,
         quel que soit le scroller réel du moment. */
      document.addEventListener('scroll', onScrollDriver, { passive: true, capture: true });
      window.addEventListener('resize', onScrollDriver);
    }
    try { fn(scrollPos(), window.innerHeight || 1); } catch (e) {}
  }

  /* — A. Titres révélés mot à mot au défilement — « l'encre qui prend » — */
  function scrubReveal() {
    if (REDUCE || window.innerWidth < 768) return;
    var heads = [].slice.call(document.querySelectorAll('.hs-sec-h'));
    if (!heads.length) return;
    document.documentElement.classList.add('js-viv');

    var INLINE = { EM: 1, I: 1, B: 1, STRONG: 1, SPAN: 1 };
    var items = heads.map(function (h) {
      h.classList.remove('reveal');
      h.classList.add('in');
      var words = [];
      [].slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'rw'; s.textContent = p;
            frag.appendChild(s); words.push(s);
          });
          h.replaceChild(frag, node);
        } else if (node.nodeType === 1 && INLINE[node.tagName]) {
          node.classList.add('rw'); words.push(node);
        }
      });
      return { el: h, words: words, done: false };
    });

    function fill(it, v) {
      for (var i = 0; i < it.words.length; i++) it.words[i].style.setProperty('--wp', v);
    }

    addScrollSub(function (y, vh) {
      var pending = false;
      items.forEach(function (it) {
        if (it.done) return;
        pending = true;
        var top = it.el.getBoundingClientRect().top;
        var a = vh * 0.92, b = vh * 0.5;
        var p = (a - top) / (a - b);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        var n = it.words.length || 1;
        for (var i = 0; i < it.words.length; i++) {
          var wp = (p - (i / n) * 0.55) / 0.45;
          it.words[i].style.setProperty('--wp', wp < 0 ? 0 : wp > 1 ? 1 : wp);
        }
        if (p >= 1) { fill(it, 1); it.done = true; }
      });
      return pending;
    });

    setTimeout(function () {
      items.forEach(function (it) { if (!it.done) { fill(it, 1); it.done = true; } });
    }, 7000);
  }

  /* — B/1. Le circuit du capital : le défilement déplie A→M→P→M′→A′ — la
     barre coule en continu, les nœuds et les paliers de texte s'enchaînent
     par cran. Statique (tous les paliers empilés) sous reduced-motion ou
     < 768 px. — */
  function circuitScrub() {
    var band = document.querySelector('.circuit-band');
    if (!band) return;
    var nodes = [].slice.call(band.querySelectorAll('.circuit-node'));
    var steps = [].slice.call(band.querySelectorAll('.circuit-step'));

    if (REDUCE || window.innerWidth < 768) {
      band.style.setProperty('--cp', '1');
      nodes.forEach(function (n) { n.classList.add('lit'); });
      return;
    }

    document.documentElement.classList.add('js-circuit');
    var nS = steps.length || 1;
    addScrollSub(function (y, vh) {
      var r = band.getBoundingClientRect();
      /* 0 quand le haut de la bande atteint 80 % de l'écran, 1 après
         l'avoir remontée d'un peu plus d'un écran */
      var p = (vh * 0.8 - r.top) / (r.height + vh * 0.15);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      band.style.setProperty('--cp', p.toFixed(4));       /* barre + étincelle : continu */
      var idx = Math.min(nS - 1, Math.floor(p * nS));     /* nœuds + texte : par cran */
      nodes.forEach(function (n, i) { n.classList.toggle('lit', i <= idx); });
      steps.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      return true;
    });
  }

  /* — 2. Photos d'archive : « développement » (balayage) à l'entrée en vue — */
  var _devIO = null;
  function armDev(scope) {
    if (!_devIO) return;
    var els = (scope || document).querySelectorAll('.hs-w-img');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].dataset.devArmed) { els[i].dataset.devArmed = '1'; _devIO.observe(els[i]); }
    }
  }
  function developImages() {
    if (REDUCE || window.innerWidth < 768 || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-dev');
    _devIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (x) {
        if (!x.isIntersecting) return;
        _devIO.unobserve(x.target);
        var t = x.target;   /* 2 frames : l'état clippé de base est bien pris avant la transition */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { t.classList.add('dev'); });
        });
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });
    armDev(document);
    setTimeout(function () {
      [].forEach.call(document.querySelectorAll('.js-dev .hs-w-img:not(.dev)'),
        function (el) { el.classList.add('dev'); });
    }, 6000);
  }

  /* — 3. Boutons d'action magnétiques — attirés vers le curseur — */
  function magneticButtons() {
    if (REDUCE) return;
    if (!(window.matchMedia &&
          window.matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
    var btns = [].slice.call(
      document.querySelectorAll('.hs-btns .btn-filled, .hs-closer .btn-filled'));
    if (!btns.length) return;
    btns.forEach(function (b) { b.classList.add('btn-mag'); });
    var R = 104, queued = false, mx = 0, my = 0;
    function apply() {
      queued = false;
      btns.forEach(function (b) {
        var r = b.getBoundingClientRect();
        var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy);
        var reach = R + r.width / 2;
        if (d < reach) {
          var s = 1 - d / reach;
          b.classList.add('pulling');
          b.style.transform = 'translate(' + (dx * 0.32 * s).toFixed(1) + 'px,' +
            (dy * 0.32 * s).toFixed(1) + 'px)';
        } else if (b.classList.contains('pulling')) {
          b.classList.remove('pulling');
          b.style.transform = '';
        }
      });
    }
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* — 4. Frise chronologique du corpus : défilement horizontal natif
     (trackpad / molette↔ / barre) + glisser à la souris + flèches clavier.
     Aucun scroll-hijack : la molette verticale laisse la page défiler. — */
  function timelineStrip() {
    var track = document.getElementById('lib-planned');
    if (!track || track.dataset.tl) return;
    if (!track.classList.contains('hs-timeline-track')) return;
    track.dataset.tl = '1';

    /* glisser à la souris (le tactile garde le défilement natif) */
    var down = false, startX = 0, startLeft = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || (e.button && e.button !== 0)) return;
      down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add('dragging');
      try { track.setPointerCapture(e.pointerId); } catch (x) {}
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      track.scrollLeft = startLeft - dx;
    });
    function endDrag() {
      if (!down) return;
      down = false;
      track.classList.remove('dragging');
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    /* clavier quand la frise a le focus */
    track.addEventListener('keydown', function (e) {
      var beh = REDUCE ? 'auto' : 'smooth';
      var step = Math.max(200, track.clientWidth * 0.85);
      if (e.key === 'ArrowRight') { track.scrollBy({ left: step, behavior: beh }); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { track.scrollBy({ left: -step, behavior: beh }); e.preventDefault(); }
      else if (e.key === 'Home') { track.scrollTo({ left: 0, behavior: beh }); e.preventDefault(); }
      else if (e.key === 'End') { track.scrollTo({ left: track.scrollWidth, behavior: beh }); e.preventDefault(); }
    });
  }

  /* — C. Chiffres clés : comptage animé à l'entrée en vue — */
  function countUp() {
    var stats = document.querySelector('.hs-stats');
    if (!stats) return;
    var nums = [].slice.call(stats.querySelectorAll('.hs-stat-n'));
    var targets = nums.map(function (el) {
      var m = (el.textContent || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : null;
    });
    if (REDUCE || !('IntersectionObserver' in window)) return;
    function finish() {
      nums.forEach(function (el, i) { if (targets[i] != null) el.textContent = String(targets[i]); });
    }
    nums.forEach(function (el, i) { if (targets[i] != null) el.textContent = '0'; });
    var fallback = setTimeout(finish, 6000);
    var io = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      io.disconnect(); clearTimeout(fallback);
      var t0 = performance.now(), D = 850;
      requestAnimationFrame(function step(now) {
        var k = Math.min((now - t0) / D, 1), e = 1 - Math.pow(1 - k, 3);
        nums.forEach(function (el, i) {
          if (targets[i] != null) el.textContent = String(Math.round(targets[i] * e));
        });
        if (k < 1) requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    io.observe(stats);
  }

  /* — D. Cartes : inclinaison qui suit le curseur + lueur de bougie — */
  function cardFx() {
    if (REDUCE) return;
    if (!(window.matchMedia &&
          window.matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
    var host = document.querySelector('.hw') || document;
    var cur = null, queued = false, lastE = null;
    function clear(card) {
      card.classList.remove('glow', 'tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    }
    function apply() {
      queued = false;
      var e = lastE; if (!e) return;
      var card = e.target.closest && e.target.closest('.hs-do-card,.hs-w-card');
      if (card !== cur) {
        if (cur) clear(cur);
        cur = card;
        if (card) card.classList.add('glow', 'tilting');
      }
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / (r.width || 1);
      var py = (e.clientY - r.top) / (r.height || 1);
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      card.style.setProperty('--ry', ((px - 0.5) * 5).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
    }
    host.addEventListener('mousemove', function (e) {
      lastE = e;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
    host.addEventListener('mouseleave', function () {
      if (cur) { clear(cur); cur = null; }
    }, true);
  }

  /* — E. Hero : parallaxe fine du portrait au défilement — */
  function heroParallax() {
    if (REDUCE || window.innerWidth < 768) return;
    var hero = document.querySelector('.hs-hero');
    var right = hero && hero.querySelector('.hs-right');
    if (!right) return;
    var armed = false;
    addScrollSub(function (y, vh) {
      var h = hero.offsetHeight || vh;
      var k = y / h; if (k < 0) k = 0;
      if (!armed) {
        if (k < 0.004) { right.style.transform = ''; return true; }
        right.style.transition = 'transform .12s linear';
        armed = true;
      }
      right.style.transform = 'translateY(' + (Math.min(k, 1.1) * -26).toFixed(1) + 'px)';
      return true;
    });
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
    try { scrubReveal(); } catch (e) { fallbackReveal(); }
    try { circuitScrub(); } catch (e) { /* non bloquant */ }
    try { countUp(); } catch (e) { /* non bloquant */ }
    try { cardFx(); } catch (e) { /* non bloquant */ }
    try { heroParallax(); } catch (e) { /* non bloquant */ }
    try { developImages(); } catch (e) { /* non bloquant */ }
    try { magneticButtons(); } catch (e) { /* non bloquant */ }
    /* timelineStrip() est appelé par catalogue() une fois les cartes rendues */
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

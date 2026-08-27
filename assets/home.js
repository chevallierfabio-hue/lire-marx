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
   - circuitChariot() : le VRAI chariot du jeu (assets/chariot.json, exporté
                        depuis le projet circuit-du-capital) traverse le fond
                        de cette section au défilement, cargaison comprise
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

  /* — B/1. « Le jeu » : section épinglée, le défilement déplie la boucle
     A→M→P→M′→A′. Le palier A tient le premier tiers du parcours (temps de
     lire avant que ça avance) ; barre et nœuds se calent sur le palier
     courant. Statique (tout empilé) sous reduced-motion, < 768 px, ou
     viewport trop court. — */
  function circuitScrub() {
    var pin = document.querySelector('.circuit-pin');
    var band = document.querySelector('.circuit-band');
    if (!band) return;
    var nodes = [].slice.call(band.querySelectorAll('.circuit-node'));
    var steps = [].slice.call(band.querySelectorAll('.circuit-step'));
    var spark = band.querySelector('.circuit-spark');
    var nS = steps.length || 1;

    function stat() {
      band.style.setProperty('--cp', '1');
      nodes.forEach(function (n) { n.classList.add('lit'); });
    }
    if (REDUCE || window.innerWidth < 768 || !pin) { stat(); return; }

    document.documentElement.classList.add('js-circuit');
    /* si le viewport est trop court, le CSS dépingle : on rend statique. */
    if (window.innerHeight <= 640) { stat(); return; }

    try { circuitChariot(); } catch (e) { /* non bloquant */ }

    addScrollSub(function (y, vh) {
      var r = pin.getBoundingClientRect();
      var span = r.height - vh;
      var raw = span > 0 ? (-r.top) / span : 0;
      /* marge en tête (la bande se pose) et en queue (A′ reste lisible) */
      var p = (raw - 0.08) / 0.82;
      p = p < 0 ? 0 : p > 1 ? 1 : p;

      /* A occupe le premier tiers ; M, P, M′, A′ se partagent le reste. */
      var idx;
      if (p < 0.34 || nS <= 1) { idx = 0; }
      else { idx = Math.min(nS - 1, 1 + Math.floor((p - 0.34) / (0.66 / (nS - 1)))); }

      /* curseur lumineux : flux CONTINU (pas de saut d'un nœud à l'autre).
         smoothstep ralentit le début → le curseur traîne près de A pendant
         que le palier A est affiché, puis arrive sur chaque nœud pile quand
         le texte change. */
      var cp = p * p * (3 - 2 * p);
      band.style.setProperty('--cp', cp.toFixed(4));
      nodes.forEach(function (n, i) { n.classList.toggle('lit', i <= idx); });
      steps.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      /* après la production (P), ce qui circule porte la plus-value */
      if (spark) spark.classList.toggle('grown', idx >= 3);
      /* le chariot reçoit `raw`, pas `cp` : sa course déborde de part et
         d'autre de l'épinglage (cf. progress() dans circuitChariot). */
      if (_chariot) _chariot(raw, idx);
      return true;
    });
  }

  /* — B/1 bis. Le VRAI chariot du jeu traverse le fond de la section.
     `assets/chariot.json` est l'objet Three.js exporté tel quel depuis
     ~/Desktop/circuit-du-capital (Vehicle.group sérialisé par toJSON) :
     géométries paramétriques + matériaux, ~28 Ko gzippés, relu par
     THREE.ObjectLoader — aucun loader supplémentaire à vendoriser.
     Le défilement le fait rouler le long d'une DIAGONALE courbe : il entre
     au loin en haut à gauche, passe par le centre, sort au premier plan en
     bas à droite en négociant deux virages (cap sur la tangente, roulis
     dans le virage, brume qui l'efface au loin). Sa course déborde de part
     et d'autre de l'épinglage de la section : il roule déjà quand on arrive
     dessus et finit quand on repart. La cargaison qu'il transporte change
     avec le palier du circuit (argent → moyens de production →
     marchandises → argent grossi), exactement comme en jeu.
     Coupé sous no-motion / < 768 px / viewport court / sans WebGL. — */
  var _chariot = null;
  function circuitChariot() {
    var canvas = document.getElementById('circuit-bg');
    if (!canvas || typeof THREE === 'undefined' || !THREE.ObjectLoader) return;
    if (!canvas.getContext ||
        !(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) return;

    var renderer, scene, camera, rig = null, wheels = [], cargos = {}, lamp = null;
    var raf = null, running = false, onScreen = false;
    var q = 0, idx = 0, last = null, spin = 0, settled = false;

    /* Fenêtre de défilement PROPRE au chariot, plus large que celle du
       circuit. `raw` vaut 0 quand la section s'épingle et 1 quand elle se
       dépingle ; il est déjà négatif pendant qu'elle monte vers nous et
       dépasse 1 pendant qu'elle s'en va. Le chariot part donc AVANT que la
       section ne se fige et finit APRÈS qu'elle s'est libérée : il est déjà
       en mouvement quand on arrive dessus, et il achève sa course quand on
       repart — plus de démarrage sec au moment précis de l'épinglage.
       Progression linéaire, sans lissage : une allure constante, comme un
       chariot qui roule. */
    var LEAD = 0.30, TAIL = 0.30;
    function progress(raw) {
      var v = (raw + LEAD) / (1 + LEAD + TAIL);
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    /* — Le chemin. Une DIAGONALE courbe : le chariot entre au fond en haut
       à gauche, passe par le centre, et sort au premier plan en bas à
       droite.

       Trois composantes, chacune pour une raison :
         · X, la traversée, de gauche à droite ;
         · Y_TOP → 0, la DESCENTE. C'est elle qui fait le « haut → bas ».
           La seule profondeur ne suffisait pas : la perspective écrase les
           lointains, un grand écart de Z ne déplaçait le chariot que d'une
           soixantaine de pixels tout en le forçant à rentrer de face. Ici
           il dévale franchement la pente, et Z reste libre de rester
           modéré (cap sain, croissance mesurée). L'exposant Y_EASE
           (> 1) creuse la pente au début et l'aplanit ensuite : le chariot
           plonge vite depuis le haut, puis roule au ras du bas de la
           section. C'est ce qui le fait passer SOUS le bloc de texte au
           milieu du parcours, là où il le traversait tout droit ;
         · Z_FAR → Z_NEAR, l'approche : il grossit en venant vers nous —
           le circuit revient grossi, et c'est le chariot qui le dit —,
           et Z_TURN y superpose deux virages pour que la diagonale ne
           soit pas une droite.
       Le cap suit la tangente et le roulis suit la courbure : il pilote,
       il ne glisse pas. */
    var Y_TOP = 9, Y_EASE = 1.9, Z_FAR = -9, Z_NEAR = 3, Z_TURN = 1.6;
    function pathAt(t) {
      var R = reach(), tau = Math.PI * 2;
      return {
        x:  (t * 2 - 1) * R,
        y:  Y_TOP * Math.pow(1 - t, Y_EASE),
        z:  Z_FAR + (Z_NEAR - Z_FAR) * t + Z_TURN * Math.sin(tau * t),
        dx: 2 * R,
        dz: (Z_NEAR - Z_FAR) + tau * Z_TURN * Math.cos(tau * t),
        /* dérivée seconde ≈ courbure : sert au roulis dans le virage */
        cz: -tau * tau * Z_TURN * Math.sin(tau * t)
      };
    }

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    /* 1.5 suffit : c'est un décor de fond, à 62 % d'opacité, derrière un
       voile. Plafonner ici plutôt qu'à 2 divise presque par deux le coût de
       remplissage sur écran Retina — c'est ce qui garde le défilement franc
       pendant que le chariot roule. */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x1e1710, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.5, 160);
    /* Brume à la couleur exacte de la section : ce qui est loin se fond
       dans le fond (canvas translucide sur --surface ⇒ disparition nette).
       Combinée à la courbe en profondeur, elle fait émerger le chariot de
       l'obscurité à l'entrée et l'y renvoie à la sortie. Bornes recalées
       sur le recul de caméra dans resize(). */
    if (THREE.Fog) scene.fog = new THREE.Fog(0x1e1710, 26, 49);

    /* lumière d'atelier à la bougie : clé chaude, contre-jour rouge drapeau */
    scene.add(new THREE.AmbientLight(0x3d2c1b, 0.95));
    var key = new THREE.DirectionalLight(0xffb765, 1.45); key.position.set(7, 9, 8);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xd5402f, 0.75); rim.position.set(-8, 3.5, -6);
    scene.add(rim);
    var gold = new THREE.PointLight(0xd8ad4c, 1.25, 22, 2); gold.position.set(0, 4.5, 4);
    scene.add(gold);

    /* ombre portée douce : une tache radiale au sol, le chariot ne flotte pas */
    var shadow = null;
    (function () {
      var S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
      var g = cv.getContext('2d');
      var gr = g.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
      gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      var t = new THREE.CanvasTexture(cv);
      shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.4),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.85, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02;
      shadow.visible = false; scene.add(shadow);
    })();

    /* Cadrage. Le recul suit le format pour que le chariot garde la même
       taille relative d'un écran à l'autre ; hauteur de caméra et point
       visé restent proportionnels à ce recul, donc l'inclinaison du regard
       ne bouge pas. Les deux coefficients sont calés ENSEMBLE sur les
       bornes de la diagonale : ils posent le départ (haut de pente, au
       loin) vers 62 % de la hauteur et l'arrivée (bas de pente, au premier
       plan) vers 96 %, tout en bas sans jamais sortir du cadre. C'est la
       DESCENTE qui fournit l'essentiel de ces 34 points, pas la caméra —
       d'où un angle de vue resté modéré, de trois quarts, et non plongeant. */
    function resize() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var d = 57 / camera.aspect;
      d = d < 26 ? 26 : d > 46 ? 46 : d;
      camera.position.set(0, 0.296 * d, d);
      camera.lookAt(0, 0.270 * d, 0);
      camera.updateProjectionMatrix();
      /* la brume s'ouvre du départ lointain (bien estompé) à l'arrivée
         rapprochée (nette) — c'est elle qui fait « émerger » le chariot */
      if (scene.fog) { scene.fog.near = d - 6; scene.fog.far = d + 22; }
      last = null;                 /* le recul change : on ne compare plus */
    }

    /* demi-course : de quoi entrer et sortir complètement du cadre */
    function reach() {
      var halfW = Math.tan(camera.fov * Math.PI / 360) * camera.position.z * camera.aspect;
      return halfW + 5;
    }

    function place(now) {
      if (!rig) return;
      var p = pathAt(q);
      /* première frame : pas de « saut » de roues depuis une position fictive */
      var mx = (last === null) ? 0 : p.x - last.x;
      var mz = (last === null) ? 0 : p.z - last.z;
      last = p;
      var moved = Math.sqrt(mx * mx + mz * mz);   /* longueur d'arc parcourue */

      rig.position.x = p.x;
      rig.position.z = p.z;
      /* descente + trépidation des pavés, proportionnelle à l'allure */
      var v = Math.min(1, moved * 6);
      rig.position.y = p.y + Math.sin(now * 0.013) * 0.05 * (0.35 + v);

      /* CAP : le chariot regarde là où il va. Le jeu le fait avancer vers
         son +Z local, et rotation.y = θ envoie ce +Z sur (sinθ, cosθ) — le
         cap est donc exactement atan2(dx, dz). Aucun biais à ajouter : la
         diagonale incline déjà le chariot d'une vingtaine de degrés vers
         nous, on ne le voit jamais en profil strict. */
      rig.rotation.y = Math.atan2(p.dx, p.dz);
      /* ROULIS : il s'incline dans la courbe, comme dans le jeu. Borné à
         ~4° — la courbure brute penche jusqu'à 11° aux extrémités, ce qui
         donne un chariot couché, pas un chariot qui vire. */
      var lean = p.cz * 0.0007;
      if (lean > 0.07) lean = 0.07; else if (lean < -0.07) lean = -0.07;
      rig.rotation.z = lean + Math.sin(now * 0.0021) * 0.012;

      if (shadow) {
        /* l'ombre est le contact au sol : elle descend avec le chariot */
        shadow.position.set(p.x, p.y + 0.02, p.z);
        shadow.visible = true;
      }
      /* les roues tournent avec la distance parcourue (r arrière .8, avant .54) */
      spin += moved * (mx < 0 ? -1 : 1);
      for (var i = 0; i < wheels.length; i++) {
        wheels[i].obj.rotation.x = -spin / wheels[i].r;
      }
      if (lamp && lamp.material) {
        lamp.material.emissiveIntensity = 1.0 + Math.sin(now * 0.006) * 0.28;
      }
    }

    function frame(now) {
      place(now);
      renderer.render(scene, camera);
      /* hors course (chariot sorti du cadre des deux côtés) : on rend une
         dernière image puis on rend la main. Inutile de repeindre 200
         maillages pendant tout le reste du défilement de la page. */
      if (q <= 0 || q >= 1) { settled = true; stop(); return; }
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || !rig || !onScreen) return;
      settled = false;
      running = true; raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    /* la cargaison suit le palier : A argent · M/P moyens · M′ marchandises
       · A′ argent (revenu grossi). */
    var CARGO = ['argent', 'moyens', 'moyens', 'marchandises', 'argent'];
    function setCargo(i) {
      var want = CARGO[i] || 'argent';
      for (var k in cargos) if (cargos[k]) cargos[k].visible = (k === want);
    }

    _chariot = function (raw, i) {
      q = progress(raw);
      if (i !== idx) { idx = i; setCargo(idx); }
      canvas.classList.toggle('on', q > 0.01 && q < 0.995);
      if (!running && rig && onScreen && !(settled && (q <= 0 || q >= 1))) start();
    };

    fetch('assets/chariot.json').then(function (r) {
      if (!r.ok) throw new Error('chariot ' + r.status);
      return r.json();
    }).then(function (json) {
      new THREE.ObjectLoader().parse(json, function (obj) {
        rig = obj;
        rig.scale.setScalar(0.78);   /* le cap est posé à chaque frame par place() */
        rig.traverse(function (o) {
          if (!o.name) return;
          if (o.name.indexOf('wheel-') === 0) {
            /* wheel-0/1 = grandes roues arrière (r .8), 2/3 = avant (r .54) */
            wheels.push({ obj: o, r: (+o.name.slice(6) < 2) ? 0.8 : 0.54 });
          } else if (o.name.indexOf('cargo-') === 0) {
            cargos[o.name.slice(6)] = o;
          } else if (o.name === 'lamp') {
            lamp = o;
          }
        });
        setCargo(idx);
        scene.add(rig);
        resize();
        /* Compile les ~50 programmes de la scène MAINTENANT, au chargement,
           et pas à la première image utile : sans ça la compilation tombait
           pile au moment où la section arrive, et se voyait comme un à-coup
           de défilement. */
        try { renderer.compile(scene, camera); } catch (e) { /* non bloquant */ }
        place(performance.now());
        renderer.render(scene, camera);
        start();
      });
    })['catch'](function () { /* pas de chariot : la section reste complète */ });

    window.addEventListener('resize', function () {
      resize(); if (!running && rig) { place(performance.now()); renderer.render(scene, camera); }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if ('IntersectionObserver' in window) {
      /* marge généreuse : la boucle est déjà armée bien avant que la section
         n'entre dans le cadre, en cohérence avec l'avance de `progress()`. */
      new IntersectionObserver(function (ents) {
        onScreen = ents[0].isIntersecting;
        if (onScreen) start(); else stop();
      }, { root: scrollRoot(), threshold: 0, rootMargin: '90% 0px 90% 0px' })
        .observe(canvas);
    } else { onScreen = true; }
    resize();
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

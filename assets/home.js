/* =========================================================================
   home.js — mouvement de la page d'accueil (/index.html)
   DA « sombre-chaude » (atelier à la bougie). Chargé en `defer`, après
   vendor/three.min.js.

   - reveal()        : IntersectionObserver (root = .hw) → classe .in
   - marquee()       : duplique le bandeau de concepts pour une boucle nette
   - msPanel()       : cartel + panneau de référence de la page réelle
   - heroBg()        : fond WebGL discret — la liasse de feuillets pâles,
                       rassemblée en éventail au repos, que le défilement
                       dénoue feuillet par feuillet (réversible, + rafale)
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
   - doCards()        : « Ce que vous pouvez faire » — les trois blocs se
                        posent comme des feuillets au défilement
   - libraryScrub()   : la bibliothèque se constitue — les photos d'archive
                        se développent au scroll, la frise « en préparation »
                        s'écrit année après année
   - communeScrub()   : Place publique — les notes se déposent une à une,
                        leur filet de citation se trace derrière elles
   - closerCandle()   : bande finale — la bougie prend au défilement,
                        puis vacille tant que la bande est à l'écran
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

  /* Ouverture du panneau « page réelle », partagée entre le cartel (chemin
     accessible, toujours là) et le clic sur le feuillet 3D (raccourci). */
  var _msOpen = null;

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

  /* — Page réelle : cartel + panneau de référence —
       Le cartel est un vrai bouton du DOM : c'est lui le chemin accessible,
       le clic sur le feuillet 3D n'en est que le raccourci à la souris. Tout
       marche sans WebGL. — */
  function msPanel() {
    var cartel = document.getElementById('msCartel');
    var modal = document.getElementById('msModal');
    if (!cartel || !modal) return;
    var closeBtn = modal.querySelector('.hs-ms-x');
    var lastFocus = null;

    function open() {
      if (!modal.hidden) return;
      /* ouvert depuis le feuillet 3D, l'élément actif est <body> : on rendra
         le focus au cartel plutôt qu'au néant */
      var a = document.activeElement;
      lastFocus = (a && a !== document.body) ? a : cartel;
      modal.hidden = false;
      if (closeBtn) closeBtn.focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape' || e.keyCode === 27) close(); }

    cartel.addEventListener('click', open);
    [].forEach.call(modal.querySelectorAll('[data-ms-close]'), function (el) {
      el.addEventListener('click', close);
    });
    _msOpen = open;
  }

  /* --------------------------------------------------------------------- */
  /* Fond WebGL du héros : LA LIASSE.
     Au repos, les feuillets d'archive sont rassemblés en éventail à droite du
     titre — quasi immobiles, ils respirent. Le défilement est le souffle qui
     dénoue la liasse : feuillet par feuillet, du dessus vers le fond, ils
     s'échappent vers le haut et vers nous, tournoient et sortent du cadre.
     Tout est fonction de la POSITION de scroll → strictement réversible : on
     remonte, la liasse se range. Par-dessus, un « coup de vent » — impulsion
     amortie sur la vitesse de molette — qui secoue la liasse au repos comme
     en vol. Coupé sous reduced-motion ou < 768 px ; en pause hors-écran. */
  function heroBg() {
    if (REDUCE || window.innerWidth < 768) return;
    var canvas = document.getElementById('hero-bg');
    if (!canvas || typeof THREE === 'undefined') return;
    if (!canvas.getContext ||
        !(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))) return;

    var BG = 0x0d0a07;
    var renderer, scene, camera, sheets = [], raf = null;
    var running = false, onScreen = true, active = false;
    var mx = 0, my = 0, tmx = 0, tmy = 0;
    var t = 0, tTarget = 0;              /* course dans le héros, 0 → 1 */
    var gust = 0, gustTarget = 0, lastY = null;

    /* — Réglages solidaires de la liasse. Ne pas en toucher un seul
         isolément : centre, éventail et dénouement sont calés ensemble pour
         que la liasse tienne à droite du texte, déborde du portrait juste ce
         qu'il faut, et soit entièrement sortie à la fin du héros. — */
    var CX = 5.5, CY = -2.3, CZ = 0.4;  /* centre : la moitié droite, libérée du cadre */
    var FAN  = 3.7;                      /* largeur de l'éventail au repos */
    var LEAD = 0.34;                     /* étalement des départs : le dernier part à t=LEAD */
    var SPAN = 0.60;                     /* durée du vol d'un feuillet (fraction de course) */
    var FLY  = 15;                       /* distance de sortie */

    function cl01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

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
      var t2 = new THREE.CanvasTexture(cv);
      t2.generateMipmaps = false;
      if (THREE.LinearFilter) t2.minFilter = THREE.LinearFilter;
      if (THREE.ClampToEdgeWrapping) t2.wrapS = t2.wrapT = THREE.ClampToEdgeWrapping;
      t2.anisotropy = 2;
      return t2;
    }

    /* Le fac-similé RÉEL, sur tous les feuillets : la liasse est faite de
       cette page et de rien d'autre. L'écriture dessinée ci-dessus ne sert
       plus que de texture d'attente, le temps que l'image arrive — et de
       repli définitif si elle n'arrive jamais. On réutilise
       le fichier déjà chargé par le <img fetchpriority="high"> du héros — zéro
       requête de plus, il sort du cache. Redessiné dans un canvas de 512 px de
       large : la texture n'a pas besoin de mieux à cette taille à l'écran, et
       ça garde le même pipeline (mipmaps coupés, LinearFilter) que les
       feuillets dessinés. Si l'image échoue, on ne fait rien : les feuillets
       gardent leur écriture dessinée. */
    function realTexture(done) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        var W = 512, H = Math.round(W * (im.naturalHeight || 5) / (im.naturalWidth || 4));
        var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        var g = cv.getContext('2d');
        try { g.drawImage(im, 0, 0, W, H); } catch (e) { return; }
        /* Le fac-similé est plus brun que les feuillets dessinés (crème) :
           un voile chaud en soft-light le ramène dans leur famille sans
           écraser l'encre — il doit rester reconnaissable comme la vraie
           page, pas se fondre au point de disparaître. */
        g.globalCompositeOperation = 'soft-light';
        g.fillStyle = 'rgba(255,216,152,.42)';
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over';
        var t = new THREE.CanvasTexture(cv);
        t.generateMipmaps = false;
        if (THREE.LinearFilter) t.minFilter = THREE.LinearFilter;
        if (THREE.ClampToEdgeWrapping) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
        t.anisotropy = 2;
        done(t);
      };
      im.onerror = function () { /* pas de fac-similé : rien ne change */ };
      im.src = 'assets/img/archive/manuscrit-ideologie-1846.webp';
    }

    /* La liasse : k=0 est le feuillet du dessus (part le premier, le plus
       opaque), k=COUNT-1 le fond de pile (part le dernier, noyé de brume).
       TOUS portent le fac-similé : la liasse n'est faite que de cette page.
       Ce qui les distingue, c'est le cadrage (voir sheetGeo) et la taille. */
    var realMats = [], realMeshes = [];

    /* Chaque feuillet reçoit sa propre géométrie pour pouvoir cadrer une
       PORTION différente de la page : la liasse n'est faite que de ce
       manuscrit, mais treize fois la même image ferait une pile de
       photocopies. Le dessus de la pile montre la page entière, les autres
       s'en approchent de plus ou moins près. */
    function sheetGeo(zoom) {
      var g = new THREE.PlaneGeometry(2.4, 3.1, 1, 1);
      if (zoom >= 0.999) return g;
      var uv = g.attributes.uv;
      var u0 = Math.random() * (1 - zoom), v0 = Math.random() * (1 - zoom);
      for (var i = 0; i < uv.count; i++) {
        uv.setXY(i, u0 + uv.getX(i) * zoom, v0 + uv.getY(i) * zoom);
      }
      uv.needsUpdate = true;
      return g;
    }
    var COUNT = window.innerWidth < 1100 ? 9 : 13;
    for (var k = 0; k < COUNT; k++) {
      var a = COUNT > 1 ? k / (COUNT - 1) : 0;
      var ang = (a - 0.5) * 1.3;                   /* ouverture de l'éventail */
      var op = 0.86 - a * 0.18;
      var mat = new THREE.MeshBasicMaterial({
        map: sheetTexture(k * 17),
        transparent: true, opacity: op,
        depthWrite: false, side: THREE.DoubleSide
      });
      /* les deux du dessus montrent la page entière, les suivantes un détail */
      var m = new THREE.Mesh(sheetGeo(k < 2 ? 1 : (0.58 + Math.random() * 0.3)), mat);
      realMats.push(mat); realMeshes.push(m);
      /* fuite : vers le haut, vers la droite, et vers nous pour le dessus */
      var dir = new THREE.Vector3(
        0.10 + Math.sin(ang) * 0.30 + (Math.random() - 0.5) * 0.22,
        0.95 + Math.random() * 0.30,
        0.05 + Math.random() * 0.25 - a * 0.22
      ).normalize();
      var u = {
        a: a, op: op,
        hx: CX + Math.sin(ang) * FAN + (Math.random() - 0.5) * 0.55,
        hy: CY + Math.cos(ang) * FAN * 0.26 + (Math.random() - 0.5) * 0.40,
        hz: CZ - a * 2.9 + (Math.random() - 0.5) * 0.5,
        rx: (Math.random() - 0.5) * 0.22,
        ry: (Math.random() - 0.5) * 0.30,
        rz: ang * 0.95 + (Math.random() - 0.5) * 0.14,
        dx: dir.x, dy: dir.y, dz: dir.z,
        dist: FLY * (0.85 + Math.random() * 0.45),
        sx: (Math.random() - 0.5) * 3.4,           /* tonneaux en vol */
        sy: (Math.random() - 0.5) * 3.8,
        sz: (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 2.6),
        t0: 0.015 + a * LEAD,                      /* décalage des départs */
        phase: Math.random() * 6.28
      };
      m.userData = u;
      /* dégradé de taille du dessus vers le fond : une pile, pas un tas */
      m.scale.setScalar(1.32 - a * 0.34 + Math.random() * 0.12);
      m.position.set(u.hx, u.hy, u.hz);
      m.rotation.set(u.rx, u.ry, u.rz);
      sheets.push(m); scene.add(m);
    }

    if (realMats.length) {
      realTexture(function (tex) {
        for (var i = 0; i < realMats.length; i++) {
          realMats[i].map = tex; realMats[i].needsUpdate = true;
        }
        /* la boucle peut dormir (liasse déjà sortie, ou hors écran) */
        if (!running && active) renderer.render(scene, camera);
      });
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
      t += (tTarget - t) * Math.min(1, dt * 9);
      gustTarget *= Math.pow(0.05, dt);            /* la rafale retombe en ~1 s */
      gust += (gustTarget - gust) * Math.min(1, dt * 9);

      for (var i = 0; i < sheets.length; i++) {
        var s = sheets[i], u = s.userData;
        var p = cl01((t - u.t0) / SPAN);
        var e = p * p * (3 - 2 * p);               /* décollage mou, sortie franche */
        var br = (1 - e) * (1 - e);                /* la respiration s'éteint en vol */
        var g = gust * (0.35 + u.a * 0.9);         /* le fond de pile encaisse plus */
        var adv = u.dist * e + g * 1.7;
        var w = now * 0.00055 + u.phase;

        s.position.x = u.hx + u.dx * adv + Math.cos(w * 0.8) * 0.09 * br;
        s.position.y = u.hy + u.dy * adv + Math.sin(w) * 0.12 * br;
        s.position.z = u.hz + u.dz * adv;
        s.rotation.x = u.rx + u.sx * e;
        s.rotation.y = u.ry + u.sy * e + Math.sin(w * 0.6) * 0.05 * br;
        s.rotation.z = u.rz + u.sz * e + Math.sin(w * 0.7) * 0.04 * br + g * 0.45;
        s.material.opacity = u.op * (1 - cl01((p - 0.72) / 0.28));
      }

      camera.position.x += (mx * 1.1 - camera.position.x) * 0.05;
      camera.position.y += ((-my * 0.7) - t * 1.1 - camera.position.y) * 0.05;
      camera.lookAt(0, t * -0.5, 0);
      renderer.render(scene, camera);

      /* liasse entièrement sortie et plus rien qui bouge : on rend la main */
      if (t > 0.995 && tTarget > 0.995 && Math.abs(gust) < 0.003) { stop(); return; }
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
    /* — viser la page réelle — Le raycast ne porte que sur les deux feuillets
         qui portent le fac-similé, et seulement tant que la liasse est encore
         au repos : une fois qu'elle s'envole, il n'y a plus rien à viser même
         si les meshes existent toujours (ils sont juste sortis et éteints). */
    var ray = null, ndc = null, aiming = false;
    var cartelEl = document.getElementById('msCartel');
    function setAim(on) {
      if (on === aiming) return;
      aiming = on;
      canvas.classList.toggle('aiming', on);
      if (cartelEl) cartelEl.classList.toggle('aim', on);
    }
    function pick(e) {
      if (!realMeshes.length) return;
      if (t > 0.25) { setAim(false); return; }
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) { setAim(false); return; }
      if (!ray) { ray = new THREE.Raycaster(); ndc = new THREE.Vector2(); }
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) { setAim(false); return; }
      ray.setFromCamera(ndc, camera);
      setAim(ray.intersectObjects(realMeshes, false).length > 0);
    }
    canvas.addEventListener('click', function () {
      if (aiming && _msOpen) _msOpen();
    });

    window.addEventListener('mousemove', function (e) {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
      try { pick(e); } catch (err) { /* jamais bloquer la parallaxe */ }
      start();
    });

    /* Course + rafale : on passe par le pilote de défilement commun, qui
       attrape aussi bien le scroll de .hw que celui du viewport. */
    var heroEl = document.querySelector('.hs-hero');
    addScrollSub(function (y, vh) {
      var span = (heroEl && heroEl.offsetHeight) || vh;
      tTarget = cl01(y / span);
      if (lastY !== null) {
        gustTarget += ((y - lastY) / (vh || 1)) * 1.15;
        if (gustTarget > 1) gustTarget = 1;
        if (gustTarget < -1) gustTarget = -1;
      }
      lastY = y;
      start();
      return true;
    });

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
      /* Disponibles : la plus tardive d'abord — Le Capital ouvre la
         bibliothèque, les Manuscrits suivent. (La frise « en préparation »,
         elle, reste chronologique : c'est une trajectoire.) */
      var avail = works.filter(function (w) { return w.status === 'available'; })
                       .sort(function (a, b) { return b.year - a.year; });
      var plan = works.filter(function (w) { return w.status !== 'available'; })
                      .sort(function (a, b) { return a.year - b.year; });
      if (availEl) { availEl.innerHTML = avail.map(availCard).join(''); }
      if (planEl) { planEl.innerHTML = plan.map(planRow).join(''); try { timelineStrip(); } catch (e) {} }
      try { libraryScrub(); } catch (e) { /* non bloquant */ }
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
    var q = 0, idx = 0, last = null, spin = 0, settled = false, pitch = 0;

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

    /* — LA ROUTE. Le chariot ne monte ni ne descend : il roule sur un sol
       plat, et c'est la PROFONDEUR qui fait tout le relief à l'écran. La
       version précédente le faisait littéralement s'élever puis redescendre
       en Y — il ne roulait plus, il lévitait, et la remontée était brutale
       parce qu'aucun objet ne monte comme ça.

       Trois composantes :
         · X, la traversée, de gauche à droite, pleine largeur ;
         · Z, LA ROUTE : elle part du fond (`Z_FAR`), s'incurve franchement
           vers nous jusqu'au premier plan à mi-course (`Z_BEND`), puis
           repart vers le fond sans y retourner tout à fait (`Z_END` reste
           en deçà de `Z_FAR` : le circuit revient grossi, et c'est le
           chariot qui le dit). C'est ce virage-là qui donne le relief : le
           chariot grossit en approchant, décroît en s'éloignant, et son cap
           tourne d'une trentaine de degrés — il entre braqué vers nous, se
           met de profil au plus près, et ressort braqué vers le fond ;
         · Y reste au sol, à l'ondulation du pavé près (`Y_BUMP`) : une
           houle lente qui suffit à faire hocher la caisse — c'est elle qui
           alimente l'assiette, sinon nulle.

       ATTENTION — le piège inverse est documenté et reste vrai : la
       perspective écrase les lointains, la profondeur seule ne déplace le
       chariot que d'une soixantaine de pixels VERTICALEMENT. Ce n'est pas
       un défaut ici, c'est le but : une route se traverse, elle ne se
       gravit pas. Le relief se lit à la TAILLE et au CAP, pas à la hauteur.
       Ce qui compte alors, c'est le cadrage : la caméra doit surplomber
       assez le sol pour qu'on voie la route (cf. `resize()`). */
    var Y_ROAD = 0, Y_BUMP = 0.30, BUMPS = 3.4;
    var Z_FAR = -11, Z_END = -3, Z_BEND = 11.5;
    /* part de dz retenue pour le cap (cf. « CAP » dans place()) */
    var HEAD_DAMP = 0.42;
    var PITCH_MAX = 0.20;            /* assiette bornée à ~11° */
    function yAt(t)  { return Y_ROAD + Y_BUMP * Math.sin(BUMPS * Math.PI * t); }
    function dyAt(t) { return Y_BUMP * BUMPS * Math.PI * Math.cos(BUMPS * Math.PI * t); }
    function pathAt(t) {
      var R = reach(), pi = Math.PI;
      return {
        x:  (t * 2 - 1) * R,
        y:  yAt(t),
        z:  Z_FAR + (Z_END - Z_FAR) * t + Z_BEND * Math.sin(pi * t),
        dx: 2 * R,
        dy: dyAt(t),
        dz: (Z_END - Z_FAR) + pi * Z_BEND * Math.cos(pi * t),
        /* dérivée seconde ≈ courbure : sert au roulis dans le virage */
        cz: -pi * pi * Z_BEND * Math.sin(pi * t)
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
      /* La caméra surplombe la route et regarde un peu plus bas qu'elle :
         c'est ce qui fait exister le sol. Les deux fractions sont solidaires
         — les rapprocher aplatit la vue jusqu'à ce que la route ne se lise
         plus, les écarter donne une plongée d'hélicoptère. */
      camera.position.set(0, 0.155 * d, d);
      camera.lookAt(0, 0.129 * d, 0);
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
      var first = (last === null);
      var mx = first ? 0 : p.x - last.x;
      var mz = first ? 0 : p.z - last.z;
      last = p;
      var moved = Math.sqrt(mx * mx + mz * mz);   /* longueur d'arc parcourue */

      rig.position.x = p.x;
      rig.position.z = p.z;
      /* descente + trépidation des pavés, proportionnelle à l'allure */
      var v = Math.min(1, moved * 6);
      rig.position.y = p.y + Math.sin(now * 0.013) * 0.05 * (0.35 + v);

      /* CAP : le chariot regarde là où il va. Le jeu le fait avancer vers
         son +Z local, et rotation.y = θ envoie ce +Z sur (sinθ, cosθ) — le
         cap est donc atan2(dx, dz).
         MAIS on amortit dz. La tangente 3D exacte donnait un chariot qui
         DÉRAPE : la perspective écrase le déplacement en profondeur, si
         bien qu'une caisse braquée de 30° vers nous se déplaçait à l'écran
         presque à l'horizontale. Ramener dz à sa contribution VISIBLE
         recale la caisse sur sa trajectoire apparente — il roule droit, et
         le virage se lit quand même parce qu'il fait varier le cap. */
      rig.rotation.y = Math.atan2(p.dx, p.dz * HEAD_DAMP);
      /* ASSIETTE : sans elle, le chariot remontait la côte à plat — il ne
         roulait pas, il glissait. La pente est prise sur le déplacement
         VISIBLE (même amortissement de dz que le cap, sinon la profondeur
         écrasée par la perspective fausserait l'angle), bornée à PITCH_MAX
         (un chariot se cabre, il ne décolle pas) et lissée d'une image à
         l'autre pour que le passage du creux ne soit pas un à-coup. */
      var horiz = Math.sqrt(p.dx * p.dx + p.dz * HEAD_DAMP * p.dz * HEAD_DAMP);
      var slope = Math.atan2(p.dy, horiz);
      if (slope > PITCH_MAX) slope = PITCH_MAX;
      else if (slope < -PITCH_MAX) slope = -PITCH_MAX;
      pitch = (first) ? -slope : pitch + (-slope - pitch) * 0.12;
      rig.rotation.x = pitch;
      /* ROULIS : il s'incline dans le virage, comme dans le jeu. Borné à
         ~4° — la courbure brute penche jusqu'à 11°, ce qui donne un
         chariot couché, pas un chariot qui vire. */
      var lean = p.cz * 0.0014;
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
        /* Ordre aviation : lacet (y) d'abord, puis ASSIETTE (x) autour de
           l'axe latéral DU CHARIOT, puis roulis (z) autour de son axe
           d'avancement. En 'XYZ' (défaut), rotation.x tournerait autour du X
           du MONDE — le chariot piquerait de travers dès qu'il est braqué. */
        rig.rotation.order = 'YXZ';
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

  /* — 2. La bibliothèque se constitue au défilement —
       Deux moitiés, une seule idée : ce qui existe se développe, ce qui vient
       s'écrit. En haut, le révélateur des photos d'archive suit le scroll
       (clip-path + barre dorée tenue à la limite exacte du tirage), le corps
       de la carte arrivant derrière la barre, avec un décalage d'une œuvre à
       l'autre. En bas, le filet de la frise se trace et chaque année s'allume
       à son passage. Appelé par catalogue() une fois les cartes rendues —
       jamais avant, le catalogue est peuplé par fetch. — */
  function libraryScrub() {
    if (REDUCE || window.innerWidth < 768) return;
    var grid = document.getElementById('lib-available');
    var cards = grid ? [].slice.call(grid.querySelectorAll('.hs-w-card')) : [];
    var band = document.querySelector('.hs-timeline');
    var track = band && band.querySelector('.hs-timeline-track');
    var rows = track ? [].slice.call(track.querySelectorAll('.hs-tl-card')) : [];
    if (!cards.length && !rows.length) return;
    var root = document.documentElement;
    /* Le défilement horizontal de la frise s'efface devant le lecteur : dès
       qu'il la saisit (glisser, tactile, clavier, molette HORIZONTALE), on
       cesse de la piloter. Une molette verticale ne compte pas — c'est le
       geste de faire défiler la page, curseur posé n'importe où. */
    var hManual = false;
    if (track) {
      var give = function () { hManual = true; };
      track.addEventListener('pointerdown', give, { passive: true });
      track.addEventListener('touchstart', give, { passive: true });
      track.addEventListener('keydown', give);
      track.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hManual = true;
      }, { passive: true });
    }
    /* le développement possède la révélation des cartes : sans ça, le fondu
       .reveal-stagger (déclenché plus tard que la course) les ferait apparaître
       d'un coup en plein milieu du tirage. */
    if (cards.length) { grid.classList.remove('reveal-stagger'); root.classList.add('js-devscrub'); }
    if (rows.length) root.classList.add('js-frise');

    function cl01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
    function ease(v) { return v * v * (3 - 2 * v); }

    addScrollSub(function (y, vh) {
      var i;
      /* — les tirages se développent — */
      if (cards.length) {
        var gr = grid.getBoundingClientRect();
        var q = cl01((vh * 0.90 - gr.top) / (vh * 0.52));
        for (i = 0; i < cards.length; i++) {
          var c = cards[i];
          var e = ease(cl01((q - i * 0.14) / 0.72));
          c.style.setProperty('--dev', e.toFixed(4));
          /* la barre n'existe que pendant le développement */
          c.style.setProperty('--bar',
            (e <= 0.001 || e >= 0.999) ? '0' : Math.min(1, 4 * e * (1 - e) * 1.9).toFixed(3));
          c.style.setProperty('--in', ease(cl01(e / 0.18)).toFixed(4));
          c.style.setProperty('--txt', ease(cl01((e - 0.35) / 0.5)).toFixed(4));
        }
      }
      /* — la frise s'écrit ET défile — */
      if (rows.length) {
        var br = band.getBoundingClientRect();
        var d = cl01((vh * 0.92 - br.top) / (vh * 0.42));
        band.style.setProperty('--draw', d.toFixed(4));

        /* La frise défile horizontalement pendant que la page défile
           verticalement : la trajectoire se parcourt au lieu d'attendre
           qu'on la traîne. Fenêtre plus longue que celle du filet — toute
           la traversée de la bande dans le viewport —, sinon la frise
           serait arrivée au bout avant qu'on ait eu le temps de la lire.
           On lâche prise dès que le lecteur s'en empare lui-même. */
        var maxS = track.scrollWidth - track.clientWidth;
        if (!hManual && maxS > 4) {
          var target = cl01((vh - br.top) / (vh + br.height)) * maxS;
          if (Math.abs(track.scrollLeft - target) > 0.5) track.scrollLeft = target;
        }

        /* Chaque année s'allume quand le filet la dépasse. `f` n'est PAS
           borné : une œuvre encore hors champ à droite a f > 1 et reste
           éteinte — c'est ce qui fait que l'animation continue pendant que
           la frise défile, chacune s'allumant à son entrée. */
        var W = track.clientWidth || 1, sx = track.scrollLeft || 0;
        for (i = 0; i < rows.length; i++) {
          var r = rows[i];
          var f = (r.offsetLeft - sx + r.offsetWidth * 0.3) / W;
          if (f < 0) f = 0;
          r.style.setProperty('--lit', cl01((d - f) / 0.05).toFixed(3));
        }
      }
      return true;
    });

    /* La mise en page vient de bouger sous nos pieds : les cartes viennent
       d'être injectées par fetch, et le navigateur a pu sauter sur l'ancre
       #catalogue entre-temps. Sans ce rappel, la première (et seule) mesure
       laisserait la section figée en plein développement tant que le lecteur
       ne défile pas. */
    requestAnimationFrame(onScrollDriver);
    setTimeout(onScrollDriver, 400);
    if (document.readyState !== 'complete') {
      window.addEventListener('load', onScrollDriver, { once: true });
    }
  }

  /* — 2 bis. Place publique : les notes se déposent —
       La seule partie vivante de la page (données réelles, gens réels).
       Chacune arrive décalée, poussée de quelques pixels, et le filet rouge
       de sa citation se trace de haut en bas juste après, comme un trait de
       plume qu'on vient de poser. Les notes sont montées par
       SHELL.commune.mount() de façon asynchrone : on attend qu'elles
       existent (MutationObserver) avant de s'abonner au défilement. — */
  function communeScrub() {
    if (REDUCE || window.innerWidth < 768) return;
    var host = document.getElementById('homeCommune');
    if (!host) return;
    var armed = false, mo = null;

    function cl01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
    function ease(v) { return v * v * (3 - 2 * v); }

    function arm() {
      if (armed) return;
      var cards = [].slice.call(host.querySelectorAll('.cm-card'));
      if (!cards.length) return;          /* encore en chargement, ou flux vide */
      armed = true;
      if (mo) { mo.disconnect(); mo = null; }
      document.documentElement.classList.add('js-place');

      addScrollSub(function (y, vh) {
        var r = host.getBoundingClientRect();
        var q = cl01((vh * 0.92 - r.top) / (vh * 0.50));
        for (var i = 0; i < cards.length; i++) {
          var e = ease(cl01((q - i * 0.11) / 0.62));
          cards[i].style.setProperty('--pin', e.toFixed(4));
          /* le trait vient après la pose : d'abord la note, puis la plume */
          cards[i].style.setProperty('--trait',
            (ease(cl01((e - 0.4) / 0.6)) * 100).toFixed(1) + '%');
        }
        return true;
      });
      /* les notes viennent d'apparaître : la mise en page a bougé */
      requestAnimationFrame(onScrollDriver);
      setTimeout(onScrollDriver, 400);
    }

    arm();
    if (!armed && 'MutationObserver' in window) {
      mo = new MutationObserver(arm);
      mo.observe(host, { childList: true, subtree: true });
      /* le flux peut ne jamais rien rendre (hors ligne, aucune note) */
      setTimeout(function () { if (mo) { mo.disconnect(); mo = null; } }, 20000);
    }
  }

  /* — 2 ter. Bande finale : la bougie prend —
       La page s'ouvre sur une bougie ; elle se referme dessus. --lum monte
       au défilement (la lueur vient de sous le bouton), puis .alight laisse
       vaciller la flamme tant que la bande est à l'écran. — */
  function closerCandle() {
    if (REDUCE || window.innerWidth < 768) return;
    var band = document.querySelector('.hs-closer');
    if (!band) return;
    document.documentElement.classList.add('js-candle');

    addScrollSub(function (y, vh) {
      var r = band.getBoundingClientRect();
      var q = (vh * 0.98 - r.top) / (vh * 0.46);
      q = q < 0 ? 0 : (q > 1 ? 1 : q);
      band.style.setProperty('--lum', (q * q * (3 - 2 * q)).toFixed(4));
      return true;
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        band.classList.toggle('alight', ents[0].isIntersecting);
      }, { threshold: 0.05 }).observe(band);
    } else {
      band.classList.add('alight');
    }
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
      var card = e.target.closest && e.target.closest('.hs-w-card');
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
    if (!right || !right.offsetParent) return;   /* cadre masqué : rien à décaler */
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

  /* — F. « Ce que vous pouvez faire » : les trois feuillets se posent —
       Prolongement direct de la liasse du héros : ce qui s'envole en haut
       redescend ici en trois feuillets qu'on peut lire. Chaque bloc arrive
       plus haut et de biais, puis se pose à plat, et le chiffre de chapitre
       prend l'encre une fois le feuillet posé. Piloté par la
       position de scroll → réversible. Sous no-motion / < 768 px la fonction
       sort et `.reveal-stagger` reprend la main (fondu simple). */
  function doCards() {
    if (REDUCE || window.innerWidth < 768) return;
    var grid = document.querySelector('.hs-do-cols');
    if (!grid) return;
    var cards = [].slice.call(grid.querySelectorAll('.hs-do-item'));
    if (!cards.length) return;
    grid.classList.remove('reveal-stagger');   /* le scrub prend la main */
    grid.classList.add('poses');

    var TILT = [-2.6, 1.9, -1.5];              /* chaque feuillet tombe de biais */
    var LEAD = 0.13;                           /* décalage d'un feuillet au suivant */
    var SPAN = 0.58;                           /* durée de la pose d'un feuillet */

    addScrollSub(function (y, vh) {
      var r = grid.getBoundingClientRect();
      var a = vh * 0.94, b = vh * 0.34;        /* course : haut de grille de 94 % à 34 % */
      var q = (a - r.top) / (a - b);
      if (q < 0) q = 0; if (q > 1) q = 1;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var k = (q - i * LEAD) / SPAN;
        if (k < 0) k = 0; if (k > 1) k = 1;
        var e = k * k * (3 - 2 * k);
        var ink = (e - 0.45) / 0.55;           /* l'encre vient après la pose */
        if (ink < 0) ink = 0; if (ink > 1) ink = 1;
        c.style.opacity = (0.05 + 0.95 * e).toFixed(3);
        c.style.setProperty('--drop', ((1 - e) * 30).toFixed(1) + 'px');
        c.style.setProperty('--tilt', ((1 - e) * TILT[i % 3]).toFixed(2) + 'deg');
        c.style.setProperty('--ink', ink.toFixed(3));
      }
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
    try { msPanel(); } catch (e) { /* non bloquant */ }
    try { heroBg(); } catch (e) { /* non bloquant */ }
    try { scrubReveal(); } catch (e) { fallbackReveal(); }
    try { circuitScrub(); } catch (e) { /* non bloquant */ }
    try { countUp(); } catch (e) { /* non bloquant */ }
    try { cardFx(); } catch (e) { /* non bloquant */ }
    try { heroParallax(); } catch (e) { /* non bloquant */ }
    try { doCards(); } catch (e) { /* non bloquant */ }
    try { magneticButtons(); } catch (e) { /* non bloquant */ }
    try { communeScrub(); } catch (e) { /* non bloquant */ }
    try { closerCandle(); } catch (e) { /* non bloquant */ }
    /* timelineStrip() et libraryScrub() sont appelés par catalogue(),
       une fois les cartes du catalogue réellement rendues */
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

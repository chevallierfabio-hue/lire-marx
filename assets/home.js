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

    var BG = 0xF7F5F0;
    var renderer, scene, camera, sheets = [], raf = null;
    var running = false, onScreen = true, active = false;
    var mx = 0, my = 0, tmx = 0, tmy = 0, scrollK = 0;

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(BG, 0);

    scene = new THREE.Scene();
    if (THREE.Fog) scene.fog = new THREE.Fog(BG, 9, 30);
    camera = new THREE.PerspectiveCamera(56, 1, 0.1, 60);
    camera.position.set(0, 0, 12);

    /* texture « feuillet » — papier pâle + griffonnage d'encre très discret */
    function sheetTexture(seed) {
      var S = 256;
      var cv = document.createElement('canvas'); cv.width = S; cv.height = S;
      var g = cv.getContext('2d');
      var grad = g.createLinearGradient(0, 0, 0, S);
      grad.addColorStop(0, '#efeae0'); grad.addColorStop(1, '#e0d8c6');
      g.fillStyle = grad; g.fillRect(0, 0, S, S);
      var i;
      for (i = 0; i < 16; i++) {
        g.fillStyle = 'rgba(150,130,95,' + (0.02 + Math.random() * 0.04) + ')';
        g.beginPath();
        g.arc(Math.random() * S, Math.random() * S, 3 + Math.random() * 10, 0, 7);
        g.fill();
      }
      g.strokeStyle = 'rgba(70,62,48,0.30)'; g.lineWidth = 1.4; g.lineCap = 'round';
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
        transparent: true, opacity: 0.62,
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
  function init() {
    window.__homeReady = true;   // désarme le filet inline de index.html
    scroller = document.querySelector('.hw');
    try { reveal(); } catch (e) { fallbackReveal(); }
    try { marquee(); } catch (e) { /* non bloquant */ }
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

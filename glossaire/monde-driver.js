/* LE PILOTE DES MONDES — commun à toutes les pages-monde du glossaire.
   Décide si la scène peut jouer (≥ 1100 px, pas de reduced-motion, WebGL),
   charge Three.js puis la scène de la notion (monde.js, qui expose
   window.LM_MONDE = function(canvas){ return {set(g,dt), frame(dt),
   resize(), render(), dispose()} }), et la pilote par la POSITION de
   lecture : g = index de la section sous la ligne de lecture + fraction
   parcourue. Tout est réversible — on remonte, la scène se range.
   Sans scène (mobile, reduced-motion, pas de WebGL, échec de chargement),
   l'image fixe reste : la page est finie sans une ligne de script.
   Les seuils se lisent à matchMedia, jamais à innerWidth (au moment où le
   script s'exécute, la fenêtre peut encore annoncer 0). */
(function(){
  'use strict';
  var aside = document.querySelector('.nt-monde');
  if (!aside) return;
  var canvas = aside.querySelector('canvas');
  var still = aside.querySelector('.nt-monde-still');
  var cap = aside.querySelector('.nt-monde-cap');
  var secs = [].slice.call(document.querySelectorAll('.nt-sec[data-etape]'));
  if (!canvas || !secs.length) return;

  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WIDE = matchMedia('(min-width: 1100px)').matches;
  function hasGL(){
    try { var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch (e) { return false; }
  }
  if (REDUCE || !WIDE || !hasGL()) return;

  function load(src){
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  var p = (typeof THREE === 'undefined') ? load(aside.dataset.three) : Promise.resolve();
  p.then(function(){ return load(aside.dataset.scene); }).then(start).catch(function(){});

  function start(){
    if (typeof window.LM_MONDE !== 'function') return;
    var monde;
    try { monde = window.LM_MONDE(canvas); } catch (e) { monde = null; }
    if (!monde) return;
    canvas.hidden = false;
    if (still) still.hidden = true;
    document.documentElement.classList.add('js-monde');
    monde.resize();

    var g = 0, cur = -1, queued = false;
    function progress(){
      var vh = window.innerHeight || 0;
      if (!vh) return g;
      var line = vh * 0.55, out = secs.length;
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect();
        if (line < r.top) { out = i; break; }
        if (line < r.bottom) { out = i + (line - r.top) / Math.max(1, r.height); break; }
      }
      return out;
    }
    function legend(){
      var i = Math.min(secs.length - 1, Math.max(0, Math.floor(g)));
      if (i === cur || !cap) return;
      cur = i;
      var txt = secs[i].dataset.legende || '';
      cap.classList.add('swap');
      setTimeout(function(){ cap.textContent = txt; cap.classList.remove('swap'); }, 180);
    }
    var locked = false;   /* la sonde tient la position : les remesures n'écrivent plus */
    function measure(){
      if (locked) return;
      g = progress();
      monde.set(g);
      legend();
    }
    function onScroll(){
      if (queued) return;
      queued = true;
      requestAnimationFrame(function(){ queued = false; measure(); });
    }
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', function(){ monde.resize(); onScroll(); });

    /* Le piège de la mesure unique : la coquille se monte après nous et
       déplace tout — on remesure quand elle est là, et quand les polices
       arrivent. */
    measure();
    requestAnimationFrame(measure);
    setTimeout(measure, 400);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    /* La boucle : ne tourne que si la scène est à l'écran et l'onglet
       visible — une bougie qui vacille pour personne, c'est du GPU jeté. */
    var onScreen = true, raf = null, last = 0;
    function frame(now){
      raf = null;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      monde.frame(dt);
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function run(){ if (!raf && onScreen && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(es){
        onScreen = es[0].isIntersecting; if (onScreen) run();
      }, { threshold: 0 }).observe(aside);
    }
    document.addEventListener('visibilitychange', run);
    run();
    /* Sonde pour la vérification à la main — sans effet en usage normal. */
    window.__ntMonde = { monde: monde, set: function(v){ locked = true; g = v; monde.set(v); legend(); }, free: function(){ locked = false; measure(); }, get: function(){ return g; } };
  }
})();

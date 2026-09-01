/* ═══════════════════════════════════════════════════════════════════════
   atelier-motion.js — le mouvement des pages d'atelier
   (mission `ateliers-mouvement`)

   Les ateliers étaient la seule partie du site sans vie : la DA et la mise
   en page ont été portées au niveau de l'accueil, pas le mouvement. Ce
   module apporte le MÊME vocabulaire que `assets/home.js`, et il obéit aux
   mêmes règles de la maison :

   - tout est fonction de la POSITION de défilement → strictement
     réversible : on remonte, ça se range ;
   - le DÉFAUT CSS est l'état POSÉ (`var(--x, 1)`) : sans JS, sous
     reduced-motion ou en dessous de 768 px, la page s'affiche finie ;
   - les périodes des mouvements continus ne sont pas multiples ;
   - aucune dépendance : le pilote de défilement est dupliqué ici plutôt
     que couplé à home.js (règle maison — home.js ne se charge que sur
     l'accueil, et les petits outils se dupliquent).

   CE QUI CHANGE PAR RAPPORT À L'ACCUEIL — les panneaux à onglets.
   Un panneau inactif est en `display:none` : ses éléments mesurent 0 et
   ne doivent RIEN recevoir. Et quand on bascule d'onglet, le panneau
   apparaît déjà à sa place définitive, sans le moindre défilement — il
   faut donc remesurer à ce moment-là, sinon la section reste figée à
   mi-course (c'est « le piège de la mesure unique » de l'accueil, en
   pire : ici il se rejoue à chaque clic d'onglet).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Le mouvement ne s'arme pas sur mobile étroit ni sous reduced-motion.
     `innerWidth` NUL veut dire « inconnu » (onglet en arrière-plan), pas
     « étroit » — piège déjà rencontré sur la Place publique. */
  function tooNarrow() {
    var w = window.innerWidth || 0;
    return w > 0 && w < 768;
  }
  if (REDUCE || tooNarrow()) return;

  /* --- le pilote de défilement (position, jamais delta) ----------------- */
  var subs = [], queued = false, wired = false;
  function pos() { return window.scrollY || window.pageYOffset || 0; }
  function runSubs() {
    queued = false;
    var y = pos(), vh = window.innerHeight || 1;
    for (var i = subs.length - 1; i >= 0; i--) {
      var keep = true;
      try { keep = subs[i](y, vh); } catch (e) {}
      if (keep === false) subs.splice(i, 1);
    }
  }
  function onDriver() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(runSubs);
  }
  function addSub(fn) {
    subs.push(fn);
    if (!wired) {
      wired = true;
      document.addEventListener('scroll', onDriver, { passive: true, capture: true });
      window.addEventListener('resize', onDriver);
    }
    try { fn(pos(), window.innerHeight || 1); } catch (e) {}
  }

  /* Un élément d'un panneau masqué ne mesure rien : on ne le touche pas.
     `getClientRects().length` est le test qui ne ment pas sur un ancêtre
     en display:none (là où offsetParent ment sur le position:fixed). */
  function shown(el) { return !!el && el.getClientRects().length > 0; }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  /* progression d'un élément dans la fenêtre : 0 quand il entre par le
     bas, 1 quand il a atteint sa place de lecture */
  function through(el, vh, aF, bF) {
    var top = el.getBoundingClientRect().top;
    var a = vh * (aF || 0.92), b = vh * (bF || 0.55);
    return clamp01((a - top) / (a - b));
  }

  /* ── A. Le titre de section PREND L'ENCRE quand son onglet s'ouvre ───
     Le geste de l'accueil (`scrubReveal`), mais déclenché autrement, et
     pour une raison mesurée : sur une page à onglets, le titre d'un
     panneau est TOUJOURS en position de lecture au moment où il
     apparaît (mesuré : --wp saturait à 1 dès la bascule). Scrubbé, le
     geste ne se serait jamais vu. Il se joue donc à l'OUVERTURE du
     panneau — on ouvre la section, son titre s'écrit —, une fois par
     chargement. C'est le pendant, pour un atelier, de l'entrée
     orchestrée du héros de l'accueil. */
  var titles = [];
  function inkTitles() {
    /* seulement les titres de PANNEAU : eux apparaissent toujours en
       position de lecture, d'où l'entrée orchestrée. Les titres de
       SECTION (.at-sec-h) vivent sous le pli — ils sont scrubbés par
       inkSections(). */
    var heads = [].slice.call(document.querySelectorAll('.panel-head h2.sec'))
      .filter(function (h) { return !h.closest || !h.closest('.atl-dossier'); });
    if (!heads.length) return;
    document.documentElement.classList.add('js-atviv');

    var INLINE = { EM: 1, I: 1, B: 1, STRONG: 1, SPAN: 1 };
    titles = heads.map(function (h) {
      var words = [];
      [].slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var sp = document.createElement('span');
            sp.className = 'atw'; sp.textContent = p;
            frag.appendChild(sp); words.push(sp);
          });
          h.replaceChild(frag, node);
        } else if (node.nodeType === 1 && INLINE[node.tagName]) {
          node.classList.add('atw'); words.push(node);
        }
      });
      var panel = h.closest ? h.closest('section.panel') : null;
      var it = { el: h, words: words, panel: panel, played: false };
      setWp(it, 0);
      return it;
    });
    playVisibleTitles();
  }

  function setWp(it, v) {
    for (var i = 0; i < it.words.length; i++) it.words[i].style.setProperty('--wp', v);
  }

  function playTitle(it) {
    if (it.played) return;
    it.played = true;
    var t0 = 0, n = it.words.length || 1, fin = false;
    function step(now) {
      if (fin) return;
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / 850);
      for (var i = 0; i < it.words.length; i++) {
        it.words[i].style.setProperty('--wp',
          clamp01((p - (i / n) * 0.55) / 0.45).toFixed(3));
      }
      if (p >= 1) { fin = true; return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    /* le filet : un titre ne doit JAMAIS rester à moitié écrit si le rAF
       est bridé (onglet en arrière-plan, machine lente) */
    setTimeout(function () { if (!fin) { fin = true; setWp(it, 1); } }, 1900);
  }

  /* joue les titres des panneaux réellement affichés */
  function playVisibleTitles() {
    for (var i = 0; i < titles.length; i++) {
      if (!titles[i].played && shown(titles[i].el)) playTitle(titles[i]);
    }
  }

  /* ── A bis. Les titres de SECTION s'écrivent au défilement ───────────
     Même encre, autre déclencheur : un titre de section vit SOUS LE PLI,
     on l'atteint en descendant — c'est donc un vrai scrub, réversible,
     et le petit label le précède d'un souffle. */
  function inkSections() {
    /* Les six titres du Dossier de Capital sont des titres de SECTION et
       non de panneau, malgré leur balisage : les six panneaux y sont
       affichés d'un coup, empilés sur onze mille pixels. Confiés à
       inkTitles(), ils s'encraient donc TOUS À LA FOIS à l'ouverture du
       Dossier (mesuré : --wp valait 1 sur les six) — cinq gestes sur six
       dépensés sous le pli, invisibles. Ils reviennent ici, au scrub :
       chaque titre s'écrit quand on l'atteint. */
    var heads = [].slice.call(document.querySelectorAll(
      '.at-sec-h, .atl-dossier .panel-head h2.sec'));
    var labels = [].slice.call(document.querySelectorAll('.at-sec-label'));
    if (!heads.length) return;
    document.documentElement.classList.add('js-atviv');

    var INLINE = { EM: 1, I: 1, B: 1, STRONG: 1, SPAN: 1 };
    var items = heads.map(function (h) {
      var words = [];
      [].slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var sp = document.createElement('span');
            sp.className = 'atw'; sp.textContent = p;
            frag.appendChild(sp); words.push(sp);
          });
          h.replaceChild(frag, node);
        } else if (node.nodeType === 1 && INLINE[node.tagName]) {
          node.classList.add('atw'); words.push(node);
        }
      });
      return { el: h, words: words };
    });

    addSub(function (y, vh) {
      items.forEach(function (it) {
        if (!shown(it.el)) return;
        var p = through(it.el, vh, 0.94, 0.55), n = it.words.length || 1;
        for (var i = 0; i < it.words.length; i++) {
          it.words[i].style.setProperty('--wp',
            clamp01((p - (i / n) * 0.5) / 0.5).toFixed(3));
        }
      });
      labels.forEach(function (el) {
        if (!shown(el)) return;
        el.style.setProperty('--lab', through(el, vh, 0.96, 0.66).toFixed(3));
      });
    });
  }

  /* ── B. Le bandeau de départ s'allume ────────────────────────────────
     Même mécanique que la bande finale de l'accueil (`closerCandle`) :
     la surface d'emphase arrive presque éteinte et la lumière MONTE avec
     le défilement — une bougie éclaire d'en bas, pas du plafond. C'est
     littéralement la surface sur laquelle tombe la bougie (cf. la règle
     des cartes d'emphase du socle sombre). */
  function startBand() {
    var band = document.querySelector('.cap-start');
    if (!band) return;
    document.documentElement.classList.add('js-atlum');

    /* Ce bandeau est AU-DESSUS de la ligne de flottaison : il n'a aucune
       place pour s'allumer au défilement (mesuré : --lum partait déjà à
       0,94 à y=0, le geste était invisible). C'est donc une ENTRÉE
       ORCHESTRÉE — le motif du héros de l'accueil : on arrive au bureau,
       la lampe s'allume, une fois. Le scrub reste pour tout ce qui vit
       sous le pli. */
    var t0 = 0, done = false;
    function light(now) {
      if (done) return;
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / 900);
      var e = 1 - Math.pow(1 - p, 3);
      band.style.setProperty('--lum', e.toFixed(3));
      if (p >= 1) { done = true; return; }
      requestAnimationFrame(light);
    }
    band.style.setProperty('--lum', '0');
    requestAnimationFrame(light);
    /* Le filet : un rAF bridé (onglet en arrière-plan, machine lente) ne
       doit JAMAIS laisser le bandeau dans la pénombre. */
    setTimeout(function () {
      if (!done) { done = true; band.style.setProperty('--lum', '1'); }
    }, 1800);
  }

  /* ── C. Les trois idées se développent ───────────────────────────────
     Le « révélateur » de la bibliothèque de l'accueil (`libraryScrub`),
     porté ici parce que c'est LA MÊME MATIÈRE : des tirages d'archive.
     `--dev` balaie le clip-path de gauche à droite, `--bar` tient la
     barre dorée 3 px en deçà de la limite (posée pile dessus, le
     clip-path la rognerait entièrement), `--in` fait arriver la carte en
     fantôme avant le tirage, `--txt` amène le texte derrière la barre.
     Décalage de 0,14 d'une carte à l'autre, comme les œuvres du
     catalogue. */
  function developIdeas() {
    var all = [].slice.call(document.querySelectorAll('.cap-idea-card'));
    if (!all.length) return;
    document.documentElement.classList.add('js-atdev');
    /* le fondu global ne doit pas les faire apparaître d'un coup en plein
       développement */
    var grid = document.querySelector('.cap-ideas-grid');
    if (grid) grid.classList.remove('reveal-stagger');

    function put(card, d) {
      card.style.setProperty('--dev', d.toFixed(3));
      card.style.setProperty('--in', clamp01(d * 5).toFixed(3));
      card.style.setProperty('--bar', (d > 0.004 && d < 0.996 ? 1 : 0));
      card.style.setProperty('--txt', clamp01((d - 0.45) / 0.4).toFixed(3));
    }

    /* Depuis que la section « Pour entrer » du Dossier a été supprimée,
       les trois idées de Capital ne vivent plus que dans le SEUIL — qui
       s'affiche au chargement, en position de lecture, et se referme au
       premier clic. Il n'y a donc AUCUN défilement sous elles : scrubbées,
       elles resteraient à demi tirées pour de bon. C'est une ENTRÉE
       ORCHESTRÉE, exactement comme le bandeau de départ (règle déjà posée
       : ce qui apparaît toujours en position de lecture ne se scrubbe
       pas). Le scrub reste pour les cartes qui vivent dans une page qui
       défile — celles des Manuscrits. */
    var seuil = document.querySelector('.atl-seuil');
    var inSeuil = [], cards = [];
    all.forEach(function (c) {
      (seuil && seuil.contains(c) ? inSeuil : cards).push(c);
    });

    if (seuil && inSeuil.length) {
      var played = false;
      var develop = function () {
        if (played || !shown(seuil)) return;
        played = true;
        var t0 = 0, done = false;
        function step(now) {
          if (done) return;
          if (!t0) t0 = now;
          var p = Math.min(1, (now - t0) / 1400);
          inSeuil.forEach(function (c, i) { put(c, clamp01((p - i * 0.14) / 0.62)); });
          if (p >= 1) { done = true; return; }
          requestAnimationFrame(step);
        }
        inSeuil.forEach(function (c) { put(c, 0); });
        requestAnimationFrame(step);
        /* Le filet : un rAF bridé ne doit JAMAIS laisser un tirage à
           moitié sorti du bain. */
        setTimeout(function () {
          if (!done) { done = true; inSeuil.forEach(function (c) { put(c, 1); }); }
        }, 2600);
      };
      develop();
      if (window.MutationObserver)
        new MutationObserver(develop).observe(seuil,
          { attributes: true, attributeFilter: ['hidden'] });
    }

    if (!cards.length) return;
    addSub(function (y, vh) {
      cards.forEach(function (card, i) {
        if (!shown(card)) return;
        var p = through(card, vh, 0.95, 0.5);
        put(card, clamp01((p - i * 0.14) / 0.62));
      });
    });
  }

  /* ── D. Les blocs d'action se posent ─────────────────────────────────
     Le geste des trois blocs « Ce que vous pouvez faire » de l'accueil
     (`doCards`) : le bloc arrive plus haut et de biais, puis se pose à
     plat, décalé d'un bloc au suivant. */
  function poseBlocks() {
    var blocks = [].slice.call(document.querySelectorAll('.cap-actions-row .cap-action'));
    if (!blocks.length) return;
    document.documentElement.classList.add('js-atpose');
    var row = document.querySelector('.cap-actions-row');
    if (row) row.classList.remove('reveal-stagger');
    var TILT = [-1.9, 1.4, -1.2];

    addSub(function (y, vh) {
      blocks.forEach(function (b, i) {
        if (!shown(b)) return;
        var p = clamp01((through(b, vh, 0.98, 0.6) - i * 0.12) / 0.7);
        var e = 1 - Math.pow(1 - p, 3);          /* pose douce, jamais sèche */
        b.style.setProperty('--drop', ((1 - e) * 26).toFixed(1) + 'px');
        b.style.setProperty('--tilt', ((1 - e) * (TILT[i % TILT.length])).toFixed(2) + 'deg');
        b.style.setProperty('--pose', e.toFixed(3));
      });
    });
  }

  /* ── E. Le cheminement SE DÉDUIT ─────────────────────────────────────
     La section dit : « Le Capital ne juxtapose pas des thèmes : il
     DÉDUIT. Chaque catégorie révèle une contradiction qui rend la
     suivante nécessaire. » Le mouvement le dit donc littéralement : le
     fil descend au défilement (`--draw`), sa tête éclaire ce qu'elle
     atteint (`--head`), et rien n'existe devant elle — une marche ne
     s'allume (`--lit`) que lorsque la déduction parvient à SON point sur
     l'axe, le moteur (la contradiction) n'apparaît qu'au moment de
     pousser vers la suivante.

     La position de chaque marche est mesurée SUR L'AXE, en pourcentage
     de la hauteur du fil — pas sur un simple index : les cartes n'ont
     pas la même hauteur, un échelonnement régulier aurait allumé des
     marches que le fil n'a pas encore atteintes. */
  function walkDeduce() {
    var walk = document.querySelector('#deriv .walk');
    if (!walk) return;

    /* Trois serpentins, désormais, et jamais un :has() pour les
       distinguer : sur Capital la marche est une MARCHE d'ascension
       (.wk-line, une colonne, le fil à gauche, une seule ouverte à la
       fois), sur les Manuscrits elle EST le bloc le long d'un fil. La
       variante « cartes » en zigzag n'existe plus sur Capital ; son CSS
       reste pour qui la rendrait ailleurs. */
    var rungs = !!walk.querySelector('.wk-line');
    var cards = !rungs && !!walk.querySelector('.walk-card');
    walk.classList.add(rungs ? 'walk-rungs' : cards ? 'walk-cards' : 'walk-thread');
    if (!cards) walk.style.setProperty('--axis', rungs ? '23px' : '8px');
    document.documentElement.classList.add('js-atwalk');

    /* Le serpentin est construit par le script de la page. Il l'est avant
       nous (script inline pendant le parse, ce module en defer), mais on
       ne s'y fie pas : la liste se relit tant qu'elle est vide. */
    var parts = [], steps = [];
    function collect() {
      parts = [].slice.call(walk.querySelectorAll('.walk-step, .walk-motor'));
      steps = [].slice.call(walk.querySelectorAll('.walk-step'));
      return parts.length;
    }
    collect();

    addSub(function (y, vh) {
      if (!shown(walk)) return;
      if (!parts.length && !collect()) return;
      var r = walk.getBoundingClientRect();
      if (!r.height) return;
      /* le fil se trace pendant que la section traverse la fenêtre : il
         part quand le haut du bloc atteint les deux tiers de l'écran, il
         est complet quand le bas du bloc passe le tiers bas */
      var a = vh * 0.66, b = -r.height + vh * 0.78;
      var p = clamp01((a - r.top) / (a - b));
      walk.style.setProperty('--draw', (p * 100).toFixed(2) + '%');
      walk.style.setProperty('--head', (p > 0.004 && p < 0.996 ? 1 : 0));

      /* où en est la déduction, en pixels écran. La position de chaque
         marche est mesurée SUR L'AXE et non déduite d'un index : les
         cartes n'ont pas la même hauteur, un échelonnement régulier
         allumerait des marches que le fil n'a pas encore atteintes. */
      var front = r.top + p * r.height;
      for (var i = 0; i < parts.length; i++) {
        var er = parts[i].getBoundingClientRect();
        var anchor = er.top + (cards ? er.height / 2 : 14);
        /* la lumière arrive AVEC le fil, elle ne le devance pas */
        parts[i].style.setProperty('--lit',
          clamp01((front - anchor + 90) / 110).toFixed(3));
      }

      /* L'ASCENSION : la marche ouverte est celle où l'on est. On ne
         mesure pas contre le front du fil mais contre la LIGNE DE
         LECTURE (38 % de la hauteur) — le fil, lui, court en avance sur
         toute la section, et il aurait déplié la dernière marche bien
         avant qu'on y arrive. Fonction de la POSITION, donc réversible :
         on remonte, la marche précédente se rouvre.
         Rien n'est piloté une fois que le lecteur a saisi l'objet (clic,
         ou focus clavier dans la colonne) : refermer sous les yeux de
         quelqu'un ce qu'il vient d'ouvrir serait le pire des services. */
      if (!rungs || !window.walkOpen) return;
      if (window.walkSeized && window.walkSeized()) return;
      var line = vh * 0.38, best = 0;
      for (var j = 0; j < steps.length; j++) {
        if (steps[j].getBoundingClientRect().top <= line) best = j + 1;
      }
      /* au-dessus de la première marche, c'est encore la première qui
         est « celle où l'on est » : on n'affiche jamais douze lignes
         nues, ce serait un sommaire, pas une déduction */
      window.walkOpen(best || 1, false);
    });
  }

  /* ── E bis. L'INSTRUMENT SE DÉMONTRE ─────────────────────────────────
     Treize pavés « Comment lire » disaient ce qu'on comprend en une
     seconde à voir la chose bouger. Ils sont partis ; à leur place, la
     station fait sa démonstration à l'arrivée : le curseur principal part
     et revient, les chiffres suivent, puis elle rend la main. On ne
     comprend pas qu'on peut jouer parce qu'on l'a lu — parce qu'on l'a vu.

     Trois règles, toutes tirées d'un défaut évité :
     1. UNE FOIS par station, jamais deux : une démonstration qui se
        rejoue est un tic, pas une invite.
     2. LE LECTEUR PASSE AVANT : au premier geste — souris, clavier,
        tactile — la démonstration s'arrête net et la station est marquée
        comme prise. On ne dispute jamais un curseur à celui qui le tient.
     3. LA VALEUR EST RENDUE : l'aller-retour repose l'instrument sur son
        réglage d'origine, et un filet le fait même si le rAF est bridé
        (onglet en arrière-plan) — sinon la station resterait faussée par
        une animation que personne n'a vue. ── */
  function instDemo() {
    var panels = [].slice.call(document.querySelectorAll('#labo .subpanel, #explore .xpane'));
    if (!panels.length) return;
    var played = {}, live = null;

    function stop() {
      if (!live) return;
      cancelAnimationFrame(live.raf);
      clearTimeout(live.net);
      live.restore();
      live = null;
    }
    function seized(e) {
      var t = e.target, p = t && t.closest ? t.closest('.subpanel, .xpane') : null;
      if (p) played[p.id] = 1;
      stop();
    }
    document.addEventListener('pointerdown', seized, true);
    document.addEventListener('keydown', seized, true);
    document.addEventListener('wheel', function () { stop(); }, { capture: true, passive: true });

    function nudge(r) {
      var min = +r.min || 0, max = +r.max || 100, v0 = +r.value;
      var span = (max - min) * 0.32;
      var v1 = (v0 + span <= max) ? v0 + span : Math.max(min, v0 - span);
      var t0 = 0, DUR = 1150;
      var put = function (v) {
        r.value = String(v);
        r.dispatchEvent(new Event('input', { bubbles: true }));
      };
      var restore = function () { put(v0); };
      function step(now) {
        if (!live) return;
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / DUR);
        /* aller-retour : on part vite, on revient posé */
        var h = p < 0.5 ? p / 0.5 : (1 - p) / 0.5;
        put(v0 + (v1 - v0) * (1 - Math.pow(1 - h, 3)));
        if (p < 1) { live.raf = requestAnimationFrame(step); }
        else { restore(); live = null; }
      }
      live = { raf: requestAnimationFrame(step), restore: restore, net: 0 };
      live.net = setTimeout(function () { if (live) { stop(); } }, DUR + 900);
    }

    /* Une station qui n'a pas de curseur a des boutons : on ne clique pas
       à la place du lecteur, on allume les commandes l'une après l'autre. */
    function pulse(group) {
      group.classList.remove('inst-pulse');
      void group.offsetWidth;
      group.classList.add('inst-pulse');
      setTimeout(function () { group.classList.remove('inst-pulse'); }, 1500);
    }

    function play(panel) {
      if (!panel || played[panel.id] || !shown(panel)) return;
      played[panel.id] = 1;
      var r = panel.querySelector('input[type=range]');
      if (r) { nudge(r); return; }
      var g = panel.querySelector('.forme-pick, .preset-row, .preset-bar');
      if (g) pulse(g);
    }
    /* On ne joue QUE la station de la section concernée. Mesuré : un
       playActive() global démontrait aussi la pièce des Explorations
       pendant qu'on entrait dans le Laboratoire — deux instruments qui
       bougent en même temps dans deux sections différentes, personne ne
       sait plus lequel regarder. */
    function playIn(sec) {
      if (!sec) return;
      play(sec.querySelector('.subpanel.active, .xpane.active'));
    }

    /* Deux déclencheurs, et il en faut deux : la section qui ENTRE dans
       le champ (on descend jusqu'au laboratoire), et la station qu'on
       CHANGE (elle apparaît alors en pleine position de lecture, sans
       qu'aucun défilement n'ait lieu — le piège de la mesure unique). */
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) playIn(es[i].target);
      }, { threshold: 0.25 });
      ['labo', 'explore'].forEach(function (id) {
        var e = document.getElementById(id); if (e) io.observe(e);
      });
    }
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (recs) {
        var secs = [];
        for (var i = 0; i < recs.length; i++) {
          var sec = recs[i].target.closest('#labo, #explore');
          if (sec && secs.indexOf(sec) < 0) secs.push(sec);
        }
        setTimeout(function () { secs.forEach(playIn); }, 90);
      });
      panels.forEach(function (p) {
        mo.observe(p, { attributes: true, attributeFilter: ['class'] });
      });
    }
  }

  /* ── E ter. LA FRISE SE REMPLIT DANS LE SENS DU TEMPS ────────────────
     La section II est le pendant CONCRET de la section I : là un fil
     descend et éclaire chaque catégorie qu'il atteint, ici une ligne
     avance de 1450 vers 1867 et pose chaque événement au passage. C'est
     la même idée dite deux fois — un front qui avance et allume ce qu'il
     touche —, une fois dans l'ordre logique, une fois dans l'ordre de
     l'histoire. Les deux se répondent ; ce n'est pas la même animation
     recopiée, c'est la thèse du dossier.

     Chaque couche a sa PROPRE avance : les deux bandes d'acte ne
     commencent pas à la même date, un scaleX commun les aurait fait
     partir ensemble depuis leur bord gauche. On calcule donc la fraction
     locale à partir du `left`/`width` que la page a posés en pourcents. */
  function chronoUnfold() {
    var track = document.getElementById('chronoTrack');
    if (!track) return;
    document.documentElement.classList.add('js-atchrono');
    var axis = track.querySelector('.chrono-axis');
    var bands = [].slice.call(track.querySelectorAll('.chrono-actband'));
    function pctOf(el, prop) { return parseFloat(el.style[prop]) || 0; }

    addSub(function (y, vh) {
      if (!shown(track)) return;
      var p = through(track, vh, 0.92, 0.52);
      track.style.setProperty('--drawx', p.toFixed(3));
      if (axis) axis.style.setProperty('--fill', p.toFixed(3));
      for (var i = 0; i < bands.length; i++) {
        var l = pctOf(bands[i], 'left'), w = pctOf(bands[i], 'width') || 100;
        bands[i].style.setProperty('--fill', clamp01((p * 100 - l) / w).toFixed(3));
      }
      /* pastilles et graduations : elles se posent quand le temps les
         atteint, pas toutes ensemble. La liste est relue à chaque passage
         — la frise est rendue par la page, et re-rendue à chaque année. */
      var marks = track.querySelectorAll('.chrono-dot, .chrono-tick');
      for (var j = 0; j < marks.length; j++) {
        var x = pctOf(marks[j], 'left') / 100;
        /* `p * 1.08` et non `p` : sans cette marge, la dernière pastille —
           1867, à l'extrémité droite — n'était atteinte qu'à p = 1 exactement
           et restait éteinte pour de bon (mesuré : 15 sur 16). */
        marks[j].style.setProperty('--dot', clamp01((p * 1.08 - x) * 14).toFixed(3));
      }
    });
  }

  /* ── F. Le SOMMAIRE s'inscrit ────────────────────────────────────────
     Ce que la section dit : c'est le plan du livre. Le geste : les lignes
     s'inscrivent dans l'ordre de lecture à mesure qu'on descend — le
     sommaire s'écrit, section par section. Chaque ligne est mesurée à sa
     propre position (jamais un échelonnement par index : les sections
     n'ont pas le même nombre de chapitres, et un décalage régulier
     allumerait des lignes encore hors champ). */
  function tocInscribe() {
    var lists = [].slice.call(document.querySelectorAll('#navlist, #atlNavlist, #man-grid'));
    if (!lists.length) return;
    document.documentElement.classList.add('js-attoc');

    addSub(function (y, vh) {
      for (var l = 0; l < lists.length; l++) {
        var list = lists[l];
        if (!shown(list)) continue;
        var rows = list.querySelectorAll('.atl-card, .atl-grid-sec');
        for (var i = 0; i < rows.length; i++) {
          var top = rows[i].getBoundingClientRect().top;
          /* la ligne s'inscrit sur les 120 px qui précèdent sa place */
          rows[i].style.setProperty('--ink',
            clamp01((vh * 0.94 - top) / 120).toFixed(3));
        }
      }
    });
  }

  /* ── G. Les instruments et les cartes SE POSENT ──────────────────────
     Laboratoire, explorations, chronologie, ressources : partout où un
     panneau pose des blocs (un instrument, un encart de mode d'emploi,
     une fiche de ressource), ils arrivent d'un souffle plus bas et se
     posent — le même geste que les feuillets du bureau, tenu à travers
     toute la page pour que l'atelier ait UN rythme et non cinq. */
  function poseParts() {
    /* .howto et .method-note ont disparu de Capital (les pavés
       explicatifs) ; ils vivent encore sur les Manuscrits, d'où le
       sélecteur inchangé. */
    var sel = '.howto, .method-note, .lab > .controls, .lab > .readout,' +
              ' .chartbox, .rss-card, .ccard, .concepts-wrap, .chrono-track,' +
              ' .explore-card, .stairmap-wrap';
    var parts = [].slice.call(document.querySelectorAll(sel));
    if (!parts.length) return;
    document.documentElement.classList.add('js-atparts');

    addSub(function (y, vh) {
      for (var i = 0; i < parts.length; i++) {
        if (!shown(parts[i])) continue;
        var top = parts[i].getBoundingClientRect().top;
        var p = clamp01((vh * 0.96 - top) / (vh * 0.34));
        var e = 1 - Math.pow(1 - p, 3);
        parts[i].style.setProperty('--set', e.toFixed(3));
      }
    });
  }

  /* ── G bis. L'ouverture d'une section se pose ────────────────────────
     Le numéro et la rubrique montent en lumière, le filet se tire de la
     gauche : la section s'annonce au moment où on l'atteint. Fonction de
     la POSITION → on remonte, elle se range. Le défaut CSS est l'état
     posé (`var(--dp, 1)`), donc sans JS la page s'affiche finie. */
  function dossierOpen() {
    var opens = [].slice.call(document.querySelectorAll('.dos-open'));
    if (!opens.length) return;
    addSub(function (y, vh) {
      for (var i = 0; i < opens.length; i++) {
        if (!shown(opens[i])) continue;
        var p = through(opens[i], vh, 0.96, 0.62);
        opens[i].style.setProperty('--dp',
          (1 - Math.pow(1 - p, 3)).toFixed(3));
      }
    });
  }

  /* ── H. Remesurer quand un onglet s'ouvre ────────────────────────────
     Un panneau qui devient actif apparaît à sa place définitive sans
     qu'aucun défilement n'ait lieu : sans ce rappel, ses sections
     resteraient figées à la valeur qu'elles avaient en étant masquées.
     On observe la classe des panneaux plutôt que de se brancher sur
     `activateTab` — les deux pages n'ont pas le même code d'onglets, et
     la classe, elle, est le contrat commun. */
  function watchPanels() {
    var panels = document.querySelectorAll('section.panel');
    if (!panels.length || !window.MutationObserver) return;
    /* Depuis la refonte `atelier-texte-au-centre`, les six panneaux du
       Dossier de Capital ne changent plus JAMAIS de classe : ils restent
       tous `.panel.active`, et c'est leur conteneur qui s'affiche ou non.
       Sans cette seconde observation, leurs titres n'auraient jamais été
       encrés (mesurés masqués, ils restaient invisibles) et leurs scrubs
       seraient restés figés. On observe donc AUSSI l'attribut `hidden`
       des deux conteneurs — toujours le DOM, jamais le code d'onglets de
       la page, qui n'est pas le même d'une œuvre à l'autre. Absents des
       Manuscrits : la liste est alors vide, et c'est sans effet. */
    var boxes = document.querySelectorAll('.atl-dossier,.atl3');
    var mo = new MutationObserver(function () {
      /* deux passes : tout de suite, puis après la peinture — la mise en
         page du panneau qui vient de s'afficher n'est pas encore stable */
      runSubs();
      playVisibleTitles();
      requestAnimationFrame(runSubs);
    });
    for (var i = 0; i < panels.length; i++) {
      mo.observe(panels[i], { attributes: true, attributeFilter: ['class'] });
    }
    for (var j = 0; j < boxes.length; j++) {
      mo.observe(boxes[j], { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  /* ── J. L'ATELIER À TROIS COLONNES ───────────────────────────────────
     (mission `atelier-texte-au-centre`)

     RÈGLE QUI COMMANDE TOUT LE RESTE : la colonne de TEXTE ne bouge
     jamais. Ni à l'entrée, ni au défilement. Le lecteur vient lire ; une
     ligne qui glisse sous l'œil, si discrète soit-elle, est une gêne et
     non un agrément. Le mouvement vit donc dans les deux colonnes
     latérales et aux MOMENTS DE TRANSITION — l'arrivée sur la page,
     l'ouverture d'un chapitre — jamais en continu sous le regard.

     Corollaire de sécurité : on ne cache JAMAIS le texte en attendant une
     animation. Les entrées sont des `@keyframes` en `fill-mode:both` et
     non des états de classe : une animation finit toujours, alors qu'une
     classe qu'on oublie de poser laisse la page vide. */
  function threeCols() {
    var toc = document.getElementById('atl3Toc');
    var marge = document.getElementById('atl3Marge');
    if (!toc && !marge) return;                 /* pas cette page */
    document.documentElement.classList.add('js-at3');

    /* Les deux colonnes latérales se posent à l'arrivée — l'animation est
       accrochée à `js-at3` SEULE, sans seconde classe à poser après coup :
       si le script échouait entre les deux, les colonnes resteraient
       invisibles pour toujours. Poser la classe, c'est déclencher
       l'animation ; il n'y a pas d'entre-deux. */

    /* PAS d'inscription ligne à ligne du sommaire — geste essayé puis
       retiré. Le sommaire est rebâti par `renderTocRail()` à la fin du
       chargement du texte, soit environ une seconde après l'entrée : la
       cascade en cours était détruite en plein vol et rejouée à plat sur
       les nouvelles lignes. Un geste qui se contredit lui-même vaut moins
       que pas de geste ; l'entrée de la colonne (`at3ColG`) le dit déjà,
       et elle, rien ne la reconstruit. */

    /* La marge se recompose à chaque chapitre : ses blocs arrivent d'un
       souffle, échelonnés. Court (moins de trois cents millisecondes en
       tout) parce que ce geste se rejoue à chaque chapitre traversé —
       une entrée spectaculaire deviendrait vite une taxe. */
    if (marge && window.MutationObserver) {
      var reposer = function () {
        if (!shown(marge)) return;
        var secs = marge.querySelectorAll('.atl3-m-sec');
        for (var i = 0; i < secs.length; i++) secs[i].style.setProperty('--i', String(i));
        /* on relance l'animation en la retirant puis la reposant */
        marge.classList.remove('at3-repose');
        void marge.offsetWidth;
        marge.classList.add('at3-repose');
      };
      reposer();
      new MutationObserver(reposer).observe(marge, { childList: true });
    }

    /* Le bandeau de chapitre S'ALLUME à chaque ouverture — la lueur monte
       du bas, comme le bandeau de départ et la bougie de l'accueil. C'est
       le seul geste qui touche la colonne de texte, et il se joue AVANT
       qu'on lise, sur le titre, jamais sur le texte. */
    var out = document.getElementById('readerOut');
    if (out && window.MutationObserver) {
      var allumer = function () {
        var head = out.querySelector('.rdr-header');
        if (!head || head.dataset.at3Lit || !shown(head)) return;
        head.dataset.at3Lit = '1';
        head.classList.add('at3-alight');
      };
      allumer();
      new MutationObserver(allumer).observe(out, { childList: true, subtree: true });
    }
  }

  function init() {
    threeCols();
    inkTitles();
    inkSections();
    startBand();
    developIdeas();
    instDemo();
    chronoUnfold();
    poseBlocks();
    walkDeduce();
    tocInscribe();
    poseParts();
    dossierOpen();
    watchPanels();
    /* Le contenu arrive par fetch (catalogue, listes) et le navigateur peut
       sauter sur une ancre : on remesure après coup, comme sur l'accueil. */
    requestAnimationFrame(runSubs);
    setTimeout(function () { runSubs(); playVisibleTitles(); }, 400);
    window.addEventListener('load', function () { runSubs(); playVisibleTitles(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else init();
})();

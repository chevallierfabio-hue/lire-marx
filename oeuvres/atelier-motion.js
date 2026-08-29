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
    var heads = [].slice.call(document.querySelectorAll('.panel-head h2.sec'));
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
    var heads = [].slice.call(document.querySelectorAll('.at-sec-h'));
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
    var cards = [].slice.call(document.querySelectorAll('.cap-idea-card'));
    if (!cards.length) return;
    document.documentElement.classList.add('js-atdev');
    /* le fondu global ne doit pas les faire apparaître d'un coup en plein
       développement */
    var grid = document.querySelector('.cap-ideas-grid');
    if (grid) grid.classList.remove('reveal-stagger');

    addSub(function (y, vh) {
      cards.forEach(function (card, i) {
        if (!shown(card)) return;
        var p = through(card, vh, 0.95, 0.5);
        var d = clamp01((p - i * 0.14) / 0.62);
        card.style.setProperty('--dev', d.toFixed(3));
        card.style.setProperty('--in', clamp01(d * 5).toFixed(3));
        card.style.setProperty('--bar', (d > 0.004 && d < 0.996 ? 1 : 0));
        card.style.setProperty('--txt', clamp01((d - 0.45) / 0.4).toFixed(3));
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

    /* Les deux pages n'ont pas le même serpentin : sur Capital la marche
       est une carte posée à côté d'un axe central, sur les Manuscrits
       elle EST le bloc, le long d'un fil à gauche. La variante se pose
       en classe (jamais en :has(), pas acquis partout) et l'axe suit. */
    var cards = !!walk.querySelector('.walk-card');
    walk.classList.add(cards ? 'walk-cards' : 'walk-thread');
    if (!cards) walk.style.setProperty('--axis', '8px');
    document.documentElement.classList.add('js-atwalk');

    /* Le serpentin est construit par le script de la page. Il l'est avant
       nous (script inline pendant le parse, ce module en defer), mais on
       ne s'y fie pas : la liste se relit tant qu'elle est vide. */
    var parts = [];
    function collect() {
      parts = [].slice.call(walk.querySelectorAll('.walk-step, .walk-motor'));
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
  }

  function init() {
    inkTitles();
    inkSections();
    startBand();
    developIdeas();
    poseBlocks();
    walkDeduce();
    tocInscribe();
    poseParts();
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

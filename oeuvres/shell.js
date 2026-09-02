// Shell partagé du site Lire Marx (topbar 44 px + sidebar 208 px + modales).
//
// Cette première version pilote les pages d'atelier qui n'embarquent pas
// encore tout le code (auth Supabase, forum public, modération, recherche).
// Sur ces pages, les boutons compte / messages / notifications / forum
// renvoient vers oeuvres/capital-1.html, qui héberge encore la coquille
// applicative complète.
//
// Capital-1.html continue d'inliner sa propre coquille HTML + JS. À terme
// (mission future), il consommera aussi installShell() pour devenir un
// simple livre comme les autres.
//
// Utilisation, sur la page d'un livre :
//
//   <link rel="stylesheet" href="atelier.css">
//   <link rel="stylesheet" href="shell.css">
//   <link rel="stylesheet" href="<id-oeuvre>.css">
//   <script src="shell.js"></script>
//   <script>
//     installShell({
//       workId: 'manuscrits-1844',
//       workTitle: 'Manuscrits de 1844',
//       tabs: [
//         {id:'accueil', label:'Accueil'},
//         {id:'nav',     label:'Parcourir'},
//         {id:'lire',    label:'Texte intégral'},
//         ...
//       ]
//     });
//   </script>
//
// La page doit aussi exposer une fonction `window.activateTab(id)` qui
// affiche le panel correspondant — c'est elle qui fait le lien entre la
// sidebar et le contenu propre au livre.

(function(){
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function el(html){
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function buildTopbar(){
    return el(
      '<header class="topbar"><div class="topbar-in">' +
        '<button id="sbToggle" class="sb-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="sidebar"><span aria-hidden="true">☰</span></button>' +
        '<a class="brandmark" id="shellBrand" href="/" aria-label="Lire Marx — retour à l\'accueil">Lire<span class="d">.</span>Marx</a>' +
        '<div class="tb-search">' +
          '<span class="tb-search-ic" aria-hidden="true">⌕</span>' +
          '<input id="tbSearch" type="text" autocomplete="off" spellcheck="false" placeholder="Rechercher un concept, une date, un chapitre…" aria-label="Rechercher" role="combobox" aria-expanded="false" aria-controls="tbResults" aria-autocomplete="list" aria-haspopup="listbox">' +
          '<div id="tbResults" class="tb-results" role="listbox" hidden></div>' +
        '</div>' +
        '<div class="topbar-right">' +
          '<button id="supportBtn" class="tb-btn tb-support" type="button" aria-label="Nous soutenir">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.3l-1-1.4C5.9 14.3 3 11.7 3 8.4 3 5.9 4.9 4 7.4 4 9 4 10.4 4.8 11.2 6 12 4.8 13.4 4 15 4c2.5 0 4.4 1.9 4.4 4.4 0 3.3-2.9 5.9-8 10.5l-1 1.4z"/></svg>' +
            '<span class="tb-lbl">Nous soutenir</span>' +
          '</button>' +
          '<button id="msgBtn" class="tb-btn tb-icon tb-msg" type="button" aria-label="Messages">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v12H7l-3 3z"/></svg>' +
            '<span class="tb-dot" id="msgDot"></span>' +
          '</button>' +
          '<button id="notifBtn" class="tb-btn tb-icon tb-notif" type="button" aria-label="Notifications">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
            '<span class="tb-dot" id="notifDot"></span>' +
          '</button>' +
          '<button id="acctChip" class="acct-chip" type="button" aria-haspopup="dialog">Se connecter</button>' +
        '</div>' +
      '</div></header>'
    );
  }

  function buildSidebar(cfg){
    var tabs = cfg.tabs || [];
    var workTitle = cfg.workTitle || '';
    var tabsHtml = tabs.map(function(t){
      return '<button class="sb-item" type="button" data-act="tab:' + esc(t.id) + '"><span class="sb-dot"></span>' + esc(t.label) + '</button>';
    }).join('');
    var sbWork = tabs.length
      ? '<div class="sb-work" id="sbWork"><div class="sb-h">' + esc(workTitle) + '</div>' + tabsHtml + '</div>'
      : '';
    return el(
      '<aside class="sidebar" id="sidebar" aria-label="Navigation de l\'atelier">' +
        '<a class="sb-item" href="/" data-act="home"><span class="sb-dot" style="background:var(--gold)"></span>Accueil</a>' +
        '<a class="sb-item" href="/oeuvres/bibliotheque" data-act="biblio"><span class="sb-dot" style="background:var(--ink-soft)"></span>Bibliothèque</a>' +
                /* Le glossaire suit la Bibliothèque : ce sont les deux outils du
           CORPUS, l'un qui dit quelles œuvres existent, l'autre les mots
           qu'elles construisent. C'est un ABÉCÉDAIRE GLOBAL, toutes œuvres
           confondues, et il vit à la racine (/glossaire) et non sous
           /oeuvres/ — arbitrage du propriétaire : il ne dépend d'aucune
           œuvre en particulier. */
        '<a class="sb-item" href="/glossaire/" data-act="glossaire"><span class="sb-dot" style="background:var(--ink-soft)"></span>Glossaire</a>' +
'<a class="sb-item" href="/oeuvres/place-publique" data-act="commune"><span class="sb-dot" style="background:var(--red)"></span>Place publique</a>' +
        /* le carnet est le pendant PRIVÉ de la Place publique : là-bas
           les notes partagées, ici les vôtres — d'où sa place juste en
           dessous. */
        '<a class="sb-item" href="/oeuvres/carnet" data-act="carnet"><span class="sb-dot" style="background:var(--gold)"></span>Mon carnet</a>' +
        /* « Messages », et non « Contacts » : la même chose portait deux
           noms — l'icône de la barre du haut et son popover disent
           « Messages » depuis toujours. C'est le pendant PRIVÉ de la Place
           publique, comme « Mon carnet » l'est pour les notes. */
        '<a class="sb-item" href="/oeuvres/messages" data-act="messages"><span class="sb-dot" style="background:var(--blue)"></span>Messages</a>' +
        /* « Le jeu » et non « Jeux » : il y en a un, et l'entrée dit son
           nom au singulier comme le fait la section de l'accueil. Elle
           mène à /jeu — la page qui le présente — et non à /jeu/jouer :
           le jeu prend tout l'écran, on ne l'ouvre pas d'un clic de
           sidebar sans avoir dit ce que c'est. */
        '<a class="sb-item" href="/jeu/" data-act="jeu"><span class="sb-dot" style="background:var(--gold)"></span>Le jeu</a>' +
        '<button class="sb-item" type="button" data-act="cgu"><span class="sb-dot" style="background:var(--ink-soft)"></span>CGU &amp; règles</button>' +
        sbWork +
      '</aside>'
    );
  }

  function buildBackdrop(){
    return el('<div class="sb-backdrop" id="sbBackdrop"></div>');
  }

  function buildAcctModal(){
    return el(
      '<div id="acctModal" class="acct-modal" hidden>' +
        '<div class="acct-modal-box" role="dialog" aria-modal="true" aria-label="Mon compte">' +
          '<button class="acct-modal-x" type="button" aria-label="Fermer">&times;</button>' +
          '<div id="acctView"></div>' +
        '</div>' +
      '</div>'
    );
  }

  // Texte canonique copié depuis capital-1.html (l. 484-493). Les
  // passages [À COMPLÉTER : …] restent tels quels — c'est à Fabio de
  // les remplir, pas au shell de les inventer. La suppression de
  // compte est déjà active partout via SHELL.auth.eraseMyData (bouton
  // « Supprimer mon compte » dans Mon compte).
  function buildPrivacyModal(){
    return el(
      '<div id="privacyModal" class="acct-modal" hidden>' +
        '<div class="acct-modal-box" role="dialog" aria-modal="true" aria-label="Confidentialité">' +
          '<button class="acct-modal-x" type="button" aria-label="Fermer">&times;</button>' +
          '<div class="ac-card privacy-text">' +
            '<h3>Confidentialité &amp; données</h3>' +
            '<p class="pz-warn">Modèle de départ, à relire et compléter (les passages entre crochets) ; ce n\'est pas un conseil juridique.</p>' +
            '<p><b>Responsable.</b> [À COMPLÉTER : nom ou structure, et qualité]. Contact : [À COMPLÉTER : adresse e-mail].</p>' +
            '<p><b>Données traitées.</b> Adresse e-mail (connexion uniquement, jamais affichée), pseudo (public), annotations privées, notes et réponses publiques, signalements. Aucune donnée n\'est revendue ni utilisée à des fins publicitaires.</p>' +
            '<p><b>Finalités &amp; base légale.</b> Fournir la lecture annotée, la synchronisation entre appareils et les notes partagées modérées (exécution du service demandé) ; assurer la modération et la sécurité (intérêt légitime).</p>' +
            '<p><b>Hébergement.</b> Authentification et base de données via Supabase. [À COMPLÉTER : région d\'hébergement, par ex. Union européenne].</p>' +
            '<p><b>Conservation.</b> Vos données sont conservées tant que votre compte existe, et supprimées à votre demande.</p>' +
            '<p><b>Vos droits (RGPD).</b> Accès, rectification, effacement, opposition. Vous pouvez supprimer vous-même votre compte et l\'ensemble de vos données depuis « Mon compte » → <i>Compte</i> → <i>Supprimer mon compte</i> (effacement définitif et immédiat). Pour toute autre demande : [À COMPLÉTER : adresse e-mail].</p>' +
            '<p><b>Stockage local.</b> Le site conserve vos surlignages et votre session de connexion dans votre navigateur. C\'est un stockage <i>fonctionnel</i> (nécessaire au service), sans pistage ni cookie publicitaire.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function wire(cfg){
    var sb = document.getElementById('sidebar');
    var bk = document.getElementById('sbBackdrop');
    var topbar = document.querySelector('header.topbar');

    // Ouverture/fermeture sidebar (mobile : toggle ; desktop : collapse)
    document.getElementById('sbToggle').addEventListener('click', function(){
      var narrow = window.matchMedia('(max-width:860px)').matches;
      if(narrow) document.body.classList.toggle('sb-open');
      else       document.body.classList.toggle('sb-collapsed');
      /* L'état n'était exposé nulle part : même bouton, même libellé,
         ouvert comme fermé. WCAG 4.1.2. */
      var open = narrow ? document.body.classList.contains('sb-open')
                        : !document.body.classList.contains('sb-collapsed');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    bk.addEventListener('click', function(){ document.body.classList.remove('sb-open'); });

    // Brandmark → accueil. C'est une ANCRE, pas un bouton : plus rien à
    // câbler ici. Plus de ?skip-anim non plus — depuis que l'intro
    // cinématique a été déplacée à l'entrée du carnet, l'accueil s'ouvre
    // directement et le paramètre n'a plus d'objet.

    // Accueil et Bibliothèque : leur href suffit, on ne garde la référence
    // que pour le marquage de la page courante.
    var home = sb.querySelector('[data-act="home"]');
    var bib = sb.querySelector('[data-act="biblio"]');

    // Marque l'entrée correspondant à la page courante.
    // PIÈGE : Cloudflare Pages sert des URL PROPRES — la page vit à
    // « /oeuvres/carnet », pas « /oeuvres/carnet.html ». Les tests sur
    // `.html` passaient donc en local (python -m http.server) et
    // n'attrapaient RIEN en production : aucune entrée n'était marquée
    // sur le site en ligne. On normalise en retirant l'extension.
    var here = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    function mark(btn){
      if(!btn) return;
      btn.classList.add('on');
      btn.setAttribute('aria-current', 'page');
    }
    if(here === '/' || here === '/index') mark(home);
    if(/\/bibliotheque$/.test(here)) mark(bib);
    // Place publique : marquer l'entrée quand on est sur sa page dédiée.
    var communeBtn = sb.querySelector('[data-act="commune"]');
    if(/\/place-publique$/.test(here)) mark(communeBtn);
    var carnetBtn = sb.querySelector('[data-act="carnet"]');
    if(/\/carnet$/.test(here)) mark(carnetBtn);
    var msgBtnSb = sb.querySelector('[data-act="messages"]');
    if(/\/messages$/.test(here)) mark(msgBtnSb);
    /* Le jeu vit dans un DOSSIER : /jeu est la page de présentation,
       /jeu/jouer la partie. `here` peut donc valoir « /jeu » (URL propre
       de Cloudflare) ou « /jeu/ » (le .replace de /index.html ci-dessus).
       Les trois marquent la même entrée. */
    var gloBtn = sb.querySelector('[data-act="glossaire"]');
    /* Tout ce qui vit SOUS /glossaire marque l'entrée : l'abécédaire lui-même
       (/glossaire et /glossaire/) comme les pages de notion
       (/glossaire/plus-value). Un test ancré sur la fin ne couvrait que
       l'index, et la sidebar se dé-marquait dès qu'on ouvrait une notion. */
    if(/^\/glossaire(\/|$)/.test(here)) mark(gloBtn);
    var jeuBtn = sb.querySelector('[data-act="jeu"]');
    if(/^\/jeu\/?$/.test(here) || /^\/jeu\/jouer$/.test(here)) mark(jeuBtn);

    // Items de navigation inter-pages.
    // Les destinations sont des ANCRES : leur href fait la navigation, et
    // c'est ce qui les rend EXPLORABLES — un robot ne clique pas un bouton
    // et ne suit pas un `location.href` posé dans un écouteur. Il ne reste
    // ici que les deux cas qui ne sont pas de simples destinations.
    sb.querySelectorAll('.sb-item[data-act]').forEach(function(b){
      var act = b.dataset.act;
      b.addEventListener('click', function(e){
        // Sur mobile, la sidebar est un tiroir : on le referme. Inutile
        // quand on navigue (la page part), indispensable quand on ouvre
        // une modale ou qu'on reste sur place.
        if(window.matchMedia('(max-width:860px)').matches){
          document.body.classList.remove('sb-open');
        }
        // CGU & règles / Confidentialité : modale RGPD de SHELL.auth.
        // Ce n'est pas une page, l'entrée reste donc un <button>.
        if(act === 'cgu'){
          if(window.SHELL && window.SHELL.auth && window.SHELL.auth.openPrivacy){
            window.SHELL.auth.openPrivacy();
          }
          return;
        }
        // Messages : ne pas recharger la page qu'on regarde — un
        // rechargement y referme la conversation ouverte. (Les URL propres
        // de Cloudflare font que les deux formes doivent être testées.)
        if(act === 'messages' && /\/oeuvres\/messages(\.html)?$/.test(location.pathname)){
          e.preventDefault();
        }
      });
    });

    // sb-work : aiguillage vers les onglets de l'œuvre courante via la
    // fonction window.activateTab(id) que la page de livre doit fournir.
    sb.querySelectorAll('.sb-item[data-act^="tab:"]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.act.slice(4);
        if(typeof window.activateTab !== 'function') return;
        window.activateTab(id);
        if(window.matchMedia('(max-width:860px)').matches){
          document.body.classList.remove('sb-open');
        }
      });
    });

    // Bouton « Nous soutenir » et recherche sont désormais autonomes côté
    // shell — plus aucune redirection vers la page hôte. Voir
    // wireSupportPopover() et wireSharedSearch() ci-dessous.
    wireSupportPopover();
    wireSharedSearch();
  }

  // ----- Popover « Soutenir le projet » -----
  // Petit popover .tb-pop accroché à #supportBtn ; texte court + bouton
  // externe « Faire un don ». Le href reste # tant que la cible n'est
  // pas choisie — c'est juste un placeholder, à remplir plus tard.
  function wireSupportPopover(){
    var btn = document.getElementById('supportBtn');
    if(!btn || btn.dataset.w) return;
    btn.dataset.w = '1';
    var wrap = btn.closest('.topbar-right') || btn.parentNode;
    var pop = document.createElement('div');
    pop.className = 'tb-pop';
    pop.hidden = true;
    pop.innerHTML = '<div class="tb-pop-h">Soutenir le projet</div>'
      + '<div class="tb-pop-t">Lire.Marx est libre, gratuit et sans publicité. Pour aider à le faire vivre :</div>'
      + '<a class="tb-pop-cta" href="#" target="_blank" rel="noopener">Faire un don</a>';
    wrap.appendChild(pop);
    pop.id = pop.id || 'supportPop';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', pop.id);
    function sync(){ btn.setAttribute('aria-expanded', pop.hidden ? 'false' : 'true'); }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      // Ferme les autres popovers .tb-pop (sociaux notamment).
      document.querySelectorAll('.tb-pop').forEach(function(p){ if(p !== pop) p.hidden = true; });
      pop.hidden = !pop.hidden;
      sync();
    });
    pop.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('click', function(){ pop.hidden = true; sync(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ pop.hidden = true; sync(); } });
  }

  // ----- Recherche partagée -----
  // Index minimal construit depuis bibliotheque.json (œuvres + concepts).
  // Pas encore d'index profond (chapitres / dates / sections) ; pour cela
  // il faudra charger les manifests par œuvre. Suffit déjà à une
  // recherche autonome fonctionnant identiquement sur toutes les pages.
  function wireSharedSearch(){
    var inp = document.getElementById('tbSearch');
    var box = document.getElementById('tbResults');
    if(!inp || !box || inp.dataset.w) return;
    inp.dataset.w = '1';

    function norm(s){
      try { return (s == null ? '' : s).toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
      catch(e){ return (s == null ? '' : s).toString().toLowerCase(); }
    }

    var INDEX = null;
    var indexPending = null;

    function buildIndex(){
      if(INDEX) return Promise.resolve(INDEX);
      if(indexPending) return indexPending;
      indexPending = fetch('/oeuvres/bibliotheque.json', { cache: 'no-cache' })
        .then(function(r){ if(!r.ok) throw new Error('biblio HTTP ' + r.status); return r.json(); })
        .then(function(json){
          var ix = [];
          (json.works || []).forEach(function(w){
            if(!w || !w.id) return;
            var path = String(w.path || '');
            if(path && path.indexOf('/') !== 0) path = '/' + path;
            var available = w.status === 'available' && !!path;
            var go = function(){ if(available) location.href = path; };
            var subtitle = (w.author || '') + (w.year ? ' · ' + w.year : '');
            var concepts = (w.concepts || []).join(' ');
            var hay = norm([w.title, w.shortTitle, w.author, w.description, concepts].join(' '));
            ix.push({
              t: w.title || w.shortTitle || w.id,
              s: subtitle,
              cat: 'oeuvre',
              lab: available ? 'Œuvre' : 'À venir',
              act: go,
              hay: hay
            });
            (w.concepts || []).forEach(function(c){
              ix.push({
                t: c,
                s: w.shortTitle || w.title || '',
                cat: 'concept',
                lab: 'Concept',
                act: go,
                hay: norm(c)
              });
            });
          });
          INDEX = ix;
          return ix;
        })
        .catch(function(){ INDEX = []; return INDEX; })
        .then(function(ix){ indexPending = null; return ix; });
      return indexPending;
    }

    function close(){
      box.hidden = true;
      inp.setAttribute('aria-expanded','false');
      inp.removeAttribute('aria-activedescendant');
      cur = -1;
    }
    /* Option survolée au clavier. Le CSS stylait déjà .tb-res.active — la
       classe n'était jamais posée, et aucune touche fléchée n'était gérée. */
    var cur = -1;
    function opts(){ return [].slice.call(box.querySelectorAll('[role=option]')); }
    function mark(i){
      var o = opts();
      if(!o.length) return;
      cur = (i + o.length) % o.length;
      o.forEach(function(b,k){ b.classList.toggle('active', k === cur); });
      inp.setAttribute('aria-activedescendant', o[cur].id);
      o[cur].scrollIntoView({block:'nearest'});
    }

    function render(q){
      var nq = norm(q).trim();
      if(!nq){ box.hidden = true; box.innerHTML = ''; return; }
      buildIndex().then(function(ix){
        var hits = [];
        for(var i = 0; i < ix.length && hits.length < 12; i++){
          if(ix[i].hay.indexOf(nq) >= 0) hits.push(ix[i]);
        }
        if(!hits.length){
          box.innerHTML = '<div class="tb-empty">Aucun résultat pour « ' + esc(q) + ' »</div>';
          box.hidden = false;
          inp.setAttribute('aria-expanded','true');
          announce('Aucun résultat pour ' + q);
          return;
        }
        box.innerHTML = '';
        hits.forEach(function(e){
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'tb-res';
          b.setAttribute('role', 'option');
          b.id = 'tbo-' + (box.children.length);
          /* Une option de listbox ne se tabule pas : on y circule aux
             flèches depuis le champ (aria-activedescendant). */
          b.tabIndex = -1;
          b.innerHTML = '<span class="tb-res-main"><span class="tb-res-t">' + esc(e.t) + '</span><span class="tb-res-s">' + esc(e.s) + '</span></span><span class="tb-res-cat tb-cat-' + e.cat + '">' + esc(e.lab) + '</span>';
          b.addEventListener('mousedown', function(ev){ ev.preventDefault(); });
          b.addEventListener('click', function(){ inp.value = ''; close(); try { e.act(); } catch(x){} });
          box.appendChild(b);
        });
        box.hidden = false;
        inp.setAttribute('aria-expanded','true');
        cur = -1;
        announce(hits.length + (hits.length > 1 ? ' résultats' : ' résultat'));
      });
    }

    inp.addEventListener('input', function(){ render(inp.value); });
    inp.addEventListener('focus', function(){ if(inp.value) render(inp.value); });
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ close(); inp.blur(); return; }
      if(box.hidden) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); mark(cur + 1); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); mark(cur - 1); }
      else if(e.key === 'Home' && cur >= 0){ e.preventDefault(); mark(0); }
      else if(e.key === 'End' && cur >= 0){ e.preventDefault(); mark(opts().length - 1); }
      else if(e.key === 'Enter' && cur >= 0){ e.preventDefault(); opts()[cur].click(); }
    });
    document.addEventListener('click', function(e){
      var w = document.querySelector('.tb-search');
      if(w && !w.contains(e.target)) close();
    });
  }

  /* Region live unique du site. Aucune des pages n'en avait : le fetch de
     8 s du texte integral, les erreurs d'authentification, le nombre de
     resultats de recherche et les filtres changeaient tous en silence.
     WCAG 4.1.3. Exposee en SHELL.announce(msg). */
  function buildLive(){
    return el('<div id="srStatus" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>');
  }
  var liveEl = null, liveTimer = null;
  function announce(msg){
    if(!liveEl) liveEl = document.getElementById('srStatus');
    if(!liveEl || !msg) return;
    // Vider puis reecrire : reecrire le MEME texte ne declenche aucune
    // annonce, et c'est le cas courant (deux « Chargement… » de suite).
    liveEl.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function(){ liveEl.textContent = msg; }, 60);
  }

  /* ══ Reprise de lecture ══
     Il n'y en avait aucune : un rechargement ramenait à l'accueil, le
     chapitre n'était pas rechargé et la position était perdue — alors que
     les annotations, elles, sont bien persistées. Le lecteur qui revenait
     au chapitre XV devait refaire cinq gestes puis chercher son passage à
     la main dans une section de trois chapitres.
     Volontairement LOCAL et sans compte, comme les annotations. */
  var RKEY = 'liremarx.resume.';
  function resumeSet(workId, data){
    if(!workId || !data) return;
    try{
      data.t = Date.now();
      localStorage.setItem(RKEY + workId, JSON.stringify(data));
    }catch(e){}
  }
  function resumeGet(workId){
    try{
      var v = localStorage.getItem(RKEY + workId);
      return v ? JSON.parse(v) : null;
    }catch(e){ return null; }
  }
  function resumeClear(workId){ try{ localStorage.removeItem(RKEY + workId); }catch(e){} }

  function buildSkip(){
    return el('<a class="skip-link" href="#contenu">Aller au contenu</a>');
  }


  /* ══ Sémantique d'onglets, partagée ══
     Les pages de livre empilent jusqu'à cinq rangées de boutons stylés qui
     ne portaient aucun rôle : ni role="tab", ni aria-selected, ni
     aria-controls, et les <section class="panel"> n'étaient pas des
     tabpanel. Pour une aide technique il n'y avait donc pas d'onglets du
     tout — seulement des boutons dont l'un est peint différemment.
     WCAG 4.1.2 et 1.3.1.

     getPanelId(bouton) rend l'id du panneau que ce bouton révèle. Il est
     passé par la page parce que la correspondance diffère d'une rangée à
     l'autre (data-top désigne un GROUPE dont le panneau courant varie,
     data-panel désigne le panneau directement).

     Réentrant : #subnav est reconstruit en innerHTML à chaque bascule. */
  function wireTabs(list, getPanelId){
    if(!list) return;
    list.setAttribute('role','tablist');
    var items = [].slice.call(list.querySelectorAll('button'));
    items.forEach(function(b, i){
      var pid = null;
      try { pid = getPanelId(b); } catch(e){}
      var panel = pid ? document.getElementById(pid) : null;
      if(!b.id) b.id = 'tb-' + (list.id || 'l') + '-' + (pid || i);
      b.setAttribute('role','tab');
      var on = b.classList.contains('active');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      // Tabindex roulant : une rangée d'onglets est UN seul arrêt de
      // tabulation, on circule ensuite aux flèches (motif ARIA APG).
      b.tabIndex = on ? 0 : -1;
      if(panel){
        b.setAttribute('aria-controls', pid);
        panel.setAttribute('role','tabpanel');
        panel.setAttribute('aria-labelledby', b.id);
        if(!panel.hasAttribute('tabindex')) panel.tabIndex = -1;
      }
    });
    if(list.dataset.a11yKeys) return;
    list.dataset.a11yKeys = '1';
    list.addEventListener('keydown', function(e){
      if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key) < 0) return;
      var bs = [].slice.call(list.querySelectorAll('[role=tab]'));
      var i = bs.indexOf(document.activeElement);
      if(i < 0) return;
      e.preventDefault();
      var n = e.key === 'Home'  ? 0
            : e.key === 'End'   ? bs.length - 1
            : e.key === 'ArrowLeft' ? (i - 1 + bs.length) % bs.length
            : (i + 1) % bs.length;
      bs[n].focus();
      bs[n].click();
    });
  }

  /* L'entrée d'œuvre courante dans la sidebar. C'était la seule des trois
     navigations à montrer toutes les destinations d'un coup, et la seule à
     ne jamais dire laquelle est ouverte : wire() ne posait .on que sur
     Accueil, Bibliothèque et Place publique. */
  function setWorkTab(id){
    var items = document.querySelectorAll('.sidebar .sb-item[data-act^="tab:"]');
    items.forEach(function(b){
      var on = b.dataset.act.slice(4) === id;
      b.classList.toggle('on', on);
      if(on) b.setAttribute('aria-current','true');
      else   b.removeAttribute('aria-current');
    });
  }

  window.installShell = function(cfg){
    cfg = cfg || {};
    var body = document.body;
    body.prepend(buildTopbar());
    body.prepend(buildSkip());
    body.appendChild(buildLive());
    // Cible du lien d'evitement : le conteneur principal de la page, quel que
    // soit son element. On ne force pas <main> ici — les pages le declarent.
    var mainEl = document.querySelector('main') || document.querySelector('.wrap');
    if(mainEl && !mainEl.id) mainEl.id = 'contenu';
    if(mainEl && !mainEl.hasAttribute('tabindex')) mainEl.setAttribute('tabindex','-1');
    var S = window.SHELL = window.SHELL || {};
    S.announce = announce;
    S.tabs = wireTabs;
    S.setWorkTab = setWorkTab;
    S.resume = { set: resumeSet, get: resumeGet, clear: resumeClear };
    var sidebar = buildSidebar(cfg);
    document.querySelector('header.topbar').after(sidebar);
    sidebar.after(buildBackdrop());
    body.appendChild(buildAcctModal());
    body.appendChild(buildPrivacyModal());
    wire(cfg);
    // Branche SHELL.auth sur le shell installé (chip + modales) et amorce
    // le client Supabase + l'état d'auth. Sans erreur si config absente.
    if(window.SHELL && window.SHELL.auth){
      try { window.SHELL.auth._wireChrome(); } catch(e){}
      try { window.SHELL.auth._bootstrap(); } catch(e){}
    }
    // Branche SHELL.social (messagerie privée + notifications) si la
    // page a chargé oeuvres/shell-social.js avant installShell.
    if(window.SHELL && window.SHELL.social && window.SHELL.social._init){
      try { window.SHELL.social._init(); } catch(e){}
    }
    // Branche SHELL.annotations (surlignage + notes privées + synchro)
    // si la page a chargé oeuvres/shell-annotations.js. Les pages
    // d'œuvres déclarent ensuite leur liseuse via SHELL.reader.attach()
    // à chaque rendu de section.
    if(window.SHELL && window.SHELL.annotations && window.SHELL.annotations._init){
      try { window.SHELL.annotations._init(); } catch(e){}
    }
  };
})();

/* ===== SHELL.auth — Supabase singleton (sous-mission 1)
   ------------------------------------------------------
   Toutes les pages partagent le même client Supabase. La config publique
   (url + clé anon) vient de window.LIREMARX_SUPABASE, défini par config.js
   à la racine du dépôt. Si la config est absente ou en placeholder, le
   site reste 100 % local et getClient() renvoie null.
   ===================================================== */
(function(){
  var SHELL = window.SHELL = window.SHELL || {};
  if(SHELL.auth) return; // déjà initialisé

  var client = null;
  var pending = null;
  var configured = null; // true | false (résolu après la première tentative)

  function getConfig(){
    return (typeof window.LIREMARX_SUPABASE !== 'undefined' && window.LIREMARX_SUPABASE) || null;
  }
  function isPlaceholder(cfg){
    if(!cfg) return true;
    var u = String(cfg.url || ''), a = String(cfg.anon || '');
    return !u || !a || u.indexOf('VOTRE') >= 0 || a.indexOf('VOTRE') >= 0;
  }

  // Charge le client Supabase une seule fois, en lazy import. Retourne null
  // si la config est manquante ou si l'import échoue (mode local pur).
  async function getClient(){
    if(client) return client;
    if(pending) return pending;
    var cfg = getConfig();
    if(isPlaceholder(cfg)){ configured = false; return null; }
    pending = (async function(){
      try {
        var m = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        client = m.createClient(cfg.url, cfg.anon);
        configured = true;
        return client;
      } catch(e) {
        configured = false;
        client = null;
        return null;
      } finally {
        pending = null;
      }
    })();
    return pending;
  }

  function isConfigured(){ return configured === true; }

  // ----- état d'auth partagé ---------------------------------------------
  var state = { user: null, profile: null };
  var listeners = [];
  var loggedInRenderer = null;     // fn(container, ctx) — fourni par la page
  var modalEl = null;              // élément #acctModal installé par installShell
  var privacyEl = null;            // élément #privacyModal
  var chipEl = null;               // élément #acctChip (topbar)

  function emit(){
    var ctx = { user: state.user, profile: state.profile };
    listeners.forEach(function(cb){ try { cb(ctx); } catch(e){} });
  }
  function onChange(cb){ if(typeof cb === 'function'){ listeners.push(cb); cb({user: state.user, profile: state.profile}); } }

  function setUser(u){ state.user = u || null; }
  function setProfile(p){ state.profile = p || null; }

  // ----- formats UI ------------------------------------------------------
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function avaInitial(name){ return esc(String(name || '?').slice(0,1).toUpperCase()); }
  function avaHtml(name, url){
    if(url) return '<img class="ava-img" src="' + esc(url) + '" alt="">' + avaInitial(name);
    return avaInitial(name);
  }

  // ----- chip de topbar --------------------------------------------------
  function renderChip(){
    if(!chipEl) chipEl = document.getElementById('acctChip');
    if(!chipEl) return;
    // Pastille toujours visible : guest tant que Supabase n'a pas confirmé
    // la session, ou si pas de config Supabase.
    chipEl.style.display = 'inline-flex';
    var u = state.user, p = state.profile;
    if(u){
      var name = (p && p.username) || u.email || 'compte';
      chipEl.className = 'acct-chip';
      chipEl.innerHTML = '<span class="chip-ava">' + avaHtml(name, p && p.avatar_url) + '</span><span class="chip-name">' + esc(name) + '</span>';
    } else {
      chipEl.className = 'acct-chip guest';
      chipEl.textContent = 'Se connecter';
    }
  }

  // ----- modales ---------------------------------------------------------
  /* Aucune des trois modales ne gérait le focus : à l'ouverture il restait
     sur le bouton déclencheur, les ~30 contrôles d'arrière-plan restaient
     tabulables, et à la fermeture le focus retombait sur <body> parce que
     l'élément qui le portait venait d'être masqué. WCAG 2.4.3.
     Mutualisé ici et réutilisé par shell-social.js via SHELL.modal. */
  var lastFocus = null;
  function bgParts(){
    return [document.querySelector('header.topbar'),
            document.querySelector('.sidebar'),
            document.querySelector('main, .wrap'),
            document.querySelector('body > footer')].filter(Boolean);
  }
  function focusablesIn(root){
    return [].slice.call(root.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(function(e){ return e.getClientRects().length; });
  }
  function trapKeys(e){
    if(e.key !== 'Tab') return;
    var box = e.currentTarget.querySelector('[role="dialog"]') || e.currentTarget;
    var f = focusablesIn(box);
    if(!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  function enterModal(host){
    if(!host) return;
    lastFocus = document.activeElement;
    bgParts().forEach(function(n){ n.setAttribute('inert',''); n.setAttribute('aria-hidden','true'); });
    host.addEventListener('keydown', trapKeys);
    // Laisser le rendu se poser avant de chercher un focusable.
    setTimeout(function(){
      var box = host.querySelector('[role="dialog"]') || host;
      var f = focusablesIn(box);
      (f[0] || box).focus();
    }, 0);
  }
  function leaveModal(host){
    if(host) host.removeEventListener('keydown', trapKeys);
    bgParts().forEach(function(n){ n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); });
    if(lastFocus && lastFocus.isConnected && lastFocus.getClientRects().length) lastFocus.focus();
    lastFocus = null;
  }

  function openModal(){
    if(!modalEl) modalEl = document.getElementById('acctModal');
    if(!modalEl) return;
    // Reset busy/err/notice à chaque ouverture pour éviter qu'un état
    // bloqué d'une tentative précédente laisse le bouton "..." figé.
    view.busy = false; view.err = ''; view.notice = '';
    view.pwOpen = false; view.eraseConfirm = false; view.focusSel = '';
    renderModal();
    modalEl.hidden = false;
    /* Les chiffres du compte se lisent à l'ouverture, jamais au chargement
       de la page : c'est quatre requêtes pour une modale que la plupart
       des visites n'ouvrent pas. Différé, donc hors du verrou GoTrue. */
    if(state.user) setTimeout(loadExtras, 0);
    document.body.style.overflow = 'hidden';
    enterModal(modalEl);
  }
  function closeModal(){
    if(!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
    leaveModal(modalEl);
  }
  function openPrivacy(){
    if(!privacyEl) privacyEl = document.getElementById('privacyModal');
    if(!privacyEl) return;
    privacyEl.hidden = false;
    document.body.style.overflow = 'hidden';
    enterModal(privacyEl);
  }
  function closePrivacy(){
    if(!privacyEl) return;
    privacyEl.hidden = true;
    leaveModal(privacyEl);
    if(!modalEl || modalEl.hidden) document.body.style.overflow = '';
  }

  // ----- flows Supabase --------------------------------------------------
  /* Les messages de GoTrue arrivent en anglais : « Invalid login
     credentials » est la phrase que le lecteur voit le plus souvent sur un
     site entièrement en français. On traduit celles qu'on connaît et l'on
     laisse passer les autres telles quelles — mieux vaut un message
     anglais qu'un « Échec » qui n'apprend rien. */
  var ERR_FR = [
    [/invalid login credentials/i,            'Adresse e-mail ou mot de passe incorrect.'],
    [/email not confirmed/i,                  'Adresse e-mail non confirmée : ouvrez le lien qui vous a été envoyé.'],
    [/user already registered|already been registered/i, 'Un compte existe déjà avec cette adresse.'],
    [/unable to validate email address/i,     'Cette adresse e-mail n’est pas valide.'],
    [/password should be at least (\d+)/i,    'Le mot de passe doit faire au moins $1 caractères.'],
    [/new password should be different/i,     'Le nouveau mot de passe doit être différent de l’ancien.'],
    [/you can only request this after (\d+)/i,'Trop de tentatives : réessayez dans $1 secondes.'],
    [/email rate limit exceeded/i,            'Trop d’e-mails envoyés : réessayez plus tard.'],
    [/signups not allowed/i,                  'Les inscriptions sont fermées pour le moment.'],
    [/failed to fetch|networkerror|network request failed/i, 'Connexion impossible : vérifiez votre réseau.']
  ];
  function errFr(e, repli){
    var m = (e && e.message) || '';
    for(var i = 0; i < ERR_FR.length; i++){
      var hit = m.match(ERR_FR[i][0]);
      if(hit) return ERR_FR[i][1].replace('$1', hit[1] || '');
    }
    return m || repli;
  }

  /* `sec` = la destination du panneau (Profil / Lecture / Compte),
     `pwOpen` = le champ de mot de passe est déplié, `focusSel` = ce qu'il
     faut refocaliser après le prochain rendu, `extras` = les comptes lus
     sur Supabase (invalidés quand la session change). */
  var view = { authMode:'signin', recovery:false, busy:false, notice:'', err:'', pendingUsername:'',
               eraseConfirm:false, sec:'profil', pwOpen:false, focusSel:'', extras:null };

  async function signIn(email, password){
    var c = await getClient(); if(!c) return { ok:false, msg:'Compte non configuré.' };
    view.busy = true; view.err = ''; view.notice = ''; renderModal();
    try {
      var r = await c.auth.signInWithPassword({ email: email, password: password });
      if(r.error) throw r.error;
      return { ok:true };
    } catch(e){
      view.err = errFr(e, 'Échec de la connexion.');
      return { ok:false, msg: view.err };
    } finally {
      view.busy = false; renderModal();
    }
  }
  async function signUp(email, password, username){
    var c = await getClient(); if(!c) return { ok:false, msg:'Compte non configuré.' };
    view.busy = true; view.err = ''; view.notice = ''; renderModal();
    try {
      view.pendingUsername = username || '';
      try { if(username) localStorage.setItem('liremarx.pendinguser', username); } catch(e){}
      var r = await c.auth.signUp({
        email: email,
        password: password,
        options: { data:{ username: username || '' }, emailRedirectTo: location.href.split('#')[0] }
      });
      if(r.error) throw r.error;
      view.notice = 'Compte créé. Si la confirmation par e-mail est activée, vérifie ta boîte.';
      return { ok:true };
    } catch(e){
      view.err = errFr(e, 'Échec de l\'inscription.');
      return { ok:false, msg: view.err };
    } finally {
      view.busy = false; renderModal();
    }
  }
  async function signOut(){
    var c = await getClient(); if(!c) return;
    try { await c.auth.signOut(); } catch(e){}
  }
  async function resetPassword(email){
    var c = await getClient(); if(!c) return { ok:false, msg:'Compte non configuré.' };
    view.busy = true; view.err = ''; view.notice = ''; renderModal();
    try {
      var r = await c.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
      if(r.error) throw r.error;
      view.notice = 'Un e-mail de réinitialisation a été envoyé.';
      return { ok:true };
    } catch(e){
      view.err = errFr(e, 'Échec.');
      return { ok:false, msg: view.err };
    } finally {
      view.busy = false; renderModal();
    }
  }
  async function updatePassword(password){
    var c = await getClient(); if(!c) return { ok:false, msg:'Compte non configuré.' };
    view.busy = true; view.err = ''; view.notice = ''; renderModal();
    try {
      var r = await c.auth.updateUser({ password: password });
      if(r.error) throw r.error;
      view.recovery = false; view.notice = 'Mot de passe enregistré.';
      return { ok:true };
    } catch(e){
      view.err = errFr(e, 'Échec.');
      return { ok:false, msg: view.err };
    } finally {
      view.busy = false; renderModal();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     MON COMPTE — le panneau (mission « compte-refonte », septembre 2026)

     Avant : une carte de 440 px qui empilait identité, pseudo, photo,
     description, déconnexion et suppression de compte au même niveau —
     sept commandes, aucune hiérarchie — et qui ne disait RIEN de ce que
     le compte porte, alors que la synchro des passages est sa seule
     raison d'être. On ne pouvait pas non plus y changer son mot de passe
     une fois connecté : `updatePassword` n'était atteignable que par le
     lien « mot de passe oublié », donc déconnecté.

     Après : une tête d'identité sur la surface d'emphase du socle, puis
     trois destinations — Profil (ce que les autres voient), Lecture (ce
     que le compte porte), Compte (connexion, mot de passe, données,
     suppression).

     Les chiffres viennent TOUS de Supabase, jamais du localStorage : ce
     panneau parle du COMPTE, pas de ce navigateur. C'est aussi ce qui le
     rend identique partout — /index.html et la bibliothèque ne chargent
     pas shell-annotations.js, le carnet local n'y serait pas lisible.
     ══════════════════════════════════════════════════════════════════════ */
  function setLoggedInRenderer(fn){ loggedInRenderer = fn; if(modalEl && !modalEl.hidden) renderModal(); }

  var SECS = [{ id:'profil', label:'Profil' },
              { id:'lecture', label:'Lecture' },
              { id:'compte', label:'Compte' }];

  var MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août',
              'septembre','octobre','novembre','décembre'];
  function moisAn(d){ return MOIS[d.getMonth()] + ' ' + d.getFullYear(); }
  function jourComplet(d){ return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear(); }
  /* Un chiffre qu'on n'a pas encore ne s'écrit pas « 0 » : le point dit
     qu'on le cherche, le zéro dirait qu'il n'y en a pas. */
  function chiffre(n){ return (n == null) ? '·' : String(n); }

  /* Marques DESSINÉES — pas d'emoji dans une pastille d'interface. */
  function mk(d){
    return '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }
  var MK_SYNC = mk('<path d="M3.4 8.4A6.8 6.8 0 0 1 15 6"/><path d="M16.6 11.6A6.8 6.8 0 0 1 5 14"/><path d="M15 2.6V6h-3.4"/><path d="M5 17.4V14h3.4"/>');
  var MK_TALK = mk('<path d="M3 4.6h14v8.8H7.6L3.8 16.6z"/>');
  var MK_STEP = mk('<path d="M3.4 16.6V11"/><path d="M10 16.6V4.6"/><path d="M16.6 16.6v-7.4"/>');

  /* La bibliothèque, en petit : titre + chemin d'une œuvre. Le même outil
     existe dans SHELL.commune — dupliqué à dessein plutôt que couplé. */
  var acBiblio = null, acBiblioPending = null;
  function bibLite(){
    if(acBiblio) return Promise.resolve(acBiblio);
    if(acBiblioPending) return acBiblioPending;
    acBiblioPending = fetch('/oeuvres/bibliotheque.json', { cache:'no-cache' })
      .then(function(r){ return r.ok ? r.json() : { works: [] }; })
      .then(function(j){
        var m = {};
        (j.works || []).forEach(function(w){
          if(!w || !w.id) return;
          var p = String(w.path || '');
          if(p && p.charAt(0) !== '/') p = '/' + p;
          m[w.id] = { title: w.shortTitle || w.title || 'Œuvre', path: p,
                      status: w.status || 'planned' };
        });
        // alias hérité des premières lignes écrites par Capital
        if(m['capital-1'] && !m['capital']) m['capital'] = m['capital-1'];
        acBiblio = m;
        return m;
      })
      .catch(function(){ acBiblio = {}; return acBiblio; })
      .then(function(m){ acBiblioPending = null; return m; });
    return acBiblioPending;
  }

  /* Les comptes du compte. Jamais appelé depuis un callback GoTrue (règle
     du deadlock) : openModal le lance après coup, hors du verrou. */
  async function loadExtras(){
    var u = state.user;
    if(!u) return;
    /* La bibliothèque se charge même si les comptes sont déjà en cache :
       c'est elle qui donne un titre et un chemin aux passages et à la
       reprise, et une seconde ouverture du panneau ne repasse pas par le
       reste de cette fonction. */
    bibLite().then(function(){
      if(modalEl && !modalEl.hidden) renderModal();
    });
    if(view.extras && view.extras.uid === u.id) return;
    var x = { uid:u.id, loading:true, pass:null, notes:null, chap:null, pub:null, latest:[] };
    view.extras = x;
    if(modalEl && !modalEl.hidden) renderModal();
    var c = null;
    try { c = await getClient(); } catch(e){}
    if(view.extras !== x) return;
    if(c){
      try { var a = await c.from('annotations').select('*', { count:'exact', head:true });
            if(!a.error) x.pass = a.count || 0; } catch(e){}
      try { var n = await c.from('annotations').select('*', { count:'exact', head:true })
                          .not('note','is',null).neq('note','');
            if(!n.error) x.notes = n.count || 0; } catch(e){}
      try { var p = await c.from('reading_progress').select('*', { count:'exact', head:true });
            if(!p.error) x.chap = p.count || 0; } catch(e){}
      try { var q = await c.from('public_notes').select('*', { count:'exact', head:true })
                          .eq('author_id', u.id);
            if(!q.error) x.pub = q.count || 0; } catch(e){}
      try { var l = await c.from('annotations')
                          .select('id,work,section,quote,note,color,before,after,created')
                          .order('created', { ascending:false }).limit(4);
            if(!l.error) x.latest = l.data || []; } catch(e){}
    }
    if(view.extras !== x) return;
    x.loading = false;
    if(modalEl && !modalEl.hidden) renderModal();
  }

  /* La reprise est LOCALE (localStorage, comme les surlignages) : elle dit
     où l'on en était sur CET appareil. On prend la plus récente. */
  function bestResume(){
    var S = window.SHELL;
    if(!S || !S.resume || !acBiblio) return null;
    var best = null;
    Object.keys(acBiblio).forEach(function(id){
      if(id === 'capital') return;                    // alias, pas une œuvre
      var r = null;
      try { r = S.resume.get(id); } catch(e){}
      if(!r || !r.title) return;
      if(!best || (r.t || 0) > (best.r.t || 0)) best = { id:id, r:r, w:acBiblio[id] };
    });
    return best;
  }

  /* Le contrat de deep-link au passage, variante explicite. */
  function passageHref(w, a){
    if(!w || !w.path || !a.quote) return null;
    return w.path + '#s=' + encodeURIComponent(a.section)
      + '&q=' + encodeURIComponent(a.quote)
      + (a.before ? '&b=' + encodeURIComponent(a.before) : '')
      + (a.after ? '&a=' + encodeURIComponent(a.after) : '');
  }

  /* Le droit d'accès du RGPD, exercé d'un clic : le carnet de ce
     navigateur, tel que le module le tient. Rien d'autre — le libellé le
     dit, on ne promet pas un export du compte entier. */
  function exportCarnet(){
    var A = window.SHELL && window.SHELL.annotations;
    if(!A || !A.allNotes) return false;
    var rows;
    try { rows = A.allNotes(); } catch(e){ return false; }
    try {
      var blob = new Blob([JSON.stringify({ site:'liremarx', passages:rows }, null, 2)],
                          { type:'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'lire-marx-carnet.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
      return true;
    } catch(e){ return false; }
  }

  /* Un seul « Enregistrer » pour le pseudo ET la description : deux
     boutons d'enregistrement dans la même carte, c'est une chance sur
     deux de cliquer le mauvais. */
  async function saveProfile(name, bio){
    var cur = (state.profile && state.profile.username) || '';
    name = String(name || '').trim();
    if(!name) return { ok:false, msg:'Choisissez un pseudo : 2 à 24 caractères (lettres, chiffres, _ ou -).' };
    if(name !== cur){
      var r = await saveUsername(name);
      if(!r.ok) return r;
    }
    return await saveProfileMeta(bio, undefined);
  }

  // ----- fragments -------------------------------------------------------
  function headHtml(){
    var u = state.user, p = state.profile;
    var pseudo = (p && p.username) || '';
    var since = '';
    if(u && u.created_at){
      var d = new Date(u.created_at);
      if(!isNaN(d.getTime())) since = 'membre depuis ' + moisAn(d);
    }
    var line = [esc((u && u.email) || ''), since].filter(Boolean).join(' · ');
    return '<header class="ac-head"><p class="ac-kicker">Mon compte</p>'
      + '<div class="ac-id"><span class="ac-ava">' + avaHtml(pseudo || (u && u.email), p && p.avatar_url) + '</span>'
      + '<div class="ac-id-main"><h3 class="ac-name">'
      + (pseudo ? esc(pseudo) : '<i>Sans pseudo</i>') + '</h3>'
      + '<p class="ac-meta">' + line + '</p></div></div></header>';
  }

  function segHtml(items, current, label){
    return '<div class="ac-seg" role="tablist" aria-label="' + esc(label) + '">'
      + items.map(function(s){
          var on = (current === s.id);
          return '<button type="button" class="ac-t' + (on ? ' on' : '') + '" role="tab"'
            + ' id="acTab-' + s.id + '" aria-selected="' + (on ? 'true' : 'false') + '"'
            + ' aria-controls="acPane" tabindex="' + (on ? '0' : '-1') + '"'
            + ' data-act="' + esc(s.act || 'sec') + '" data-sec="' + s.id + '">'
            + esc(s.label) + '</button>';
        }).join('')
      + '</div>';
  }

  function secProfil(){
    var u = state.user, p = state.profile;
    var pseudo = (p && p.username) || '';
    var bio = (p && p.bio) || '';
    return '<div class="ac-sec"><p class="ac-sec-h">Votre identité publique</p>'
      + '<label class="ac-lab" for="acUser">Pseudo</label>'
      + '<input type="text" id="acUser" value="' + esc(pseudo) + '" placeholder="votre-pseudo"'
      + ' maxlength="24" autocomplete="nickname" spellcheck="false">'
      + '<label class="ac-lab gap" for="acBio">Description</label>'
      + '<textarea id="acBio" maxlength="280" placeholder="Quelques mots sur vous — 280 caractères.">'
      + esc(bio) + '</textarea>'
      + '<div class="ac-actions"><button class="ac-btn pri" data-act="save-profile" type="button"'
      + (view.busy ? ' disabled' : '') + '>' + (view.busy ? 'Enregistrement…' : 'Enregistrer') + '</button></div></div>'

      + '<div class="ac-sec"><p class="ac-sec-h">Photo</p>'
      + '<div class="ac-avarow"><span class="ac-ava ac-ava-edit">'
      + avaHtml(pseudo || (u && u.email), p && p.avatar_url) + '</span>'
      + '<div class="ac-avabtns"><input type="file" id="acAvaFile" accept="image/*" hidden>'
      + '<button class="ac-btn" data-act="ava-pick" type="button"' + (view.busy ? ' disabled' : '') + '>Choisir une image…</button>'
      + ((p && p.avatar_url) ? '<button class="ac-quiet" data-act="ava-clear" type="button">Retirer</button>' : '')
      + '</div></div></div>'

      + '<div class="ac-sec"><p class="ac-sec-h">Sur la Place publique, on vous lit ainsi</p>'
      + '<div class="ac-preview"><span class="ac-ava" id="acPvAva">'
      + avaHtml(pseudo || '?', p && p.avatar_url) + '</span>'
      + '<div><div class="ac-pv-sig" id="acPvSig">' + esc(pseudo || 'votre pseudo') + '</div>'
      + '<div class="ac-pv-when">à l’instant · Le Capital, chapitre I</div></div></div>'
      + '<p class="ac-note">Votre adresse e-mail n’apparaît nulle part : elle ne sert qu’à vous connecter.</p></div>';
  }

  function secLecture(){
    var x = view.extras || { loading:true };
    var tiles = [{ n:x.pass, l:'passages surlignés' },
                 { n:x.notes, l:'notes écrites' },
                 { n:x.chap, l:'chapitres lus' },
                 { n:x.pub, l:'notes publiques' }];
    /* Règle tenue : on n'affiche jamais une case qu'on ne peut pas
       remplir. Tant qu'on cherche, elle attend ; si la table n'a pas
       répondu, elle disparaît plutôt que d'annoncer un faux zéro. */
    var shown = x.loading ? tiles : tiles.filter(function(t){ return t.n != null; });
    var h = '<div class="ac-sec"><p class="ac-sec-h">Ce que votre compte porte</p>';
    if(shown.length){
      h += '<div class="ac-stats">' + shown.map(function(t){
        return '<div class="ac-stat"><div class="ac-stat-n">' + chiffre(t.n) + '</div>'
             + '<div class="ac-stat-l">' + t.l + '</div></div>';
      }).join('') + '</div>';
    } else {
      h += '<p class="ac-empty">Les chiffres de votre compte n’ont pas pu être lus. Réessayez plus tard.</p>';
    }
    h += '</div>';

    var b = bestResume();
    if(b){
      h += '<div class="ac-sec"><p class="ac-sec-h">Reprendre sur cet appareil</p>'
        + '<a class="ac-go" href="' + esc(b.w.path) + '">'
        + '<span class="ac-go-k">' + esc(b.w.title) + '</span>'
        + '<span class="ac-go-t">' + (b.r.num ? 'Chapitre ' + esc(b.r.num) + ' — ' : '') + esc(b.r.title) + '</span>'
        + '<span class="ac-go-s">Rouvrir le texte →</span></a></div>';
    }

    var L = (x.latest || []).filter(function(a){ return a && a.quote; }).slice(0, 3);
    h += '<div class="ac-sec"><p class="ac-sec-h">Vos derniers passages</p>';
    if(L.length){
      h += '<ul class="ac-pass">' + L.map(function(a){
        var w = acBiblio ? acBiblio[a.work] : null;
        var href = passageHref(w, a);
        var col = String(a.color || 'gold');
        var où = [(w && w.title) || a.work, 'section ' + a.section].join(' · ');
        var inner = '<span class="ac-pass-bar c-' + esc(col) + '"></span><span>'
          + '<span class="ac-pass-q">' + esc(a.quote) + '</span>'
          + (a.note ? '<span class="ac-pass-n">' + esc(a.note) + '</span>' : '')
          + '<span class="ac-pass-w">' + esc(où) + '</span></span>';
        return '<li>' + (href
          ? '<a class="ac-pass-item" href="' + esc(href) + '">' + inner + '</a>'
          : '<span class="ac-pass-item">' + inner + '</span>') + '</li>';
      }).join('') + '</ul>';
    } else if(x.loading){
      h += '<p class="ac-empty">Lecture de votre compte…</p>';
    } else {
      h += '<p class="ac-empty">Aucun passage sur ce compte pour l’instant. <b>Surlignez une phrase</b> en lisant : elle vous suivra d’un appareil à l’autre.</p>';
    }
    h += '<div class="ac-actions"><a class="ac-btn" href="/oeuvres/carnet">Ouvrir mon carnet</a></div></div>';
    return h;
  }

  function secCompte(){
    var u = state.user;
    var créé = '';
    if(u && u.created_at){
      var d = new Date(u.created_at);
      if(!isNaN(d.getTime())) créé = jourComplet(d);
    }
    var h = '<div class="ac-sec"><p class="ac-sec-h">Connexion</p><dl class="ac-facts">'
      + '<div><dt>Adresse e-mail</dt><dd>' + esc((u && u.email) || '') + '</dd></div>'
      + (créé ? '<div><dt>Compte créé le</dt><dd>' + créé + '</dd></div>' : '')
      + '</dl>'
      + '<div class="ac-actions"><button class="ac-btn" data-act="signout" type="button">Se déconnecter</button></div></div>';

    h += '<div class="ac-sec"><p class="ac-sec-h">Mot de passe</p>';
    if(view.pwOpen){
      h += '<label class="ac-lab" for="acNew">Nouveau mot de passe</label>'
        + '<input type="password" id="acNew" placeholder="6 caractères minimum" autocomplete="new-password">'
        + '<div class="ac-actions"><button class="ac-quiet" data-act="pw-cancel" type="button">Annuler</button>'
        + '<button class="ac-btn pri" data-act="setpw" type="button"' + (view.busy ? ' disabled' : '') + '>'
        + (view.busy ? 'Enregistrement…' : 'Enregistrer') + '</button></div>';
    } else {
      h += '<div class="ac-row"><button class="ac-btn" data-act="pw-open" type="button">Changer mon mot de passe</button></div>';
    }
    h += '</div>';

    var carnet = !!(window.SHELL && window.SHELL.annotations && window.SHELL.annotations.allNotes);
    h += '<div class="ac-sec"><p class="ac-sec-h">Vos données</p><div class="ac-row">'
      + '<button class="ac-btn" data-act="privacy" type="button">Confidentialité &amp; données</button>'
      + (carnet ? '<button class="ac-btn" data-act="export" type="button">Télécharger mon carnet</button>' : '')
      + '</div>'
      + (carnet ? '<p class="ac-note">Un fichier JSON avec les passages et les notes de ce navigateur.</p>' : '')
      + '</div>';

    h += '<div class="ac-sec"><div class="ac-danger"><p class="ac-danger-h">Zone de danger</p>';
    if(view.eraseConfirm){
      h += '<p><b>Supprimer définitivement votre compte ?</b> Cela efface votre compte et toutes vos données — annotations privées, notes et réponses publiques, pseudo, signalements. Vous serez déconnecté et ne pourrez plus vous reconnecter. Action irréversible.</p>'
        + '<div class="ac-row"><button class="ac-btn danger" data-act="erase-yes" type="button"' + (view.busy ? ' disabled' : '') + '>'
        + (view.busy ? 'Suppression…' : 'Oui, supprimer mon compte') + '</button>'
        + '<button class="ac-quiet" data-act="erase-no" type="button">Annuler</button></div>';
    } else {
      h += '<p>La suppression efface votre compte et l’ensemble de vos données, sans retour possible.</p>'
        + '<div class="ac-row"><button class="ac-btn danger" data-act="erase" type="button">Supprimer mon compte</button></div>';
    }
    return h + '</div></div>';
  }

  function guestBody(signup, inv){
    var h = '<label class="ac-lab" for="acEmail">Adresse e-mail</label>'
      + '<input type="email" id="acEmail" placeholder="vous@exemple.fr" autocomplete="email"' + inv + '>'
      + (signup ? '<label class="ac-lab gap" for="acUser">Pseudo public</label>'
                + '<input type="text" id="acUser" placeholder="2 à 24 caractères" maxlength="24" autocomplete="nickname" spellcheck="false"' + inv + '>' : '')
      + '<label class="ac-lab gap" for="acPw">Mot de passe</label>'
      + '<input type="password" id="acPw" placeholder="' + (signup ? '6 caractères minimum' : 'votre mot de passe')
      + '" autocomplete="' + (signup ? 'new-password' : 'current-password') + '"' + inv + '>'
      + '<div class="ac-actions stretch">'
      + '<button class="ac-btn pri wide" data-act="' + (signup ? 'do-signup' : 'do-signin') + '" type="button"'
      + (view.busy ? ' disabled' : '') + '>'
      + (view.busy ? 'Un instant…' : (signup ? 'Créer mon compte' : 'Se connecter')) + '</button></div>';
    if(!signup){
      h += '<div class="ac-row center">'
        + '<button class="ac-quiet" data-act="reset" type="button">Mot de passe oublié ?</button></div>';
    }
    /* La liste des trois gains ne s'affiche qu'à l'inscription : elle
       argumente, et l'on n'argumente pas auprès de qui revient. */
    if(signup){
      h += '<div class="ac-sec"><p class="ac-sec-h">Ce qu’un compte ajoute</p><ul class="ac-bens">'
        + '<li class="ac-ben">' + MK_SYNC + '<span><b>Vos passages vous suivent.</b> Surlignages et notes se retrouvent sur tous vos appareils.</span></li>'
        + '<li class="ac-ben">' + MK_TALK + '<span><b>Vous pouvez écrire.</b> Ouvrir une discussion, répondre et appuyer une lecture sur la Place publique.</span></li>'
        + '<li class="ac-ben">' + MK_STEP + '<span><b>Votre progression se garde.</b> Les chapitres lus restent cochés d’une visite à l’autre.</span></li>'
        + '</ul></div>';
    }
    return h;
  }

  // ----- rendu du panneau ------------------------------------------------
  function renderModal(){
    if(!modalEl) modalEl = document.getElementById('acctModal');
    if(!modalEl) return;
    var slot = modalEl.querySelector('#acctView');
    if(!slot) return;
    /* role=alert : une erreur de connexion s'affichait dans un <div> muet.
       aria-describedby relie l'erreur aux champs (WCAG 3.3.1). */
    var err = view.err ? '<div class="ac-err" id="acErr" role="alert">' + esc(view.err) + '</div>' : '';
    var ok  = view.notice ? '<div class="ac-ok" role="status">' + esc(view.notice) + '</div>' : '';
    var inv = view.err ? ' aria-invalid="true" aria-describedby="acErr"' : '';

    // "Compte non configuré" ne doit s'afficher QUE si getClient a tourné
    // ET a réellement échoué (configured === false). Si configured est null
    // (init Supabase pas encore lancé ou en cours), on laisse passer pour
    // afficher la vue invité — le bootstrap re-rendra dès qu'il a fini.
    if(configured === false){
      slot.innerHTML = '<div class="ac-panel"><header class="ac-head">'
        + '<p class="ac-kicker">Mon compte</p><h3 class="ac-name">Compte non configuré</h3></header>'
        + '<div class="ac-pane"><p class="ac-p">La synchronisation par compte n’est pas branchée : il reste à renseigner les clés Supabase dans <code>config.js</code> à la racine. En attendant, le site reste 100 % local — vos surlignages vivent dans ce navigateur.</p></div></div>';
      return;
    }
    if(view.recovery){
      slot.innerHTML = '<div class="ac-panel"><header class="ac-head">'
        + '<p class="ac-kicker">Mon compte</p><h3 class="ac-name">Nouveau mot de passe</h3>'
        + '<p class="ac-meta">Choisissez-en un, puis vous serez connecté.</p></header>'
        + '<div class="ac-pane">' + err + ok
        + '<label class="ac-lab" for="acNew">Nouveau mot de passe</label>'
        + '<input type="password" id="acNew" placeholder="6 caractères minimum" autocomplete="new-password"' + inv + '>'
        + '<div class="ac-actions stretch"><button class="ac-btn pri wide" data-act="setpw" type="button"'
        + (view.busy ? ' disabled' : '') + '>Enregistrer</button></div></div></div>';
      wireModalActions(slot);
      return;
    }
    if(state.user){
      if(loggedInRenderer){
        try { loggedInRenderer(slot, { user: state.user, profile: state.profile, view: view, esc: esc, avaHtml: avaHtml }); }
        catch(e){ slot.innerHTML = '<div class="ac-panel"><div class="ac-pane"><p class="ac-p">Erreur de rendu.</p></div></div>'; }
        wireModalActions(slot);
        return;
      }
      if(SECS.every(function(s){ return s.id !== view.sec; })) view.sec = 'profil';
      var body = view.sec === 'lecture' ? secLecture()
               : view.sec === 'compte'  ? secCompte()
               : secProfil();
      slot.innerHTML = '<div class="ac-panel">' + headHtml()
        + segHtml(SECS, view.sec, 'Sections de mon compte')
        + '<div class="ac-pane" id="acPane" role="tabpanel" aria-labelledby="acTab-' + view.sec + '">'
        + err + ok + body + '</div></div>';
      wireModalActions(slot);
      return;
    }

    // Vue invité — se connecter / créer un compte
    var signup = view.authMode === 'signup';
    slot.innerHTML = '<div class="ac-panel"><header class="ac-head">'
      + '<p class="ac-kicker">Mon compte</p>'
      + '<h3 class="ac-name">' + (signup ? 'Créer un compte' : 'Se connecter') + '</h3>'
      + '<p class="ac-meta">Vos passages vivent dans ce navigateur. Un compte les emmène partout.</p></header>'
      + segHtml([{ id:'signin', label:'Se connecter', act:'mode-signin' },
                 { id:'signup', label:'Créer un compte', act:'mode-signup' }],
                signup ? 'signup' : 'signin', 'Se connecter ou créer un compte')
      + '<div class="ac-pane" id="acPane" role="tabpanel" aria-labelledby="acTab-' + (signup ? 'signup' : 'signin') + '">'
      + err + ok + guestBody(signup, inv)
      + '<div class="ac-foot"><button class="ac-quiet" data-act="privacy" type="button">Confidentialité &amp; données</button>'
      + '<span class="ac-pv-when">Aucun pistage, aucun cookie publicitaire.</span></div>'
      + '</div></div>';
    wireModalActions(slot);
  }

  function field(el, id){ var x = el.querySelector('#' + id); return x ? x.value : ''; }

  function wireModalActions(slot){
    slot.querySelectorAll('[data-act]').forEach(function(b){
      b.onclick = function(){
        var a = b.dataset.act;
        if(a === 'sec'){ view.sec = b.dataset.sec; view.err = ''; view.notice = ''; view.focusSel = '.ac-t.on'; renderModal(); }
        else if(a === 'mode-signin'){ view.authMode = 'signin'; view.err = ''; view.notice = ''; view.focusSel = '.ac-t.on'; renderModal(); }
        else if(a === 'mode-signup'){ view.authMode = 'signup'; view.err = ''; view.notice = ''; view.focusSel = '.ac-t.on'; renderModal(); }
        else if(a === 'do-signin'){ signIn(field(slot,'acEmail').trim(), field(slot,'acPw')); }
        else if(a === 'do-signup'){ signUp(field(slot,'acEmail').trim(), field(slot,'acPw'), field(slot,'acUser').trim()); }
        else if(a === 'reset'){ var em = field(slot,'acEmail').trim(); if(!em){ view.err = 'Indiquez d’abord votre adresse e-mail.'; renderModal(); } else resetPassword(em); }
        else if(a === 'pw-open'){ view.pwOpen = true; view.err = ''; view.notice = ''; view.focusSel = '#acNew'; renderModal(); }
        else if(a === 'pw-cancel'){ view.pwOpen = false; view.focusSel = '[data-act="pw-open"]'; renderModal(); }
        else if(a === 'setpw'){
          var pw = field(slot,'acNew');
          updatePassword(pw).then(function(r){ if(r && r.ok){ view.pwOpen = false; renderModal(); } });
        }
        else if(a === 'signout'){ signOut(); }
        else if(a === 'privacy'){ openPrivacy(); }
        else if(a === 'export'){
          view.err = ''; view.notice = '';
          if(exportCarnet()) view.notice = 'Carnet téléchargé.';
          else view.err = 'Export impossible depuis cette page.';
          renderModal();
        }
        else if(a === 'save-profile'){
          view.err = ''; view.notice = ''; view.busy = true; renderModal();
          saveProfile(field(slot,'acUser'), field(slot,'acBio')).then(function(r){
            view.busy = false;
            if(r.ok){ view.notice = 'Profil enregistré.'; renderChip(); }
            else { view.err = r.msg || 'Échec.'; }
            renderModal();
          });
        }
        else if(a === 'ava-pick'){ var fi = slot.querySelector('#acAvaFile'); if(fi) fi.click(); }
        else if(a === 'ava-clear'){
          view.err = ''; view.notice = '';
          saveProfileMeta(undefined, '').then(function(r){
            if(r.ok){ view.notice = 'Photo retirée.'; renderChip(); }
            else { view.err = r.msg || 'Échec.'; }
            renderModal();
          });
        }
        else if(a === 'erase'){ view.eraseConfirm = true; view.focusSel = '[data-act="erase-no"]'; renderModal(); }
        else if(a === 'erase-no'){ view.eraseConfirm = false; view.focusSel = '[data-act="erase"]'; renderModal(); }
        else if(a === 'erase-yes'){
          view.busy = true; view.err = ''; view.notice = ''; renderModal();
          eraseMyData().then(function(r){
            view.busy = false;
            if(r.ok){ view.eraseConfirm = false; renderChip(); }
            else { view.err = r.msg || 'Échec.'; }
            renderModal();
          });
        }
      };
    });

    /* Un sélecteur segmenté se parcourt aux flèches, avec un seul arrêt de
       tabulation (tabindex roulant) — c'est ce que SHELL.tabs fait pour les
       barres de page ; ici le panneau est reconstruit à chaque bascule, on
       le câble donc au montage. */
    var tabs = [].slice.call(slot.querySelectorAll('[role="tab"]'));
    tabs.forEach(function(t, i){
      t.addEventListener('keydown', function(e){
        var j = -1;
        if(e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if(e.key === 'Home') j = 0;
        else if(e.key === 'End') j = tabs.length - 1;
        if(j < 0) return;
        e.preventDefault();
        tabs[j].click();
      });
    });

    /* L'aperçu suit la frappe SANS re-rendu : re-rendre volerait le focus
       du champ à chaque lettre (le défaut déjà corrigé sur les soutiens de
       la Place publique). */
    var uf = slot.querySelector('#acUser'), sig = slot.querySelector('#acPvSig');
    if(uf && sig){
      uf.addEventListener('input', function(){
        var v = uf.value.trim();
        sig.textContent = v || 'votre pseudo';
        var ava = slot.querySelector('#acPvAva');
        if(ava && !ava.querySelector('.ava-img')) ava.textContent = (v || '?').slice(0,1).toUpperCase();
      });
    }

    var af = slot.querySelector('#acAvaFile');
    if(af){
      af.onchange = function(){
        var f = af.files && af.files[0];
        if(!f) return;
        view.busy = true; view.err = ''; view.notice = ''; renderModal();
        uploadAvatar(f).then(function(r){
          view.busy = false;
          if(r.ok){ view.notice = 'Photo enregistrée.'; renderChip(); }
          else { view.err = r.msg || 'Échec.'; }
          renderModal();
        });
      };
    }

    /* Le panneau est réécrit en entier à chaque rendu : sans cela le focus
       retombe sur <body> dès qu'on change d'onglet ou qu'on déplie un
       champ, et le clavier repart du début de la page. */
    if(view.focusSel){
      var target = slot.querySelector(view.focusSel);
      view.focusSel = '';
      if(target) target.focus();
    }
  }
  // Sauvegarde du profil complet (pseudo + bio + avatar). Conserve les
  // champs non touchés (passe undefined pour ne pas écraser).
  async function saveProfileMeta(bio, avatarUrl){
    var c = await getClient();
    if(!c || !state.user) return {ok:false, msg:'Non connecté.'};
    var row = {id: state.user.id};
    if(state.profile && state.profile.username) row.username = state.profile.username;
    if(bio !== undefined) row.bio = String(bio || '').slice(0, 280);
    if(avatarUrl !== undefined) row.avatar_url = avatarUrl || null;
    try {
      var r = await c.from('profiles').upsert(row).select().maybeSingle();
      if(r.error) return {ok:false, msg: r.error.message};
      if(r.data) setProfile(r.data);
      return {ok:true};
    } catch(e){
      return {ok:false, msg: (e && e.message) || String(e)};
    }
  }

  // Upload de la photo de profil dans le bucket Storage `avatars`.
  async function uploadAvatar(file){
    var c = await getClient();
    if(!c || !state.user || !file) return {ok:false, msg:'Non connecté.'};
    if(!(state.profile && state.profile.username)) return {ok:false, msg:'Choisis d\'abord un pseudo.'};
    try {
      var ext = ((file.name || '').split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      var path = state.user.id + '/avatar_' + Date.now() + '.' + ext;
      var up = await c.storage.from('avatars').upload(path, file, {upsert:true, contentType: file.type || undefined});
      if(up.error) throw up.error;
      var pub = c.storage.from('avatars').getPublicUrl(path);
      var url = pub && pub.data && pub.data.publicUrl;
      if(!url) throw new Error('URL publique introuvable.');
      var r = await saveProfileMeta(undefined, url);
      if(!r.ok) throw new Error(r.msg || 'enregistrement échoué');
      return {ok:true};
    } catch(e){
      return {ok:false, msg: 'Photo : ' + ((e && e.message) || e) + ' — le bucket Storage « avatars » est-il créé et public ?'};
    }
  }

  // Suppression du compte et de toutes les données via la fonction Edge
  // « delete-account » côté Supabase.
  async function eraseMyData(){
    var c = await getClient();
    if(!c || !state.user) return {ok:false, msg:'Non connecté.'};
    try {
      var r = await c.functions.invoke('delete-account');
      if(r.error) throw r.error;
      try { await c.auth.signOut(); } catch(e){}
      setUser(null); setProfile(null);
      return {ok:true};
    } catch(e){
      return {ok:false, msg: 'Suppression : ' + ((e && e.message) || e) + ' — la fonction « delete-account » est-elle déployée ?'};
    }
  }

  // Sauvegarde du pseudo (table profiles) — accessible partout.
  async function saveUsername(name){
    var c = await getClient();
    if(!c || !state.user) return {ok:false, msg:'Non connecté.'};
    name = String(name || '').trim();
    if(!/^[A-Za-z0-9_\-]{2,24}$/.test(name)) return {ok:false, msg:'Pseudo : 2 à 24 caractères (lettres, chiffres, _ ou -).'};
    try {
      var t = await c.from('profiles').select('id').eq('username', name).maybeSingle();
      if(t && t.data && t.data.id !== state.user.id) return {ok:false, msg:'Ce pseudo est déjà pris.'};
    } catch(e){}
    try {
      var r = await c.from('profiles').upsert({id: state.user.id, username: name}).select().maybeSingle();
      if(r.error){
        var dup = (r.error.message || '').indexOf('duplicate') >= 0;
        return {ok:false, msg: dup ? 'Ce pseudo est déjà pris.' : r.error.message};
      }
      setProfile(r.data || {id: state.user.id, username: name});
      return {ok:true};
    } catch(e){
      return {ok:false, msg: (e && e.message) || String(e)};
    }
  }

  // ----- branchement automatique sur le shell installé ------------------
  function wireChrome(){
    if(!chipEl) chipEl = document.getElementById('acctChip');
    if(!modalEl) modalEl = document.getElementById('acctModal');
    if(!privacyEl) privacyEl = document.getElementById('privacyModal');
    if(chipEl){ chipEl.onclick = function(){ view.err = ''; view.notice = ''; openModal(); }; }
    if(modalEl){
      modalEl.addEventListener('click', function(e){ if(e.target === modalEl) closeModal(); });
      var x = modalEl.querySelector('.acct-modal-x'); if(x) x.onclick = closeModal;
    }
    if(privacyEl){
      privacyEl.addEventListener('click', function(e){ if(e.target === privacyEl) closePrivacy(); });
      var xp = privacyEl.querySelector('.acct-modal-x'); if(xp) xp.onclick = closePrivacy;
    }
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      if(privacyEl && !privacyEl.hidden){ closePrivacy(); return; }
      if(modalEl && !modalEl.hidden){ closeModal(); }
    });
  }

  // Lecture du profil public (pseudo + avatar) depuis la table `profiles`.
  // Capital fait sa propre version plus riche (annotations, modération) ;
  // ici on se contente de l'identité publique pour la pastille.
  async function loadProfile(){
    var c = await getClient(); if(!c || !state.user) return null;
    try {
      var r = await c.from('profiles').select('id,username,avatar_url,bio').eq('id', state.user.id).maybeSingle();
      if(r && r.data) setProfile(r.data); else setProfile(null);
    } catch(e){ /* table absente / RLS / réseau : pseudo non chargé */ }
    return state.profile;
  }

  // ----- bootstrap session côté shell -----------------------------------
  // ⚠️ Verrou GoTrue v2 : le callback onAuthStateChange tourne sous un
  // verrou interne. Tout `await c.from(...)` ou `await c.auth.xxx()`
  // déclenché à l'intérieur attend la libération du verrou que le
  // callback détient encore — d'où le deadlock observé (pastille figée
  // sur « Se connecter », modale qui ne reflète jamais la session).
  // Règle : dans ce callback, on synchronise l'état + on rend tout de
  // suite avec l'e-mail, puis on diffère le chargement du profil
  // (loadProfile fait un SELECT) via setTimeout(…, 0) pour sortir du
  // verrou avant l'appel Supabase.
  async function bootstrap(){
    var c = await getClient();
    if(!c){ renderChip(); renderModal(); return; }
    c.auth.onAuthStateChange(function(ev, session){
      if(ev === 'PASSWORD_RECOVERY'){ view.recovery = true; openModal(); }
      setUser((session && session.user) || null);
      if(!state.user){ setProfile(null); view.extras = null; view.sec = 'profil'; view.pwOpen = false; }
      // rendu immédiat (pas de requête Supabase ici)
      emit();
      renderChip();
      if(modalEl && !modalEl.hidden) renderModal();
      // les comptes du panneau, hors du verrou GoTrue comme loadProfile
      if(state.user && modalEl && !modalEl.hidden) setTimeout(loadExtras, 0);
      // chargement du profil HORS du verrou GoTrue
      if(state.user){
        setTimeout(function(){
          loadProfile().then(function(){
            emit();
            renderChip();
            if(modalEl && !modalEl.hidden) renderModal();
          });
        }, 0);
      }
    });
    var r = await c.auth.getSession();
    setUser((r.data && r.data.session && r.data.session.user) || null);
    // même règle qu'au-dessus : on rend immédiatement, puis on charge
    // le profil sans bloquer le premier rendu.
    emit();
    renderChip();
    renderModal();
    if(state.user){
      loadProfile().then(function(){
        emit();
        renderChip();
        if(modalEl && !modalEl.hidden) renderModal();
      });
    }
  }

  SHELL.auth = {
    // singleton client
    getClient: getClient,
    isConfigured: isConfigured,
    // état + abonnement
    get user(){ return state.user; },
    get profile(){ return state.profile; },
    setProfile: setProfile,
    loadProfile: loadProfile,
    saveUsername: saveUsername,
    saveProfileMeta: saveProfileMeta,
    uploadAvatar: uploadAvatar,
    eraseMyData: eraseMyData,
    onChange: onChange,
    // flows
    signIn: signIn, signUp: signUp, signOut: signOut,
    resetPassword: resetPassword, updatePassword: updatePassword,
    // UI
    openModal: openModal, closeModal: closeModal,
    openPrivacy: openPrivacy, closePrivacy: closePrivacy,
    /* Mis à disposition de shell-social.js : sa modale Contacts reprend le
       même motif et souffrait des mêmes défauts de focus. */
    _enterModal: enterModal, _leaveModal: leaveModal,
    renderChip: renderChip, renderModal: renderModal,
    setLoggedInRenderer: setLoggedInRenderer,
    // appelée automatiquement par installShell()
    _wireChrome: wireChrome,
    _bootstrap: bootstrap
  };

  // Lancement IMMÉDIAT (au chargement de shell.js) de l'import Supabase :
  // comme ça `configured` passe à true le plus tôt possible, et la modale
  // ne montre pas "Compte non configuré" si l'utilisateur clique pendant
  // la phase d'init.
  try { getClient(); } catch(e){}
})();

/* ===== SHELL.commune — Place publique partagée (lecture seule)
   ----------------------------------------------------------------
   Flux agrégé des notes publiques (`public_notes`), monté dans
   n'importe quel conteneur DOM via SHELL.commune.mount(el, opts).
   Deux surfaces :
   - page dédiée oeuvres/place-publique.html (mount sans limite) ;
   - aperçu colonne droite de la bibliothèque (mount avec
     {limit:6, compact:true} → ajoute un lien « Voir toutes les
     notes → » qui mène à la page dédiée).
   Contrairement à la vue riche de capital-1.html (placeCommune +
   commonsView : tri, filtres, composition, profil membre,
   modération, deep-link au passage), cette vue est en lecture
   seule : pas de composer, pas de réponse, pas de signalement,
   pas de profil membre cliquable. Le saut précis vers le passage
   est une mission ultérieure ; pour l'instant un clic « Ouvrir → »
   mène simplement à la page de l'œuvre concernée.
   ================================================================ */
(function(){
  var SHELL = window.SHELL = window.SHELL || {};
  if(SHELL.commune) return;

  // Alias hérité : les premières lignes de public_notes ont été insérées
  // par capital-1.html avec work='capital' (avant la généralisation à
  // l'ensemble de la bibliothèque). Désormais public_notes.work doit
  // valoir l'id de bibliotheque.json (ex. manuscrits-1844).
  var WORK_ALIAS = { 'capital': 'capital-1' };

  var biblioPromise = null;
  var biblioMap = null; // id → {title, path, status}

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function ago(ts){
    var d = Date.now() - (+ts || 0);
    var mn = Math.round(d/6e4);
    if(mn < 1) return "à l'instant";
    if(mn < 60) return 'il y a ' + mn + ' min';
    var h = Math.round(mn/60);
    if(h < 24) return 'il y a ' + h + ' h';
    var j = Math.round(h/24);
    if(j <= 1) return 'hier';
    if(j < 7) return 'il y a ' + j + ' j';
    return new Date(+ts).toLocaleDateString('fr-FR');
  }
  function trunc(t, mx){
    t = String(t || '').replace(/\s+/g, ' ').trim();
    return t.length > mx ? t.slice(0, mx-1).trim() + '…' : t;
  }
  function initials(name){
    var s = String(name || '?').replace(/[^A-Za-zÀ-ÿ0-9]/g, '').slice(0, 2).toUpperCase();
    return s || '?';
  }
  function accent(n){
    var palette = ['#a52a21', '#39596b', '#9a7b35', '#52742f'];
    return palette[(((+n || 1) - 1) % 4 + 4) % 4];
  }

  // Charge bibliotheque.json une seule fois et construit la map
  // id → {title, path, status}. Ajoute l'alias 'capital' → 'capital-1'
  // pour les lignes héritées de public_notes.
  async function loadBiblio(){
    if(biblioMap) return biblioMap;
    if(biblioPromise) return biblioPromise;
    biblioPromise = (async function(){
      try {
        var r = await fetch('/oeuvres/bibliotheque.json', { cache: 'no-cache' });
        if(!r.ok) throw new Error('biblio HTTP ' + r.status);
        var json = await r.json();
        var map = {};
        (json.works || []).forEach(function(w){
          if(!w || !w.id) return;
          var path = String(w.path || '');
          if(path && path.indexOf('/') !== 0) path = '/' + path;
          map[w.id] = {
            title: w.shortTitle || w.title || 'Œuvre',
            path: path,
            status: w.status || 'planned'
          };
        });
        if(map['capital-1'] && !map['capital']) map['capital'] = map['capital-1'];
        biblioMap = map;
        return map;
      } catch(e){
        biblioMap = {};
        return biblioMap;
      } finally {
        biblioPromise = null;
      }
    })();
    return biblioPromise;
  }

  // ----- fetch Supabase -------------------------------------------------
  async function fetchData(){
    var auth = window.SHELL && window.SHELL.auth;
    if(!auth) return { mode: 'no-client' };
    var c = await auth.getClient();
    if(!c) return { mode: 'no-client' };
    var topsRes = await c.from('public_notes')
      .select('id,author_id,work,section,quote,body,parent_id,created,profiles(username)')
      .eq('hidden', false).is('parent_id', null)
      .order('created', { ascending: false }).limit(200);
    if(topsRes.error) throw topsRes.error;
    var tops = topsRes.data || [];
    var counts = {};
    try {
      var rc = await c.from('public_notes')
        .select('parent_id').eq('hidden', false).not('parent_id', 'is', null);
      if(!rc.error) (rc.data || []).forEach(function(r){
        if(r.parent_id) counts[r.parent_id] = (counts[r.parent_id] || 0) + 1;
      });
    } catch(e){}
    return { mode: 'ok', tops: tops, counts: counts };
  }

  // ----- rendu ----------------------------------------------------------
  function cardHtml(note, counts, biblio){
    var workKey = note.work || '';
    var resolvedId = WORK_ALIAS[workKey] || workKey;
    var workMeta = biblio[resolvedId] || biblio[workKey] || null;
    var workTitle = (workMeta && workMeta.title) || 'Œuvre';
    var status = (workMeta && workMeta.status) || 'planned';
    var path = (workMeta && workMeta.path) || '';
    var clickable = status === 'available' && !!path;
    var name = (note.profiles && note.profiles.username) || 'anonyme';
    var rc = (counts && counts[note.id]) || 0;
    var rcTxt = rc > 0 ? (rc + ' réponse' + (rc > 1 ? 's' : '')) : 'aucune réponse';
    var sec = (note.section != null && note.section !== '') ? ('Section ' + note.section) : '';
    var ac = accent(note.section);
    return (
      '<article class="cm-card' + (clickable ? '' : ' cm-card-soon') + '"' +
        (clickable ? ' data-open="' + esc(path) + '" data-note="' + esc(note.id) + '" role="button" tabindex="0"' : '') + '>' +
        '<div class="cm-row">' +
          '<span class="cm-av" style="background:' + ac + '">' + esc(initials(name)) + '</span>' +
          '<span class="cm-name">' + esc(name) + '</span>' +
          (sec ? '<span class="cm-tag">' + esc(sec) + '</span>' : '') +
          '<span class="cm-when">' + esc(ago(note.created)) + '</span>' +
        '</div>' +
        '<div class="cm-work">' + esc(workTitle) + '</div>' +
        (note.quote ? '<div class="cm-quote">« ' + esc(trunc(note.quote, 140)) + ' »</div>' : '') +
        (note.body ? '<div class="cm-body">' + esc(trunc(note.body, 260)) + '</div>' : '') +
        '<div class="cm-foot">' +
          '<span class="cm-rc">' + esc(rcTxt) + '</span>' +
          (clickable ? '<span class="cm-go">Ouvrir →</span>' : '<span class="cm-go cm-go-soon">à venir</span>') +
        '</div>' +
      '</article>'
    );
  }

  function wireCards(container){
    if(!container) return;
    container.querySelectorAll('[data-open]').forEach(function(c){
      // 5b : deep-link au passage. La page d'œuvre lit #note=<id>,
      // résout la ligne public_notes, ouvre la bonne section, puis
      // SHELL.annotations.flashAnchor surligne le passage.
      var go = function(){
        var p = c.getAttribute('data-open');
        if(!p) return;
        var nid = c.getAttribute('data-note');
        location.href = nid ? (p + '#note=' + encodeURIComponent(nid)) : p;
      };
      c.addEventListener('click', go);
      c.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); }
      });
    });
  }

  // Monte le flux dans un conteneur DOM arbitraire.
  // opts.limit   : nombre max de cartes affichées (sinon : tout ce qui
  //                est revenu de fetchData, jusqu'à 200) ;
  // opts.compact : ajoute un lien « Voir toutes les notes → » vers
  //                place-publique.html si fetchData a renvoyé plus de
  //                cartes que la limite.
  async function mount(container, opts){
    if(!container) return;
    opts = opts || {};
    container.innerHTML = '<div class="cm-state">Chargement…</div>';
    var biblio = await loadBiblio();
    var data;
    try { data = await fetchData(); }
    catch(e){
      container.innerHTML = (
        '<div class="cm-state">Notes partagées momentanément indisponibles. ' +
        '<button type="button" class="cm-retry">Réessayer</button></div>'
      );
      var rb = container.querySelector('.cm-retry');
      if(rb) rb.addEventListener('click', function(){ mount(container, opts); });
      return;
    }
    if(!data || data.mode === 'no-client'){
      container.innerHTML = '<div class="cm-state">La Place publique est disponible en ligne, une fois la synchronisation des comptes activée.</div>';
      return;
    }
    if(!data.tops.length){
      container.innerHTML = '<div class="cm-state">Aucune note partagée pour l’instant. Ouvre un chapitre et sois la première personne à annoter un passage.</div>';
      return;
    }
    var tops = opts.limit ? data.tops.slice(0, opts.limit) : data.tops;
    var html = tops.map(function(n){ return cardHtml(n, data.counts, biblio); }).join('');
    if(opts.compact && data.tops.length > tops.length){
      html += '<a class="cm-all" href="/oeuvres/place-publique">Voir toutes les notes →</a>';
    }
    container.innerHTML = html;
    wireCards(container);
  }

  SHELL.commune = { mount: mount };
})();

/* ══════════════════════════════════════════════════════════════════════
   SHELL.mod — modération (mission moderation-5c)

   Le rôle vit dans la table `moderators` (gérée à la main depuis le
   dashboard Supabase — pas d'UI d'administration). RLS ne laisse lire à
   chacun QUE sa propre ligne : le test « suis-je modérateur ? » est donc
   un simple select. `isMod()` est SYNCHRONE (il lit un cache) pour
   pouvoir s'appeler en plein rendu ; le cache est rafraîchi à chaque
   changement de session — en DIFFÉRÉ (setTimeout 0), jamais d'await
   Supabase dans un callback onChange (règle deadlock GoTrue de la
   maison).
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var SHELL = window.SHELL = window.SHELL || {};
  var st = { isMod: false };
  var subs = [];

  function modUid(){
    try { if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch(e){}
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  async function refresh(){
    var was = st.isMod;
    st.isMod = false;
    try {
      var a = SHELL.auth;
      if(a && a.user){
        var c = await a.getClient();
        if(c){
          /* moderators n'a qu'une colonne : id = user_id du modérateur */
          var r = await c.from('moderators').select('id')
            .eq('id', a.user.id).limit(1);
          st.isMod = !!(r.data && r.data.length);
        }
      }
    } catch(e){}
    if(st.isMod !== was) subs.forEach(function(cb){ try{ cb(st.isMod); }catch(e){} });
    return st.isMod;
  }

  SHELL.mod = {
    isMod: function(){ return st.isMod; },
    ensure: refresh,
    /* prévenu quand le statut change (pour re-rendre un panneau ouvert) */
    onChange: function(cb){ if(typeof cb === 'function') subs.push(cb); },

    /* Signaler une note publique. `reports` suit le style de
       public_notes : id text généré ici, created en millisecondes ;
       `reporter_id` est posé par défaut côté base (auth.uid()) — on ne
       l'écrit jamais ici. */
    report: async function(noteId, reason){
      var a = SHELL.auth;
      if(!a || !a.user) return { error: { message: 'non connecté' } };
      var c = await a.getClient();
      if(!c) return { error: { message: 'client indisponible' } };
      return await c.from('reports').insert({
        id: modUid(), note_id: noteId,
        reason: (reason || '').trim() || null, created: Date.now() });
    },

    /* Masquer / rétablir une note (modérateurs seulement — la policy
       pn_update_mod fait foi, le client ne fait que demander). */
    setHidden: async function(noteId, hidden){
      var a = SHELL.auth;
      var c = a ? await a.getClient() : null;
      if(!c) return { error: { message: 'client indisponible' } };
      return await c.from('public_notes')
        .update({ hidden: !!hidden }).eq('id', noteId);
    }
  };

  function arm(){
    if(SHELL.auth && SHELL.auth.onChange){
      SHELL.auth.onChange(function(){ setTimeout(refresh, 0); });
      return true;
    }
    return false;
  }
  /* shell.js définit SHELL.auth plus haut dans ce même fichier, mais on
     se protège d'un ordre de chargement inattendu */
  if(!arm()) document.addEventListener('DOMContentLoaded', arm, { once: true });
})();

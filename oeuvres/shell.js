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
        '<button id="sbToggle" class="sb-toggle" type="button" aria-label="Ouvrir le menu">☰</button>' +
        '<button class="brandmark" type="button" id="shellBrand" aria-label="Lire Marx — revenir à la bibliothèque">Lire<span class="d">.</span>Marx</button>' +
        '<div class="tb-search">' +
          '<span class="tb-search-ic" aria-hidden="true">⌕</span>' +
          '<input id="tbSearch" type="text" autocomplete="off" spellcheck="false" placeholder="Rechercher un concept, une date, un chapitre…" aria-label="Rechercher">' +
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
        '<button class="sb-item sb-disc" type="button" data-act="biblio" aria-expanded="false"><span class="sb-dot" style="background:var(--ink-soft)"></span>Bibliothèque<span class="sb-chev" aria-hidden="true">▸</span></button>' +
        '<div class="sb-sub" id="sbBiblio" hidden>' +
          '<button class="sb-item sb-subitem" type="button" data-act="open-capital"><span class="sb-dot" style="background:var(--gold)"></span>Le Capital — Livre I</button>' +
          '<button class="sb-item sb-subitem" type="button" data-act="open-manuscrits-1844"><span class="sb-dot" style="background:var(--gold)"></span>Manuscrits de 1844</button>' +
          '<button class="sb-item sb-soon sb-subitem" disabled><span class="sb-dot" style="background:var(--gold)"></span>6 en préparation<span class="sb-soon-tag">à venir</span></button>' +
        '</div>' +
        '<button class="sb-item" type="button" data-act="commune"><span class="sb-dot" style="background:var(--red)"></span>Place publique</button>' +
        '<button class="sb-item" type="button" data-act="contacts"><span class="sb-dot" style="background:var(--blue)"></span>Contacts</button>' +
        '<button class="sb-item sb-soon" type="button" disabled><span class="sb-dot" style="background:var(--gold)"></span>Jeux<span class="sb-soon-tag">à venir</span></button>' +
        '<button class="sb-item sb-soon" type="button" disabled><span class="sb-dot" style="background:var(--blue)"></span>À propos<span class="sb-soon-tag">à venir</span></button>' +
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
            '<p><b>Conservation.</b> Tes données sont conservées tant que ton compte existe, et supprimées à ta demande.</p>' +
            '<p><b>Tes droits (RGPD).</b> Accès, rectification, effacement, opposition. Tu peux supprimer toi-même ton compte et l\'ensemble de tes données depuis « Mon compte » → <i>Supprimer mon compte</i> (effacement définitif et immédiat). Pour toute autre demande : [À COMPLÉTER : adresse e-mail].</p>' +
            '<p><b>Stockage local.</b> Le site conserve tes surlignages et ta session de connexion dans ton navigateur. C\'est un stockage <i>fonctionnel</i> (nécessaire au service), sans pistage ni cookie publicitaire.</p>' +
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
      if(window.matchMedia('(max-width:860px)').matches){
        document.body.classList.toggle('sb-open');
      } else {
        document.body.classList.toggle('sb-collapsed');
      }
    });
    bk.addEventListener('click', function(){ document.body.classList.remove('sb-open'); });

    // Brandmark → accueil du site (la bibliothèque oeuvres/index.html)
    document.getElementById('shellBrand').addEventListener('click', function(){ location.href = 'index.html'; });

    // Bibliothèque : ouvre / ferme le sous-menu
    var bib = sb.querySelector('[data-act="biblio"]');
    var bibSub = document.getElementById('sbBiblio');
    bib.addEventListener('click', function(){
      var open = bib.getAttribute('aria-expanded') === 'true';
      bib.setAttribute('aria-expanded', open ? 'false' : 'true');
      bibSub.hidden = open;
    });

    // Items de navigation inter-pages
    sb.querySelectorAll('.sb-item[data-act]').forEach(function(b){
      var act = b.dataset.act;
      if(act === 'biblio' || (act && act.indexOf('tab:') === 0)) return; // déjà gérés
      b.addEventListener('click', function(){
        if(act === 'open-capital'){ location.href = 'capital-1.html'; return; }
        if(act === 'open-manuscrits-1844'){ location.href = 'manuscrits-1844.html'; return; }
        // Place publique : page dédiée (oeuvres/place-publique.html).
        // Plus de modale ni de redirection vers capital-1.html.
        if(act === 'commune'){
          if(window.matchMedia('(max-width:860px)').matches){
            document.body.classList.remove('sb-open');
          }
          location.href = 'place-publique.html';
          return;
        }
        // CGU & règles / Confidentialité : modale RGPD de SHELL.auth.
        if(act === 'cgu'){
          if(window.matchMedia('(max-width:860px)').matches){
            document.body.classList.remove('sb-open');
          }
          if(window.SHELL && window.SHELL.auth && window.SHELL.auth.openPrivacy){
            window.SHELL.auth.openPrivacy();
          }
          return;
        }
        // Contacts : modale messagerie de SHELL.social (shell-social.js).
        if(act === 'contacts'){
          if(window.matchMedia('(max-width:860px)').matches){
            document.body.classList.remove('sb-open');
          }
          if(window.SHELL && window.SHELL.social && window.SHELL.social.showContacts){
            window.SHELL.social.showContacts();
          }
          return;
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
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      // Ferme les autres popovers .tb-pop (sociaux notamment).
      document.querySelectorAll('.tb-pop').forEach(function(p){ if(p !== pop) p.hidden = true; });
      pop.hidden = !pop.hidden;
    });
    pop.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('click', function(){ pop.hidden = true; });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') pop.hidden = true; });
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
      indexPending = fetch('bibliotheque.json', { cache: 'no-cache' })
        .then(function(r){ if(!r.ok) throw new Error('biblio HTTP ' + r.status); return r.json(); })
        .then(function(json){
          var ix = [];
          (json.works || []).forEach(function(w){
            if(!w || !w.id) return;
            var path = String(w.path || '');
            if(path.indexOf('oeuvres/') === 0) path = path.slice('oeuvres/'.length);
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

    function close(){ box.hidden = true; }

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
          return;
        }
        box.innerHTML = '';
        hits.forEach(function(e){
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'tb-res';
          b.setAttribute('role', 'option');
          b.innerHTML = '<span class="tb-res-main"><span class="tb-res-t">' + esc(e.t) + '</span><span class="tb-res-s">' + esc(e.s) + '</span></span><span class="tb-res-cat tb-cat-' + e.cat + '">' + esc(e.lab) + '</span>';
          b.addEventListener('mousedown', function(ev){ ev.preventDefault(); });
          b.addEventListener('click', function(){ inp.value = ''; close(); try { e.act(); } catch(x){} });
          box.appendChild(b);
        });
        box.hidden = false;
      });
    }

    inp.addEventListener('input', function(){ render(inp.value); });
    inp.addEventListener('focus', function(){ if(inp.value) render(inp.value); });
    inp.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ close(); inp.blur(); } });
    document.addEventListener('click', function(e){
      var w = document.querySelector('.tb-search');
      if(w && !w.contains(e.target)) close();
    });
  }

  window.installShell = function(cfg){
    cfg = cfg || {};
    var body = document.body;
    body.prepend(buildTopbar());
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
  function openModal(){
    if(!modalEl) modalEl = document.getElementById('acctModal');
    if(!modalEl) return;
    // Reset busy/err/notice à chaque ouverture pour éviter qu'un état
    // bloqué d'une tentative précédente laisse le bouton "..." figé.
    view.busy = false; view.err = ''; view.notice = '';
    renderModal();
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    if(!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
  }
  function openPrivacy(){
    if(!privacyEl) privacyEl = document.getElementById('privacyModal');
    if(!privacyEl) return;
    privacyEl.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closePrivacy(){
    if(!privacyEl) return;
    privacyEl.hidden = true;
    if(!modalEl || modalEl.hidden) document.body.style.overflow = '';
  }

  // ----- flows Supabase --------------------------------------------------
  var view = { authMode:'signin', recovery:false, busy:false, notice:'', err:'', pendingUsername:'', eraseConfirm:false };

  async function signIn(email, password){
    var c = await getClient(); if(!c) return { ok:false, msg:'Compte non configuré.' };
    view.busy = true; view.err = ''; view.notice = ''; renderModal();
    try {
      var r = await c.auth.signInWithPassword({ email: email, password: password });
      if(r.error) throw r.error;
      return { ok:true };
    } catch(e){
      view.err = (e && e.message) || 'Échec de la connexion.';
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
      view.err = (e && e.message) || 'Échec de l\'inscription.';
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
      view.err = (e && e.message) || 'Échec.';
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
      view.err = (e && e.message) || 'Échec.';
      return { ok:false, msg: view.err };
    } finally {
      view.busy = false; renderModal();
    }
  }

  // ----- rendu de la modale ---------------------------------------------
  function setLoggedInRenderer(fn){ loggedInRenderer = fn; if(modalEl && !modalEl.hidden) renderModal(); }

  function renderModal(){
    if(!modalEl) modalEl = document.getElementById('acctModal');
    if(!modalEl) return;
    var slot = modalEl.querySelector('#acctView');
    if(!slot) return;
    var err = view.err ? '<div class="ac-err">' + esc(view.err) + '</div>' : '';
    var ok  = view.notice ? '<div class="ac-ok">' + esc(view.notice) + '</div>' : '';

    // "Compte non configuré" ne doit s'afficher QUE si getClient a tourné
    // ET a réellement échoué (configured === false). Si configured est null
    // (init Supabase pas encore lancé ou en cours), on laisse passer pour
    // afficher la vue invité — le bootstrap re-rendra dès qu'il a fini.
    if(configured === false){
      slot.innerHTML = '<div class="ac-card"><h3>Compte non configuré</h3><p class="ac-p">La synchronisation par compte n’est pas branchée : il reste à renseigner les clés Supabase dans <code>config.js</code> à la racine. En attendant, le site reste 100 % local.</p></div>';
      return;
    }
    if(view.recovery){
      slot.innerHTML = '<div class="ac-card"><h3>Choisir un nouveau mot de passe</h3>' + err + ok
        + '<input type="password" id="acNew" placeholder="nouveau mot de passe (6 caractères min.)" autocomplete="new-password">'
        + '<div class="ac-row"><button class="btn red" data-act="setpw" type="button"' + (view.busy ? ' disabled' : '') + '>Enregistrer</button></div></div>';
      wireModalActions(slot);
      return;
    }
    if(state.user){
      if(loggedInRenderer){
        try { loggedInRenderer(slot, { user: state.user, profile: state.profile, view: view, esc: esc, avaHtml: avaHtml }); }
        catch(e){ slot.innerHTML = '<div class="ac-card"><h3>Mon compte</h3>' + err + ok + '<p class="ac-p">Erreur de rendu.</p></div>'; }
      } else {
        // Rendu Mon compte unifié — identique sur Capital, Manuscrits,
        // bibliothèque, etc. : pseudo + avatar + description + déconnexion +
        // suppression de compte. Toutes les pages partagent la même
        // expérience d'auth.
        var p = state.profile, u = state.user;
        var pseudo = (p && p.username) || '';
        var bio = (p && p.bio) || '';
        slot.innerHTML = '<div class="ac-card"><h3>Mon compte</h3>' + err + ok
          + '<div class="ac-id"><span class="ac-ava">' + avaHtml(pseudo || u.email, p && p.avatar_url) + '</span><div><div class="ac-pseudo">' + (pseudo ? esc(pseudo) : '<i>sans pseudo</i>') + '</div><div class="ac-mail">' + esc(u.email || '') + '</div></div></div>'
          + '<label class="ac-lab">Pseudo public</label>'
          + '<div class="ac-row"><input type="text" id="acUser" value="' + esc(pseudo) + '" placeholder="ton-pseudo" maxlength="24"><button class="btn" data-act="saveuser" type="button">Enregistrer</button></div>'
          + '<p class="ac-note">Ce pseudo apparaîtra à côté de tes notes publiques ; ton e-mail, jamais.</p>'
          + '<label class="ac-lab">Photo de profil</label>'
          + '<div class="ac-avarow"><span class="ac-ava ac-ava-edit">' + avaHtml(pseudo || u.email, p && p.avatar_url) + '</span>'
          + '<div class="ac-avabtns"><input type="file" id="acAvaFile" accept="image/*" style="display:none">'
          + '<button class="btn" data-act="ava-pick" type="button"' + (view.busy ? ' disabled' : '') + '>Choisir une image…</button>'
          + ((p && p.avatar_url) ? '<button class="lk" data-act="ava-clear" type="button">Retirer la photo</button>' : '') + '</div></div>'
          + '<label class="ac-lab">Description</label>'
          + '<textarea id="acBio" class="ac-bio" maxlength="280" placeholder="Quelques mots sur toi (280 caractères max).">' + esc(bio) + '</textarea>'
          + '<div class="ac-row"><button class="btn red" data-act="savemeta" type="button">Enregistrer le profil</button></div>'
          + (view.eraseConfirm
              ? '<div class="ac-danger"><b>Supprimer définitivement ton compte ?</b> Cela efface ton compte et toutes tes données — annotations privées, notes et réponses publiques, pseudo, signalements. Tu seras déconnecté et ne pourras plus te reconnecter. Action irréversible.<div class="ac-row" style="margin-top:8px"><button class="btn red" data-act="erase-yes" type="button"' + (view.busy ? ' disabled' : '') + '>' + (view.busy ? 'Suppression…' : 'Oui, supprimer mon compte') + '</button><button class="lk" data-act="erase-no" type="button">Annuler</button></div></div>'
              : '')
          + '<div class="ac-row ac-end"><button class="lk" data-act="signout" type="button">Se déconnecter</button><button class="lk ac-del" data-act="erase" type="button">Supprimer mon compte</button></div>'
          + '<div class="ac-foot"><button class="lk" data-act="privacy" type="button">Confidentialité &amp; données</button></div></div>';
      }
      wireModalActions(slot);
      return;
    }

    // Vue invité (login / inscription)
    var signup = view.authMode === 'signup';
    slot.innerHTML = '<div class="ac-card"><div class="ac-tabs">'
      + '<button class="ac-t' + (signup ? '' : ' on') + '" data-act="mode-signin" type="button">Se connecter</button>'
      + '<button class="ac-t' + (signup ? ' on' : '') + '" data-act="mode-signup" type="button">Créer un compte</button></div>' + err + ok
      + '<input type="email" id="acEmail" placeholder="adresse e-mail" autocomplete="email">'
      + (signup ? '<input type="text" id="acUser" placeholder="pseudo public (2 à 24 caractères)" maxlength="24">' : '')
      + '<input type="password" id="acPw" placeholder="mot de passe" autocomplete="' + (signup ? 'new-password' : 'current-password') + '">'
      + '<div class="ac-row"><button class="btn red" data-act="' + (signup ? 'do-signup' : 'do-signin') + '" type="button"' + (view.busy ? ' disabled' : '') + '>' + (view.busy ? '…' : (signup ? 'Créer mon compte' : 'Se connecter')) + '</button>'
      + (signup ? '' : '<button class="lk" data-act="reset" type="button">Mot de passe oublié ?</button>') + '</div>'
      + '<p class="ac-note">' + (signup ? 'Tu choisis un pseudo public et un mot de passe ; ton adresse e-mail reste privée.' : 'Retrouve et synchronise tes annotations sur tous tes appareils.') + '</p>'
      + '<div class="ac-foot"><button class="lk" data-act="privacy" type="button">Confidentialité &amp; données</button></div></div>';
    wireModalActions(slot);
  }
  function field(el, id){ var x = el.querySelector('#' + id); return x ? x.value : ''; }
  function wireModalActions(slot){
    slot.querySelectorAll('[data-act]').forEach(function(b){
      b.onclick = function(){
        var a = b.dataset.act;
        if(a === 'mode-signin'){ view.authMode = 'signin'; view.err = ''; view.notice = ''; renderModal(); }
        else if(a === 'mode-signup'){ view.authMode = 'signup'; view.err = ''; view.notice = ''; renderModal(); }
        else if(a === 'do-signin'){ signIn(field(slot,'acEmail').trim(), field(slot,'acPw')); }
        else if(a === 'do-signup'){ signUp(field(slot,'acEmail').trim(), field(slot,'acPw'), field(slot,'acUser').trim()); }
        else if(a === 'reset'){ var em = field(slot,'acEmail').trim(); if(!em){ view.err = 'Indique d\'abord ton adresse e-mail.'; renderModal(); } else resetPassword(em); }
        else if(a === 'setpw'){ updatePassword(field(slot,'acNew')); }
        else if(a === 'signout'){ signOut(); }
        else if(a === 'privacy'){ openPrivacy(); }
        else if(a === 'saveuser'){
          var name = field(slot,'acUser').trim();
          view.err = ''; view.notice = '';
          saveUsername(name).then(function(r){
            if(r.ok){ view.notice = 'Pseudo enregistré.'; renderChip(); }
            else { view.err = r.msg || 'Échec.'; }
            renderModal();
          });
        }
        else if(a === 'savemeta'){
          view.err = ''; view.notice = '';
          saveProfileMeta(field(slot,'acBio'), undefined).then(function(r){
            if(r.ok){ view.notice = 'Profil enregistré.'; renderChip(); }
            else { view.err = r.msg || 'Échec.'; }
            renderModal();
          });
        }
        else if(a === 'ava-pick'){
          var fi = slot.querySelector('#acAvaFile');
          if(fi) fi.click();
        }
        else if(a === 'ava-clear'){
          view.err = ''; view.notice = '';
          saveProfileMeta(undefined, '').then(function(r){
            if(r.ok){ view.notice = 'Photo retirée.'; renderChip(); }
            else { view.err = r.msg || 'Échec.'; }
            renderModal();
          });
        }
        else if(a === 'erase'){ view.eraseConfirm = true; renderModal(); }
        else if(a === 'erase-no'){ view.eraseConfirm = false; renderModal(); }
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
    // Câbler le file input pour avatar
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
      if(!state.user) setProfile(null);
      // rendu immédiat (pas de requête Supabase ici)
      emit();
      renderChip();
      if(modalEl && !modalEl.hidden) renderModal();
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
        var r = await fetch('bibliotheque.json', { cache: 'no-cache' });
        if(!r.ok) throw new Error('biblio HTTP ' + r.status);
        var json = await r.json();
        var map = {};
        (json.works || []).forEach(function(w){
          if(!w || !w.id) return;
          // Les pages d'œuvres vivent dans /oeuvres/ ; on retire le
          // préfixe 'oeuvres/' pour pouvoir naviguer relativement
          // depuis n'importe quelle page du dossier.
          var path = String(w.path || '');
          if(path.indexOf('oeuvres/') === 0) path = path.slice('oeuvres/'.length);
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
      html += '<a class="cm-all" href="place-publique.html">Voir toutes les notes →</a>';
    }
    container.innerHTML = html;
    wireCards(container);
  }

  SHELL.commune = { mount: mount };
})();

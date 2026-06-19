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
  // Page principale qui héberge encore la coquille applicative complète :
  // c'est là qu'on redirige pour les fonctionnalités pas encore extraites
  // (compte, forum, recherche, etc.).
  var SHELL_HOST = 'capital-1.html';

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

  function buildPrivacyModal(){
    return el(
      '<div id="privacyModal" class="acct-modal" hidden>' +
        '<div class="acct-modal-box" role="dialog" aria-modal="true" aria-label="Confidentialité">' +
          '<button class="acct-modal-x" type="button" aria-label="Fermer">&times;</button>' +
          '<div class="ac-card privacy-text">' +
            '<h3>Confidentialité &amp; données</h3>' +
            '<p class="pz-warn">Modèle de départ, à relire et compléter ; ce n\'est pas un conseil juridique.</p>' +
            '<p>Avis de confidentialité abrégé. Pour la fonction « Supprimer mes données » et la version complète, ouvre Mon compte sur la page de l\'atelier du Capital où la gestion complète du profil est disponible.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Quelques boutons renvoient vers la page hôte tant que la coquille
  // applicative (auth, forum, recherche, etc.) n'y est pas factorisée.
  function gotoHost(hash){
    location.href = SHELL_HOST + (hash || '');
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
        if(act === 'commune' || act === 'contacts' || act === 'cgu'){
          gotoHost('#' + act);
          return;
        }
      });
    });

    // sb-work : aiguillage vers les onglets de l'œuvre courante
    sb.querySelectorAll('.sb-item[data-act^="tab:"]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.act.slice(4);
        if(typeof window.activateTab === 'function'){
          window.activateTab(id);
          if(window.matchMedia('(max-width:860px)').matches){
            document.body.classList.remove('sb-open');
          }
        } else {
          gotoHost();
        }
      });
    });

    // Boutons qui dépendent encore de la coquille hébergée par capital-1.html
    // (acctChip est désormais géré par SHELL.auth si Supabase est configuré).
    var hostBtns = ['supportBtn','msgBtn','notifBtn'];
    hostBtns.forEach(function(id){
      var b = document.getElementById(id);
      if(b) b.addEventListener('click', function(){ gotoHost(); });
    });

    // Recherche : pour l'instant, l'index vit dans capital-1.html.
    var search = document.getElementById('tbSearch');
    if(search){
      search.addEventListener('focus', function(){ gotoHost(); });
    }
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
  var view = { authMode:'signin', recovery:false, busy:false, notice:'', err:'', pendingUsername:'' };

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

    if(!isConfigured()){
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
        // Rendu par défaut (Manuscrits, bibliothèque) : pseudo éditable +
        // déconnexion. Pas de redirection vers Capital — l'utilisateur
        // peut gérer son pseudo et se déconnecter directement ici.
        var p = state.profile, u = state.user;
        var pseudo = (p && p.username) || '';
        slot.innerHTML = '<div class="ac-card"><h3>Mon compte</h3>' + err + ok
          + '<div class="ac-id"><span class="ac-ava">' + avaHtml(pseudo || u.email, p && p.avatar_url) + '</span><div><div class="ac-pseudo">' + (pseudo ? esc(pseudo) : '<i>sans pseudo</i>') + '</div><div class="ac-mail">' + esc(u.email || '') + '</div></div></div>'
          + '<label class="ac-lab">Pseudo public</label>'
          + '<div class="ac-row"><input type="text" id="acUser" value="' + esc(pseudo) + '" placeholder="ton-pseudo" maxlength="24"><button class="btn red" data-act="saveuser" type="button">Enregistrer</button></div>'
          + '<p class="ac-note">Ce pseudo apparaîtra à côté de tes notes publiques ; ton e-mail, jamais.</p>'
          + '<div class="ac-row ac-end"><button class="lk" data-act="signout" type="button">Se déconnecter</button></div>'
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
        // Les autres data-act (savemeta, ava-pick, etc.) sont gérés par le
        // rendu logged-in fourni par la page (Capital).
      };
    });
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
  async function bootstrap(){
    var c = await getClient();
    if(!c){ renderChip(); renderModal(); return; }
    c.auth.onAuthStateChange(async function(ev, session){
      if(ev === 'PASSWORD_RECOVERY'){ view.recovery = true; openModal(); }
      setUser((session && session.user) || null);
      if(state.user) await loadProfile(); else setProfile(null);
      emit();
      renderChip();
      if(modalEl && !modalEl.hidden) renderModal();
    });
    var r = await c.auth.getSession();
    setUser((r.data && r.data.session && r.data.session.user) || null);
    if(state.user) await loadProfile();
    emit();
    renderChip();
    renderModal();
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
})();

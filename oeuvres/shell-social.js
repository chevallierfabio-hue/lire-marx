// Shell partagé Lire Marx — module social (sous-mission 4a : messagerie).
//
// SHELL.social fournit la messagerie privée (contacts + DM + popover
// msgBtn + modale Contacts + realtime des direct_messages) à toutes
// les pages qui chargent shell-social.js après shell.js. Capital-1.html
// continue d'inliner son propre module social et n'est pas concerné par
// ce fichier.
//
// Branchement par les pages :
//   <script src="shell.js"></script>
//   <script src="shell-social.js"></script>
//   <script>installShell({...});</script>
//
// installShell() (dans shell.js) appelle SHELL.social._init() après
// SHELL.auth._bootstrap(), sur le même motif que SHELL.auth.
//
// Notifications (réponses & mentions) + bouton notifBtn : ajoutés par
// la sous-mission 4b dans ce même fichier — pour l'instant, notifBtn
// reste géré par gotoHost() côté shell.js.
//
// Profil membre cliquable + saut précis dans la liseuse : différés à
// la mission annotations (contrat de deep-link commun avec
// SHELL.commune). Le bouton « Voir le profil » est masqué dans cette
// version de la modale Contacts.

(function(){
  var SHELL = window.SHELL = window.SHELL || {};
  if(SHELL.social) return;

  // ----- état partagé du module -----
  var sb = null;                 // client Supabase (via SHELL.auth.getClient)
  var user = null;               // session utilisateur
  var profile = null;            // profil public (username, avatar_url, bio)
  var socContacts = [];          // [{id, username, avatar, last:{body,created}}]
  var socConvo = null;           // {id, username} ou null
  var socMsgs = [];              // messages de la conversation ouverte
  var socUnreadBy = {};          // {sender_id: count}
  var dmChannel = null;          // canal realtime supabase
  var socPoll = null;            // setInterval de secours
  var msgPop = null;             // popover #msgBtn (.tb-pop.msg-pop)
  var modalEl = null;            // #contactsModal
  var bodyEl = null;             // corps scrollable de la modale
  var initialized = false;
  var rtNotifT = null;           // timer debounce notifications (4b)
  var rtPubT = null;             // timer debounce flux public (4b)

  // ----- helpers HTML -----
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  var escapeHtml = esc;

  function pcAgo(ts){
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

  function uid(){
    try { if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch(e){}
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function avaInit(name){
    var s = String(name || '?').replace(/[^A-Za-zÀ-ÿ0-9]/g, '').slice(0, 2).toUpperCase();
    return s || '?';
  }
  function avaHtml(name, url){
    var ini = esc(avaInit(name));
    if(url) return '<img class="ava-img" src="' + esc(url) + '" alt="">' + ini;
    return ini;
  }
  function avatarOf(id){
    for(var i = 0; i < socContacts.length; i++){
      if(socContacts[i].id === id) return socContacts[i].avatar || '';
    }
    return '';
  }

  function socClosePops(except){
    document.querySelectorAll('.tb-pop').forEach(function(p){ if(p !== except) p.hidden = true; });
  }
  function socReady(){
    return !!(sb && user && profile && profile.username);
  }
  function modalVisible(){
    return !!(modalEl && !modalEl.hidden);
  }

  // ----- toast flottant -----
  var toastT = null;
  function toast(msg){
    var t = document.getElementById('lmToast');
    if(!t){ t = document.createElement('div'); t.id = 'lmToast'; t.className = 'lm-toast'; document.body.appendChild(t); }
    t.textContent = String(msg || '');
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function(){ t.classList.remove('on'); }, 3800);
  }

  // ----- modale Contacts -----
  function ensureModal(){
    if(modalEl) return modalEl;
    modalEl = document.getElementById('contactsModal');
    if(modalEl){ bodyEl = modalEl.querySelector('#contactsBody'); return modalEl; }
    var el = document.createElement('div');
    el.id = 'contactsModal';
    el.className = 'ct-modal';
    el.hidden = true;
    el.innerHTML = ''
      + '<div class="ct-modal-box" role="dialog" aria-modal="true" aria-label="Contacts">'
      +   '<button class="ct-modal-x" type="button" aria-label="Fermer">&times;</button>'
      +   '<div class="ct-modal-body" id="contactsBody"></div>'
      + '</div>';
    document.body.appendChild(el);
    modalEl = el;
    bodyEl = el.querySelector('#contactsBody');
    el.addEventListener('click', function(e){ if(e.target === el) closeContacts(); });
    el.querySelector('.ct-modal-x').addEventListener('click', closeContacts);
    return modalEl;
  }

  function showContacts(){
    ensureModal();
    socConvo = null;
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
    renderContactsPage();
    loadContacts().then(function(){ if(!socConvo) renderContactsPage(); });
    refreshDM();
    if(window.matchMedia('(max-width:860px)').matches){
      document.body.classList.remove('sb-open');
    }
  }
  function closeContacts(){
    if(!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
  }

  // ----- ouverture de la modale Mon compte (passerelle vers SHELL.auth) -----
  function openAcctModal(){
    if(SHELL.auth && SHELL.auth.openModal) SHELL.auth.openModal();
  }

  // ----- données : contacts + messagerie -----
  async function loadContacts(){
    if(!sb || !user){ socContacts = []; return; }
    try {
      var ids = {};
      var c = await sb.from('contacts').select('contact_id').eq('user_id', user.id);
      (c.data || []).forEach(function(r){ if(r.contact_id) ids[r.contact_id] = 1; });
      var dm = await sb.from('direct_messages').select('sender_id,recipient_id,body,created')
        .or('sender_id.eq.' + user.id + ',recipient_id.eq.' + user.id)
        .order('created', { ascending: false }).limit(300);
      var last = {};
      (dm.data || []).forEach(function(m){
        var other = (m.sender_id === user.id) ? m.recipient_id : m.sender_id;
        if(!other) return;
        ids[other] = 1;
        if(!last[other]) last[other] = { body: m.body, created: +m.created };
      });
      var idList = Object.keys(ids), names = {}, avas = {};
      if(idList.length){
        var pr = await sb.from('profiles').select('*').in('id', idList);
        (pr.data || []).forEach(function(p){ names[p.id] = p.username; avas[p.id] = p.avatar_url || ''; });
      }
      socContacts = idList.map(function(id){
        return { id: id, username: names[id] || '(compte supprimé)', avatar: avas[id] || '', last: last[id] || null };
      });
      socContacts.sort(function(a, b){
        var ta = (a.last && a.last.created) || 0, tb = (b.last && b.last.created) || 0;
        return tb - ta || a.username.localeCompare(b.username);
      });
    } catch(e){ /* silencieux */ }
  }

  async function refreshDM(){
    if(!sb || !user){ socUnreadBy = {}; updateMsgDot(); return; }
    try {
      var res = await sb.from('direct_messages').select('sender_id')
        .eq('recipient_id', user.id).is('read_at', null);
      socUnreadBy = {};
      (res.data || []).forEach(function(r){ socUnreadBy[r.sender_id] = (socUnreadBy[r.sender_id] || 0) + 1; });
    } catch(e){}
    updateMsgDot();
    if(msgPop && !msgPop.hidden && !socConvo) renderMsgPop();
    if(modalVisible() && !socConvo) renderContactsPage();
  }

  function updateMsgDot(){
    var d = document.getElementById('msgDot');
    if(!d) return;
    var n = 0;
    Object.keys(socUnreadBy).forEach(function(k){ n += socUnreadBy[k]; });
    d.style.display = n > 0 ? 'block' : 'none';
  }

  async function addContact(name, surface){
    if(!socReady()){ toast('Choisis d\'abord un pseudo (Mon compte).'); return; }
    name = (name || '').trim();
    if(name.charAt(0) === '@') name = name.slice(1);
    if(!name) return;
    if(name.toLowerCase() === String(profile.username || '').toLowerCase()){ toast('C\'est toi !'); return; }
    try {
      var pr = await sb.from('profiles').select('id,username').eq('username', name).maybeSingle();
      if(pr.error || !pr.data){ toast('Aucun membre nommé « ' + name + ' ».'); return; }
      var res = await sb.from('contacts').upsert({ user_id: user.id, contact_id: pr.data.id });
      if(res.error){ toast('Contact : ' + res.error.message); return; }
      toast(pr.data.username + ' ajouté à tes contacts.');
      await loadContacts();
      if(surface === 'page') renderContactsPage(); else renderMsgPop();
    } catch(e){ toast('Contact : ' + ((e && e.message) || e)); }
  }

  async function loadConvo(){
    if(!sb || !user || !socConvo) return;
    var me = user.id, them = socConvo.id;
    try {
      var res = await sb.from('direct_messages').select('*')
        .or('and(sender_id.eq.' + me + ',recipient_id.eq.' + them + '),and(sender_id.eq.' + them + ',recipient_id.eq.' + me + ')')
        .order('created', { ascending: true }).limit(500);
      socMsgs = res.data || [];
      // marquer lus en arrière-plan (HORS verrou auth — refreshDM rafraîchira la pastille)
      sb.from('direct_messages').update({ read_at: Date.now() })
        .eq('recipient_id', me).eq('sender_id', them).is('read_at', null)
        .then(function(){ refreshDM(); });
    } catch(e){}
  }

  async function sendMsg(text, surface){
    if(!sb || !user || !socConvo) return;
    text = (text || '').trim();
    if(!text) return;
    var row = { id: uid(), sender_id: user.id, recipient_id: socConvo.id, body: text, created: Date.now(), read_at: null };
    try {
      var res = await sb.from('direct_messages').insert(row);
      if(res.error){ toast('Envoi : ' + res.error.message); return; }
      socMsgs.push(row);
      if(surface === 'page') renderContactsPage(); else renderMsgPop();
    } catch(e){ toast('Envoi : ' + ((e && e.message) || e)); }
  }

  async function openConvo(id, uname, surface){
    socConvo = { id: id, username: uname };
    socMsgs = [];
    if(surface === 'page') renderContactsPage(); else renderMsgPop();
    await loadConvo();
    if(surface === 'page') renderContactsPage(); else renderMsgPop();
  }

  // ----- rendu : popover msgPop -----
  function bubblesHtml(){
    var me = user ? user.id : null, h = '';
    if(!socMsgs.length) h += '<div class="msg-empty">Aucun message. Écris le premier !</div>';
    else socMsgs.forEach(function(m){
      var mine = m.sender_id === me;
      h += '<div class="msg-b ' + (mine ? 'me' : 'them') + '">' + esc(m.body)
        + '<span class="msg-b-t">' + esc(pcAgo(+m.created)) + '</span></div>';
    });
    return h;
  }
  function contactListHtml(activeId){
    if(!socContacts.length) return '<div class="msg-empty">Aucune conversation. Ajoute un contact par son pseudo.</div>';
    var h = '';
    socContacts.forEach(function(c, i){
      var ub = socUnreadBy[c.id] || 0;
      h += '<button class="msg-ct' + (activeId === c.id ? ' on' : '') + '" data-ci="' + i + '" type="button">'
        + '<span class="msg-ava">' + avaHtml(c.username, c.avatar) + '</span>'
        + '<span class="msg-ct-main"><span class="msg-ct-name">' + esc(c.username) + '</span>'
        + '<span class="msg-ct-prev">' + (c.last ? esc(String(c.last.body || '').slice(0, 60)) : 'Démarrer la conversation') + '</span></span>'
        + (ub > 0 ? '<span class="msg-badge">' + ub + '</span>' : '')
        + '</button>';
    });
    return h;
  }

  function renderMsgPop(){
    if(!msgPop) return;
    var configured = SHELL.auth && SHELL.auth.isConfigured && SHELL.auth.isConfigured();
    if(!configured){
      msgPop.innerHTML = '<div class="tb-pop-h">Messages</div><div class="msg-state">Indisponible (compte non configuré).</div>';
      return;
    }
    if(!user){
      msgPop.innerHTML = '<div class="tb-pop-h">Messages</div><div class="msg-state">Connecte-toi pour échanger des messages privés.</div><a class="tb-pop-cta" data-soc="login" href="#">Se connecter</a>';
      var lb = msgPop.querySelector('[data-soc="login"]');
      if(lb) lb.onclick = function(e){ e.preventDefault(); socClosePops(null); openAcctModal(); };
      return;
    }
    if(!(profile && profile.username)){
      msgPop.innerHTML = '<div class="tb-pop-h">Messages</div><div class="msg-state">Choisis un pseudo (Mon compte) pour la messagerie.</div>';
      return;
    }
    var h;
    if(socConvo){
      h = '<div class="msg-head"><button class="msg-back" data-back="1" type="button" aria-label="Retour">‹</button><h3>' + esc(socConvo.username) + '</h3></div>'
        + '<div class="msg-thread" id="popThread">' + bubblesHtml() + '</div>'
        + '<div class="msg-compose"><textarea id="popIn" placeholder="Ton message…"></textarea><button class="btn red" data-send="1" type="button">Envoyer</button></div>';
    } else {
      h = '<div class="tb-pop-h">Messages</div>'
        + '<div class="msg-add"><input id="popAddIn" type="text" autocomplete="off" placeholder="Ajouter (pseudo)…" /><button class="btn red" data-add="1" type="button">+</button></div>'
        + '<div class="msg-list">' + contactListHtml(null) + '</div>'
        + '<button class="msg-poplink" data-full="1" type="button">Ouvrir la page Contacts →</button>';
    }
    msgPop.innerHTML = h;
    var th = msgPop.querySelector('#popThread'); if(th) th.scrollTop = th.scrollHeight;
    var back = msgPop.querySelector('[data-back]');
    if(back) back.onclick = function(){ socConvo = null; loadContacts().then(renderMsgPop); renderMsgPop(); };
    var addIn = msgPop.querySelector('#popAddIn'), addB = msgPop.querySelector('[data-add]');
    if(addB) addB.onclick = function(){ addContact(addIn ? addIn.value : '', 'pop'); if(addIn) addIn.value = ''; };
    if(addIn) addIn.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); addContact(addIn.value, 'pop'); addIn.value = ''; } };
    msgPop.querySelectorAll('[data-ci]').forEach(function(b){
      b.onclick = function(){ var c = socContacts[+b.dataset.ci]; if(c) openConvo(c.id, c.username, 'pop'); };
    });
    var ta = msgPop.querySelector('#popIn'), sd = msgPop.querySelector('[data-send]');
    function go(){ var v = ta ? ta.value : ''; if(ta) ta.value = ''; sendMsg(v, 'pop'); }
    if(sd) sd.onclick = go;
    if(ta) ta.onkeydown = function(e){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); go(); } };
    var fl = msgPop.querySelector('[data-full]');
    if(fl) fl.onclick = function(){ socClosePops(null); showContacts(); };
  }

  // ----- rendu : modale Contacts -----
  function renderContactsPage(){
    if(!bodyEl){ ensureModal(); }
    if(!bodyEl) return;
    var configured = SHELL.auth && SHELL.auth.isConfigured && SHELL.auth.isConfigured();
    var head = '<div class="cv-head">Contacts</div><div class="cv-sub">Tes conversations privées et les membres de l\'atelier.</div>';
    if(!configured){
      bodyEl.innerHTML = head + '<div class="cv-pane"><div class="cv-ph">La messagerie sera disponible une fois la synchronisation des comptes activée (sur le site en ligne).</div></div>';
      return;
    }
    if(!user){
      bodyEl.innerHTML = head + '<div class="cv-pane"><div class="cv-ph">Connecte-toi pour voir tes contacts et tes messages.<br><br><button class="btn red" data-soc="login" type="button">Se connecter</button></div></div>';
      var lb = bodyEl.querySelector('[data-soc="login"]');
      if(lb) lb.onclick = function(){ openAcctModal(); };
      return;
    }
    if(!(profile && profile.username)){
      bodyEl.innerHTML = head + '<div class="cv-pane"><div class="cv-ph">Choisis un pseudo (Mon compte) pour utiliser la messagerie.</div></div>';
      return;
    }
    var left = '<div class="cv-pane cv-left"><div class="msg-add"><input id="cvAddIn" type="text" autocomplete="off" placeholder="Ajouter un contact (pseudo)…" /><button class="btn red" id="cvAddBtn" type="button">Ajouter</button></div>'
      + '<div class="msg-list" id="cvList">' + contactListHtml(socConvo && socConvo.id) + '</div></div>';
    var right;
    if(socConvo){
      // Le bouton « Voir le profil » est masqué tant que la mission
      // annotations n'a pas livré le profil membre + deep-link.
      right = '<div class="cv-pane cv-right"><div class="cv-rowbtns">'
        + '<span class="msg-ava" style="width:30px;height:30px;font-size:.8rem">' + avaHtml(socConvo.username, avatarOf(socConvo.id)) + '</span>'
        + '<h3 class="cv-conv-h">' + esc(socConvo.username) + '</h3></div>'
        + '<div class="msg-thread" id="cvThread">' + bubblesHtml() + '</div>'
        + '<div class="msg-compose"><textarea id="cvIn" placeholder="Ton message…"></textarea><button class="btn red" id="cvSend" type="button">Envoyer</button></div></div>';
    } else {
      right = '<div class="cv-pane cv-right"><div class="cv-ph">Choisis une conversation à gauche, ou ajoute un contact pour commencer à discuter.</div></div>';
    }
    bodyEl.innerHTML = head + '<div class="cv-grid">' + left + right + '</div>';
    var addIn = bodyEl.querySelector('#cvAddIn'), addB = bodyEl.querySelector('#cvAddBtn');
    if(addB) addB.onclick = function(){ addContact(addIn ? addIn.value : '', 'page'); if(addIn) addIn.value = ''; };
    if(addIn) addIn.onkeydown = function(ev){ if(ev.key === 'Enter'){ ev.preventDefault(); addContact(addIn.value, 'page'); addIn.value = ''; } };
    bodyEl.querySelectorAll('[data-ci]').forEach(function(b){
      b.onclick = function(){ var c = socContacts[+b.dataset.ci]; if(c) openConvo(c.id, c.username, 'page'); };
    });
    var th = bodyEl.querySelector('#cvThread'); if(th) th.scrollTop = th.scrollHeight;
    var ta = bodyEl.querySelector('#cvIn'), sd = bodyEl.querySelector('#cvSend');
    function go(){ var v = ta ? ta.value : ''; if(ta) ta.value = ''; sendMsg(v, 'page'); }
    if(sd) sd.onclick = go;
    if(ta) ta.onkeydown = function(ev){ if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); go(); } };
  }

  // ----- realtime -----
  function onIncomingDM(row){
    if(!row || !user) return;
    var convOpen = socConvo && row.sender_id === socConvo.id && ((msgPop && !msgPop.hidden) || modalVisible());
    if(convOpen){
      var dup = false;
      for(var i = 0; i < socMsgs.length; i++){ if(socMsgs[i].id === row.id){ dup = true; break; } }
      if(!dup) socMsgs.push(row);
      try {
        sb.from('direct_messages').update({ read_at: Date.now() }).eq('id', row.id)
          .then(function(){ refreshDM(); });
      } catch(e){}
      if(msgPop && !msgPop.hidden) renderMsgPop();
      if(modalVisible()) renderContactsPage();
    } else {
      var nm = '';
      for(var j = 0; j < socContacts.length; j++){ if(socContacts[j].id === row.sender_id){ nm = socContacts[j].username; break; } }
      try { toast('Nouveau message' + (nm ? (' de ' + nm) : '') + '.'); } catch(e){}
      loadContacts().then(function(){
        if(msgPop && !msgPop.hidden && !socConvo) renderMsgPop();
        if(modalVisible() && !socConvo) renderContactsPage();
      });
      refreshDM();
    }
  }

  function ensureRealtime(){
    if(!sb || !user || dmChannel || !sb.channel) return;
    try {
      dmChannel = sb.channel('lm-' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: 'recipient_id=eq.' + user.id }, function(payload){
          onIncomingDM(payload && payload.new);
        })
        .subscribe();
    } catch(e){ dmChannel = null; }
  }
  function teardownRealtime(){
    try { if(dmChannel && sb && sb.removeChannel) sb.removeChannel(dmChannel); } catch(e){}
    dmChannel = null;
  }

  // ----- init -----
  function wireMsgBtn(){
    var mb = document.getElementById('msgBtn');
    if(!mb || mb.dataset.soc) return;
    mb.dataset.soc = '1';
    var wrapM = mb.closest('.topbar-right') || mb.parentNode;
    msgPop = document.createElement('div');
    msgPop.className = 'tb-pop msg-pop';
    msgPop.hidden = true;
    wrapM.appendChild(msgPop);
    renderMsgPop();
    mb.addEventListener('click', function(e){
      e.stopPropagation();
      var willOpen = msgPop.hidden;
      socClosePops(msgPop);
      if(willOpen){
        socConvo = null;
        renderMsgPop();
        msgPop.hidden = false;
        loadContacts().then(function(){ if(!socConvo) renderMsgPop(); });
        refreshDM();
      } else {
        msgPop.hidden = true;
      }
    });
    msgPop.addEventListener('click', function(e){ e.stopPropagation(); });
  }

  async function _init(){
    if(initialized) return;
    initialized = true;
    // Récupère le client Supabase et l'état d'auth via SHELL.auth.
    if(SHELL.auth){
      try { sb = await SHELL.auth.getClient(); } catch(e){ sb = null; }
      user = SHELL.auth.user || null;
      profile = SHELL.auth.profile || null;
    }
    // Câblage UI immédiat (même si pas encore connecté : le bouton affiche
    // « connecte-toi »).
    wireMsgBtn();
    // Fermeture popovers sur clic extérieur / Échap.
    document.addEventListener('click', function(){ socClosePops(null); });
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      // priorité à la modale plein écran si elle est ouverte
      if(modalVisible()){ closeContacts(); return; }
      socClosePops(null);
    });

    // Première charge.
    refreshDM();
    if(user){ ensureRealtime(); loadContacts(); }

    // Suivi de l'état d'auth via SHELL.auth.onChange : (dé)brancher le
    // realtime à la connexion/déconnexion sans rechargement.
    if(SHELL.auth && SHELL.auth.onChange){
      SHELL.auth.onChange(function(ctx){
        var wasUser = user;
        user = (ctx && ctx.user) || null;
        profile = (ctx && ctx.profile) || null;
        if(user){
          if(!sb && SHELL.auth.getClient){
            SHELL.auth.getClient().then(function(c){
              sb = c;
              ensureRealtime();
              loadContacts().then(function(){
                renderMsgPop();
                if(modalVisible()) renderContactsPage();
              });
              refreshDM();
            });
          } else {
            ensureRealtime();
            loadContacts().then(function(){
              renderMsgPop();
              if(modalVisible()) renderContactsPage();
            });
            refreshDM();
          }
        } else if(wasUser){
          teardownRealtime();
          socContacts = []; socConvo = null; socMsgs = []; socUnreadBy = {};
          updateMsgDot();
          renderMsgPop();
          if(modalVisible()) renderContactsPage();
        }
      });
    }

    // Polling de secours toutes les 15 s (si le canal realtime tombe).
    if(socPoll) clearInterval(socPoll);
    socPoll = setInterval(function(){
      if(!sb || !user) return;
      ensureRealtime();
      refreshDM();
      if(socConvo && ((msgPop && !msgPop.hidden) || modalVisible())){
        loadConvo().then(function(){
          if(msgPop && !msgPop.hidden) renderMsgPop();
          if(modalVisible()) renderContactsPage();
        });
      }
    }, 15000);
  }

  // ----- API exposée -----
  SHELL.social = {
    _init: _init,
    showContacts: showContacts,
    closeContacts: closeContacts,
    // helpers réexposés pour la sous-mission 4b (notifications)
    _esc: esc,
    _pcAgo: pcAgo,
    _avaHtml: avaHtml,
    _socClosePops: socClosePops,
    _toast: toast,
    _getClient: function(){ return sb; },
    _getUser: function(){ return user; },
    _getProfile: function(){ return profile; }
  };
})();

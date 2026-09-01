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
// la sous-mission 4b dans ce même fichier. Depuis 6f le notifBtn est
// entièrement géré par SHELL.social — plus de redirection.
//
// LA MESSAGERIE A SA PAGE depuis septembre 2026 (mission `messages-page`) :
// oeuvres/messages.html. La modale Contacts a été SUPPRIMÉE — elle était
// déjà une page déguisée (renderContactsPage, classes .cv-* pour « contacts
// view », un pavé de 1000 px qui recouvrait tout le viewport, et un lien de
// popover qui disait « Ouvrir la page Contacts → »).
//
// Le partage des rôles est celui de SHELL.annotations avec « Mon carnet » :
// CE MODULE possède les données, le realtime et le popover de la barre du
// haut ; la page ne fait que rendre, et s'abonne via SHELL.social.dm.
// Elle ne parle jamais à Supabase pour la messagerie.
//
// Profil membre cliquable + saut précis dans la liseuse : différés à
// la mission annotations (contrat de deep-link commun avec
// SHELL.commune).

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
  var dmSubs = [];               // abonnés de SHELL.social.dm (la page Messages)
  var sugRaw = null;             // cache des lecteurs à suggérer
  var initialized = false;
  // notifications (sous-mission 4b)
  var notifItems = [];           // [{id, kind:'reply'|'mention', work, section, who, snip, created}]
  var notifPop = null;           // popover #notifBtn (.tb-pop)
  var rtNotifT = null;           // timer debounce notifications
  // bibliotheque.json (work → {title, path, status}) pour la navigation
  // des notifications. Chargée une seule fois, alias 'capital'→'capital-1'
  // appliqué pour couvrir les lignes héritées de public_notes.
  var biblioMap = null;
  var biblioPromise = null;

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
  function socClosePops(except){
    document.querySelectorAll('.tb-pop').forEach(function(p){ if(p !== except) p.hidden = true; });
  }
  function socReady(){
    return !!(sb && user && profile && profile.username);
  }
  /* Les surfaces qui affichent la messagerie s'abonnent ici. Le module
     possède les données et le realtime ; la page Messages ne fait que se
     redessiner quand on la prévient. Même motif que SHELL.annotations avec
     « Mon carnet ». */
  function emitDM(){
    for(var i = 0; i < dmSubs.length; i++){ try { dmSubs[i](); } catch(e){} }
  }
  /* Cloudflare Pages sert des URL PROPRES : la page vit à /oeuvres/messages,
     pas seulement /oeuvres/messages.html. Le test doit couvrir les deux —
     le piège déjà documenté pour le marquage de la sidebar. */
  var MSG_URL = '/oeuvres/messages.html';
  function onMessagesPage(){
    return /\/oeuvres\/messages(\.html)?$/.test(location.pathname);
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

  // ----- bibliothèque (résolution work → page d'œuvre) -----
  // Variante locale du loader de SHELL.commune. On duplique plutôt
  // que d'introduire un couplage public_API entre modules ; la taille
  // est triviale et la sémantique est exactement la même (alias
  // hérité 'capital' → 'capital-1', strip du préfixe 'oeuvres/').
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

  // ----- notifications : « dernière vue » (localStorage) -----
  function notifSeenKey(){
    return 'liremarx.notifseen.' + ((user && user.id) || 'anon');
  }
  function notifGetSeen(){
    try { return +localStorage.getItem(notifSeenKey()) || 0; } catch(e){ return 0; }
  }
  function notifSetSeen(ts){
    try { localStorage.setItem(notifSeenKey(), String(ts || Date.now())); } catch(e){}
  }

  // ----- la messagerie a sa page -----
  /* Conservé sous son ancien nom : c'est l'API que shell.js appelle depuis
     l'entrée de sidebar. Elle ne montre plus une modale, elle mène à la
     page — et ne fait rien si l'on y est déjà. */
  function showContacts(){
    if(onMessagesPage()) return;
    location.href = MSG_URL;
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
    emitDM();
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
    emitDM();
  }

  function updateMsgDot(){
    var d = document.getElementById('msgDot');
    if(!d) return;
    var n = 0;
    Object.keys(socUnreadBy).forEach(function(k){ n += socUnreadBy[k]; });
    d.style.display = n > 0 ? 'block' : 'none';
  }

  /* Renvoie un résultat en plus de lever un toast : le popover se contente
     du toast, la page Messages veut savoir qui elle vient d'ajouter pour
     ouvrir la conversation dans la foulée. */
  async function addContact(name){
    if(!socReady()) { toast('Choisissez d’abord un pseudo (Mon compte).'); return { ok:false, msg:'pseudo' }; }
    name = (name || '').trim();
    if(name.charAt(0) === '@') name = name.slice(1);
    if(!name) return { ok:false, msg:'vide' };
    if(name.toLowerCase() === String(profile.username || '').toLowerCase()){
      toast('C’est vous !'); return { ok:false, msg:'moi' };
    }
    try {
      var pr = await sb.from('profiles').select('id,username').eq('username', name).maybeSingle();
      if(pr.error || !pr.data){
        var m = 'Aucun lecteur nommé « ' + name + ' ».';
        toast(m); return { ok:false, msg:m };
      }
      var res = await sb.from('contacts').upsert({ user_id: user.id, contact_id: pr.data.id });
      if(res.error){ toast('Contact : ' + res.error.message); return { ok:false, msg:res.error.message }; }
      toast(pr.data.username + ' rejoint vos conversations.');
      sugRaw = null;
      await loadContacts();
      renderMsgPop();
      return { ok:true, id: pr.data.id, username: pr.data.username };
    } catch(e){
      var em = (e && e.message) || String(e);
      toast('Contact : ' + em); return { ok:false, msg:em };
    }
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
    emitDM();
  }

  async function sendMsg(text){
    if(!sb || !user || !socConvo) return { ok:false };
    text = (text || '').trim();
    if(!text) return { ok:false };
    var row = { id: uid(), sender_id: user.id, recipient_id: socConvo.id, body: text, created: Date.now(), read_at: null };
    try {
      var res = await sb.from('direct_messages').insert(row);
      if(res.error){ toast('Envoi : ' + res.error.message); return { ok:false, msg:res.error.message }; }
      socMsgs.push(row);
      renderMsgPop();
      emitDM();
      return { ok:true };
    } catch(e){
      var em = (e && e.message) || String(e);
      toast('Envoi : ' + em); return { ok:false, msg:em };
    }
  }

  async function openConvo(id, uname){
    socConvo = { id: id, username: uname };
    socMsgs = [];
    renderMsgPop();
    emitDM();
    await loadConvo();
    renderMsgPop();
  }
  function closeConvo(){
    socConvo = null; socMsgs = [];
    renderMsgPop();
    emitDM();
  }

  /* Découverte des lecteurs. Sans elle on ne peut joindre quelqu'un qu'en
     tapant son pseudo au caractère près, ce qui rend la messagerie
     inutilisable pour un nouveau venu. Les lecteurs proposés sont ceux qui
     ont ÉCRIT SUR LA PLACE PUBLIQUE : rien de plus que ce que le forum
     montre déjà, et aucune table ni policy nouvelle à rejouer.
     Le brut est mis en cache, le filtrage se refait à chaque appel — sinon
     un contact ajouté après le fetch resterait proposé. */
  async function suggestions(){
    if(!socReady()) return [];
    if(!sugRaw){
      try {
        var r = await sb.from('public_notes')
          .select('author_id,created,profiles(username,avatar_url)')
          .eq('hidden', false).order('created', { ascending: false }).limit(200);
        if(r.error) return [];
        var seen = {}, out = [];
        (r.data || []).forEach(function(n){
          var id = n.author_id, pr = n.profiles || {};
          if(!id || id === user.id || seen[id] || !pr.username) return;
          seen[id] = 1;
          out.push({ id: id, username: pr.username, avatar: pr.avatar_url || '', last: +n.created || 0 });
        });
        sugRaw = out;
      } catch(e){ return []; }
    }
    var known = {};
    socContacts.forEach(function(c){ known[c.id] = 1; });
    return sugRaw.filter(function(x){ return !known[x.id]; }).slice(0, 12);
  }

  // ----- rendu : popover msgPop -----
  function bubblesHtml(){
    var me = user ? user.id : null, h = '';
    if(!socMsgs.length) h += '<div class="msg-empty">Aucun message. Écrivez le premier.</div>';
    else socMsgs.forEach(function(m){
      var mine = m.sender_id === me;
      h += '<div class="msg-b ' + (mine ? 'me' : 'them') + '">' + esc(m.body)
        + '<span class="msg-b-t">' + esc(pcAgo(+m.created)) + '</span></div>';
    });
    return h;
  }
  function contactListHtml(activeId){
    if(!socContacts.length) return '<div class="msg-empty">Aucune conversation pour l’instant.</div>';
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
      msgPop.innerHTML = '<div class="tb-pop-h">Messages</div><div class="msg-state">Connectez-vous pour échanger des messages privés.</div><a class="tb-pop-cta" data-soc="login" href="#">Se connecter</a>';
      var lb = msgPop.querySelector('[data-soc="login"]');
      if(lb) lb.onclick = function(e){ e.preventDefault(); socClosePops(null); openAcctModal(); };
      return;
    }
    if(!(profile && profile.username)){
      msgPop.innerHTML = '<div class="tb-pop-h">Messages</div><div class="msg-state">Choisissez un pseudo (Mon compte) pour la messagerie.</div>';
      return;
    }
    var h;
    if(socConvo){
      h = '<div class="msg-head"><button class="msg-back" data-back="1" type="button" aria-label="Retour">‹</button><h3>' + esc(socConvo.username) + '</h3></div>'
        + '<div class="msg-thread" id="popThread">' + bubblesHtml() + '</div>'
        + '<div class="msg-compose"><textarea id="popIn" aria-label="Votre message" placeholder="Votre message…"></textarea><button class="msg-send" data-send="1" type="button">Envoyer</button></div>';
    } else {
      h = '<div class="tb-pop-h">Messages</div>'
        + '<div class="msg-add"><input id="popAddIn" type="text" autocomplete="off" placeholder="Écrire à (pseudo)…" /><button class="msg-send" data-add="1" type="button" aria-label="Ajouter ce lecteur">+</button></div>'
        + '<div class="msg-list">' + contactListHtml(null) + '</div>'
        + '<button class="msg-poplink" data-full="1" type="button">Toutes les conversations →</button>';
    }
    msgPop.innerHTML = h;
    var th = msgPop.querySelector('#popThread'); if(th) th.scrollTop = th.scrollHeight;
    var back = msgPop.querySelector('[data-back]');
    if(back) back.onclick = function(){ closeConvo(); loadContacts().then(renderMsgPop); };
    var addIn = msgPop.querySelector('#popAddIn'), addB = msgPop.querySelector('[data-add]');
    if(addB) addB.onclick = function(){ addContact(addIn ? addIn.value : ''); if(addIn) addIn.value = ''; };
    if(addIn) addIn.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); addContact(addIn.value); addIn.value = ''; } };
    msgPop.querySelectorAll('[data-ci]').forEach(function(b){
      b.onclick = function(){ var c = socContacts[+b.dataset.ci]; if(c) openConvo(c.id, c.username); };
    });
    var ta = msgPop.querySelector('#popIn'), sd = msgPop.querySelector('[data-send]');
    function go(){ var v = ta ? ta.value : ''; if(ta) ta.value = ''; sendMsg(v); }
    if(sd) sd.onclick = go;
    if(ta) ta.onkeydown = function(e){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); go(); } };
    var fl = msgPop.querySelector('[data-full]');
    if(fl) fl.onclick = function(){ socClosePops(null); showContacts(); };
  }

  // ----- notifications : fetch (multi-œuvres) -----
  async function refreshNotif(){
    if(!socReady()){ notifItems = []; updateNotifDot(); return; }
    try {
      var uname = profile.username, items = [];
      // 1) mes notes de tête, toutes œuvres confondues.
      var mine = await sb.from('public_notes').select('id,work')
        .eq('author_id', user.id).is('parent_id', null);
      var workById = {}, myIds = [];
      (mine.data || []).forEach(function(r){ workById[r.id] = r.work || ''; myIds.push(r.id); });
      // 2) réponses à mes notes (toutes œuvres confondues — plus de filtre work).
      if(myIds.length){
        var rep = await sb.from('public_notes')
          .select('id,work,section,body,created,parent_id,author_id,profiles(username)')
          .in('parent_id', myIds).neq('author_id', user.id).eq('hidden', false)
          .order('created', { ascending: false }).limit(40);
        (rep.data || []).forEach(function(r){
          items.push({
            id: r.id, kind: 'reply',
            work: r.work || workById[r.parent_id] || '',
            section: r.section,
            who: (r.profiles && r.profiles.username) || 'quelqu’un',
            snip: r.body, created: +r.created
          });
        });
      }
      // 3) mentions @username, toutes œuvres confondues.
      var men = await sb.from('public_notes')
        .select('id,work,section,body,created,author_id,parent_id,profiles(username)')
        .ilike('body', '%@' + uname + '%').neq('author_id', user.id).eq('hidden', false)
        .order('created', { ascending: false }).limit(40);
      (men.data || []).forEach(function(r){
        items.push({
          id: r.id, kind: 'mention',
          work: r.work || '', section: r.section,
          who: (r.profiles && r.profiles.username) || 'quelqu’un',
          snip: r.body, created: +r.created
        });
      });
      items.sort(function(a, b){ return b.created - a.created; });
      var seenById = {}, out = [];
      items.forEach(function(it){ if(seenById[it.id]) return; seenById[it.id] = 1; out.push(it); });
      notifItems = out.slice(0, 40);
    } catch(e){ /* silencieux */ }
    updateNotifDot();
    if(notifPop && !notifPop.hidden) renderNotif();
  }

  function updateNotifDot(){
    var d = document.getElementById('notifDot');
    if(!d) return;
    var seen = notifGetSeen(), n = 0;
    notifItems.forEach(function(i){ if(i.created > seen) n++; });
    d.style.display = n > 0 ? 'block' : 'none';
  }

  // Résout work → page d'œuvre dans bibliotheque.json, avec alias hérité.
  function resolveWork(work, biblio){
    var id = (work === 'capital') ? 'capital-1' : work;
    return biblio[id] || biblio[work] || null;
  }

  async function renderNotif(){
    if(!notifPop) return;
    var configured = SHELL.auth && SHELL.auth.isConfigured && SHELL.auth.isConfigured();
    if(!configured){
      notifPop.innerHTML = '<div class="tb-pop-h">Notifications</div><div class="tb-pop-empty">Indisponible (compte non configuré).</div>';
      return;
    }
    if(!user){
      notifPop.innerHTML = '<div class="tb-pop-h">Notifications</div><div class="tb-pop-empty">Connecte-toi pour suivre les réponses et les mentions.</div><a class="tb-pop-cta" data-soc="login" href="#">Se connecter</a>';
      var lb = notifPop.querySelector('[data-soc="login"]');
      if(lb) lb.onclick = function(e){ e.preventDefault(); socClosePops(null); openAcctModal(); };
      return;
    }
    var biblio = await loadBiblio();
    var seen = notifGetSeen();
    var h = '<div class="tb-pop-h">Notifications</div>';
    if(!notifItems.length){
      h += '<div class="tb-pop-empty">Aucune réponse ni mention pour l’instant.</div>';
    } else {
      h += '<div class="nt-list">';
      notifItems.forEach(function(it, i){
        var kc = it.kind === 'reply' ? 'nt-k-reply' : 'nt-k-mention';
        var kl = it.kind === 'reply' ? 'réponse' : 'mention';
        var meta = resolveWork(it.work, biblio);
        var workTitle = (meta && meta.title) || 'Œuvre';
        var sec = (it.section != null && it.section !== '') ? (' · Section ' + String(it.section)) : '';
        var snipRaw = String(it.snip || '');
        var snip = snipRaw.slice(0, 150) + (snipRaw.length > 150 ? '…' : '');
        h += '<button class="nt-item' + (it.created > seen ? ' unseen' : '') + '" data-ni="' + i + '" type="button">'
          + '<div class="nt-top"><span class="nt-who">' + esc(it.who) + '</span>'
          + '<span class="nt-kind ' + kc + '">' + kl + '</span>'
          + '<span class="nt-when">' + esc(pcAgo(it.created)) + '</span></div>'
          + '<div class="nt-snip">' + esc(snip) + '</div>'
          + '<div class="nt-meta">' + esc(workTitle + sec) + '</div>'
          + '</button>';
      });
      h += '</div>';
    }
    notifPop.innerHTML = h;
    notifPop.querySelectorAll('[data-ni]').forEach(function(b){
      b.onclick = function(){
        var it = notifItems[+b.dataset.ni];
        if(!it) return;
        socClosePops(null);
        var meta = resolveWork(it.work, biblio);
        // Contrat de deep-link au passage : on ajoute #note=<id> ;
        // SHELL.reader.resolveDeepLink côté page d'œuvre suivra
        // parent_id si nécessaire pour atterrir sur la bonne ancre.
        if(meta && meta.status === 'available' && meta.path){
          location.href = meta.path + '#note=' + encodeURIComponent(it.id);
        }
      };
    });
  }

  // ----- realtime -----
  // Insertion d'une note publique (réponse ou mention) → debounce
  // refreshNotif. Pas de filtre work sur l'abonnement : on agrège
  // toutes les œuvres.
  function onPublicInsert(row){
    if(!row || !user) return;
    var uname = profile && profile.username;
    var isNotif = (row.author_id !== user.id) && (
      !!row.parent_id ||
      (uname && String(row.body || '').toLowerCase().indexOf('@' + String(uname).toLowerCase()) >= 0)
    );
    if(isNotif){
      clearTimeout(rtNotifT);
      rtNotifT = setTimeout(function(){ refreshNotif(); }, 600);
    }
  }

  function onIncomingDM(row){
    if(!row || !user) return;
    var convOpen = socConvo && row.sender_id === socConvo.id;
    if(convOpen){
      var dup = false;
      for(var i = 0; i < socMsgs.length; i++){ if(socMsgs[i].id === row.id){ dup = true; break; } }
      if(!dup) socMsgs.push(row);
      try {
        sb.from('direct_messages').update({ read_at: Date.now() }).eq('id', row.id)
          .then(function(){ refreshDM(); });
      } catch(e){}
      if(msgPop && !msgPop.hidden) renderMsgPop();
      emitDM();
    } else {
      var nm = '';
      for(var j = 0; j < socContacts.length; j++){ if(socContacts[j].id === row.sender_id){ nm = socContacts[j].username; break; } }
      try { toast('Nouveau message' + (nm ? (' de ' + nm) : '') + '.'); } catch(e){}
      loadContacts().then(function(){
        if(msgPop && !msgPop.hidden && !socConvo) renderMsgPop();
        emitDM();
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
        // Public_notes : pas de filtre work (notifications multi-œuvres).
        // onPublicInsert filtre ensuite par parent_id ∈ mes notes /
        // mention dans le corps.
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_notes' }, function(payload){
          onPublicInsert(payload && payload.new);
        })
        .subscribe();
    } catch(e){ dmChannel = null; }
  }
  function teardownRealtime(){
    try { if(dmChannel && sb && sb.removeChannel) sb.removeChannel(dmChannel); } catch(e){}
    dmChannel = null;
  }

  // ----- init -----
  function wireNotifBtn(){
    var nb = document.getElementById('notifBtn');
    if(!nb || nb.dataset.soc) return;
    nb.dataset.soc = '1';
    var wrap = nb.closest('.topbar-right') || nb.parentNode;
    notifPop = document.createElement('div');
    notifPop.className = 'tb-pop';
    notifPop.hidden = true;
    wrap.appendChild(notifPop);
    renderNotif();
    nb.addEventListener('click', function(e){
      e.stopPropagation();
      var willOpen = notifPop.hidden;
      socClosePops(notifPop);
      if(willOpen){
        renderNotif();
        notifPop.hidden = false;
        refreshNotif();
        // Marquer toutes les notifs comme vues à l'ouverture
        // (la pastille reflète le « non-vu » depuis la dernière ouverture).
        notifSetSeen(Date.now());
        setTimeout(updateNotifDot, 30);
      } else {
        notifPop.hidden = true;
      }
    });
    notifPop.addEventListener('click', function(e){ e.stopPropagation(); });
  }

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
    // Câblage UI immédiat (même si pas encore connecté : les boutons
    // affichent un état « connecte-toi »).
    wireMsgBtn();
    wireNotifBtn();
    // Fermeture popovers sur clic extérieur / Échap.
    document.addEventListener('click', function(){ socClosePops(null); });
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      socClosePops(null);
    });

    // Première charge.
    refreshDM();
    refreshNotif();
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
              loadContacts().then(function(){ renderMsgPop(); });
              refreshDM();
              refreshNotif();
            });
          } else {
            ensureRealtime();
            loadContacts().then(function(){ renderMsgPop(); });
            refreshDM();
            refreshNotif();
          }
        } else if(wasUser){
          teardownRealtime();
          socContacts = []; socConvo = null; socMsgs = []; socUnreadBy = {};
          notifItems = [];
          updateMsgDot();
          updateNotifDot();
          renderMsgPop();
          renderNotif();
          sugRaw = null;
          emitDM();
        }
      });
    }

    // Polling de secours toutes les 15 s (si le canal realtime tombe).
    if(socPoll) clearInterval(socPoll);
    socPoll = setInterval(function(){
      if(!sb || !user) return;
      ensureRealtime();
      refreshDM();
      refreshNotif();
      if(socConvo){
        loadConvo().then(function(){
          if(msgPop && !msgPop.hidden) renderMsgPop();
        });
      }
    }, 15000);
  }

  // ----- API exposée -----
  /* ── L'API que la page Messages consomme ──────────────────────────────
     Le module possède les données, le realtime et le popover ; la page ne
     fait que rendre ce qu'on lui donne et se redessine sur onChange. Elle
     ne touche jamais Supabase pour la messagerie — c'est la règle déjà
     posée pour SHELL.annotations et « Mon carnet ». */
  var dm = {
    // état des préalables, pour que la page dise POURQUOI elle est vide
    status: function(){
      var configured = !!(SHELL.auth && SHELL.auth.isConfigured && SHELL.auth.isConfigured());
      return { configured: configured, signedIn: !!user,
               named: !!(profile && profile.username), ready: socReady() };
    },
    me: function(){ return user ? user.id : null; },
    myName: function(){ return (profile && profile.username) || ''; },
    contacts: function(){
      return socContacts.map(function(c){
        return { id:c.id, username:c.username, avatar:c.avatar, last:c.last,
                 unread: socUnreadBy[c.id] || 0 };
      });
    },
    convo: function(){ return socConvo ? { id:socConvo.id, username:socConvo.username } : null; },
    messages: function(){ return socMsgs.slice(); },
    open: openConvo,
    close: closeConvo,
    send: sendMsg,
    add: addContact,
    suggestions: suggestions,
    refresh: function(){ return loadContacts().then(refreshDM); },
    onChange: function(cb){ if(typeof cb === 'function') dmSubs.push(cb); },
    // petits outils, pour que la page n'en redéclare pas de variantes
    ago: pcAgo,
    ava: avaHtml,
    esc: esc,
    toast: toast
  };

  SHELL.social = {
    _init: _init,
    showContacts: showContacts,
    messagesUrl: MSG_URL,
    dm: dm,
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

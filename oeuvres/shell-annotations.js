// Shell partagé Lire Marx — module annotations privées (sous-mission 5a).
//
// SHELL.annotations + SHELL.reader.attach() fournissent le surlignage,
// les notes privées (local + synchro `annotations`) et le panneau « Mes
// notes » à toutes les pages d'œuvres qui chargent shell-annotations.js
// et déclarent leur liseuse via SHELL.reader.attach() à chaque rendu
// d'une section de texte. Capital-1.html n'est pas concerné par ce
// fichier — il continue d'inliner sa propre version jusqu'à la mission
// retrait-shell-host.
//
// Contrat liseuse (le cœur de la mission) :
//
//   SHELL.reader.attach({
//     workId:       'manuscrits-1844',          // = id bibliotheque.json
//     section:      curSectionNumber,           // identifiant numérique
//     container:    document.getElementById('le-conteneur-de-texte'),
//     sectionLabel: 'Premier manuscrit'         // optionnel
//   });
//
// SHELL.annotations :
//   - applique les surlignages stockés pour (workId, section) ;
//   - câble sélection → surlignage, popup de note, panneau « Mes notes » ;
//   - synchronise avec la table Supabase `annotations` quand l'utilisateur
//     est connecté (pull à la connexion, push immédiat à chaque écriture).
//
// Invariant d'ancrage : une annotation est ancrée par texte
// (before / quote / after), pas par range DOM. C'est ce qui permet à la
// même logique de marcher pour n'importe quelle œuvre qui rend du texte
// dans un conteneur.
//
// Règle base : la table `annotations` a un défaut/trigger user_id =
// auth.uid() côté policy RLS (Capital ne pose pas user_id dans son
// INSERT). On préserve ce comportement à l'identique ici — pas d'ajout
// explicite. Si un INSERT échoue depuis une page shell alors qu'il
// marche sur Capital, c'est une policy à revoir, pas un contournement
// à coder.

(function(){
  var SHELL = window.SHELL = window.SHELL || {};
  if(SHELL.annotations) return;

  // ----- état du module -----
  var sb = null;
  var user = null;
  var profile = null;
  var KEY = 'liremarx.anno.v1';
  var COLORS = [['gold','Or'],['red','Rouge'],['blue','Bleu'],['green','Vert']];
  var store = {};            // { 'workId|section': [an, an, ...] }
  var persistOK = true;
  var curWork = null;        // workId courant (déclaré par attach)
  var curSection = 0;        // section courante (idem)
  var curLabel = '';         // libellé lisible de la section
  var box = null;            // conteneur DOM de la section affichée
  var bar = null;            // .anno-bar (créée à la volée, body-level)
  var pop = null;            // .anno-pop (idem)
  var panel = null;          // .notes-panel (idem)
  var fab = null;            // bouton flottant « Mes notes » (idem)
  var pulledWorks = {};      // workId → true une fois pullAll appelé
  var initialized = false;
  // ----- forum par passage (5b) -----
  var pubNotes = [];         // notes publiques de la section courante (top-level + replies)
  var pubPanel = null;       // .notes-panel.pub-panel (créé à la volée)
  var pubFab = null;         // 2e bouton flottant « Notes partagées »
  var pubPop = null;         // popover de composition (.pub-compose)
  var replyOpen = null;      // id de la note dont la zone réponse est ouverte
  var pubPoll = null;        // setInterval de refresh
  // Deep-link pendant à la 1re attach (parsé depuis location.hash au _init).
  var pendingDeepLink = null;
  var pendingDeepLinkConsumed = false;

  // ----- localStorage (chargement initial) -----
  try { localStorage.setItem('liremarx.__t', '1'); localStorage.removeItem('liremarx.__t'); }
  catch(e){ persistOK = false; }
  try { var raw = localStorage.getItem(KEY); store = raw ? JSON.parse(raw) : {}; }
  catch(e){ store = {}; }
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch(e){ persistOK = false; }
  }
  function keyOf(work, n){ return work + '|' + n; }
  function listFor(work, n){ return store[keyOf(work, n)] || []; }
  function findAnn(id){
    var list = listFor(curWork, curSection);
    for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i];
    return null;
  }

  // ----- helpers HTML / id -----
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function uid(){
    try { if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch(e){}
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function toast(msg){
    // Priorité au toast de SHELL.social s'il est chargé (un seul élément
    // flottant pour tout le shell). Sinon on fait pousser le nôtre, qui
    // partage les styles .lm-toast.
    if(SHELL.social && SHELL.social._toast){ SHELL.social._toast(msg); return; }
    var t = document.getElementById('lmToast');
    if(!t){ t = document.createElement('div'); t.id = 'lmToast'; t.className = 'lm-toast'; document.body.appendChild(t); }
    t.textContent = String(msg || '');
    t.classList.add('on');
    setTimeout(function(){ t.classList.remove('on'); }, 3800);
  }

  // ----- forme « ligne » de la table annotations -----
  function normalizeRow(r){
    return { id: r.id, work: r.work, section: Number(r.section),
      before: r.before || '', quote: r.quote || '', after: r.after || '',
      color: r.color || 'gold', note: r.note || '', created: Number(r.created) || Date.now() };
  }
  function rowOf(an){
    // Conserver à l'identique ce que fait Capital : pas de user_id
    // explicite (le défaut côté base le pose).
    return { id: an.id, work: an.work, section: an.section,
      before: an.before, quote: an.quote, after: an.after,
      color: an.color, note: an.note, created: an.created };
  }

  // ----- synchro Supabase -----
  function syncUpsert(an){
    if(!sb || !user) return;
    sb.from('annotations').upsert(rowOf(an)).then(function(res){
      if(res.error) toast('Synchro (écriture) : ' + res.error.message);
    });
  }
  function syncDelete(id){
    if(!sb || !user) return;
    sb.from('annotations').delete().eq('id', id).then(function(res){
      if(res.error) toast('Synchro (suppression) : ' + res.error.message);
    });
  }
  function pushAll(workId){
    if(!sb || !user || !workId) return;
    Object.keys(store).forEach(function(k){
      if(k.indexOf(workId + '|') !== 0) return;
      (store[k] || []).forEach(function(a){ syncUpsert(a); });
    });
  }
  // Fusion remote/local : le distant fait foi pour les id connus ; les
  // annotations purement locales sont conservées ET téléversées (migration
  // à la première connexion).
  function applyRemote(workId, rows){
    var remoteIds = {};
    rows.forEach(function(r){ remoteIds[r.id] = 1; });
    var localOnly = [];
    Object.keys(store).forEach(function(k){
      if(k.indexOf(workId + '|') !== 0) return;
      (store[k] || []).forEach(function(a){ if(!remoteIds[a.id]) localOnly.push(a); });
    });
    Object.keys(store).forEach(function(k){
      if(k.indexOf(workId + '|') === 0) delete store[k];
    });
    rows.forEach(function(r){
      var a = normalizeRow(r);
      var k = workId + '|' + a.section;
      (store[k] = store[k] || []).push(a);
    });
    localOnly.forEach(function(a){
      var k = keyOf(workId, a.section);
      (store[k] = store[k] || []).push(a);
      syncUpsert(a);
    });
    persist();
  }
  async function pullAll(workId){
    if(!sb || !user || !workId) return;
    try {
      var res = await sb.from('annotations').select('*').eq('work', workId);
      if(res.error) throw res.error;
      applyRemote(workId, res.data || []);
      if(box && curWork === workId){ clearMarks(); renderHighlights(); }
      if(panel && !panel.hidden) renderPanel();
      pulledWorks[workId] = true;
      updateFab();
    } catch(e){
      toast('Lecture cloud impossible : ' + ((e && e.message) || e));
    }
  }

  // ----- ancrage texte (offset start/end + before/quote/after) -----
  function rangeOffsets(container, range){
    if(range.startContainer.nodeType !== 3 || range.endContainer.nodeType !== 3) return null;
    var w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var pos = 0, start = -1, end = -1, n;
    while((n = w.nextNode())){
      if(n === range.startContainer) start = pos + range.startOffset;
      if(n === range.endContainer) end = pos + range.endOffset;
      pos += n.nodeValue.length;
      if(start >= 0 && end >= 0) break;
    }
    if(start < 0 || end < 0 || end <= start) return null;
    return { start: start, end: end };
  }
  function contextFor(full, start, end, pad){
    pad = pad || 40;
    return {
      before: full.slice(Math.max(0, start - pad), start),
      quote:  full.slice(start, end),
      after:  full.slice(end, end + pad)
    };
  }
  function locate(full, a){
    if(!a.quote) return null;
    var i = full.indexOf(a.before + a.quote + a.after);
    if(i >= 0){ var s = i + a.before.length; return { start: s, end: s + a.quote.length }; }
    i = full.indexOf(a.before + a.quote);
    if(i >= 0){ var s2 = i + a.before.length; return { start: s2, end: s2 + a.quote.length }; }
    i = full.indexOf(a.quote);
    if(i >= 0) return { start: i, end: i + a.quote.length };
    return null;
  }
  function wrapByOffsets(container, start, end, cls, id){
    var w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var pos = 0, n, snap = [];
    while((n = w.nextNode())){ snap.push({ node: n, pos: pos }); pos += n.nodeValue.length; }
    for(var i = 0; i < snap.length; i++){
      var it = snap[i];
      var len = it.node.nodeValue.length, a = it.pos, b = it.pos + len;
      var s = Math.max(start, a) - a, e = Math.min(end, b) - a;
      if(e <= s) continue;
      var node = it.node;
      if(s > 0) node = node.splitText(s);
      if(e - s < node.nodeValue.length) node.splitText(e - s);
      var mark = document.createElement('mark');
      mark.className = cls;
      mark.dataset.anno = id;
      /* Un <mark> n'est pas focusable : rouvrir une note n'était possible
         qu'au clic. WCAG 2.1.1. */
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-label', 'Note sur ce passage — ouvrir');
      node.parentNode.insertBefore(mark, node);
      mark.appendChild(node);
    }
  }

  // ----- rendu des surlignages -----
  function renderHighlights(){
    if(!box || !curWork) return;
    listFor(curWork, curSection).forEach(function(an){
      try {
        var loc = locate(box.textContent, an);
        if(!loc) return;
        wrapByOffsets(box, loc.start, loc.end, 'anno c-' + an.color + (an.note ? ' has-note' : ''), an.id);
      } catch(e){}
    });
  }
  function clearMarks(){
    if(!box) return;
    box.querySelectorAll('mark.anno').forEach(function(m){ m.replaceWith(document.createTextNode(m.textContent)); });
    box.normalize();
  }
  function unwrap(id){
    if(!box) return;
    box.querySelectorAll('mark[data-anno="' + id + '"]').forEach(function(m){ m.replaceWith(document.createTextNode(m.textContent)); });
    box.normalize();
  }
  function reclass(id, color, hasNote){
    if(!box) return;
    box.querySelectorAll('mark[data-anno="' + id + '"]').forEach(function(m){
      m.className = 'anno c-' + color + (hasNote ? ' has-note' : '');
    });
  }

  // ----- barre de sélection -----
  function ensureBar(){
    if(bar) return bar;
    bar = document.createElement('div');
    bar.className = 'anno-bar';
    /* title n'est ni rendu au tactile ni fiable au clavier : les quatre
       pastilles n'avaient aucun nom accessible utilisable. WCAG 4.1.2. */
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Annoter la sélection');
    var h = '<span class="anno-bar-l" id="annoBarL">Surligner</span>';
    COLORS.forEach(function(c){
      h += '<button class="anno-sw c-' + c[0] + '" data-c="' + c[0] + '" aria-label="Surligner en ' + c[1] + '" type="button"></button>';
    });
    h += '<button class="share-btn" data-share="1" type="button">Partager</button>';
    bar.innerHTML = h;
    bar.addEventListener('mousedown', function(e){ e.preventDefault(); });
    bar.addEventListener('click', function(e){
      var c = e.target.closest && e.target.closest('[data-c]');
      if(c){ addFromSelection(c.dataset.c); return; }
      var s = e.target.closest && e.target.closest('[data-share]');
      if(s) shareFromSelection();
    });
    document.body.appendChild(bar);
    return bar;
  }
  function hideBar(){ if(bar) bar.style.display = 'none'; }
  function selectionInBox(){
    var s = window.getSelection();
    if(!s || s.isCollapsed || s.rangeCount === 0) return null;
    var r = s.getRangeAt(0);
    if(!box || !box.contains(r.commonAncestorContainer)) return null;
    if((r.toString() || '').trim().length < 2) return null;
    return r;
  }
  function onSelect(){
    if(pop && pop.style.display !== 'none') return;
    var r = selectionInBox();
    if(!r){ hideBar(); return; }
    ensureBar();
    var rect = r.getBoundingClientRect();
    bar.style.display = 'flex';
    bar.style.top = Math.max(window.scrollY + 4, window.scrollY + rect.top - bar.offsetHeight - 8) + 'px';
    bar.style.left = Math.max(6, window.scrollX + rect.left + rect.width/2 - bar.offsetWidth/2) + 'px';
  }
  function addFromSelection(color){
    var r = selectionInBox();
    if(!r) return;
    var off = rangeOffsets(box, r);
    if(!off){ hideBar(); return; }
    var ctx = contextFor(box.textContent, off.start, off.end);
    var an = {
      id: uid(), work: curWork, section: curSection,
      before: ctx.before, quote: ctx.quote, after: ctx.after,
      color: color, note: '', created: Date.now()
    };
    var k = keyOf(curWork, curSection);
    (store[k] = store[k] || []).push(an);
    persist();
    syncUpsert(an);
    try { wrapByOffsets(box, off.start, off.end, 'anno c-' + color, an.id); } catch(e){}
    window.getSelection().removeAllRanges();
    hideBar();
    renderPanel();
    openPop(an.id);
  }

  // ----- popover de note -----
  function openPop(id){
    var an = findAnn(id);
    if(!an) return;
    if(!pop){ pop = document.createElement('div'); pop.className = 'anno-pop'; document.body.appendChild(pop); }
    var sw = '';
    COLORS.forEach(function(c){
      sw += '<button class="anno-sw c-' + c[0] + (c[0] === an.color ? ' on' : '') + '" data-c="' + c[0] + '" type="button"></button>';
    });
    pop.innerHTML = '<div class="anno-pop-q">« ' + esc(an.quote.slice(0, 140)) + (an.quote.length > 140 ? '…' : '') + ' »</div>'
      + '<div class="anno-pop-sw">' + sw + '</div>'
      + '<textarea class="anno-pop-t" aria-label="Votre note privée sur ce passage" placeholder="Ta note…">' + esc(an.note || '') + '</textarea>'
      + '<div class="anno-pop-act"><button class="btn red" data-act="save" type="button">Enregistrer</button><button class="lk" data-act="del" type="button">Supprimer</button></div>';
    var first = box ? box.querySelector('mark[data-anno="' + id + '"]') : null;
    pop.style.display = 'block';
    if(first){
      var rect = first.getBoundingClientRect();
      pop.style.top = (window.scrollY + rect.bottom + 8) + 'px';
      pop.style.left = Math.max(6, window.scrollX + rect.left) + 'px';
    } else {
      pop.style.top = (window.scrollY + 100) + 'px';
      pop.style.left = (window.scrollX + 20) + 'px';
    }
    var ta = pop.querySelector('.anno-pop-t');
    if(ta) ta.focus();
    pop.querySelectorAll('[data-c]').forEach(function(b){
      b.addEventListener('click', function(){
        pop.querySelectorAll('.anno-sw').forEach(function(x){ x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
    pop.querySelector('[data-act="save"]').onclick = function(){
      an.note = ta.value.trim();
      var onSw = pop.querySelector('.anno-sw.on');
      if(onSw) an.color = onSw.dataset.c;
      persist();
      syncUpsert(an);
      reclass(an.id, an.color, !!an.note);
      renderPanel();
      closePop();
    };
    pop.querySelector('[data-act="del"]').onclick = function(){
      delAnn(an.id);
      closePop();
    };
  }
  function closePop(){ if(pop) pop.style.display = 'none'; }
  function delAnn(id){
    var k = keyOf(curWork, curSection);
    store[k] = (store[k] || []).filter(function(a){ return a.id !== id; });
    persist();
    syncDelete(id);
    unwrap(id);
    renderPanel();
  }

  // ----- panneau « Mes notes » + bouton flottant -----
  function ensurePanel(){
    if(panel) return panel;
    panel = document.createElement('div');
    panel.id = 'notesPanel';
    panel.className = 'notes-panel';
    panel.hidden = true;
    document.body.appendChild(panel);
    return panel;
  }
  function ensureFab(){
    if(fab) return fab;
    fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'notesFab';
    fab.className = 'notes-fab';
    fab.textContent = 'Mes notes';
    fab.addEventListener('click', function(){
      ensurePanel();
      if(panel.hidden){ renderPanel(); panel.hidden = false; }
      else panel.hidden = true;
    });
    document.body.appendChild(fab);
    return fab;
  }
  function updateFab(){
    if(!fab) return;
    var n = curWork ? listFor(curWork, curSection).length : 0;
    var label = 'Mes notes';
    if(n > 0) label += ' · ' + n;
    fab.textContent = label;
  }
  function renderPanel(){
    ensurePanel();
    if(!panel) return;
    var items = curWork ? listFor(curWork, curSection) : [];
    var label = curLabel ? ' · <span class="np-sec">' + esc(curLabel) + '</span>' : '';
    var h = '<div class="np-head"><b>Mes notes</b>' + label
      + ' <span class="np-n">' + items.length + '</span>'
      + '<span class="np-tools"><button class="lk" id="annoExport" type="button">Exporter</button><button class="lk" id="annoImport" type="button">Importer</button><button class="lk" id="annoClose" type="button">Fermer</button></span></div>';
    if(!persistOK){
      h += '<div class="np-warn">Sauvegarde locale indisponible ici (par ex. dans un aperçu) : les annotations ne seront pas conservées. Sur le site en ligne, elles le seront.</div>';
    }
    if(!items.length){
      h += '<div class="np-empty">Aucune note sur cette section. Sélectionne un passage du texte pour commencer.</div>';
    } else {
      h += '<ul class="np-list">';
      items.forEach(function(an){
        h += '<li><span class="np-dot c-' + an.color + '"></span>'
          + '<div class="np-body"><div class="np-q">' + esc(an.quote.slice(0, 120)) + (an.quote.length > 120 ? '…' : '') + '</div>'
          + (an.note ? '<div class="np-note">' + esc(an.note) + '</div>' : '<div class="np-note np-empty2">— sans note —</div>') + '</div>'
          + '<span class="np-act"><button class="lk" data-go="' + an.id + '" type="button">Aller</button><button class="lk" data-ed="' + an.id + '" type="button">Éditer</button></span></li>';
      });
      h += '</ul>';
    }
    panel.innerHTML = h;
    var cl = panel.querySelector('#annoClose');
    if(cl) cl.onclick = function(){ panel.hidden = true; };
    panel.querySelectorAll('[data-go]').forEach(function(b){
      b.addEventListener('click', function(){ gotoAnn(b.dataset.go); });
    });
    panel.querySelectorAll('[data-ed]').forEach(function(b){
      b.addEventListener('click', function(){ openPop(b.dataset.ed); });
    });
    var ex = panel.querySelector('#annoExport');
    if(ex) ex.onclick = exportAll;
    var im = panel.querySelector('#annoImport');
    if(im) im.onclick = importAll;
    updateFab();
  }
  function gotoAnn(id){
    var m = box && box.querySelector('mark[data-anno="' + id + '"]');
    if(!m) return;
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.querySelectorAll('mark[data-anno="' + id + '"]').forEach(function(x){ x.classList.add('flashmk'); });
    setTimeout(function(){
      if(box) box.querySelectorAll('mark[data-anno="' + id + '"]').forEach(function(x){ x.classList.remove('flashmk'); });
    }, 1400);
  }

  // ----- import / export -----
  function exportAll(){
    var blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lire-marx-notes.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  }
  function importAll(){
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json';
    inp.onchange = function(){
      var f = inp.files && inp.files[0];
      if(!f) return;
      var fr = new FileReader();
      fr.onload = function(){
        try {
          var data = JSON.parse(fr.result);
          if(data && typeof data === 'object'){
            store = data;
            persist();
            if(user && curWork) pushAll(curWork);
            if(box){ clearMarks(); renderHighlights(); }
            renderPanel();
          } else alert('Format inattendu.');
        } catch(e){ alert('Fichier illisible.'); }
      };
      fr.readAsText(f);
    };
    inp.click();
  }

  // ===== Forum public par passage (5b) =====
  // Notes publiques ancrées (table `public_notes`) pour la section
  // courante. La modération (signalements, masquage) est différée à
  // la sous-mission 5c — pas de bouton « Signaler » ni de vue
  // modérateur ici.

  function fmtDate(ms){
    try { return new Date(ms).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }); }
    catch(e){ return ''; }
  }
  function isConfigured(){
    return !!(SHELL.auth && SHELL.auth.isConfigured && SHELL.auth.isConfigured());
  }
  function openAcctModal(){
    if(SHELL.auth && SHELL.auth.openModal) SHELL.auth.openModal();
  }
  function ensurePosterSilent(){
    return !!(sb && user && profile && profile.username);
  }
  function ensurePoster(){
    if(!isConfigured() || !sb){ toast('Le compte n\'est pas configuré.'); return false; }
    if(!user){ openAcctModal(); return false; }
    if(!(profile && profile.username)){
      toast('Choisis d\'abord un pseudo (Mon compte).');
      openAcctModal();
      return false;
    }
    return true;
  }

  async function loadPublic(workId, section){
    pubNotes = [];
    if(!sb || !workId){ renderPublic(); return; }
    try {
      var q = sb.from('public_notes')
        .select('id,author_id,section,before,quote,after,body,parent_id,hidden,created,profiles(username)')
        .eq('work', workId).eq('section', section);
      /* un modérateur voit aussi les notes masquées (rendues estompées),
         sinon il ne pourrait jamais les rétablir */
      if(!(window.SHELL && SHELL.mod && SHELL.mod.isMod())) q = q.eq('hidden', false);
      var res = await q.order('created', { ascending: true });
      if(res.error) throw res.error;
      var rows = res.data || [], tops = {}, reps = [];
      rows.forEach(function(r){
        r.author = (r.profiles && r.profiles.username) || '(compte supprimé)';
        if(r.parent_id){ reps.push(r); }
        else { r.replies = []; tops[r.id] = r; }
      });
      reps.forEach(function(r){ if(tops[r.parent_id]) tops[r.parent_id].replies.push(r); });
      pubNotes = Object.keys(tops).map(function(k){ return tops[k]; })
        .sort(function(a, b){ return a.created - b.created; });
    } catch(e){
      toast('Notes partagées : ' + ((e && e.message) || e));
    }
    renderPublic();
    updatePubFab();
  }

  async function addPublic(anchor, body){
    if(!ensurePoster()) return;
    body = (body || '').trim();
    if(!body){ toast('Écris ta note.'); return; }
    var row = {
      id: uid(), author_id: user.id,
      work: curWork, section: curSection,
      before: anchor.before, quote: anchor.quote, after: anchor.after,
      body: body, parent_id: null, created: Date.now()
    };
    var res = await sb.from('public_notes').insert(row);
    if(res.error){ toast('Publication : ' + res.error.message); return; }
    closePubCompose();
    ensurePubPanel();
    if(pubPanel.hidden){ pubPanel.hidden = false; if(panel) panel.hidden = true; }
    await loadPublic(curWork, curSection);
  }
  async function addReply(parentId, body){
    if(!ensurePoster()) return;
    body = (body || '').trim();
    if(!body) return;
    var row = {
      id: uid(), author_id: user.id,
      work: curWork, section: curSection,
      body: body, parent_id: parentId, created: Date.now()
    };
    var res = await sb.from('public_notes').insert(row);
    if(res.error){ toast('Réponse : ' + res.error.message); return; }
    replyOpen = null;
    await loadPublic(curWork, curSection);
  }
  /* ── signalement + modération ─────────────────────────────────── */
  var reportOpen = null;

  async function sendReport(id){
    if(!ensurePoster()) return;
    var ta = pubPanel && pubPanel.querySelector('.pub-rpta');
    var res = await SHELL.mod.report(id, ta ? ta.value : '');
    if(res.error){ toast('Signalement : ' + res.error.message); return; }
    reportOpen = null;
    toast('Merci — la note a été signalée à la modération.');
    renderPublic();
  }

  async function modToggle(id, to){
    var res = await SHELL.mod.setHidden(id, to === '1');
    if(res.error){ toast('Modération : ' + res.error.message); return; }
    toast(to === '1' ? 'Note masquée.' : 'Note rétablie.');
    await loadPublic(curWork, curSection);
  }

  async function delPublic(id){
    if(!sb || !user) return;
    var res = await sb.from('public_notes').delete().eq('id', id);
    if(res.error){ toast('Suppression : ' + res.error.message); return; }
    await loadPublic(curWork, curSection);
  }

  // flashAnchor : retrouve le passage par recherche de la citation
  // (court extrait + repli sur 16 caractères) dans les éléments de bloc
  // du conteneur, scroll dessus et fait clignoter une mise en avant.
  function flashAnchor(an){
    if(!box || !an || !an.quote) return;
    var probe = String(an.quote).replace(/\s+/g, ' ').trim().slice(0, 40);
    if(!probe) return;
    var els = box.querySelectorAll('p,h2,h3,h4,h5,li,blockquote');
    var target = null;
    for(var i = 0; i < els.length; i++){
      if(els[i].textContent.replace(/\s+/g, ' ').indexOf(probe) >= 0){ target = els[i]; break; }
    }
    if(!target && probe.length > 14){
      var short = probe.slice(0, 16);
      for(var j = 0; j < els.length; j++){
        if(els[j].textContent.replace(/\s+/g, ' ').indexOf(short) >= 0){ target = els[j]; break; }
      }
    }
    if(target){
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('pub-flash');
      setTimeout(function(){ target.classList.remove('pub-flash'); }, 1500);
    } else {
      toast('Passage introuvable dans cette section.');
    }
  }

  function shareFromSelection(){
    var r = selectionInBox();
    if(!r){ hideBar(); return; }
    var off = rangeOffsets(box, r);
    if(!off){ hideBar(); return; }
    var ctx = contextFor(box.textContent, off.start, off.end);
    var rect = null;
    try { rect = r.getBoundingClientRect(); } catch(e){}
    window.getSelection().removeAllRanges();
    hideBar();
    if(!ensurePoster()) return;
    openPubCompose(ctx, rect);
  }
  function openPubCompose(anchor, rect){
    if(!pubPop){
      pubPop = document.createElement('div');
      pubPop.className = 'pub-compose';
      document.body.appendChild(pubPop);
    }
    pubPop.innerHTML = '<div class="pub-q">« ' + esc(anchor.quote.slice(0, 160)) + (anchor.quote.length > 160 ? '…' : '') + ' »</div>'
      + '<textarea class="pub-ta" aria-label="Votre note publique sur ce passage" placeholder="Ta note publique sur ce passage…"></textarea>'
      + '<div class="pub-compose-act"><button class="lk" data-act="cancel" type="button">Annuler</button><button class="btn red" data-act="publish" type="button">Publier</button></div>';
    var top = window.scrollY + 120, left = window.scrollX + 20;
    if(rect){ top = window.scrollY + rect.bottom + 8; left = Math.max(8, window.scrollX + rect.left); }
    pubPop.style.display = 'block';
    pubPop.style.top = top + 'px';
    pubPop.style.left = left + 'px';
    var ta = pubPop.querySelector('.pub-ta');
    if(ta) ta.focus();
    pubPop.querySelector('[data-act="cancel"]').onclick = closePubCompose;
    pubPop.querySelector('[data-act="publish"]').onclick = function(){
      addPublic(anchor, ta ? ta.value : '');
    };
  }
  function closePubCompose(){ if(pubPop) pubPop.style.display = 'none'; }

  function pubStatusHtml(){
    if(!isConfigured()) return '<div class="np-acct"><span class="dot"></span>Notes partagées indisponibles (compte non configuré).</div>';
    if(!user) return '<div class="np-acct"><span class="dot"></span>Connecte-toi pour participer.<span style="margin-left:auto"></span><button class="lk" data-pa="login" type="button">Se connecter</button></div>';
    if(!(profile && profile.username)) return '<div class="np-acct"><span class="dot"></span>Choisis un pseudo pour publier.<span style="margin-left:auto"></span><button class="lk" data-pa="login" type="button">Mon compte</button></div>';
    return '<div class="np-acct on"><span class="dot"></span>Tu participes en tant que <b>' + esc(profile.username) + '</b>.</div>';
  }

  function noteBlockHtml(n){
    var mine = user && n.author_id === user.id;
    var isMod = !!(window.SHELL && SHELL.mod && SHELL.mod.isMod());
    var h = '<div class="pub-note' + (n.hidden ? ' pub-hiddennote' : '') + '" data-id="' + n.id + '">'
      + '<div class="pub-meta"><span class="pub-author">' + esc(n.author) + '</span>'
      + '<span class="pub-date">' + esc(fmtDate(n.created)) + '</span>'
      + (n.hidden ? '<span class="pub-hidden-tag">Masquée</span>' : '') + '</div>';
    if(n.quote){
      h += '<div class="pub-q" data-go="' + n.id + '">« ' + esc(n.quote.slice(0, 140)) + (n.quote.length > 140 ? '…' : '') + ' »</div>';
    }
    h += '<div class="pub-body">' + esc(n.body) + '</div>';
    h += '<div class="pub-acts">'
      + '<button class="lk" data-go="' + n.id + '" type="button">Aller au passage</button>'
      + '<button class="lk" data-reply="' + n.id + '" type="button">Répondre' + (n.replies && n.replies.length ? ' (' + n.replies.length + ')' : '') + '</button>'
      + (mine ? '<button class="lk" data-del="' + n.id + '" type="button">Supprimer</button>' : '')
      + (!mine ? '<button class="lk" data-report="' + n.id + '" type="button">Signaler</button>' : '')
      + (isMod ? '<button class="lk" data-mod="' + n.id + '" data-mod-to="' + (n.hidden ? '0' : '1') + '" type="button">' + (n.hidden ? 'Rétablir' : 'Masquer') + '</button>' : '')
      + '</div>';
    if(reportOpen === n.id){
      h += '<div class="pub-replybox"><textarea class="pub-rpta" aria-label="Motif du signalement (facultatif)" placeholder="Pourquoi signaler cette note ? (facultatif)"></textarea>'
        + '<div class="pub-compose-act"><button class="lk" data-reportcancel="1" type="button">Annuler</button>'
        + '<button class="btn red" data-sendreport="' + n.id + '" type="button">Signaler</button></div></div>';
    }
    if(n.replies && n.replies.length){
      h += '<div class="pub-replies">';
      n.replies.forEach(function(r){
        var rm = user && r.author_id === user.id;
        h += '<div class="pub-reply' + (r.hidden ? ' pub-hiddennote' : '') + '"><div class="pub-meta"><span class="pub-author">' + esc(r.author) + '</span><span class="pub-date">' + esc(fmtDate(r.created)) + '</span>'
          + (r.hidden ? '<span class="pub-hidden-tag">Masquée</span>' : '') + '</div>'
          + '<div class="pub-body">' + esc(r.body) + '</div>'
          + '<div class="pub-acts">' + (rm ? '<button class="lk" data-del="' + r.id + '" type="button">Supprimer</button>' : '')
          + (!rm ? '<button class="lk" data-report="' + r.id + '" type="button">Signaler</button>' : '')
          + (isMod ? '<button class="lk" data-mod="' + r.id + '" data-mod-to="' + (r.hidden ? '0' : '1') + '" type="button">' + (r.hidden ? 'Rétablir' : 'Masquer') + '</button>' : '')
          + '</div></div>';
        if(reportOpen === r.id){
          h += '<div class="pub-replybox"><textarea class="pub-rpta" aria-label="Motif du signalement (facultatif)" placeholder="Pourquoi signaler cette note ? (facultatif)"></textarea>'
            + '<div class="pub-compose-act"><button class="lk" data-reportcancel="1" type="button">Annuler</button>'
            + '<button class="btn red" data-sendreport="' + r.id + '" type="button">Signaler</button></div></div>';
        }
      });
      h += '</div>';
    }
    if(replyOpen === n.id){
      h += '<div class="pub-replybox"><textarea class="pub-rta" aria-label="Votre réponse" placeholder="Ta réponse…"></textarea><div class="pub-compose-act"><button class="lk" data-replycancel="1" type="button">Annuler</button><button class="btn red" data-sendreply="' + n.id + '" type="button">Répondre</button></div></div>';
    }
    h += '</div>';
    return h;
  }

  function ensurePubPanel(){
    if(pubPanel) return pubPanel;
    pubPanel = document.createElement('div');
    pubPanel.id = 'publicPanel';
    pubPanel.className = 'notes-panel pub-panel';
    pubPanel.hidden = true;
    document.body.appendChild(pubPanel);
    return pubPanel;
  }
  function ensurePubFab(){
    if(pubFab) return pubFab;
    pubFab = document.createElement('button');
    pubFab.type = 'button';
    pubFab.id = 'pubFab';
    pubFab.className = 'notes-fab notes-fab-pub';
    pubFab.textContent = 'Notes partagées';
    pubFab.addEventListener('click', function(){
      ensurePubPanel();
      if(pubPanel.hidden){ renderPublic(); pubPanel.hidden = false; if(panel) panel.hidden = true; }
      else pubPanel.hidden = true;
    });
    document.body.appendChild(pubFab);
    return pubFab;
  }
  function updatePubFab(){
    if(!pubFab) return;
    pubFab.textContent = pubNotes.length ? ('Notes partagées · ' + pubNotes.length) : 'Notes partagées';
  }

  function renderPublic(){
    ensurePubPanel();
    if(!pubPanel) return;
    var h = '<div class="np-head"><b>Notes partagées</b>'
      + (curLabel ? ' · <span class="np-sec">' + esc(curLabel) + '</span>' : '')
      + ' <span class="np-n">' + pubNotes.length + '</span>'
      + '<span class="np-tools"><button class="lk" id="pubClose" type="button">Fermer</button></span></div>'
      + pubStatusHtml();
    if(ensurePosterSilent()){
      h += '<div class="pub-hint">Sélectionne un passage du texte, puis « Partager » pour ouvrir une note publique.</div>';
    }
    if(!pubNotes.length){
      h += '<div class="pub-empty">Aucune note partagée sur cette section pour l’instant.</div>';
    } else {
      pubNotes.forEach(function(n){ h += noteBlockHtml(n); });
    }
    pubPanel.innerHTML = h;
    var cl = pubPanel.querySelector('#pubClose');
    if(cl) cl.onclick = function(){ pubPanel.hidden = true; };
    pubPanel.querySelectorAll('[data-pa="login"]').forEach(function(b){ b.onclick = function(){ openAcctModal(); }; });
    pubPanel.querySelectorAll('[data-go]').forEach(function(b){
      b.onclick = function(){
        var n = pubNotes.find(function(x){ return x.id === b.dataset.go; });
        if(n) flashAnchor(n);
      };
    });
    pubPanel.querySelectorAll('[data-reply]').forEach(function(b){
      b.onclick = function(){
        replyOpen = (replyOpen === b.dataset.reply) ? null : b.dataset.reply;
        renderPublic();
        var ta = pubPanel.querySelector('.pub-rta');
        if(ta) ta.focus();
      };
    });
    pubPanel.querySelectorAll('[data-replycancel]').forEach(function(b){
      b.onclick = function(){ replyOpen = null; renderPublic(); };
    });
    pubPanel.querySelectorAll('[data-sendreply]').forEach(function(b){
      b.onclick = function(){
        var ta = pubPanel.querySelector('.pub-rta');
        addReply(b.dataset.sendreply, ta ? ta.value : '');
      };
    });
    pubPanel.querySelectorAll('[data-del]').forEach(function(b){
      b.onclick = function(){ delPublic(b.dataset.del); };
    });
    pubPanel.querySelectorAll('[data-report]').forEach(function(b){
      b.onclick = function(){
        if(!ensurePoster()) return;
        reportOpen = (reportOpen === b.dataset.report) ? null : b.dataset.report;
        replyOpen = null;
        renderPublic();
        var ta = pubPanel.querySelector('.pub-rpta');
        if(ta) ta.focus();
      };
    });
    pubPanel.querySelectorAll('[data-reportcancel]').forEach(function(b){
      b.onclick = function(){ reportOpen = null; renderPublic(); };
    });
    pubPanel.querySelectorAll('[data-sendreport]').forEach(function(b){
      b.onclick = function(){ sendReport(b.dataset.sendreport); };
    });
    pubPanel.querySelectorAll('[data-mod]').forEach(function(b){
      b.onclick = function(){ modToggle(b.dataset.mod, b.dataset.modTo); };
    });
  }

  // ----- contrat de deep-link au passage (#note=<id> ou #s=&q=) -----
  // SHELL.commune (Place publique) et SHELL.social (notifications)
  // ajoutent `#note=<id>` au lien d'ouverture de l'œuvre. Au chargement
  // de la page, on parse le hash et on garde la cible en attente :
  //   - si #note=<id> : on fetch la ligne public_notes pour récupérer
  //     section, quote, before, after — ce qui permet à la page de
  //     livre de savoir quelle section ouvrir avant d'appeler attach.
  //   - quand attach() est appelée avec la bonne section : on appelle
  //     flashAnchor sur le passage.
  function parseDeepLink(){
    var h = location.hash || '';
    if(!h) return null;
    if(h.charAt(0) === '#') h = h.slice(1);
    if(!h) return null;
    var out = {};
    h.split('&').forEach(function(p){
      var eq = p.indexOf('=');
      if(eq < 0) return;
      var k = decodeURIComponent(p.slice(0, eq));
      var v = decodeURIComponent(p.slice(eq + 1));
      out[k] = v;
    });
    if(out.note) return { noteId: out.note };
    if(out.s || out.q){
      return {
        section: out.s ? +out.s : null,
        quote:   out.q || '',
        before:  out.b || '',
        after:   out.a || ''
      };
    }
    return null;
  }
  async function resolveDeepLink(workId){
    if(pendingDeepLinkConsumed) return pendingDeepLink;
    var dl = pendingDeepLink;
    if(!dl) return null;
    // Si c'est un noteId nu, on fetch la ligne pour enrichir.
    if(dl.noteId && dl.section == null){
      try {
        if(!sb && SHELL.auth) sb = await SHELL.auth.getClient();
        if(!sb) return null;
        var res = await sb.from('public_notes')
          .select('id,work,section,before,quote,after,parent_id')
          .eq('id', dl.noteId).maybeSingle();
        if(res.error || !res.data) return null;
        var note = res.data;
        // Si c'est une réponse (parent_id présent, quote vide), on
        // remonte au parent pour récupérer l'ancre du passage.
        if(note.parent_id && !note.quote){
          try {
            var parent = await sb.from('public_notes')
              .select('id,work,section,before,quote,after')
              .eq('id', note.parent_id).maybeSingle();
            if(parent && parent.data){
              note = {
                id: note.id,
                work: parent.data.work || note.work,
                section: parent.data.section != null ? parent.data.section : note.section,
                before: parent.data.before || '',
                quote: parent.data.quote || '',
                after: parent.data.after || ''
              };
            }
          } catch(e){}
        }
        // Alias hérité : la ligne peut avoir work='capital' et viser
        // workId='capital-1' (ou vice versa).
        if(workId && note.work && note.work !== workId){
          var ok = (note.work === 'capital' && workId === 'capital-1')
                || (note.work === 'capital-1' && workId === 'capital');
          if(!ok) return null;
        }
        pendingDeepLink = {
          noteId: note.id,
          section: +note.section || null,
          quote:   note.quote || '',
          before:  note.before || '',
          after:   note.after || ''
        };
      } catch(e){ return null; }
    }
    return pendingDeepLink;
  }
  function applyDeepLinkOnAttach(workId, section){
    if(!pendingDeepLink || pendingDeepLinkConsumed) return;
    var dl = pendingDeepLink;
    if(dl.section != null && dl.section !== section) return;
    if(!dl.quote) return;
    pendingDeepLinkConsumed = true;
    pendingDeepLink = null;
    // léger délai pour laisser les highlights / le DOM finir de poser
    setTimeout(function(){
      if(box) flashAnchor({ quote: dl.quote, before: dl.before, after: dl.after });
    }, 220);
  }

  // ----- contrat liseuse : SHELL.reader.attach -----
  function attach(opts){
    opts = opts || {};
    var workId = opts.workId;
    var section = +opts.section || 0;
    var container = opts.container;
    var label = opts.sectionLabel || '';
    if(!workId || !container) return;
    // change de contexte : on ferme les popovers en cours
    closePop();
    hideBar();
    curWork = workId;
    curSection = section;
    curLabel = label;
    box = container;
    /* Filet : le mode lecture est normalement posé par reader-tools au
       montage de sa barre. Une liseuse déclarée sans lui laisserait les
       deux pastilles de notes invisibles — c'est le CSS qui les gate. */
    if(container.getClientRects().length) document.body.classList.add('at-reading');
    ensureFab();
    ensurePubFab();
    // setTimeout(0) : laisse la page hôte finir ses mises à jour DOM
    // avant qu'on insère les marks (sinon une rerender peut les écraser).
    setTimeout(function(){
      if(box !== container) return; // race : un attach plus récent a pris la main
      clearMarks();
      renderHighlights();
      updateFab();
      if(panel && !panel.hidden) renderPanel();
      // premier accès à cette œuvre + utilisateur connecté → pullAll
      if(user && !pulledWorks[workId]) pullAll(workId);
      // 5b : recharger les notes publiques de la section + appliquer
      // le deep-link en attente (Place publique / notifications).
      loadPublic(workId, section);
      applyDeepLinkOnAttach(workId, section);
      ensurePolling();
    }, 0);
  }

  // Polling de secours toutes les 30 s pour rafraîchir les notes
  // partagées de la section ouverte (en attendant un realtime dédié).
  function ensurePolling(){
    if(pubPoll) return;
    pubPoll = setInterval(function(){
      if(!curWork || !box) return;
      if(pubPanel && !pubPanel.hidden) loadPublic(curWork, curSection);
    }, 30000);
  }

  // ----- événements globaux (sélection / clic mark / Échap) -----
  function wireGlobalEvents(){
    document.addEventListener('mouseup', function(e){
      if(e.target.closest && e.target.closest('.anno-bar,.anno-pop')) return;
      setTimeout(onSelect, 0);
    });
    /* Une sélection faite au clavier (Maj + flèches) ne produit JAMAIS de
       mouseup : la barre de surlignage n'apparaissait pas, et annoter —
       la fonction centrale du site — était impossible sans souris.
       selectionchange couvre les deux gestes ; il est très bavard, donc
       amorti. WCAG 2.1.1. */
    var selT = null;
    document.addEventListener('selectionchange', function(){
      clearTimeout(selT);
      selT = setTimeout(function(){
        var a = document.activeElement;
        if(a && a.closest && a.closest('.anno-bar,.anno-pop,.pub-compose')) return;
        if(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
        onSelect();
      }, 180);
    });
    /* Ouvrir une note existante au clavier. */
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Enter' && e.key !== ' ') return;
      var m = document.activeElement;
      if(!m || !m.classList || !m.classList.contains('anno')) return;
      if(!box || !box.contains(m)) return;
      e.preventDefault();
      openPop(m.dataset.anno);
    });
    document.addEventListener('mousedown', function(e){
      var t = e.target;
      if(!(t.closest && t.closest('.anno-bar,.anno-pop,mark.anno'))) closePop();
      if(!(t.closest && t.closest('.anno-bar,.pub-compose'))) closePubCompose();
    });
    document.addEventListener('click', function(e){
      var m = e.target.closest && e.target.closest('mark.anno');
      if(m && box && box.contains(m)){
        e.preventDefault();
        openPop(m.dataset.anno);
      }
    });
    window.addEventListener('scroll', hideBar, { passive: true });
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      if(pubPop && pubPop.style.display !== 'none'){ closePubCompose(); return; }
      if(pop && pop.style.display !== 'none'){ closePop(); return; }
      if(pubPanel && !pubPanel.hidden){ pubPanel.hidden = true; return; }
      if(panel && !panel.hidden){ panel.hidden = true; }
    });
  }

  // ----- init + branchement sur SHELL.auth -----
  async function _init(){
    if(initialized) return;
    initialized = true;
    wireGlobalEvents();
    if(SHELL.auth){
      try { sb = await SHELL.auth.getClient(); } catch(e){ sb = null; }
      user = SHELL.auth.user || null;
      profile = SHELL.auth.profile || null;
    }
    if(user && curWork && !pulledWorks[curWork]) pullAll(curWork);
    if(SHELL.auth && SHELL.auth.onChange){
      SHELL.auth.onChange(function(ctx){
        var wasUser = user;
        user = (ctx && ctx.user) || null;
        profile = (ctx && ctx.profile) || null;
        if(!sb && SHELL.auth.getClient){
          SHELL.auth.getClient().then(function(c){
            sb = c;
            if(user && curWork && !pulledWorks[curWork]) pullAll(curWork);
          });
          return;
        }
        if(user && curWork && !pulledWorks[curWork]) pullAll(curWork);
        // À la déconnexion : on garde le store local intact mais on
        // efface la trace « déjà pull » pour qu'une re-connexion
        // déclenche un nouveau pullAll + migration éventuelle.
        if(!user && wasUser){ pulledWorks = {}; }
      });
    }
  }

  // Lit le deep-link immédiatement au chargement du module : ainsi la
  // page de livre peut appeler SHELL.reader.resolveDeepLink(workId)
  // dès son init() pour savoir quelle section ouvrir.
  pendingDeepLink = parseDeepLink();

  // Sur hashchange (clic sur une notification quand on est déjà sur la
  // page d'œuvre cible), on re-parse le hash et réinitialise l'état de
  // consommation pour qu'un nouveau resolveDeepLink + applyDeepLinkOnAttach
  // fonctionne. La page d'œuvre est responsable de réécouter hashchange
  // de son côté pour relancer son aiguillage (activer l'onglet "lire",
  // sélectionner le chapitre, déclencher le chargement du texte).
  window.addEventListener('hashchange', function(){
    pendingDeepLink = parseDeepLink();
    pendingDeepLinkConsumed = false;
  });

  // ----- API exposée -----
  SHELL.annotations = {
    _init: _init,
    pullAll: pullAll,
    exportAll: exportAll,
    importAll: importAll,
    // forum (5b)
    loadPublic: function(){ return loadPublic(curWork, curSection); },
    flashAnchor: flashAnchor
  };
  SHELL.reader = SHELL.reader || {};
  SHELL.reader.attach = attach;
  // Contrat de deep-link : la page lit la cible (synchrone si #s=&q=,
  // asynchrone si #note=<id> car il faut fetch la ligne pour récupérer
  // section + quote), puis ouvre la bonne section. attach() finit le
  // travail (flashAnchor au passage).
  SHELL.reader.parseDeepLink = function(){ return pendingDeepLink; };
  SHELL.reader.resolveDeepLink = resolveDeepLink;

  /* Le statut modérateur arrive en différé (fetch après connexion) : quand
     il tombe, on recharge la section courante pour faire apparaître les
     notes masquées et les actions de modération dans un panneau déjà
     ouvert. */
  if(window.SHELL && SHELL.mod && SHELL.mod.onChange){
    SHELL.mod.onChange(function(){ if(curWork) loadPublic(curWork, curSection); });
  }
})();

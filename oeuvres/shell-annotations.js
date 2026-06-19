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
    var h = '<span class="anno-bar-l">Surligner</span>';
    COLORS.forEach(function(c){
      h += '<button class="anno-sw c-' + c[0] + '" data-c="' + c[0] + '" title="' + c[1] + '" type="button"></button>';
    });
    bar.innerHTML = h;
    bar.addEventListener('mousedown', function(e){ e.preventDefault(); });
    bar.addEventListener('click', function(e){
      var c = e.target.closest && e.target.closest('[data-c]');
      if(c) addFromSelection(c.dataset.c);
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
      + '<textarea class="anno-pop-t" placeholder="Ta note…">' + esc(an.note || '') + '</textarea>'
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
    ensureFab();
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
    }, 0);
  }

  // ----- événements globaux (sélection / clic mark / Échap) -----
  function wireGlobalEvents(){
    document.addEventListener('mouseup', function(e){
      if(e.target.closest && e.target.closest('.anno-bar,.anno-pop')) return;
      setTimeout(onSelect, 0);
    });
    document.addEventListener('mousedown', function(e){
      var t = e.target;
      if(!(t.closest && t.closest('.anno-bar,.anno-pop,mark.anno'))) closePop();
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
      if(pop && pop.style.display !== 'none'){ closePop(); return; }
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

  // ----- API exposée -----
  SHELL.annotations = {
    _init: _init,
    pullAll: pullAll,
    exportAll: exportAll,
    importAll: importAll
  };
  SHELL.reader = SHELL.reader || {};
  SHELL.reader.attach = attach;
})();

// shell-progress.js — SHELL.progress
// Suivi de progression de lecture, backée par la table Supabase `reading_progress`.
// Chaque page de livre appelle SHELL.progress.init(workId, onUpdate) une fois.
(function(){
  var SHELL = window.SHELL = window.SHELL || {};
  if(SHELL.progress) return;

  var _workId   = null;
  var _cache    = new Set(); // sections (integers) marquées comme lues
  var _loggedIn = false;
  var _listeners = [];

  function _emit(){
    var i = _listeners.length;
    while(i--){ try{ _listeners[i](); }catch(e){} }
  }

  async function _load(){
    if(!_workId) return;
    var auth = window.SHELL && window.SHELL.auth;
    _loggedIn = !!(auth && auth.user);
    if(!_loggedIn){ _cache = new Set(); _emit(); return; }
    var c = (auth.getClient ? await auth.getClient() : null);
    if(!c){ _cache = new Set(); _emit(); return; }
    try {
      var res = await c.from('reading_progress')
        .select('section').eq('work', _workId);
      _cache = new Set((res.data || []).map(function(r){ return r.section; }));
    } catch(e){}
    _emit();
  }

  // init — se branche sur auth.onChange pour réagir aux connexions/déconnexions.
  // onUpdate est appelé à chaque changement d'état (connexion, progress, déco).
  function init(workId, onUpdate){
    _workId = workId;
    if(typeof onUpdate === 'function') _listeners.push(onUpdate);
    var auth = window.SHELL && window.SHELL.auth;
    if(auth && auth.onChange){
      auth.onChange(function(ctx){
        var nowLogged = !!(ctx && ctx.user);
        // Déclencher _load si l'état d'authentification change
        if(nowLogged !== _loggedIn){ _load(); }
      });
    }
  }

  async function markDone(section){
    var auth = window.SHELL && window.SHELL.auth;
    if(!auth || !auth.user) return false;
    var c = (auth.getClient ? await auth.getClient() : null);
    if(!c) return false;
    // Mise à jour optimiste : répondre immédiatement
    var already = _cache.has(section);
    if(!already){ _cache.add(section); _emit(); }
    try {
      var res = await c.from('reading_progress')
        .upsert({ work: _workId, section: section },
                { onConflict: 'user_id,work,section' });
      if(res.error && !already){ _cache.delete(section); _emit(); return false; }
    } catch(e){ if(!already){ _cache.delete(section); _emit(); } return false; }
    return true;
  }

  async function markUndone(section){
    var auth = window.SHELL && window.SHELL.auth;
    if(!auth || !auth.user) return false;
    var c = (auth.getClient ? await auth.getClient() : null);
    if(!c) return false;
    // Mise à jour optimiste
    var wasIn = _cache.has(section);
    if(wasIn){ _cache.delete(section); _emit(); }
    try {
      var res = await c.from('reading_progress')
        .delete().eq('work', _workId).eq('section', section);
      if(res.error && wasIn){ _cache.add(section); _emit(); return false; }
    } catch(e){ if(wasIn){ _cache.add(section); _emit(); } return false; }
    return true;
  }

  function toggle(section){
    return _cache.has(section) ? markUndone(section) : markDone(section);
  }

  function has(section)  { return _cache.has(section); }
  function getSet()      { return _cache; }
  function count()       { return _cache.size; }
  function isLoggedIn()  { return _loggedIn; }

  function promptLogin(){
    var auth = window.SHELL && window.SHELL.auth;
    if(auth && auth.openModal) auth.openModal();
  }

  function onChange(cb){
    if(typeof cb === 'function') _listeners.push(cb);
  }

  SHELL.progress = {
    init:        init,
    markDone:    markDone,
    markUndone:  markUndone,
    toggle:      toggle,
    has:         has,
    getSet:      getSet,
    count:       count,
    isLoggedIn:  isLoggedIn,
    promptLogin: promptLogin,
    onChange:    onChange
  };
})();

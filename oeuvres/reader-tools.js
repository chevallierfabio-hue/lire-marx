(function(){
  if(window.Reading) return;
  var SKEY='liremarx.read.v1';
  var DEF={theme:'paper',fs:1.04,lh:1.72,width:760,align:'justify',dys:false,focus:false,rate:1,voice:'',gloss:false};
  var S=loadS();
  function loadS(){try{var o=JSON.parse(localStorage.getItem(SKEY)||'{}');return Object.assign({},DEF,o);}catch(e){return Object.assign({},DEF);}}
  function saveS(){try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
  function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}


  var fontInjected=false;
  function ensureFont(){ if(fontInjected)return; fontInjected=true;
    var l=document.createElement('link'); l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap';
    document.head.appendChild(l); }

  /* ---- état ---- */
  var cur=null;            // {readerEl, ws, num, n, title, paras:[]}
  var synth=('speechSynthesis' in window)?window.speechSynthesis:null;
  var voices=[];
  function loadVoices(){ if(!synth)return; try{voices=synth.getVoices()||[];}catch(e){voices=[];} }
  if(synth){ loadVoices(); try{ synth.onvoiceschanged=function(){ loadVoices(); if(cur)renderVoiceSelect(); }; }catch(e){} }
  function frVoices(){ return voices.filter(function(v){return /^fr/i.test(v.lang);}); }

  var A={playing:false,stopping:false,queue:null,qi:0,curpi:-1};

  /* ---- application des réglages ---- */
  function applyTo(r){
    if(!r)return;
    r.classList.add('rd-on');
    r.classList.remove('theme-paper','theme-sepia','theme-dark','align-left','font-dys','focus-on');
    r.classList.add('theme-'+S.theme);
    if(S.align==='left') r.classList.add('align-left');
    if(S.dys){ ensureFont(); r.classList.add('font-dys'); }
    if(S.focus) r.classList.add('focus-on');
    r.style.setProperty('--rd-fs', S.fs.toFixed(2)+'rem');
    r.style.setProperty('--rd-lh', S.lh.toFixed(2));
    r.style.maxWidth = S.width+'px';
  }

  /* ---- audio ---- */
  function clearSpeak(){ if(cur&&cur.ws) cur.ws.querySelectorAll('p.rd-speak').forEach(function(p){p.classList.remove('rd-speak');}); }
  function clearSent(){
    if(!cur||!cur.ws)return;
    cur.ws.querySelectorAll('span.rd-sent-on').forEach(function(s){
      var p=s.parentNode; if(!p)return; while(s.firstChild)p.insertBefore(s.firstChild,s); p.removeChild(s);
    });
    try{cur.ws.normalize();}catch(e){}
  }
  function wrapRangeIn(p,start,end,cls){
    var w=document.createTreeWalker(p,window.NodeFilter.SHOW_TEXT,null), n, pos=0, snap=[];
    while(n=w.nextNode()){ snap.push({node:n,pos:pos}); pos+=n.nodeValue.length; }
    var made=[];
    snap.forEach(function(it){
      var len=it.node.nodeValue.length, a=it.pos, b=it.pos+len;
      var s=Math.max(start,a)-a, e=Math.min(end,b)-a;
      if(e<=s)return;
      var node=it.node;
      if(s>0)node=node.splitText(s);
      if(e-s<node.nodeValue.length)node.splitText(e-s);
      var span=document.createElement('span'); span.className=cls;
      node.parentNode.insertBefore(span,node); span.appendChild(node);
      made.push(span);
    });
    return made;
  }
  function voiceScore(v){
    var n=(v.name||'').toLowerCase(), s=0;
    if(/google/.test(n)) s+=120;
    if(/siri/.test(n)) s+=95;
    if(/natural|neural|wavenet|studio|premium|enhanced|amélior/.test(n)) s+=80;
    if(v.localService===false) s+=60;            // voix « en ligne » = en général bien plus naturelles
    if(/thomas|aurélie|amélie|audrey|marie|julie|paul|hortense|chantal|nicolas/.test(n)) s+=25;
    if(/^fr-fr/i.test(v.lang||'')) s+=10;
    if(/compact|eloquence|espeak|pico|robot/.test(n)) s-=70;  // voix locales très synthétiques
    return s;
  }
  function bestVoice(){
    var fv=frVoices(); if(!fv.length)return null;
    return fv.slice().sort(function(a,b){return voiceScore(b)-voiceScore(a);})[0];
  }
  function pickVoice(){
    if(S.voice){ var m=voices.filter(function(v){return v.voiceURI===S.voice||v.name===S.voice;})[0]; if(m)return m; }
    return bestVoice();
  }
  function buildQueue(){
    var q=[];
    cur.paras.forEach(function(p,pi){
      var raw=p.textContent||''; if(!raw.trim())return;
      var re=/[^.!?…]+[.!?…]+|[^.!?…]+$/g, mm;
      while((mm=re.exec(raw))){
        var txt=mm[0].replace(/\s+/g,' ').trim();
        if(txt) q.push({pi:pi,start:mm.index,end:mm.index+mm[0].length,text:txt});
      }
    });
    return q;
  }
  function speakNext(){
    if(!A.playing) return;
    if(!synth||!cur||A.qi>=A.queue.length){ stopAudio(); return; }
    var item=A.queue[A.qi];
    var p=cur.paras[item.pi];
    if(item.pi!==A.curpi){ A.curpi=item.pi; clearSpeak(); if(p)p.classList.add('rd-speak'); }
    clearSent();
    var made = p ? wrapRangeIn(p,item.start,item.end,'rd-sent-on') : [];
    if(made[0]){ try{made[0].scrollIntoView({behavior:'smooth',block:'center'});}catch(e){} }
    var u=new window.SpeechSynthesisUtterance(item.text);
    u.lang='fr-FR'; var v=pickVoice(); if(v)u.voice=v; u.rate=S.rate;
    u.onend=function(){ if(A.stopping){A.stopping=false;return;} if(A.playing){ A.qi++; speakNext(); } };
    u.onerror=function(){ if(A.playing){ A.qi++; speakNext(); } };
    A.stopping=false; try{synth.speak(u);}catch(e){}
  }
  function playAudio(){
    if(!synth||!cur)return;
    if(A.playing)return;
    if(!A.queue||!A.queue.length){ A.queue=buildQueue(); A.qi=0; A.curpi=-1; }
    if(!A.queue.length)return;
    A.playing=true; speakNext(); setAudioBtn();
  }
  function pauseAudio(){ A.playing=false; A.stopping=true; try{if(synth)synth.cancel();}catch(e){} clearSent(); setAudioBtn(); }
  function stopAudio(){ A.playing=false; A.stopping=true; A.queue=null; A.qi=0; A.curpi=-1; try{if(synth)synth.cancel();}catch(e){} clearSent(); clearSpeak(); setAudioBtn(); }
  function setAudioBtn(){
    if(!cur)return; var b=cur.readerEl.querySelector('[data-rd="audio"]'); if(!b)return;
    b.textContent = A.playing ? '⏸ Pause' : '▶ Écouter';
    b.classList.toggle('on', A.playing);
  }

  /* ---- progression ---- */
  function updateProgress(){
    if(!cur||!cur.ws)return;
    var bar=cur.readerEl.querySelector('.rd-progress > i'); if(!bar)return;
    var rect=cur.ws.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight;
    var total=rect.height-vh;
    var done = total>0 ? (-rect.top)/total : (rect.bottom<=vh?1:0);
    done=Math.max(0,Math.min(1,done));
    bar.style.width=(done*100).toFixed(1)+'%';
  }
  window.addEventListener('scroll',updateProgress,{passive:true});
  window.addEventListener('resize',updateProgress,{passive:true});

  /* ---- sommaire ---- */
  function ensureHeadingIds(ws){ var i=0; ws.querySelectorAll('h2,h3,h4').forEach(function(h){ if(!h.id) h.id='rdh-'+(i++); }); }
  function tocHtml(ws){
    var hs=ws.querySelectorAll('h2,h3,h4');
    if(!hs.length) return '<div class="rd-note">Pas de sous-parties détectées dans ce chapitre.</div>';
    var h='<div class="rd-toclist">';
    hs.forEach(function(x){ var txt=(x.textContent||'').trim(); if(!txt)return;
      h+='<button class="rd-tocitem rd-'+x.tagName.toLowerCase()+'" data-goto="'+x.id+'">'+esc(txt)+'</button>'; });
    return h+'</div>';
  }

  /* ---- navigation chapitre ---- */
  function navChap(delta){
    var s=document.getElementById('chapSelect'); if(!s)return;
    var i=s.selectedIndex+delta; if(i<0||i>=s.options.length)return;
    s.selectedIndex=i; stopAudio();
    try{ showSelection(true); }catch(e){}
  }

  /* ---- popovers ---- */
  function togglePop(r,name){
    var opening=false;
    r.querySelectorAll('.rd-pop').forEach(function(p){
      if(p.getAttribute('data-pop')===name){ opening=p.hidden; p.hidden=!p.hidden; }
      else p.hidden=true;
    });
    r.querySelectorAll('.rd-row [data-rd]').forEach(function(b){
      var nm=b.getAttribute('data-rd');
      if(nm==='audio'||nm==='gloss')return; // états "on" persistants (lecture / glossaire actif)
      b.classList.toggle('on', nm===name && opening);
    });
  }

  /* ---- panneau Réglages (re-rendu à chaque changement) ---- */
  function renderSet(r){
    var box=r.querySelector('[data-pop="set"]'); if(!box)return;
    function seg(name,opts){ // opts: [[val,label],...]
      return '<div class="rd-seg">'+opts.map(function(o){
        return '<button data-set="'+name+'" data-v="'+o[0]+'"'+((''+stateVal(name))===(''+o[0])?' class="on"':'')+'>'+o[1]+'</button>';
      }).join('')+'</div>';
    }
    function stepRow(lab,name,disp){
      return '<div class="rd-setrow"><span class="lab">'+lab+'</span><span class="rd-step">'
        +'<button class="rd-mini" data-dec="'+name+'">−</button>'
        +'<span class="rd-val">'+disp+'</span>'
        +'<button class="rd-mini" data-inc="'+name+'">+</button></span></div>';
    }
    function stateVal(n){ return n==='theme'?S.theme : n==='align'?S.align : n==='dys'?(S.dys?1:0) : n==='focus'?(S.focus?1:0) : ''; }
    var h='<h5>Réglages de lecture</h5>';
    h+='<div class="rd-setrow"><span class="lab">Thème</span>'+seg('theme',[['paper','Papier'],['sepia','Sépia'],['dark','Sombre']])+'</div>';
    h+=stepRow('Taille du texte','fs',Math.round(S.fs*100/1.04)+' %');
    h+=stepRow('Interligne','lh',S.lh.toFixed(2));
    h+=stepRow('Largeur','width',S.width+' px');
    h+='<div class="rd-setrow"><span class="lab">Alignement</span>'+seg('align',[['justify','Justifié'],['left','À gauche']])+'</div>';
    h+='<div class="rd-setrow"><span class="lab">Police lisible</span>'+seg('dys',[['0','Standard'],['1','Atkinson']])+'</div>';
    h+='<div class="rd-setrow"><span class="lab">Mode focus</span>'+seg('focus',[['0','Off'],['1','On']])+'</div>';
    h+='<div class="rd-note">Le mode focus estompe tout sauf le paragraphe survolé (ou lu à voix haute). Réglages mémorisés sur cet appareil.</div>';
    box.innerHTML=h;
    box.querySelectorAll('[data-set]').forEach(function(b){ b.onclick=function(){
      var n=b.getAttribute('data-set'), v=b.getAttribute('data-v');
      if(n==='theme')S.theme=v; else if(n==='align')S.align=v;
      else if(n==='dys')S.dys=(v==='1'); else if(n==='focus')S.focus=(v==='1');
      saveS(); applyTo(r); renderSet(r);
    };});
    box.querySelectorAll('[data-dec],[data-inc]').forEach(function(b){ b.onclick=function(){
      var inc=b.hasAttribute('data-inc'); var n=b.getAttribute(inc?'data-inc':'data-dec');
      if(n==='fs')   S.fs=clamp(+(S.fs+(inc?0.06:-0.06)).toFixed(2),0.85,1.6);
      if(n==='lh')   S.lh=clamp(+(S.lh+(inc?0.08:-0.08)).toFixed(2),1.3,2.2);
      if(n==='width')S.width=clamp(S.width+(inc?60:-60),560,1040);
      saveS(); applyTo(r); renderSet(r); updateProgress();
    };});
  }
  function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }

  /* ---- voix ---- */
  function renderVoiceSelect(){
    if(!cur)return; var box=cur.readerEl.querySelector('[data-pop="audio"] .rd-vwrap'); if(!box)return;
    if(!synth){ box.innerHTML='<div class="rd-note">La synthèse vocale n’est pas disponible dans ce navigateur.</div>'; return; }
    var fv=frVoices().slice().sort(function(a,b){return voiceScore(b)-voiceScore(a);});
    var best=fv[0];
    var auto = best ? ('Auto — la plus naturelle : '+best.name+(best.localService===false?' (en ligne)':'')) : 'Voix par défaut';
    var opts='<option value="">'+esc(auto)+'</option>';
    fv.forEach(function(v){ opts+='<option value="'+esc(v.voiceURI||v.name)+'"'+((S.voice===(v.voiceURI||v.name))?' selected':'')+'>'+esc(v.name)+(v.localService===false?' · en ligne':'')+'</option>'; });
    var warn = fv.length
      ? '<div class="rd-note">La voix la plus humaine est choisie automatiquement. Les voix « en ligne » (Google sur Chrome, Siri/améliorées sur Mac et iPhone) sont de loin les plus naturelles — c’est dans Chrome que le français sonne le mieux.</div>'
      : '<div class="rd-note">Aucune voix française détectée : ouvre le fichier dans Chrome (voix Google en ligne) ou installe une voix française améliorée dans les réglages de ton système pour une lecture naturelle.</div>';
    box.innerHTML='<div class="rd-setrow"><span class="lab">Voix</span><select class="rd-vsel" data-rd-voice>'+opts+'</select></div>'+warn;
    var sels=box.querySelector('[data-rd-voice]');
    if(sels)sels.onchange=function(){ S.voice=sels.value; saveS(); };
  }

  /* ---- montage ---- */
  function mountReader(out,ctx){
    stopAudio();
    var r=out.querySelector('.reader'); if(!r)return;
    var ws=r.querySelector('.ws-text'); if(!ws)return;
    cur={readerEl:r,ws:ws,num:ctx.num,n:ctx.n,title:ctx.title,paras:[]};
    applyTo(r);
    cur.paras=Array.prototype.filter.call(ws.querySelectorAll('p'),function(p){return (p.textContent||'').trim().length>1;});
    ensureHeadingIds(ws);

    var m=(typeof META!=='undefined')?META[ctx.num]:null;
    var clearHtml = (m&&m.s)?('<div class="rd-clear-body">'+m.s+'</div><div class="rd-note">Résumé argumenté repris du Navigateur — repère ici l’idée directrice avant ou pendant la lecture du texte intégral.</div>'):'<div class="rd-note">Pas de résumé disponible pour ce chapitre.</div>';

    var tb=document.createElement('div'); tb.className='rd-toolbar';
    tb.innerHTML=''
     + '<div class="rd-progress"><i></i></div>'
     + '<div class="rd-row">'
     +   '<button class="rd-btn" data-rd="prev" title="Chapitre précédent">◀ Préc.</button>'
     +   '<button class="rd-btn" data-rd="next" title="Chapitre suivant">Suiv. ▶</button>'
     +   '<button class="rd-btn" data-rd="toc">Sommaire</button>'
     +   '<button class="rd-btn" data-rd="audio">▶ Écouter</button>'
     +   '<button class="rd-btn" data-rd="clear">En clair</button>'
     +   '<button class="rd-btn" data-rd="gloss">Glossaire</button>'
     +   '<button class="rd-btn" data-rd="set">Aa Réglages</button>'
     + '</div>'
     + '<div class="rd-pop" data-pop="toc" hidden></div>'
     + '<div class="rd-pop" data-pop="audio" hidden><h5>Écouter le texte</h5>'
     +   '<div class="rd-setrow"><span class="lab">Vitesse</span><span class="rd-step">'
     +     '<button class="rd-mini" data-rate="dn">−</button><span class="rd-val" data-ratev>'+S.rate.toFixed(1)+'×</span><button class="rd-mini" data-rate="up">+</button></span></div>'
     +   '<div class="rd-vwrap"></div>'
     +   '<div class="rd-note">Le surlignage suit le paragraphe lu. La qualité dépend des voix installées sur ton appareil.</div></div>'
     + '<div class="rd-pop" data-pop="clear" hidden><h5>En clair</h5>'+clearHtml+'</div>'
     + '<div class="rd-pop" data-pop="set" hidden></div>'
     + '<div class="rd-xref"></div>';
    r.insertBefore(tb, r.firstChild);

    // bornes préc/suiv
    var s=document.getElementById('chapSelect');
    if(s){ var pv=tb.querySelector('[data-rd="prev"]'), nx=tb.querySelector('[data-rd="next"]');
      if(s.selectedIndex<=0)pv.disabled=true; if(s.selectedIndex>=s.options.length-1)nx.disabled=true; }

    // renvois
    var xref=tb.querySelector('.rd-xref'); var chips='';
    if(m&&m.labo) chips+='<button class="rd-chip labo" data-labo="'+esc(m.labo)+'">Voir dans le Laboratoire →</button>';
    if(m&&m.d)    chips+='<button class="rd-chip deriv" data-deriv="'+m.d+'">Suivre dans le Cheminement → marche '+m.d+'</button>';
    xref.innerHTML=chips;

    // câblage
    tb.querySelector('[data-rd="prev"]').onclick=function(){ navChap(-1); };
    tb.querySelector('[data-rd="next"]').onclick=function(){ navChap(1); };
    tb.querySelector('[data-rd="toc"]').onclick=function(){ togglePop(r,'toc'); };
    tb.querySelector('[data-rd="clear"]').onclick=function(){ togglePop(r,'clear'); };
    tb.querySelector('[data-rd="set"]').onclick=function(){ renderSet(r); togglePop(r,'set'); };
    var gbtn=tb.querySelector('[data-rd="gloss"]');
    if(gbtn){ gbtn.classList.toggle('on',!!S.gloss);
      gbtn.onclick=function(){ S.gloss=!S.gloss; saveS(); if(S.gloss)wrapGloss(); else unwrapGloss(); gbtn.classList.toggle('on',S.gloss); }; }
    tb.querySelector('[data-rd="audio"]').onclick=function(){
      if(!synth){ togglePop(r,'audio'); return; }
      if(A.playing) pauseAudio(); else playAudio();
    };
    tb.querySelectorAll('[data-rate]').forEach(function(b){ b.onclick=function(){
      S.rate=clamp(+(S.rate+(b.getAttribute('data-rate')==='up'?0.1:-0.1)).toFixed(1),0.6,1.8);
      saveS(); var v=tb.querySelector('[data-ratev]'); if(v)v.textContent=S.rate.toFixed(1)+'×';
    };});
    tb.querySelector('[data-pop="toc"]').innerHTML='<h5>Sous-parties</h5>'+tocHtml(ws);
    tb.querySelectorAll('[data-goto]').forEach(function(b){ b.onclick=function(){
      var el=document.getElementById(b.getAttribute('data-goto'));
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    };});
    var lb=xref.querySelector('[data-labo]'); if(lb)lb.onclick=function(){ stopAudio(); try{goLabo(lb.getAttribute('data-labo'));}catch(e){} };
    var db=xref.querySelector('[data-deriv]'); if(db)db.onclick=function(){ stopAudio(); try{goDeriv(+db.getAttribute('data-deriv'));}catch(e){} };

    renderVoiceSelect();
    if(S.gloss) wrapGloss();
    updateProgress();
  }

  // stopper l'audio quand on change d'onglet
  document.querySelectorAll('nav.tabs .tab').forEach(function(t){ t.addEventListener('click',function(){ stopAudio(); }); });
  window.addEventListener('beforeunload',function(){ try{if(synth)synth.cancel();}catch(e){} });

  /* ---- glossaire cliquable ---- */
  var TERMS=[
    {s:["valeur d'usage"],de:"Gebrauchswert",def:"L'utilité concrète d'une chose, sa capacité à satisfaire un besoin — face qualitative de la marchandise."},
    {s:["valeur d'échange"],de:"Tauschwert",def:"La proportion dans laquelle une marchandise s'échange contre une autre ; forme d'apparition de la valeur."},
    {s:["temps de travail socialement nécessaire"],de:"gesellschaftlich notwendige Arbeitszeit",def:"Le temps requis en moyenne, dans les conditions sociales données, pour produire une marchandise ; il mesure la grandeur de valeur."},
    {s:["armée industrielle de réserve","armée de réserve"],de:"industrielle Reservearmee",def:"Surpopulation relative d'ouvriers disponibles, produite par l'accumulation, qui pèse sur les salaires et discipline les actifs."},
    {s:["accumulation primitive"],de:"ursprüngliche Akkumulation",def:"Processus historique de séparation violente des producteurs d'avec leurs moyens de production, préalable à tout capital."},
    {s:["composition organique"],de:"organische Zusammensetzung",def:"Rapport c/v : le poids des moyens de production rapporté au travail vivant."},
    {s:["plus-value relative"],de:"relativer Mehrwert",def:"Plus-value obtenue en raccourcissant le travail nécessaire grâce à la productivité."},
    {s:["plus-value absolue"],de:"absoluter Mehrwert",def:"Plus-value obtenue en allongeant la journée de travail, à productivité constante."},
    {s:["taux de plus-value","taux de la plus-value"],de:"Rate des Mehrwerts",def:"Rapport pl/v ; il mesure le degré d'exploitation de la force de travail."},
    {s:["force de travail"],de:"Arbeitskraft",def:"La capacité de travail que l'ouvrier vend ; marchandise singulière dont l'usage produit plus de valeur qu'elle n'en coûte."},
    {s:["capital constant"],de:"konstantes Kapital",def:"Partie du capital avancée en moyens de production : elle transfère sa valeur au produit sans en créer."},
    {s:["capital variable"],de:"variables Kapital",def:"Partie du capital avancée en force de travail : seule partie qui crée de la valeur nouvelle."},
    {s:["travail nécessaire"],de:"notwendige Arbeit",def:"La part de la journée qui reproduit la valeur de la force de travail (le salaire)."},
    {s:["travail abstrait"],de:"abstrakte Arbeit",def:"Le travail humain en général, simple dépense de force ; substance de la valeur."},
    {s:["travail concret"],de:"konkrete Arbeit",def:"Le travail sous une forme utile déterminée (filer, tisser…) ; il crée la valeur d'usage."},
    {s:["journée de travail"],de:"Arbeitstag",def:"Durée quotidienne du travail : un enjeu de lutte entre capital et travail, non une donnée naturelle."},
    {s:["plus-value"],de:"Mehrwert",def:"Valeur créée par le travail au-delà de ce qu'il coûte ; non payée, elle est la source du profit."},
    {s:["surtravail"],de:"Mehrarbeit",def:"La part de la journée travaillée au-delà du travail nécessaire ; gratuite, elle forme la plus-value."},
    {s:["fétichisme","caractère fétiche"],de:"Fetischcharakter",def:"Apparence par laquelle les rapports sociaux entre producteurs revêtent la figure de rapports entre choses."},
    {s:["accumulation"],de:"Akkumulation",def:"Reconversion d'une partie de la plus-value en capital additionnel (capitalisation)."},
    {s:["reproduction"],de:"Reproduktion",def:"Renouvellement continu de la production : simple (échelle constante) ou élargie (avec accumulation)."},
    {s:["coopération"],de:"Kooperation",def:"Travail de nombreux ouvriers réunis ; crée une force productive collective appropriée gratuitement par le capital."},
    {s:["manufacture"],de:"Manufaktur",def:"Coopération fondée sur la division du travail, avant la machine ; elle produit l'ouvrier partiel."},
    {s:["marchandise"],de:"Ware",def:"Produit du travail destiné à l'échange : unité d'une valeur d'usage et d'une valeur."}
  ];
  TERMS.forEach(function(t){ t.max=Math.max.apply(null,t.s.map(function(x){return x.length;})); });
  TERMS.sort(function(a,b){ return b.max-a.max; });

  function glLetter(ch){ return !!ch && /[a-zàâäáéèêëíîïóôöùúûüçœæ]/i.test(ch); }
  function glNorm(s){ return s.toLowerCase().replace(/[\u2019\u2018\u02bc]/g,"'"); }
  function glEligible(node){
    var p=node.parentNode;
    while(p && p!==cur.ws){
      var tn=p.tagName;
      if(tn==='A'||tn==='MARK'||tn==='H2'||tn==='H3'||tn==='H4'||tn==='STYLE'||tn==='SCRIPT')return false;
      if(p.classList && p.classList.contains('gloss'))return false;
      p=p.parentNode;
    }
    return p===cur.ws;
  }
  function glFind(node,surf){
    var text=node.nodeValue, h=glNorm(text), t=glNorm(surf), from=0, i;
    while((i=h.indexOf(t,from))>=0){
      var endLen=t.length, before=text.charAt(i-1), after=text.charAt(i+endLen);
      if(glLetter(after)){
        var lo=after.toLowerCase();
        if((lo==='s'||lo==='x') && !glLetter(text.charAt(i+endLen+1))) endLen+=1;
        else { from=i+1; continue; }
      }
      if(i>0 && glLetter(before)){ from=i+1; continue; }
      return {index:i,len:endLen};
    }
    return null;
  }
  function glWrapAt(node,index,len,term){
    var mid=node.splitText(index);
    if(len<mid.nodeValue.length) mid.splitText(len);
    var span=document.createElement('span');
    span.className='gloss'; span.setAttribute('tabindex','0');
    span.setAttribute('data-de',term.de||''); span.setAttribute('data-def',term.def||'');
    mid.parentNode.insertBefore(span,mid); span.appendChild(mid);
  }
  function wrapGloss(){
    if(!cur||!cur.ws)return;
    TERMS.forEach(function(term){
      for(var k=0;k<term.s.length;k++){
        var w=document.createTreeWalker(cur.ws,window.NodeFilter.SHOW_TEXT,null), n, nodes=[];
        while(n=w.nextNode())nodes.push(n);
        var done=false;
        for(var j=0;j<nodes.length;j++){
          var nd=nodes[j]; if(!glEligible(nd))continue;
          var m=glFind(nd,term.s[k]);
          if(m){ try{glWrapAt(nd,m.index,m.len,term);}catch(e){} done=true; break; }
        }
        if(done)break;
      }
    });
  }
  function unwrapGloss(){
    if(!cur||!cur.ws)return;
    hideTip();
    cur.ws.querySelectorAll('span.gloss').forEach(function(s){
      var p=s.parentNode; if(!p)return;
      while(s.firstChild)p.insertBefore(s.firstChild,s);
      p.removeChild(s);
    });
    try{cur.ws.normalize();}catch(e){}
  }

  /* ---- infobulle ---- */
  var tip=null, tipSticky=false;
  function ensureTip(){ if(tip)return tip; tip=document.createElement('div'); tip.className='rd-tip'; tip.hidden=true; document.body.appendChild(tip); return tip; }
  function showTip(span){
    ensureTip();
    tip.innerHTML='<span class="rd-tip-term">'+esc(span.textContent)+'</span>'
      +(span.getAttribute('data-de')?'<span class="rd-tip-de">allemand : <i>'+esc(span.getAttribute('data-de'))+'</i></span>':'')
      +'<span class="rd-tip-def">'+esc(span.getAttribute('data-def')||'')+'</span>';
    tip.hidden=false;
    var r=span.getBoundingClientRect();
    var top=r.bottom+window.scrollY+6;
    tip.style.top=top+'px';
    var vw=document.documentElement.clientWidth;
    var left=r.left+window.scrollX;
    var maxL=window.scrollX+vw-tip.offsetWidth-10;
    tip.style.left=Math.max(window.scrollX+8,Math.min(left,maxL))+'px';
  }
  function hideTip(){ if(tip)tip.hidden=true; tipSticky=false; }
  document.addEventListener('click',function(e){
    var g=e.target.closest && e.target.closest('span.gloss');
    if(g){ if(g.closest('mark.anno'))return; e.stopPropagation(); tipSticky=true; showTip(g); return; }
    if(!(e.target.closest && e.target.closest('.rd-tip'))) hideTip();
  });
  document.addEventListener('mouseover',function(e){
    if(tipSticky)return;
    var g=e.target.closest && e.target.closest('span.gloss');
    if(g && !g.closest('mark.anno')) showTip(g);
  });
  document.addEventListener('mouseout',function(e){
    if(tipSticky)return;
    var g=e.target.closest && e.target.closest('span.gloss');
    if(g){ var to=e.relatedTarget; if(to && to.closest && (to.closest('span.gloss')===g||to.closest('.rd-tip')))return; hideTip(); }
  });
  window.addEventListener('scroll',function(){ if(tip && !tip.hidden) hideTip(); },{passive:true});

  window.Reading={ mount:mountReader };
})();

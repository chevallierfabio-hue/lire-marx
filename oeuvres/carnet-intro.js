/* ═══════════════════════════════════════════════════════════════════════
   L'ENTRÉE DU CARNET — la scène cinématique du site, déplacée ici.

   Elle a vécu jusqu'en septembre 2026 sur /index.html, où elle servait de
   seuil au site entier. Arbitrage du propriétaire : l'accueil s'ouvre
   désormais directement, et la cérémonie ne joue plus qu'ici — à l'entrée
   du carnet. Le décor n'a pas changé de sens en changeant de page : c'est
   le bureau à la bougie de la bibliothèque, et le volume qu'on y ouvre est
   maintenant VOTRE carnet (couverture de toile, étiquette, signet rouge)
   au lieu du Capital. La page qui se découvre dedans est manuscrite — sur
   l'accueil c'était une licence, ici c'est littéralement vrai.

   Ce qu'il faut savoir avant d'y toucher :

   — La DÉCISION de jouer se prend dans le <head> de carnet.html, pas ici :
     elle doit être connue AVANT le premier rendu, sinon le carnet
     apparaît puis disparaît sous la scène. Le head pose `html.cn-anim` ;
     ce module ne fait que la lire. Il la retire s'il ne peut pas jouer
     (pas de THREE, pas de WebGL) — la page s'affiche alors telle quelle.

   — Elle ne joue QU'UNE FOIS PAR SESSION de navigateur (sessionStorage,
     posé par le head). Le carnet est une page de travail qu'on rouvre dix
     fois dans l'après-midi : une cérémonie à chaque ouverture serait une
     taxe, pas un accueil. Même raison pour laquelle un deep-link
     (`#note=`, `#s=`) la saute : on vient chercher un passage précis.

   — Le verrou de l'intro est un ÉPINGLAGE PAR IMAGE, jamais un
     overflow:hidden. Si la boucle mourait, un verrou CSS ne se rouvrirait
     plus et le carnet resterait bloqué — pire que le bug qu'on évite.
     Même raison pour le filet des 8 s dans frame().

   — releaseIntro() EFFACE le transform inline de <main>. Un transform sur
     un ancêtre transforme un position:fixed en position:absolute : les
     modales du shell vivent dans le main, elles se caleraient dessus.

   — Pour la tester dans un onglet piloté, la sonde est obligatoire : le
     rAF y est si bridé que `p` ne bouge pas et qu'on croit à tort la scène
     morte. Exposer temporairement {enter, frame, getP, setP}, avancer en
     pas-à-pas, et RETIRER la sonde avant le commit.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  var D = document.documentElement;
  /* La scène ne peut pas jouer : on rend la page telle quelle, tout de suite. */
  function forfeit(){
    D.classList.remove('cn-anim');
    document.body.classList.add('cn-open');
    var ids=['cnScene','cnCine','cnLoading'];
    for(var i=0;i<ids.length;i++){
      var el=document.getElementById(ids[i]);
      if(el && el.parentNode) el.parentNode.removeChild(el);
    }
  }
  if(!D.classList.contains('cn-anim')) return forfeit();
  if(!window.THREE) return forfeit();
  try{
    var probe=document.createElement('canvas');
    if(!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return forfeit();
  }catch(e){ return forfeit(); }

  /* La largeur se lit à la MEDIA QUERY, jamais à innerWidth : au moment où
     un script différé s'exécute, une fenêtre peut encore annoncer 0 (onglet
     ouvert en arrière-plan, onglet piloté), et le carnet perdrait son entrée
     sur une mesure qui ne veut rien dire. La media query, elle, décrit le
     viewport CSS — celui qui a servi à mettre la page en page. C'est le même
     seuil que dans la feuille de style de carnet.html : les deux doivent
     bouger ensemble. */
  if(!window.matchMedia('(min-width:768px)').matches) return forfeit();

  try{
  var canvas = document.getElementById('cnScene');
  var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(72, 1, 0.1, 100);

  var tableau = new THREE.Group(); scene.add(tableau);
  scene.add(new THREE.AmbientLight(0x322615, 0.24));
  var moon = new THREE.DirectionalLight(0x33506e, 0.16); moon.position.set(-6,8,-3); scene.add(moon);
  var candleLight = new THREE.PointLight(0xffb24d, 3.0, 14, 2); candleLight.position.set(1.4,0.7,1.2); scene.add(candleLight);
  var shelfGlow = new THREE.PointLight(0x6a4a26, 0.9, 24, 2); shelfGlow.position.set(0,3.4,-10.5); scene.add(shelfGlow);
  var deskLight = new THREE.PointLight(0xffd29a, 1.7, 11, 2); deskLight.position.set(-0.4,3.0,2.0); scene.add(deskLight);

  function aged(){
    var cv=document.createElement('canvas'); cv.width=620; cv.height=820;
    var g=cv.getContext('2d');
    var grad=g.createLinearGradient(0,0,0,820); grad.addColorStop(0,'#efe1c2'); grad.addColorStop(1,'#dcc79a');
    g.fillStyle=grad; g.fillRect(0,0,620,820);
    for(var s=0;s<70;s++){ g.fillStyle='rgba('+(150+Math.random()*40|0)+','+(110+Math.random()*30|0)+',60,'+(0.04+Math.random()*0.06)+')';
      var rr=4+Math.random()*16; g.beginPath(); g.arc(Math.random()*620,Math.random()*820,rr,0,7); g.fill(); }
    /* écriture griffonnée : lignes ondulées manuscrites */
    g.strokeStyle='rgba(70,48,26,0.72)'; g.lineWidth=2.4; g.lineCap='round';
    var y=92;
    while(y<760){
      var indent = (Math.random()<0.2)? 70:0;
      var x=70+indent, end=560-Math.random()*120;
      g.beginPath(); g.moveTo(x,y);
      while(x<end){ var nx=x+14+Math.random()*10; var ny=y+(Math.random()*5-2.5); g.quadraticCurveTo(x+6,y+(Math.random()*6-3),nx,ny); x=nx; }
      g.stroke();
      y += 26 + (Math.random()<0.12?16:0);
    }
    var t=new THREE.CanvasTexture(cv); t.anisotropy=4; return t;
  }
  /* La couverture du volume qu'on ouvre. Sur l'accueil du site c'était
     « LE CAPITAL » ; ici c'est VOTRE carnet — toile sombre, étiquette de
     cahier collée au centre, titre à la main. Le seul rouge de l'objet est
     le signet : c'est lui qu'on voit dépasser. */
  function coverTop(){
    var cv=document.createElement('canvas'); cv.width=560; cv.height=760;
    var g=cv.getContext('2d');
    g.fillStyle='#2a2018'; g.fillRect(0,0,560,760);
    /* grain de la toile */
    for(var i=0;i<2600;i++){ g.fillStyle='rgba(0,0,0,'+(0.05+Math.random()*0.12)+')';
      g.fillRect(Math.random()*560,Math.random()*760,2,1); }
    for(var j=0;j<900;j++){ g.fillStyle='rgba(225,205,165,'+(0.02+Math.random()*0.05)+')';
      g.fillRect(Math.random()*560,Math.random()*760,1,2); }
    /* filet à froid */
    g.strokeStyle='rgba(216,173,76,.42)'; g.lineWidth=3; g.strokeRect(44,44,472,672);
    /* étiquette collée */
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(118,236,330,214);
    var lab=g.createLinearGradient(0,230,0,444);
    lab.addColorStop(0,'#efe1c2'); lab.addColorStop(1,'#ddc99f');
    g.fillStyle=lab; g.fillRect(112,230,330,214);
    g.strokeStyle='rgba(90,60,30,.45)'; g.lineWidth=2; g.strokeRect(124,242,306,190);
    g.textAlign='center';
    g.fillStyle='#5a4126'; g.font='600 26px Georgia';
    g.fillText('LIRE MARX', 277, 292);
    g.fillStyle='#2a1d12'; g.font='italic 62px Georgia';
    g.fillText('Mon carnet', 277, 366);
    g.strokeStyle='rgba(124,29,22,.55)'; g.lineWidth=3;
    g.beginPath(); g.moveTo(200,392); g.lineTo(354,392); g.stroke();
    g.fillStyle='#7c1d16'; g.font='italic 24px Georgia';
    g.fillText('passages & notes', 277, 424);
    /* signet qui dépasse en haut */
    g.fillStyle='#7c1d16'; g.fillRect(430,0,34,150);
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(430,0,6,150);
    var t=new THREE.CanvasTexture(cv); t.anisotropy=4; return t;
  }

  function shelfTex(){
    var cv=document.createElement('canvas'); cv.width=1024; cv.height=512; var g=cv.getContext('2d');
    g.fillStyle='#160f0a'; g.fillRect(0,0,1024,512);
    var rows=4, rowH=512/rows;
    var pal=['#3a1d18','#2a2a1a','#3a2e14','#1f2a2e','#33231a','#2c1822','#243018','#3a2118'];
    for(var r=0;r<rows;r++){
      var y0=r*rowH;
      g.fillStyle='#0c0806'; g.fillRect(0,y0+rowH-16,1024,16);
      var x=14;
      while(x<1006){
        var w=18+Math.random()*30, h=rowH-22-Math.random()*34;
        g.fillStyle=pal[(Math.random()*pal.length)|0];
        g.fillRect(x,y0+rowH-16-h,w,h);
        g.fillStyle='rgba(255,220,150,0.05)'; g.fillRect(x,y0+rowH-16-h,2,h);
        x+=w+3+Math.random()*4;
      }
    }
    var grd=g.createRadialGradient(512,256,160,512,256,580);
    grd.addColorStop(0,'rgba(0,0,0,0)'); grd.addColorStop(1,'rgba(0,0,0,0.78)');
    g.fillStyle=grd; g.fillRect(0,0,1024,512);
    var t=new THREE.CanvasTexture(cv); return t;
  }

  function softTex(){
    var c=document.createElement('canvas'); c.width=64; c.height=64; var g=c.getContext('2d');
    var gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c);
  }
  function coverTex(lines,colNum){
    var bg='#'+('000000'+colNum.toString(16)).slice(-6);
    var cv=document.createElement('canvas'); cv.width=256; cv.height=340; var g=cv.getContext('2d');
    g.fillStyle=bg; g.fillRect(0,0,256,340);
    g.fillStyle='rgba(0,0,0,0.12)'; for(var i=0;i<280;i++) g.fillRect(Math.random()*256,Math.random()*340,1,1);
    g.strokeStyle='#caa84a'; g.lineWidth=5; g.strokeRect(18,18,220,304);
    g.lineWidth=2; g.strokeRect(28,28,200,284);
    g.fillStyle='#eccd78'; g.textAlign='center'; g.font='bold 30px Georgia';
    var y=170-(lines.length-1)*22; for(var k=0;k<lines.length;k++){ g.fillText(lines[k],128,y); y+=42; }
    g.fillRect(98,y+6,60,3);
    var t=new THREE.CanvasTexture(cv); t.anisotropy=4; return t;
  }
  function closedBook(w,h,d,colNum,lines){
    var top=new THREE.MeshStandardMaterial({map:coverTex(lines,colNum),roughness:0.6});
    var pages=new THREE.MeshStandardMaterial({color:0xece6d6,roughness:0.9});
    var cov=new THREE.MeshStandardMaterial({color:colNum,roughness:0.6});
    return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[pages,pages,top,cov,pages,pages]);
  }

  var oxblood = new THREE.MeshStandardMaterial({color:0x7c1d16, roughness:0.55, metalness:0.08});
  var oxbloodSpine = new THREE.MeshStandardMaterial({color:0x5e140f, roughness:0.6, metalness:0.1});
  var gild = new THREE.MeshStandardMaterial({color:0xd4a843, roughness:0.45, metalness:0.55});
  var pageSide = new THREE.MeshStandardMaterial({color:0xe7d6af, roughness:0.95});
  var pageMatA = new THREE.MeshStandardMaterial({map:aged(), roughness:0.96});
  var pageMatB = new THREE.MeshStandardMaterial({map:aged(), roughness:0.96});
  var coverTopMat = new THREE.MeshStandardMaterial({map:coverTop(), roughness:0.5, metalness:0.1});

  var W=2.4, Dz=3.2, Th=0.10, PT=0.5;
  var book=new THREE.Group(); tableau.add(book);
  book.position.set(-W/2-0.4, 0, 0);

  /* pile de pages (côté droit, statique) : 0..W */
  var stack=new THREE.Group(); book.add(stack);
  var back=new THREE.Mesh(new THREE.BoxGeometry(W,0.1,Dz), oxblood);
  back.position.set(W/2,-PT/2-0.06,0); stack.add(back);
  var block=new THREE.Mesh(new THREE.BoxGeometry(W,PT,Dz),
    [gild,pageSide,pageMatA,pageSide,pageSide,pageSide]);
  block.position.set(W/2,0,0); stack.add(block);

  /* couverture pivotant sur le dos (x=0) */
  var coverPivot=new THREE.Group(); book.add(coverPivot);
  var cg=new THREE.BoxGeometry(W,Th,Dz); cg.translate(W/2,0,0);
  var cover=new THREE.Mesh(cg,[gild,pageSide,coverTopMat,pageMatB,oxblood,oxblood]);
  coverPivot.add(cover);
  coverPivot.position.set(0, PT/2+Th/2+0.005, 0);

  /* dos */
  var spine=new THREE.Mesh(new THREE.BoxGeometry(0.12,PT,Dz+0.02), pageSide);
  spine.position.set(0,-0.02,0); book.add(spine);

  /* ---------- bureau & pièce sombre ---------- */
  var DESK=-0.37, FLOOR=-2.2;
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(70,70),
    new THREE.MeshStandardMaterial({color:0x1c130b, roughness:0.9}));
  floor.rotation.x=-Math.PI/2; floor.position.y=FLOOR; scene.add(floor);
  /* plateau du bureau (surélevé, remplit le premier plan) */
  var desk=new THREE.Mesh(new THREE.BoxGeometry(18,0.3,10),
    new THREE.MeshStandardMaterial({color:0x3a2616, roughness:0.72}));
  desk.position.set(0, DESK-0.15, 3.5); scene.add(desk);
  var wall=new THREE.Mesh(new THREE.PlaneGeometry(70,32),
    new THREE.MeshStandardMaterial({color:0x100b08, roughness:1}));
  wall.position.set(0,9,-13.4); scene.add(wall);
  var shelf=new THREE.Mesh(new THREE.PlaneGeometry(28,9),
    new THREE.MeshStandardMaterial({map:shelfTex(), roughness:0.92}));
  shelf.position.set(0,2.3,-13.0); scene.add(shelf);

  /* tapis */
  var rug=new THREE.Mesh(new THREE.PlaneGeometry(13,7),
    new THREE.MeshStandardMaterial({color:0x3a221c, roughness:0.95}));
  rug.rotation.x=-Math.PI/2; rug.position.set(0,FLOOR+0.02,-6); scene.add(rug);

  /* pile de livres au sol (droite) */
  var sc=[[0x3a2a18,0.42],[0x24402f,0.34],[0x4a2420,0.30]], yy=FLOOR;
  for(var bi=0;bi<sc.length;bi++){ var hb=sc[bi][1];
    var fb=new THREE.Mesh(new THREE.BoxGeometry(1.7,hb,2.3),
      new THREE.MeshStandardMaterial({color:sc[bi][0],roughness:0.72}));
    fb.position.set(5.6+(bi%2?0.12:-0.12), yy+hb/2, -6.4); fb.rotation.y=0.2+bi*0.16; scene.add(fb); yy+=hb; }

  /* livres fermés titrés sur le bureau */
  var b1=closedBook(1.9,0.34,2.5,0x2e4a32,['GRUNDRISSE']);
  b1.position.set(-6.0,DESK+0.17,1.0); b1.rotation.y=0.16; scene.add(b1);
  var b2=closedBook(1.8,0.30,2.3,0x5a3a22,['MANUSCRITS','1844']);
  b2.position.set(-6.2,DESK+0.49,1.1); b2.rotation.y=-0.22; scene.add(b2);
  var b3=closedBook(1.8,0.32,2.4,0x22314f,['LE','MANIFESTE']);
  b3.position.set(2.7,DESK+0.16,3.7); b3.rotation.y=0.5; scene.add(b3);

  /* encrier + plume + feuilles */
  var ink=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.21,0.24,18),
    new THREE.MeshStandardMaterial({color:0x15110d,roughness:0.45,metalness:0.35}));
  ink.position.set(-2.4,DESK+0.12,3.3); scene.add(ink);
  var quill=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.045,1.3,8),
    new THREE.MeshStandardMaterial({color:0xe9e1d1,roughness:0.85}));
  quill.position.set(-2.25,DESK+0.62,3.2); quill.rotation.z=-0.5; quill.rotation.x=-0.25; scene.add(quill);
  var papers=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.05,2.5),
    new THREE.MeshStandardMaterial({color:0xe7dcc2,roughness:0.95}));
  papers.position.set(3.7,DESK+0.03,1.4); papers.rotation.y=-0.14; scene.add(papers);

  /* une page du carnet, arrachée et posée à plat sur le bureau (là où
     l'accueil mettait une affiche) : même papier, même écriture que celle
     qu'on va ouvrir. */
  var loose=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.9),
    new THREE.MeshStandardMaterial({map:aged(), roughness:0.95, side:THREE.DoubleSide}));
  loose.rotation.order='YXZ';
  loose.rotation.set(-Math.PI/2, 0.42, 0);
  loose.position.set(4.9,DESK+0.02,3.3); scene.add(loose);

  /* ---------- bougie ---------- */
  var candle=new THREE.Group(); scene.add(candle);
  var holder=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.32,0.10,24),
    new THREE.MeshStandardMaterial({color:0x9a7b30, metalness:0.6, roughness:0.4}));
  holder.position.y=DESK+0.06; candle.add(holder);
  var stick=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,0.74,20),
    new THREE.MeshStandardMaterial({color:0xe9ddc2, roughness:0.7}));
  stick.position.y=DESK+0.06+0.37; candle.add(stick);
  var flame=new THREE.Mesh(new THREE.ConeGeometry(0.075,0.24,12),
    new THREE.MeshBasicMaterial({color:0xffd27a}));
  flame.position.y=DESK+0.06+0.74+0.10; candle.add(flame);
  var flameHalo=new THREE.Mesh(new THREE.SphereGeometry(0.16,16,16),
    new THREE.MeshBasicMaterial({color:0xff9c3a, transparent:true, opacity:0.28}));
  flameHalo.position.copy(flame.position); candle.add(flameHalo);
  candle.position.set(1.5,0,1.25);

  /* fil de fumée montant de la flamme */
  var soft=softTex();
  var smN=16, smGeo=new THREE.BufferGeometry(), smP=new Float32Array(smN*3), smData=[];
  for(var si=0;si<smN;si++){ smData.push({y:Math.random(),x:(Math.random()-0.5),sp:0.15+Math.random()*0.22,ph:Math.random()*6.28});
    smP[si*3]=1.5; smP[si*3+1]=0.6; smP[si*3+2]=1.25; }
  smGeo.setAttribute('position', new THREE.BufferAttribute(smP,3));
  var smoke=new THREE.Points(smGeo, new THREE.PointsMaterial({size:0.6,map:soft,transparent:true,opacity:0.10,color:0xb8b2a6,depthWrite:false,sizeAttenuation:true}));
  scene.add(smoke);

  /* poussières flottant dans la lumière */
  var duN=90, duGeo=new THREE.BufferGeometry(), duP=new Float32Array(duN*3), duData=[];
  for(var di=0;di<duN;di++){ var bx=(Math.random()-0.5)*14, by=Math.random()*3.4-0.3, bz=Math.random()*9-2.5;
    duData.push({bx:bx,by:by,bz:bz,ph:Math.random()*6.28,sp:0.3+Math.random()*0.7});
    duP[di*3]=bx; duP[di*3+1]=by; duP[di*3+2]=bz; }
  duGeo.setAttribute('position', new THREE.BufferAttribute(duP,3));
  var dust=new THREE.Points(duGeo, new THREE.PointsMaterial({size:0.05,map:soft,transparent:true,opacity:0.42,color:0xffd9a0,depthWrite:false,sizeAttenuation:true}));
  scene.add(dust);

  /* ---------- caméra : établissement -> plongée sur page droite ---------- */
  var camA=new THREE.Vector3(0.3,3.0,8.2), lookA=new THREE.Vector3(0.4,0.6,-4.5);
  var camB=new THREE.Vector3(-0.4,3.4,0.02), lookB=new THREE.Vector3(-0.4,0,0);
  var fovA=64, fovB=42;
  var p=0, targetP=0;
  var tmpC=new THREE.Vector3(), tmpL=new THREE.Vector3();

  /* ---------- interaction ---------- */
  var tmx=0,tmy=0,mx=0,my=0;
  window.addEventListener('mousemove',function(e){tmx=(e.clientX/window.innerWidth-0.5);tmy=(e.clientY/window.innerHeight-0.5);});
  var enterAt=0, introLocked=true;
  function enter(){ if(!targetP) enterAt=performance.now(); targetP=1; }
  function leave(){ targetP=0; }
  /* Fin de l'intro : le carnet redevient une page ordinaire — il cesse
     d'être épinglé en haut, et surtout on EFFACE le transform inline.
     Un transform laissé sur <main> ferait d'un position:fixed descendant
     un position:absolute : les modales du shell (compte, RGPD, contacts)
     vivent dedans, elles se caleraient sur le main au lieu du viewport.
     Appelée normalement dès que la page a fini d'apparaître, et au pire
     8 s après l'entrée — la boucle, elle, continue jusqu'au bout. Sans ce
     filet, un rAF ralenti (onglet en arrière-plan, machine lente)
     laisserait le carnet invisible et bloqué en haut. */
  function releaseIntro(){
    if(!introLocked) return;
    introLocked=false;
    document.body.classList.remove('cn-intro-run');
    document.body.classList.add('cn-open');
    /* le canvas couvre toute la page en z-index 200 : tant qu'il reste là,
       il mangerait les clics du carnet. */
    canvas.style.pointerEvents='none';
    if(stage){ stage.style.opacity=''; stage.style.transform=''; }
    document.documentElement.classList.remove('cn-anim');
  }
  var acc=0;
  window.addEventListener('wheel',function(e){ acc+=e.deltaY; if(acc>120) enter(); if(acc<-150 && p<0.15){ leave(); acc=0; } },{passive:true});
  canvas.addEventListener('click', enter);
  /* Le clavier ouvre aussi. Sans ça, quelqu'un qui ne se sert pas de la
     souris resterait devant la scène sans aucun moyen d'atteindre son
     carnet — l'entrée n'écoutait que la molette et le clic. Tab en fait
     partie : il dit qu'on veut aller au contenu. On n'intercepte rien,
     la touche fait son travail ensuite. */
  window.addEventListener('keydown', function(e){
    if(!introLocked) return;
    var k=e.key;
    if(k==='Tab'||k==='Enter'||k===' '||k==='Spacebar'||k==='Escape'||
       k==='ArrowDown'||k==='PageDown'||k==='End') enter();
  });
  var stage=document.querySelector('main.wrap'), cine=document.getElementById('cnCine');

  function resize(){var w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();}
  window.addEventListener('resize',resize); resize();

  var start=performance.now(), HOLD=700, OPEN=2600;
  function ease(t){return 1-Math.pow(1-t,3);}
  function smooth(a,b,x){ x=Math.max(0,Math.min(1,(x-a)/(b-a))); return x*x*(3-2*x); }

  function frame(now){
    var t=now-start;
    /* vacillement de la bougie */
    var fl=3.0 + Math.sin(now*0.017)*0.22 + Math.sin(now*0.043)*0.12 + (Math.random()-0.5)*0.3;
    candleLight.intensity=fl;
    candleLight.position.x=1.5+Math.sin(now*0.021)*0.04;
    candleLight.position.z=1.25+Math.cos(now*0.019)*0.04;
    var fs=1+Math.sin(now*0.03)*0.12+(Math.random()-0.5)*0.12;
    flame.scale.set(1,fs,1); flameHalo.scale.setScalar(1+(fs-1)*0.6);
    flameHalo.material.opacity=0.24+(fl-2.5)*0.06;
    /* ouverture du livre */
    var ok=Math.max(0,Math.min(1,(t-HOLD)/OPEN));
    coverPivot.rotation.z = Math.PI*ease(ok);

    /* fumée */
    var sa=smoke.geometry.attributes.position.array;
    for(var sk=0;sk<smN;sk++){ var sd=smData[sk]; sd.y+=sd.sp*0.008; if(sd.y>1) sd.y=0;
      sa[sk*3]=1.5 + Math.sin(now*0.0011+sd.ph)*0.2*sd.y + sd.x*0.25*sd.y;
      sa[sk*3+1]=0.6 + sd.y*2.6;
      sa[sk*3+2]=1.25 + Math.cos(now*0.0009+sd.ph)*0.14*sd.y; }
    smoke.geometry.attributes.position.needsUpdate=true;

    /* poussières */
    var da=dust.geometry.attributes.position.array;
    for(var dk=0;dk<duN;dk++){ var dd=duData[dk];
      da[dk*3]=dd.bx+Math.sin(now*0.0003*dd.sp+dd.ph)*0.4;
      da[dk*3+1]=dd.by+Math.sin(now*0.00025*dd.sp+dd.ph*1.3)*0.25;
      da[dk*3+2]=dd.bz+Math.cos(now*0.00028*dd.sp+dd.ph)*0.4; }
    dust.geometry.attributes.position.needsUpdate=true;

    /* caméra : p -> targetP */
    p += (targetP-p)*0.035;
    var pe=ease(p);
    camera.fov=fovA+(fovB-fovA)*pe; camera.updateProjectionMatrix();
    tmpC.lerpVectors(camA,camB,pe);
    tmpL.lerpVectors(lookA,lookB,pe);
    /* léger parallaxe souris uniquement en mode établissement */
    var par=(1-smooth(0.05,0.4,p));
    mx+=(tmx-mx)*0.05; my+=(tmy-my)*0.05;
    camera.position.set(tmpC.x+mx*0.8*par, tmpC.y - my*0.5*par, tmpC.z);
    camera.position.x += Math.cos(now*0.00038)*0.06*par;
    camera.position.y += Math.sin(now*0.00050)*0.05*par;
    camera.lookAt(tmpL);

    /* immersion : la 3D s'efface, le carnet grandit pour nous happer.
       On n'écrit ces deux styles inline que tant que l'intro tient la
       page : après release, ils sont effacés une bonne fois (voir
       releaseIntro) et il ne faut surtout pas les reposer. */
    var sv=smooth(0.45,0.96,p);
    if(introLocked && stage){
      stage.style.opacity=sv;
      stage.style.transform='scale('+(0.92+0.08*sv)+')';
    }
    canvas.style.opacity=String(1-smooth(0.62,0.97,p));
    if(p>0.6){ document.body.classList.add('cn-open'); cine.classList.add('hide'); }
    else if(introLocked){ document.body.classList.remove('cn-open'); cine.classList.remove('hide'); }

    /* On rend la main dès que la page a FINI D'APPARAÎTRE, pas quand p touche
       enfin 1. `p += (targetP-p)*0.035` converge de façon asymptotique : sv
       vaut 1 à p=0.96, soit la 90e image, alors que p>0.995 n'arrive qu'à la
       149e — presque une seconde de défilement mort à 60 fps, et le double
       sur une machine lente, pendant laquelle l'accueil est entièrement
       visible et ignore la molette. sv>=1 dit exactement « le carnet est
       là » : la page est à pleine opacité et à l'échelle 1, et le canvas de
       l'intro à 0,25 % — rien ne distingue plus cet instant de la fin. */
    if(sv >= 1) releaseIntro();
    if(enterAt && now-enterAt>8000) releaseIntro();

    /* On ouvre le carnet par le HAUT : la molette qui sert à entrer ne doit
       pas déjà faire défiler la page dessous, sinon on débouche sur un
       carnet ouvert au milieu. Remise à zéro par image plutôt qu'un
       overflow:hidden à retirer : si la boucle mourait, le défilement
       resterait normal — un verrou CSS, lui, ne se rouvrirait jamais. */
    if(introLocked && window.scrollY) window.scrollTo(0,0);

    renderer.render(scene,camera);
    /* immersion terminée : la scène a fini son office. On la démonte pour de
       bon — le carnet est une page de travail, on n'y laisse pas tourner un
       contexte WebGL derrière le papier. */
    if(p>0.995){
      releaseIntro();
      teardown();
      return;
    }
    requestAnimationFrame(frame);
  }

  /* Démontage : le canvas et la couche de titre quittent le document, et la
     mémoire GPU est rendue. Idempotent — frame() et le filet des 8 s peuvent
     tous deux y mener. */
  var gone=false;
  function teardown(){
    if(gone) return; gone=true;
    try{ renderer.dispose(); }catch(e){}
    scene.traverse(function(o){
      if(o.geometry){ try{ o.geometry.dispose(); }catch(e){} }
      var m=o.material; if(!m) return;
      (Array.isArray(m)?m:[m]).forEach(function(mm){
        if(mm.map){ try{ mm.map.dispose(); }catch(e){} }
        try{ mm.dispose(); }catch(e){}
      });
    });
    if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if(cine.parentNode) cine.parentNode.removeChild(cine);
    var ld=document.getElementById('cnLoading');
    if(ld && ld.parentNode) ld.parentNode.removeChild(ld);
  }

  setTimeout(function(){
    var ld=document.getElementById('cnLoading');
    if(ld) ld.classList.add('gone');
    document.body.classList.add('cn-lit');
  },250);
  document.body.classList.add('cn-intro-run');
  requestAnimationFrame(frame);
  }catch(err){
    /* Une scène 3D qui casse ne doit jamais emporter le carnet avec elle. */
    if(window.console && console.warn) console.warn('[carnet] intro indisponible', err);
    forfeit();
  }
})();

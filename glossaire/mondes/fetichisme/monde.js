/* LE MONDE DU FÉTICHISME — la table de bois de Marx, à la bougie.
   Chargé par glossaire/monde-driver.js, après Three.js (vendor/three.min.js,
   r137 — pas de loader, tout est géométrie paramétrique et canvas).
   Expose window.LM_MONDE(canvas) → {set(g), frame(dt), resize(), render(), dispose()}.

   Ce que la scène DIT, et pourquoi c'est celle-là (meta.json le redit) :
   la table est ordinaire tant qu'on la lit comme une table (g < 2) ; à la
   forme marchandise (g 2→3) elle se soulève et se dresse sur sa tête, une
   étiquette de valeur pendue à un pied ; au mécanisme (g 3→4) elle danse,
   et son ombre au mur devient deux personnes — le rapport social que la
   chose masque ; aux contre-mondes (g 4→5) une lumière froide entre par la
   droite et elle retombe sur ses pieds ; aux lectures (g 5→6) elle est
   redevenue une table. TOUT est fonction de g (la position de lecture),
   donc réversible ; seuls le vacillement de la flamme et la danse sont
   temporels, et la danse n'a d'amplitude que dans sa fenêtre de g. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  } catch (e) { return null; }
  var BG = 0x0d0a07;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(BG, 1);
  if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; }

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 5.5, 14);
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  /* Le cadre est le plus souvent en PORTRAIT (la colonne collante), parfois
     en paysage (l'image fixe, ou une fenêtre courte). On tient le champ
     HORIZONTAL constant — la table doit tenir en largeur — et l'on déduit
     le champ vertical de l'aspect ; en portrait, la caméra voit donc plus
     de sol et de mur, ce qui est exactement la place de l'ombre. */
  var HFOV = 44;
  var CAM = { x: 0.35, y: 1.5, z: 5.0, ax: 0.05, ay: 0.72, az: 0 };
  camera.position.set(CAM.x, CAM.y, CAM.z);
  camera.lookAt(CAM.ax, CAM.ay, CAM.az);

  /* ── textures procédurales ── */
  function tex(w, h, draw) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(cv);
    if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  var rnd = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  var woodTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#5a3b20'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 140; i++) {
      var y = rnd() * h, a = 0.06 + rnd() * 0.16;
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '30,16,6' : '120,80,40') + ',' + a + ')';
      g.lineWidth = 0.6 + rnd() * 2.2;
      g.beginPath(); g.moveTo(0, y);
      for (var x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3 + (rnd() - 0.5) * 2);
      g.stroke();
    }
    for (var k = 0; k < 3; k++) {
      var cx = rnd() * w, cy = rnd() * h;
      for (var r = 6; r < 90; r += 7) {
        g.strokeStyle = 'rgba(40,22,8,' + (0.05 + rnd() * 0.08) + ')'; g.lineWidth = 1;
        g.beginPath(); g.ellipse(cx, cy, r * 2.3, r, 0, 0, 6.3); g.stroke();
      }
    }
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  var floorTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#1c130b'; g.fillRect(0, 0, w, h);
    for (var b = 0; b < 8; b++) {
      var y0 = b * 64;
      g.fillStyle = 'rgba(' + (28 + rnd() * 10 | 0) + ',' + (18 + rnd() * 6 | 0) + ',' + (9 + rnd() * 4 | 0) + ',1)';
      g.fillRect(0, y0, w, 62);
      for (var i = 0; i < 40; i++) {
        g.strokeStyle = 'rgba(0,0,0,' + (0.1 + rnd() * 0.2) + ')'; g.lineWidth = 0.8 + rnd();
        var y = y0 + rnd() * 62; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 3); g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, y0 + 62, w, 2);
      g.fillRect(rnd() * w, y0, 2, 62);
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
  var wallTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#2a1f14'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) {
      g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '90,70,45') + ',' + (rnd() * 0.12) + ')';
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3);
    }
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(4, 2);

  /* ── la pièce ── */
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.82, metalness: 0.04 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var WALL_Z = -2.4;
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }));
  wall.position.set(0, 3.5, WALL_Z); scene.add(wall);
  var plinth = new THREE.Mesh(new THREE.BoxGeometry(16, 0.14, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.9 }));
  plinth.position.set(0, 0.07, WALL_Z + 0.03); scene.add(plinth);

  /* ── lumières ── */
  scene.add(new THREE.AmbientLight(0x4a3520, 0.42));
  var hemi = new THREE.HemisphereLight(0x5a4530, 0x0d0a07, 0.28); scene.add(hemi);
  /* La bougie et la fenêtre sont rapprochées de l'axe : en PORTRAIT (la
     colonne collante) le champ ne va que de −1,6 à +2,3 environ, et les deux
     sources de lumière doivent rester DANS le cadre au repos. */
  var CANDLE = new THREE.Vector3(-1.4, 1.22, 0.75);
  var candle = new THREE.PointLight(0xffb15c, 1.55, 11, 1.6);
  candle.position.copy(CANDLE); scene.add(candle);
  var window_ = new THREE.DirectionalLight(0x9fb8d0, 0);
  window_.position.set(4, 3.2, 1.5); scene.add(window_);
  var windowFill = new THREE.PointLight(0x88a7c4, 0, 12, 1.5);
  windowFill.position.set(3.4, 2.2, 0.4); scene.add(windowFill);

  /* la bougie elle-même : tabouret, cire, flamme */
  var stool = new THREE.Group();
  var brass = new THREE.MeshStandardMaterial({ color: 0x9a7b30, roughness: 0.35, metalness: 0.8 });
  var stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.05, 24),
    new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 }));
  stoolTop.position.y = 0.62; stool.add(stoolTop);
  for (var li = 0; li < 3; li++) {
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.62, 8),
      new THREE.MeshStandardMaterial({ color: 0x3c2712, roughness: 0.8 }));
    var an = li * 2.094; leg.position.set(Math.cos(an) * 0.15, 0.31, Math.sin(an) * 0.15);
    leg.rotation.z = Math.cos(an) * 0.12; leg.rotation.x = -Math.sin(an) * 0.12; stool.add(leg);
  }
  var pan = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.02, 24), brass);
  pan.position.y = 0.655; stool.add(pan);
  var wax = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.038, 0.42, 16),
    new THREE.MeshStandardMaterial({ color: 0xe9ddc2, roughness: 0.6, emissive: 0x3a2a10, emissiveIntensity: 0.5 }));
  wax.position.y = 0.875; stool.add(wax);
  stool.position.set(CANDLE.x, 0, CANDLE.z);
  scene.add(stool);
  var flameTex = tex(64, 96, function (g, w, h) {
    var gr = g.createRadialGradient(w / 2, h * 0.62, 2, w / 2, h * 0.55, w * 0.55);
    gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.25, 'rgba(255,210,120,.95)');
    gr.addColorStop(0.55, 'rgba(255,140,50,.45)'); gr.addColorStop(1, 'rgba(255,100,30,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.scale.set(0.16, 0.26, 1); flame.position.set(CANDLE.x, 1.15, CANDLE.z); scene.add(flame);
  var haloTex = tex(128, 128, function (g, w, h) {
    var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,170,80,.55)'); gr.addColorStop(0.4, 'rgba(255,140,60,.16)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(1.6, 1.6, 1); halo.position.copy(flame.position); scene.add(halo);

  /* ── la table ── */
  var wood = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.58, metalness: 0.05 });
  var rig = new THREE.Group();           /* pivot au centre du volume */
  var body = new THREE.Group(); rig.add(body);
  var H = 0.82, PIV = H / 2;
  var top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.1), wood);
  top.position.y = H - 0.04 - PIV; body.add(top);
  var apron = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.11, 0.94), wood);
  apron.position.y = H - 0.08 - 0.055 - PIV; body.add(apron);
  var legTips = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    var lg = new THREE.Mesh(new THREE.BoxGeometry(0.085, H - 0.14, 0.085), wood);
    lg.position.set(c[0] * 0.8, (H - 0.14) / 2 - PIV, c[1] * 0.42);
    body.add(lg);
    legTips.push(new THREE.Vector3(c[0] * 0.8, -PIV, c[1] * 0.42));
  });
  rig.position.set(0.15, PIV, -0.1);
  scene.add(rig);

  /* ombre portée au sol : un disque doux, qui s'éteint quand la table décolle */
  var shadowTex = tex(128, 128, function (g, w, h) {
    var gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(0.6, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.9),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  floorShadow.rotation.x = -Math.PI / 2; floorShadow.position.set(rig.position.x + 0.25, 0.006, rig.position.z + 0.1);
  scene.add(floorShadow);

  /* l'ombre au mur : la silhouette de la table, puis deux personnes.
     Ce n'est pas une ombre calculée — c'est un dessin, et c'est le point :
     l'ombre dit ce que la chose masque. */
  function silTable(g, w, h) {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.72)';
    g.fillRect(w * 0.14, h * 0.48, w * 0.72, h * 0.06);
    g.fillRect(w * 0.18, h * 0.54, w * 0.64, h * 0.05);
    [0.2, 0.76].forEach(function (x) { g.fillRect(w * x, h * 0.54, w * 0.045, h * 0.34); });
    [0.27, 0.69].forEach(function (x) { g.globalAlpha = 0.55; g.fillRect(w * x, h * 0.56, w * 0.04, h * 0.29); g.globalAlpha = 1; });
  }
  function silPeople(g, w, h) {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.74)';
    function person(cx, dir) {
      g.beginPath(); g.arc(cx, h * 0.22, w * 0.062, 0, 6.3); g.fill();      /* tête */
      g.beginPath();                                                          /* buste et manteau */
      g.moveTo(cx - w * 0.07, h * 0.31); g.lineTo(cx + w * 0.07, h * 0.31);
      g.lineTo(cx + w * 0.10, h * 0.62); g.lineTo(cx + w * 0.09, h * 0.94);
      g.lineTo(cx - w * 0.09, h * 0.94); g.lineTo(cx - w * 0.10, h * 0.62); g.closePath(); g.fill();
      g.beginPath();                                                          /* le bras tendu vers l'autre */
      g.moveTo(cx + dir * w * 0.06, h * 0.36); g.lineTo(cx + dir * w * 0.24, h * 0.46);
      g.lineTo(cx + dir * w * 0.23, h * 0.50); g.lineTo(cx + dir * w * 0.05, h * 0.42); g.closePath(); g.fill();
    }
    person(w * 0.27, 1); person(w * 0.73, -1);
  }
  var silTableTex = tex(256, 256, silTable), silPeopleTex = tex(256, 256, silPeople);
  var wallShadowT = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8),
    new THREE.MeshBasicMaterial({ map: silTableTex, transparent: true, depthWrite: false }));
  var wallShadowP = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8),
    new THREE.MeshBasicMaterial({ map: silPeopleTex, transparent: true, depthWrite: false, opacity: 0 }));
  wallShadowT.position.set(0.55, 1.32, WALL_Z + 0.012);
  wallShadowP.position.set(0.55, 1.5, WALL_Z + 0.014);
  scene.add(wallShadowT); scene.add(wallShadowP);

  /* l'étiquette de valeur, pendue à un pied */
  var tagTex = tex(256, 160, function (g, w, h) {
    g.fillStyle = '#e4d3ac'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 300; i++) { g.fillStyle = 'rgba(120,90,50,' + rnd() * 0.08 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    g.fillStyle = '#3a2a14'; g.beginPath(); g.arc(w / 2, 16, 5, 0, 6.3); g.fill();
    g.fillStyle = '#2b1c0e'; g.textAlign = 'center';
    g.font = '600 26px "Caveat", "Spectral", Georgia, serif';
    g.fillText('1 table', w / 2, 66);
    g.font = '500 24px "Caveat", "Spectral", Georgia, serif';
    g.fillText('= 20 mètres de toile', w / 2, 100);
    g.font = 'italic 15px "Spectral", Georgia, serif'; g.fillStyle = '#6b5232';
    g.fillText('forme équivalent', w / 2, 134);
  });
  var tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, opacity: 0, side: THREE.DoubleSide });
  var tag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.21), tagMat);
  var tagPivot = new THREE.Group(); tagPivot.add(tag); tag.position.y = -0.31;
  var threadMat = new THREE.LineBasicMaterial({ color: 0xcdbb95, transparent: true, opacity: 0 });
  var threadGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.21, 0)]);
  tagPivot.add(new THREE.Line(threadGeo, threadMat));
  scene.add(tagPivot);

  /* poussière */
  var N = 160, pos = new Float32Array(N * 3), vel = [];
  for (var i = 0; i < N; i++) {
    pos[i * 3] = (rnd() - 0.5) * 5; pos[i * 3 + 1] = rnd() * 2.6; pos[i * 3 + 2] = (rnd() - 0.5) * 3 - 0.3;
    vel.push({ x: (rnd() - 0.5) * 0.02, y: (rnd() - 0.5) * 0.015, p: rnd() * 6.28 });
  }
  var dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd9a0, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(dust);


  /* ══ La pièce s'habille — et tout vient du texte ══════════════════════
     « en face des AUTRES MARCHANDISES » : la toile (les 20 mètres de
     l'étiquette), l'habit, les bottes — les exemples du chapitre I.
     « le travail du menuisier se voit » : le rabot, la scie, les copeaux.
     Le tapis et la fenêtre sont le mobilier de la maison (la bibliothèque a
     les mêmes) ; la fenêtre est la source de l'AUTRE lumière, celle des
     contre-mondes, qui n'était jusque-là qu'une lampe sans corps. */
  function std(o) { return new THREE.MeshStandardMaterial(o); }

  /* le tapis, usé */
  var rugTex = tex(512, 352, function (g, w, h) {
    g.fillStyle = '#4a2a1c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; g.strokeRect(22, 22, w - 44, h - 44);
    g.lineWidth = 2; g.strokeRect(40, 40, w - 80, h - 80);
    g.fillStyle = 'rgba(138,106,58,.55)';
    for (var i = 0; i < 9; i++) for (var j = 0; j < 6; j++) {
      var x = 70 + i * 46, y = 68 + j * 44;
      g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 10, y); g.lineTo(x, y + 10); g.lineTo(x - 10, y); g.closePath(); g.fill();
    }
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(w / 2, h / 2, 110, 62, 0, 0, 6.3); g.stroke();
    g.beginPath(); g.ellipse(w / 2, h / 2, 60, 34, 0, 0, 6.3); g.stroke();
    for (var k = 0; k < 900; k++) { g.fillStyle = 'rgba(20,10,5,' + rnd() * 0.18 + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 1 + rnd() * 2); }
    for (var f = 0; f < w; f += 7) { g.fillStyle = '#a58b5a'; g.fillRect(f, 0, 2, 12); g.fillRect(f, h - 12, 2, 12); }
  });
  var rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.34), std({ map: rugTex, roughness: 0.96 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.25, 0.003, 0.05); rug.rotation.z = 0.03; scene.add(rug);

  /* la fenêtre, à droite : la nuit derrière, le cadre devant, la vitre qui
     s'allume avec la lumière froide */
  var win = new THREE.Group();
  var WX = 2.1, WY = 2.05, WW = 0.86, WH = 1.26;
  var skyTex = tex(128, 192, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#0e1a2c'); gr.addColorStop(1, '#1a2536');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 40; i++) { g.fillStyle = 'rgba(220,230,255,' + (0.3 + rnd() * 0.7) + ')'; g.fillRect(rnd() * w, rnd() * h * 0.7, 1, 1); }
    g.fillStyle = '#e8eef8'; g.beginPath(); g.arc(w * 0.66, h * 0.24, 9, 0, 6.3); g.fill();
    g.fillStyle = '#0e1a2c'; g.beginPath(); g.arc(w * 0.66 + 5, h * 0.24 - 3, 8, 0, 6.3); g.fill();
    g.fillStyle = '#06090f'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.78); g.lineTo(w * 0.2, h * 0.72); g.lineTo(w * 0.32, h * 0.8); g.lineTo(w * 0.5, h * 0.7); g.lineTo(w * 0.62, h * 0.76); g.lineTo(w * 0.8, h * 0.68); g.lineTo(w, h * 0.75); g.lineTo(w, h); g.fill();
  });
  var sky = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: skyTex, fog: false }));
  sky.position.set(0, 0, 0.004); win.add(sky);
  var frameMat = std({ color: 0x2b1a0e, roughness: 0.8 });
  [[0, WH / 2 + 0.03, WW + 0.14, 0.07], [0, -WH / 2 - 0.04, WW + 0.2, 0.09], [-WW / 2 - 0.035, 0, 0.07, WH], [WW / 2 + 0.035, 0, 0.07, WH],
   [0, 0, 0.035, WH], [0, 0, WW, 0.035]].forEach(function (b) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(b[2], b[3], 0.06), frameMat); m.position.set(b[0], b[1], 0.03); win.add(m);
  });
  var glass = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ color: 0x9fb8d0, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glass.position.set(0, 0, 0.01); win.add(glass);
  var moonGlowTex = tex(128, 128, function (g, w, h) {
    var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(150,180,220,.5)'); gr.addColorStop(0.5, 'rgba(120,150,200,.12)'); gr.addColorStop(1, 'rgba(100,130,180,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonGlowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }));
  moonGlow.scale.set(2.6, 2.6, 1); moonGlow.position.set(0, 0, 0.2); win.add(moonGlow);
  win.position.set(WX, WY, WALL_Z); scene.add(win);
  windowFill.position.set(WX - 0.4, WY - 0.3, WALL_Z + 0.9);
  window_.position.set(WX + 1.5, WY + 1.2, WALL_Z + 1.2);
  /* le rai de lune sur le sol, sous la fenêtre */
  var rayTex = tex(128, 128, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(150,180,220,.28)'); gr.addColorStop(1, 'rgba(150,180,220,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.7, 0); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  });
  var ray = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  ray.rotation.x = -Math.PI / 2; ray.rotation.z = -0.35; ray.position.set(WX - 0.9, 0.005, WALL_Z + 1.3); scene.add(ray);

  /* l'habit, à un clou */
  var clothTex = tex(128, 256, function (g, w, h) {
    g.fillStyle = '#2a2219'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 9; i++) { var x = 8 + i * 14 + rnd() * 4; var gr = g.createLinearGradient(x - 6, 0, x + 6, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(70,58,40,.25)');
      g.fillStyle = gr; g.fillRect(x - 6, 0, 12, h); }
    for (var k = 0; k < 500; k++) { g.fillStyle = 'rgba(0,0,0,' + rnd() * 0.15 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  var cloth = std({ map: clothTex, color: 0x9a8a72, roughness: 0.98 });
  var coat = new THREE.Group();
  var sh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.13), cloth); sh.position.y = 0.36; coat.add(sh);
  var bd = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.72, 0.11), cloth); bd.position.y = 0; bd.scale.set(1, 1, 1); coat.add(bd);
  var col = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.14), std({ color: 0x3d2f22, roughness: 0.9 })); col.position.set(0, 0.42, 0.01); coat.add(col);
  [-1, 1].forEach(function (d) { var sl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.11), cloth); sl.position.set(d * 0.27, 0.05, 0); sl.rotation.z = d * 0.08; coat.add(sl); });
  var nail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), brass); nail.rotation.x = Math.PI / 2; nail.position.set(0, 0.48, -0.05); coat.add(nail);
  coat.position.set(-0.95, 1.72, WALL_Z + 0.12); scene.add(coat);

  /* la toile, roulée, au pied du mur, avec son bout qui traîne */
  var linenTex = tex(128, 128, function (g, w, h) {
    g.fillStyle = '#cdbb95'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < w; i += 3) { g.fillStyle = 'rgba(90,70,40,.18)'; g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); }
  });
  linenTex.wrapS = linenTex.wrapT = THREE.RepeatWrapping; linenTex.repeat.set(4, 2);
  var linen = std({ map: linenTex, roughness: 0.9 });
  var roll = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.62, 20), linen);
  roll.rotation.z = Math.PI / 2; roll.rotation.y = 0.35; roll.position.set(1.55, 0.13, 0.55); scene.add(roll);
  var flap = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), linen);
  flap.rotation.x = -Math.PI / 2; flap.rotation.z = 0.35; flap.position.set(1.2, 0.006, 0.7); scene.add(flap);

  /* les bottes, contre le mur */
  var leather = std({ color: 0x2a1a10, roughness: 0.55, metalness: 0.08 });
  [-0.12, 0.1].forEach(function (dx, i) {
    var b = new THREE.Group();
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.3, 12), leather); shaft.position.y = 0.2; b.add(shaft);
    var foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), leather); foot.position.set(0, 0.035, 0.07); b.add(foot);
    b.position.set(1.85 + dx, 0, WALL_Z + 0.38 + (i ? 0.06 : 0)); b.rotation.y = i ? -0.3 : 0.15; scene.add(b);
  });

  /* le rabot, la scie, les copeaux : le travail du menuisier */
  var toolWood = std({ map: woodTex, roughness: 0.6 });
  var rabot = new THREE.Group();
  var rb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.075), toolWood); rb.position.y = 0.035; rabot.add(rb);
  var rw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.05), toolWood); rw.position.set(0.02, 0.1, 0); rw.rotation.z = -0.3; rabot.add(rw);
  var rblade = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.1, 0.06), std({ color: 0x8e9299, roughness: 0.3, metalness: 0.9 })); rblade.position.set(-0.02, 0.09, 0); rblade.rotation.z = -0.3; rabot.add(rblade);
  var rknob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), toolWood); rknob.position.set(-0.11, 0.09, 0); rabot.add(rknob);
  rabot.position.set(1.15, 0.008, 0.95); rabot.rotation.y = -0.6; scene.add(rabot);
  var sawTex = tex(256, 64, function (g, w, h) {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.moveTo(0, 6); g.lineTo(w, 20); g.lineTo(w, 52); g.lineTo(0, 58); g.fill();
    g.fillStyle = '#6b7078'; for (var x = 0; x < w; x += 8) { g.beginPath(); g.moveTo(x, 58 - x * 0.023); g.lineTo(x + 4, 63 - x * 0.023); g.lineTo(x + 8, 58 - x * 0.023); g.fill(); }
  });
  var saw = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ map: sawTex, transparent: true, side: THREE.DoubleSide }));
  /* posée à plat au sol, près du tabouret — appuyée au mur elle semblait
     flotter, un plan sans épaisseur ne « touche » rien */
  saw.rotation.x = -Math.PI / 2; saw.rotation.z = 0.5; saw.position.set(-1.25, 0.012, 0.15); scene.add(saw);
  var sawHandle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.09), toolWood);
  sawHandle.position.set(-1.25 + Math.cos(0.5) * 0.34, 0.02, 0.15 - Math.sin(0.5) * 0.34); sawHandle.rotation.y = 0.5; scene.add(sawHandle);
  var shavingMat = std({ color: 0xc9a46a, roughness: 0.9, side: THREE.DoubleSide });
  var shavingGeo = new THREE.TorusGeometry(0.028, 0.006, 4, 10, 4.2);
  for (var si = 0; si < 34; si++) {
    var sv = new THREE.Mesh(shavingGeo, shavingMat);
    var a = rnd() * 6.28, r = 0.55 + rnd() * 0.75;
    sv.position.set(rig.position.x + Math.cos(a) * r * 1.3, 0.01, rig.position.z + 0.15 + Math.sin(a) * r * 0.75);
    sv.rotation.set(Math.PI / 2 + (rnd() - 0.5) * 0.6, rnd() * 6.28, rnd() * 6.28);
    sv.scale.setScalar(0.7 + rnd() * 0.8);
    scene.add(sv);
  }

  /* les coulures de la bougie */
  var waxMat = std({ color: 0xe9ddc2, roughness: 0.7 });
  for (var wi = 0; wi < 4; wi++) {
    var drip = new THREE.Mesh(new THREE.SphereGeometry(0.014 + rnd() * 0.012, 8, 6), waxMat);
    var wa = rnd() * 6.28; drip.position.set(Math.cos(wa) * 0.045, 0.67 + rnd() * 0.02, Math.sin(wa) * 0.045); drip.scale.y = 0.5; stool.add(drip);
  }
  var run = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, 0.09, 8), waxMat); run.position.set(0.036, 0.66 + 0.30, 0.01); stool.add(run);

  /* le fil de l'étiquette devient ROUGE — le signet de la maison */
  threadMat.color.setHex(0xd5402f);

  /* ── chorégraphie ── */
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  var G = 0, T = 0;
  var st = { flip: 0, lift: 0, dance: 0, tag: 0, people: 0, cold: 0, near: 0 };
  function set(g) { G = g; }
  function compute() {
    var up = ss(2.0, 3.0, G), down = ss(4.15, 5.05, G);
    st.flip = up - down;
    st.lift = Math.sin(Math.PI * cl((G - 2.0) / 1.0)) * 0.62 + Math.sin(Math.PI * cl((G - 4.15) / 0.9)) * 0.5;
    st.dance = ss(2.75, 3.35, G) * (1 - ss(4.0, 4.6, G));
    st.tag = ss(2.35, 2.8, G) * (1 - ss(4.3, 4.75, G));
    st.people = ss(3.05, 3.7, G) * (1 - ss(4.35, 4.95, G));
    st.cold = ss(4.05, 4.85, G);
    st.near = ss(0.9, 1.8, G) * (1 - ss(2.3, 2.9, G));
  }
  var swing = { a: 0, v: 0 };
  function frame(dt) {
    T += dt; compute();
    var fl = 1 + 0.09 * Math.sin(T * 7.3) + 0.05 * Math.sin(T * 11.1 + 1) + 0.03 * Math.sin(T * 23.7);
    candle.intensity = 1.55 * fl * (1 - 0.45 * st.cold);
    flame.scale.set(0.16 * (0.92 + 0.12 * fl), 0.26 * (0.9 + 0.2 * fl), 1);
    flame.position.x = CANDLE.x + 0.008 * Math.sin(T * 9.1);
    halo.material.opacity = 0.9 * (1 - 0.5 * st.cold);
    window_.intensity = 1.35 * st.cold; windowFill.intensity = 0.9 * st.cold;
    glass.material.opacity = 0.04 + 0.30 * st.cold;
    moonGlow.material.opacity = 0.9 * st.cold; ray.material.opacity = 0.85 * st.cold;
    hemi.intensity = 0.28 + 0.5 * st.cold;

    /* la table */
    var d = st.dance;
    rig.rotation.z = Math.PI * st.flip + d * 0.11 * Math.sin(T * 1.7);
    rig.rotation.x = d * 0.08 * Math.sin(T * 2.3 + 1);
    rig.rotation.y = st.flip * 0.35 * Math.sin(T * 0.55) * (0.25 + d);
    rig.position.y = PIV + st.lift + d * 0.05 * (1 + Math.sin(T * 3.1)) / 2;
    rig.position.x = 0.15 + d * 0.12 * Math.sin(T * 1.1) - st.near * 0.05;
    rig.position.z = -0.1 + st.near * 0.35;
    floorShadow.material.opacity = 1 - 0.55 * cl(st.lift / 0.4);
    floorShadow.scale.setScalar(1 + 0.25 * cl(st.lift / 0.4));

    /* l'ombre au mur suit la table, puis dit autre chose */
    wallShadowT.rotation.z = rig.rotation.z * 0.9;
    wallShadowT.position.y = 1.32 + st.lift * 0.9;
    wallShadowT.material.opacity = (1 - st.people) * (1 - 0.3 * st.cold);
    wallShadowP.material.opacity = st.people * 0.86;
    wallShadowP.position.x = 0.55 + 0.04 * Math.sin(T * 0.8) * st.people;

    /* l'étiquette pend au pied avant-droit ; le pied est en l'air quand la table est sur sa tête */
    var tipLocal = legTips[3].clone();
    body.localToWorld(tipLocal); rig.updateMatrixWorld();
    var tipWorld = legTips[3].clone().applyMatrix4(rig.matrixWorld);
    tagPivot.position.copy(tipWorld);
    var target = rig.rotation.z * 0.15 + d * 0.3 * Math.sin(T * 2.1);
    swing.v += (target - swing.a) * 6 * dt; swing.v *= Math.exp(-3 * dt); swing.a += swing.v * dt;
    tagPivot.rotation.z = swing.a; tagPivot.rotation.y = 0.25 * Math.sin(T * 0.9);
    tagMat.opacity = st.tag; threadMat.opacity = st.tag * 0.8;

    /* poussière */
    var p = dustGeo.attributes.position.array;
    for (var i = 0; i < N; i++) {
      p[i * 3] += vel[i].x * dt * 6 + Math.sin(T * 0.7 + vel[i].p) * 0.0006;
      p[i * 3 + 1] += vel[i].y * dt * 6 + 0.0004;
      if (p[i * 3 + 1] > 2.7) p[i * 3 + 1] = 0.05;
      if (p[i * 3] > 2.6) p[i * 3] = -2.6; if (p[i * 3] < -2.6) p[i * 3] = 2.6;
    }
    dustGeo.attributes.position.needsUpdate = true;

    /* la caméra respire à peine, et s'approche quand on regarde la table */
    camera.position.x = CAM.x + 0.02 * Math.sin(T * 0.31);
    camera.position.y = CAM.y + 0.015 * Math.sin(T * 0.43 + 1) - st.near * 0.12;
    camera.position.z = CAM.z - st.near * 0.4;
    camera.lookAt(CAM.ax, CAM.ay + st.lift * 0.3, CAM.az);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var v = 2 * Math.atan(Math.tan(HFOV * Math.PI / 360) / camera.aspect) * 180 / Math.PI;
    camera.fov = Math.max(34, Math.min(78, v));
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st };
};

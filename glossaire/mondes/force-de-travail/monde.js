/* LE MONDE DE LA FORCE DE TRAVAIL — le passage.
   Le chapitre VI se termine en franchissant un seuil : on quitte « cette
   sphère bruyante où tout se passe à la surface et aux regards de tous »
   pour « le laboratoire secret de la production ». La page est ce
   travelling. Une rue, en plein écran : à gauche la place du marché — l'étal
   des subsistances (ce qui fait la valeur de la force), le sablier (ce qui
   se vend est un temps), l'arche gravée LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ ·
   BENTHAM ; à droite l'atelier, sa porte, son écriteau, et dedans l'établi
   et l'horloge. Deux vrais corps, scannés : l'homme aux écus (un des
   abolitionnistes du groupe The Fugitive's Story de John Rogers, 1869, en
   redingote, coiffé ici d'un haut-de-forme) et le possesseur de force de
   travail (le laboureur de The Wounded Scout, 1864) — Smithsonian, CC0.
   Égaux sur le marché, face à face ; à la cinquième étape ils marchent
   vers la porte, le premier devant, le second derrière, et le jour tombe ;
   à la sixième on est dedans. Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  var BG = 0x0c0906;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(BG, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x8a7a66, 14, 40);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 17; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le ciel, le soleil ── */
  var sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), new THREE.MeshBasicMaterial({ color: 0x9db4d2, fog: false }));
  sky.position.set(4, 20, -34); scene.add(sky);
  var sun = new THREE.DirectionalLight(0xfff0d0, 1.6); sun.position.set(-6, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -8; sun.shadow.camera.right = 12; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -4; sun.shadow.camera.near = 1; sun.shadow.camera.far = 40; sun.shadow.bias = -0.0008;
  sun.target.position.set(3, 0, -1); scene.add(sun); scene.add(sun.target);
  var hemi = new THREE.HemisphereLight(0xa8c0e0, 0x4a3a2a, 0.7); scene.add(hemi);
  var amb = new THREE.AmbientLight(0x6a5a48, 0.3); scene.add(amb);

  /* ── le sol pavé ── */
  var cobTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#4a4238'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 26) for (var x = (y / 26 % 2) * 20; x < w + 40; x += 40) { var v = 96 + rnd() * 34 | 0; g.fillStyle = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 20) + ')'; g.beginPath(); g.roundRect ? g.roundRect(x - 20 + 2, y + 2, 36, 22, 6) : g.rect(x - 20 + 2, y + 2, 36, 22); g.fill(); }
  });
  cobTex.wrapS = cobTex.wrapT = THREE.RepeatWrapping; cobTex.repeat.set(10, 6);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 36), std({ map: cobTex, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  /* ── les façades ── */
  function facadeTex(base, rows, cols) { return tex(512, 512, function (g, w, h) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '160,140,110') + ',' + rnd() * 0.1 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    var cw = w / cols, rh = h / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { var x = c * cw + cw * 0.3, y = r * rh + rh * 0.22, ww = cw * 0.4, hh = rh * 0.56;
      g.fillStyle = '#1e1812'; g.fillRect(x, y, ww, hh); g.fillStyle = '#5a4a3a'; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh / 2 - 1, ww, 2); g.fillStyle = '#7a6a56'; g.fillRect(x - 4, y + hh, ww + 8, 5); }
  }); }
  var stone = std({ color: 0xb8a88c, roughness: 0.85 });
  [[-6.5, 5.6, -6.5, 7, '#8d7d68', 3, 4], [1.5, 4.8, -7.2, 6, '#9a8a72', 3, 3], [12, 6.2, -6.8, 8, '#7d6d58', 4, 4], [-12, 5, -6, 5, '#8a7a66', 3, 3]].forEach(function (b) {
    var t = facadeTex(b[4], b[5], b[6]); var m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[1], 4), std({ map: t, roughness: 0.9 })); m.position.set(b[0], b[1] / 2, b[2]); m.castShadow = m.receiveShadow = true; scene.add(m);
  });

  /* ── l'atelier : façade, porte, écriteau, lanterne ── */
  var shop = new THREE.Group();
  var shopWall = new THREE.Mesh(new THREE.BoxGeometry(7, 4.6, 0.4), std({ color: 0x3a2f26, roughness: 0.92 })); shopWall.position.set(0, 2.3, 0); shopWall.castShadow = shopWall.receiveShadow = true;
  /* la porte est un trou : deux pans et un linteau */
  shop.add(shopWall);
  /* la porte est un trou : le mur y est percé par deux faces noires, une
     devant, une derrière — pas un bloc, la caméra doit pouvoir le TRAVERSER */
  var holeMat = new THREE.MeshBasicMaterial({ color: 0x050403 });
  var holeF = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.5), holeMat); holeF.position.set(-1.2, 1.25, 0.205); shop.add(holeF);
  var holeB = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.5), holeMat); holeB.rotation.y = Math.PI; holeB.position.set(-1.2, 1.25, -0.205); shop.add(holeB);
  var jamb = std({ color: 0x241a12, roughness: 0.85 });
  [[-1.9, 1.3, 0.14, 2.6], [-0.5, 1.3, 0.14, 2.6], [-1.2, 2.65, 1.6, 0.14]].forEach(function (j) { var m = new THREE.Mesh(new THREE.BoxGeometry(j[2], j[3], 0.5), jamb); m.position.set(j[0], j[1], 0.02); shop.add(m); });
  var signTex = tex(512, 128, function (g, w, h) { g.fillStyle = '#d9c9a3'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a14'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#2b1c0e'; g.textAlign = 'center'; g.font = '700 36px "Inter", Georgia, serif'; g.fillText('NO ADMITTANCE', w / 2, 56); g.font = '600 26px "Inter", Georgia, serif'; g.fillText('EXCEPT ON BUSINESS', w / 2, 96); });
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: signTex })); sign.position.set(-1.2, 3.1, 0.22); shop.add(sign);
  var roof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.18, 1.2), std({ color: 0x241a12, roughness: 0.9 })); roof.position.set(0, 4.7, 0.3); roof.castShadow = true; shop.add(roof);
  [[1.2, 3.2], [2.6, 3.2], [2.6, 1.6]].forEach(function (p) { var wi = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshBasicMaterial({ color: 0x0d0a08 })); wi.position.set(p[0], p[1], 0.21); shop.add(wi); var bar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.05), jamb); bar.position.set(p[0], p[1] + 0.42, 0.24); shop.add(bar); });
  var lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd08a })); lampMesh.position.set(-1.2, 3.55, 0.35); shop.add(lampMesh);
  var haloTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,110,.6)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); halo.scale.set(1.6, 1.6, 1); halo.position.set(-1.2, 3.55, 0.45); shop.add(halo);
  var doorLamp = new THREE.PointLight(0xffb15c, 0, 8, 1.6); doorLamp.position.set(-1.2, 3.3, 1.0); shop.add(doorLamp);
  var SHOP_X = 8.4, SHOP_Z = -2.2; shop.position.set(SHOP_X, 0, SHOP_Z); scene.add(shop);
  var DOOR = V3(SHOP_X - 1.2, 0, SHOP_Z + 0.4);

  /* ── l'intérieur : l'établi, la machine, l'horloge, la fenêtre ── */
  var inside = new THREE.Group();
  var backWall = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 4.6), std({ color: 0x2a2018, roughness: 0.95 })); backWall.position.set(0, 2.3, -3.2); backWall.receiveShadow = true; inside.add(backWall);
  var sideWall = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.6), std({ color: 0x2a2018, roughness: 0.95 })); sideWall.rotation.y = -Math.PI / 2; sideWall.position.set(4.6, 2.3, -1.2); inside.add(sideWall);
  var woodTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#5a3b20'; g.fillRect(0, 0, w, h); for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(30,16,6,' + (0.08 + rnd() * 0.14) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 8); g.stroke(); } });
  var wood = std({ map: woodTex, roughness: 0.7 });
  var bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.8), wood); bench.position.set(0.6, 0.9, -2.2); bench.castShadow = bench.receiveShadow = true; inside.add(bench);
  [[-0.9, -2.5], [2.1, -2.5], [-0.9, -1.9], [2.1, -1.9]].forEach(function (c) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.09), wood); l.position.set(c[0], 0.45, c[1]); inside.add(l); });
  /* le métier : cadre, roue, broches */
  var loom = new THREE.Group();
  [-0.5, 0.5].forEach(function (x) { var s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), wood); s.position.set(x, 0.35, 0); loom.add(s); });
  var rail = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.06, 0.08), wood); rail.position.set(0, 0.62, 0); loom.add(rail);
  var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 8, 30), wood); wheel.position.set(-0.75, 0.42, 0); loom.add(wheel);
  for (var k = 0; k < 6; k++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.5, 0.015), wood); sp.rotation.z = k * Math.PI / 6; sp.position.copy(wheel.position); loom.add(sp); }
  var spindles = [];
  for (k = 0; k < 6; k++) { var s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), std({ color: 0x8e9299, metalness: 0.8, roughness: 0.35 })); s2.position.set(-0.38 + k * 0.15, 0.45, 0.02); loom.add(s2); spindles.push(s2); }
  loom.position.set(0.3, 0.95, -2.25); inside.add(loom);
  var clockTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#e9dfc8'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 6.3); g.fill(); g.strokeStyle = '#2b1c0e'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#2b1c0e'; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; g.fillRect(w / 2 + Math.cos(a) * 96 - 3, h / 2 + Math.sin(a) * 96 - 3, 6, 6); }
    g.strokeStyle = '#2b1c0e'; g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2, h / 2 - 70); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 60, h / 2 - 40); g.stroke();
    g.font = 'italic 22px "Spectral", Georgia, serif'; g.textAlign = 'center'; g.fillText('XII heures', w / 2, h / 2 + 60); });
  var clock = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ map: clockTex })); clock.position.set(1.6, 3.0, -3.18); inside.add(clock);
  var insideLamp = new THREE.PointLight(0xffb15c, 0, 9, 1.6); insideLamp.position.set(0.4, 2.6, -1.4); inside.add(insideLamp);
  var flameTex = tex(64, 96, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h * 0.6, 2, w / 2, h * 0.55, w * 0.55); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.3, 'rgba(255,210,120,.9)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var insideFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); insideFlame.scale.set(0.16, 0.24, 1); insideFlame.position.copy(insideLamp.position); inside.add(insideFlame);
  var winGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: 0x6f8aa8, fog: false })); winGlow.position.set(-1.9, 2.4, -3.17); inside.add(winGlow);
  inside.position.set(SHOP_X, 0, SHOP_Z); scene.add(inside);

  /* ── l'arche de l'Éden ── */
  var arch = new THREE.Group();
  [-1.05, 1.05].forEach(function (x) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.2, 0.38), stone); p.position.set(x, 1.6, 0); p.castShadow = true; arch.add(p); var cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), stone); cap.position.set(x, 3.26, 0); arch.add(cap); });
  var lintel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 0.42), stone); lintel.position.set(0, 3.55, 0); lintel.castShadow = true; arch.add(lintel);
  var edenTex = tex(1024, 192, function (g, w, h) { g.fillStyle = '#b8a88c'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.font = '700 46px "Fraunces", Georgia, serif'; g.fillStyle = 'rgba(40,28,14,.75)'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2 + 2, h / 2 + 18); g.fillStyle = '#6b5a42'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2, h / 2 + 16); });
  var edenGlowTex = tex(1024, 192, function (g, w, h) { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = '700 46px "Fraunces", Georgia, serif'; g.shadowColor = 'rgba(216,173,76,.9)'; g.shadowBlur = 18; g.fillStyle = '#ffd98a'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2, h / 2 + 16); });
  var eden = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: edenTex })); eden.position.set(0, 3.55, 0.215); arch.add(eden);
  var edenGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: edenGlowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); edenGlow.position.set(0, 3.55, 0.22); arch.add(edenGlow);
  arch.position.set(2.4, 0, -1.4); scene.add(arch);

  /* ── l'étal des subsistances ── */
  var stall = new THREE.Group();
  var top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.85), wood); top.position.y = 0.88; top.castShadow = top.receiveShadow = true; stall.add(top);
  [[-0.8, -0.32], [0.8, -0.32], [-0.8, 0.32], [0.8, 0.32]].forEach(function (c) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.88, 0.07), wood); l.position.set(c[0], 0.44, c[1]); stall.add(l); });
  var awnTex = tex(128, 64, function (g, w, h) { for (var x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#c9b48c' : '#8a3a2a'; g.fillRect(x, 0, 16, h); } });
  var awning = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), std({ map: awnTex, roughness: 0.9, side: THREE.DoubleSide })); awning.position.set(0, 2.1, -0.1); awning.rotation.x = -1.25; awning.castShadow = true; stall.add(awning);
  [-0.9, 0.9].forEach(function (x) { var p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 8), wood); p.position.set(x, 1.15, -0.48); stall.add(p); });
  var bread = std({ color: 0xc08a48, roughness: 0.8 });
  [[-0.6, 0.0], [-0.45, 0.16], [-0.66, 0.22]].forEach(function (b) { var m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bread); m.scale.set(1.4, 0.7, 0.9); m.position.set(b[0], 0.99, b[1]); m.castShadow = true; stall.add(m); });
  var cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16), std({ color: 0xcdbb95, roughness: 0.9 })); cloth.rotation.z = Math.PI / 2; cloth.position.set(0.05, 1.02, 0.15); cloth.castShadow = true; stall.add(cloth);
  var coal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), std({ color: 0x241f1a, roughness: 1 })); coal.scale.set(1, 0.8, 1); coal.position.set(0.6, 1.05, -0.05); coal.castShadow = true; stall.add(coal);
  var bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 10), std({ color: 0x2f4a30, roughness: 0.3 })); bottle.position.set(0.3, 1.07, 0.27); stall.add(bottle);
  var hg = new THREE.Group();
  var glass = new THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.35, roughness: 0.1 }) : std({ color: 0xdfe8f0, transparent: true, opacity: 0.35 });
  var bulbT = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 14), glass); bulbT.position.y = 0.27; hg.add(bulbT);
  var bulbB = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 14), glass); bulbB.rotation.x = Math.PI; bulbB.position.y = 0.09; hg.add(bulbB);
  var sandMat = std({ color: 0xd8b46a, roughness: 1 });
  var sandT = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), sandMat); sandT.position.y = 0.25; hg.add(sandT);
  var sandB = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), sandMat); sandB.rotation.x = Math.PI; sandB.position.y = 0.07; hg.add(sandB);
  [0, 0.36].forEach(function (y) { var d = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 14), wood); d.position.y = y; hg.add(d); });
  [0, 2.09, 4.19].forEach(function (a) { var r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), wood); r.position.set(Math.cos(a) * 0.12, 0.18, Math.sin(a) * 0.12); hg.add(r); });
  hg.position.set(-0.15, 0.92, -0.15); stall.add(hg);
  var coins = [];
  for (var ci = 0; ci < 3; ci++) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), std({ color: 0xd8c27a, metalness: 0.9, roughness: 0.3 })); c.position.set(0.3 + ci * 0.06, 0.926, -0.24 + ci * 0.02); c.visible = false; stall.add(c); coins.push(c); }
  var STALL = V3(-0.3, 0, -1.0); stall.position.copy(STALL); stall.rotation.y = -0.2; scene.add(stall);   /* l'étal à DROITE des deux figures : c'est lui le sujet des étapes 2 et 4 */

  /* ── les deux figures : de vrais corps ── */
  var scene_ = document.querySelector('.nt-monde');
  var dir = (scene_ && scene_.dataset.scene ? scene_.dataset.scene : '/glossaire/mondes/force-de-travail/monde.js').replace(/monde\.js.*$/, '');
  function loadBin(name) { return fetch(dir + name).then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
    var dv = new DataView(ab); var nv = dv.getUint32(4, true), ni = dv.getUint32(8, true), ib = dv.getUint32(12, true);
    var mn = [dv.getFloat32(16, true), dv.getFloat32(20, true), dv.getFloat32(24, true)], ex = [dv.getFloat32(28, true), dv.getFloat32(32, true), dv.getFloat32(36, true)];
    var o = 40, pos = new Float32Array(nv * 3); for (var i = 0; i < nv * 3; i++) { pos[i] = mn[i % 3] + dv.getUint16(o, true) / 65535 * ex[i % 3]; o += 2; }
    var idx = ib === 4 ? new Uint32Array(ni) : new Uint16Array(ni); for (var j = 0; j < ni; j++) { idx[j] = ib === 4 ? dv.getUint32(o, true) : dv.getUint16(o, true); o += ib; }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingBox(); return geo; }); }
  function prepare(geo, H) { var bb = geo.boundingBox, size = new THREE.Vector3(); bb.getSize(size); var k = H / size.y; geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(k, k, k); geo.computeVertexNormals(); return geo; }
  function paint(geo, rule) { var p = geo.attributes.position.array, n = geo.attributes.position.count, col = new Float32Array(n * 3); for (var i = 0; i < n; i++) { var c = rule(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  var SKIN = new THREE.Color(0x8a6244), SHIRT = new THREE.Color(0xd9cdb4), PANTS = new THREE.Color(0x4a3b2e);
  var SKIN2 = new THREE.Color(0xc9a483), COAT = new THREE.Color(0x1c1816), VEST = new THREE.Color(0x6a5a42), TROUS = new THREE.Color(0x3a3634), HAIR = new THREE.Color(0x3a2a1a);
  var owner = new THREE.Group(), worker = new THREE.Group();
  var H = 1.76;
  var readyW = loadBin('ouvrier.bin').then(function (geo) { prepare(geo, H);
    paint(geo, function (x, y, z) { if (y > H * 0.905) return SKIN; if (y > H * 0.585) { if (x > H * 0.09 && y < H * 0.75) return SKIN; return SHIRT; } if (y > H * 0.11) { if (x > H * 0.10 && y > H * 0.38) return SKIN; return PANTS; } return SKIN; });
    var m = new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.85 })); m.castShadow = m.receiveShadow = true; worker.add(m); return m; }).catch(function () { return null; });
  var readyO = loadBin('bourgeois.bin').then(function (geo) { prepare(geo, H * 1.02);
    paint(geo, function (x, y, z) { var h = H * 1.02; if (y > h * 0.93 && z < 0.02) return HAIR; if (y > h * 0.86) return SKIN2; if (y > h * 0.48) { if (Math.abs(x) < h * 0.055 && z > 0.03 && y > h * 0.62 && y < h * 0.84) return VEST; return COAT; } if (y > h * 0.045) return TROUS; return COAT; });
    var m = new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.8 })); m.castShadow = m.receiveShadow = true; owner.add(m);
    /* le haut-de-forme et la canne : l'homme aux écus */
    var hatMat = std({ color: 0x0f0d0c, roughness: 0.55 });
    var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.1, 0.24, 18), hatMat); hat.position.set(-0.01, H * 1.02 + 0.08, -0.01); hat.castShadow = true; owner.add(hat);
    var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), hatMat); brim.position.set(-0.01, H * 1.02 - 0.03, -0.01); owner.add(brim);
    var cane = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.92, 8), std({ color: 0x2a1a10, roughness: 0.6 })); cane.position.set(0.17, 0.46, 0.14); cane.rotation.z = 0.1; owner.add(cane);
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), std({ color: 0x9a7b30, metalness: 0.8, roughness: 0.3 })); knob.position.set(0.215, 0.92, 0.14); owner.add(knob);
    return m; }).catch(function () { return null; });
  var ready = Promise.all([readyW, readyO]);
  var OWN0 = V3(-2.35, 0, 0.7), WRK0 = V3(-1.4, 0, 0.5);   /* l'ouvrier à droite, visible ; l'homme aux écus le dépassera en marchant */
  var OWN_IN = V3(SHOP_X - 0.1, 0, SHOP_Z - 0.9), WRK_IN = V3(SHOP_X + 1.3, 0, SHOP_Z - 1.55);
  scene.add(owner); scene.add(worker);

  /* ── chorégraphie ── */
  var G = 0, T = 0, st = { sand: 0, eden: 0, coins: 0, walk: 0, walkW: 0, dusk: 0, inside: 0, cam: 0 };
  function set(g) { G = g; }
  function compute() {
    st.sand = ss(1.0, 1.9, G);
    st.eden = ss(2.0, 2.7, G) * (1 - ss(4.5, 5.0, G)) + ss(4.0, 4.4, G) * (1 - ss(4.6, 5.0, G)) * 0;
    st.coins = ss(3.0, 3.4, G);
    st.walk = ss(4.0, 5.05, G); st.walkW = ss(4.2, 5.25, G);
    st.dusk = ss(4.1, 5.1, G);
    st.inside = ss(5.0, 5.6, G);
  }
  function place(fig, p0, pIn, p, lag, restFacing) {
    var x, z, facing;
    if (p < 1) { x = lerp(p0.x, DOOR.x, p); z = lerp(p0.z, DOOR.z, p); facing = p > 0.001 ? Math.atan2(DOOR.x - p0.x, DOOR.z - p0.z) : restFacing; }
    else { var q = st.inside; x = lerp(DOOR.x, pIn.x, q); z = lerp(DOOR.z, pIn.z, q); facing = lerp(Math.PI / 2, fig === owner ? Math.PI / 2 : 0, q); }
    fig.position.set(x, 0, z);
    var moving = (p > 0.001 && p < 0.999) || (p >= 1 && st.inside > 0.001 && st.inside < 0.999);
    fig.position.y = moving ? Math.abs(Math.sin(T * 7 + lag)) * 0.03 : 0;
    fig.rotation.y += (facing - fig.rotation.y) * 0.2;
  }
  /* la caméra : des plans clés, une position et une visée par étape, et
     l'on interpole — le travelling du seuil suit les figures */
  var KEY = [
    { p: V3(-1.8, 2.7, 12.0), a: V3(-1.6, 1.3, -1.0) },   /* 0 la place, large */
    { p: V3(0.2, 1.6, 3.9), a: V3(-0.5, 1.05, -1.0) },    /* 1 l'étal */
    { p: V3(-1.2, 1.7, 5.6), a: V3(-1.9, 1.25, 0.6) },    /* 2 les deux, face à face */
    { p: V3(0.4, 1.45, 3.2), a: V3(-0.4, 0.98, -1.1) },   /* 3 le sablier et les pièces */
    { p: V3(0.2, 2.0, 7.0), a: V3(1.6, 1.3, -0.8) },      /* 4 la rue vers la porte */
    { p: V3(5.2, 1.9, 4.6), a: V3(7.0, 1.2, -1.8) },      /* 5 le seuil */
    { p: V3(SHOP_X + 3.4, 2.0, SHOP_Z - 0.6), a: V3(SHOP_X + 0.9, 1.0, SHOP_Z - 2.2) } /* 6 dedans : le fileur au métier, l'horloge */
  ];
  var KEYDOOR = { p: V3(DOOR.x + 0.05, 1.7, DOOR.z + 0.9), a: V3(DOOR.x + 0.3, 1.0, SHOP_Z - 2.6) };
  var KEYIN = { p: V3(DOOR.x + 0.05, 1.7, SHOP_Z - 0.9), a: V3(SHOP_X + 1.3, 1.0, SHOP_Z - 2.0) };
  var camP = new THREE.Vector3(), camA = new THREE.Vector3();
  function frame(dt) {
    T += dt; compute();
    var d = st.dusk;
    sun.intensity = 1.6 * (1 - 0.88 * d); sun.color.setRGB(1, lerp(0.94, 0.5, d), lerp(0.82, 0.25, d));
    hemi.intensity = 0.7 * (1 - 0.75 * d); amb.intensity = 0.3 * (1 - 0.5 * d);
    sky.material.color.setRGB(lerp(0.62, 0.1, d), lerp(0.71, 0.1, d), lerp(0.82, 0.16, d));
    scene.fog.color.setRGB(lerp(0.54, 0.08, d), lerp(0.48, 0.06, d), lerp(0.4, 0.05, d));
    doorLamp.intensity = 1.8 * d * (1 + 0.06 * Math.sin(T * 9.3)); halo.material.opacity = 0.9 * d;
    insideLamp.intensity = (0.4 + 1.6 * st.inside) * (1 + 0.06 * Math.sin(T * 7.3)); insideFlame.material.opacity = 0.3 + 0.7 * st.inside;
    winGlow.material.color.setRGB(lerp(0.44, 0.12, d), lerp(0.54, 0.16, d), lerp(0.66, 0.26, d));
    /* le sablier coule, l'Éden s'allume, les pièces se posent */
    hg.rotation.z = -0.5 * Math.sin(Math.PI * Math.min(1, st.sand * 1.2)) * (st.sand > 0 ? 1 : 0);
    sandT.scale.set(1, 1 - 0.9 * st.sand, 1); sandT.position.y = 0.25 - 0.06 * st.sand; sandB.scale.setScalar(0.3 + 0.7 * st.sand);
    edenGlow.material.opacity = st.eden * (0.85 + 0.1 * Math.sin(T * 2.1));
    coins.forEach(function (c, i) { c.visible = st.coins > (i + 0.5) / 3.5; });
    /* les deux figures : égales, puis l'une devant l'autre, puis dedans */
    place(owner, OWN0, OWN_IN, st.walk, 0, 1.0); place(worker, WRK0, WRK_IN, st.walkW, 1.7, -1.0);
    owner.rotation.x = -0.04 * st.walk * (1 - st.inside);
    /* dedans, le fileur travaille */
    var w = st.inside; spindles.forEach(function (s) { s.rotation.y += w * dt * 22; }); wheel.rotation.z -= w * dt * 3;
    /* la caméra */
    var seg = Math.min(5, Math.floor(G)), t = ss(0, 1, G - seg);
    if (seg === 5) {
      /* de la rue à l'intérieur, on passe PAR la porte : deux demi-segments */
      var u = G - 5;   /* trois temps : jusqu'au seuil, PAR la porte, puis vers le fileur */
      if (u < 0.34) { camP.lerpVectors(KEY[5].p, KEYDOOR.p, ss(0, 1, u / 0.34)); camA.lerpVectors(KEY[5].a, KEYDOOR.a, ss(0, 1, u / 0.34)); }
      else if (u < 0.67) { camP.lerpVectors(KEYDOOR.p, KEYIN.p, ss(0, 1, (u - 0.34) / 0.33)); camA.lerpVectors(KEYDOOR.a, KEYIN.a, ss(0, 1, (u - 0.34) / 0.33)); }
      else { camP.lerpVectors(KEYIN.p, KEY[6].p, ss(0, 1, (u - 0.67) / 0.33)); camA.lerpVectors(KEYIN.a, KEY[6].a, ss(0, 1, (u - 0.67) / 0.33)); }
      /* au moment de passer, le trou de la porte ne doit rien cacher */
      holeMat.opacity = camP.z < SHOP_Z + 0.9 ? 0 : 1; holeMat.transparent = true;
    } else { camP.lerpVectors(KEY[seg].p, KEY[seg + 1].p, t); camA.lerpVectors(KEY[seg].a, KEY[seg + 1].a, t); holeMat.opacity = 1; }
    /* pendant la marche, le sujet n'est pas la porte : ce sont les deux figures */
    if (seg === 4) { camA.x = lerp(camA.x, (owner.position.x + worker.position.x) / 2 + 0.6, 0.85); camA.z = lerp(camA.z, (owner.position.z + worker.position.z) / 2, 0.85); }
    /* la colonne de texte occupe la gauche : on vise à GAUCHE du sujet, d'une
       part proportionnelle à la distance, pour qu'il vive dans la moitié droite */
    camera.position.set(camP.x + 0.02 * Math.sin(T * 0.3), camP.y + 0.015 * Math.sin(T * 0.41), camP.z);
    /* « à gauche » se mesure dans le repère de la CAMÉRA (le vecteur droite
       = avant × haut) : dans l'atelier on regarde le long de l'établi, et
       la gauche de l'écran est alors +z, pas −x */
    var dist = camP.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camP).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -0.3 * dist); camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() { var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h > 1.2 ? 40 : Math.min(72, 2 * Math.atan(Math.tan(52 * Math.PI / 360) / camera.aspect) * 180 / Math.PI); camera.updateProjectionMatrix(); }
  function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, ready: ready, camera: camera, owner: owner, worker: worker };
};

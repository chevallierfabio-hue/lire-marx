/* LE MONDE DE LA FORCE DE TRAVAIL — le seuil du chapitre VI.
   À gauche la place du marché en plein jour : l'étal des subsistances (ce
   qui fait la valeur de la force), le sablier (ce qui se vend est un temps),
   l'arche gravée LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM. À droite la porte
   de l'atelier et son écriteau. Deux figures, égales sur le marché ; à la
   cinquième étape elles marchent vers la porte, l'homme aux écus devant, le
   possesseur de force de travail derrière, et le jour tombe. Tout est
   fonction de g (la position de lecture), donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  var BG = 0x0d0a07;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(BG, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; }
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x7a6a58, 9, 24);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  var HFOV = 58;
  var CAM = { x: 0.3, y: 2.0, z: 9.0 };
  var aim = new THREE.Vector3(-0.2, 1.1, 0.4);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 11; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── le ciel et la lumière ── */
  var skyTex = tex(64, 256, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5f8fc4'); gr.addColorStop(0.7, '#c9c2a8'); gr.addColorStop(1, '#e0cfa4');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var sky = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: skyTex, fog: false }));
  sky.position.set(0, 8, -22); scene.add(sky);
  var sun = new THREE.DirectionalLight(0xfff0d0, 1.5); sun.position.set(-4, 8, 3); scene.add(sun);
  var hemi = new THREE.HemisphereLight(0xa8c0e0, 0x4a3a2a, 0.75); scene.add(hemi);
  var amb = new THREE.AmbientLight(0x6a5a48, 0.35); scene.add(amb);
  var doorLamp = new THREE.PointLight(0xffb15c, 0, 7, 1.6); doorLamp.position.set(2.75, 2.35, -0.9); scene.add(doorLamp);

  /* ── le sol pavé ── */
  var cobTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#5b5145'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 26) for (var x = (y / 26 % 2) * 20; x < w; x += 40) {
      var v = 96 + rnd() * 34 | 0; g.fillStyle = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 20) + ')';   /* un seul gris chaud, sans teinte au hasard */
      g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 2, 36, 22, 6) : g.rect(x + 2, y + 2, 36, 22); g.fill();
    }
  });
  cobTex.wrapS = cobTex.wrapT = THREE.RepeatWrapping; cobTex.repeat.set(6, 6);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std({ map: cobTex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* ── les façades du fond ── */
  var wallTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#8d7d68'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 1600; i++) { g.fillStyle = 'rgba(40,30,20,' + rnd() * 0.12 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    for (var y = 40; y < h; y += 110) for (var x = 30; x < w; x += 100) { g.fillStyle = '#2a2018'; g.fillRect(x, y, 34, 52); g.fillStyle = '#4a4030'; g.fillRect(x + 16, y, 2, 52); g.fillRect(x, y + 24, 34, 2); g.fillStyle = '#6a5a48'; g.fillRect(x - 3, y + 52, 40, 4); }
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  [[-6, 4.6, -7, 6], [0.5, 3.8, -7.5, 5], [6.5, 5.2, -7, 7]].forEach(function (b) {
    var t2 = wallTex.clone(); t2.needsUpdate = true; t2.repeat.set(b[3] / 2.0, b[1] / 2.0);
    var m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[1], 3), std({ map: t2, roughness: 0.9 }));
    m.position.set(b[0], b[1] / 2, b[2]); scene.add(m);
  });

  /* ── l'atelier, à droite : la porte et l'écriteau ── */
  var shop = new THREE.Group();
  var shopWall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.2, 2.6), std({ color: 0x3a2f26, roughness: 0.92 }));
  shopWall.position.set(0, 2.1, 0); shop.add(shopWall);
  var door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.1), new THREE.MeshBasicMaterial({ color: 0x050403 }));
  door.position.set(-0.4, 1.05, 1.305); shop.add(door);
  var jamb = std({ color: 0x241a12, roughness: 0.85 });
  [[-0.95, 1.05, 0.1, 2.2], [0.15, 1.05, 0.1, 2.2], [-0.4, 2.15, 1.2, 0.1]].forEach(function (j) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(j[2], j[3], 0.12), jamb); m.position.set(j[0], j[1], 1.33); shop.add(m);
  });
  var signTex = tex(512, 128, function (g, w, h) {
    g.fillStyle = '#d9c9a3'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a14'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#2b1c0e'; g.textAlign = 'center'; g.font = '700 34px "Inter", Georgia, serif';
    g.fillText('NO ADMITTANCE', w / 2, 56); g.font = '600 26px "Inter", Georgia, serif'; g.fillText('EXCEPT ON BUSINESS', w / 2, 96);
  });
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(-0.4, 2.55, 1.32); shop.add(sign);
  var lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd08a }));
  lampMesh.position.set(-0.4, 2.95, 1.42); shop.add(lampMesh);
  var haloTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,110,.6)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  halo.scale.set(1.4, 1.4, 1); halo.position.set(-0.4, 2.95, 1.5); shop.add(halo);
  /* un toit qui déborde, deux fenêtres aveugles : l'atelier ne montre rien */
  var roof = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.16, 2.9), std({ color: 0x241a12, roughness: 0.9 })); roof.position.set(0, 4.25, 0); shop.add(roof);
  [[-1.25, 3.2], [0.9, 3.2], [0.9, 1.6]].forEach(function (wpos) { var wi = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshBasicMaterial({ color: 0x0d0a08 })); wi.position.set(wpos[0], wpos[1], 1.302); shop.add(wi);
    var bar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.04), jamb); bar.position.set(wpos[0], wpos[1] + 0.37, 1.32); shop.add(bar); });
  /* la cheminée fume — l'atelier travaille déjà */
  var chimney = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), jamb); chimney.position.set(0.9, 4.4, -0.4); shop.add(chimney);
  var smokeTex = tex(64, 64, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(120,110,100,.5)'); gr.addColorStop(1, 'rgba(120,110,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var smokes = [];
  for (var si = 0; si < 10; si++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })); sp.userData.p = si / 10; sp.scale.set(0.5, 0.5, 1); shop.add(sp); smokes.push(sp); }
  shop.position.set(3.0, 0, -2.2); shop.rotation.y = -0.18; scene.add(shop);
  var DOOR = new THREE.Vector3(2.65, 0, -0.75);

  /* ── l'arche de l'Éden ── */
  var arch = new THREE.Group();
  var stone = std({ color: 0xb8a88c, roughness: 0.85 });
  [-0.95, 0.95].forEach(function (x) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.0, 0.34), stone); p.position.set(x, 1.5, 0); arch.add(p);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.46), stone); cap.position.set(x, 3.06, 0); arch.add(cap); });
  var lintel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.4), stone); lintel.position.set(0, 3.35, 0); arch.add(lintel);
  var edenTex = tex(1024, 192, function (g, w, h) {
    g.fillStyle = '#b8a88c'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.font = '700 44px "Fraunces", Georgia, serif';
    g.fillStyle = 'rgba(40,28,14,.75)'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2 + 2, h / 2 + 22);
    g.fillStyle = '#6b5a42'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2, h / 2 + 20);
  });
  var edenGlowTex = tex(1024, 192, function (g, w, h) {
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = '700 44px "Fraunces", Georgia, serif';
    g.shadowColor = 'rgba(216,173,76,.9)'; g.shadowBlur = 18; g.fillStyle = '#ffd98a'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2, h / 2 + 20);
  });
  var eden = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: edenTex })); eden.position.set(0, 3.35, 0.205); arch.add(eden);
  var edenGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: edenGlowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); edenGlow.position.set(0, 3.35, 0.21); arch.add(edenGlow);
  arch.position.set(0.9, 0, -1.2); scene.add(arch);

  /* ── l'étal des subsistances ── */
  var stall = new THREE.Group();
  var woodTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, w, h); for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(30,16,6,' + (0.08 + rnd() * 0.14) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 8); g.stroke(); } });
  var wood = std({ map: woodTex, roughness: 0.7 });
  var top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.8), wood); top.position.y = 0.86; stall.add(top);
  [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.3], [0.75, 0.3]].forEach(function (c) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.86, 0.07), wood); l.position.set(c[0], 0.43, c[1]); stall.add(l); });
  var awnTex = tex(128, 64, function (g, w, h) { for (var x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#c9b48c' : '#8a3a2a'; g.fillRect(x, 0, 16, h); } });
  var awning = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.0), std({ map: awnTex, roughness: 0.9, side: THREE.DoubleSide }));
  awning.position.set(0, 2.05, -0.1); awning.rotation.x = -1.25; stall.add(awning);
  [-0.85, 0.85].forEach(function (x) { var p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), wood); p.position.set(x, 1.1, -0.45); stall.add(p); });
  var bread = std({ color: 0xc08a48, roughness: 0.8 });
  [[-0.55, 0.0], [-0.4, 0.15], [-0.62, 0.2]].forEach(function (b) { var m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bread); m.scale.set(1.4, 0.7, 0.9); m.position.set(b[0], 0.97, b[1]); stall.add(m); });
  var cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16), std({ color: 0xcdbb95, roughness: 0.9 })); cloth.rotation.z = Math.PI / 2; cloth.position.set(0.05, 1.0, 0.15); stall.add(cloth);
  var coal = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), std({ color: 0x241f1a, roughness: 1 })); coal.scale.set(1, 0.8, 1); coal.position.set(0.55, 1.03, -0.05); stall.add(coal);
  var bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 10), std({ color: 0x2f4a30, roughness: 0.3 })); bottle.position.set(0.28, 1.05, 0.25); stall.add(bottle);
  /* le sablier : ce qui se vend est un temps */
  var hg = new THREE.Group();
  var glass = new THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0 }) : std({ color: 0xdfe8f0, transparent: true, opacity: 0.35 });
  var bulbT = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 14), glass); bulbT.position.y = 0.27; hg.add(bulbT);
  var bulbB = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 14), glass); bulbB.rotation.x = Math.PI; bulbB.position.y = 0.09; hg.add(bulbB);
  var sandT = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), std({ color: 0xd8b46a, roughness: 1 })); sandT.position.y = 0.25; hg.add(sandT);
  var sandB = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), std({ color: 0xd8b46a, roughness: 1 })); sandB.rotation.x = Math.PI; sandB.position.y = 0.07; hg.add(sandB);
  [0, 0.36].forEach(function (y) { var d = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 14), wood); d.position.y = y; hg.add(d); });
  [0, 2.09, 4.19].forEach(function (a) { var r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), wood); r.position.set(Math.cos(a) * 0.12, 0.18, Math.sin(a) * 0.12); hg.add(r); });
  hg.position.set(-0.15, 0.9, -0.15); stall.add(hg);
  var coins = [];
  for (var ci = 0; ci < 3; ci++) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), std({ color: 0xd8c27a, metalness: 0.9, roughness: 0.3 })); c.position.set(0.3 + ci * 0.06, 0.906, -0.22 + ci * 0.02); c.visible = false; stall.add(c); coins.push(c); }
  stall.position.set(-2.2, 0, -0.2); stall.rotation.y = 0.35; scene.add(stall);

  /* ── les deux figures ── */
  function figure(kind) {
    var g = new THREE.Group();
    var coat = std({ color: kind === 'owner' ? 0x1e1a18 : 0x5a4a38, roughness: 0.95 });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.95, 12), coat); body.position.y = 0.95; g.add(body);
    var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.5, 10), std({ color: kind === 'owner' ? 0x2a2622 : 0x3a3028, roughness: 1 })); legs.position.y = 0.25; g.add(legs);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), std({ color: 0xc9a483, roughness: 0.8 })); head.position.y = 1.56; g.add(head);
    if (kind === 'owner') {
      var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 14), std({ color: 0x0f0d0c, roughness: 0.6 })); hat.position.y = 1.78; g.add(hat);
      var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16), std({ color: 0x0f0d0c })); brim.position.y = 1.66; g.add(brim);
      var cane = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6), std({ color: 0x2a1a10 })); cane.position.set(0.28, 0.45, 0.1); cane.rotation.z = 0.12; g.add(cane);
    } else {
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.07, 14), std({ color: 0x3a3230, roughness: 1 })); cap.position.y = 1.66; g.add(cap);
      var visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.1), std({ color: 0x3a3230 })); visor.position.set(0, 1.63, 0.15); g.add(visor);
    }
    [-1, 1].forEach(function (d) { var a = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.6, 8), coat); a.position.set(d * 0.24, 1.05, 0); a.rotation.z = d * 0.12; g.add(a); });
    g.userData.head = head; g.userData.body = body;
    g.traverse(function (o) { if (o.material) { o.material.transparent = true; } });
    return g;
  }
  var owner = figure('owner'), worker = figure('worker');
  var OWN0 = new THREE.Vector3(-0.95, 0, 1.1), WRK0 = new THREE.Vector3(-0.25, 0, 1.25);
  scene.add(owner); scene.add(worker);

  /* ── chorégraphie ── */
  var G = 0, T = 0, st = { sand: 0, eden: 0, coins: 0, walk: 0, walkW: 0, dusk: 0, gone: 0, look: 0 };
  function set(g) { G = g; }
  function compute() {
    st.sand = ss(1.0, 1.9, G);
    st.eden = ss(2.0, 2.7, G) * (1 - ss(4.6, 5.1, G));
    st.coins = ss(3.0, 3.4, G);
    st.walk = ss(4.0, 5.0, G); st.walkW = ss(4.22, 5.22, G);
    st.dusk = ss(4.1, 5.1, G);
    st.gone = ss(5.05, 5.55, G);
    st.look = ss(3.85, 4.9, G);
  }
  function place(fig, p0, p, lag) {
    var x = lerp(p0.x, DOOR.x, p), z = lerp(p0.z, DOOR.z, p);
    fig.position.set(x, 0, z);
    var moving = p > 0.001 && p < 0.999;
    fig.position.y = moving ? Math.abs(Math.sin(T * 7 + lag)) * 0.03 : 0;
    var dx = DOOR.x - p0.x, dz = DOOR.z - p0.z;
    var facing = p > 0.001 ? Math.atan2(dx, dz) : (fig === owner ? 0.9 : -0.9);
    fig.rotation.y += (facing - fig.rotation.y) * 0.15;
  }
  function frame(dt) {
    T += dt; compute();
    /* le jour tombe */
    var d = st.dusk;
    sun.intensity = 1.5 * (1 - 0.85 * d); sun.color.setRGB(1, lerp(0.94, 0.55, d), lerp(0.82, 0.3, d));
    hemi.intensity = 0.75 * (1 - 0.7 * d); amb.intensity = 0.35 * (1 - 0.5 * d);
    sky.material.color.setRGB(lerp(1, 0.22, d), lerp(1, 0.2, d), lerp(1, 0.3, d));
    scene.fog.color.setRGB(lerp(0.48, 0.1, d), lerp(0.42, 0.08, d), lerp(0.35, 0.07, d));
    doorLamp.intensity = 1.8 * d * (1 + 0.06 * Math.sin(T * 9.3)); halo.material.opacity = 0.9 * d; lampMesh.material.color.setRGB(1, lerp(0.35, 0.82, d), lerp(0.2, 0.5, d));
    /* le sablier */
    hg.rotation.z = -0.6 * st.sand * Math.sin(Math.PI * Math.min(1, st.sand * 1.2)) + 0.0;
    sandT.scale.set(1, 1 - 0.9 * st.sand, 1); sandT.position.y = 0.25 - 0.06 * st.sand;
    sandB.scale.set(0.3 + 0.7 * st.sand, 0.3 + 0.7 * st.sand, 0.3 + 0.7 * st.sand);
    /* l'Éden s'allume */
    edenGlow.material.opacity = st.eden * (0.85 + 0.1 * Math.sin(T * 2.1));
    coins.forEach(function (c, i) { c.visible = st.coins > (i + 0.5) / 3.5; });
    /* la marche */
    place(owner, OWN0, st.walk, 0); place(worker, WRK0, st.walkW, 1.7);
    owner.rotation.x = -0.05 * st.walk;                        /* l'air important, penché en avant */
    worker.userData.head.rotation.x = 0.45 * st.walkW;          /* timide, hésitant : la tête baissée */
    worker.userData.head.position.z = 0.06 * st.walkW;
    var op = 1 - st.gone;
    [owner, worker].forEach(function (f) { f.traverse(function (o) { if (o.material) o.material.opacity = op; }); });
    /* la fumée */
    smokes.forEach(function (s) { var p = (s.userData.p + T * 0.05) % 1; s.position.set(0.9 + Math.sin(p * 6 + s.userData.p * 9) * 0.25 * p, 4.7 + p * 2.2, -0.4 + p * 0.3); s.material.opacity = 0.5 * (1 - p) * (0.6 + 0.4 * (1 - d)); s.scale.setScalar(0.35 + p * 1.1); });
    /* la caméra suit le regard : de l'étal vers la porte */
    var lk = st.look;
    aim.set(lerp(-0.4, 1.6, lk), lerp(1.3, 1.5, lk), lerp(0.4, -0.7, lk));
    camera.position.set(CAM.x + lerp(0, 0.9, lk) + 0.02 * Math.sin(T * 0.3), CAM.y + 0.015 * Math.sin(T * 0.41), CAM.z - lerp(0, 0.6, lk));
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    var v = 2 * Math.atan(Math.tan(HFOV * Math.PI / 360) / camera.aspect) * 180 / Math.PI;
    camera.fov = Math.max(34, Math.min(80, v)); camera.updateProjectionMatrix();
  }
  function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st };
};

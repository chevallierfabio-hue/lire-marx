/* LE MONDE DE LA PLUS-VALUE — l'atelier du fileur, et la journée qui passe.
   La fenêtre dit l'heure. Sur l'établi les bobines de filés s'ajoutent une à
   une ; au sol, une ligne à la craie s'écrit en même temps — a—b, le travail
   nécessaire ; b—c, le surtravail : la figure du chapitre X. À six bobines,
   trois shillings sur l'établi ; les six suivantes vont au coffre. La nuit
   tombe, la lampe s'allume, la ligne s'allonge : la plus-value absolue.
   Tout est fonction de g, donc réversible : la craie s'efface, les bobines
   rentrent. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  var BG = 0x0d0a07;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(BG, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; }
  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(BG, 7, 18);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  var HFOV = 50; var CAM = { x: 0.7, y: 1.75, z: 5.9 }; var aim = new THREE.Vector3(0.6, 0.95, 0);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 31; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c, a, b, t) { c.setRGB(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }

  /* ── la pièce ── */
  var floorTex = tex(512, 512, function (g, w, h) { g.fillStyle = '#2a2016'; g.fillRect(0, 0, w, h); for (var b = 0; b < 8; b++) { g.fillStyle = 'rgb(' + (44 + rnd() * 14 | 0) + ',' + (32 + rnd() * 8 | 0) + ',' + (18 + rnd() * 6 | 0) + ')'; g.fillRect(0, b * 64, w, 62); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, b * 64 + 62, w, 2); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), std({ map: floorTex, roughness: 0.88 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var wallTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#4a3a2a'; g.fillRect(0, 0, w, h); for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '120,100,70') + ',' + rnd() * 0.12 + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); } });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(5, 2);
  var WALL_Z = -2.4;
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 7), std({ map: wallTex, roughness: 0.95 })); wall.position.set(0, 3.5, WALL_Z); scene.add(wall);

  /* la fenêtre : l'heure du jour */
  var win = new THREE.Group(); var WX = 1.7, WY = 2.15, WW = 1.5, WH = 1.6;
  var skyMat = new THREE.MeshBasicMaterial({ color: 0xd9a06a, fog: false });
  var sky = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), skyMat); sky.position.z = 0.004; win.add(sky);
  var starsTex = tex(128, 128, function (g, w, h) { g.clearRect(0, 0, w, h); for (var i = 0; i < 50; i++) { g.fillStyle = 'rgba(230,236,255,' + (0.4 + rnd() * 0.6) + ')'; g.fillRect(rnd() * w, rnd() * h, 1.2, 1.2); } });
  var stars = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: starsTex, transparent: true, opacity: 0, fog: false })); stars.position.z = 0.006; win.add(stars);
  var orbTex = tex(64, 64, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.35, 'rgba(255,240,200,.9)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: orbTex, transparent: true, depthWrite: false, fog: false })); orb.scale.set(0.5, 0.5, 1); win.add(orb);
  var frameMat = std({ color: 0x2b1a0e, roughness: 0.8 });
  [[0, WH / 2 + 0.03, WW + 0.14, 0.07], [0, -WH / 2 - 0.04, WW + 0.2, 0.09], [-WW / 2 - 0.035, 0, 0.07, WH], [WW / 2 + 0.035, 0, 0.07, WH], [0, 0, 0.035, WH], [0, 0, WW, 0.035]].forEach(function (b) { var m = new THREE.Mesh(new THREE.BoxGeometry(b[2], b[3], 0.06), frameMat); m.position.set(b[0], b[1], 0.03); win.add(m); });
  win.position.set(WX, WY, WALL_Z); scene.add(win);
  var dayLight = new THREE.DirectionalLight(0xfff0d0, 1.2); dayLight.position.set(WX + 1, WY + 1.5, WALL_Z + 3); scene.add(dayLight);
  var hemi = new THREE.HemisphereLight(0x8fa8c8, 0x2a1a10, 0.5); scene.add(hemi);
  scene.add(new THREE.AmbientLight(0x4a3a28, 0.4));
  /* la lampe à huile, sur l'établi, pour la nuit */
  var lamp = new THREE.PointLight(0xffb15c, 0, 8, 1.6); var LAMP = new THREE.Vector3(2.35, 1.35, 0.15); lamp.position.copy(LAMP); scene.add(lamp);
  var brass = std({ color: 0x9a7b30, roughness: 0.35, metalness: 0.8 });
  var lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.06, 12), brass); lampBase.position.set(LAMP.x, 0.96, LAMP.z); scene.add(lampBase);
  var lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.28, 8), brass); lampStem.position.set(LAMP.x, 1.12, LAMP.z); scene.add(lampStem);
  var lampGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.15, side: THREE.DoubleSide })); lampGlass.position.set(LAMP.x, 1.33, LAMP.z); scene.add(lampGlass);
  var flameTex = tex(64, 96, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h * 0.6, 2, w / 2, h * 0.55, w * 0.55); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.3, 'rgba(255,210,120,.9)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); flame.scale.set(0.14, 0.22, 1); flame.position.copy(LAMP); scene.add(flame);

  /* ── l'établi, les broches, le coton ── */
  var woodTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#5a3b20'; g.fillRect(0, 0, w, h); for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(30,16,6,' + (0.08 + rnd() * 0.14) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 8); g.stroke(); } });
  var wood = std({ map: woodTex, roughness: 0.7 });
  var benchTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.8), wood); benchTop.position.set(0.9, 0.9, 0.15); scene.add(benchTop);
  [[-0.9, -0.15], [2.7, -0.15], [-0.9, 0.45], [2.7, 0.45], [0.9, -0.15], [0.9, 0.45]].forEach(function (c) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.09), wood); l.position.set(c[0], 0.45, c[1]); scene.add(l); });
  /* le métier : un cadre, une roue, six broches */
  /* le métier s'appelle loom : « frame » est la fonction d'image, ne pas la masquer */
  var loom = new THREE.Group();
  var side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), wood); side.position.set(-0.5, 0.35, 0); loom.add(side);
  var side2 = side.clone(); side2.position.x = 0.5; loom.add(side2);
  var rail = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.06, 0.08), wood); rail.position.set(0, 0.62, 0); loom.add(rail);
  var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 8, 30), wood); wheel.position.set(-0.75, 0.42, 0); loom.add(wheel);
  for (var k = 0; k < 6; k++) { var sp = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.5, 0.015), wood); sp.rotation.z = k * Math.PI / 6; sp.position.copy(wheel.position); loom.add(sp); }
  var spindles = [];
  for (k = 0; k < 6; k++) { var s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), std({ color: 0x8e9299, metalness: 0.8, roughness: 0.35 })); s.position.set(-0.38 + k * 0.15, 0.45, 0.02); loom.add(s);
    var fl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10), wood); fl.position.set(-0.38 + k * 0.15, 0.3, 0.02); loom.add(fl); spindles.push(s); }
  loom.position.set(-0.55, 0.95, 0.1); scene.add(loom);
  var cotton = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), std({ color: 0xf0e8d8, roughness: 1 })); cotton.scale.set(1.2, 0.8, 1); cotton.position.set(-1.35, 0.35, 0.5); scene.add(cotton);
  var sack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 12), std({ color: 0x9a8a6a, roughness: 1 })); sack.position.set(-1.7, 0.25, 0.1); scene.add(sack);

  /* les bobines : le produit, une par heure */
  var threadTex = tex(64, 64, function (g, w, h) { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); for (var y = 0; y < h; y += 3) { g.fillStyle = 'rgba(120,100,70,.35)'; g.fillRect(0, y, w, 1); } });
  var bobbins = [];
  var BOB_T = []; for (k = 0; k < 6; k++) BOB_T.push(2.05 + k * 0.14); for (k = 0; k < 6; k++) BOB_T.push(3.05 + k * 0.14); BOB_T.push(4.25); BOB_T.push(4.5);
  for (k = 0; k < 14; k++) {
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 14), std({ map: threadTex, roughness: 0.9 }));
    var core = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 8), wood); b.add(core);
    b.position.set(0.15 + k * 0.19, 1.05, 0.05 + (k % 2) * 0.12); b.scale.setScalar(0.001); scene.add(b); bobbins.push(b);
  }
  /* les shillings : trois sur l'établi (la force payée), trois au coffre */
  var coinMat = std({ color: 0xd8c27a, metalness: 0.9, roughness: 0.3 });
  var wageCoins = [], plusCoins = [];
  for (k = 0; k < 3; k++) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), coinMat); c.position.set(-0.05 + k * 0.07, 0.956, 0.42); c.visible = false; scene.add(c); wageCoins.push(c); }
  var chest = new THREE.Group();
  var cb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.34), std({ color: 0x3a2412, roughness: 0.8 })); cb.position.y = 0.15; chest.add(cb);
  var lid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.34), std({ color: 0x3a2412, roughness: 0.8 })); lid.position.set(0, 0.33, -0.17); lid.rotation.x = -1.9; chest.add(lid);
  [[-0.2], [0.2]].forEach(function (x) { var band = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.36), brass); band.position.set(x[0], 0.15, 0); chest.add(band); });
  for (k = 0; k < 3; k++) { var pc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), coinMat); pc.position.set(-0.08 + k * 0.08, 0.31, 0.02 + k * 0.03); pc.visible = false; chest.add(pc); plusCoins.push(pc); }
  chest.position.set(2.85, 0.95, 0.5); chest.rotation.y = -0.4; scene.add(chest);

  /* la ligne à la craie : a—b, b—c */
  var chalk = new THREE.MeshBasicMaterial({ color: 0xe8e0cc, transparent: true, opacity: 0.85 });
  var XA = -0.8, XB = 0.6, XC = 2.0, XC2 = 2.6, ZL = 1.15;
  var lineAB = new THREE.Mesh(new THREE.PlaneGeometry(XB - XA, 0.03), chalk); lineAB.rotation.x = -Math.PI / 2; lineAB.position.set(XA, 0.004, ZL); lineAB.geometry.translate((XB - XA) / 2, 0, 0); scene.add(lineAB);
  var lineBC = new THREE.Mesh(new THREE.PlaneGeometry(XC2 - XB, 0.03), chalk); lineBC.rotation.x = -Math.PI / 2; lineBC.position.set(XB, 0.004, ZL); lineBC.geometry.translate((XC2 - XB) / 2, 0, 0); scene.add(lineBC);
  function letter(ch) { var t = tex(64, 64, function (g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = '#e8e0cc'; g.font = 'italic 700 46px "Fraunces", Georgia, serif'; g.textAlign = 'center'; g.fillText(ch, w / 2, 48); }); var m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.005; scene.add(m); return m; }
  var la = letter('a'), lb = letter('b'), lc = letter('c');
  la.position.set(XA, 0.005, ZL + 0.22); lb.position.set(XB, 0.005, ZL + 0.22);
  [XA, XB].forEach(function (x) { var tick = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.14), chalk); tick.rotation.x = -Math.PI / 2; tick.position.set(x, 0.004, ZL); tick.userData.x = x; scene.add(tick); });
  var tickC = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.14), chalk); tickC.rotation.x = -Math.PI / 2; tickC.position.set(XC, 0.004, ZL); scene.add(tickC);

  /* ── le fileur ── */
  var spinner = new THREE.Group();
  var coat = std({ color: 0x4a3c2e, roughness: 1 });
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 12), coat); body.position.y = 0.95; spinner.add(body);
  var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.5, 10), std({ color: 0x2c261f, roughness: 1 })); legs.position.y = 0.25; spinner.add(legs);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), std({ color: 0xc9a483, roughness: 0.8 })); head.position.y = 1.56; head.rotation.x = 0.3; spinner.add(head);
  var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.55, 8), coat); arm.position.set(-0.24, 1.2, 0.3); arm.rotation.x = -1.1; spinner.add(arm);
  spinner.position.set(-0.45, 0, -0.55); spinner.rotation.y = 0; scene.add(spinner);   /* derrière l'établi, face à nous */

  /* ── chorégraphie ── */
  var G = 0, T = 0, st = { work: 0, hour: 0, paid: 0, plus: 0, ab: 0, bc: 0, bc2: 0, night: 0, count: 0 };
  function set(g) { G = g; }
  function compute() {
    st.work = ss(1.0, 1.5, G) * (1 - 0.6 * ss(5.3, 5.9, G));
    st.hour = ss(0.8, 4.6, G);
    st.ab = ss(2.0, 2.9, G); st.bc = ss(3.05, 3.95, G); st.bc2 = ss(4.2, 4.65, G);
    st.paid = ss(2.85, 3.0, G); st.plus = ss(3.9, 4.05, G);
    st.night = ss(4.05, 4.6, G);
  }
  var DAWN = [0.85, 0.63, 0.42], NOON = [0.62, 0.77, 0.91], EVE = [0.82, 0.42, 0.23], NIGHT = [0.055, 0.1, 0.17];
  function frame(dt) {
    T += dt; compute();
    /* l'heure à la fenêtre */
    var h = st.hour, c = skyMat.color;
    if (h < 0.35) mix(c, DAWN, NOON, h / 0.35); else if (h < 0.7) mix(c, NOON, EVE, (h - 0.35) / 0.35); else mix(c, EVE, NIGHT, (h - 0.7) / 0.3);
    stars.material.opacity = ss(0.78, 1, h);
    orb.position.set(-WW * 0.3 + h * WW * 0.6, -WH * 0.35 + Math.sin(h * Math.PI) * WH * 0.75, 0.01);
    orb.material.opacity = h < 0.82 ? 1 : 0.9; orb.scale.setScalar(h > 0.82 ? 0.3 : 0.5 + 0.2 * Math.sin(h * Math.PI));
    dayLight.intensity = 1.2 * Math.max(0.05, Math.sin(h * Math.PI)) * (1 - 0.9 * st.night) + 0.1;
    dayLight.color.setRGB(1, lerp(0.94, 0.55, ss(0.5, 0.75, h)), lerp(0.82, 0.3, ss(0.5, 0.75, h)));
    hemi.intensity = 0.5 * (1 - 0.7 * st.night);
    var fl = 1 + 0.08 * Math.sin(T * 7.3) + 0.05 * Math.sin(T * 11.1 + 1);
    lamp.intensity = 1.9 * st.night * fl; flame.material.opacity = st.night; flame.scale.set(0.14 * (0.9 + 0.1 * fl), 0.22 * (0.9 + 0.15 * fl), 1);
    /* le fileur et le métier */
    var w = st.work;
    wheel.rotation.z -= w * dt * 3.2; loom.children.forEach(function (m) { if (m.geometry && m.geometry.type === 'BoxGeometry' && Math.abs(m.position.x - wheel.position.x) < 0.01) m.rotation.z -= w * dt * 3.2; });
    spindles.forEach(function (s) { s.rotation.y += w * dt * 22; });
    arm.rotation.x = -1.1 + w * 0.25 * Math.sin(T * 3.2); spinner.position.y = w * 0.01 * Math.sin(T * 3.2);
    /* les bobines s'ajoutent, une par heure */
    var n = 0; bobbins.forEach(function (b, i) { var p = ss(BOB_T[i], BOB_T[i] + 0.12, G); b.scale.setScalar(Math.max(0.001, p)); b.rotation.y = (1 - p) * 4; if (p > 0.5) n++; }); st.count = n;
    /* la craie */
    lineAB.scale.x = Math.max(0.001, st.ab); la.material.opacity = ss(1.9, 2.05, G); lb.material.opacity = ss(2.85, 2.95, G);
    var bcLen = (XC - XB) * st.bc + (XC2 - XC) * st.bc2; lineBC.scale.x = Math.max(0.001, bcLen / (XC2 - XB));
    tickC.position.x = XB + bcLen; tickC.material = chalk; tickC.visible = st.bc > 0.05;
    lc.position.set(XB + bcLen, 0.005, ZL + 0.22); lc.material.opacity = ss(3.85, 3.98, G);
    wageCoins.forEach(function (c2, i) { c2.visible = st.paid > (i + 0.5) / 3.5; }); plusCoins.forEach(function (c2, i) { c2.visible = st.plus > (i + 0.5) / 3.5; });
    /* la caméra suit l'établi : du métier vers le coffre */
    var k = ss(2.0, 4.0, G);
    aim.set(lerp(-0.2, 1.3, k), 0.95, 0.2);
    camera.position.set(CAM.x + lerp(-0.4, 0.6, k) + 0.02 * Math.sin(T * 0.3), CAM.y + 0.015 * Math.sin(T * 0.41), CAM.z);
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() { var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; var v = 2 * Math.atan(Math.tan(HFOV * Math.PI / 360) / camera.aspect) * 180 / Math.PI; camera.fov = Math.max(34, Math.min(80, v)); camera.updateProjectionMatrix(); }
  function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st };
};

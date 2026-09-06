/* LE MONDE DU TRAVAIL ALIÉNÉ — le sculpteur et la statue.
   Marx donne l'image : l'homme « façonne aussi d'après les lois de la
   beauté », et « plus l'homme met de choses en Dieu, moins il en garde en
   lui-même ». Un sculpteur taille une statue, et chaque coup lui est ôté.
   On ne voit de lui que son OMBRE au mur (une vraie ombre portée par la
   lanterne) et le geste du maillet ; la statue est un vrai scan — Théodoric
   le Grand, Peter Vischer, Innsbruck 1513, threedscans.com, sans droits —
   qui sort du bloc de marbre à mesure qu'on lit (plan de coupe qui descend,
   bloc qui se réduit, éclats). Puis : elle se dresse achevée devant lui
   (1re détermination) ; le maillet frappe seul (2e) ; elle se tourne et lui
   fait face (3e) ; le marbre devient bronze, c'est un homme en armure (4e) ;
   le socle garde les traces du ciseau. Tout est fonction de g, réversible. */
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
  renderer.localClippingEnabled = true;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(BG, 7, 15);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 41; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── la pièce : dalles, mur de plâtre ── */
  var floorTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#2a2320'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 128) for (var x = ((y / 128) % 2) * 64; x < w + 64; x += 128) {
      var v = 52 + rnd() * 18 | 0; g.fillStyle = 'rgb(' + v + ',' + (v - 6) + ',' + (v - 12) + ')'; g.fillRect(x - 64 + 3, y + 3, 122, 122);
      for (var i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,' + rnd() * 0.15 + ')'; g.fillRect(x - 64 + rnd() * 122, y + rnd() * 122, 2 + rnd() * 3, 1 + rnd() * 2); }
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(4, 4);
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), std({ map: floorTex, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  var wallTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#5a4c3e'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 9000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '140,120,95') + ',' + rnd() * 0.1 + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
    for (var k = 0; k < 6; k++) { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; g.beginPath(); var x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (var s = 0; s < 8; s++) { x += (rnd() - 0.5) * 60; y += 30 + rnd() * 30; g.lineTo(x, y); } g.stroke(); }
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(3, 1.5);
  var WALL_Z = -2.8;
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), std({ map: wallTex, roughness: 0.96 })); wall.position.set(0, 4, WALL_Z); wall.receiveShadow = true; scene.add(wall);
  var sideWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), std({ map: wallTex, roughness: 0.96 })); sideWall.rotation.y = Math.PI / 2; sideWall.position.set(-4.6, 4, 2); sideWall.receiveShadow = true; scene.add(sideWall);

  /* ── la lumière : une lanterne qui porte les ombres ── */
  scene.add(new THREE.AmbientLight(0x3a2c1c, 0.35));
  var hemi = new THREE.HemisphereLight(0x6a5540, 0x0c0906, 0.25); scene.add(hemi);
  var LAMP = new THREE.Vector3(-1.6, 3.0, 1.9);
  var spot = new THREE.SpotLight(0xffc27a, 2.4, 16, 0.75, 0.55, 1.3); spot.position.copy(LAMP); spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0006; spot.shadow.radius = 3; spot.shadow.camera.near = 0.5; spot.shadow.camera.far = 14;
  spot.target.position.set(0.4, 0.9, -1.8); scene.add(spot); scene.add(spot.target);
  var fill = new THREE.PointLight(0xffb15c, 0.7, 10, 1.8); fill.position.set(2.6, 1.6, 2.4); scene.add(fill);
  var cold = new THREE.DirectionalLight(0x9fb4d0, 0); cold.position.set(3, 4, -2); scene.add(cold);
  var brass = std({ color: 0x9a7b30, roughness: 0.35, metalness: 0.8 });
  var lantern = new THREE.Group();
  var cage = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.3, 10, 1, true), std({ color: 0x2a2018, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })); lantern.add(cage);
  var cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.12, 10), brass); cap.position.y = 0.2; lantern.add(cap);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12), brass); ring.position.y = 0.3; lantern.add(ring);
  var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.0, 6), brass); chain.position.y = 0.8; lantern.add(chain);
  var flameTex = tex(64, 96, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h * 0.6, 2, w / 2, h * 0.55, w * 0.55); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.3, 'rgba(255,210,120,.9)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); flame.scale.set(0.16, 0.24, 1); lantern.add(flame);
  lantern.position.copy(LAMP); scene.add(lantern);

  /* ── le bloc, le socle, la statue ── */
  var marbleTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 26; i++) { g.strokeStyle = 'rgba(120,110,100,' + (0.08 + rnd() * 0.16) + ')'; g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); var x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (var s = 0; s < 14; s++) { x += (rnd() - 0.4) * 50; y += (rnd() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
    for (var k = 0; k < 4000; k++) { g.fillStyle = 'rgba(90,80,70,' + rnd() * 0.06 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping;
  var roughTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#d9d0c0'; g.fillRect(0, 0, w, h); for (var i = 0; i < 2500; i++) { var v = 170 + rnd() * 60 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 22) + ',' + (0.4 + rnd() * 0.6) + ')'; g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.fill(); } });
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  var STATUE = new THREE.Vector3(1.55, 0, -0.3), H = 2.15, BASE_H = 0.42, BW = 1.0;
  var plinth = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.3, BASE_H, BW + 0.3), std({ map: roughTex, roughness: 0.9 })); plinth.position.set(STATUE.x, BASE_H / 2, STATUE.z); plinth.castShadow = plinth.receiveShadow = true; scene.add(plinth);
  var block = new THREE.Mesh(new THREE.BoxGeometry(BW, 1, BW), std({ map: roughTex, roughness: 0.92 })); block.castShadow = block.receiveShadow = true; scene.add(block);
  var cutPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  var statueMat = std({ map: marbleTex, color: 0xffffff, roughness: 0.48, metalness: 0.0, clippingPlanes: [cutPlane], clipShadows: true });
  var statue = null, FACE = Math.PI;   /* le scan regarde vers -Z : face à la caméra, c'est π */
  var scene_ = document.querySelector('.nt-monde');
  var dir = (scene_ && scene_.dataset.scene ? scene_.dataset.scene : '/glossaire/mondes/travail-aliene/monde.js').replace(/monde\.js.*$/, '');
  var ready = fetch(dir + 'statue.bin').then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
    var dv = new DataView(ab);
    var nv = dv.getUint32(4, true), ni = dv.getUint32(8, true), ib = dv.getUint32(12, true);
    var mn = [dv.getFloat32(16, true), dv.getFloat32(20, true), dv.getFloat32(24, true)], ex = [dv.getFloat32(28, true), dv.getFloat32(32, true), dv.getFloat32(36, true)];
    var o = 40, pos = new Float32Array(nv * 3);
    for (var i = 0; i < nv * 3; i++) { pos[i] = mn[i % 3] + dv.getUint16(o, true) / 65535 * ex[i % 3]; o += 2; }
    var idx = ib === 4 ? new Uint32Array(ni) : new Uint16Array(ni);
    for (var j = 0; j < ni; j++) { idx[j] = ib === 4 ? dv.getUint32(o, true) : dv.getUint16(o, true); o += ib; }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingBox();
    var bb = geo.boundingBox, size = new THREE.Vector3(); bb.getSize(size);
    var k = H / size.y;
    /* le scan est exporté Y VERS LE BAS (ZBrush) : on le retourne, et l'on
       inverse l'ordre des sommets de chaque triangle pour garder l'endroit
       des faces, sinon l'éclairage et les ombres sont à l'envers */
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.max.y, -(bb.min.z + bb.max.z) / 2); geo.scale(k, -k, k);
    for (var f = 0; f < idx.length; f += 3) { var tmp = idx[f + 1]; idx[f + 1] = idx[f + 2]; idx[f + 2] = tmp; }
    geo.index.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox();
    /* les coordonnées de texture : une projection cylindrique suffit pour du marbre veiné */
    var uv = new Float32Array(nv * 2), p = geo.attributes.position.array;
    for (var q = 0; q < nv; q++) { uv[q * 2] = (Math.atan2(p[q * 3 + 2], p[q * 3]) / Math.PI + 1) * 1.5; uv[q * 2 + 1] = p[q * 3 + 1] / H * 2; }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    statue = new THREE.Mesh(geo, statueMat); statue.castShadow = true; statue.receiveShadow = true;
    statue.position.set(STATUE.x, BASE_H, STATUE.z); scene.add(statue);
    return statue;
  }).catch(function () { return null; });

  /* ── le sculpteur : une figure sombre au bord du cadre, dont on lit l'ombre ── */
  var sculptor = new THREE.Group();
  var dark = std({ color: 0x1c1612, roughness: 1 });
  var sLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.85, 10), dark); sLegs.position.y = 0.42; sculptor.add(sLegs);
  var sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.7, 12), dark); sBody.position.y = 1.2; sculptor.add(sBody);
  var sHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), dark); sHead.position.set(0.03, 1.7, 0.02); sculptor.add(sHead);
  var sArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 8), dark); sArmL.position.set(-0.27, 1.35, 0.15); sArmL.rotation.x = -1.2; sArmL.rotation.z = 0.25; sculptor.add(sArmL);
  var sArmR = new THREE.Group(); var armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.6, 8), dark); armMesh.position.y = -0.3; sArmR.add(armMesh);
  var mallet = new THREE.Group();
  var mHead = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12), std({ map: roughTex, color: 0x7a5a38, roughness: 0.8 })); mHead.rotation.z = Math.PI / 2; mHead.position.y = -0.62; mallet.add(mHead);
  var mHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 8), std({ color: 0x5a3b20, roughness: 0.8 })); mHandle.position.y = -0.5; mallet.add(mHandle);
  sArmR.add(mallet); sArmR.position.set(0.28, 1.45, 0.1); sculptor.add(sArmR);
  sculptor.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
  var chisel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.28, 8), std({ color: 0x8e9299, metalness: 0.85, roughness: 0.35 })); chisel.castShadow = true; scene.add(chisel);
  var SCULPT0 = new THREE.Vector3(0.1, 0, 0.55);
  sculptor.position.copy(SCULPT0); sculptor.rotation.y = 1.1; scene.add(sculptor);

  /* ── les éclats ── */
  var NCH = 140, chipPos = new Float32Array(NCH * 3), chips = [];
  for (var c = 0; c < NCH; c++) chips.push({ t: rnd() * 1.4, vx: (rnd() - 0.5) * 1.6, vy: 0.6 + rnd() * 1.6, vz: (rnd() - 0.5) * 1.6, r: rnd() });
  var chipGeo = new THREE.BufferGeometry(); chipGeo.setAttribute('position', new THREE.BufferAttribute(chipPos, 3));
  var chipPts = new THREE.Points(chipGeo, new THREE.PointsMaterial({ color: 0xe6dccb, size: 0.028, transparent: true, opacity: 0.9, depthWrite: false })); scene.add(chipPts);
  var dustPos = new Float32Array(200 * 3); for (var d = 0; d < 600; d++) dustPos[d] = (rnd() - 0.5) * (d % 3 === 1 ? 4 : 7) + (d % 3 === 1 ? 2 : 0);
  var dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd9a0, size: 0.016, transparent: true, opacity: 0.35, depthWrite: false })));

  /* ── chorégraphie ── */
  var G = 0, T = 0, st = { cut: 1, carve: 0, shrink: 0, alone: 0, turn: 0, bronze: 0, close: 0, end: 0 };
  function set(g) { G = g; }
  function compute() {
    st.cut = 1 - ss(0.05, 1.75, G);                 /* 1 = bloc entier, 0 = statue dégagée */
    st.carve = (G < 1.75 ? ss(0.05, 0.3, G) : 0) * (1 - ss(1.55, 1.75, G)) + ss(2.0, 2.4, G) * (1 - ss(2.9, 3.2, G));
    st.shrink = ss(1.1, 2.0, G) * 0.45 + ss(2.1, 3.0, G) * 0.3 + ss(3.9, 4.6, G) * 0.25;
    st.alone = ss(2.0, 2.5, G) * (1 - ss(2.9, 3.3, G));
    st.turn = ss(3.0, 3.9, G);
    st.bronze = ss(4.0, 4.7, G);
    st.close = ss(4.0, 4.6, G) * (1 - ss(4.95, 5.4, G));
    st.end = ss(5.0, 5.6, G);
  }
  var MARB = new THREE.Color(0xffffff), BRZ = new THREE.Color(0x5e4426);
  function frame(dt) {
    T += dt; compute();
    var fl = 1 + 0.07 * Math.sin(T * 7.3) + 0.04 * Math.sin(T * 11.1 + 1);
    spot.intensity = 2.4 * fl * (1 - 0.35 * st.bronze); fill.intensity = 0.7 * fl; flame.scale.set(0.16 * (0.9 + 0.1 * fl), 0.24 * (0.9 + 0.15 * fl), 1);
    lantern.rotation.z = 0.04 * Math.sin(T * 0.8); cold.intensity = 1.1 * st.bronze;
    /* la coupe et le bloc */
    var cutY = BASE_H + H * st.cut;
    cutPlane.constant = -(cutY - 0.002);
    var bh = Math.max(0.001, H * st.cut); block.scale.y = bh; block.position.set(STATUE.x, BASE_H + bh / 2, STATUE.z);
    block.visible = st.cut > 0.003;
    /* le sculpteur : présent, puis de moins en moins */
    var sc = 1 - st.shrink; sculptor.scale.setScalar(Math.max(0.05, sc));
    var work = st.carve * (1 - st.alone);
    var swing = work * (0.5 + 0.5 * Math.sin(T * 6.5));
    sArmR.rotation.x = -1.6 + swing * 1.1;
    /* le ciseau : à la main, puis seul, au point de coupe */
    var cutPoint = new THREE.Vector3(STATUE.x - BW * 0.5, cutY, STATUE.z + BW * 0.5);
    var hand = new THREE.Vector3(-0.05, 1.25, 0.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), sculptor.rotation.y).multiplyScalar(sc).add(sculptor.position);
    chisel.position.lerpVectors(hand, cutPoint, st.alone); chisel.rotation.z = lerp(-0.6, -0.9, st.alone); chisel.rotation.y = 0.6;
    if (st.alone > 0) { chisel.position.x += 0.02 * Math.sin(T * 6.5) * st.alone; }
    mallet.position.y = 0; if (st.alone > 0.5) { mallet.visible = false; } else { mallet.visible = true; }
    /* les éclats volent au point de coupe quand on taille */
    var act = st.carve;
    for (var i = 0; i < NCH; i++) { var ch = chips[i]; ch.t += dt * 1.1; if (ch.t > 1.4) { ch.t = 0; ch.vx = (rnd() - 0.5) * 1.6; ch.vz = (rnd() - 0.5) * 1.6; ch.vy = 0.6 + rnd() * 1.6; }
      var t2 = ch.t; chipPos[i * 3] = cutPoint.x + 0.3 + ch.vx * t2; chipPos[i * 3 + 1] = Math.max(0.02, cutY + ch.vy * t2 - 2.4 * t2 * t2); chipPos[i * 3 + 2] = cutPoint.z - 0.3 + ch.vz * t2; }
    chipGeo.attributes.position.needsUpdate = true; chipPts.material.opacity = 0.9 * act;
    /* la statue se tourne, puis devient bronze */
    if (statue) {
      statue.rotation.y = FACE + lerp(0.75, 0.0, st.turn) + 0.02 * Math.sin(T * 0.3) * st.turn;
      statueMat.color.copy(MARB).lerp(BRZ, st.bronze); statueMat.metalness = 0.9 * st.bronze; statueMat.roughness = lerp(0.48, 0.34, st.bronze);
      statueMat.map = st.bronze > 0.5 ? null : marbleTex; statueMat.needsUpdate = statueMat.map !== statueMat.userData.last; statueMat.userData.last = statueMat.map;
    }
    /* la caméra : elle suit la coupe, recule pour voir la statue entière, s'approche du visage, redescend au socle */
    var cy = lerp(2.55, 1.35, 1 - st.cut);
    /* on vise à GAUCHE de la statue : la colonne de texte occupe les 600
       premiers pixels, la statue doit vivre dans la moitié droite */
    var ax = STATUE.x - 0.9 + 0.5 * st.close, ay = lerp(cy, 1.2, ss(1.5, 2.2, G)); ay = lerp(ay, 1.95, st.close); ay = lerp(ay, 0.55, st.end);
    var cz = lerp(5.4, 3.4, st.close); cz = lerp(cz, 4.6, st.end);
    camera.position.set(0.45 + 0.02 * Math.sin(T * 0.3), lerp(cy + 0.15, 1.7, ss(1.5, 2.2, G)) + 0.015 * Math.sin(T * 0.41), cz);
    camera.position.y = lerp(camera.position.y, 1.95, st.close); camera.position.y = lerp(camera.position.y, 1.1, st.end);
    aim.set(ax, ay, STATUE.z); camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() { var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h > 1.2 ? 38 : Math.min(70, 2 * Math.atan(Math.tan(50 * Math.PI / 360) / camera.aspect) * 180 / Math.PI); camera.updateProjectionMatrix(); }
  function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, ready: ready, setFace: function (r) { FACE = r; } };
};

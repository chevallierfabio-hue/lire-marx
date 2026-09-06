/* LE MONDE DU TRAVAIL ALIÉNÉ — l'atelier de 1844, coupé en deux.
   À gauche l'ouvrier à son établi, sous sa lampe ; ce qu'il fabrique quitte
   l'établi, traverse le vide et s'assemble à droite en un édifice qui monte
   — « des palais ». À mesure qu'il monte, le côté de l'ouvrier se dépouille :
   la lampe baisse, le mur se resserre — « des tanières ». À la troisième
   détermination l'édifice se retourne et lui fait face ; à la quatrième une
   silhouette paraît à son sommet — celui à qui le produit appartient.
   Tout est fonction de g, donc réversible : on remonte, les objets rentrent. */
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
  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(BG, 6, 16);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  var HFOV = 52; var CAM = { x: 0.3, y: 1.75, z: 6.4 }; var aim = new THREE.Vector3(0.2, 1.1, 0);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 23; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── la pièce ── */
  var floorTex = tex(512, 512, function (g, w, h) { g.fillStyle = '#1e150c'; g.fillRect(0, 0, w, h); for (var b = 0; b < 8; b++) { g.fillStyle = 'rgb(' + (30 + rnd() * 12 | 0) + ',' + (20 + rnd() * 6 | 0) + ',' + (10 + rnd() * 4 | 0) + ')'; g.fillRect(0, b * 64, w, 62); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, b * 64 + 62, w, 2); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), std({ map: floorTex, roughness: 0.85 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var wallTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#2b2016'; g.fillRect(0, 0, w, h); for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '90,70,45') + ',' + rnd() * 0.12 + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); } });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(5, 2);
  var WALL_Z = -2.6;
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 7), std({ map: wallTex, roughness: 0.95 })); wall.position.set(0, 3.5, WALL_Z); scene.add(wall);
  /* la tanière : un pan de mur et une poutre qui se resserrent sur l'ouvrier */
  var denWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 5), std({ map: wallTex, roughness: 0.95 })); denWall.position.set(-3.4, 3, -0.2); scene.add(denWall);
  var beam = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.28, 0.32), std({ color: 0x241a10, roughness: 0.9 })); beam.position.set(-1.9, 3.2, 0.2); scene.add(beam);

  scene.add(new THREE.AmbientLight(0x3a2a18, 0.5));
  var hemi = new THREE.HemisphereLight(0x5a4530, 0x0d0a07, 0.3); scene.add(hemi);
  var lamp = new THREE.PointLight(0xffb15c, 1.7, 9, 1.6); var LAMP = new THREE.Vector3(-1.75, 2.3, 0.4); lamp.position.copy(LAMP); scene.add(lamp);
  var coldLight = new THREE.PointLight(0xc8b898, 0.35, 10, 1.4); coldLight.position.set(2.2, 3.5, 1.5); scene.add(coldLight);
  var flameTex = tex(64, 96, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h * 0.6, 2, w / 2, h * 0.55, w * 0.55); gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.3, 'rgba(255,210,120,.9)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); flame.scale.set(0.18, 0.28, 1); flame.position.copy(LAMP); scene.add(flame);
  var brass = std({ color: 0x9a7b30, roughness: 0.35, metalness: 0.8 });
  var lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.16, 12), brass); lampBody.position.set(LAMP.x, LAMP.y - 0.2, LAMP.z); scene.add(lampBody);
  var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 6), brass); chain.position.set(LAMP.x, LAMP.y + 0.35, LAMP.z); scene.add(chain);

  /* ── l'établi et l'ouvrier ── */
  var woodTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#5a3b20'; g.fillRect(0, 0, w, h); for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(30,16,6,' + (0.08 + rnd() * 0.14) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 8); g.stroke(); } });
  var wood = std({ map: woodTex, roughness: 0.7 });
  var bench = new THREE.Group();
  var bt = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.8), wood); bt.position.y = 0.85; bench.add(bt);
  [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.3], [0.75, 0.3]].forEach(function (c) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.85, 0.09), wood); l.position.set(c[0], 0.42, c[1]); bench.add(l); });
  var vise = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.2), std({ color: 0x3c3c40, metalness: 0.7, roughness: 0.4 })); vise.position.set(0.65, 0.97, 0.25); bench.add(vise);
  bench.position.set(-1.7, 0, 0.2); scene.add(bench);
  var worker = new THREE.Group();
  var coat = std({ color: 0x4a3c2e, roughness: 1 });
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 12), coat); body.position.y = 0.95; worker.add(body);
  var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.5, 10), std({ color: 0x2c261f, roughness: 1 })); legs.position.y = 0.25; worker.add(legs);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), std({ color: 0xc9a483, roughness: 0.8 })); head.position.y = 1.56; head.rotation.x = 0.35; worker.add(head);
  var arm = new THREE.Group(); var armM = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.55, 8), coat); armM.position.y = -0.27; arm.add(armM);
  var hammer = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.07), std({ color: 0x3c3c40, metalness: 0.7, roughness: 0.4 })); hammer.position.set(0, -0.55, 0.06); arm.add(hammer);
  arm.position.set(0.22, 1.35, 0.25); worker.add(arm);
  worker.position.set(-1.7, 0, -0.55); worker.rotation.y = 0; scene.add(worker);   /* derrière l'établi, face à nous : on voit le geste */

  /* ── les objets : de l'établi à l'édifice ── */
  var mats = [std({ map: woodTex, roughness: 0.7 }), std({ color: 0x8a6a3a, metalness: 0.7, roughness: 0.4 }), std({ color: 0xb8a88c, roughness: 0.85 })];
  var objs = [];
  var N = 16;
  /* les places dans l'édifice : trois assises et un fronton, sur un socle */
  var slots = [];
  for (var i = 0; i < 6; i++) slots.push([-0.62 + i * 0.25, 0.19]);
  for (i = 0; i < 5; i++) slots.push([-0.5 + i * 0.25, 0.53]);
  for (i = 0; i < 3; i++) slots.push([-0.25 + i * 0.25, 0.87]);
  slots.push([0, 1.21]); slots.push([0, 1.5]);
  var edifice = new THREE.Group(); edifice.position.set(1.85, 0, -0.5); scene.add(edifice);
  var plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 1.2), std({ color: 0x8c7c66, roughness: 0.9 })); plinth.position.y = 0.08; plinth.scale.set(0.001, 1, 1); edifice.add(plinth);
  var colL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.0, 12), mats[2]); colL.position.set(-1.0, 1.16, 0.3); edifice.add(colL);
  var colR = colL.clone(); colR.position.x = 1.0; edifice.add(colR);
  var pediment = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.55, 3), mats[2]); pediment.rotation.y = Math.PI / 6; pediment.position.set(0, 2.45, 0.3); pediment.scale.set(1, 0.001, 0.35); edifice.add(pediment);
  for (i = 0; i < N; i++) {
    var kind = i % 3, m;
    if (kind === 0) m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), mats[0]);
    else if (kind === 1) m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 12), mats[1]);
    else m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.2), mats[2]);
    var home = new THREE.Vector3(-1.7 + (i % 4) * 0.28 - 0.42, 1.05 + Math.floor(i / 4) * 0.01, 0.2 + (i % 2) * 0.22 - 0.1);
    var sl = slots[Math.min(i, slots.length - 1)];
    var dest = new THREE.Vector3(edifice.position.x + sl[0], sl[1] + 0.15, edifice.position.z + 0.3 + (i % 2) * 0.02);
    m.userData = { home: home, dest: dest, t0: 1.0 + i * 0.055, spin: rnd() * 6.28, i: i };
    m.position.copy(home); scene.add(m); objs.push(m);
  }
  /* la silhouette au sommet : celui à qui le produit appartient */
  var other = new THREE.Group();
  var oBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.8, 12), std({ color: 0x2a2320, roughness: 0.9 })); oBody.position.y = 0.75; other.add(oBody);
  var oHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), std({ color: 0xb8956f, roughness: 0.8 })); oHead.position.y = 1.28; other.add(oHead);
  var oHat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12), std({ color: 0x0a0807 })); oHat.position.y = 1.47; other.add(oHat);
  var oBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 14), std({ color: 0x0a0807 })); oBrim.position.y = 1.37; other.add(oBrim);
  other.traverse(function (o) { if (o.material) { o.material.transparent = true; o.material.opacity = 0; } });
  other.position.set(0.72, 0.16, 0.85); other.scale.setScalar(0.9); edifice.add(other);   /* debout devant son palais, sur le socle */

  /* ── chorégraphie ── */
  var G = 0, T = 0, st = { work: 0, den: 0, face: 0, other: 0, built: 0 };
  function set(g) { G = g; }
  function compute() {
    st.work = ss(0.4, 0.9, G);
    st.built = ss(1.0, 2.1, G);
    st.den = ss(2.0, 3.0, G);
    st.face = ss(3.0, 3.9, G);
    st.other = ss(4.0, 4.6, G);
  }
  function frame(dt) {
    T += dt; compute();
    var fl = 1 + 0.08 * Math.sin(T * 7.3) + 0.05 * Math.sin(T * 11.1 + 1);
    lamp.intensity = 1.7 * fl * (1 - 0.68 * st.den);
    flame.scale.set(0.18 * (0.9 + 0.1 * fl) * (1 - 0.5 * st.den), 0.28 * (0.9 + 0.15 * fl) * (1 - 0.5 * st.den), 1);
    coldLight.intensity = 0.35 + 0.9 * st.face;
    /* la tanière se resserre */
    denWall.position.x = lerp(-3.4, -2.55, st.den); beam.position.y = lerp(3.2, 2.55, st.den); beam.position.x = lerp(-1.9, -1.75, st.den);
    /* l'ouvrier frappe */
    var w = st.work * (1 - 0.35 * st.den);
    arm.rotation.x = -0.9 + w * 0.7 * (0.5 + 0.5 * Math.sin(T * 5.2));
    worker.position.y = w * 0.012 * Math.sin(T * 5.2 + 1.5);
    /* les objets voyagent */
    objs.forEach(function (o) {
      var u = o.userData, p = ss(u.t0, u.t0 + 0.42, G);
      o.position.lerpVectors(u.home, u.dest, p); o.position.y += Math.sin(Math.PI * p) * 0.9;
      var tumble = Math.sin(Math.PI * p);
      o.rotation.set(tumble * 2.2 + u.spin * 0.1, u.spin * (1 - p) + tumble * 3, tumble * 1.4);
      /* posé dans l'édifice, il suit sa rotation */
      if (p > 0.999) { var v = new THREE.Vector3(u.dest.x - edifice.position.x, u.dest.y, u.dest.z - edifice.position.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), edifice.rotation.y); o.position.set(edifice.position.x + v.x, v.y, edifice.position.z + v.z); o.rotation.set(0, edifice.rotation.y, 0); }
    });
    plinth.scale.x = Math.max(0.001, st.built);
    colL.scale.y = colR.scale.y = Math.max(0.001, ss(1.6, 2.3, G)); colL.position.y = colR.position.y = 0.16 + 1.0 * colL.scale.y;
    pediment.scale.y = Math.max(0.001, ss(2.1, 2.6, G));
    /* l'édifice se retourne et lui fait face */
    edifice.rotation.y = lerp(0.12, -0.42, st.face);
    edifice.scale.setScalar(1 + 0.22 * st.face);
    /* quelqu'un au sommet */
    other.traverse(function (o) { if (o.material) o.material.opacity = st.other; });
    other.position.y = lerp(-0.4, 0.16, st.other);
    /* la caméra glisse vers l'édifice à mesure qu'il monte */
    var k = st.built * 0.6 + st.face * 0.4;
    aim.set(lerp(-0.6, 0.5, k), lerp(1.0, 1.35, k), 0);
    camera.position.set(CAM.x + lerp(-0.5, 0.5, k) + 0.02 * Math.sin(T * 0.3), CAM.y + 0.015 * Math.sin(T * 0.41), CAM.z + 0.3 * st.face);
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() { var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; var v = 2 * Math.atan(Math.tan(HFOV * Math.PI / 360) / camera.aspect) * 180 / Math.PI; camera.fov = Math.max(34, Math.min(80, v)); camera.updateProjectionMatrix(); }
  function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st };
};

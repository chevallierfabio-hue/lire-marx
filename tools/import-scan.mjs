// tools/import-scan.mjs — IMPORTE un scan 3D (OBJ) en géométrie légère pour un monde
//
// Comme capture-monde.mjs : PAS une étape de build, un outil de dépôt. Le site
// n'a pas de GLTFLoader (vendor/three.min.js est le cœur r137, et l'on n'en
// ajoute pas) : on écrit un petit binaire que le monde lit avec fetch() et un
// DataView — positions quantifiées sur 16 bits dans la boîte englobante,
// indices sur 16 ou 32 bits. Les normales se calculent au chargement.
//
//   node tools/import-scan.mjs <fichier.obj> <sortie.bin> [triangles cibles]
//
// La réduction est un regroupement de sommets sur une grille (vertex
// clustering) : simple, rapide sur un million de faces, et fidèle au-delà
// de 150 cellules sur le grand axe. On resserre la grille jusqu'à tomber
// sous la cible.
import fs from 'node:fs';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v]; }));
const [src, out, targetArg] = args;
if (!src || !out) { console.error('Usage : node tools/import-scan.mjs <in.obj|stl|glb> <out.bin> [tris] [--keep=nx,ny,nz,c] [--largest]'); process.exit(1); }
const TARGET = +(targetArg || 45000);
/* --keep=nx,ny,nz,c : ne garde que les triangles dont le centre vérifie n·p ≥ c
   (un demi-espace, pour détacher une figure d'un groupe) ; --largest : ne garde
   que la plus grande composante connexe — ce qui reste de l'autre figure
   après la coupe tombe en morceaux séparés, et l'on ne garde que le corps. */

const V = []; const F = [];
if (/\.glb$/i.test(src)) {
  /* glTF binaire : entête 12 octets, puis des chunks (JSON, BIN). On lit les
     primitives triangulées de chaque mesh, avec la transformation de leur
     nœud (les paquets du Smithsonian posent l'échelle sur le nœud). Pas de
     Draco ici : prendre la dérivée « low » ou « medium », non compressée. */
  const b = fs.readFileSync(src);
  const jsonLen = b.readUInt32LE(12); const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOff = 20 + jsonLen + 8; const bin = b.subarray(binOff, binOff + b.readUInt32LE(20 + jsonLen));
  const CT = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  function acc(i) {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView]; const [T, sz] = CT[a.componentType]; const n = NC[a.type];
    const off = (bv.byteOffset || 0) + (a.byteOffset || 0); const stride = bv.byteStride || n * sz; const out = new Float64Array(a.count * n);
    for (let k = 0; k < a.count; k++) { const v = new T(bin.buffer, bin.byteOffset + off + k * stride, n); for (let c = 0; c < n; c++) out[k * n + c] = v[c]; }
    return out;
  }
  function mat(node) { /* matrice 4x4 du nœud (TRS ou matrix), sans les parents : suffit pour ces paquets */
    if (node.matrix) return node.matrix;
    const t = node.translation || [0, 0, 0], q = node.rotation || [0, 0, 0, 1], sc = node.scale || [1, 1, 1];
    const [x, y, z, w] = q; const m = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, t[0], t[1], t[2], 1];
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 4 + r] *= sc[c];
    return m;
  }
  const nodes = json.nodes || [];
  for (const node of nodes) {
    if (node.mesh === undefined) continue; const m = mat(node);
    for (const prim of json.meshes[node.mesh].primitives) {
      if (prim.mode !== undefined && prim.mode !== 4) continue;
      const P = acc(prim.attributes.POSITION); const base = V.length / 3;
      for (let k = 0; k < P.length; k += 3) { const x = P[k], y = P[k + 1], z = P[k + 2];
        V.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]); }
      if (prim.indices !== undefined) { const I = acc(prim.indices); for (let k = 0; k < I.length; k++) F.push(base + I[k]); }
      else for (let k = 0; k < P.length / 3; k++) F.push(base + k);
    }
  }
} else if (/\.stl$/i.test(src)) {
  /* STL binaire : 80 octets d'entête, un Uint32 de triangles, puis 50 octets
     par triangle (normale, 3 sommets, attribut). Les sommets sont dupliqués
     par triangle : on les fusionne à l'identique avant le regroupement. */
  const b = fs.readFileSync(src); const n = b.readUInt32LE(80); const map = new Map();
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50; const tri = [];
    for (let k = 0; k < 3; k++) {
      const x = b.readFloatLE(o + 12 + k * 12), y = b.readFloatLE(o + 16 + k * 12), z = b.readFloatLE(o + 20 + k * 12);
      const key = x + ',' + y + ',' + z; let j = map.get(key);
      if (j === undefined) { j = V.length / 3; map.set(key, j); V.push(x, y, z); }
      tri.push(j);
    }
    F.push(tri[0], tri[1], tri[2]);
  }
} else {
const txt = fs.readFileSync(src, 'utf8');
for (const line of txt.split('\n')) {
  if (line.charCodeAt(0) === 118 && line.charCodeAt(1) === 32) { const p = line.trim().split(/\s+/); V.push(+p[1], +p[2], +p[3]); }
  else if (line.charCodeAt(0) === 102 && line.charCodeAt(1) === 32) {
    const p = line.trim().split(/\s+/).slice(1).map((s) => +s.split('/')[0] - 1);
    for (let i = 1; i + 1 < p.length; i++) F.push(p[0], p[i], p[i + 1]);
  }
}
}
if (opt.keep) for (const plane of String(opt.keep).split(';')) {
  /* nx,ny,nz,c[,ymin,ymax] : la bande ymin..ymax limite le plan aux hauteurs
     où il sert (le plan qui sépare deux têtes n'est pas celui des jambes) */
  const [nx, ny, nz, c, y0, y1] = plane.split(',').map(Number); const G = [];
  for (let t = 0; t < F.length; t += 3) { let d = 0, cy = 0; for (let k = 0; k < 3; k++) { const i = F[t + k]; d += nx * V[i * 3] + ny * V[i * 3 + 1] + nz * V[i * 3 + 2]; cy += V[i * 3 + 1] / 3; }
    const inBand = y0 === undefined || (cy >= y0 && cy <= y1);
    if (!inBand || d / 3 >= c) G.push(F[t], F[t + 1], F[t + 2]); }
  console.log(`coupe ${plane} : ${F.length / 3} → ${G.length / 3} triangles`); F.length = 0; for (const v of G) F.push(v);
}
if (opt.drop) {
  /* --drop=x0,x1,y0,y1,z0,z1[;x0,...] : retire les triangles dont le centre
     tombe dans une de ces boîtes (les restes d'une autre figure). */
  const boxes = String(opt.drop).split(';').map((b) => b.split(',').map(Number)); const G = [];
  for (let t = 0; t < F.length; t += 3) { let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { const i = F[t + k]; cx += V[i * 3] / 3; cy += V[i * 3 + 1] / 3; cz += V[i * 3 + 2] / 3; }
    if (boxes.some((b) => cx >= b[0] && cx <= b[1] && cy >= b[2] && cy <= b[3] && cz >= b[4] && cz <= b[5])) continue; G.push(F[t], F[t + 1], F[t + 2]); }
  console.log(`boîtes : ${F.length / 3} → ${G.length / 3} triangles`); F.length = 0; for (const v of G) F.push(v);
}
if (opt.stats) {
  /* --stats=x0,x1,y0,y1,z0,z1 : décrit ce qu'il y a dans une boîte, pour la viser */
  const b = String(opt.stats).split(',').map(Number); let n = 0, mn = [9, 9, 9], mx = [-9, -9, -9];
  for (let t = 0; t < F.length; t += 3) { let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { const i = F[t + k]; cx += V[i * 3] / 3; cy += V[i * 3 + 1] / 3; cz += V[i * 3 + 2] / 3; }
    if (cx >= b[0] && cx <= b[1] && cy >= b[2] && cy <= b[3] && cz >= b[4] && cz <= b[5]) { n++; mn = [Math.min(mn[0], cx), Math.min(mn[1], cy), Math.min(mn[2], cz)]; mx = [Math.max(mx[0], cx), Math.max(mx[1], cy), Math.max(mx[2], cz)]; } }
  console.log(`stats : ${n} triangles dans la boîte, étendue ${mn.map((v) => v.toFixed(3))} → ${mx.map((v) => v.toFixed(3))}`);
}
if (opt.largest) {
  /* on soude d'abord les sommets confondus (les maillages décodés de Draco
     dédoublent les sommets aux coutures d'UV : sans soudure, le corps tombe
     en cent morceaux) */
  const parent = new Int32Array(V.length / 3); for (let i = 0; i < parent.length; i++) parent[i] = i;
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const weld = new Map(); const Q = 1e-5;
  for (let i = 0; i < parent.length; i++) { const key = Math.round(V[i * 3] / Q) + ',' + Math.round(V[i * 3 + 1] / Q) + ',' + Math.round(V[i * 3 + 2] / Q); const j = weld.get(key); if (j === undefined) weld.set(key, i); else parent[find(i)] = find(j); }
  for (let t = 0; t < F.length; t += 3) { const a = find(F[t]), b = find(F[t + 1]), c = find(F[t + 2]); parent[a] = b; parent[find(b)] = find(c); }
  const count = new Map(); for (let t = 0; t < F.length; t += 3) { const r = find(F[t]); count.set(r, (count.get(r) || 0) + 1); }
  let best = null; for (const [r, n] of count) if (!best || n > count.get(best)) best = r;
  const G = []; for (let t = 0; t < F.length; t += 3) if (find(F[t]) === best) G.push(F[t], F[t + 1], F[t + 2]);
  console.log(`composantes : ${count.size}, la plus grande ${G.length / 3} / ${F.length / 3} triangles`); F.length = 0; for (const v of G) F.push(v);
}
const nv = V.length / 3, nf = F.length / 3;
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
const used = new Uint8Array(nv); for (let t = 0; t < F.length; t++) used[F[t]] = 1;
for (let i = 0; i < nv; i++) { if (!used[i]) continue; for (let k = 0; k < 3; k++) { const v = V[i * 3 + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; } }
const ext = mx.map((m, k) => m - mn[k]); const big = Math.max(...ext);
console.log(`source : ${nv} sommets, ${nf} triangles, boîte ${ext.map((e) => e.toFixed(2)).join(' × ')}`);

function cluster(res) {
  const cell = big / res; const map = new Map(); const P = []; const idx = new Int32Array(nv);
  const acc = [];
  for (let i = 0; i < nv; i++) {
    if (!used[i]) continue;
    const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
    const key = ((Math.floor((x - mn[0]) / cell) * 4099 + Math.floor((y - mn[1]) / cell)) * 4099 + Math.floor((z - mn[2]) / cell));
    let j = map.get(key);
    if (j === undefined) { j = acc.length; map.set(key, j); acc.push([0, 0, 0, 0]); }
    const a = acc[j]; a[0] += x; a[1] += y; a[2] += z; a[3]++; idx[i] = j;
  }
  for (const a of acc) P.push(a[0] / a[3], a[1] / a[3], a[2] / a[3]);
  const I = []; const seen = new Set();
  for (let t = 0; t < nf; t++) {
    const a = idx[F[t * 3]], b = idx[F[t * 3 + 1]], c = idx[F[t * 3 + 2]];
    if (a === b || b === c || a === c) continue;
    const k = [a, b, c].sort((p, q) => p - q).join(','); if (seen.has(k)) continue; seen.add(k);
    I.push(a, b, c);
  }
  return { P, I };
}
let res = 120, best = null;
for (let it = 0; it < 12; it++) {
  const r = cluster(res); const tris = r.I.length / 3;
  best = r; console.log(`  grille ${res} → ${r.P.length / 3} sommets, ${tris} triangles`);
  if (tris > TARGET) break;
  res = Math.round(res * 1.25);
}
/* on garde la dernière grille SOUS la cible : refaire un pas en arrière si l'on a dépassé */
if (best.I.length / 3 > TARGET) { res = Math.round(res / 1.25); best = cluster(res); console.log(`  retenu : grille ${res} → ${best.P.length / 3} sommets, ${best.I.length / 3} triangles`); }
const { P, I } = best;
const np = P.length / 3; const wide = np > 65535;
/* entête : magic 'LMS1', nv, ni, indexBytes, puis min[3], ext[3] en float32, puis positions Uint16 ×3, indices */
const head = 4 + 4 + 4 + 4 + 24;
const buf = Buffer.alloc(head + np * 6 + I.length * (wide ? 4 : 2));
buf.write('LMS1', 0); buf.writeUInt32LE(np, 4); buf.writeUInt32LE(I.length, 8); buf.writeUInt32LE(wide ? 4 : 2, 12);
for (let k = 0; k < 3; k++) { buf.writeFloatLE(mn[k], 16 + k * 4); buf.writeFloatLE(ext[k], 28 + k * 4); }
let o = head;
for (let i = 0; i < np; i++) for (let k = 0; k < 3; k++) { buf.writeUInt16LE(Math.round((P[i * 3 + k] - mn[k]) / (ext[k] || 1) * 65535), o); o += 2; }
for (let i = 0; i < I.length; i++) { if (wide) buf.writeUInt32LE(I[i], o), o += 4; else buf.writeUInt16LE(I[i], o), o += 2; }
fs.writeFileSync(out, buf);
console.log(`✓ ${out} : ${np} sommets, ${I.length / 3} triangles, ${Math.round(buf.length / 1024)} Ko`);

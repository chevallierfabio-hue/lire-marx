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
const [,, src, out, targetArg] = process.argv;
if (!src || !out) { console.error('Usage : node tools/import-scan.mjs <in.obj> <out.bin> [tris]'); process.exit(1); }
const TARGET = +(targetArg || 45000);

const txt = fs.readFileSync(src, 'utf8');
const V = []; const F = [];
for (const line of txt.split('\n')) {
  if (line.charCodeAt(0) === 118 && line.charCodeAt(1) === 32) { const p = line.trim().split(/\s+/); V.push(+p[1], +p[2], +p[3]); }
  else if (line.charCodeAt(0) === 102 && line.charCodeAt(1) === 32) {
    const p = line.trim().split(/\s+/).slice(1).map((s) => +s.split('/')[0] - 1);
    for (let i = 1; i + 1 < p.length; i++) F.push(p[0], p[i], p[i + 1]);
  }
}
const nv = V.length / 3, nf = F.length / 3;
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const v = V[i * 3 + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
const ext = mx.map((m, k) => m - mn[k]); const big = Math.max(...ext);
console.log(`source : ${nv} sommets, ${nf} triangles, boîte ${ext.map((e) => e.toFixed(2)).join(' × ')}`);

function cluster(res) {
  const cell = big / res; const map = new Map(); const P = []; const idx = new Int32Array(nv);
  const acc = [];
  for (let i = 0; i < nv; i++) {
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

// tools/export-chariot.mjs — REGÉNÈRE assets/chariot.json
//
// Ce script n'est PAS une étape de build du site : le site reste 100 %
// statique et se contente de lire `assets/chariot.json`. C'est un outil
// ponctuel, à relancer seulement quand le chariot change dans le jeu.
//
// Il extrait `Vehicle.group` du projet « Le Circuit du Capital »
// (~/Desktop/circuit-du-capital, dépôt séparé) et le sérialise avec
// `Object3D.toJSON()`. Les géométries y sont PARAMÉTRIQUES (BoxGeometry
// {width,height,depth}, etc.), donc le fichier reste petit (~23 Ko gzippés)
// et THREE.ObjectLoader le relit nativement — aucun GLTFLoader à vendoriser
// à côté de vendor/three.min.js.
//
// Mode d'emploi (depuis le dépôt du jeu, qui a puppeteer-core et vite) :
//   cd ~/Desktop/circuit-du-capital
//   npx vite --port 5199 &
//   cp ~/Desktop/lire-marx/tools/export-chariot.mjs . && node export-chariot.mjs
//
// Sorties nommées, consommées par circuitChariot() dans assets/home.js :
//   cargo-argent / cargo-moyens / cargo-marchandises, wheel-0..3, lamp,
//   lantern, driver.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/Users/fche/Desktop/lire-marx/assets/chariot.json';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args:['--no-sandbox','--disable-setuid-sandbox','--use-gl=angle','--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5199/', { waitUntil:'networkidle0', timeout:60000 });
await new Promise(r=>setTimeout(r,3000));

const json = await page.evaluate(async () => {
  const m = await import('/src/app.js');
  const T = m.THREE, V = m.Vehicle;
  const g = V.group.clone(true);
  g.position.set(0,0,0); g.rotation.set(0,0,0); g.scale.set(1,1,1);
  g.name = 'chariot';

  // TOUS les repérages se font par index sur le groupe d'origine, AVANT la
  // moindre suppression dans le clone — sinon les index glissent et les noms
  // atterrissent sur le mauvais enfant.
  const mark = (obj, name) => {
    const i = V.group.children.indexOf(obj);
    if (i >= 0 && g.children[i]) g.children[i].name = name;
  };
  Object.entries(V.cargoGroups).forEach(([k, grp]) => mark(grp, 'cargo-' + k));
  V.wheels.forEach((w, n) => mark(w, 'wheel-' + n));
  mark(V.lampGlass, 'lamp');
  mark(V.lantern, 'lantern');
  mark(V.driver, 'driver');

  // Retire ce qui n'a pas de sens hors du jeu : halo au sol, anneau de glow,
  // panache d'échappement, et les sprites d'interface (la plaque « £ » du
  // flanc, qui flotte comme une vignette blanche une fois sortie du HUD —
  // c'est aussi la seule texture, donc le JSON n'embarque plus d'image).
  // Les index sont TOUS relevés sur le groupe d'origine, puis retirés en
  // ordre décroissant : aucun décalage possible.
  const dropIdx = new Set();
  [V.lampPool, V.glow, V.puff].forEach(o => {
    const i = V.group.children.indexOf(o); if (i >= 0) dropIdx.add(i);
  });
  V.group.children.forEach((o, i) => { if (o.isSprite) dropIdx.add(i); });
  [...dropIdx].sort((a, b) => b - a).forEach(i => g.remove(g.children[i]));

  const out = g.toJSON();
  const b = new T.Box3().setFromObject(g);
  return { json: out, box: { min:b.min.toArray(), max:b.max.toArray() },
           n: g.children.length };
});

const txt = JSON.stringify(json.json);
fs.writeFileSync(OUT, txt);
console.log('enfants :', json.n, 'bbox :', JSON.stringify(json.box));
console.log('taille :', (txt.length/1024).toFixed(1), 'Ko');
await browser.close();

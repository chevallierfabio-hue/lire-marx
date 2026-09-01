// tools/capture-jeu.mjs — CAPTURE les images du jeu pour la page /jeu
//
// Comme tools/export-chariot.mjs et tools/import-jeu.mjs, ce n'est PAS une
// étape de build : c'est un outil de dépôt qu'on relance à la main quand le
// jeu change d'allure, et dont on commite le résultat.
//
// Il ouvre jeu/jouer.html dans un Chrome piloté, lance une partie, laisse
// courir la cinématique d'ouverture (« La Veille du Capital » — le plan
// large qui montre le circuit comme un LIEU : la Banque en A, le Marché du
// travail en M, l'Usine en P), masque tout le décorum d'interface, et
// photographie la scène.
//
// Mode d'emploi :
//   node tools/capture-jeu.mjs              # écrit les images retenues
//   node tools/capture-jeu.mjs --planches   # écrit des candidats horodatés
//                                           # dans /tmp pour choisir l'instant
//
// Il sert le site lui-même (serveur éphémère, sans cache) et emprunte
// puppeteer-core au dépôt du jeu, qui l'a déjà en devDependency — le site
// n'a ni package.json ni node_modules, et n'en aura pas.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve(import.meta.dirname, '..');
const JEU  = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTDIR = path.join(SITE, 'assets/img/jeu');
const W = 1600, H = 900;

// Les instants retenus dans la cinématique, en secondes après le lancement
// de la partie. Choisis à la planche-contact : voir --planches.
// t=17 s : la cinématique vient de s'achever et le soleil se lève. Le chariot
// est au premier plan, lanterne allumée — le même que celui qui traverse
// l'accueil — et la route aligne derrière lui les stations du circuit : la
// Banque en A, les deux Marchés en M, l'Usine en P, l'Entrepôt en M′.
// C'est le seul instant où tout cela tient dans un cadre. Le changer sans
// retirer une nouvelle planche-contact ne donnera rien de bon.
const PLANS = [
  { at: 17, nom: 'circuit-plan-large' },
];
const CANDIDATS = [13, 15, 17, 19, 22, 26];

const die = (m) => { console.error('\n✗ ' + m + '\n'); process.exit(1); };
const planches = process.argv.includes('--planches');

if (!fs.existsSync(path.join(SITE, 'jeu/jouer.html')))
  die('jeu/jouer.html est absent — lancez d\'abord : node tools/import-jeu.mjs');
if (!fs.existsSync(CHROME)) die(`Chrome introuvable : ${CHROME}\n  Passez-le par CHROME=/chemin/vers/Chrome`);

const require = createRequire(path.join(JEU, 'package.json'));
let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch { die(`puppeteer-core introuvable dans ${JEU}\n  Lancez-y : npm install`); }

// ── Serveur éphémère, sans cache ─────────────────────────────────────────
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.hdr':'image/vnd.radiance', '.glb':'model/gltf-binary',
  '.wasm':'application/wasm', '.woff2':'font/woff2', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const f = path.join(SITE, rel);
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
                       'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

// ── Chrome ───────────────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle',
         '--enable-unsafe-swiftshader', `--window-size=${W},${H}`],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('  [erreur page]', e.message));

console.log(`→ ${ORIGIN}/jeu/jouer.html`);
await page.goto(`${ORIGIN}/jeu/jouer.html`, { waitUntil: 'networkidle0', timeout: 120000 });

// Le préchargement ferme le « gate » : on attend qu'il soit hors du champ.
await page.waitForFunction(() => {
  const g = document.getElementById('gate');
  return !g || getComputedStyle(g).display === 'none' || g.classList.contains('hidden');
}, { timeout: 120000 });
console.log('  scène construite');

// Masquer TOUT ce qui n'est pas le monde. La cinématique cache déjà le HUD
// et le tutoriel, mais seulement PENDANT qu'elle joue (body.mcinema-on) — et
// l'instant qu'on retient est juste après sa fin, quand le soleil se lève sur
// le circuit. On masque donc nous-mêmes, sans condition, et sans oublier le
// bouton de réglages qui vit en z-index 90 au-dessus de tout le reste.
await page.addStyleTag({ content: `
  .mcinema-letterbox, .mcinema-title, .mcinema-skip,
  .help, .log, .hud, .coach, #tutorial-coach, .prompt, .quest,
  .formation, .villebadge, .lev, .diagpanel, .panel, .crisisTag,
  .accueil, .upgrade { display: none !important; }
` });

// Une partie neuve dans le premier emplacement — c'est elle qui lance la
// cinématique d'ouverture.
const lance = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')]
    .find((e) => /nouvelle partie/i.test(e.textContent || ''));
  if (!b) return false; b.click(); return true;
});
if (!lance) die('Bouton « Nouvelle partie » introuvable — l\'écran d\'accueil du jeu a changé.');
console.log('  partie lancée, la cinématique court…');

fs.mkdirSync(OUTDIR, { recursive: true });
const t0 = Date.now();
const attendre = async (s) => {
  const reste = s * 1000 - (Date.now() - t0);
  if (reste > 0) await new Promise((r) => setTimeout(r, reste));
};

if (planches) {
  const dir = '/tmp/planches-jeu';
  fs.mkdirSync(dir, { recursive: true });
  for (const s of CANDIDATS) {
    await attendre(s);
    await page.screenshot({ path: path.join(dir, `t${String(s).padStart(2, '0')}.png`) });
    console.log(`  planche t=${s}s`);
  }
  console.log(`\n✓ Planche-contact dans ${dir}\n`);
} else {
  for (const p of PLANS) {
    await attendre(p.at);
    const png = path.join(OUTDIR, p.nom + '.png');
    await page.screenshot({ path: png });
    // .webp pour servir, .jpg en repli — le motif des images d'archive.
    execFileSync('cwebp', ['-q', '82', '-quiet', png, '-o', path.join(OUTDIR, p.nom + '.webp')]);
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
                          png, '--out', path.join(OUTDIR, p.nom + '.jpg')], { stdio: 'ignore' });
    fs.rmSync(png);
    const ko = (f) => (fs.statSync(path.join(OUTDIR, p.nom + f)).size / 1024).toFixed(0);
    console.log(`  ${p.nom}  (t=${p.at}s)  ${ko('.webp')} Ko webp · ${ko('.jpg')} Ko jpg`);
  }
  console.log(`\n✓ Images écrites dans assets/img/jeu/\n`);
}

await browser.close();
server.close();

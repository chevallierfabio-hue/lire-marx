// tools/capture-monde.mjs — L'IMAGE FIXE d'une page-monde du glossaire
//
// Comme capture-jeu.mjs : PAS une étape de build, un outil de dépôt qu'on
// relance à la main quand la scène change, et dont on commite le résultat.
//
// Sous 1100 px, en reduced-motion ou sans WebGL, la scène d'une notion ne
// joue pas : c'est cette image qu'on voit à sa place, avec sa légende
// (meta.monde.fixe.legende). L'outil ouvre /glossaire/<slug> dans un Chrome
// piloté, place la scène à la position de lecture choisie
// (meta.monde.fixe.g), la cadre en paysage 1200 × 750 et la photographie.
//
//   node tools/capture-monde.mjs fetichisme
//
// Sorties : glossaire/mondes/<slug>/monde.webp (servie) et monde.jpg
// (repli, et og:image). Puis : node tools/gen-seo.mjs, qui référence
// l'image dès qu'elle existe.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve(import.meta.dirname, '..');
const JEU  = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1200, H = 750;
const die = (m) => { console.error('\n✗ ' + m + '\n'); process.exit(1); };

const slug = process.argv[2];
if (!slug) die('Usage : node tools/capture-monde.mjs <slug>');
const dossier = path.join(SITE, 'glossaire/mondes', slug);
if (!fs.existsSync(path.join(dossier, 'monde.js'))) die(`${dossier}/monde.js est absent.`);
const meta = JSON.parse(fs.readFileSync(path.join(dossier, 'meta.json'), 'utf8'));
const fixe = (meta.monde && meta.monde.fixe) || {};
const G = typeof fixe.g === 'number' ? fixe.g : 0;
if (!fs.existsSync(CHROME)) die(`Chrome introuvable : ${CHROME}`);

const require = createRequire(path.join(JEU, 'package.json'));
let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch { die(`puppeteer-core introuvable dans ${JEU}`); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(SITE, p);
  if (!p.endsWith('/') && fs.existsSync(f + '.html')) f += '.html';
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle',
         '--enable-unsafe-swiftshader', `--window-size=1400,900`],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${ORIGIN}/glossaire/${slug}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => !!window.__ntMonde, { timeout: 20000 })
    .catch(() => die('La scène ne s\'est pas armée (pas de WebGL dans ce Chrome ?).'));
  await page.evaluate(async (g, w, h) => {
    const aside = document.querySelector('.nt-monde');
    aside.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:99999;margin:0;border:0;border-radius:0;aspect-ratio:auto`;
    aside.querySelectorAll('.nt-monde-cap,.nt-monde-src').forEach((e) => { e.style.display = 'none'; });
    const M = window.__ntMonde;
    M.monde.resize();
    M.set(g);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    for (let i = 0; i < 40; i++) M.monde.frame(0.05);   // la flamme se pose, l'étiquette se balance
    M.monde.render();
  }, G, W, H);
  const png = path.join(dossier, 'monde.png');
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: W, height: H } });
  execFileSync('cwebp', ['-q', '80', '-quiet', png, '-o', path.join(dossier, 'monde.webp')]);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', png, '--out', path.join(dossier, 'monde.jpg')], { stdio: 'ignore' });
  fs.unlinkSync(png);
  const ko = (f) => Math.round(fs.statSync(path.join(dossier, f)).size / 1024);
  console.log(`✓ ${slug} : monde.webp (${ko('monde.webp')} Ko), monde.jpg (${ko('monde.jpg')} Ko) — g = ${G}`);
} finally {
  await browser.close();
  server.close();
}

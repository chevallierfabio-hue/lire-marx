// tools/import-jeu.mjs — IMPORTE le jeu « Le Circuit du Capital » dans jeu/
//
// Ce script n'est PAS une étape de build du site : le site reste 100 %
// statique et Cloudflare Pages ne l'exécute jamais. C'est un outil de dépôt,
// comme tools/export-chariot.mjs et tools/gen-seo.mjs — on le lance à la
// main, on commite le résultat.
//
// Il construit le jeu dans son dépôt SÉPARÉ (~/Desktop/circuit-du-capital)
// avec VITE_BASE=/jeu/, puis dépose le résultat ici :
//
//   jeu/index.html   ← la page de présentation, ÉCRITE À LA MAIN.
//                      Ce script n'y touche jamais.
//   jeu/jouer.html   ← le jeu construit (dist/index.html, renommé).
//   jeu/assets/…     ← le bundle et les actifs (HDRI, GLB).
//   jeu/draco/…      ← le décodeur DRACO.
//   jeu/build.json   ← quelle version du jeu est en ligne.
//
// Mode d'emploi :
//   node tools/import-jeu.mjs             # construit et importe
//   node tools/import-jeu.mjs --no-build  # importe un dist/ déjà construit
//
// DEUX GREFFES sont faites sur jouer.html au passage — un `noindex` et un
// lien de retour vers le site. Elles n'ont de sens que sur liremarx.com et
// n'ont donc rien à faire dans le dépôt du jeu ; voir leur commentaire.
//
// DEUX FICHIERS DU BUILD NE SONT PAS SERVIS, volontairement :
//   • les .map (4 Mo) — on ne publie pas les sources d'un bundle minifié ;
//     la référence `sourceMappingURL` est retirée du JS pour ne pas laisser
//     un 404 s'ouvrir dès que quelqu'un ouvre les outils de développement.
//   • draco_encoder.js (932 Ko) — il ENCODE ; le runtime ne fait que décoder.
//
// POURQUOI VITE_BASE : le jeu chargeait ses actifs par chemins absolus
// ('/draco/', '/assets/hdri/…'). Servi sous /jeu/, il serait allé les
// chercher à la racine du domaine. Le dépôt du jeu les fait passer par
// import.meta.env.BASE_URL (branche `servir-sous-un-chemin`) — sans un jeu
// à jour, l'import échoue au contrôle final plutôt que de publier un jeu
// qui ne charge pas.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const JEU  = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
const SITE = path.resolve(import.meta.dirname, '..');
const OUT  = path.join(SITE, 'jeu');
const BASE = '/jeu/';

const build = !process.argv.includes('--no-build');
const die = (m) => { console.error('\n✗ ' + m + '\n'); process.exit(1); };
const kb  = (n) => (n / 1024).toFixed(0).padStart(5) + ' Ko';

if (!fs.existsSync(path.join(JEU, 'package.json')))
  die(`Dépôt du jeu introuvable : ${JEU}\n  Passez-le par CIRCUIT_REPO=/chemin/vers/circuit-du-capital`);

// ── 1. Construire ────────────────────────────────────────────────────────
if (build) {
  console.log(`→ Construction du jeu (VITE_BASE=${BASE})…`);
  try {
    execFileSync('npm', ['run', 'build'], {
      cwd: JEU, stdio: 'inherit', env: { ...process.env, VITE_BASE: BASE },
    });
  } catch { die('La construction du jeu a échoué — rien n\'a été importé.'); }
}

const DIST = path.join(JEU, 'dist');
if (!fs.existsSync(path.join(DIST, 'index.html')))
  die(`Pas de dist/index.html dans ${JEU}. Lancez sans --no-build.`);

// ── 2. Faire place nette (SANS toucher à la page de présentation) ────────
fs.mkdirSync(OUT, { recursive: true });
for (const p of ['jouer.html', 'assets', 'draco', 'build.json'])
  fs.rmSync(path.join(OUT, p), { recursive: true, force: true });

// ── 3. Copier, en écartant ce qui ne doit pas être servi ─────────────────
const SKIP = (rel) => rel.endsWith('.map') || path.basename(rel) === 'draco_encoder.js';
const copied = [];
(function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { walk(path.join(dir, e.name), r); continue; }
    if (r === 'index.html' || SKIP(r)) continue;
    const dst = path.join(OUT, r);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(dir, e.name), dst);
    copied.push(r);
  }
})(DIST);

// dist/index.html devient jouer.html — /jeu/ est pris par la présentation.
// Deux greffes au passage, qui n'ont de sens que SUR CE SITE et n'ont donc
// rien à faire dans le dépôt du jeu (où elles pollueraient un déploiement
// autonome) :
//
//  1. `noindex` — la partie est une application, pas un document. Elle n'a
//     aucun contenu à indexer, et c'est /jeu qui porte le texte. `follow`
//     parce que le lien de retour, lui, vaut d'être suivi. Même raisonnement
//     que pour le carnet et la messagerie (voir CLAUDE.md).
//
//  2. Le RETOUR vers le site. Le jeu occupe tout l'écran, sans la coquille :
//     branché sur liremarx.com, on y entrerait sans porte de sortie. Le
//     bouton se pose en bas à droite, le seul coin que le jeu laisse libre
//     (à gauche le tableau de bord et le journal, à droite en haut l'aide,
//     la formation sociale et l'objectif), et il emprunte l'habit du jeu —
//     papier, encre, ombre portée — parce qu'il se pose sur SON interface et
//     non sur celle du site. Il s'efface pendant la cinématique, comme tout
//     le reste (body.mcinema-on).
const RETOUR = `
<style>
  .lm-retour{position:fixed;right:14px;bottom:14px;z-index:11;
    font-family:"Zilla Slab",serif;font-size:12px;letter-spacing:.5px;
    text-transform:uppercase;text-decoration:none;
    border:1.5px solid #241f17;background:rgba(233,221,198,.92);color:#241f17;
    box-shadow:3px 4px 0 rgba(36,31,23,.25);padding:7px 12px;
    transition:background .15s,color .15s;}
  .lm-retour:hover{background:#241f17;color:#e9ddc6;}
  .lm-retour:focus-visible{outline:2px solid #8a2c1d;outline-offset:2px;}
  body.mcinema-on .lm-retour{opacity:0;pointer-events:none;transition:opacity .5s;}
</style>
<a class="lm-retour" href="/jeu">&#8592;&nbsp;Lire Marx</a>
`;
let jouer = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!/<\/head>/i.test(jouer) || !/<\/body>/i.test(jouer))
  die('jouer.html n\'a pas de </head> ou de </body> — impossible d\'y greffer\n'
    + '  le noindex et le lien de retour. Le build du jeu a changé de forme.');
jouer = jouer
  .replace(/<\/head>/i,
    '<meta name="robots" content="noindex, follow">\n</head>')
  .replace(/<\/body>/i, RETOUR + '</body>');
fs.writeFileSync(path.join(OUT, 'jouer.html'), jouer);
copied.push('jouer.html');

// Le .map n'est pas publié : sa référence non plus, sinon les outils de
// développement ouvrent un 404 à chaque visite.
for (const r of copied.filter((r) => r.endsWith('.js'))) {
  const f = path.join(OUT, r);
  const s = fs.readFileSync(f, 'utf8');
  const n = s.replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
  if (n !== s) fs.writeFileSync(f, n);
}

// ── 4. Contrôles — on ne publie pas un jeu qui ne chargerait pas ─────────
const html = fs.readFileSync(path.join(OUT, 'jouer.html'), 'utf8');
const script = html.match(/<script[^>]+src="([^"]+)"/);
if (!script) die('jouer.html ne référence aucun script — build inattendu.');
if (!script[1].startsWith(BASE))
  die(`jouer.html référence « ${script[1] }» au lieu de ${BASE}… — VITE_BASE n'a pas été pris en compte.`);
if (!fs.existsSync(path.join(SITE, script[1].replace(/^\//, ''))))
  die(`Le script référencé (${script[1]}) n'a pas été copié.`);

const bundle = fs.readFileSync(path.join(OUT, script[1].replace(/^\/jeu\//, '')), 'utf8');
if (!bundle.includes(`"${BASE}"`))
  die('La base ' + BASE + ' n\'apparaît pas dans le bundle : le dépôt du jeu\n'
    + '  n\'a pas la correction des chemins d\'actifs (import.meta.env.BASE_URL).\n'
    + '  Voir la branche `servir-sous-un-chemin` du dépôt du jeu.');
for (const need of ['draco/draco_decoder.js', 'assets/hdri', 'assets/models'])
  if (!fs.existsSync(path.join(OUT, need.split('/')[0]))) die(`Actif manquant : jeu/${need}`);
if (!/noindex/.test(html) || !/class="lm-retour"/.test(html))
  die('Les greffes (noindex, lien de retour) ne sont pas dans jouer.html.');
if (!fs.existsSync(path.join(OUT, 'index.html')))
  console.warn('  ⚠ jeu/index.html (la page de présentation) est absent —\n'
    + '    le lien de retour du jeu pointera vers du vide.');

// ── 5. Dire ce qui est en ligne ──────────────────────────────────────────
const git = (a) => { try { return execFileSync('git', a, { cwd: JEU }).toString().trim(); } catch { return null; } };
const pkg = JSON.parse(fs.readFileSync(path.join(JEU, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'build.json'), JSON.stringify({
  _: 'Généré par tools/import-jeu.mjs — ne pas éditer à la main.',
  version: pkg.version,
  three: pkg.dependencies?.three,
  commit: git(['rev-parse', '--short', 'HEAD']),
  branche: git(['rev-parse', '--abbrev-ref', 'HEAD']),
  importe: new Date().toISOString().slice(0, 10),
  base: BASE,
}, null, 2) + '\n');

const total = copied.reduce((n, r) => n + fs.statSync(path.join(OUT, r)).size, 0);
console.log('\n→ Importé dans jeu/ :');
for (const r of copied.sort()) console.log('  ' + kb(fs.statSync(path.join(OUT, r)).size) + '  ' + r);
console.log('  ' + '─'.repeat(30) + '\n  ' + kb(total) + '  au total\n');
console.log(`✓ Jeu ${pkg.version} (${git(['rev-parse', '--short', 'HEAD'])}) servi sous ${BASE}jouer\n`);

#!/usr/bin/env node
/* gen-seo.mjs — régénère les données structurées Book et le sitemap.
 *
 * MODE D'EMPLOI :   node tools/gen-seo.mjs        (depuis la racine du dépôt)
 *                   node tools/gen-seo.mjs --check  (ne récrit rien, sort 1 si périmé)
 *
 * Ce script n'est PAS une étape de build — le site reste 100 % statique et
 * Cloudflare Pages ne l'exécute jamais. C'est un outil de dépôt, comme
 * tools/export-chariot.mjs : on le lance à la main quand la source change,
 * et on commite le résultat.
 *
 * SOURCE UNIQUE : oeuvres/bibliotheque.json. Le titre, la description, les
 * concepts et le chemin d'une œuvre ne sont JAMAIS recopiés ici — ils sont
 * lus. Seuls les faits d'édition que bibliotheque.json ne porte pas vivent
 * dans la table EDITION ci-dessous, et chacun est annoté de l'endroit où il
 * est VISIBLE dans la page : un JSON-LD ne doit affirmer que ce que le
 * lecteur peut vérifier de ses yeux.
 *
 * LES URL N'ONT PAS D'EXTENSION. Cloudflare Pages sert des URL propres :
 * /oeuvres/capital-1.html répond 308 vers /oeuvres/capital-1. Une canonique
 * en .html désigne donc une page qui redirige. Voir CLAUDE.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ORIGIN = 'https://liremarx.com';
const BIBLIO = 'oeuvres/bibliotheque.json';

/* ------------------------------------------------------------------ *
 * Faits d'édition absents de bibliotheque.json.
 * Une clé par œuvre DISPONIBLE. Chaque valeur dit où elle se vérifie.
 * ------------------------------------------------------------------ */
const EDITION = {
  'capital-1': {
    // « Karl Marx · 1867 · traduction Joseph Roy revue par l'auteur ·
    //   domaine public » — <p class="work-meta"> de oeuvres/capital-1.html
    datePublished: '1867',
    translator: 'Joseph Roy',
    bookEdition: "Traduction française de Joseph Roy (1872-1875), revue par Karl Marx",
    // La traduction Roy est de 1872-1875 et son traducteur est mort en 1900 :
    // elle est bien dans le domaine public. On peut donc l'affirmer.
    license: 'https://creativecommons.org/publicdomain/mark/1.0/',
    translationOfWork: {
      '@type': 'Book',
      name: 'Das Kapital. Kritik der politischen Ökonomie. Erster Band',
      inLanguage: 'de',
      datePublished: '1867'
    },
    // loadSection() appelle fr.wikisource.org — c'est la source réelle du
    // texte affiché, pas une référence de politesse.
    source: { name: 'Le Capital sur Wikisource', url: 'https://fr.wikisource.org/wiki/Le_Capital' }
  },

  'manuscrits-1844': {
    // « Karl Marx · écrits en 1844, publiés en 1932 · traduction
    //   J.-M. Palmier · domaine public » — <p class="work-meta"> de
    //   oeuvres/manuscrits-1844.html
    dateCreated: '1844',
    datePublished: '1932',
    // Le nom est laissé tel que la page l'imprime. Ne pas le « compléter »
    // en Jean-Michel Palmier : le schéma ne doit rien affirmer de plus que
    // ce qui est écrit à l'écran.
    translator: 'J.-M. Palmier',
    alternateName: 'Manuscrits économico-philosophiques de 1844',
    // PAS de license ici, DÉLIBÉRÉMENT. La page affiche « domaine public »,
    // mais une traduction française du XXe siècle ne l'est pas
    // automatiquement, et un license: en JSON-LD est une affirmation
    // juridique lisible par machine. On préfère le silence à une donnée
    // structurée invérifiable. À rouvrir si le statut de la traduction est
    // établi. (isAccessibleForFree reste vrai : la page est bien gratuite.)
    source: { name: 'Manuscrits de 1844 — Marxists Internet Archive',
              url: 'https://www.marxists.org/francais/marx/works/1844/00/km18440000/' }
  }
};

/* Pages « de site » qui ne sont pas des œuvres. */
const SITE_PAGES = [
  { file: 'index.html',                 url: '/',                       priority: '1.0', changefreq: 'weekly' },
  { file: 'oeuvres/bibliotheque.html',  url: '/oeuvres/bibliotheque',   priority: '0.8', changefreq: 'weekly' },
  { file: 'oeuvres/place-publique.html',url: '/oeuvres/place-publique', priority: '0.7', changefreq: 'weekly' }
];

/* HORS SITEMAP, et c'est un choix motivé — voir CLAUDE.md :
 *   oeuvres/carnet.html   — le carnet privé du lecteur
 *   oeuvres/messages.html — la messagerie privée
 * Déconnecté, ces deux pages n'ont aucun contenu à indexer : elles
 * n'affichent qu'une invitation à se connecter. Les annoncer dans un
 * sitemap, c'est demander à un moteur de venir chercher une page vide.
 * Elles restent crawlables (robots.txt Allow: /) et portent chacune leur
 * canonique — on ne les cache pas, on ne les met simplement pas en avant.
 *   oeuvres/index.html    — redirection 301 vers / (voir _redirects)
 */

const clean = p => '/' + p.replace(/\.html$/, '').replace(/^\/+/, '');

function lastmod(file) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file],
                           { encoding: 'utf8' }).trim();
    if (d) return d;
  } catch { /* dépôt absent : on retombe plus bas */ }
  return new Date().toISOString().slice(0, 10);
}

const biblio = JSON.parse(readFileSync(BIBLIO, 'utf8'));
const available = biblio.works.filter(w => w.status === 'available');

/* ---------------------------- Book ---------------------------- */
function bookFor(w) {
  const e = EDITION[w.id];
  if (!e) throw new Error(
    `Œuvre disponible sans faits d'édition : ${w.id}. Ajoutez-la à EDITION ` +
    `(et vérifiez que chaque fait est visible dans la page).`);

  const book = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: w.title,
    ...(e.alternateName ? { alternateName: e.alternateName } : {}),
    author: { '@type': 'Person', name: w.author,
              sameAs: 'https://www.wikidata.org/wiki/Q9061' },
    ...(e.translator ? { translator: { '@type': 'Person', name: e.translator } } : {}),
    ...(e.bookEdition ? { bookEdition: e.bookEdition } : {}),
    inLanguage: 'fr',
    ...(e.dateCreated ? { dateCreated: e.dateCreated } : {}),
    datePublished: e.datePublished,
    ...(e.translationOfWork ? { translationOfWork: e.translationOfWork } : {}),
    url: ORIGIN + clean(w.path),
    description: w.description,
    about: w.concepts,
    isAccessibleForFree: true,
    ...(e.license ? { license: e.license } : {}),
    ...(e.source ? { isBasedOn: { '@type': 'WebPage', name: e.source.name, url: e.source.url } } : {})
  };
  return book;
}

const HEAD = '<!-- Book : DÉRIVÉ de oeuvres/bibliotheque.json par tools/gen-seo.mjs.\n' +
             '     Ne pas éditer à la main — corriger la source, puis regénérer :\n' +
             '       node tools/gen-seo.mjs\n' +
             '     Chaque champ doit rester vérifiable dans la page elle-même. -->';
const OPEN = '<script type="application/ld+json">';
const CLOSE = '</script>';

let changed = [], stale = [];
const check = process.argv.includes('--check');

function writeIfNeeded(file, next, label) {
  const cur = readFileSync(file, 'utf8');
  if (cur === next) return;
  if (check) { stale.push(label); return; }
  writeFileSync(file, next);
  changed.push(label);
}

for (const w of available) {
  const file = w.path;
  const src = readFileSync(file, 'utf8');
  const json = JSON.stringify(bookFor(w), null, 2);
  const block = `${HEAD}\n${OPEN}\n${json}\n${CLOSE}`;

  // Remplace le bloc ld+json existant (avec son éventuel commentaire de tête).
  const re = new RegExp(
    '(?:<!--[^]*?-->\\s*)?<script type="application/ld\\+json">[^]*?</script>');
  if (!re.test(src)) throw new Error(`Aucun bloc JSON-LD trouvé dans ${file}`);
  writeIfNeeded(file, src.replace(re, () => block), file);
}

/* --------------------------- sitemap --------------------------- */
const entries = [
  ...SITE_PAGES.map(p => ({ ...p, loc: ORIGIN + p.url })),
  ...available.map(w => ({
    file: w.path, loc: ORIGIN + clean(w.path),
    priority: '0.9', changefreq: 'monthly', title: w.title
  }))
];

const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<!-- DÉRIVÉ par tools/gen-seo.mjs depuis oeuvres/bibliotheque.json.
     Ne pas éditer à la main : \`node tools/gen-seo.mjs\`.
     Les URL sont SANS extension — Cloudflare Pages sert des URL propres et
     répond 308 sur les .html. Le carnet et la messagerie sont volontairement
     absents : déconnecté, ils n'ont aucun contenu à indexer. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${lastmod(e.file)}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeIfNeeded('sitemap.xml', xml, 'sitemap.xml');

if (check) {
  if (stale.length) {
    console.error('PÉRIMÉ : ' + stale.join(', '));
    process.exit(1);
  }
  console.log('À jour : ' + [...available.map(w => w.path), 'sitemap.xml'].join(', '));
} else {
  console.log(changed.length ? 'Récrit : ' + changed.join(', ') : 'Rien à faire.');
}

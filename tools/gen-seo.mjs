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
  { file: 'oeuvres/place-publique.html',url: '/oeuvres/place-publique', priority: '0.7', changefreq: 'weekly' },
  /* /jeu/ — la page qui présente « Le circuit du capital ». C'est ELLE qui
     entre au sitemap, pas /jeu/jouer : la partie est une application sans
     contenu à indexer, et elle porte un noindex posé par
     tools/import-jeu.mjs.
     LE SLASH FINAL EST OBLIGATOIRE, et c'est le PENDANT de la règle
     « pas d'extension » : la présentation du jeu est l'index d'un DOSSIER,
     et Cloudflare Pages répond 308 de /jeu vers /jeu/ exactement comme il
     répond 308 de /page.html vers /page. Mesuré en production le jour de la
     mise en ligne : canonique, og:url et sitemap désignaient tous les trois
     une URL qui redirige — le défaut même que la mission seo-urls-reelles
     avait corrigé, reproduit en miroir. Ne pas « nettoyer » ce slash. */
  { file: 'jeu/index.html',             url: '/jeu/',                   priority: '0.8', changefreq: 'monthly' }
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
  // Le commentaire de tête ne doit PAS pouvoir traverser d'autres commentaires :
  // avec un simple `[^]*?`, un commentaire quelconque situé PLUS HAUT dans le
  // <head> devient un point de départ valide, la paresse rallonge la capture
  // jusqu'au commentaire qui précède vraiment le script, et tout ce qui est
  // entre les deux est effacé. Vécu : l'ajout des balises de favicon a fait
  // disparaître 779 lignes de capital-1.html. D'où `(?:(?!-->)[^])*?`.
  const re = new RegExp(
    '(?:<!--(?:(?!-->)[^])*?-->\\s*)?<script type="application/ld\\+json">[^]*?</script>');
  if (!re.test(src)) throw new Error(`Aucun bloc JSON-LD trouvé dans ${file}`);
  writeIfNeeded(file, src.replace(re, () => block), file);
}

/* ------------------- Le registre de la bibliothèque -------------------- *
 * oeuvres/bibliotheque.html sert 49 mots et pas un titre d'œuvre : son
 * registre à plat (#bxFlat) — celui que CLAUDE.md décrit comme « la version
 * des lecteurs d'écran et des robots » — est en réalité peuplé par JS.
 * Google exécute le JS et finit par le voir ; les crawlers des moteurs de
 * réponse, non. On pré-rend donc le MÊME balisage que renderFlat(), que le
 * JS réécrira à l'identique. Toute modification de renderFlat() doit être
 * répercutée ici, et inversement — c'est le prix d'un rendu à deux endroits,
 * et la raison du test d'identité dans la mission.
 * ---------------------------------------------------------------------- */
const esc = v => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* href() de la page, après retrait de l'extension : Cloudflare sert des URL
 * propres, un lien interne en .html part en 308 pour rien. */
const hrefOf = w => {
  const p = String(w.path || '').replace(/\.html$/, '');
  return p && p[0] !== '/' ? '/' + p : p;
};

function flatRegister(biblio) {
  const works = (biblio.works || []).filter(w => w && w.id);
  const groups = biblio.readingGroups || [];
  const byId = Object.fromEntries(works.map(w => [w.id, w]));
  const titleOf = id => (byId[id] ? byId[id].title : id);
  const rd = w => w.reading || {};
  const isOk = w => w.status === 'available';

  const relLine = w => {
    const r = rd(w), parts = [];
    const dot = ids => ids.map(titleOf).join(' · ');
    if (r.after && r.after.length)   parts.push('<b>À lire après</b> ' + esc(dot(r.after)));
    if (r.primer && r.primer.length) parts.push('<b>Préparé par</b> ' + esc(dot(r.primer)));
    return parts.length ? '<p class="fl-rel">' + parts.join('<br>') + '</p>' : '';
  };

  const count = '<b>' + works.length + '</b> œuvres · <b>' +
                works.filter(isOk).length + '</b> lisibles aujourd\'hui';

  const html = groups.map(gr => {
    const list = works.filter(w => rd(w).group === gr.id)
                      .sort((a, b) => a.year - b.year);
    if (!list.length) return '';
    return '<section class="fl-group">' +
      '<h2 class="fl-gh">' + esc(gr.label) + '</h2>' +
      '<p class="fl-gn">' + esc(gr.note) + '</p>' +
      '<div class="fl-list">' + list.map(w => {
        const ok = isOk(w);
        return '<article class="fl-work">' +
          '<span class="fl-y">' + esc(w.year) + '</span>' +
          '<div class="fl-col">' +
            '<div class="fl-head">' +
              '<h3 class="fl-t">' + esc(w.title) + '</h3>' +
              '<span class="fl-status ' + (ok ? 'ok">Disponible' : 'soon">En préparation') + '</span>' +
            '</div>' +
            (rd(w).entry && ok
              ? '<p class="fl-entry">Porte d\'entrée — ' + esc(rd(w).entry) + '</p>' : '') +
            '<p class="fl-d">' + esc(w.description) + '</p>' +
            '<div class="fl-cx">' + (w.concepts || []).map(c => '<span>' + esc(c) + '</span>').join('') + '</div>' +
            relLine(w) +
            '<details class="fl-more"><summary>Comment le lire</summary>' +
              '<div class="fl-more-in">' +
                '<p class="fl-guide">' + esc(w.readingGuide) + '</p>' +
                '<p class="fl-source"><b>D\'où vient le texte —</b> ' + esc(w.sourceNote) + '</p>' +
              '</div>' +
            '</details>' +
            (ok ? '<a class="fl-open" href="' + esc(hrefOf(w)) + '">Ouvrir l\'atelier →</a>' : '') +
          '</div>' +
        '</article>';
      }).join('') + '</div>' +
    '</section>';
  }).join('');

  return { count, html };
}

{
  const file = 'oeuvres/bibliotheque.html';
  const src = readFileSync(file, 'utf8');
  const { count, html } = flatRegister(biblio);

  const note = '<!-- DÉRIVÉ de oeuvres/bibliotheque.json par tools/gen-seo.mjs — même\n' +
               '     balisage que renderFlat() plus bas, que le JS réécrit à l\'identique.\n' +
               '     Ne pas éditer à la main : node tools/gen-seo.mjs -->';

  const reCount  = /<div class="fl-count" id="flCount">[^]*?<\/div>/;
  const reGroups = /<div id="flGroups"[^>]*>[^]*?<\/div>\s*<\/main>/;
  // On teste le POINT D'INSERTION, pas le changement : quand le dépôt est
  // déjà à jour, le remplacement est un no-op légitime.
  for (const [re, what] of [[reCount, '#flCount'], [reGroups, '#flGroups']]) {
    if (!re.test(src)) throw new Error(`registre : ${what} introuvable dans ${file}`);
  }

  const next = src
    .replace(reCount,  () => `<div class="fl-count" id="flCount">${count}</div>`)
    .replace(reGroups, () => `<div id="flGroups" data-prerendu>\n${note}\n${html}\n</div>\n</main>`);
  writeIfNeeded(file, next, file + ' (registre)');
}

/* ---------------------------- FAQPage ---------------------------- */
/* Le BALISAGE de #questions est la source, ce bloc en est DÉRIVÉ — la règle
 * était déjà écrite dans CLAUDE.md, mais elle était tenue par un script
 * jetable, et les deux avaient divergé une fois : une retouche faite au
 * `replace` sur le fichier entier avait frappé la COPIE JSON-LD, qui est plus
 * haut dans le document. Elle vit ici désormais, et `--check` la surveille.
 *
 * Une donnée structurée qui promet une réponse absente de la page est un
 * mensonge, et Google la sanctionne. Rappel : il ne montre PLUS de résultat
 * enrichi FAQ depuis août 2023 hors sites gouvernementaux et de santé — ce
 * balisage sert la lecture machine, pas un snippet. Ne rien promettre d'autre.
 */
const ENTITES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };

/* L'espace se pose aux frontières de BLOC, et seulement là. Sans elle, deux
 * paragraphes se recollent (« …dans sa préface.Sur ce site… ») ; posée à
 * TOUTE frontière de balise, elle sépare l'italique de sa ponctuation
 * (« Le Capital , Livre I »). C'est la nuance que la leçon déjà écrite pour
 * headText() ne disait pas : les éléments EN LIGNE ne prennent pas d'espace. */
const BLOCS = /<\/(?:p|div|li|ul|ol|h[1-6]|section)\s*>|<br\s*\/?>/gi;

function texteNu(html) {
  return html
    .replace(BLOCS, ' ')                                      // fin de bloc = une espace
    .replace(/<[^>]+>/g, '')                                  // le reste du balisage tombe
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, e) => ENTITES[e])
    .replace(/\s+/g, ' ')                                     // espaces recomposés
    .trim();
}

function questionsDe(src) {
  const i = src.indexOf('id="questions"');
  if (i < 0) throw new Error('Section #questions introuvable dans index.html.');
  const fin = src.indexOf('</section>', i);
  const zone = src.slice(i, fin);
  const out = [];
  // Un dépliant = <summary> … <span class="hs-faq-q">Q</span> … <div class="hs-faq-a">R</div>
  const re = /<span class="hs-faq-q">([\s\S]*?)<\/span>[\s\S]*?<div class="hs-faq-a">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(zone))) {
    const q = texteNu(m[1]), a = texteNu(m[2]);
    if (!q || !a) throw new Error(`Dépliant vide dans #questions : « ${q || a} »`);
    out.push({ '@type': 'Question', name: q,
               acceptedAnswer: { '@type': 'Answer', text: a } });
  }
  if (out.length < 2) throw new Error(`Seulement ${out.length} question(s) relevée(s) — le gabarit du balisage a changé.`);
  return out;
}

{
  const file = 'index.html';
  const src = readFileSync(file, 'utf8');
  const json = JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questionsDe(src) },
    null, 2);

  /* On repère le bloc par son CONTENU (« FAQPage ») puis on remonte à sa
   * balise ouvrante par index — pas de motif qui puisse courir au-delà, le
   * piège qui avait mangé 779 lignes de capital-1.html. */
  const k = src.indexOf('"@type": "FAQPage"');
  if (k < 0) throw new Error('Bloc FAQPage introuvable dans index.html.');
  const deb = src.lastIndexOf(OPEN, k);
  const f   = src.indexOf(CLOSE, k);
  if (deb < 0 || f < 0) throw new Error('Bloc FAQPage mal délimité.');
  writeIfNeeded(file, src.slice(0, deb + OPEN.length) + '\n' + json + '\n' + src.slice(f),
                file + ' (FAQPage)');
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
  console.log('À jour : ' + [...available.map(w => w.path),
    'oeuvres/bibliotheque.html (registre)', 'index.html (FAQPage)',
    'sitemap.xml'].join(', '));
} else {
  console.log(changed.length ? 'Récrit : ' + changed.join(', ') : 'Rien à faire.');
}

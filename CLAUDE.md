# CLAUDE.md — mémoire de projet « Lire Marx »

Mémoire persistante destinée à Claude Code quand il travaille sur ce dépôt.
Objectif : éviter les contresens d'architecture et garder un comportement
cohérent d'une session à l'autre.

## Architecture réelle

- **Site 100 % statique.** HTML + CSS + JS vanille à la racine du dépôt.
  Aucun framework, aucune compilation, aucune étape de build, aucun
  package.json à exécuter.
- **Hébergement : Cloudflare Pages**, branchement direct sur la branche
  `main` du dépôt GitHub. *Framework preset = None ; Build command = vide ;
  Build output directory = `/`*. Tout commit sur `main` redéploie.
- **Backend (optionnel) : Supabase** — Auth (e-mail + mot de passe),
  annotations privées, forum public (`public_notes`), modération
  (`moderators`, `reports`), RGPD. Schéma idempotent dans
  `supabase/schema.sql`. Clés publiques dans `config.js`. **Jamais** de clé
  `service_role` côté client.

## Motif « œuvre » = page + dossier + CSS propre

Chaque œuvre du corpus suit exactement le même motif :

```
oeuvres/<id>.html              # page d'atelier (présentation, plan, liseuse, concepts…)
oeuvres/<id>.css               # styles propres au livre (optionnel)
oeuvres/<id>/manifest.json     # métadonnées + découpage
oeuvres/<id>/textes/           # textes locaux servis à la liseuse
```

Les œuvres sont **de même niveau** dans l'arborescence. Aucune n'est « la »
page principale. Actuellement disponibles : `capital-1` et `manuscrits-1844`.

L'accueil du site est `oeuvres/index.html` (la bibliothèque), pilotée par
`oeuvres/bibliotheque.json` — **source centrale unique** de la liste des
œuvres. Ne pas dupliquer cette liste ailleurs ; passer une œuvre en
`available` seulement quand sa page fonctionne réellement.

À côté de la bibliothèque, deux autres pages « de site » (pas des
œuvres) partagent le shell :

- `oeuvres/bibliotheque.html` — la page dédiée du corpus (cible du clic
  sidebar « Bibliothèque »). Voir « La page Bibliothèque » plus bas.

- `oeuvres/place-publique.html` — LE FORUM des lecteurs (clic sidebar
  « Place publique » sur toutes les pages) : discussions, réponses en
  fil, soutiens — voir « La page Place publique » plus bas. L'aperçu
  des 6 dernières notes est aussi monté dans la colonne droite de
  `oeuvres/index.html` (`SHELL.commune.mount(#placeCommuneFlux,
  {limit:6, compact:true})`) — avec un lien « Voir toutes les notes → »
  qui pointe vers `place-publique.html`.

## Direction artistique — bascule « sombre-chaude » (août 2026)

**Historique.** Une première refonte « Rouge Internationale » (fond clair
`#F7F5F0`, rouge drapeau, Inter/Fraunces) a été appliquée à tout le site
entre juin et août 2026. Le propriétaire a ensuite tranché pour une DA
**sombre-chaude** — brun-nuit façon scène à la bougie, accents rouge + or,
Fraunces conservé pour les titres. **`/index.html` (l'accueil) est la
première page migrée** (voir « Accueil animé » ci-dessous). Les autres
pages (Capital, Manuscrits, Place publique, shell) sont **encore en clair**
et seront basculées dans des missions dédiées ; en attendant, une page
retouchée s'aligne sur la nouvelle palette.

**Palette sombre-chaude (tokens CSS `:root`)** — telle qu'appliquée sur
l'accueil :
```
--bg:      #15100b   /* fond principal, brun-nuit */
--surface: #1e1710   /* fond de carte / bandeau */
--text:    #f3e9d4   /* texte principal, crème chaude */
--muted:   #b7a888   /* texte secondaire / métadonnées */
--accent:  #d5402f   /* rouge drapeau, relevé pour le fond sombre */
--gold:    #d8ad4c   /* accent secondaire — la chaleur de la bougie */
--border:  rgba(243,233,212,.13)
```
Sur `/index.html`, le `:root` redéfinit aussi les variables du shell
(`--paper`, `--card`, `--ink`, `--line`…) pour que topbar/sidebar/modales
suivent le thème — **uniquement sur cette page**.

**Typographies** (inchangé) : Fraunces (900 / 500 italique) pour les titres
**uniquement** ; Inter (400/500/600) pour tout le reste. Ne jamais
réintroduire de serif ornementale/gothique dans le corps ou la navigation.

**Composants récurrents** : bouton pilule plein (fond `--text`, texte
`--bg`, `border-radius: 100px`), bouton pilule outline (`border:
1px solid var(--border)`), carte arrondie (`border-radius: 16-18px`,
fond `--surface`), badge pilule (fond `--accent` à 8% d'opacité, texte
`--accent`), halo radial discret en fond de hero/bandeau
(`radial-gradient` de `--accent` à faible opacité, jamais dominant).

**Photographie d'archive** : portraits/scènes XIXe en traitement duotone
(désaturation + léger calque `--accent` ou `--text`), toujours avec une
légende overlay discrète en bas de l'image (source, date, mention de
licence si CC BY-SA). Fichiers dans `assets/img/archive/`. Images déjà
en place : `marx-portrait.jpg` (Mayall 1875, domaine public),
`marx-jeune.jpg` (période parisienne, domaine public — utilisée pour
les Manuscrits de 1844), `das-kapital-titre-1867.jpg` (page de titre
originale, Zentralbibliothek Zürich — a remplacé l'ancienne
`capital-1867.jpg`), `manufacture.jpg`, `filature.jpg`,
`sortie-usine.jpg`, `halles-paris.jpg` (à vérifier : licence à
confirmer avant usage définitif).

**`manuscrit-ideologie-1846.webp` / `.jpg`** — page du manuscrit de
*L'Idéologie allemande* (déc. 1845 – avr. 1846) : l'écriture de Marx à
gauche, les profils griffonnés par Engels à droite. **C'est l'image du
héros de l'accueil**, à la place du portrait Mayall — qui disait le
contraire du site (l'icône barbue plutôt que le texte) et était le seul
élément hors du vocabulaire matériel de la page. Source : fonds Karl
Marx-Friedrich Engels de l'IISG Amsterdam, cote A.11 p.23, via Wikimedia
Commons (`File:IISG. Karl Marx-Friedrich Engels Papers. A.11. P.23.jpg`),
**Public Domain Mark 1.0**. Original 2437×3864 ; recadré en 4/5 sur le haut
de la page (crop 2290×2862 à partir de +70,+40, pour éliminer le montage
gris du scan et le bord bas déchiré), réduit à 900×1125. **Traitement
propre** (`.hs-img-ms`) et non le duotone des photographies : le duotone
rouge, pensé pour du noir et blanc, virait ce papier chaud au mauve. Le
portrait Mayall reste utilisé par `oeuvres/place-publique.html` — ne pas
supprimer ses fichiers.

**Bug récurrent à surveiller** : plusieurs onglets (Lire Le Capital /
Atelier / Ressources, et probablement leurs équivalents sur
`manuscrits-1844`) ont eu un bug où le contenu de l'onglet actif par
défaut ne s'affichait qu'après un clic manuel sur l'onglet, jamais au
chargement direct de la page. Cause : la fonction de rendu du contenu
d'onglet n'était appelée que dans le handler `click`, jamais au
chargement initial pour l'onglet par défaut. **Toute nouvelle logique
d'onglet doit appeler explicitement le rendu de l'onglet actif au
chargement**, pas seulement au clic.

**Accueil (`/index.html`, racine).** L'accueil canonique est
`/index.html` (`oeuvres/index.html` = simple redirection 301 ; `_redirects`).

**L'INTRO CINÉMATIQUE N'EST PLUS ICI** (septembre 2026, mission
`intro-vers-carnet`). La scène Three.js — la pièce à la bougie, le livre
qui s'ouvre, la plongée dans la page — a été **déplacée à l'entrée du
carnet** sur arbitrage du propriétaire : l'accueil s'ouvre désormais
directement sur son héros. Tout ce qui la servait a disparu du fichier :
`#scene`, `.cine`, `.loading`, l'iframe `#app`, la couche d'immersion
`#sheet` (`.hw` est maintenant enfant direct de `<body>`), `body.intro-run`
et son gating de `#hero-bg`, le bloc de 400 lignes de scène, et les
~30 Ko de base64 de l'affiche. `?skip-anim` n'est plus consulté ici — il
vaut désormais pour le carnet — et les liens internes qui le portaient
(brandmark et « Accueil » dans shell.js, bibliotheque.html, capital-1.html)
pointent `/`. Voir « L'entrée du carnet » plus bas pour la scène elle-même.
**Ne pas la réintroduire sur l'accueil** : elle n'y a plus sa place, et le
site s'ouvre plus carré ainsi.

La page porte donc le contenu réel dans `.hw` — héros deux
colonnes, marquee de concepts, « Ce que vous pouvez faire », bande
« circuit du capital » animée (A–M–P–M′–A′), **catalogue**, aperçu Place
publique (`SHELL.commune.mount(#homeCommune,{limit:4})`), chiffres clés,
bande CTA finale. **Thème sombre-chaud** (voir « Direction artistique »).
Le bouton plein du héros dit **« Entrer dans la bibliothèque »** et mène à
`oeuvres/bibliotheque.html`, plus à `capital-1.html` : on entre dans le site
par le corpus, pas par une œuvre choisie d'avance.
Le **catalogue** est piloté par `oeuvres/bibliotheque.json` (source unique,
`catalogue()` dans `home.js`) et rendu en deux niveaux : « Disponibles »
= cartes riches (image d'archive, statut, concepts, « Ouvrir l'atelier »)
dans `#lib-available` ; « En préparation » = index typographique par année
(`année · titre · catégorie`) dans `#lib-planned` ; le décompte va dans
`#lib-count`. FALLBACK sur les 2 œuvres disponibles si le fetch échoue.
Le mouvement vit dans **`assets/home.js`** (chargé
`defer`) : révélations au scroll (`IntersectionObserver`, classes
`.reveal` / `.reveal-stagger` / `.in` ; racine = `.hw` si elle défile,
sinon viewport — depuis la sortie de l'intro `.hw` ne défile plus, c'est
donc le viewport qui pilote), duplication du marquee, et **fond WebGL
discret** (`#hero-bg`, la liasse de feuillets — voir ci-dessous) — **coupé
si `prefers-reduced-motion` ou largeur < 768**, ne démarre qu'une fois
`body.shell-active`. Le script inline en bas de page pose `shell-active` et
`.lit` sur `.hs-hero` **immédiatement** : il n'y a plus rien à attendre.
Deux marqueurs sur `<html>` : `no-anim` (pas d'entrée orchestrée du héros)
et `no-motion` (pas d'animations du tout) — les deux posés ensemble, sur
mobile étroit ou reduced-motion. CSS de l'accueil = **inline**
(critique LCP) ; JS = **externe + `defer`**. `vendor/three.min.js` reste
chargé, non plus pour l'intro mais pour les décors WebGL de home.js (la
liasse, le chariot). Ne pas réintroduire de Three.js bloquant.
`SHELL.commune` vient de `shell.js` (déjà chargé).

**La largeur ne se teste PAS à `innerWidth` dans un script de tête.** Au
moment où il s'exécute, la fenêtre peut encore annoncer 0 (onglet ouvert en
arrière-plan, onglet piloté) : l'accueil partait alors en `no-anim` +
`no-motion`, c'est-à-dire sans la moindre animation, pour un visiteur en
1440 px. Le seuil passe par `matchMedia('(max-width:767px)')`, qui décrit le
viewport CSS — celui qui a servi à mettre la page en page. Même remède dans
`carnet-intro.js`. C'est le cousin du piège déjà documenté sur
`bibliotheque.html` (« la décision se prend au moment de décider »).

**L'invite à descendre (`.hs-hint`, `heroHint()` dans home.js).**
L'accueil s'ouvre sur un héros plein écran et ne disait pas qu'il
fallait faire défiler. L'invite reprend le vocabulaire des deux autres
pages (filet vertical dégradé + « Faire défiler » en capitales
espacées), au pied du héros ; son opacité est pilotée par la POSITION
de défilement — éteinte sur le premier dixième d'écran, et elle revient
si l'on remonte. Masquée sous 720 px (le héros y perd sa hauteur plein
écran, et le geste va de soi). C'est désormais la seule invite de la
page : celle de l'intro cinématique est partie avec elle, au carnet.

**Un style INLINE bat le gating CSS de l'entrée.** `heroHint()` écrivait
`style.opacity` dès l'inscription de son abonné ; cet inline passe
devant `html:not(.no-anim) .hs-hero .hs-hint{opacity:0}`, et l'invite
s'allumait donc PAR-DESSUS l'entrée du héros. L'abonné n'écrit rien
tant que `.hs-hero` n'a pas `.lit`, et efface l'inline sinon. Toute
nouvelle fonction qui pilote en inline une propriété par ailleurs gatée
par `.lit` doit faire pareil.

**Piège de spécificité sur l'entrée du héros — déjà tombé dedans une
fois.** Les éléments du héros sont cachés par
`html:not(.no-anim) .hs-hero .hs-left>*, html:not(.no-anim) .hs-hero .hs-right`
— soit **(0,3,1)**, à cause du `:not(.no-anim)` qui compte comme une classe
*et* du `html` qui compte comme un élément. Les règles de révélation de la
colonne gauche (`.hs-hero.lit .hs-left>.hs-h1`, quatre classes) passent
devant ; celle du portrait (`.hs-hero.lit .hs-right`, trois classes) perdait,
et **le portrait restait invisible partout sauf en `no-anim`** — c'est-à-dire
partout sauf dans les modes où l'on teste (mobile, reduced-motion, et à
l'époque `?skip-anim`). Le bug a vécu longtemps pour cette raison.
Corrigé en préfixant la règle par le même `html:not(.no-anim)`. **Toute
nouvelle règle `.lit` doit être vérifiée contre la spécificité (0,3,1) de la
règle qui cache**, et testée au moins une fois hors `no-anim`.

**Héros de l'accueil — « la liasse » (`heroBg()` dans `home.js`).** Les
feuillets d'archive ne dérivent plus en boucle : au repos ils sont
**rassemblés en éventail** au bas du couloir vide qui sépare le titre du
portrait, à demi sortis du cadre par le bas — ils ne font que respirer
(oscillation ×`(1-e)²`, éteinte dès qu'ils décollent). Le **défilement est
le souffle** : chaque feuillet a son `t0` (le dessus de la liasse part le
premier, le fond de pile en dernier) et vole sur `SPAN` de course, en
montant droit dans le couloir puis hors cadre par le haut, en tonneaux,
l'opacité s'éteignant sur les 28 % finaux de son vol. Tout est fonction de
la **position** de scroll → **strictement réversible** : on remonte, la
liasse se range. Par-dessus, un **coup de vent** — impulsion amortie sur la
*vitesse* de molette (`gustTarget`, décroissance `0.05^dt`) — qui soulève et
incline la liasse au repos comme en vol. La course vient du pilote de
défilement commun (`addScrollSub`), pas d'un écouteur local ; la boucle rAF
s'arrête d'elle-même quand la liasse est sortie et que la rafale est
retombée, et repart au premier scroll (`start()` dans l'abonné).

**Section « Questions fréquentes » (`#questions`, entre les chiffres clés et
la bande finale).** Neuf dépliants `<details>`, à la grammaire de carte de la
maison.

**Les questions se choisissent sur la demande RÉELLE, pas sur ce qu'un
visiteur déjà présent se demande.** Première version écrite à l'envers : cinq
des huit questions étaient des questions de marque (« qu'est-ce que Lire
Marx&nbsp;? », « qu'est-ce que la Place publique&nbsp;? ») — personne ne les
pose ailleurs, elles ne seront jamais citées. Six portent maintenant sur
Marx lui-même (par où commencer, quelle traduction, faut-il tout lire, où le
lire légalement, ce qui sépare le jeune Marx du *Capital*), trois restent
pratiques pour les gens (gratuité et compte, annotation, corpus).

**Et Google ne montre PLUS de résultats enrichis FAQ** depuis août 2023, sauf
sites gouvernementaux et de santé : le `FAQPage` reste utile comme structure
lisible par machine, il ne produira pas de snippet. Ne pas promettre l'inverse.

Deux règles de fabrication :

- **Le balisage est la source, le `FAQPage` du `<head>` en est DÉRIVÉ.** La
  dérivation vit dans **`tools/gen-seo.mjs`** depuis septembre 2026 (mission
  `seo-maillage-interne`) — avant, elle était tenue par un script jetable
  « voir les commits », ce qui n'est pas une source. `node tools/gen-seo.mjs`
  la regénère, `--check` la surveille. Le texte des deux doit coïncider mot
  pour mot : une donnée structurée qui promet une réponse absente de la page
  est un mensonge, et Google la sanctionne. **Piège vécu en écrivant cette
  section** : une retouche de phrase faite par `replace(..., 1)` sur le
  fichier entier a frappé la COPIE JSON-LD, qui est plus haut dans le
  document, et les deux ont divergé en silence. Toute retouche se fait dans
  la section, puis on regénère.
  **L'espace se pose aux frontières de BLOC, et seulement là.** Sans elle,
  deux paragraphes se recollent (« …dans sa préface.Sur ce site… ») ; posée à
  TOUTE frontière de balise, elle sépare l'italique de sa ponctuation
  (« Le Capital , Livre I »). C'est la nuance que la leçon déjà écrite pour
  `headText()` ne disait pas : les éléments EN LIGNE ne prennent pas
  d'espace. La dérivation a été validée en vérifiant qu'elle reproduisait le
  bloc existant **à l'octet près** avant d'ajouter quoi que ce soit — c'est
  le test qui prouve à la fois l'extracteur et l'absence de divergence.
- **Une réponse repliée reste dans le HTML** — c'est ce qui la rend citable.
  En revanche `.reveal-stagger` la met à `opacity:0` tant que le JS n'a pas
  posé `.in`, et le filet de fin de page est lui-même du script : **sans
  JavaScript, toute la page restait invisible.** D'où la règle
  `@media (scripting: none)` qui rend l'accueil fini pour qui n'exécute pas
  de script. La cascade générique s'arrêtant au 4e enfant, `.hs-faq-list`
  prolonge les délais jusqu'au 8e.

Ne pas laisser les dépliants ouverts par défaut (la section ferait trois
écrans), ni tous fermés (elle se lirait comme une liste de titres) : le
premier est ouvert, les autres non.

**Le fil et la lumière (`faqScrub`, classe `js-faq`).** Le geste propre à la
section : une lumière descend un fil à gauche de la colonne et allume chaque
question quand elle l'atteint — la pastille se remplit, l'encre passe de
`--muted` à `--text`, le liseré prend l'or, une lueur traverse la carte
(`--pass`, en cloche : elle ne vit que PENDANT le passage). C'est le motif
« journey » de zonixlab.com dit dans le dialecte de la maison — celui du
cheminement de l'atelier et du tracé de la frise. Piloté par la POSITION,
donc réversible.

- **LA LIGNE DE LECTURE, PAS UNE COURSE À SOI.** Première version calée sur
  une fenêtre propre à la section : le fil finissait sa descente pendant que
  la section arrivait encore — cinq questions allumées avant qu'on ait pu en
  lire une, et la neuvième jamais atteinte (mesuré : `--draw` à 1 et la
  dernière bloquée à 0,12). C'est le piège déjà payé sur les marches de
  l'atelier. `READ = 0.80` : la lumière est là où l'œil est, et le seuil de
  chaque question est centré sur SA PASTILLE, pas sur le haut de la carte.
- **Ouvrir une réponse déplace tout ce qui suit**, donc il faut remesurer :
  `toggle` ne remonte pas, d'où la capture sur la liste. Vérifié en
  neutralisant les transitions (la liste passe de 852 à 999 px et les
  questions repoussées sous la ligne s'éteignent).
- **Aucune opacité sur la carte ni sur le texte.** Une question éteinte reste
  en `--muted`, soit 7,57:1 sur la surface ; allumée, 14,7:1. L'extinction se
  dit par la couleur, le liseré et la pastille — le piège de la pastille à
  62 % d'opacité (2,6:1) ne se rejoue pas ici.
- **L'amélioration porte son propre état fini** : `--draw` et `--lit` valent 1
  par défaut, et le rail n'existe pas du tout sans `js-faq` (donc jamais sous
  768 px ni en reduced-motion) — la section y est celle d'avant, au pixel près.
- **La réponse se déroule** via `::details-content` + `interpolate-size`, posé
  sur la LISTE et non sur `:root` : à la racine, il rendrait animable toute
  hauteur `auto` de la page. Là où le sélecteur n'existe pas, le dépliant
  s'ouvre d'un coup — c'est le repli, pas une panne.

**Pour tester ce geste, la sonde est obligatoire et le piège est retors** :
`onScrollDriver` diffère à `requestAnimationFrame`, gelé dans une pane
masquée, et `scrollQueued` reste bloqué à `true` dès le PREMIER appel — que
déclenche `resize_window` via l'écouteur `resize`. Remplacer
`requestAnimationFrame` après coup ne débloque rien. Exposer temporairement
`window.__hsProbe = runScrollSubs`, avancer position par position, **et la
retirer avant le commit**.

**Sur la traduction du Capital, la réponse dit les DEUX.** Roy (1872-1875)
est révisée par Marx, qui écrit dans son « Avis au lecteur » du 28 avril 1875
qu'elle « possède une valeur scientifique indépendante de l'original » — mais
les spécialistes recommandent aujourd'hui Lefebvre (Éditions sociales, 1983,
révisée 2016), plus fidèle à l'allemand. Le site sert Roy parce que c'est la
seule dans le domaine public, et la réponse le dit. Une première rédaction ne
mentionnait que Roy « revue par Marx », ce qui laissait croire à un choix
éditorial alors que c'est une contrainte de droits.

**Bande finale — « la dernière page ».** Elle était désaccordée du reste :
centrée quand tout le reste de la page est aligné à gauche (et juste après
les chiffres clés, eux aussi centrés — deux blocs centrés d'affilée), sans
label ni titre de section alors que toutes les autres s'ouvrent ainsi, sans
aucune matière, et parlant en slogan là où le site décrit et cite. Elle a
donc pris la **structure commune** : `.hs-sec-label` (« Pour commencer »),
la phrase dans `.hs-closer-line` à l'échelle d'un `hs-sec-h`, le bouton, le
tout aligné à gauche dans `.hs-closer-inner`. Et sa **matière** : le
fac-similé revient en fond à droite (`.hs-closer-sheet`), très assombri
(`brightness(.30)`) et masqué en dégradé, pour rester une texture et non une
image qui réclame le regard — la page s'ouvre sur une liasse de manuscrits
et se referme sur un feuillet de la même main. Le halo a suivi le bouton à
gauche.

**Il y a une vraie bougie.** `.hs-closer-candle` reprend celle de l'entrée
du carnet (jadis l'intro de cette page même), aux mêmes couleurs : bougeoir laiton `#9a7b30`, cire crème
`#e9ddc2`, flamme `#ffd27a`, halo orangé `#ff9c3a`, et jusqu'au filet de
fumée. Le **bougeoir** n'est pas une pastille : c'est une
coupelle (`.cd-pan`) et une douille qui serre la cire (`.cd-socket`) — sans
la douille, la bougie se posait sur un disque au lieu d'y être tenue, et ça
se voyait. Chaque pièce est faite de deux morceaux, le CORPS (le flanc, vu
de face) et le DESSUS (l'ellipse en plongée, `::before`) : c'est le
décalage de quelques pixels entre les deux qui donne l'épaisseur. Un laiton
se lit à sa BANDE SPÉCULAIRE, d'où les dégradés horizontaux à sept arrêts
plutôt qu'un aplat. Et l'éclat de la coupelle ne va **pas** au centre — la
douille l'occulte et y porte son ombre : ce qu'on voit du plateau, c'est la
couronne entre les deux, et c'est là que le métal doit briller.

**Mais on ne le voit plus.** Le propriétaire a ensuite demandé la bougie
**collée au pied de page, comme posée juste en dessous** : elle est
enfoncée sous le bord bas de la bande (`bottom:-28px`, et `-18px` sur
mobile — l'enfoncement suit l'échelle `.66`, sinon la même valeur en pixels
mangerait une part bien plus grande d'une bougie réduite), que
`.hs-closer{overflow:hidden}` coupe net. On ne voit d'elle que la cire et
la flamme, qui sortent du pied de page comme d'un bureau qu'on ne montre
pas. Le bougeoir reste dessiné : il est simplement hors champ, et le
redescendre suffirait à le retrouver. Ne pas le supprimer, et ne pas
s'étonner de ne pas le voir. **Tout est en CSS** — un troisième contexte WebGL sur la page (il y a
déjà `#hero-bg` et `#circuit-bg`, plus celui de l'intro) pour un décor de
130 px ne se justifiait pas. Elle se tient **à droite, près du feuillet**,
qu'elle éclaire : à gauche elle tombait derrière le bouton. `--candle-r`
tient la bougie ET le halo sur le même axe — c'est la flamme qui est la
source, le halo n'est que ce qu'elle éclaire ; les déplacer séparément
casserait la lumière.

C'est le **défilement qui l'allume** : `--lum` pilote l'opacité de la
flamme, de sa lueur proche et de la fumée. La bande arrive donc sur une
bougie éteinte, et « la bougie prend » devient littéral.

**Elle ne bouge pas — trois mises en mouvement ont été essayées et toutes
abandonnées.** Ne pas les reproposer : (1) pivot au pied, elle *se relève*
depuis le sol ; (2) `rotate()` 2D autour du centre, elle *culbute* dans le
plan ; (3) `rotateY()` avec perspective, elle *tournoie sur sa longueur*
comme une toupie. Le propriétaire a tranché pour une bougie **posée en bas
de bande, immobile**, qui se contente de s'allumer. Un déplacement en haut
de bande avait accompagné les essais (2) et (3) : lui aussi est annulé.

Au passage, un piège qui redeviendrait vrai si on la remettait en mouvement :
posée au **bas** de la bande, elle ne peut pas être chronométrée sur le haut
de celle-ci. La bande est la **dernière section de la page**, son bas ne
remonte jamais au-dessus du pli puisque rien ne défile au-delà — un geste
mesuré sur le haut se jouerait entièrement sous le pli. Il faudrait le caler
sur `rect.bottom - vh`. Deux animations
distinctes une fois `.alight` posée : `lm-flame` tord la flamme (3,1 s) et
`lm-candle` fait respirer le halo (8,4 s) — deux périodes **non
multiples**, sinon l'œil les resynchronise et la flamme se met à battre la
mesure.

**Bande finale — la bougie prend (`closerCandle()`).** C'était la seule
section de la page sans la moindre animation (pas même un `.reveal`), et son
halo était resté sur le rouge de l'ancienne DA claire. La page s'ouvre sur
une bougie posée sur un bureau : elle se referme dessus. La bande arrive
presque noire et s'éclaire au défilement (`--lum` sur `.hs-closer` → opacité
et montée du halo, opacité de `.hs-closer-inner`, `drop-shadow` du bouton,
et apparition du feuillet), la lueur venant de **sous** le bouton — une
bougie éclaire d'en bas, pas du plafond. Puis un **vacillement**
(`@keyframes lm-candle`, stops volontairement irréguliers — une flamme ne
bat pas la mesure) persiste : c'est la seule chose de la page qui continue
de vivre une fois qu'on a cessé de défiler.

Deux points à garder : le vacillement joue sur `filter:brightness()` et
**jamais sur l'opacité ni le transform** du halo, que le scrub occupe déjà —
sinon les deux se battent ; et il ne tourne que sous `.alight`, posée par un
IntersectionObserver, sinon on repeindrait en boucle un grand dégradé pour
personne. Sans `js-candle` (mobile, reduced-motion), le halo garde son
opacité naturelle et la bande s'affiche telle quelle, éclairée.

**Section « Ce que vous pouvez faire » — trois blocs (`doCards()`).**
`.hs-do-cols` > `.hs-do-item`. Historique utile pour ne pas tourner en rond :
la boîte a été retirée (essai sans contour), puis un essai en **sommaire
pleine largeur** a été tenté — les deux ont été écartés. **Le propriétaire a
tranché : contour complet, fond, angles arrondis, et l'animation de pose.**
Ce qui a été gardé des essais, c'est la **typographie** : le numéro de
chapitre en Fraunces italique `--gold` — le traitement des années de la frise,
c'est la rime qui tient la page — au lieu du gros chiffre `--accent` pâle
jeté dans le coin, et « L'atelier **et** les simulations » (l'esperluette de
Fraunces ne plaisait pas). Ne pas reproposer de retirer la boîte.

Animation : chaque bloc arrive 30 px plus haut et de biais (`--drop`,
`--tilt`, angles −2,6° / +1,9° / −1,5°), puis se pose à plat, décalé d'un
bloc au suivant, et le numéro **prend l'encre** (`--ink`) une fois le
feuillet posé. Piloté par la position de scroll → réversible. `doCards()`
**retire `.reveal-stagger`** et pose `.poses` ; sans JS, sous no-motion ou en
dessous de 768 px, fondu simple.

**Pas de réglure dans les blocs.** Une bande de lignes horizontales
(`--sweep` balayé au défilement) y a vécu un temps : retirée sur demande du
propriétaire. Ne pas la réintroduire — ni pleine hauteur, ce qui faisait en
plus du moiré avec les lignes de texte.

Conséquence à ne pas oublier : `.hs-do-card` **n'existe plus** (c'est
`.hs-do-item`). Le `transform` partagé à variables `--rx`/`--ry`/`--lift` et
l'inclinaison au curseur de `cardFx()` ne concernent plus que `.hs-w-card`,
les cartes du catalogue ; `.hs-do-item` a son propre `transform`, réduit à
`--drop` et `--tilt`.

**Section « La bibliothèque » — elle se constitue au défilement
(`libraryScrub()`).** Une idée pour les deux moitiés : ce qui existe se
développe, ce qui vient s'écrit. En haut, le « révélateur » des photos
d'archive n'est plus déclenché une fois par IntersectionObserver mais
**scrubbé** — `--dev` pilote un `clip-path` gauche→droite, `--bar` la barre
dorée tenue **3 px en deçà** de la limite du tirage (posée pile sur la
limite, le `clip-path` la rognerait entièrement), `--in` fait arriver la
carte en fantôme avant le tirage et `--txt` amène le corps de la carte
derrière la barre, avec un décalage de 0,14 d'une œuvre à l'autre. En bas,
`--draw` trace le filet de `.hs-timeline::after` et **la frise défile
horizontalement pendant que la page défile verticalement** : `scrollLeft` du
`.hs-timeline-track` est piloté sur une fenêtre plus longue que celle du
filet — toute la traversée de la bande dans le viewport —, sinon la
trajectoire serait parcourue avant qu'on ait eu le temps de la lire. Chaque
`.hs-tl-card` s'allume (`--lit`) quand le tracé dépasse sa position
(`offsetLeft - scrollLeft` sur la largeur visible). Cette position n'est
**pas** plafonnée : une œuvre encore hors champ à droite a `f > 1` et reste
éteinte — c'est ce qui fait que l'animation continue pendant le défilement,
chacune s'allumant à son entrée. **On lâche prise dès que le lecteur saisit
la frise** (`pointerdown`, tactile, clavier, molette *horizontale* — une
molette verticale ne compte pas, c'est le geste de faire défiler la page
curseur posé n'importe où) : `hManual` coupe le pilotage pour de bon.

L'écriture de `scrollLeft` déclenche un `scroll` sur la piste, que le pilote
commun voit (il écoute `document` en **capture**, et la capture atteint le
document même pour un événement qui ne remonte pas). Pas de boucle pour
autant : réécrire la même valeur ne déclenche rien, et on n'écrit qu'au-delà
d'un demi-pixel d'écart.

**`scroll-snap-type` doit sauter pendant le pilotage** (classe `.scrubbed`).
La piste porte `scroll-snap-type: x proximity` pour le geste manuel ; laissé
actif, il fait retomber chaque écriture de `scrollLeft` sur la carte la plus
proche et la frise avance **par paliers** — un séquençage, pas un
défilement. Le symptôme est net à la mesure : `scrollLeft` ne prend que des
multiples exacts du pas des cartes (236 px ici). La classe est retirée dès
qu'on rend la main au lecteur, pour qu'il retrouve le magnétisme.

**Les œuvres disponibles sont triées par année DÉCROISSANTE** (`b.year -
a.year`) : Le Capital ouvre la bibliothèque, les Manuscrits suivent. La
frise « en préparation », elle, reste chronologique croissante — c'est une
trajectoire.

`developImages()` / `armDev()` / `html.js-dev` **n'existent plus** :
libraryScrub les remplace intégralement (mêmes conditions d'activation,
même effet, en réversible). Deux points de mécanique : la fonction est
appelée **par `catalogue()` à la fin de `render()`**, jamais depuis `init()`
— le catalogue est peuplé par `fetch`, il n'y a rien à animer avant ; et
elle **retire `.reveal-stagger`** de `#lib-available`, sinon le fondu de
`reveal()` ferait apparaître les cartes d'un coup en plein tirage.

**Le piège de la mesure unique.** `addScrollSub` n'appelle son abonné qu'une
fois à l'inscription, puis à chaque défilement. Or ici la mise en page bouge
juste après : les cartes viennent d'être injectées et le navigateur a pu
sauter sur l'ancre `#catalogue`. Sans rappel, une arrivée directe sur
`liremarx.com/#catalogue` laissait la section **figée en plein
développement** tant qu'on ne défilait pas. D'où le `requestAnimationFrame`
+ `setTimeout(…, 400)` + `window.load` à la fin de `libraryScrub()`. Tout
nouvel abonné qui mesure un élément peuplé par `fetch` doit faire pareil.

**`.hw` porte `overflow-x: clip`, JAMAIS `hidden` — et c'est structurel.**
La spec ne laisse pas `overflow-y:visible` à côté d'un `overflow-x:hidden` :
l'axe vertical passe alors à `auto`, et `.hw` devient une **boîte à
défilement**. Elle ne défile pourtant jamais (sa hauteur suit son contenu),
mais elle devient le SCROLLPORT le plus proche de tous ses descendants : le
`position:sticky` de `.circuit-band` s'y calait au lieu de se caler sur la
fenêtre, **l'épinglage du jeu ne prenait pas**, et les 230vh de
`.circuit-pin` se lisaient comme **1 170 px de trou** entre le jeu et le
corpus — la bande passait en 900 px, puis plus rien. Vestige de l'époque où
`.hw` ÉTAIT le conteneur de défilement (l'intro immersive) ; ses règles
`::-webkit-scrollbar` sont parties avec. C'est le même piège que celui déjà
documenté pour `.walk-cards` sur l'atelier — **toute nouvelle règle
`overflow-x` sur un ancêtre doit s'écrire `clip`.**

Deux façons de se tromper en diagnostiquant ça dans la pane : le
`position:sticky` y fonctionne parfaitement (un témoin neuf le prouve —
donc un sticky qui ne colle pas est un VRAI bug, pas un artefact) ; en
revanche `--cp` reste figé quoi qu'on fasse, parce que `onScrollDriver`
diffère à `requestAnimationFrame`, gelé dans une pane masquée, et que
`scrollQueued` reste bloqué à `true` dès le premier scroll réel — même en
remplaçant `requestAnimationFrame` après coup. Le scrub se vérifie alors à
son ENTRÉE (`-r.top / (r.height - vh)` doit aller de 0 à 1 sur la course),
pas à sa sortie.

**Section « Le circuit du capital » (le jeu) — habillage.** Sur la ligne
A–M–P–M′–A′, ce qui circule est un **curseur lumineux** (`.circuit-spark`,
CSS pur : tête + traînée de comète, or puis rouge après P). Il n'y a plus
de petit chariot SVG — ne pas le réintroduire. Le fond de la section est
le **carnet quadrillé** (`.circuit-band::before`), exactement la même
trame que les chiffres clés (`.hs-stats::before`) : grille 36 px en
`--border`, masque radial. Il est **sous** le canvas — le chariot roule
sur le papier, pas dessous. Le décor animé, lui, est le
**vrai chariot du jeu** : `circuitChariot()` dans `home.js` charge
`assets/chariot.json` et le fait rouler dans le fond de la section pendant
le défilement (roues qui tournent, trépidation, lanterne qui vacille,
**cargaison qui change avec le palier** — argent → moyens de production →
marchandises → argent). Un voile radial (`.circuit-veil`) garde le texte
lisible par-dessus.

Le trajet est **une route**, pas une trajectoire aérienne. Le chariot roule
sur un sol plat (`Y_ROAD`, à l'ondulation du pavé près) et c'est la
**profondeur** qui fait tout le relief à l'écran : `Z` part du fond
(`Z_FAR`), s'incurve franchement vers le premier plan à mi-course
(`Z_BEND`), puis repart vers le fond sans y retourner tout à fait (`Z_END`
reste en deçà de `Z_FAR` — le circuit revient grossi, et c'est le chariot
qui le dit). Il grossit en approchant, décroît en s'éloignant, et son cap
tourne d'une trentaine de degrés : il entre braqué vers nous, se met de
profil au plus près, ressort braqué vers le fond. `X` traverse pleine
largeur. `scene.fog` est réglé sur la couleur exacte de `--surface`, donc le
lointain disparaît vraiment. Le roulis suit la courbure, bridé à ~4° ;
l'assiette suit la pente du pavé, bridée à ~11°.

**Historique — trois formes essayées, ne pas revenir en arrière :**
1. Diagonale descendante en Y jusqu'au bord bas. Trop basse.
2. Cuvette en Y : descente puis remontée. **Rejetée** — le chariot
   s'élevait littéralement, il ne roulait plus, il lévitait, et la remontée
   était brutale parce qu'aucun véhicule ne monte comme ça.
3. **La route** (actuelle) : Y au sol, tout le relief par la profondeur.

**Le piège de la profondeur, revisité.** Il reste vrai que la perspective
écrase les lointains : la profondeur seule ne déplace le chariot que d'une
soixantaine de pixels VERTICALEMENT. Ce n'était un problème que tant qu'on
cherchait un « haut → bas ». Sur une route, c'est le but : elle se traverse,
elle ne se gravit pas — le relief se lit à la **taille** et au **cap**, pas
à la hauteur. Ce qui devient critique, en revanche, c'est le **cadrage** :
les deux fractions de `resize()` (`0.155 * d` pour la caméra, `0.129 * d`
pour le point visé) décident à quelle hauteur la route traverse l'image.
Les rapprocher aplatit la vue jusqu'à ce que la route ne se lise plus ; les
écarter donne une plongée d'hélicoptère. Le propriétaire a tranché que le
chariot **peut passer devant le texte** — le voile suffit à garder la
lecture — donc ne pas re-sacrifier le cadrage pour l'éviter.

**Le cap ne doit PAS être la tangente 3D exacte.** `atan2(dx, dz)` brut
donne un chariot qui **dérape** : la perspective écrase le déplacement en
profondeur, si bien qu'une caisse braquée de 30° vers nous se déplace à
l'écran presque à l'horizontale. D'où `HEAD_DAMP` — on ne retient que la
part *visible* de `dz`. Même correction pour l'assiette, qui prend la pente
sur `dy / hypot(dx, dz·HEAD_DAMP)`. Et `rig.rotation.order = 'YXZ'` : en
`'XYZ'` (défaut) `rotation.x` tourne autour du X du MONDE, le chariot
piquerait de travers dès qu'il est braqué.

**Réglages solidaires — ne pas en toucher un seul isolément** : `Y_ROAD` /
`Y_BUMP` / `BUMPS` / `Z_FAR` / `Z_END` / `Z_BEND` / `HEAD_DAMP` /
`PITCH_MAX`, les deux fractions de caméra dans `resize()`, l'échelle `0.78`
du rig, et le `padding-bottom` de `.js-circuit .circuit-band`.

**Le chariot sort du cadre par la droite vers t ≈ 0,82**, pas à t = 1 : `x`
dépasse `reach()` avant la fin de la course. Toute mise en forme de la
seconde moitié doit se jouer **avant** ce seuil. Pour vérifier une
modification du chemin, poser une sonde temporaire qui fige `q` (0,12 / 0,5 /
0,82) et rend une image — mais attention, un `scrollIntoView` qui se stabilise
écrase la sonde une fraction de seconde plus tard : appeler la sonde et
capturer l'écran **sans rien faire défiler entre les deux**.

**Fenêtre de défilement propre au chariot.** `circuitScrub` lui passe
`raw` (position brute de l'épinglage, négative avant / > 1 après), pas
`cp` ; `progress()` y ajoute `LEAD` et `TAIL` de 0.30. Le chariot roule
donc **avant** que la section ne se fige et finit **après** qu'elle s'est
libérée — plus de démarrage sec au moment de l'épinglage. Trois mesures
anti-à-coups vont avec, à conserver : `renderer.compile()` au chargement
(sinon la compilation des shaders tombe pile à l'arrivée de la section),
`setPixelRatio` plafonné à **1.5** (décor de fond à 62 % d'opacité), et
l'arrêt de la boucle dès que `q` sort de `]0,1[` (drapeau `settled`).

`assets/chariot.json` = `Vehicle.group` du projet **circuit-du-capital**
(dépôt séparé, `~/Desktop/circuit-du-capital`) sérialisé par
`Object3D.toJSON()`. Géométries paramétriques → ~23 Ko gzippés, relu par
`THREE.ObjectLoader` **sans loader supplémentaire** (vendor/three.min.js
est en r137, il n'y a pas de GLTFLoader — ne pas en ajouter un). Pour le
regénérer quand le chariot change dans le jeu : `tools/export-chariot.mjs`
(mode d'emploi en tête du fichier). Ce script n'est **pas** une étape de
build : le site reste statique et lit le JSON tel quel. Les noms
`cargo-*`, `wheel-0..3`, `lamp`, `lantern`, `driver` sont le contrat entre
l'export et `circuitChariot()`.

**Le chariot se conduit — « Prendre les rênes » (`chariotDrive`, dans
`circuitChariot()`).** À MI-COURSE du chariot (`q > 0.48`, pas dès son
entrée : proposée plus tôt, la fiche arrivait avant lui et on lisait « ce
chariot se conduit » sans l'avoir encore vu rouler), une fiche
se propose en haut à droite de la bande (`.circuit-reins`,
`#chariotReins`) — son `top` doit rester sous la topbar, qui est en
`position:fixed` à 44 px et en z-index 140 : la fiche, à z-index 5 dans la
bande, passerait dessous. Aux rênes,
le canvas **quitte sa bande** : il est déplacé dans `document.body` et passe
en `position:fixed` plein écran (`#circuit-bg.driving`, z-index 100 — sous
la sidebar à 120 et la topbar à 140, qui restent utilisables), avec un voile
de vignette (`.lm-drive-scrim`) et un bandeau de commandes
(`.lm-drive-hud`). Le déplacement dans le DOM n'est pas une coquetterie :
un ancêtre transformé ferait d'un `position:fixed` un `position:absolute`
(le piège déjà signalé pour `#msModal`). Au lâcher, le canvas retourne
exactement à sa place (`insertBefore(canvas, driveNext)`), `resize()`
rebascule le plan caméra et `runScrollSubs()` recale la course sur le
défilement réel. Les deux bascules se font derrière un fondu de 190 ms
(`.shifting`) : le chariot change de place et de cadrage hors du regard.

**C'est le chariot qui navigue dans le site.** Sa **hauteur à l'écran** —
et non son déplacement — commande le défilement : au-dessus de `TOP_BAND`
la page remonte, sous `BOT_BAND` elle descend, d'autant plus vite qu'il est
loin dans la bande (rampe au carré, `SCROLL_RATE`). Le défilement passe par
`scrollRoot()`, donc il pilote `.hw` dans le chemin immersif comme le
viewport en `no-anim` — vérifié dans les deux.

**Trois pièges déjà rencontrés, à ne pas refaire :**

1. **Les FLÈCHES ne prennent jamais les rênes.** Ce sont les touches avec
   lesquelles un lecteur au clavier fait défiler une page ; les capturer
   d'office enfermerait dans un jeu quelqu'un qui voulait lire. On propose
   la main sur les LETTRES, lues par **position physique** (`e.code` :
   `KeyW/A/S/D` = ZQSD en AZERTY et WASD en QWERTY, sans rien détecter), et
   seulement pendant que la fiche est offerte. Les flèches ne conduisent
   qu'**une fois** aux rênes. On rend toujours la main : Échap, le bouton,
   `Tab` (sans l'intercepter), un champ de saisie, une modale, la perte de
   focus, l'onglet masqué, ou dix secondes sans une touche.

2. **`[role="dialog"]:not([hidden])` ne dit RIEN sur ce site.** Le shell
   laisse en permanence des `.acct-modal-box` dans le DOM : ce sont leurs
   CONTENEURS qui portent `hidden`. La garde « une modale est ouverte »
   était donc vraie en permanence et lâchait les rênes à la première
   touche. Il faut demander si l'élément est **réellement rendu** —
   `getClientRects().length`, vide dès qu'un ancêtre est en `display:none`,
   là où `offsetParent` ment sur le `position:fixed`. Et comme c'est un
   calcul de mise en page, on ne l'appelle jamais sur une touche
   susceptible d'être maintenue.

3. **Ne jamais amortir la vitesse quand le chariot bute sur le bord du
   cadre.** Le braquage n'a de prise qu'avec de la vitesse (`grip`) : tuer
   la vitesse à chaque pas refusé scellait le chariot dans le coin **pour
   de bon**, plus moyen d'en repartir. Il **glisse** le long du bord (on
   essaie le pas entier, puis chaque axe séparément) et garde sa vitesse.
   Corollaire : les roues tournent avec la distance **réellement**
   parcourue, sinon il patine sur place.

4. **Le défilement exige que le chariot ROULE** (`push *= min(1, |v| /
   (SPD·0.25))`). Sur la seule position, un chariot garé en haut du cadre
   tirait la page indéfiniment : on lâchait les touches et elle continuait
   de remonter jusqu'en haut, sans moyen de l'arrêter.

**Le plan caméra de conduite est SÉPARÉ de celui de la route**
(`applyCam()`, `DCAM`). Les deux fractions de la route (`0.155` / `0.129`)
ne bougent pas ; la conduite a les siennes, franchement plus plongeantes, et
c'est une nécessité et non un goût : sous le plan route, la perspective
écrase les lointains et la profondeur ne déplacerait le chariot que d'une
soixantaine de pixels verticalement — « monter » ne voudrait rien dire, or
c'est la hauteur qui commande la page. `DCAM.h/back/aim` sont solidaires
entre eux et de `DCAM.start` (l'endroit où l'on entre sur le sol, calé pour
que le chariot arrive au repos hors des deux bandes).

Coupé partout où le chariot l'est déjà : `circuitChariot()` n'est appelé
que par `circuitScrub()` après ses gardes (reduced-motion, < 768 px,
viewport < 640 px, pas de WebGL), donc **aucun écouteur clavier n'existe**
dans ces cas — et le CSS masque fiche, bandeau et voile sous 768 px.

**Statut de la refonte par page** (à mettre à jour à chaque page migrée) :
- ✅ **Le jeu (`/jeu`)** — page neuve de septembre 2026, née directement
  dans la DA sombre-chaude (mission `brancher-le-jeu`, voir plus bas). Le
  jeu lui-même (`/jeu/jouer`) garde SA direction artistique — papier crème,
  encre, rouge brique — et c'est volontaire : c'est une œuvre à part, pas
  une page du site. Ne pas chercher à l'aligner sur la palette de la maison.
- ✅ Accueil général du site (`/index.html`) — enrichi + animé (voir
  ci-dessus). **Plus d'intro cinématique depuis septembre 2026** : elle est
  passée à l'entrée du carnet.
- ✅ Accueil de l'œuvre Le Capital (hero + onglets Lire/Atelier/Ressources)
  — **refondu en septembre 2026 : « le texte au centre »**, deux
  destinations et l'appareil en marge du chapitre. Voir « L'atelier — LE
  TEXTE AU CENTRE » ci-dessus.
- ✅ Page de lecture d'un chapitre (Le Capital) — bandeau + lettrine
  rubriquée + colonne de notes en marge retirée (redondante avec
  Notes partagées/Mes notes)
- ✅ « Texte intégral » (Le Capital) — attention : cette page a connu
  une régression fonctionnelle (lecteur cassé, contraste texte
  illisible, réglages de lecture non opérationnels) après une
  première tentative de restylage ; vérifier que la restauration +
  réapplication progressive s'est bien terminée avant de reconstruire
  dessus.
- ✅ Place publique — **refondue en FORUM à l'anatomie Reddit** (août
  2026, 3e passe — la salle 3D est remplacée), voir « La page Place
  publique » ci-dessous.
- ✅ Barre latérale générale + barre horizontale du haut
- ✅ Accueil de l'œuvre Manuscrits de 1844 — même structure que Le
  Capital (aliénation du travail, propriété privée, dépassement
  communiste), passée depuis par le socle sombre, l'accessibilité,
  l'architecture et la passe moderne
- ✅ **Socle sombre des pages d'atelier** (`capital-1.html`,
  `manuscrits-1844.html`) — août 2026, voir « Les pages d'atelier »
  ci-dessous. Les deux pages sont passées à la DA sombre-chaude.
- ✅ Onglets Parcourir / Cheminement / Modèles / Explorations /
  Chronologie : gel levé, puis **passe moderne** (août 2026, mission
  `atelier-moderne`) — grammaire de tête de panneau commune, table des
  matières, surfaces et pilules unifiées. Voir « La passe moderne »
  ci-dessous. Puis **`dossier-clair`** (sept. 2026) : le Dossier de Capital
  perd un tiers de son texte et gagne l'ascension, la démonstration des
  instruments, la frise qui se remplit et ses premières images.
- ✅ Page Bibliothèque à part (`oeuvres/bibliotheque.html`) — **refondue
  en scène 3D « la pièce aux rayonnages »** (août 2026), voir « La page
  Bibliothèque » ci-dessous. Elle avait été jugée inutile, rouverte sur
  demande explicite du propriétaire, puis refondue sur demande explicite
  encore : la page-document « Par où commencer » est remplacée.

## Les pages d'atelier — le socle sombre (mission `atelier-socle-sombre`)

`oeuvres/capital-1.html` et `oeuvres/manuscrits-1844.html` étaient les
dernières pages en DA claire : on sortait de la bibliothèque en 3D — pièce
brune, bougie à la main — et le clic « Ouvrir l'atelier » débouchait sur une
page blanche. C'était la rupture la plus violente du site. Cette mission ne
fait **que le socle** : palette, typographie, matière, grammaire de
composants. Les deux pages d'un coup, parce qu'elles partagent exactement le
même squelette (`.cap-hero`, `.cap-tabs-bar`, `.panel`).

**Décisions du propriétaire prises au lancement de la mission :**
1. Socle sombre sur les DEUX pages d'abord (plutôt qu'une scène sur une
   seule page) — une scène ne peut pas se poser sur une page blanche.
2. **La métaphore de l'atelier est LE BUREAU D'ÉCRITURE** — celui qu'on
   aperçoit déjà au bout de l'allée dans la scène de la bibliothèque
   (`furnish()` : feuillets, encrier, plume, deux tomes, chandelle,
   fac-similé encadré). On prend le livre au rayon, on va l'ouvrir au
   bureau : la rime boucle le parcours. **Essayé puis ABANDONNÉ** (août
   2026, mission `bureau-decriture`, branche supprimée) : un seuil 3D
   complet — bureau de furnish() par-dessus l'épaule, livre de l'œuvre en
   cuir de son rayon, couverture qui s'ouvre sur une page de garde,
   teardown — a été construit et fonctionnait ; le propriétaire a tranché
   qu'il ne voulait pas d'animation d'entrée mais une PAGE d'atelier
   moderne, claire et pratique (mission `atelier-moderne` ci-dessous).
   Ne pas re-proposer d'animation d'entrée sur les ateliers.
3. Le gel des cinq onglets « satisfaisants tels quels » est **levé**.

### atelier.css est le système de record, et lui seul

Les tokens sombres vivent désormais dans le `:root` d'`atelier.css`, aux
**valeurs exactes** de `/index.html`, `bibliotheque.html` et
`place-publique.html`. Les deux pages d'atelier ont vu leur `:root` clair
**supprimé** : c'est cette duplication en tête de page qui les avait fait
diverger du reste du site. Ne pas la réintroduire. (Bibliothèque et Place
publique gardent le leur — elles redéclarent la même palette, c'est
redondant mais inoffensif, et ça les protège d'un changement d'atelier.css.)

Ajouts au socle : `--hover` (sur fond sombre un survol ÉCLAIRCIT — l'ancien
aplat `--paper-2`, plus foncé, creusait la carte au lieu de la lever) et
`--candle`. `--f-ui` passe de Bricolage Grotesque à **Inter**, la police
d'interface du site ; les deux pages chargent donc `fonts/fonts.css` en
local comme les pages déjà migrées (l'`@import` Google d'atelier.css ne
fournit PAS Inter).

### Ce qui ne se traduit pas par une simple substitution de couleur

**Une carte d'emphase SOMBRE devient une carte ÉCLAIRÉE.** Sur papier clair,
l'emphase se disait en inversant vers le noir (`.cap-action-dark`,
`.atl-card.atl-current`, `.rdr-header`, tous en `background:#171614` ou
`var(--text)`). Sur brun-nuit le même geste donne un pavé CRÈME en pleine
page. Les trois portent maintenant le même dégradé chaud
(`linear-gradient(150deg,#2c2117,#211a12,#1b150e)`) et un filet or à 20 % :
c'est la surface sur laquelle tombe la bougie. Toute nouvelle emphase doit
reprendre ce dégradé, jamais un aplat plus sombre.

**`--red-deep` a changé de sens.** Sur fond clair, « rouge profond » était le
rouge FORT ; sur brun-nuit c'est le rouge FAIBLE — 2,9:1, illisible. Le token
ne sert **nulle part** de remplissage (25 usages, tous `color:`), il est donc
repointé sur `#e5644f` dans atelier.css. Les pages qui ont leur propre
`:root` gardent le leur.

**Deux boutons n'avaient pas de couleur du tout.** `.lk` (atelier.css) et
`.rd-chip` (reader-tools.css) déclaraient bordure et fond mais jamais
`color` : un `<button>` retombait sur le noir de l'agent utilisateur. Le
défaut existait déjà — la page claire le cachait. Sur fond sombre, texte
invisible et pavé gris `#efefef` en plein texte. **Vérifier `color` sur tout
composant bâti sur `<button>`.**

**Les pastilles pleines prennent le fond de la page, pas du blanc.**
`.chip`, `.chrono-phase`, `.sec-head .pg`, `.chap-head .badge` étaient en
`color:#fff` sur `background:var(--ink)` — donc blanc sur crème une fois
`--ink` inversé. Toutes en `color:var(--bg)`, ce qui est aussi la grammaire
du bouton pilule plein du site.

**La photographie d'archive doit être DANS la lumière, pas devant.** À pleine
luminosité les tirages étaient l'objet le plus clair de la page et crevaient
la pénombre : `grayscale(1) contrast(1.06) sepia(.30) brightness(.66)`.

**Plus d'emoji dans des pastilles d'interface.** Les 📖/📊 de `.cap-card-icon`
et du placeholder de liseuse sont remplacés par des **marques imprimées**
dessinées (dos de livre ouvert, signet) en or — la règle déjà posée pour la
légende du cartel de la bibliothèque.

### Les thèmes de liseuse sont des SYSTÈMES, pas des listes de rustines

La liseuse est le seul endroit du site où le lecteur peut demander un fond
clair, et c'est un vrai besoin pour un chapitre entier. Une première
tentative énumérait les sélecteurs à repeindre en sépia (titres, liens,
notes, lettrine…) et en oubliait forcément — les `h1` restaient crème sur
crème. **Chaque thème redéfinit maintenant les TOKENS dans sa propre
portée** (`.reader.theme-sepia{--ink:…;--red:…;--line:…}`), si bien que tout
descendant suit sans qu'on ait à le nommer, y compris ceux qui vivent dans
le CSS propre à chaque livre. Faire pareil pour tout nouveau thème.

Libellés remis d'aplomb dans `reader-tools.js` : `paper` → « Atelier » (la
surface de la page, désormais sombre), `sepia` → « Papier » (le vrai choix
clair), `dark` → « Nuit ». Au passage, `manuscrits-1844.css` codait
`.reader-content{background:#fffaf0;color:#221d16}` en dur, ce qui rendait
les thèmes **inopérants** sur le corps du texte : la règle est passée en
`transparent`/`inherit`.

### Vérifier ces pages : deux pièges d'outillage

1. **Le serveur de test ne doit PAS mettre en cache.** `python3 -m
   http.server` n'envoie aucun en-tête de cache, Chrome applique donc son
   cache heuristique et sert un `atelier.css` périmé — on croit alors à des
   bugs de contraste qui n'existent pas, et on « corrige » dans le vide.
   Lancer un serveur qui pose `Cache-Control: no-store`.
2. **La pane ne capture pas une page très haute.** Liseuse chargée, le
   document fait 70 000 px : toute capture après défilement revient NOIRE ou
   périmée, et les `getComputedStyle` d'éléments injectés tôt peuvent être
   figés (un `cloneNode` inséré à côté donne, lui, la bonne valeur — c'est
   le test qui départage un vrai bug d'un artefact). Vérifier au DOM, et
   pour une capture, masquer temporairement le héros et les onglets pour
   remonter la liseuse en haut de page.

**Auditer le contraste plutôt que regarder.** Une sonde qui parcourt les
éléments visibles, compare la couleur du texte au premier fond opaque
au-dessus et signale tout ratio < 3,2:1, passée sur les neuf panneaux de
chaque page et sur les trois thèmes de liseuse, a trouvé tout ce que l'œil
avait laissé passer. Elle ne voit en revanche PAS un îlot clair dans une page
sombre (texte foncé sur crème = fort contraste) : le bandeau de chapitre
`.rdr-header` n'a été repéré qu'à l'œil.


## La page « Mon carnet » (mission `carnet-page`, refondue `carnet-veritable` août 2026)

`oeuvres/carnet.html` — **le pendant PRIVÉ de la Place publique** : là-bas
les notes partagées, ici les vôtres. Entrée de sidebar juste sous « Place
publique » (`data-act="carnet"` dans shell.js, marquage `.on` sur sa
page). La carte « Votre carnet » du tableau de bord y renvoie.

**Refonte « le carnet ouvert » (arbitrage du propriétaire, août 2026)** :
la page n'est plus une liste sombre mais **un vrai carnet posé sur le
bureau de la pièce sombre**. Papier crème continu (dégradé en
`background-image` — voir le piège de sonde plus bas), palette d'encre de
la feuille volante de la bibliothèque, reliure cousue à gauche, signet
rouge, page de titre à la grammaire de la feuille volante (rubrique entre
filets, fleuron SVG, envoi **en toutes lettres** via `numFr`, sommaire
d'une ligne par cahier), un **cahier par œuvre** avec onglet de tranche
(décoratif, `aria-hidden` — c'est le sommaire qui navigue ; le compte du
cahier suit le TITRE en `flex-start`, la droite appartient à l'onglet).
Les citations sont imprimées en Spectral sous un **vrai trait de
surligneur** (`mark` teinté à la couleur de l'annotation), **vos notes
sont manuscrites en Caveat**, la date vit dans la marge. Tout est
DOM + CSS — pas de WebGL, le contenu est du texte vivant.

**CHANGEMENT DE DOCTRINE (explicitement arbitré)** : l'ancienne règle
« aucune donnée n'y naît » est abrogée. Depuis le carnet on peut :
**modifier** la note et la couleur d'un passage (édition en place :
textarea Caveat sur réglure, échantillons de couleur, Échap annule,
Cmd/Ctrl+Entrée enregistre), **supprimer** (confirmation INLINE, jamais
de modale), et **écrire des pages libres** sans citation (cahier
« Feuilles libres » ; une page libre vidée à l'enregistrement est
supprimée). On ne crée toujours pas de SURLIGNAGE ici — ça, c'est en
lisant.

- **Le module possède toujours le contrat de stockage.**
  `SHELL.annotations.update(id, {note, color})`, `.remove(id)` et
  `.addFree(body)` ont été ajoutés pour cette page, à côté d'`allNotes()`
  et `statsFor()` ; ils cherchent dans TOUT le store (le carnet n'a ni
  curWork ni curSection) et rafraîchissent la liseuse si le passage
  touché est affiché ailleurs. La page ne parse jamais le localStorage.
- **Une page libre = une annotation `work='carnet'`, `section 0`,
  `quote` vide.** `locate()` sort tôt sur une quote vide, donc aucune
  liseuse ne tentera jamais de la surligner ; elle voyage par la même
  table `annotations` (syncUpsert), et le carnet ajoute `'carnet'` à la
  liste des works de son `pullAll`.
- **Praticité** : recherche plein texte (citations + notes), filtres par
  couleur (une page libre, sans surligneur, tombe dès qu'un filtre
  couleur est actif), « Avec note », deux vues **Par œuvre / Par date**
  (le journal, à plat, plus récent d'abord, œuvre·section en marge),
  **export Markdown lisible** + JSON (`exportAll`), et une feuille
  `@media print` (le carnet s'imprime sans la coquille).
- La barre d'outils est SOMBRE (c'est le bureau, pas le carnet), sticky
  sous la topbar (`top:52px`) ; **statique sous 680 px** — repliée sur
  trois rangées elle mangeait un sixième de l'écran.
- Changements d'état annoncés via `SHELL.announce` (résultats de
  recherche débouncés, enregistrement, suppression).
- **L'annotation retient `label`**, le libellé lisible de sa section.
  Les annotations antérieures n'en ont pas : repli « Section N ».
- Chaque passage ramène au texte par le **contrat de deep-link** maison,
  variante explicite : `#s=<section>&q=<citation>&b=&a=`.
- Connecté, `pullAll` rapatrie d'abord ce qui a été écrit ailleurs ;
  déconnecté, la page de titre porte la ligne « Votre carnet vit sur cet
  appareil » avec le bouton de connexion.

**Pièges de cette page** :
1. Les `path` de `bibliotheque.json` sont relatifs à la RACINE alors que
   la page vit DANS `oeuvres/` — sans `/` de tête, le lien résout en
   `oeuvres/oeuvres/…`. Normaliser à l'entrée (déjà vécu sur Place
   publique).
2. **La sonde de contraste ment sur le carnet** : le papier est un
   `background-image` (dégradé), donc `backgroundColor` est transparent
   et une sonde générique compare l'encre au brun-nuit de la pièce —
   tout semble en échec. Donner à la sonde le papier réel, au PIRE du
   dégradé (`#e2d2ad`) : tout passe alors ≥ 5:1.
3. Les textes fonctionnels restent ≥ 11 px (constats detect.mjs
   corrigés) ; seul l'onglet de tranche, décoratif et `aria-hidden`,
   descend en dessous.

L'alias hérité `'capital'` → `'capital-1'` est redit ici (comme dans
place-publique) plutôt que de coupler la page à `SHELL.commune`.

### L'entrée du carnet (mission `intro-vers-carnet`, septembre 2026)

**La scène cinématique du site vit désormais ICI**, et nulle part ailleurs :
`oeuvres/carnet-intro.js` + le bloc CSS `html.cn-anim` en fin du `<style>`
de `carnet.html`. Arbitrage du propriétaire : l'accueil s'ouvre directement,
la cérémonie ne joue plus qu'à l'entrée du carnet.

Le décor n'a pas changé de sens en changeant de page — c'est le bureau à la
bougie de la bibliothèque — mais deux choses ont bougé :
- **le volume qu'on ouvre est VOTRE carnet** : `coverTop()` dessine une
  toile sombre, une étiquette de cahier collée (« Lire Marx / *Mon carnet* /
  passages & notes ») et un signet rouge qui dépasse, au lieu de la
  couverture rouge et or du *Capital* ;
- **l'affiche « Prolétaires de tous les pays » a disparu** : elle
  transportait ~30 Ko de base64 pour une page qu'on rouvre dix fois par
  jour, et elle ne disait rien du carnet. À sa place, une page manuscrite
  posée à plat sur le bureau — même papier, même écriture que celle qu'on
  va ouvrir. `silTex()` (la silhouette de Marx) était déjà du code mort
  dans l'accueil : supprimée aussi.

**Elle ne joue QU'UNE FOIS PAR SESSION** (`sessionStorage`,
`lm-carnet-ouvert`). Le carnet est une page de travail : une cérémonie à
chaque ouverture serait une taxe, pas un accueil — c'est exactement
l'arbitrage déjà rendu pour les ateliers (mission `bureau-decriture`
abandonnée). Sautée aussi par un **lien profond** (`#note=`, `#s=` — on
vient chercher un passage précis, et le drapeau de session n'est alors PAS
consommé), sous `prefers-reduced-motion`, avec `?skip-anim`, et sous
768 px.

**La décision se prend dans le `<head>`, pas dans le module.** Elle doit
être connue avant le premier rendu, sinon le carnet apparaît puis
disparaît sous la scène. Le head pose `html.cn-anim` ; le CSS et le module
ne font que la lire, et le module la retire s'il ne peut pas jouer (pas de
THREE, pas de WebGL, fenêtre étroite) — `forfeit()` retire alors les trois
éléments du document et pose `cn-open`. **La largeur, elle, ne se teste ni
ici ni là à `innerWidth`** : media query des deux côtés, même seuil, ils
bougent ensemble (voir le piège documenté sur l'accueil).

Ce qu'il ne faut pas casser :
- **`releaseIntro()` EFFACE le transform inline de `<main>`** (et n'écrit
  plus rien après). Un transform sur un ancêtre fait d'un `position:fixed`
  descendant un `position:absolute` : les modales du shell s'y caleraient.
  Vérifié après coup — `#acctModal` est enfant de `<body>` et reste centré.
- **Le verrou est un ÉPINGLAGE PAR IMAGE** (`window.scrollTo(0,0)` tant que
  `introLocked`), jamais un `overflow:hidden` : si la boucle mourait, un
  verrou CSS ne se rouvrirait plus et le carnet resterait bloqué — pire que
  le bug qu'on évite. Même raison pour le filet des **8 s** dans `frame()`.
- **On rend la main quand la page a FINI D'APPARAÎTRE (`sv >= 1`), pas
  quand `p` touche 1** : `p += (targetP-p)*0.035` converge de façon
  asymptotique, et libérer sur `p>0.995` laisserait une seconde pleine de
  défilement mort. Ne pas remonter ce seuil.
- **Le clavier ouvre aussi** (`keydown` : Tab, Entrée, Espace, Échap,
  Flèche bas, Page suivante, Fin). L'intro d'origine n'écoutait que la
  molette et le clic — sur l'accueil c'était déjà un défaut, sur une page
  utilitaire ce serait un piège : quelqu'un qui ne se sert pas de la souris
  resterait devant la scène sans moyen d'atteindre son carnet.
- **La scène est DÉMONTÉE à la fin** (`teardown()` : dispose du renderer,
  des géométries, des matériaux et des textures, puis retrait du canvas, de
  la couche de titre et du voile). On ne laisse pas tourner un contexte
  WebGL derrière le papier d'une page de travail.

**Pour la tester, la sonde est obligatoire**, et le piège est plus retors
qu'ailleurs : dans la pane pilotée le document est souvent `hidden`, donc
`innerWidth`, `clientWidth` ET les media queries valent 0/false — l'intro
ne s'arme jamais et on croit à un bug. Vérifier `document.hidden` avant de
conclure ; le démarrage automatique se valide dans un vrai navigateur, la
chorégraphie s'avance en pas-à-pas avec une sonde
`{enter, frame, getP, tgt}` — **retirée avant le commit**.

## L'atelier — LE TEXTE AU CENTRE (mission `atelier-texte-au-centre`, sept. 2026)

**Refonte totale de l'atelier, sur arbitrage du propriétaire** (« quand on
ouvre un livre, on se perd — trop de texte, trop de sections »). Diagnostic
mesuré avant de toucher au code, et il est chiffré :

- **la même navigation deux fois dans le même écran** — les huit onglets de
  `#worktabs` et les huit entrées `sb-work` de la sidebar étaient
  identiques, mot pour mot ;
- **5 117 mots** répartis sur huit panneaux, dont **2 127 dans « Modèles »**
  seul ; trois niveaux de navigation empilés (onglets → 9 stations en
  pilules → réglages) ;
- **le texte était un onglet sur huit**, du même poids visuel que
  « Chronologie », dans un site qui s'appelle *Lire Marx* ;
- on arrivait sur « Pour entrer » — trois cartes d'accroche — **à chaque
  visite**, y compris la dixième.

Le défaut de fond : l'atelier était rangé **par type d'objet que le site
avait fabriqué** (une frise, des modèles, des explorations), pas par ce que
le lecteur fait. Huit portes égales, c'est zéro porte. Et l'appareil
critique vivait **loin du passage qu'il éclaire** : comprendre le chapitre X
obligeait à quitter le chapitre X.

**Trois options ont été soumises** (le texte au centre / trois portes / un
seuil qui aiguille) ; le propriétaire a tranché pour **le texte au centre**.

### La forme

Deux destinations, et le texte est la première : `TABS = [lire, dossier]`.

```
┌──────────┬────────────────────────┬───────────────┐
│ SOMMAIRE │  LE TEXTE              │ DANS CE CHAP. │
│ 33 chap. │  (la liseuse)          │ l'appareil    │
│ + progr. │                        │ du chapitre   │
└──────────┴────────────────────────┴───────────────┘
```

- **`.atl3`** — la coquille à trois colonnes, dans `atelier.css` (donc
  disponible pour les Manuscrits sans un octet de plus). Les deux colonnes
  latérales sont **collantes** et défilent chacune pour son compte.
- **Le sommaire** (`renderTocRail`) a remplacé l'onglet « Parcourir » et sa
  grille de cartes riches. `#nav`, `renderAtlList` et l'ancien
  `applyAtlFilter` n'existent plus.
- **`#chapSelect` et `#loadBtn` restent dans le document, masqués**
  (`.atl3-shadow`). Ils portent l'ÉTAT que toute la liseuse lit déjà
  (`sel.value`, `sel.selectedIndex`) et que le contrat de deep-link pilote
  (`lb.click()`). **Le sélecteur est le modèle, le sommaire est sa vue** —
  les vider aurait voulu dire réécrire la liseuse.
- **Le Dossier est un CONTENEUR, pas un panneau** : `#dossier` regroupe les
  anciens onglets (Cheminement, Chronologie, Modèles, Explorations,
  Ressources), qui restent **tous `class="panel active"` en
  permanence** ; c'est le conteneur qui s'affiche ou non, avec une
  navigation d'ancres (`#dossierNav`).
- **Le seuil** — les trois idées ne s'affichent qu'à la **première visite**
  (`localStorage`, `liremarx.capital.seuil.v1`), et jamais à qui a déjà une
  reprise. **C'est leur SEUL emplacement depuis septembre 2026** — voir
  « Le Dossier n'a plus de section Pour entrer » plus bas.
- Le bandeau de reprise (`.resume-band`, `renderResumeBand`) est **supprimé** :
  la page ouvre elle-même le chapitre où l'on s'était arrêté, le bandeau
  n'aurait fait que le redire.

### La marge — le point de toute la refonte

`renderMarge()` compose « Dans ce chapitre » : le résumé **En clair**,
**l'instrument** du laboratoire, **la marche** du cheminement, **les dates**
que le chapitre raconte, **une exploration**, **vos passages**.

**La matière existait déjà et n'était pas lue** : `META[rn].labo`,
`META[rn].d` et `CHRONO[].chap` portaient le renvoi depuis toujours, en
**texte décoratif**. Les indexer, c'est ce qui fait passer de « huit
départements » à « un livre avec des marges ».

**`romansOf()` compare des JETONS, jamais des sous-chaînes.** « X » est
contenu dans « XXVII » : un `indexOf` sur la chaîne aurait accroché au
chapitre X la moitié de la section VIII. La découpe se fait sur
`/[^IVXLC]+/` — les lettres de « chap. » sont minuscules, elles ne
polluent pas la classe.

### Le tiroir — l'appareil vient au texte

`openDrawer(kind,target)` **DÉPLACE le nœud existant** (`#s-jour`,
`#x-coop`, la `.walk-step`) dans `#atlDrawerBody` et le remet exactement à
sa place à la fermeture (`insertBefore(node, drawerNext)`). **Rien n'est
cloné** : tout le JS du laboratoire adresse ses contrôles par
`getElementById`, un clone en aurait fait des doublons muets. Même motif
que le chariot de l'accueil. Vérifié à la mesure : curseur déplacé dans le
tiroir → journée 16 h, nécessaire 6,0 h, surtravail 10,0 h.

Le nœud emprunté sort de la portée de ses propres scrubs (atelier-motion
mesure une position dans le Dossier, qui est masqué) : le CSS le force à
`opacity:1;transform:none` dans le tiroir.

### Trois défauts corrigés après la première passe

Signalés par le propriétaire (« c'est un peu bugué »), tous trois réels :

1. **Le sommaire touchait la BARRE LATÉRALE**, texte contre texte (mesuré :
   écart de 0 px), et la marge collait au bord de la fenêtre. Cause :
   `.atl3{margin:0 -22px}` — la marge négative reprenait les 22 px de
   respiration du `.wrap`, or à gauche ces 22 px sont **tout ce qui sépare
   la colonne de la sidebar**, qui est en `position:fixed` juste là. Marges
   négatives supprimées ; la colonne de lecture y gagne même 40 px.
2. **On cliquait un chapitre et le texte n'y allait pas.** Le bandeau, la
   marge et le sommaire annonçaient « chapitre III » pendant que la colonne
   affichait encore le chapitre I. `scrollToAnchor` défilait en `smooth`
   sur quarante mille pixels — ce qui n'arrive jamais, et **ne progresse
   pas du tout dans un onglet piloté**, si bien que le test passait sans
   rien prouver. Saut instantané, décalé de la coquille collante (104 px).
3. **L'appareil suivait un CLIC, pas la lecture.** La liseuse charge une
   section entière (jusqu'à 115 000 px) : on descendait jusqu'au chapitre
   XI pendant que la marge et le sommaire disaient toujours VII. C'était le
   démenti le plus net de toute la refonte. `followReading()` relève le
   dernier titre de chapitre passé sous la ligne de lecture (220 px) et
   met à jour la marque du sommaire, la marge, le bandeau et
   `SHELL.resume` — **sans re-rendre le sommaire**, sinon le filtre en
   cours de frappe et la position de la colonne seraient perdus à chaque
   chapitre traversé.

**On n'a PAS découpé la section pour n'afficher que le chapitre**, bien que
ce fût tentant : les annotations sont ancrées par citation DANS la section
et `locate()` les cherche dans le conteneur — un découpage ferait
silencieusement disparaître tout surlignage posé dans un autre chapitre de
la même section.

**Le déclencheur du suivi est un `IntersectionObserver`** sur les titres de
chapitre, doublé d'un écouteur de défilement. L'IO se déclenche exactement
quand la réponse change, et il est indifférent à la manière dont on a
défilé (molette, clavier, ancre, `scrollTo`). L'appariement titre ↔ chapitre
se fait par **titre** et non par chiffre romain : Wikisource colle le
numéro au titre (« CHAPITRE VIIPRODUCTION DE VALEURS… ») et écrit
« CHAPITRE PREMIER » pour le premier.

**PIÈGE D'OUTILLAGE MAJEUR, à relire avant de conclure quoi que ce soit sur
une animation ou un suivi de défilement** : quand la pane est **masquée**
(`document.hidden === true`), le navigateur ne délivre **NI les événements
`scroll`** (ni sur `window`, ni sur `document`, ni en capture), **NI les
rappels d'`IntersectionObserver`** (pas même le rappel initial, que la spec
garantit pourtant), **ni le `requestAnimationFrame`**. Trois mécanismes
parfaitement corrects semblent donc morts d'affilée. Vérifier
`document.hidden` AVANT de « corriger » un suivi qui ne suit pas ; la
computation elle-même se teste en appelant la fonction à la main.

### La marge remise dans le bon ordre (retours du propriétaire, 2e passe)

Trois demandes, sur la page « Lire le texte » :

1. **« Suivre ma progression » était un lien souligné** dans un site qui
   n'écrit ses actions qu'en pilules. Il porte `.btn` (la forme committée)
   et ne règle plus localement que sa taille.
2. **Lecture plein écran** (`body.at-plein`) : la coquille entière —
   sidebar, topbar, en-tête, onglets, les deux colonnes — rend l'espace au
   texte. Le mode CSS est la **source de vérité** ; on demande en plus le
   plein écran du navigateur quand il est disponible et l'on se
   resynchronise sur `fullscreenchange` (sortie par F11 ou Échap natif),
   mais si la demande échoue — elle est refusable — le mode reste valable.
   La liseuse **garde sa mesure de 760 px** : le plein écran sert à retirer
   la coquille, pas à allonger la ligne. Les pastilles flottantes de notes
   sont **rallumées** dans ce mode, la marge n'étant plus là pour les
   remplacer. Échap : le tiroir d'abord (couche du dessus), le plein écran
   ensuite.
3. **« Vos passages » est passé EN TÊTE de la marge**, en carte d'emphase
   (le dégradé chaud + filet or du socle, la seule de la colonne). Il
   fermait la marge sous cinq blocs, donc hors écran dès que le chapitre
   avait de la matière — sur l'outil principal de la page. Il **montre**
   désormais les passages (barre à la couleur du surlignage, citation en
   Spectral, note en Caveat) au lieu d'en annoncer le nombre, et un clic
   ramène au passage.

**Le bouton de plein écran est RECONSTRUIT à chaque montage de la liseuse,
jamais déplacé.** Premier réflexe : déménager un nœud unique dans
`.rd-row`, la seule barre collante de la colonne — il y disparaissait au
chapitre suivant, `showSelection` réécrivant tout `#readerOut` en
`innerHTML`. Et `installFullBtn()` doit être appelé **après**
`Reading.mount`, qui construit la barre : appelé plus haut, il ne trouvait
pas `.rd-row` et le bouton restait au-dessus du texte, d'où il défilait
hors de l'écran dès qu'on lisait.

**Le saut vers un passage est instantané** (`jumpToQuote`, petit outil
dupliqué). `SHELL.annotations.flashAnchor` fait son propre `scrollIntoView`
en `smooth` : parfait dans le panneau de notes, inutilisable ici — dans une
section de cent mille pixels, un défilement doux met une éternité. On se
pose d'abord, flashAnchor ne fait plus que clignoter.

**La marge se recompose dès qu'on surligne** : `SHELL.annotations` n'expose
aucun rappel de changement, on observe donc le DOM (`mark.anno` dans
`#readerOut`) et l'on compare le COMPTE — la liseuse produit des dizaines
de mutations au montage, réagir à chacune serait absurde.

**PIÈGE D'OUTILLAGE, à ajouter à la liste** : quand la pane est masquée,
les **transitions CSS sont GELÉES**. `shell.css` pose
`.wrap{transition:margin-left .2s}` ; en plein écran, `margin-left`
restait donc bloqué à 208 px et l'on croyait la règle non appliquée — elle
l'était, la valeur était figée en cours de transition. Neutraliser la
transition (`style.transition='none'`) pour mesurer, et **ne pas
« corriger » une cascade qui fonctionne**.

### Les finitions de la barre et de la marge (3e passe)

- **La barre de lecture se bloque sous la barre d'onglets**
  (`.atl3-mid .rd-toolbar{top:var(--atl-top)}`). reader-tools la colle à
  44 px — la hauteur de la seule topbar, ce qui était juste avant que
  l'atelier n'ajoute sa propre barre collante. Les onglets occupent 44→88
  et passent devant (z-index 62 contre 58) : **le haut des boutons de la
  liseuse disparaissait dessous**, mesuré à six pixels près.
- **Le bouton de plein écran est épinglé à GAUCHE, hors de la rangée qui
  défile** (`.atl3-toolhead`). Trois essais avant d'y arriver : à la fin de
  `.rd-row` il tombait hors champ (la rangée est en `nowrap` avec
  défilement horizontal) ; en tête DE la rangée il poussait quatre outils
  dehors à sa place. Il vit donc À CÔTÉ de la rangée, qui garde sa largeur.
- **La barre de lecture se replie sur deux rangées dans la colonne**
  (`.atl3-mid .rd-row{flex-wrap:wrap}`). reader-tools la tient sur une
  seule — décision prise pour une liseuse pleine largeur. Dans une colonne
  de cinq cents pixels, la même règle cachait **quatre outils sur sept**
  derrière un défilement que rien n'annonce. Deux rangées valent mieux.
  Le libellé est passé à « Plein écran » et le rembourrage de `.reader` a
  été réduit dans la colonne : sans ces deux gains, on tombait à TROIS
  rangées et 146 px de coquille collante — ce que reader-tools voulait
  précisément éviter.
- **La marge descend jusqu'en bas** (`height`, pas seulement `max-height` :
  sur un chapitre à la marge courte, la colonne s'arrêtait au milieu de
  l'écran, filet compris, et l'on croyait la page finie là) **et elle dit
  qu'elle défile** — voile dégradé + chevron, qui s'effacent une fois le
  fond atteint, plus une barre de défilement colorée. Le voile est en
  `position:sticky` et **non un `::after`** : un pseudo-élément du
  conteneur défilerait avec le contenu et se retrouverait au milieu du
  texte.
- **Les deux destinations sont un sélecteur segmenté**, plus un onglet
  souligné : à deux entrées, le filet de 2 px laissait deux mots nus dans
  le vide. L'actif prend la surface éclairée du socle. La barre garde ses
  **44 px** (règle déjà posée : une hauteur variable fait sauter la page
  d'un onglet à l'autre).

**PIÈGE DE CASCADE, revécu** : ces règles d'onglet ont dû être écrites dans
le `<style>` de la page, PAS dans atelier.css. `nav.tabs.worktabs .tab` y
existait déjà avec la même spécificité (0,3,1) que
`body.at-atelier .worktabs .tab` — et le `<style>` de la page passe après la
feuille commune. Le socle ne pouvait pas les corriger de l'extérieur. On
corrige à la source, jamais en surenchérissant.

### Le mouvement de la vue de lecture (passe DA + mouvement)

Ajouté dans `atelier-motion.js` (`threeCols()`), donc sous les gardes du
module : rien ne s'arme sous `prefers-reduced-motion` ni en dessous de
768 px, et le défaut CSS est l'état posé.

**LA RÈGLE QUI COMMANDE TOUT : la colonne de TEXTE ne bouge jamais.** Ni à
l'entrée, ni au défilement. Le lecteur vient lire ; une ligne qui glisse
sous l'œil est une gêne, pas un agrément. Le mouvement vit dans les deux
colonnes latérales et aux MOMENTS DE TRANSITION — l'arrivée, l'ouverture
d'un chapitre — jamais en continu sous le regard. On ne masque jamais le
texte en attendant une animation.

Trois gestes, et trois seulement :
- les deux colonnes latérales se posent à l'arrivée (`at3ColG`/`at3ColD`) ;
- la marge se recompose à chaque chapitre, blocs échelonnés (`at3Bloc`,
  moins de 300 ms en tout — ce geste se rejoue à chaque chapitre traversé,
  une entrée spectaculaire deviendrait une taxe) ;
- le bandeau de chapitre s'allume, la lueur montant du bas (`at3Alight` +
  `at3Halo`) — le seul geste qui touche la colonne de texte, sur le TITRE,
  avant qu'on lise.

**ANIMATION et non transition, accrochée à `js-at3` SEULE.** Une transition
suppose qu'une seconde classe arrive derrière pour la déclencher ; si elle
n'arrive pas, la colonne reste à zéro d'opacité — invisible pour de bon.
Poser la classe doit ÊTRE le déclenchement, sans entre-deux.

**`setProperty` veut une CHAÎNE.** `el.style.setProperty('--i', 3)` est
ignoré en silence : tout l'échelonnement retombait à zéro. Le module
écrivait déjà `.toFixed(3)` partout ailleurs — c'est la raison.

**Geste essayé puis RETIRÉ : l'inscription ligne à ligne du sommaire.**
`renderTocRail()` rebâtit la liste à la fin du chargement du texte, environ
une seconde après l'entrée : la cascade en cours était détruite en plein
vol et rejouée à plat sur les nouvelles lignes. Un geste qui se contredit
lui-même vaut moins que pas de geste — l'entrée de la colonne le dit déjà,
et elle, rien ne la reconstruit. Ne pas la reproposer sans régler d'abord
le rebâtissage.

**Alignement sur l'accueil** (demande explicite) : micro-libellés aux
valeurs exactes de `.hs-sec-label` (`.72rem` / **600** / `.11em`), cartes au
rayon **16** avec survol vers `--gold`, ombre longue et basse et la courbe
`cubic-bezier(.16,1,.3,1)` de `.hs-w-card`, titre de marge en Fraunces
**900** `-.02em`. La carte « Vos passages » prend le halo radial or de la
maison — le site s'éclaire à la bougie, ses surfaces d'emphase portent
cette lumière.

**Un constat `low-contrast` du détecteur est un FAUX POSITIF** :
« #ffffff on #beb6a5 » correspond à `.subtab:hover` — `--ink` (#f3e9d4) lu
comme blanc, et `--hover` (crème à 5 %) composité sur un fond clair supposé
au lieu du brun-nuit réel. La sonde sur le rendu donne 0 échec. Ne pas
« corriger » ce contraste : on casserait un survol correct.

### Pièges rencontrés — tous vécus, aucun théorique

1. **`atelier-motion.js` observait la CLASSE des panneaux.** Les six
   panneaux du Dossier ne changent plus jamais de classe : sans correctif,
   leurs titres n'auraient **jamais** été encrés (mesurés masqués, ils
   restaient invisibles) et leurs scrubs seraient restés figés.
   `watchPanels()` observe désormais **aussi** l'attribut `hidden` de
   `.atl-dossier` et `.atl3`. Toujours le DOM, jamais le code d'onglets de
   la page — qui n'est pas le même d'une œuvre à l'autre.
2. **`align-items:start` ne veut pas dire la même chose en grille et en
   flex colonne.** Écrit pour la grille (il y aligne les colonnes en haut),
   il donne en flex colonne à chaque enfant la largeur de son **contenu** :
   la colonne de texte passait à 729 px dans un viewport de 375 et toute la
   page débordait horizontalement. `align-items:stretch` + `min-width:0`
   sous 900 px.
3. **Le rappel de fin de page lisait `.panel.active`** pour retrouver
   l'onglet courant. Comme `#lire` est toujours actif et précède `#dossier`
   dans le document, il retombait TOUJOURS sur « lire » : il réécrivait le
   hash à `#lire` et marquait la mauvaise entrée de sidebar après un
   deep-link `#labo`. La destination courante est **`curTab`**, et elle
   seule.
4. **Les cartes du seuil mènent DANS le livre** — elles doivent donc le
   refermer. Sans quoi `goLire` chargeait le texte derrière un écran encore
   masqué. `activateTab` appelle `dismissSeuil()`, **gardé par
   `!hidden`** : au boot, activateTab tourne bien avant le `const SEUIL_KEY`
   (zone morte temporelle), mais le seuil y est encore masqué.
5. **Un deep-link saute en `instant`, pas en `smooth`** : on vient chercher
   un endroit précis, et le `window.scrollTo(0,0)` de fin de page gagnerait
   la course contre un défilement animé.
6. **La marge, passée sous le texte, atterrissait à deux cent mille pixels
   du lecteur** — une section entière de Wikisource plus bas, c'est-à-dire
   nulle part. Sous 1240 px elle passe **au-dessus** du texte, repliée sur
   une ligne ; sous 900 px le sommaire se replie de même (déployé, il posait
   380 px de liste avant le texte, l'inverse exact du but).
7. **Les deux pastilles flottantes** (« Mes notes », « Notes partagées »)
   se posent en bas à droite du viewport, donc par-dessus le pied de la
   marge. Les déplacer les mettait **par-dessus le texte** — pire échange.
   Elles sont masquées tant que la marge est une colonne, et la marge
   porte deux boutons qui déclenchent les vraies pastilles (le shell les
   possède, la marge ne fait que les cliquer).

5. **`.j-carte p` bat `.j-carte-n`, et le numéro n'a jamais pris l'encre.**
   Le numéro de chapitre est un `<p>` : `.j-carte p` vaut **(0,1,1)** contre
   **(0,1,0)** pour `.j-carte-n`, si bien que la couleur du numéro était
   écrasée par celle du corps et restait en `--muted` même une fois le
   feuillet posé. Trouvé à la mesure (`getComputedStyle` rendait un `rgb()`
   plat là où un `color-mix` aurait rendu `color(srgb …)`), pas à l'œil.
   Les deux règles sont écrites en `.j-carte .j-carte-n`. **Toute règle qui
   vise une classe sur un élément que le conteneur stylise déjà par son nom
   de balise doit gagner en spécificité.**
6. **UNE EXTINCTION NE SE DIT JAMAIS PAR L'OPACITÉ.** Premier jet : la
   lettre de station à `opacity:.42` et le numéro de carte à `.28` quand le
   fil ne les a pas atteints. Mesuré : **2,5:1** et **2:1** sur le fond.
   C'est très exactement le piège de la pastille du cheminement, déjà
   documenté et rejoué ici. Les deux s'éteignent désormais par la COULEUR,
   en `color-mix` de `--muted` (8,1:1) vers `--gold` (9,0:1) : les deux
   extrémités passent. Seule la lueur de passage joue en transparence, et
   c'est une ombre, pas du texte.
7. **Une dernière section ne peut pas se chronométrer sur son haut** — la
   règle était déjà écrite pour la bougie de l'accueil, et je l'ai quand
   même rejouée. Rien ne défile au-delà de la bande finale, donc son bas ne
   remonte jamais au-dessus du pli : une course calée sur une fraction de la
   hauteur d'écran ne se termine jamais (mesuré : `--lum` plafonnait à 0,73
   en bas de page). **La course d'une dernière bande est SA PROPRE
   HAUTEUR** : quand on touche le bas du document, son bas est le bas de
   l'écran et le geste vaut exactement 1.
8. **Le script de tête décide au PARSE, et une page légère parse trop
   tôt.** `no-anim` / `no-motion` n'étaient jamais posés à 375 px sur cette
   page — alors que l'accueil, plus lourd, les posait correctement dans les
   mêmes conditions. Ce n'était donc pas un artefact de la pane : la tête de
   cette page est analysée avant que la taille du viewport ne soit établie.
   Le script de tête reste nécessaire (il faut décider AVANT le premier
   rendu), mais le module lui donne désormais un **filet** : il redit ce que
   la media query dit une fois la page chargée. Le contrôle qui a tranché :
   charger l'accueil dans le même onglet, à la même taille, et comparer.

### Vérifié

Contraste (sonde maison : 0 échec sur la coquille et le tiroir) **et**
détecteur statique (`detect.mjs` : 53 constats, **0 erreur**, tous de la
famille des choix de DA déjà documentés) — les deux, comme la règle du
projet l'impose. Les micro-libellés sont à **`.72rem`** et non `.66`/`.68` :
le plancher du projet pour un texte fonctionnel est 11 px. Testé à 1440,
1100, 900 et 375 px sans débordement horizontal ; deep-link `#s=&q=`,
`#labo`, `#chrono` ; seuil première visite ; tiroir sur les trois espèces
de nœud, avec retour à la place d'origine ; clavier (sommaire en `<button>`,
Échap ferme le tiroir, focus rendu au déclencheur).

**Rappel de méthode** : dans l'onglet piloté, `behavior:'smooth'` **ne
progresse pas du tout** — mesuré ici encore (41,5 → 42 px en 1,2 s, quand
l'`instant` va à 600). Un « ça ne défile pas » n'est pas un bug tant qu'on
ne l'a pas revérifié en `instant`.

### Porté aux Manuscrits (sept. 2026)

Fait : voir « Les Manuscrits prennent la même forme » plus bas. Les deux
ateliers ont désormais exactement la même présentation.

## Le Dossier remis en ordre (mission `dossier-lisible`, sept. 2026)

Demande du propriétaire : « unifier, ordonner, faire respirer, styliser,
animer au scroll — plus lisible, en se mettant à la place de l'usager ».
Diagnostic mesuré avant de toucher au code :

- **11 278 px d'un seul défilement**, 2 248 mots, six sections ;
- **30 px** séparaient deux sujets — pas de filet, pas de numéro, rien ne
  disait qu'on avait changé de section ;
- la barre d'ancres **ne marquait jamais laquelle on lisait** : aucun état
  actif, aucun repère de position. Dans onze mille pixels, c'était le
  défaut d'orientation majeur ;
- **l'ordre de la barre n'était pas celui du document.** `DOSSIER` disait
  entrer → deriv → labo → explore → chrono → ressources ; le document
  disait entrer → labo → deriv → chrono → explore → ressources. Descendre
  la barre faisait sauter en avant puis en arrière ;
- **les mots de la barre n'étaient pas ceux de l'arrivée** : « Modèles » →
  « Le laboratoire des lois », « Cheminement » → « L'ascension de
  l'abstrait au concret ». Six fois le même décalage ;
- **les six titres s'encraient TOUS EN MÊME TEMPS** (mesuré : `--wp` valait
  1 sur les six dès l'ouverture du Dossier) — cinq gestes sur six dépensés
  sous le pli, invisibles.

### Ce qui a été fait

**L'ordre vit à un seul endroit** — la constante `DOSSIER`, que le document
suit désormais. Il est celui du lecteur : on entre (trois idées), on voit
le livre se déduire (le cheminement), puis **l'histoire réelle sur laquelle
il repose (la chronologie)** — que le texte de la section annonce lui-même
comme « le pendant concret de la Dérivation » et qui en était séparée par
deux sections —, on manipule les lois (le laboratoire), on regarde les
renversements (explorations), on va plus loin (ressources).

**Chaque section s'ouvre sur son numéro et sur le mot exact de la barre**
(`.dos-open` : chiffre romain en Fraunces italique or — la rime des années
de la frise —, rubrique en capitales, filet). Généré par `buildDossier()`
depuis `DOSSIER`/`DOSSIER_LABELS` : on clique un mot, on retrouve ce mot.
78 px d'air avant chaque ouverture, contre 30 px auparavant.

**La barre dit où l'on est** — scroll-spy (`.atl-dnav.on`, `aria-current`)
+ rail de progression doré. Elle passe en `nowrap` + défilement horizontal
(sa hauteur ne doit jamais changer, règle déjà posée pour les onglets) et
**fait glisser la pilule active dans le champ**.

**Le repère n'est PAS décoratif : il vit dans la page, pas dans
`atelier-motion.js`** — ce module s'éteint sous reduced-motion et en
dessous de 768 px, où l'on a précisément le plus besoin de savoir où l'on
est.

**Les titres du Dossier sont passés au SCRUB** (`inkSections`, plus
`inkTitles`). La doctrine était déjà écrite — « un titre de panneau arrive
toujours en position de lecture, un titre de section vit sous le pli » —
elle ne s'appliquait simplement pas : dans le Dossier les six panneaux sont
affichés d'un coup, donc cinq de leurs titres vivent sous le pli. Le
`.dos-open` se pose de même (`--dp`, position → réversible).

### Trois destinations mortes, corrigées au passage

`activateTab` ne connaît que `lire` et `dossier` et **coerçait tout le
reste en `lire`** sans rien dire. Trois renvois tombaient donc dans la
liseuse puis sautaient en haut de page : `goExplore` (les pièces
d'exploration, appelées depuis le cheminement et par le deep-link
`#feti`), `goChrono` (la frise) et `activateTab('entrer')` dans
`showWork`. Ils nomment maintenant leur destination et leur ancre.

`dosGo()` remplace `scrollIntoView({block:'start'})` partout, **deep-links
compris** : deux barres collantes se superposent (onglets + ancres), et
`scrollIntoView` les ignore — on cliquait « Modèles » et l'on atterrissait
140 px SOUS son titre. Mesuré à 10 px de dégagement après correction.

### Trois rangs de pilules, et le rang doit rester lisible

Destinations → ancres du dossier → stations d'une section. Les trois
partagent maintenant **la même manière de dire « celui-ci »** (le dégradé
chaud + filet or du socle) : `.subtab.active` et `.xsub.active` étaient
un **aplat CRÈME** (`background:var(--ink)`), donc l'objet le plus clair de
l'écran, plus criard que le titre de la section — l'erreur exacte que le
socle sombre avait corrigée partout ailleurs.

Le rang se dit alors par **l'échelle et le repos** : au repos une station
n'a ni fond ni contour, elle s'efface dans la page. Et un petit label la
précède (« Les neuf stations », « Les trois pièces ») pour qu'on ne la
confonde pas avec la barre d'ancres, qui elle QUITTE la section.
`.formebtn` (le sélecteur de valeur, rouge) n'est pas touché : c'est le
niveau le plus profond, celui qu'on manipule vraiment, et il a le droit
d'être fort.

### Une barre de défilement horizontale, antérieure, supprimée

Le Dossier s'ouvrait avec **12 px de défilement horizontal**, à HEAD comme
après la refonte (vérifié en remisant les modifications). Cause :
`.js-atwalk .walk-cards .walk-step.right .walk-card{--from:34px}` — les
cartes de droite du cheminement ATTENDENT décalées de 34 px vers
l'extérieur et rentrent quand la déduction les allume ; tant qu'elles ne
sont pas allumées, elles débordent le serpentin, donc la page. Corrigé par
`overflow-x:clip` sur `.walk-cards` : `clip` et non `hidden`, parce que
c'est le seul mot-clé que la spec autorise à côté d'un `overflow-y:visible`
— avec `hidden`, l'axe vertical serait passé en `auto` et le serpentin de
4 433 px serait devenu une boîte à défilement. Geste vérifié intact après
coup (tracé 0 → 33 → 81 %, cartes de +34 px à 0, réversible).

### Vérifié

Sonde de contraste (18 éléments neufs, **0 échec**, minimum 5,84:1) **et**
détecteur statique (`detect.mjs` : 57 constats, **0 erreur** ; base 55 —
le delta est deux usages de Fraunces, la rime documentée). Testé à 1280 et
375 px, **zéro débordement horizontal** ; scroll-spy exact sur les six sections
et rail monotone ; scrub réversible (on remonte, tout se range) ; page
finie sans JS et sous 768 px (`--dp` par défaut à 1) ; deep-links `#labo`,
`#explore`, `#dossier` ; les cinq renvois croisés ; le tiroir emprunte et
rend `#s-jour` à sa place exacte. **Manuscrits non touché** — vérifié
(9 panneaux, un seul visible, son titre joué) : les règles CSS sont
scopées `.atl-dossier`, et le filtre d'`inkTitles` ne matche rien là-bas.

### Ce qui reste

**Le poids des sections est très inégal** : le cheminement fait 4 783 px
(42 % du Dossier) pour 742 mots — `#stair` à lui seul en fait 4 433, avec
12 marches et 11 moteurs. Rien n'a été retiré (c'est la pièce signée de la
section, et `walkDeduce` en dépend), mais si le Dossier doit encore
raccourcir, c'est là.

## La marge remise d'aplomb (mission `marge-au-propre`, sept. 2026)

Signalé par le propriétaire : « le panneau latéral droit bugue — il
n'affiche pas tout le temps les notes et les notes publiques, et parfois
des éléments qui n'ont pas de rapport avec le texte chargé ». Les deux
symptômes étaient réels, avec **trois causes distinctes**, toutes mesurées.

### 1. La marge lisait un chiffre dans une étiquette d'interface

Le nombre de notes partagées était extrait du **libellé de la pastille
flottante** (`#pubFab.textContent.match(/\d+/)`). Une interface qui lit une
autre interface : au changement de chapitre, la pastille est encore une
section en retard le temps du chargement, et la marge affichait donc — mesuré
— « Notes partagées · 4 » de la section précédente pendant que le bandeau
annonçait déjà le chapitre XI.

**`SHELL.annotations` dit maintenant lui-même ce qu'il a** :
`publicCount()`, `notesFor(work, section)` et `context()`. La marge ne
montre le compte que si `context()` désigne bien la section qu'elle
dessine — sinon elle affiche le bouton sans nombre. `publicCount()` compte
les **fils**, pas les messages : c'est déjà ce que disent la pastille et
l'en-tête du panneau, et trois chiffres différents pour la même chose dans
le même écran ne s'expliquent pas.

### 2. La marge devinait ses propres changements en comptant les `<mark>`

`watchAnnos()` observait `#readerOut` et comparait le nombre de
`mark.anno`. Trois choses lui échappaient : **modifier le texte d'une
note** n'en change aucun, **changer sa couleur** non plus, et la
**synchronisation d'un compte connecté** (`pullAll`) remplit le magasin
sans rien poser dans la section affichée. D'où « n'affiche pas tout le
temps les notes ».

**`SHELL.annotations.onChange(cb)`** : le module prévient. Il émet sur
toute écriture du magasin (un seul point de sortie, `persist()`), à
l'arrivée des notes partagées (`loadPublic`) et **au changement de
contexte** (`attach`, avant même d'avoir rechargé quoi que ce soit).
Notification différée d'un tick et dédoublonnée — un `pullAll` en pose des
dizaines d'affilée. Les deux ateliers s'y abonnent **avant** leur premier
rendu de marge.

### 3. Six chapitres sur trente-trois étaient invisibles au suivi de lecture

C'est la cause des « éléments sans rapport avec le texte chargé », et la
plus profonde. `buildChapMarks` cherchait les titres dans `h2, h3, h4`.
Or **Wikisource ne titre pas ses chapitres d'une seule façon** : plusieurs
sont composés en `<center><b>CHAPITRE VIII…</b></center>`. Et pour trois
autres, **notre plan et la traduction Roy ne portent pas le même titre** —
nous écrivons « Diverses formules du taux de la plus-value » là où la
source écrit « FORMULES DIVERSES POUR LE TAUX DE LA PLUS-VALUE ».
Mesuré avant correction : **VIII, IX, XII, XVII, XVIII** sans repère (et
XII deux fois pour deux raisons). Conséquence : on lisait le chapitre VIII
pendant que la marge, le sommaire et le bandeau annonçaient le VII — donc
un appareil critique qui parlait d'autre chose — et un clic sur ces
chapitres dans le sommaire déposait en haut de la section.

Trois correctifs, dans `chapHeadings()` / `buildChapMarks()` :
- **on accepte tout bloc court qui commence par « chapitre »**, quelle que
  soit sa balise, et l'on retient le BLOC plutôt que le `<b>` qui est
  dedans (le rectangle d'un élément en ligne est moins fiable) ;
- **`headText()` lit le titre à travers le balisage**, en posant une espace
  aux frontières d'éléments : `CHAPITRE XVII<br><br>VARIATIONS…` donne
  « chapitre xvii variations… » là où `textContent` donne
  « chapitre xviivariations… » — et un chiffre romain collé au premier mot
  n'est plus lisible (le V de VARIATIONS appartient-il au nombre ?) ;
- **repli sur le NUMÉRO** quand le titre ne correspond pas, en comparant un
  **jeton entier** (`'xvii' === 'xvii'`) et jamais une sous-chaîne — « X »
  est contenu dans « XVII ». `scrollToAnchor` reçoit le numéro pour la même
  raison.

Le tri des repères passe de `offsetTop` à la position réelle : `offsetTop`
se mesure par rapport au premier ancêtre positionné, qui n'est pas le même
pour un `<h3>` et pour un `<center>` — deux repères pouvaient se retrouver
dans le désordre et le suivi sautait en arrière.

### Vérifié

**33 chapitres sur 33 retrouvés**, dans l'ordre, sur les huit sections du
Livre I (27 avant). Suivi de lecture parcouru repère par repère sur la
section III : marge et bandeau d'accord à chaque arrêt, VIII et IX compris.
Clic sur le chapitre XVII (titre divergent) : on atterrit à 104 px de son
titre, sommaire, bandeau et marge d'accord. Compte de notes partagées
mesuré à 120 ms d'un changement de section, dans les deux sens : plus
d'écart avec la pastille. Édition d'une note, changement de couleur,
suppression : la marge suit immédiatement, sur les DEUX ateliers. Les neuf
parties des Manuscrits sont toutes retrouvées. Console sans erreur ;
`detect.mjs` inchangé (20 / 13 constats, 0 erreur).

### La règle qui en sort

**Une interface ne lit pas une autre interface.** Si une vue a besoin d'un
compte ou d'un état, c'est au module qui le possède de l'exposer — et de
dire quand il change. Le contrat de `SHELL.annotations` s'est enrichi de
`onChange`, `context`, `publicCount` et `notesFor` pour cette raison ; la
page « Mon carnet » continue d'utiliser `allNotes()`, qui reste le bon
outil pour lire tout le carnet.

## Les Manuscrits prennent la même forme (mission `manuscrits-meme-atelier`, sept. 2026)

Demande du propriétaire : « exactement la même présentation de l'atelier
pour les Manuscrits que pour Le Capital ». Portage intégral de
`atelier-texte-au-centre` + `dossier-lisible` + `dossier-clair`. Les
Manuscrits gardaient les **neuf onglets** ; ils en ont **deux**.

### Ce qui a changé de place

| avant | après |
|---|---|
| 9 onglets (Pour entrer, Sections, Parcourir, Texte intégral, Cheminement, Concepts, Explorations, Chronologie, Ressources) | **2 destinations** : Lire le texte / Le dossier |
| panneau « Pour entrer » | **le seuil** de première visite (`liremarx.manuscrits.seuil.v1`) |
| panneau « Parcourir » (accordéons à deux niveaux) | **le sommaire** (colonne de gauche) + **« En clair »** dans la marge |
| panneau « Sections » (grille + progression) | la **progression** vit dans le sommaire (`#atl3Prog`) |
| bandeau de reprise | la page **ouvre elle-même** le cahier repris |
| 5 panneaux d'appareil | **le Dossier**, cinq sections numérotées I–V |

`MAN_FLAT` est la table plate du sommaire (2 pièces d'ouverture + 9
parties des 3 cahiers) ; **`MAN_APP` est l'index partie → appareil** — la
clé est le titre tel que `MAN_STRUCT` l'écrit, source unique des titres et
des résumés. Chaque partie y trouve son instrument du laboratoire, sa
marche du cheminement, parfois son exploration. **Pas de bloc « dates »
dans la marge** : la chronologie des Manuscrits raconte l'écriture et
l'exhumation du texte, pas le contenu d'une partie — un renvoi par partie
y aurait été inventé.

### Cinq pièges de portage, tous rencontrés

1. **`.walk-step::before` existait déjà dans `manuscrits-1844.css`** (la
   pastille du fil, variante « thread »). Le CSS propre d'une page passe
   après atelier.css : on se retrouvait avec **deux pastilles par
   marche**. Règle déjà écrite pour `.work-head`, revécue ici : avant de
   réutiliser un nom de classe sur une page qui a son propre CSS, vérifier
   qu'il n'y est pas déjà pris. L'ancien bloc a été supprimé.
2. **La variante du serpentin se décidait trop tôt.** `walkDeduce`
   choisissait `walk-rungs` / `walk-cards` / `walk-thread` à l'init du
   module — or les Manuscrits construisent leur cheminement dans leur
   `DOMContentLoaded`, donc APRÈS un module en `defer`. La variante restait
   « fil » pour toujours et **le pilotage de l'ascension ne partait
   jamais**. `detect()` est appelée depuis l'abonné, et revérifie que la
   classe est encore là — la page écrit `stair.className='walk walk-rungs'`
   en clair, ce qui efface ce que le module avait posé.
3. **L'appariement partie ↔ titre dans le texte doit se faire EN TÊTE.**
   Le premier `<h2>` d'un cahier porte, collée au titre, la note de
   l'éditeur — plusieurs centaines de mots où l'on retrouve « salaire »,
   « rente foncière »… Une recherche par sous-chaîne épinglait les quatre
   parties du Premier manuscrit sur ce même titre et le suivi de lecture
   affichait « Rente foncière » dès la première page. `findMark()` cherche
   en préfixe, et ne se rabat sur la sous-chaîne que pour un titre COURT.
   D'où le champ `m` de `MAN_APP` : les intitulés du Marxists Internet
   Archive sont des titres longs entre crochets qui ne ressemblent pas aux
   titres courts de notre plan.
4. **`body.at-atelier` manquait.** Sans cette classe (que Capital porte
   dans son `<body>`), la règle qui masque les pastilles flottantes
   au-dessus de 1241 px ne s'appliquait pas : « Mes notes » et « Notes
   partagées » flottaient **par-dessus la marge** qui les redit.
5. **Les instruments basculent par `hidden`, pas par une classe.** Capital
   a des `.subpanel.active` / `.xpane.active`, les Manuscrits des `.instr`
   avec l'attribut `hidden`. `instDemo` observe désormais les deux
   attributs et son sélecteur couvre les trois familles.

### Ce que le dossier a gagné au passage

- **L'ascension** (`walk-rungs`) : six marches qui ne montrent au repos que
  leur rang, leur cahier et leur titre ; le **ressort** — ce qui force le
  passage à la suivante — n'apparaît que sur la marche où l'on est.
- **Les instruments s'ouvrent sur quelque chose.** L'anatomie affichait
  « Touchez une séparation pour la déplier » et la carte « Touchez un
  concept » : deux états vides qui ne montrent rien. Ils s'ouvrent
  maintenant sur leur premier nœud (la première séparation, le concept
  central), et une `.inst-cue` de cinq mots dit qu'on peut en changer.
- **Deux images d'archive dans la chronologie**, et seulement là où elles
  sont le sujet : `marx-jeune.jpg` ouvre « L'écriture » (Marx à l'époque
  parisienne, c'est-à-dire au moment même des cahiers) et
  `manuscrit-ideologie-1846.webp` ouvre « La postérité » (une page
  manuscrite de sa main, ce qu'on a exhumé en 1932). Les trois autres
  sections n'en reçoivent pas : rien dans le fonds ne dit « la
  maturation ».
- **Les ressources en bibliographie.** Au passage, les badges disaient la
  SOURCE (« France Culture · Les Chemins de la philosophie ») et écrasaient
  la colonne du titre : le badge dit la nature, la source descend dans la
  ligne de méta.
- **Le renvoi « Cheminement → » de la barre de lecture a été retiré** : la
  marge porte « Où l'on en est », qui mène à la même marche et la nomme ;
  le bouton coûtait une rangée à une barre qui en tient déjà quatre.
- **La barre des deux destinations est le SÉLECTEUR SEGMENTÉ de Capital**,
  aux mêmes valeurs (44 px de haut, pilules à 999 px, `7px 17px`, l'actif
  sur le dégradé chaud à filet or). Les Manuscrits gardaient le filet de
  2 px sous l'onglet actif : il était fait pour neuf onglets, à deux il
  laissait deux mots nus dans le vide. Ces règles vivent dans le `<style>`
  de CHAQUE page et non dans atelier.css — à spécificité égale (0,3,1
  pour `nav.tabs.worktabs .tab`), c'est la feuille de la page qui gagne, et
  le socle ne peut pas les corriger de l'extérieur.

### atelier.css devient vraiment le système de record

Quatre composants vivaient dans le `<style>` de `capital-1.html` et sont
montés dans `atelier.css` le jour où les deux ateliers ont pris la même
forme : **l'ascension** (`.walk-rungs` / `.wk-*`), **l'amorce**
(`.inst-cue`, `.inst-pulse`), **la bibliographie** (`.rss-*`) et **la bande
photographique** (`.x-real`). Le CSS local des ressources a été supprimé
des DEUX pages. C'est la règle du projet, et la duplication en tête de page
est exactement ce qui avait fait diverger les deux ateliers la première
fois.

### Vérifié

Sonde de contraste sur le rendu : **0 échec** — 140 mesures dans le
Dossier (minimum 5,12:1), 50 dans le sommaire et la marge (minimum
6,44:1). Détecteur statique : **13 constats, 0 erreur** sur les Manuscrits,
**20 constats, 0 erreur** sur Capital (inchangé). Testé à 1280 et 375 px,
zéro débordement horizontal ; console sans erreur sur les deux pages.
Chargement du texte, **suivi de lecture** (Salaire → Profit → Rente → Le
travail aliéné, réversible), sommaire, marge des neuf parties, **tiroir**
sur les trois espèces de nœud avec retour à la place exacte, plein écran,
seuil de première visite et ses trois portes, deep-links `#labo`,
`#anatomie` (hérité), `#deriv`, renvois croisés, clavier (focus, Entrée,
parcours de tabulation), ascension pilotée au défilement et réversible sur
**les deux** ateliers.

### Ce qui reste

La barre de lecture tient sur **quatre rangées** dans la colonne du milieu
(182 px de coquille collante) — sur les deux pages, à l'identique : c'est
le comportement partagé de reader-tools à cette largeur, pas une
régression du portage. Si on veut le corriger, c'est dans reader-tools et
pour les deux ateliers à la fois. (La note de la mission
`atelier-texte-au-centre` annonçait deux rangées : c'était vrai avant que
la colonne ne se resserre.)

## Le Dossier se parcourt, il ne se lit plus (mission `dossier-clair`, sept. 2026)

Demande du propriétaire, dans la foulée de `dossier-lisible` : « trop de
texte, notamment explicatif — donner du sens par l'usage, les images,
l'animation, une révélation au scroll singulière ». Diagnostic mesuré
avant de toucher au code :

| | avant | après |
|---|---|---|
| Le Dossier | 11 209 px · 2 084 mots | **7 283 px · 1 420 mots** |
| I Le cheminement | 4 831 px · 745 mots | **1 639 px · 298 mots** |
| V Les ressources | 1 346 px | **995 px** |

Trois arbitrages du propriétaire au lancement (les trois recommandations) :
une marche ouverte à la fois ; l'instrument se démontre au lieu de
s'expliquer ; des images **seulement là où elles portent le sens**.

### I. L'ascension se gravit (`.walk-rungs`)

Douze cartes en zigzag répétaient **trente-six fois** les trois mêmes
rubriques. C'est maintenant **une colonne**, un fil à gauche, douze
marches qui ne montrent au repos que leur rang, leur nom et **ce que la
catégorie pose** ; la contradiction et le passage n'apparaissent que sur
la marche où l'on est.

- **Le pli vit dans `capital-1.html`, PAS dans `atelier-motion.js`** : ce
  n'est pas du mouvement mais une affordance, et il doit fonctionner là où
  le module s'éteint (reduced-motion, < 768 px) — c'est même là qu'il sert
  le plus. `walkOpen(n, seize)` est l'entrée unique ; le module ne fait que
  déplacer l'ouverture au défilement.
- **`walkSeized` — on lâche le pilotage dès que le lecteur saisit** : au
  clic, et aussi au **focus clavier** dans la colonne. Sans ce second cas,
  le défilement refermait sous les yeux d'un lecteur au clavier la marche
  qu'il était en train de lire.
- **Le repli sort vraiment le texte de l'arbre d'accessibilité**
  (`visibility:hidden` en fin de transition, pas seulement une hauteur
  écrasée) : sinon un lecteur d'écran lirait ce que l'œil ne voit pas, et
  les liens des marches fermées resteraient dans le parcours de tabulation
  (vérifié : 14 boutons atteignables, 14 hors d'atteinte).
- **La ligne de lecture, pas le front du fil** : la marche ouverte se
  choisit à 38 % de la hauteur. Mesuré contre `--draw`, la dernière marche
  se dépliait bien avant qu'on l'atteigne — le fil court en avance sur
  toute la section.
- **Les trois rubriques deviennent deux marques DESSINÉES** (opposition,
  passage) doublées d'un `.sr-only` : le libellé survit pour les lecteurs
  d'écran, il ne mange plus la page.
- **La pastille dit le rang ET l'état** : anneau quand la marche est
  fermée, pleine sur celle où l'on est. Elle n'est **pas** estompée — à
  62 % d'opacité le chiffre tombait à 2,6:1 sur les dernières marches. Et
  `stairColor` arrive sur le rouge de la maison (`#d5402f`) et non sur le
  brique sombre d'avant : la pastille pleine porte du blanc.
- Le tiroir emprunte toujours une marche (`openDrawer('step', n)`) et l'y
  affiche **toujours dépliée** — le CSS le force, et `aria-expanded` suit.
  `goDeriv(n)` ouvre la marche demandée **et prend la main**.

### Les instruments se démontrent (`instDemo`)

Les **treize pavés « Comment lire »** (461 mots) ont disparu. À leur
place : une `.inst-cue` impérative de cinq à huit mots, et une
**démonstration** — à l'arrivée dans la station, le curseur principal part
et revient (1,15 s), les chiffres suivent, puis l'instrument est **reposé
sur sa valeur d'origine**. Une station sans curseur voit ses commandes
s'allumer l'une après l'autre (`.inst-pulse`) : on ne clique jamais à la
place du lecteur.

Trois règles, chacune tirée d'un défaut évité : **une fois par station**
(une démonstration qui se rejoue est un tic) ; **le lecteur passe avant**
(premier geste souris/clavier/molette → arrêt net et station marquée
prise) ; **la valeur est rendue**, y compris par un filet si le rAF est
bridé. Et le déclencheur est **scopé à sa section** (`playIn(sec)`) :
mesuré, un `playActive()` global démontrait la pièce des Explorations
pendant qu'on entrait dans le Laboratoire.

### II. La frise se remplit dans le sens du temps (`chronoUnfold`)

La révélation propre à la chronologie, et elle **répond** à celle du
cheminement : là un fil descend et éclaire chaque catégorie, ici une ligne
avance de 1450 vers 1867 et pose chaque événement au passage. Ce n'est pas
la même animation recopiée — c'est la thèse du dossier (l'ordre logique et
l'ordre historique sont deux faces du même mouvement) dite deux fois.

Chaque couche a **sa propre avance** (`--fill` calculé depuis le
`left`/`width` en pourcents que la page a posés) : un `scaleX` commun
aurait fait démarrer les deux bandes d'acte ensemble depuis leur bord
gauche. Et le seuil des pastilles porte une marge (`p * 1.08`) : sans
elle, 1867 — à l'extrémité droite — restait éteinte pour de bon.

### IV. Les images, et seulement là où elles sont le sujet

Le dossier n'avait **aucune** image. Les trois stades du machinisme en ont
une chacun, sous la scène dessinée : le dessin donne la structure, la
photographie donne le fait, et les deux changent ensemble
(`.x-real`, données `img`/`alt`/`leg` dans `COOP`).
**Coopération → `halles-paris.jpg`** (le même travail complet, côte à
côte), **Manufacture → `manufacture.jpg`**, **Grande industrie →
`filature.jpg`**. Le premier stade est **dans le HTML avec son `src`** :
une image sans src est une image cassée si le script ne tourne pas.
⚠️ `manufacture.jpg` reste la seule dont la licence est « à confirmer »
(déjà noté plus haut, déjà en ligne sur les Manuscrits) : aucune mention
de licence n'est affichée sous elle, seulement « Manufacture, XIXᵉ siècle ».

Les autres sections n'en ont pas reçu, **volontairement** : aucune image du
fonds ne dit l'expropriation des campagnes anglaises, et une photographie
de 1909 sous « Acte I — 1450-1750 » aurait été du décor.

### V. Les ressources sont une bibliographie, pas douze cartes

Douze cartes de même taille dans une grille — le conteneur par défaut, qui
donnait à une conférence d'une heure le même poids visuel qu'à une autre.
C'est une **liste de références** : deux colonnes de lignes réglées, titre
à gauche, nature à droite, source dessous, le filet qui prend l'or au
survol. −351 px, et c'est plus scannable.

### Ce qui a été coupé, et où c'est passé

- Les deux `.method-note` de tête. Celle du cheminement (« ordre
  d'exposition ≠ ordre de recherche ») disait ce que la section démontre ;
  celle de la chronologie est passée dans son lede, qui nomme les deux
  actes. La phrase du « passage de relais » entre les deux actes est
  **supprimée** — la frise le montre par ses deux bandes.
- Les treize `.csub` (« Les six notions de cette station », 99 mots qui ne
  disaient rien).
- Les cinq ledes, ramenés à ≤ 14 mots. Celui des Explorations disait
  **« Deux pièces »** alors qu'il y en a trois : erreur corrigée au passage.
- Vestiges CSS retirés de `capital-1.html` : `.step*`, `.field-block`,
  `.motor`, `.stairmap*`, et tout le serpentin en zigzag.

### Vérifié

Sonde de contraste sur le rendu : **0 échec sur 317 mesures**, minimum
4,52:1 (deux défauts trouvés et corrigés au passage : la pastille de marche,
et `.cc-formula` qui portait l'accent pur de sa carte — 3,33:1, treize fois
dans le dossier, relevé vers l'encre par `color-mix` avec repli).
Détecteur statique : **20 constats, 0 erreur** — le niveau d'avant la
mission. Testé à 1280 et 375 px, zéro débordement horizontal ; console
sans erreur ; deep-links `#labo`, `#chrono`, `#explore` et les quatre
renvois croisés ; tiroir qui emprunte et rend la marche à sa place exacte ;
clavier (focus, Entrée, parcours de tabulation) ; **Manuscrits non touché**
(vérifié : `walk-thread`, `--axis:8px`, son `.howto` intact).

### Deux pièges d'outillage ajoutés à la liste

1. **La sonde de contraste doit savoir lire `color(srgb …)`.** Depuis
   `color-mix()`, `getComputedStyle().color` peut rendre
   `color(srgb 0.75 0.70 0.61)` : une sonde qui parse les nombres comme du
   0-255 lit du noir et déclare 29 faux échecs.
2. **Une sonde qui filtre sur `getClientRects()` voit le texte replié** :
   `visibility:hidden` garde des rects. Il faut remonter les ancêtres et
   écarter `visibility:hidden`, `display:none` et `opacity:0` — sinon on
   « corrige » le contraste d'un texte que personne ne voit.
3. Rappel : dans la pane masquée, **les animations CSS aussi sont gelées**
   (pas seulement les transitions) — un panneau resté à `opacity:0` n'est
   pas un bug de cascade. Neutraliser `animation` ET `transition` avant de
   mesurer.

### Le Dossier n'a plus de section « Pour entrer » (sept. 2026)

Demande du propriétaire. La section I du Dossier redisait **mot pour mot**
les trois idées du seuil de première visite : deux surfaces pour le même
contenu, à trois clics l'une de l'autre. Elle est supprimée, et le Dossier
compte **cinq** sections numérotées I–V (cheminement, chronologie,
laboratoire, explorations, ressources).

Ce qui a bougé avec elle :
- **Les trois cartes n'ont plus qu'UN emplacement, le seuil** : le
  `.cap-ideas-grid` a été DÉPLACÉ dans `#atlSeuil` (il y était jusque-là
  `cloneNode`é depuis `#entrer` à chaque première visite). `showSeuil()` ne
  clone donc plus rien, et `#atlSeuilIdeas` n'existe plus. Les trois
  destinations (`goLabo('s-jour')`, ch. I, ch. VI) sont intactes.
- `DOSSIER`, `DOSSIER_LABELS` et `DOSSIER_ROM` perdent leur première
  entrée — la source unique de l'ordre reste `DOSSIER`.
- `#entrer` n'est plus une ancre valide : `tabForHash` rend `null`, comme
  pour n'importe quel hash inconnu. Vérifié qu'aucun lien du dépôt ne le
  visait (les Manuscrits gardent LEUR panneau `#entrer`, intouché).

**Le geste du révélateur a dû changer de nature** (`developIdeas`,
atelier-motion.js). Les cartes vivaient dans une page qui défile : leur
tirage était **scrubbé**. Dans le seuil, il n'y a aucun défilement sous
elles — l'écran s'affiche au chargement, en position de lecture, et se
referme au premier clic : scrubbées, elles seraient restées **à demi
tirées pour de bon**. C'est exactement la règle déjà écrite pour le titre
de panneau et le bandeau de départ. Les cartes du seuil ont donc une
**entrée orchestrée** (1,4 s, décalage 0,14, filet à 2,6 s qui pose tout à
1 si le rAF est bridé), jouée quand `.atl-seuil` perd son `hidden`
(MutationObserver) ; le scrub reste pour les cartes qui vivent dans une
page qui défile — celles des Manuscrits.

**Vérifié** : Dossier à cinq ouvertures I–V, barre d'ancres alignée,
deep-links `#labo`/`#ressources` (saut instantané, dégagement sous les deux
barres collantes), seuil de première visite à 1280 px (trois cartes, zéro
débordement horizontal, tirage complet), clic d'une carte → seuil refermé,
marqué vu, laboratoire ouvert. Console sans erreur ; `detect.mjs` :
**0 erreur**.

**Le rappel qui vaut pour toute la page** : dans la pane masquée
(`document.hidden`), `innerWidth`/`innerHeight` valent **0** — tout calcul
de scrub rend alors 0 et l'on croit à un bug. `resize_window` avec une
taille explicite rend un vrai viewport, et c'est la seule façon de mesurer
ces gestes ici. S'y ajoutent les pièges déjà connus : rAF gelé (une sonde
temporaire est obligatoire), `behavior:'smooth'` qui ne progresse pas, et
les captures noires sur un document très haut (masquer les sections
voisines pour ramener la zone en haut de page).

## L'en-tête d'œuvre et la barre plate (mission `entete-et-barre-plate`)

> **PARTIELLEMENT SUPERSÉDÉ sur Capital** par `atelier-texte-au-centre`
> (sept. 2026) : l'en-tête d'œuvre reste tel quel, mais la barre ne compte
> plus neuf onglets — elle en compte **deux** (Lire le texte / Le dossier).
> Cette section décrit encore fidèlement les **Manuscrits**.

Diagnostic mesuré avec le propriétaire : **77 % du premier écran passait
avant le moindre contenu** (héros 394 px + deux rangées d'onglets 85 px,
premier contenu à 556 px sur 720). Et l'en-tête était une AFFICHE pour un
livre que le lecteur venait de choisir dans la bibliothèque : fil
d'Ariane doublonnant la sidebar, pastille au-dessus du titre, accroche
publicitaire qui n'était **pas le nom du livre** (celui-ci n'apparaissait
en grand nulle part), chapô de vente, bouton doublé par le tableau de
bord, et la page de titre de 1867 en 280 px — l'image que la
bibliothèque montrait déjà sur sa carte.

**Deux arbitrages du propriétaire :**

1. **L'en-tête, c'est l'identité de l'œuvre et rien d'autre.**
   `.work-head` : « Le Capital » en Fraunces 900 + « Livre premier » en
   italique rouge (le motif `h2.sec em` de la maison), puis UNE ligne de
   métadonnées (auteur · année · traduction · domaine public). ~139 px.
   Pas de bouton : le tableau de bord juste dessous porte l'action.
   **`body.at-inner` ne pilote plus rien** — il repliait le héros, qui
   n'existe plus ; l'en-tête est à sa taille définitive sur les huit
   panneaux, donc plus de saut entre onglets.
2. **Une seule rangée d'onglets, collante** (`#worktabs`), avec les
   destinations à plat — **exactement celles que la sidebar liste**
   (neuf depuis que « Pour entrer » a son panneau). Le niveau « groupe » (Lire / Atelier / Ressources) a disparu :
   il coûtait une rangée, un clic de plus pour atteindre un panneau, et
   il portait un DOUBLON — `#atelier-accueil` refaisait la table des
   matières de « Parcourir », avec son propre widget de progression.
   Panneau supprimé.

Résultat mesuré : premier contenu à **30 % du premier écran** au lieu de
77 %.

**La mécanique s'en trouve très simplifiée** : `GROUPS`, `curPanel`,
`panelTop`, `activateTop` et `#subnav` n'existent plus. Il reste
`PANELS[]` (id + label), `buildTabs()` qui rend la barre UNE fois, et
`activateTab(id)` comme entrée unique. `SHELL.tabs` n'a plus besoin
d'être rejoué à chaque bascule (c'est `#subnav`, reconstruit en
innerHTML, qui l'imposait) — mais il le reste, c'est sans effet.
Le hash ne peut plus désigner un « groupe » : l'ambiguïté qui faisait
ouvrir la page de garde quand on demandait `#lire` a disparu avec eux.

**La barre ne se replie JAMAIS sur deux lignes** : `flex-wrap:nowrap` +
défilement horizontal. Sa hauteur doit rester constante (44 px), sinon
la page saute sous le curseur d'un onglet à l'autre — c'est le défaut
déjà corrigé du temps des deux rangées, qui revenait par la fenêtre dès
qu'un neuvième onglet ne tenait plus.

**« Pour entrer » est un panneau, plus une section de l'accueil**
(mission `section-pour-entrer`) : les trois idées sont trois portes vers
le livre, l'accueil dit où l'on en est. Le panneau suit la grammaire
commune (`.panel-head` > `h2.sec` + `.lead`), donc son titre prend
l'encre à l'ouverture comme les autres.

**Piège rencontré** : `nav.tabs` (atelier.css) centre son contenu, et
`.work-head` en héritait — titre à gauche, métadonnées au milieu. Poser
`text-align:left` explicitement sur l'en-tête et `justify-content:
flex-start` sur la barre.

**Porté sur les Manuscrits** (mission `manuscrits-meme-structure`), avec
trois différences dictées par l'œuvre :
- la ligne d'identité dit **« écrits en 1844, publiés en 1932 »** — ce
  n'est pas une coquetterie de notice : le texte est resté inconnu 88 ans,
  et c'est ce qui lui donne sa place à part dans le corpus ;
- **« Sections » et « Parcourir » ne doublonnent PAS ici**, contrairement
  à Capital où `#atelier-accueil` refaisait `#nav` : le premier liste les
  trois cahiers avec la progression, le second donne le plan détaillé
  partie par partie. Les deux panneaux restent, la barre en compte neuf ;
- le lede de « Sections » dit désormais que **du deuxième cahier il ne
  subsiste qu'un fragment** — le lecteur voyait « Manuscrit II · 1 partie »
  sans savoir que la lacune est celle du manuscrit, pas de l'édition.

**Piège rencontré au portage** : `manuscrits-1844.css` définissait déjà un
`header.work-head{text-align:center}` — vestige d'un en-tête disparu (ses
classes compagnes `work-kicker`/`work-sub` n'étaient plus dans le HTML).
Sa spécificité (0,1,1) recentrait le nouvel en-tête quoi qu'on écrive
dans la page. Règle supprimée. **Avant de réutiliser un nom de classe sur
une page qui a son propre CSS, vérifier qu'il n'y est pas déjà pris.**

## L'accueil a disparu, la reprise est montée (mission `reprise-en-bandeau`)

> **SUPERSÉDÉ sur Capital** par `atelier-texte-au-centre` : le bandeau de
> reprise n'existe plus. La page ouvre elle-même le chapitre où l'on s'était
> arrêté — un bandeau qui l'annonce, au-dessus du chapitre déjà ouvert,
> n'aurait fait que le redire. `SHELL.resume` est inchangé et sert toujours,
> lu par `bootAtelier()`.

Suite logique du tableau de bord et de la sortie de « Pour entrer » : à
force de bien répartir, **l'accueil s'était vidé**. Inventaire fait avec
le propriétaire de ce qu'il disait encore en propre :

- l'identité de l'œuvre → elle est dans l'en-tête ;
- les trois portes → elles ont leur panneau (« Pour entrer ») ;
- la progression → elle est dans « Parcourir », où elle sert ;
- le carnet → il a sa page, et son entrée de sidebar ;
- l'incipit → il accueillait le nouveau venu, mais c'est « Pour entrer »
  qui fait ce travail désormais, avec trois portes au lieu d'une phrase ;
- **la reprise** → la seule chose qu'aucun autre endroit ne donnait.

Deux boutons du tableau de bord doublonnaient d'ailleurs la navigation
(« Parcourir les chapitres → » = l'onglet Parcourir ; « Ouvrir mon
carnet → » = l'entrée de sidebar).

**Arbitrage du propriétaire : le panneau est supprimé, la reprise monte
en bandeau** (`.resume-band`, `renderResumeBand()`), posé entre
l'en-tête et la barre d'onglets — donc **hors des panneaux, visible
depuis n'importe quel onglet**, alors qu'il était jusque-là caché
derrière celui qu'un lecteur qui revient ne rouvre pas. Rien ne
s'affiche s'il n'y a rien à reprendre : pas de bandeau qui s'excuse
d'être vide. La page s'ouvre désormais sur « Pour entrer ».

`renderResume()` reste l'alias appelé après `installShell` et à chaque
changement de session. Sous 640 px le titre du chapitre s'efface (son
numéro suffit) : sans quoi le bandeau se dépliait sur trois lignes et
repoussait le contenu de 156 px.

## L'accueil de l'atelier — le tableau de bord (mission `atelier-tableau-de-bord`)

Diagnostic posé avec le propriétaire (« là ça ne va pas ») : le panneau
d'accueil **disait trois fois la même chose**. « Commencer la lecture »
existait en trois exemplaires — le bouton du héros, l'onglet
« Commencer », et le titre + bouton de la première section ; « Aller
plus loin » doublonnait l'onglet Ressources exactement comme le bloc
« Rejoindre → » qu'on venait de retirer ; et le seul contenu propre du
panneau, c'étaient les trois idées. Le reste était de la navigation
déguisée en contenu, par-dessus trois navigations concurrentes (6
onglets + 8 entrées de sidebar).

**Arbitrage du propriétaire : le panneau devient un TABLEAU DE BORD.**
Il ne route plus — la barre d'onglets et la sidebar s'en chargent — il
dit OÙ L'ON EN EST. Deux états, tous deux nourris de données réelles :

- **Qui arrive** (rien en mémoire) : le livre s'ouvre par sa PREMIÈRE
  PHRASE (`INCIPIT`, en dur — pas de fetch : la page d'accueil ne doit
  pas dépendre du réseau), sourcée, plus une ligne disant que
  progression et notes s'afficheront ici. **Aucun bouton « commencer »**
  — le héros le porte à trois centimètres au-dessus.
- **Qui lit déjà** : trois cartes — la reprise (`SHELL.resume`), la
  progression (`SHELL.progress`, chiffrée seulement si la session est
  ouverte, sinon on dit pourquoi), et le carnet (les surlignages, avec
  les trois derniers passages et la pastille à la couleur du
  surlignage).

**Règle tenue : on n'affiche jamais une ligne qu'on ne peut pas
remplir.** La progression demande un compte, les notes et la reprise non
(localStorage) — chaque carte le dit dans son propre état vide au lieu
de montrer un zéro.

**`SHELL.annotations.statsFor(work)`** a été ajouté pour ça : le module
possède le contrat de stockage, c'est donc LUI qui le lit et le résume
(`{count, sections, withNote, latest[3]}`) — la page ne parse jamais le
localStorage elle-même, sinon la forme du store vivrait à deux endroits
qui divergeraient.

`renderResume()` reste comme alias de `renderDashboard()` : c'est le nom
que rappellent `installShell` et les changements de session.
`syncProgUI()` ne pilote plus de carte « Ton parcours » (disparue) et se
contente de re-rendre le tableau.

**Fait sur Capital seulement** — les Manuscrits gardent l'ancien
accueil ; à porter quand la forme est validée.

## Les pages d'atelier — le mouvement (mission `ateliers-mouvement`)

Demande du propriétaire : « styliser et animer les blocs et sections des
ateliers, au même niveau que la page d'accueil — le scroll peut et doit
jouer un rôle », avec une exigence qui commande tout : **« il faut
qu'elles soient pertinentes vis-à-vis de ce qu'elles expriment »**. Aucun
mouvement décoratif : chaque geste dit ce que sa section dit. Références
citées : l'accueil du site, et zonixlab.com (dont le motif « journey »,
une lumière qui parcourt un tracé, est en keyframes CSS pures — même
contrainte que nous, et nous en avions déjà l'équivalent maison avec le
curseur-comète du circuit).

**`oeuvres/atelier-motion.js`** (chargé `defer` par les deux pages) porte
le vocabulaire de `assets/home.js` : pilote de défilement par POSITION
(donc réversible), défaut CSS posé, filet sur toute entrée temporelle.
**Le pilote est DUPLIQUÉ, pas partagé** — home.js ne se charge que sur
l'accueil, et la règle maison est de dupliquer les petits outils plutôt
que de coupler. Les classes `js-at*` sont posées par le module, jamais
écrites dans le HTML ; le CSS vit en fin d'`atelier.css`.

**Le rythme de sections** (mission `accueil-aere`, dans la foulée) :
l'accueil de l'atelier empilait des blocs serrés sans titres — on ne
savait pas où l'on était. Il prend le rythme de l'accueil du site :
`.at-sec` (56–84 px d'air entre sections) > `.at-sec-label` (capitales
or) + `.at-sec-h` (Fraunces 900) + `.at-sec-lede`. Trois sections
nommées : « Le texte », « Pour entrer », « Aller plus loin ».
**Le bandeau de départ a perdu son titre interne** : un titre par
section, pas deux. Et le bloc « Lecture guidée — Rejoindre → » a été
**supprimé des deux pages** : il doublonnait l'onglet « Parcourir » /
« Sections » de la barre, à deux rangées au-dessus. « Aller plus loin »
est devenu une bande pleine largeur (`.at-more`) plutôt qu'une demi-carte
orpheline.

**Les gestes, et ce qu'ils disent** :
- `inkTitles` — le titre de section PREND L'ENCRE : on est dans un
  atelier d'écriture. Joué à l'OUVERTURE du panneau, une fois.
- `startBand` — le bandeau de départ S'ALLUME, la lueur montant du bas
  (une bougie n'éclaire pas du plafond) : on arrive au bureau.
- `developIdeas` — les trois idées passent au RÉVÉLATEUR : ce sont des
  tirages d'archive, l'image vient au bain sous la barre dorée
  (échelonnée de 0,14), et l'idée apparaît avec elle. Le geste du
  catalogue de l'accueil, ici sur la même matière.
- `poseBlocks` / `poseParts` — les blocs SE POSENT comme des feuillets
  sur le bureau. `poseParts` tient ce rythme sur tous les panneaux
  (howto, instruments du labo, ccard, ressources, frise) pour que
  l'atelier ait UNE respiration et non cinq.
- `walkDeduce` — le cheminement SE DÉDUIT : le fil descend, sa tête
  éclaire ce qu'elle atteint, et rien n'existe devant elle. C'est
  littéralement ce que dit la section (« chaque catégorie révèle une
  contradiction qui rend la suivante nécessaire ») : une marche ne
  s'allume que quand la déduction l'atteint, le moteur n'apparaît qu'au
  moment de pousser.
- `tocInscribe` — le sommaire S'INSCRIT ligne à ligne : c'est le plan du
  livre qui s'écrit.
- `inkSections` — les titres de SECTION s'écrivent au défilement. Même
  encre qu'`inkTitles`, autre déclencheur : un titre de section vit sous
  le pli, on l'atteint en descendant — c'est un vrai scrub réversible, là
  où un titre de PANNEAU apparaît toujours en position de lecture (d'où
  son entrée orchestrée). Le petit label le précède d'un souffle.

**Ce que la mesure a imposé — à ne pas re-tenter en scrub** : sur une
page à ONGLETS, le titre de panneau et le bandeau de départ sont
TOUJOURS en position de lecture au moment où ils apparaissent (mesuré :
`--wp` saturait à 1 dès la bascule, `--lum` partait à 0,94). Scrubbés,
ces deux gestes ne se seraient JAMAIS vus. Ils sont donc des entrées
orchestrées, déclenchées par l'ouverture du panneau. Le scrub reste pour
tout ce qui vit sous le pli.

**Trois pièges propres à ces pages** :
1. **Un panneau inactif est en `display:none`** : ses éléments mesurent 0
   et ne doivent RIEN recevoir — d'où `shown()` (`getClientRects().length`,
   le test qui ne ment pas sur un ancêtre masqué) avant toute écriture.
2. **Un panneau qui s'ouvre apparaît à sa place définitive sans qu'aucun
   défilement n'ait lieu** : c'est « le piège de la mesure unique » de
   l'accueil, rejoué à CHAQUE clic d'onglet. Un `MutationObserver` sur la
   classe des panneaux remesure (et rejoue les titres) — on observe la
   classe plutôt que de se brancher sur `activateTab`, qui n'a pas le
   même code sur les deux pages.
3. **Les deux serpentins de cheminement sont différents** : sur Capital
   la marche est une CARTE à côté d'un axe central, sur les Manuscrits
   elle EST le bloc le long d'un fil à gauche. La variante se pose en
   classe (`walk-cards` / `walk-thread`) — jamais en `:has()`. Et la
   position de chaque marche se mesure SUR L'AXE, jamais par un
   échelonnement d'index : les cartes n'ont pas la même hauteur, un
   décalage régulier allumerait des marches que le fil n'a pas atteintes.

Vérifié à la sonde (le rAF est GELÉ dans un onglet piloté — sans elle on
croit à tort que rien ne bouge) : scrub réversible et progressif sur les
deux pages, bascule d'onglet, interpolation CSS, et à 375 px aucune
classe `js-at*` — la page s'affiche finie.

## Les pages d'atelier — la passe moderne (mission `atelier-moderne`)

Demande du propriétaire : « une page stylisée pour l'atelier lui-même —
moderne, clair, pratique, esthétique ». Refonte de mise en page DANS la
DA sombre-chaude (pas un nouveau monde visuel), les deux pages.

- **Grammaire de tête de panneau** (`.panel-head`, atelier.css) : titre
  Fraunces + lede italique à gauche, méta compacte à droite
  (`.pg-prog`/`.pg-bar`/`.pg-count`), filet dessous. Les NEUF panneaux
  des deux pages l'utilisent. Les anciens en-têtes géants (`.atl-header` :
  fil d'Ariane doublon + badge + titre 3,4 rem + « 0 % » en 3,2 rem) sont
  SUPPRIMÉS — le héros replié porte déjà fil d'Ariane et titre. Le
  pourcentage vit dans le compte (« 12 sur 33 chapitres · 36 % »), plus
  jamais en chiffre géant.
- **La table des matières** : les grilles de cartes chapitre (#navlist /
  #atlNavlist sur Capital, #man-grid sur Manuscrits) sont des LISTES de
  sommaire — numéro en Fraunces italique or (le traitement des années de
  la frise), titre, simulation associée et statut à droite, sections en
  capitales or. Le chapitre en cours est la SEULE carte de la liste
  (dégradé chaud d'emphase du socle). « Lu » est aussi le bouton qui
  dé-coche. Les gabarits de ligne vivent dans `renderAtlList` (Capital)
  et `renderAtlGrid` (Manuscrits) ; la mécanique passe par les CLASSES
  (`.atl-continue`, `.atl-done-toggle`, `data-part`) — les garder.
- **Le bandeau de départ** (`.cap-start`) remplace les deux cartes
  jumelles à icône de « Commencer » : une seule surface au dégradé chaud,
  texte + reprise + bouton à gauche, « Ton parcours » (#capProgCard /
  #manProgCard, contrats JS inchangés) à droite derrière un filet.
- **Grammaire des encarts** : plus de filet latéral 3 px (le tell des UI
  générées) sur les encarts/cartes — liseré fin 1 px de leur teinte,
  rayon 12. EXCEPTION : les citations (`.pull`, `.acc-exergue-q`) gardent
  leur filet de gauche, c'est une règle typographique ; la légende de
  graphique aussi (échantillon de trait).
- **Pilules et rayons** : `.btn` et `.formebtn` en pilule (la forme
  committée) ; grandes surfaces du laboratoire à 16, piste chrono 12,
  compbar 10. « Comprendre les concepts » rejoint les labels de section
  en capitales or.

**Pièges de cette mission :**
1. **Deep-link `#labo` cassait toute la page Capital** : `activateTop`
   appelait `drawTRPF()` au boot, AVANT le `const re0` du même bloc
   script (TDZ) — l'exception tuait tout le reste du script. L'appel est
   différé d'un tick (`setTimeout(drawTRPF,0)`). Tout nouveau rendu
   déclenché par `syncTabsA11y`/`activateTop` au boot doit se méfier des
   `const` déclarés plus bas dans le bloc.
2. **Le pane sert des pages ENTIÈRES périmées**, pas seulement le CSS :
   même `navigate force` + serveur no-store peut rendre une édition en
   retard, et les captures après re-navigation same-URL montrent l'état
   d'avant. Buster l'URL de la page (`?cb=n`, une valeur NEUVE à chaque
   chargement) et vérifier au DOM (`getBoundingClientRect`,
   `getComputedStyle`) plutôt qu'à la capture avant de conclure à un bug.
3. Le sélecteur `.atl-done .atl-card` (Manuscrits) ne matchait rien : les
   lignes « lu » n'étaient pas cliquables — corrigé en
   `.atl-card.atl-done`, et les lignes portent role="link" + tabindex +
   Enter/Espace comme sur Capital.

### Le diagnostic est SOLDÉ (fin août 2026)

Le rapport `.impeccable/critique/2026-08-28…` (16/40, 3 P0, 13 P1) est
entièrement traité — vérifié point par point en fin de mission
`finitions-diagnostic` : P0 par `ateliers-accessibilite`, architecture et
en-têtes par `ateliers-architecture` + `atelier-moderne`, cartes « Trois
idées » par `trois-idees-cliquables`, et les mineurs au fil de l'eau
(lang="de" jusqu'à l'infobulle du glossaire, catégories de recherche à
~6,2:1, barre du haut en deux rangées sous 375 px, mode focus liseuse à
.55 révélé au clavier, message d'échec réécrit). **Les libellés
divergents entre œuvres (« Chapitres/Modèles » vs « Sections/Concepts »)
sont un CHOIX éditorial** — le vocabulaire suit la matière de chaque
livre — pas un défaut de cohérence : ne pas les « harmoniser ». Ne pas
rouvrir ce rapport ; un nouvel audit partirait de zéro.

## Les pages d'atelier — accessibilité (mission `ateliers-accessibilite`)

Mission demandée après le socle sombre : « c'est l'endroit où les
utilisateurs vont passer le plus de temps, il faut une UI UX parfaite, une
accessibilité parfaite, et retravailler la position des éléments. »
**Ce commit ne traite que l'accessibilité** — le propriétaire a arbitré
l'ordre. L'architecture et le placement (héros qui se replie, navigation
unifiée, état d'URL, barre de lecture collante, reprise de lecture) restent
à faire dans une mission dédiée, et le diagnostic est déjà écrit :
`.impeccable/critique/` (16/40 aux heuristiques de Nielsen, non versionné).

**Arbitrages du propriétaire, à ne pas rouvrir sans lui :**
1. **Wikisource est la source du texte intégral, et la seule.** Les 33
   fichiers `oeuvres/capital-1/textes/ch*.html` étaient des **abrégés à
   ~7 %** (21 000 mots contre ~300 000 pour le Livre I) qui s'annonçaient
   pourtant « Chapitre intégral — lisible hors-ligne ». **Supprimés en
   août 2026** (mission `retrait-textes-abreges`), avec les constantes
   mortes qui les adressaient (`CHAP_AVAIL`/`CHAP_BASE`/`CHAP_CACHE`,
   déclarées et jamais appelées) et la mention devenue fausse dans le
   `sourceNote` de `bibliotheque.json` — texte VISIBLE au cartel de la
   bibliothèque, à ne pas oublier quand une source change. `loadSection()`
   n'a aucun repli local : vérifié avant suppression. Ils restent dans
   l'historique git si on les voulait un jour comme résumés — mais alors
   sous un autre nom que « intégral ».
2. **Les correctifs vont jusque dans le shell**, partagé par les quatre
   pages. Toute retouche du shell impose de revérifier accueil,
   bibliothèque et Place publique.
3. **Les 33 chapitres de « Parcourir » sont tous cliquables** : lu / en
   cours / à lire est un STATUT, pas un verrou.

### Le socle (atelier.css + shell.css + shell.js)

- `SHELL.announce(msg)` et `#srStatus` — **aucune page du site n'avait la
  moindre région live**. Le fetch de 8 s du texte intégral, les erreurs
  d'authentification, le nombre de résultats de recherche et les filtres
  changeaient tous en silence. Y passer tout nouveau changement d'état.
- `SHELL.tabs(list, getPanelId)` — pose tablist/tab/tabpanel, le tabindex
  roulant et les flèches. **Réentrant**, parce que `#subnav` est reconstruit
  en innerHTML à chaque bascule. `getPanelId` vient de la page : `data-top`
  désigne un GROUPE dont le panneau courant varie, `data-panel` un panneau.
  **Le bloc d'onglets s'initialise AVANT le chargement de shell.js** : les
  pages rejouent `syncTabsA11y` après `installShell`, sinon la barre haute
  reste nue au premier rendu.
- `SHELL.setWorkTab(id)` — `.on` + `aria-current` sur l'entrée d'œuvre.
- `SHELL.auth._enterModal / _leaveModal` — focus initial, piège Tab,
  `inert` sur topbar/sidebar/main/footer, restauration au déclencheur.
- **`.skip-link` et `.sr-only` vivent dans `shell.css`, PAS dans
  `atelier.css`** : ils sont injectés par shell.js, et l'accueil — qui ne
  charge pas atelier.css — affichait sinon le lien d'évitement en clair en
  haut à gauche. Piège rencontré et corrigé en cours de mission.

### Les tokens de couleur, et pourquoi il y en a deux rouges

`--red` (#d5402f) plafonne à **4,14:1** sur `--bg` et 3,76:1 sur `--card` :
il ne peut porter **aucun texte** sous 18,66 px (WCAG 1.4.3 exige 4,5:1).
Il reste aux **fonds** et aux **traits**, où 3:1 suffit.
**Tout texte rouge passe par `--red-text` (#e5644f, 5,64:1)** — 37 règles
repointées. Symétriquement, du texte SOMBRE sur un aplat `--red` ne donne
que 4,1:1 : sur un fond rouge c'est le **blanc** qui passe (4,56:1). Les
deux erreurs sont inverses, ne pas corriger l'une en créant l'autre.
`--line-strong` (34 % de crème, ~3,1:1) pour toute bordure qui IDENTIFIE un
contrôle (1.4.11) ; `--line` reste aux séparateurs décoratifs.

**Les règles inline d'une page battent `atelier.css`** : neuf overrides du
socle ont été annulés par les `<style>` des pages, à spécificité égale mais
plus loin dans la cascade. Corriger à la source, pas dans le socle.

### Pièges de méthode rencontrés

- **Une sonde de contraste maison a rendu un faux « zéro défaut ».** Elle
  mesurait le rendu et n'a pas vu ce que le détecteur statique a trouvé.
  Faire tourner **les deux** : `node ~/.claude/skills/impeccable/scripts/detect.mjs --json <fichiers>`
  (il lui faut `htmlparser2 css-select css-tree domutils` dans le dossier du
  skill, sinon il tourne en mode dégradé et n'évalue NI les propriétés
  personnalisées NI les contrastes).
- **44 × 44 px n'est pas le seuil AA.** C'est 2.5.5, niveau AAA. Le seuil AA
  est 2.5.8 : **24 × 24**. Un rapport qui annonce « 100 % des cibles
  échouent » mesure contre le mauvais critère — ici trois éléments
  échouaient réellement.
- **`:focus` ne matche pas dans un onglet piloté** si le document n'a pas le
  focus au niveau du système : `document.activeElement` est bon mais
  `el.matches(':focus')` est faux et le style ne s'applique pas. Cliquer
  dans la page d'abord, sinon on croit le lien d'évitement cassé.
- Les pièges déjà documentés valent toujours : `behavior:'instant'`,
  captures noires sur un document très haut, `getComputedStyle` périmé que
  seul un `cloneNode` départage.

### Architecture et placement (mission `ateliers-architecture`)

Deuxième volet de la même demande, mené après l'accessibilité.

- **Le seuil ne se franchit qu'une fois.** `body.at-inner` (posé par
  `syncTabsA11y` dès que le panneau actif n'est pas `accueil`) replie le
  héros de 406/483 px à **101 px** — fil d'Ariane + titre. Le `<h1>` reste
  dans le document. Première ligne utile : y=589 → **y=165**.
- **`body.at-reading`** (posé par `mountReader` de reader-tools, avec un
  filet dans `attach()` de shell-annotations, et retiré par `syncTabsA11y`
  quand on quitte `lire`) décolle les deux rangées d'onglets et masque le
  héros : en lecture, la coquille est la **barre de lecture**, désormais
  `sticky` sous la topbar. C'est aussi ce qui gate les deux pastilles de
  notes, qui restaient visibles sur les neuf panneaux.
- **Les deux rangées d'onglets sont collantes et de hauteur CONSTANTE.**
  `#subnav` est toujours rendu, groupes à panneau unique compris :
  l'escamoter faisait sauter la page de 63 px et déplaçait sous le curseur
  la barre qu'on venait de cliquer. Ne pas réintroduire
  `#subnav:has(...){display:none}`.
- **État d'URL.** `syncTabsA11y` écrit `history.replaceState('#'+pid)` ;
  `bootFromHash()` lit groupes ET panneaux. **Le panneau l'emporte sur le
  groupe** : `lire`, `accueil` et `ressources` nomment les deux, et le
  groupe renvoyait à sa page de garde. Un hash de panneau désigne aussi un
  élément réel du document, donc le navigateur y saute — on remet en haut
  juste après. Un deep-link `#note=` / `#s=` n'est jamais écrasé.
- **Reprise de lecture** — `SHELL.resume.get/set/clear(workId)`,
  localStorage, sans compte comme les annotations. Elle se fait au
  **chapitre**, pas à la position en pixels : la liseuse recharge son HTML
  à chaque ouverture, une position ne survivrait pas fidèlement, et une
  reprise qui tombe à côté est pire que pas de reprise. La proposition
  s'affiche dans la carte de démarrage (`#resumeSlot`) — **jamais de saut
  d'office**. Sur manuscrits, `renderResume` vit dans l'IIFE de la page :
  il est exposé en `window.renderResume` pour le rappel post-`installShell`,
  qui est dans un autre bloc `<script>`.

**Deux pièges de cascade rencontrés** : un override placé AVANT la règle de
base dans la même feuille perd (`.rd-row` dans reader-tools.css — mettre les
overrides en fin de fichier) ; et le pane sert parfois un CSS d'une édition
en retard, ce qui fait croire qu'une règle ne s'applique pas — buster les
`href` des `<link>` avant de conclure.

**Les trois cartes « Trois idées » sont des portes** (mission
`trois-idees-cliquables`, arbitrage du propriétaire : « l'endroit qui
incarne l'idée ») : sur Capital — profit → simulation Journée de travail
(`goLabo('s-jour')`), prix/valeur → lecture ch. I, salarié libre →
lecture ch. VI ; sur Manuscrits — aliénation → Premier manuscrit
(`loadPart(2)`), propriété privée → Cheminement, humanité → Troisième
manuscrit (`loadPart(4)`). Chaque carte DIT sa destination
(`.cap-idea-cta`) et s'ouvre au clavier (role="link" + Entrée/Espace).

### Ce qui reste hors périmètre

Le détecteur signale encore 58 constats **esthétiques** — filet d'accent sur
l'onglet actif, halos radiaux, capitales des micro-libellés, Fraunces +
Inter, tirets cadratins. Ce sont des choix de DA documentés plus haut, pas
des défauts : ne pas les « corriger ».
Non testé faute d'environnement : lecteur d'écran réel, `forced-colors`,
et tout ce qui exige une session Supabase authentifiée (page Messages,
popovers Messages et Notifications — le motif de modale y est identique,
donc les correctifs de focus s'y appliquent, mais restent à vérifier).


## La page Bibliothèque — « la pièce aux rayonnages » (refonte août 2026)

`oeuvres/bibliotheque.html` (CSS et JS inlinés, motif de `place-publique.html`).
Cible du clic sidebar « Bibliothèque ». **DA sombre-chaude** : son `:root`
redéfinit les tokens du shell comme le fait `/index.html`, sinon
topbar / sidebar / modales resteraient en clair.

**Refonte totale demandée par le propriétaire (août 2026)** : la page n'est
plus un document (portes / fil / corpus empilés) mais **une bibliothèque en
trois dimensions que l'on longe une bougie à la main** — un plan caméra
piloté par le défilement, les livres pour seule navigation. L'ancienne
version « Par où commencer » (panneaux empilés, plume `inkThreads`,
registre) est **remplacée** ; son registre survit comme repli à plat
(voir plus bas). Arbitrages retenus avec le propriétaire : refonte totale
(pas un simple héros 3D), et travelling au défilement (pas de navigation
libre ni de plan d'intro figé).

### La scène (Three.js, `initScene()` inliné)

- **Un rayon = un `readingGroup`** de `bibliotheque.json`, dans l'ordre du
  fichier (seuils → jeune Marx → critique → interventions). Les œuvres du
  rayon, triées par année croissante, tiennent la rangée du milieu — celle
  que la caméra longe. Au-dessus et en dessous : des liasses couchées sans
  étiquette, un décor, **jamais des œuvres** (ne pas leur donner de titre :
  le corpus reste la source unique de ce qui existe).
- **Une œuvre `available` est un livre relié** : cuir (une couleur par
  rayon, `LEATHERS`), dorures, nerfs, titre au dos **de bas en haut**
  (convention française de reliure), `shortTitle` sur le dos, titre complet
  dans le cartel. **Une œuvre `planned` est une liasse ficelée** : kraft,
  deux tours de ficelle, titre à l'encre en Caveat — « en préparation »
  se dit par la matière (pas encore reliée), plus aucun besoin d'opacité.
- **Le signet rouge marque une porte d'entrée** (`reading.entry`), et
  seulement si l'œuvre est disponible — la règle « pas de porte sans
  atelier » de l'ancienne page tient toujours.
- **La bougie est portée** : un seul `PointLight` chaud qui suit la caméra
  (plus une ambiante faible qui débouche). Elle vacille (somme de sinus,
  jamais un battement régulier). Poussière : un petit `Points` qui dérive.
  `scene.fog` couleur du fond — les travées voisines s'estompent.
- **Le défilement est le travelling**, strictement réversible : `p` (0→1
  sur la cale `#bibRun`, hauteur dérivée du nombre de rayons) commande la
  caméra via `camPose()` — plan large (l'intro couvre), approche
  (`T_IN=0.16`), travée par travée à vitesse constante, léger recul final
  (`T_TRAVEL=0.9`). La caméra rejoint sa cible en douceur dans la boucle
  rAF (`1-exp(-dt·7)`).
- **Aller à un livre = écrire la position de défilement** (`scrollToX`,
  `behavior:'smooth'`) : le pilotage reste le scroll, donc réversible, et
  la caméra traverse réellement les rayons intermédiaires. Utilisé par le
  rail (les boutons de rayons en bas), par le clic sur un volume et par
  les relations du cartel.
- **Le cartel** (`.bx3-cartel`, panneau fixe à droite) porte TOUT le
  contenu d'une œuvre : question d'entrée, titre, statut, description,
  concepts, **relations dans les deux sens** (« Avant lui » = after +
  primer ; « Après lui » = calculé en inversant le graphe), readingGuide,
  sourceNote, « Ouvrir l'atelier ». Les relations sont des boutons : clic
  → cartel de l'autre œuvre + la caméra s'y porte. Échap ou clic dans le
  vide ferme. Le livre sélectionné/survolé **se tire de l'étagère**
  (`outT` easé dans la boucle).
- **Étiquette de survol** (`.bx3-tag`) projetée au-dessus du volume
  (titre, année, état, question d'entrée). Les cartouches de laiton des
  rayons (`plaqueTexture`) sont **inclinés vers le regard**
  (`rotation.x=-0.34`) — à plat sur le chant de la tablette, la caméra les
  voyait par la tranche.
- **Rien en dur** : nombre de rayons, rail, comptes, textes de fin — tout
  est dérivé des données, les nombres en toutes lettres (`numFr`). Le
  lede de l'intro dit « rayon par rayon » précisément pour ne pas écrire
  « quatre ».
- Textures texte (dos, liasses, cartouches) redessinées sur
  `document.fonts.ready` — le premier tracé part sur la police système.

### La pièce s'est meublée (mission `bibliotheque-meublee`, août 2026)

Retouches demandées par le propriétaire : plus de lumière (surtout le plan
large), texte d'intro raccourci, et de la vie — objets, lore, animations.

- **Lumière** : ambiante relevée + une `HemisphereLight` chaude, pénombre
  CSS (`.bx3-lamp`) adoucie — le plan large doit se lire SANS attendre la
  flamme. Le fog part à 9,5.
- **Le bougeoir porté se voit** : `makeCandlestick()` (coupelle laiton,
  douille, cire, flamme additive à deux plans croisés + halo), enfant de
  la CAMÉRA (`scene.add(camera)` obligatoire pour que ses enfants
  rendent), coupelle à demi sortie du bas du cadre. Il porte la lumière
  principale — posée un peu AU-DESSUS de la flamme, collée à la cire elle
  la brûlait au blanc. Il **s'incline avec le mouvement** (tilt easé sur
  la vitesse caméra) et la caméra respire à peine (sommes de sinus,
  amplitudes centimétriques). Tout ce qui brûle vit dans le registre
  `flames` — périodes non multiples, une flamme ne bat pas la mesure.
- **La pièce** (`furnish()`, décor jamais données) : tapis de couloir,
  échelle appuyée sur la travée de l'œuvre maîtresse (**`rotation.x`
  NÉGATIVE** pour l'appuyer au meuble — positive, elle tombe vers le
  lecteur), fenêtre au clair de lune à gauche (verre additif + point
  bleu `0x88a7c4` — le froid qui répond à la flamme), et le **bureau
  d'écriture au bout de l'allée** : feuillets, encrier, plume, deux
  tomes, sa chandelle, et le fac-similé du manuscrit ENCADRÉ
  (`TextureLoader` en différé, le cadre vit sans la page si le fichier
  manque — même image que le héros de l'accueil). Le cadrage du plan
  large prend une marge horizontale de 3,4 pour les inclure tous deux.
- **Lore** : une ligne de contexte par rayon (`LORE`, clé = id du
  groupe, silencieuse pour un groupe inconnu) dans le cartouche de
  travée (`.cap-l`, Spectral italique or). C'est du décor éditorial,
  comme le texte d'intro — pas des données.
- **Le plan d'ensemble est un grand-angle** : deux focales (`EST_FOV`
  74 — presque un fish-eye — pour les plans larges de début et de fin,
  `TFOV` 42 pour le travelling), la transition d'approche mélange dolly
  et zoom, et la fin de course est un léger dolly-zoom. `computeFraming`
  calcule la distance À LA FOCALE LARGE. Les plans d'ensemble sont
  suréclairés (`wideK` → ambiante, hémisphérique, lune) : la bougie ne
  redevient la seule source qu'au ras des rayons.
- **La flamme est dessinée, pas dégradée** : couches de blobs radiaux
  étirés (enveloppe orange effilée, corps doré, cœur blanc-crème posé
  BAS, pied bleu à la mèche), un SEUL plan billboard (les deux plans
  croisés montraient leur couture), une mèche sous elle, halo séparé.
  Ne pas revenir aux plans croisés.
- **Trois pièges de cette passe** : (a) le fog LAVE les matériaux
  additifs vers sa couleur — `fog:false` sur tout l'additif de la lune ;
  (b) la **sidebar couvre ~208 px du canvas** : composer le plan large
  au centre du viewport mettait la fenêtre pile dessous — `sbShift`
  (mesuré sur `.sidebar` dans `computeFraming`) recentre la pièce dans
  la zone visible ; (c) un objet ancré en espace-caméra dépend de la
  FOCALE : le bougeoir porté est repositionné chaque image en fonction
  de `camera.fov` (`-tan(fov/2)·z`), sinon le grand-angle le faisait
  flotter en plein cadre.
- **Intro** : lede raccourci (« Marx ne se lit pas dans l'ordre des
  dates… »), lignes qui se posent en cascade (`bx3-rise`). **Fill-mode
  `backwards`, jamais `both`** : l'opacité du conteneur est pilotée par
  le JS au défilement, un fill persistant la lui volerait.

### La feuille volante (mission `feuille-volante`, août 2026)

À l'ouverture de la page, **le vantail de la fenêtre s'ouvre** (groupe
`sash` à charnière gauche — le dormant reste fixe) et un courant d'air
fait s'envoler une feuille qui vient **se figer devant la caméra** :
c'est elle qui porte le texte d'introduction. Le défilement la relance
pendant que la caméra plonge, et elle **revient à la fin, retournée** —
le texte de fin est à son verso (`rotation.y = π`, matériau DoubleSide).

Mécanique, à ne pas casser :

- **Le papier est à la 3D, l'encre au DOM.** La feuille (`sheet`,
  enfant de la CAMÉRA — toute sa chorégraphie est en espace-caméra) est
  un plan texturé ; les blocs `#bxIntro` et `#bxEnd` sont posés sur son
  **rectangle projeté** (`sheetRect()` : 4 coins → `project()` →
  left/top/width/height/font-size en ligne, tout l'intérieur en em).
  Recalculé à CHAQUE image — le texte suit la respiration de la
  feuille. La taille de police est **quantifiée au demi-pixel**, sinon
  le texte se recompose en permanence. Le DOM reste net, cliquable et
  accessible — ne jamais dessiner ces textes dans la texture.
- **L'envol est temporel et ne joue qu'une fois** (`sheetT`, ~3,8 s),
  et seulement si l'on arrive en HAUT de page ; une restauration de
  défilement ou un scroll pendant l'envol le termine d'un coup
  (`sheetDone`). Le départ (scrub sur `p` dans [0.006, T_IN·0.7]) et le
  retour final (scrub sur [T_TRAVEL+0.02, 0.985]) sont, eux,
  **fonctions de la position — réversibles**.
- **`.lit` déclenche l'encre** : la cascade `bx3-rise` de l'intro ne
  part plus au chargement mais quand la feuille s'est posée
  (`landK > .85`). Le texte de fin est gaté par `endO × endK` — il
  n'apparaît qu'une fois la feuille retournée posée.
- **`MeshBasicMaterial` pour le papier, pas Lambert** : à 50 cm de la
  flamme, un matériau éclairé brûlait au jaune uniforme et le grain
  disparaissait. `fog:false` aussi.
- L'intro et la fin sont désormais **encre sur papier** (palette ink
  `#2b1c0e` / `#57432a` / `#8a6420` dans le CSS) — plus de crème sur
  fond sombre pour ces deux blocs. Le vantail reste ouvert ensuite.

### Le texte est INCRUSTÉ dans la feuille (mission `texte-incruste`, août 2026)

Le texte de présentation ne doit pas être posé sur la feuille : il doit y
être imprimé. Deux volets, la police et l'agencement.

**L'encre prend le grain.** Toutes les couleurs du recto et du verso sont
en **alpha** (`rgba(28,16,4,.9)`, `rgba(58,42,22,.88)`…) : le papier
transparaît DANS la lettre, qui hérite donc de son grain, de ses pliures
et de la lumière de la pièce, et fonce dans les creux. **Ne pas tenter de
faire ça en `mix-blend-mode:multiply`** — plus juste physiquement, mais
inopérant ici : `.bx3-intro` porte un `z-index`, donc crée un contexte
d'empilement, et le mélange ne verrait que son propre fond transparent,
jamais le canvas. C'est en plus une lecture de l'arrière-plan à chaque
image, sur un bloc déjà remis en page à chaque image.

**L'agencement est celui d'une page de titre**, centré : rubrique en
capitales espacées entre deux filets, titre sur deux lignes (l'appel
droit, le mot en italique plus grand), **fleuron dessiné en SVG** (filet
rompu par un losange — pas un glyphe Unicode), lede en mesure courte,
comptes en capitales espacées **et en toutes lettres** (`numFr` — un
document n'écrit pas « 12 »), légende en **marques imprimées** (angles
vifs, dos de livre, liasse ficelée, signet) et non en pastilles
d'interface, envoi en italique. Le verso porte la rubrique « Au verso ».

**PIÈGE MAJEUR — jamais de `padding` en % sur la feuille.** Un padding en
pourcentage se résout sur le **bloc conteneur**, et la feuille est en
`position:fixed` : le conteneur est donc le VIEWPORT, pas l'élément.
`padding:8% 10%` valait **144 px de marge sur une feuille de 500** — le
texte était comprimé dans un tiers de la page, ce qui expliquait les
retours à la ligne absurdes de la légende. Tout est en `em`, qui suit la
taille de police que `sheetRect()` dérive de la largeur de la feuille :
la marge reste proportionnelle au papier à toutes les largeurs.

**Correctif d'accessibilité au passage** : `.bx3-ui` ne porte plus
`aria-hidden`. Quand la scène tourne, `#bxFlat` est en `display:none` —
ce bloc porte donc le SEUL texte de la page, et le masquer laissait un
lecteur d'écran devant une page vide. Seule `#bxTag` (l'étiquette de
survol, qui redit le cartel) reste masquée.

### La baie s'ouvre vraiment (mission `fenetre-et-composition`, août 2026)

Deux défauts signalés par le propriétaire, tous deux réels :

1. **Le fond du meuble passait DERRIÈRE la fenêtre.** Le panneau `back`
   de `buildCase()` s'étendait de −3 à `caseW+3` : le vantail s'ouvrait
   donc sur du bois sombre, et la lune n'existait pas. Le fond s'arrête
   désormais au bord gauche du meuble (−0,35 ; il déborde toujours à
   droite, où il sert de fond au bureau), et un **vrai mur percé** prend
   la place à gauche — quatre panneaux autour de l'ouverture
   (`mkWall`), jamais un plan plein.
2. **Le vantail pivotait DANS le mur.** `sash.rotation.y` positif
   envoie le battant vers `−z`. Il est négatif : la croisée bat vers la
   pièce, et l'on voit enfin s'ouvrir ce qui laisse entrer la feuille.

Derrière la baie, **la nuit** : un plan de ciel en retrait (parallaxe —
on regarde dehors, pas un décor collé à la vitre), avec dégradé, étoiles,
lune et halo, et la **silhouette des toits**. `fog:false` comme tout ce
qui est vu par la fenêtre. La vitre du vantail ouvert est retombée à
0,2 d'opacité : à 0,42 elle lisait comme un panneau blanc opaque.

**Typographie de la feuille.** Le texte est imprimé sur un vieux papier
plié : il se compose comme un document, pas comme une interface. Spectral
(la serif de lecture de la maison) pour tout le courant — l'Inter de l'UI
n'a rien à y faire —, Fraunces pour le titre, rubrique en capitales
espacées, filet sous le titre au recto, vignette centrée au verso, ligne
de comptes en italique. Palette d'encre (`#241505` / `#4a3823` / `#8a6420`).

**Une pliure n'est pas un filet.** Tracée en trait simple, elle venait
doubler le filet du titre et se lisait comme une règle typographique de
plus. Les deux pliures (lettre pliée en trois) sont des **bandes ombre +
reflet** — le creux, puis l'arête que la lumière accroche.

### Le repli à plat (`#bxFlat`)

Sous 768 px, en reduced-motion, sans WebGL ou sans THREE — ou **sur
demande** (`#liste`, ou le bouton « Préférer la version liste » de
l'intro) — la page est un **registre à plat** : les groupes de lecture
avec leurs notes, chaque œuvre en ligne (année en folio, statut, porte
d'entrée, description, concepts, relations, « Comment le lire » en
`<details>`, lien atelier). C'est aussi la version des lecteurs d'écran
et des robots. Quand la 3D est active, `#bxFlat` est en `display:none`
(la 3D se pilote au clavier par le rail + Échap ; l'accès complet au
clavier passe par la version liste). Le bouton « Entrer dans la
bibliothèque en trois dimensions » du registre relance la scène
(`location.reload()` si une scène a déjà été démontée par `teardown()`).

**La décision 3D/liste se prend au moment de décider, pas au parse**
(`want3D()` appelée dans `decide()`, rejouée sur `resize`) : la fenêtre
peut ne pas avoir sa taille définitive pendant l'exécution du script —
c'est vrai des onglets pilotés ET d'une fenêtre qu'on élargit. `decide()`
est idempotente (garde `scene3d`).

### Pièges rencontrés sur cette page (à ne pas refaire)

1. **Un `<canvas>` est un élément REMPLACÉ : `position:fixed; inset:0` ne
   l'étire pas.** Il garde sa taille intrinsèque — celle du tampon de
   rendu, ici 2×viewport à cause du pixelRatio — et on ne voyait que le
   quart haut-gauche de la scène. `width:100%; height:100%` explicites
   obligatoires.
2. **`resize()` doit ignorer les tailles nulles.** Un onglet en
   arrière-plan peut annoncer `innerWidth/Height` 0 ; réduire le tampon du
   renderer à 0×0 rend l'écran noir jusqu'au prochain vrai resize.
3. **Le clic porte ses propres coordonnées.** Le raycaster ne doit pas
   dépendre du `ndc` du dernier `pointermove` : au tactile (ou pour tout
   clic synthétique) il n'y a pas eu de survol avant le clic.
4. **Le cadrage du plan large se calcule en distance-pour-contenir**
   (`(H/2)/tan(fov/2)` et `(W/2)/(tan·aspect)`, le plus contraignant
   gagne). Une erreur d'un facteur 2 ici noie le meuble dans le fog.
5. **Pour tester : la sonde, toujours.** Dans un onglet piloté le rAF est
   bridé (la caméra ne rejoint jamais sa cible), les transitions CSS
   gèlent (les fondus d'interface semblent morts) et **les défilements
   `smooth` ne progressent pas du tout** — trois faux bugs. Exposer
   temporairement `{setP, tick, state}`, avancer image par image,
   **retirer la sonde avant le commit**. Des captures entièrement noires
   peuvent aussi n'être que la pane masquée (vérifier
   `document.hidden` et `isContextLost()` avant de « corriger »).

### Sidebar : « Accueil » et « Bibliothèque » sont deux choses

Avant, « Bibliothèque » menait à l'accueil et le site n'avait aucun retour
explicite vers sa page d'accueil. Désormais, dans `shell.js` :

- **Accueil** (`data-act="home"`) → `/`, comme le brandmark. (Ils
  pointaient `/?skip-anim` tant que l'accueil portait l'intro.)
- **Bibliothèque** (`data-act="biblio"`) → `/oeuvres/bibliotheque.html`.

L'entrée correspondant à la page courante prend `.on` **et
`aria-current="page"`**.

**PIÈGE, corrigé en septembre 2026 après avoir vécu longtemps :
Cloudflare Pages sert des URL PROPRES.** La page vit à
`/oeuvres/carnet`, pas `/oeuvres/carnet.html`. Les trois tests de
marquage portaient sur `.html` : ils passaient en local (où
`python3 -m http.server` sert bien le fichier) et n'attrapaient
**rien en production** — aucune entrée n'était jamais mise en avant sur
le site en ligne. `here` normalise donc en retirant l'extension. Tout
nouveau test sur `location.pathname` doit faire pareil, et se vérifier
sur liremarx.com et pas seulement en local. Noter que les pages de
livre ont **elles aussi** un onglet « Accueil » dans leur `sb-work` : c'est
l'accueil de l'œuvre, pas celui du site, et le titre de section au-dessus
(`LE CAPITAL — LIVRE I`) est ce qui les distingue.

### L'ordre de lecture vit dans `bibliotheque.json` (inchangé)

La règle de la **source centrale unique** s'applique toujours : le graphe
n'est PAS codé dans la page. Les deux champs ajoutés pour l'ancienne
version restent le contrat de celle-ci :

- `readingGroups[]` — `{id, label, note}`, quatre groupes : `seuils`,
  `jeune-marx`, `critique`, `interventions`. Un groupe = un rayon.
- `reading` par œuvre — `{group, after[], primer[], entry}` ; `after` et
  `primer` omis quand vides, `entry` quand l'œuvre n'est pas une porte.

`after` = prérequis réel (« à lire après »), `primer` = conseillé sans
obligation — la distinction s'affiche dans le cartel (« à lire après » /
« prépare ») et n'est pas cosmétique : *Le Capital I* est lisible alors
que ses deux `primer` ne le sont pas. Ce qui vient des `readingGuide`
d'origine (Livre II après le I, etc.) et les arbitrages éditoriaux validés
(Grundrisse après Capital I, les trois primer, la Contribution hors de
tout fil) sont documentés dans l'historique git de la version précédente.

## La page Place publique — LE FORUM (refonte août 2026, 3e passe, mission `place-forum`)

`oeuvres/place-publique.html` (CSS et JS inlinés, motif de la page).
**Ce lieu est un FORUM à l'anatomie d'un Reddit** — décision du
propriétaire, 3e passe. Historique des passes, à ne PAS ressusciter :
1re « mur d'affiches » (palissade, réverbère), 2e « table commune »
(feuillets DOM+CSS puis **salle 3D Three.js** complète — table, bancs,
chandeliers, travelling au défilement). La salle 3D a été REMPLACÉE par
le forum (elle reste dans l'historique git, commit d9979d2 et avant) ;
`three.min.js` n'est plus chargé par la page. Le propriétaire a demandé
« une UI/UX proche de Reddit, que ça fasse forum », la DA vivant dans
les détails.

**Anatomie.** Deux colonnes (`.pf-cols` : fil + rail de 300 px, rail
masqué < 1020 px) sous un en-tête sobre. Dans le fil : la carte
« Ouvrir une discussion… » (lance le composeur), la barre collante de
tris (Récentes / Soutenues / Discutées) + filtres par œuvre (chips
comptées, construites sur les DONNÉES), puis les cartes. Une carte =
colonne de soutien à gauche (flèche dessinée + compte), méta (pilule
œuvre, cachet + **signature Caveat**, ancienneté), titre Fraunces,
citation éventuelle (filet rouge gauche — la règle typographique
maison), extrait clampé à 3 lignes, pied (réponses, « Aller au
passage »). Clic sur la carte = la **vue de fil** ; le rail porte
« La place commune » (+ stats) et « Les usages ». Icônes DESSINÉES
(flèche, bulle, va-à) — jamais d'emoji.

**Doctrine (arbitrages explicites du propriétaire) :**
- **On ouvre une discussion depuis la page** (le geste Reddit de base) :
  œuvre obligatoire (toutes celles de bibliotheque.json, planned
  comprises), titre, texte facultatif. INSERT `{id, author_id, work
  (résolu, jamais l'alias), section: 0, body, parent_id: null,
  created}` — **section 0 = discussion générale sur l'œuvre**, aucun
  risque de schéma (la colonne existe), et l'affichage ne montre la
  section que si > 0.
- **Le « titre » n'est PAS une colonne** : c'est la première ligne du
  `body` quand elle fait ≤ 160 caractères (`partsOf()`), dérivée à
  l'affichage. Zéro migration, et les notes nées en lisant restent
  telles quelles partout ailleurs (SHELL.commune, panneau de liseuse).
  Le composeur écrit `titre + '\n\n' + texte` — le contrat boucle.
- **Les soutiens** : un vote d'appui par lecteur et par note, PAS de
  vote négatif (« on appuie une lecture, on n'enterre personne » —
  affiché dans Les usages). Table **`note_votes`** (schema.sql, blocs
  idempotents en fin de fichier — table NEUVE, le piège des tables
  préexistantes ne s'applique pas) : `{note_id text, voter_id uuid
  default auth.uid(), created bigint, pk(note_id, voter_id)}`, RLS
  select ouvert / insert et delete sur son propre vote. **Tant que le
  SQL n'est pas rejoué, la page dégrade** : PGRST205 attrapé →
  `votesOK=false`, comptes cachés, clic → toast (chemin prévu, comme
  la modération à son époque). Bascule optimiste, revert si erreur.
- **Les réponses sont IMBRIQUÉES** : `parent_id` = le parent DIRECT
  (racine ou réponse). Les réponses héritées pointent la racine et
  s'affichent à plat — rien à migrer. L'indentation plafonne à 3
  niveaux (`.pf-kids`, ligne de fil à gauche), au-delà le fil continue
  à plat. **Divergence assumée** : le panneau « Notes partagées » de la
  liseuse ne liste que les réponses DIRECTES à la racine — une réponse
  de réponse n'y apparaît pas.
- **Supprimer** : ses propres notes seulement, et seulement SANS
  réponse (pas d'orphelines) — même policy RLS que `delPublic` du
  panneau de liseuse. Confirmation INLINE, jamais de modale.
- **Modération conservée telle quelle** (SHELL.mod) : signalement avec
  motif facultatif, Masquer/Rétablir pour un modérateur, fils masqués
  visibles ESTOMPÉS (le fetch retire le filtre `hidden=false` si
  `isMod()`), rechargement sur `SHELL.mod.onChange`.

**Navigation.** La vue de fil est routée par le hash **`#d=<id>`**
(pushState + popstate : le bouton retour du navigateur marche, un
deep-link arrive directement sur le fil). Le focus va au titre du fil
(`#pfDetailH`, tabindex -1). `#liste` n'existe plus (le fil EST la
page) ; aucun lien externe ne le visait (vérifié).

**Mécanique.** UN écouteur délégué sur `#pfMain` (`data-act` partout) ;
les brouillons survivent aux re-rendus (`drafts{}` alimenté par
`input`/`change` sur `data-draft`) ; `paintVotes()` met à jour les
compteurs EN PLACE (pas de re-rendu, le focus reste sur le bouton).
Gating d'écriture = `ensurePoster()` (configuré + connecté + pseudo,
sinon toast + modale compte) ; voter ne demande que la connexion.
Reconnexion/déconnexion → refetch (mes soutiens et mes droits
changent) ; le premier appel d'`onChange` (rappel immédiat) est
ignoré.

**Pièges de cette page (à ne pas refaire) :**
1. **Un override média écrit AVANT la règle de base perd** à
   spécificité égale : `.pf-rail{display:none}` (média) vivait avant
   `.pf-rail{display:flex}` (base) et le rail restait visible à
   375 px. Les overrides média vivent en FIN de leur section.
2. **Pas de `.in()` sur mille ids** : lire `note_votes` filtré sur les
   notes affichées ferait une URL de ~36 Ko. À l'échelle du site on
   lit TOUT (limit 5000) et on compte côté client.
3. `atelier.css` pose `scroll-behavior:smooth` : tout `scrollTo`
   programmatique passe `behavior:'instant'` (piège déjà documenté).

**SHELL.commune n'est PAS modifié** (aperçus compacts de l'accueil et
de la bibliothèque, lecture seule, filtrés `hidden=false`). Les
conventions partagées tiennent : `public_notes.work` = id de
bibliotheque.json, alias `'capital'` → `'capital-1'` à l'affichage ET à
l'écriture, jamais de second client Supabase, petits outils dupliqués
(esc/ago/toast). Le portrait Mayall reste l'og:image de la page — ne
pas supprimer ses fichiers.

**À REJOUER dans Supabase** : le bloc `note_votes` de
`supabase/schema.sql`. Tant que ce n'est pas fait, les soutiens sont
inactifs (chemin prévu) ; tout le reste fonctionne.


## La page Messages (mission `messages-page`, septembre 2026)

`oeuvres/messages.html` — **le pendant PRIVÉ de la Place publique** : là-bas
on écrit devant tout le monde, ici à quelqu'un. Elle remplace la modale
Contacts, **supprimée**.

Diagnostic mesuré avant de toucher au code :

- **La même chose portait DEUX NOMS.** La sidebar disait « Contacts »,
  l'icône de la barre du haut et son popover disaient « Messages ».
- **C'était déjà une page déguisée.** Le code s'appelait
  `renderContactsPage()`, les classes étaient `.cv-*` (« contacts view »),
  le lien du popover disait littéralement « Ouvrir la page Contacts → » — et
  cela ouvrait un pavé de 1000 px qui recouvrait tout le viewport, masquant
  au passage l'entrée de sidebar qui venait de l'ouvrir.
- **Aucune URL, donc aucun lien profond** vers une conversation, et le
  bouton retour du navigateur ne servait à rien.
- **Le bouton d'envoi du popover portait `.btn red`**, qui n'existe que dans
  `atelier.css` : sur `/index.html` c'était le bouton gris de l'agent
  utilisateur — le défaut exact corrigé pour Mon compte, encore en place ici.
- **Aucun piège de focus, aucun `_enterModal`** : le shell les avait pourtant
  exposés pour cette modale (c'est écrit plus haut), elle ne les a jamais
  appelés.
- **Tutoiement** partout, quand tout le reste du site est passé au vous.
- **On ne pouvait joindre quelqu'un qu'en tapant son pseudo au caractère
  près.** Aucune découverte : pour un nouveau venu, la messagerie était
  inutilisable.

**Deux arbitrages du propriétaire au lancement :** une page « Messages »
(les conversations sont le sujet, les contacts n'en sont que le moyen), et
la découverte des lecteurs **depuis l'activité publique**.

### Le partage des rôles

**`shell-social.js` possède les données, le realtime et le popover ; la page
ne fait que rendre.** C'est le motif de `SHELL.annotations` avec « Mon
carnet » : la page ne parle JAMAIS à Supabase pour la messagerie. Elle
consomme `SHELL.social.dm` :

```
dm.status()      → {configured, signedIn, named, ready}  (pour dire POURQUOI c'est vide)
dm.contacts()    → [{id, username, avatar, last, unread}]
dm.convo()       dm.messages()   dm.me()   dm.myName()
dm.open(id,nom)  dm.close()  dm.send(txt)  dm.add(pseudo)  dm.refresh()
dm.suggestions() → les lecteurs de la Place publique, moins mes contacts
dm.onChange(cb)  → rappelé à CHAQUE changement de données
dm.ago/ava/esc/toast — les petits outils, pour que la page n'en redéclare pas
```

`emitDM()` remplace les huit `if(modalVisible()) renderContactsPage()` qui
parsemaient le module, et le paramètre `surface` ('pop' | 'page') des
fonctions d'écriture a disparu avec eux.

### La règle qui commande le rendu

**Le squelette est écrit une fois dans le HTML et n'est jamais réécrit.**
Seuls quatre fragments se redessinent : la liste, les suggestions, l'en-tête
du fil, les bulles. **Le composeur est un nœud permanent** — un `innerHTML`
sur son conteneur effacerait le message en cours de frappe à chaque tick du
polling de 15 s ou à chaque message reçu. Vérifié à la mesure : on tape, un
rafraîchissement passe, le texte est toujours là et c'est le même nœud.

**Le fil s'AJOUTE, il ne se réécrit pas** (`seenIds`). Trois raisons, toutes
vécues ailleurs : une région `aria-live` réécrite en entier **relit tout le
fil** à chaque message ; un `innerHTML` remet le défilement en haut, donc
**arrache la lecture d'un vieux message** au moindre tick ; et le nœud du
composeur ne doit pas être détruit. On ne défile en bas que si l'on y était
déjà — et comme un message peut alors arriver hors du champ sans que rien ne
le dise, une pastille **« Nouveau message ↓ »** apparaît (c'est le corollaire
obligatoire de ne pas défiler d'office).

### Deux pièges rencontrés, tous deux vécus

1. **`display:grid` / `display:flex` BAT `[hidden]{display:none}`** — la
   règle de l'agent utilisateur n'a qu'une spécificité d'attribut. Masquer
   `.mg-cols` ne la masquait donc pas : le rail s'affichait sous l'écran
   d'accueil, et ses contrôles restaient dans le parcours de tabulation. Il
   faut `.mg-cols[hidden],.mg-pane[hidden],.mg-thread-pane[hidden]{display:none}`.
   **Tout conteneur à qui l'on donne un `display` et que l'on masque par
   `hidden` a besoin de cette ligne.**
2. **`SHELL.auth.isConfigured()` rend `false` tant que l'import Supabase n'a
   pas abouti**, ce qui est indiscernable d'un vrai « pas de clés ». Au
   premier rendu, la page annonçait donc « Messagerie indisponible » sur un
   site parfaitement configuré. Elle attend maintenant que `SHELL.auth` ait
   parlé (`authSettled`, posé au SECOND rappel d'`onChange` — le premier est
   immédiat et arrive avant `getSession`), avec un filet de 2,5 s. Même
   précaution que la modale Mon compte avec `configured === null`.

### Les détails qui font la page

- **Deep-link `#c=<pseudo>`** (pushState + popstate) : une conversation a une
  adresse, et le bouton retour ramène à la liste. C'est le contrat de la
  Place publique (`#d=<id>`). Un lien profond n'est résoluble qu'une fois les
  contacts chargés : il n'est consommé qu'au premier rendu qui en dispose, et
  si le pseudo n'est pas dans mes conversations on tente de l'ajouter.
- **La découverte** lit `public_notes` (auteur + profil), retire moi-même et
  mes contacts, et en garde douze. **Aucune table ni policy nouvelle** — rien
  de plus que ce que le forum montre déjà. Le brut est mis en cache mais le
  filtrage se refait à chaque appel, sinon un contact ajouté après le fetch
  resterait proposé.
- **Séparateurs de jour** (Aujourd'hui / Hier / le jour de la semaine / la
  date) et heure sous chaque bulle.
- **Sous 900 px, une conversation prend l'écran** (`body.mg-convo`) et le
  lede de la page s'efface : empilées, les deux colonnes obligeaient à
  passer toute la liste avant de lire la réponse.
- **`--const` ne tient pas sur la bulle rouge** (4,26:1 mesuré) : l'heure
  passe à `--ink-soft`. Même famille d'erreur que `--red-text` sur un fond
  déjà teinté, notée pour Mon compte.

### Ce qui a été supprimé

- La modale `#contactsModal` et tout `renderContactsPage` /
  `modalVisible` / `closeContacts` / `avatarOf`.
- Les `.ct-*` et `.cv-*` de `shell.css`, remplacés par **`.msg-send`** — le
  bouton pilule que le popover n'avait pas.
- Dans `capital-1.html` : les blocs `socCss4`, `socCss5`, `socCss6`, la
  moitié `.cv-*` de `socCss2` et de `socCss7`, et la section
  **`#contactsView`** — vide, masquée en dur et peuplée par plus rien depuis
  que Capital consomme `SHELL.social` (6f).
- L'entrée de sidebar `data-act="contacts"` devient `data-act="messages"` et
  mène à la page ; `SHELL.social.showContacts()` est conservé sous son nom
  (c'est l'API que shell.js appelle) mais **navigue** au lieu d'ouvrir une
  modale, et ne fait rien si l'on y est déjà. La sidebar a la même garde :
  recharger la page rouvrirait la conversation à zéro.

### Vérifié

Sonde de contraste sur le rendu : **0 échec** sur cinq états (conversation,
liste vide, pastille de nouveau message, déconnecté, sans pseudo), minimum
**4,56:1** — le blanc sur rouge de la pastille de non-lus, valeur maison.
Aucun texte sous 11,4 px à l'écran, aucune cible sous 24 × 24. Détecteur
statique : **0 erreur** (9 constats, tous de la famille de DA documentée).
Testé à 1280 et 375 px, **zéro débordement horizontal**. Éprouvé : clic dans
le rail → hash écrit ; retour navigateur → liste ; arrivée directe sur
`#c=<pseudo>` → conversation ouverte ; frappe qui survit à un rafraîchissement
(même nœud) ; 30 messages sans doublon après plusieurs `emitDM` ; défilement
tenu en haut quand un message arrive, pastille affichée. Sidebar marquée sur
la page, popover qui mène à la page, et aucune exception JS sur les six pages
qui chargent le shell.

**Découverte validée en vrai** : la liste des lecteurs proposés est revenue
peuplée depuis la base de production (avec leurs photos de profil).

**Défaut ANTÉRIEUR relevé au passage, hors périmètre** : le chargement d'une
section du texte intégral produit une cinquantaine d'erreurs 400 — les images
de formules mathématiques venant de `wikimedia.org/api/rest_v1/media/math/
render/svg/…`. Constaté identique à HEAD.


## Shell partagé : atelier.css + shell.css + shell.js (+ shell-social.js)

Toutes les pages (bibliothèque comme livres) partagent :

- `oeuvres/atelier.css` — système visuel (variables `:root`, polices,
  composants éditoriaux : tabs, panel, intro-block, plan-list, btn, etc.).
  **C'est ici que vivent les tokens de la refonte Rouge Internationale**
  décrits ci-dessus — toute nouvelle valeur de couleur/police doit passer
  par une variable de ce fichier, jamais une valeur codée en dur dans une
  page individuelle.
- `oeuvres/shell.css` — coquille visuelle (topbar 44 px sticky avec
  brandmark/recherche/compte, sidebar 208 px avec Bibliothèque/Place
  publique/Mon carnet/Messages/CGU/sb-work, modales compte/RGPD,
  popover messages, toast).
- `oeuvres/shell.js` — injection DOM + comportements minimaux. Expose
  `installShell({workId, workTitle, tabs:[{id, label}…]})`. Une page de
  livre l'appelle avec ses onglets ; shell.js câble alors le sb-work pour
  qu'un clic dispatche vers `window.activateTab(id)` que la page définit.
  Embarque `SHELL.auth` (singleton Supabase + Mon compte) et
  `SHELL.commune` (flux Place publique, lecture seule, monté dans
  n'importe quel conteneur via `SHELL.commune.mount(el, {limit, compact})`).
- `oeuvres/shell-social.js` (optionnel) — module `SHELL.social` :
  messagerie privée (contacts + DM + popover msgBtn + modale
  `#contactsModal` + realtime des `direct_messages`) ET notifications
  (popover notifBtn + pastille notifDot + realtime des `public_notes`).
  Branché par `installShell()` après `SHELL.auth._bootstrap()`. Les
  pages qui veulent la messagerie/notifications doivent charger
  `shell-social.js` **après** `shell.js`.
- `oeuvres/shell-annotations.js` (optionnel) — module
  `SHELL.annotations` + contrat `SHELL.reader.attach()` :
  surlignage + notes privées (local + synchro Supabase) + panneau
  « Mes notes » ; **forum public par passage** (`public_notes`
  ancrées, composer + répondre + flashAnchor) ; **contrat de
  deep-link au passage** (`#note=<id>` ou `#s=N&q=...`). Capital-1.html
  garde sa propre version inlinée jusqu'à `retrait-shell-host` ;
  `manuscrits-1844.html` est la **première page de livre à adopter le
  contrat**.

**Règle realtime.** Un seul canal Supabase `lm-<userid>` par session,
qui multiplexe deux abonnements `INSERT` : `direct_messages` (filtré
sur `recipient_id=eq.<me>`) et `public_notes` (sans filtre `work` —
les notifications agrègent toutes les œuvres ; le filtrage parent/
mention se fait côté client dans `onPublicInsert`). (Dé)branché sur
`SHELL.auth.onChange` (connexion → `ensureRealtime()`, déconnexion →
`teardownRealtime()` + reset état + pastilles effacées). Polling de
secours toutes les 15 s au cas où le canal tomberait (`refreshDM` +
`refreshNotif`). Ne **jamais** ouvrir un second client Supabase —
toujours passer par `SHELL.auth.getClient()` (sinon warning « Multiple
GoTrueClient instances »).

**Notifications multi-œuvres.** `refreshNotif` interroge `public_notes`
sans filtre `work` (réponses à mes notes + mentions @pseudo), agrège
les résultats et limite à 40. Le clic sur une notification résout
`work → path` via `bibliotheque.json` (alias `'capital' → 'capital-1'`
pour les lignes héritées) et navigue vers la page de l'œuvre si elle
est `available`. Le surlignage précis du passage est différé à la
mission `shell-forum-passage` (5b) — qui fermera la boucle des
deep-links en émettant un fragment `#note=<id>` (ou `#s=&q=`) ouvert
ensuite par `SHELL.reader`.

**Contrat liseuse `SHELL.reader.attach`.** Chaque page de livre,
après avoir rendu le texte d'une section, déclare sa liseuse au
shell :

```js
SHELL.reader.attach({
  workId:       'manuscrits-1844',   // = id bibliotheque.json
  section:      curSectionNumber,    // identifiant numérique
  container:    elementContenantLeTexte,
  sectionLabel: 'Premier manuscrit'  // optionnel
});
```

`SHELL.annotations` se branche dessus : applique les surlignages
stockés, câble sélection → surlignage, gère le popup de note et le
panneau « Mes notes » + bouton flottant. La page de livre ne s'occupe
que de **rendre le texte** et d'**appeler attach** à chaque
(re)affichage de section.

**Invariant d'ancrage.** Une annotation est ancrée par texte
(`before / quote / after`), pas par range DOM. Toute liseuse qui rend
le texte d'une section dans un conteneur peut donc réutiliser la même
logique : la retrouvaille du passage se fait par recherche de `quote`
avec contexte (`locate()`).

**Règle table `annotations`.** Le schéma est `{id, work, section,
before, quote, after, color, note, created}`. **Aucun `user_id`
explicite n'est posé à l'INSERT** — un défaut côté base ou un trigger
de policy RLS le pose à `auth.uid()`. Préserver ce comportement à
l'identique côté shell ; si un INSERT échoue depuis une page shell
alors qu'il marche sur Capital, c'est une policy à revoir, pas un
contournement à coder.

**Contrat de deep-link au passage.** Place publique
(`SHELL.commune`) et notifications (`SHELL.social`) ouvrent une
page d'œuvre avec un fragment `#note=<id>` (id `public_notes`).
`SHELL.reader.parseDeepLink()` lit la cible au chargement du module,
`SHELL.reader.resolveDeepLink(workId)` fetch la ligne pour
récupérer `section / quote / before / after` (et suit `parent_id`
si la ligne est une réponse sans citation propre). La page d'œuvre
appelle `resolveDeepLink` dans son `init()`, ouvre la bonne section,
et la prochaine `SHELL.reader.attach()` déclenche `flashAnchor` sur
le passage. Variante explicite supportée :
`#s=<section>&q=<quote>&b=<before>&a=<after>`.

**Forum public par passage.** À chaque `attach()`, le shell
recharge les `public_notes` ancrées (filtrées sur `work=workId`,
`section`, `hidden=false`). Le bouton flottant « Notes partagées »
ouvre un panneau qui liste les notes (top + replies), avec
« Aller au passage », « Répondre » et « Supprimer » (pour mes
propres notes). Composition : sélection dans le texte → bouton
« Partager » dans l'anno-bar → popover avec textarea → INSERT
dans `public_notes` (avec `before/quote/after`). La modération
(`reports`, `hidden`, rôle `moderators`) est **faite** — mission
`moderation-5c`, voir la section « Modération » ci-dessous.

**Reste couplé à la liseuse.** Le surlignage précis du passage
(deep-link au passage) et le profil membre cliquable (notes publiques
+ « aller au passage ») partagent le même contrat de deep-link et
sortiront avec la mission annotations. En attendant, le bouton
« Voir le profil » n'existe pas encore sur la page Messages, et un clic sur
une notification ouvrira la page de l'œuvre sans surligner le passage
exact.

**Pour ajouter un livre :**
1. Créer `oeuvres/<id>.html` + `oeuvres/<id>.css` + le dossier
   `oeuvres/<id>/{manifest.json, textes/}`.
2. Lier les CSS dans cet ordre : atelier.css → shell.css → propre.
3. Définir `window.activateTab` dans le JS du livre.
4. Charger `shell.js` puis (optionnellement) `shell-social.js`.
5. Appeler `installShell({workId, workTitle, tabs:[…]})` à la fin du body.
6. Ajouter l'entrée dans `oeuvres/bibliotheque.json` (`status:'planned'`
   au début, puis `'available'` quand la page fonctionne réellement).

## Mon compte — le panneau (mission `compte-refonte`, septembre 2026)

Demande du propriétaire : « refaire la section Mon compte, l'enrichir, la
mettre à jour UI/UX et design conformément au reste du site ». Diagnostic
mesuré avant de toucher au code :

- **Sur `/index.html`, le bouton « Se connecter » était le bouton GRIS de
  l'agent utilisateur** — bordure `2px outset` noire, Arial, rayon 0. Le
  panneau utilisait `.btn`, qui n'existe que dans `atelier.css` ; l'accueil
  ne charge que `shell.css`. Le défaut vivait sur la page la plus visitée.
- **Le panneau ne disait rien du compte.** Une carte de 440 px empilait
  identité, pseudo, photo, description, déconnexion et suppression au même
  niveau — sept commandes, aucune hiérarchie — alors que la synchronisation
  des passages est sa seule raison d'être.
- **On ne pouvait pas changer son mot de passe une fois connecté** :
  `updatePassword` n'était atteignable que par « mot de passe oublié »,
  donc déconnecté.
- **`.ac-t.on` était un aplat CRÈME** (`background:var(--ink)`) — l'erreur
  exacte que le socle sombre avait corrigée partout ailleurs.
- **Trois pages portaient une COPIE des règles `.ac-*`** dans leur
  `<style>` (`capital-1.html` en entier, plus deux surcharges sur
  `index.html` et `bibliotheque.html`). À spécificité égale, c'est l'ordre
  des feuilles qui tranchait : le panneau changeait de tête d'une page à
  l'autre.
- **Deux tokens manquaient** au `:root` d'`index.html` et de
  `bibliotheque.html` (`--red-text`, `--line-strong`, `--hover`), et
  `--red-deep` y valait encore `#b5372a`, soit **2,9:1** — les composants
  du shell qui l'emploient (`.cm-go`, `.cm-all`, `.pub-author`,
  `.msg-poplink`, `.ac-err`) y étaient illisibles.

### La forme

Une tête d'identité sur la **surface d'emphase du socle** (dégradé chaud
`150deg,#2c2117,#211a12,#1b150e`, filet or à 20 %, halo radial qui monte du
bas — la bougie éclaire d'en bas), puis **trois destinations** en sélecteur
segmenté, l'actif prenant cette même surface :

- **Profil** — ce que les autres voient : pseudo, description, photo, et un
  **aperçu de la signature telle qu'elle paraît sur la Place publique**
  (cachet + Caveat or), qui suit la frappe **sans re-rendu** — re-rendre
  volerait le focus du champ à chaque lettre.
- **Lecture** — ce que le compte porte : quatre chiffres, la reprise, les
  trois derniers passages (barre à la couleur du surlignage, citation en
  Spectral, note en Caveat), « Ouvrir mon carnet ».
- **Compte** — connexion, changement de mot de passe (déplié à la demande),
  confidentialité, export du carnet, et la **zone de danger** séparée.

**Les chiffres viennent TOUS de Supabase, jamais du localStorage.** Ce
panneau parle du COMPTE, pas de ce navigateur — et c'est aussi ce qui le
rend identique partout : `/index.html`, `bibliotheque.html` et
`place-publique.html` ne chargent pas `shell-annotations.js`, le carnet
local n'y serait pas lisible. Quatre `count:'exact', head:true` sur
`annotations`, `reading_progress` et `public_notes`, lancés **à l'ouverture
de la modale** et non au chargement de la page (la plupart des visites ne
l'ouvrent pas), donc **hors du verrou GoTrue**.

La reprise, elle, reste **locale** — c'est un fait d'appareil, et la
section le dit : « Reprendre sur cet appareil ».

### Ce qui a changé de règle

- **`shell.css` est le système de record du panneau, et tout y est scopé
  sous `#acctView`** (et `#privacyModal`). C'est ce qui le rend indifférent
  à l'ordre des feuilles et aux copies de page. Le bloc `.ac-*` recopié
  dans `capital-1.html` a été supprimé, ainsi que les fragments du même
  ordre dans `socCss7`.
- **Le panneau ne dépend plus d'`atelier.css`** : ses boutons sont les
  siens (`.ac-btn`, `.ac-btn.pri` = la pilule pleine de la maison,
  `.ac-btn.danger`, `.ac-quiet`). Toute nouvelle commande du shell doit
  faire pareil — `.btn` n'existe pas sur l'accueil.
- **Un seul « Enregistrer » pour le pseudo ET la description.** Deux
  boutons d'enregistrement dans la même carte, c'est une chance sur deux de
  cliquer le mauvais.
- **Les messages de GoTrue sont traduits** (`ERR_FR` / `errFr`) :
  « Invalid login credentials » était la phrase la plus vue du site, en
  anglais. Les messages inconnus **passent tels quels** — mieux vaut un
  message anglais qu'un « Échec » qui n'apprend rien.
- **Le panneau et la modale Confidentialité passent au VOUVOIEMENT**, comme
  le carnet, la marge de l'atelier et la bibliothèque. Le compte était le
  dernier îlot de tutoiement.
- **Les deux filets latéraux de 3 px** (`.ac-err`, `.ac-ok`) ont disparu au
  profit d'un liseré complet à rayon 12 — la grammaire d'encart déjà posée
  par `atelier-moderne`.

### Pièges rencontrés

1. **`--red-text` (#e5644f) ne passe PAS sur un fond déjà teinté de
   rouge** : mesuré à 4,33:1 sur `.ac-btn.danger` et 4,44:1 sur `.ac-err`.
   Le rouge clair de la maison (`#f0917f`, celui des pastilles de
   recherche) repasse la barre sans changer la couleur perçue. La règle
   « le rouge du texte passe par `--red-text` » vaut sur `--bg` et
   `--card`, pas sur une surface teintée.
2. **`bibLite()` ne doit pas vivre derrière la garde de cache de
   `loadExtras()`** : à la deuxième ouverture du panneau, les comptes sont
   en cache, la fonction sortait tôt — et la bibliothèque n'était jamais
   chargée, donc ni titre d'œuvre ni lien de passage.
3. **Le panneau est réécrit en entier à chaque rendu** : sans
   `view.focusSel`, le focus retombe sur `<body>` dès qu'on change d'onglet
   ou qu'on déplie un champ. La confirmation de suppression met le focus
   sur **Annuler**, jamais sur le bouton destructeur.
4. **`animation … both` + pane masquée** : les animations CSS y sont gelées,
   la carte reste donc à l'opacité 0 de sa keyframe d'entrée et **toute
   sonde qui filtre sur l'opacité voit une page vide**. Neutraliser
   `animation` ET `transition` avant de mesurer (le piège était déjà
   documenté pour les transitions ; il vaut aussi pour `fill-mode`).
5. Rappel confirmé une fois de plus : sur `capital-1.html` (133 000 px de
   document) **toute capture revient noire**. Le panneau se vérifie à la
   mesure DOM, et à l'écran depuis une page courte.

### Vérifié

Sonde de contraste sur le rendu : **0 échec sur 11 états** (profil,
lecture, compte, mot de passe déplié, zone de danger, messages d'erreur et
de succès, invité, inscription, récupération, confidentialité), minimum
**5,15:1**, aucun texte sous 11 px. Détecteur statique : **0 erreur**, et le
total des cinq fichiers touchés passe de 87 à 86 constats (deux
`side-tab` de moins — les filets de 3 px retirés). Testé à 1280 et 375 px :
**zéro débordement horizontal**, aucune cible sous 24 × 24. Clavier :
flèches et tabindex roulant sur le sélecteur segmenté, `aria-selected`
exact, focus restitué après chaque re-rendu, Échap qui ferme
Confidentialité puis le panneau, `inert` rendu. Console sans erreur sur les
six pages qui chargent le shell (accueil, bibliothèque, Place publique,
carnet, Capital, Manuscrits). Chemins réels testés contre Supabase :
connexion refusée et mot de passe trop court, tous deux en français.


## La liseuse et les formules (mission `formules-sans-images`, sept. 2026)

**`cleanWS()` parse dans un document INERTE (`DOMParser`), jamais dans un
`<div>` détaché.** Un div appartient au document courant : lui poser un
`innerHTML` lance IMMÉDIATEMENT le chargement de toutes ses images, et le
`img` retiré à la ligne suivante n'annule rien — les requêtes sont
parties. Les **quarante-neuf formules du Livre I** réclamaient ainsi
autant de SVG à `wikimedia.org`, aussitôt avortés : autant d'erreurs en
console pour des images qu'on ne voulait pas afficher. Les URL, elles,
étaient parfaitement valides (vérifié : 200) — ne pas partir en chasse
d'une réécriture de `src`. **Toute future manipulation de HTML distant
doit passer par DOMParser.**

**Wikisource sert ses formules sous DEUX formes, et les deux se croisent
dans le Livre I** : (1) une image SVG doublée d'un MathML masqué en ligne
(`style="display:none"`) — le gros du livre ; (2) du MathML natif sans
image, l'élément `<math>` portant LUI-MÊME la classe `mwe-math-element` —
toute la section VI. Un `el.querySelector('math')` ne voit pas la seconde
et l'aurait supprimée : `el.matches('math')?el:el.querySelector('math')`.

Sous la forme 1, le nettoyage faisait **disparaître la formule
entièrement** (image retirée, MathML masqué) — y compris, au chapitre du
taux de la plus-value, les égalités qui en sont le propos. On garde
partout le MathML et on le démasque (`mathWS`) : aucune requête, la
couleur du texte, les trois thèmes de liseuse suivis.

Trois corrections sans lesquelles ce MathML n'est pas lisible :
1. Wikisource enveloppe ses formules dans `\scriptstyle` pour que
   l'IMAGE tienne dans la ligne → `scriptlevel` positif, formule deux
   crans trop petite. On ramène ces `mstyle` à `0`.
2. **MathML Core ne connaît plus les espaces NOMMÉES de MathML 3** : un
   `width="thickmathspace"` y vaut zéro, et « 3 livres sterling 11
   shillings » se rendait en un seul mot collé. Table `MSPACE`.
3. Les accolades des tableaux de la forme-valeur ne sont pas des formules
   mais un **trait** (`\left\}` sur une matrice vide, étirée par
   Wikisource sur les lignes accolées). **Chrome ne met pas en page les
   `<mtable>`** : la matrice y est haute de zéro et l'accolade ne s'étire
   sur rien. Elle est dessinée (`.ws-brace`, SVG `preserveAspectRatio="none"`
   + `vector-effect`), calée en absolu sur la cellule qui porte le
   `rowspan` — **cellule marquée depuis le JS, pas par un `:has()`** :
   une hauteur en pourcentage dans un `<td>` à hauteur automatique ne se
   résout pas de façon fiable (mesuré : cinq lignes sur sept). Sa couleur
   passe par **`--red-deep`**, le seul token rouge que CHAQUE thème de
   liseuse redéfinit (`--red-text` n'existe pas en sépia).

**Vérifié** : huit sections (zéro requête wikimedia, zéro image, zéro
`mwe-math-element` restant, zéro scriptlevel positif, zéro espace nommée) ;
chapitres I (accolades), IX (fractions), XX (MathML natif) et XV (sans
formule) chargés en vrai, console sans erreur, liseuse et annotations
montées, zéro débordement horizontal à 1280 et 375 px ; contraste de
l'accolade 5,12 / 5,74 / 9,26:1 dans les trois thèmes ; `detect.mjs`
20 constats, 0 erreur (niveau d'avant la mission).

**Piège d'outillage ajouté** : les requêtes d'images avortées n'apparaissent
PAS dans `read_console_messages` (elles viennent de la pile réseau, pas de
l'API `console`) — c'est `performance.getEntriesByType('resource')` qui les
montre. Et une ressource tierce sans `Timing-Allow-Origin` rend toujours
`responseStatus:0` / `transferSize:0` : ce n'est pas la preuve d'un échec.

## `capital-1.html` = livre comme les autres

Depuis la sous-mission `retrait-shell-host` (6f), Capital est **un livre
comme un autre** côté UX *et* côté coquille : il consomme `installShell`
+ `SHELL.auth` + `SHELL.reader.attach` + `SHELL.annotations` +
`SHELL.social` + `SHELL.commune` exactement comme `manuscrits-1844.html`.
La recherche partagée (basée sur `bibliotheque.json`) et le bouton
« Nous soutenir » vivent désormais entièrement dans `shell.js`.

**`SHELL_HOST`, `gotoHost` et le routeur de hash de Capital n'existent
plus.** Plus aucun bouton du site ne redirige vers `capital-1.html`
pour activer une fonctionnalité. Compte, Place publique, CGU,
messagerie, notifications, contacts, recherche, soutien — tout
fonctionne **en place**, sur la page courante, quelle qu'elle soit.

Ce qui reste inliné dans `capital-1.html` est **propre à Capital** : le
contenu de l'atelier (intro, plan, modèles, parcours, chronologie,
explorations, glossaire) et la liseuse qui charge le texte intégral
chapitre par chapitre. C'est le rôle attendu d'une page de livre.

**Pour ajouter un nouveau livre** : voir « Shell partagé », point
« Pour ajouter un livre ». Capital n'est plus un cas spécial à étudier.

## Modération (mission `moderation-5c`)

- **Le SQL vit dans `supabase/schema.sql`** (blocs idempotents en fin de
  fichier). PIÈGE VÉCU : les tables `moderators` et `reports`
  EXISTAIENT déjà dans la base (créées à la main au début du projet),
  avec une structure différente de celle qu'on aurait dessinée — un
  `create table if not exists` ne crée alors RIEN et une policy sur une
  colonne supposée explose (« column does not exist »). Toujours
  introspection d'abord (`information_schema.columns`) avant d'écrire
  du SQL pour cette base. Structure RÉELLE : `moderators(id uuid)` — id
  = user_id du modérateur, table remplie À LA MAIN depuis le dashboard
  (pas d'UI d'administration, c'est voulu) ; `reports(id text, note_id
  text, reporter_id uuid, reason, created bigint, resolved)` — le style
  de public_notes : id client, created en millisecondes. RLS : chacun ne
  lit de `moderators` QUE sa propre ligne (test « suis-je
  modérateur ? ») ; `reports.reporter_id` posé par défaut à
  `auth.uid()`, jamais à l'INSERT (règle maison). **À REJOUER dans
  Supabase** — tant que ce n'est pas fait, « Signaler » échoue avec un
  toast d'erreur (chemin prévu).
- **`SHELL.mod`** (shell.js) : `isMod()` SYNCHRONE (cache, pour s'appeler
  en plein rendu), `ensure()`, `onChange(cb)`, `report(noteId, reason)`,
  `setHidden(noteId, bool)`. Le cache se rafraîchit sur
  `SHELL.auth.onChange` **en différé** (`setTimeout 0` — jamais d'await
  Supabase dans un callback onChange, règle deadlock GoTrue).
- **Deux surfaces** (depuis la refonte forum d'août 2026) : le panneau
  « Notes partagées » par passage (shell-annotations.js) et le forum de
  la Place publique — fil ET vue de fil (place-publique.html). Partout :
  « Signaler » sur toute note qui n'est pas la sienne (gating
  `ensurePoster` — toast + modale si déconnecté), motif facultatif dans
  une petite boîte inline ; pour un modérateur, « Masquer »/« Rétablir »
  et les notes masquées visibles ESTOMPÉES avec l'étiquette « Masquée ».
  Le fetch retire le filtre `hidden=false` seulement si `isMod()` ;
  comme le statut arrive en différé, chaque surface s'abonne à
  `SHELL.mod.onChange` pour recharger. (Les crochets 3D `onNoteHidden` /
  `hitMeshes` ont disparu avec la salle.)
- `SHELL.commune` (aperçus lecture seule) reste filtré `hidden=false` et
  sans actions — ne pas l'équiper.
- **Validé en production par le propriétaire** (août 2026, sur la
  2e passe) : SQL rejoué, sa ligne insérée dans `moderators`, puis
  signalement, masquage et rétablissement testés en vrai. La 3e passe
  (forum) reprend les mêmes appels `SHELL.mod` à l'identique.

## SEO technique : les URL réelles, les schémas (mission `seo-urls-reelles`, sept. 2026)

**Le défaut de fond : le site se désignait lui-même par des URL qui
redirigent.** Cloudflare Pages sert des URL PROPRES — mesuré en production,
`/oeuvres/capital-1.html` répond **308** vers `/oeuvres/capital-1`. Or les
cinq entrées du sitemap, tous les `rel="canonical"` et tous les `og:url`
étaient en `.html`. Chaque canonique désignait donc une page qui redirige,
ce qui est exactement ce qu'une canonique ne doit pas faire. C'est le
COUSIN du piège déjà documenté pour `shell.js` (« Cloudflare Pages sert des
URL propres »), qui avait fait échouer en silence le marquage de la sidebar
en production — même cause, autre surface.

**Les deux pages les plus importantes du site n'avaient AUCUNE canonique** :
`capital-1.html` et `manuscrits-1844.html` ne portaient qu'un `og:url`.

Corrigé : les huit pages portent une canonique sans extension, `og:url` est
aligné, et l'`url` du `CollectionPage` de la bibliothèque aussi (elle était
restée en `.html` — un `url` de JSON-LD qui redirige est le même défaut).
**Vérifié en production, pas seulement en local** : les cinq URL du sitemap
et les sept canoniques répondent 200, zéro redirection.

### `tools/gen-seo.mjs` — le sitemap et les Book sont DÉRIVÉS

Comme le FAQPage de l'accueil, et pour la même raison : deux copies d'une
même donnée divergent en silence. Le script lit `oeuvres/bibliotheque.json`
(**source unique**) et récrit (a) le bloc `Book` de chaque œuvre
`available`, (b) `sitemap.xml`. Il n'est **pas** une étape de build — le
site reste statique, Cloudflare ne l'exécute jamais ; c'est un outil de
dépôt, comme `tools/export-chariot.mjs`. On le lance à la main, on commite
le résultat.

```
node tools/gen-seo.mjs           # régénère
node tools/gen-seo.mjs --check   # sort 1 si le dépôt est périmé
```

Il est **idempotent** et **échoue bruyamment** si une œuvre passe en
`available` sans faits d'édition — on ne peut pas publier un Book muet par
distraction. Les titres, descriptions et concepts ne sont jamais recopiés :
ils sont lus. Seuls les faits d'édition absents de `bibliotheque.json`
vivent dans la table `EDITION`, **chacun annoté de l'endroit où il est
VISIBLE dans la page** — un JSON-LD ne doit affirmer que ce que le lecteur
peut vérifier de ses yeux.

Note : `lastmod` vient de `git log` du fichier, donc au moment de la
génération il ignore le commit qui va suivre. Granularité au jour, on
régénère et on commite le même jour — sans conséquence, mais à savoir.

### Ce que les schémas disent, et ce qu'ils TAISENT

`Book` pour Le Capital : Roy traducteur, `bookEdition` (1872-1875, revue par
Marx), `translationOfWork` vers l'original allemand, `isBasedOn` vers
Wikisource — **la source réelle du texte affiché**, celle que `loadSection()`
appelle. Pour les Manuscrits : `dateCreated` 1844 **et** `datePublished`
1932, parce que les 88 ans d'écart sont le fait qui situe l'œuvre. L'auteur
porte `sameAs` vers Wikidata Q9061 (vérifié) : c'est l'ancrage d'entité qui
vaut le plus pour un moteur de réponse.

**Le silence est délibéré sur la licence des Manuscrits.** (Écrit avant la
mission `affaire-palmier`, qui a établi que « Palmier » était une erreur
d'attribution — voir plus bas. Le raisonnement ci-dessous reste juste, seul
le nom était faux.) La page affichait alors
« domaine public », mais la traduction est une
traduction française du XXe siècle — elle n'est pas dans le domaine public
du seul fait que l'original de 1844 l'est. Un `license:` en JSON-LD est une
affirmation juridique lisible par machine : on l'omet plutôt que de l'écrire
sans pouvoir l'établir. `isAccessibleForFree` reste vrai (la page est bien
gratuite). Le Capital garde sa licence : Roy est mort en 1900, sa traduction
est sûrement dans le domaine public. **La mention « domaine public » affichée
sous les Manuscrits reste à vérifier — elle est hors périmètre de cette
mission, mais elle est signalée.**

Et le nom du traducteur est laissé tel que la page l'imprime (« J.-M.
Palmier ») et non « complété » — le schéma ne doit rien affirmer de plus que
ce qui est à l'écran. La mission `affaire-palmier` est allée plus loin : le
nom lui-même étant faux, le champ `translator` a été retiré.

### Le carnet et la messagerie sont HORS du sitemap — c'est un choix

`oeuvres/carnet.html` et `oeuvres/messages.html` n'y sont pas. Déconnecté,
ces deux pages n'ont **aucun contenu à indexer** : elles n'affichent qu'une
invitation à se connecter. Les annoncer dans un sitemap, c'est demander à un
moteur de venir chercher une page vide, et diluer le signal des cinq pages
qui portent vraiment le corpus. Elles restent **crawlables** (`robots.txt`
dit `Allow: /`) et portent **chacune leur canonique** — on ne les cache pas,
on ne les met simplement pas en avant. `oeuvres/index.html` en est absente
aussi : c'est une redirection 301 (voir `_redirects`).

*Suite possible, non faite (décision du propriétaire) :* leur poser un
`noindex` serait le geste cohérent jusqu'au bout. Ça les retire de la
recherche pour de bon — c'est éditorial, pas technique, donc pas tranché ici.

### L'Organization, le `sameAs` et l'homonyme

`sameAs` ne contient QUE le dépôt public du site
(`github.com/chevallierfabio-hue/lire-marx`, vérifié 200). **Ne rien y
inventer : un `sameAs` faux est pire qu'un `sameAs` absent.** Ajouter un
profil le jour où il existe vraiment.

**Il existe un homonyme actif : `liremarx.noblogs.org`**, blog savant sur
Marx (recensions, Hegel, ontologie), bien référencé sur les mêmes sujets. Il
dispute la requête de marque et un moteur de réponse peut fondre les deux
entités. Arbitrage du propriétaire : **on ne renomme pas.** « Lire Marx » est
dans le brandmark, le H1 et le suffixe des huit titres de page — renommer
coûterait bien plus que le gain, et un schéma qui nommerait l'entité
autrement que la page mentirait. La distinction passe donc par la
**description** de l'Organization (ce qu'on y FAIT : texte intégral,
appareil en marge, simulations, forum) et par l'**ancrage d'entité**
(`url` + `sameAs`) — pour un moteur, ce sont eux qui séparent deux
homonymes, pas le nom. Ne pas rouvrir sans le propriétaire.

### Rappel

Le FAQPage de l'accueil reste **dérivé du balisage `#questions`** et ne se
récrit jamais à la main (voir son commentaire dans `index.html`). Vérifié
intact après cette mission : les neuf questions du JSON-LD correspondent mot
pour mot au visible. Et Google ne montre plus de résultat enrichi FAQ depuis
août 2023 hors sites gouvernementaux et de santé : ce balisage sert la
**lecture machine**, pas un snippet — ne rien promettre d'autre.

## Le registre de la bibliothèque est SERVI (mission `seo-registre-servi`, sept. 2026)

**Le défaut, mesuré :** `oeuvres/bibliotheque.html` servait **49 mots** et
**pas un seul titre d'œuvre**. Son registre à plat (`#bxFlat`) — celui que
ce fichier décrivait comme « la version des lecteurs d'écran et des
robots » — était en fait **peuplé par JS** (`elFlGroups.innerHTML` depuis
`bibliotheque.json`). « Le Capital », « Grundrisse », « L'Idéologie
allemande » n'existaient nulle part dans le HTML servi.

Nuance à garder : **Google exécute le JS** et finissait par le voir. Les
crawlers des moteurs de réponse (GPTBot, ClaudeBot, PerplexityBot), non —
ils lisent le HTML brut. C'était donc d'abord un défaut **GEO**.

`tools/gen-seo.mjs` pré-rend désormais le registre : **49 → 1 117 mots**,
les douze œuvres, leurs descriptions, concepts, relations et guides.

### La règle qui tient tout : les deux rendus doivent être IDENTIQUES

Le pré-rendu et `renderFlat()` produisent le même balisage, et le JS
réécrit par-dessus. **Vérifié à la mesure : 12 791 caractères de part et
d'autre, zéro divergence.** C'est le prix d'un rendu à deux endroits —
`flatRegister()` dans le script et `renderFlat()` dans la page doivent
bouger ENSEMBLE. Le test d'identité (comparer `#flGroups.innerHTML` au HTML
servi) est à rejouer après toute retouche de l'un des deux.

**Aucun changement visuel** : `.js-bib3d #bxFlat{display:none}` masque le
registre dès que la scène 3D démarre — vérifié, `display:none` et
`getClientRects()` vide en mode scène, registre complet en `#liste`.

### Deux pièges rencontrés

1. **L'échec du `fetch` effaçait le pré-rendu.** Le `.catch` remplaçait
   `#flGroups` par « La bibliothèque n'a pas pu être chargée » — ce qui,
   avec un registre déjà servi dans le HTML, aurait détruit du bon contenu
   pour le remplacer par un message d'erreur. Il est maintenant gardé par
   `data-prerendu` : si le registre est là, on le garde et l'on se contente
   du `console.warn`.
2. **Un garde d'idempotence qui teste le CHANGEMENT au lieu du POINT
   D'INSERTION lève une erreur quand tout va bien.** `if (next === src)
   throw` semblait dire « je n'ai rien trouvé à remplacer » ; il disait en
   fait « le dépôt est déjà à jour ». On teste le point d'insertion
   (`re.test(src)`), jamais le résultat.

### Les liens internes ne passent plus par une redirection

Même défaut que les canoniques de la mission précédente, sur les liens :
`path` de `bibliotheque.json` garde son `.html` (c'est le contrat de la
donnée, on n'y touche pas), mais **les trois endroits qui en font une URL
le retirent** — `href()` de la bibliothèque, `localPath()` de `home.js`
(les cartes du catalogue de l'accueil), et `hrefOf()` de `gen-seo.mjs`.
Plus les quatre liens en dur de `index.html`. **Zéro lien interne en
`.html` dans le HTML du site.**

**~~Reste à faire~~ — FAIT en septembre 2026** (mission
`seo-maillage-interne`) : `shell.js` naviguait encore vers des `.html`
(sidebar, popovers, plus deux vraies ancres — « Ouvrir mon carnet » et
« Voir toutes les notes → », cette dernière montée sur l'accueil et la
bibliothèque). Neuf URL corrigées dans `shell.js` et `shell-social.js`, plus
trois ancres relatives en dur (`carnet.html` sur les deux ateliers,
`bibliotheque.html` sur le carnet). **Il ne reste aucune ancre interne en
`.html` dans tout le site.** Les tests de chemin, eux, acceptent toujours
les deux formes (`/\/oeuvres\/messages(\.html)?$/`) — ne pas les resserrer,
c'est ce qui rend le marquage robuste.

### Le `noindex` du carnet et de la messagerie existait déjà

Posé par la mission `messages-page` (commit 8391ffa). Rien à faire — noté
ici pour ne pas le « redécouvrir » une troisième fois. Leur canonique
coexiste avec le `noindex` : c'est redondant (une canonique dit « indexe
cette URL-ci », le noindex dit « n'indexe pas ») mais sans conséquence
pratique, et ça garde l'URL propre si le `noindex` tombait un jour.

## La vraie 404 (mission `seo-vraie-404`, sept. 2026)

**Le défaut, mesuré en production :** toute adresse inconnue répondait
**200 avec la page d'accueil**.

```
/nimportequoi        → 200 + accueil
/oeuvres/capital-99  → 200 + accueil
/BingSiteAuth.xml    → 200 + accueil
```

C'est un *soft 404*. Un moteur y voit un nombre **infini** d'URL valides et
indexables, toutes avec le même contenu : budget de crawl gaspillé, et un
rapport « Pages » de Search Console qui se remplit d'URL fantômes. Trouvé
par accident en testant si un fichier de vérification Bing existait — il
« existait », comme tout le reste.

Corrigé par un `404.html` à la racine, que Cloudflare Pages sert avec un
vrai statut 404 pour les chemins non résolus.

**Trois contraintes propres à une page d'erreur, à ne pas perdre :**

1. **Tous les chemins sont ABSOLUS.** La page est servie à n'importe quelle
   profondeur (`/x`, `/oeuvres/x/y/z`) : un chemin relatif se résoudrait
   contre l'URL fautive et casserait la feuille de style comme les liens.
   Vérifié : les cinq liens et le `<link>` de polices commencent par `/`.
2. **Elle est autonome** — ni `shell.js`, ni `atelier.css`. Une page
   d'erreur doit s'afficher même quand autre chose ne va pas ; la faire
   dépendre de ce qu'on n'a pas réussi à servir serait absurde. Le CSS est
   inline, seules les polices sont partagées.
3. **`noindex, follow`** — on ne veut pas la voir en résultat, mais les
   liens qu'elle porte restent utiles à suivre.

**Les six constats de `detect.mjs` sur cette page sont tous documentés.**
Deux méritent d'être nommés parce qu'ils reviendront : le `low-contrast`
(`--accent` #d5402f sur `--bg`, 4,1:1) est un **faux positif** — le
détecteur ignore la taille, or le texte concerné est le `em` du `<h1>`,
**mesuré à 48 px**, donc du grand texte, dont le seuil est 3:1. C'est
exactement l'usage de `.hs-h1 em` sur l'accueil. Et le `hero-eyebrow-chip`
(« ERREUR 404 » en capitales espacées au-dessus du titre) est la grammaire
de micro-libellé de la maison (`.hs-sec-label`, .72rem/600/.11em), déjà
signalée comme choix de DA à ne pas « corriger ».

**Si la 404 revenait à 200 après déploiement**, ce ne serait pas le fichier
mais un réglage du projet Cloudflare Pages (routage « single-page
application », qui rabat tout sur `index.html`). Cela se règle au tableau
de bord, pas dans le dépôt.

## Le titre, la description et le logo (mission `titre-description-logo`, sept. 2026)

Demande du propriétaire, à partir de ce que Google affichait : changer le
titre de l'accueil, faire mentionner **le jeu** par la description, et
**donner un logo au site** — le résultat de recherche montrait le globe
générique, faute de favicon.

**Le site n'avait AUCUN favicon.** Aucune balise `rel="icon"` sur les huit
pages, aucun `/favicon.ico` à la racine. C'est ce globe que Google montrait.

### Le logo

Le mark reprend **le brandmark** (`Lire`**·**`Marx` de shell.js, Fraunces 900
avec son point rouge) : carré brun-nuit à angles arrondis (18,75 %), dégradé
radial chaud `#241a11 → #130f0a`, **M de Fraunces 900** en crème `#f3e9d4`,
et le **point rouge** `#d5402f` collé à sa droite, sur la ligne de base.
Aucun élément nouveau de vocabulaire : c'est la signature du site réduite à
une lettre.

- **Il est RASTER, et c'est délibéré.** Un M dessiné à la main en SVG
  n'aurait pas été le M de Fraunces ; et rien dans l'environnement ne sait
  extraire un contour de glyphe d'un woff2 (ni fontTools, ni rsvg, ni
  ImageMagick). Le master a donc été rendu **au canvas dans le navigateur**,
  avec la vraie Fraunces locale, à 512 px ; les autres tailles en descendent
  par `sips -Z`.
- **Une seule source pour toutes les tailles, angles arrondis compris.** Le
  masque d'iOS pour l'`apple-touch-icon` arrondit à ~22,5 % — plus que nos
  18,75 % — donc nos coins transparents tombent entièrement dans ce qu'iOS
  découpe : pas d'artefact, pas de rendu carré séparé à maintenir.
- Fichiers : `assets/img/logo/icon-{16,32,48,192,512}.png`,
  `apple-touch-icon.png` (180), et `/favicon.ico` — un conteneur ICO
  assemblé à la main qui **embarque les PNG 16/32/48 tels quels** (format
  Vista+), les 16 et 32 ne servant qu'à ça.
- Les balises vivent dans les **huit** pages (pas `oeuvres/index.html`, qui
  n'est qu'une redirection) et leurs chemins sont **ABSOLUS** : elles servent
  aussi `404.html`, rendue à n'importe quelle profondeur — même règle que ses
  liens.
- `Organization` gagne son `logo` (`icon-512.png`) : c'est ce que Google lit
  pour un panneau de connaissance, pas le favicon.

**Le M occupe 56 % de la boîte, pas davantage.** Vérifié à 16, 20, 24, 32 et
48 px sur fond blanc ET sur fond sombre (canvas `image-rendering:pixelated`,
agrandi ×5 — sans quoi on ne juge rien) : au-delà, il touche les angles
arrondis. Le liseré or essayé autour du carré a été écarté, il boue à 16 px.

### Le titre et la description

- Titre : **« Lire Marx — Le Capital et les Manuscrits, lus et expliqués »**.
- Description : **« Le Capital et les Manuscrits de 1844 en texte intégral,
  l'appareil critique en marge du chapitre — et Le circuit du capital, le jeu
  de la plus-value. »** — 149 caractères, donc le jeu tient **avant la
  troncature** de Google (~155-160). Trois rédactions plus riches
  (« sans prérequis », le forum, les simulations) ont été mesurées à 169,
  179 et 211 : dans toutes, le jeu passait à la trappe.
- **La description ne dit plus « bientôt »** (arbitrage du propriétaire, qui
  branche la v1 du jeu). ✅ **SOLDÉ en septembre 2026** par la mission
  `brancher-le-jeu` : le micro-libellé dit « Le jeu » et le badge
  `En développement` a été supprimé, le jour même où la v1 est passée en
  ligne. La page ne dément plus le résultat Google.
- `og:title` et `og:description` suivent. `og:image` reste le portrait Mayall
  — pour un partage social, un portrait vaut mieux qu'une pastille.

**Pourquoi ce titre, et pas « Atelier numérique pour lire Marx »** (la
première formulation, écartée après mesure) :

- **Le titre disposait de 200 px gratuits.** Google coupe vers 600 px (Arial
  20 px, mesuré au canvas) ; « Lire Marx — Atelier numérique pour lire Marx »
  n'en occupait que **399**, dont une centaine à répéter la marque que le
  chercheur vient de lire dans le nom de domaine. Le titre retenu en fait 509.
- **« Atelier numérique » appartient à Google en France** : *Google Ateliers
  Numériques*, leur programme de formation depuis 2012 (1 M+ de personnes,
  400 partenaires). La formule n'apporte donc **aucune visibilité de
  recherche** — c'est du positionnement, parfait dans un H1 ou un sous-titre,
  cher dans soixante caractères.
- **Le vrai terrain** : sur « lire Le Capital texte intégral », les
  concurrents sont Wikisource, marxists.org, les Classiques de l'UQAC,
  Gallica, Palim Psao, Internet Archive — **tous du texte brut ou du PDF**. On
  ne bat pas Wikisource sur le texte ; on gagne le clic sur ce qu'aucun d'eux
  ne peut écrire, d'où « lus et **expliqués** ».
- **La marque reste en DEUX MOTS.** « LireMarx » en un seul a été proposé puis
  écarté : le H1, le brandmark, le `name` de l'`Organization` et les sept
  autres titres de page disent tous « Lire Marx » (12 occurrences dans
  l'accueil, 0 en un mot), et c'est cet ancrage cohérent qui sépare le site de
  l'homonyme `liremarx.noblogs.org` — lequel occupe déjà le terrain sur
  « par où commencer pour lire Marx ».

### Le nom de site dans Google se lit dans `WebSite`, PAS dans `Organization`

Ajouté en septembre 2026, après que le propriétaire eut constaté que le
résultat Google affichait toujours **« liremarx.com »** au-dessus de l'URL
plutôt que « Lire Marx ». Le site déclarait pourtant `Organization` avec
`"name": "Lire Marx"` depuis cette mission-ci — mais **ce n'est pas la
propriété que Google lit** pour le nom de site.

Ce qu'il faut, et qui est désormais en place :

- un bloc **`WebSite`** avec `name` et `url`, **sur la page d'accueil et
  nulle part ailleurs** — Google ignore un `WebSite` posé sur une page
  interne, et le nom de site ne s'affiche que sur le résultat de la RACINE
  du domaine ;
- **`og:site_name`**, le signal secondaire, sur les six pages qui portent
  des balises Open Graph.

Les autres signaux étaient déjà bons et n'ont pas eu à bouger : le `<title>`
de l'accueil commence par « Lire Marx », le `<h1>` aussi.

Trois choses délibérément ABSENTES du bloc :

- **pas d'`alternateName`** — « LireMarx » en un mot a été explicitement
  écarté plus haut dans cette section, et on n'invente pas un nom que la
  page n'écrit nulle part ;
- **pas de `SearchAction`** — la *sitelinks searchbox* a été retirée par
  Google, ce balisage ne produit plus rien ;
- **pas de second `sameAs`** — la règle « ne rien inventer » vaut toujours.

Le `WebSite` désigne l'`Organization` par **`@id`**
(`https://liremarx.com/#organisation`), ajouté au passage. C'est cet ancrage
d'entité — `url` + `sameAs` + le lien entre les deux nœuds — qui distingue
ce site de son homonyme `liremarx.noblogs.org`, et non le nom, qu'ils
partagent.

**La favicon, elle, n'avait aucun défaut** : `/favicon.ico`, `icon-48` et
`icon-192` répondent 200, sont déclarés en `rel="icon"` aux tailles que
Google exige (des multiples de 48) et rien ne les bloque dans `robots.txt`.
Le globe générique du résultat signifiait seulement que **Google n'avait pas
encore recrawlé** depuis leur mise en ligne. Ne pas « corriger » une favicon
qui marche parce qu'un résultat de recherche est en retard — vérifier
d'abord qu'elle est servie et crawlable.

⏳ **Ces deux changements ne se voient pas tout de suite.** Le nom de site
comme la favicon attendent un recrawl de l'accueil, ce qui peut prendre des
jours à des semaines. Et Google reste libre de préférer le domaine s'il juge
le nom peu clair : le balisage est une demande, pas un ordre.

### Le piège : les balises de favicon ont effacé 779 lignes de Capital

`tools/gen-seo.mjs` remplaçait le bloc `Book` avec
`(?:<!--[^]*?-->\s*)?<script type="application/ld+json">…`. Le commentaire
de tête, optionnel, pouvait **traverser d'autres commentaires** : dès qu'un
commentaire quelconque apparaît plus haut dans le `<head>`, le moteur y
démarre, la paresse rallonge la capture jusqu'au commentaire qui précède
vraiment le script, et **tout ce qui est entre les deux disparaît**. Le
commentaire d'en-tête du bloc favicon a suffi à déclencher ça :
`capital-1.html` a perdu 779 lignes (tout son `<head>`), `manuscrits-1844`
232. Corrigé en interdisant la traversée — `(?:(?!-->)[^])*?`.

**La règle : un motif de remplacement non ancré qui commence par un
commentaire HTML optionnel doit interdire à ce commentaire d'en contenir un
autre.** Et le repère est facile : `--check` disait `PÉRIMÉ` sans raison
apparente juste après un ajout dans le `<head>`.

### Vérifié

`gen-seo.mjs --check` à jour et **idempotent** après correction (« Rien à
faire » au second passage). Les cinq fichiers du logo servis en 200 ;
`favicon.ico` reconnu comme *MS Windows icon resource, 3 icons*. Accueil,
Capital, Place publique et 404 chargées : console sans erreur, les quatre
balises `rel=icon` présentes, Capital intacte (deux destinations, coquille
montée, `Book` et canonique en place). `detect.mjs` sur `index.html` +
`404.html` : **34 constats, 0 erreur** — exactement la somme des bases
documentées (28 + 6). Aperçu du résultat Google reconstitué aux dimensions
réelles, en thème clair et en thème sombre.

## Le poids de l'accueil (mission `perf-poids-accueil`, sept. 2026)

Mesuré en production : **767 Ko, 32 requêtes**, DOM prêt à 506 ms. Rien
d'alarmant, mais **deux gaspillages nets, ~29 % du poids**.

**Avant de chercher un « score » : Lighthouse n'en a pas qui compte.** Son
score SEO est une liste de vérifications (title, meta description, liens
explorables), **pas un facteur de classement**. Les Core Web Vitals, eux,
en sont un — mais **modeste**, et Google les lit dans les **données de
terrain** (vrais visiteurs) : sans trafic, il n'y en a aucune. Ne pas
courir après le chiffre de laboratoire.

### 1. `Bricolage Grotesque` — 75 Ko pour personne

Le plus gros fichier de police du site. Cause : `body{font-family:
'Bricolage Grotesque'…}` dans le `<style>` de tête de `index.html`, **vestige
de l'intro cinématique retirée** (voir « Accueil animé »). CLAUDE.md dit
pourtant depuis le socle sombre qu'**Inter a remplacé Bricolage** comme
police d'interface : c'était la déclaration `body` qui n'avait pas suivi.

Vérifié élément par élément avant de toucher : **24 éléments y résolvaient,
aucun visible** — pour l'essentiel le contenu de la modale RGPD. Le `body`
est passé à Inter.

**Changement visible assumé** : la modale RGPD et la modale Confidentialité
s'affichent désormais en Inter. C'est le comportement VOULU — le vestige
était le bug. Vérifié après coup : `#privacyModal` rend en Inter, le
brandmark reste en Fraunces.

### 2. Three.js ne se télécharge plus quand il ne sert pas

`vendor/three.min.js` (148 Ko transférés) était dans le `<head>` en `defer`,
donc chargé **même sur mobile** — là précisément où les Core Web Vitals se
mesurent — alors que le décor WebGL est coupé sous 768 px et sous
`prefers-reduced-motion`.

La balise a quitté `index.html`. `assets/home.js` porte maintenant
**`withThree(fn)`** : il injecte le script une seule fois, et seulement si
les conditions du décor sont réunies.

**La règle qui rend ça sûr : on appelle TOUJOURS le consommateur**,
chargement ou pas. `heroBg()` et `circuitChariot()` gardent leur
`typeof THREE === 'undefined'` d'origine — si le script n'est pas là, ils se
taisent, exactement comme avant. Aucune de leurs entrailles n'a été touchée ;
seuls les deux points d'appel sont enveloppés (`withThree(heroBg)` dans
`init()`, `withThree(circuitChariot)` dans `circuitScrub()`).

`circuitScrub()` sort déjà tôt (`stat()`) sous reduced-motion, sous 768 px
et sur viewport court : le chariot n'est donc jamais atteint dans ces cas,
et le script encore moins.

**Piège de l'état à trois valeurs.** Un simple drapeau « en cours » ne suffit
pas : après le chargement, une file vidée mais non nulle ferait attendre
indéfiniment tout appelant suivant. D'où `threeState` à **0 / 1 / 2** (pas
commencé / en cours / fini) et non un booléen.

### Vérifié

À **1280 px** : Three.js chargé, `#hero-bg` et `#circuit-bg` dimensionnés
(donc `resize()` a tourné, le décor s'est bien initialisé), contexte WebGL
présent. À **375 px** : **zéro requête** Three.js, page complète, catalogue
rendu. Zéro requête Bricolage dans les deux cas, console sans erreur,
`detect.mjs` **28 constats / 0 erreur** — la base inchangée.

**PIÈGE INTRODUIT PAR CETTE MISSION, puis corrigé — à retenir.** Retirer la
balise `three.min.js` de `index.html` a rendu la page **solidaire** de
`home.js`, qui porte `withThree()`. Or les deux n'ont pas le même cache :

| fichier | `cache-control` |
|---|---|
| `index.html` | `max-age=0, must-revalidate` — toujours frais |
| `assets/home.js` | **`max-age=14400`** — 4 h dans le navigateur |

Un visiteur revenu dans les 4 h recevait donc le **nouvel** `index.html`
(sans la balise) et l'**ancien** `home.js` (sans `withThree`) : Three.js
n'était jamais chargé, décor mort jusqu'à expiration du cache. Constaté en
production, et pas en local — le serveur de test ne pose aucun cache.

Corrigé en versionnant l'URL : `assets/home.js?v=2`. Comme `index.html`
n'est jamais mis en cache, une URL neuve force le rechargement.

**La règle : dès que `index.html` et un actif mis en cache doivent changer
ENSEMBLE, l'actif doit porter une version dans son URL — et il faut bumper
ce numéro.** Ça vaut pour `home.js` comme pour toute feuille ou script que
la page suppose à jour. Le symptôme est trompeur : la page semble correcte,
`init()` tourne, les classes sont posées, mais un morceau ne s'arme jamais.

**Ce que je n'ai PAS touché, volontairement** : les autres polices servent
réellement, l'image du héros est déjà en WebP à 143 Ko, et le HTML est bien
compressé (93 Ko → 28 Ko transférés). Il n'y a pas d'autre gain facile ici.

## Le jeu est branché sur le site (mission `brancher-le-jeu`, sept. 2026)

*Le Circuit du Capital* vivait dans un dépôt séparé
(`~/Desktop/circuit-du-capital`, `github.com/chevallierfabio-hue/circuit-du-capital`)
et n'était accessible nulle part depuis le site, qui l'annonçait pourtant
« bientôt » depuis des mois — et dont la **description Google le promettait
déjà au présent**. Il est en ligne.

**Deux arbitrages du propriétaire au lancement :**
1. **Le jeu est construit et COMMITÉ dans le dépôt du site**, sous `jeu/` —
   plutôt qu'un second projet Cloudflare Pages sur un sous-domaine. Un seul
   domaine, un seul déploiement, rien à faire au tableau de bord. Le prix est
   d'environ **6,3 Mo d'actifs construits versionnés**.
2. **On y entre par une vraie page du site**, dans la DA de la maison —
   plutôt que droit dans le jeu. C'est la seule surface indexable des deux,
   et le chez-soi où l'on revient.

### Deux URL, et pourquoi ce découpage

```
/jeu          → jeu/index.html   la page de présentation, ÉCRITE À LA MAIN
/jeu/jouer    → jeu/jouer.html   la partie, IMPORTÉE (ne jamais éditer)
/jeu/assets/  /jeu/draco/        les actifs du build
```

Le jeu **occupe tout l'écran** (`html,body{overflow:hidden}`, `#app` en
`position:fixed`) : il ne peut pas s'embarquer dans une page qui défile, ni
partager la coquille. Il vit donc à côté, et la page est son seuil. Le
découpage `/jeu` + `/jeu/jouer` évite la collision qu'aurait produite un
`jeu.html` à côté d'un dossier `jeu/` — Cloudflare servirait les deux à
`/jeu` et l'arbitrage serait implicite.

### `tools/import-jeu.mjs` — le jeu est un actif importé, pas une dépendance

Comme `export-chariot.mjs` et `gen-seo.mjs` : **ce n'est PAS une étape de
build**, Cloudflare ne l'exécute jamais, le site reste 100 % statique. On le
lance à la main quand le jeu change, on commite le résultat.

```
node tools/import-jeu.mjs             # construit puis importe
node tools/import-jeu.mjs --no-build  # importe un dist/ déjà là
```

Il construit avec `VITE_BASE=/jeu/`, copie `dist/` dans `jeu/` en renommant
`index.html` → `jouer.html`, et **échoue bruyamment** plutôt que de publier
un jeu qui ne chargerait pas : il vérifie que le script est bien référencé
sous `/jeu/`, que la base est inlinée dans le bundle, que les actifs sont
là, et que les deux greffes sont posées. Il écrit `jeu/build.json` (version,
révision, date) — **c'est là qu'on lit quelle version du jeu est en ligne**.

**Deux fichiers du build ne sont pas servis** : les `.map` (4 Mo — on ne
publie pas les sources d'un bundle minifié ; la référence
`sourceMappingURL` est retirée du JS pour ne pas ouvrir un 404 dès qu'on
ouvre les outils de développement), et `draco_encoder.js` (932 Ko — il
ENCODE, le runtime ne fait que décoder).

**Deux greffes sont faites sur `jouer.html`**, et elles n'ont de sens que
sur ce site — d'où leur place dans le script d'import et non dans le dépôt
du jeu, où elles pollueraient un déploiement autonome :
- **`noindex, follow`** — la partie est une application, pas un document.
  C'est `/jeu` qui porte le texte. Même raisonnement que pour le carnet et
  la messagerie.
- **Le lien de retour** (`.lm-retour`, « ← Lire Marx », vers `/jeu`). Le jeu
  est en plein écran sans coquille : branché sur liremarx.com, on y entrerait
  **sans porte de sortie**. Il se pose **en bas à droite, le seul coin que le
  jeu laisse libre** (à gauche le tableau de bord et le journal ; à droite en
  haut l'aide, la formation sociale et l'objectif — vérifié : zéro
  chevauchement), et il emprunte l'habit du jeu (papier, encre, ombre portée)
  parce qu'il se pose sur SON interface et non sur celle du site. Il s'efface
  sous `body.mcinema-on`, comme tout le reste pendant la cinématique.

### Le dépôt du jeu a dû changer — et sans ça, l'import échoue

Le jeu chargeait ses actifs par chemins **absolus** (`'/draco/'`,
`'/basis/'`, `'/assets/hdri/…'`, `'/assets/models/…'`) : servi sous `/jeu/`,
il serait allé les chercher à la racine du domaine et le préchargement aurait
échoué. Ils passent désormais par `import.meta.env.BASE_URL`
(`src/assets/AssetManager.js`), et `base` se règle par la variable
`VITE_BASE` (`vite.config.js`). **Sans la variable, rien ne change** : base
`/`, le `npm run dev` et un déploiement autonome se comportent comme avant.

✅ **Fusionné dans le `main` du jeu** (commit `3862a22`) — la branche
`servir-sous-un-chemin` existe encore mais n'a plus rien à part. Un
`import-jeu.mjs` lancé depuis un dépôt du jeu à jour fonctionne donc
directement ; le garde-fou qui s'arrêtait net reste en place au cas où le
correctif disparaîtrait, et c'est voulu — mieux vaut refuser d'importer que
publier un jeu muet.

### `tools/capture-jeu.mjs` — l'image de la page est reproductible

L'image du héros n'est pas une capture prise à la main : un outil ouvre
`jeu/jouer.html` dans un Chrome piloté (puppeteer-core **emprunté au dépôt
du jeu** via `createRequire` — le site n'a ni `package.json` ni
`node_modules`, et n'en aura pas), sert le site lui-même sur un port
éphémère sans cache, lance une partie, masque **tout** le décorum
d'interface et photographie la scène à **t = 17 s**.

Cet instant n'est pas un hasard : la cinématique vient de s'achever, le
soleil se lève, le chariot est au premier plan lanterne allumée — **le même
chariot que celui qui traverse l'accueil** — et la route aligne derrière lui
la Banque en A, les deux marchés en M, l'Usine en P, l'Entrepôt en M′. C'est
le seul instant où tout cela tient dans un cadre. `--planches` tire une
planche-contact pour en rechoisir un ; ne pas déplacer `at` sans elle.

Sorties : `assets/img/jeu/circuit-plan-large.webp` (72 Ko, servi) et `.jpg`
(296 Ko, repli et `og:image`) — le motif des images d'archive.

### Ce qui a bougé ailleurs

- **La sidebar** : l'entrée `Jeux — à venir`, **désactivée**, devient
  `Le jeu` (`data-act="jeu"` → `/jeu`). Au singulier, comme la section de
  l'accueil : il y en a un. Elle mène à la présentation et **jamais droit à
  `/jeu/jouer`** — six mégaoctets, un clavier obligatoire et rien sur
  téléphone, trois choses qu'il faut avoir dites avant. Le marquage couvre
  `/jeu`, `/jeu/` **et** `/jeu/jouer` : la page vit dans un DOSSIER, donc
  `here` peut valoir l'un ou l'autre. URL propre, sans `.html` — aucune
  raison d'ajouter un 308 à une entrée neuve.
- **L'accueil** : `Le jeu · bientôt` → `Le jeu`, le badge `En développement`
  et sa règle `.circuit-soon-tag` **supprimés**, et la bande mène enfin
  quelque part (`.circuit-go` → `/jeu`). Toute la mécanique d'épinglage est
  intacte (vérifié : `js-circuit`, bande `sticky`, cale de 2 070 px).
- **Le SEO** : `/jeu/` entre au sitemap par `SITE_PAGES` dans `gen-seo.mjs`
  (source unique — ne pas éditer `sitemap.xml` à la main). **Avec le slash
  final, et c'est impératif** : voir le piège 9. `/jeu/jouer` n'y
  est **pas** : application sans contenu, et elle porte son `noindex`. La
  page porte un `VideoGame` en JSON-LD qui n'affirme que ce que l'écran
  montre — gratuit, dans un navigateur, à propos du *Capital* ; pas de note,
  pas d'avis, pas de date de sortie inventée.

### La page elle-même — ELLE PARLE LA LANGUE DE L'ACCUEIL

**Deuxième passe, sur retour du propriétaire** : « trop de texte de
présentation sous le titre, ça rend la page assez moche — s'inspirer
globalement de ce qu'on a fait sur l'accueil pour agencer et animer ». La
première version empilait un pavé de six lignes sous un titre pleine
largeur, puis l'image, puis des sections sans le moindre geste. Refaite.

Elle **ne charge pas `atelier.css`** : comme l'accueil, c'est une page de
site et non un atelier — et `atelier.css` poserait au passage son
`scroll-behavior:smooth`. Elle redéfinit donc les tokens du shell dans son
`:root`, avec le jeu de valeurs **corrigé** de l'accueil (`--red-deep` sur
`#e5644f`, plus `--red-text`, `--line-strong`, `--hover`).

**L'agencement est celui de l'accueil** : un héros en DEUX COLONNES (badge,
titre, UNE phrase, deux pilules à gauche ; la vue du jeu à droite), l'invite
« Faire défiler », puis des sections à la grammaire commune
(`.j-label` / `.j-h` / `.j-lede` aux valeurs exactes de `.hs-sec-label` et
`.hs-sec-h`). Le texte a été divisé : les ledes tiennent en une ligne, les
stations en deux, et « En pratique » est passé d'une liste de paragraphes à
**quatre faits** en colonnes.

**Les gestes sont ceux de `assets/home.js`, repris un par un** — et chacun
dit ce que sa section dit, jamais une décoration :

| section | geste | emprunté à |
|---|---|---|
| tous les titres | l'encre prend, mot à mot | `scrubReveal` (`.rw` / `--wp`) |
| les cinq stations | le fil et la lumière — le circuit est une ROUTE, une lumière la descend et allume chaque station qu'elle atteint | `faqScrub` (`--draw`/`--lit`/`--pass`) |
| le voile | un rideau MONTE et découvre les rapports sociaux, sa barre dorée en ourlet — le mot de la section pris au pied de la lettre | `libraryScrub` (`--dev`/`--bar`) |
| ce que ça devient | les feuillets se posent de biais, décalés, et le numéro prend l'encre après la pose | `doCards` (`--drop`/`--tilt`/`--ink`) |
| la dernière page | elle s'allume, la lueur montant du bas | `closerCandle` (`--lum`) |

**Le pilote de défilement est DUPLIQUÉ, pas partagé** : `home.js` ne se
charge que sur l'accueil, et la règle de la maison est de dupliquer les
petits outils plutôt que de coupler. Tout est piloté par la POSITION, donc
**réversible** — vérifié : on remonte, le fil se range, le voile retombe, la
bande s'éteint. Le JS est **inliné** et non externe : la page n'est jamais
mise en cache, ce qui évite d'emblée le piège du `?v=` documenté pour
`home.js`.

**Le voile est le cœur de la page, et il est vérifié dans le code du jeu** :
il ne s'ouvre pas d'emblée, il se lève à l'écran « le capital est né » —
`unlockVoile()`, à la fin de la phase 0, quand le premier circuit se referme
et que l'argent revient augmenté. Ne pas écrire qu'il faut « un certain
nombre de cycles » : c'est faux.

**La hauteur du héros est PLAFONNÉE à 640 px**, et ce n'est pas un caprice :
l'accueil se permet un héros plein écran parce que son fac-similé fait cinq
cents pixels de haut (4/5) et remplit sa colonne. La vue du jeu est un
**16/9**, large et basse — à `100vh` le contenu ne faisait que 280 px dans
856, soit 294 px de vide au-dessus et 286 en dessous (mesuré). Avec le
plafond et une colonne de droite un peu plus large (`1fr 1.18fr`, sans quoi
l'image est bridée par la colonne et non par son `max-width`), le
remplissage passe de 33 % à **52 %** — l'accueil est à 58 %. Ne pas lui
rendre les 100vh sans changer d'image.

### Pièges rencontrés

1. **Un pseudo-élément posait 245 px de défilement horizontal à 375 px, et
   il était INVISIBLE à l'inspection.** Le halo du héros (`.j-hero::before`)
   fait **620 px en dur** ; une sonde qui parcourt `querySelectorAll('body *')`
   ne voit **pas** les pseudo-éléments, et ne trouvait donc aucun coupable
   alors que `scrollWidth` valait exactement `620`. Le nombre lui-même était
   l'indice. Corrigé par `overflow:clip` sur la section — **`clip` et jamais
   `hidden`**, règle déjà écrite pour `.hw` et `.walk-cards`. Quand un
   débordement n'a pas de coupable, chercher dans les pseudo-éléments et
   comparer `scrollWidth` aux largeurs écrites en dur dans le CSS.
2. **Un rembourrage horizontal incohérent désaligne une bande pleine
   largeur.** Vécu à la première passe, quand la page avait encore un
   conteneur à largeur maximale : la dernière page tombait **36 px à
   gauche** de tout le reste (mesuré). Depuis la 2e passe il n'y a plus de
   conteneur du tout — toutes les sections sont pleine largeur avec le même
   `padding: … clamp(24px,5vw,80px)`, exactement comme l'accueil, et la
   question ne se pose plus.
3. **`detect.mjs` ne résout pas les `clamp()`** : ses trois
   `cramped-padding` sur `.j-voile`, `.j-colonne` et `.j-fin` sont des faux
   positifs — mesurés au rendu, 26/28/28/28 px sur les colonnes et 81 px en
   haut de la bande. `.j-voile` a bien 0 rembourrage, et c'est **voulu** :
   c'est le conteneur en grille dont le `gap` de 1 px DESSINE le filet, ses
   enfants portent l'air.
4. Le `low-contrast` à 4,1:1 est le faux positif déjà documenté pour
   `404.html` : `--accent` sur `--bg`, mais sur du texte mesuré au-delà de
   24 px, dont le seuil est 3:1. Ne pas le « corriger ».

9. **UN DOSSIER REDIRIGE, COMME UN `.html`.** La mission
   `seo-urls-reelles` a posé la règle « les URL n'ont pas d'extension » :
   Cloudflare Pages répond 308 de `/page.html` vers `/page`. Le PENDANT
   n'était écrit nulle part, et je l'ai payé le jour même de la mise en
   ligne — Cloudflare répond aussi **308 de `/jeu` vers `/jeu/`**, parce que
   la présentation du jeu est l'index d'un DOSSIER. La canonique, l'`og:url`,
   l'`url` du JSON-LD, l'entrée de sitemap, le bouton de l'accueil, l'entrée
   de sidebar et le lien de retour du jeu désignaient donc tous les sept une
   URL qui redirige : exactement le défaut que `seo-urls-reelles` avait
   corrigé, reproduit en miroir. **Mesuré en production, pas en local** — le
   serveur de test sert `/jeu` sans broncher, et c'est précisément le piège
   déjà documenté pour le marquage de la sidebar. Corrigé partout ; le slash
   est commenté aux trois endroits qui comptent pour qu'on ne le « nettoie »
   pas au nom de la règle sur les extensions.
   **La règle complète, désormais : une page-fichier se désigne SANS
   extension, une page-index de dossier se désigne AVEC son slash — et l'on
   vérifie sur liremarx.com, jamais sur le serveur local.**

### Vérifié

**Sonde de contraste sur le rendu : 0 échec sur 126 mesures** (coquille
comprise), aucune cible sous 24 × 24, aucun texte à moi sous 11 px. Le
minimum, 4,14:1, est le faux positif documenté — `--accent` sur `--bg`,
mais sur un `em` **mesuré à 58 px**, dont le seuil est 3:1. Les deux états
de chaque élément à deux états ont été mesurés séparément : station éteinte
**8,08:1**, allumée **9,00:1** ; numéro de carte éteint **7,57:1**, encré
**9,00:1**.

**Détecteur statique : 0 erreur**, 15 constats tous dans les familles de DA
documentées (halo radial, lueur dorée du fil, capitales des micro-libellés,
Fraunces + Inter, tirets cadratins, et les `cramped-padding` que le
détecteur produit faute de résoudre les `clamp()` — mesurés au rendu à 90 px
en haut de section et 26/28/28/28 dans les colonnes du voile).

**Le mouvement, position par position** (sonde temporaire, retirée avant le
commit — le rAF est gelé dans l'onglet piloté, sans elle on croit à tort que
rien ne bouge) : le fil se trace de 0 à 1 et allume les cinq stations dans
l'ordre, le voile se lève de 0 à 1 avec sa barre en cloche, les trois
feuillets se posent en décalé, la bande finale monte régulièrement de 0 à 1
sur sa propre hauteur. **Entièrement réversible** — on remonte en haut,
tout se range (`--draw` 0, `--dev` 0, `--lum` 0, feuillets à 0,05).

**Dégradations** : à 375 px, `no-anim no-motion` posés, `js-jeu` absent,
rideau du voile en `display:none`, rail inexistant, tout à l'opacité 1 —
la page est finie et fixe. Zéro débordement horizontal à 1440 comme à
375 px. Console sans erreur.

**Composition** : les colonnes du héros mesurées à 466/550 px, contenu à
52 % de la hauteur du héros (l'accueil est à 58 %), et le titre ne casse
plus après l'article.

### Une partie reprise était injouable (sept. 2026, dépôt du jeu)

Signalé par le propriétaire : à la reprise d'une sauvegarde, plus moyen de
lancer un cycle — le panneau ne s'affiche pas. C'était exact, et la partie
était bloquée pour de bon.

**La cause.** `.formation` est en `display:none` et ne passe à
`display:block` qu'avec la classe `on`. Le SEUL endroit qui posait cette
classe était `enterSocialFormation()`. Une reprise restaure bien
`gameMode='socialFormation'` et `resynchroniser()` REMPLIT le panneau — mais
ne le montre jamais ; et `enterSocialFormation()` ne peut plus rien réparer
puisqu'elle sort d'entrée sur ce même `gameMode`. Le bouton « Lancer le
cycle productif » vivant DANS ce panneau, il n'y avait plus aucun moyen
d'avancer. Le mode Commune était touché deux fois : le panneau n'était pas
montré, et `resynchroniser()` ne le rendait même pas (la garde était sur
`socialFormation` alors que `renderFormationPanel()` dispatche elle-même).

**La règle qui en sort, et elle vaut au-delà de ce bug : SÉPARER ENTRER
DANS UN ÉTAT DE LE METTRE EN SCÈNE.** Entrer narre, débloque, révèle — et ne
joue qu'une fois. Mettre en scène décrit ce que l'écran doit montrer tant
qu'on y est — et doit se rejouer à chaque restauration. Toute fonction
`enterX()` gardée par un drapeau qui pose aussi de l'état d'écran fabrique
ce bug : au retour, le drapeau est déjà posé, la fonction sort, et l'écran
ne se remet jamais. `stageMode()` ne lit que `gameMode`, est idempotente, et
est appelée par les trois chemins.

**Vérifié avec un CONTRÔLE, qui est ce qui rend la démonstration valide** :
le même harnais puppeteer joué sur HEAD reproduit le bug (`display:none`,
bouton hors d'atteinte, panneau de quête resté affiché ; en Commune, `f-age`
disait encore « Atelier »), et sur le correctif tout passe. Puis, sur le
BUNDLE MINIFIÉ servi par le site sous `/jeu/`, avec une vraie sauvegarde
injectée et une reprise par CLIC sur le bouton « Reprendre » : panneau
`formation on`, bouton atteignable, quête masquée, et « Cycle 0 · An 1 » →
« Cycle 1 · An 1 ». Zéro erreur de console.

**Le contrôle du bundle vaut la peine d'être noté** : on peut vérifier qu'un
correctif est bien DANS l'artefact minifié en comptant des marqueurs stables
avant/après (`classList.toggle("on",` 3 → 4, `?"none":""` 0 → 2,
`classList.add("on")` 21 → 20). L'ancien bundle est dans git, il suffit de
le sortir avec `git show HEAD:jeu/assets/<ancien>.js`.

### Ce qui reste

- **La HDRI pèse 4,2 Mo sur les 6,3.** C'est le ciel qui éclaire la scène
  (`industrial_sunset_puresky_2k.hdr`). La passer en 1k, ou en `.exr`
  compressé, diviserait le poids du jeu par deux — mais c'est un arbitrage
  d'actif du dépôt du jeu, pas du site.
- **Le jeu TUTOIE, le site VOUVOIE.** « Commence par déplacer le chariot »,
  « le chariot est ton curseur ». Tout le site est passé au vous depuis la
  mission `compte-refonte`. C'est une passe éditoriale à faire dans le dépôt
  du jeu, sur ses centaines de chaînes — hors périmètre ici, mais l'écart
  s'entend dès la première minute de jeu.
- Le jeu s'annonce encore « prototype 3D v66 » dans son `<title>` et son
  écran de préchargement. La page le dit honnêtement (« c'est une première
  version ») ; si le nom doit changer, c'est côté jeu.

## Le maillage interne, et les URL qui répondent (mission `seo-maillage-interne`, sept. 2026)

Suite directe de `brancher-le-jeu` : le jeu était en ligne mais **atteignable
depuis deux endroits seulement** (la bande de l'accueil, l'entrée de sidebar),
et le site continuait de payer des redirections sur ses propres liens.

### Le serveur de test IMITE désormais Cloudflare — et c'est la vraie leçon

Le piège des URL propres a été payé **trois fois** sur ce dépôt : le marquage
de la sidebar qui ne marchait qu'en local (`seo-registre-servi`), les
canoniques en `.html` (`seo-urls-reelles`), et `/jeu` qui redirigeait vers
`/jeu/` (`brancher-le-jeu`). Chaque fois pour la même raison : **`python3 -m
http.server` sert `/page.html` sans broncher et ne connaît pas les URL
propres**, donc une vérification locale ne prouve rien sur les URL.

Le serveur de test reproduit maintenant les trois comportements de
Cloudflare Pages :

```
/oeuvres/bibliotheque      → sert oeuvres/bibliotheque.html
/oeuvres/bibliotheque.html → 308 vers /oeuvres/bibliotheque
/jeu                       → 308 vers /jeu/        (index de dossier)
```

⚠️ **L'ordre de résolution compte** : `oeuvres/capital-1` est À LA FOIS un
`.html` et un dossier (celui des textes). C'est le **fichier** qui gagne —
vérifié en production, `/oeuvres/capital-1` y répond 200. Un serveur qui
teste le dossier d'abord redirige vers `/oeuvres/capital-1/` et l'on croit à
un bug qui n'existe pas.

L'imitation a été **validée URL par URL contre la production** (dix URL,
codes identiques) avant de servir à quoi que ce soit. Une imitation qu'on
n'a pas confrontée au vrai ne vaut pas mieux que pas d'imitation.

### Plus aucune ancre interne en `.html`

Neuf URL dans `shell.js` / `shell-social.js` (sidebar, popovers, et deux
**vraies ancres** : « Ouvrir mon carnet » et « Voir toutes les notes → »,
cette dernière montée sur l'accueil et la bibliothèque), plus trois ancres
relatives en dur — `carnet.html` sur les deux ateliers, `bibliotheque.html`
sur le carnet. Le « reste à faire » de `seo-registre-servi` est soldé.

Les **tests** de chemin gardent leur `(\.html)?` : ils doivent accepter les
deux formes, c'est ce qui rend le marquage robuste. Ne pas les resserrer.

**Les huit pages qui chargent la coquille ont été revérifiées** — c'est la
règle du projet pour toute retouche du shell, et c'est ce qui l'avait fait
remettre à plus tard. Coquille montée partout, marquage exact partout
(Accueil, Bibliothèque, Place publique, Mon carnet, Messages, Le jeu, et
l'onglet d'œuvre sur les deux ateliers), console sans erreur.

### La FAQ gagne sa dixième question, et sa dérivation devient un outil

**« Qu'est-ce que la plus-value, en clair ? »** — placée juste après la
question qui NOMME la plus-value parmi le vocabulaire à construire. Elle
répond vraiment (force de travail achetée à sa valeur, journée coupée en
travail nécessaire et surtravail, et la plus-value ne sort pas de l'échange
mais de la production), elle cite le chapitre VII et le chapitre X, et elle
porte **les deux seuls liens de la FAQ** : vers le laboratoire et vers le
jeu. C'est le maillage interne le mieux placé du site — une question que
l'on pose vraiment, dont la réponse mène à l'outil qui la démontre.

Le chapitre VII est vérifié dans les données de la page elle-même
(« Production de valeurs d'usage et production de la plus-value », `labo:
's-jour'`), pas supposé.

La cascade de `.hs-faq-list` s'arrêtait au 8e enfant ; elle va jusqu'au 10e.

Et **la dérivation du `FAQPage` vit désormais dans `tools/gen-seo.mjs`** —
voir la règle réécrite plus haut. Elle a été validée en vérifiant qu'elle
reproduisait le bloc existant à l'octet près.

### Le laboratoire renvoie au jeu

`.labo-jeu`, au pied de `#labo` sur `capital-1.html` : « Le même mécanisme,
joué ». Le laboratoire règle chaque loi **dans son bocal**, le jeu les fait
tourner **ensemble** — et sa station « A-M-A′ vs M-A-M » en est le sujet
même. C'est un `<a>` et non un bouton `.lk` comme les autres renvois du
Dossier : **un renvoi qui compte doit être suivable par un robot, pas
seulement cliquable.**

Le style est local à `capital-1.html` parce que le renvoi l'est aussi (le
jeu porte sur *Le Capital*, pas sur les Manuscrits) ; il réutilise
`.strip-lab` et `.btn`, sans nouveau composant.

### Vérifié

`gen-seo.mjs --check` : les cinq dérivations à jour, FAQPage compris, et
idempotent. Détecteur statique sur les trois fichiers touchés : **0 erreur**,
et les bases documentées tenues au constat près — `capital-1.html` reste à
**20**, `index.html` à **27**, `jeu/index.html` à **15**. Contraste du
renvoi mesuré au rendu : 6,44 / 9,45 / 15,68:1, bouton à 118 × 42. Zéro
débordement horizontal. Les dix URL de l'imitation locale alignées sur la
production.

### Ce qui reste, et ce que je n'ai pas fait

- **La bibliothèque ne renvoie pas au jeu, volontairement** : elle présente
  le CORPUS, œuvre par œuvre, et le jeu n'est pas une œuvre. L'y glisser
  aurait brouillé ce que la page dit.
- Le `noindex` du carnet et de la messagerie coexiste avec leur canonique.
  C'est redondant, sans conséquence pratique, et noté ici pour ne pas le
  redécouvrir une quatrième fois.
- Le jeu **tutoie** quand tout le site vouvoie (voir la mission précédente) :
  toujours vrai, toujours une passe éditoriale du dépôt du jeu.

## Ce qui n'a rien à faire dans l'index (`_headers`, sept. 2026)

Question du propriétaire : « qu'est-ce que j'ai d'autre à indexer ? ».
L'inventaire a répondu l'inverse — rien ne manquait au sitemap, mais **cinq
pages traînaient dans l'index sans qu'on l'ait voulu**.

`oeuvres/manuscrits-1844/textes/*.html` : les cinq fragments que la liseuse
des Manuscrits charge en local. Ce sont des `<article>` NUS — pas de `<html>`,
pas de `<head>`, pas de titre, pas de style — et ils répondent **200 en
production**, avec **59 000 mots** de texte. Indexés, ils font des pages
orphelines qui doublonnent `/oeuvres/manuscrits-1844` et lui font
concurrence. Et ils sont **découvrables** : `manifest.json` est servi
publiquement et cite leurs chemins seize fois.

Capital n'a pas ce problème — son texte vient de Wikisource à l'exécution,
et ses fichiers locaux ont été supprimés par `retrait-textes-abreges`.

**Le remède est un `_headers`**, fichier frère de `_redirects` à la racine :
`X-Robots-Tag: noindex` sur les fragments et sur les fichiers de données
(`bibliotheque.json` EST le registre, déjà pré-rendu dans la page — l'indexer
serait se doublonner). Deux règles de fabrication :

- **`X-Robots-Tag` et non `robots.txt`.** Un `Disallow` empêche de CRAWLER,
  pas d'INDEXER : une URL bloquée peut être indexée sans jamais être lue.
  L'en-tête dit « n'indexe pas », ce qui est la demande réelle.
- **Chemins exacts ou joker FINAL.** Un `/oeuvres/*` attraperait les pages
  elles-mêmes. L'en-tête n'a aucun effet sur les `fetch()` de la liseuse,
  qui ne regardent pas les en-têtes de réponse.

**Le principe général, à retenir** : une URL qui répond 200 est indexable par
défaut. Tout ce que le site sert pour SON PROPRE fonctionnement doit le dire.
Avant d'ajouter une page au sitemap, se demander d'abord ce qui y est déjà
sans avoir été invité.

### ✅ L'AFFAIRE PALMIER, soldée (sept. 2026, mission `affaire-palmier`)

`oeuvres/manuscrits-1844.html` affichait « traduction J.-M. Palmier ·
domaine public ». **Les deux étaient faux**, et l'enquête a été tranchée par
un document que le site sert lui-même.

**La preuve est dans `oeuvres/manuscrits-1844/textes/note-traducteur.html`.**
Cette note est signée **« E. B. »** et décrit un travail établi d'après
l'édition MEGA de 1932, achevé après des corrections reçues de l'Institut du
Marxisme-Léninisme de Moscou **au printemps 1961**. Jean-Michel Palmier, né
en 1944, avait alors **dix-sept ans** : ce n'est pas lui, et la question est
close.

**Et la licence ne dépend pas de l'identification** — c'est le point élégant
de l'affaire. Une traduction achevée après 1961 ne peut pas être dans le
domaine public en 2026&nbsp;: il faudrait que son auteur soit mort avant
1956 (vie + 70 ans en France). L'original de Marx est libre&nbsp;; **sa
traduction ne l'est pas du fait de l'original**. On n'a donc pas eu besoin
de savoir qui est « E. B. » pour savoir que la mention était fausse.

**Ce qui a été corrigé** :
- la ligne d'identité de l'atelier → « Karl Marx · écrits en 1844, publiés en
  1932 · traduction française · Marxists Internet Archive » ;
- le `sourceNote` de `bibliotheque.json`, qui dit maintenant la provenance
  ET le statut (affiché au cartel de la bibliothèque) ;
- `translator: 'J.-M. Palmier'` **retiré** de la table `EDITION` de
  `gen-seo.mjs` — donc du `Book` en JSON-LD. Le `license` n'y avait jamais
  été mis, et c'était le bon réflexe.

**Le nom a d'abord été laissé VIDE**, l'identification n'étant qu'une
inférence — remplacer un nom invérifié par un autre aurait refait l'erreur
qu'on corrigeait.

**Puis il a été ÉTABLI, et rendu** (mission `bottigelli`, le même jour). Le
catalogue de la BnF donne&nbsp;: *Œuvres complètes [7], Manuscrits de 1844,
économie politique et philosophie*, traduit par **Émile Bottigelli
(1910-1975)**, 1962. Cela confirme exactement ce que la note « E. B. »
laissait attendre. Le nom est donc de retour sur la ligne d'identité, dans
le `sourceNote` et dans le `translator` du `Book` — **un traducteur a droit
à son nom.**

### Il n'existe AUCUNE traduction française libre — recherche faite

Question du propriétaire, et la réponse est nette. Le texte n'a été publié
qu'en **1932, en allemand**&nbsp;: toute traduction française lui est
postérieure, et pour être libre en France il faudrait que son traducteur
soit mort avant 1956. Relevé au catalogue de la BnF&nbsp;:

| traduction | traducteur | mort | domaine public |
|---|---|---|---|
| **1962** | Émile Bottigelli | 1975 | **2046** |
| 1972 / 2007 | Kostas Papaïoannou | 1981 | 2052 |
| 1996 / 2008 | Jacques-Pierre Gougeon | vivant | — |
| 2007 | Fischbach (Vrin) | vivant | — |

**La plus ancienne traduction française est de 1962.** Deux fausses pistes
écartées au passage, pour qu'on ne les reprenne pas&nbsp;:

- **Wikisource n'a rien** — l'auteur Karl Marx n'y porte que *Le Capital*
  (Roy/Lachâtre 1872). Or Wikisource n'héberge que du libre&nbsp;: son
  silence est un signal.
- **Costes/Molitor ne l'a jamais traduit.** La série *Œuvres philosophiques*
  (1927-1947) va du tome I au tome IX, et ses tomes VI et VII sont
  *L'Idéologie allemande*, pas les Manuscrits. La piste était bonne — une
  traduction des années 1930 aurait pu être libre — mais elle n'existe pas.

Donc **rien à substituer avant 2046**. Ne pas relancer cette recherche&nbsp;:
elle est faite, et la conclusion ne changera pas d'ici là.

### ⚠️ CE QUI RESTE, et qui n'est pas technique

Le site **sert 59 000 mots de la traduction Bottigelli**, protégée jusqu'au
1er janvier **2046**. Le `noindex` posé sur les fragments (mission
`_headers`) limite l'exposition, il ne règle rien sur le fond.

La recherche ci-dessus ferme la deuxième issue&nbsp;: il n'y a pas de
traduction libre à substituer. Il en reste **deux**, toutes deux éditoriales
et du ressort du propriétaire&nbsp;:

1. **Demander l'autorisation** aux Éditions sociales.
2. **Cesser de servir le texte et le lier** — garder tout l'appareil (les
   résumés, les instruments, le cheminement, la chronologie, la marge, le
   glossaire), qui est la valeur propre du site, et renvoyer au MIA pour le
   texte. Un lien n'est pas une reproduction.

⚠️ La seconde a un **coût réel qu'il ne faut pas minimiser**&nbsp;: les
Manuscrits perdraient leur liseuse, donc le surlignage, les annotations, le
suivi de lecture et la marge qui suit le chapitre — c'est-à-dire ce qui fait
l'atelier. Le Capital n'a pas ce problème&nbsp;: Roy est mort en 1900, et le
texte vient de Wikisource.

**Ne pas trancher ça à la place du propriétaire.**

### Le lien de source tenait une promesse vide

Trouvé en passant, même famille&nbsp;: les cinq fragments affichaient « Le
bouton “Ouvrir la source” permet de comparer avec la page source » — or
**aucun code ne lit `data-source`**, et ce bouton n'existe nulle part. La
phrase promettait un contrôle absent.

Corrigé en tenant la promesse plutôt qu'en la retirant&nbsp;: la mention
porte maintenant un **vrai lien** vers la page MIA, plus la mention de
licence. Les cinq URL répondent 200 (vérifié) — c'est l'URL d'index que
j'avais devinée pour les tester qui n'existait pas, pas les leurs. **Se
méfier d'un 404 obtenu sur une URL reconstruite&nbsp;: tester celle que le
document donne.**

## L'abécédaire de Marx (mission `glossaire`, sept. 2026)

`/glossaire` — **une page indépendante, globale, alphabétique**. Le site
contenait 82 fiches de concept rédigées et **aucune n'avait d'adresse** :
elles vivaient derrière les onglets des ateliers.

**Arbitrage du propriétaire, rendu en cours de mission** (la première version
était un glossaire du *Capital* rangé par mécanisme) : « plutôt que des
glossaires par œuvre, un glossaire global de Marx, genre un abécédaire des
concepts, dispo comme page indépendante ». Trois conséquences, à ne pas
défaire :

1. **Global** — les deux œuvres, dans la même liste. 75 fiches de Capital
   plus 7 des Manuscrits, ces dernières avec leur **terme allemand**
   (*Vergegenständlichung*, *Gattungswesen*…).
2. **Alphabétique** — on cherche un mot comme on cherche un mot. L'ordre
   logique de Marx, qui était le classement de la première version, n'est
   pas perdu : il est **descendu sur chaque fiche**, en renvoi (« Le
   Capital · Journée de travail → »).
3. **À la RACINE** — `/glossaire` et non `/oeuvres/glossaire`, qui la ferait
   lire comme dépendante d'une œuvre. Et c'est un **fichier**, donc pas de
   redirection de dossier : le piège de `/jeu` ne se rejoue pas.

### UNE page, et non quatre-vingt-deux — c'est mesuré

Tentant, et faux. Les fiches de Capital font **846 mots à elles toutes,
médiane ONZE mots** : ce sont des légendes de schéma, pas des articles.
Quatre-vingt-deux pages de onze mots seraient du **contenu mince**, ce que
Google sanctionne — le site y perdrait au lieu d'y gagner. La page fait
**1 470 mots visibles**, ce qui la met largement hors de cette zone.

**Le jour où une notion mérite sa page, c'est qu'on aura écrit trois cents
mots dessus.** Ce sera un travail d'écriture, pas de génération. Ne pas
« éclater » le glossaire sans avoir d'abord écrit la matière.

### Tout est DÉRIVÉ, et les deux sources n'ont pas la même forme

`tools/gen-seo.mjs` lit les deux ateliers — jamais de recopie :

| source | forme | contenu |
|---|---|---|
| `capital-1.html` `CONCEPTS=` | **objet** groupé par station | 75 fiches `{t,d,f}` |
| `manuscrits-1844.html` `CONCEPTS=` | **tableau** plat | 7 fiches `{t,de,def}` |

D'où `litteralJS(src, nom, ouvrant)` : le même extracteur compte les
accolades **ou** les crochets selon ce qu'on lui demande. Les libellés de
groupe viennent des **onglets** des pages (`data-sub`, `data-x`), jamais
réécrits.

**La clé de tri ignore l'article de tête ET la ponctuation.** Un index range
« Le hiéroglyphe social » à H, pas à L. Et sans le second nettoyage,
« Le « prix du travail » » et « ΔA — plus-value » tombaient dans un panier
« # » au lieu de P et de A — le guillemet et le delta comptaient comme
première lettre.

**Aucun lien de chapitre n'est fabriqué.** Le contrat de deep-link connaît
`#labo`, `#explore`, `#chrono` et `#s=&q=` — rien par chapitre. Les
chapitres sont donc **nommés**, pas liés. Inventer une URL serait pire que
ne rien lier.

### Le filtre est une commodité, pas la page

Les 82 notions sont dans le HTML servi, lisibles sans une ligne de script :
c'est ce qui les rend indexables et citables. Le champ de filtre n'apparaît
donc **que si le JS tourne** (`hidden` retiré par le module) — sinon on
afficherait un contrôle mort. Il indexe une fois, sans accents ni casse,
masque les lettres devenues vides, et annonce le résultat par
`SHELL.announce`.

**Les renvois de fiche sont des liens EN LIGNE** dans une phrase : leur
hauteur est celle de la ligne, donc sous 24 px. **WCAG 2.5.8 exempte
explicitement ce cas** (« la cible est dans une phrase, ou sa taille est
contrainte par l'interligne du texte qui n'est pas une cible »). Ne pas les
transformer en boutons pour satisfaire une sonde qui ignorerait l'exception
— c'est écrit dans le CSS à côté de la règle.

### Vérifié

`gen-seo.mjs --check` : six dérivations à jour et idempotentes, glossaire
compris. Sonde de contraste sur le rendu : **0 échec sur 559 mesures**,
minimum 4,14 (le faux positif documenté — `--accent` sur `--bg`, mais sur un
`em` mesuré à 50 px, seuil 3:1), aucun texte à moi sous 11 px, aucune cible
trop petite hors liens en ligne. Détecteur statique : **0 erreur**, 5
constats tous documentés, et `index.html` reste à **27**. Testé à 1280 et
375 px : zéro débordement, une colonne, alphabet intact. Filtre éprouvé
(« travail » → 32 notions sur 12 lettres, « ALIENE » sans accent ni casse →
4, « zzz » → message de vide, champ vidé → les 82 reviennent). 82 ancres
uniques, `DefinedTermSet` à 82 termes.

### Le lexique — `oeuvres/lexique.json` (sept. 2026)

Les fiches des ateliers sont des **légendes de carte** : onze mots de
médiane, faites pour tenir sous une icône dans `.ccard`. Le glossaire, lui,
doit **définir**. Deux métiers, donc deux champs — et surtout **on n'allonge
pas `CONCEPTS`**, ce qui déformerait les cartes de l'atelier. Vérifié :
`capital-1.html` n'a pas changé d'un octet.

`oeuvres/lexique.json` ne porte QUE ce que `CONCEPTS` n'a pas : une
définition longue et le terme allemand. Aucune recopie. Résultat mesuré :

| | avant | après |
|---|---|---|
| définition moyenne | 11 mots | **27 mots** |
| termes allemands | 7 (Manuscrits) | **69 sur 75** |
| mots visibles de la page | 1 470 | **3 235** |

**Trois règles de fabrication :**

- **La clé est le titre, suffixe de station retiré** (« Capital constant »
  et non « Capital constant (c) »). `gen-seo.mjs` **échoue** si une clé ne
  correspond à aucune fiche : c'est ce qui rattrape un renommage dans
  `CONCEPTS`, qui sinon perdrait la définition en silence.
- **L'allemand n'est donné que s'il est CANONIQUE chez Marx.** Les intitulés
  éditoriaux du site (« Les contre-mondes », « Le passage de relais ») et la
  condition d'équilibre n'en ont pas — on n'invente pas d'allemand pour faire
  savant. Six termes sur soixante-quinze n'en portent pas, et c'est voulu.
- **Les Manuscrits ne sont PAS dans le lexique** : leurs fiches ont déjà une
  définition longue et leur terme allemand, dans `manuscrits-1844.html`. Ne
  pas les recopier — ce serait la seconde source qu'on évite partout.

### Le dédoublonnage se fait sur l'IDENTITÉ, pas sur le titre

Un abécédaire n'a qu'une entrée par mot. Les ateliers déclinent le même
concept d'une station à l'autre — trois « Composition organique », deux
« Taux de profit », « Journée de travail » et « La journée de travail ». La
fusion se fait donc sur une identité qui ignore **l'article de tête** et le
**suffixe entre parenthèses**, et les provenances sont toutes conservées :
82 fiches → **75 notions**.

⚠️ **Le discriminant du suffixe est l'ESPACE avant la parenthèse**, et une
regex sur les parenthèses équilibrées ne suffit pas : elle échoue sur
« Taux de profit (pl/(c+v)) », dont le suffixe est imbriqué. On coupe au
DERNIER « espace + parenthèse », et seulement si le titre finit par une
parenthèse — sinon « Condition I(v+pl)=II(c) », dont les parenthèses font
corps avec le titre, perdrait son dernier terme.

Le suffixe est retiré de l'affichage aussi : un abécédaire se lit comme un
dictionnaire, et la pastille de formule porte déjà les symboles.

**Effet secondaire heureux** : le filtre indexe toute la fiche, donc il
cherche aussi dans l'allemand — « mehrwert » ramène six notions.

### Les notions les plus denses ont leur page (`glossaire/<slug>`, sept. 2026)

Six notions sortent de l'abécédaire et prennent une page à elles&nbsp;:
**plus-value, fétichisme, force de travail, travail aliéné, accumulation
primitive, loi tendancielle**. Entre 277 et 313 mots de corps, soit 575 à
693 mots servis par page.

**LE SEUIL EST LA RÈGLE, et il n'a pas bougé** : on n'écrit une page que
lorsqu'on a quatre cents mots à dire, pas vingt-sept. C'est exactement la
raison pour laquelle l'abécédaire est resté une seule page, et c'est
toujours vrai des soixante-neuf autres notions. **Ne pas générer une page
par terme** — ce serait le contenu mince qu'on a refusé depuis le début.

### L'abécédaire devient un DOSSIER, donc il prend son slash

`/glossaire` → **`/glossaire/`**. C'est la conséquence mécanique de
`/glossaire/plus-value` : la page d'index d'un dossier se désigne avec son
slash, Cloudflare répondant 308 sur la forme nue — la règle écrite pour
`/jeu`. Fait le jour même de la mise en ligne de l'abécédaire, avant tout
indexage. Canonique, `og:url`, sitemap, sidebar et lien de la FAQ suivent.

### Ce que la page porte

Fil d'Ariane, titre et terme allemand, chapô, quatre paragraphes en
**Spectral** — c'est le seul endroit du site avec la liseuse où l'on tient
quatre cents mots, donc la serif de lecture et non l'Inter d'interface —
puis l'appareil en pied : « Où Marx l'établit », « Le voir fonctionner »
(les instruments, dérivés des provenances, plus le jeu), les notions
voisines, le retour. `DefinedTerm` + `BreadcrumbList` en JSON-LD.

Le CSS est une feuille **partagée** (`glossaire/notion.css`) et non un bloc
inline recopié dans six fichiers générés, qui les ferait diverger.

⚠️ **La notice `ou` PRIME sur les chapitres déduits, et c'est nécessaire.**
L'atelier rattache une station à des chapitres du Livre I — parfait
d'ordinaire, faux pour une notion établie ailleurs : la **loi tendancielle
est du Livre III**, et la page l'aurait annoncée au Livre I. Trois autres
notions retombaient sur un repli muet (« voir les pièces ci-contre ») parce
que leur station est une pièce d'exploration, que `META` ne rattache à aucun
chapitre — alors qu'on sait parfaitement où elles sont. Leurs notices sont
écrites, et les titres de chapitre vérifiés dans les données de la page.

### Trois pièges, tous vécus

1. **Un accent grave dans un commentaire HTML, à l'intérieur d'un template
   literal, le referme.** Écrire `` `ou` `` dans le gabarit a produit un
   `SyntaxError: Unexpected identifier 'ou'` en tête de fichier. Dans les
   gabarits de `gen-seo.mjs`, pas d'accent grave — même en commentaire.
2. **`writeIfNeeded` lisait le fichier avant de comparer.** Il mettait à
   jour des fichiers existants ; il doit maintenant en CRÉER. Une lecture
   sèche jetait `ENOENT` au lieu d'écrire la page.
3. **Les liens de « Le voir fonctionner » sont des entrées de LISTE**, pas
   des liens en ligne dans une phrase : l'exception de WCAG 2.5.8 ne les
   couvre pas, et à la seule hauteur de ligne ils mesuraient 18 px. Un
   rembourrage vertical les porte au-delà de 24. Ne pas confondre les deux
   cas — le renvoi de fiche de l'abécédaire, lui, est bien en ligne.

Et une régression attrapée à la sonde : **le marquage de sidebar ne couvrait
que l'index** (`/\/glossaire\/?$/`), donc l'entrée se dé-marquait dès qu'on
ouvrait une notion. Il couvre le dossier entier.

### Vérifié

`gen-seo.mjs --check` idempotent sur les sept dérivations. Sonde de contraste
sur deux pages de notion : **0 échec**, aucune cible sous 24 × 24 après
correction, minimum 4,56 (le blanc sur rouge du bouton, valeur maison).
Détecteur statique : **0 erreur** — `plus-value.html` ne relève qu'**un**
constat, un tiret cadratin. Testé à 1280 et 375 px, zéro débordement, une
colonne. Les six notices de source relues une par une. Sitemap à **13 URL**,
sidebar marquée sur les notions comme sur l'index.

### Les Manuscrits rejoignent les pages de notion (sept. 2026)

Six pages de plus — **objectivation, être générique, propriété privée,
argent, besoins, communisme** — qui donnent aux *Manuscrits de 1844* la même
présence que le *Capital* dans le glossaire. **Douze pages de notion**, six
par œuvre, et les sept notions des Manuscrits en ont désormais toutes une.

Elles se tiennent entre elles&nbsp;: les voisines d'« Argent » pointent
toutes vers de vraies pages, ce qui n'était pas le cas quand une seule
notion des Manuscrits en avait une. Un réseau, plus une liste.

**Les notices de source nomment la PARTIE**, et les intitulés viennent de
`MAN_STRUCT`, jamais inventés — « Le travail aliéné » au premier manuscrit,
« Propriété privée et communisme », « L'argent », « Besoins, production et
division du travail » au troisième. La notice du travail aliéné a été
reprise pour nommer sa partie comme les autres.

**Ce qui ne pouvait pas être dérivé, et pourquoi.** Les notions des
Manuscrits sortent toutes de `instr-carte`, qui n'est rattaché à aucun
chapitre&nbsp;: la déduction n'aurait donné que le repli muet. Les six
notices sont donc écrites à la main dans le lexique — c'est exactement le
cas que le champ `ou` existe pour couvrir.

**Une entrée du lexique peut n'exister que pour son `page`.** Les sept
notions des Manuscrits n'y ont ni `def` ni `de` (leurs fiches les portent
déjà), mais elles y ont leur développement. Le contrôle des orphelines le
permet, puisqu'il compare des IDENTITÉS et non des clés du seul Capital.

**Sur les citations**&nbsp;: ces pages paraphrasent Goethe, Shakespeare, la
science du renoncement, l'énigme résolue de l'histoire — sans jamais mettre
de guillemets. C'est délibéré et cela reste la règle&nbsp;: **on ne cite pas
de mémoire une traduction qu'on ne peut pas vérifier dans le dépôt.** Une
paraphrase attribuée est honnête, une citation approximative ne l'est pas.

**Vérifié** : `--check` idempotent, 0 échec de contraste et aucune cible
trop petite sur les pages neuves, **détecteur à 0 constat sur les pages de
notion elles-mêmes** (les cinq restants sont sur l'index), les douze URL en
200, sitemap à 19 URL, sidebar marquée, zéro débordement.

### Ce qui reste

- Soixante-trois notions n'ont pas de page, **et c'est le bon état**. La
  suivante s'écrit en ajoutant un `page` au lexique — le générateur fait le
  reste, sitemap et lien depuis l'abécédaire compris.
- **Aucune citation de Marx n'est reproduite**, volontairement : voir
  ci-dessus. Les ajouter demanderait de les relever dans le texte servi par
  la liseuse, ce qui est faisable et serait un vrai gain.
- ✅ La mention « Palmier · domaine public » a été corrigée depuis, par la
  mission `affaire-palmier` : les deux termes étaient faux. Ces six pages
  parlent des Manuscrits sans en reproduire une ligne, donc elles n'ont rien
  eu à changer.

### Ce qui reste

- Une **troisième œuvre** entrerait toute seule : il suffit qu'elle expose un
  `CONCEPTS=` et que le générateur le lise, comme pour les deux autres. Ses
  définitions longues iraient dans `lexique.json`, ou dans ses propres fiches
  si elle suit le gabarit des Manuscrits.
- Les définitions font 27 mots. **C'est encore court pour une page par
  notion** — le seuil est plutôt trois cents. L'abécédaire reste donc une
  page, et c'est le bon choix tant qu'on n'aura pas écrit davantage.

## L'abécédaire se parcourt (mission `glossaire-ui`, sept. 2026)

Demande du propriétaire : « il faut travailler l'UI UX de la page
glossaire ». Diagnostic mesuré avant de toucher au code, et il est chiffré.

**1. Les douze liens les plus précieux de la page étaient en BLEU d'agent
utilisateur.** `.gl-t a` n'avait AUCUNE règle de couleur : mesuré
`rgb(0,0,238)` souligné sur `--surface`, soit **1,3:1**. Ce sont les douze
notions qui ont leur propre page — les seuls liens qui font sortir de
l'abécédaire. C'est exactement le défaut déjà documenté pour `.lk` et
`.rd-chip` au moment du socle sombre, rejoué sur un `<a>` au lieu d'un
`<button>` : **vérifier `color` sur tout composant bâti sur un élément qui
en porte une par défaut.** Une page claire le cachait, une page sombre non.

**2. Rien ne ramenait à l'alphabet.** Le document fait **11 383 px** à 1280
et **21 719 px** à 375. Passé le premier écran (~500 px), l'alphabet ET le
filtre disparaissaient pour de bon : sur 96 % de la page, un abécédaire
n'offrait plus aucun moyen d'atteindre une lettre. C'est le défaut
d'orientation déjà corrigé sur le Dossier, en pire.

**3. Le filtre ne rendait son résultat qu'aux lecteurs d'écran.**
`SHELL.announce` disait « 32 notions affichées » ; à l'écran, le compte de
tête (« 75 notions · 16 lettres · 2 œuvres ») ne bougeait pas — il mentait
pendant tout le filtrage.

### La tranche du dictionnaire

**Option tranchée par le propriétaire** (l'autre était une seule barre
collante en haut, alphabet compris) : un **pouce-index vertical** collé à
droite, comme la tranche d'un dictionnaire ou l'onglet de cahier du carnet,
qui marque la lettre où l'on est ; le filtre prend une barre collante.

- **Ce n'est PAS un second alphabet** : c'est le MÊME `<nav>` dérivé (entre
  marqueurs) sorti du flux par le CSS. Une seule source, rien à
  synchroniser, et **le générateur n'a pas été touché** — `--check` reste
  vert sans avoir rien à regénérer.
- **Il ne montre que les lettres qui existent** (`.gl-alpha span{display:none}`)
  — un pouce-index est un outil, il ne liste pas les onglets absents. Seize
  cibles de 24 px font 384 px, ce qui tient dans n'importe quel écran ;
  vingt-six en feraient 624, ce qui déborderait un téléphone en paysage.
- **Il marche SANS JavaScript** : ce sont des ancres. Seul le marquage de la
  lettre courante est du script — l'amélioration porte son état fini.
- La lettre courante prend la **pastille pleine** dorée. Une extinction ne
  se dit jamais par l'opacité : `--muted` vaut 8,1:1 et `--gold` 9,0:1.
- Le repère est **piloté par la POSITION**, donc réversible : on remonte, la
  tranche se range. Vérifié position par position, monotone de A à V, et V
  atteinte au bas du document.

### La barre, et le compte qui ne ment plus

Le champ devient une barre collante ; elle porte le compte **uniquement
pendant le filtrage** (« 34 sur 75 ») — au repos il redirait le compte de
tête, à trois centimètres au-dessus. La parole aux lecteurs d'écran
continue de passer par `SHELL.announce`, **canal unique** : deux régions
live pour le même fait feraient tout entendre deux fois. S'y ajoutent un
bouton d'effacement (celui de WebKit est neutralisé — deux croix seraient
une de trop) et Échap dans le champ.

**Filtrer depuis le milieu de onze mille pixels laissait le lecteur SOUS
ses propres résultats** : le navigateur ramène le défilement dans le
document raccourci, donc au bas de la liste filtrée. On remonte à la tête
des résultats — **jamais en revanche quand on efface**, où ce serait perdre
sa place.

### `top` n'est PAS 44 px — le vrai piège de cette mission

La topbar fait bien 44 px à 1280, mais elle se replie sur **trois rangées**
en dessous de 720 : **mesuré à 375, elle fait 121 px**. La barre calée sur
la constante s'enfonçait de **77 px dessous** — elle disparaissait à
l'endroit même où elle sert le plus. `--gl-top` est désormais écrit par le
script depuis la hauteur RÉELLE, et la barre comme les deux
`scroll-margin-top` en héritent.

Et **la mesure unique ne suffit pas** : la topbar est bâtie par
`installShell` juste avant, puis elle GRANDIT quand les polices arrivent —
mesurée une seule fois elle valait **83 px** là où elle en fait 121. D'où
le `requestAnimationFrame` + `setTimeout(…, 400)` + `load` +
`document.fonts.ready`, plus un `ResizeObserver` sur la topbar (elle change
aussi de hauteur sans que la fenêtre bouge : le pseudo s'y installe une
fois la session ouverte). **C'est le piège de la mesure unique de
`libraryScrub`, rejoué sur un élément du shell.**

### Deux défauts trouvés en chemin

- **La grille laissait une CELLULE VIDE** au bout de toute lettre en nombre
  impair : le fond du conteneur (`--border`, crème à 13 %) y apparaissait en
  grand rectangle gris. Visible en permanence sur B, H, J et O, et à chaque
  filtrage rendant un nombre impair de fiches. `.gl-liste` passe en **flex** :
  une fiche seule sur sa rangée GRANDIT et occupe la place. C'est robuste au
  filtre, là où un `:nth-child` ne l'aurait pas été — masquer une fiche
  décale le rang de toutes les suivantes. La base de 300 px remplace au
  passage la bascule à une colonne.
- **La pastille de formule se collait à la fin de la phrase** dès qu'une
  fiche occupait toute la largeur (en colonne étroite le texte se repliait
  avant elle, ce qui la posait dessous par accident). Elle prend sa ligne.

### Pièges d'outillage, tous revécus

1. **Les transitions CSS sont GELÉES dans la pane masquée** — déjà écrit, et
   je m'y suis quand même laissé prendre : `.gl-eteint` rendait `--muted` au
   lieu de `--const`, et `.gl-ici` un fond transparent au lieu du doré. Rien
   n'était cassé : les valeurs étaient figées au DÉBUT de la transition. Le
   test qui départage est de neutraliser `transition` ET `animation` avant
   de mesurer, jamais de « corriger » une cascade qu'on a vérifiée correcte
   dans le CSSOM.
2. **Les rappels de `ResizeObserver` ne sont pas délivrés non plus** quand
   `document.hidden` — ils passent par les étapes de rendu, comme le rAF. Un
   `dispatchEvent(new Event('resize'))` à la main prouve que la logique est
   bonne.
3. **Les captures reviennent NOIRES** au-delà du premier écran sur ce
   document : tout se vérifie à la mesure DOM, et pour une image on masque
   les blocs précédents pour ramener la zone en haut de page.
4. `:focus-visible` ne matche pas dans l'onglet piloté (`document.activeElement`
   est pourtant bon) : la géométrie de l'anneau se vérifie au dégagement
   mesuré, pas au style calculé.

### Un mot sur `:has()`

`.gl-terme:has(.gl-t a)` n'a **pas** été utilisé, et le marquage dérivé
n'a pas eu à bouger : l'affordance des douze notions tient dans une flèche
`::after` posée sur `.gl-t a`, **dessinée en masque** et non écrite en
caractère — un `::after` textuel serait annoncé par un lecteur d'écran, qui
a déjà le lien. Le titre garde la couleur de ses voisins pour que la colonne
des termes se lise d'un trait, et il passe à 24 px de haut : ce lien n'est
pas en ligne dans une phrase, l'exception de WCAG 2.5.8 qui couvre les
renvois de fiche ne le couvre pas.

### Vérifié

Sonde de contraste sur le rendu, coquille comprise : **0 échec sur trois
états** (repos 577 mesures, filtré 294, vide 44), minimum **4,14** — le
faux positif documenté (`--accent` sur `--bg`, sur un `em` mesuré à 50 px,
seuil 3:1). Aucune cible sous 24 × 24 ; le seul texte sous 11 px est le
`sb-soon-tag` du shell, antérieur. Détecteur statique : **5 constats,
0 erreur** — la base documentée, au constat près. `gen-seo.mjs --check` à
jour et idempotent sur les sept dérivations (rien de dérivé n'a été
touché). Testé à 1280 et 375 px, **zéro débordement horizontal**, console
sans erreur. Éprouvé : repère de lecture monotone sur les seize lettres et
réversible ; filtre par vraie frappe (« fetichisme » → 6, « argent » → 9,
« travail » → 34, « ALIENE » sans accent ni casse → 4, « mehrwert » → 6,
« zzz » → message de vide, champ vidé → les 75 reviennent) ; clic sur une
lettre de la tranche (dégagement 10 px à 1280, 14 px à 375) ; deep-link
`#surtravail` depuis une page de notion (13,8 px, `:target` posé) ;
parcours de tabulation champ → seize lettres → fiches ; HTML servi complet
sans script (75 fiches, 12 liens de notion, barre `hidden`).

**Périmètre strict** : `glossaire/index.html` seul. Les douze pages de
notion et `notion.css` n'ont pas été touchés — vérifié, leurs liens
portaient déjà tous une couleur.

### Le mouvement — « la page s'imprime » (même mission, 2e passe)

Demande du propriétaire : « fais des animations au scroll, il faut être
original ». La contrainte de la maison commande tout : **le geste doit être
pertinent vis-à-vis de ce qu'il exprime**. Ce que dit cette page-ci, c'est
qu'elle est une page de dictionnaire — ses gestes sont donc ceux de
l'imprimerie et de la reliure, et surtout PAS ceux déjà écrits ailleurs sur
le site (le révélateur du catalogue, le fil et la lumière de la FAQ, les
feuillets qui se posent, le rideau du jeu, l'encre qui prend mot à mot).

**1. La lettrine s'imprime.** Le caractère arrive levé au-dessus du papier
(20 % plus grand, en `--muted`), frappe, et se pose à sa taille en prenant
l'or ; son filet se tire juste après, avec un temps de retard. Seize fois,
une par lettre. La frappe se joue entre 92 % et 62 % de la hauteur d'écran :
**la lettre est posée AVANT qu'on la lise, jamais pendant.**

**2. Le pouce descend la tranche.** Le repère n'est plus une pastille qui
saute d'une lettre à l'autre : c'est un onglet doré qui **glisse en
continu** le long du pouce-index, en interpolant entre deux lettres à mesure
qu'on traverse un bloc — on descend la tranche d'un livre, on ne clique pas
dedans. Un fil se remplit derrière lui : la tranche dit du même coup *où
l'on est* et *combien de chemin est fait*. Fil et pouce vivent sur le bord
**extérieur** de la tranche, côté écran : de ce côté il n'y a rien à
dégager, et c'est là que se trouve l'onglet d'un vrai pouce-index.

**3. Le titre courant.** Le mot-guide qu'un dictionnaire imprime en tête de
page : la lettre, puis la première entrée de la rangée où l'on est. Il
partage sa place avec le compte du filtre — au repos il dit où l'on en est,
pendant le filtrage c'est le compte qui parle. Les deux ne sont jamais
utiles en même temps, donc ils ne se disputent rien.

### ET LES SOIXANTE-QUINZE FICHES NE BOUGENT PAS

C'est délibéré, et c'est la règle du site : **le texte ne bouge jamais sous
le regard.** Écrite pour la colonne de lecture de l'atelier, elle vaut a
fortiori pour soixante-quinze définitions qu'on parcourt à la recherche d'un
mot — un geste vu soixante-quinze fois n'est plus un geste, c'est une taxe.
Le mouvement vit donc dans le **mobilier** de la page : la lettre, la
tranche, le mot-guide. Ne pas « animer les fiches » sans rouvrir cet
arbitrage.

### Le partage orientation / mouvement

C'est celui déjà rendu pour le repère du Dossier, et il n'est pas
cosmétique : **le pouce, le fil et le titre courant sont de l'ORIENTATION**,
ils vivent donc partout — reduced-motion et téléphone compris, où l'on en a
le plus besoin. **Seule la lettrine est du mouvement**, gardée par `js-glm`
(≥ 768 px, hors reduced-motion). Sans la classe, la lettre est or, à
l'échelle 1, filet complet : l'état fini, vérifié à la mesure.

Le seuil se lit à `matchMedia`, jamais à `innerWidth` — au moment où le
script s'exécute la fenêtre peut encore annoncer 0. C'est le piège déjà
documenté pour l'accueil et pour `carnet-intro.js`.

### Une seule passe par image

`cadre()` nourrit les quatre choses d'un coup : le repère, la frappe des
seize lettrines, le pouce et le mot-guide. **Seize rectangles de bloc, plus
les fiches du bloc courant — jamais les soixante-quinze.** Les écritures de
propriétés sont gardées par comparaison (`toFixed(3)`) : seize écritures par
image, autant n'en faire aucune pour rien.

### Deux pièges, tous deux payés

1. **Une règle qu'on remplace se SUPPRIME.** J'ai écrit la nouvelle
   `.gl-alpha a.gl-ici{color:var(--gold)}` en laissant l'ancienne
   (`color:var(--bg);background:var(--gold)`) plus haut dans la feuille. À
   spécificité égale la mienne gagnait sur `color` — mais le **fond doré**
   de l'ancienne restait, et la lettre courante était **de l'or sur de l'or,
   mesuré à 1,0:1**. Ajouter une règle qui n'écrase qu'une propriété sur
   deux ne remplace rien. Trouvé par la sonde de contraste, pas à l'œil : à
   l'écran, une pastille dorée un peu terne ne saute pas aux yeux.
2. **Le mot-guide s'éteignait à chaque changement de lettre.** Entre le
   titre d'une lettre et sa première fiche, aucune entrée n'a passé la ligne
   — il rendait donc le vide, et l'on croyait à un raté. Le repli est aussi
   la bonne pratique typographique : tant qu'aucune entrée n'est atteinte,
   le mot-guide donne la PREMIÈRE de la page, ce qu'imprime un dictionnaire.

### Vérifié (2e passe)

Sonde de contraste sur le rendu, coquille comprise : **0 échec sur quatre
états** — repos (577 mesures), **en pleine frappe** (`--lev` 0,569, 579
mesures), mot-guide affiché, et filtré. Minimum 4,14, le faux positif
documenté. Le caractère parcourt le segment `--muted` → `--gold`, soit de
8,1:1 à 9,0:1 : **les deux extrémités et tout l'entre-deux passent** — une
extinction ne se dit pas par l'opacité, pas même en passant.

La frappe mesurée pas à pas (sonde temporaire, retirée avant le commit — le
rAF est gelé dans l'onglet piloté) : `--lev` 1,000 → 0,802 → 0,569 → 0,337 →
0,104 → 0,000, `scale` 1,2 → 1, filet 0 → 16,1 → 33,7 → 34 px, et
**entièrement réversible** (on remonte, le caractère se relève). Le pouce
glisse en continu de 13 à 380 px sur la descente, le fil suit, le mot-guide
nomme la bonne entrée à chaque arrêt (« Accumulation », « Communisme »,
« Le hiéroglyphe social », « Moyen de paiement », « Taux d'exploitation e₀ »).

À 375 px : `motion` faux, pas de `js-glm`, pas d'enveloppe — **mais le pouce
et le fil marchent** (mesurés), et le mot-guide est masqué (la tranche dit
déjà la lettre). Zéro débordement horizontal, console sans erreur,
`detect.mjs` **5 constats, 0 erreur** (la base), `gen-seo --check` à jour.

### Ce qui reste

- **La tranche s'ancre au bord de la FENÊTRE**, pas à la colonne de texte :
  au-delà de 1900 px elle s'en éloigne beaucoup. C'est l'idiome (la tranche
  d'un livre est au bord), et c'est ce qui garantit qu'elle ne recouvre
  jamais rien ; si on veut la rapprocher un jour, le calcul devra tenir
  compte de la sidebar, qui se replie.
- **Le repli sans JavaScript garde ses anciennes ancres** (`scroll-margin-top:56px`,
  soit la topbar au large) : à 375 px sans script, une ancre dépose encore
  sous la topbar de 121 px. C'était déjà vrai avant la mission, et le
  corriger en CSS seul demanderait de coder en dur une hauteur de topbar
  qu'on ne peut pas connaître.
- **Une seule pastille de formule par fiche** est supposée (mesuré : 68 en
  ont une, 7 aucune). Si le générateur venait à en émettre deux, elles
  s'empileraient.

## Conventions de travail

- **Une mission par session.** Une demande utilisateur = un objectif clair,
  une branche dédiée nommée d'après l'objectif (`homogene-manuscrits`,
  `atelier-css-shared`, `shell-partage`, `sortir-accueil`, …), un seul
  commit clair par mission sauf raison explicite (et explicitement
  consentie : sous-commits incrémentaux quand le risque est élevé).
- **Branche depuis `main` quand `main` contient déjà le prérequis.**
  Quand le prérequis est sur une branche non encore mergée, il est
  acceptable de brancher depuis cette branche (sous-mission dans la
  chaîne) — on documente la lignée dans le commit.
- **Périmètre strict.** Ne pas profiter d'une mission pour refactor le
  reste du dépôt. Si une mission dit « ne modifier que tel fichier »,
  s'y tenir.
- **Vérifier avant de commiter.** Si la mission touche au visuel ou au
  comportement client, ouvrir la page concernée dans un navigateur
  (`python3 -m http.server` à la racine) et tester réellement les chemins
  critiques (onglets, liseuse, fetch local, console sans erreur).
  Demander une confirmation utilisateur entre sous-étapes risquées.
  **Pour toute page dotée d'onglets, tester explicitement le
  chargement direct sur chaque onglet (pas seulement après un clic)**
  — voir le bug récurrent documenté plus haut.
- **Garde-fous permanents** :
  - rester statique (pas de build, pas de dépendances obligatoires) ;
  - ne pas casser la coquille applicative encore inlined dans
    `capital-1.html` (auth, forum, modération, RGPD, recherche) ;
  - aucune clé secrète dans `config.js` ;
  - ne passer une œuvre en `available` que lorsqu'elle fonctionne pour
    de vrai ;
  - **dans `SHELL.auth`, ne jamais `await` un appel Supabase à
    l'intérieur d'un callback `onAuthStateChange`.** GoTrue v2 tient
    un verrou interne pendant le callback ; un `await c.from(...)` ou
    `await c.auth.xxx()` à l'intérieur attend la libération de ce
    verrou et provoque un deadlock (pastille figée sur « Se
    connecter », modale qui ne reflète jamais la session). Synchroniser
    l'état + rendre tout de suite avec l'e-mail, puis différer toute
    requête (typiquement `loadProfile()`) via `setTimeout(fn, 0)` et
    re-rendre quand le résultat arrive.

## Conventions de données

- **`public_notes.work` = id de bibliothèque.** Toute nouvelle ligne
  insérée dans la table `public_notes` doit utiliser comme `work`
  l'id défini dans `oeuvres/bibliotheque.json` (ex.
  `manuscrits-1844`, `capital-1`). C'est ce qui permet à la Place
  publique partagée (`SHELL.commune`, modale ouverte depuis n'importe
  quelle page) de résoudre le titre, le statut et le chemin de la
  page d'atelier sans dépendre d'un mapping ad-hoc.
- **Alias hérité `'capital'` → `'capital-1'`.** Les premières lignes
  écrites par `capital-1.html` portaient `work='capital'`. Cet alias
  est codé en dur dans `SHELL.commune` (et seulement là) pour couvrir
  ces lignes historiques. Toute autre œuvre doit s'aligner sur son id
  de bibliothèque dès le premier `INSERT`.

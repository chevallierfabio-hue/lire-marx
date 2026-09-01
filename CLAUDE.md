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
  ci-dessous.
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
  six anciens onglets (Pour entrer, Cheminement, Modèles, Explorations,
  Chronologie, Ressources), qui restent **tous `class="panel active"` en
  permanence** ; c'est le conteneur qui s'affiche ou non, avec une
  navigation d'ancres (`#dossierNav`).
- **Le seuil** — les trois idées ne s'affichent qu'à la **première visite**
  (`localStorage`, `liremarx.capital.seuil.v1`), et jamais à qui a déjà une
  reprise. Elles restent en tête du Dossier.
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

### Fait sur Capital seulement

Les Manuscrits gardent l'ancienne forme à neuf onglets — **à porter quand
le propriétaire aura validé celle-ci**, comme pour le tableau de bord. Le
CSS de la coquille (`.atl3`, le tiroir, les replis) vit déjà dans
`atelier.css` : le portage est surtout du câblage, plus une table
d'index chapitre → appareil propre aux Manuscrits.

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
et tout ce qui exige une session Supabase authentifiée (modale Contacts,
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
  publique/Contacts/CGU/sb-work, modales compte/RGPD/Place
  publique/Contacts, popover messages, toast).
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
« Voir le profil » est masqué dans la modale Contacts, et un clic sur
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

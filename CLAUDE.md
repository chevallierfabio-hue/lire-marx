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

- `oeuvres/place-publique.html` — page dédiée du flux Place publique
  (clic sidebar « Place publique » sur toutes les pages). Elle se
  contente d'appeler `SHELL.commune.mount(#placeFull, {})`. L'aperçu
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

**Accueil animé (`/index.html`, racine).** L'accueil canonique est
`/index.html` (`oeuvres/index.html` = simple redirection 301 ; `_redirects`).
Il porte : (1) l'intro cinématique Three.js (desktop, gated `no-anim`) ;
(2) le contenu réel dans `.hw` (conteneur de défilement) — héros deux
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
sinon viewport), duplication du marquee, et **fond WebGL discret**
(`#hero-bg`, la liasse de feuillets — voir ci-dessous) — **coupé si
`prefers-reduced-motion` ou largeur < 768**, ne démarre qu'une fois
`body.shell-active`. Le script
inline en bas de page pose `.lit` sur `.hs-hero` (entrée orchestrée) et
`shell-active` dès que `#sheet` s'ouvre **ou** immédiatement si
`skip-anim` / reduced-motion / **largeur < 768** (ce dernier corrige un
bug où la topbar/sidebar restaient masquées sur mobile). Deux marqueurs
sur `<html>` : `no-anim` (pas d'intro) et `no-motion` (pas d'animations
du tout — mobile étroit ou reduced-motion). CSS de l'accueil = **inline**
(critique LCP) ; JS = **externe + `defer`**. Ne pas réintroduire de
Three.js bloquant. `SHELL.commune` vient de `shell.js` (déjà chargé).

**On entre dans le site par le haut, et sans rien déclencher — `body.intro-run`.**
À `p>0.6`, l'intro pose `.show` sur `#sheet`, qui passe donc en
`pointer-events:auto` alors qu'il reste un bon tiers d'animation. Deux dégâts,
tous deux corrigés par une classe posée sur `<body>` pendant l'intro :

1. **Le clic ouvrait « Une page réelle du manuscrit ».** `#sheet` porte pourtant
   `pointer-events:none` — mais `#hero-bg` le REPREND avec un
   `pointer-events:auto` explicite, et **une déclaration sur l'enfant annule le
   `none` de l'ancêtre**. Le canvas du héros était donc cliquable dès la
   première image, et `heroBg()` y attache son raycaster sans attendre
   `shell-active`. D'où `body.intro-run #hero-bg{pointer-events:none}`.
2. **On débouchait sur l'accueil déjà descendu.** La molette qui sert à entrer
   se mettait à faire défiler `.hw` dès `.show`. `frame()` épingle donc
   `hw.scrollTop = 0` à chaque image tant que l'intro tourne.

**L'épinglage est une remise à zéro par image, pas un `overflow:hidden` à
retirer** : si la boucle mourait, un verrou CSS ne se rouvrirait jamais et la
page resterait bloquée en haut — pire que le bug corrigé. Même raison pour le
filet de `releaseIntro()`, appelé **au plus tard 8 s après l'entrée** : un rAF
ralenti ne doit pas pouvoir sceller la page. La classe
n'est posée que si la boucle démarre vraiment (jamais en `no-anim` ni sous
reduced-motion), et si elle restait par accident on ne perdrait que le
raccourci souris — `#msCartel` est le chemin d'ouverture officiel du panneau.

**Le verrou tombe quand la page a FINI D'APPARAÎTRE, pas quand `p` touche 1.**
`p += (targetP-p)*0.035` converge de façon asymptotique : `sv` vaut 1 à
`p=0.96`, soit la 90e image, quand `p>0.995` n'arrive qu'à la 149e. Libérer
sur `p>0.995` laissait donc **une seconde pleine de défilement mort** (le
double sur une machine lente) pendant laquelle l'accueil est entièrement
visible et ignore la molette — c'est remonté comme bug. Le test est `sv >= 1` :
à cet instant `#sheet` est à pleine opacité et à l'échelle 1, et le canvas de
l'intro est à 0,18 % d'opacité. Rien ne distingue plus cet instant de la fin.
Ne pas remonter ce seuil.

**Pour tester tout ceci, la sonde est obligatoire.** Le rAF est si bridé dans
un onglet piloté que l'intro n'avance pas du tout : `p` reste à 0, rien n'est
observable, et on croit à tort que le clic ne marche plus. Exposer
temporairement `{enter, frame, getP, setP, getLocked}` sur `window`, avancer
`frame()` en pas-à-pas, **et retirer la sonde avant le commit**.

**L'invite à descendre (`.hs-hint`, `heroHint()` dans home.js).**
L'accueil s'ouvre sur un héros plein écran et ne disait pas qu'il
fallait faire défiler. L'invite reprend le vocabulaire des deux autres
pages (filet vertical dégradé + « Faire défiler » en capitales
espacées), au pied du héros ; son opacité est pilotée par la POSITION
de défilement — éteinte sur le premier dixième d'écran, et elle revient
si l'on remonte. Masquée sous 720 px (le héros y perd sa hauteur plein
écran, et le geste va de soi). L'intro cinématique garde SA propre
invite (« Cliquez ou faites défiler pour ouvrir la page ») : deux
moments, deux invites.

**Un style INLINE bat le gating CSS de l'entrée — piège de la même
famille que le `pointer-events` de `#hero-bg`.** `heroHint()` écrivait
`style.opacity` dès l'inscription de son abonné ; cet inline passe
devant `html:not(.no-anim) .hs-hero .hs-hint{opacity:0}`, et l'invite
s'allumait donc PAR-DESSUS l'intro cinématique. L'abonné n'écrit rien
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
et **le portrait restait invisible dans tout le chemin immersif** — donc
partout sauf `?skip-anim`, mobile et reduced-motion, c'est-à-dire les trois
modes dans lesquels on teste. Le bug a vécu longtemps pour cette raison.
Corrigé en préfixant la règle par le même `html:not(.no-anim)`. **Toute
nouvelle règle `.lit` doit être vérifiée contre la spécificité (0,3,1) de la
règle qui cache**, et testée au moins une fois hors `skip-anim`.

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

**Il y a une vraie bougie.** `.hs-closer-candle` reprend celle de l'intro
cinématique, aux mêmes couleurs : bougeoir laiton `#9a7b30`, cire crème
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
- ✅ Accueil général du site (`/index.html`) — enrichi + animé (voir ci-dessus)
- ✅ Accueil de l'œuvre Le Capital (hero + onglets Lire/Atelier/Ressources)
- ✅ Page de lecture d'un chapitre (Le Capital) — bandeau + lettrine
  rubriquée + colonne de notes en marge retirée (redondante avec
  Notes partagées/Mes notes)
- ✅ « Texte intégral » (Le Capital) — attention : cette page a connu
  une régression fonctionnelle (lecteur cassé, contraste texte
  illisible, réglages de lecture non opérationnels) après une
  première tentative de restylage ; vérifier que la restauration +
  réapplication progressive s'est bien terminée avant de reconstruire
  dessus.
- ✅ Place publique — **refondue en « table commune » (forum), portée
  en scène 3D** (août 2026), voir « La page Place publique » ci-dessous.
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

- **Accueil** (`data-act="home"`) → `/?skip-anim` — l'accueil sans rejouer
  l'intro cinématique, comme le brandmark.
- **Bibliothèque** (`data-act="biblio"`) → `/oeuvres/bibliotheque.html`.

L'entrée correspondant à la page courante prend `.on`. Noter que les pages de
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

## La page Place publique — « la table commune » (refonte août 2026, 3D)

`oeuvres/place-publique.html` (CSS et JS inlinés, motif de la page).
**Ce lieu est un FORUM** — décision du propriétaire, 2e passe de la
refonte : la 1re passe (« le mur d'affiches » : palissade la nuit,
réverbère à gaz, placards en lecture seule) a été REMPLACÉE sur ses
retours. Ne pas y revenir. Ce qui a changé et pourquoi :

- **La scène est une TABLE de bois vue en plongée** (planches
  horizontales — c'est ce qui distingue un plateau d'une palissade),
  et les notes sont des **feuillets qui volent et se posent dessus**,
  comme la liasse du héros de l'accueil — demande explicite. Ici tout
  est DOM + CSS, pas de WebGL : le contenu est du texte vivant.
- **Le commentaire prime sur la citation.** Le passage cité est en
  petit, encre passée, filet rouge discret, AU-DESSUS du corps — c'est
  le contexte, pas la manchette (l'inverse de la 1re passe, corrigé
  sur demande).
- **Les réponses s'affichent et se composent sur place** : billets
  glissés sous le feuillet parent, et un billet à écrire — textarea
  en Caveat, on répond à la main.
- **La bougie de l'accueil éclaire la table** (mêmes classes cd-*,
  mêmes couleurs, même règle coupelle + douille), posée au bord
  droit, à demi hors cadre par le bas. Masquée < 768 px.

**Le rendu du flux est PROPRE À CETTE PAGE** (fetch + rendu inlinés —
précédent : l'ancienne vue riche de capital-1 avant retrait-shell-host).
`SHELL.commune` reste la vue compacte en lecture seule des autres pages
(aperçus de l'accueil et de la bibliothèque) : **ne pas le modifier**
pour les besoins du forum. La page partage seulement ses conventions :
`public_notes.work` = id de bibliotheque.json, alias hérité
`'capital'` → `'capital-1'` (à l'AFFICHAGE **et** à l'ÉCRITURE : une
réponse à une note héritée s'écrit avec l'id résolu, jamais l'alias),
jamais de second client Supabase (toujours `SHELL.auth.getClient()`),
petits outils dupliqués plutôt que couplés (esc/ago/toast — shell-social
fait pareil et le commente).

**Le contrat de réponse reprend EXACTEMENT `addReply()` de
shell-annotations.js** : ligne `{id: uid(), author_id: SHELL.auth.user.id,
work, section, body, parent_id, created: Date.now()}` (une réponse n'a
pas de quote), et le même gating : configuré + connecté + pseudo choisi,
sinon toast + `SHELL.auth.openModal()`. Après l'INSERT, le billet est
ajouté en optimiste (pas de re-rendu complet de la table — le
défilement ne doit pas sauter). Deux requêtes au chargement : racines
(`parent_id is null`, desc, 200) et réponses (`parent_id not null`,
asc, 800), groupées côté client. La modération est FAITE (voir
« Modération » plus bas) : un modérateur reçoit aussi les fils masqués,
mais la salle 3D ne les pose JAMAIS sur la table — le registre et la
fiche les portent, estompés.

**Les mouvements** (tous sous les règles maison — réversibles, défaut
posé, périodes non multiples) :

- **`--k` (0 = en l'air : haut, dérive `--fx`, sur-rotation `--rr`,
  ombre de vol sur `::before` ; 1 = posé)** est piloté par DEUX
  mouvements : la CASCADE au chargement (chaque feuillet a son
  `_born`, ils tombent l'un après l'autre — une seule fois, dans le
  sens du temps) et le SCRUB au défilement (réversible). La règle de
  composition : `k = min(cible de défilement, avancement de cascade)`
  — la cascade ne fait que RETENIR un feuillet, jamais le poser plus
  tôt que le défilement ne le permet. Défaut CSS `var(--k,1)` : sans
  JS / reduced-motion / < 768 px, tout est posé.
- **L'allumage de la bougie** : même mécanique `pp-boot`/`pp-anim`/
  `pp-lit` que la passe précédente (script inline en tête de body,
  filet setTimeout 2,5 s, `--lum` sur flamme/halo/voile chaud,
  en-tête gaté par `pp-lit`, fill-mode backwards).
- Le tick **ignore les hauteurs nulles** (`if(!vh) return`) et les
  feuillets filtrés (`display:none`) ; ouvrir/fermer un billet ou
  filtrer change les hauteurs → rappeler `ppTick()`.

**L'en-tête reste sobre** (grammaire des autres pages : label Inter en
capitales, titre Fraunces 900 crème, lede d'une phrase) — l'affiche-
héros de la 1re passe avait déjà été retirée sur demande (trop de
texte, pas de renvoi à la bibliothèque) : ne re-proposer ni l'une ni
l'autre. Filtres par œuvre = retailles de kraft (tampon rouge sur
l'actif), désormais construits sur les DONNÉES (id d'œuvre résolu),
plus sur le texte du DOM. Décor : rond de tasse, feuillets vierges —
aria-hidden, jamais des données.

### La salle en trois dimensions (mission `salle-commune-3d`)

Sur demande du propriétaire (« passer un cap en qualité et en
immersion, comme pour la biblio »), la page est devenue une **salle de
réunion Three.js** au motif exact de la bibliothèque : canvas fixe,
cale de défilement (#ppRun), le défilement pour seul travelling
(réversible), plan large d'entrée → approche → travée → léger recul
final. **Le registre à plat décrit ci-dessus est devenu le repli**
(mobile, reduced-motion, sans WebGL, `#liste`, ou aucun feuillet) et
reste la version des lecteurs d'écran — c'est LUI qui porte filtres et
états ; la 3D n'existe que s'il y a des feuillets à poser.

- **La scène** : une longue table de bois (longueur dérivée du nombre
  de fils), deux bancs, chandeliers posés tous les 4 m (flammes
  billboards, blobs dessinés — jamais de plans croisés), encrier en
  haut de table, pile de feuilles vierges au bout, poussière,
  bougeoir porté enfant de la caméra (ancré au coin du cadre EN
  FONCTION DE LA FOCALE), fog couleur du fond. Tout est dérivé des
  données ou du décor — jamais l'inverse.
- **Un fil = un feuillet posé sur la table**, texture canvas
  (signature Caveat, œuvre·section, citation en petit italique, le
  COMMENTAIRE en texte principal, compte de réponses) redessinée sur
  `document.fonts.ready` ET après chaque réponse postée ; **les
  réponses sont des billets qui dépassent de sous le feuillet** (3
  max). Tons et poses déterministes par hash de l'id. Les feuillets
  sont groupés PAR ŒUVRE (ordre de bibliotheque.json), cartouche de
  laiton incliné vers le regard par groupe, rail en bas = les œuvres.
- **La cascade d'entrée** : au chargement (et seulement en haut de
  page — une restauration de défilement la saute), les feuillets
  TOMBENT se ranger l'un après l'autre — c'est la réponse à la
  demande « des feuillets qui s'animent comme sur l'accueil ».
  Temporelle et jouée une fois ; le reste du mouvement est du scrub.
- **La caméra du travelling lit par-dessus l'épaule** (CAMY 3.0,
  CAMZ 1.78, plongée ~55°) : à l'oblique d'origine l'encre ne se
  lisait pas — retour du propriétaire, ne pas raplatir.
- **Les photos de profil** (`profiles.avatar_url`) sont partout : dans
  l'encre du feuillet 3D (cache par URL, `crossOrigin='anonymous'`
  OBLIGATOIRE — un canvas terni ferait échouer l'upload WebGL ; si le
  CORS échoue, le cachet d'initiales reste), sur le cachet du registre
  et de la fiche (`avaImg()`, img par-dessus l'initiale, motif
  `avaHtml` du shell), et dans l'étiquette de survol.
- **Le forum se dit partout** : label « le forum des lecteurs »,
  lede « une discussion ouverte… répondez-y », pied de feuillet
  « N réponses — soulevez pour répondre », étiquette « cliquer :
  lire le fil · répondre ».
- **Survol** = le feuillet se soulève (outT easé) + étiquette
  projetée ; **clic** = la caméra vient se poser devant (scrollToX —
  le pilotage reste le défilement) et la FICHE s'ouvre
  (`.pt-cartel`, meuble du cartel de la biblio) : fil complet,
  citation, réponses, **composer** (textarea Caveat + « Publier la
  réponse » via le cœur partagé `postReply`), « Aller au passage → ».
  `onReplyPosted` répercute une réponse postée depuis la fiche sur le
  feuillet 3D ; `teardown()` re-rend le registre pour la même raison.
- **L'échelle est prévue pour cent fils et plus** (demande du
  propriétaire) : (a) les feuillets vont DEUX DE FRONT, en quinconce
  (rangées z≈+0.42 / −0.72, pas horizontal 0.78 + désordre en x — le
  quinconce strict se lisait comme une fermeture éclair) ; (b) **les
  deux dernières réponses s'écrivent SUR le feuillet** (« ↳ nom — début
  de la réponse », le corps se réduit à 4 lignes quand il y en a) — la
  conversation se voit sans soulever ; (c) **encre paresseuse** : les
  feuillets naissent PAPIER NU (matériaux partagés par ton) et ne sont
  encrés qu'à l'approche de la caméra (INK_DIST 20, budget 3/image,
  pré-encrage autour de la CIBLE dans scrollToX — sans lui, un saut de
  rail débouchait sur du papier nu) ; (d) au-delà de GROUP_MAX (80) par
  œuvre, **la pile des feuillets plus anciens** au bout de la table —
  cliquable, elle ouvre le registre qui garde tout ; (e) cale de
  défilement 0.3·vh par feuillet, rail qui replie
  (`flex-wrap`). Testé à 100 et 150 fils (sonde `?stress=`, retirée).
- **`material.visible:false` est IGNORÉ par le raycaster**
  (Mesh.raycast sort tôt) : le plan de prise de la pile est en
  `transparent:true, opacity:0` — invisible ET levable.
- Tous les pièges déjà documentés de la biblio ont été appliqués
  d'office : canvas élément remplacé, resize à tailles nulles ignoré,
  clic à coordonnées propres, distance-pour-contenir à la focale
  large, compensation sidebar (`sbShift`), rendez-vous
  DOMContentLoaded pour three.min.js en defer, `#liste`,
  `location.reload()` si une scène a déjà été démontée.

**Pièges rencontrés sur cette page (à ne pas refaire)** :

1. **`innerWidth` vaut 0 dans un onglet chargé en arrière-plan** : le
   test « mobile » du boot est `innerWidth > 0 && innerWidth < 768` —
   une largeur NULLE n'est pas « étroit », c'est « inconnu », on prend
   le chemin animé. Même famille : le tick ignore `innerHeight` nul.
2. **Spécificité des variantes nth-child** : les poses
   `.fl:nth-child(5n+1){--x:…}` pèsent (0,2,0) ; le correctif mobile
   doit s'écrire `.fl:nth-child(n){--x:0px}` pour les égaler.
3. **Le gating `.pt-ui{display:none}` ne survit pas à un `display`
   posé dans la règle de base d'un élément** : `.pt-hint{display:flex}`
   l'écrasait et l'invite 3D fuyait dans la version liste. Les
   `display` des éléments d'interface 3D vivent SOUS `.js-pp3d`.
4. **`#liste` cliqué depuis la page est une navigation same-document**
   — rien ne recharge, la scène reste. Les boutons « version liste »
   appellent `teardown()` directement ; le hash ne sert qu'à ARRIVER
   en liste.
5. **Pour tester : la sonde, toujours.** Dans un onglet piloté le rAF
   est gelé (cascade et scrub ne posent rien), les captures d'une pane
   masquée sont noires ou périmées, et `scroll-behavior:smooth` (posé
   par atelier.css) fait qu'un `window.scrollTo(0,y)` ne progresse
   PAS — passer `{behavior:'instant'}`. Exposer temporairement le
   tick, avancer à la main, retirer la sonde avant le commit.

La sidebar marque « Place publique » `.on` sur cette page (une ligne
dans `shell.js`, à côté du marquage Accueil/Bibliothèque).

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
- **Trois surfaces** : le panneau « Notes partagées » par passage
  (shell-annotations.js), le registre de la Place publique et sa fiche
  (place-publique.html). Partout : « Signaler » sur toute note qui n'est
  pas la sienne (gating `ensurePoster` — toast + modale si déconnecté),
  motif facultatif dans une petite boîte inline ; pour un modérateur,
  « Masquer »/« Rétablir » et les notes masquées visibles ESTOMPÉES avec
  l'étiquette « Masquée ». Le fetch retire le filtre `hidden=false`
  seulement si `isMod()` ; comme le statut arrive en différé, chaque
  surface s'abonne à `SHELL.mod.onChange` pour recharger.
- **La salle 3D ne pose JAMAIS un fil masqué sur la table** — même pour
  un modérateur : la table est la salle publique, la modération se fait
  au registre et dans la fiche. Un fil masqué depuis la fiche quitte la
  table sur-le-champ via le crochet `onNoteHidden` (motif jumeau
  d'`onReplyPosted`) : mesh et billets `visible=false` ET retirés de
  `hitMeshes` — le raycaster de three ignore `visible:false`, piège
  cousin du `material.visible` déjà documenté.
- `SHELL.commune` (aperçus lecture seule) reste filtré `hidden=false` et
  sans actions — ne pas l'équiper.
- **Validé en production par le propriétaire** (août 2026) : SQL rejoué,
  sa ligne insérée dans `moderators`, puis signalement, masquage
  (registre ET fiche 3D — le feuillet quitte la table) et
  rétablissement testés en vrai. Tout fonctionne.

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

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
- ✅ Place publique
- ✅ Barre latérale générale + barre horizontale du haut
- 🔲 Accueil de l'œuvre Manuscrits de 1844 (mission en cours — même
  structure que Le Capital, contenu à adapter : aliénation du
  travail, propriété privée, dépassement communiste)
- 🔲 Onglets Parcourir / Cheminement / Modèles / Explorations /
  Chronologie : **jugés satisfaisants tels quels, ne pas retoucher**
  sans demande explicite.
- ✅ Page Bibliothèque à part (`oeuvres/bibliotheque.html`) — **refondue
  en scène 3D « la pièce aux rayonnages »** (août 2026), voir « La page
  Bibliothèque » ci-dessous. Elle avait été jugée inutile, rouverte sur
  demande explicite du propriétaire, puis refondue sur demande explicite
  encore : la page-document « Par où commencer » est remplacée.

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
(`reports`, `hidden`, rôle `moderators`) reste **différée à 5c**.

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

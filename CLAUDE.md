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

**Section « Ce que vous pouvez faire » — les trois feuillets se posent
(`doCards()`).** Prolongement de la liasse : ce qui s'envole du héros
redescend ici. Les trois cartes ne sont plus révélées par le fondu
`.reveal-stagger` mais **posées au défilement** — chacune arrive 30 px plus
haut et de biais (`TILT` −2,6° / +1,9° / −1,5°), puis se pose à plat, avec un
décalage `LEAD` d'une carte à la suivante. Sur la même course, un **balayage**
(`--sweep`, en px) révèle la **réglure** du feuillet — bande de lignes en
`--border` limitée aux 104 px du haut de la carte, derrière le chiffre et le
titre, jamais derrière le paragraphe (essayé pleine hauteur : ça faisait du
moiré avec les lignes de texte) — et le chiffre romain **prend l'encre**
(`--ink`, décalé de 45 % pour venir après la pose). Piloté par la position de
scroll → réversible.

Deux points de mécanique à respecter : `doCards()` **retire lui-même**
`.reveal-stagger` de la grille et pose `.poses` (sinon les deux systèmes
d'opacité se marchent dessus) ; et la pose passe par **deux nouvelles
variables CSS** `--drop` / `--tilt` ajoutées *devant* `--rx` / `--ry` /
`--lift` dans le `transform` partagé `.hs-do-card,.hs-w-card` — surtout ne
pas écrire `style.transform` en JS, ça casserait l'inclinaison au curseur de
`cardFx()`. La réglure elle-même est **permanente** (`--sweep` vaut 999 px
par défaut) : sans JS, sous no-motion ou en dessous de 768 px, les cartes
gardent leur réglure et leur fondu simple.

**Le piège de la place disponible.** Le héros n'a que trois zones où un
feuillet est réellement visible : le couloir vertical entre le texte et le
portrait, la marge droite, et la bande sous le portrait. Le portrait est en
`z-index:1` **au-dessus** du canvas : rien ne peut voler devant lui, et une
liasse posée derrière lui est tout simplement invisible (essayé : `CX 7.8`
puis `9.2` — le vol se réduisait à un coin de marge droite). D'où le choix
du couloir central, qui a imposé d'**ouvrir le masque** de `#hero-bg` dans
`index.html` : le dégradé passe de `transparent 22% → #000 52%` à
`transparent 20% → #000 42%`, juste au-delà du bord droit de la colonne de
texte (~36 % de la largeur du canvas). Ne pas resserrer ce masque sans
redéplacer la liasse, et ne pas l'ouvrir davantage : les feuillets pâles
passeraient derrière le texte crème.

**Réglages solidaires de la liasse — ne pas en toucher un seul isolément** :
`CX`/`CY`/`CZ`, `FAN`, `LEAD`, `SPAN`, `FLY`, l'échelle des feuillets
(`0.60 + rnd*0.26`) et le masque de `#hero-bg`. Ils sont calés ensemble pour
que la liasse au repos ne touche ni les boutons du héros ni le portrait, et
que le couloir soit vide à la fin de la course.

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

Le trajet n'est **pas** une translation rectiligne : `pathAt(t)` décrit une
**diagonale courbe**, du fond haut-gauche vers le premier plan bas-droite.
Trois composantes : X traverse ; `Y_TOP → 0` (exposant `Y_EASE`) fait la
DESCENTE — il plonge vite puis roule au ras du bas, ce qui le fait passer
sous le bloc de texte au milieu du parcours ; `Z_FAR → Z_NEAR` l'amène vers
nous (il sort plus grand qu'il n'est entré : le circuit revient grossi) et
`Z_TURN` y superpose **un seul** virage (`sin(π t)`) : il entre braqué
vers nous, se redresse, et ressort braqué de l'autre côté. Deux virages se
lisaient comme un frétillement. Le roulis suit la courbure, bridé à ~4°.
`scene.fog` est réglé sur la couleur exacte de `--surface`, donc le
lointain disparaît vraiment.

**Deux pièges déjà rencontrés — ne pas les refaire :**
- Le « haut → bas » doit venir de Y, PAS de la profondeur. La perspective
  écrase les lointains : un grand écart de Z ne déplace le chariot que
  d'une soixantaine de pixels tout en le forçant à entrer de face et en
  imposant une caméra plongeante peu flatteuse.
- Le cap ne doit PAS être la tangente 3D exacte. `atan2(dx, dz)` brut
  donne un chariot qui **dérape** : la perspective écrase le déplacement
  en profondeur, si bien qu'une caisse braquée de 30° vers nous se déplace
  à l'écran presque à l'horizontale. D'où `HEAD_DAMP` — on ne retient que
  la part *visible* de `dz`, la caisse se recale sur sa trajectoire
  apparente, et le virage se lit quand même par la variation du cap.

**Réglages solidaires — ne pas en toucher un seul isolément** : `Y_TOP` /
`Y_FLOOR` / `Y_EASE` / `Z_*` / `HEAD_DAMP`, les coefficients de caméra
`0.296 * d` et `0.270 * d` dans `resize()`, l'échelle `0.78` du rig, et le
`padding-bottom` de `.js-circuit .circuit-band` (qui remonte le bloc de
texte pour dégager la bande basse). Ils sont calés ensemble pour que la
diagonale reste entière dans le cadre — `Y_FLOOR` en particulier retient
la fin de course au-dessus du bord bas, là où le virage l'amène au plus
près de nous.

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
- 🔲 Page Bibliothèque à part : **abandonnée** — le menu déroulant de
  la sidebar suffit, ne pas la recréer.

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

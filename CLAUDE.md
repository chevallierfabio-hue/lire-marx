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

## Direction artistique — refonte « Rouge Internationale »

Une refonte visuelle complète du site est en cours depuis août 2026.
Toute nouvelle page ou tout nouveau composant doit suivre ces règles ;
toute page pas encore migrée doit être alignée dessus dès qu'elle est
retouchée.

**Palette (tokens CSS, custom properties sur `:root`)** :
```
--bg:      #F7F5F0   /* fond principal, blanc cassé */
--text:    #171614   /* texte principal, noir-brun encre */
--accent:  #C41E3A   /* rouge drapeau, saturé et assumé — accent unique */
--muted:   #8B8577   /* gris papier, texte secondaire/métadonnées */
--surface: #FBF9F4   /* fond de carte, légèrement plus clair que --bg */
--border:  #E9E5D8   /* bordures fines, séparateurs */
```

**Typographies** : `--font-display` = Fraunces (poids 500/600), réservée
aux titres — jamais au corps de texte ni à la navigation.
`--font-body` = Inter, pour tout le reste (nav, corps de texte, boutons,
métadonnées). Ne jamais réintroduire de police système par défaut ni de
serif ornementale/gothique — c'était le défaut de l'ancienne DA
(« lumière = capital ») qu'on abandonne.

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
« circuit du capital » animée (A–M–P–M′–A′), catalogue, aperçu Place
publique (`SHELL.commune.mount(#homeCommune,{limit:4})`), chiffres clés,
bande CTA finale. Le mouvement vit dans **`assets/home.js`** (chargé
`defer`) : révélations au scroll (`IntersectionObserver`, classes
`.reveal` / `.reveal-stagger` / `.in` ; racine = `.hw` si elle défile,
sinon viewport), duplication du marquee, et **fond WebGL discret**
(`#hero-bg`, feuillets pâles) — **coupé si `prefers-reduced-motion` ou
largeur < 768**, ne démarre qu'une fois `body.shell-active`. Le script
inline en bas de page pose `.lit` sur `.hs-hero` (entrée orchestrée) et
`shell-active` dès que `#sheet` s'ouvre **ou** immédiatement si
`skip-anim` / reduced-motion / **largeur < 768** (ce dernier corrige un
bug où la topbar/sidebar restaient masquées sur mobile). Deux marqueurs
sur `<html>` : `no-anim` (pas d'intro) et `no-motion` (pas d'animations
du tout — mobile étroit ou reduced-motion). CSS de l'accueil = **inline**
(critique LCP) ; JS = **externe + `defer`**. Ne pas réintroduire de
Three.js bloquant. `SHELL.commune` vient de `shell.js` (déjà chargé).

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

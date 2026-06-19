# Lire Marx

Atelier de lecture critique des œuvres de Marx, à partir de textes du domaine public.
Site statique, destiné à être hébergé sur Cloudflare Pages depuis un dépôt
GitHub, sans framework, sans compilation et sans étape de build.

---

## Déploiement (site statique)

### 1. GitHub

1. Crée un dépôt (par ex. `lire-marx`).
2. Ajoute les fichiers du site à la racine du dépôt.
   - Soit via l'interface web GitHub (« Add file → Upload files »),
   - soit en ligne de commande :
     ```bash
     git init
     git add .
     git commit -m "Initialiser le site statique Lire Marx"
     git branch -M main
     git remote add origin https://github.com/<toi>/lire-marx.git
     git push -u origin main
     ```

### 2. Cloudflare Pages

1. Tableau de bord Cloudflare → section **Workers & Pages** → **Create application** → onglet **Pages** → **Connect to Git**.
2. Sélectionne le dépôt `lire-marx`, branche de production : `main`.
3. Réglages de build (c'est un site statique, **aucune compilation**) :
   - **Framework preset** : `None`
   - **Build command** : *(laisser vide)*
   - **Build output directory** : `/`
4. **Save and Deploy** → tu obtiens une URL en `https://<projet>.pages.dev`.
5. (Optionnel) Onglet **Custom domains** pour brancher ton propre nom de domaine.

> Une fois en ligne (HTTPS), la liseuse « Lire le Capital » fonctionne :
> le chargement du texte depuis fr.wikisource.org (domaine public, CORS `origin=*`)
> n'est plus bloqué comme il l'était dans l'aperçu intégré au chat.

---

## Structure

```
lire-marx/
├── index.html                 # enveloppe statique et animation d'accueil
├── config.js                  # configuration Supabase publique (jamais de secret)
├── oeuvres/
│   ├── bibliotheque.json      # source centrale de la liste des œuvres
│   ├── index.html             # page Bibliothèque générale
│   ├── capital-1.html         # atelier existant du Capital, Livre I
│   ├── capital-1/             # fichiers et manifest du Capital, Livre I
│   └── <id-oeuvre>/
│       ├── manifest.json      # métadonnées et découpage de l'œuvre
│       └── textes/            # textes intégrés progressivement
├── supabase/
│   └── schema.sql     # tables `annotations`, `profiles`, `public_notes` + RLS
└── README.md
```

La bibliothèque est pilotée par `oeuvres/bibliotheque.json`. Les pages peuvent
charger ce fichier pour afficher les œuvres disponibles ou à venir, sans
dupliquer la liste dans plusieurs fichiers. L'atelier du Capital, Livre I,
reste la page de lecture principale existante : il ne faut pas le remplacer par
une version simplifiée.

---

## Ajouter une œuvre

Chaque nouvelle œuvre doit être ajoutée progressivement, en gardant le site
statique et compatible Cloudflare Pages.

1. **Créer l'entrée dans `oeuvres/bibliotheque.json`**

   Ajouter un objet avec les champs suivants :

   ```json
   {
     "id": "id-de-loeuvre",
     "title": "Titre complet",
     "shortTitle": "Titre court",
     "author": "Karl Marx",
     "year": 1859,
     "status": "planned",
     "category": "Marx — critique de l'économie politique",
     "path": "",
     "manifest": "oeuvres/id-de-loeuvre/manifest.json",
     "description": "Courte présentation de l'œuvre.",
     "concepts": ["concept 1", "concept 2"],
     "readingGuide": "Indication de parcours de lecture.",
     "sourceNote": "Indication sur la source et le statut du texte."
   }
   ```

   Utiliser `planned` ou `draft` tant que la page de lecture n'est pas prête.
   Ne passer à `available` que lorsque le chemin, le manifest, les textes et la
   page fonctionnent réellement.

2. **Créer le dossier de l'œuvre**

   Le dossier doit suivre la forme :

   ```text
   oeuvres/<id-oeuvre>/
   ├── manifest.json
   └── textes/
   ```

   Le dossier `textes/` peut contenir un `README.md` ou un `.gitkeep` tant que
   les textes complets ne sont pas intégrés.

3. **Créer `manifest.json`**

   Le manifest décrit l'œuvre et son découpage. Il doit rester cohérent avec
   l'entrée de `bibliotheque.json` :

   ```json
   {
     "work": "id-de-loeuvre",
     "title": "Titre complet",
     "author": "Karl Marx",
     "year": 1859,
     "status": "planned",
     "source": {
       "label": "Source à préciser",
       "url": "",
       "rights": "Domaine public à vérifier"
     },
     "chapters": [],
     "sections": [],
     "notes": "Texte non encore intégré."
   }
   ```

   Selon l'œuvre, utiliser `chapters`, `sections`, ou les deux. Ne pas créer de
   faux contenu complet : mieux vaut indiquer clairement que l'intégration est
   en préparation.

4. **Ajouter les textes**

   Placer les fichiers sources dans `oeuvres/<id-oeuvre>/textes/`, puis les
   relier au manifest. Vérifier les sources, le domaine public, la cohérence du
   découpage et les chemins relatifs.

5. **Passer l'œuvre en disponible**

   Passer `status` de `planned` ou `draft` à `available` seulement quand :

   - l'entrée de `bibliotheque.json` pointe vers une vraie page fonctionnelle ;
   - le manifest est valide ;
   - les textes s'affichent correctement ;
   - aucun lien cassé n'est exposé dans la bibliothèque ;
   - l'atelier du Capital, Livre I, fonctionne toujours.

---

## Règles importantes

- Ne jamais mettre de clés secrètes dans `config.js`.
- Ne jamais utiliser ni exposer la clé Supabase `service_role` côté client.
- `config.js` ne doit contenir que les informations publiques nécessaires au
  client, comme l'URL du projet et la clé `anon` ou `Publishable`.
- Ne pas casser l'atelier du Capital, Livre I : `oeuvres/capital-1.html` porte
  encore la lecture, les annotations, le forum, la modération et les éléments
  RGPD.
- Le projet reste statique : HTML, CSS et JavaScript simples, sans React, Vite,
  Next ou autre build obligatoire.

---

## Feuille de route

- **Bibliothèque**
  Maintenir `oeuvres/bibliotheque.json` comme source centrale, améliorer la page
  `oeuvres/index.html` et garder l'entrée par la barre latérale de l'atelier.

- **Intégration progressive des textes**
  Ajouter les œuvres une par une via leur dossier, leur manifest et leurs
  fichiers dans `textes/`, sans annoncer une œuvre comme disponible avant que
  la lecture fonctionne.

- **Système visuel et coquille partagés (en cours)**
  Le système visuel commun aux ateliers vit dans `oeuvres/atelier.css`. La
  coquille (barre supérieure 44 px avec brandmark/recherche/compte, sidebar
  208 px avec Bibliothèque/Place publique/Contacts/CGU/sb-work, modales
  compte et RGPD) vit dans `oeuvres/shell.css` côté style et dans
  `oeuvres/shell.js` côté markup+comportement (la page appelle
  `installShell({workId, workTitle, tabs:[...]})` qui injecte tout le shell).
  Les Manuscrits, la bibliothèque (`oeuvres/index.html`) et le Capital lui-même
  utilisent ce shell. L'accueil canonique du site est désormais la
  bibliothèque : le brandmark Lire.Marx y renvoie depuis n'importe quelle
  page. Capital n'a plus de vue #home propre ; il est devenu un livre comme
  un autre.

- **Shell JS à factoriser entièrement (mission future)**
  `oeuvres/capital-1.html` inline encore l'auth Supabase, le forum public
  (Place publique), la modération, la RGPD, la recherche, les messages, les
  contacts et un routeur de hash qui leur sert de point d'entrée depuis
  les autres pages. Tant qu'elles ne sont pas extraites vers `shell.js`, le
  shell partagé redirige vers `capital-1.html#commune` / `#contacts` /
  `#cgu` lors d'un clic sur le sidebar Place publique / Contacts / CGU
  depuis Manuscrits ou la bibliothèque. Prochaine étape architecturale :
  sortir ce code de `capital-1.html`, le placer dans `shell.js`, et faire
  que toutes les pages le consomment uniformément — sans plus avoir besoin
  de `SHELL_HOST` ni du routeur de hash.

- **Amélioration éditoriale**
  Compléter les guides de lecture, les notes de source, les concepts associés,
  les introductions et les parcours de lecture.

- **Phase 1 — hébergement + annotation « local-first »** *(fait)*
  Site en ligne, puis interface de surlignage / prise de notes côté
  navigateur, avec un modèle de données pensé pour la synchronisation (chaque
  annotation = œuvre + chapitre + citation ancre + couleur + texte + date).
  Sauvegarde locale + export/import JSON.

- **Phase 2 — Supabase** *(en cours)*
  Authentification (lien magique par e-mail) + table de notes privées (chacun
  ne voit que les siennes, via Row Level Security). Schéma SQL fourni dans
  `supabase/schema.sql` ; le code client est intégré aux pages statiques du
  site, notamment l'atelier du Capital, Livre I. Voir « Mise en route
  Supabase » ci-dessous.

- **Phase 3 — notes publiques + modération** *(en cours)*
  Table `public_notes` (forum) : notes publiques ancrées à un passage, avec
  fils de réponses, lisibles par tous, écriture réservée aux comptes ayant un
  pseudo. **Fait** : la mécanique du forum (table + RLS, panneau « Notes
  partagées », publication, réponses, suppression de ses contributions, saut
  au passage) **et la modération** (bouton « Signaler », table `reports`,
  rôle modérateur via la table `moderators`, masquage/affichage des notes,
  file de signalements côté modérateur) **et une première couche RGPD** (avis
  de confidentialité accessible partout, et « Supprimer mes données » qui
  efface annotations, notes/réponses publiques, pseudo et signalements de
  l'utilisateur). **À faire avant d'ouvrir au public** : compléter le texte de
  l'avis de confidentialité (passages entre crochets), prévoir la suppression
  *complète* du compte `auth.users` (fonction côté serveur / Edge Function),
  et éventuellement des notes éditoriales / mise en avant. Tant que ces
  garde-fous ne sont pas complets, garder l'accès restreint.

  > **Se désigner modérateur** : Supabase → Authentication → Users → copier
  > son UID, puis Table Editor → `moderators` → Insert (coller l'UID), ou en
  > SQL : `insert into public.moderators (id) values ('TON-UID');`. La table
  > `moderators` n'a aucune écriture côté client : impossible de s'auto-promouvoir.

---

## Répartition des rôles

- **Toi** : créer le dépôt GitHub, le projet Supabase, la connexion Cloudflare
  Pages, et coller tes clés (notamment la clé `anon` publique).
- **Moi** : le front-end et la couche d'annotation, le schéma de base de données
  et le code client Supabase.

---

## Mise en route Supabase (Phase 2)

Une fois un projet Supabase créé (https://supabase.com) :

1. **Schéma** — tableau de bord → **SQL Editor** → coller le contenu de
   `supabase/schema.sql` → **Run**. Cela crée la table `annotations` et les
   politiques d'accès « chacun ne voit/écrit que les siennes ».
2. **Authentification** — **Authentication → Providers** : laisser **Email**
   activé. Le site utilise une **inscription e-mail + mot de passe** (pastille
   « compte » en haut à droite, présente sur tout le site), avec pseudo public.
   Tu peux garder « Confirm email »
   activé (l'utilisateur confirme via un mail avant connexion) ou le
   désactiver (inscription instantanée). Puis
   **Authentication → URL Configuration** :
   - **Site URL** : `https://<projet>.pages.dev`
   - **Redirect URLs** : `https://<projet>.pages.dev/**`
3. **Clés** — **Project Settings → API** : copier **Project URL** et la clé
   **Publishable** (`sb_publishable_…`) — ou la clé **anon** (onglet *Legacy
   API Keys*) pour un projet ancien. Les coller dans **`config.js`** (les deux
   champs `url` et `anon`). Ne **jamais** y mettre la clé `service_role`.

> Les clés vivent dans `config.js`, **pas** dans `index.html` : tu les remplis
> une fois, et les mises à jour d'`index.html` ne les écrasent jamais. (Si
> `config.js` est absent ou laissé en placeholder, le site reste 100 % local.)

Tant que les valeurs `CONFIG` restent les placeholders, le site reste en mode
**local pur** (rien n'est envoyé). Une fois les clés en place, la **pastille
« compte »** en haut à droite (présente partout, accueil compris) ouvre une
fenêtre pour **créer un compte** (e-mail + mot de passe + pseudo) ou
**se connecter**. Les notes locales déjà prises sont alors
**téléversées automatiquement** (migration), puis synchronisées entre
appareils, et reliées au compte par `user_id`. Le pseudo (table `profiles`)
est l'identité publique réservée au futur forum ; l'e-mail reste privé.

> **Si tu mets à jour un projet Supabase déjà créé** : re-exécute simplement
> `supabase/schema.sql` en entier dans le SQL Editor — il est idempotent et
> ajoute la table `profiles` sans toucher aux annotations existantes.

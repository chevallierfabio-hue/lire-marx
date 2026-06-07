# Lire Marx

Atelier de lecture critique des œuvres de Marx, à partir de textes du domaine public.
Site statique (un seul fichier `index.html` pour la v1), destiné à être hébergé sur
Cloudflare Pages depuis un dépôt GitHub, puis enrichi d'un backend Supabase.

---

## Déploiement (v1 — site statique)

### 1. GitHub

1. Crée un dépôt (par ex. `lire-marx`).
2. Ajoute à la racine : `index.html` et ce `README.md`.
   - Soit via l'interface web GitHub (« Add file → Upload files »),
   - soit en ligne de commande :
     ```bash
     git init
     git add index.html README.md
     git commit -m "v1 : site statique Lire Marx"
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

## Structure (v1)

```
lire-marx/
├── index.html         # le site : accueil + atelier du Capital + annotation/synchro
├── config.js          # tes clés Supabase (à remplir une fois ; jamais écrasé)
├── supabase/
│   └── schema.sql     # tables `annotations`, `profiles`, `public_notes` + RLS
└── README.md
```

À mesure que d'autres œuvres s'ajouteront, on pourra éclater ce fichier unique
en pages séparées + composants partagés.

---

## Feuille de route

- **Phase 1 — hébergement + annotation « local-first »** *(fait)*
  Site en ligne, puis interface de surlignage / prise de notes côté
  navigateur, avec un modèle de données pensé pour la synchronisation (chaque
  annotation = œuvre + chapitre + citation ancre + couleur + texte + date).
  Sauvegarde locale + export/import JSON.

- **Phase 2 — Supabase** *(en cours)*
  Authentification (lien magique par e-mail) + table de notes privées (chacun
  ne voit que les siennes, via Row Level Security). Schéma SQL fourni dans
  `supabase/schema.sql` ; le code client est intégré à `index.html`. Voir
  « Mise en route Supabase » ci-dessous.

- **Phase 3 — notes publiques + modération** *(en cours)*
  Table `public_notes` (forum) : notes publiques ancrées à un passage, avec
  fils de réponses, lisibles par tous, écriture réservée aux comptes ayant un
  pseudo. **Fait** : la mécanique (table + RLS, panneau « Notes partagées »
  dans la liseuse, publication via « Partager » sur une sélection, réponses,
  suppression de ses propres contributions, saut au passage). **À faire avant
  d'ouvrir au public** : outils de signalement / masquage / mise en avant,
  notes éditoriales, et la conformité RGPD (politique de confidentialité,
  consentement, droit à l'effacement). Tant que ces garde-fous ne sont pas en
  place, garder l'accès restreint (par ex. ne pas diffuser largement, ou
  limiter les inscriptions).

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

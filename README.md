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
├── index.html     # le site : accueil (bibliothèque) + atelier du Capital
└── README.md
```

À mesure que d'autres œuvres s'ajouteront, on pourra éclater ce fichier unique
en pages séparées + composants partagés.

---

## Feuille de route

- **Phase 1 — hébergement + annotation « local-first »** *(en cours)*
  Mettre le site en ligne (cette étape), puis construire l'interface de
  surlignage / prise de notes côté navigateur, avec un modèle de données déjà
  pensé pour la synchronisation (chaque annotation = œuvre + chapitre + citation
  ancre + couleur + texte + date + auteur). Sauvegarde locale + export/import.

- **Phase 2 — Supabase**
  Authentification + table de notes privées (protégée par utilisateur, chacun ne
  voit que les siennes). Le schéma SQL et le code client seront ajoutés ici
  (`supabase/schema.sql`). La clé publique « anon » vit dans le front-end ;
  les clés de service restent secrètes (jamais commitées).

- **Phase 3 — notes publiques + modération**
  Table d'annotations publiques lisible par tous, écriture réservée aux comptes,
  outils de signalement / masquage / mise en avant, et notes éditoriales
  intégrées. À cadrer avec une politique de modération et la conformité RGPD
  (politique de confidentialité, consentement, droit à l'effacement).

---

## Répartition des rôles

- **Toi** : créer le dépôt GitHub, le projet Supabase, la connexion Cloudflare
  Pages, et coller tes clés (notamment la clé `anon` publique).
- **Moi** : le front-end et la couche d'annotation, le schéma de base de données
  et le code client Supabase.

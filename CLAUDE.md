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

## Motif « œuvre » = page + dossier

Chaque œuvre du corpus suit exactement le même motif :

```
oeuvres/<id>.html              # page d'atelier (présentation, plan, liseuse, concepts…)
oeuvres/<id>/manifest.json     # métadonnées + découpage
oeuvres/<id>/textes/           # textes locaux servis à la liseuse
```

Les œuvres sont **de même niveau** dans l'arborescence. Aucune n'est « la »
page principale. Actuellement disponibles : `capital-1` et `manuscrits-1844`.

La bibliothèque générale (`oeuvres/index.html`) est pilotée par
`oeuvres/bibliotheque.json` — **source centrale unique** de la liste des
œuvres. Ne pas dupliquer cette liste ailleurs ; passer une œuvre en
`available` seulement quand sa page fonctionne réellement.

## `capital-1.html` = monolithe à ne pas casser

`oeuvres/capital-1.html` héberge encore, en plus de son atelier, la **coquille
partagée du site** : barre supérieure, pastille « compte » Supabase,
annotations, forum, modération, avis RGPD, « Supprimer mes données », et même
la vue d'accueil / bibliothèque interne. C'est un **héritage**, pas un état
idéal — mais tant qu'il n'est pas factorisé, il faut le préserver tel quel.

Règle pratique : si une intervention touche `oeuvres/capital-1.html`,
vérifier que la coquille (auth, forum, modération, RGPD) reste intacte. Pour
l'atelier proprement dit du Capital (panneaux, liseuse, parcours, concepts),
il est de même niveau que les autres ateliers et n'a pas de statut spécial.

## Système visuel partagé (Capital = référence)

Toutes les pages d'atelier partagent **le même langage visuel** :
typographie (Fraunces, Spectral, Bricolage Grotesque, Caveat), palette
(`--paper`, `--ink`, `--red`, `--gold`, `--blue`, etc.), composants
éditoriaux (`tabs`, `panel`, `intro-block`, `reader`, `plan-list`, `btn`,
etc.).

La référence visuelle actuelle est `oeuvres/capital-1.html`. Chaque nouvelle
page d'atelier doit s'aligner sur son `:root`, son `@import` de polices et
ses déclarations partagées. Aujourd'hui ce style est **dupliqué dans chaque
page** : tant qu'il n'est pas factorisé dans une feuille unique, toute
intervention doit garder les pages alignées sur Capital pour éviter la
dérive (Capital ↔ Manuscrits a déjà demandé une homogénéisation manuelle).

## Conventions de travail

- **Une mission par session.** Une demande utilisateur = un objectif clair,
  une branche dédiée nommée d'après l'objectif (`homogene-manuscrits`,
  `docs-parite-oeuvres`, …), un seul commit clair par mission sauf raison
  explicite.
- **Branche depuis `main`, jamais depuis une autre branche de mission.**
  Lorsqu'on enchaîne plusieurs missions, repartir de `main` à chaque fois.
- **Périmètre strict.** Ne pas profiter d'une mission pour refactor le reste
  du dépôt. Si une mission dit « ne modifier que tel fichier », s'y tenir.
- **Vérifier avant de commiter.** Si la mission touche au visuel ou au
  comportement client, ouvrir la page concernée dans un navigateur
  (`python3 -m http.server` à la racine) et tester réellement les chemins
  critiques (onglets, liseuse, fetch local, console sans erreur).
- **Garde-fous permanents** :
  - rester statique (pas de build, pas de dépendances obligatoires) ;
  - ne pas casser la coquille partagée encore portée par `capital-1.html` ;
  - aucune clé secrète dans `config.js` ;
  - ne passer une œuvre en `available` que lorsqu'elle fonctionne pour de
    vrai.

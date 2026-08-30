# Miel & Ruches — boutique en ligne

Site statique de commande de produits d'apiculture (2 fournisseurs), hébergé sur GitHub Pages.
Les données produits viennent d'un Google Sheet, les commandes y sont écrites (un onglet par famille), via un backend Google Apps Script.

## Configuration

- `config.js` : URL du web app Apps Script (`API_URL`). À mettre à jour à chaque nouveau `clasp deploy` côté backend.
- Le lien de paiement HelloAsso est renvoyé par le backend (onglet **Config** du Google Sheet, clé `HELLOASSO_URL`) — rien à changer côté front.

## Développement local

Ouvrir `index.html` directement dans un navigateur, ou servir le dossier avec un petit serveur statique (`python3 -m http.server`).

## Déploiement

Le site est publié via GitHub Pages sur la branche `main` (dossier racine).

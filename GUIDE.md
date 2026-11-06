# BudgetSimple MG — version application installable (PWA)

Contenu du dossier : index.html, app.js, sw.js, manifest.webmanifest, dossier icons/.
Tout doit rester ensemble, à la racine du site (ne pas mettre dans un sous-dossier).

## 1. Mettre en ligne gratuitement (GitHub Pages)
1. Créer un compte sur github.com (gratuit).
2. Bouton « + » → « New repository ». Nom : budgetsimple. Choisir « Public ». Créer.
3. Sur la page du dépôt : « uploading an existing file ». Glisser TOUS les fichiers du dossier,
   y compris le dossier icons (depuis un ordinateur ; sur téléphone, passer Chrome en « Version pour ordinateur »).
   Puis « Commit changes ».
4. Settings → Pages → « Deploy from a branch » → branche main, dossier « / (root) » → Save.
5. Après 1 à 2 minutes, l'adresse est : https://VOTRE-NOM.github.io/budgetsimple/

Alternative encore plus rapide : app.netlify.com/drop — on glisse le dossier et on obtient une adresse.

## 2. Installer sur le téléphone
1. Ouvrir l'adresse dans Chrome (avec Internet, une seule fois).
2. Menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
3. L'icône apparaît ; l'appli s'ouvre ensuite en plein écran, même sans connexion.

## 3. Bon à savoir
- Les données sont dans le téléphone uniquement. Réglages → « Sauvegarder (fichier) » régulièrement.
- Reprendre les données de la version PC/Termux : l'exporter en CSV là-bas, puis Réglages → « Importer un CSV ».
  (Les postes « personnalisés » sont alors répartis à égalité sur 12 mois.)
- Mise à jour du code : remplacer les fichiers sur GitHub et changer le numéro de version
  dans sw.js (ex. budgetsimple-v1 → budgetsimple-v2), sinon le téléphone garde l'ancienne version.

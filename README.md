# budgetsimple
Gestionnaire de Budget Simple
BudgetSimple MG

Une application de budget simple, gratuite et hors connexion, pensée pour le téléphone. Saisissez vos revenus et vos dépenses avec leur fréquence : l'application calcule la moyenne par mois, le solde, le taux d'épargne et vous montre où va votre argent.

👉 Utiliser l'application : https://VOTRE-NOM.github.io/budgetsimple/

Aucun compte, aucune donnée bancaire, aucun serveur : tout reste dans votre téléphone.

Fonctionnalités
Résultats : solde mensuel moyen, taux d'épargne, tableau mois par mois, répartition des dépenses par catégorie, alerte sur les mois en déficit.
Revenus et dépenses : fréquences ponctuelle, hebdomadaire, bimensuelle, mensuelle, trimestrielle, semestrielle, annuelle, ou personnalisée mois par mois. Dépenses marquées essentielles ou non.
Analyse : d'où vient l'argent et où il va, par catégorie, avec détail, top 5, graphique mensuel et conseils.
Plusieurs budgets (Famille, Voyage…), chacun avec sa devise : Ar (MGA), €, $.
Recherche, tri, duplication des postes.
Sauvegarde et restauration en fichier, export / import CSV (ouvrable dans Excel).
Mode sombre automatique.
Installable sur l'écran d'accueil et utilisable sans connexion (PWA).
Installer sur Android
Ouvrez le lien ci-dessus dans Chrome (avec Internet, une seule fois).
Menu ⋮ → Installer l'application (ou « Ajouter à l'écran d'accueil »).
Ouvrez l'icône : l'application fonctionne ensuite sans connexion.

Elle s'installe de la même façon sur un ordinateur (Chrome ou Edge).

Vos données
Les données sont enregistrées uniquement dans le navigateur de votre appareil. Elles ne sont envoyées nulle part.
⚠️ Si vous effacez les données de Chrome ou désinstallez l'application, elles sont perdues : pensez à faire une sauvegarde (Réglages → Sauvegarder) de temps en temps.
Il n'y a pas de synchronisation entre appareils : chaque appareil a ses propres données (utilisez la sauvegarde pour les transférer).
Contenu du dépôt
Fichier	Rôle
index.html	Page et styles
app.js	Toute la logique de l'application (calculs, écrans, stockage)
sw.js	Service worker : fonctionnement hors connexion
manifest.webmanifest	Informations d'installation (nom, icônes, couleurs)
icons/	Icônes de l'application

Aucune dépendance, aucune étape de compilation : du HTML, du CSS et du JavaScript simples.

Tester en local
bash
python -m http.server 8000

Puis ouvrez http://localhost:8000. Le service worker ne fonctionne que sur localhost ou en HTTPS, pas en ouvrant le fichier directement.

Mettre à jour

Après toute modification des fichiers, changez le numéro de version dans sw.js (budgetsimple-v1 → budgetsimple-v2), sinon les téléphones déjà installés gardent l'ancienne version en mémoire.

Historique

L'application est née en version web Python (Flask + MySQL), puis a été réécrite en JavaScript pour tourner entièrement sur le téléphone.

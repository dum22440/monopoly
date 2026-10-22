# 🎲 Monopoly de la promo — Guide

## Ce que contient ce dossier

| Fichier | À quoi il sert | Tu dois y toucher ? |
|---|---|---|
| `personnalisation.js` | Noms des cases (19 propriétés), gares, cartes Chance / BDE… | ✅ **OUI, c'est ton fichier** |
| `server.js` | Le serveur (connexions, parties, chat) | ❌ non |
| `game.js` | Toutes les règles du Monopoly | ❌ non |
| `public/` | La page web (affichage, animations) | ❌ non |
| `test/robots.js` | Des robots qui jouent pour vérifier les règles | ❌ non |
| `package.json` | La liste des outils dont le jeu a besoin | ❌ non |

---

## ✏️ Modifier les noms et les cartes

1. Ouvre `personnalisation.js` avec le **Bloc-notes** (clic droit → *Ouvrir avec* → *Bloc-notes*).
   Encore mieux : installe [Visual Studio Code](https://code.visualstudio.com/) (gratuit), qui colore le texte et montre les erreurs.
2. Change uniquement le texte **entre les guillemets** `"..."`.
3. Garde les **virgules** en fin de ligne.
4. Pour ajouter une carte, copie une ligne de carte existante, colle-la juste en dessous, puis change son texte.
5. Enregistre (Ctrl + S).

Si tu fais une erreur, le serveur refuse de démarrer et affiche en français ce qu'il faut corriger.

---

## 💻 Essayer le jeu sur ton ordinateur (Windows)

**À faire une seule fois :**
1. Va sur https://nodejs.org et télécharge la version **LTS** (le gros bouton vert).
2. Lance l'installateur, puis clique sur *Suivant* jusqu'au bout (garde les options par défaut).

**Pour lancer le jeu :**
1. Ouvre le dossier `monopoly` dans l'Explorateur de fichiers.
2. Clique dans la **barre d'adresse** en haut (là où il y a `C:\Users\louis\...`), tape `cmd`, puis appuie sur **Entrée**.
   Une fenêtre noire s'ouvre, déjà placée dans le bon dossier.
3. La **première fois seulement**, tape `npm install` puis Entrée, et attends que ça se termine (environ 30 secondes).
4. Tape `npm start` puis Entrée. Tu dois voir : `🎲 Monopoly de la promo est lancé !`
5. Ouvre **http://localhost:3000** dans Chrome / Edge / Firefox.

**Pour simuler plusieurs joueurs :** ouvre plusieurs onglets à la même adresse.
Le 1er onglet crée la partie, et les autres collent le lien de la partie (bouton *Copier le lien*).
Astuce : une fenêtre de navigation privée (Ctrl + Maj + N) compte aussi comme un autre joueur.

**Pour arrêter le serveur :** clique dans la fenêtre noire et fais **Ctrl + C**.
Après avoir modifié `personnalisation.js`, arrête puis relance avec `npm start`.

> ⚠️ Le lien `localhost` ne marche que sur TON ordinateur. Pour jouer avec tes amis, il faut mettre le jeu en ligne (ci-dessous).

---

## 🌍 Mettre le jeu en ligne (gratuit)

On utilise deux services gratuits :
- **GitHub** : un « casier » en ligne qui stocke les fichiers du jeu ;
- **Render** : un ordinateur allumé sur Internet qui fait tourner le jeu.

### Étape 1 — Mettre les fichiers sur GitHub
1. Crée un compte sur https://github.com (bouton *Sign up*).
2. Une fois connecté, clique sur le **+** en haut à droite, puis sur **New repository**.
3. Nom : `monopoly`. Laisse **Public** coché. Clique sur **Create repository**.
4. Sur la page qui s'affiche, clique sur le lien **uploading an existing file**.
5. Ouvre ton dossier `monopoly` et **sélectionne tout SAUF le dossier `node_modules`** (s'il existe).
   Glisse-dépose la sélection dans la page GitHub. Vérifie que les dossiers `public` et `test` apparaissent bien.
6. En bas, clique sur **Commit changes**.

### Étape 2 — Lancer le jeu sur Render
1. Va sur https://render.com, clique sur **Get Started**, puis choisis **GitHub** pour te connecter avec le compte que tu viens de créer.
2. Dans le tableau de bord, clique sur **+ New**, puis sur **Web Service**.
3. Choisis ton dépôt `monopoly`. Si Render le demande, autorise-le à accéder à tes dépôts GitHub.
4. Remplis :
   - **Language / Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : **Free**
5. Clique sur **Deploy Web Service** et attends 2 à 3 minutes (le message *Live* doit apparaître en vert).
6. Ton adresse est affichée en haut, par exemple `https://monopoly-xxxx.onrender.com`. 🎉

### Jouer avec tes amis
Ouvre ton adresse Render, crée une partie, clique sur **📋 Copier le lien** et envoie le lien sur WhatsApp, Snap, Discord…
Tes amis cliquent dessus, tapent leur pseudo, et c'est parti !

### Bon à savoir sur la version gratuite
- Après **15 minutes sans aucun joueur**, Render met le serveur en veille. La visite suivante le réveille, mais ça prend environ **1 minute**. C'est normal, il suffit d'attendre.
- Quand le serveur s'endort ou redémarre, **les parties en cours sont effacées**. Tant que vous jouez, il reste éveillé.

### Modifier les noms une fois en ligne
Sur GitHub, ouvre `personnalisation.js`, clique sur le **crayon ✏️**, fais tes changements, puis clique sur **Commit changes**.
Render redémarre tout seul avec les nouveaux noms en 2 à 3 minutes.

---

## 🎮 Règles intégrées
- **De 2 à 8 joueurs** chacun pour soi, ou **de 4 à 16 joueurs en équipes de 2** tirées au sort (le créateur de la partie coche la case dans le salon d'attente). En équipe, on partage le pion, l'argent et les terrains, et chaque coéquipier peut jouer depuis son téléphone.
- **Un tour = on lance les dés, on achète (ou pas), et le tour passe tout seul au joueur suivant.**
- Pour construire, ouvre **🏠 Mes terrains** au début de ton tour, avant de lancer les dés : **une seule construction par tour**, et il faut posséder toute la couleur.
- Prix et loyers du vrai Monopoly (loyers doublés quand on a toute la couleur). Option loyers plus doux dans `personnalisation.js` (`coefficientsLoyers`).
- Gares, compagnies, prison (3 essais pour faire un double, sortie à 50, carte de libération), double = rejouer, 3 doubles = prison.
- 💥 **Cases MALCHANCE invisibles** : quelques cases piégées au hasard (elles changent de place après chaque piège). Punition tirée au sort : donner un bien, le revendre, donner de l'argent ou en perdre. Blagues et réglages dans `personnalisation.js`, partie `malchance`.
- Hypothèques (+10 % pour lever), dettes et faillite, échanges entre joueurs (bouton 🤝).
- Options dans `personnalisation.js` : enchères quand on refuse d'acheter (`encheres`), cagnotte du parc gratuit (`cagnotteParcGratuit`).

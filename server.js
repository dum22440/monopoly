// =====================================================================
//  Serveur : il distribue la page web et relaie les actions des joueurs
//  en temps réel grâce à Socket.io.
//  Lancer avec :  npm start   puis ouvrir http://localhost:3000
// =====================================================================

const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Partie, verifierConfig } = require('./game');

// ---------------------------------------------------------------------
//  Chargement du fichier de personnalisation (avec des erreurs lisibles)
// ---------------------------------------------------------------------
let config;
try {
  config = require('./personnalisation.js');
} catch (e) {
  console.error('\n❌ Le fichier personnalisation.js contient une erreur d\'écriture :\n');
  console.error(e.stack.split('\n').slice(0, 5).join('\n'));
  console.error('\n👉 Astuce : vérifie les guillemets " et les virgules autour de la ligne indiquée.\n');
  process.exit(1);
}
const erreurs = verifierConfig(config);
if (erreurs.length) {
  console.error('\n❌ Problème(s) dans personnalisation.js :\n');
  for (const e of erreurs) console.error('  • ' + e);
  console.error('');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });
app.use(express.static(path.join(__dirname, 'public')));

// Toutes les parties en cours, rangées par code (ex : "KQ7TZ")
const parties = new Map();

function nouveauCode() {
  const lettres = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I pour éviter les confusions
  let code;
  do {
    code = Array.from({ length: 5 }, () => lettres[crypto.randomInt(lettres.length)]).join('');
  } while (parties.has(code));
  return code;
}

// ---------------------------------------------------------------------
//  Sauvegarde des parties
//  Le serveur gratuit s'endort ou redémarre parfois, et les parties en mémoire
//  disparaissent. Pour les retrouver, chaque joueur garde dans son navigateur une
//  copie CHIFFRÉE de la partie : personne ne peut la lire ni la modifier (pas de
//  triche possible), et le premier joueur qui revient la renvoie au serveur.
// ---------------------------------------------------------------------
function secretSauvegarde() {
  if (process.env.SECRET_SAUVEGARDE) return process.env.SECRET_SAUVEGARDE; // sur Render (réglage automatique)
  const fichier = path.join(__dirname, '.secret-sauvegarde');                // sur ton ordinateur
  try { return fs.readFileSync(fichier, 'utf8').trim(); } catch (e) {
    const s = crypto.randomBytes(32).toString('hex');
    try { fs.writeFileSync(fichier, s); } catch (e2) { /* pas grave : sauvegardes valables jusqu'au redémarrage */ }
    return s;
  }
}
const CLE = crypto.createHash('sha256').update(secretSauvegarde()).digest();

function chiffrer(donnees) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', CLE, iv);
  const corps = Buffer.concat([c.update(zlib.deflateSync(JSON.stringify(donnees))), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), corps]).toString('base64');
}
function dechiffrer(texte) {
  const b = Buffer.from(String(texte), 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', CLE, b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return JSON.parse(zlib.inflateSync(Buffer.concat([d.update(b.subarray(28)), d.final()])));
}

// Envoie la sauvegarde aux joueurs, au plus une fois toutes les 2 secondes
function envoyerSauvegarde(partie) {
  if (partie.phase !== 'jeu' || partie.attenteSauvegarde) return;
  partie.attenteSauvegarde = setTimeout(() => {
    partie.attenteSauvegarde = null;
    if (parties.get(partie.code) !== partie) return;
    io.to(partie.code).emit('sauvegarde', { code: partie.code, donnees: chiffrer(partie.sauvegarde()), t: Date.now() });
  }, 2000);
}

// Envoie l'état à jour de la partie à tous ses joueurs (et relance le chrono)
function diffuser(partie) {
  partie.planifier();
  io.to(partie.code).emit('etat', partie.etatPublic());
  envoyerSauvegarde(partie);
}

// Associe une connexion (un onglet) à un joueur
function attacher(socket, partie, joueur) {
  // Si ce joueur était déjà connecté dans un autre onglet, on ferme l'ancien
  for (const [, s] of io.of('/').sockets) {
    if (s !== socket && s.data.joueurId === joueur.id && s.data.code === partie.code) {
      s.emit('erreur', 'Tu as ouvert la partie dans un autre onglet.');
      s.data.joueurId = null;
      s.leave(partie.code);
      s.disconnect(true);
    }
  }
  socket.data.code = partie.code;
  socket.data.joueurId = joueur.id;
  socket.join(partie.code);
  partie.setConnecte(joueur.id, true);
  socket.emit('bienvenue', { code: partie.code, joueurId: joueur.id, jeton: joueur.jeton, nom: joueur.nom, chat: partie.chat });
  diffuser(partie);
}

io.on('connection', (socket) => {
  const repondre = (cb, data) => typeof cb === 'function' && cb(data);

  // Créer une nouvelle partie
  socket.on('creer', ({ nom, pion } = {}, cb) => {
    try {
      const code = nouveauCode();
      const partie = new Partie(code, config, () => diffuser(partie));
      const joueur = partie.ajouterJoueur(nom, pion);
      parties.set(code, partie);
      attacher(socket, partie, joueur);
      console.log(`Nouvelle partie ${code} créée par ${joueur.nom}`);
      repondre(cb, { ok: true });
    } catch (e) {
      repondre(cb, { erreur: e.message });
    }
  });

  // Rejoindre une partie existante (ou y revenir avec son jeton secret)
  socket.on('rejoindre', ({ code, nom, pion, jeton } = {}, cb) => {
    try {
      const partie = parties.get(String(code || '').toUpperCase().trim());
      if (!partie) return repondre(cb, { erreur: "Cette partie n'existe pas (ou plus). Vérifie le code !", inconnue: true });
      let joueur = jeton && partie.humains.find((p) => p.jeton === jeton);
      if (joueur) {
        partie.log(`🔌 ${joueur.nom} est de retour !`);
      } else {
        // Jeton inconnu : dans le salon, on réinscrit simplement le joueur avec son pseudo
        if (jeton && (!nom || partie.phase !== 'salon')) throw new Error('Ta place dans cette partie a expiré.');
        joueur = partie.ajouterJoueur(nom, pion);
      }
      attacher(socket, partie, joueur);
      repondre(cb, { ok: true });
    } catch (e) {
      repondre(cb, { erreur: e.message });
    }
  });

  // Un joueur renvoie la sauvegarde d'une partie que le serveur a oubliée (redémarrage)
  socket.on('restaurer', ({ donnees } = {}, cb) => {
    try {
      if (typeof donnees !== 'string' || donnees.length > 3_000_000) throw new Error('Sauvegarde invalide.');
      const d = dechiffrer(donnees);
      if (!parties.has(d.code)) {
        const partie = Partie.restaurer(d, config, () => diffuser(partie));
        parties.set(d.code, partie);
        console.log(`Partie ${d.code} restaurée depuis une sauvegarde`);
      }
      repondre(cb, { ok: true });
    } catch (e) {
      repondre(cb, { erreur: 'Impossible de restaurer cette partie (' + e.message + ').' });
    }
  });

  // Toutes les actions de jeu passent par ici
  socket.on('action', (a = {}, cb) => {
    const partie = parties.get(socket.data.code);
    if (!partie || !socket.data.joueurId) return repondre(cb, { erreur: 'Tu n\'es dans aucune partie.' });
    try {
      partie.action(socket.data.joueurId, a);
      repondre(cb, { ok: true });
    } catch (e) {
      repondre(cb, { erreur: e.message });
    }
    diffuser(partie);
  });

  socket.on('chat', (texte) => {
    const partie = parties.get(socket.data.code);
    if (!partie || !socket.data.joueurId) return;
    const m = partie.message(socket.data.joueurId, texte);
    if (m) io.to(partie.code).emit('chat', m);
  });

  socket.on('disconnect', () => {
    const partie = parties.get(socket.data.code);
    if (!partie || !socket.data.joueurId) return;
    const joueur = partie.humain(socket.data.joueurId);
    if (!joueur) return;
    // Salon d'attente : le joueur disparaît tout de suite de la liste
    if (partie.phase === 'salon') {
      partie.retirerDuSalon(joueur.id);
      if (!partie.humains.length) parties.delete(partie.code);
      else diffuser(partie);
      return;
    }
    partie.setConnecte(joueur.id, false);
    partie.log(`📴 ${joueur.nom} a perdu la connexion (retour possible avec le même lien).`);
    // Dans le salon, si l'hôte part, un autre joueur connecté devient hôte
    if (partie.phase === 'salon' && partie.hoteId === joueur.id) {
      const autre = partie.humains.find((p) => p.connecte);
      if (autre) partie.hoteId = autre.id;
    }
    // Pendant le jeu aussi, l'hôte (qui peut exclure les absents) doit être présent
    if (partie.phase !== 'salon' && partie.hoteId === joueur.id) {
      const autre = partie.humains.find((h) => h.connecte && !partie.entite(h.id).faillite);
      if (autre) partie.hoteId = autre.id;
    }
    // Un joueur absent ne bloque pas une enchère
    const pion = partie.entite(joueur.id);
    if (partie.enchere && pion && !pion.connecte) partie.abandonEnchere(pion);
    diffuser(partie);
  });
});

// Ménage : on supprime les parties abandonnées depuis plus de 6 heures
setInterval(() => {
  const limite = Date.now() - 6 * 3600 * 1000;
  for (const [code, p] of parties) {
    const quelquUn = p.humains.some((j) => j.connecte);
    if (!quelquUn && p.derniereActivite < limite) {
      if (p.enchere) clearTimeout(p.enchere.timer);
      if (p.chrono) clearTimeout(p.chrono.timer);
      parties.delete(code);
    }
  }
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎲 ${config.nomDuJeu} est lancé !`);
  console.log(`👉 Ouvre http://localhost:${PORT} dans ton navigateur\n`);
});

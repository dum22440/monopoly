// =====================================================================
//  Moteur du jeu : toutes les règles du Monopoly.
//  Ce fichier tourne sur le SERVEUR uniquement : les navigateurs des
//  joueurs ne font qu'envoyer des demandes ("je lance les dés", "j'achète"…)
//  et le serveur vérifie qu'elles sont autorisées. Impossible de tricher.
// =====================================================================

const crypto = require('crypto');

// ---------------------------------------------------------------------
//  Plateau officiel (prix et loyers classiques)
// ---------------------------------------------------------------------
const GROUPES = {
  marron:    { couleur: '#8B4513', maison: 50 },
  bleuClair: { couleur: '#7fd8ff', maison: 50 },
  rose:      { couleur: '#ff4fb8', maison: 100 },
  orange:    { couleur: '#ff9500', maison: 100 },
  rouge:     { couleur: '#ff2d2d', maison: 150 },
  jaune:     { couleur: '#ffe100', maison: 150 },
  vert:      { couleur: '#18c95b', maison: 200 },
  bleuFonce: { couleur: '#2f4bff', maison: 200 },
};

// [type, groupe/infos, prix, loyers (terrain nu, 1, 2, 3, 4 maisons, hôtel)]
const PLAN = [
  ['depart'],
  ['prop', 'marron', 60, [2, 10, 30, 90, 160, 250]],
  ['caisse'],
  ['prop', 'marron', 60, [4, 20, 60, 180, 320, 450]],
  ['impot'],
  ['gare'],
  ['prop', 'bleuClair', 100, [6, 30, 90, 270, 400, 550]],
  ['chance'],
  ['prop', 'bleuClair', 100, [6, 30, 90, 270, 400, 550]],
  ['prop', 'bleuClair', 120, [8, 40, 100, 300, 450, 600]],
  ['prison'],
  ['prop', 'rose', 140, [10, 50, 150, 450, 625, 750]],
  ['compagnie'],
  ['prop', 'rose', 140, [10, 50, 150, 450, 625, 750]],
  ['prop', 'rose', 160, [12, 60, 180, 500, 700, 900]],
  ['gare'],
  ['prop', 'orange', 180, [14, 70, 200, 550, 750, 950]],
  ['caisse'],
  ['prop', 'orange', 180, [14, 70, 200, 550, 750, 950]],
  ['prop', 'orange', 200, [16, 80, 220, 600, 800, 1000]],
  ['parc'],
  ['prop', 'rouge', 220, [18, 90, 250, 700, 875, 1050]],
  ['chance'],
  ['prop', 'rouge', 220, [18, 90, 250, 700, 875, 1050]],
  ['prop', 'rouge', 240, [20, 100, 300, 750, 925, 1100]],
  ['gare'],
  ['prop', 'jaune', 260, [22, 110, 330, 800, 975, 1150]],
  ['prop', 'jaune', 260, [22, 110, 330, 800, 975, 1150]],
  ['compagnie'],
  ['prop', 'jaune', 280, [24, 120, 360, 850, 1025, 1200]],
  ['allerPrison'],
  ['prop', 'vert', 300, [26, 130, 390, 900, 1100, 1275]],
  ['prop', 'vert', 300, [26, 130, 390, 900, 1100, 1275]],
  ['caisse'],
  ['prop', 'vert', 320, [28, 150, 450, 1000, 1200, 1400]],
  ['gare'],
  ['chance'],
  ['prop', 'bleuFonce', 350, [35, 175, 500, 1100, 1300, 1500]],
  ['taxe'],
  ['prop', 'bleuFonce', 400, [50, 200, 600, 1400, 1700, 2000]],
];

const PRISON = 10;
const AMENDE_PRISON = 50;
const LOYERS_GARE = [0, 25, 50, 100, 200];
const MAISONS_DISPO = 32;
const HOTELS_DISPO = 12;
const DUREE_ENCHERE = 12000; // ms sans nouvelle offre avant adjudication

const PIONS = ['🚗', '🎩', '🐶', '🚀', '🦄', '🍕', '👟', '🐱', '⚽', '🎸', '👑', '🦖'];
const COULEURS = ['#ff3b6b', '#2ec5ff', '#ffd23f', '#3bff8f', '#b36bff', '#ff8a3b'];

// ---------------------------------------------------------------------
//  Construction du plateau à partir du fichier de personnalisation
// ---------------------------------------------------------------------
function construirePlateau(cfg) {
  const noms = {};
  for (const g of Object.keys(GROUPES)) noms[g] = [...cfg.proprietes[g]];
  const gares = [...cfg.gares];
  const comp = [...cfg.compagnies];
  const cs = cfg.casesSpeciales;
  return PLAN.map(([type, groupe, prix, loyers], i) => {
    const c = { i, type };
    switch (type) {
      case 'prop':
        Object.assign(c, { nom: noms[groupe].shift(), groupe, couleur: GROUPES[groupe].couleur,
          prix, loyers, prixMaison: GROUPES[groupe].maison });
        break;
      case 'gare': Object.assign(c, { nom: gares.shift(), prix: 200 }); break;
      case 'compagnie': Object.assign(c, { nom: comp.shift(), prix: 150 }); break;
      case 'depart': c.nom = cs.depart; break;
      case 'prison': c.nom = cs.prison; break;
      case 'parc': c.nom = cs.parcGratuit; break;
      case 'allerPrison': c.nom = cs.allerPrison; break;
      case 'impot': Object.assign(c, { nom: cs.impot.nom, montant: cs.impot.montant }); break;
      case 'taxe': Object.assign(c, { nom: cs.taxe.nom, montant: cs.taxe.montant }); break;
      case 'chance': c.nom = 'Chance'; break;
      case 'caisse': c.nom = 'Caisse de communauté'; break;
    }
    return c;
  });
}

// Vérifie le fichier de personnalisation et renvoie la liste des erreurs (en français)
function verifierConfig(cfg) {
  const err = [];
  const attendu = { marron: 2, bleuClair: 3, rose: 3, orange: 3, rouge: 3, jaune: 3, vert: 3, bleuFonce: 2 };
  if (!cfg.proprietes) err.push('Il manque la partie "proprietes".');
  else for (const [g, n] of Object.entries(attendu)) {
    const l = cfg.proprietes[g];
    if (!Array.isArray(l)) err.push(`Il manque la couleur "${g}" dans "proprietes".`);
    else if (l.length !== n) err.push(`La couleur "${g}" doit avoir ${n} noms (il y en a ${l.length}).`);
  }
  if (!Array.isArray(cfg.gares) || cfg.gares.length !== 4) err.push('Il faut exactement 4 noms dans "gares".');
  if (!Array.isArray(cfg.compagnies) || cfg.compagnies.length !== 2) err.push('Il faut exactement 2 noms dans "compagnies".');
  const cs = cfg.casesSpeciales || {};
  for (const k of ['depart', 'prison', 'parcGratuit', 'allerPrison']) if (typeof cs[k] !== 'string') err.push(`Il manque "${k}" dans "casesSpeciales".`);
  for (const k of ['impot', 'taxe']) if (!cs[k] || typeof cs[k].nom !== 'string' || typeof cs[k].montant !== 'number') err.push(`"${k}" dans "casesSpeciales" doit avoir un nom et un montant.`);
  for (const k of ['argentDeDepart', 'salaireCaseDepart']) if (typeof cfg[k] !== 'number') err.push(`"${k}" doit être un nombre.`);
  const effets = {
    argent: ['montant'], aller: ['case'], avancer: ['cases'], reculer: ['cases'], prison: [], liberation: [],
    chaqueJoueur: ['montant'], reparations: ['parMaison', 'parHotel'], gareProche: [], compagnieProche: [],
  };
  for (const paquet of ['chance', 'caisse']) {
    const l = cfg[paquet];
    if (!Array.isArray(l) || l.length === 0) { err.push(`Le paquet "${paquet}" doit contenir au moins une carte.`); continue; }
    l.forEach((c, n) => {
      const ou = `Carte n°${n + 1} du paquet "${paquet}"`;
      if (!c || typeof c.texte !== 'string') return err.push(`${ou} : il manque le "texte".`);
      if (!effets[c.effet]) return err.push(`${ou} : l'effet "${c.effet}" n'existe pas. Effets possibles : ${Object.keys(effets).join(', ')}.`);
      for (const champ of effets[c.effet]) if (typeof c[champ] !== 'number') err.push(`${ou} : il faut un nombre pour "${champ}".`);
      if (c.effet === 'aller' && (c.case < 0 || c.case > 39)) err.push(`${ou} : "case" doit être entre 0 et 39.`);
    });
  }
  return err;
}

const melanger = (t) => {
  for (let i = t.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
};
const de = () => crypto.randomInt(1, 7);

// =====================================================================
//  Une partie
// =====================================================================
class Partie {
  constructor(code, cfg, onChange) {
    this.code = code;
    this.cfg = cfg;
    this.plateau = construirePlateau(cfg);
    this.onChange = onChange;        // appelé après chaque modification pour prévenir les joueurs
    this.phase = 'salon';            // salon -> jeu -> fin
    this.joueurs = [];
    this.hoteId = null;
    this.proprietes = {};            // index de case -> { proprio, maisons (5 = hôtel), hypotheque }
    for (const c of this.plateau) if (c.prix) this.proprietes[c.i] = { proprio: null, maisons: 0, hypotheque: false };
    this.paquets = {
      chance: melanger(cfg.chance.map((c, k) => ({ ...c, id: 'chance' + k, paquet: 'chance' }))),
      caisse: melanger(cfg.caisse.map((c, k) => ({ ...c, id: 'caisse' + k, paquet: 'caisse' }))),
    };
    this.tour = null;                // { joueurId, etape, doubles, des, peutRelancer }
    this.enchere = null;
    this.echanges = [];
    this.journal = [];
    this.chat = [];
    this.derniereCarte = null;
    this.desSeq = 0;
    this.cagnotte = 0;
    this.maisonsDispo = MAISONS_DISPO;
    this.hotelsDispo = HOTELS_DISPO;
    this.gagnant = null;
    this.derniereActivite = Date.now();
  }

  // ------------------------------------------------------------- outils
  j(id) { return this.joueurs.find((p) => p.id === id); }
  actifs() { return this.joueurs.filter((p) => !p.faillite); }
  courant() { return this.tour && this.j(this.tour.joueurId); }
  argent(n) { return n + ' ' + this.cfg.monnaie; }
  log(txt) {
    this.journal.push({ t: Date.now(), txt });
    if (this.journal.length > 80) this.journal.shift();
  }
  nomCase(i) { return this.plateau[i].nom; }

  // ------------------------------------------------------------- salon
  ajouterJoueur(nom, pion) {
    if (this.phase !== 'salon') throw new Error('La partie a déjà commencé.');
    if (this.joueurs.length >= 6) throw new Error('La partie est pleine (6 joueurs max).');
    nom = String(nom || '').trim().slice(0, 16);
    if (!nom) throw new Error('Choisis un pseudo.');
    if (this.joueurs.some((p) => p.nom.toLowerCase() === nom.toLowerCase())) throw new Error('Ce pseudo est déjà pris.');
    const pris = this.joueurs.map((p) => p.pion);
    if (!PIONS.includes(pion) || pris.includes(pion)) pion = PIONS.find((x) => !pris.includes(x));
    const couleur = COULEURS.find((c) => !this.joueurs.some((p) => p.couleur === c));
    const p = {
      id: crypto.randomBytes(6).toString('hex'),
      jeton: crypto.randomBytes(18).toString('hex'), // secret pour se reconnecter
      nom, pion, couleur,
      argent: this.cfg.argentDeDepart,
      position: 0, enPrison: false, toursPrison: 0, cartesLiberation: [],
      faillite: false, connecte: true, dette: null,
    };
    this.joueurs.push(p);
    if (!this.hoteId) this.hoteId = p.id;
    this.log(`${p.pion} ${p.nom} rejoint la partie.`);
    return p;
  }

  changerPion(id, pion) {
    if (this.phase !== 'salon') return;
    if (!PIONS.includes(pion) || this.joueurs.some((p) => p.pion === pion)) throw new Error('Ce pion est déjà pris.');
    this.j(id).pion = pion;
  }

  demarrer(id) {
    if (id !== this.hoteId) throw new Error("Seul l'hôte peut lancer la partie.");
    if (this.phase !== 'salon') return;
    if (this.joueurs.length < 2) throw new Error('Il faut au moins 2 joueurs.');
    melanger(this.joueurs);
    this.phase = 'jeu';
    this.log('🎉 La partie commence ! Ordre de jeu : ' + this.joueurs.map((p) => p.pion + ' ' + p.nom).join(', '));
    this.nouveauTour(this.joueurs[0]);
  }

  nouveauTour(p) {
    this.tour = { joueurId: p.id, etape: 'lancer', doubles: 0, des: null };
    this.derniereCarte = null;
  }

  // ------------------------------------------------------------- actions des joueurs
  // Point d'entrée unique : chaque action est vérifiée ici avant d'être appliquée.
  action(id, a) {
    const p = this.j(id);
    if (!p) throw new Error('Joueur inconnu.');
    this.derniereActivite = Date.now();
    if (a.type === 'pion') return this.changerPion(id, a.pion);
    if (a.type === 'demarrer') return this.demarrer(id);
    if (this.phase !== 'jeu') throw new Error("La partie n'est pas en cours.");
    if (p.faillite) throw new Error('Tu as fait faillite, tu ne peux plus jouer.');
    switch (a.type) {
      case 'lancer': return this.lancer(p);
      case 'acheter': return this.acheter(p);
      case 'refuser': return this.refuserAchat(p);
      case 'finTour': return this.finTour(p);
      case 'payerPrison': return this.payerPrison(p);
      case 'carteLiberation': return this.utiliserCarteLiberation(p);
      case 'construire': return this.construire(p, +a.case);
      case 'vendreMaison': return this.vendreMaison(p, +a.case);
      case 'hypothequer': return this.hypothequer(p, +a.case);
      case 'leverHypotheque': return this.leverHypotheque(p, +a.case);
      case 'encherir': return this.encherir(p, +a.montant);
      case 'abandonEnchere': return this.abandonEnchere(p);
      case 'payerDette': return this.payerDette(p);
      case 'faillite': return this.declarerFaillite(p);
      case 'proposerEchange': return this.proposerEchange(p, a);
      case 'repondreEchange': return this.repondreEchange(p, a.echangeId, !!a.accepte);
      case 'annulerEchange': return this.annulerEchange(p, a.echangeId);
      case 'exclure': return this.exclure(p, a.joueurId);
      default: throw new Error('Action inconnue.');
    }
  }

  monTour(p) {
    if (!this.tour || this.tour.joueurId !== p.id) throw new Error("Ce n'est pas ton tour.");
  }
  // Tant qu'une enchère ou une dette est en cours, le jeu est en pause.
  bloque() {
    if (this.enchere) throw new Error('Une enchère est en cours.');
    if (this.joueurs.some((x) => x.dette)) throw new Error('Un joueur doit d\'abord régler une dette.');
  }

  // ------------------------------------------------------------- dés et déplacement
  lancer(p) {
    this.monTour(p);
    this.bloque();
    if (this.tour.etape !== 'lancer') throw new Error('Tu ne peux pas lancer les dés maintenant.');
    const d1 = de(), d2 = de();
    const double = d1 === d2;
    this.tour.des = [d1, d2];
    this.desSeq++;
    this.derniereCarte = null;
    this.log(`${p.pion} ${p.nom} lance les dés : ${d1} + ${d2} = ${d1 + d2}${double ? ' (double !)' : ''}`);

    if (p.enPrison) {
      if (double) {
        p.enPrison = false; p.toursPrison = 0;
        this.log(`🔓 Double ! ${p.nom} sort de ${this.nomCase(PRISON)}.`);
        this.tour.etape = 'fin'; // pas de relance après une sortie de prison
        this.deplacer(p, d1 + d2);
        return;
      }
      p.toursPrison++;
      if (p.toursPrison < 3) {
        this.log(`${p.nom} reste en ${this.nomCase(PRISON)} (essai ${p.toursPrison}/3).`);
        this.tour.etape = 'fin';
        return;
      }
      // 3e échec : doit payer l'amende puis avancer
      this.log(`${p.nom} a raté 3 fois : amende de ${this.argent(AMENDE_PRISON)} et sortie obligatoire.`);
      p.enPrison = false; p.toursPrison = 0;
      this.tour.etape = 'fin';
      this.payer(p, null, AMENDE_PRISON, 'amende');
      this.deplacer(p, d1 + d2);
      return;
    }

    if (double) {
      this.tour.doubles++;
      if (this.tour.doubles === 3) {
        this.log(`🚨 3 doubles de suite ! ${p.nom} va directement en ${this.nomCase(PRISON)}.`);
        this.envoyerPrison(p);
        return;
      }
    }
    this.tour.etape = double ? 'lancer' : 'fin';
    this.deplacer(p, d1 + d2);
  }

  deplacer(p, n) {
    const avant = p.position;
    p.position = (p.position + n + 40) % 40;
    if (n > 0 && p.position < avant) this.salaire(p);
    this.arriverSur(p);
  }

  allerA(p, cible, salaireSiPassage = true) {
    if (salaireSiPassage && cible < p.position) this.salaire(p);
    p.position = cible;
    this.arriverSur(p);
  }

  salaire(p) {
    p.argent += this.cfg.salaireCaseDepart;
    this.log(`💵 ${p.nom} passe par ${this.nomCase(0)} et reçoit ${this.argent(this.cfg.salaireCaseDepart)}.`);
  }

  envoyerPrison(p) {
    p.position = PRISON;
    p.enPrison = true;
    p.toursPrison = 0;
    if (this.tour && this.tour.joueurId === p.id) this.tour.etape = 'fin';
  }

  // Que se passe-t-il quand on s'arrête sur une case ?
  arriverSur(p, mod = null) {
    const c = this.plateau[p.position];
    switch (c.type) {
      case 'prop': case 'gare': case 'compagnie': {
        const pr = this.proprietes[c.i];
        if (!pr.proprio) {
          this.tour.achatEnAttente = { case: c.i, etapeApres: this.tour.etape };
          this.tour.etape = 'acheter';
        } else if (pr.proprio !== p.id && !pr.hypotheque) {
          const loyer = this.calculLoyer(c, mod);
          const proprio = this.j(pr.proprio);
          this.log(`🏠 ${p.nom} tombe chez ${proprio.nom} (${c.nom}) et doit ${this.argent(loyer)} de loyer.`);
          this.payer(p, proprio, loyer, 'loyer');
        } else if (pr.hypotheque && pr.proprio !== p.id) {
          this.log(`${c.nom} est hypothéquée : pas de loyer.`);
        }
        break;
      }
      case 'impot': case 'taxe':
        this.log(`💸 ${p.nom} paie ${this.argent(c.montant)} (${c.nom}).`);
        this.payer(p, null, c.montant, 'taxe');
        break;
      case 'chance': case 'caisse':
        this.tirerCarte(p, c.type);
        break;
      case 'allerPrison':
        this.log(`🚓 ${p.nom} part en ${this.nomCase(PRISON)} !`);
        this.envoyerPrison(p);
        break;
      case 'parc':
        if (this.cfg.cagnotteParcGratuit && this.cagnotte > 0) {
          this.log(`🎁 ${p.nom} remporte la cagnotte de ${this.argent(this.cagnotte)} !`);
          p.argent += this.cagnotte;
          this.cagnotte = 0;
        }
        break;
    }
  }

  calculLoyer(c, mod) {
    const pr = this.proprietes[c.i];
    const proprio = pr.proprio;
    if (c.type === 'gare') {
      const n = this.plateau.filter((x) => x.type === 'gare' && this.proprietes[x.i].proprio === proprio).length;
      return LOYERS_GARE[n] * (mod === 'gareDouble' ? 2 : 1);
    }
    if (c.type === 'compagnie') {
      const total = this.tour.des ? this.tour.des[0] + this.tour.des[1] : 7;
      if (mod === 'compagnie10') return total * 10;
      const n = this.plateau.filter((x) => x.type === 'compagnie' && this.proprietes[x.i].proprio === proprio).length;
      return total * (n === 2 ? 10 : 4);
    }
    if (pr.maisons > 0) return c.loyers[pr.maisons];
    return this.possedeGroupe(proprio, c.groupe) ? c.loyers[0] * 2 : c.loyers[0];
  }

  casesDuGroupe(g) { return this.plateau.filter((c) => c.groupe === g); }
  possedeGroupe(id, g) { return this.casesDuGroupe(g).every((c) => this.proprietes[c.i].proprio === id); }

  // ------------------------------------------------------------- cartes
  tirerCarte(p, paquet) {
    const pile = this.paquets[paquet];
    if (pile.length === 0) { this.log('Le paquet est vide !'); return; }
    const carte = pile.shift();
    if (carte.effet !== 'liberation') pile.push(carte); // la carte retourne sous le paquet
    this.derniereCarte = { paquet, texte: carte.texte, joueur: p.nom, seq: this.desSeq + ':' + Date.now() };
    this.log(`${paquet === 'chance' ? '❓' : '📦'} ${p.nom} pioche : « ${carte.texte} »`);
    switch (carte.effet) {
      case 'argent':
        if (carte.montant >= 0) p.argent += carte.montant;
        else this.payer(p, null, -carte.montant, 'taxe');
        break;
      case 'aller': this.allerA(p, carte.case); break;
      case 'avancer': this.deplacer(p, carte.cases); break;
      case 'reculer':
        p.position = (p.position - carte.cases + 40) % 40;
        this.arriverSur(p);
        break;
      case 'prison': this.envoyerPrison(p); break;
      case 'liberation': p.cartesLiberation.push(carte); break;
      case 'chaqueJoueur':
        for (const autre of this.actifs()) {
          if (autre.id === p.id) continue;
          if (carte.montant >= 0) this.payer(autre, p, carte.montant, 'carte');
          else this.payer(p, autre, -carte.montant, 'carte');
        }
        break;
      case 'reparations': {
        let total = 0;
        for (const [i, pr] of Object.entries(this.proprietes)) {
          if (pr.proprio !== p.id) continue;
          total += pr.maisons === 5 ? carte.parHotel : pr.maisons * carte.parMaison;
        }
        if (total > 0) this.payer(p, null, total, 'taxe');
        else this.log(`${p.nom} n'a aucune construction : rien à payer.`);
        break;
      }
      case 'gareProche': case 'compagnieProche': {
        const type = carte.effet === 'gareProche' ? 'gare' : 'compagnie';
        let k = p.position;
        do { k = (k + 1) % 40; } while (this.plateau[k].type !== type);
        if (k < p.position) this.salaire(p);
        p.position = k;
        this.arriverSur(p, type === 'gare' ? 'gareDouble' : 'compagnie10');
        break;
      }
    }
  }

  // ------------------------------------------------------------- paiements et dettes
  // Si le joueur n'a pas assez d'argent, il a une "dette" : il doit vendre /
  // hypothéquer pour la payer, ou déclarer faillite.
  payer(p, beneficiaire, montant, raison) {
    if (montant <= 0) return;
    if (!p.dette && p.argent >= montant) {
      p.argent -= montant;
      this.encaisser(beneficiaire, montant, raison);
      return;
    }
    if (!p.dette) {
      p.dette = { montant: 0, details: [] };
      this.log(`⚠️ ${p.nom} n'a pas assez d'argent pour payer ${this.argent(montant)}. Il faut vendre ou hypothéquer… ou faire faillite !`);
    }
    p.dette.montant += montant;
    p.dette.details.push({ vers: beneficiaire ? beneficiaire.id : null, montant, raison });
  }

  encaisser(beneficiaire, montant, raison) {
    if (beneficiaire) beneficiaire.argent += montant;
    else if (this.cfg.cagnotteParcGratuit && (raison === 'taxe' || raison === 'amende')) this.cagnotte += montant;
  }

  payerDette(p) {
    if (!p.dette) throw new Error("Tu n'as pas de dette.");
    if (p.argent < p.dette.montant) throw new Error("Tu n'as pas encore assez d'argent. Vends des maisons ou hypothèque des propriétés.");
    const d = p.dette;
    p.dette = null;
    p.argent -= d.montant;
    for (const x of d.details) {
      const b = x.vers && this.j(x.vers);
      this.encaisser(b && !b.faillite ? b : null, x.montant, x.raison);
    }
    this.log(`✅ ${p.nom} règle sa dette de ${this.argent(d.montant)}.`);
  }

  // Valeur maximale qu'un joueur peut récupérer en vendant / hypothéquant tout
  valeurLiquidable(p) {
    let v = p.argent;
    for (const [i, pr] of Object.entries(this.proprietes)) {
      if (pr.proprio !== p.id) continue;
      const c = this.plateau[i];
      if (pr.maisons) v += (pr.maisons * c.prixMaison) / 2;
      if (!pr.hypotheque) v += c.prix / 2;
    }
    return v;
  }

  declarerFaillite(p, parExclusion = false) {
    if (!parExclusion && !p.dette) throw new Error('Tu ne peux faire faillite que si tu as une dette impossible à payer.');
    // Le principal créancier (joueur) récupère tout ; sinon tout retourne à la banque
    let creancier = null;
    if (p.dette) for (const x of p.dette.details) {
      const b = x.vers && this.j(x.vers);
      if (b && !b.faillite && (!creancier || x.montant > creancier.m)) creancier = { j: b, m: x.montant };
    }
    creancier = creancier && creancier.j;
    this.log(`💀 ${p.pion} ${p.nom} fait FAILLITE${creancier ? ' au profit de ' + creancier.nom : ''} !`);
    // On revend toutes les constructions à la banque
    for (const [i, pr] of Object.entries(this.proprietes)) {
      if (pr.proprio !== p.id) continue;
      if (pr.maisons) {
        p.argent += (pr.maisons * this.plateau[i].prixMaison) / 2;
        if (pr.maisons === 5) this.hotelsDispo++; else this.maisonsDispo += pr.maisons;
        pr.maisons = 0;
      }
      if (creancier) pr.proprio = creancier.id; // le créancier récupère tout (hypothèques comprises)
      else { pr.proprio = null; pr.hypotheque = false; } // retour à la banque
    }
    if (creancier) {
      creancier.argent += Math.max(0, p.argent);
      creancier.cartesLiberation.push(...p.cartesLiberation);
    } else {
      for (const c of p.cartesLiberation) this.paquets[c.paquet].push(c);
    }
    p.cartesLiberation = [];
    p.argent = 0;
    p.dette = null;
    p.faillite = true;
    p.enPrison = false;
    // Ses offres d'échange sont annulées
    this.echanges = this.echanges.filter((e) => e.de !== p.id && e.vers !== p.id);
    if (this.enchere) {
      this.enchere.actifs = this.enchere.actifs.filter((x) => x !== p.id);
      if (this.enchere.meilleur === p.id) { this.enchere.meilleur = null; this.enchere.montant = 0; }
      this.verifierFinEnchere();
    }
    if (this.actifs().length === 1) return this.terminer(this.actifs()[0]);
    if (this.tour && this.tour.joueurId === p.id) this.passerAuSuivant();
  }

  exclure(hote, cibleId) {
    if (hote.id !== this.hoteId) throw new Error("Seul l'hôte peut exclure un joueur.");
    const c = this.j(cibleId);
    if (!c || c.faillite) return;
    if (c.connecte) throw new Error('On ne peut exclure que les joueurs déconnectés.');
    this.log(`🚪 ${c.nom} a été retiré de la partie par l'hôte.`);
    c.dette = null;
    this.declarerFaillite(c, true);
  }

  terminer(gagnant) {
    this.phase = 'fin';
    this.gagnant = gagnant.id;
    this.tour = null;
    if (this.enchere) { clearTimeout(this.enchere.timer); this.enchere = null; }
    this.log(`🏆 ${gagnant.pion} ${gagnant.nom} remporte la partie !`);
  }

  // ------------------------------------------------------------- achat et enchères
  acheter(p) {
    this.monTour(p);
    if (this.tour.etape !== 'acheter') throw new Error("Rien à acheter pour l'instant.");
    if (p.dette) throw new Error("Règle d'abord ta dette.");
    const { case: i, etapeApres } = this.tour.achatEnAttente;
    const c = this.plateau[i];
    if (p.argent < c.prix) throw new Error("Pas assez d'argent ! Hypothèque une propriété ou mets-la aux enchères.");
    p.argent -= c.prix;
    this.proprietes[i].proprio = p.id;
    this.log(`🛒 ${p.nom} achète ${c.nom} pour ${this.argent(c.prix)}.`);
    this.tour.etape = etapeApres;
    this.tour.achatEnAttente = null;
  }

  refuserAchat(p) {
    this.monTour(p);
    if (this.tour.etape !== 'acheter') throw new Error("Rien à refuser pour l'instant.");
    const { case: i, etapeApres } = this.tour.achatEnAttente;
    this.tour.etape = etapeApres;
    this.tour.achatEnAttente = null;
    this.lancerEnchere(i);
  }

  lancerEnchere(i) {
    const enLigne = this.actifs().filter((x) => x.connecte);
    this.enchere = {
      case: i, montant: 0, meilleur: null,
      actifs: (enLigne.length ? enLigne : this.actifs()).map((x) => x.id),
      fin: Date.now() + DUREE_ENCHERE, timer: null,
    };
    this.log(`🔨 Enchères pour ${this.nomCase(i)} ! (prix normal : ${this.argent(this.plateau[i].prix)})`);
    this.programmerFinEnchere();
  }

  programmerFinEnchere() {
    clearTimeout(this.enchere.timer);
    this.enchere.fin = Date.now() + DUREE_ENCHERE;
    this.enchere.timer = setTimeout(() => { this.adjuger(); this.onChange(); }, DUREE_ENCHERE);
  }

  encherir(p, montant) {
    const e = this.enchere;
    if (!e) throw new Error("Pas d'enchère en cours.");
    if (!e.actifs.includes(p.id)) throw new Error("Tu t'es retiré de cette enchère.");
    if (!Number.isInteger(montant) || montant <= e.montant) throw new Error(`Il faut proposer plus que ${this.argent(e.montant)}.`);
    if (montant > p.argent) throw new Error("Tu n'as pas assez d'argent.");
    e.montant = montant;
    e.meilleur = p.id;
    this.log(`🙋 ${p.nom} propose ${this.argent(montant)}.`);
    this.programmerFinEnchere();
    this.verifierFinEnchere();
  }

  abandonEnchere(p) {
    const e = this.enchere;
    if (!e || !e.actifs.includes(p.id)) return;
    e.actifs = e.actifs.filter((x) => x !== p.id);
    this.log(`🙅 ${p.nom} se retire de l'enchère.`);
    this.verifierFinEnchere();
  }

  verifierFinEnchere() {
    const e = this.enchere;
    if (!e) return;
    const autres = e.actifs.filter((x) => x !== e.meilleur);
    if ((e.meilleur && autres.length === 0) || e.actifs.length === 0) this.adjuger();
  }

  adjuger() {
    const e = this.enchere;
    if (!e) return;
    clearTimeout(e.timer);
    this.enchere = null;
    const c = this.plateau[e.case];
    const gagnant = e.meilleur && this.j(e.meilleur);
    if (gagnant && !gagnant.faillite && gagnant.argent >= e.montant) {
      gagnant.argent -= e.montant;
      this.proprietes[e.case].proprio = gagnant.id;
      this.log(`🔨 Adjugé ! ${gagnant.nom} remporte ${c.nom} pour ${this.argent(e.montant)}.`);
    } else {
      this.log(`Personne n'a acheté ${c.nom}. Elle reste à la banque.`);
    }
  }

  // ------------------------------------------------------------- prison
  payerPrison(p) {
    this.monTour(p);
    this.bloque();
    if (!p.enPrison || this.tour.etape !== 'lancer') throw new Error('Impossible maintenant.');
    if (p.argent < AMENDE_PRISON) throw new Error("Pas assez d'argent.");
    p.argent -= AMENDE_PRISON;
    this.encaisser(null, AMENDE_PRISON, 'amende');
    p.enPrison = false; p.toursPrison = 0;
    this.log(`💸 ${p.nom} paie ${this.argent(AMENDE_PRISON)} pour sortir de ${this.nomCase(PRISON)}.`);
  }

  utiliserCarteLiberation(p) {
    this.monTour(p);
    this.bloque();
    if (!p.enPrison || this.tour.etape !== 'lancer') throw new Error('Impossible maintenant.');
    const carte = p.cartesLiberation.pop();
    if (!carte) throw new Error("Tu n'as pas de carte de libération.");
    this.paquets[carte.paquet].push(carte);
    p.enPrison = false; p.toursPrison = 0;
    this.log(`🔑 ${p.nom} utilise sa carte et sort de ${this.nomCase(PRISON)}.`);
  }

  // ------------------------------------------------------------- fin de tour
  finTour(p) {
    this.monTour(p);
    this.bloque();
    if (this.tour.etape !== 'fin') throw new Error(this.tour.etape === 'acheter' ? "Décide d'abord si tu achètes." : 'Tu dois encore lancer les dés.');
    this.passerAuSuivant();
  }

  passerAuSuivant() {
    const idx = this.joueurs.findIndex((x) => x.id === this.tour.joueurId);
    for (let k = 1; k <= this.joueurs.length; k++) {
      const s = this.joueurs[(idx + k) % this.joueurs.length];
      if (!s.faillite) { this.nouveauTour(s); return; }
    }
  }

  // ------------------------------------------------------------- constructions et hypothèques
  verifProprio(p, i) {
    const pr = this.proprietes[i];
    if (!pr || pr.proprio !== p.id) throw new Error('Cette propriété ne t\'appartient pas.');
    return pr;
  }
  // On ne peut gérer ses biens que pendant son tour, ou si on a une dette à régler.
  peutGerer(p) {
    if (p.dette) return;
    if (this.enchere) throw new Error('Attends la fin de l\'enchère.');
    this.monTour(p);
  }

  construire(p, i) {
    this.peutGerer(p);
    if (p.dette) throw new Error("Règle d'abord ta dette.");
    const pr = this.verifProprio(p, i);
    const c = this.plateau[i];
    if (c.type !== 'prop') throw new Error('On ne construit que sur les terrains de couleur.');
    if (!this.possedeGroupe(p.id, c.groupe)) throw new Error('Il faut posséder toutes les propriétés de la couleur.');
    const groupe = this.casesDuGroupe(c.groupe).map((x) => this.proprietes[x.i]);
    if (groupe.some((x) => x.hypotheque)) throw new Error('Une propriété de cette couleur est hypothéquée.');
    if (pr.maisons >= 5) throw new Error('Il y a déjà un hôtel.');
    if (pr.maisons > Math.min(...groupe.map((x) => x.maisons))) throw new Error('Construis de façon uniforme : les autres terrains de la couleur d\'abord !');
    if (p.argent < c.prixMaison) throw new Error("Pas assez d'argent.");
    if (pr.maisons === 4) {
      if (this.hotelsDispo === 0) throw new Error("La banque n'a plus d'hôtels.");
      this.hotelsDispo--; this.maisonsDispo += 4;
    } else {
      if (this.maisonsDispo === 0) throw new Error("La banque n'a plus de maisons.");
      this.maisonsDispo--;
    }
    p.argent -= c.prixMaison;
    pr.maisons++;
    this.log(`🏗️ ${p.nom} construit ${pr.maisons === 5 ? 'un hôtel' : 'une maison'} sur ${c.nom}.`);
  }

  vendreMaison(p, i) {
    this.peutGerer(p);
    const pr = this.verifProprio(p, i);
    const c = this.plateau[i];
    if (!pr.maisons) throw new Error("Il n'y a rien à vendre ici.");
    const groupe = this.casesDuGroupe(c.groupe).map((x) => this.proprietes[x.i]);
    if (pr.maisons < Math.max(...groupe.map((x) => x.maisons))) throw new Error("Vends de façon uniforme : d'abord sur les terrains qui en ont le plus.");
    if (pr.maisons === 5) {
      if (this.maisonsDispo < 4) throw new Error("La banque n'a pas assez de maisons pour remplacer l'hôtel.");
      this.maisonsDispo -= 4; this.hotelsDispo++;
    } else this.maisonsDispo++;
    pr.maisons--;
    p.argent += c.prixMaison / 2;
    this.log(`🔧 ${p.nom} revend une construction sur ${c.nom} (+${this.argent(c.prixMaison / 2)}).`);
  }

  hypothequer(p, i) {
    this.peutGerer(p);
    const pr = this.verifProprio(p, i);
    const c = this.plateau[i];
    if (pr.hypotheque) throw new Error('Déjà hypothéquée.');
    if (c.groupe && this.casesDuGroupe(c.groupe).some((x) => this.proprietes[x.i].maisons > 0))
      throw new Error("Vends d'abord toutes les maisons de cette couleur.");
    pr.hypotheque = true;
    p.argent += c.prix / 2;
    this.log(`🏦 ${p.nom} hypothèque ${c.nom} (+${this.argent(c.prix / 2)}).`);
  }

  leverHypotheque(p, i) {
    this.peutGerer(p);
    if (p.dette) throw new Error("Règle d'abord ta dette.");
    const pr = this.verifProprio(p, i);
    const c = this.plateau[i];
    if (!pr.hypotheque) throw new Error("Elle n'est pas hypothéquée.");
    const cout = Math.ceil((c.prix * 11) / 20); // valeur hypothécaire + 10 %
    if (p.argent < cout) throw new Error(`Il faut ${this.argent(cout)}.`);
    p.argent -= cout;
    pr.hypotheque = false;
    this.log(`🏦 ${p.nom} lève l'hypothèque de ${c.nom} (-${this.argent(cout)}).`);
  }

  // ------------------------------------------------------------- échanges entre joueurs
  proposerEchange(p, a) {
    const autre = this.j(a.vers);
    if (!autre || autre.faillite || autre.id === p.id) throw new Error('Joueur invalide.');
    const offre = this.nettoyerOffre(a.donne, p);
    const demande = this.nettoyerOffre(a.recoit, autre);
    if (!offre.proprietes.length && !offre.argent && !offre.cartes && !demande.proprietes.length && !demande.argent && !demande.cartes)
      throw new Error("L'échange est vide.");
    if (this.echanges.filter((e) => e.de === p.id).length >= 3) throw new Error("Tu as déjà 3 propositions en attente.");
    const e = { id: crypto.randomBytes(4).toString('hex'), de: p.id, vers: autre.id, donne: offre, recoit: demande };
    this.validerEchange(e);
    this.echanges.push(e);
    this.log(`🤝 ${p.nom} propose un échange à ${autre.nom}.`);
  }

  nettoyerOffre(o, qui) {
    o = o || {};
    const proprietes = [...new Set((Array.isArray(o.proprietes) ? o.proprietes : []).map(Number))];
    const argent = Math.max(0, Math.floor(Number(o.argent) || 0));
    const cartes = Math.max(0, Math.min(qui.cartesLiberation.length, Math.floor(Number(o.cartes) || 0)));
    return { proprietes, argent, cartes };
  }

  // Vérifie qu'un échange est encore possible (appelé à la proposition ET à l'acceptation)
  validerEchange(e) {
    const de = this.j(e.de), vers = this.j(e.vers);
    if (!de || !vers || de.faillite || vers.faillite) throw new Error('Un des joueurs ne joue plus.');
    for (const [qui, o] of [[de, e.donne], [vers, e.recoit]]) {
      for (const i of o.proprietes) {
        const pr = this.proprietes[i];
        if (!pr || pr.proprio !== qui.id) throw new Error(`${this.plateau[i] ? this.plateau[i].nom : 'Une case'} n'appartient plus à ${qui.nom}.`);
        const c = this.plateau[i];
        if (c.groupe && this.casesDuGroupe(c.groupe).some((x) => this.proprietes[x.i].maisons > 0))
          throw new Error(`Impossible d'échanger ${c.nom} : il y a des maisons sur sa couleur.`);
      }
      if (qui.argent < o.argent) throw new Error(`${qui.nom} n'a pas assez d'argent pour cet échange.`);
      if (qui.cartesLiberation.length < o.cartes) throw new Error(`${qui.nom} n'a plus la carte de libération.`);
    }
  }

  repondreEchange(p, id, accepte) {
    const e = this.echanges.find((x) => x.id === id);
    if (!e || e.vers !== p.id) throw new Error('Proposition introuvable.');
    const de = this.j(e.de);
    if (!accepte) {
      this.echanges = this.echanges.filter((x) => x !== e);
      this.log(`❌ ${p.nom} refuse l'échange de ${de.nom}.`);
      return;
    }
    if (this.enchere) throw new Error("Attends la fin de l'enchère.");
    if (de.dette || p.dette) throw new Error('Impossible pendant une dette.');
    this.validerEchange(e);
    this.echanges = this.echanges.filter((x) => x !== e);
    const transferer = (o, src, dst) => {
      for (const i of o.proprietes) this.proprietes[i].proprio = dst.id;
      src.argent -= o.argent; dst.argent += o.argent;
      for (let k = 0; k < o.cartes; k++) dst.cartesLiberation.push(src.cartesLiberation.pop());
    };
    transferer(e.donne, de, p);
    transferer(e.recoit, p, de);
    this.log(`✅ Échange conclu entre ${de.nom} et ${p.nom} !`);
    // Les autres propositions devenues impossibles disparaissent
    this.echanges = this.echanges.filter((x) => { try { this.validerEchange(x); return true; } catch { return false; } });
  }

  annulerEchange(p, id) {
    const avant = this.echanges.length;
    this.echanges = this.echanges.filter((x) => !(x.id === id && x.de === p.id));
    if (this.echanges.length === avant) throw new Error('Proposition introuvable.');
  }

  // ------------------------------------------------------------- chat
  message(id, texte) {
    const p = this.j(id);
    texte = String(texte || '').trim().slice(0, 300);
    if (!p || !texte) return null;
    const m = { de: p.nom, couleur: p.couleur, pion: p.pion, texte, t: Date.now() };
    this.chat.push(m);
    if (this.chat.length > 100) this.chat.shift();
    return m;
  }

  // ------------------------------------------------------------- état envoyé aux navigateurs
  // On n'envoie JAMAIS les jetons secrets ni l'ordre des cartes.
  etatPublic() {
    return {
      code: this.code,
      nomDuJeu: this.cfg.nomDuJeu,
      monnaie: this.cfg.monnaie,
      phase: this.phase,
      hoteId: this.hoteId,
      plateau: this.plateau,
      proprietes: this.proprietes,
      joueurs: this.joueurs.map((p) => ({
        id: p.id, nom: p.nom, pion: p.pion, couleur: p.couleur, argent: p.argent, position: p.position,
        enPrison: p.enPrison, toursPrison: p.toursPrison, cartesLiberation: p.cartesLiberation.length,
        faillite: p.faillite, connecte: p.connecte, dette: p.dette,
        valeurLiquidable: this.phase === 'jeu' ? this.valeurLiquidable(p) : 0,
      })),
      tour: this.tour && { joueurId: this.tour.joueurId, etape: this.tour.etape, des: this.tour.des, doubles: this.tour.doubles,
        achat: this.tour.achatEnAttente ? this.tour.achatEnAttente.case : null },
      desSeq: this.desSeq,
      enchere: this.enchere && { case: this.enchere.case, montant: this.enchere.montant, meilleur: this.enchere.meilleur,
        actifs: this.enchere.actifs, resteMs: Math.max(0, this.enchere.fin - Date.now()) },
      echanges: this.echanges,
      journal: this.journal.slice(-40),
      derniereCarte: this.derniereCarte,
      cagnotte: this.cfg.cagnotteParcGratuit ? this.cagnotte : null,
      maisonsDispo: this.maisonsDispo,
      hotelsDispo: this.hotelsDispo,
      gagnant: this.gagnant,
      pions: PIONS,
      salaire: this.cfg.salaireCaseDepart,
    };
  }
}

module.exports = { Partie, verifierConfig, PIONS };

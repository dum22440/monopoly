// =====================================================================
//  🎲  FICHIER DE PERSONNALISATION DU MONOPOLY  🎲
// =====================================================================
//
//  C'est LE SEUL fichier que tu as besoin de modifier !
//
//  RÈGLES D'OR pour ne rien casser :
//   1. Modifie uniquement le texte ENTRE les guillemets "..."
//   2. Ne supprime jamais les virgules à la fin des lignes
//   3. Si ton texte contient un guillemet ", écris \" à la place
//      (ou utilise plutôt une apostrophe ’ ou des « chevrons »)
//   4. Les lignes qui commencent par // sont des commentaires :
//      l'ordinateur les ignore, elles sont là pour t'expliquer.
//
//  Si tu fais une erreur, le serveur refusera de démarrer et
//  t'indiquera la ligne à corriger. Pas de panique 😉
// =====================================================================

module.exports = {

  // ---------------------------------------------------------------
  //  RÉGLAGES GÉNÉRAUX
  // ---------------------------------------------------------------
  nomDuJeu: "Monopoly de la promo",   // Titre affiché au milieu du plateau
  monnaie: "€",                       // Symbole de l'argent
  argentDeDepart: 1500,               // Argent de chaque joueur au début
  salaireCaseDepart: 200,             // Argent reçu en passant par la case Départ

  // Règle "maison" très connue : les taxes et amendes vont au centre
  // du plateau, et le joueur qui tombe sur le Parc gratuit les gagne.
  // true = activé, false = règle officielle (rien ne se passe)
  cagnotteParcGratuit: false,

  // ---------------------------------------------------------------
  //  LES 22 PROPRIÉTÉS (les gens de la promo)
  //  Elles sont rangées par couleur, de la moins chère à la plus chère.
  //  ⚠️ Garde exactement le même nombre de noms par couleur !
  // ---------------------------------------------------------------
  proprietes: {
    marron:    ["Gildas", "Gwen"],                       // 2 noms (les moins chères)
    bleuClair: ["Hang", "Eva", "Amandine"],              // 3 noms
    rose:      ["Clément", "Théo", "Baptiste"],          // 3 noms
    orange:    ["Sandrine", "Vincent", "Valoche"],       // 3 noms
    rouge:     ["Agathe", "Fanny", "Manon"],             // 3 noms
    jaune:     ["Alice", "Justine", "Dario"],            // 3 noms
    vert:      ["Tom", "Lucas", "Malo"],                 // 3 noms
    bleuFonce: ["Ewen", "Louis"],                        // 2 noms (les plus chères)
  },

  // ---------------------------------------------------------------
  //  LES 4 GARES (lieux de la fac)
  // ---------------------------------------------------------------
  gares: ["Parking", "BU", "RU", "Cube"],

  // ---------------------------------------------------------------
  //  LES 2 COMPAGNIES
  // ---------------------------------------------------------------
  compagnies: ["Création d'un nouveau Master", "Investissement dans des cours d'IA"],

  // ---------------------------------------------------------------
  //  LES CASES SPÉCIALES (tu peux changer leurs noms et montants)
  // ---------------------------------------------------------------
  casesSpeciales: {
    depart:      "Départ",
    prison:      "Cours de Valéria",        // la prison
    parcGratuit: "Pause clope",             // le parc gratuit
    allerPrison: "Direction le cours de Valéria !",
    impot:       { nom: "Frais d'inscription", montant: 200 },
    taxe:        { nom: "Ticket de RU perdu", montant: 100 },
  },

  // ===============================================================
  //  LES CARTES
  // ===============================================================
  //  Chaque carte = { texte: "...", effet: "...", + des réglages }
  //
  //  Voici TOUS les effets possibles (copie-colle l'exemple qui te plaît) :
  //
  //  💰 Gagner ou perdre de l'argent (montant négatif = perdre) :
  //     { texte: "...", effet: "argent", montant: 50 },
  //     { texte: "...", effet: "argent", montant: -50 },
  //
  //  🚶 Aller sur une case précise (on touche le salaire si on passe par Départ) :
  //     { texte: "...", effet: "aller", case: 39 },
  //     → Numéros des cases : 0 = Départ, puis on compte dans le sens du jeu.
  //       1 et 3 = marron · 5 = 1re gare · 6, 8, 9 = bleu clair · 10 = prison (simple visite)
  //       11, 13, 14 = rose · 12 = 1re compagnie · 15 = 2e gare · 16, 18, 19 = orange
  //       20 = parc gratuit · 21, 23, 24 = rouge · 25 = 3e gare · 26, 27, 29 = jaune
  //       28 = 2e compagnie · 31, 32, 34 = vert · 35 = 4e gare · 37, 39 = bleu foncé
  //
  //  ⏩ Avancer / ⏪ Reculer de quelques cases :
  //     { texte: "...", effet: "avancer", cases: 2 },
  //     { texte: "...", effet: "reculer", cases: 3 },
  //
  //  🚓 Aller directement en prison (sans passer par Départ) :
  //     { texte: "...", effet: "prison" },
  //
  //  🔑 Carte "Libéré de prison" (le joueur la garde pour plus tard) :
  //     { texte: "...", effet: "liberation" },
  //
  //  👥 Chaque autre joueur te donne de l'argent (ou tu donnes à chacun si négatif) :
  //     { texte: "...", effet: "chaqueJoueur", montant: 20 },
  //     { texte: "...", effet: "chaqueJoueur", montant: -20 },
  //
  //  🔨 Payer des réparations pour chaque maison / hôtel possédé :
  //     { texte: "...", effet: "reparations", parMaison: 25, parHotel: 100 },
  //
  //  🚉 Aller à la gare la plus proche (et payer le DOUBLE du loyer si elle a un propriétaire) :
  //     { texte: "...", effet: "gareProche" },
  //
  //  ⚡ Aller à la compagnie la plus proche (et payer 10 × les dés si elle a un propriétaire) :
  //     { texte: "...", effet: "compagnieProche" },
  //
  //  Tu peux mettre autant de cartes que tu veux (au moins 1 par paquet).
  // ===============================================================

  // ---------------------------------------------------------------
  //  CARTES CHANCE ❓
  // ---------------------------------------------------------------
  chance: [
    { texte: "Tu arrives en retard en amphi en prétendant que le tram est tombé en panne. Personne n'y croit. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Tu as couru jusqu'au RU pour éviter la queue : record battu ! Avance jusqu'à la case Départ.", effet: "aller", case: 0 },
    { texte: "Tu as oublié ta clé USB avec le dossier à rendre… Recule de 3 cases pour aller la chercher.", effet: "reculer", cases: 3 },
    { texte: "Il y a des frites au RU ! Fonce à la gare la plus proche.", effet: "gareProche" },
    { texte: "La fac a encore une idée de génie. Va à la compagnie la plus proche.", effet: "compagnieProche" },
    { texte: "Tu as vendu tes fiches de révision à toute la promo. Reçois 150 €.", effet: "argent", montant: 150 },
    { texte: "Ton téléphone a sonné en plein partiel. Paie 50 € d'amende.", effet: "argent", montant: -50 },
    { texte: "Tu es élu délégué de la promo ! Chaque joueur te paie 20 € pour ta campagne.", effet: "chaqueJoueur", montant: 20 },
    { texte: "Louis t'invite à boire un verre. Va directement chez Louis.", effet: "aller", case: 39 },
    { texte: "Tu as un projet de groupe avec Alice. Rends-toi chez Alice.", effet: "aller", case: 26 },
    { texte: "Contrôle surprise de ton appart par le proprio : paie 25 € par maison et 100 € par hôtel.", effet: "reparations", parMaison: 25, parHotel: 100 },
    { texte: "Valéria est malade, cours annulé ! Carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Tu as renversé ton plateau au RU devant toute la promo. Paie 15 € de pressing.", effet: "argent", montant: -15 },
    { texte: "Tu glisses sur le sol fraîchement lavé de la BU et avances de 2 cases.", effet: "avancer", cases: 2 },
  ],

  // ---------------------------------------------------------------
  //  CARTES CAISSE DE COMMUNAUTÉ 📦
  // ---------------------------------------------------------------
  caisse: [
    { texte: "Tu as eu 20/20 au partiel (personne ne sait comment). Reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "C'est ton anniversaire ! Chaque joueur t'offre 10 €.", effet: "chaqueJoueur", montant: 10 },
    { texte: "Tu as perdu ta carte étudiante. Paie 50 € pour en refaire une.", effet: "argent", montant: -50 },
    { texte: "La bourse du CROUS tombe enfin ! Reçois 50 €.", effet: "argent", montant: 50 },
    { texte: "Tu as « emprunté » les notes de tout le monde pendant un semestre. Rembourse 20 € à chaque joueur.", effet: "chaqueJoueur", montant: -20 },
    { texte: "Tu as ronflé en amphi. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Tes parents ont fait un virement surprise. Retourne à la case Départ.", effet: "aller", case: 0 },
    { texte: "Soirée d'intégration : paie 100 €.", effet: "argent", montant: -100 },
    { texte: "Tu as retrouvé 20 € dans la poche de ton jean au lavage.", effet: "argent", montant: 20 },
    { texte: "Tu as un mot du médecin (bidon). Carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Tu as cassé la machine à café du Cube. Paie 40 € par maison et 115 € par hôtel.", effet: "reparations", parMaison: 40, parHotel: 115 },
    { texte: "Tu as revendu tes vieux bouquins à la BU. Reçois 25 €.", effet: "argent", montant: 25 },
    { texte: "Tu as raté le tram et marché jusqu'à la fac. Recule d'1 case, tu es épuisé.", effet: "reculer", cases: 1 },
  ],
};

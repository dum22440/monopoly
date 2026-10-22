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

  // Tous les montants du jeu sont multipliés par ce nombre : prix, loyers, maisons,
  // argent de départ, salaire, taxes, cartes, malchances…
  // 100 = une gare coûte 20 000 €, un loyer de gare 2 500 €, on démarre avec 150 000 €.
  // 1 = montants du Monopoly d'origine (une gare coûte 200 €).
  // Les montants écrits plus bas restent ceux du vrai Monopoly (ex : 1500, 200, 50…) :
  // c'est le jeu qui ajoute les zéros, y compris dans le texte des cartes.
  echelle: 100,
  argentDeDepart: 1500,               // Argent de chaque joueur au début
  salaireCaseDepart: 200,             // Argent reçu en passant par la case Départ

  // Règle "maison" très connue : les taxes et amendes vont au centre
  // du plateau, et le joueur qui tombe sur le Parc gratuit les gagne.
  // true = activé, false = règle officielle (rien ne se passe)
  cagnotteParcGratuit: false,

  // Quand un joueur ne veut pas acheter une case :
  // false = elle reste simplement à vendre (plus rapide)
  // true  = tout le monde peut l'acheter aux enchères
  encheres: false,

  // ---------------------------------------------------------------
  //  LOYERS : ce sont ceux du vrai Monopoly.
  //  Pour des loyers plus doux, enlève les // devant la ligne ci-dessous
  //  (en % du prix du terrain : terrain nu, 1, 2, 3, 4 maisons, hôtel).
  // ---------------------------------------------------------------
  // coefficientsLoyers: [0.1, 0.35, 0.7, 1.1, 1.4, 1.7],

  // ---------------------------------------------------------------
  //  LES 22 PROPRIÉTÉS (les gens de la promo)
  //  Elles sont rangées par couleur, de la moins chère à la plus chère.
  //  ⚠️ Garde exactement le même nombre de noms par couleur !
  // ---------------------------------------------------------------
  proprietes: {
    marron:    ["Gildas", "Gwen"],                       // 2 noms (les moins chères)
    bleuClair: ["Hang", "Eva", "Amandine"],              // 3 noms
    rose:      ["Clément", "Théo", "Baptiste"],          // 3 noms
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
    parcGratuit: "Sieste d'Eva",             // le parc gratuit
    allerPrison: "Direction le cours de Valéria !",
    impot:       { nom: "Abonnement Claude d'Ewen", montant: 200 },
    taxe:        { nom: "Teinture de Fanny", montant: 100 },
  },

  // ===============================================================
  //  💥 CASES MALCHANCE (invisibles !)
  // ===============================================================
  //  Au début de chaque partie, quelques cases sont piégées au hasard.
  //  Personne ne sait lesquelles. Quand un joueur tombe dessus avec les dés :
  //  gros MALCHANCE rouge + une blague + une punition tirée au sort.
  //  Ensuite la case piégée change de place.
  //
  //  Dans les blagues, tu peux utiliser :
  //    {bien}    → le nom de la propriété perdue
  //    {joueur}  → le joueur qui en profite
  //    {montant} → la somme d'argent
  // ---------------------------------------------------------------
  malchance: {
    nombreDeCases: 3,     // combien de cases piégées en même temps (0 = désactivé)
    montant: 200,         // argent donné ou perdu (= l'impôt sur le revenu du vrai Monopoly)
    tauxDeRevente: 0.5,   // un bien revendu rapporte 50 % de son prix (= valeur hypothécaire du vrai Monopoly)

    // 1) Le joueur DONNE sa propriété la plus chère à un autre joueur
    donnerUnBien: [
      "Agathe a cru que tu draguais Théo. Pour te faire pardonner, tu offres {bien} à {joueur}.",
      "Tu as parié avec {joueur} que Dario ne finirait pas son trail, en mettant {bien} en jeu. Il a fini premier : {bien} part chez {joueur}.",
      "Ewen a codé une appli pour gérer ton patrimoine. Petit bug : {bien} a été transféré à {joueur}.",
      "Tu as échangé {bien} contre un tracteur de Lucas. Le tracteur ne démarre pas, et {bien} appartient maintenant à {joueur}.",
      "{joueur} t'a promis le snap de Louis pour Alice en échange de {bien}. C'était un faux compte : {bien} est perdu.",
    ],

    // 2) Le joueur VEND sa propriété la plus chère à la banque (à moitié prix)
    vendreUnBien: [
      "Fanny avait besoin de 12 teintures blondes en urgence. Tu revends {bien} pour {montant} pour l'aider.",
      "Le chauffe-eau de Baptiste a encore lâché. Tu vends {bien} pour {montant} pour lui en payer un neuf.",
      "Hang rentre au Vietnam et tu veux partir avec elle : tu brades {bien} pour {montant} pour payer le billet.",
      "Eva a besoin de vacances de toute urgence. Tu vends {bien} pour {montant} pour lui offrir une semaine de sommeil.",
      "Clément doit réparer son quad (encore). Tu vends {bien} pour {montant} pour l'aider.",
    ],

    // 3) Le joueur DONNE de l'argent à un autre joueur
    donnerArgent: [
      "Tu as parié avec {joueur} que Manon ne parlerait pas de F1 pendant 4 heures. Elle a tenu 5 heures. Tu dois {montant} à {joueur}.",
      "Gwen a lancé un tunnel et {joueur} t'a sauvé(e) en inventant une urgence. Tu lui dois {montant}.",
      "Tu as vendu à {joueur} un « tracteur de chez Lucas ». C'était une tondeuse. Remboursement : {montant}.",
      "Justine t'a fait réciter les grades militaires de son mari devant {joueur}. Tu t'es trompé(e) : gage de {montant} pour {joueur}.",
    ],

    // 4) Le joueur PERD de l'argent (il va à la banque)
    perdreArgent: [
      "Tu as suivi Dario sur « un petit trail ». Ambulance et séances de kiné : {montant}.",
      "Clément t'a prêté son quad. Il est dans le fossé. Réparation : {montant}.",
      "Tu as tenté la même teinture que Fanny. Résultat : jaune poussin. Coiffeur en urgence : {montant}.",
      "Eva t'a refilé sa fatigue : tu as dormi pendant le partiel. Inscription au rattrapage : {montant}.",
      "Ewen t'a vendu un abonnement à son appli codée avec Claude. Résiliation impossible : {montant}.",
    ],
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
  //     { texte: "...", effet: "aller", case: "Alice" },
  //     → Écris simplement le NOM de la case, exactement comme sur le plateau
  //       (ex : "Louis", "BU", "Départ", "Cours de Valéria").
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
  //     { texte: "...", effet: "chaqueJoueur", montant: 10 },
  //     { texte: "...", effet: "chaqueJoueur", montant: -50 },
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
  //
  //  💶 Montants du vrai Monopoly, à réutiliser :
  //     argent : +10, +20, +25, +50, +100, +150, +200 / -15, -50, -100
  //     chaque joueur : +10 (anniversaire) / -50 (élu président)
  //     réparations : 25 par maison et 100 par hôtel / 40 par maison et 115 par hôtel
  // ===============================================================

  // ---------------------------------------------------------------
  //  CARTES CHANCE ❓
  // ---------------------------------------------------------------
  chance: [
    { texte: "Dario t'a embarqué(e) pour un « petit fractionné »… jusqu'à la case Départ. Touche ton salaire, si tu tiens encore debout.", effet: "aller", case: "Départ" },
    { texte: "Alice cherche toujours le snap de Louis. Elle t'envoie le lui demander : va chez Louis.", effet: "aller", case: "Louis" },
    { texte: "Agathe t'a vu(e) parler à Théo. Crise de jalousie : va directement chez Agathe t'expliquer.", effet: "aller", case: "Agathe" },
    { texte: "Gildas, le petit nouveau, ne trouve pas la BU. Tu l'y accompagnes.", effet: "aller", case: "BU" },
    { texte: "Le chauffe-eau de Baptiste a encore lâché. Tu cours chez Baptiste lui prêter ta bouilloire.", effet: "aller", case: "Baptiste" },
    { texte: "Manon te parle de F1 depuis 2 heures. Tu t'enfuis à la gare la plus proche à la vitesse de Verstappen.", effet: "gareProche" },
    { texte: "Hang a enfin trouvé un vol pour le Vietnam. Tu l'accompagnes à la gare la plus proche.", effet: "gareProche" },
    { texte: "Ewen a encore explosé sa limite sur Claude. Va à la compagnie la plus proche lui payer son abonnement.", effet: "compagnieProche" },
    { texte: "Gwen a lancé un tunnel de 40 minutes sur absolument rien. Tu t'es endormi(e) debout : recule de 3 cases.", effet: "reculer", cases: 3 },
    { texte: "Justine t'a raconté la dernière mission de son mari militaire, minute par minute. Garde-à-vous : direction le cours de Valéria !", effet: "prison" },
    { texte: "Eva a une tête trop fatiguée pour aller en cours, alors vous vous faites un mot d'excuse mutuel. Carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Clément t'a prêté son quad pour faire le tour de tes propriétés. Tout est cassé : 25 € par maison et 100 € par hôtel.", effet: "reparations", parMaison: 25, parHotel: 100 },
    { texte: "Louis a vendu sa récolte de blé et partage les bénéfices. Reçois 50 €.", effet: "argent", montant: 50 },
    { texte: "Louis s'est enfin coupé 2 cm de ses cheveux longs : assez pour une perruque. Tu touches ta part de la vente : reçois 150 €.", effet: "argent", montant: 150 },
    { texte: "Ewen a encore explosé sa limite sur Claude en pleine nuit de code. « Faut payer l'abonnement, frère » : perds 15 €.", effet: "argent", montant: -15 },
    { texte: "Tu es élu(e) chef de la coloc de Tom, Lucas et Malo. Premier acte : tu paies ta tournée, 50 € à chaque joueur.", effet: "chaqueJoueur", montant: -50 },
  ],

  // ---------------------------------------------------------------
  //  CARTES BDE 🎉
  // ---------------------------------------------------------------
  bde: [
    { texte: "Dario a couru jusqu'à la fac plus vite que le tram. Tu essaies de le suivre : avance jusqu'à la case Départ.", effet: "aller", case: "Départ" },
    { texte: "L'appli du BDE codée par Ewen avec Claude a bugué en ta faveur. Reçois 200 €.", effet: "argent", montant: 200 },
    { texte: "Baptiste vient prendre une douche chaude chez toi tous les soirs. Facture d'eau : paie 50 €.", effet: "argent", montant: -50 },
    { texte: "Lucas t'a versé ta commission sur la vente d'un tracteur. Reçois 50 €.", effet: "argent", montant: 50 },
    { texte: "Tu as survécu à un tunnel de Gwen de 45 minutes sans décrocher. Pour ton courage : carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Théo t'a demandé de l'aider à justifier un like auprès d'Agathe. Tu préfères te cacher : direction le cours de Valéria !", effet: "prison" },
    { texte: "Hang t'a ramené des souvenirs du Vietnam. Tu les revends en douce : reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "Fanny a raté sa teinture et te revend sa réserve de shampooing violet. Reçois 20 €.", effet: "argent", montant: 20 },
    { texte: "Tu as lancé la cagnotte « une vraie nuit de sommeil pour Eva ». Chaque joueur te donne 10 €.", effet: "chaqueJoueur", montant: 10 },
    { texte: "Malo, pharaon autoproclamé de la coloc, t'accorde une part de son trésor. Reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "Clément t'a emmené(e) faire un tour de quad. Passage aux urgences : paie 100 €.", effet: "argent", montant: -100 },
    { texte: "L'entreprise d'Amandine a encore rendez-vous au tribunal. Par solidarité, tu paies 50 € d'avocat.", effet: "argent", montant: -50 },
    { texte: "Gildas, le nouveau, te paie un café pour que tu lui expliques qui est qui dans la promo. Reçois 25 €.", effet: "argent", montant: 25 },
    { texte: "Soirée surprise à la coloc de Tom, Lucas et Malo. Le voisin a appelé le proprio : 40 € par maison et 115 € par hôtel.", effet: "reparations", parMaison: 40, parHotel: 115 },
    { texte: "Manon a parlé de F1 pendant tout l'oral. Le prof te met un point bonus pour avoir fait semblant d'écouter : reçois 10 €.", effet: "argent", montant: 10 },
    { texte: "Justine a reçu un colis de rations de son mari militaire. Tu revends ta part : reçois 100 €.", effet: "argent", montant: 100 },
  ],
};

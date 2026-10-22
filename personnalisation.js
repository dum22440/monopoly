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
    parcGratuit: "Pause clope",             // le parc gratuit
    allerPrison: "Direction le cours de Valéria !",
    impot:       { nom: "Frais d'inscription", montant: 200 },
    taxe:        { nom: "Ticket de RU perdu", montant: 100 },
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
      "Tu as parié {bien} au beer-pong contre {joueur}… et tu as perdu. {bien} appartient maintenant à {joueur}.",
      "Tu t'es endormi(e) en pleine soirée : {joueur} en a profité pour te piquer {bien}.",
      "{bien} en a eu marre de toi et a emménagé chez {joueur}. C'est pas toi, c'est {bien}.",
      "Tu as joué {bien} à pierre-feuille-ciseaux contre {joueur}. Tu as fait pierre. {joueur} a fait feuille.",
      "Agathe a cru que tu draguais Théo. Pour te faire pardonner, tu offres {bien} à {joueur}.",
      "Tu as parié {bien} que Dario ne finirait pas son trail. Il a fini premier. {bien} part chez {joueur}.",
      "Ewen a codé une appli pour gérer ton patrimoine. Petit bug : {bien} a été transféré à {joueur}.",
      "Tu as échangé {bien} contre un tracteur de Lucas. Le tracteur ne démarre pas, et {bien} appartient maintenant à {joueur}.",
    ],

    // 2) Le joueur VEND sa propriété la plus chère à la banque (à moitié prix)
    vendreUnBien: [
      "Fin de mois difficile, même les pâtes sont trop chères : tu revends {bien} à la banque pour {montant}.",
      "Ton banquier a vu tes dépenses au bar. Saisie express : {bien} est revendu pour {montant}.",
      "Tu as vendu {bien} sur Leboncoin pour te payer un kebab. Tu récupères {montant}.",
      "Le CROUS a oublié de verser ta bourse. Tu brades {bien} pour {montant}.",
      "Fanny avait besoin de 12 teintures blondes en urgence. Tu revends {bien} pour {montant} pour l'aider.",
      "Le chauffe-eau de Baptiste a encore lâché. Tu vends {bien} pour {montant} pour lui en payer un neuf.",
      "Hang rentre au Vietnam et tu veux partir avec elle : tu brades {bien} pour {montant} pour payer le billet.",
      "Eva a besoin de vacances de toute urgence. Tu vends {bien} pour {montant} pour lui offrir une semaine de sommeil.",
    ],

    // 3) Le joueur DONNE de l'argent à un autre joueur
    donnerArgent: [
      "Tu as perdu un pari stupide contre {joueur} (« t'es pas cap' »). Tu lui donnes {montant}.",
      "{joueur} a des photos de toi en soirée. Pour qu'elles restent secrètes, tu paies {montant}.",
      "Tu as rayé la voiture de {joueur} sur le Parking en faisant un créneau. Tu lui dois {montant}.",
      "Tu as mangé le dernier yaourt de {joueur} dans le frigo commun. Dédommagement : {montant}.",
      "Tu as parié avec {joueur} que Manon ne parlerait pas de F1 pendant 4 heures. Elle a tenu 5 heures. Tu dois {montant} à {joueur}.",
      "Gwen a lancé un tunnel et {joueur} t'a sauvé(e) en inventant une urgence. Tu lui dois {montant}.",
      "Tu as vendu à {joueur} un « tracteur de chez Lucas ». C'était une tondeuse. Remboursement : {montant}.",
      "Justine t'a fait réciter les grades militaires de son mari devant {joueur}. Tu t'es trompé(e) : gage de {montant} pour {joueur}.",
    ],

    // 4) Le joueur PERD de l'argent (il va à la banque)
    perdreArgent: [
      "Ton téléphone est tombé dans les toilettes du RU. Réparation : {montant}.",
      "Contrôlé(e) dans le tram sans ticket… et en pyjama. Amende : {montant}.",
      "Tu as commandé 4 pizzas à 3h du matin et tu ne t'en souviens pas. Tu perds {montant}.",
      "Tu as cru à une arnaque « gagnez un iPhone ». Spoiler : pas d'iPhone. Tu perds {montant}.",
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
    { texte: "Tu t'es réveillé chez quelqu'un dont tu ne connais même pas le prénom. Walk of shame jusqu'à la case Départ.", effet: "aller", case: "Départ" },
    { texte: "Soirée d'inté : tu as fini en caleçon sur une table du Cube. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Ton date Tinder était en fait ton chargé de TD. Recule de 3 cases, vite.", effet: "reculer", cases: 3 },
    { texte: "Tu as vendu des photos de tes pieds sur Internet. Ça marche étonnamment bien : reçois 150 €.", effet: "argent", montant: 150 },
    { texte: "Ton ex a liké ta story à 3h du mat'. Tu craques et tu l'invites à boire un verre : paie 50 €.", effet: "argent", montant: -50 },
    { texte: "Tu as dragué toute la promo pendant la soirée. Chaque joueur te paie 10 € pour que tu arrêtes.", effet: "chaqueJoueur", montant: 10 },
    { texte: "Ton coloc a entendu tes exploits de la nuit à travers le mur. Achète-lui des boules Quies : 25 € par maison, 100 € par hôtel.", effet: "reparations", parMaison: 25, parHotel: 100 },
    { texte: "Tu cherches un coin tranquille avec ton crush : fonce à la gare la plus proche.", effet: "gareProche" },
    { texte: "Gueule de bois XXL : file à la compagnie la plus proche chercher un Doliprane.", effet: "compagnieProche" },
    { texte: "Ton crush t'a enfin répondu « 😏 ». Porté par l'espoir, tu avances de 2 cases.", effet: "avancer", cases: 2 },
    { texte: "Tu as envoyé par erreur une photo très perso dans le groupe de la promo. Plus personne n'ose te regarder : carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Panne de capotes à la pharmacie : taxi jusqu'à celle de garde, paie 15 €.", effet: "argent", montant: -15 },
    { texte: "Louis t'invite à boire un verre. Va directement chez Louis.", effet: "aller", case: "Louis" },
    { texte: "Projet de groupe chez Alice (il paraît qu'il y aura surtout de l'apéro). Rends-toi chez Alice.", effet: "aller", case: "Alice" },

    // --- Vannes sur la promo ---
    { texte: "Louis s'est enfin coupé 2 cm de ses cheveux longs. Il en a assez pour une perruque, qu'il revend : tu touches ta part, reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "Ewen a encore explosé sa limite sur Claude en pleine nuit de code. « Faut payer l'abonnement, frère » : perds 50 €.", effet: "argent", montant: -50 },
    { texte: "Dario t'a proposé « un petit footing tranquille » de 25 km. Tu avances de 3 cases en rampant.", effet: "avancer", cases: 3 },
    { texte: "Agathe t'a vu(e) parler à Théo. Crise de jalousie : va directement chez Agathe t'expliquer.", effet: "aller", case: "Agathe" },
    { texte: "Fanny a raté sa teinture : blond… orange fluo. Tu as trop rigolé, paie 15 € de shampooing déjaunissant.", effet: "argent", montant: -15 },
    { texte: "Gwen a lancé un tunnel de 40 minutes sur absolument rien. Tu t'es endormi(e) debout : recule de 3 cases.", effet: "reculer", cases: 3 },
    { texte: "Hang a enfin trouvé un vol pas cher pour le Vietnam. Elle te paie 50 € pour arroser ses plantes.", effet: "argent", montant: 50 },
    { texte: "Alice t'a demandé le snap de Louis pour la 15e fois. Va chez Louis lui transmettre le message.", effet: "aller", case: "Louis" },
    { texte: "Manon te parle de F1 depuis 2 heures. Tu t'enfuis à la gare la plus proche à la vitesse de Verstappen.", effet: "gareProche" },
    { texte: "Justine t'a raconté la dernière mission de son mari militaire, minute par minute. Garde-à-vous : direction le cours de Valéria !", effet: "prison" },
    { texte: "Gildas est nouveau, personne ne lui a expliqué qu'on ne paie pas sa tournée le premier jour. Reçois 25 €.", effet: "argent", montant: 25 },
    { texte: "Lucas t'a vendu un tracteur d'occasion « comme neuf ». Il tombe en panne au bout de 2 cases : recule de 2 cases.", effet: "reculer", cases: 2 },
    { texte: "Tom a encore « oublié » de payer sa part du loyer de la coloc. Tu avances l'argent : perds 50 €.", effet: "argent", montant: -50 },
  ],

  // ---------------------------------------------------------------
  //  CARTES BDE 🎉
  // ---------------------------------------------------------------
  bde: [
    { texte: "Tu as gagné le concours de t-shirt mouillé de la soirée BDE. Reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "C'est ton anniversaire ! Chaque joueur t'offre 10 € (et un gage).", effet: "chaqueJoueur", montant: 10 },
    { texte: "Tu as perdu ta carte étudiante… et ton caleçon, au même endroit. Paie 50 €.", effet: "argent", montant: -50 },
    { texte: "Ton plan d'un soir t'a remboursé le kebab de 4h du mat'. Reçois 20 €.", effet: "argent", montant: 20 },
    { texte: "Tu as raconté les secrets de chambre de toute la promo. Paie 50 € à chaque joueur pour acheter leur silence.", effet: "chaqueJoueur", montant: -50 },
    { texte: "Surpris en train de te bécoter dans les toilettes de la BU. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Retour de soirée à 6h du mat' : tu retombes pile sur la case Départ.", effet: "aller", case: "Départ" },
    { texte: "Soirée « tenue légère exigée » : paie 100 € de déguisement (pour trois bouts de tissu).", effet: "argent", montant: -100 },
    { texte: "Tu retrouves 50 € et un string qui n'est pas à toi dans ta poche. Tu gardes les deux.", effet: "argent", montant: 50 },
    { texte: "Ton suçon est trop visible pour aller en cours. Mot d'excuse : carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "La soirée chez toi a fini en bataille de mousse géante. Le proprio réclame 40 € par maison et 115 € par hôtel.", effet: "reparations", parMaison: 40, parHotel: 115 },
    { texte: "Tu revends tes capotes parfumées à la pause clope. Reçois 25 €.", effet: "argent", montant: 25 },
    { texte: "Tu as raté le tram en matant un(e) inconnu(e) trop canon. Recule d'1 case.", effet: "reculer", cases: 1 },

    // --- Vannes sur la promo ---
    { texte: "Le chauffe-eau de Baptiste est encore en panne : il vient se doucher chez toi. Facture d'eau chaude : 50 €.", effet: "argent", montant: -50 },
    { texte: "Eva a une tête de zombie : la promo se cotise pour lui offrir une vraie nuit de sommeil. Chaque joueur te donne 10 € pour la cagnotte.", effet: "chaqueJoueur", montant: 10 },
    { texte: "Clément te propose un tour de quad. Tu refuses poliment : 50 € de frais d'hôpital économisés !", effet: "argent", montant: 50 },
    { texte: "Soirée surprise à la coloc de Tom, Lucas et Malo. Le voisin a appelé le proprio : 40 € par maison et 115 € par hôtel.", effet: "reparations", parMaison: 40, parHotel: 115 },
    { texte: "Malo, pharaon autoproclamé de la coloc, t'accorde une audience. Va chez Malo.", effet: "aller", case: "Malo" },
    { texte: "Lucas a vendu un tracteur à Louis et tu as servi d'intermédiaire. Ta commission : reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "L'entreprise d'Amandine a encore rendez-vous au tribunal. Par solidarité, tu paies 50 € d'avocat.", effet: "argent", montant: -50 },
    { texte: "Dario est arrivé à la fac en courant, avant le tram. Va chez Dario lui offrir une boisson isotonique.", effet: "aller", case: "Dario" },
    { texte: "Théo t'a demandé de l'aider à justifier un like à Agathe. Tu préfères te cacher : direction le cours de Valéria !", effet: "prison" },
    { texte: "Tu as survécu à un tunnel de Gwen de 45 minutes sans décrocher. Pour ton courage : carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Louis a vendu sa récolte de blé et il régale tout le monde. Reçois 50 €.", effet: "argent", montant: 50 },
    { texte: "Justine a organisé un repas pour le retour de mission de son mari. Tu apportes le dessert : paie 15 €.", effet: "argent", montant: -15 },
    { texte: "Manon a ENCORE parlé de F1 en plein cours. Chaque joueur te paie 10 € pour que tu la fasses taire.", effet: "chaqueJoueur", montant: 10 },
  ],
};

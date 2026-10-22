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
    montant: 200,         // argent donné ou perdu
    tauxDeRevente: 0.25,  // un bien revendu ne rapporte que 25 % de son prix (vente forcée !)

    // 1) Le joueur DONNE sa propriété la plus chère à un autre joueur
    donnerUnBien: [
      "Tu as parié {bien} au beer-pong contre {joueur}… et tu as perdu. {bien} appartient maintenant à {joueur}.",
      "Tu t'es endormi(e) en pleine soirée : {joueur} en a profité pour te piquer {bien}.",
      "{bien} en a eu marre de toi et a emménagé chez {joueur}. C'est pas toi, c'est {bien}.",
      "Tu as joué {bien} à pierre-feuille-ciseaux contre {joueur}. Tu as fait pierre. {joueur} a fait feuille.",
    ],

    // 2) Le joueur VEND sa propriété la plus chère à la banque, à prix cassé
    vendreUnBien: [
      "Fin de mois difficile, même les pâtes sont trop chères : tu revends {bien} à la banque pour {montant}.",
      "Ton banquier a vu tes dépenses au bar. Saisie express : {bien} est revendu pour {montant}.",
      "Tu as vendu {bien} sur Leboncoin pour te payer un kebab. Tu récupères {montant}.",
      "Le CROUS a oublié de verser ta bourse. Tu brades {bien} pour {montant}.",
    ],

    // 3) Le joueur DONNE de l'argent à un autre joueur
    donnerArgent: [
      "Tu as perdu un pari stupide contre {joueur} (« t'es pas cap' »). Tu lui donnes {montant}.",
      "{joueur} a des photos de toi en soirée. Pour qu'elles restent secrètes, tu paies {montant}.",
      "Tu as rayé la voiture de {joueur} sur le Parking en faisant un créneau. Tu lui dois {montant}.",
      "Tu as mangé le dernier yaourt de {joueur} dans le frigo commun. Dédommagement : {montant}.",
    ],

    // 4) Le joueur PERD de l'argent (il va à la banque)
    perdreArgent: [
      "Ton téléphone est tombé dans les toilettes du RU. Réparation : {montant}.",
      "Contrôlé(e) dans le tram sans ticket… et en pyjama. Amende : {montant}.",
      "Tu as commandé 4 pizzas à 3h du matin et tu ne t'en souviens pas. Tu perds {montant}.",
      "Tu as cru à une arnaque « gagnez un iPhone ». Spoiler : pas d'iPhone. Tu perds {montant}.",
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
  //     { texte: "...", effet: "aller", case: 39 },
  //     → Numéros des cases : 0 = Départ, puis on compte dans le sens du jeu.
  //       2 et 3 = marron · 5 = 1re gare · 6, 7, 9 = bleu clair · 10 = prison (simple visite)
  //       11, 14, 18 = rose · 13 = 1re compagnie · 15 = 2e gare
  //       20 = parc gratuit · 21, 23, 24 = rouge · 25 = 3e gare · 26, 28, 29 = jaune
  //       31, 33, 34 = vert · 35 = 4e gare · 36 = 2e compagnie · 38, 39 = bleu foncé
  //       Chance : 4, 12, 22, 32 · Caisse de communauté : 1, 8, 17, 27, 37
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
    { texte: "Tu t'es réveillé chez quelqu'un dont tu ne connais même pas le prénom. Walk of shame jusqu'à la case Départ.", effet: "aller", case: 0 },
    { texte: "Soirée d'inté : tu as fini en caleçon sur une table du Cube. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Ton date Tinder était en fait ton chargé de TD. Recule de 3 cases, vite.", effet: "reculer", cases: 3 },
    { texte: "Tu as vendu des photos de tes pieds sur Internet. Ça marche étonnamment bien : reçois 150 €.", effet: "argent", montant: 150 },
    { texte: "Ton ex a liké ta story à 3h du mat'. Tu craques et tu l'invites à boire un verre : paie 50 €.", effet: "argent", montant: -50 },
    { texte: "Tu as dragué toute la promo pendant la soirée. Chaque joueur te paie 20 € pour que tu arrêtes.", effet: "chaqueJoueur", montant: 20 },
    { texte: "Ton coloc a entendu tes exploits de la nuit à travers le mur. Achète-lui des boules Quies : 25 € par maison, 100 € par hôtel.", effet: "reparations", parMaison: 25, parHotel: 100 },
    { texte: "Tu cherches un coin tranquille avec ton crush : fonce à la gare la plus proche.", effet: "gareProche" },
    { texte: "Gueule de bois XXL : file à la compagnie la plus proche chercher un Doliprane.", effet: "compagnieProche" },
    { texte: "Ton crush t'a enfin répondu « 😏 ». Porté par l'espoir, tu avances de 2 cases.", effet: "avancer", cases: 2 },
    { texte: "Tu as envoyé par erreur une photo très perso dans le groupe de la promo. Plus personne n'ose te regarder : carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "Panne de capotes à la pharmacie : taxi jusqu'à celle de garde, paie 20 €.", effet: "argent", montant: -20 },
    { texte: "Louis t'invite à boire un verre. Va directement chez Louis.", effet: "aller", case: 39 },
    { texte: "Projet de groupe chez Alice (il paraît qu'il y aura surtout de l'apéro). Rends-toi chez Alice.", effet: "aller", case: 26 },

    // --- Vannes sur la promo (remplace-les par vos vraies anecdotes !) ---
    { texte: "Dario a encore 20 minutes de retard « à cause du tram ». Va l'attendre chez Dario.", effet: "aller", case: 29 },
    { texte: "Tom a « oublié » son porte-monnaie au RU pour la 12e fois. Tu lui paies son plateau : 15 €.", effet: "argent", montant: -15 },
    { texte: "Clément t'a spoilé la fin de ta série en plein amphi. Dommages et intérêts : reçois 50 €.", effet: "argent", montant: 50 },
    { texte: "Manon a squatté toutes les tables de la BU avec ses fiches fluo. Va réviser à la gare la plus proche.", effet: "gareProche" },
    { texte: "Lucas a ronflé pendant tout le CM. Chaque joueur te paie 10 € pour que tu gardes la vidéo secrète.", effet: "chaqueJoueur", montant: 10 },
    { texte: "Hang a lancé un débat de 45 minutes sur l'ananas dans la pizza. Tu fuis : recule d'1 case.", effet: "reculer", cases: 1 },
    { texte: "Gildas t'a ENCORE demandé de lui envoyer le cours. Va chez Gildas lui apporter tes notes.", effet: "aller", case: 2 },
    { texte: "Vincent a bloqué l'imprimante de la BU avec 300 pages de mèmes. Paie 15 € de photocopies.", effet: "argent", montant: -15 },
  ],

  // ---------------------------------------------------------------
  //  CARTES CAISSE DE COMMUNAUTÉ 📦
  // ---------------------------------------------------------------
  caisse: [
    { texte: "Tu as gagné le concours de t-shirt mouillé de la soirée BDE. Reçois 100 €.", effet: "argent", montant: 100 },
    { texte: "C'est ton anniversaire ! Chaque joueur t'offre 10 € (et un gage).", effet: "chaqueJoueur", montant: 10 },
    { texte: "Tu as perdu ta carte étudiante… et ton caleçon, au même endroit. Paie 50 €.", effet: "argent", montant: -50 },
    { texte: "Ton plan d'un soir t'a remboursé le kebab de 4h du mat'. Reçois 20 €.", effet: "argent", montant: 20 },
    { texte: "Tu as raconté les secrets de chambre de toute la promo. Paie 20 € à chaque joueur pour acheter leur silence.", effet: "chaqueJoueur", montant: -20 },
    { texte: "Surpris en train de te bécoter dans les toilettes de la BU. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Retour de soirée à 6h du mat' : tu retombes pile sur la case Départ.", effet: "aller", case: 0 },
    { texte: "Soirée « tenue légère exigée » : paie 100 € de déguisement (pour trois bouts de tissu).", effet: "argent", montant: -100 },
    { texte: "Tu retrouves 50 € et un string qui n'est pas à toi dans ta poche. Tu gardes les deux.", effet: "argent", montant: 50 },
    { texte: "Ton suçon est trop visible pour aller en cours. Mot d'excuse : carte « Libéré du cours de Valéria ».", effet: "liberation" },
    { texte: "La soirée chez toi a fini en bataille de mousse géante. Le proprio réclame 40 € par maison et 115 € par hôtel.", effet: "reparations", parMaison: 40, parHotel: 115 },
    { texte: "Tu revends tes capotes parfumées à la pause clope. Reçois 25 €.", effet: "argent", montant: 25 },
    { texte: "Tu as raté le tram en matant un(e) inconnu(e) trop canon. Recule d'1 case.", effet: "reculer", cases: 1 },

    // --- Vannes sur la promo (remplace-les par vos vraies anecdotes !) ---
    { texte: "Baptiste t'a emprunté ton chargeur… en septembre. Paie 20 € pour en racheter un.", effet: "argent", montant: -20 },
    { texte: "Eva a fait les fiches de révision pour toute la promo. Va dire merci chez Eva.", effet: "aller", case: 7 },
    { texte: "Amandine a répondu à la question du prof avant même qu'il la pose. Motivé(e), tu avances de 2 cases.", effet: "avancer", cases: 2 },
    { texte: "Gwen a lancé un apéro surprise. Va directement chez Gwen.", effet: "aller", case: 3 },
    { texte: "Fanny a organisé la soirée de l'année. Le voisin a moins aimé : paie 30 € d'amende pour tapage.", effet: "argent", montant: -30 },
    { texte: "Malo a négocié un point bonus pour toute la promo (personne ne sait comment). Reçois 50 €.", effet: "argent", montant: 50 },
    { texte: "Sandrine n'a pas rendu le devoir et c'est toi qui t'es fait prendre. Direction le cours de Valéria !", effet: "prison" },
    { texte: "Agathe t'a fait gagner le blind test du BDE. Reçois 40 €.", effet: "argent", montant: 40 },
    { texte: "Théo a confondu la date du partiel avec celle de la soirée. Offre-lui un café pour le consoler : paie 10 €.", effet: "argent", montant: -10 },
    { texte: "Ewen a créé un groupe WhatsApp qui envoie 400 messages par jour. Paie 10 € à chaque joueur pour qu'on te sorte du groupe.", effet: "chaqueJoueur", montant: -10 },
    { texte: "Justine a ramené un gâteau maison en amphi. Chaque joueur te donne 10 € pour avoir une part.", effet: "chaqueJoueur", montant: 10 },
    { texte: "Valoche t'a expliqué sa théorie du complot sur le planning des partiels pendant 2h. Épuisé(e), tu recules de 2 cases.", effet: "reculer", cases: 2 },
  ],
};

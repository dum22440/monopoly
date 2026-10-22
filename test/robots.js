// Test automatique : des robots jouent des centaines de parties au hasard
// et on vérifie qu'aucune règle n'est violée.   Lancer avec :  npm test
const { Partie } = require('../game');
const config = require('../personnalisation');

const hasard = (n) => Math.floor(Math.random() * n);
const pick = (t) => t[hasard(t.length)];
let actionsOk = 0, refus = 0, finies = 0;

function verifier(g) {
  let maisons = 0, hotels = 0;
  for (const [i, pr] of Object.entries(g.proprietes)) {
    if (pr.maisons === 5) hotels++; else maisons += pr.maisons;
    if (pr.maisons && pr.hypotheque) throw new Error('maison sur terrain hypothéqué ' + i);
    if (pr.proprio && g.j(pr.proprio).faillite) throw new Error('propriété à un joueur en faillite');
    const c = g.plateau[i];
    if (pr.maisons) {
      const groupe = g.casesDuGroupe(c.groupe).map((x) => g.proprietes[x.i].maisons);
      if (Math.max(...groupe) - Math.min(...groupe) > 1) throw new Error('construction non uniforme');
      if (!g.possedeGroupe(pr.proprio, c.groupe)) throw new Error('maison sans groupe complet');
    }
  }
  if (maisons + g.maisonsDispo !== 32 || hotels + g.hotelsDispo !== 12) throw new Error('compteur de maisons faux');
  for (const p of g.joueurs) {
    if (p.argent < 0) throw new Error('argent négatif pour ' + p.nom);
    if (p.position < 0 || p.position > 39) throw new Error('position invalide');
  }
  if (g.phase === 'jeu' && g.courant().faillite) throw new Error('le joueur courant est en faillite');
  JSON.stringify(g.etatPublic()); // doit être envoyable
}

function essayer(g, id, a) {
  try { g.action(id, a); actionsOk++; } catch (e) { refus++; }
  verifier(g);
}

function partie(nbJoueurs) {
  const g = new Partie('TEST', config, () => {});
  const ids = [];
  for (let k = 0; k < nbJoueurs; k++) ids.push(g.ajouterJoueur('Robot' + k).id);
  g.action(ids[0], { type: 'demarrer' });
  for (let pas = 0; pas < 4000 && g.phase === 'jeu'; pas++) {
    // Les enchères se terminent sans attendre le chrono dans le test
    if (g.enchere) {
      const qui = pick(g.enchere.actifs);
      if (Math.random() < 0.6) essayer(g, qui, { type: 'encherir', montant: g.enchere.montant + 1 + hasard(80) });
      else essayer(g, qui, { type: 'abandonEnchere' });
      if (g.enchere && Math.random() < 0.1) { g.adjuger(); verifier(g); }
      continue;
    }
    // Les joueurs endettés vendent ou font faillite
    const endette = g.joueurs.find((p) => p.dette);
    if (endette) {
      const mes = Object.keys(g.proprietes).filter((i) => g.proprietes[i].proprio === endette.id);
      if (endette.argent >= endette.dette.montant) essayer(g, endette.id, { type: 'payerDette' });
      else if (g.valeurLiquidable(endette) < endette.dette.montant || Math.random() < 0.05) essayer(g, endette.id, { type: 'faillite' });
      else essayer(g, endette.id, { type: pick(['vendreMaison', 'hypothequer']), case: pick(mes) });
      continue;
    }
    const p = g.courant();
    const mes = Object.keys(g.proprietes).filter((i) => g.proprietes[i].proprio === p.id);
    const r = Math.random();
    if (r < 0.25 && mes.length) essayer(g, p.id, { type: pick(['construire', 'construire', 'hypothequer', 'leverHypotheque', 'vendreMaison']), case: pick(mes) });
    else if (r < 0.3) {
      const autre = pick(g.actifs().filter((x) => x.id !== p.id));
      const siens = Object.keys(g.proprietes).filter((i) => g.proprietes[i].proprio === autre.id);
      essayer(g, p.id, { type: 'proposerEchange', vers: autre.id,
        donne: { proprietes: mes.length ? [pick(mes)] : [], argent: hasard(100) },
        recoit: { proprietes: siens.length ? [pick(siens)] : [], argent: hasard(50) } });
      for (const e of [...g.echanges]) essayer(g, e.vers, { type: 'repondreEchange', echangeId: e.id, accepte: Math.random() < 0.5 });
    } else if (r < 0.33 && p.enPrison) essayer(g, p.id, { type: pick(['payerPrison', 'carteLiberation']) });
    else if (g.tour.etape === 'acheter') essayer(g, p.id, { type: Math.random() < 0.7 ? 'acheter' : 'refuser' });
    else if (g.tour.etape === 'lancer') essayer(g, p.id, { type: 'lancer' });
    else essayer(g, p.id, { type: 'finTour' });
  }
  if (g.enchere) clearTimeout(g.enchere.timer);
  if (g.phase === 'fin') finies++;
}

const N = +process.env.N || 150;
for (let k = 0; k < N; k++) partie(2 + (k % 5));
console.log(`✅ ${N} parties jouées par des robots, ${finies} terminées par une victoire.`);
console.log(`   ${actionsOk} actions acceptées, ${refus} actions interdites correctement refusées. Aucune règle violée.`);
process.exit(0);

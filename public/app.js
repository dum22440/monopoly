// =====================================================================
//  Interface du jeu (ce qui tourne dans le navigateur des joueurs).
//  Elle affiche l'état envoyé par le serveur et lui transmet les clics.
//  Toutes les règles sont vérifiées par le serveur, pas ici.
// =====================================================================

const PIONS = ['🏎️', '🏍️', '🐆', '🚗', '🎩', '🐶', '🚀', '🦄', '🍕', '👟', '🐱', '⚽', '🎸', '👑', '🦖'];
const ICONES = { depart: '🏁', prison: '🚔', parc: '☕', allerPrison: '👮', chance: '❓', caisse: '🎉',
  gare: '🚉', compagnie: '💡', impot: '💸', taxe: '💎' };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const socket = io();
let etat = null;          // dernier état reçu du serveur
let moi = null;           // mon identifiant de joueur
let pionChoisi = PIONS[0];
let plateauConstruit = false;
let positionsAffichees = {}; // où les pions sont dessinés en ce moment
let fileEtats = Promise.resolve();
let animationEnCours = false;
let messageVu = 0;
let desSeqVu = 0, echangesVus = new Set(), modaleOuverte = null;

// ---------------------------------------------------------------------
//  Mémoire des parties (pour pouvoir revenir après une déconnexion)
// ---------------------------------------------------------------------
const memoire = {
  lire(k, def, store = localStorage) { try { return JSON.parse(store.getItem(k)) ?? def; } catch { return def; } },
  ecrire(k, v, store = localStorage) { try { store.setItem(k, JSON.stringify(v)); } catch {} },
};
// sessionStorage = cet onglet (survit au rechargement) ; localStorage = ce navigateur
const sessionActuelle = () => memoire.lire('monopoly-actuel', null, sessionStorage);
function enregistrerSession(code, jeton, nom) {
  memoire.ecrire('monopoly-actuel', { code, jeton }, sessionStorage);
  const toutes = memoire.lire('monopoly-sessions', {});
  toutes[code] = (toutes[code] || []).filter((x) => x.jeton !== jeton);
  toutes[code].push({ jeton, nom, t: Date.now() });
  memoire.ecrire('monopoly-sessions', toutes);
}
function oublierSession(code, jeton) {
  sessionStorage.removeItem('monopoly-actuel');
  const toutes = memoire.lire('monopoly-sessions', {});
  if (toutes[code]) toutes[code] = toutes[code].filter((x) => x.jeton !== jeton);
  if (toutes[code] && !toutes[code].length) delete toutes[code];
  memoire.ecrire('monopoly-sessions', toutes);
}

// ---------------------------------------------------------------------
//  Petites aides d'affichage
// ---------------------------------------------------------------------
function toast(texte, erreur = false) {
  const d = document.createElement('div');
  d.className = 'toast' + (erreur ? ' erreur-t' : '');
  d.textContent = texte;
  $('#toasts').appendChild(d);
  setTimeout(() => d.remove(), 3300);
}
function envoyer(type, donnees = {}) {
  socket.emit('action', { type, ...donnees }, (r) => { if (r && r.erreur) toast(r.erreur, true); });
}
// Montants avec des espaces entre les milliers : 150000 → "150 000 €"
const formater = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
const argent = (n) => `${formater(n)}\u00a0${etat ? etat.monnaie : '€'}`;
// Version courte pour les petites cases du plateau : 6000 → "6 k€"
const argentCourt = (n) => (n >= 1000 && n % 100 === 0 ? `${String(n / 1000).replace('.', ',')}\u00a0k${etat.monnaie}` : argent(n));
const joueur = (id) => etat.joueurs.find((p) => p.id === id);
const moiJ = () => etat && joueur(moi);
const nomJ = (id) => { const p = joueur(id); return p ? `${p.pion} ${esc(p.nom)}` : '?'; };
function afficherEcran(id) {
  for (const e of ['accueil', 'salon', 'jeu']) $('#' + e).classList.toggle('hidden', e !== id);
}

// ---------------------------------------------------------------------
//  ÉCRAN D'ACCUEIL
// ---------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const codeLien = (params.get('partie') || '').toUpperCase();

function dessinerChoixPion(conteneur, pris = [], actuel, onChoix) {
  conteneur.innerHTML = PIONS.map((p) =>
    `<button type="button" class="${p === actuel ? 'choisi' : ''}" ${pris.includes(p) && p !== actuel ? 'disabled' : ''} data-p="${p}">${p}</button>`).join('');
  conteneur.onclick = (e) => { const b = e.target.closest('button'); if (b && !b.disabled) onChoix(b.dataset.p); };
}
function majAccueil() {
  dessinerChoixPion($('#choix-pion'), [], pionChoisi, (p) => { pionChoisi = p; majAccueil(); });
}
$('#pseudo').value = memoire.lire('monopoly-pseudo', '');
majAccueil();

if (codeLien) {
  $('#bloc-rejoindre-lien').classList.remove('hidden');
  $('#bloc-normal').classList.add('hidden');
  $('#code-lien').textContent = codeLien;
  $('.sous-titre').textContent = 'Tu as été invité ! Choisis ton pseudo et ton pion.';
  // Des places déjà occupées par ce navigateur dans cette partie ?
  const anciennes = memoire.lire('monopoly-sessions', {})[codeLien] || [];
  if (anciennes.length) {
    $('#bloc-reprendre').innerHTML = `<div class="reprendre"><p class="petit">Tu étais déjà dans cette partie :</p>${
      anciennes.map((s) => `<button class="btn jaune large" data-jeton="${esc(s.jeton)}">↩️ Reprendre ma place : ${esc(s.nom)}</button>`).join('')}</div>`;
    $('#bloc-reprendre').onclick = (e) => {
      const b = e.target.closest('button');
      if (b) rejoindre({ code: codeLien, jeton: b.dataset.jeton });
    };
  }
}

function lirePseudo() {
  const nom = $('#pseudo').value.trim();
  if (!nom) { $('#erreur-accueil').textContent = 'Choisis d\'abord un pseudo 😉'; $('#pseudo').focus(); return null; }
  memoire.ecrire('monopoly-pseudo', nom);
  return nom;
}
function rejoindre(donnees) {
  $('#erreur-accueil').textContent = '';
  socket.emit('rejoindre', donnees, (r) => {
    if (r && r.erreur) {
      $('#erreur-accueil').textContent = r.erreur;
      if (donnees.jeton) { oublierSession(donnees.code, donnees.jeton); afficherEcran('accueil'); }
    }
  });
}
$('#btn-creer').onclick = () => {
  const nom = lirePseudo();
  if (nom) socket.emit('creer', { nom, pion: pionChoisi }, (r) => r && r.erreur && ($('#erreur-accueil').textContent = r.erreur));
};
$('#btn-rejoindre').onclick = () => {
  const nom = lirePseudo();
  const code = $('#code').value.trim().toUpperCase();
  if (!code) { $('#erreur-accueil').textContent = 'Entre le code de la partie.'; return; }
  if (nom) rejoindre({ code, nom, pion: pionChoisi });
};
$('#btn-rejoindre-lien').onclick = () => {
  const nom = lirePseudo();
  if (nom) rejoindre({ code: codeLien, nom, pion: pionChoisi });
};
$('#code').addEventListener('keydown', (e) => e.key === 'Enter' && $('#btn-rejoindre').click());

// ---------------------------------------------------------------------
//  CONNEXION AU SERVEUR
// ---------------------------------------------------------------------
socket.on('connect', () => {
  $('#bandeau-connexion').classList.add('hidden');
  const s = sessionActuelle();
  if (s && (!codeLien || codeLien === s.code)) rejoindre({ code: s.code, jeton: s.jeton });
});
socket.on('disconnect', () => { if (etat) $('#bandeau-connexion').classList.remove('hidden'); });

socket.on('bienvenue', ({ code, joueurId, jeton, nom, chat }) => {
  moi = joueurId;
  enregistrerSession(code, jeton, nom);
  history.replaceState(null, '', '?partie=' + code); // le lien dans la barre d'adresse = lien à partager
  $('#chat').innerHTML = '';
  for (const m of chat) ajouterMessage(m, false);
});

socket.on('erreur', (msg) => {
  toast(msg, true);
  sessionStorage.removeItem('monopoly-actuel');
  etat = null;
  afficherEcran('accueil');
});

// Chaque nouvel état est traité dans l'ordre, après la fin des animations précédentes
socket.on('etat', (s) => { fileEtats = fileEtats.then(() => traiterEtat(s)).catch(console.error); });

async function traiterEtat(s) {
  const ancien = etat;
  etat = s;
  if (s.phase === 'salon') { afficherEcran('salon'); dessinerSalon(); return; }
  afficherEcran('jeu');
  if (!plateauConstruit) construirePlateau();

  if (!ancien || ancien.phase === 'salon') {
    for (const p of s.joueurs) positionsAffichees[p.id] = p.position;
    desSeqVu = s.desSeq;
    if (s.tour && s.tour.des) dessinerDe($('#de1'), s.tour.des[0]), dessinerDe($('#de2'), s.tour.des[1]);
  }
  // 1) Animation des dés
  if (s.desSeq !== desSeqVu && s.tour && s.tour.des) {
    desSeqVu = s.desSeq;
    animationEnCours = true;
    $('#actions').innerHTML = '';
    await lancerDesAnimation(s.tour.des);
  }
  // 2) Déplacement des pions
  await deplacerPions(s);
  animationEnCours = false;
  // 3) Tout le reste
  dessinerTout(ancien);
}

// ---------------------------------------------------------------------
//  SALON
// ---------------------------------------------------------------------
function dessinerSalon() {
  $('#salon-code').textContent = etat.code;
  $('#salon-joueurs').innerHTML = etat.joueurs.map((p) => `
    <li style="border-color:${p.couleur}"><span class="pion-g">${p.pion}</span>
      <b>${esc(p.nom)}</b>${p.id === etat.hoteId ? ' 👑' : ''}${p.id === moi ? ' (toi)' : ''}
      ${p.connecte ? '' : '<span class="hors-ligne">· déconnecté</span>'}</li>`).join('');
  const m = moiJ();
  dessinerChoixPion($('#salon-pions'), etat.joueurs.map((p) => p.pion), m && m.pion, (p) => envoyer('pion', { pion: p }));
  const hote = etat.hoteId === moi;
  $('#btn-demarrer').classList.toggle('hidden', !hote);
  $('#btn-demarrer').disabled = etat.joueurs.length < 2;
  $('#salon-attente').textContent = hote
    ? (etat.joueurs.length < 2 ? 'En attente d\'au moins un autre joueur…' : `${etat.joueurs.length} joueurs prêts. C'est parti quand tu veux !`)
    : `En attente que ${joueur(etat.hoteId)?.nom || "l'hôte"} lance la partie…`;
  if (navigator.share) $('#btn-partager').classList.remove('hidden');
}
const lienPartie = () => `${location.origin}${location.pathname}?partie=${etat.code}`;
$('#btn-copier').onclick = async () => {
  try { await navigator.clipboard.writeText(lienPartie()); toast('Lien copié ! Colle-le à tes amis 🎉'); }
  catch { prompt('Copie ce lien :', lienPartie()); }
};
$('#btn-partager').onclick = () => navigator.share({ title: etat.nomDuJeu, text: 'Viens jouer au Monopoly avec moi ! 🎲', url: lienPartie() }).catch(() => {});
$('#btn-demarrer').onclick = () => envoyer('demarrer');

// ---------------------------------------------------------------------
//  PLATEAU
// ---------------------------------------------------------------------
// Position de chaque case dans la grille 11×11 (0 = Départ en bas à droite)
function placeGrille(i) {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [11 - (i - 10), 1];
  if (i <= 30) return [1, 1 + (i - 20)];
  return [1 + (i - 30), 11];
}
function cote(i) {
  if (i % 10 === 0) return 'coin';
  return ['bas', 'gauche', 'haut', 'droite'][Math.floor(i / 10)];
}

// Vue 3D (inclinée) ou 2D (à plat, plus lisible sur petit écran)
let vue3d = memoire.lire('monopoly-vue3d', innerWidth > 700);
function appliquerVue() {
  $('#zone-plateau').classList.toggle('v3d', vue3d);
  $('#btn-vue').textContent = vue3d ? '🗺️ Vue 2D' : '🧊 Vue 3D';
  requestAnimationFrame(() => placerPions());
}
$('#btn-vue').onclick = () => { vue3d = !vue3d; memoire.ecrire('monopoly-vue3d', vue3d); appliquerVue(); };
appliquerVue();

function construirePlateau() {
  plateauConstruit = true;
  const pl = $('#plateau');
  for (const c of etat.plateau) {
    const d = document.createElement('div');
    const [ligne, col] = placeGrille(c.i);
    d.className = `case ${cote(c.i)} ${c.type}-case`;
    d.style.gridRow = ligne;
    d.style.gridColumn = col;
    d.id = 'case-' + c.i;
    const prix = c.prix ? `<div class="prix">${argentCourt(c.prix)}</div>` : c.montant ? `<div class="prix">${argentCourt(c.montant)}</div>` : '';
    const bande = c.type === 'prop' ? `<div class="bande" style="background:${c.couleur}"><span class="maisons"></span></div>` : '';
    const icone = c.type !== 'prop' ? `<div class="icone">${ICONES[c.type] || ''}</div>` : '';
    d.innerHTML = `${bande}<div class="infos">${c.type === 'coin' ? '' : icone}<div class="nom">${esc(c.nom)}</div>${prix}</div><div class="proprio hidden"></div>`;
    if (cote(c.i) === 'coin') d.classList.add('coin');
    if (c.nom.length > 22) d.classList.add('nom-long'); // les noms très longs s'écrivent un peu plus petit
    d.onclick = () => ouvrirPropriete(c.i);
    pl.insertBefore(d, $('#pions'));
  }
  document.title = etat.nomDuJeu;
  window.addEventListener('resize', () => placerPions(false));
}

function dessinerCases() {
  for (const c of etat.plateau) {
    const pr = etat.proprietes[c.i];
    if (!pr) continue;
    const d = $('#case-' + c.i);
    const proprio = pr.proprio && joueur(pr.proprio);
    const cadre = d.querySelector('.proprio');
    cadre.classList.toggle('hidden', !proprio);
    if (proprio) cadre.style.setProperty('--couleur-proprio', proprio.couleur);
    d.classList.toggle('hypotheque', pr.hypotheque);
    const m = d.querySelector('.maisons');
    if (m) m.textContent = pr.maisons === 5 ? '🏨' : '🏠'.repeat(pr.maisons);
  }
}

// La case où le dernier joueur vient d'arriver brille dans sa couleur
// (pour tout le monde) jusqu'à son prochain déplacement.
function surlignerArrivee() {
  for (const c of $$('.case.ici')) c.classList.remove('ici');
  const dc = etat.dernierCoup;
  const qui = dc && joueur(dc.joueurId);
  if (!qui || etat.phase !== 'jeu') return;
  const el = $('#case-' + dc.case);
  el.style.setProperty('--couleur-ici', qui.couleur);
  el.classList.add('ici');
}

// ---------------------------------------------------------------------
//  DÉS
// ---------------------------------------------------------------------
const POINTS = { 1: [[50, 50]], 2: [[27, 27], [73, 73]], 3: [[27, 27], [50, 50], [73, 73]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[27, 25], [73, 25], [27, 50], [73, 50], [27, 75], [73, 75]] };
function dessinerDe(el, n) {
  el.innerHTML = `<svg viewBox="0 0 100 100">${POINTS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join('')}</svg>`;
}
dessinerDe($('#de1'), 6); dessinerDe($('#de2'), 6);

async function lancerDesAnimation([a, b]) {
  const d1 = $('#de1'), d2 = $('#de2');
  d1.classList.remove('roule'); d2.classList.remove('roule');
  void d1.offsetWidth; // relance l'animation CSS
  d1.classList.add('roule'); d2.classList.add('roule');
  for (let k = 0; k < 7; k++) {
    dessinerDe(d1, 1 + Math.floor(Math.random() * 6));
    dessinerDe(d2, 1 + Math.floor(Math.random() * 6));
    await attendre(85);
  }
  dessinerDe(d1, a); dessinerDe(d2, b);
  await attendre(250);
}

// ---------------------------------------------------------------------
//  PIONS
// ---------------------------------------------------------------------
// Coordonnées (dans le plateau) où poser un pion sur la case i
function coordonneesCase(i, rang, total, enPrison) {
  const d = $('#case-' + i);
  const w = d.offsetWidth, h = d.offsetHeight;
  let x = d.offsetLeft + w / 2;
  let y = d.offsetTop + h / 2;
  if (i === 10) { // prison : les prisonniers au centre, les visiteurs sur le bord
    if (enPrison) { x += w * 0.12; y -= h * 0.12; } else { x -= w * 0.28; y += h * 0.28; }
  }
  if (total > 1) { // plusieurs pions sur la même case : on les écarte
    const angle = (rang / total) * Math.PI * 2;
    const rayon = Math.min(w, h) * 0.22;
    x += Math.cos(angle) * rayon; y += Math.sin(angle) * rayon;
  }
  return [x, y];
}

function placerPions(seulement = null) {
  if (!etat || !plateauConstruit) return;
  const couche = $('#pions');
  const actifs = etat.joueurs.filter((p) => !p.faillite);
  for (const p of etat.joueurs) {
    let el = $('#pion-' + p.id);
    if (p.faillite) { el && el.remove(); continue; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'pion-' + p.id;
      el.className = 'pion';
      el.innerHTML = `<div class="debout"><span>${p.pion}</span></div>`;
      couche.appendChild(el);
    }
    if (seulement && seulement !== p.id) continue;
    const pos = positionsAffichees[p.id] ?? p.position;
    const ici = actifs.filter((x) => (positionsAffichees[x.id] ?? x.position) === pos);
    const [x, y] = coordonneesCase(pos, ici.indexOf(p), ici.length, p.enPrison && pos === 10);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--couleur', p.couleur);
    el.classList.toggle('actuel', etat.tour && etat.tour.joueurId === p.id);
    el.classList.toggle('prison', p.enPrison);
  }
}

async function deplacerPions(s) {
  for (const p of s.joueurs) {
    const depart = positionsAffichees[p.id];
    if (depart === undefined || depart === p.position || p.faillite) { positionsAffichees[p.id] = p.position; continue; }
    const pas = (p.position - depart + 40) % 40;
    const el = $('#pion-' + p.id);
    // Avance case par case (sauf téléportation : prison, grand saut de carte…)
    if (pas <= 12 && !(p.enPrison && p.position === 10)) {
      for (let k = 1; k <= pas; k++) {
        positionsAffichees[p.id] = (depart + k) % 40;
        placerPions();
        if (el) { el.classList.remove('saute'); void el.offsetWidth; el.classList.add('saute'); }
        await attendre(190);
      }
    } else {
      positionsAffichees[p.id] = p.position;
      placerPions();
      await attendre(450);
    }
    $('#case-' + p.position)?.classList.remove('surbrillance');
    void document.body.offsetWidth;
    $('#case-' + p.position)?.classList.add('surbrillance');
  }
  placerPions();
}

// ---------------------------------------------------------------------
//  AFFICHAGE GÉNÉRAL
// ---------------------------------------------------------------------
function dessinerTout(ancien) {
  dessinerCases();
  surlignerArrivee();
  placerPions();
  dessinerJoueurs(ancien);
  dessinerCentre();
  dessinerJournal();
  dessinerEchanges();
  dessinerEnchere();
  dessinerMessage();
  if (modaleOuverte) modaleOuverte();
  if (etat.phase === 'fin' && (!ancien || ancien.phase !== 'fin')) victoire();
}

// Les joueurs sont assis autour du plateau ; moi toujours en bas à gauche,
// puis les autres dans l'ordre du jeu, dans le sens des aiguilles d'une montre.
const SIEGES = { 1: [0], 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 4, 1, 2, 3], 6: [0, 4, 1, 2, 5, 3] };
function dessinerJoueurs(ancien) {
  const hote = etat.hoteId === moi;
  const n = etat.joueurs.length;
  const debut = Math.max(0, etat.joueurs.findIndex((p) => p.id === moi));
  for (let k = 0; k < 6; k++) $('#siege-' + k).innerHTML = '';
  etat.joueurs.forEach((_, rang) => {
    const p = etat.joueurs[(debut + rang) % n];
    const statut = p.faillite ? '💀 Faillite'
      : [p.enPrison ? `🚔 ${esc(etat.plateau[10].nom)}` : '', p.cartesLiberation ? `🔑×${p.cartesLiberation}` : '',
        p.connecte ? '' : '<span class="hors-ligne">📴 déconnecté</span>', p.dette ? `⚠️ doit ${argent(p.dette.montant)}` : ''].filter(Boolean).join(' · ');
    const exclure = hote && !p.connecte && !p.faillite && p.id !== moi && etat.phase === 'jeu'
      ? `<button class="btn rouge petit" data-exclure="${p.id}">Retirer</button>` : '';
    $('#siege-' + SIEGES[n][rang]).innerHTML = `
      <div class="joueur ${etat.tour && etat.tour.joueurId === p.id ? 'actuel' : ''} ${p.faillite ? 'faillite' : ''}" style="--couleur:${p.couleur}" id="carte-${p.id}">
        <div class="avatar">${p.pion}</div>
        <div class="infos-j">
          <div class="bandeau-nom">${esc(p.nom)}${p.id === etat.hoteId ? ' 👑' : ''}${p.id === moi ? ' (toi)' : ''}</div>
          <div class="somme">${argent(p.argent)}</div>
        </div>
      </div>
      ${statut || exclure ? `<div class="details">${statut} ${exclure}</div>` : ''}`;
  });
  // Petite animation "+200 €" / "-50 €"
  if (ancien && ancien.phase !== 'salon') for (const p of etat.joueurs) {
    const avant = ancien.joueurs.find((x) => x.id === p.id);
    if (!avant || avant.argent === p.argent) continue;
    const diff = p.argent - avant.argent;
    const f = document.createElement('div');
    f.className = 'flottant ' + (diff > 0 ? 'plus' : 'moins');
    f.textContent = (diff > 0 ? '+' : '') + diff;
    $('#carte-' + p.id).appendChild(f);
  }
}
for (let k = 0; k < 6; k++) $('#siege-' + k).onclick = (e) => {
  const mp = e.target.closest('[data-case]');
  if (mp) return ouvrirPropriete(+mp.dataset.case);
  const ex = e.target.closest('[data-exclure]');
  if (ex && confirm(`Retirer ${joueur(ex.dataset.exclure).nom} de la partie ? Ses propriétés retourneront à la banque.`))
    envoyer('exclure', { joueurId: ex.dataset.exclure });
};

// Le centre du plateau : à qui de jouer + les boutons d'action
function dessinerCentre() {
  const info = $('#centre-info'), act = $('#actions');
  if (animationEnCours) return;
  // Ce qui vient de se passer : où est arrivé le dernier joueur qui a bougé
  const dc = etat.dernierCoup;
  const qui = dc && joueur(dc.joueurId);
  $('#position').innerHTML = qui
    ? `${qui.pion} <b>${esc(qui.nom)}</b> est sur <b>${esc(etat.plateau[dc.case].nom)}</b>${dc.info ? `<br><small>${esc(dc.info)}</small>` : ''}`
    : '';
  if (etat.phase === 'fin') {
    $('#joueur-actif').innerHTML = `🏆 ${nomJ(etat.gagnant)}`;
    info.innerHTML = 'a gagné la partie !';
    act.innerHTML = '<button class="btn rose" id="btn-rejouer">🔁 Nouvelle partie</button>';
    $('#btn-rejouer').onclick = nouvellePartie;
    return;
  }
  const m = moiJ();
  const t = etat.tour;
  const courant = joueur(t.joueurId);
  const aMoi = t.joueurId === moi;
  // Le joueur qui joue, en gros, dans sa couleur : pareil pour tout le monde
  const ja = $('#joueur-actif');
  ja.style.setProperty('--couleur', courant.couleur);
  ja.innerHTML = `<span class="ja-pion">${courant.pion}</span><span class="ja-nom">${esc(courant.nom)}${aMoi ? ' <small>(toi)</small>' : ''}</span>`;

  // Tout le monde voit la même phrase et les mêmes boutons ;
  // les boutons ne marchent que pour le joueur qui joue (grisés chez les autres).
  const boutons = [];
  const bouton = (classe, action, texte, actif = true) =>
    boutons.push(`<button class="btn ${classe}" data-a="${action}" ${aMoi && actif ? '' : 'disabled'}>${texte}</button>`);
  let texte = '';
  const endettes = etat.joueurs.filter((p) => p.dette);

  if (m && m.dette) {
    // Seul cas personnel : c'est MOI qui dois de l'argent
    texte = `⚠️ Tu dois <b>${argent(m.dette.montant)}</b> ! Vends ou hypothèque (touche tes propriétés).`;
    boutons.push(`<button class="btn vert" data-a="payerDette" ${m.argent < m.dette.montant ? 'disabled' : ''}>💸 Payer</button>`);
    boutons.push('<button class="btn gris" data-a="gerer">🏠 Mes terrains</button>');
    boutons.push('<button class="btn rouge" data-a="faillite">💀 Faillite</button>');
  } else if (endettes.length) {
    texte = `⏳ ${endettes.map((p) => `<b>${esc(p.nom)}</b>`).join(', ')} doit trouver de l'argent…`;
  } else if (etat.messages.length) {
    texte = `📖 lit sa carte…`;
  } else if (etat.enchere) {
    texte = '🔨 Enchères en cours…';
  } else if (t.etape === 'acheter') {
    const c = etat.plateau[t.achat];
    texte = `Acheter <b>${esc(c.nom)}</b> ?`;
    bouton('vert principal', 'acheter', '✅ Acheter', courant.argent >= c.prix);
    bouton('gris', 'refuser', etat.encheres ? '🔨 Enchères' : '❌ Non merci');
  } else if (t.etape === 'lancer' && courant.enPrison) {
    texte = `🚔 est au <b>${esc(etat.plateau[10].nom)}</b> (essai ${courant.toursPrison + 1}/3)`;
    bouton('rose principal', 'lancer', '🎲 Tenter un double');
    bouton('jaune', 'payerPrison', `Sortir pour ${argent(etat.amende)}`, courant.argent >= etat.amende);
    if (courant.cartesLiberation) bouton('vert', 'carteLiberation', '🔑 Utiliser sa carte');
  } else if (t.etape === 'lancer') {
    texte = t.doubles ? '🎉 Double ! <b>Rejoue</b> !' : 'lance les dés…';
    bouton('rose principal', 'lancer', '🎲 Lancer les dés');
    if (aMoi) bouton('gris', 'gerer', '🏠 Mes terrains');
  } else {
    bouton('bleu principal', 'finTour', '✅ Fin du tour');
  }
  if (!courant.connecte) texte += ' <small>(déconnecté…)</small>';
  info.innerHTML = texte;
  act.innerHTML = boutons.join('');
  // Grande fiche de la case à vendre : couleur, nom et prix en gros, pour tout le monde
  const achat = t.etape === 'acheter' && !etat.messages.length && etat.plateau[t.achat];
  $('#fiche').classList.toggle('hidden', !achat);
  $('#position').classList.toggle('hidden', !!achat);
  if (achat) {
    const fond = achat.couleur || (achat.type === 'gare' ? '#c9c2e0' : '#ffe9a8');
    $('#fiche').innerHTML = `<div class="fiche-bande" style="background:${fond}">${ICONES[achat.type] || ''} ${esc(achat.nom)}</div>
      <div class="fiche-prix">${argent(achat.prix)}</div>`;
  }
}
$('#actions').onclick = (e) => {
  const b = e.target.closest('button[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'gerer') return ouvrirGestion();
  if (a === 'voir') return ouvrirPropriete(+b.dataset.case);
  if (a === 'faillite' && !confirm('Déclarer faillite ? Tu seras éliminé de la partie !')) return;
  if (a === 'lancer') b.disabled = true; // évite le double-clic
  envoyer(a);
};

function dessinerJournal() {
  $('#journal').innerHTML = etat.journal.slice().reverse().map((l) => `<li>${esc(l.txt)}</li>`).join('');
}

// Carte Chance / BDE / MALCHANCE : reste affichée chez tout le monde
// jusqu'à ce que le joueur concerné clique sur OK (le jeu attend).
function dessinerMessage() {
  const m = etat.phase === 'jeu' && etat.messages[0];
  $('#message').classList.toggle('hidden', !m || m.type === 'malchance');
  $('#malchance').classList.toggle('hidden', !m || m.type !== 'malchance');
  if (!m) return;
  const auteur = joueur(m.joueurId);
  const peutFermer = m.joueurId === moi || !auteur || !auteur.connecte;
  const bouton = peutFermer
    ? `<button class="btn ${m.type === 'malchance' ? 'rouge' : 'rose'} gros" data-lu="${m.seq}">OK, j'ai lu 👍</button>`
    : `<p class="attente">⏳ ${auteur.pion} ${esc(auteur.nom)} lit sa carte…</p>`;
  if (m.type === 'malchance') {
    $('#malchance-texte').textContent = m.texte;
    $('#malchance-qui').textContent = `${auteur ? auteur.pion + ' ' : ''}${m.joueur}`;
    $('#malchance-bouton').innerHTML = bouton;
  } else {
    $('#message-boite').className = 'message-boite ' + m.type;
    $('#message-titre').textContent = m.type === 'chance' ? '❓ CHANCE' : '🎉 BDE';
    $('#message-texte').textContent = m.texte;
    $('#message-qui').textContent = `${auteur ? auteur.pion + ' ' : ''}${m.joueur} a pioché :`;
    $('#message-bouton').innerHTML = bouton;
  }
  if (m.seq !== messageVu) {
    messageVu = m.seq;
    if (m.type === 'malchance' && navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }
}
for (const id of ['#message', '#malchance']) $(id).onclick = (e) => {
  const b = e.target.closest('[data-lu]');
  if (b) { b.disabled = true; envoyer('lu', { seq: +b.dataset.lu }); }
};

// ---------------------------------------------------------------------
//  FENÊTRES : propriété, gestion, échanges
// ---------------------------------------------------------------------
function ouvrirModale(dessiner) {
  modaleOuverte = dessiner;
  $('#modale').classList.remove('hidden');
  dessiner();
}
function fermerModale() {
  modaleOuverte = null;
  $('#modale').classList.add('hidden');
}
$('#modale-fermer').onclick = fermerModale;
$('#modale').onclick = (e) => { if (e.target.id === 'modale') fermerModale(); };

function htmlPropriete(i, avecTitre = true) {
  const c = etat.plateau[i];
  const pr = etat.proprietes[i];
  const fond = c.couleur || (c.type === 'gare' ? '#c9c2e0' : c.type === 'compagnie' ? '#ffe9a8' : '#fff');
  let h = avecTitre ? `<div class="titre-propriete" style="background:${fond}">${ICONES[c.type] || ''} ${esc(c.nom)}</div>` : '';
  if (!pr) {
    const desc = {
      depart: `Reçois ${argent(etat.salaire)} à chaque passage.`,
      prison: 'Simple visite… sauf si tu y es envoyé !',
      parc: etat.cagnotte !== null ? `Cagnotte actuelle : ${argent(etat.cagnotte)}` : 'Rien ne se passe, profites-en pour souffler.',
      allerPrison: `Direction ${esc(etat.plateau[10].nom)}, sans passer par la case Départ !`,
      chance: 'Pioche une carte Chance.', caisse: 'Pioche une carte BDE.',
      impot: `Paie ${argent(c.montant)}.`, taxe: `Paie ${argent(c.montant)}.`,
    };
    return h + `<p style="text-align:center">${desc[c.type] || ''}</p>`;
  }
  const proprio = pr.proprio && joueur(pr.proprio);
  h += `<p style="text-align:center;margin:0">${proprio ? `Propriétaire : <b style="color:${proprio.couleur}">${proprio.pion} ${esc(proprio.nom)}</b>` : `À vendre : <b>${argent(c.prix)}</b>`}
    ${pr.hypotheque ? '<br>🏦 <b>Hypothéquée</b> (aucun loyer)' : ''}</p>`;
  let lignes = [];
  if (c.type === 'prop') {
    const noms = ['Terrain nu', '1 maison', '2 maisons', '3 maisons', '4 maisons', 'Hôtel'];
    lignes = c.loyers.map((l, k) => [noms[k], argent(l), pr.maisons === k && proprio && (k > 0 || true)]);
    lignes.splice(1, 0, ['Couleur complète (terrain nu)', argent(c.loyers[0] * 2), false]);
    lignes.push(['Prix d\'une maison', argent(c.prixMaison), false]);
  } else if (c.type === 'gare') {
    lignes = [25, 50, 100, 200].map((l, k) => [`${k + 1} gare${k ? 's' : ''} possédée${k ? 's' : ''}`, argent(l * etat.echelle), false]);
  } else {
    lignes = [['1 compagnie', `dés × ${argent(4 * etat.echelle)}`, false], ['2 compagnies', `dés × ${argent(10 * etat.echelle)}`, false]];
  }
  lignes.push(['Valeur hypothécaire', argent(c.prix / 2), false]);
  h += `<table class="tableau-loyers">${lignes.map(([a, b, act]) => `<tr class="${act ? 'actif' : ''}"><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
  if (proprio && proprio.id === moi && etat.phase === 'jeu') {
    const b = [];
    if (c.type === 'prop') {
      b.push(`<button class="btn vert" data-g="construire" data-case="${i}" ${pr.maisons >= 5 ? 'disabled' : ''}>🏗️ ${pr.maisons === 4 ? 'Hôtel' : 'Maison'} (−${argent(c.prixMaison)})</button>`);
      b.push(`<button class="btn jaune" data-g="vendreMaison" data-case="${i}" ${pr.maisons ? '' : 'disabled'}>🔧 Vendre (+${argent(c.prixMaison / 2)})</button>`);
    }
    if (pr.hypotheque) b.push(`<button class="btn bleu" data-g="leverHypotheque" data-case="${i}">🏦 Lever l'hypothèque (−${argent(Math.ceil((c.prix * 11) / 20))})</button>`);
    else b.push(`<button class="btn violet" data-g="hypothequer" data-case="${i}">🏦 Hypothéquer (+${argent(c.prix / 2)})</button>`);
    h += `<div class="boutons-gestion">${b.join('')}</div>`;
  }
  return h;
}
function ouvrirPropriete(i) {
  ouvrirModale(() => { $('#modale-contenu').innerHTML = htmlPropriete(i); });
}
function ouvrirGestion() {
  ouvrirModale(() => {
    const mes = etat.plateau.filter((c) => etat.proprietes[c.i] && etat.proprietes[c.i].proprio === moi);
    $('#modale-contenu').innerHTML = `<h2>🏠 Mes propriétés</h2>` + (mes.length
      ? `<p class="petit">Touche une propriété pour construire, vendre ou hypothéquer.</p><div class="selection-props">${mes.map((c) => {
        const pr = etat.proprietes[c.i];
        return `<label data-case="${c.i}"><span class="pastille" style="background:${c.couleur || '#888'}"></span>${esc(c.nom)}
          <span style="margin-left:auto">${pr.maisons === 5 ? '🏨' : '🏠'.repeat(pr.maisons)}${pr.hypotheque ? ' 🏦' : ''}</span></label>`;
      }).join('')}</div>`
      : '<p class="petit">Tu n\'as encore aucune propriété.</p>');
  });
}
$('#modale-contenu').onclick = (e) => {
  const g = e.target.closest('button[data-g]');
  if (g && !g.disabled) return envoyer(g.dataset.g, { case: +g.dataset.case });
  const l = e.target.closest('label[data-case]');
  if (l && !e.target.closest('input') && $('#modale-contenu h2')?.textContent.includes('Mes propriétés')) ouvrirPropriete(+l.dataset.case);
};

// ---------------------------------------------------------------------
//  ENCHÈRES
// ---------------------------------------------------------------------
let finEnchere = 0;
function dessinerEnchere() {
  const e = etat.enchere;
  $('#enchere').classList.toggle('hidden', !e);
  if (!e) return;
  finEnchere = Date.now() + e.resteMs;
  const c = etat.plateau[e.case];
  $('#enchere-case').innerHTML = `<div class="titre-propriete" style="margin:0;border-radius:12px;background:${c.couleur || '#c9c2e0'}">${ICONES[c.type] || ''} ${esc(c.nom)}</div>
    <p class="petit">Prix normal : ${argent(c.prix)}</p>`;
  $('#enchere-montant').textContent = argent(e.montant);
  $('#enchere-meilleur').innerHTML = e.meilleur ? `Meilleure offre : ${nomJ(e.meilleur)}` : 'Aucune offre pour le moment';
  const m = moiJ();
  const participe = m && e.actifs.includes(moi);
  $('#enchere-actions').classList.toggle('hidden', !participe);
  $('#enchere-info').textContent = !participe ? 'Tu ne participes pas (ou plus) à cette enchère.'
    : e.meilleur === moi ? '😎 Tu es le meilleur enchérisseur !' : `Ton argent : ${argent(m.argent)}`;
  for (const b of $$('#enchere-actions [data-plus]')) {
    const plus = +b.dataset.plus * etat.echelle;
    b.textContent = '+' + argentCourt(plus);
    b.disabled = !m || e.montant + plus > m.argent || e.meilleur === moi;
  }
}
setInterval(() => {
  if (!etat || !etat.enchere) return;
  const reste = Math.max(0, finEnchere - Date.now());
  $('#enchere-chrono').style.width = (reste / 120) + '%';
}, 200);
$('#enchere-actions').onclick = (ev) => {
  const b = ev.target.closest('[data-plus]');
  if (b) envoyer('encherir', { montant: etat.enchere.montant + +b.dataset.plus * etat.echelle });
};
$('#enchere-perso-btn').onclick = () => {
  envoyer('encherir', { montant: Math.floor(+$('#enchere-perso').value) });
  $('#enchere-perso').value = '';
};
$('#enchere-abandon').onclick = () => envoyer('abandonEnchere');

// ---------------------------------------------------------------------
//  ÉCHANGES
// ---------------------------------------------------------------------
function resumeOffre(o) {
  const parts = o.proprietes.map((i) => {
    const c = etat.plateau[i];
    return `<span class="etiquette"><span class="pastille" style="background:${c.couleur || '#888'}"></span>${esc(c.nom)}</span>`;
  });
  if (o.argent) parts.push(`<span class="etiquette">💰 ${argent(o.argent)}</span>`);
  if (o.cartes) parts.push(`<span class="etiquette">🔑 ×${o.cartes}</span>`);
  return parts.join('') || '<span class="petit">Rien</span>';
}
function htmlEchange(e) {
  const recu = e.vers === moi;
  return `<div class="echange">
    <div>${recu ? `📩 <b>${nomJ(e.de)}</b> te propose :` : `📤 Ta proposition à <b>${nomJ(e.vers)}</b> :`}</div>
    <div class="cols">
      <div><h4>${recu ? 'Tu reçois' : 'Tu donnes'}</h4>${resumeOffre(e.donne)}</div>
      <div><h4>${recu ? 'Tu donnes' : 'Tu reçois'}</h4>${resumeOffre(e.recoit)}</div>
    </div>
    <div class="ligne">${recu
      ? `<button class="btn vert" style="flex:1" data-rep="1" data-id="${e.id}">✅ Accepter</button><button class="btn rouge" style="flex:1" data-rep="0" data-id="${e.id}">❌ Refuser</button>`
      : `<button class="btn gris large" data-annuler="${e.id}">Annuler</button>`}</div>
  </div>`;
}
function dessinerEchanges() {
  const miens = etat.echanges.filter((e) => e.de === moi || e.vers === moi);
  $('#liste-echanges').innerHTML = miens.length ? miens.map(htmlEchange).join('') : '<p class="petit">Aucune proposition en cours.</p>';
  const recus = miens.filter((e) => e.vers === moi);
  $('#badge-echanges').textContent = recus.length;
  $('#badge-echanges').classList.toggle('hidden', !recus.length);
  $('#btn-nouvel-echange').disabled = !moiJ() || moiJ().faillite || etat.phase !== 'jeu';
  // Nouvelle proposition reçue : on l'affiche directement
  for (const e of recus) {
    if (echangesVus.has(e.id)) continue;
    echangesVus.add(e.id);
    toast(`🤝 ${joueur(e.de).nom} te propose un échange !`);
    if (!modaleOuverte) ouvrirModale(() => {
      const encore = etat.echanges.find((x) => x.id === e.id);
      if (!encore) return fermerModale();
      $('#modale-contenu').innerHTML = '<h2>🤝 Proposition d\'échange</h2>' + htmlEchange(encore);
    });
  }
}
function clicEchange(ev) {
  const r = ev.target.closest('[data-rep]');
  if (r) { envoyer('repondreEchange', { echangeId: r.dataset.id, accepte: r.dataset.rep === '1' }); if ($('#modale-contenu').contains(r)) fermerModale(); return; }
  const a = ev.target.closest('[data-annuler]');
  if (a) envoyer('annulerEchange', { echangeId: a.dataset.annuler });
}
$('#liste-echanges').addEventListener('click', clicEchange);
$('#modale-contenu').addEventListener('click', clicEchange);

$('#btn-nouvel-echange').onclick = () => {
  const autres = etat.joueurs.filter((p) => !p.faillite && p.id !== moi);
  if (!autres.length) return;
  let cible = autres[0].id;
  modaleOuverte = null;
  $('#modale').classList.remove('hidden');
  const avecMaisons = (c) => c.groupe && etat.plateau.some((x) => x.groupe === c.groupe && etat.proprietes[x.i].maisons > 0);
  const listeProps = (id, nomChamp) => {
    const props = etat.plateau.filter((c) => etat.proprietes[c.i] && etat.proprietes[c.i].proprio === id);
    if (!props.length) return '<p class="petit">Aucune propriété</p>';
    return `<div class="selection-props">${props.map((c) => {
      const bloque = avecMaisons(c);
      return `<label class="${bloque ? 'desactive' : ''}"><input type="checkbox" name="${nomChamp}" value="${c.i}" ${bloque ? 'disabled' : ''}>
        <span class="pastille" style="background:${c.couleur || '#888'}"></span>${esc(c.nom)}${bloque ? ' (maisons)' : ''}${etat.proprietes[c.i].hypotheque ? ' 🏦' : ''}</label>`;
    }).join('')}</div>`;
  };
  const dessiner = () => {
    const m = moiJ(), autre = joueur(cible);
    $('#modale-contenu').innerHTML = `<h2>🤝 Proposer un échange</h2>
      <label class="champ">Avec qui ?
        <select id="ech-cible">${autres.map((p) => `<option value="${p.id}" ${p.id === cible ? 'selected' : ''}>${p.pion} ${esc(p.nom)}</option>`).join('')}</select>
      </label>
      <div class="champ">🎁 Tu donnes ${listeProps(moi, 'donne')}
        <input id="ech-donne-argent" type="number" min="0" max="${m.argent}" inputmode="numeric" placeholder="Argent que tu donnes (max ${argent(m.argent)})">
        ${m.cartesLiberation ? `<label class="petit"><input type="checkbox" id="ech-donne-carte"> + 1 carte 🔑 de libération</label>` : ''}
      </div>
      <div class="champ">🙏 Tu demandes ${listeProps(cible, 'recoit')}
        <input id="ech-recoit-argent" type="number" min="0" max="${autre.argent}" inputmode="numeric" placeholder="Argent que tu demandes (max ${argent(autre.argent)})">
        ${autre.cartesLiberation ? `<label class="petit"><input type="checkbox" id="ech-recoit-carte"> + 1 carte 🔑 de libération</label>` : ''}
      </div>
      <button id="ech-envoyer" class="btn rose gros">📨 Envoyer la proposition</button>`;
    $('#ech-cible').onchange = (e) => { cible = e.target.value; dessiner(); };
    $('#ech-envoyer').onclick = () => {
      const coches = (n) => $$(`input[name="${n}"]:checked`).map((x) => +x.value);
      envoyer('proposerEchange', {
        vers: cible,
        donne: { proprietes: coches('donne'), argent: +$('#ech-donne-argent').value || 0, cartes: $('#ech-donne-carte')?.checked ? 1 : 0 },
        recoit: { proprietes: coches('recoit'), argent: +$('#ech-recoit-argent').value || 0, cartes: $('#ech-recoit-carte')?.checked ? 1 : 0 },
      });
      fermerModale();
      ouvrirTiroir('echanges');
    };
  };
  dessiner();
};

// ---------------------------------------------------------------------
//  BARRE DU BAS : chat, journal, échanges (le panneau s'ouvre au clic)
// ---------------------------------------------------------------------
const TITRES = { chat: '💬 Chat', journal: '📜 Journal de la partie', echanges: '🤝 Échanges' };
let tiroirOuvert = null;
function ouvrirTiroir(nom) {
  if (tiroirOuvert === nom) nom = null; // re-cliquer ferme
  tiroirOuvert = nom;
  $('#tiroir').classList.toggle('hidden', !nom);
  for (const t of ['chat', 'journal', 'echanges']) {
    $('#tiroir-' + t).classList.toggle('hidden', t !== nom);
    $('#btn-' + t).classList.toggle('actif', t === nom);
  }
  if (!nom) return;
  $('#tiroir-titre').textContent = TITRES[nom];
  if (nom === 'chat') {
    nonLus = 0;
    $('#badge-chat').classList.add('hidden');
    $('#bulles').innerHTML = '';
    const c = $('#tiroir-chat'); c.scrollTop = c.scrollHeight;
  }
}
$('#btn-chat').onclick = () => ouvrirTiroir('chat');
$('#btn-journal').onclick = () => ouvrirTiroir('journal');
$('#btn-echanges').onclick = () => ouvrirTiroir('echanges');
$('#tiroir-fermer').onclick = () => ouvrirTiroir(null);
$('#bulles').onclick = () => ouvrirTiroir('chat');

let nonLus = 0;
function ajouterMessage(m, notifier = true) {
  const ligne = `<b style="--c:${m.couleur}">${m.pion} ${esc(m.de)} :</b> ${esc(m.texte)}`;
  const li = document.createElement('li');
  li.innerHTML = ligne;
  $('#chat').appendChild(li);
  const c = $('#tiroir-chat'); c.scrollTop = c.scrollHeight;
  if (!notifier || tiroirOuvert === 'chat') return;
  // Le message apparaît en bulle quelques secondes puis disparaît
  const b = document.createElement('div');
  b.className = 'bulle';
  b.innerHTML = ligne;
  $('#bulles').appendChild(b);
  setTimeout(() => b.remove(), 6000);
  while ($('#bulles').children.length > 4) $('#bulles').firstChild.remove();
  nonLus++;
  $('#badge-chat').textContent = nonLus;
  $('#badge-chat').classList.remove('hidden');
}
socket.on('chat', (m) => ajouterMessage(m));
$('#form-chat').onsubmit = (e) => {
  e.preventDefault();
  const t = $('#chat-texte').value.trim();
  if (t) socket.emit('chat', t);
  $('#chat-texte').value = '';
};

// ---------------------------------------------------------------------
//  FIN DE PARTIE
// ---------------------------------------------------------------------
function nouvellePartie() {
  sessionStorage.removeItem('monopoly-actuel');
  location.href = location.pathname;
}
function victoire() {
  const g = joueur(etat.gagnant);
  ouvrirModale(() => {
    $('#modale-contenu').innerHTML = `<div class="victoire"><div class="grand">${g.pion}</div>
      <h2>🏆 ${esc(g.nom)} a gagné !</h2><p class="petit">Fortune finale : ${argent(g.argent)}</p>
      <button class="btn rose gros" id="btn-rejouer2">🔁 Nouvelle partie</button></div>`;
    $('#btn-rejouer2').onclick = nouvellePartie;
  });
  confettis();
}
function confettis() {
  const cv = $('#confettis'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const couleurs = ['#ff3b9d', '#2ec5ff', '#ffd23f', '#2ee59d', '#9b5cff'];
  const bouts = Array.from({ length: 180 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height, v: 2 + Math.random() * 4, a: Math.random() * 6,
    va: (Math.random() - 0.5) * 0.3, c: couleurs[Math.floor(Math.random() * 5)], t: 6 + Math.random() * 8,
  }));
  const fin = Date.now() + 6000;
  (function anim() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const b of bouts) {
      b.y += b.v; b.a += b.va; b.x += Math.sin(b.a) * 1.5;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-b.t / 2, -b.t / 4, b.t, b.t / 2); ctx.restore();
    }
    if (Date.now() < fin) requestAnimationFrame(anim); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}

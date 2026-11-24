/* Interface du mode Branchement (session 2) */
const SYMBOLE = {
  no: `<svg class="symb" viewBox="0 0 60 22" aria-label="symbole contact NO"><path d="M2 14H18L38 4M42 14H58" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="18" cy="14" r="2.5" fill="currentColor"/><circle cx="42" cy="14" r="2.5" fill="currentColor"/></svg>`,
  nf: `<svg class="symb" viewBox="0 0 60 22" aria-label="symbole contact NF"><path d="M2 14H18L44 18M42 8V14H58" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="18" cy="14" r="2.5" fill="currentColor"/></svg>`,
};
const br = { sous: "missions", ordre: [], i: 0, resultats: [], essaye: false, fini: false,
  m: { capteur: "inductif", carte: "pnp", logique: "presence" }, sortie: null, conn: {}, sel: null, res: null, present: true };

function brFils() { return tousLesFils(FILS[br.m.capteur]); }
function brPret() { return brFils().every(f => br.conn[f.id]); }

function brNouveauBranchement() {
  br.conn = {}; br.sortie = null; br.res = null; br.present = true;
  br.sel = brFils()[0].id;
}

function brChoix(container, items, actuel, onPick) {
  container.innerHTML = "";
  items.forEach(it => container.append(bouton("chip", it.html, actuel === it.id, () => onPick(it.id))));
}

function rendreBranchGauche() {
  // Sous-mode
  brChoix($("#br-sous"), [
    { id: "missions", html: "🎯 Missions de branchement" },
    { id: "libre", html: "🛠️ Branchement libre" },
  ], br.sous, id => { if (id === br.sous) return; br.sous = id; if (id === "missions") brDemarrer(); else { br.m = { capteur: "inductif", carte: "pnp", logique: "presence" }; brNouveauBranchement(); brTout(); } });

  $("#br-carte-mission").classList.toggle("cache", br.sous !== "missions");
  $("#br-libre").classList.toggle("cache", br.sous !== "libre");

  if (br.sous === "missions") brRendreMission();
  else {
    const cc = $("#br-caps"); cc.innerHTML = "";
    CAPTEURS.forEach(c => cc.append(bouton("cap", `${icone(c.id)}${c.nom}`, br.m.capteur === c.id, () => { br.m.capteur = c.id; brNouveauBranchement(); brTout(); })));
    brChoix($("#br-cartes"), Object.entries(CARTES).map(([id, c]) => ({ id, html: c.label })), br.m.carte, id => { br.m.carte = id; br.res = null; brTout(); });
    brChoix($("#br-logiques"), LOGIQUES.map(l => ({ id: l.id, html: `${l.emoji} ${l.label}` })), br.m.logique, id => { br.m.logique = id; br.res = null; brTout(); });
  }

  // Type de sortie
  const def = FILS[br.m.capteur];
  const zone = $("#br-sortie");
  if (def.type === "transistor") {
    zone.innerHTML = `<div class="chips" id="br-sorties"></div>
      <p class="aide-p">PNP : la sortie <b>envoie du +24 V</b> quand le capteur détecte. NPN : la sortie <b>se relie au 0 V</b> quand le capteur détecte.</p>`;
    brChoix($("#br-sorties"), [{ id: "pnp", html: "Capteur PNP" }, { id: "npn", html: "Capteur NPN" }], br.sortie, id => { br.sortie = id; br.res = null; brTout(); });
  } else {
    zone.innerHTML = `<p class="aide-p">${def.type === "reed"
      ? "Un capteur reed 2 fils est un simple <b>contact</b> qui se ferme près d'un aimant : pas de PNP ni de NPN. On le branche <b>en série</b> avec l'entrée."
      : "Un fin de course a des <b>contacts secs</b> : pas de PNP ni de NPN. On choisit le bon contact et on le place entre l'alimentation et l'entrée."}</p>`
      + (def.type === "contact" ? `<div class="contacts-expl">
        <div><span class="symb-g">${SYMBOLE.no}</span><b>NO = normalement ouvert</b> (bornes 13-14)<br>Au repos, le courant ne passe pas. Il se <b>ferme</b> quand le levier est poussé.</div>
        <div><span class="symb-g">${SYMBOLE.nf}</span><b>NF = normalement fermé</b> (bornes 21-22)<br>Au repos, le courant passe. Il s'<b>ouvre</b> quand le levier est poussé.</div>
        <p class="aide-p" style="margin:6px 0 0">Truc : un chiffre qui finit par <b>3-4</b> = NO, un chiffre qui finit par <b>1-2</b> = NF (norme IEC).</p></div>` : "");
  }
  const c = CAPTEURS.find(x => x.id === br.m.capteur);
  $("#br-fiche").textContent = `📄 Fiche ${c.fiche} : ${c.nom}`;
  $("#br-fiche").onclick = () => ouvrirFiche(c.fiche);
}

function brRendreMission() {
  const carte = $("#br-carte-mission");
  if (br.fini) return;
  const m = MISSIONS_BR[br.ordre[br.i]];
  const c = CAPTEURS.find(x => x.id === m.capteur), l = LOGIQUES.find(x => x.id === m.logique);
  const pts = br.resultats.reduce((t, v) => t + (v === "vert" ? 2 : v === "jaune" ? 1 : 0), 0);
  carte.innerHTML = `<div class="entete"><span class="prog">Branchement ${br.i + 1} / ${br.ordre.length} · ${pts} pts</span>
    <div class="pts">${br.ordre.map((_, k) => `<span class="pt ${br.resultats[k] || ""} ${k === br.i ? "cur" : ""}"></span>`).join("")}</div></div>
    <h2>🔌 ${m.titre}</h2><p>${m.texte}</p>
    <div class="tags"><span class="tag">${c.nom}</span><span class="tag">⚙️ ${CARTES[m.carte].label}</span><span class="tag">${l.emoji} ${l.label}</span></div>
    <p style="font-size:14px;color:var(--muted);margin:10px 0 0">Bon branchement = 2 points · fonctionne mais pas optimal = 1 point · seul ton premier essai compte.</p>`;
}

function brDemarrer() {
  br.ordre = melanger(MISSIONS_BR.map((_, i) => i)); br.i = 0; br.resultats = []; br.fini = false;
  brChargerMission();
}
function brChargerMission() {
  const m = MISSIONS_BR[br.ordre[br.i]];
  br.m = { capteur: m.capteur, carte: m.carte, logique: m.logique }; br.essaye = false;
  brNouveauBranchement(); brTout();
}
function brSuivante() {
  if (br.i + 1 < br.ordre.length) { br.i++; brChargerMission(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  else brBilan();
}
function brBilan() {
  br.fini = true;
  const total = br.ordre.length * 2, p = br.resultats.reduce((t, v) => t + (v === "vert" ? 2 : v === "jaune" ? 1 : 0), 0);
  const msg = p / total >= .85 ? "Excellent! Tes branchements sont prêts pour l'atelier." : p / total >= .6 ? "Bon travail! Revois PNP/NPN et NO/NF là où tu as hésité." : "Continue! Relis la section Branchement des fiches, puis recommence.";
  $("#br-carte-mission").innerHTML = `<div class="bilan"><div class="prog" style="font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-weight:700;color:var(--muted)">BILAN DES BRANCHEMENTS</div>
   <div class="gros">${p} / ${total}</div><p>${msg}</p>
   <table style="width:100%;text-align:left;font-size:14px;border-collapse:collapse">${br.ordre.map((mi, k) => `<tr><td style="padding:4px;border-top:1px solid var(--line)"><span class="dot ${br.resultats[k]}"></span>${MISSIONS_BR[mi].titre}</td></tr>`).join("")}</table>
   <button class="go" style="margin-top:14px" id="br-recommencer">↻ Recommencer les branchements</button></div>`;
  $("#br-recommencer").onclick = brDemarrer;
  $("#tester").disabled = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Banc de câblage */
function rendreBoard() {
  const def = FILS[br.m.capteur];
  const etatSim = br.res && br.res.verdict !== "rouge" ? br.res.sim(br.present) : (br.res ? br.res.sim(br.present) : { i0: false, ai: null });
  const borne = b => {
    let extra = "";
    if (b.id === "i0") extra = `<span class="b-led ${etatSim.i0 ? "on" : ""}" title="DEL de l'entrée"></span>`;
    if (b.id === "ai0") { const ma = etatSim.ai; extra = `<span class="b-bar"><i style="width:${ma ? (ma - 4) / 16 * 100 : 0}%"></i></span><span class="b-ma">${ma ? ma.toString().replace(".", ",") + " mA" : "— mA"}</span>`; }
    return `<button class="borne ${b.cls}" data-b="${b.id}"><span class="bl">${b.label}</span><span class="bs">${b.sous}</span>${extra}</button>`;
  };
  const B = Object.fromEntries(BORNES.map(b => [b.id, b]));
  let h = `<div class="b-gauche">`;
  def.groupes.forEach(g => {
    h += `<div class="b-titre">${g.nom}${g.symbole ? SYMBOLE[g.symbole] : ""}</div>`;
    if (g.aide) h += `<div class="b-aide">${g.aide}</div>`;
    g.fils.forEach(f => {
      const t = br.conn[f.id];
      h += `<button class="b-fil ${br.sel === f.id ? "sel" : ""}" data-f="${f.id}"><span class="b-pin" style="background:${f.c}"></span>${f.label}<span class="b-dest">${t ? "→ " + NOM_BORNE[t] : "…"}</span></button>`;
    });
  });
  h += `</div><div class="b-droite">
    <div class="b-titre">Alimentation 24 V c.c.</div>${borne(B.p24)}${borne(B["0v"])}
    <div class="b-titre">Automate · ${CARTES[br.m.carte].label}</div>${borne(B.i0)}${borne(B.ai0)}
    <div class="b-titre">Fil inutilisé</div>${borne(B.iso)}
  </div><svg class="b-svg" aria-hidden="true"></svg>`;
  const board = $("#board");
  board.innerHTML = h;
  board.querySelectorAll(".b-fil").forEach(el => el.onclick = () => { br.sel = br.sel === el.dataset.f ? null : el.dataset.f; rendreBoard(); });
  board.querySelectorAll(".borne").forEach(el => el.onclick = () => {
    if (!br.sel) return;
    br.conn[br.sel] = el.dataset.b;
    const prochain = brFils().find(f => !br.conn[f.id]);
    br.sel = prochain ? prochain.id : null;
    if (br.res) { br.res = null; brResultatVide(); }
    rendreBoard(); brMajBouton();
  });
  requestAnimationFrame(dessinerFils);
}
function dessinerFils() {
  const board = $("#board"); if (!board || board.classList.contains("cache")) return;
  const svg = board.querySelector(".b-svg"); if (!svg) return;
  const R = board.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
  let g = "";
  brFils().forEach(f => {
    const t = br.conn[f.id]; if (!t) return;
    const a = board.querySelector(`[data-f="${f.id}"] .b-pin`).getBoundingClientRect();
    const b = board.querySelector(`[data-b="${t}"]`).getBoundingClientRect();
    const x1 = a.right - R.left + 2, y1 = a.top + a.height / 2 - R.top;
    const fil = board.querySelector(`[data-f="${f.id}"]`).getBoundingClientRect();
    const xs = fil.right - R.left, x2 = b.left - R.left, y2 = b.top + b.height / 2 - R.top;
    const d = `M${xs} ${y1} C${xs + 55} ${y1} ${x2 - 55} ${y2} ${x2} ${y2}`;
    const dash = t === "iso" ? `stroke-dasharray="6 5"` : "";
    g += `<path d="${d}" stroke="#0b1118" stroke-width="7" fill="none" opacity=".8" ${dash}/>`;
    g += `<path d="${d}" stroke="${f.c}" stroke-width="4" fill="none" ${dash}/>`;
    g += `<circle cx="${x2}" cy="${y2}" r="4" fill="#ffd27a"/>`;
  });
  svg.innerHTML = g;
}

function brMajBouton() {
  $("#tester").disabled = !brPret() || (br.sous === "missions" && br.fini);
  $("#tester").innerHTML = brPret() ? "⚡ Mettre sous tension" : `🔌 Branche tous les fils (${brFils().filter(f => br.conn[f.id]).length}/${brFils().length})`;
}
function brResultatVide() {
  lampes(null);
  const r = $("#resultat"); r.className = "resultat vide";
  r.innerHTML = "Clique sur un fil, puis sur la borne où il doit aller. Un fil inutilisé va sur <b>Isolé</b>.";
}
function brTout() { rendreBranchGauche(); rendreBoard(); brMajBouton(); if (!br.res) brResultatVide(); }

function testerBranch() {
  if (!brPret()) return;
  const res = evaluerBranchement(br.m, { sortie: br.sortie, conn: br.conn });
  br.res = res; br.present = true;
  const v = res.verdict;
  lampes(v);
  const c = CAPTEURS.find(x => x.id === br.m.capteur);
  let h = "";
  if (v === "vert") h += `<h3>✅ Branchement correct!</h3><ul>${res.bien.map(x => `<li>${x}</li>`).join("")}</ul>`;
  else if (v === "jaune") h += `<h3>⚠️ Ça fonctionne, mais ce n'est pas optimal</h3><ul>${res.att.map(x => `<li>${x}</li>`).join("")}</ul>`;
  else h += `<h3>❌ Ça ne fonctionne pas</h3><div class="sous">Ce qui cloche :</div><ul>${res.non.map(x => `<li>${x}</li>`).join("")}</ul>`;
  if (v !== "rouge") h += `<div class="sim"><button class="btn plein" id="br-sim"></button><span id="br-sim-txt"></span></div>`;
  const sol = solutionBranchement(br.m);
  const fils = brFils();
  h += `<div class="reco cache" id="br-sol">🔍 <b>Solution :</b>${sol.sortie ? ` commander un capteur <b>${sol.sortie.toUpperCase()}</b>, puis` : ""}<ul>${fils.map(f => `<li><b>${br.m.capteur === "barrage" ? (f.id.startsWith("e_") ? "Émetteur " : "Récepteur ") : ""}${f.label}</b> → ${NOM_BORNE[sol.conn[f.id]]}</li>`).join("")}</ul><button class="btn" id="br-appl">Appliquer sur le banc</button></div>`;
  h += `<div class="actions">`;
  if (v !== "vert") h += `<button class="btn" id="br-voir">🔍 Voir la solution</button>`;
  h += `<button class="btn" data-fiche="${c.fiche}">📄 Fiche ${c.fiche} : ${c.nom}</button>`;
  if (br.sous === "missions") h += `<button class="btn plein" id="br-suiv">${br.i + 1 < br.ordre.length ? "Branchement suivant →" : "Voir mon bilan →"}</button>`;
  h += `</div>`;
  const box = $("#resultat"); box.className = "resultat " + v; box.innerHTML = h;
  box.querySelectorAll("[data-fiche]").forEach(b => b.onclick = () => ouvrirFiche(+b.dataset.fiche));
  const bv = $("#br-voir"); if (bv) bv.onclick = () => { $("#br-sol").classList.remove("cache"); bv.remove(); };
  $("#br-appl").onclick = () => { br.conn = { ...sol.conn }; br.sortie = sol.sortie; br.sel = null; br.res = null; rendreBranchGauche(); rendreBoard(); brMajBouton(); brResultatVide(); };
  const bs = $("#br-sim");
  const majSim = () => {
    const s = res.sim(br.present);
    const objet = br.m.logique === "securite" ? "Levier poussé par le chariot" : br.m.logique === "mesure" ? "Objet proche du capteur" : "Objet devant le capteur";
    bs.textContent = `${br.present ? "🟧" : "⬜"} ${objet} : ${br.present ? "OUI" : "NON"}`;
    $("#br-sim-txt").innerHTML = ` → I0.0 <b>${s.i0 ? "ALLUMÉE" : "éteinte"}</b>${s.ai ? ` · AI0 = <b>${s.ai.toString().replace(".", ",")} mA</b>` : ""}`;
    rendreBoard();
  };
  if (bs) { bs.onclick = () => { br.present = !br.present; majSim(); }; majSim(); } else rendreBoard();
  if (br.sous === "missions") {
    if (!br.essaye) { br.resultats[br.i] = v; br.essaye = true; brRendreMission(); }
    $("#br-suiv").onclick = brSuivante;
  }
}

window.addEventListener("resize", () => requestAnimationFrame(dessinerFils));

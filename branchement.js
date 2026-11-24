/* Session 2 — Branchement des capteurs (PNP / NPN, NO / NF, analogique) */

const BORNES = [
  { id: "p24", label: "+24 V", sous: "Alimentation", cls: "b-plus" },
  { id: "0v", label: "0 V", sous: "Alimentation", cls: "b-moins" },
  { id: "i0", label: "I0.0", sous: "Entrée TOR", cls: "b-in" },
  { id: "ai0", label: "AI0", sous: "Entrée 4-20 mA", cls: "b-ai" },
  { id: "iso", label: "Isolé", sous: "Fil non utilisé", cls: "b-iso" },
];
const NOM_BORNE = { p24: "+24 V", "0v": "0 V", i0: "I0.0", ai0: "AI0", iso: "isolé" };
const COUL = { brun: "#8b5a2b", bleu: "#1f5fbf", noir: "#151515", blanc: "#f4f4f4", gris: "#a7b0ba" };

function fil(couleur, role, id, label) { return { id: id || couleur, c: COUL[couleur], label: label || couleur.toUpperCase(), role }; }

const FILS = {
  inductif:  { type: "transistor", groupes: [{ nom: "Capteur inductif (3 fils)", fils: [fil("brun", "plus"), fil("bleu", "moins"), fil("noir", "tor")] }] },
  capacitif: { type: "transistor", groupes: [{ nom: "Capteur capacitif (4 fils)", fils: [fil("brun", "plus"), fil("bleu", "moins"), fil("noir", "tor"), fil("blanc", "nf")] }] },
  barrage:   { type: "transistor", groupes: [
    { nom: "Émetteur (2 fils)", fils: [fil("brun", "e_plus", "e_brun"), fil("bleu", "e_moins", "e_bleu")] },
    { nom: "Récepteur (3 fils)", fils: [fil("brun", "plus", "r_brun"), fil("bleu", "moins", "r_bleu"), fil("noir", "tor", "r_noir")] }] },
  reflex:    { type: "transistor", groupes: [{ nom: "Photo. réflex (3 fils)", fils: [fil("brun", "plus"), fil("bleu", "moins"), fil("noir", "tor")] }] },
  diffus:    { type: "transistor", groupes: [{ nom: "Photo. diffus (3 fils)", fils: [fil("brun", "plus"), fil("bleu", "moins"), fil("noir", "tor")] }] },
  ultrason:  { type: "transistor", groupes: [{ nom: "Ultrasonique (4 fils)", fils: [fil("brun", "plus"), fil("bleu", "moins"), fil("noir", "tor"), fil("blanc", "ana")] }] },
  laser:     { type: "transistor", groupes: [{ nom: "Laser de distance (4 fils)", fils: [fil("brun", "plus"), fil("bleu", "moins"), fil("noir", "tor"), fil("blanc", "ana")] }] },
  magnetique:{ type: "reed", groupes: [{ nom: "Capteur reed (2 fils)", fils: [fil("brun", "rplus"), fil("bleu", "rmoins")] }] },
  findecourse:{ type: "contact", groupes: [
    { nom: "Contact NO (13-14)", symbole: "no", aide: "Normalement <b>ouvert</b> : il se <b>FERME</b> quand le levier est poussé.",
      fils: [fil("gris", "c13", "c13", "Borne 13"), fil("gris", "c14", "c14", "Borne 14")] },
    { nom: "Contact NF (21-22)", symbole: "nf", aide: "Normalement <b>fermé</b> : il s'<b>OUVRE</b> quand le levier est poussé.",
      fils: [fil("gris", "c21", "c21", "Borne 21"), fil("gris", "c22", "c22", "Borne 22")] }] },
};

const LOGIQUES = [
  { id: "presence", label: "Signal quand l'objet est là", emoji: "✅" },
  { id: "absence", label: "Signal quand l'objet est absent", emoji: "🚫" },
  { id: "securite", label: "Limite de sécurité", emoji: "🛑" },
  { id: "mesure", label: "Mesurer la distance", emoji: "📏" },
];
const CARTES = {
  pnp: { court: "PNP", label: "Carte d'entrées PNP (commun au 0 V)" },
  npn: { court: "NPN", label: "Carte d'entrées NPN (commun au +24 V)" },
};

function tousLesFils(def) { return def.groupes.flatMap(g => g.fils); }

/* m = { capteur, carte, logique }   choix = { sortie: 'pnp'|'npn'|null, conn: { filId: borne } } */
function evaluerBranchement(m, choix) {
  const def = FILS[m.capteur];
  const fils = tousLesFils(def);
  const has = r => fils.some(f => f.role === r);
  const T = r => { const f = fils.find(x => x.role === r); return f ? (choix.conn[f.id] || "iso") : null; };
  const label = r => fils.find(x => x.role === r).label;
  const actif = m.carte === "pnp" ? "p24" : "0v";
  const commun = m.carte === "pnp" ? "0v" : "p24";
  const non = [], att = [], bien = [];
  let toujoursActif = false;
  const mesure = m.logique === "mesure";

  const MSG_COMMUN = m.carte === "pnp"
    ? "Avec une carte PNP (commun au 0 V), le contact doit amener le +24 V à l'entrée. Relié au 0 V, l'entrée ne verra jamais de tension."
    : "Avec une carte NPN (commun au +24 V), le contact doit relier l'entrée au 0 V. Relié au +24 V, aucun courant ne circule dans l'entrée.";

  function alim(tp, tm, qui) {
    if (tp === "p24" && tm === "0v") return true;
    if (tp === "0v" && tm === "p24") { non.push(`${qui} : alimentation inversée. Le brun (+V) est sur le 0 V et le bleu sur le +24 V. Le capteur ne s'allume pas et peut être endommagé.`); return false; }
    if (tp !== "p24") non.push(`${qui} : le fil brun (+V) doit aller au +24 V. Sur « ${NOM_BORNE[tp]} », le capteur n'est pas alimenté.`);
    if (tm !== "0v") non.push(`${qui} : le fil bleu (0 V) doit aller au 0 V. Sur « ${NOM_BORNE[tm]} », le circuit d'alimentation n'est pas fermé.`);
    return false;
  }

  if (def.type === "transistor") {
    if (has("e_plus")) alim(T("e_plus"), T("e_moins"), "Émetteur");
    alim(T("plus"), T("moins"), has("e_plus") ? "Récepteur" : "Capteur");

    // Type de sortie
    if (!choix.sortie) non.push("Choisis le type de sortie du capteur (PNP ou NPN).");
    else if (choix.sortie !== m.carte) {
      non.push(choix.sortie === "pnp"
        ? "Un capteur PNP envoie du +24 V sur sa sortie, mais ta carte NPN (commun au +24 V) attend un 0 V. Aucun courant ne circule : l'entrée ne s'active jamais."
        : "Un capteur NPN relie sa sortie au 0 V, mais ta carte PNP (commun au 0 V) attend un +24 V. Aucun courant ne circule : l'entrée ne s'active jamais.");
    }

    // Sorties tout ou rien
    const sortiesTOR = ["tor", "nf"].filter(has);
    sortiesTOR.forEach(r => {
      const t = T(r);
      if (t === "p24" || t === "0v") non.push(`Le fil ${label(r).toLowerCase()} est une sortie : branché directement sur le ${NOM_BORNE[t]}, il ne transmet rien à l'automate et le transistor de sortie risque d'être court-circuité.`);
      if (t === "ai0") non.push(`Le fil ${label(r).toLowerCase()} est une sortie tout ou rien (0 ou 24 V) : il va sur une entrée TOR (I0.0), pas sur l'entrée analogique.`);
    });

    if (mesure) {
      if (!has("ana")) non.push("Ce capteur a seulement une sortie tout ou rien : il ne peut pas donner une mesure de distance.");
      else {
        const ta = T("ana");
        if (ta === "ai0") bien.push("Le signal 4-20 mA (blanc) arrive sur l'entrée analogique AI0 : l'automate lit la distance en continu.");
        else if (ta === "i0") non.push("Le fil blanc donne un signal 4-20 mA. Une entrée TOR (I0.0) lit seulement ON/OFF : la mesure doit aller sur l'entrée analogique AI0.");
        else if (ta === "iso") non.push("Le fil blanc (signal de mesure) n'est pas branché : l'automate ne connaît pas la distance.");
        else non.push(`Le fil blanc (4-20 mA) branché sur le ${NOM_BORNE[ta]} : court-circuit de la sortie analogique.`);
      }
    } else {
      const voulu = (m.logique === "absence" && has("nf")) ? "nf" : "tor";
      const autre = voulu === "nf" ? "tor" : (has("nf") ? "nf" : null);
      const tv = T(voulu), ta = autre ? T(autre) : "iso";
      if (tv === "i0" && ta === "i0") { non.push("Les sorties NO (noir) et NF (blanc) sont toutes deux sur I0.0 : l'une est toujours active, donc l'entrée reste allumée en permanence."); toujoursActif = true; }
      else if (tv === "i0") bien.push(voulu === "nf"
        ? "La sortie NF (blanc) est active quand rien n'est détecté : I0.0 s'allume quand l'objet est absent."
        : "La sortie (noir) est active quand l'objet est détecté : I0.0 s'allume quand l'objet est là.");
      else if (ta === "i0") att.push(autre === "nf"
        ? "Logique inversée : le blanc est la sortie NF. I0.0 s'allume quand l'objet est ABSENT. Il faudrait utiliser le noir (NO), ou inverser dans le programme."
        : "Logique inversée : le noir est la sortie NO. I0.0 s'allume quand l'objet est LÀ. Pour un signal à l'absence, il faut le blanc (NF), ou inverser dans le programme.");
      else if (tv === "iso" && non.length === 0) non.push("La sortie du capteur n'est branchée nulle part : l'automate ne reçoit aucun signal.");
      if (m.logique === "absence" && !has("nf") && tv === "i0") att.push("Ce capteur a seulement une sortie NO : I0.0 s'allume quand l'objet est là. Pour un signal à l'absence, il faut inverser dans le programme ou commander un modèle NF.");
      if (has("ana")) {
        const t = T("ana");
        if (t === "i0") att.push("Le fil blanc (4-20 mA) sur une entrée TOR ne sert à rien ici : laisse-le isolé, ou branche-le sur AI0.");
        else if (t === "p24" || t === "0v") non.push(`Le fil blanc (4-20 mA) branché sur le ${NOM_BORNE[t]} : court-circuit de la sortie analogique.`);
      }
      if (m.logique === "securite") att.push("Pour une limite de sécurité, on préfère un fin de course avec contact NF à ouverture positive : un capteur électronique peut tomber en panne sans que l'automate le sache.");
    }
  }

  if (def.type === "reed") {
    const tb = T("rplus"), tl = T("rmoins"), s = [tb, tl];
    if (s.includes("p24") && s.includes("0v")) non.push("Court-circuit! Quand le reed se ferme, il relie directement le +24 V au 0 V : le fusible saute ou le contact se soude. Un reed se branche EN SÉRIE avec l'entrée.");
    else if (s.includes("ai0")) non.push("Un reed est un simple contact ouvert/fermé : il va sur une entrée TOR, pas sur l'entrée analogique.");
    else if (s.includes("iso")) non.push("Un des deux fils n'est pas branché : le circuit reste ouvert, l'entrée ne s'active jamais.");
    else if (tb === tl) non.push("Les deux fils sont sur la même borne : le contact ne relie rien.");
    else if (s.includes("i0") && s.includes(actif)) {
      const bonnePol = m.carte === "pnp" ? tb === "p24" : tl === "0v";
      if (bonnePol) bien.push(`Le reed est en série entre le ${NOM_BORNE[actif]} et I0.0 : quand l'aimant du piston passe, le contact se ferme et l'entrée s'active.`);
      else att.push("Le contact fonctionne, mais la DEL du reed est polarisée : elle restera éteinte. Le brun va du côté positif (+).");
    } else if (s.includes("i0") && s.includes(commun)) non.push(MSG_COMMUN);
    else non.push("Le reed doit être placé en série entre l'alimentation et l'entrée I0.0.");
    if (choix.sortie && non.length === 0) {} // pas de PNP/NPN pour un reed
    if (m.logique === "absence" && non.length === 0) att.push("Le reed se ferme quand l'aimant est là : pour un signal à l'absence, il faut inverser dans le programme.");
    if (mesure) non.push("Un reed donne seulement OUI/NON : il ne mesure pas une distance.");
  }

  if (def.type === "contact") {
    const etatPaire = (a, b) => {
      const s = [T(a), T(b)];
      if (s[0] === "iso" && s[1] === "iso") return "iso";
      if (s.includes("p24") && s.includes("0v")) return "court";
      if (s.includes("ai0")) return "ai";
      if (s.includes("iso")) return "ouvert";
      if (s[0] === s[1]) return "meme";
      if (s.includes("i0") && s.includes(actif)) return "ok";
      if (s.includes("i0") && s.includes(commun)) return "commun";
      return "autre";
    };
    const NO = etatPaire("c13", "c14"), NF = etatPaire("c21", "c22");
    const nomP = { NO: "NO (13-14)", NF: "NF (21-22)" };
    [["NO", NO], ["NF", NF]].forEach(([n, e]) => {
      if (e === "court") non.push(`Court-circuit! Le contact ${nomP[n]} relie le +24 V directement au 0 V : le fusible saute dès qu'il se ferme.`);
      if (e === "ai") non.push(`Le contact ${nomP[n]} est tout ou rien : il va sur l'entrée TOR I0.0, pas sur l'entrée analogique.`);
      if (e === "ouvert") non.push(`Le contact ${nomP[n]} n'a qu'une seule borne branchée : le circuit reste ouvert.`);
      if (e === "meme") non.push(`Les deux bornes du contact ${nomP[n]} sont sur la même borne : le contact ne relie rien.`);
      if (e === "commun") non.push(MSG_COMMUN);
      if (e === "autre") non.push(`Le contact ${nomP[n]} doit être placé entre le ${NOM_BORNE[actif]} et l'entrée I0.0.`);
    });
    if (mesure) non.push("Un fin de course donne seulement OUI/NON : il ne mesure pas une distance.");
    if (non.length === 0) {
      const veutNF = m.logique === "securite" || m.logique === "absence";
      const v = veutNF ? NF : NO, a = veutNF ? NO : NF;
      if (v === "ok" && a === "ok") { non.push("Les deux contacts (NO et NF) sont sur I0.0 : l'un des deux est toujours fermé, l'entrée reste allumée en permanence."); toujoursActif = true; }
      else if (v === "ok") bien.push(veutNF
        ? (m.logique === "securite"
          ? "Le contact NF (21-22) est fermé en temps normal : I0.0 est allumée. Si le chariot pousse le levier OU si un fil se coupe, I0.0 tombe et la machine s'arrête. C'est la sécurité positive."
          : "Le contact NF (21-22) est fermé au repos : I0.0 est allumée quand rien ne touche le levier.")
        : "Le contact NO (13-14) se ferme quand l'objet pousse le levier : I0.0 s'allume quand l'objet est là.");
      else if (a === "ok") {
        if (m.logique === "securite") non.push("Pour une sécurité, on utilise le contact NF (21-22). Avec le NO, un fil coupé passe inaperçu : la machine ne s'arrêterait jamais. Dangereux!");
        else att.push(veutNF
          ? "Logique inversée : le NO (13-14) allume I0.0 quand l'objet est LÀ. Pour un signal à l'absence, il faut le NF (21-22)."
          : "Logique inversée : le NF (21-22) allume I0.0 quand rien ne touche le levier. Il faudrait le NO (13-14), ou inverser dans le programme.");
      } else non.push("Aucun contact n'est branché entre l'alimentation et I0.0.");
    }
  }

  const verdict = non.length ? "rouge" : att.length ? "jaune" : "vert";

  // Simulation de l'entrée
  function sim(present) {
    if (verdict === "rouge") return { i0: toujoursActif, ai: null };
    let i0 = false;
    if (def.type === "transistor") {
      if (T("tor") === "i0") i0 = present;
      if (has("nf") && T("nf") === "i0") i0 = !present;
    } else if (def.type === "reed") i0 = present;
    else {
      if (T("c13") !== "iso" && T("c14") !== "iso") i0 = present;
      if (T("c21") !== "iso" && T("c22") !== "iso") i0 = !present;
    }
    const ai = has("ana") && T("ana") === "ai0" ? (present ? 9.2 : 18.4) : null;
    return { i0, ai };
  }
  return { verdict, non, att, bien, sim };
}

function solutionBranchement(m) {
  const def = FILS[m.capteur], conn = {};
  const actif = m.carte === "pnp" ? "p24" : "0v";
  const veutNF = m.logique === "securite" || m.logique === "absence";
  tousLesFils(def).forEach(f => {
    let b = "iso";
    switch (f.role) {
      case "plus": case "e_plus": b = "p24"; break;
      case "moins": case "e_moins": b = "0v"; break;
      case "tor": b = m.logique === "mesure" ? "iso" : (m.logique === "absence" && def.groupes[0].fils.some(x => x.role === "nf") ? "iso" : "i0"); break;
      case "nf": b = m.logique === "absence" ? "i0" : "iso"; break;
      case "ana": b = m.logique === "mesure" ? "ai0" : "iso"; break;
      case "rplus": b = m.carte === "pnp" ? "p24" : "i0"; break;
      case "rmoins": b = m.carte === "pnp" ? "i0" : "0v"; break;
      case "c13": b = veutNF ? "iso" : actif; break;
      case "c14": b = veutNF ? "iso" : "i0"; break;
      case "c21": b = veutNF ? actif : "iso"; break;
      case "c22": b = veutNF ? "i0" : "iso"; break;
    }
    conn[f.id] = b;
  });
  return { sortie: def.type === "transistor" ? m.carte : null, conn };
}

const MISSIONS_BR = [
  { titre: "Compter les pièces d'acier", capteur: "inductif", carte: "pnp", logique: "presence", texte: "La machine-outil a une carte d'entrées PNP (commun des entrées au 0 V). Branche le capteur inductif pour que I0.0 s'allume quand une pièce passe." },
  { titre: "Une vieille machine", capteur: "inductif", carte: "npn", logique: "presence", texte: "Cette machine a une carte d'entrées NPN (commun au +24 V). Quel capteur inductif faut-il commander, et comment le brancher?" },
  { titre: "Trémie pleine", capteur: "capacitif", carte: "pnp", logique: "presence", texte: "Le capacitif 4 fils détecte les granules à travers la paroi. I0.0 doit s'allumer quand la trémie est PLEINE." },
  { titre: "Alarme réservoir vide", capteur: "capacitif", carte: "pnp", logique: "absence", texte: "Le capacitif 4 fils surveille le niveau d'eau. I0.0 doit s'allumer quand il n'y a PLUS d'eau devant le capteur." },
  { titre: "Boîtes sur convoyeur", capteur: "diffus", carte: "npn", logique: "presence", texte: "Le convoyeur est commandé par un automate avec des entrées NPN (commun au +24 V). Branche le photoélectrique diffus." },
  { titre: "Palettes au quai", capteur: "reflex", carte: "pnp", logique: "presence", texte: "Un réflex détecte les palettes. L'automate a des entrées PNP (commun au 0 V)." },
  { titre: "Sacs de farine", capteur: "barrage", carte: "pnp", logique: "presence", texte: "Branche l'émetteur ET le récepteur du barrage. Carte d'entrées PNP (commun au 0 V)." },
  { titre: "Vérin sorti", capteur: "magnetique", carte: "pnp", logique: "presence", texte: "Un capteur reed 2 fils est glissé dans la rainure d'un vérin. La carte d'entrées est PNP (commun au 0 V) : I0.0 doit s'allumer quand le piston est devant le capteur." },
  { titre: "Vérin sur vieille machine", capteur: "magnetique", carte: "npn", logique: "presence", texte: "Un capteur reed 2 fils est glissé dans la rainure d'un vérin. Cette vieille machine a une carte d'entrées NPN (commun au +24 V) : I0.0 doit s'allumer quand le piston est devant le capteur." },
  { titre: "Niveau de la cuve", capteur: "ultrason", carte: "pnp", logique: "mesure", texte: "L'ultrasonique doit donner la hauteur de l'eau en continu à l'automate (carte PNP, commun au 0 V)." },
  { titre: "Contrôle de hauteur", capteur: "laser", carte: "pnp", logique: "mesure", texte: "Le laser doit envoyer la hauteur exacte de la pièce à l'automate (carte PNP, commun au 0 V)." },
  { titre: "Chariot en position", capteur: "findecourse", carte: "pnp", logique: "presence", texte: "Un fin de course détecte l'arrivée d'un chariot : le chariot pousse le levier quand il arrive en position. I0.0 doit s'allumer à son arrivée. Carte PNP (commun au 0 V)." },
  { titre: "Limite de sécurité", capteur: "findecourse", carte: "pnp", logique: "securite", texte: "Un fin de course sert de limite de sécurité à un chariot (carte PNP, commun au 0 V). La machine doit s'arrêter si le levier est poussé, MAIS AUSSI si un fil se coupe." },
];

if (typeof module !== "undefined") module.exports = { FILS, BORNES, MISSIONS_BR, evaluerBranchement, solutionBranchement, tousLesFils };

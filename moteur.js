/* Moteur de décision — Jeu « Choisis le bon capteur »
   Données tirées des fiches 1 à 9. */

const DISTANCES = [
  { v: 0, label: "Contact" },
  { v: 3, label: "3 mm" },
  { v: 15, label: "15 mm" },
  { v: 35, label: "35 mm" },
  { v: 150, label: "15 cm" },
  { v: 600, label: "60 cm" },
  { v: 1500, label: "1,5 m" },
  { v: 3000, label: "3 m" },
  { v: 8000, label: "8 m" },
  { v: 25000, label: "25 m" },
];

const ENVIRONNEMENTS = [
  { id: "propre", label: "Atelier propre", emoji: "✨" },
  { id: "poussiere", label: "Poussière, farine, bran de scie", emoji: "🌫️" },
  { id: "huile", label: "Huile, eau, lavage", emoji: "💦" },
  { id: "vapeur", label: "Vapeur, condensation", emoji: "♨️" },
];

const BESOINS = [
  { id: "presence", label: "Présence (OUI / NON)", emoji: "✅" },
  { id: "mesure", label: "Mesurer une distance", emoji: "📏" },
  { id: "precise", label: "Mesurer au 0,1 mm", emoji: "🎯" },
  { id: "securite", label: "Limite de sécurité", emoji: "🛑" },
];

const MATERIAUX = [
  { id: "acier", label: "Pièce d'acier", emoji: "🔩" },
  { id: "alu", label: "Canette d'aluminium", emoji: "🥫" },
  { id: "bois", label: "Bloc de bois", emoji: "🪵" },
  { id: "carton", label: "Boîte de carton", emoji: "📦" },
  { id: "plastique", label: "Plastique opaque", emoji: "🧴" },
  { id: "noir", label: "Objet noir foncé", emoji: "⬛" },
  { id: "verre", label: "Verre transparent", emoji: "🍾" },
  { id: "liquide", label: "Eau dans un réservoir", emoji: "💧" },
  { id: "granules", label: "Granules (trémie)", emoji: "🫘" },
  { id: "aimant", label: "Piston aimanté (vérin)", emoji: "🧲" },
  { id: "mousse", label: "Mousse, tissu", emoji: "🧽" },
  { id: "papier", label: "Feuille ou objet très léger", emoji: "📄" },
];

const NON_METAL = "Le champ électromagnétique réagit seulement aux métaux : ce matériau est invisible pour lui.";
const VERIN = "Le piston est caché dans le tube du vérin : ce capteur ne peut pas voir sa position.";

const CAPTEURS = [
  {
    id: "inductif", nom: "Inductif", fiche: 1, min: 1, max: 40, prix: 1,
    resume: "Métaux seulement, très courte distance, très robuste.",
    mat: {
      acier: ["oui"],
      alu: ["oui"],
      bois: ["non", NON_METAL], carton: ["non", NON_METAL], plastique: ["non", NON_METAL],
      noir: ["non", "Il ne détecte que le métal. Un objet noir en plastique ou en caoutchouc lui est invisible."],
      verre: ["non", NON_METAL],
      liquide: ["non", "L'eau n'est pas un métal : l'inductif ne la voit pas, encore moins à travers une paroi de plastique."],
      granules: ["non", NON_METAL],
      aimant: ["non", VERIN + " Un aimant seul n'est pas détecté par un inductif."],
      mousse: ["non", NON_METAL], papier: ["non", NON_METAL],
    },
    facteur: { alu: [0.4, "l'aluminium et le cuivre sont détectés 2 à 3 fois moins loin que l'acier"] },
    env: {},
  },
  {
    id: "capacitif", nom: "Capacitif", fiche: 2, min: 1, max: 30, prix: 2,
    resume: "Presque tous les matériaux, même à travers une paroi. Courte portée.",
    mat: {
      acier: ["oui"], alu: ["oui"], bois: ["oui"], carton: ["oui"], plastique: ["oui"], noir: ["oui"],
      verre: ["oui"], liquide: ["oui"], granules: ["oui"],
      aimant: ["non", "Il détecterait le tube du vérin en permanence, peu importe où est le piston."],
      mousse: ["att", "La mousse est surtout de l'air : signal très faible, réglage de sensibilité délicat."],
      papier: ["att", "Un objet aussi mince et léger donne un signal très faible : détection peu fiable."],
    },
    bonus: { liquide: [-1, "il voit le contenu à travers la paroi, sans la percer"], granules: [-1, "il voit le contenu à travers la paroi, sans la percer"] },
    env: {
      poussiere: "La poussière qui s'accumule sur la face peut le déclencher : nettoyage ou réglage de sensibilité requis.",
      huile: "Un film d'eau ou d'huile sur la face peut être détecté comme si c'était un objet.",
      vapeur: "Sensible à l'humidité et à la condensation sur la face.",
    },
  },
  {
    id: "barrage", nom: "Photo. en barrage", fiche: 3, min: 50, max: 50000, prix: 3,
    resume: "Émetteur + récepteur face à face. La plus grande portée.",
    extra: [0.5, "deux boîtiers à installer, aligner et câbler"],
    mat: {
      acier: ["oui"], alu: ["oui"], bois: ["oui"], carton: ["oui"], plastique: ["oui"], noir: ["oui"],
      verre: ["non", "Le faisceau traverse le verre transparent : il n'est presque pas coupé, donc rien n'est détecté."],
      liquide: ["non", "On ne fait pas passer un faisceau à travers un réservoir fermé pour lire un niveau."],
      granules: ["att", "Possible en travers de la trémie, mais il faut percer deux ouvertures et garder les lentilles propres."],
      aimant: ["non", VERIN],
      mousse: ["oui"], papier: ["oui"],
    },
    env: {
      huile: "Les éclaboussures sur les lentilles affaiblissent le faisceau.",
      vapeur: "La vapeur diffuse le faisceau et peut couper la détection.",
    },
  },
  {
    id: "reflex", nom: "Photo. réflex", fiche: 4, min: 100, max: 10000, prix: 2,
    resume: "Le faisceau revient d'un réflecteur. Un seul boîtier à câbler.",
    mat: {
      acier: ["oui"],
      alu: ["att", "Une canette brillante renvoie la lumière comme le réflecteur : le capteur peut ne pas la voir. Il faudrait un modèle réflex polarisé."],
      bois: ["oui"], carton: ["oui"], plastique: ["oui"], noir: ["oui"],
      verre: ["att", "Le transparent coupe très peu le faisceau : il faut un modèle spécial pour objets transparents."],
      liquide: ["non", "On ne lit pas un niveau dans un réservoir fermé avec un faisceau et un réflecteur."],
      granules: ["att", "Possible en travers de la trémie, mais le réflecteur se salit vite."],
      aimant: ["non", VERIN],
      mousse: ["oui"], papier: ["oui"],
    },
    env: {
      poussiere: "Le réflecteur et la lentille doivent rester propres : la poussière coupe le retour du faisceau.",
      huile: "Les éclaboussures sur la lentille ou le réflecteur affaiblissent le retour.",
      vapeur: "La vapeur diffuse le faisceau aller-retour.",
    },
  },
  {
    id: "diffus", nom: "Photo. diffus", fiche: 5, min: 10, max: 2000, prix: 2,
    resume: "L'objet lui-même renvoie la lumière. Installation rapide.",
    mat: {
      acier: ["oui"],
      alu: ["att", "Une surface brillante renvoie la lumière dans tous les sens : détection instable selon l'angle."],
      bois: ["oui"], carton: ["oui"], plastique: ["oui"],
      noir: ["oui"],
      verre: ["att", "Le transparent renvoie très peu de lumière : détection peu fiable."],
      liquide: ["non", "Il ne voit pas à travers la paroi d'un réservoir."],
      granules: ["att", "Possible, mais la poussière des granules salit la lentille."],
      aimant: ["non", VERIN],
      mousse: ["oui"], papier: ["oui"],
    },
    facteur: { noir: [0.65, "un objet noir renvoie moins de lumière (environ 35 % de portée en moins)"] },
    env: {
      poussiere: "Sensible à la poussière sur la lentille : la portée diminue.",
      huile: "Les éclaboussures sur la lentille réduisent la portée.",
      vapeur: "La vapeur diffuse la lumière et peut déclencher le capteur.",
    },
  },
  {
    id: "ultrason", nom: "Ultrasonique", fiche: 6, min: 30, max: 6000, prix: 3,
    resume: "Écho sonore : couleur et transparence sans importance. Mesure possible.",
    mesure: "oui", precise: ["att", "L'ultrasonique mesure, mais il est moins précis qu'un laser : il n'atteindra pas 0,1 mm de façon fiable."],
    lent: "plus lent qu'un capteur photoélectrique ou inductif",
    surdim: "plus cher ($$$) qu'un simple capteur tout ou rien, pour seulement répondre OUI/NON",
    mat: {
      acier: ["oui"], alu: ["oui"], bois: ["oui"], carton: ["oui"], plastique: ["oui"], noir: ["oui"],
      verre: ["oui"], liquide: ["oui"], granules: ["oui"],
      aimant: ["non", VERIN],
      mousse: ["non", "La mousse et le tissu absorbent le son : l'écho ne revient jamais au capteur."],
      papier: ["att", "Une feuille mince renvoie un écho faible et instable."],
    },
    env: { vapeur: "La vapeur et la chaleur changent la vitesse du son : la mesure devient moins fiable." },
  },
  {
    id: "magnetique", nom: "Magnétique", fiche: 7, min: 0, max: 10, prix: 1,
    resume: "Détecte un aimant, comme le piston d'un vérin.",
    mat: {
      aimant: ["oui"],
      acier: ["non", "Il réagit seulement à un aimant : une pièce d'acier ordinaire ne suffit pas."],
    },
    defautMat: "Il réagit seulement à un aimant : ce matériau ne crée aucun champ magnétique.",
    bonus: { aimant: [-1, "il détecte le piston à travers le tube, sans pièce ajoutée"] },
    env: {},
  },
  {
    id: "findecourse", nom: "Fin de course", fiche: 8, min: 0, max: 150, prix: 1, contact: true,
    resume: "L'interrupteur est dans le boîtier. Il s'active quand l'objet entre en contact avec son bras (jusqu'à 6 po) ou sa tige à ressort.",
    mat: {
      acier: ["oui"], alu: ["oui"], bois: ["oui"], carton: ["oui"], plastique: ["oui"], noir: ["oui"],
      verre: ["att", "Le verre est fragile : au contact du bras, la bouteille peut s'abîmer ou basculer. Un capteur sans contact est le bon choix.", "jaune"],
      liquide: ["non", "Un liquide ne peut pas pousser le bras : il n'y a pas de contact solide pour activer l'interrupteur."],
      granules: ["non", "Des granules ne poussent pas le bras de façon fiable : le contact n'active pas l'interrupteur à coup sûr."],
      aimant: ["att", "Possible avec une came fixée sur la tige, mais on ajoute une pièce à l'extérieur. Le magnétique voit le piston directement."],
      mousse: ["att", "Trop mou : la mousse ou le tissu s'écrase contre le bras sans pousser assez fort pour activer l'interrupteur. Même une tige souple à ressort est peu fiable : un capteur sans contact est le bon choix.", "jaune"],
      papier: ["att", "Trop léger : au contact du bras, la feuille plie ou se déplace au lieu d'activer l'interrupteur. Même une tige souple à ressort est peu fiable : un capteur sans contact est le bon choix.", "jaune"],
    },
    bonus: { _securite: [-2, "contact mécanique à ouverture positive"] },
    env: {},
  },
  {
    id: "laser", nom: "Laser de distance", fiche: 9, min: 20, max: 10000, prix: 4,
    resume: "Mesure très précise avec un point laser. Prix très élevé.",
    mesure: "oui", precise: ["oui"],
    surdim: "très cher ($$$$) pour seulement répondre OUI/NON : c'est un instrument de mesure",
    mat: {
      acier: ["oui"],
      alu: ["att", "Le métal brillant renvoie mal le point laser : mesure instable."],
      bois: ["oui"], carton: ["oui"], plastique: ["oui"],
      noir: ["att", "Un noir foncé absorbe le point laser : mesure plus difficile."],
      verre: ["att", "Le point laser traverse le transparent : mesure peu fiable."],
      liquide: ["att", "La surface de l'eau réfléchit le laser comme un miroir : mesure instable."],
      granules: ["oui"],
      aimant: ["non", VERIN],
      mousse: ["oui"], papier: ["oui"],
    },
    env: {
      poussiere: "Très sensible à la poussière : une lentille sale fausse la mesure.",
      huile: "Une lentille éclaboussée fausse la mesure.",
      vapeur: "La vapeur dévie et diffuse le point laser.",
    },
  },
];

const POIDS = { mat: 5, dist: 2.5, env: 2, besoin: 4, prix: 0.7, lent: 1, surdim: 1.5 };

const TOLERANCE = 0.4;

function fmtDist(mm) {
  if (mm === 0) return "0 mm";
  if (mm < 100) return Math.round(mm) + " mm";
  if (mm < 1000) return (Math.round(mm / 10)) + " cm";
  return (Math.round(mm / 100) / 10).toString().replace(".", ",") + " m";
}

function evaluerUn(c, s) {
  const non = [], att = [], notes = [];
  let score = 0;

  // 1. Besoin
  const TOR = "Ce capteur a une sortie tout ou rien : il répond OUI ou NON, il ne donne pas la distance. Pour mesurer, il faut une sortie analogique (4-20 mA ou 0-10 V).";
  if (s.besoin === "mesure" && c.mesure !== "oui") non.push(TOR);
  if (s.besoin === "precise") {
    if (!c.precise) non.push(TOR);
    else if (c.precise[0] === "att") { att.push(c.precise[1]); score += POIDS.besoin; }
  }
  if (s.besoin === "securite") {
    if (c.id === "findecourse") { score += c.bonus._securite[0]; }
    else { att.push("Il détecte, mais pour une limite de sécurité on garde un contact mécanique à ouverture positive : même si un fil se coupe ou si le capteur brise, la machine s'arrête."); score += POIDS.besoin; }
  }

  // 2. Matériau
  const m = c.mat[s.mat] || ["non", c.defautMat || "Ce matériau n'est pas détecté."];
  if (m[0] === "non") non.push(m[1]);
  else if (m[0] === "att") { att.push(m[1]); score += POIDS.mat; }
  const jamaisVert = m[2] === "jaune";
  if (c.bonus && c.bonus[s.mat]) score += c.bonus[s.mat][0];

  // 3. Distance (seulement si le matériau est détecté)
  if (m[0] !== "non") {
    const d = s.dist;
    if (c.id === "findecourse") {
      if (s.mat === "aimant" && d > 3) non.push(VERIN + " Un fin de course aurait besoin d'une came fixée sur la tige, juste contre son levier.");
      else if (d > c.max) non.push(`Trop loin : le bras le plus long (6 po, environ 15 cm) ou la tige à ressort ne peut pas entrer en contact avec un objet à ${fmtDist(d)} du boîtier. Sans contact, l'interrupteur ne s'active pas.`);

    } else if (d === 0) {
      if (c.id === "magnetique") { /* monté directement sur le vérin : OK */ }
      else if (c.id === "inductif" || c.id === "capacitif") {
        att.push("Il détecte, mais l'objet vient frapper la face du capteur : risque de bris. On laisse toujours un petit jeu de 1 à 2 mm.");
        score += POIDS.dist;
      } else if (c.id === "barrage" || c.id === "reflex") {
        non.push("Un faisceau a besoin d'espace : l'objet doit passer dans le faisceau, pas venir s'appuyer sur le capteur.");
      } else if (c.id === "ultrason") {
        non.push(`Collé sur le capteur, l'objet est dans la zone morte (moins de ${fmtDist(c.min)}) : l'écho revient trop vite pour être lu.`);
      } else {
        non.push(`Trop proche : la distance minimale de ce capteur est d'environ ${fmtDist(c.min)}.`);
      }
    } else {
      const f = c.facteur && c.facteur[s.mat];
      const maxEff = c.max * (f ? f[0] : 1);
      const pourquoi = f ? `, car ${f[1]}` : "";
      if (d > maxEff) {
        non.push(`Trop loin : sa portée maximale est d'environ ${fmtDist(maxEff)}${pourquoi}. À ${fmtDist(d)}, l'objet est hors de portée.`);
      } else if (d < c.min) {
        if (c.id === "ultrason") non.push(`Trop proche : l'objet est dans la zone morte (moins de ${fmtDist(c.min)}). L'écho revient avant que le capteur puisse l'écouter.`);
        else if (c.id === "barrage" || c.id === "reflex") non.push(`Trop serré : il faut au moins ${fmtDist(c.min)} d'espace pour installer ${c.id === "barrage" ? "l'émetteur et le récepteur" : "le capteur et son réflecteur"} de part et d'autre.`);
        else non.push(`Trop proche : la distance minimale de ce capteur est d'environ ${fmtDist(c.min)}.`);
      } else if (d > 0.8 * maxEff) {
        att.push(`À la limite de sa portée (environ ${fmtDist(maxEff)} max${pourquoi}) : la détection risque d'être instable. Garde une marge d'au moins 20 %.`);
        score += POIDS.dist;
      } else if (c.id === "ultrason" && d < 1.5 * c.min) {
        att.push("Très proche de la zone morte du capteur : la détection peut devenir instable.");
        score += POIDS.dist;
      }
    }
  }

  // 4. Environnement
  if (c.env[s.env]) { att.push(c.env[s.env]); score += POIDS.env; }

  // 5. Coût, simplicité
  score += c.prix * POIDS.prix;
  if (c.extra) { score += c.extra[0]; notes.push(c.extra[1]); }
  if (c.lent) { score += POIDS.lent; notes.push(c.lent); }
  if (c.surdim && s.besoin === "presence") { score += POIDS.surdim; notes.push(c.surdim); }

  return { capteur: c, non, att, notes, score, marche: non.length === 0, jamaisVert };
}

function evaluerTout(s) {
  const res = CAPTEURS.map(c => evaluerUn(c, s));
  const ok = res.filter(r => r.marche);
  // Vert : tout capteur qui fonctionne sans problème, même s'il coûte plus cher.
  // S'il n'y en a aucun, les meilleurs compromis deviennent verts (avec « À surveiller »).
  const propres = ok.filter(r => r.att.length === 0);
  let verts = propres;
  const compromis = ok.filter(r => !r.jamaisVert);
  if (!propres.length && compromis.length) {
    const best = Math.min(...compromis.map(r => r.score));
    verts = compromis.filter(r => r.score <= best + TOLERANCE);
  }
  res.forEach(r => { r.verdict = !r.marche ? "rouge" : verts.includes(r) ? "vert" : "jaune"; });
  const meilleurs = verts.slice().sort((a, b) => a.capteur.prix - b.capteur.prix || a.score - b.score);
  if (meilleurs.length) {
    const pMin = meilleurs[0].capteur.prix;
    const moinsChers = meilleurs.filter(b => b.capteur.prix === pMin);
    meilleurs.forEach(r => { if (r.capteur.prix > pMin) r.moinsCher = moinsChers; });
  }
  return { res, meilleurs };
}

const MISSIONS = [
  { titre: "Usinage sous arrosage", texte: "Des pièces d'acier passent à 3 mm de la face du capteur dans une machine arrosée d'huile de coupe. Il faut compter chaque pièce.", mat: "acier", dist: 3, env: "huile", besoin: "presence" },
  { titre: "Réservoir de plastique", texte: "On veut savoir si l'eau atteint le niveau haut d'un réservoir de plastique, sans percer la paroi. Le capteur est collé contre la paroi (15 mm de l'eau).", mat: "liquide", dist: 15, env: "propre", besoin: "presence" },
  { titre: "Sacs de farine", texte: "Des sacs de farine circulent sur un convoyeur de 3 m de large. Il y a de la poussière de farine partout dans l'usine.", mat: "carton", objet: "🛍️", dist: 3000, env: "poussiere", besoin: "presence" },
  { titre: "Ligne d'embouteillage", texte: "Des bouteilles de verre transparent passent à 15 cm du capteur. Il faut détecter chaque bouteille.", mat: "verre", dist: 150, env: "propre", besoin: "presence" },
  { titre: "Canettes d'aluminium", texte: "Des canettes d'aluminium brillantes défilent sur un convoyeur de 60 cm de large.", mat: "alu", dist: 600, env: "propre", besoin: "presence" },
  { titre: "Vérin pneumatique", texte: "On veut savoir si la tige d'un vérin est sortie, sans ajouter de pièce à l'extérieur de la tige. Le vérin a un piston aimanté.", mat: "aimant", dist: 0, env: "propre", besoin: "presence" },
  { titre: "Limite de sécurité", texte: "Un chariot d'acier ne doit jamais dépasser le bout de son rail. Si la limite est atteinte, la machine doit s'arrêter, même en cas de bris d'un fil.", mat: "acier", dist: 0, env: "propre", besoin: "securite" },
  { titre: "Contrôle de hauteur", texte: "Il faut vérifier la hauteur de pièces d'acier usinées à 0,1 mm près. Le capteur est placé à 15 cm au-dessus.", mat: "acier", dist: 150, env: "propre", besoin: "precise" },
  { titre: "Niveau d'une cuve", texte: "On veut connaître en continu la hauteur de l'eau dans une cuve ouverte. Le capteur est à 1,5 m au-dessus du fond.", mat: "liquide", dist: 1500, env: "propre", besoin: "mesure" },
  { titre: "Trémie de granules", texte: "Dans une usine de plastique, on veut savoir quand la trémie de granules est pleine, à travers sa paroi (15 mm). L'air est poussiéreux.", mat: "granules", dist: 15, env: "poussiere", besoin: "presence" },
  { titre: "Pièces d'aluminium", texte: "Des petites pièces d'aluminium passent à 15 mm de la face du capteur.", mat: "alu", objet: "🔘", dist: 15, env: "propre", besoin: "presence" },
  { titre: "Coussins de mousse", texte: "Une usine de meubles fait passer des coussins de mousse sur un convoyeur de 60 cm de large.", mat: "mousse", dist: 600, env: "propre", besoin: "presence" },
  { titre: "Scierie", texte: "Des planches de bois passent sur un convoyeur de 3 m de large. Le bran de scie vole partout.", mat: "bois", dist: 3000, env: "poussiere", besoin: "presence" },
  { titre: "Bouteilles de plastique", texte: "Des bouteilles de plastique remplies d'eau passent à 15 mm de la face du capteur.", mat: "plastique", dist: 15, env: "propre", besoin: "presence" },
];

if (typeof module !== "undefined") module.exports = { CAPTEURS, MATERIAUX, DISTANCES, ENVIRONNEMENTS, BESOINS, MISSIONS, evaluerTout, fmtDist };

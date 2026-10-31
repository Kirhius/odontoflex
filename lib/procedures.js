// Configuracao de procedimentos: cores, complexidade e escopo.
// Isso NAO e dado de paciente, entao pode (e deve) persistir em localStorage.
//
// escopo: onde o procedimento se aplica
//   "dente"  -> um ou mais dentes (toque no dente no odontograma)
//   "arcada" -> superior e/ou inferior (popup para escolher a arcada)
//   "boca"   -> boca toda (ex: limpeza, raspagem), sem dente nem arcada

const STORAGE_KEY = "odontoflex:procedimentos";

export const ESCOPOS = [
  { value: "dente", label: "Dente" },
  { value: "arcada", label: "Arcada" },
  { value: "boca", label: "Boca toda" },
];

export const DEFAULT_PROCEDURES = [
  { id: "avaliacao", nome: "Avaliação", cor: "#8C8C86", complexidade: 1, escopo: "boca" },
  { id: "limpeza", nome: "Limpeza", cor: "#5FA88F", complexidade: 1, escopo: "boca" },
  { id: "restauracao", nome: "Restauração", cor: "#4C7A93", complexidade: 2, escopo: "dente" },
  { id: "extracao-simples", nome: "Extração simples", cor: "#B08D57", complexidade: 2, escopo: "dente" },
  { id: "extracao-complexa", nome: "Extração complexa", cor: "#A15C3E", complexidade: 3, escopo: "dente" },
  { id: "canal", nome: "Canal", cor: "#8E4585", complexidade: 4, escopo: "dente" },
  { id: "protese", nome: "Prótese", cor: "#3B5A6B", complexidade: 4, escopo: "dente" },
  { id: "implante", nome: "Implante", cor: "#9B2226", complexidade: 5, escopo: "dente" },
];

const VALID_ESCOPOS = ESCOPOS.map((e) => e.value);

function makeId(nome) {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "procedimento"}-${Date.now().toString(36)}`;
}

// Procedimentos salvos antes do campo "escopo" existir nao o possuem:
// usa o escopo do procedimento de fabrica com o mesmo id, ou "dente".
function normalizeProcedure(p) {
  if (VALID_ESCOPOS.includes(p.escopo)) return p;
  const fallback = DEFAULT_PROCEDURES.find((d) => d.id === p.id)?.escopo ?? "dente";
  return { ...p, escopo: fallback };
}

export function loadProcedures() {
  if (typeof window === "undefined") return DEFAULT_PROCEDURES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROCEDURES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeProcedure);
    return DEFAULT_PROCEDURES;
  } catch {
    return DEFAULT_PROCEDURES;
  }
}

export function saveProcedures(procedures) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(procedures));
}

export function createProcedure({ nome, cor, complexidade, escopo = "dente" }) {
  return {
    id: makeId(nome),
    nome: nome.trim(),
    cor,
    complexidade: Number(complexidade),
    escopo: VALID_ESCOPOS.includes(escopo) ? escopo : "dente",
  };
}

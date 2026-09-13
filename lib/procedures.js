// Configuracao de procedimentos: cores e complexidade.
// Isso NAO e dado de paciente, entao pode (e deve) persistir em localStorage.

const STORAGE_KEY = "odontoflex:procedimentos";

export const DEFAULT_PROCEDURES = [
  { id: "avaliacao", nome: "Avaliação", cor: "#8C8C86", complexidade: 1 },
  { id: "limpeza", nome: "Limpeza", cor: "#5FA88F", complexidade: 1 },
  { id: "restauracao", nome: "Restauração", cor: "#4C7A93", complexidade: 2 },
  { id: "extracao-simples", nome: "Extração simples", cor: "#B08D57", complexidade: 2 },
  { id: "extracao-complexa", nome: "Extração complexa", cor: "#A15C3E", complexidade: 3 },
  { id: "canal", nome: "Canal", cor: "#8E4585", complexidade: 4 },
  { id: "protese", nome: "Prótese", cor: "#3B5A6B", complexidade: 4 },
  { id: "implante", nome: "Implante", cor: "#9B2226", complexidade: 5 },
];

function makeId(nome) {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "procedimento"}-${Date.now().toString(36)}`;
}

export function loadProcedures() {
  if (typeof window === "undefined") return DEFAULT_PROCEDURES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROCEDURES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_PROCEDURES;
  } catch {
    return DEFAULT_PROCEDURES;
  }
}

export function saveProcedures(procedures) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(procedures));
}

export function createProcedure({ nome, cor, complexidade }) {
  return {
    id: makeId(nome),
    nome: nome.trim(),
    cor,
    complexidade: Number(complexidade),
  };
}

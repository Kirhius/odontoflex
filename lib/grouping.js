// Junta, para o PDF, os itens do mesmo procedimento numa unica linha.
//
// Entrada (na ordem do plano):
//   { procedureId, name, escopo: "dente" | "arcada" | "boca", tooth?, arcada? }
//
// Saida (uma linha por procedimento, na posicao do primeiro item dele):
//   { name: "Restauração", detail: "Dentes 13 e 25" }
//   { name: "Prótese Total", detail: "Arcada inferior" }
//   { name: "Raspagem/profilaxia", detail: "" }

const ARCADA_ORDER = ["superior", "inferior"];

// ["24"] -> "24" | ["24","46"] -> "24 e 46" | ["24","46","27"] -> "24, 46 e 27"
function joinList(list) {
  if (list.length <= 1) return list.join("");
  if (list.length === 2) return `${list[0]} e ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} e ${list[list.length - 1]}`;
}

export function groupItemsForPdf(items) {
  const groups = [];
  const byProcedure = new Map();

  for (const item of items) {
    let group = byProcedure.get(item.procedureId);
    if (!group) {
      group = { name: item.name, escopo: item.escopo, teeth: [], arcadas: [] };
      byProcedure.set(item.procedureId, group);
      groups.push(group);
    }
    if (item.escopo === "dente") group.teeth.push(item.tooth);
    if (item.escopo === "arcada") group.arcadas.push(item.arcada);
  }

  return groups.map((group) => {
    let detail = "";

    if (group.escopo === "dente") {
      const teeth = [...new Set(group.teeth)].sort((a, b) => a - b);
      detail = `${teeth.length === 1 ? "Dente" : "Dentes"} ${joinList(teeth.map(String))}`;
    }

    if (group.escopo === "arcada") {
      const arcadas = ARCADA_ORDER.filter((a) => group.arcadas.includes(a));
      detail = `${arcadas.length === 1 ? "Arcada" : "Arcadas"} ${joinList(arcadas)}`;
    }

    return { name: group.name, detail };
  });
}

// Utilidades de numeracao odontologica (sistema FDI/ISO-3950)

const PERMANENT_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const DECIDUOUS_POSITIONS = [1, 2, 3, 4, 5];

// Primeiros molares permanentes (dentes de 6 anos): erupcionam junto com a
// denticao decidua, entao aparecem tambem na aba "Decidua", separados por um
// traco do restante do quadrante (ex: 16 - 55 54 53 52 51).
const PERMANENT_FIRST_MOLARS = {
  superiorDireito: 16,
  superiorEsquerdo: 26,
  inferiorEsquerdo: 36,
  inferiorDireito: 46,
};

function buildQuadrant(quadrantDigit, positions) {
  return positions.map((pos) => quadrantDigit * 10 + pos);
}

// Retorna os 4 quadrantes na ordem de exibicao do odontograma
// (visao de quem olha o paciente de frente, quadrante superior direito
// do paciente aparece a esquerda da tela).
export function getQuadrants(dentition) {
  const positions =
    dentition === "decidua" ? DECIDUOUS_POSITIONS : PERMANENT_POSITIONS;
  const desc = [...positions].reverse();

  if (dentition === "decidua") {
    return {
      superiorDireito: {
        label: "Superior Direito",
        teeth: buildQuadrant(5, desc),
        permanentMolar: PERMANENT_FIRST_MOLARS.superiorDireito,
      },
      superiorEsquerdo: {
        label: "Superior Esquerdo",
        teeth: buildQuadrant(6, positions),
        permanentMolar: PERMANENT_FIRST_MOLARS.superiorEsquerdo,
      },
      inferiorEsquerdo: {
        label: "Inferior Esquerdo",
        teeth: buildQuadrant(7, positions),
        permanentMolar: PERMANENT_FIRST_MOLARS.inferiorEsquerdo,
      },
      inferiorDireito: {
        label: "Inferior Direito",
        teeth: buildQuadrant(8, desc),
        permanentMolar: PERMANENT_FIRST_MOLARS.inferiorDireito,
      },
    };
  }

  return {
    superiorDireito: { label: "Superior Direito", teeth: buildQuadrant(1, desc) },
    superiorEsquerdo: { label: "Superior Esquerdo", teeth: buildQuadrant(2, positions) },
    inferiorEsquerdo: { label: "Inferior Esquerdo", teeth: buildQuadrant(3, positions) },
    inferiorDireito: { label: "Inferior Direito", teeth: buildQuadrant(4, desc) },
  };
}

// Verdadeiro para 16, 26, 36 e 46 (primeiros molares permanentes),
// independente da denticao selecionada na tela.
export function isPermanentFirstMolar(toothNumber) {
  return Object.values(PERMANENT_FIRST_MOLARS).includes(toothNumber);
}

// Tipo anatomico do dente, usado para escolher o icone SVG
export function toothType(dentition, toothNumber) {
  if (isPermanentFirstMolar(toothNumber)) return "molar";

  const pos = toothNumber % 10;

  if (dentition === "decidua") {
    if (pos <= 2) return "incisivo";
    if (pos === 3) return "canino";
    return "molar-deciduo"; // posicoes 4 e 5
  }

  if (pos <= 2) return "incisivo";
  if (pos === 3) return "canino";
  if (pos <= 5) return "premolar";
  return "molar"; // posicoes 6, 7, 8
}

// Arco do dente (superior ou inferior), usado para orientar o icone
export function toothArch(quadrantKey) {
  return quadrantKey.startsWith("superior") ? "superior" : "inferior";
}

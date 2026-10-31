// Geracao do PDF da avaliacao. Tudo acontece no navegador: nada e enviado ou
// salvo em lugar nenhum.
//
// Uso:
//   const assets = await loadPdfAssets();          // carrega jsPDF + logo (pode ser pre-carregado)
//   const doc = buildPdf(assets, { items });       // sincrono
//   doc.save("arquivo.pdf") ou doc.output("blob")
//
// `items`: [{ name: "Restauração", detail: "Dentes 13 e 25" }, ...] ja agrupados
// (veja lib/grouping.js) e na ordem em que devem aparecer. `detail` pode ser "".

const GOLD = [176, 141, 87]; // cor da logo
const GOLD_DEEP = [138, 108, 63];
const GOLD_TINT = [248, 244, 236];
const BLACK = [0, 0, 0];
const GRAY = [115, 115, 115];
const LINE = [222, 222, 222];
const FIELD = [175, 175, 175];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_RIGHT = PAGE_W - MARGIN;

// Colunas da tabela
const COL_ORDER_X = MARGIN + 2;
const COL_PROC_X = 36;
const FIELD_W = 46;
const FIELD_X = CONTENT_RIGHT - FIELD_W;
const PROC_MAX_W = FIELD_X - COL_PROC_X - 4;

const ROW_H = 13;
const LINE_H = 4.8;
const FOOTER_Y = PAGE_H - 12;
const PAGE_BOTTOM = PAGE_H - 22;

async function fetchAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("falha ao carregar " + url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Carrega a biblioteca e a logo. Se a logo nao carregar, o PDF sai sem ela.
export async function loadPdfAssets(logoUrl = "/icons/icon-192.png") {
  const { jsPDF } = await import("jspdf");
  let logo = null;
  try {
    logo = await fetchAsDataUrl(logoUrl);
  } catch {
    logo = null;
  }
  return { jsPDF, logo };
}

function withOpacity(doc, opacity, draw) {
  doc.setGState(new doc.GState({ opacity }));
  draw();
  doc.setGState(new doc.GState({ opacity: 1 }));
}

// Cabecalho compacto: uma faixa baixa na cor da logo.
function drawHeader(doc, logo, dateText) {
  const headerH = 16;

  doc.setFillColor(...GOLD);
  doc.rect(0, 0, PAGE_W, headerH, "F");

  // Detalhe decorativo sutil (circulo translucido a direita)
  withOpacity(doc, 0.12, () => {
    doc.setFillColor(255, 255, 255);
    doc.circle(PAGE_W - 12, 2, 14, "F");
  });

  // Linha de acabamento
  doc.setFillColor(...GOLD_DEEP);
  doc.rect(0, headerH, PAGE_W, 0.8, "F");

  // Logo
  const logoSize = 10;
  const logoX = MARGIN;
  const logoY = (headerH - logoSize) / 2;
  if (logo) {
    doc.addImage(logo, "PNG", logoX, logoY, logoSize, logoSize);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, "F");
  }

  // Titulo
  const textX = logoX + logoSize + 4;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("OdontoFlex", textX, 8.1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Avaliação odontológica", textX, 12.4);

  // Data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("DATA", CONTENT_RIGHT, 6.2, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(dateText, CONTENT_RIGHT, 11.8, { align: "right" });

  return headerH + 0.8;
}

function drawMiniHeader(doc) {
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, PAGE_W, 8, "F");
  doc.setFillColor(...GOLD_DEEP);
  doc.rect(0, 8, PAGE_W, 0.8, "F");
}

function drawTableHead(doc, y) {
  doc.setFillColor(...GOLD_TINT);
  doc.roundedRect(MARGIN, y, CONTENT_RIGHT - MARGIN, 9, 1.8, 1.8, "F");
  doc.setTextColor(...GOLD_DEEP);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const textY = y + 5.9;
  doc.text("ORDEM", COL_ORDER_X, textY);
  doc.text("PROCEDIMENTO", COL_PROC_X, textY);
  doc.text("VALOR", FIELD_X + FIELD_W / 2, textY, { align: "center" });
  return y + 9 + 3;
}

function drawValueField(doc, y, rowH, { strong = false } = {}) {
  const boxH = ROW_H - 3.6;
  const boxY = y + (rowH - boxH) / 2;
  doc.setDrawColor(...(strong ? GOLD : FIELD));
  doc.setLineWidth(strong ? 0.6 : 0.3);
  doc.roundedRect(FIELD_X, boxY, FIELD_W, boxH, 1.5, 1.5, "S");
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("R$", FIELD_X + 3, boxY + boxH / 2 + 1.2);
}

// Quebra o texto em linhas e calcula a altura da linha da tabela.
function measureRow(doc, item) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const full = item.detail ? `${item.name} - ${item.detail}` : item.name;
  const lines = doc.splitTextToSize(full, PROC_MAX_W - 2);
  const rowH = Math.max(ROW_H, 7 + lines.length * LINE_H);
  return { lines, rowH };
}

function drawRow(doc, y, index, item, lines, rowH) {
  const midY = y + rowH / 2 + 1.2;

  // Ordem
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(String(index), COL_ORDER_X + 3, midY, { align: "center" });

  // Procedimento (nome em negrito, detalhe normal), tudo em preto
  doc.setTextColor(...BLACK);
  doc.setFontSize(11);
  const firstY = midY - ((lines.length - 1) * LINE_H) / 2;
  const first = lines[0];

  if (first.startsWith(item.name)) {
    doc.setFont("helvetica", "bold");
    doc.text(item.name, COL_PROC_X, firstY);
    const nameW = doc.getTextWidth(item.name);
    doc.setFont("helvetica", "normal");
    const rest = first.slice(item.name.length);
    if (rest) doc.text(rest, COL_PROC_X + nameW + 0.9, firstY);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text(first, COL_PROC_X, firstY);
  }

  doc.setFont("helvetica", "normal");
  for (let i = 1; i < lines.length; i += 1) {
    doc.text(lines[i], COL_PROC_X, firstY + i * LINE_H);
  }

  // Campo livre para o valor
  drawValueField(doc, y, rowH);

  // Divisor da linha
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + rowH, CONTENT_RIGHT, y + rowH);
}

function drawFooters(doc) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, FOOTER_Y - 4, CONTENT_RIGHT, FOOTER_Y - 4);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Gerado pelo OdontoFlex", MARGIN, FOOTER_Y);
    doc.text(`Página ${page} de ${total}`, CONTENT_RIGHT, FOOTER_Y, { align: "right" });
  }
}

export function formatDatePtBr(date = new Date()) {
  return date.toLocaleDateString("pt-BR");
}

export function pdfFileName(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `odontoflex-avaliacao-${y}-${m}-${d}.pdf`;
}

export function buildPdf(assets, { items, date = new Date() }) {
  const doc = new assets.jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: "Avaliação odontológica - OdontoFlex", creator: "OdontoFlex" });

  let y = drawHeader(doc, assets.logo, formatDatePtBr(date)) + 10;

  // Titulo da secao
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Procedimentos", MARGIN, y);
  doc.setFillColor(...GOLD);
  doc.roundedRect(MARGIN, y + 2.6, 14, 1.2, 0.6, 0.6, "F");

  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `${items.length} ${items.length === 1 ? "procedimento" : "procedimentos"}`,
    CONTENT_RIGHT,
    y,
    { align: "right" }
  );

  y = drawTableHead(doc, y + 9);

  items.forEach((item, i) => {
    const { lines, rowH } = measureRow(doc, item);
    if (y + rowH > PAGE_BOTTOM) {
      doc.addPage();
      drawMiniHeader(doc);
      y = drawTableHead(doc, 16);
    }
    drawRow(doc, y, i + 1, item, lines, rowH);
    y += rowH;
  });

  // Total (campo livre)
  if (y + ROW_H + 6 > PAGE_BOTTOM) {
    doc.addPage();
    drawMiniHeader(doc);
    y = 18;
  }
  y += 6;
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total", FIELD_X - 5, y + ROW_H / 2 + 1.2, { align: "right" });
  drawValueField(doc, y, ROW_H, { strong: true });

  drawFooters(doc);
  return doc;
}

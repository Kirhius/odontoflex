"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ToothChart from "@/components/ToothChart";
import ProcedureModal from "@/components/ProcedureModal";
import ArcadaModal from "@/components/ArcadaModal";
import { loadProcedures } from "@/lib/procedures";
import { groupItemsForPdf } from "@/lib/grouping";
import { loadPdfAssets, buildPdf, pdfFileName } from "@/lib/pdf";
import styles from "./avaliar.module.css";

// Cada selecao e um item independente. Conforme o escopo do procedimento:
//   dente : { id, procedureId, scope: "dente",  tooth }
//   arcada: { id, procedureId, scope: "arcada", arcada: "superior" | "inferior" }
//   boca  : { id, procedureId, scope: "boca" }
// Um dente pode ter varios itens (ex: 46-canal, 46-pino, 46-bloco).
const SCOPE_RANK = { boca: 0, dente: 1, arcada: 2 };
const ARCADA_RANK = { superior: 0, inferior: 1 };
const ARCADA_TAG = { superior: "Superior", inferior: "Inferior" };

function toothSelectionId(tooth, procedureId) {
  return `dente-${tooth}:${procedureId}`;
}

function arcadaSelectionId(arcada, procedureId) {
  return `arcada-${arcada}:${procedureId}`;
}

function bocaSelectionId(procedureId) {
  return `boca:${procedureId}`;
}

// Texto de um item nas listas do app.
//   dente : "Dente 46 — Canal"
//   arcada: "Arcada inferior — Prótese Total"
//   boca  : "Limpeza"
function itemLabel(item, proc) {
  const nome = proc?.nome ?? "Procedimento";
  if (item.scope === "dente") return `Dente ${item.tooth} — ${nome}`;
  if (item.scope === "arcada") return `Arcada ${item.arcada} — ${nome}`;
  return nome;
}

function buildPlanOrder(selections, procedureById, procedureIndex, existingOrder) {
  const currentIds = selections.map((s) => s.id);
  const kept = existingOrder.filter((id) => currentIds.includes(id));
  const missing = currentIds.filter((id) => !kept.includes(id));
  const byId = Object.fromEntries(selections.map((s) => [s.id, s]));
  missing.sort((a, b) => {
    const pa = byId[a];
    const pb = byId[b];
    const ca = procedureById[pa.procedureId]?.complexidade ?? 0;
    const cb = procedureById[pb.procedureId]?.complexidade ?? 0;
    if (ca !== cb) return ca - cb;
    // Mesma complexidade: mantem o mesmo procedimento junto, na ordem da configuracao.
    const ia = procedureIndex[pa.procedureId] ?? 0;
    const ib = procedureIndex[pb.procedureId] ?? 0;
    if (ia !== ib) return ia - ib;
    if ((pa.tooth ?? 0) !== (pb.tooth ?? 0)) return (pa.tooth ?? 0) - (pb.tooth ?? 0);
    return (ARCADA_RANK[pa.arcada] ?? 0) - (ARCADA_RANK[pb.arcada] ?? 0);
  });
  return [...kept, ...missing];
}

export default function AvaliarPage() {
  const [procedures, setProcedures] = useState([]);
  const [dentition, setDentition] = useState("permanente");
  const [selections, setSelections] = useState([]);
  const [step, setStep] = useState(1);
  const [activeTooth, setActiveTooth] = useState(null);
  const [arcadaProcedureId, setArcadaProcedureId] = useState(null);
  const [planOrder, setPlanOrder] = useState([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const pdfAssetsRef = useRef(null);

  useEffect(() => {
    setProcedures(loadProcedures());
  }, []);

  // Pre-carrega a biblioteca de PDF e a logo ao chegar na visao geral, para
  // que o clique em "Enviar por WhatsApp" aconteca dentro do gesto do usuario.
  useEffect(() => {
    if (step !== 3 || pdfAssetsRef.current) return;
    loadPdfAssets()
      .then((assets) => {
        pdfAssetsRef.current = assets;
      })
      .catch(() => {});
  }, [step]);

  const procedureById = useMemo(() => {
    return Object.fromEntries(procedures.map((p) => [p.id, p]));
  }, [procedures]);

  const procedureIndex = useMemo(() => {
    return Object.fromEntries(procedures.map((p, i) => [p.id, i]));
  }, [procedures]);

  // Procedimentos que se aplicam a dentes (modal ao tocar no dente) e os
  // que se aplicam a arcada ou boca toda (secao abaixo do odontograma).
  const toothProcedures = useMemo(() => procedures.filter((p) => p.escopo === "dente"), [procedures]);
  const generalProcedures = useMemo(() => procedures.filter((p) => p.escopo !== "dente"), [procedures]);

  const selectionsByTooth = useMemo(() => {
    const map = {};
    for (const s of selections) {
      if (s.scope !== "dente") continue;
      if (!map[s.tooth]) map[s.tooth] = [];
      map[s.tooth].push(s.procedureId);
    }
    return map;
  }, [selections]);

  const orderedSelections = useMemo(() => {
    return [...selections].sort((a, b) => {
      if (a.scope !== b.scope) return SCOPE_RANK[a.scope] - SCOPE_RANK[b.scope];
      if (a.scope === "dente" && a.tooth !== b.tooth) return a.tooth - b.tooth;
      if (a.scope === "arcada" && a.arcada !== b.arcada) {
        return ARCADA_RANK[a.arcada] - ARCADA_RANK[b.arcada];
      }
      const ca = procedureById[a.procedureId]?.complexidade ?? 0;
      const cb = procedureById[b.procedureId]?.complexidade ?? 0;
      return ca - cb;
    });
  }, [selections, procedureById]);

  const hasSelections = orderedSelections.length > 0;
  const activeToothProcedureIds = activeTooth !== null ? selectionsByTooth[activeTooth] || [] : [];

  const arcadaProcedure = arcadaProcedureId ? procedureById[arcadaProcedureId] : null;
  const arcadaSelected = useMemo(() => {
    if (!arcadaProcedureId) return [];
    return selections
      .filter((s) => s.scope === "arcada" && s.procedureId === arcadaProcedureId)
      .map((s) => s.arcada);
  }, [selections, arcadaProcedureId]);

  function handleToothClick(number) {
    setActiveTooth(number);
  }

  function toggleProcedure(procedureId) {
    const tooth = activeTooth;
    const id = toothSelectionId(tooth, procedureId);
    setSelections((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev.filter((s) => s.id !== id);
      return [...prev, { id, procedureId, scope: "dente", tooth }];
    });
  }

  function clearToothSelections() {
    setSelections((prev) => prev.filter((s) => !(s.scope === "dente" && s.tooth === activeTooth)));
  }

  // Procedimento de boca toda: liga/desliga direto, sem popup.
  function toggleBoca(procedureId) {
    const id = bocaSelectionId(procedureId);
    setSelections((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev.filter((s) => s.id !== id);
      return [...prev, { id, procedureId, scope: "boca" }];
    });
  }

  // Procedimento de arcada: marca/desmarca uma arcada (superior ou inferior).
  function toggleArcada(arcada) {
    const procedureId = arcadaProcedureId;
    const id = arcadaSelectionId(arcada, procedureId);
    setSelections((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev.filter((s) => s.id !== id);
      return [...prev, { id, procedureId, scope: "arcada", arcada }];
    });
  }

  function clearArcadas() {
    const procedureId = arcadaProcedureId;
    setSelections((prev) =>
      prev.filter((s) => !(s.scope === "arcada" && s.procedureId === procedureId))
    );
  }

  function handleGeneralClick(proc) {
    if (proc.escopo === "boca") {
      toggleBoca(proc.id);
    } else {
      setArcadaProcedureId(proc.id);
    }
  }

  function removeSelection(id) {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }

  function goToVisualizar() {
    setPlanOrder((prev) => buildPlanOrder(selections, procedureById, procedureIndex, prev));
    setNotice("");
    setStep(3);
  }

  function moveInPlan(index, direction) {
    setPlanOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const selectionsById = useMemo(() => Object.fromEntries(selections.map((s) => [s.id, s])), [selections]);

  const planSelections = useMemo(
    () => planOrder.map((id) => selectionsById[id]).filter(Boolean),
    [planOrder, selectionsById]
  );

  const teethCount = useMemo(
    () => new Set(planSelections.filter((s) => s.scope === "dente").map((s) => s.tooth)).size,
    [planSelections]
  );

  // Linhas do PDF: o mesmo procedimento em varios dentes vira uma linha so
  // (ex: "Restauração - Dentes 13 e 25").
  const pdfRows = useMemo(() => {
    return groupItemsForPdf(
      planSelections.map((s) => ({
        procedureId: s.procedureId,
        name: procedureById[s.procedureId]?.nome ?? "Procedimento",
        escopo: s.scope,
        tooth: s.tooth,
        arcada: s.arcada,
      }))
    );
  }, [planSelections, procedureById]);

  async function getPdfDoc() {
    const assets = pdfAssetsRef.current ?? (await loadPdfAssets());
    pdfAssetsRef.current = assets;
    return buildPdf(assets, { items: pdfRows });
  }

  async function handleExportPdf() {
    if (busy || pdfRows.length === 0) return;
    setBusy(true);
    setNotice("");
    try {
      const doc = await getPdfDoc();
      doc.save(pdfFileName());
    } catch {
      setNotice("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShareWhatsApp() {
    if (busy || pdfRows.length === 0) return;
    setBusy(true);
    setNotice("");
    try {
      const doc = await getPdfDoc();
      const fileName = pdfFileName();
      const file = new File([doc.output("blob")], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Abre o menu de compartilhamento do aparelho: basta escolher o
        // WhatsApp e depois o contato (clinica ou paciente).
        await navigator.share({ files: [file], title: "Avaliação odontológica" });
      } else {
        doc.save(fileName);
        setNotice(
          "Este navegador não permite enviar o arquivo direto. O PDF foi baixado: anexe-o na conversa do WhatsApp."
        );
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setNotice("Não foi possível compartilhar o PDF. Use o botão Exportar PDF.");
      }
    } finally {
      setBusy(false);
    }
  }

  function generalChipState(proc) {
    if (proc.escopo === "boca") {
      const active = selections.some((s) => s.id === bocaSelectionId(proc.id));
      return { active, tag: active ? "✓" : "" };
    }
    const chosen = ["superior", "inferior"].filter((a) =>
      selections.some((s) => s.id === arcadaSelectionId(a, proc.id))
    );
    const tag = chosen.length === 2 ? "Ambas" : chosen.length === 1 ? ARCADA_TAG[chosen[0]] : "";
    return { active: chosen.length > 0, tag };
  }

  return (
    <main className="screen">
      <header className={styles.header}>
        <Link href="/" className={styles.backLink} aria-label="Voltar ao início">
          ←
        </Link>
        <span className="eyebrow">Passo {step} de 3</span>
      </header>

      {step === 1 && (
        <section className={styles.section}>
          <h1 className={styles.title}>Odontograma</h1>

          <div className={styles.segmented} role="tablist" aria-label="Dentição">
            <button
              type="button"
              role="tab"
              aria-selected={dentition === "permanente"}
              className={`${styles.segment} ${dentition === "permanente" ? styles.segmentActive : ""}`}
              onClick={() => setDentition("permanente")}
            >
              Permanente
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dentition === "decidua"}
              className={`${styles.segment} ${dentition === "decidua" ? styles.segmentActive : ""}`}
              onClick={() => setDentition("decidua")}
            >
              Decídua
            </button>
          </div>

          <ToothChart
            dentition={dentition}
            selectionsByTooth={selectionsByTooth}
            procedureById={procedureById}
            onToothClick={handleToothClick}
          />

          {generalProcedures.length > 0 && (
            <div className={styles.general}>
              <span className={styles.generalTitle}>Arcada e boca toda</span>
              <div className={styles.generalChips}>
                {generalProcedures.map((proc) => {
                  const { active, tag } = generalChipState(proc);
                  return (
                    <button
                      key={proc.id}
                      type="button"
                      className={`${styles.generalChip} ${active ? styles.generalChipActive : ""}`}
                      style={{ "--chip-color": proc.cor }}
                      onClick={() => handleGeneralClick(proc)}
                      aria-pressed={active}
                    >
                      <span className={styles.generalDot} />
                      {proc.nome}
                      {tag && <span className={styles.generalTag}>{tag}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.list}>
            {!hasSelections && (
              <p className={styles.empty}>Toque em um dente para registrar um ou mais procedimentos.</p>
            )}
            {orderedSelections.map((item) => {
              const proc = procedureById[item.procedureId];
              const label = itemLabel(item, proc);
              return (
                <div key={item.id} className={styles.listItem}>
                  <span className={styles.listDot} style={{ background: proc?.cor }} />
                  <span className={styles.listText}>{label}</span>
                  <button
                    type="button"
                    className={styles.listRemove}
                    onClick={() => removeSelection(item.id)}
                    aria-label={`Remover ${label}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" className="btn btn-primary btn-block" onClick={() => setStep(2)}>
            Continuar
          </button>
        </section>
      )}

      {step === 2 && (
        <section className={styles.section}>
          <h1 className={styles.title}>Resumo</h1>
          <div className={styles.list}>
            {!hasSelections && <p className={styles.empty}>Nenhum procedimento registrado.</p>}
            {orderedSelections.map((item) => {
              const proc = procedureById[item.procedureId];
              return (
                <div key={item.id} className={styles.listItem}>
                  <span className={styles.listDot} style={{ background: proc?.cor }} />
                  <span className={styles.listText}>{itemLabel(item, proc)}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.rowButtons}>
            <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
              Voltar
            </button>
            <button
              type="button"
              className="btn btn-mint"
              onClick={goToVisualizar}
              disabled={!hasSelections}
            >
              Visualizar
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className={styles.section}>
          <h1 className={styles.title}>Visualizar</h1>
          <p className={styles.hint}>
            Do menos ao mais complexo. Use as setas para priorizar. No PDF, o mesmo procedimento em
            vários dentes aparece numa linha só.
          </p>

          <div className={styles.summaryRow}>
            <div className={styles.summaryChip}>
              <strong>{planSelections.length}</strong>
              <span>{planSelections.length === 1 ? "procedimento" : "procedimentos"}</span>
            </div>
            {teethCount > 0 && (
              <div className={styles.summaryChip}>
                <strong>{teethCount}</strong>
                <span>{teethCount === 1 ? "dente" : "dentes"}</span>
              </div>
            )}
          </div>

          <div className={styles.list}>
            {planOrder.map((id, index) => {
              const item = selectionsById[id];
              if (!item) return null;
              const proc = procedureById[item.procedureId];
              return (
                <div key={id} className={styles.planItem}>
                  <span className={styles.planIndex}>{index + 1}</span>
                  <span className={styles.listDot} style={{ background: proc?.cor }} />
                  <span className={styles.listText}>{itemLabel(item, proc)}</span>
                  <div className={styles.planArrows}>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      onClick={() => moveInPlan(index, -1)}
                      disabled={index === 0}
                      aria-label="Mover item para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      onClick={() => moveInPlan(index, 1)}
                      disabled={index === planOrder.length - 1}
                      aria-label="Mover item para baixo"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleExportPdf}
              disabled={busy || pdfRows.length === 0}
            >
              Exportar PDF
            </button>
            <button
              type="button"
              className="btn btn-mint btn-block"
              onClick={handleShareWhatsApp}
              disabled={busy || pdfRows.length === 0}
            >
              Enviar por WhatsApp
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={() => setStep(2)}>
              Voltar
            </button>
          </div>
        </section>
      )}

      {activeTooth !== null && (
        <ProcedureModal
          toothNumber={activeTooth}
          procedures={toothProcedures}
          selectedProcedureIds={activeToothProcedureIds}
          onToggle={toggleProcedure}
          onClearAll={clearToothSelections}
          onClose={() => setActiveTooth(null)}
        />
      )}

      {arcadaProcedure && (
        <ArcadaModal
          procedure={arcadaProcedure}
          selectedArcadas={arcadaSelected}
          onToggle={toggleArcada}
          onClearAll={clearArcadas}
          onClose={() => setArcadaProcedureId(null)}
        />
      )}
    </main>
  );
}

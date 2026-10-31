"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ToothChart from "@/components/ToothChart";
import ProcedureModal from "@/components/ProcedureModal";
import { loadProcedures } from "@/lib/procedures";
import { loadPdfAssets, buildPdf, pdfFileName } from "@/lib/pdf";
import styles from "./avaliar.module.css";

// Cada selecao e um item independente: { id, tooth, procedureId }.
// Um dente pode ter varios itens (ex: 46-canal, 46-pino, 46-bloco), cada um
// planejado separadamente pela sua propria complexidade.
function selectionId(tooth, procedureId) {
  return `${tooth}:${procedureId}`;
}

function buildPlanOrder(selections, procedureById, existingOrder) {
  const currentIds = selections.map((s) => s.id);
  const kept = existingOrder.filter((id) => currentIds.includes(id));
  const missing = currentIds.filter((id) => !kept.includes(id));
  const byId = Object.fromEntries(selections.map((s) => [s.id, s]));
  missing.sort((a, b) => {
    const ca = procedureById[byId[a].procedureId]?.complexidade ?? 0;
    const cb = procedureById[byId[b].procedureId]?.complexidade ?? 0;
    return ca - cb;
  });
  return [...kept, ...missing];
}

export default function AvaliarPage() {
  const [procedures, setProcedures] = useState([]);
  const [dentition, setDentition] = useState("permanente");
  const [selections, setSelections] = useState([]); // [{ id, tooth, procedureId }]
  const [step, setStep] = useState(1);
  const [activeTooth, setActiveTooth] = useState(null);
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

  const selectionsByTooth = useMemo(() => {
    const map = {};
    for (const s of selections) {
      if (!map[s.tooth]) map[s.tooth] = [];
      map[s.tooth].push(s.procedureId);
    }
    return map;
  }, [selections]);

  const orderedSelections = useMemo(() => {
    return [...selections].sort((a, b) => {
      if (a.tooth !== b.tooth) return a.tooth - b.tooth;
      const ca = procedureById[a.procedureId]?.complexidade ?? 0;
      const cb = procedureById[b.procedureId]?.complexidade ?? 0;
      return ca - cb;
    });
  }, [selections, procedureById]);

  const hasSelections = orderedSelections.length > 0;
  const activeToothProcedureIds = activeTooth !== null ? selectionsByTooth[activeTooth] || [] : [];

  function handleToothClick(number) {
    setActiveTooth(number);
  }

  function toggleProcedure(procedureId) {
    const tooth = activeTooth;
    const id = selectionId(tooth, procedureId);
    setSelections((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev.filter((s) => s.id !== id);
      return [...prev, { id, tooth, procedureId }];
    });
  }

  function clearToothSelections() {
    setSelections((prev) => prev.filter((s) => s.tooth !== activeTooth));
  }

  function removeSelection(id) {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }

  function goToVisualizar() {
    setPlanOrder((prev) => buildPlanOrder(selections, procedureById, prev));
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

  // Itens na ordem da visao geral, prontos para o PDF.
  const planItems = useMemo(() => {
    return planOrder
      .map((id) => selectionsById[id])
      .filter(Boolean)
      .map((item) => ({
        tooth: item.tooth,
        name: procedureById[item.procedureId]?.nome ?? "Procedimento",
      }));
  }, [planOrder, selectionsById, procedureById]);

  const teethCount = useMemo(() => new Set(planItems.map((i) => i.tooth)).size, [planItems]);

  async function getPdfDoc() {
    const assets = pdfAssetsRef.current ?? (await loadPdfAssets());
    pdfAssetsRef.current = assets;
    return buildPdf(assets, { items: planItems });
  }

  async function handleExportPdf() {
    if (busy || planItems.length === 0) return;
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
    if (busy || planItems.length === 0) return;
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

          <div className={styles.list}>
            {!hasSelections && (
              <p className={styles.empty}>Toque em um dente para registrar um ou mais procedimentos.</p>
            )}
            {orderedSelections.map(({ id, tooth, procedureId }) => {
              const proc = procedureById[procedureId];
              return (
                <div key={id} className={styles.listItem}>
                  <span className={styles.listDot} style={{ background: proc?.cor }} />
                  <span className={styles.listText}>
                    Dente {tooth} — {proc?.nome ?? "Procedimento"}
                  </span>
                  <button
                    type="button"
                    className={styles.listRemove}
                    onClick={() => removeSelection(id)}
                    aria-label={`Remover ${proc?.nome ?? "procedimento"} do dente ${tooth}`}
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
            {orderedSelections.map(({ id, tooth, procedureId }) => {
              const proc = procedureById[procedureId];
              return (
                <div key={id} className={styles.listItem}>
                  <span className={styles.listDot} style={{ background: proc?.cor }} />
                  <span className={styles.listText}>
                    Dente {tooth} — {proc?.nome ?? "Procedimento"}
                  </span>
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
            Visão geral dos procedimentos, do menos ao mais complexo. Use as setas para priorizar.
          </p>

          <div className={styles.summaryRow}>
            <div className={styles.summaryChip}>
              <strong>{planItems.length}</strong>
              <span>{planItems.length === 1 ? "procedimento" : "procedimentos"}</span>
            </div>
            <div className={styles.summaryChip}>
              <strong>{teethCount}</strong>
              <span>{teethCount === 1 ? "dente" : "dentes"}</span>
            </div>
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
                  <span className={styles.listText}>
                    Dente {item.tooth} — {proc?.nome ?? "Procedimento"}
                  </span>
                  <div className={styles.planArrows}>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      onClick={() => moveInPlan(index, -1)}
                      disabled={index === 0}
                      aria-label={`Mover item para cima`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.arrowBtn}
                      onClick={() => moveInPlan(index, 1)}
                      disabled={index === planOrder.length - 1}
                      aria-label={`Mover item para baixo`}
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
              disabled={busy || planItems.length === 0}
            >
              Exportar PDF
            </button>
            <button
              type="button"
              className="btn btn-mint btn-block"
              onClick={handleShareWhatsApp}
              disabled={busy || planItems.length === 0}
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
          procedures={procedures}
          selectedProcedureIds={activeToothProcedureIds}
          onToggle={toggleProcedure}
          onClearAll={clearToothSelections}
          onClose={() => setActiveTooth(null)}
        />
      )}
    </main>
  );
}

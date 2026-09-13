"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToothChart from "@/components/ToothChart";
import ProcedureModal from "@/components/ProcedureModal";
import { loadProcedures } from "@/lib/procedures";
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

  useEffect(() => {
    setProcedures(loadProcedures());
  }, []);

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

  function goToPlanejar() {
    setPlanOrder((prev) => buildPlanOrder(selections, procedureById, prev));
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
              onClick={goToPlanejar}
              disabled={!hasSelections}
            >
              Planejar
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className={styles.section}>
          <h1 className={styles.title}>Planejar</h1>
          <p className={styles.hint}>
            Do menos ao mais complexo. Use as setas para priorizar.
          </p>

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

          <button type="button" className="btn btn-outline btn-block" onClick={() => setStep(2)}>
            Voltar
          </button>
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

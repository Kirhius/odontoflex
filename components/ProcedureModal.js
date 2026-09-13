"use client";

import { useEffect } from "react";
import styles from "./ProcedureModal.module.css";

// Selecao multipla: cada chip alterna (liga/desliga) o procedimento naquele
// dente. Fecha apenas quando o dentista toca em "Concluir".
export default function ProcedureModal({
  toothNumber,
  procedures,
  selectedProcedureIds,
  onToggle,
  onClearAll,
  onClose,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasSelection = selectedProcedureIds.length > 0;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={`Procedimentos para o dente ${toothNumber}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden="true" />
        <span className="eyebrow">Dente {toothNumber}</span>
        <h2 className={styles.title}>Procedimentos</h2>
        <p className={styles.hint}>Toque para adicionar ou remover. Pode marcar mais de um.</p>

        <div className={styles.chips}>
          {procedures.map((proc) => {
            const active = selectedProcedureIds.includes(proc.id);
            return (
              <button
                key={proc.id}
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                style={{ "--chip-color": proc.cor }}
                onClick={() => onToggle(proc.id)}
                aria-pressed={active}
              >
                <span className={styles.dot} />
                {proc.nome}
                {active && <span className={styles.check}>✓</span>}
              </button>
            );
          })}
        </div>

        {hasSelection && (
          <button type="button" className={`btn btn-ghost ${styles.remove}`} onClick={onClearAll}>
            Remover todos deste dente
          </button>
        )}

        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Concluir
        </button>
      </div>
    </div>
  );
}

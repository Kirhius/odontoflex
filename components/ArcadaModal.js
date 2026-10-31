"use client";

import { useEffect } from "react";
import styles from "./ProcedureModal.module.css";

const ARCADAS = [
  { value: "superior", label: "Superior" },
  { value: "inferior", label: "Inferior" },
];

// Popup para escolher a arcada (superior e/ou inferior) de um procedimento
// com escopo "arcada". Cada toque liga/desliga; fecha em "Concluir".
export default function ArcadaModal({ procedure, selectedArcadas, onToggle, onClearAll, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={`Arcada para ${procedure.nome}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden="true" />
        <span className="eyebrow">{procedure.nome}</span>
        <h2 className={styles.title}>Qual arcada?</h2>
        <p className={styles.hint}>Toque para marcar. Pode marcar as duas.</p>

        <div className={styles.chips}>
          {ARCADAS.map((arcada) => {
            const active = selectedArcadas.includes(arcada.value);
            return (
              <button
                key={arcada.value}
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                style={{ "--chip-color": procedure.cor }}
                onClick={() => onToggle(arcada.value)}
                aria-pressed={active}
              >
                <span className={styles.dot} />
                {arcada.label}
                {active && <span className={styles.check}>✓</span>}
              </button>
            );
          })}
        </div>

        {selectedArcadas.length > 0 && (
          <button type="button" className={`btn btn-ghost ${styles.remove}`} onClick={onClearAll}>
            Remover deste procedimento
          </button>
        )}

        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Concluir
        </button>
      </div>
    </div>
  );
}

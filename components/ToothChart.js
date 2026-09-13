"use client";

import ToothIcon from "./ToothIcon";
import { getQuadrants, toothType, toothArch } from "@/lib/teeth";
import styles from "./ToothChart.module.css";

const ORDER = [
  "superiorDireito",
  "superiorEsquerdo",
  "inferiorEsquerdo",
  "inferiorDireito",
];

// `selectionsByTooth`: { [numeroDoDente]: [procedureId, ...] }
// Um dente pode ter varios procedimentos (ex: canal + pino + bloco).
export default function ToothChart({ dentition, selectionsByTooth, procedureById, onToothClick }) {
  const quadrants = getQuadrants(dentition);

  function renderTooth(number, arch) {
    const procedureIds = selectionsByTooth[number] || [];
    const procs = procedureIds.map((id) => procedureById[id]).filter(Boolean);
    const colors = procs.map((p) => p.cor);
    const names = procs.map((p) => p.nome);
    return (
      <button
        key={number}
        type="button"
        className={`${styles.tooth} ${colors.length ? styles.toothActive : ""}`}
        onClick={() => onToothClick(number)}
        aria-label={`Dente ${number}${names.length ? `, ${names.join(", ")}` : ""}`}
      >
        <ToothIcon type={toothType(dentition, number)} colors={colors} arch={arch} size={31} />
        <span className={styles.toothNumber}>{number}</span>
      </button>
    );
  }

  return (
    <div className={styles.chart}>
      {ORDER.map((key, index) => {
        const { label, teeth, permanentMolar } = quadrants[key];
        const arch = toothArch(key);
        const showDivider = index === 2; // separa arco superior do inferior

        return (
          <div key={key}>
            {showDivider && <div className={styles.archDivider} aria-hidden="true" />}
            <div className={styles.quadrant}>
              <span className={styles.quadrantLabel}>{label}</span>
              <div className={styles.row}>
                {permanentMolar != null && (
                  <>
                    {renderTooth(permanentMolar, arch)}
                    <span className={styles.rowSeparator} aria-hidden="true">
                      -
                    </span>
                  </>
                )}
                {teeth.map((number) => renderTooth(number, arch))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

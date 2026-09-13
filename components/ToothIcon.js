"use client";

import { useId } from "react";

// Icones de dente estilizados, simples o suficiente para reconhecer o tipo
// (incisivo, canino, premolar, molar, molar deciduo) e a(s) cor(es) do(s)
// procedimento(s). viewBox comum: 0 0 34 64.

function Shape({ type }) {
  switch (type) {
    case "canino":
      return (
        <>
          <path d="M17 0 L28 19 L23 27 L11 27 L6 19 Z" />
          <path d="M11 25 L23 25 L19.6 58.5 C19.1 62 14.9 62 14.4 58.5 Z" />
        </>
      );
    case "premolar":
      return (
        <>
          <rect x="2" y="3" width="30" height="20" rx="8" />
          <path d="M6 21 L15.5 21 L13.5 48.5 C13.1 51.2 8.4 51.2 8 48.5 Z" />
          <path d="M18.5 21 L28 21 L26 44.5 C25.6 47.2 20.9 47.2 20.5 44.5 Z" />
        </>
      );
    case "molar":
      return (
        <>
          <rect x="0.5" y="3" width="33" height="22" rx="8" />
          <path d="M3 23 L12.5 23 L10.5 54.5 C10 57.5 5.5 57.5 5 54.5 Z" />
          <path d="M13.5 23 L20.5 23 L18.7 60.5 C18.2 63.5 15.8 63.5 15.3 60.5 Z" />
          <path d="M21.5 23 L31 23 L29 54.5 C28.5 57.5 24 57.5 23.5 54.5 Z" />
        </>
      );
    case "molar-deciduo":
      return (
        <>
          <rect x="3" y="4" width="28" height="19" rx="8" />
          <path d="M5.5 22 L13.5 22 L11.8 40 C11.4 42.2 7.6 42.2 7.2 40 Z" />
          <path d="M13.8 22 L20.2 22 L18.5 44 C18.1 46.2 15.9 46.2 15.5 44 Z" />
          <path d="M20.5 22 L28.5 22 L26.8 40 C26.4 42.2 22.6 42.2 22.2 40 Z" />
        </>
      );
    case "incisivo":
    default:
      return (
        <>
          <rect x="6" y="2" width="22" height="18" rx="6" />
          <path d="M10 19 L24 19 L20.2 55 C19.6 59 14.4 59 13.8 55 Z" />
        </>
      );
  }
}

// `colors`: lista de cores (uma por procedimento) atribuidas ao dente.
// Vazio = dente sem procedimento (preenchimento neutro).
// 1 cor = preenchimento solido (como antes).
// 2+ cores = a silhueta do dente e dividida em faixas verticais, uma por cor,
// para mostrar varios procedimentos no mesmo dente (ex: canal + pino + bloco).
export default function ToothIcon({ type, colors = [], arch = "inferior", size = 34 }) {
  const rawId = useId();
  const clipId = `tooth-clip-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const rotate = arch === "superior" ? "rotate(180 17 32)" : undefined;
  const hasColor = colors.length > 0;
  const strokeColor = hasColor ? "rgba(20,24,22,0.6)" : "var(--ink-soft, #8b968f)";
  const stripeWidth = 34 / Math.max(colors.length, 1);

  return (
    <svg viewBox="0 0 34 64" width={size} height={size * (64 / 34)} className="tooth-icon">
      <g transform={rotate}>
        <clipPath id={clipId}>
          <Shape type={type} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {hasColor ? (
            colors.map((color, i) => (
              <rect
                key={i}
                x={i * stripeWidth}
                y="0"
                width={stripeWidth + 0.5}
                height="64"
                fill={color}
              />
            ))
          ) : (
            <rect x="0" y="0" width="34" height="64" fill="var(--color-surface, #fbfaf6)" />
          )}
        </g>
        <g
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.1"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <Shape type={type} />
        </g>
      </g>
    </svg>
  );
}

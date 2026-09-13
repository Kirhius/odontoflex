import Link from "next/link";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main className={`screen ${styles.home}`}>
      <div className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 34 64" width="30" height="56">
          <g fill="none" stroke="var(--color-gold)" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M17 2 L26 20 L17 24 L8 20 Z" />
            <path d="M13.5 22 L20.5 22 L18.5 60 C18 62.5 16 62.5 15.5 60 Z" />
          </g>
        </svg>
      </div>

      <div className={styles.headline}>
        <span className="eyebrow">Avaliação clínica</span>
        <h1 className={styles.title}>OdontoFlex</h1>
        <p className={styles.subtitle}>
          Marque o odontograma, planeje a sequência e leve o resultado para o
          prontuário oficial. Nada fica salvo aqui.
        </p>
      </div>

      <div className={styles.actions}>
        <Link href="/avaliar" className="btn btn-primary btn-block">
          Avaliar
        </Link>
        <Link href="/configuracoes" className="btn btn-outline btn-block">
          Configurações
        </Link>
      </div>

      <p className={styles.footnote}>
        Criado por Henrique - Whatsapp 61 98421-1779
      </p>
    </main>
  );
}

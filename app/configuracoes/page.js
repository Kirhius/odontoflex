import Link from "next/link";
import styles from "./configuracoes.module.css";

export default function ConfiguracoesPage() {
  return (
    <main className="screen">
      <header className={styles.header}>
        <Link href="/" className={styles.backLink} aria-label="Voltar ao início">
          ←
        </Link>
        <span className="eyebrow">Configurações</span>
      </header>

      <h1 className={styles.title}>Preferências do app</h1>

      <Link href="/configuracoes/procedimentos" className={styles.card}>
        <div>
          <span className={styles.cardTitle}>Procedimentos</span>
          <p className={styles.cardText}>Nomes, cores e complexidade</p>
        </div>
        <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}

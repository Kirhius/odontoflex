"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_PROCEDURES, loadProcedures, saveProcedures, createProcedure } from "@/lib/procedures";
import styles from "./procedimentos.module.css";

const NIVEIS = [1, 2, 3, 4, 5];

export default function ProcedimentosPage() {
  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);
  const [loaded, setLoaded] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState("#4F9C86");
  const [novaComplexidade, setNovaComplexidade] = useState(1);

  useEffect(() => {
    setProcedures(loadProcedures());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveProcedures(procedures);
  }, [procedures, loaded]);

  function updateField(id, field, value) {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function removeProcedure(id) {
    setProcedures((prev) => prev.filter((p) => p.id !== id));
  }

  function addProcedure(e) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    const novo = createProcedure({
      nome: novoNome,
      cor: novaCor,
      complexidade: novaComplexidade,
    });
    setProcedures((prev) => [...prev, novo]);
    setNovoNome("");
    setNovaCor("#4F9C86");
    setNovaComplexidade(1);
  }

  return (
    <main className="screen">
      <header className={styles.header}>
        <Link href="/configuracoes" className={styles.backLink} aria-label="Voltar">
          ←
        </Link>
        <span className="eyebrow">Configurações</span>
      </header>

      <h1 className={styles.title}>Procedimentos</h1>
      <p className={styles.hint}>Cor e complexidade definem o odontograma e a ordem de planejamento.</p>

      <div className={styles.list}>
        {procedures.map((proc) => (
          <div key={proc.id} className={styles.card}>
            <div className={styles.cardTop}>
              <input
                type="color"
                value={proc.cor}
                onChange={(e) => updateField(proc.id, "cor", e.target.value)}
                className={styles.colorInput}
                aria-label={`Cor de ${proc.nome}`}
              />
              <input
                type="text"
                value={proc.nome}
                onChange={(e) => updateField(proc.id, "nome", e.target.value)}
                className={styles.nameInput}
                aria-label="Nome do procedimento"
              />
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => removeProcedure(proc.id)}
                aria-label={`Excluir ${proc.nome}`}
              >
                ✕
              </button>
            </div>
            <div className={styles.levels}>
              {NIVEIS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.level} ${proc.complexidade === n ? styles.levelActive : ""}`}
                  onClick={() => updateField(proc.id, "complexidade", n)}
                  aria-pressed={proc.complexidade === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addProcedure} className={styles.addForm}>
        <span className={styles.addLabel}>Novo procedimento</span>
        <div className={styles.addRow}>
          <input
            type="color"
            value={novaCor}
            onChange={(e) => setNovaCor(e.target.value)}
            className={styles.colorInput}
            aria-label="Cor do novo procedimento"
          />
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do procedimento"
            className={styles.nameInput}
          />
        </div>
        <div className={styles.levels}>
          {NIVEIS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.level} ${novaComplexidade === n ? styles.levelActive : ""}`}
              onClick={() => setNovaComplexidade(n)}
              aria-pressed={novaComplexidade === n}
            >
              {n}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-gold btn-block">
          Adicionar procedimento
        </button>
      </form>
    </main>
  );
}

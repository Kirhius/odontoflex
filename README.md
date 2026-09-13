# OdontoFlex — avaliação odontológica rápida

PWA para dentistas fazerem uma avaliação clínica rápida por odontograma
(sem identificar o paciente) e depois transcreverem o resultado para o
sistema oficial da clínica.

## Princípio de privacidade

**Nenhum dado de avaliação é salvo em lugar nenhum.** Tudo vive apenas no
estado React da página `/avaliar` enquanto ela está aberta. Recarregar a
página apaga tudo — isso é o comportamento esperado.

A única coisa que persiste (em `localStorage`, no navegador) é a
configuração de **Procedimentos** (nome, cor, complexidade), porque é
preferência do app, não dado de paciente. Não há backend, não há banco de
dados, não há login.

## Stack

- Next.js 14 (App Router), JavaScript puro (sem TypeScript)
- CSS puro (CSS Modules), sem Tailwind
- PWA instalável: `manifest.json` + service worker simples (`public/sw.js`)
  que só faz cache do app shell (HTML/ícones), nunca de dados de avaliação
- Deploy: Vercel

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Build de produção

```bash
npm run build
npm start
```

> Nota: `next/font` baixa as fontes (Fraunces e Inter) do Google Fonts
> durante o build. Isso requer acesso à internet no ambiente de build
> (funciona normalmente na Vercel).

## Deploy na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Importe o repositório em https://vercel.com/new.
3. Não é necessária nenhuma variável de ambiente.
4. Deploy.

## Estrutura

```
app/
  page.js                          Tela inicial (Avaliar / Configurações)
  avaliar/page.js                  Fluxo de 3 sub-telas (estado local, nada salvo)
  configuracoes/page.js            Tela de configurações
  configuracoes/procedimentos/     CRUD de procedimentos (localStorage)
components/
  ToothIcon.js                     Ícone SVG por tipo de dente
  ToothChart.js                    Odontograma (4 quadrantes)
  ProcedureModal.js                Seleção de procedimento por dente
  ServiceWorkerRegister.js         Registra o service worker
lib/
  teeth.js                         Numeração FDI e tipo anatômico por dente
  procedures.js                    Config padrão + helpers de localStorage
public/
  manifest.json, sw.js, icons/     Arquivos da PWA
```

## Numeração dos dentes (sistema FDI)

- Permanente (32 dentes): Superior Direito 18–11, Superior Esquerdo 21–28,
  Inferior Esquerdo 31–38, Inferior Direito 48–41.
- Decídua (20 dentes): Superior Direito 55–51, Superior Esquerdo 61–65,
  Inferior Esquerdo 71–75, Inferior Direito 85–81.

## Personalização

Cores, tipografia e demais tokens visuais estão centralizados em
`app/globals.css` (variáveis `--color-*`, `--font-*`).

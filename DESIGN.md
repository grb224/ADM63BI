---
name: Sistema Orçamentário e Financeiro 63º BI
description: Design System Institucional Militar — 63º Batalhão de Infantaria (SAG / Tesouraria)
colors:
  primary: "#3d5016"
  primary-light: "#6b7c3a"
  primary-dark: "#2a3810"
  accent-gold: "#c9a227"
  accent-gold-light: "#e8bc3a"
  accent-green: "#15803d"
  accent-red: "#dc2626"
  accent-blue: "#2563eb"
  neutral-bg: "#f5f2e8"
  neutral-surface: "#ffffff"
  text-primary: "#1a1a1a"
  text-secondary: "#4b5563"
  text-muted: "#6b7280"
  border-default: "#e5e0d8"
  border-accent: "#e8d89e"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.5px"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1.5px"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card-paste-idle:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "24px 16px"
  modal-confirm:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "28px"
---

# Design System: Sistema Orçamentário e Financeiro 63º BI

## 1. Overview

**Creative North Star: "O Baluarte Institucional"**

O Design System do 63º Batalhão de Infantaria foi projetado para transmitir seriedade, precisão militar e máxima eficiência no controle orçamentário e financeiro. O sistema utiliza uma paleta sóbria ancorada no Verde Oliva e detalhes Dourados/Âmbar, combinando um fundo neutro suave (tom pergaminho/papel `#f5f2e8`) com superfícies de cartão brancas e limpas.

Toda interatividade é acompanhada de micro-interações funcionais (como o pulso do robô de colar do SIAFI, a confirmação pop-up dos cartões e os destaques dourados em campos auto-preenchidos), sem recorrer a clichês estéticos de IA ou excessos decorativos.

**Key Characteristics:**
- **Paleta Institucional Militar:** Verde Oliva (`#3d5016`) como cor primária de autoridade e Dourado/Âmbar (`#c9a227`) para destaques e ações especiais.
- **Micro-interações de Feedback:** Feedbacks táteis e animações intencionais para carregamento, confirmações, edições e exclusões.
- **Tipografia Legível e Densa:** Tipografia 'Inter' de alta densidade para dados financeiros e tabelas numéricas (`font-variant-numeric: tabular-nums`).
- **Estados Visuais Inconfundíveis:** Indicadores visuais claros para campos preenchidos automaticamente, campos não aplicáveis (Simples Nacional) e modais de alerta.

## 2. Colors

A paleta de cores é rigorosamente dividida por papéis funcionais e institucionais.

### Primary
- **Verde Oliva Institucional** (`#3d5016`): Cor primária das ações principais, botões de inclusão, submissão e destaques institucionais.
- **Verde Oliva Claro** (`#6b7c3a`): Usado para estados de hover e bordas ativas.
- **Verde Oliva Escuro** (`#2a3810`): Usado no cabeçalho dos painéis e rodapé ativo.

### Secondary / Accent
- **Dourado/Âmbar** (`#c9a227`): Cor de destaque especial para botões de preenchimento automático SIAFI, indicadores de auto-preenchimento e bordas ativas.
- **Verde Sucesso** (`#15803d`): Indicador de sucesso em liquidações, badges de confirmação e cartões preenchidos.
- **Vermelho Alerta / Exclusão** (`#dc2626`): Botões de exclusão, modais de confirmação de exclusão/duplicidade e toasts de erro.
- **Azul Informação** (`#2563eb`): Badges informativas (ex: tipo NP) e notificações orientativas.

### Neutral
- **Fundo Primário** (`#f5f2e8`): Tom neutro quente/institucional de papel para a superfície do corpo.
- **Superfície de Card** (`#ffffff`): Cards, tabelas e modais de fundo branco puro.
- **Texto Principal** (`#1a1a1a`): Texto primário de alta legibilidade (contraste ≥ 4.5:1).
- **Borda Padrão** (`rgba(0, 0, 0, 0.08)` / `#e5e0d8`): Linhas sutis de separação.

### Named Rules
**The One Accent Rule.** A cor dourada âmbar é reservada exclusivamente para ações de automação e destaques especiais (como o preenchimento automático SIAFI). Nunca deve ser usada como cor de fundo geral.

## 3. Typography

**Display Font:** `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
**Body Font:** `Inter, sans-serif`
**Label/Mono Font:** `Inter, sans-serif` / Monospace tabular para números

### Hierarchy
- **Display / Header Title** (Bold 700, 1.3rem / 20px, line-height 1.2): Títulos superiores de módulos em caixa alta.
- **Section Title** (Bold 700, 11px, letter-spacing 1.5px, UPPERCASE): Títulos de seções de formulários e rótulos do SIAFI.
- **Body / Table Content** (Regular 400 / Medium 500, 13px / 12px, line-height 1.5): Texto padrão de formulários e linhas de tabelas.
- **Table Numbers** (SemiBold 600, 12px, `font-variant-numeric: tabular-nums`): Células numéricas de valores em Reais.
- **Label / Helper** (Medium 500, 10px-11px, letter-spacing 0.3px): Legendas e avisos de campo.

## 4. Elevation

O sistema utiliza sombras sutis e camadas tonais para definir profundidade sem poluir o visual.

### Shadow Vocabulary
- **Sombra Suave Card** (`box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)`): Cards de estatística e contêineres neutros.
- **Sombra Média Painel** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06)`): Formulários ativos e tabelas de dados.
- **Sombra Elevada Toast** (`box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08)`): Notificações toast e menus suspensos.
- **Sombra Modal de Confirmação** (`box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2)`): Diálogos de confirmação de exclusão e alertas de duplicidade.

### Named Rules
**The Tonal Layering Rule.** As superfícies são planas em repouso (`#ffffff` sobre `#f5f2e8`). As sombras elevadas aparecem apenas em resposta a estados (hover, foco, modais e notificações).

## 5. Components

### Cards de Colagem e Carregamento (SIAFI / Entrada de Dados)
- **Estado Repouso (Idle):** Borda `2px solid rgba(61,80,22,0.18)`, fundo `#ffffff`, raio `10px` (`var(--radius-md)`), ícone central com mensagem instrutiva.
- **Estado Ativo (Carregando/Colando):** Borda tracejada `2px dashed var(--olive)` com animação de pulso `@keyframes siafi-pulse`, foco no campo de texto.
- **Estado Sucesso (Preenchido):** Borda sólida `2px solid var(--accent-green)`, fundo levemente verde `rgba(21,128,61,0.03)`, badge superior com ícone de check com animação `@keyframes badge-pop`.
- **Destaque Dourado (Auto-preenchido):** Borda `var(--accent-amber)`, brilho `box-shadow: 0 0 0 2px rgba(201,162,39,0.20)`, marcador dourado `✦`.

### Modais de Confirmação e Alertas (Exclusão / Duplicidade)
- **Overlay:** Fundo escuro semitransparente `rgba(0,0,0,0.5)` com transição suave de opacidade.
- **Conteúdo do Modal:** Fundo `#ffffff`, raio `16px` (`var(--radius-lg)`), padding `28px`, largura máxima `480px`, sombra `0 24px 48px rgba(0,0,0,0.2)`.
- **Botão Confirmar Ação Perigosa/Exclusão:** Fundo `#dc2626` (Vermelho Alerta), texto branco, fonte Inter 13px 600, raio `6px`.
- **Botão Cancelar:** Fundo transparente, borda `1px solid rgba(0,0,0,0.08)`, texto `#4b5563`.

### Edição em Linha (Tabelas Interativas)
- **Linha em Edição Ativa (`tr.row-editing`):** Fundo suavemente destacado `rgba(95,111,82,0.05)`.
- **Inputs e Selects em Linha:** Borda `1px solid rgba(0,0,0,0.08)`, fundo `#ffffff`, ao focar gera anel de destaque `0 0 0 2px rgba(95,111,82,0.1)`.

### Botões e Ações de Exclusão / Limpeza
- **Botão de Exclusão de Linha / Lixeira:** Ícone circular `22px x 22px`, fundo `#dc2626`, texto branco, efeito hover com escala `1.15`.
- **Botão Limpar Registro:** Borda `1.5px solid rgba(0,0,0,0.12)`, fundo transparente, texto `#6b7280`. No hover assume fundo `rgba(220,38,38,0.06)` e texto vermelho.

### Notificações Toast
- **Contêiner Fixado:** Canto superior direito (`top: 24px; right: 24px; z-index: 10000`).
- **Animação Entrada:** `@keyframes toastIn 0.3s ease` (desliza da direita com opacidade).
- **Variantes de Estado:** Sucesso (`#15803d`), Erro (`#dc2626`), Aviso (`#d97706`), Info (`#2563eb`).

## 6. Do's and Don'ts

### Do:
- **Do** Manter a paleta neutra institucional baseada no tom `#f5f2e8` e nos cartões brancos `#ffffff`.
- **Do** Utilizar a cor Dourada/Âmbar (`#c9a227`) para destacar inteligência e automação (ex: preenchimento automático SIAFI).
- **Do** Aplicar o estilo inconfundível de cards de carregamento SIAFI (estados Repouso -> Ativo Pulso -> Preenchido Verde/Dourado) em novos fluxos de ingestão de arquivos.
- **Do** Garantir que todo diálogo de exclusão ou ação irreversível utilize o modal com overlay escuro e botão vermelho `#dc2626`.

### Don't:
- **Don't** Utilizar fundos beges ou beges-amarelados papéis exagerados que pareçam layouts antigos de anos 2000.
- **Don't** Usar gradientes coloridos decorativos em textos ou cartões no estilo SaaS genérico.
- **Don't** Criar bordas coloridas espessas no lado esquerdo dos cartões (`border-left` > 2px).
- **Don't** Utilizar cantos excessivamente arredondados (`border-radius` > 16px) em cartões ou tabelas.

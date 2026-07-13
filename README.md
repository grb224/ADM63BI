# Painel Administrativo — 63º Batalhão de Infantaria (SAG 2026)

Este repositório contém o **Sistema de Gestão Financeira e Administrativa do 63º BI**. O sistema é composto por um servidor backend em Python, um painel frontend modular, e um robusto sistema de autenticação, armazenamento e sincronização com o Google Sheets.

## 🗂️ Arquitetura Geral

O sistema é dividido nas seguintes partes principais:
1. **Frontend (Site Adm):** Interface de usuário construída com HTML, CSS e JavaScript puros (Vanilla), desenhada para ser rápida, responsiva e com identidade visual militar/institucional premium.
2. **Backend (Servidor Python):** O script `painel_admin.py` atua como um servidor web local e gerenciador de APIs. Ele serve os arquivos estáticos e lida com endpoints (ex: `/api/liquidacoes`) para persistir dados.
3. **Armazenamento e Sincronização:** Dados são guardados em *caches* locais (`localStorage` no navegador ou arquivos `.json` locais) e espelhados ativamente com o **Google Sheets** na nuvem, garantindo disponibilidade, backup e auditoria colaborativa.

---

## 🧩 Módulos do Sistema

O painel central (`siteadm/index.html`) dá acesso a diferentes ferramentas, divididas por setor:

### 1. 📊 Gestão Orçamentária (`siteadm/projecao/`)
- **Função:** Controlar metas orçamentárias, prever liquidações futuras de RPNP e empenhos correntes.
- **Armazenamento:** Lê arquivos estáticos processados (geralmente gerados por rotinas locais) e os decriptografa no navegador. 
- **Recursos:** Possui painéis de auditoria, progressão de empenhos (40 dias ou mais), análise de metas anuais. Requer tags específicas de permissão (ex: `projecao`, `auditor`).

### 2. 🛡️ COMEX - SFPC (`siteadm/comex/`)
- **Função:** Dashboard gerencial focado na Inteligência Operacional e Logística de Produtos Controlados pelo Exército (PCE).
- **Armazenamento:** Funciona de maneira estática lendo arquivos de carga (CSV) submetidos localmente no navegador pelo operador. O script de carregamento processa grandes massas de dados de fiscalização e mostra os indicadores.
- **Recursos:** Filtros dinâmicos cruzados por cidade, CNPJ, fiscalização e período temporal. Acesso restrito a usuários com a tag `comex`.

### 3. 💵 Setor Financeiro / Tesouraria (`siteadm/scirpt_teouraria/`)
- **Função:** Gerenciamento das liquidações de documentos hábeis (NP, OB, DARF, GRU).
- **Armazenamento (Híbrido):** 
  - **Frontend:** Salva instantaneamente via `localStorage` (chave `liquidacoes_63bi`) para manter a experiência rápida sem atrasos de rede, servindo de fallback.
  - **Backend:** Envia o registro via requisição `POST /api/liquidacoes` (e `/api/liquidacoes/delete` para exclusões).
  - **Google Sheets:** O backend em Python usa o serviço `gspread` para localizar, atualizar e organizar (ordenando por data de emissão decrescente) as planilhas do Google no Drive do 63º BI, organizadas por abas (UGE 160443 e UGE 167443).
- **Recursos:** Leitura automática de PDFs gerados pelo SIAFI para preenchimento ágil. Tabela dinâmica com filtros de colunas, ordenação, e suporte a múltiplos descontos (deduções).

### 4. 📑 Planilhas Externas
- A tela inicial possui um acordeão que redireciona o usuário (caso logado) para planilhas diretas no Google Drive (RPCM, Projetos, Metas, Pregões).

---

## 🔒 Sistema de Login e Comunicação Segura (`siteadm/assets/login.js`)

Todos os módulos confidenciais compartilham o mesmo fluxo de autenticação e proteção de dados:
1. **Perfis (logins.json):** Cada perfil possui um `hash` de sua senha e uma `wrapped_key` (chave criptografada). As permissões do usuário são geridas por uma array de `tags` (ex: `["admin"]`, `["comex"]`).
2. **Criptografia WebCrypto (AES-GCM):** No momento de login, a senha inserida é convertida num Hash SHA-256 que verifica a identidade e decriptografa a `wrapped_key` para expor a **Chave Mestra** do ambiente.
3. **Intercepção Global:** Se habilitado no `config.json`, qualquer página acessada valida se há um `token` ativo em Sessão (SessionStorage / LocalStorage). O botão e ícone superior (Badge do Usuário) fornecem feedback de qual perfil está operando.

---

## ⚙️ Como executar localmente

1. **Dependências:**
   O projeto requer Python 3 instalado. Instale a biblioteca de comunicação com as planilhas do Google:
   ```bash
   pip install gspread google-auth cryptography
   ```
2. **Iniciar o Servidor Python:**
   Execute na raiz do projeto:
   ```bash
   python painel_admin.py
   ```
3. **Acesso:**
   Abra o navegador em: [http://localhost:5000/siteadm/](http://localhost:5000/siteadm/)
   *(As rotinas Python geram uma conexão ao Google Sheets de forma silenciosa e preparam o cache para envio dos dados).*

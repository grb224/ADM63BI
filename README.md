# Painel Administrativo — 63º Batalhão de Infantaria (SAG 2026)

Este repositório contém o **Sistema de Gestão Financeira e Administrativa do 63º BI**. O sistema é composto por um servidor backend em Python, um painel frontend modular, e um robusto sistema de autenticação, armazenamento e sincronização com o Google Sheets.

## 🗂️ Arquitetura Geral

O repositório é estruturado para separar o código de funcionamento do site das rotinas externas de automação de dados:

1. **`siteadm/` (Funcionamento do Site e Backend API):** Agrupa todos os arquivos da interface gráfica frontend, o servidor backend `painel_admin.py` (que gerencia sessões, banco Supabase e sincronização Sheets) e o arquivo `supabase_config.json`.
2. **`script_gestao_orcamentaria/` (Dados e Scraping):** Pasta com scripts locais que realizam raspagem no SAG e alimentam os dados consolidados do site.
3. **`scripts/` (Utilitários):** Contém utilitários adicionais, como gerador de logins e hashes.
4. **Executáveis na Raiz:** Arquivos `.bat` facilitadores (`iniciar_painel.bat` e `rotina_diaria.bat`).

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

### 3. 💵 Setor Financeiro / Tesouraria (`siteadm/tesouraria/`)
- **Função:** Gerenciamento das liquidações de documentos hábeis (NP, AV, DT, FL).
- **Armazenamento (Híbrido):** 
  - **Frontend:** Salva instantaneamente via `localStorage` (chave `liquidacoes_63bi`) para manter a experiência rápida sem atrasos de rede, servindo de fallback.
  - **Backend:** Envia o registro via requisição `POST /api/liquidacoes` (e `/api/liquidacoes/delete` para exclusões).
  - **Google Sheets:** O backend em Python usa o serviço `gspread` para localizar, atualizar e organizar (ordenando por data de emissão decrescente) as planilhas do Google no Drive do 63º BI, organizadas por abas (UGE 160443 e UGE 167443).
- **Preenchimento Automático Inteligente (SIAFI):** 
  - Cartões interativos que ativam ao passar o mouse para receber a colagem direta de texto (Ctrl+A e Ctrl+V) da aba "Dados Básicos" e "Dedução" do SIAFI.
  - Botão dourado de preenchimento automático ⚡ (`Realizar preenchimento automático`) que executa o parse dos dados copiados.
  - Se a empresa for optante pelo Simples, as deduções e o código de natureza são automaticamente bloqueados e marcados com visual hachurado de "Não se aplica" (`.field-na`).
  - Destaque dourado (`.field-autofilled`) nos campos preenchidos com sucesso via parser.
  - Validação ativa de notas fiscais (NF) duplicadas no momento do preenchimento automático para evitar lançamentos repetidos.
- **Validações e Controles:**
  - Campo UGE bloqueado para edição direta (readonly), sendo determinado dinamicamente pela aba ativa do painel.
  - Restrição rígida aos tipos de DH: **NP** (Nota de Pagamento), **AV** (Autorização de Viagem), **DT** (Documento de Transferência) e **FL** (Folha).
  - Botão de limpeza rápida integrado à barra de ações do formulário.
  - Tabela dinâmica com filtros de colunas persistentes no estilo Excel e seleção de sublinhas de deduções.

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
   Você pode dar um duplo clique no arquivo `iniciar_painel.bat` na raiz do projeto, ou executar:
   ```bash
   python siteadm/painel_admin.py
   ```
3. **Acesso:**
   Abra o navegador em: [http://localhost:5000/siteadm/](http://localhost:5000/siteadm/)
   *(As rotinas Python geram uma conexão ao Google Sheets de forma silenciosa e preparam o cache para envio dos dados).*

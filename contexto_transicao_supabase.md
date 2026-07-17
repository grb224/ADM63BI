# Contexto do Projeto e Plano de Transição para o Supabase (SAG 2026)

Este documento descreve a arquitetura atual do **Sistema de Gestão Financeira e Administrativa do 63º BI** e fornece um plano detalhado para migrar o sistema de autenticação local (baseado em arquivos JSON criptografados) para o **Supabase Auth + Database**, mantendo o painel administrativo de controle de usuários e tags.

---

## 🔍 Contexto do Projeto Atual

### 1. Estrutura de Diretórios e Páginas
* **`siteadm/index.html`**: Menu principal do sistema com acordeão de links integrados do Google Drive.
* **`siteadm/tesouraria/liquidacoes.html`**: Controle de liquidações (antigo `scirpt_teouraria`). Permite inclusão e edição rápida, filtros de coluna no estilo Excel, e ordenação inteligente.
* **`siteadm/projecao/index.html`**: Módulo de Gestão Orçamentária e Projeções.
* **`siteadm/comex/index.html`**: Módulo de PCE - SFPC (COMEX).
* **`painel_admin.html`**: Painel de gerenciamento de usuários.
* **`painel_admin.py`**: Servidor Flask/Python backend local. Ele lida com APIs como `/api/liquidacoes` e serve os estáticos.

### 2. O Sistema de Login Atual (Problema)
O sistema atual em `siteadm/assets/login.js` e `painel_admin.py` é baseado em criptografia local cliente-side:
* Os perfis ficam armazenados em `siteadm/dados/logins.json` com um hash PBKDF2 da senha, tags (ex: `["admin"]`, `["comex"]`) e uma chave criptografada (`wrapped_key`).
* A descriptografia da base local do Projeção Orçamentária depende da derivação da **Chave Mestra** a partir da senha do usuário em tempo de execução via WebCrypto (AES-GCM).
* **Problema:** Essa solução é complexa para sincronizar após o deploy e propensa a falhas de consistência e segurança de chave compartilhada, além de dificultar o reset de senhas.

---

## 🛠️ Plano de Transição para o Supabase

A migração deve substituir o controle de arquivos local do `login.js` pelo cliente do Supabase, salvando as informações e as tags de controle no banco de dados do Supabase.

### 1. Estrutura do Banco de Dados no Supabase
Você precisará de uma tabela no Supabase para armazenar as permissões adicionais (tags e nome visível) dos usuários criados, estendendo o `auth.users`:

```sql
-- Criar a tabela de perfis de usuário
create table public.perfis (
  id uuid references auth.users on delete cascade primary key,
  nome_visivel text not null,
  tags text[] default '{}'::text[], -- ex: {'admin', 'comex', 'projecao'}
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.perfis enable row level security;

-- Criar políticas de leitura e gravação
create policy "Permitir leitura de perfis para usuários autenticados"
  on public.perfis for select
  using (auth.role() = 'authenticated');

create policy "Permitir atualização de perfis apenas por administradores"
  on public.perfis for all
  using (
    exists (
      select 1 from public.perfis
      where id = auth.uid() and 'admin' = any(tags)
    )
  );
```

### 2. Modificações no Frontend (`siteadm/assets/login.js`)
* Substitua a lógica de verificação de senhas local e descriptografia manual por chamadas à API do Supabase Client:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  ```
* Ao realizar o login (`supabase.auth.signInWithPassword`), obtenha o perfil correspondente na tabela `public.perfis` para carregar as `tags` e o `nome_visivel`.
* Salve os tokens e dados de sessão na SessionStorage de maneira compatível com os módulos existentes.

### 3. Painel Administrativo de Usuários (`painel_admin.html`)
* Atualmente, o Painel Admin lê e grava no backend Python usando `logins.json`. 
* Com o Supabase, o painel administrativo pode usar o Supabase Client para listar os usuários e cadastrar novos.
* *Nota:* Para criar novos usuários diretamente pelo painel administrativo frontend (sem que eles precisem se registrar por conta própria), você pode utilizar uma **Edge Function** no Supabase usando a chave de serviço (`service_role`) para interagir com a Admin Auth API do Supabase com segurança, evitando expor chaves sensíveis no frontend.

---

## 📋 Instruções para o Próximo Agente

1. **Instalação e CDN:** Configure a CDN do Supabase nos arquivos `.html` pertinentes (`index.html`, `liquidacoes.html`, `painel_admin.html`, `projecao/index.html` e `comex/index.html`).
2. **Substituição da lógica do `login.js`:** 
   - Inicialize o cliente: `const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
   - Adapte os métodos `LoginSystem.init()`, `LoginSystem.login()` e `LoginSystem.logout()` para chamar a SDK do Supabase.
   - Restriture a validação de sessão usando `supabase.auth.getSession()`.
3. **Refatoração do Painel Admin:**
   - Adapte a tabela de gerenciamento de usuários em `painel_admin.html` para listar e atualizar os registros da tabela `public.perfis` no Supabase.

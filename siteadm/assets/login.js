// ── LOGIN SYSTEM ──
// Requires modern browser for crypto.subtle (SHA-256)

// Global fetch override to automatically append authentication token and handle session expiration
(function() {
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const token = localStorage.getItem('adm_auth_token') || sessionStorage.getItem('adm_auth_token');
    if (token) {
      init = init || {};
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        init.headers.set('X-Session-Token', token);
      } else if (Array.isArray(init.headers)) {
        init.headers.push(['X-Session-Token', token]);
      } else {
        init.headers['X-Session-Token'] = token;
      }
    }
    
    const response = await originalFetch(input, init);
    
    // Se o backend retornar 403 (Proibido) ou 401 (Não Autorizado), a sessão no servidor expirou ou foi reiniciada
    if (response.status === 403 || response.status === 401) {
      const url = typeof input === 'string' ? input : (input.url || '');
      // Evita loops infinitos no endpoint de login
      if (url.includes('/api/') && !url.includes('/api/login')) {
        console.warn("[SESSÃO] Sessão expirada ou inválida (HTTP " + response.status + "). Redirecionando para login.");
        
        // Limpa tokens expirados
        localStorage.removeItem('adm_auth_token');
        localStorage.removeItem('adm_auth_perfil');
        localStorage.removeItem('adm_auth_nome');
        localStorage.removeItem('adm_auth_tags');
        localStorage.removeItem('adm_master_key');
        sessionStorage.removeItem('adm_auth_token');
        sessionStorage.removeItem('adm_auth_perfil');
        sessionStorage.removeItem('adm_auth_nome');
        sessionStorage.removeItem('adm_auth_tags');
        sessionStorage.removeItem('adm_master_key');
        
        // Abre o modal de login se disponível ou recarrega a página
        if (typeof LoginSystem !== 'undefined' && typeof LoginSystem.openModal === 'function') {
          LoginSystem.openModal("Sessão expirada. Por favor, faça login novamente.");
        } else {
          window.location.reload();
        }
      }
    }
    
    return response;
  };
})();

const LoginSystem = {
  pendingUrl: null,
  loginRequired: true, // default, overridden by config.json

  getBasePath: function() {
    return this.isModulePage() ? '../' : './';
  },

  isModulePage: function() {
    const path = window.location.pathname;
    return path.includes('/projecao/') || path.includes('/comex/') || path.includes('/tesouraria/') || path.includes('/admin/');
  },

  init: async function() {
    // 0. Check if login is required
    let config = null;
    const rootPath = this.getBasePath();
    try {
      const configRes = await fetch(rootPath + 'api/config?_t=' + Date.now());
      if (configRes.ok) {
        config = await configRes.json();
      }
    } catch (e) {
      console.log("[CONFIG] Falha ao carregar api/config local. Tentando fallback estático...");
    }

    if (!config) {
      try {
        const publicRes = await fetch(rootPath + 'dados/config_public.json?_t=' + Date.now());
        if (publicRes.ok) {
          config = await publicRes.json();
          console.log("[CONFIG] Configurações públicas do banco de dados carregadas.");
        }
      } catch (err) {
        console.warn("[CONFIG] Não foi possível carregar config_public.json", err);
      }
    }

    if (config) {
      this.loginRequired = config.login_required !== false; // default true
      
      // Dynamically initialize Supabase if keys are provided
      if (config.supabase_url && config.supabase_anon_key) {
        try {
          if (!window.supabase) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          this.supabase = window.supabase.createClient(config.supabase_url, config.supabase_anon_key);
          this.useSupabase = true;
          console.log("[DB] Cliente de banco de dados inicializado com sucesso.");
          
          // Buscar configuração em tempo real no Supabase
          try {
            const { data, error } = await this.supabase
              .from('config')
              .select('value')
              .eq('key', 'settings')
              .single();
            if (data && data.value && data.value.login_required !== undefined) {
              this.loginRequired = data.value.login_required;
              console.log("[CONFIG] Exigir login atualizado via banco de dados:", this.loginRequired);
            }
          } catch (cfgErr) {
            console.warn("[CONFIG] Falha ao ler config em tempo real do banco:", cfgErr);
          }
        } catch (err) {
          console.error("[DB] Falha ao inicializar o banco de dados. Usando fallback local.", err);
          this.useSupabase = false;
        }
      }
    }

    // If login is disabled, auto-authenticate silently
    if (!this.loginRequired) {
      sessionStorage.setItem('adm_auth_token', 'authenticated');
      sessionStorage.setItem('adm_auth_perfil', 'acesso_livre');
      sessionStorage.setItem('adm_auth_nome', 'Acesso Livre');
      sessionStorage.setItem('adm_auth_tags', JSON.stringify(['admin']));
    }

    // 1. Create Modal HTML
    this.createModal();

    // 2. Intercept module clicks (only if login required)
    if (this.loginRequired) {
      this.interceptLinks();
    }
    
    // 3. Check if current page is protected and we are not logged in
    if (this.loginRequired) {
      this.checkCurrentPage();
    }

    // 4. Render user badge if logged in
    if (this.isLoggedIn()) {
      this.renderUserBadge();
    }
    
    this.updateLoginStateUI();
    this.initialized = true;
  },

  createModal: function() {
    const html = `
      <div id="login-overlay">
        <div class="login-modal">
          <button class="login-close" id="login-close">✕</button>
          <div class="login-header">
            <h2>Acesso Restrito</h2>
            <p>Por favor, efetue o login com o perfil da sua seção.</p>
          </div>
          <div class="login-group">
            <label for="login-perfil">Perfil</label>
            <input type="text" id="login-perfil" placeholder="Insira seu usuário" autocomplete="off">
          </div>
          <div class="login-group">
            <label for="login-senha">Senha</label>
            <input type="password" id="login-senha" placeholder="••••••••">
          </div>
          <div class="login-options">
            <input type="checkbox" id="login-remember">
            <label for="login-remember">Permanecer conectado</label>
          </div>
          <button class="btn-login" id="btn-login-submit">Entrar</button>
          <div id="login-error"></div>
          
          <div id="login-success-overlay" style="display:none;">
            <div class="success-icon">✓</div>
            <h3>Autenticado!</h3>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('btn-login-submit').addEventListener('click', () => this.handleLogin());
    document.getElementById('login-senha').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });
    document.getElementById('login-close').addEventListener('click', () => this.closeModal());
  },



  interceptLinks: function() {
    // Interceptar cliques no index.html
    const links = document.querySelectorAll('a.module-card.active, a.btn-acesso-restrito, a.module-action-btn:not(.disabled-btn)');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        if (!this.isLoggedIn()) {
          e.preventDefault();
          this.pendingUrl = link.href;
          this.openModal("Acesso bloqueado. Efetue login para continuar.");
        }
      });
    });
  },

  checkCurrentPage: function() {
    const path = window.location.pathname;
    
    // Check if we are on the admin page
    if (path.includes('/siteadm/admin/')) {
      if (!this.isLoggedIn()) {
        this.showAccessDenied("Acesso Negado. Você precisa fazer login como Admin para acessar o Painel Admin.", '../');
        return;
      }
      const tagsStr = localStorage.getItem('adm_auth_tags') || sessionStorage.getItem('adm_auth_tags') || "[]";
      const tags = JSON.parse(tagsStr);
      if (!tags.includes('admin')) {
        this.showAccessDenied("Acesso Negado. Apenas administradores podem acessar o Painel Admin.", '../');
        return;
      }
    }

    if (this.isModulePage()) {
      if (!this.isLoggedIn()) {
        this.showAccessDenied("Acesso Negado. Você precisa fazer login para acessar este módulo.", '../');
        return;
      }
      
      // Checa permissão específica
      const tagsStr = localStorage.getItem('adm_auth_tags') || sessionStorage.getItem('adm_auth_tags') || "[]";
      const tags = JSON.parse(tagsStr);
      
      if (tags.includes('admin')) return; // Admin bypass
      
      if (path.includes('/projecao/')) {
        if (!tags.includes('projecao') && !tags.includes('auditor')) {
          this.showAccessDenied("Acesso Negado. Seu perfil não tem permissão para o módulo de Gestão Orçamentária.", '../');
          return;
        }
      }
      if (path.includes('/comex/') && !tags.includes('comex')) {
        this.showAccessDenied("Acesso Negado. Seu perfil não tem permissão para o módulo COMEX.", '../');
        return;
      }
      if (path.includes('/tesouraria/') && !tags.includes('setfinliq')) {
        this.showAccessDenied("Acesso Negado. Seu perfil não tem permissão para o Controle de Liquidações.", '../');
        return;
      }
    }
  },

  isLoggedIn: function() {
    const token = localStorage.getItem('adm_auth_token') || sessionStorage.getItem('adm_auth_token');
    return !!token;
  },

  openModal: function(msg = "") {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = msg;
    errorEl.style.color = msg.includes("bloqueado") ? "var(--olive)" : "var(--red)";
    
    document.getElementById('login-overlay').classList.add('active');
    document.getElementById('login-perfil').focus();
  },

  closeModal: function() {
    document.getElementById('login-overlay').classList.remove('active');
    this.pendingUrl = null;
  },

  async handleLogin() {
    const perfil = document.getElementById('login-perfil').value.trim().toLowerCase();
    const senha = document.getElementById('login-senha').value;
    const remember = document.getElementById('login-remember').checked;
    const errorEl = document.getElementById('login-error');

    if (!perfil || !senha) {
      errorEl.textContent = "Preencha perfil e senha.";
      errorEl.style.color = "var(--red)";
      return;
    }

    try {
      let resData;
      
      if (this.useSupabase) {
        // Converte o nome do perfil em um email virtual do 63º BI
        const email = perfil.includes('@') ? perfil : `${perfil}@63bi.mil.br`;
        
        // 1. Efetua o login no Supabase Auth
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: email,
          password: senha
        });
        
        if (error) {
          errorEl.textContent = "Perfil não encontrado ou senha inválida no banco de dados.";
          errorEl.style.color = "var(--red)";
          return;
        }

        // 2. Registra a sessão no backend local utilizando o access_token obtido
        let sessionResOk = false;
        try {
          const sessionRes = await fetch(this.getBasePath() + 'api/login_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              perfil: perfil
            })
          });

          if (sessionRes.ok) {
            resData = await sessionRes.json();
            sessionResOk = true;
          } else {
            console.warn("[LOGIN] Backend local respondeu com erro, tentando Supabase direto...");
          }
        } catch (err) {
          console.warn("[LOGIN] Falha de conexão com backend local, operando no modo serverless:", err);
        }

        if (!sessionResOk) {
          // Fallback: Obter dados de perfil diretamente do Supabase (Modo Serverless)
          const { data: profileRows, error: profileErr } = await this.supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id);
            
          if (profileErr || !profileRows || profileRows.length === 0) {
            // Se o perfil não existe no banco, cria um perfil padrão
            const defaultProfile = {
              id: data.user.id,
              nome_visivel: perfil.charAt(0).toUpperCase() + perfil.slice(1),
              tags: []
            };
            await this.supabase.from('perfis').insert([defaultProfile]);
            resData = {
              token: data.session.access_token,
              perfil: perfil,
              nome: defaultProfile.nome_visivel,
              tags: defaultProfile.tags,
              wrapped_key: ""
            };
          } else {
            const profile = profileRows[0];
            resData = {
              token: data.session.access_token,
              perfil: perfil,
              nome: profile.nome_visivel || perfil,
              tags: profile.tags || [],
              wrapped_key: profile.wrapped_key || ""
            };
          }
        }
      } else {
        // Fallback: Login legado local
        const response = await fetch(this.getBasePath() + 'api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perfil, senha })
        });
        
        if (!response.ok) {
          const legacyErr = await response.json();
          errorEl.textContent = legacyErr.error || "Erro ao efetuar login.";
          errorEl.style.color = "var(--red)";
          return;
        }
        
        resData = await response.json();
      }
      
      // Descriptografa a chave mestra utilizando a senha digitada se ela existir
      let masterKeyHex = "";
      if (resData.wrapped_key) {
        masterKeyHex = await this.decryptMasterKey(resData.wrapped_key, senha);
        if (!masterKeyHex) {
          console.warn("[LOGIN] Falha ao descriptografar a chave mestra com a senha fornecida. Prosseguindo sem criptografia.");
          masterKeyHex = "";
        }
      } else {
        console.warn("[LOGIN] Perfil sem chave mestra (wrapped_key). Permitindo acesso direto.");
      }
      
      // Salva a sessão localmente
      const token = resData.token;
      const tagsStr = JSON.stringify(resData.tags || []);
      
      if (remember) {
        localStorage.setItem('adm_auth_token', token);
        localStorage.setItem('adm_auth_perfil', resData.perfil);
        localStorage.setItem('adm_auth_nome', resData.nome || resData.perfil);
        localStorage.setItem('adm_auth_tags', tagsStr);
        localStorage.setItem('adm_master_key', masterKeyHex);
      } else {
        sessionStorage.setItem('adm_auth_token', token);
        sessionStorage.setItem('adm_auth_perfil', resData.perfil);
        sessionStorage.setItem('adm_auth_nome', resData.nome || resData.perfil);
        sessionStorage.setItem('adm_auth_tags', tagsStr);
        sessionStorage.setItem('adm_master_key', masterKeyHex);
      }
      
      // Efeitos visuais de sucesso
      document.querySelector('.login-header').style.display = 'none';
      document.querySelectorAll('.login-group').forEach(el => el.style.display = 'none');
      document.querySelector('.login-options').style.display = 'none';
      document.getElementById('btn-login-submit').style.display = 'none';
      document.getElementById('login-close').style.display = 'none';
      document.getElementById('login-error').style.display = 'none';
      
      const successOverlay = document.getElementById('login-success-overlay');
      successOverlay.style.display = 'flex';
      successOverlay.classList.add('animate-success');
      
      setTimeout(() => {
        this.closeModal();
        
        if (!this.pendingUrl) {
          this.renderUserBadge();
          this.updateLoginStateUI();
        }

        setTimeout(() => {
          document.querySelector('.login-header').style.display = 'block';
          document.querySelectorAll('.login-group').forEach(el => el.style.display = 'block');
          document.querySelector('.login-options').style.display = 'flex';
          document.getElementById('btn-login-submit').style.display = 'block';
          document.getElementById('login-close').style.display = 'flex';
          document.getElementById('login-error').style.display = 'block';
          successOverlay.style.display = 'none';
          successOverlay.classList.remove('animate-success');
          document.getElementById('login-senha').value = '';
        }, 500);

        if (this.pendingUrl) {
          window.location.href = this.pendingUrl;
        }
      }, 1200);
      
    } catch(err) {
      errorEl.textContent = "Erro de conexão com o servidor.";
      errorEl.style.color = "var(--red)";
      console.error(err);
    }
  },

  renderUserBadge: function() {
    if (document.getElementById('adm-user-badge')) return;
    
    let nomeVisivel = localStorage.getItem('adm_auth_nome') || sessionStorage.getItem('adm_auth_nome') || 'Usuário';
    // Se o nome não tiver sido definido, tentamos o perfil com primeira letra maiúscula
    if (nomeVisivel === 'Usuário' || nomeVisivel === localStorage.getItem('adm_auth_perfil')) {
       let perfil = localStorage.getItem('adm_auth_perfil') || sessionStorage.getItem('adm_auth_perfil') || 'teste';
       nomeVisivel = perfil.charAt(0).toUpperCase() + perfil.slice(1);
    }
    
    const isModule = this.isModulePage();
    const badgeClass = isModule ? 'adm-user-badge compact-mode' : 'adm-user-badge';
    
    const html = `
      <div id="adm-user-badge" class="${badgeClass}">
        <span class="user-icon">👤</span>
        <span class="user-name">Logado como <b>${nomeVisivel}</b></span>
        <button id="btn-logout" class="btn-logout" title="Sair do sistema">Sair</button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    
    document.getElementById('btn-logout').addEventListener('click', () => {
      const token = localStorage.getItem('adm_auth_token') || sessionStorage.getItem('adm_auth_token');
      if (token) {
        fetch(this.getBasePath() + 'api/logout', {
          method: 'POST'
        }).catch(() => {});
      }
      localStorage.removeItem('adm_auth_token');
      localStorage.removeItem('adm_auth_perfil');
      localStorage.removeItem('adm_auth_nome');
      localStorage.removeItem('adm_auth_tags');
      localStorage.removeItem('adm_master_key');
      sessionStorage.removeItem('adm_auth_token');
      sessionStorage.removeItem('adm_auth_perfil');
      sessionStorage.removeItem('adm_auth_nome');
      sessionStorage.removeItem('adm_auth_tags');
      sessionStorage.removeItem('adm_master_key');
      window.location.href = isModule ? '../' : './';
    });
  },

  updateLoginStateUI: function() {
    const isIndex = !this.isModulePage();
    if (!isIndex) return;

    // 1. Hide/remove any existing login button in the header
    const loginBtn = document.getElementById('btn-login-header');
    if (loginBtn) {
      loginBtn.remove();
    }
    
    // 2. Remove any existing header badge to avoid duplicates
    const existingHeaderInfo = document.getElementById('user-header-info');
    if (existingHeaderInfo) {
      existingHeaderInfo.remove();
    }

    // 3. Render header badge
    const headerInner = document.querySelector('.header-inner');
    if (headerInner) {
      document.body.classList.add('index-page-active');
      if (this.isLoggedIn()) {
        let nomeVisivel = localStorage.getItem('adm_auth_nome') || sessionStorage.getItem('adm_auth_nome') || 'Usuário';
        if (nomeVisivel === 'Usuário' || nomeVisivel === localStorage.getItem('adm_auth_perfil')) {
           let perfil = localStorage.getItem('adm_auth_perfil') || sessionStorage.getItem('adm_auth_perfil') || 'teste';
           nomeVisivel = perfil.charAt(0).toUpperCase() + perfil.slice(1);
        }
        const headerBadge = `
          <div id="user-header-info" class="user-header-info">
            <span>Logado como: <b>${nomeVisivel}</b></span>
            <button id="btn-logout-header" class="btn-logout-header" title="Sair do sistema">Sair</button>
          </div>
        `;
        headerInner.insertAdjacentHTML('beforeend', headerBadge);
        
        document.getElementById('btn-logout-header').addEventListener('click', () => {
          const logoutBtn = document.getElementById('btn-logout');
          if (logoutBtn) {
            logoutBtn.click();
          } else {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }
        });
      } else {
        const loginBtnHtml = `
          <button id="btn-login-header" class="btn-login-header">Entrar</button>
        `;
        headerInner.insertAdjacentHTML('beforeend', loginBtnHtml);
        document.getElementById('btn-login-header').addEventListener('click', () => {
          this.openModal();
        });
      }
    }

    // 4. Update modules visual states
    if (this.isLoggedIn() && this.loginRequired) {
      this.hideUnauthorizedModules();
    }
  },

  hideUnauthorizedModules: function() {
    const isIndex = !this.isModulePage();
    if (!isIndex) return;
    
    const tagsStr = localStorage.getItem('adm_auth_tags') || sessionStorage.getItem('adm_auth_tags') || "[]";
    const tags = JSON.parse(tagsStr);
    
    const isAdmin = tags.includes('admin');
    
    // Check projecao and comex module cards
    const projCard = document.getElementById('module-projecao');
    if (projCard) {
      if (!isAdmin && !tags.includes('projecao') && !tags.includes('auditor')) {
        projCard.classList.add('unauthorized');
        projCard.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showTabDeniedModal("Acesso Negado. Seu perfil não tem permissão para o módulo de Gestão Orçamentária.");
        }, true);
      } else {
        projCard.classList.remove('unauthorized');
      }
    }

    const comexCard = document.getElementById('module-comex');
    if (comexCard) {
      if (!isAdmin && !tags.includes('comex')) {
        comexCard.classList.add('unauthorized');
        comexCard.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showTabDeniedModal("Acesso Negado. Seu perfil não tem permissão para o módulo COMEX.");
        }, true);
      } else {
        comexCard.classList.remove('unauthorized');
      }
    }

    // Check Setor Financeiro buttons inside module-financeiro card
    const finLiqBtn = document.querySelector('#module-financeiro .primary-btn');
    const finDashBtn = document.querySelector('#module-financeiro .secondary-btn');
    const finCard = document.getElementById('module-financeiro');
    
    if (!isAdmin) {
      const hasLiq = tags.includes('setfinliq');
      const hasDash = tags.includes('setfindashboard');
      
      if (finLiqBtn && !hasLiq) {
        finLiqBtn.classList.add('unauthorized');
        finLiqBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showTabDeniedModal("Acesso Negado. Seu perfil não tem permissão para o Controle de Liquidações.");
        }, true);
      }
      if (finDashBtn && !hasDash) {
        finDashBtn.classList.add('unauthorized');
        finDashBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showTabDeniedModal("Acesso Negado. Seu perfil não tem permissão para o Dashboard do Setor Financeiro.");
        }, true);
      }
      
      // If both actions are unauthorized, fade the whole card
      if (finCard && finLiqBtn && finDashBtn && finLiqBtn.classList.contains('unauthorized') && finDashBtn.classList.contains('unauthorized')) {
        finCard.classList.add('unauthorized');
      }
    }
  },
  
  showAccessDenied: function(message, redirectUrl) {
    document.body.innerHTML = `
      <style>
        body { margin: 0; padding: 0; background: #f5f2e8; }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      </style>
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;">
        <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; text-align: center; animation: popIn 0.3s ease;">
          <div style="width: 64px; height: 64px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 16px;">!</div>
          <h2 style="color: #111827; margin: 0 0 12px; font-size: 20px;">Acesso Restrito</h2>
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px;">${message}</p>
          <button onclick="window.location.href='${redirectUrl}'" style="background: #3d5016; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.2s;" onmouseover="this.style.background='#2a3810'" onmouseout="this.style.background='#3d5016'">${redirectUrl ? 'Voltar ao Menu' : 'Fechar'}</button>
        </div>
      </div>
    `;
  },
  
  showTabDeniedModal: function(message) {
    const html = `
      <div id="tab-denied-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:99999; display:flex; align-items:center; justify-content:center;">
        <div style="background:white; padding:32px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); max-width:400px; text-align:center; animation: popIn 0.3s ease;">
          <div style="width:64px; height:64px; background:#ef4444; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:bold; margin:0 auto 16px;">!</div>
          <h2 style="color:#111827; margin:0 0 12px; font-family:'Inter',sans-serif; font-size:20px;">Acesso Restrito</h2>
          <p style="color:#4b5563; font-family:'Inter',sans-serif; font-size:14px; margin:0 0 24px;">${message}</p>
          <button onclick="document.getElementById('tab-denied-overlay').remove()" style="background:#3d5016; color:white; border:none; padding:10px 24px; border-radius:6px; font-weight:bold; cursor:pointer; width:100%;">Entendido</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async decryptMasterKey(wrappedKeyHex, password) {
    if (!wrappedKeyHex) return null;
    try {
      const passwordBuffer = new TextEncoder().encode(password);
      const userKeyHash = await crypto.subtle.digest('SHA-256', passwordBuffer);
      
      const userKey = await crypto.subtle.importKey(
        'raw',
        userKeyHash,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const wrappedBytes = new Uint8Array(wrappedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const nonce = wrappedBytes.slice(0, 12);
      const ciphertext = wrappedBytes.slice(12);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        userKey,
        ciphertext
      );
      
      const decryptedBytes = new Uint8Array(decryptedBuffer);
      let masterKeyHex = '';
      for (let i = 0; i < decryptedBytes.length; i++) {
        masterKeyHex += decryptedBytes[i].toString(16).padStart(2, '0');
      }
      return masterKeyHex;
    } catch (err) {
      console.error('Failed to decrypt master key:', err);
      return null;
    }
  },

  async decryptData(base64Payload, masterKeyHex) {
    if (!base64Payload || !masterKeyHex) {
      throw new Error("Dados criptografados ou chave ausente.");
    }
    try {
      const binaryString = atob(base64Payload);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const nonce = bytes.slice(0, 12);
      const ciphertext = bytes.slice(12);
      
      const keyBytes = new Uint8Array(masterKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const masterKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        masterKey,
        ciphertext
      );
      
      const jsonStr = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Erro na decriptação dos dados:", err);
      throw new Error("Falha ao descriptografar os dados. A chave de acesso pode estar inválida.");
    }
  },

  async sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);                    
    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  LoginSystem.init();
});

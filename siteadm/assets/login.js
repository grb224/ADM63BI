// ── LOGIN SYSTEM ──
// Requires modern browser for crypto.subtle (SHA-256)

const LoginSystem = {
  loginsUrl: '/dados/logins.json',
  loginsData: null,
  pendingUrl: null,
  loginRequired: true, // default, overridden by config.json

  isModulePage: function() {
    const path = window.location.pathname;
    return path.includes('/projecao/') || path.includes('/comex/') || path.includes('/scirpt_teouraria/');
  },

  init: async function() {
    // 0. Check if login is required
    try {
      const rootPath = this.isModulePage() ? '../' : './';
      const configRes = await fetch(rootPath + 'dados/config.json?_t=' + Date.now());
      if (configRes.ok) {
        const config = await configRes.json();
        this.loginRequired = config.login_required !== false; // default true
      }
    } catch(e) { /* config missing = login required */ }

    // If login is disabled, auto-authenticate silently
    if (!this.loginRequired) {
      sessionStorage.setItem('adm_auth_token', 'authenticated');
      sessionStorage.setItem('adm_auth_perfil', 'acesso_livre');
      sessionStorage.setItem('adm_auth_nome', 'Acesso Livre');
      sessionStorage.setItem('adm_auth_tags', JSON.stringify(['admin']));
      // Set a dummy master key for data decryption — need the real one
      if (!sessionStorage.getItem('adm_master_key') && !localStorage.getItem('adm_master_key')) {
        try {
          const rootPath2 = this.isModulePage() ? '../' : './';
          const loginsRes = await fetch(rootPath2 + 'dados/logins.json?_t=' + Date.now());
          if (loginsRes.ok) {
            const logins = await loginsRes.json();
            // Use first admin user's wrapped key with default password
            const adminUser = logins.find(u => u.tags && u.tags.includes('admin'));
            if (adminUser && adminUser.wrapped_key) {
              const defaultPwd = adminUser.perfil + '123';
              const mk = await this.decryptMasterKey(adminUser.wrapped_key, defaultPwd);
              if (mk) sessionStorage.setItem('adm_master_key', mk);
            }
          }
        } catch(e) { console.warn('Auto-key failed:', e); }
      }
    }

    // 1. Create Modal HTML
    this.createModal();
    
    // 2. Load users
    this.loadLogins();

    // 3. Intercept module clicks (only if login required)
    if (this.loginRequired) {
      this.interceptLinks();
    }
    
    // 4. Check if current page is protected and we are not logged in
    if (this.loginRequired) {
      this.checkCurrentPage();
    }

    // 5. Render user badge if logged in
    if (this.isLoggedIn()) {
      this.renderUserBadge();
      if (this.loginRequired) {
        this.hideUnauthorizedModules();
      }
    }
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

  loadLogins: function() {
    // Tentamos achar a raiz (caso estejamos em um módulo)
    const rootPath = this.isModulePage() ? '../' : './';
    const url = rootPath + 'dados/logins.json?_t=' + new Date().getTime();
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        this.loginsData = data;
      })
      .catch(err => {
        console.error('Erro ao carregar banco de logins', err);
      });
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
    // Se a página atual NÃO for o index (menu raiz), e não estiver logado, bloqueia
    const path = window.location.pathname;
    
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
    }
  },

  isLoggedIn: function() {
    const token = localStorage.getItem('adm_auth_token') || sessionStorage.getItem('adm_auth_token');
    return token === 'authenticated';
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

    if (!this.loginsData) {
      errorEl.textContent = "Banco de logins indisponível. Tente novamente.";
      return;
    }

    const user = this.loginsData.find(u => u.perfil.toLowerCase() === perfil);
    if (!user) {
      errorEl.textContent = "Perfil não encontrado ou senha inválida.";
      return;
    }

    // Calcula SHA-256 da senha digitada
    const hash = await this.sha256(senha);
    
    if (hash === user.hash) {
      // Descriptografar a chave mestra usando a senha digitada
      const masterKeyHex = await this.decryptMasterKey(user.wrapped_key, senha);
      if (!masterKeyHex) {
        errorEl.textContent = "Erro de autenticação interna (chave inválida).";
        errorEl.style.color = "var(--red)";
        return;
      }
      
      // Salvar sessão
      const tagsStr = JSON.stringify(user.tags || []);
      
      if (remember) {
        localStorage.setItem('adm_auth_token', 'authenticated');
        localStorage.setItem('adm_auth_perfil', user.perfil);
        localStorage.setItem('adm_auth_nome', user.nome || user.perfil);
        localStorage.setItem('adm_auth_tags', tagsStr);
        localStorage.setItem('adm_master_key', masterKeyHex);
      } else {
        sessionStorage.setItem('adm_auth_token', 'authenticated');
        sessionStorage.setItem('adm_auth_perfil', user.perfil);
        sessionStorage.setItem('adm_auth_nome', user.nome || user.perfil);
        sessionStorage.setItem('adm_auth_tags', tagsStr);
        sessionStorage.setItem('adm_master_key', masterKeyHex);
      }
      
      // Efeito de sucesso
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
        
        // Renderiza o badge imediatamente sem recarregar se estiver no index
        if (!this.pendingUrl) {
          this.renderUserBadge();
        }

        // Restaura o modal para a próxima vez se necessário
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
      
    } else {
      errorEl.textContent = "Perfil não encontrado ou senha inválida.";
      errorEl.style.color = "var(--red)";
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

  hideUnauthorizedModules: function() {
    // Esconde os cartões do index.html se não tiver tag
    const isIndex = !this.isModulePage();
    if (!isIndex) return;
    
    const tagsStr = localStorage.getItem('adm_auth_tags') || sessionStorage.getItem('adm_auth_tags') || "[]";
    const tags = JSON.parse(tagsStr);
    
    if (tags.includes('admin')) return; // Admin bypass
    
    const links = document.querySelectorAll('a.module-card.active, a.btn-acesso-restrito');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('projecao') && !tags.includes('projecao') && !tags.includes('auditor')) {
        link.style.display = 'none';
      }
      if (href.includes('comex') && !tags.includes('comex')) {
        link.style.display = 'none';
      }
    });
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

import http.server
import socketserver
import json
import os
import urllib.parse
import webbrowser
import threading
import time
import hashlib
import binascii
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

PORT = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGINS_FILE = os.path.join(BASE_DIR, "siteadm", "dados", "logins.json")
CONFIG_FILE = os.path.join(BASE_DIR, "siteadm", "dados", "config.json")

def get_master_key():
    auth_dir = os.path.join(BASE_DIR, "script_gestao_orcamentaria", "auth")
    os.makedirs(auth_dir, exist_ok=True)
    key_file = os.path.join(auth_dir, "master_key.txt")
    if os.path.exists(key_file):
        with open(key_file, 'r', encoding='utf-8') as f:
            return f.read().strip()
    else:
        import secrets
        key = secrets.token_hex(32)
        with open(key_file, 'w', encoding='utf-8') as f:
            f.write(key)
        print(f"Nova chave mestra gerada e salva em {key_file}")
        return key

def wrap_key(password, master_key_hex):
    user_key = hashlib.sha256(password.encode('utf-8')).digest()
    master_key_bytes = binascii.unhexlify(master_key_hex)
    aesgcm = AESGCM(user_key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, master_key_bytes, None)
    wrapped = nonce + ciphertext
    return binascii.hexlify(wrapped).decode('utf-8')

def migrate_logins():
    master_key = get_master_key()
    if not os.path.exists(LOGINS_FILE):
        return
    
    try:
        with open(LOGINS_FILE, 'r', encoding='utf-8') as f:
            users = json.load(f)
    except Exception as e:
        print("Erro ao ler logins.json para migração:", e)
        return
    
    modified = False
    DEFAULTS = {
        "admin": "admin123",
        "comex": "comex123",
        "rancho": "rancho123",
        "cmt": "cmt123"
    }
    
    for u in users:
        perfil = u.get("perfil", "").lower()
        if "wrapped_key" not in u:
            pwd = DEFAULTS.get(perfil)
            if pwd:
                expected_hash = hashlib.sha256(pwd.encode('utf-8')).hexdigest()
                if u.get("hash") == expected_hash:
                    u["wrapped_key"] = wrap_key(pwd, master_key)
                    modified = True
                    print(f"Migrado perfil '{perfil}' com a chave criptografada.")
            
            if "wrapped_key" not in u:
                temp_pwd = perfil + "123"
                u["hash"] = hashlib.sha256(temp_pwd.encode('utf-8')).hexdigest()
                u["wrapped_key"] = wrap_key(temp_pwd, master_key)
                modified = True
                print(f"Criado wrapped_key temporário para '{perfil}' com a senha padrão '{temp_pwd}'.")
                
    if modified:
        with open(LOGINS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/painel_admin.html'
        elif self.path == '/api/logins':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if os.path.exists(LOGINS_FILE):
                with open(LOGINS_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.wfile.write(content.encode('utf-8'))
            else:
                self.wfile.write(b'[]')
            return
        
        elif self.path.startswith('/api/config'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.wfile.write(content.encode('utf-8'))
            else:
                self.wfile.write(b'{"login_required": true}')
            return
        
        # Serve local files
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/logins':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                new_data = json.loads(post_data.decode('utf-8'))
                master_key = get_master_key()
                
                current_users = {}
                if os.path.exists(LOGINS_FILE):
                    try:
                        with open(LOGINS_FILE, 'r', encoding='utf-8') as f:
                            for u in json.load(f):
                                current_users[u['perfil'].lower()] = u
                    except:
                        pass
                
                cleaned_data = []
                for user in new_data:
                    perfil = user.get('perfil', '').lower()
                    plain_password = user.pop('senha', None)
                    
                    if plain_password:
                        user['hash'] = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
                        user['wrapped_key'] = wrap_key(plain_password, master_key)
                    else:
                        old_user = current_users.get(perfil)
                        if old_user:
                            if 'hash' not in user:
                                user['hash'] = old_user.get('hash')
                            if 'wrapped_key' not in user:
                                user['wrapped_key'] = old_user.get('wrapped_key')
                        
                        if 'wrapped_key' not in user:
                            fallback_pwd = perfil + "123"
                            user['hash'] = hashlib.sha256(fallback_pwd.encode('utf-8')).hexdigest()
                            user['wrapped_key'] = wrap_key(fallback_pwd, master_key)
                            
                    cleaned_data.append(user)
                    
                with open(LOGINS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return
        
        if self.path == '/api/config':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                new_config = json.loads(post_data.decode('utf-8'))
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(new_config, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

def start_server():
    migrate_logins() # Run key wrapping migration on startup
    os.chdir(BASE_DIR)
    Handler = AdminHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Servidor Admin rodando na porta {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()
    
    time.sleep(1)
    webbrowser.open(f'http://localhost:{PORT}')
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Servidor encerrado.")

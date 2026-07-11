# -*- coding: utf-8 -*-
"""
gerar_dados.py
Extrai o JSON de dados embutido no projecao.html já gerado e salva como
projecao.json para consumo pelo site Netlify.

Deve ser executado APÓS gerar_projecao.py na rotina diária.
"""
import os, re, json, sys, base64, binascii, secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
HTML_FILE  = os.path.join(BASE_DIR, "projecao.html")
OUTPUT_DIR = os.path.join(PARENT_DIR, "siteadm", "dados")
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "projecao.json")

def log(msg):
    from datetime import datetime
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def extrair_json_do_html(html_content):
    """
    Extrai o objeto JSON da linha `const DADOS = {...};` do HTML gerado.
    """
    # O padrão no template é: const DADOS = {data_json};
    # No HTML gerado, {data_json} é substituído pelo JSON real.
    match = re.search(r'const\s+DADOS\s*=\s*(\{.*?\});\s*$', html_content, re.MULTILINE | re.DOTALL)
    if not match:
        raise ValueError("Não foi possível encontrar 'const DADOS = {...};' no HTML.")

    json_str = match.group(1)
    # Valida que é JSON válido
    data = json.loads(json_str)
    return data

def extrair_logo_base64(html_content):
    """
    Extrai a imagem base64 da tag <img> do header, se presente.
    """
    match = re.search(r'src="data:image/png;base64,([A-Za-z0-9+/=]+)"', html_content)
    if match:
        return match.group(1)
    return None

def main():
    log("=== Gerador de Dados do Site (siteadm) ===")

    if not os.path.exists(HTML_FILE):
        log(f"ERRO: projecao.html não encontrado em {HTML_FILE}")
        log("Execute gerar_projecao.py antes deste script.")
        sys.exit(1)

    log(f"Lendo {HTML_FILE}...")
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html = f.read()

    log("Extraindo JSON de dados...")
    dados = extrair_json_do_html(html)
    log(f"  Chaves encontradas: {list(dados.keys())}")

    # Extrai logo e inclui no JSON
    logo_b64 = extrair_logo_base64(html)
    if logo_b64:
        dados['logo_base64'] = logo_b64
        log(f"  Logo base64 extraída ({len(logo_b64)} chars)")

    # Salva JSON criptografado com AES-256-GCM usando a chave mestra
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Carregar ou criar chave mestra
    auth_dir = os.path.join(BASE_DIR, "auth")
    os.makedirs(auth_dir, exist_ok=True)
    key_file = os.path.join(auth_dir, "master_key.txt")
    if os.path.exists(key_file):
        with open(key_file, 'r', encoding='utf-8') as f:
            master_key_hex = f.read().strip()
    else:
        master_key_hex = secrets.token_hex(32)
        with open(key_file, 'w', encoding='utf-8') as f:
            f.write(master_key_hex)
        log(f"Nova chave mestra gerada e salva em {key_file}")
        
    # 2. Criptografar dados
    json_str = json.dumps(dados, ensure_ascii=False, indent=None)
    data_bytes = json_str.encode('utf-8')
    
    aesgcm = AESGCM(binascii.unhexlify(master_key_hex))
    nonce = os.urandom(12)
    encrypted_bytes = aesgcm.encrypt(nonce, data_bytes, None)
    
    # Payload = nonce (12 bytes) + ciphertext + tag
    payload = nonce + encrypted_bytes
    base64_payload = base64.b64encode(payload).decode('utf-8')
    
    output_data = {"encrypted": base64_payload}
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=None)

    size_kb = os.path.getsize(OUTPUT_JSON) / 1024
    log(f"JSON criptografado e salvo: {OUTPUT_JSON} ({size_kb:.1f} KB)")
    log("Concluído com sucesso!")

if __name__ == "__main__":
    main()

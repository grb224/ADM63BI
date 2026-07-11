# -*- coding: utf-8 -*-
"""
atualizar_banco.py
Popula TODAS as secoes da aba BANCO (Google Sheets) com dados do SAG.
Secoes cobertas:
  A-I     : DISPONIVEL 160443
  K-S     : DISPONIVEL 167443
  U-AB    : NC Documentos Otimizado (8 colunas, ambas as UGs)
  AD3:AM4 : Resumo Exercicio Corrente
  AD8:AS9 : Resumo RPNP
  AU3:AZ  : Corrente Unificado via AJAX (UG, NE, TIPO_NE, DATA_EMISSAO, PI, A_LIQUIDAR)
  BB3:BG  : RPNP Unificado via AJAX (UG, NE, TIPO_NE, DATA_EMISSAO, PI, ALIQ)
"""
import sys, re, io, zipfile, csv, time
from datetime import datetime
import requests
import gspread
import os
from google.oauth2.service_account import Credentials

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# --- CONFIGURACOES ---
SAG_CPF   = "04019136009"
SAG_SENHA = " 040191"
SAG_USER  = "moreira"
ANO       = datetime.now().year

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json")
SHEET_ID  = "1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww"
ABA_BANCO = "BANCO"

SAG_LOGIN    = "https://sag.eb.mil.br/login.php"
SAG_CHAMADAS = "https://sag.eb.mil.br/php/chamadas/"
SAG_DADOS    = f"https://sag.eb.mil.br/dados/{ANO}/{SAG_USER}/"

# Filtro Otimizado de Colunas para Créditos (Apenas 8 colunas)
NC_COLUNAS = [
    "DESTINO_UG_FAV",     # Para distinguir 160443 ou 167443
    "DATA_EMISSAO",       # Data que chegou
    "DESTINO_PTRES",      # PTRES
    "DESTINO_ND",         # ND
    "OBS",                # Observação
    "NUMERO_NC",          # NMR NC
    "DESTINO_PI",         # PI
    "DESTINO_VALOR_ITEM"  # VALOR INICIAL
]

# --- HELPERS ---
def strip_html(text):
    return re.sub(r'<[^>]+>', '', str(text)).strip()

def strip_row(row):
    return [strip_html(c) for c in row]

def parse_valor_br(s):
    """Converte '1.234,56' -> float. Retorna 0 se invalido."""
    s = strip_html(s).strip().replace('.', '').replace(',', '.')
    try:
        return float(s)
    except Exception:
        return 0.0

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}")

def resolver_pis_em_branco(rows):
    """Resolve PIs em branco com base em outras NCs e referências na OBS/PTRES."""
    nc_to_pi = {}
    for r in rows:
        if len(r) >= 7:
            nc_raw = r[5].strip()
            pi = r[6].strip()
            m = re.search(r'20\d{2}NC\d{6}', nc_raw.upper())
            if m and pi:
                nc_to_pi[m.group(0)] = pi

    corrigidas = 0
    for r in rows:
        if len(r) >= 7:
            pi = r[6].strip()
            ptres = r[2].strip()
            obs = r[4].strip()
            if not pi:
                nc_raw = r[5].strip()
                m = re.search(r'20\d{2}NC\d{6}', nc_raw.upper())
                if m and m.group(0) in nc_to_pi:
                    r[6] = nc_to_pi[m.group(0)]
                    corrigidas += 1
                    continue
                
                found_ncs = re.findall(r'20\d{2}NC\d{6}', obs.upper())
                resolved = False
                for ref_nc in found_ncs:
                    if ref_nc in nc_to_pi:
                        r[6] = nc_to_pi[ref_nc]
                        corrigidas += 1
                        log(f"  [PI Corrigido] NC {r[5]} -> PI {r[6]} via ref {ref_nc}")
                        resolved = True
                        break
                if resolved:
                    continue

                ptres_ncs = [x for x in rows if len(x) >= 7 and x[2].strip() == ptres and x[6].strip()]
                ptres_pis = set(x[6].strip() for x in ptres_ncs)
                if len(ptres_pis) == 1:
                    r[6] = list(ptres_pis)[0]
                    corrigidas += 1
                    log(f"  [PI Corrigido] NC {r[5]} -> PI {r[6]} via PTRES {ptres}")
                    
    if corrigidas > 0:
        log(f"  Foram corrigidas {corrigidas} linhas com PI em branco.")
    return rows

# --- 1. LOGIN SAG ---
def login_sag():
    log("Fazendo login no SAG...")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
        "Referer": "https://sag.eb.mil.br/"
    })
    r = session.post(SAG_LOGIN,
                     data={"cpf": SAG_CPF, "senha": SAG_SENHA},
                     timeout=15)
    if r.text.strip() == "1":
        log("  OK Login bem-sucedido!")
    else:
        raise SystemExit(f"Falha no login: {r.text[:80]}")
    return session

def login_sag_2025():
    log("Fazendo login secundário no SAG 2025 (para tipos RPNP)...")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
        "Referer": "https://sag.eb.mil.br/"
    })
    r = session.post("https://sag.eb.mil.br/sag2025/login.php",
                     data={"cpf": SAG_CPF, "senha": SAG_SENHA},
                     timeout=15)
    if r.text.strip() == "1":
        log("  OK Login 2025 bem-sucedido!")
    else:
        log(f"  [Aviso] Falha no login 2025: {r.text[:80]}")
    return session

# --- 2. EXTRATORES SAG ---
def get_disponivel(session, ug):
    log(f"  Extraindo DISPONIVEL UG {ug}...")
    params = [("tipo", "disponivel"), ("ug", str(ug)),
              ("sEcho", "1"), ("iColumns", "9"),
              ("iDisplayStart", "0"), ("iDisplayLength", "9999")]
    r = session.get(SAG_CHAMADAS + "saldos_basicos.php", params=params, timeout=30)
    rows = r.json().get("data", [])
    result = [strip_row(row) for row in rows]
    log(f"    {len(result)} linhas")
    return result

def get_nc_documentos(session):
    log("  Extraindo NC Documentos Otimizado (8 colunas, UG 160443+167443)...")
    params = ([("metodo", "tela"), ("fase", "load"), ("iDisplayStart", "0"),
               ("iDisplayLength", "9999")] +
              [("coluna[]", c) for c in NC_COLUNAS] +
              [("UG_FAV[]", "160443"), ("UG_FAV[]", "167443")])
    r = session.get(SAG_CHAMADAS + "docNcuq1.php", params=params, timeout=60)
    rows = r.json().get("data", [])
    result = [strip_row(row) for row in rows]
    log(f"    {len(result)} NCs encontradas")
    return result

def get_corrente_summary(session):
    log("  Extraindo Resumo Exercicio Corrente...")
    params = [("tipo", "ano"), ("sEcho", "1"), ("iColumns", "10"),
              ("iDisplayStart", "0"), ("iDisplayLength", "100")]
    r = session.get(SAG_CHAMADAS + "saldos_basicos.php", params=params, timeout=30)
    rows = r.json().get("data", [])
    result = [strip_row(row) for row in rows]
    log(f"    {len(result)} linhas (espera-se 2: UG 160443 e 167443)")
    return result

def get_rpnp_summary(session):
    log("  Extraindo Resumo RPNP...")
    params = [("tipo", "rpnp"), ("sEcho", "1"), ("iColumns", "16"),
              ("iDisplayStart", "0"), ("iDisplayLength", "100")]
    r = session.get(SAG_CHAMADAS + "saldos_basicos.php", params=params, timeout=30)
    rows = r.json().get("data", [])
    result = [strip_row(row) for row in rows]
    log(f"    {len(result)} linhas RPNP")
    return result

# --- CORRENTE VIA AJAX (substitui Planilhao ZIP) ---
def get_ne_corrente(session):
    """Extrai NEs do exercicio corrente via docNeuq1.php (ambas UGs)."""
    log("  Extraindo Notas de Empenho (docNeuq1)...")
    NE_COLS = ["UG", "NR", "TIPO_NE", "DATA_EMISSAO", "PI", "VALOR_OPERACAO"]
    params = (
        [("metodo", "tela"), ("fase", "load"),
         ("iDisplayStart", "0"), ("iDisplayLength", "9999")] +
        [("coluna[]", c) for c in NE_COLS] +
        [("UG[]", "160443"), ("UG[]", "167443")]
    )
    r = session.get(SAG_CHAMADAS + "docNeuq1.php", params=params, timeout=60)
    rows = r.json().get("data", [])
    result = [strip_row(row) for row in rows]
    log(f"    {len(result)} NEs encontradas")
    return result   # [UG, NR, TIPO_NE, DATA_EMISSAO, PI, VALOR_OPERACAO]

def get_tipos_ne_2025(session):
    log("  Extraindo Tipos de Notas de Empenho de 2025 (docNeuq1)...")
    NE_COLS = ["NR", "TIPO_NE"]
    params = (
        [("metodo", "tela"), ("fase", "load"),
         ("iDisplayStart", "0"), ("iDisplayLength", "9999")] +
        [("coluna[]", c) for c in NE_COLS] +
        [("UG[]", "160443"), ("UG[]", "167443")]
    )
    try:
        r = session.get("https://sag.eb.mil.br/sag2025/php/chamadas/docNeuq1.php", params=params, timeout=60)
        rows = r.json().get("data", [])
        mapa_tipos = {}
        for row in rows:
            cleaned = [strip_html(c) for c in row]
            if len(cleaned) >= 2:
                # O NR geralmente contem todo a string
                ne = cleaned[0].strip()[-12:] 
                tipo = cleaned[1].strip()
                mapa_tipos[ne] = tipo
        log(f"    {len(mapa_tipos)} NEs de 2025 catalogadas.")
        return mapa_tipos
    except Exception as e:
        log(f"    Falha ao buscar tipos de 2025: {e}")
        return {}

def get_aliquidar_corrente(session, ug):
    """Extrai saldo A_LIQUIDAR detalhado por empenho via saldos_basicos."""
    log(f"  Extraindo A_LIQUIDAR detalhe UG {ug}...")
    params = {
        "tipo": "cred", "ug": str(ug), "td": "A_LIQUIDAR",
        "sEcho": "1", "iColumns": "13",
        "iDisplayStart": "0", "iDisplayLength": "9999"
    }
    r = session.get(SAG_CHAMADAS + "saldos_basicos.php", params=params, timeout=30)
    rows = r.json().get("data", [])
    # Colunas: UG, PROGRAMA, ACAO, UGR, PTRES, PI, ND, CREDOR, FONTE, NE, EMISSAO, DIAS, A_LIQUIDAR
    saldos = {}
    for row in rows:
        cleaned = [strip_html(c) for c in row]
        ne = cleaned[9]    # NE
        aliq = cleaned[12] # A_LIQUIDAR
        saldos[ne] = aliq
    log(f"    {len(saldos)} saldos A_LIQUIDAR para UG {ug}")
    return saldos

def montar_tabela_corrente(nes, saldos_160, saldos_167):
    """Monta tabela unificada [UG, NE, TIPO_NE, DATA_EMISSAO, PI, A_LIQUIDAR].
    Ordenada: 160443 primeiro, 167443 depois."""
    linhas = []
    for row in nes:
        # row = [UG, NR, TIPO_NE, DATA_EMISSAO, PI, VALOR_OPERACAO]
        ug  = row[0]
        ne  = row[1]
        tipo = row[2]
        data = row[3]
        pi  = row[4]
        # Buscar A_LIQUIDAR no dicionario correspondente
        if ug == "160443":
            aliq = saldos_160.get(ne, "")
        else:
            aliq = saldos_167.get(ne, "")
        # So incluir se tiver saldo (A_LIQUIDAR > 0)
        if aliq:
            linhas.append([ug, ne, tipo, data, pi, aliq])
    # Ordenar: 160443 primeiro, depois 167443
    linhas.sort(key=lambda r: (r[0], r[1]))
    return linhas

# --- RPNP VIA AJAX ---
def get_rpnp_ajax(session, ug, mapa_tipos):
    """Extrai NEs do RPNP com saldo > 0 direto via saldos_basicos."""
    log(f"  Extraindo RPNP detalhe UG {ug}...")
    params = {
        "tipo": "crpnp", "ug": str(ug), "td": "ALIQ",
        "sEcho": "1", "iColumns": "13",
        "iDisplayStart": "0", "iDisplayLength": "9999"
    }
    r = session.get(SAG_CHAMADAS + "saldos_basicos.php", params=params, timeout=30)
    rows = r.json().get("data", [])
    
    linhas = []
    for row in rows:
        cleaned = [strip_html(c) for c in row]
        if len(cleaned) >= 13:
            # Colunas da tela: UG(0), PROGRAMA, ACAO, UGR, PTRES, PI(5), ND, CREDOR, FONTE, NE(9), EMISSAO(10), DIAS, ALIQ(12)
            c_ug   = cleaned[0]
            c_pi   = cleaned[5]
            c_ne   = cleaned[9]
            c_data = cleaned[10]
            c_aliq = cleaned[12]
            tipo_ne_real = mapa_tipos.get(c_ne, "RPNP")
            # Formato unificado: [UG, NE, TIPO_NE, DATA_EMISSAO, PI, A_LIQUIDAR]
            linhas.append([c_ug, c_ne, tipo_ne_real, c_data, c_pi, c_aliq])
            
    log(f"    {len(linhas)} linhas RPNP extraidas para UG {ug}")
    return linhas

# --- 3. ESCREVE NO GOOGLE SHEETS ---
def abrir_banco():
    log("Conectando ao Google Sheets...")
    scopes = ["https://spreadsheets.google.com/feeds",
              "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(creds)
    planilha = gc.open_by_key(SHEET_ID)
    aba = planilha.worksheet(ABA_BANCO)
    log("  OK Aba BANCO aberta.")
    return aba

def escreve_secao(aba, intervalo_clear, intervalo_write, dados, label):
    log(f"  Escrevendo {label}: {len(dados)} linhas -> {intervalo_write}")
    aba.batch_clear([intervalo_clear])
    if dados:
        aba.update(values=dados, range_name=intervalo_write, value_input_option="USER_ENTERED")
    log(f"    OK")

# --- MAIN ---
def main():
    inicio = datetime.now()
    print("=" * 60)
    print("  SAG -> BANCO | Atualizacao completa")
    print(f"  {inicio.strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

    session = login_sag()
    aba = abrir_banco()

    # -- Secao 1: DISPONIVEL 160443 -> A3:I --
    log("[1/8] DISPONIVEL 160443 -> A:I")
    d = get_disponivel(session, 160443)
    escreve_secao(aba, "A3:I1000", "A3", d, "DISPONIVEL 160443")

    # -- Secao 2: DISPONIVEL 167443 -> K3:S --
    log("[2/8] DISPONIVEL 167443 -> K:S")
    d = get_disponivel(session, 167443)
    escreve_secao(aba, "K3:S1000", "K3", d, "DISPONIVEL 167443")

    # -- Secao 3: NC Documentos -> U3:AB --
    log("[3/8] NC Documentos -> U:AB")
    d = get_nc_documentos(session)
    d = resolver_pis_em_branco(d)
    escreve_secao(aba, "U3:AB1000", "U3", d, "NC Documentos")

    # -- Secao 4: Corrente Summary -> AD3:AM4 --
    log("[4/8] Resumo Corrente -> AD3:AM4")
    d = get_corrente_summary(session)
    d.sort(key=lambda r: r[0])
    escreve_secao(aba, "AD3:AM4", "AD3", d[:2], "Corrente Summary")

    # -- Secao 5: RPNP Summary -> AD8:AS9 --
    log("[5/8] Resumo RPNP -> AD8:AS9")
    d = get_rpnp_summary(session)
    d.sort(key=lambda r: r[0])
    escreve_secao(aba, "AD8:AS9", "AD8", d[:2], "RPNP Summary")

    # -- Secao 6: Corrente Unificado (AJAX) -> AU3:AZ --
    log("[6/8] Corrente Unificado (AJAX) -> AU:AZ")
    nes = get_ne_corrente(session)
    saldos_160 = get_aliquidar_corrente(session, 160443)
    saldos_167 = get_aliquidar_corrente(session, 167443)
    d = montar_tabela_corrente(nes, saldos_160, saldos_167)
    escreve_secao(aba, "AU3:AZ1000", "AU3", d, "Corrente Unificado")

    # -- Secao 7: RPNP Unificado (AJAX) -> BB:BG --
    log("[7/8] RPNP Unificado (AJAX) -> BB:BG")
    session_25 = login_sag_2025()
    mapa_tipos_2025 = get_tipos_ne_2025(session_25)
    
    rpnp_160 = get_rpnp_ajax(session, 160443, mapa_tipos_2025)
    rpnp_167 = get_rpnp_ajax(session, 167443, mapa_tipos_2025)
    unificado_rpnp = rpnp_160 + rpnp_167
    unificado_rpnp.sort(key=lambda r: (r[0], r[1]))  # ordena UG e NE
    escreve_secao(aba, "BB3:BG1000", "BB3", unificado_rpnp, "RPNP Unificado")

    # -- Fim --
    duracao = (datetime.now() - inicio).seconds
    print("=" * 60)
    print(f"  OK Concluido em {duracao}s | {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
atualizar_controles.py
Atualiza as abas 'Controle EMP 26' e 'Controle EMP RPNP'
Mantém as colunas preenchidas pelo usuário (G, H, I / Q, R, S) vinculadas à NE respectiva.
Tambem monitora mudanças de previsão (H/R) entre execuções e registra no LOGS.
"""
import sys
import json
import os
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json")
SHEET_ID = "1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww"
SNAPSHOT_PATH = os.path.join(BASE_DIR, "snapshots", "previsao_snapshot.json")
LOG_MUDANCAS_PATH = os.path.join(BASE_DIR, "snapshots", "mudancas_previsao.json")

RESPONSAVEL_MAP = {
  "I3DACSPCORR": "Fiscalização",
  "I3DACSPTELM": "Fiscalização",
  "I3DAFUNPUBL": "Fiscalização",
  "I3DACSPAGES": "Fiscalização",
  "E6SUPLJA1QR": "Aprovisionamento",
  "E6SUPLJA5PA": "Aprovisionamento",
  "E6DTDEFCLOG": "Aprovisionamento",
  "I3DACSPENEL": "Fiscalização",
  "C6ENMILCAPE": "NPOR",
  "I3DAFUNADOM": "ALMOX",
  "E6SUSOLA7PA": "Aprovisionamento",
  "E6SUSOLA5PA": "Aprovisionamento",
  "E6SUSOLA1QR": "Aprovisionamento",
  "B4OMOBMAQUA": "ALMOX",
  "E5MMSUNPREV": "PMT",
  "FAOPPREININ": "ALMOX",
  "I3DAFUNCMS0": "ALMOX",
  "A1DTDEFOUTR": "ALMOX",
  "E6SUPLJA3RR": "Aprovisionamento",
  "IDDSATSPCEB": "Fiscalização",
  "FAOPPREMIAI": "ALMOX",
  "FAOPPREPADB": "ALMOX",
  "K9CCMSIINFO": "ALMOX",
  "D6PEINDMV1A": "Fiscalização",
  "D6PEINDMV1T": "Fiscalização",
  "A1DTDEFRODZ": "Aprovisionamento",
  "D5APFUNMNHT": "HT",
  "C6ENEASCAPE": "NPOR",
  "E3PCFSCDIAR": "SFPC",
  "C1ENCONESFO": "Aprovisionamento",
  "E3PCFSCINFO": "SFPC",
  "D5SAFUSASOC": "HT",
  "D8SAFCTUGPD": "Saúde",
  "E3PCFSCMAIN": "SFPC",
  "E3PCOPFDIAR": "SFPC",
  "E3PCPRCDIAR": "SFPC",
  "IXAPFUNCMS0": "ALMOX",
  "IBTAXALIMPU": "Fiscalização",
  "E3PCCAPDIAR": "SFPC",
  "E3PCFSCCONS": "SFPC",
  "E3PCFSCDEGE": "SFPC",
  "E3PCFSCMABM": "SFPC",
  "E3PCFSCOUTR": "SFPC",
  "E3PCFSCSEGU": "SFPC",
  "E5DTDEFCLOG": "SFPC",
  "E5PCFSCGRM9": "SFPC",
  "I3DACSPTELF": "Fiscalização",
  "D8SAFUSUGPD": "Saúde",
  "D8SAPIMNTCM": "Saúde",
  "I3DAFUNSUPL": "ALMOX",  
  "FAOPPREPRON": "ALMOX",
  "IXOMOBMPNRE": "ALMOX",
  "C1ENEASEXPL": "NPOR",
  "E6SUSOLA5CF": "Aprovisionamento",
  "E6MIPLJBIDS": "ALMOX",
  "FAOPPRECAPE": "ALMOX",
  "E6MIPLJUHIS": "ALMOX",
  "E6MIPLJUESP": "ALMOX",
  "I3DAFUNINCD": "Of Cmb Inc",
  "C1ENCONDETM": "ALMOX",
  "FAOPPRESICO": "ALMOX",
  "C1ENCONESPC": "ALMOX",
  "00ESTRESCMS": "ALMOX",
  "ESTRESCMS": "ALMOX",
  "D7PESMIAPSE": "ALMOX",
  "D8SAMNTVTRA": "Saúde",
}

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}")

# ====================================================================
# SNAPSHOT — Rastreio de mudanças de previsão (H/R + I/S)
# ====================================================================

def capturar_snapshot_previsao(planilha):
    """
    Lê o estado atual de H/R (previsão) e I/S (parcial) nas duas abas de
    controle e retorna um dicionário indexado por (aba_nome, bloco, NE).
    Formato: { 'Controle EMP 26|160443|2026NE000063': {'previsao':'SIM','parcial':'R$ 3.828,12'}, ... }
    """
    snap = {}
    for aba_nome in ["Controle EMP 26", "Controle EMP RPNP"]:
        try:
            aba = planilha.worksheet(aba_nome)
            dados = aba.get_values('A3:S')
            for row in dados:
                pad = row + [''] * max(0, 19 - len(row))
                # Bloco 160443: NE=B(1), H=H(7), I=I(8)
                ne160 = pad[1].strip()
                if ne160:
                    chave = f"{aba_nome}|160443|{ne160}"
                    snap[chave] = {
                        'previsao': pad[7].strip(),
                        'parcial':  pad[8].strip(),
                        'setor':    pad[5].strip(),
                        'pi':       pad[0].strip(),
                    }
                # Bloco 167443: NE=L(11), R=R(17), S=S(18)
                ne167 = pad[11].strip()
                if ne167:
                    chave = f"{aba_nome}|167443|{ne167}"
                    snap[chave] = {
                        'previsao': pad[17].strip(),
                        'parcial':  pad[18].strip(),
                        'setor':    pad[15].strip(),
                        'pi':       pad[10].strip(),
                    }
        except Exception as e:
            log(f"  Erro ao capturar snapshot de {aba_nome}: {e}")
    return snap


def carregar_snapshot_anterior():
    """Carrega o snapshot JSON salvo na execução anterior."""
    if not os.path.exists(SNAPSHOT_PATH):
        return {}
    try:
        with open(SNAPSHOT_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def salvar_snapshot(snap):
    """Persiste o snapshot atual em JSON para a próxima execução."""
    os.makedirs(os.path.dirname(SNAPSHOT_PATH), exist_ok=True)
    with open(SNAPSHOT_PATH, 'w', encoding='utf-8') as f:
        json.dump(snap, f, ensure_ascii=False, indent=2)


def detectar_e_registrar_mudancas(planilha, snap_anterior, snap_atual):
    """
    Compara os dois snapshots e, para cada NE que teve mudança de
    previsão (H/R) ou parcial (I/S), registra uma linha na aba LOGS.
    """
    mudancas = []
    for chave, estado_atual in snap_atual.items():
        estado_ant = snap_anterior.get(chave, {})
        prev_ant = estado_ant.get('previsao', '')
        prev_atual = estado_atual.get('previsao', '')
        parc_ant  = estado_ant.get('parcial', '')
        parc_atual = estado_atual.get('parcial', '')

        if prev_ant == prev_atual and parc_ant == parc_atual:
            continue  # sem mudança

        partes = chave.split('|')  # aba_nome, bloco, NE
        aba_nome = partes[0] if len(partes) > 0 else ''
        bloco    = partes[1] if len(partes) > 1 else ''
        ne       = partes[2] if len(partes) > 2 else ''
        setor    = estado_atual.get('setor', '')
        pi       = estado_atual.get('pi', '')

        descricao = []
        if prev_ant != prev_atual:
            descricao.append(f"Previsão: {prev_ant or '(vazio)'} → {prev_atual or '(vazio)'}")
        if parc_ant != parc_atual:
            descricao.append(f"Parcial: {parc_ant or '(vazio)'} → {parc_atual or '(vazio)'}")

        mudancas.append({
            'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
            'data':      datetime.now().strftime('%d/%m/%Y'),
            'categoria': 'Mudança de Previsão',
            'ug':        bloco,
            'setor':     setor,
            'pi':        pi,
            'nd':        '',
            'ne':        ne,
            'valor':     ' | '.join(descricao),
            'prev':      f"{aba_nome}",
        })

    if not mudancas:
        log("  Snapshot: nenhuma mudança de previsão detectada.")
        return

    log(f"  Snapshot: {len(mudancas)} mudança(s) de previsão detectada(s) — gravando em log local...")
    try:
        historico_mudancas = []
        if os.path.exists(LOG_MUDANCAS_PATH):
            with open(LOG_MUDANCAS_PATH, 'r', encoding='utf-8') as f:
                historico_mudancas = json.load(f)
        
        historico_mudancas.extend(mudancas)
        
        with open(LOG_MUDANCAS_PATH, 'w', encoding='utf-8') as f:
            json.dump(historico_mudancas, f, ensure_ascii=False, indent=2)
            
        for m in mudancas:
            log(f"    LOG: {m['ne']} ({m['setor']}) — {m['valor']}")
    except Exception as e:
        log(f"  Erro ao gravar mudanças localmente: {e}")


def get_sheet():
    scopes = ["https://spreadsheets.google.com/feeds",
              "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(creds)
    return gc.open_by_key(SHEET_ID)

def calcular_dias(data_str):
    if not data_str:
        return ""
    try:
        # Tenta YYYY-MM-DD
        dt = datetime.strptime(data_str[:10], "%Y-%m-%d")
        return (datetime.today() - dt).days
    except ValueError:
        pass
    try:
        # Tenta DD/MM/YYYY
        dt = datetime.strptime(data_str[:10], "%d/%m/%Y")
        return (datetime.today() - dt).days
    except ValueError:
        pass
    try:
        # Tenta DD/MM/YY (formato SAG)
        dt = datetime.strptime(data_str[:8], "%d/%m/%y")
        return (datetime.today() - dt).days
    except ValueError:
        return data_str

def parse_valor_br(s):
    if not s:
        return 0.0
    s_str = str(s).strip().replace('R$', '').replace('\xa0', '').replace(' ', '')
    if ',' in s_str:
        s_str = s_str.replace('.', '').replace(',', '.')
    try:
        return float(s_str)
    except Exception:
        return 0.0

def formatar_moeda(s):
    # Converte de US ou BR pra formato "1.234,56"
    val = parse_valor_br(str(s))
    if val == 0.0 and str(s).strip() != "0,00" and str(s).strip() != "0":
        return str(s) 
    return f"{val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def ler_user_data(aba, intervalo, index_ne, idx_g, idx_h, idx_i, idx_saldo=4):
    """Lê os dados do usuário e retorna dicionário com chave = NE e valores mapeados, guardando também o Saldo Antigo."""
    try:
        dados = aba.get_values(intervalo)
    except Exception as e:
        log(f"Erro lendo user data de {intervalo}: {e}")
        return {}
    
    user_map = {}
    for row in dados:
        if len(row) > index_ne and row[index_ne].strip():
            ne = row[index_ne].strip()
            # Pega as colunas customizadas do usuário e o Saldo Antigo (na coluna E == index 4 de A:I)
            val_g = row[idx_g] if len(row) > idx_g else ""
            val_h = row[idx_h] if len(row) > idx_h else ""
            val_i = row[idx_i] if len(row) > idx_i else ""
            val_saldo = row[idx_saldo] if len(row) > idx_saldo else "0"
            
            # Armazenamos qualquer linha pra podermos calcular abatimento
            if val_g.strip() or val_h.strip() or val_i.strip() or val_saldo.strip():
                user_map[ne] = [val_g, val_h, val_i, val_saldo]
                
    return user_map

def montar_linhas_controle(planilhao_data, idx_cols, user_data, is_rpnp=False):
    """
    Constrói a matriz de atualização [PI, NE, TIPO, DIAS, SALDO, RESP, G/Q, H/R, I/S]
    idx_cols descreve [PI, NE, TIPO, DATA, SALDO] indexados do planilhao
    """
    novas_linhas = []
    
    for row in planilhao_data:
        # Se a linha não tiver dados suficientes ou for o cabeçalho, pula
        if not row or len(row) < idx_cols['saldo']:
            continue
            
        saldo_bruto = row[idx_cols['saldo']]
        saldo = parse_valor_br(saldo_bruto)
        if saldo <= 0:
            continue  # ignorar zerados
            
        pi = row[idx_cols['pi']].strip()
        ne = row[idx_cols['ne']].strip()[:12]
        tipo = row[idx_cols['tipo']].strip()
        data_str = row[idx_cols['data']].strip()
        
        dias = calcular_dias(data_str)
        responsavel = RESPONSAVEL_MAP.get(pi, "")
        
        # Recupera o preenchimento antigo do usuário
        info_usuario = user_data.get(ne, ["", "", "", "0"])
        old_g = info_usuario[0]
        old_h = str(info_usuario[1]).strip().upper() # SIM, NÃO ou PARCIAL
        old_i = info_usuario[2]
        old_saldo = parse_valor_br(info_usuario[3])
        
        diminuicao = old_saldo - saldo
        if diminuicao < 0:
            diminuicao = 0 # Nao queremos que suba a projecao se houver mais saldo
        
        novo_i = old_i
        # Regra de Lógica de Liquidação:
        if old_h in ["NÃO", "NAO"]:
            novo_i = ""
            
        elif old_h == "SIM":
            novo_i = formatar_moeda(str(saldo))
            
        elif old_h == "PARCIAL":
            val_i_num = parse_valor_br(old_i)
            if diminuicao > 0:
                novo_valor = max(0.0, val_i_num - diminuicao)
                log(f"  > NE {ne} (Parcial): Saldo abateu {formatar_moeda(str(diminuicao))}. Projeção atualizada de {formatar_moeda(str(val_i_num))} para {formatar_moeda(str(novo_valor))}")
                if novo_valor > 0:
                    novo_i = formatar_moeda(str(novo_valor))
                else:
                    novo_i = "" # zerou a projeção

        saldo_formatado = formatar_moeda(str(saldo))
        
        linha = [
            pi,
            ne,
            tipo,
            dias,
            saldo_formatado,
            responsavel,
            old_g,
            info_usuario[1], # mantem o "sim/não/parcial" como estava escrito
            novo_i
        ]
        novas_linhas.append(linha)
    
    # Ordenar por:
    # 1. Responsável (alfabético)
    # 2. Maior quantidade de Dias (decrescente)
    def criterio_sort(x):
        resp = str(x[5]).lower()
        try:
            dias_num = -int(x[3]) # Negativo para ordenar decrescente
        except (ValueError, TypeError):
            dias_num = 0          # Textos ou data inválida vão pro final
        return (resp, dias_num)

    novas_linhas.sort(key=criterio_sort)
    return novas_linhas

def atualizar_aba_unificada(planilha, aba_nome, user_range1, user_range2, range_160, range_167, banco_range, idx_cols, ug_idx):
    """Para o Corrente: dados unificados (160+167 juntos) em BY3:CD, separando por UG."""
    try:
        aba = planilha.worksheet(aba_nome)
        banco = planilha.worksheet("BANCO")
        log(f"Processando aba {aba_nome} (unificado)...")
        
        # Lendo Inputs do usuario
        u160 = ler_user_data(aba, user_range1, index_ne=1, idx_g=6, idx_h=7, idx_i=8)
        u167 = ler_user_data(aba, user_range2, index_ne=1, idx_g=6, idx_h=7, idx_i=8)
        
        # Ler tabela unificada do BANCO
        plan_all = banco.get_values(banco_range)
        
        # Separar por UG
        plan_160_dados = [r for r in plan_all if len(r) > ug_idx and r[ug_idx] == "160443"]
        plan_167_dados = [r for r in plan_all if len(r) > ug_idx and r[ug_idx] == "167443"]
        
        linhas_160 = montar_linhas_controle(plan_160_dados, idx_cols, u160)
        linhas_167 = montar_linhas_controle(plan_167_dados, idx_cols, u167)
        
        # Escrever 160443
        log(f"[{aba_nome}] Limpando e escrevendo {len(linhas_160)} linhas (160443) em {range_160}")
        aba.batch_clear([range_160.split(':')[0] + '3:' + range_160.split(':')[1]])
        if linhas_160:
            aba.update(values=linhas_160, range_name=range_160.split(':')[0] + '3', value_input_option="USER_ENTERED")
            
        # Escrever 167443
        log(f"[{aba_nome}] Limpando e escrevendo {len(linhas_167)} linhas (167443) em {range_167}")
        aba.batch_clear([range_167.split(':')[0] + '3:' + range_167.split(':')[1]])
        if linhas_167:
            aba.update(values=linhas_167, range_name=range_167.split(':')[0] + '3', value_input_option="USER_ENTERED")
            
    except Exception as e:
        log(f"Falha na aba {aba_nome}: {e}")

def atualizar_aba_separada(planilha, aba_nome, user_range1, user_range2, range_160, range_167, banco_160, banco_167, idx_cols):
    """Para o RPNP: dados separados (160 e 167 em ranges distintos no BANCO)."""
    try:
        aba = planilha.worksheet(aba_nome)
        banco = planilha.worksheet("BANCO")
        log(f"Processando aba {aba_nome} (separado)...")
        
        u160 = ler_user_data(aba, user_range1, index_ne=1, idx_g=6, idx_h=7, idx_i=8)
        u167 = ler_user_data(aba, user_range2, index_ne=1, idx_g=6, idx_h=7, idx_i=8)
        
        plan_160 = banco.get_values(banco_160)
        plan_160_dados = plan_160[2:] if len(plan_160) > 2 else []
        
        plan_167 = banco.get_values(banco_167)
        plan_167_dados = plan_167[2:] if len(plan_167) > 2 else []
        
        linhas_160 = montar_linhas_controle(plan_160_dados, idx_cols, u160)
        linhas_167 = montar_linhas_controle(plan_167_dados, idx_cols, u167)
        
        log(f"[{aba_nome}] Limpando e escrevendo {len(linhas_160)} linhas (160443) em {range_160}")
        aba.batch_clear([range_160.split(':')[0] + '3:' + range_160.split(':')[1]])
        if linhas_160:
            aba.update(values=linhas_160, range_name=range_160.split(':')[0] + '3', value_input_option="USER_ENTERED")
            
        log(f"[{aba_nome}] Limpando e escrevendo {len(linhas_167)} linhas (167443) em {range_167}")
        aba.batch_clear([range_167.split(':')[0] + '3:' + range_167.split(':')[1]])
        if linhas_167:
            aba.update(values=linhas_167, range_name=range_167.split(':')[0] + '3', value_input_option="USER_ENTERED")
            
    except Exception as e:
        log(f"Falha na aba {aba_nome}: {e}")

def main():
    inicio = datetime.now()
    print("=" * 60)
    print("  Atualizacao dos Controles (EMP 26 / RPNP)")
    print(f"  {inicio.strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

    planilha = get_sheet()

    # ── SNAPSHOT: capturar estado ANTES da atualização ─────────────────
    log("Capturando snapshot de previsões...")
    snap_anterior = carregar_snapshot_anterior()
    snap_atual    = capturar_snapshot_previsao(planilha)

    # Detectar e registrar mudanças ANTES de sobrescrever a planilha
    detectar_e_registrar_mudancas(planilha, snap_anterior, snap_atual)
    salvar_snapshot(snap_atual)
    log(f"  Snapshot salvo: {len(snap_atual)} NEs monitoradas.")

    # 1. EMP 26 (Corrente)
    idx_corr = {'pi': 4, 'ne': 1, 'tipo': 2, 'data': 3, 'saldo': 5}
    atualizar_aba_unificada(
        planilha=planilha,
        aba_nome="Controle EMP 26",
        user_range1="A3:I",
        user_range2="K3:S",
        range_160="A:I",
        range_167="K:S",
        banco_range="AU3:AZ1000",
        idx_cols=idx_corr,
        ug_idx=0
    )

    # 2. EMP RPNP
    idx_rpnp = {'pi': 4, 'ne': 1, 'tipo': 2, 'data': 3, 'saldo': 5}
    atualizar_aba_unificada(
        planilha=planilha,
        aba_nome="Controle EMP RPNP",
        user_range1="A3:I",
        user_range2="K3:S",
        range_160="A:I",
        range_167="K:S",
        banco_range="BB3:BG1000",
        idx_cols=idx_rpnp,
        ug_idx=0
    )

    duracao = (datetime.now() - inicio).seconds
    print("=" * 60)
    print(f"  Concluido em {duracao}s | {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()

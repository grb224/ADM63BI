# -*- coding: utf-8 -*-
import sys
import os
import base64
import json
import re
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
import tkinter as tk
from tkinter import messagebox
from collections import defaultdict

# Configurações de exibição de terminal para Windows/UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json")
CONFIG_FILE = os.path.join(BASE_DIR, "auth", "config_notificacoes.json")
SHEET_ID = "1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww"

SETORES_PADRAO = [
    "ALMOX", "FISCALIZAÇÃO", "APROVISIONAMENTO", "S3", "PMT", "SFPC", "HT", "NPOR", "SAÚDE", "OF CMB INC"
]

# Mapeamento manual PI -> Setor (substitui o setor da planilha sem alterar o Google Sheets)
# Adicione quantos PIs precisar: 'CODIGO_PI': 'NOME_SETOR'
PI_SETOR_OVERRIDE = {
    'C6ENMILCAPE': 'NPOR',
    'E6MIPLJUHIS': 'ALMOX',
    'E6MIPLJBIDS': 'ALMOX',
    'E6MIPLJUESP': 'ALMOX',
    'I3DAFUNINCD': 'Of Cmb Inc',
    'C1ENCONDETM': 'ALMOX',
    'FAOPPRESICO': 'ALMOX',
    'C1ENCONESPC': 'ALMOX',
    'FAOPPREPADB': 'ALMOX',
}

FILTRO_PI_RESP_LIST = {
    "I3DACSPCORR":"Fiscalização", "I3DACSPTELM":"Fiscalização", "I3DAFUNPUBL":"Fiscalização",
    "I3DACSPAGES":"Fiscalização", "E6SUPLJA1QR":"Aprovisionamento", "E6SUPLJA5PA":"Aprovisionamento",
    "E6DTDEFCLOG":"Aprovisionamento", "I3DACSPENEL":"Fiscalização", "C6ENMILCAPE":"NPOR",
    "I3DAFUNADOM":"ALMOX", "E6SUSOLA7PA":"Aprovisionamento", "E6SUSOLA5PA":"Aprovisionamento",
    "E6SUSOLA5CF":"Aprovisionamento", "E6SUSOLA1QR":"Aprovisionamento", "B4OMOBMAQUA":"ALMOX",
    "E5MMSUNPREV":"PMT", "FAOPPREININ":"ALMOX", "I3DAFUNCMS0":"ALMOX", "A1DTDEFOUTR":"ALMOX",
    "E6SUPLJA3RR":"Aprovisionamento", "IDDSATSPCEB":"Fiscalização", "FAOPPREMIAI":"ALMOX",
    "FAOPPREPADB":"ALMOX", "K9CCMSIINFO":"ALMOX", "D6PEINDMV1A":"Fiscalização", "D6PEINDMV1T":"Fiscalização",
    "A1DTDEFRODZ":"Aprovisionamento", "D5APFUNMNHT":"HT", "C6ENEASCAPE":"NPOR", "E3PCFSCDIAR":"SFPC",
    "C1ENCONESFO":"Aprovisionamento", "E3PCFSCINFO":"SFPC", "D5SAFUSASOC":"HT", "D8SAFCTUGPD":"Saúde",
    "E3PCFSCMAIN":"SFPC", "E3PCOPFDIAR":"SFPC", "IXAPFUNCMS0":"ALMOX", "IBTAXALIMPU":"Fiscalização", "E3PCPRCDIAR":"SFPC",
    "E3PCCAPDIAR":"SFPC", "E3PCFSCCONS":"SFPC", "E3PCFSCDEGE":"SFPC", "E3PCFSCMABM":"SFPC",
    "E3PCFSCOUTR":"SFPC", "E3PCFSCSEGU":"SFPC", "E5DTDEFCLOG":"SFPC", "E5PCFSCGRM9":"SFPC",
    "I3DACSPTELF":"Fiscalização", "D8SAFUSUGPD":"Saúde", "D8SAPIMNTCM":"Saúde", "I3DAFUNSUPL":"ALMOX",
    "FAOPPREPRON":"ALMOX", "IXOMOBMPNRE":"ALMOX", "C1ENEASEXPL":"NPOR", "FAOPPRECAPE":"ALMOX",
    "E6MIPLJUHIS":"ALMOX", "E6MIPLJBIDS":"ALMOX", "E6MIPLJUESP":"ALMOX", "I3DAFUNINCD":"Of Cmb Inc",
    "ESTRESCMS":"ALMOX", "FAOPPRESICO":"ALMOX", "D8SAMNTVTRA":"Saúde"
}


def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}")

class ConfigManager:
    def __init__(self, file_path):
        self.file_path = file_path
        self.config = self.load()

    def load(self):
        # 1. Calcular meta vigente
        from datetime import datetime
        now = datetime.now()
        year = now.year
        targets = [
            (datetime(year, 4, 30, 23, 59, 59), "ABR", "50", "20", "50"),
            (datetime(year, 6, 30, 23, 59, 59), "JUN", "70", "40", "60"),
            (datetime(year, 8, 31, 23, 59, 59), "AGO", "80", "50", "70"),
            (datetime(year, 10, 31, 23, 59, 59), "OUT", "100", "65", "75"),
            (datetime(year, 12, 31, 23, 59, 59), "DEZ", "100", "75", "85"),
        ]
        target_dt, mes, emp, liq, rpnp = None, "", "", "", ""
        for t_dt, m_name, e_val, l_val, r_val in targets:
            if t_dt >= now:
                target_dt = t_dt
                mes, emp, liq, rpnp = m_name, e_val, l_val, r_val
                break
        else:
            target_dt = datetime(year + 1, 4, 30, 23, 59, 59)
            mes, emp, liq, rpnp = "ABR", "50", "20", "50"
        
        target_date_str = target_dt.strftime('%d/%m/%Y')
        
        data = {}
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except:
                pass
                
        if "contacts" not in data or not isinstance(data.get("contacts"), dict):
            data["contacts"] = {s: "" for s in SETORES_PADRAO}
        if "selections" not in data or not isinstance(data.get("selections"), dict):
            data["selections"] = {s: True for s in SETORES_PADRAO}
        if "metas" not in data or not isinstance(data.get("metas"), dict):
            data["metas"] = {}
            
        metas = data["metas"]
        saved_date = metas.get("data_meta", "")
        
        if saved_date != target_date_str:
            metas["data_meta"] = target_date_str
            metas["emp_corr"] = emp
            metas["liq_corr"] = liq
            metas["liq_rpnp"] = rpnp
            data["metas"] = metas
            try:
                with open(self.file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)
                print(f"Metas atualizadas automaticamente para o período {mes} ({target_date_str})")
            except Exception as e:
                print("Erro ao atualizar config_notificacoes.json:", e)
                
        return data

    def save(self, contacts, selections, metas):
        self.config = {"contacts": contacts, "selections": selections, "metas": metas}
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=4)

def get_sheet():
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(creds)
    return gc.open_by_key(SHEET_ID)

def normalizar_numero(valor):
    if not valor: return 0.0
    txt = str(valor).replace('\xa0', '').replace(' ', '').replace('R$', '').replace('.', '').replace(',', '.')
    try: return float(txt)
    except: return 0.0

def formatar_moeda(valor):
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def _nc_dentro_de_dias(emissao_str, dias=3):
    """Verifica se a data de emissão da NC está dentro dos últimos N dias."""
    if not emissao_str or not emissao_str.strip():
        return False
    from datetime import timedelta
    hoje = datetime.now().date()
    limite = hoje - timedelta(days=dias)
    txt = emissao_str.strip().split()[0]
    for fmt in ("%d/%m/%y", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(txt, fmt).date()
            return dt >= limite
        except ValueError:
            continue
    return False

def extrair_ncs_recentes_banco(aba_banco):
    """Lê as NCs da aba BANCO e retorna a lista de NCs dos últimos 3 dias."""
    try:
        dados = aba_banco.get_values('U3:AB2000')
    except Exception as e:
        log(f"Erro lendo NCs do BANCO: {e}")
        return []
    
    ncs_recentes = []
    for r in dados:
        if len(r) < 8:
            continue
        ug = r[0].strip()
        emissao = r[1].strip()
        ptres = r[2].strip()
        nd = r[3].strip()
        obs = r[4].strip()
        nc_raw = r[5].strip()
        pi = r[6].strip()
        valor = r[7].strip()
        
        m = re.search(r'20\d{2}NC\d{6}', nc_raw.upper())
        if not m or not pi:
            continue
        nc = m.group(0)
        
        if _nc_dentro_de_dias(emissao, 3):
            setor_nome = PI_SETOR_OVERRIDE.get(pi, FILTRO_PI_RESP_LIST.get(pi, "NÃO MAPEADO"))
            setor_upper = setor_nome.upper()
            ncs_recentes.append({
                'ug': ug,
                'data': emissao,
                'ptres': ptres,
                'nd': nd,
                'obs': obs,
                'nc': nc,
                'pi': pi,
                'valor': valor,
                'setor': setor_upper
            })
    log(f"  [NCs Banco] {len(ncs_recentes)} NCs dos últimos 3 dias extraídas da aba BANCO.")
    return ncs_recentes

def extrair_dados_corrente(aba):
    saldo_pi, tipo_setor, proj_setor, alertas_40 = defaultdict(lambda: defaultdict(float)), defaultdict(lambda: defaultdict(float)), defaultdict(float), defaultdict(list)
    dados = aba.get_values("A3:S")
    for r in dados:
        if len(r) > 5 and r[5].strip():
            pi = r[0].strip()
            s = PI_SETOR_OVERRIDE.get(pi, r[5].strip().upper())
            v = normalizar_numero(r[4]); t = r[2].strip().upper()
            d = int(r[3]) if len(r)>3 and str(r[3]).isdigit() else 0
            saldo_pi[s][pi] += v; tipo_setor[s][t] += v
            proj_setor[s] += normalizar_numero(r[8]) if len(r)>8 else 0.0
            t_norm = t.replace('Á','A').replace('Ã','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U')
            if "ORDINARIO" in t_norm and d > 40 and v > 0: alertas_40[s].append({"ne": r[1].strip(), "dias": d, "valor": v})
        if len(r) > 15 and r[15].strip():
            pi = r[10].strip()
            s = PI_SETOR_OVERRIDE.get(pi, r[15].strip().upper())
            v = normalizar_numero(r[14]); t = r[12].strip().upper()
            d = int(r[13]) if len(r)>13 and str(r[13]).isdigit() else 0
            saldo_pi[s][pi] += v; tipo_setor[s][t] += v
            proj_setor[s] += normalizar_numero(r[18]) if len(r)>18 else 0.0
            t_norm = t.replace('Á','A').replace('Ã','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U')
            if "ORDINARIO" in t_norm and d > 40 and v > 0: alertas_40[s].append({"ne": r[11].strip(), "dias": d, "valor": v})
    return saldo_pi, tipo_setor, proj_setor, alertas_40

def extrair_dados_rpnp(aba):
    rpnp_setor, proj_rpnp, alertas_40_rpnp = defaultdict(float), defaultdict(float), defaultdict(list)
    dados = aba.get_values("A3:S")
    for r in dados:
        if len(r) > 5 and r[5].strip():
            pi = r[0].strip(); s = PI_SETOR_OVERRIDE.get(pi, r[5].strip().upper()); v = normalizar_numero(r[4]); rpnp_setor[s] += v
            proj_rpnp[s] += normalizar_numero(r[8]) if len(r)>8 else 0.0
            d = int(r[3]) if len(r)>3 and str(r[3]).isdigit() else 0
            t = r[2].strip().upper()
            t_norm = t.replace('\u00c1','A').replace('\u00c3','A').replace('\u00c9','E').replace('\u00cd','I').replace('\u00d3','O').replace('\u00da','U')
            if 'ORDINARIO' in t_norm and d > 40 and v > 0:
                alertas_40_rpnp[s].append({'ne': r[1].strip(), 'dias': d, 'valor': v})
        if len(r) > 15 and r[15].strip():
            pi = r[10].strip(); s = PI_SETOR_OVERRIDE.get(pi, r[15].strip().upper()); v = normalizar_numero(r[14]); rpnp_setor[s] += v
            proj_rpnp[s] += normalizar_numero(r[18]) if len(r)>18 else 0.0
            d = int(r[13]) if len(r)>13 and str(r[13]).isdigit() else 0
            t = r[12].strip().upper()
            t_norm = t.replace('\u00c1','A').replace('\u00c3','A').replace('\u00c9','E').replace('\u00cd','I').replace('\u00d3','O').replace('\u00da','U')
            if 'ORDINARIO' in t_norm and d > 40 and v > 0:
                alertas_40_rpnp[s].append({'ne': r[11].strip(), 'dias': d, 'valor': v})
    return rpnp_setor, proj_rpnp, alertas_40_rpnp

def extrair_dados_creditos(aba):
    cred_det = defaultdict(lambda: defaultdict(lambda: {"pi": "", "desc": "", "nd": "", "valor": 0.0, "ncs": [], "prazo": ""}))
    dados = aba.get_values("A3:AA")
    def extrair_bloco(start_col):
        current_g = None
        for r in dados:
            row = r[start_col:start_col+13]
            if len(row) < 11: continue
            pi = row[1].strip()
            if pi:
                setor = row[0].strip().upper(); nd = row[10].strip(); key = f"{pi}|||{nd}"
                item = cred_det[setor][key]
                item.update({"pi": pi, "desc": row[2].strip(), "nd": nd, "valor": normalizar_numero(row[3])})
                if len(row) > 8 and row[8].strip(): item["prazo"] = row[8].strip()
                if len(row) > 4 and row[4].strip() and row[4].strip() not in item["ncs"]: item["ncs"].append(row[4].strip())
                current_g = item
            elif current_g and len(row) > 4 and row[4].strip() and row[4].strip() not in current_g["ncs"]:
                current_g["ncs"].append(row[4].strip())
    extrair_bloco(0); extrair_bloco(14)
    return cred_det

def extrair_historico_novidades(aba_logs, nome_setor):
    try:
        data_log = aba_logs.get_all_values()
        if len(data_log) < 2: return []
        datas_unicas = sorted(list(set(r[1] for r in data_log[1:] if len(r)>1 and r[1])), key=lambda x: datetime.strptime(x, "%d/%m/%Y") if x.count('/')==2 else datetime.min, reverse=True)
        mapa_dia = defaultdict(lambda: {'nes': {}, 'creds': {}})
        for r in data_log[1:]:
            if len(r) > 8 and r[4].strip().upper() == nome_setor.strip().upper():
                cat, dt, pi, nd, ne, val = r[2], r[1], r[5].strip(), r[6].strip(), r[7].strip(), r[8]
                if dt in datas_unicas[:4]:
                        if "Empenho" in cat: mapa_dia[dt]['nes'][ne] = {'pi': pi, 'valor': val}
                        elif "Crédito" in cat: mapa_dia[dt]['creds'][f"{pi}_{nd}"] = {'pi': pi, 'nd': nd, 'valor': val}
        historico = []
        for i in range(min(3, len(datas_unicas) - 1)):
            hj, ot = datas_unicas[i], datas_unicas[i+1]
            hj_nes, ot_nes = mapa_dia[hj]['nes'], mapa_dia[ot]['nes']
            nov_e = [{'pi': hj_nes[n]['pi'], 'ne': n, 'valor': hj_nes[n]['valor']} for n in hj_nes if n not in ot_nes]
            hj_cr, ot_cr = mapa_dia[hj]['creds'], mapa_dia[ot]['creds']
            nov_c = [{'pi': hj_cr[k]['pi'], 'nd': hj_cr[k]['nd'], 'valor': hj_cr[k]['valor']} for k in hj_cr if k not in ot_cr]
            historico.append({'data': hj, 'anterior': ot, 'novos_e': nov_e, 'novos_c': nov_c})
        return historico
    except: return []


def extrair_novidades_todos_setores(aba_logs, dias=3):
    """
    Retorna novidades (empenhos e créditos) de TODOS os setores nos últimos N dias.
    Compara o dia mais recente com o dia anterior, identificando itens novos.
    """
    try:
        data_log = aba_logs.get_all_values()
        if len(data_log) < 2: return [], []
        datas_unicas = sorted(
            list(set(r[1] for r in data_log[1:] if len(r)>1 and r[1])),
            key=lambda x: datetime.strptime(x, "%d/%m/%Y") if x.count('/')==2 else datetime.min,
            reverse=True
        )
        if len(datas_unicas) < 2: return [], []

        # Construir mapa completo (todos setores)
        mapa = defaultdict(lambda: defaultdict(lambda: {'nes': {}, 'creds': {}}))
        for r in data_log[1:]:
            if len(r) <= 8: continue
            cat, dt, setor, pi, nd, ne, val = r[2], r[1], r[4].upper(), r[5], r[6], r[7], r[8]
            if dt not in datas_unicas[:dias+1]: continue
            if "Empenho" in cat: mapa[dt][setor]['nes'][ne] = {'pi': pi, 'ne': ne, 'valor': val, 'setor': setor}
            elif "Crédito" in cat: mapa[dt][setor]['creds'][f"{pi}_{nd}"] = {'pi': pi, 'nd': nd, 'valor': val, 'setor': setor}

        novos_empenhos, novos_creditos = [], []
        for i in range(min(dias, len(datas_unicas)-1)):
            hj, ot = datas_unicas[i], datas_unicas[i+1]
            for setor in set(list(mapa[hj].keys()) + list(mapa[ot].keys())):
                hj_nes  = mapa[hj][setor]['nes']
                ot_nes  = mapa[ot][setor]['nes']
                hj_cred = mapa[hj][setor]['creds']
                ot_cred = mapa[ot][setor]['creds']
                for ne, v in hj_nes.items():
                    if ne not in ot_nes:
                        novos_empenhos.append({**v, 'data': hj})
                for k, v in hj_cred.items():
                    if k not in ot_cred:
                        novos_creditos.append({**v, 'data': hj})

        return novos_empenhos, novos_creditos
    except Exception as e:
        log(f"  [novidades] Erro: {e}")
        return [], []


def extrair_liquidacao_diaria_setores(aba_logs, dias=5):
    """
    Calcula liquidação diária por setor comparando saldos de NEs entre dias consecutivos.

    Lógica (baseada na aba LOGS):
      - Para cada setor e cada NE, o LOG registra o saldo atual diariamente.
      - Se saldo(NE, dia D) < saldo(NE, dia D-1):  diferença = valor liquidado em D
      - Se NE desapareceu entre D-1 e D:           saldo(D-1) = liquidado totalmente em D
      - Se NE é novo em D (não existia em D-1):    novo empenho, não é liquidação

    Retorna: liq = {setor: {data: total_liquidado}}, datas (as N mais recentes)
    """
    try:
        data_log = aba_logs.get_all_values()
        if len(data_log) < 2:
            return {}, []

        # Pegar (dias+1) datas para ter a base de comparação do primeiro dia
        datas_unicas = sorted(
            list(set(r[1] for r in data_log[1:] if len(r) > 1 and r[1])),
            key=lambda x: datetime.strptime(x, "%d/%m/%Y") if x.count('/') == 2 else datetime.min,
            reverse=True
        )[:dias + 1]

        if len(datas_unicas) < 2:
            return {}, []

        # Montar mapa: {data: {setor: {NE: saldo}}}
        # r[1]=data, r[4]=setor, r[7]=NE, r[8]=valor
        mapa = defaultdict(lambda: defaultdict(dict))
        for r in data_log[1:]:
            if len(r) <= 8:
                continue
            dt, setor, ne, val = r[1], r[4].strip().upper(), r[7].strip(), r[8]
            if dt not in datas_unicas or not ne:
                continue
            mapa[dt][setor][ne] = normalizar_numero(val)

        # Calcular liquidações por dia: comparar datas_unicas[i] com datas_unicas[i+1]
        # datas_unicas[0] = mais recente, datas_unicas[1] = anterior, etc.
        liq = defaultdict(lambda: defaultdict(float))

        for i in range(len(datas_unicas) - 1):
            dia_recente  = datas_unicas[i]      # o dia "hoje" da iteração
            dia_anterior = datas_unicas[i + 1]  # o dia "ontem" da iteração

            todos_setores = set(list(mapa[dia_recente].keys()) + list(mapa[dia_anterior].keys()))

            for setor in todos_setores:
                nes_recente  = mapa[dia_recente][setor]
                nes_anterior = mapa[dia_anterior][setor]
                total_liq = 0.0

                for ne, val_ant in nes_anterior.items():
                    val_rec = nes_recente.get(ne)
                    if val_rec is None:
                        # NE desapareceu → liquidado totalmente
                        total_liq += val_ant
                    elif val_rec < val_ant - 0.005:
                        # Saldo diminuiu → liquidação parcial
                        total_liq += val_ant - val_rec

                if total_liq > 0:
                    liq[setor][dia_recente] += total_liq

        # Retornar apenas os `dias` mais recentes (sem o extra de comparação)
        datas_retorno = datas_unicas[:dias]
        return liq, datas_retorno

    except Exception as e:
        log(f"  [liquidacao_diaria] Erro: {e}")
        return {}, []

def log_report_terminal_completo(setor, metas, pc, pr, s_t, rv, cd, hist, al, ncs_setor=None):
    print("\n" + "╔" + "═"*70 + "╗")
    print(f"║ RELATÓRIO COMPLETO: {setor:50} ║")
    print("╠" + "═"*70 + "╣")
    print(f"║ METAS: Emp. Corr {metas['emp_corr']}% | Liq. Corr {metas['liq_corr']}% | Liq. RPNP {metas['liq_rpnp']}% {'':12}║")
    print(f"║ PROJEÇÃO CORRENTE: {formatar_moeda(pc):25} | RPNP: {formatar_moeda(pr):23} ║")
    if al:
        print("╠" + "═"*70 + "╣")
        print("║ ⚠️ ALERTA: EMPENHOS ORDINÁRIOS > 40 DIAS" + " "*30 + "║")
        for a in al: print(f"║  • NE: {a['ne']:10} | Idade: {a['dias']:2} dias | Saldo: {formatar_moeda(a['valor']):15} ║")
    print("╟" + "─"*70 + "╢")
    print("║ SALDOS CORRENTES POR TIPO:" + " "*42 + "║")
    tipo = s_t.get(setor, {})
    o, g, e = tipo.get("ORDINARIO",0)+tipo.get("ORDINÁRIO",0), tipo.get("GLOBAL",0), tipo.get("ESTIMATIVO",0)
    print(f"║  • Ordinário: {formatar_moeda(o):18} | Global: {formatar_moeda(g):18} ║")
    print(f"║  • Estimativo: {formatar_moeda(e):17} | RPNP: {formatar_moeda(rv):20} ║")
    if cd.get(setor):
        print("╟" + "─"*70 + "╢")
        print("║ CRÉDITOS DISPONÍVEIS NA TELA:" + " "*39 + "║")
        for v in cd[setor].values():
            ncs = f"[{len(v['ncs'])}] NCs: {', '.join(v['ncs'][:2])}{'...' if len(v['ncs'])>2 else ''}"
            line = f"• PI: {v['pi']} | ND: {v['nd']} | {ncs}"
            print(f"║  {line[:50]:50} | {formatar_moeda(v['valor']):15} ║")
            if v['desc']: print(f"║    ({v['desc'][:65]})" + " "*(65-len(v['desc'][:65])) + " ║")
    print("╟" + "─"*(31) + " 💰 NOVAS NCs (BANCO) " + "─"*(18) + "╢")
    if not ncs_setor:
        print(f"║  Nenhuma nova NC nos últimos 3 dias." + " "*32 + "║")
    else:
        por_data = defaultdict(list)
        for nc in ncs_setor:
            por_data[nc['data']].append(nc)
        for data, itens in por_data.items():
            print(f"║  NCs {data[:5]}:" + " "*(59 - len(data[:5])) + "║")
            for x in itens:
                val_fmt = formatar_moeda(normalizar_numero(x['valor']))
                line = f"• NC: {x['nc']} | PI: {x['pi']} | ND: {x['nd']}"
                print(f"║    {line[:48]:48} | {val_fmt:12} ║")
    print("╟" + "─"*(31) + " 🆕 NOVOS EMPENHOS " + "─"*(20) + "╢")
    if not hist: print(f"║  Histórico de logs insuficiente para comparação." + " "*21 + "║")
    else:
        for dh in hist:
            data_h = dh['data'][:5]
            if dh['novos_e']:
                print(f"║  Empenhos {data_h}:" + " "*51 + "║")
                for x in dh['novos_e']: print(f"║    • PI: {x['pi']} | NE: {x['ne']} | Val: {x['valor']:28} ║")
            else: print(f"║  Sem novos empenhos desde {dh['anterior'][:5]}" + " "*(37) + "║")
    print("╚" + "═"*70 + "╝")

def gerar_email_setor(setor, s_tipo, rv, cd, pc, pr, metas, hist, al, ncs_setor=None):
    logo_path = os.path.join(BASE_DIR, "assets", "logo.png")
    data_meta_str = metas.get('data_meta', '30/04/2026')
    try:
        from datetime import datetime as _dt
        data_meta_dt = _dt.strptime(data_meta_str, '%d/%m/%Y')
    except:
        data_meta_dt = datetime(2026, 4, 30)
    dias = (data_meta_dt - datetime.now()).days
    img = f'<img src="data:image/png;base64,{base64.b64encode(open(logo_path, "rb").read()).decode()}" alt="Logo" style="height: 80px;">' if os.path.exists(logo_path) else ""
    html = f"""
    <div style="font-family: Arial; border: 1px solid #ddd; max-width: 600px; margin: auto; border-radius: 8px; overflow: hidden;">
      <div style="background: #005A36; color: white; padding: 20px; text-align: center;">{img}<h2 style="margin:0;">Relatório SAG - {setor}</h2></div>
      <div style="background: #fff9c4; padding: 10px; text-align: center; font-size: 13px; border-bottom: 1px solid #fbc02d; color: #5d4037;">
        <b>🔄 Sincronização:</b> Todos os empenhos e créditos foram sincronizados com o SAG neste exato momento.
      </div>
      <div style="padding: 20px;">
        <div style="margin-top: 15px; padding: 15px; background: #f0fff4; border: 2px solid #38a169; border-radius: 10px;">
          <h3 style="color: #2f855a; margin: 0 0 10px;">🎯 METAS CORRENTE ({metas['emp_corr']}% Emp / {metas['liq_corr']}% Liq)</h3>
          <p>Planejado: <strong>{formatar_moeda(pc)}</strong> | Faltam {dias} dias para {data_meta_str}</p>
        </div>
        <div style="margin-top: 10px; padding: 15px; background: #ebf8ff; border: 2px solid #3182ce; border-radius: 10px;">
          <h3 style="color: #2b6cb0; margin: 0 0 10px;">📋 METAS RPNP ({metas['liq_rpnp']}% Liq)</h3>
          <p>Planejado: <strong>{formatar_moeda(pr)}</strong></p>
        </div>
    """
    if al:
        html += '<div style="margin-top:10px; padding:15px; background:#fff5f5; border: 2px solid #e53e3e;"><h3 style="color:#c53030;">⚠️ ORDINÁRIOS > 40 DIAS</h3>'
        for a in al: html += f'<p style="font-size:12px;">• NE: {a["ne"]} | {a["dias"]} dias | {formatar_moeda(a["valor"])}</p>'
        html += '</div>'
    html += f'<div style="margin-top:15px; padding:15px; background:#fff5f5; border-left:5px solid #e53e3e;"><h3>💰 NOVAS NCs (ÚLTIMOS 3 DIAS)</h3>'
    if not ncs_setor:
        html += '<p style="color:#666; font-size:12px;">Nenhuma nova NC identificada nos últimos 3 dias.</p>'
    else:
        por_data_nc = defaultdict(list)
        def parse_data(d_str):
            for fmt in ("%d/%m/%Y", "%d/%m/%y"):
                try:
                    return datetime.strptime(d_str.strip().split()[0], fmt).date()
                except:
                    continue
            return datetime.min.date()
            
        for nc in sorted(ncs_setor, key=lambda x: parse_data(x['data']), reverse=True):
            por_data_nc[nc['data']].append(nc)
            
        for data, itens in por_data_nc.items():
            html += f'<p style="margin-bottom:5px;"><b>NCs {data[:5]}:</b></p>'
            for x in itens:
                val_fmt = formatar_moeda(normalizar_numero(x['valor']))
                html += f'<p style="margin:2px 0 2px 15px; font-size:12px;">• <b>NC: {x["nc"]}</b> | PI: {x["pi"]} | ND: {x["nd"]} | {val_fmt}</p>'
    html += '</div><div style="margin-top:10px; padding:15px; background:#fffaf0; border-left:5px solid #dd6b20;"><h3>🆕 NOVOS EMPENHOS</h3>'
    if not hist: html += '<p style="color:#666;">Histórico insuficiente.</p>'
    else:
        for dh in hist:
            if dh['novos_e']:
                html += f'<p style="margin-bottom:5px;"><b>Empenhos {dh["data"][:5]}:</b></p>'
                for x in dh['novos_e']: html += f'<p style="margin:2px 0 2px 15px; font-size:12px;">• PI: {x["pi"]} | NE: {x["ne"]} | {x["valor"]}</p>'
            else: html += f'<p style="color:#666; font-size:12px;">Sem novos empenhos desde {dh["anterior"][:5]}</p>'
    html += '</div>'
    tt = s_tipo.get(setor, {})
    html += f'<div style="margin-top:20px;"><h4>Saldos Correntes</h4><p>Ordinário: {formatar_moeda(tt.get("ORDINARIO",0)+tt.get("ORDINÁRIO",0))} | Global: {formatar_moeda(tt.get("GLOBAL",0))}</p><h4>RPNP TOTAL: {formatar_moeda(rv)}</h4></div>'
    if cd.get(setor):
        html += '<h4>Créditos na Tela</h4>'
        for x in cd[setor].values():
            ncs = f"[{len(x['ncs'])}] NCs: {', '.join(x['ncs'])}"
            prazo_badge = ""
            if x["valor"] < 100:
                prazo_txt = f" Prazo: {x['prazo']}" if x.get("prazo") else ""
                prazo_badge = f'<span style="background:#9f7aea; color:white; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; margin-left:8px;">Residual{prazo_txt}</span>'
            elif x.get("prazo"):
                try:
                    dias_prazo = (datetime.strptime(x["prazo"], "%d/%m/%Y") - datetime.now()).days
                    if dias_prazo < 0: prazo_badge = f'<span style="background:#f56565; color:white; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; margin-left:8px;">Prazo: {x["prazo"]} (Vencido)</span>'
                    elif dias_prazo <= 20: prazo_badge = f'<span style="background:#ecc94b; color:#1a202c; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; margin-left:8px;">Prazo: {x["prazo"]} (Atenção)</span>'
                    else: prazo_badge = f'<span style="background:#48bb78; color:white; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; margin-left:8px;">Prazo: {x["prazo"]}</span>'
                except: prazo_badge = f'<span style="background:#e2e8f0; color:#4a5568; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; margin-left:8px;">Prazo: {x["prazo"]}</span>'

            html += f'<p style="border-bottom:1px solid #eee; padding:5px 0; margin:0; font-size:12px;">• <b>{x["pi"]}</b> | {x["nd"]} | {ncs} | <b>{formatar_moeda(x["valor"])}</b> {prazo_badge}<br><i style="color:#666;">{x["desc"]}</i></p>'
    html += '<div style="background: #f4f4f4; padding: 10px; text-align: center; font-size: 11px; margin-top:20px;">Gestão Orçamentária ADM63</div></div></div>'
    return html


def gerar_email_fiscalizacao(s_tipo, rv, cd, pc, pr, metas, hist,
                             al, novos_empenhos, ncs_recentes,
                             liq_diaria, datas_liq, alertas_40_todos=None):
    """
    E-mail premium e exclusivo para a Fiscalização:
    - Seção própria: créditos/empenhos da FISCALIZAÇÃO + saldos
    - Overview global: novos empenhos/créditos de TODOS setores (3 dias)
    - Liquidação diária por setor (5 dias)
    - Contador de dias até a meta
    """
    logo_path  = os.path.join(BASE_DIR, "assets", "logo.png")
    data_meta_str = metas.get('data_meta', '30/04/2026') if isinstance(metas, dict) else '30/04/2026'
    try:
        data_meta_dt = datetime.strptime(data_meta_str, '%d/%m/%Y')
    except:
        data_meta_dt = datetime(2026, 4, 30)
    dias_meta  = (data_meta_dt - datetime.now()).days
    setor      = 'FISCALIZAÇÃO'
    img        = (f'<img src="data:image/png;base64,{base64.b64encode(open(logo_path,"rb").read()).decode()}" '
                  f'alt="Logo" style="height:70px;">') if os.path.exists(logo_path) else ''

    # ── cores palette ──
    VERDE   = '#1a472a'
    ORO     = '#c8a951'
    CARD_BG = '#f8f9fa'
    BORDA   = '#2d6a4f'

    html = f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:700px; margin:auto;
                border:1px solid {BORDA}; border-radius:10px; overflow:hidden; background:#fff;">

      <!-- CABEÇALHO -->
      <div style="background:linear-gradient(135deg,{VERDE} 0%,#2d6a4f 100%);
                  color:white; padding:25px 20px; text-align:center;">
        {img}
        <h1 style="margin:10px 0 4px; font-size:20px; letter-spacing:1px;">
          ⚖️ RELATÓRIO DE FISCALIZAÇÃO
        </h1>
        <p style="margin:0; font-size:12px; opacity:.85;">63º Batalhão de Infantaria · ADM · {datetime.now().strftime('%d/%m/%Y às %H:%M')}</p>
        <div style="display:inline-block; background:{ORO}; color:#222; border-radius:20px;
                    padding:4px 18px; margin-top:10px; font-weight:bold; font-size:13px;">
          ⏳ {dias_meta} dias até a meta ({data_meta_str})
        </div>
      </div>

      <!-- ALERTA 40 DIAS -->
    """

    if al:
        html += f"""
      <div style="background:#fff5f5; border-left:5px solid #e53e3e; padding:14px 18px; margin:12px 14px; border-radius:6px;">
        <h3 style="color:#c53030; margin:0 0 8px;">⚠️ EMPENHOS ORDINÁRIOS &gt; 40 DIAS — FISCALIZAÇÃO</h3>
        <table width="100%" cellspacing="0" cellpadding="4" style="font-size:12px;">
          <tr style="background:#c53030; color:white;">
            <th align="left">NE</th><th align="center">Dias</th><th align="right">Saldo</th>
          </tr>
        """
        for a in al:
            html += f'<tr style="border-bottom:1px solid #ffd5d5;"><td>{a["ne"]}</td><td align="center">{a["dias"]}</td><td align="right">{formatar_moeda(a["valor"])}</td></tr>'
        html += '</table></div>'

    # ── METAS CORRENTE / RPP ──
    html += f"""
      <div style="display:flex; gap:10px; padding:12px 14px;">
        <div style="flex:1; background:{CARD_BG}; border:1px solid #c3e6cb; border-radius:8px; padding:12px;">
          <div style="font-size:11px; color:#666; text-transform:uppercase; letter-spacing:1px;">Meta Empenho Corrente</div>
          <div style="font-size:13px; font-weight:bold; color:{VERDE}; margin-top:4px;">{metas.get('emp_corr','—')}%</div>
        </div>
        <div style="flex:1; background:{CARD_BG}; border:1px solid #bee3f8; border-radius:8px; padding:12px;">
          <div style="font-size:11px; color:#666; text-transform:uppercase; letter-spacing:1px;">Meta Liquidação Corrente</div>
          <div style="font-size:13px; font-weight:bold; color:#2b6cb0; margin-top:4px;">{metas.get('liq_corr','—')}%</div>
        </div>
        <div style="flex:1; background:{CARD_BG}; border:1px solid #e9c46a33; border-radius:8px; padding:12px;">
          <div style="font-size:11px; color:#666; text-transform:uppercase; letter-spacing:1px;">Meta Liquidação RPNP</div>
          <div style="font-size:13px; font-weight:bold; color:#9c6500; margin-top:4px;">{metas.get('liq_rpnp','—')}%</div>
        </div>
      </div>
    """

    # ════════ OVERVIEW GLOBAL ════════
    html += f"""
      <div style="margin:10px 14px 0; padding:12px 16px;
                  background:linear-gradient(135deg,{VERDE},#2d6a4f);
                  border-radius:8px 8px 0 0;">
        <h2 style="color:{ORO}; margin:0; font-size:15px; letter-spacing:1px;">
          🌐 OVERVIEW GERAL DO BATALHÃO
        </h2>
        <p style="color:#cde; margin:2px 0 0; font-size:11px;">Visão consolidada de todos os setores</p>
      </div>
      <div style="margin:0 14px 12px; border:1px solid {BORDA}; border-top:0; border-radius:0 0 8px 8px; padding:14px; background:#fafafa;">
    """

    # ── Empenhos ordinários > 40 dias (todos setores) ──
    alertas_40_todos = alertas_40_todos or {'corrente': [], 'rpnp': []}
    todos_40 = alertas_40_todos.get('corrente', []) + alertas_40_todos.get('rpnp', [])
    if todos_40:
        html += f'<div style="background:#fff5f5; border:1px solid #fc8181; border-radius:6px; padding:10px; margin-bottom:15px;">'
        html += f'<h4 style="color:#c53030; margin:0 0 8px; border-bottom:2px solid #fc8181; padding-bottom:4px;">\u23f1\ufe0f EMPENHOS ORDIN\u00c1RIOS &gt; 40 DIAS — TODOS OS SETORES</h4>'
        if alertas_40_todos.get('corrente'):
            html += f'<p style="font-size:11px; font-weight:700; margin:8px 0 4px; color:{VERDE};">Exerc\u00edcio Corrente</p>'
            html += '<table width="100%" cellspacing="0" cellpadding="3" style="font-size:11px; border-collapse:collapse;">'
            html += f'<tr style="background:{VERDE}; color:white;"><th align="left">Setor</th><th align="left">NE</th><th align="left">PI</th><th align="center">Dias</th><th align="right">Saldo</th></tr>'
            for a in alertas_40_todos['corrente']:
                cor_d = '#c53030' if a['dias'] > 90 else '#b7791f'
                html += f'<tr style="border-bottom:1px solid #ffd5d5;"><td><b>{a["setor"]}</b></td><td>{a["ne"]}</td><td>{a["pi"]}</td><td align="center" style="color:{cor_d}; font-weight:bold;">{a["dias"]}d</td><td align="right">{formatar_moeda(a["valor"])}</td></tr>'
            html += '</table>'
        if alertas_40_todos.get('rpnp'):
            html += f'<p style="font-size:11px; font-weight:700; margin:10px 0 4px; color:#2b6cb0;">RPNP (Restos a Pagar)</p>'
            html += '<table width="100%" cellspacing="0" cellpadding="3" style="font-size:11px; border-collapse:collapse;">'
            html += '<tr style="background:#2b6cb0; color:white;"><th align="left">Setor</th><th align="left">NE</th><th align="left">PI</th><th align="center">Dias</th><th align="right">Saldo</th></tr>'
            for a in alertas_40_todos['rpnp']:
                cor_d = '#c53030' if a['dias'] > 90 else '#b7791f'
                html += f'<tr style="border-bottom:1px solid #bee3f8;"><td><b>{a["setor"]}</b></td><td>{a["ne"]}</td><td>{a["pi"]}</td><td align="center" style="color:{cor_d}; font-weight:bold;">{a["dias"]}d</td><td align="right">{formatar_moeda(a["valor"])}</td></tr>'
            html += '</table>'
        html += '</div>'

    # ── EMPENHOS CRÍTICOS E ATENÇÃO (PRAZO <= 20 DIAS) ──
    creditos_criticos = []
    for sector, items in cd.items():
        for k, v in items.items():
            if v.get("prazo") and v.get("valor", 0) >= 100:
                try:
                    dt_prazo = datetime.strptime(v["prazo"], "%d/%m/%Y")
                    dias_prazo = (dt_prazo - datetime.now()).days
                    if dias_prazo <= 20: # Vencidos e Atenção (Amarelo)
                        creditos_criticos.append({"setor": sector, "pi": v["pi"], "nd": v["nd"], "valor": v["valor"], "prazo": v["prazo"], "dias": dias_prazo})
                except: pass

    if creditos_criticos:
        html += f'<div style="background:#fff5f5; border:1px solid #fc8181; border-radius:6px; padding:10px; margin-bottom:15px;">'
        html += f'<h4 style="color:#c53030; margin:0 0 8px; border-bottom:2px solid #fc8181; padding-bottom:4px;">🚨 ALERTA: CRÉDITOS VENCIDOS E EM ATENÇÃO</h4>'
        html += '<table width="100%" cellspacing="0" cellpadding="3" style="font-size:11px; border-collapse:collapse;">'
        html += f'<tr style="background:#c53030; color:white;"><th align="left">Setor</th><th align="left">PI</th><th align="left">ND</th><th align="right">Valor</th><th align="right">Prazo</th></tr>'
        # Organizar do mais crítico para o menos crítico
        for cr in sorted(creditos_criticos, key=lambda x: x["dias"]):
            if cr["dias"] < 0:
                urg_label = f'{cr["prazo"]} (VENCIDO)'
                cor_texto = '#c53030'
                bg_linha = '#fed7d7'
            else:
                urg_label = f'{cr["prazo"]} ({cr["dias"]}d)'
                cor_texto = '#b7791f'
                bg_linha = '#fefcbf'
            html += f'<tr style="border-bottom:1px solid #e2e8f0; background:{bg_linha};"><td><b>{cr["setor"]}</b></td><td>{cr["pi"]}</td><td>{cr["nd"]}</td><td align="right">{formatar_moeda(cr["valor"])}</td><td align="right" style="color:{cor_texto}; font-weight:bold;">{urg_label}</td></tr>'
        html += '</table></div>'

    # ── Novos Empenhos (TODOS setores, últimos 3 dias) ──
    html += f'<h4 style="color:{VERDE}; margin:0 0 8px; border-bottom:2px solid {ORO}; padding-bottom:4px;">🆕 Novos Empenhos — Todos os Setores (últimos 3 dias)</h4>'
    if not novos_empenhos:
        html += '<p style="color:#666; font-size:12px;">Nenhum empenho novo identificado.</p>'
    else:
        # Agrupar por data
        por_data = defaultdict(list)
        for item in sorted(novos_empenhos, key=lambda x: x['data'], reverse=True):
            por_data[item['data']].append(item)
        for data, itens in por_data.items():
            html += f'<p style="margin:8px 0 4px; font-size:12px;"><b>📅 {data[:5]}:</b></p>'
            html += '<table width="100%" cellspacing="0" cellpadding="3" style="font-size:11px; border-collapse:collapse;">'
            html += f'<tr style="background:{VERDE}; color:white;"><th align="left">Setor</th><th align="left">PI</th><th align="left">NE</th><th align="right">Valor</th></tr>'
            for it in itens:
                html += f'<tr style="border-bottom:1px solid #e2e8f0;"><td><b>{it["setor"]}</b></td><td>{it["pi"]}</td><td style="color:#555;">{it["ne"]}</td><td align="right">{it["valor"]}</td></tr>'
            html += '</table>'

    # ── Novas NCs (Banco) (TODOS setores, últimos 3 dias) ──
    html += f'<h4 style="color:{VERDE}; margin:16px 0 8px; border-bottom:2px solid {ORO}; padding-bottom:4px;">💳 Novas NCs (Banco) — Todos os Setores (últimos 3 dias)</h4>'
    if not ncs_recentes:
        html += '<p style="color:#666; font-size:12px;">Nenhuma nova NC identificada nos últimos 3 dias.</p>'
    else:
        por_data_c = defaultdict(list)
        def parse_data(d_str):
            for fmt in ("%d/%m/%Y", "%d/%m/%y"):
                try:
                    return datetime.strptime(d_str.strip().split()[0], fmt).date()
                except:
                    continue
            return datetime.min.date()
            
        for item in sorted(ncs_recentes, key=lambda x: parse_data(x['data']), reverse=True):
            por_data_c[item['data']].append(item)
            
        for data, itens in por_data_c.items():
            html += f'<p style="margin:8px 0 4px; font-size:12px;"><b>📅 {data[:5]}:</b></p>'
            html += '<table width="100%" cellspacing="0" cellpadding="3" style="font-size:11px; border-collapse:collapse;">'
            html += f'<tr style="background:{VERDE}; color:white;"><th align="left">Setor</th><th align="left">NC</th><th align="left">PI</th><th align="left">ND</th><th align="right">Valor</th></tr>'
            for it in itens:
                val_fmt = formatar_moeda(normalizar_numero(it["valor"]))
                html += f'<tr style="border-bottom:1px solid #e2e8f0;"><td><b>{it["setor"]}</b></td><td>{it["nc"]}</td><td>{it["pi"]}</td><td>{it["nd"]}</td><td align="right">{val_fmt}</td></tr>'
            html += '</table>'

    # ── Liquidação por setor por dia (5 dias) ──
    html += f'<h4 style="color:{VERDE}; margin:16px 0 8px; border-bottom:2px solid {ORO}; padding-bottom:4px;">📊 Liquidação por Setor — Últimos 5 Dias (R$)</h4>'
    if not datas_liq or not liq_diaria:
        html += '<p style="color:#666; font-size:12px;">Dados de liquidação insuficientes.</p>'
    else:
        setores_com_liq = sorted(liq_diaria.keys())
        html += '<div style="overflow-x:auto;">'
        html += '<table width="100%" cellspacing="0" cellpadding="4" style="font-size:11px; border-collapse:collapse; min-width:500px;">'
        # cabeçalho
        html += f'<tr style="background:{VERDE}; color:white;"><th align="left">Setor</th>'
        for d in datas_liq:
            html += f'<th align="right">{d[:5]}</th>'
        html += '<th align="right" style="background:#c8a951; color:#222;">TOTAL 5d</th></tr>'
        # linhas
        for s in setores_com_liq:
            total_s = sum(liq_diaria[s].values())
            if total_s <= 0: continue
            html += f'<tr style="border-bottom:1px solid #e2e8f0;"><td><b>{s}</b></td>'
            for d in datas_liq:
                v = liq_diaria[s].get(d, 0)
                cor = f'color:{VERDE}; font-weight:bold;' if v > 0 else 'color:#ccc;'
                html += f'<td align="right" style="{cor}">{formatar_moeda(v) if v > 0 else "—"}</td>'
            html += f'<td align="right" style="font-weight:bold; color:#9c6500;">{formatar_moeda(total_s)}</td></tr>'
        # totais por dia
        html += f'<tr style="background:#f0f4f0; font-weight:bold;"><td>TOTAL</td>'
        for d in datas_liq:
            total_dia = sum(liq_diaria[s].get(d, 0) for s in setores_com_liq)
            html += f'<td align="right">{formatar_moeda(total_dia)}</td>'
        total_geral = sum(sum(liq_diaria[s].values()) for s in setores_com_liq)
        html += f'<td align="right" style="color:{VERDE};">{formatar_moeda(total_geral)}</td></tr>'
        html += '</table></div>'

    html += '</div>'

    # RODAPÉ
    html += f'<div style="background:#1a472a; color:#a8d8b0; padding:10px; text-align:center; font-size:11px;">Gestão Orçamentária · 63º BI · ADM</div>'
    html += '</div>'
    return html

class AppDashboard:
    def __init__(self, manager):
        self.manager = manager; self.ready = False; self.root = tk.Tk(); self.root.title("Gestão de Notificações ADM63"); self.root.geometry("650x850")
        self.entries, self.metas, self.checks = {}, {}, {}; self.setup()
    def setup(self):
        tk.Label(self.root, text="CENTRO DE CONFIGURAÇÃO DE RELATÓRIOS", font=("Arial", 12, "bold")).pack(pady=10)
        fm = tk.Frame(self.root); fm.pack(pady=5); sm = self.manager.config.get("metas", {})
        for i, (k, l) in enumerate([('emp_corr','% Emp. Corr'),('liq_corr','% Liq. Corr'),('liq_rpnp','% Liq. RPNP')]):
            tk.Label(fm, text=l).grid(row=0, column=i*2, padx=5)
            self.metas[k] = tk.Entry(fm, width=5); self.metas[k].insert(0, sm.get(k,"60")); self.metas[k].grid(row=0, column=i*2+1, padx=5)
        # Data Meta row (Desabilitado para edição, data fixa baseada no calendário de metas)
        tk.Label(fm, text="Data Meta (dd/mm/aaaa):").grid(row=1, column=0, padx=5, pady=(6,0), columnspan=3, sticky='w')
        self.metas['data_meta'] = tk.Entry(fm, width=12)
        self.metas['data_meta'].insert(0, sm.get('data_meta', '30/04/2026'))
        self.metas['data_meta'].config(state="readonly")
        self.metas['data_meta'].grid(row=1, column=3, padx=5, pady=(6,0), columnspan=3, sticky='w')
        ct = tk.Frame(self.root); ct.pack(fill="both", expand=True, padx=20, pady=10)
        sc, ss = self.manager.config.get("contacts",{}), self.manager.config.get("selections",{})
        for s in SETORES_PADRAO:
            f = tk.Frame(ct); f.pack(fill="x", pady=2); var = tk.BooleanVar(value=ss.get(s,True)); self.checks[s] = var
            tk.Checkbutton(f, variable=var).pack(side="left"); tk.Label(f, text=f"{s:18}:", font=("Courier", 9)).pack(side="left")
            e = tk.Entry(f); e.insert(0, sc.get(s,"")); e.pack(side="left", fill="x", expand=True, padx=5); self.entries[s] = e
        tk.Button(self.root, text="EXECUTAR E SALVAR", bg="#005A36", fg="white", font=("Arial", 10, "bold"), command=self.confirm).pack(pady=20)
    def confirm(self):
        c, s, m = {s: e.get() for s, e in self.entries.items()}, {s: v.get() for s, v in self.checks.items()}, {k: v.get() for k, v in self.metas.items()}
        self.manager.save(c,s,m); self.fm, self.fs, self.fc = m,s,c; self.ready = True; self.root.destroy()
    def run(self): 
        self.root.mainloop()
        if not hasattr(self, 'fm'): return False, {}, {}, {}
        return self.ready, self.fm, self.fs, self.fc

def send_gmail(html, sub, dest):
    import time
    import os.path
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from email.message import EmailMessage

    scopes = ['https://www.googleapis.com/auth/gmail.send']
    token_path = os.path.join(BASE_DIR, "auth", "token_gmail.json")
    client_secrets = os.path.join(BASE_DIR, "auth", "google_credentials.json")
    
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, scopes)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                log(f"  [AVISO] O token do Gmail expirou ou foi revogado ({e}). Aguardando relogin no navegador...")
                flow = InstalledAppFlow.from_client_secrets_file(client_secrets, scopes)
                creds = flow.run_local_server(port=0)
        else:
            log("  [AVISO] Solicitação de autenticação inicial do Gmail. Aguardando navegador...")
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets, scopes)
            creds = flow.run_local_server(port=0)
            
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    
    for d in dest.split(';'):
        if not d.strip(): continue
        msg = EmailMessage(); msg.set_content("HTML"); msg.add_alternative(html, subtype='html')
        msg['Subject'] = sub; msg['To'] = d.strip(); msg['From'] = 'me'
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        enviado = False
        for tentativa in range(1, 4):  # 3 tentativas
            try:
                service.users().messages().send(userId="me", body={'raw': raw}).execute()
                log(f"  OK: {d.strip()}")
                enviado = True
                break
            except Exception as e:
                espera = 5 * tentativa
                if tentativa < 3:
                    log(f"  [Tentativa {tentativa}/3] Timeout ao enviar para {d.strip()}. Aguardando {espera}s...")
                    time.sleep(espera)
                else:
                    log(f"  [FALHA] Não foi possível enviar para {d.strip()} após 3 tentativas. Último erro: {e}")

def main():
    now = datetime.now()
    if (now.hour == 10 and 0 <= now.minute <= 5) or "--automatico" in sys.argv:
        log("MODO AUTOMÁTICO ATIVADO. Pulando interface...")
        manager = ConfigManager(CONFIG_FILE)
        ready, metas, selected, contacts = True, manager.config.get("metas"), manager.config.get("selections"), manager.config.get("contacts")
    else:
        log("Modo Manual: Aguardando Dashboard...")
        manager = ConfigManager(CONFIG_FILE); dash = AppDashboard(manager); ready, metas, selected, contacts = dash.run()
    
    if not ready: return
    sheet = get_sheet()
    try:
        ws_emp = sheet.worksheet("Controle EMP 26"); s_pi, s_tipo, p_corr, alerts40 = extrair_dados_corrente(ws_emp)
        ws_rpnp = sheet.worksheet("Controle EMP RPNP"); r_set, p_rpnp, alerts40_rpnp = extrair_dados_rpnp(ws_rpnp)
        aba_logs = sheet.worksheet("LOGS")
        c_det = extrair_dados_creditos(sheet.worksheet("Créditos na tela"))

        # Dados globais para a Fiscalização e NCs do BANCO
        aba_banco = sheet.worksheet("BANCO")
        ncs_recentes_banco = extrair_ncs_recentes_banco(aba_banco)
        novos_emp_global, _ = extrair_novidades_todos_setores(aba_logs, dias=3)
        liq_diaria, datas_liq = extrair_liquidacao_diaria_setores(aba_logs, dias=5)

        # Consolidar alertas 40D+ de todos os setores
        alertas_40_corr_todos = []
        for s_nome, itens in alerts40.items():
            for item in itens:
                alertas_40_corr_todos.append({**item, 'setor': s_nome, 'pi': ''})
        alertas_40_rpnp_todos = []
        for s_nome, itens in alerts40_rpnp.items():
            for item in itens:
                alertas_40_rpnp_todos.append({**item, 'setor': s_nome, 'pi': ''})
        alertas_40_todos = {
            'corrente': sorted(alertas_40_corr_todos, key=lambda x: x['dias'], reverse=True),
            'rpnp':     sorted(alertas_40_rpnp_todos, key=lambda x: x['dias'], reverse=True),
        }

        feedbacks_md = []
        feedbacks_md.append(f"# Relatório de Feedbacks e E-mails Enviados - {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        feedbacks_md.append(f"Este arquivo contém o resumo de todas as informações atualizadas e e-mails de feedback gerados na rotina diária para cada seção.\n")
        feedbacks_md.append("## Metas Globais Definidas")
        feedbacks_md.append(f"- **Empenho Corrente:** {metas.get('emp_corr', '60')}%")
        feedbacks_md.append(f"- **Liquidação Corrente:** {metas.get('liq_corr', '60')}%")
        feedbacks_md.append(f"- **Liquidação RPNP:** {metas.get('liq_rpnp', '90')}%")
        feedbacks_md.append(f"- **Data Limite:** {metas.get('data_meta', '30/04/2026')}\n")

        for s in SETORES_PADRAO:
            pc, pr = p_corr.get(s, 0.0), p_rpnp.get(s, 0.0)
            al, rv = alerts40.get(s, []), r_set.get(s, 0.0)
            hist = extrair_historico_novidades(aba_logs, s)
            ncs_setor = [nc for nc in ncs_recentes_banco if nc['setor'] == s.upper()]
            log_report_terminal_completo(s, metas, pc, pr, s_tipo, rv, c_det, hist, al, ncs_setor=ncs_setor)
            
            email_status = "PULADO (Sem contato ou não selecionado)"
            if selected.get(s) and contacts.get(s, '').strip():
                email_status = f"ENVIADO para {contacts[s].strip()}"
                if s == 'FISCALIZAÇÃO':
                    corpo = gerar_email_fiscalizacao(
                        s_tipo, rv, c_det, pc, pr, metas, hist, al,
                        novos_emp_global, ncs_recentes_banco,
                        liq_diaria, datas_liq,
                        alertas_40_todos=alertas_40_todos
                    )
                else:
                    corpo = gerar_email_setor(s, s_tipo, rv, c_det, pc, pr, metas, hist, al, ncs_setor=ncs_setor)
                send_gmail(corpo, f"Relatório SAG: {s} - {datetime.now().strftime('%d/%m')}", contacts[s])

            feedbacks_md.append(f"---")
            feedbacks_md.append(f"## Seção: {s}")
            feedbacks_md.append(f"- **Status do E-mail:** {email_status}")
            feedbacks_md.append(f"- **Projeção Corrente:** {formatar_moeda(pc)}")
            feedbacks_md.append(f"- **Projeção RPNP:** {formatar_moeda(pr)}")
            feedbacks_md.append(f"- **RPNP Total:** {formatar_moeda(rv)}")
            
            if al:
                feedbacks_md.append("\n### ⚠️ Empenhos Ordinários > 40 dias:")
                for a in al:
                    feedbacks_md.append(f"  - **NE:** {a['ne']} | **Idade:** {a['dias']} dias | **Saldo:** {formatar_moeda(a['valor'])}")
            
            if ncs_setor:
                feedbacks_md.append("\n### 💰 Novas NCs (Últimos 3 dias):")
                for nc in ncs_setor:
                    val_fmt = formatar_moeda(normalizar_numero(nc['valor']))
                    feedbacks_md.append(f"  - **NC:** {nc['nc']} | **PI:** {nc['pi']} | **ND:** {nc['nd']} | **Valor:** {val_fmt} ({nc['data']})")
                    
            if hist:
                feedbacks_md.append("\n### 🆕 Novos Empenhos:")
                for dh in hist:
                    if dh['novos_e']:
                        feedbacks_md.append(f"  - **Data {dh['data'][:5]}:**")
                        for x in dh['novos_e']:
                            feedbacks_md.append(f"    - PI: {x['pi']} | NE: {x['ne']} | Valor: {x['valor']}")
            
            if c_det.get(s):
                feedbacks_md.append("\n### 🔌 Créditos na Tela:")
                for x in c_det[s].values():
                    ncs = f"[{len(x['ncs'])}] NCs: {', '.join(x['ncs'])}"
                    prazo_txt = f" | Prazo: {x['prazo']}" if x.get("prazo") else ""
                    feedbacks_md.append(f"  - **PI:** {x['pi']} | **ND:** {x['nd']} | {ncs} | **Valor:** {formatar_moeda(x['valor'])}{prazo_txt}")
                    feedbacks_md.append(f"    - *Descrição:* {x['desc']}")
            
            if s == 'FISCALIZAÇÃO':
                feedbacks_md.append("\n### ⚖️ Informações Consolidadas (Fiscalização):")
                feedbacks_md.append(f"- Total de empenhos > 40 dias corrente: {len(alertas_40_todos.get('corrente', []))}")
                feedbacks_md.append(f"- Total de empenhos > 40 dias RPNP: {len(alertas_40_todos.get('rpnp', []))}")
                feedbacks_md.append(f"- Total de novas NCs no banco (últimos 3 dias): {len(ncs_recentes_banco)}")

        # Salvar feedbacks_enviados.md na pasta do agente
        agente_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "Agente_IEG_63BI"))
        if not os.path.exists(agente_dir):
            desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
            agente_dir = os.path.join(desktop_dir, "PROJETOS", "Agente_IEG_63BI")
        
        os.makedirs(agente_dir, exist_ok=True)
        caminho_feedbacks = os.path.join(agente_dir, "feedbacks_enviados.md")
        try:
            with open(caminho_feedbacks, "w", encoding="utf-8") as f_out:
                f_out.write("\n".join(feedbacks_md))
            log(f"Arquivo de feedbacks salvo em: {caminho_feedbacks}")
        except Exception as e_file:
            log(f"Erro ao salvar arquivo de feedbacks: {e_file}")

        log("Processo concluído.")
    except Exception as e: log(f"Erro: {e}")

if __name__ == "__main__": main()

# -*- coding: utf-8 -*-
"""
gerar_projecao.py
Gera o dashboard interativo de projeção orçamentária para o 63° BI.
Todos os dados são embutidos no HTML como JSON — o cálculo é 100% no navegador,
permitindo que o usuário altere metas e datas com atualização instantânea e animada.
"""
import sys, json, os
from datetime import datetime
from collections import defaultdict
import gspread
from google.oauth2.service_account import Credentials

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json")
SHEET_ID = "1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww"
OUTPUT_HTML  = os.path.join(BASE_DIR, "projecao.html")
CONFIG_FILE  = os.path.join(BASE_DIR, "auth", "config_notificacoes.json")

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def normalizar_numero(valor):
    """Converte valores numéricos do Sheets (string BR ou float Python) para float."""
    if valor is None or valor == '' or valor is False: return 0.0
    # Se já é número Python (vindo de UNFORMATTED_VALUE), retorna diretamente
    if isinstance(valor, (int, float)) and not isinstance(valor, bool):
        return float(valor)
    txt = str(valor).strip().replace('\xa0','').replace(' ','').replace('R$','').replace('%','')
    if not txt or txt == '-': return 0.0
    # Formato BR: ponto=milhar, vírgula=decimal → '1.234.567,89'
    if ',' in txt:
        txt = txt.replace('.', '').replace(',', '.')
    # Formato EN já com ponto decimal → '1234567.89' (sem vírgulas)
    # Não remove pontos aqui — float() lida corretamente
    try: return float(txt)
    except: return 0.0

def logs_para_float(valor):
    """Convert LOGS-stored values (BR string or number) to float."""
    if isinstance(valor, (int, float)) and not isinstance(valor, bool): return float(valor)
    if not valor: return 0.0
    txt = str(valor).strip().replace(' ', '').replace('R$', '').replace('\xa0', '')
    if ',' in txt and '.' in txt:
        txt = txt.replace('.', '').replace(',', '.')
    elif ',' in txt:
        txt = txt.replace(',', '.')
    try: return float(txt)
    except: return 0.0

def calcular_meta_vigente(data_referencia=None):
    if data_referencia is None:
        data_referencia = datetime.now()
    year = data_referencia.year
    targets = [
        (datetime(year, 4, 30, 23, 59, 59), "ABR", "50", "20", "50"),
        (datetime(year, 6, 30, 23, 59, 59), "JUN", "70", "40", "60"),
        (datetime(year, 8, 31, 23, 59, 59), "AGO", "80", "50", "70"),
        (datetime(year, 10, 31, 23, 59, 59), "OUT", "100", "65", "75"),
        (datetime(year, 12, 31, 23, 59, 59), "DEZ", "100", "75", "85"),
    ]
    for target_dt, mes, emp, liq, rpnp in targets:
        if target_dt >= data_referencia:
            return target_dt, mes, emp, liq, rpnp
    next_year = year + 1
    return datetime(next_year, 4, 30, 23, 59, 59), "ABR", "50", "20", "50"

def obter_e_atualizar_metas():
    target_dt, mes, emp, liq, rpnp = calcular_meta_vigente()
    target_date_str = target_dt.strftime('%d/%m/%Y')
    
    cfg = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
        except Exception as e:
            log(f"Erro ao ler config_notificacoes.json: {e}")
            
    metas = cfg.get('metas', {})
    saved_date = metas.get('data_meta', '')
    
    if saved_date != target_date_str:
        metas['data_meta'] = target_date_str
        metas['emp_corr'] = emp
        metas['liq_corr'] = liq
        metas['liq_rpnp'] = rpnp
        cfg['metas'] = metas
        try:
            os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(cfg, f, ensure_ascii=False, indent=4)
            log(f"Configuração de metas atualizada automaticamente para o período {mes} ({target_date_str})")
        except Exception as e:
            log(f"Erro ao salvar config_notificacoes.json: {e}")
            
    return metas

def get_sheet():
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(creds)
    return gc.open_by_key(SHEET_ID)

def extrair_previsoes_log(aba_logs):
    """
    Reads LOGS col K (Previsão) to return the latest registered forecast per NE.
    Returns {ne: {'previsao': 'SIM'/'NÃO'/'PARCIAL', 'parcial': float}}
    """
    try:
        todos = aba_logs.get_all_values()
        result = {}
        for r in todos[1:]:
            if len(r) < 8: continue
            if 'Empenho' not in r[2]: continue
            ne = r[7].strip()
            if not ne: continue
            k = r[10].strip() if len(r) > 10 else ''
            if not k: continue
            j = logs_para_float(r[9] if len(r) > 9 else '')
            dt_str = r[1].strip()
            try:
                dt = datetime.strptime(dt_str, '%d/%m/%Y')
            except:
                continue
            if ne not in result or dt >= result[ne]['_dt']:
                result[ne] = {'previsao': k, 'parcial': j, '_dt': dt}
        # Strip internal _dt field
        return {ne: {'previsao': v['previsao'], 'parcial': v['parcial']} for ne, v in result.items()}
    except Exception as e:
        log(f"Erro ao extrair previsoes do LOGS: {e}")
        return {}

def extrair_auditoria_previsoes(aba_logs, data_meta_str):
    """
    Compares actual saldo history against the forecast (col K) for each NE.
    Returns a list of audit items classified as CRITICO / ATENCAO / FEEDBACK / OK.

    Rules:
      CRITICO  : SIM + no liquidation detected at all
      ATENCAO  : SIM + partial liquidation  |  PARCIAL < 50% executed
      FEEDBACK : NÃO + liquidated something (informational — good news)
      OK       : SIM fully liquidated  |  PARCIAL >= 50% executed
    """
    try:
        todos = aba_logs.get_all_values()
        if len(todos) < 2: return []

        try:
            data_meta = datetime.strptime(data_meta_str, '%d/%m/%Y')
        except:
            data_meta = datetime(2026, 4, 30)
        dias_restantes = max(0, (data_meta - datetime.now()).days)

        # Aggregate per NE
        por_ne  = defaultdict(list)   # {ne: [(dt_obj, saldo, k_val, j_val), ...]}
        info_ne = {}                  # {ne: {setor, ug, pi, categoria}}

        for r in todos[1:]:
            if len(r) < 9: continue
            cat = r[2].strip()
            if 'Empenho' not in cat: continue
            ne = r[7].strip()
            if not ne: continue
            dt_str = r[1].strip()
            try:
                dt_obj = datetime.strptime(dt_str, '%d/%m/%Y')
            except:
                continue
            saldo    = logs_para_float(r[8])
            j_val    = logs_para_float(r[9] if len(r) > 9 else '')
            k_val    = r[10].strip() if len(r) > 10 else ''
            por_ne[ne].append((dt_obj, saldo, k_val, j_val))
            if ne not in info_ne:
                info_ne[ne] = {'setor': r[4].strip(), 'ug': r[3].strip(),
                               'pi': r[5].strip(), 'categoria': cat}

        if not por_ne: return []

        # Most recent date across all NEs
        all_dates = sorted({dt for entries in por_ne.values() for dt, *_ in entries}, reverse=True)
        data_recente = all_dates[0] if all_dates else None
        if not data_recente: return []

        def fmt(v): return f'R$ {v:,.2f}'.replace(',','X').replace('.',',').replace('X','.')

        auditoria = []
        for ne, entries in por_ne.items():
            entries_sorted = sorted(entries, key=lambda x: x[0])  # oldest → newest

            # Latest previsão (last non-empty K)
            previsao = 'NÃO'
            for _, _, k, _ in reversed(entries_sorted):
                if k:
                    previsao = k
                    break

            # Parcial inicial: first J value when K == PARCIAL
            parcial_inicial = 0.0
            for _, _, k, j in entries_sorted:
                if k == 'PARCIAL' and j > 0:
                    parcial_inicial = j
                    break

            # Current state
            latest = next(((dt, s, k, j) for dt, s, k, j in reversed(entries_sorted)
                          if dt == data_recente), None)

            saldo_atual   = latest[1] if latest else 0.0
            ne_ativo      = latest is not None
            saldo_inicial = entries_sorted[0][1]
            liquidado_acum = max(0.0, saldo_inicial - saldo_atual)
            if not ne_ativo:
                liquidado_acum = saldo_inicial  # NE disappeared = fully liquidated

            pct = (liquidado_acum / parcial_inicial * 100) if parcial_inicial > 0 else 0.0
            parc_rest = max(0.0, parcial_inicial - liquidado_acum)

            info = info_ne.get(ne, {})
            base = {
                'ne': ne,
                'setor': info.get('setor', ''),
                'ug': info.get('ug', ''),
                'pi': info.get('pi', ''),
                'categoria': info.get('categoria', ''),
                'previsao': previsao,
                'saldo_atual': saldo_atual,
                'saldo_inicial': saldo_inicial,
                'liquidado_acumulado': liquidado_acum,
                'parcial_inicial': parcial_inicial,
                'parcial_restante': parc_rest,
                'pct_executado': round(pct, 1),
                'dias_restantes': dias_restantes,
                'data_meta': data_meta_str,
                'ne_ativo': ne_ativo,
            }

            if previsao == 'SIM':
                if not ne_ativo or saldo_atual < 0.01:
                    base['status'] = 'OK'
                    base['mensagem'] = 'Liquidado conforme previsto ✓'
                elif liquidado_acum < 0.01:
                    base['status'] = 'CRITICO'
                    base['mensagem'] = (f'Status SIM mas nenhuma liquidação detectada. '
                                        f'Saldo pendente: {fmt(saldo_atual)}. '
                                        f'Faltam {dias_restantes} dia(s) para a meta.')
                else:
                    base['status'] = 'ATENCAO'
                    base['mensagem'] = (f'Liquidou {fmt(liquidado_acum)} mas ainda falta '
                                        f'{fmt(saldo_atual)} para zerar. Faltam {dias_restantes} dia(s).')
                auditoria.append(base)

            elif previsao == 'PARCIAL':
                if parcial_inicial <= 0.01: continue
                if parc_rest < 0.01:
                    base['status'] = 'OK'
                    base['mensagem'] = f'Parcial de {fmt(parcial_inicial)} concluído ✓'
                elif pct >= 50:
                    base['status'] = 'OK'
                    base['mensagem'] = (f'Em ritmo adequado: {pct:.1f}% executado '
                                        f'({fmt(liquidado_acum)} de {fmt(parcial_inicial)}).')
                else:
                    base['status'] = 'ATENCAO'
                    base['mensagem'] = (f'{pct:.1f}% do parcial executado. '
                                        f'Falta ainda {fmt(parc_rest)} de {fmt(parcial_inicial)}.')
                auditoria.append(base)

            elif previsao == 'NÃO':
                if liquidado_acum > 0.01:
                    base['status'] = 'FEEDBACK'
                    base['mensagem'] = (f'Liquidou {fmt(liquidado_acum)} mesmo com status NÃO '
                                        f'— excelente execução!')
                    auditoria.append(base)
                # else: NÃO + sem liquidação → skip

        ordem = {'CRITICO': 0, 'ATENCAO': 1, 'FEEDBACK': 2, 'OK': 3}
        auditoria.sort(key=lambda x: (ordem.get(x.get('status', 'OK'), 3), -x.get('saldo_atual', 0)))
        return auditoria

    except Exception as e:
        log(f"Erro em extrair_auditoria_previsoes: {e}")
        import traceback; traceback.print_exc()
        return []

def extrair_linhas_controle(aba, previsoes_log=None):
    """
    Extracts empenho lines from a control sheet.
    If previsoes_log is provided, overrides 'previsao' and 'parcial' fields
    with the authoritative values from LOGS col K/J (most recent entry per NE).
    """
    previsoes_log = previsoes_log or {}
    dados = aba.get_values('A3:S', value_render_option='UNFORMATTED_VALUE')
    linhas = []
    for r in dados:
        pad = r + [None] * max(0, 19 - len(r))

        # ── Bloco 160443 ──
        setor160 = str(pad[5]).strip() if pad[5] else ''
        if setor160:
            ne      = str(pad[1]).strip()
            emp     = normalizar_numero(pad[4])
            data_h  = pad[7]
            dias_h  = int(pad[3]) if pad[3] and str(pad[3]).isdigit() else 0
            parcial = normalizar_numero(pad[8])
            # Override from LOGS if available (authoritative source)
            log_info    = previsoes_log.get(ne, {})
            prev_final  = log_info.get('previsao', str(data_h or '').strip())
            parc_final  = log_info['parcial'] if 'parcial' in log_info else parcial
            linhas.append({
                'bloco':    '160443',
                'pi':       str(pad[0]).strip(),
                'ne':       ne,
                'tipo':     str(pad[2]).strip(),
                'dias':     dias_h,
                'setor':    setor160,
                'emp':      emp,
                'data':     data_h,
                'parcial':  parc_final,
                'situacao': str(pad[6]).strip() if pad[6] else '',
                'previsao': prev_final
            })

        # ── Bloco 167443 ──
        setor167 = str(pad[15]).strip() if pad[15] else ''
        if setor167:
            ne      = str(pad[11]).strip()
            emp     = normalizar_numero(pad[14])
            data_r  = pad[17]
            dias_r  = int(pad[13]) if pad[13] and str(pad[13]).isdigit() else 0
            parcial = normalizar_numero(pad[18])
            log_info    = previsoes_log.get(ne, {})
            prev_final  = log_info.get('previsao', str(data_r or '').strip())
            parc_final  = log_info['parcial'] if 'parcial' in log_info else parcial
            linhas.append({
                'bloco':    '167443',
                'pi':       str(pad[10]).strip(),
                'ne':       ne,
                'tipo':     str(pad[12]).strip(),
                'dias':     dias_r,
                'setor':    setor167,
                'emp':      emp,
                'data':     data_r,
                'parcial':  parc_final,
                'situacao': str(pad[16]).strip() if pad[16] else '',
                'previsao': prev_final
            })
    return linhas


def extrair_creditos(aba):
    """
    Extrai créditos disponíveis por setor da aba 'Créditos na tela'.
    Estrutura real confirmada por diagnóstico:
      Col A (idx 0): Setor UG 160443 (em cada linha, sem mesclagem efetiva)
      Col D (idx 3): Valor do crédito 160443 em centenas de reais (× 100)
      Col O (idx 14): Setor UG 167443
      Col R (idx 17): Valor do crédito 167443 em centenas de reais (× 100)
    """
    dados = aba.get_values('A3:AA', value_render_option='UNFORMATTED_VALUE')
    mapa = {}

    setor160_atual = None
    setor167_atual = None

    for r in dados:
        pad = r + [None] * max(0, 27 - len(r))

        # 160443
        s160 = str(pad[0]).strip() if pad[0] else ''
        if s160:
            setor160_atual = s160

        if setor160_atual:
            v = normalizar_numero(pad[3])  # reais diretos
            if v > 0:
                if setor160_atual not in mapa:
                    mapa[setor160_atual] = {'c160': 0.0, 'c167': 0.0}
                mapa[setor160_atual]['c160'] += v

        # 167443
        s167 = str(pad[14]).strip() if pad[14] else ''
        if s167:
            setor167_atual = s167

        if setor167_atual:
            v = normalizar_numero(pad[17])  # reais diretos
            if v > 0:
                if setor167_atual not in mapa:
                    mapa[setor167_atual] = {'c160': 0.0, 'c167': 0.0}
                mapa[setor167_atual]['c167'] += v

    return mapa

def extrair_banco(aba):
    """
    Lê panorama geral da UGE da aba BANCO.
    Usa UNFORMATTED_VALUE para receber números Python puros, evitando
    ambiguidades de formatação BR vs EN que corrompiam os valores.
    """
    def parse_ug(v):
        """Extrai os 6 dígitos da UG de forma robusta."""
        if v is None or v == '': return ''
        if isinstance(v, (int, float)): return str(int(v))
        digits = ''.join(c for c in str(v) if c.isdigit())
        return digits[:6] if len(digits) >= 6 else ''

    def gn(row, idx):
        """Get number: lê índice da linha e normaliza."""
        if idx >= len(row): return 0.0
        return normalizar_numero(row[idx])

    # ── Exercício Corrente: AD3:AM4 (10 colunas) ──
    try:
        corrente_raw = aba.get_values("AD3:AM4", value_render_option='UNFORMATTED_VALUE')
    except Exception:
        corrente_raw = aba.get_values("AD3:AM4")

    banco_corr = {}
    for r in corrente_raw:
        ug = parse_ug(r[0] if r else '')
        if not ug: continue
        disponivel = gn(r, 3)   # AG - DISPONÍVEL
        a_liq     = gn(r, 4)   # AH - A LIQUIDAR
        em_liq    = gn(r, 5)   # AI - EM LIQUIDAÇÃO
        liq_pag   = gn(r, 6)   # AJ - LIQ A PAGAR
        pago      = gn(r, 7)   # AK - PAGO
        log(f"  BANCO corrente {ug}: disp={disponivel:,.2f} aLiq={a_liq:,.2f} emLiq={em_liq:,.2f} liqPag={liq_pag:,.2f} pago={pago:,.2f}")
        banco_corr[ug] = {
            'base':      disponivel + a_liq + em_liq + liq_pag + pago,
            'empenhado': a_liq + em_liq + liq_pag + pago,
            'liquidado': em_liq + liq_pag + pago,
        }

    # ── RPNP: AD8:AS9 (16 colunas) ──
    try:
        rpnp_raw = aba.get_values("AD8:AS9", value_render_option='UNFORMATTED_VALUE')
    except Exception:
        rpnp_raw = aba.get_values("AD8:AS9")

    banco_rpnp = {}
    for r in rpnp_raw:
        ug = parse_ug(r[0] if r else '')
        if not ug: continue
        base    = gn(r, 3)   # AG - INSC ALIQ
        liq_pag = gn(r, 11)  # AO - LIQ A PAGAR
        pago    = gn(r, 12)  # AP - PAGO
        log(f"  BANCO RPNP {ug}: base={base:,.2f} liqPag={liq_pag:,.2f} pago={pago:,.2f}")
        banco_rpnp[ug] = {
            'base':      base,
            'liquidado': liq_pag + pago,
        }

    return banco_corr, banco_rpnp

def extrair_historico_global(aba_logs, dias=7):
    """Calcula o valor total liquidado por dia no batalhão."""
    try:
        data_log = aba_logs.get_all_values()
        if len(data_log) < 2: return []
        
        datas_unicas = sorted(
            list(set(r[1] for r in data_log[1:] if len(r) > 1 and r[1])),
            key=lambda x: datetime.strptime(x, "%d/%m/%Y") if x.count('/') == 2 else datetime.min,
            reverse=True
        )[:dias + 1]
        
        if len(datas_unicas) < 2: return []
        
        mapa = defaultdict(lambda: defaultdict(dict))
        for r in data_log[1:]:
            if len(r) <= 8: continue
            dt, setor, ne, val = r[1], r[4].strip().upper(), r[7].strip(), r[8]
            if dt not in datas_unicas or not ne: continue
            mapa[dt][setor][ne] = normalizar_numero(val)
            
        liq_total_dia = []
        for i in range(len(datas_unicas) - 1):
            dia_recente = datas_unicas[i]
            dia_anterior = datas_unicas[i+1]
            todos_setores = set(list(mapa[dia_recente].keys()) + list(mapa[dia_anterior].keys()))
            total_dia = 0.0
            
            for setor in todos_setores:
                nes_rec = mapa[dia_recente][setor]
                nes_ant = mapa[dia_anterior][setor]
                for ne, val_ant in nes_ant.items():
                    val_rec = nes_rec.get(ne)
                    if val_rec is None:
                        total_dia += val_ant
                    elif val_rec < val_ant - 0.005:
                        total_dia += val_ant - val_rec
            
            liq_total_dia.append({'data': dia_recente, 'valor': total_dia})
            
        return liq_total_dia
    except Exception as e:
        log(f"Erro no historico: {e}")
        return []

def calcular_alertas_40(linhas):
    """
    Filtra empenhos ordinários com mais de 40 dias e saldo > 0.
    Retorna lista ordenada por dias (maior primeiro).
    """
    resultado = []
    for r in linhas:
        tipo = str(r.get('tipo', '')).upper()
        # Normalizar acentos para comparação segura
        tipo_norm = tipo.replace('Á','A').replace('Ã','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U')
        dias = int(r.get('dias', 0))
        emp  = float(r.get('emp', 0))
        if 'ORDINARIO' in tipo_norm and dias > 40 and emp > 0:
            resultado.append({
                'ne':    r.get('ne', ''),
                'pi':    r.get('pi', ''),
                'setor': r.get('setor', ''),
                'bloco': r.get('bloco', ''),
                'tipo':  r.get('tipo', ''),
                'dias':  dias,
                'emp':   emp,
            })
    return sorted(resultado, key=lambda x: x['dias'], reverse=True)


def main():
    log("=== Gerador de Projeção Orçamentária — 63BI ===")
    try:
        sheet     = get_sheet()
        aba_logs  = sheet.worksheet("LOGS")
        metas = obter_e_atualizar_metas()
        data_meta = metas.get('data_meta', '30/04/2026')

        log("Lendo previsões das LOGS (fonte autoritativa)...")
        previsoes_log = extrair_previsoes_log(aba_logs)
        log(f"  {len(previsoes_log)} NEs com previsão registrada nas LOGS")

        log("Lendo Controle EMP 26 (Corrente)...")
        corrente = extrair_linhas_controle(sheet.worksheet("Controle EMP 26"), previsoes_log)
        log(f"  {len(corrente)} linhas encontradas")

        log("Lendo Controle EMP RPNP...")
        rpnp = extrair_linhas_controle(sheet.worksheet("Controle EMP RPNP"), previsoes_log)
        log(f"  {len(rpnp)} linhas encontradas")

        log("Lendo Créditos na tela...")
        creditos = extrair_creditos(sheet.worksheet("Créditos na tela"))
        log(f"  {len(creditos)} setores com crédito")

        log("Lendo BANCO (panorama UGE)...")
        banco_corr, banco_rpnp = extrair_banco(sheet.worksheet("BANCO"))

        log("Lendo logs de histórico de liquidação...")
        hist_global = extrair_historico_global(aba_logs, dias=10)

        log("Calculando auditoria de previsões...")
        auditoria = extrair_auditoria_previsoes(aba_logs, data_meta)
        log(f"  {len(auditoria)} itens de auditoria gerados")

        log("Calculando empenhos ordinários > 40 dias...")
        alertas_40_corr = calcular_alertas_40(corrente)
        alertas_40_rpnp = calcular_alertas_40(rpnp)
        log(f"  Corrente: {len(alertas_40_corr)} | RPNP: {len(alertas_40_rpnp)}")

        log("Lendo histórico local de mudanças de previsão...")
        mudancas = []
        path_mudancas = os.path.join(BASE_DIR, "snapshots", "mudancas_previsao.json")
        if os.path.exists(path_mudancas):
            try:
                with open(path_mudancas, 'r', encoding='utf-8') as f:
                    mudancas = json.load(f)
            except Exception as e:
                log(f" Erro ao ler mudanças locais: {e}")

        payload = {
            'corrente':   corrente,
            'rpnp':       rpnp,
            'creditos':   creditos,
            'banco':      {'corrente': banco_corr, 'rpnp': banco_rpnp},
            'historico':  hist_global,
            'auditoria':  auditoria,
            'mudancas':   mudancas,
            'alertas_40': {'corrente': alertas_40_corr, 'rpnp': alertas_40_rpnp},
            'data_meta':  data_meta,
            'metas':      metas,
            'gerado_em':  datetime.now().strftime('%d/%m/%Y às %H:%M:%S')
        }

        log("Gerando HTML...")
        html = gerar_html(payload)

        with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
            f.write(html)

        log(f"Dashboard gerado: {OUTPUT_HTML}")
    except Exception as e:
        log(f"ERRO: {e}")
        raise

def gerar_html(data):
    import os
    import base64
    data_json = json.dumps(data, ensure_ascii=False, default=str)
    gerado_em = data.get('gerado_em', '')
    
    logo_path = os.path.join(BASE_DIR, "assets", "logo.png")
    img_tag = ""
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
            img_tag = f'<img src="data:image/png;base64,{img_b64}" alt="Logo" class="header-logo">'

    template_path = os.path.join(BASE_DIR, "template_projecao.html")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template HTML não encontrado em {template_path}")
        
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    html = html.replace('{data_json}', data_json)
    html = html.replace('{img_tag}', img_tag)
    html = html.replace('{gerado_em}', gerado_em)
    
    return html

if __name__ == "__main__":
    main()


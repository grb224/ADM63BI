# -*- coding: utf-8 -*-
import sys
import time
from datetime import datetime
from collections import defaultdict
import gspread
from google.oauth2.service_account import Credentials

import os
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json")
SHEET_ID = "1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww"

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}")

def get_sheet():
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(creds)
    return gc.open_by_key(SHEET_ID)

def normalizar_numero(valor):
    """Returns BR-formatted string for storage in LOGS (e.g. '1234,56')."""
    if not valor: return ""
    txt = str(valor).replace('\xa0', '').replace(' ', '').replace('R$', '').replace('.', '').replace(',', '.')
    try:
        f = float(txt)
        return str(f).replace('.', ',')
    except:
        return valor

def para_float(valor):
    """Converts any numeric representation (BR string, int, float) to float."""
    if isinstance(valor, (int, float)): return float(valor)
    if not valor: return 0.0
    txt = str(valor).replace('\xa0', '').replace(' ', '').replace('R$', '')
    if ',' in txt and '.' in txt:
        # BR format with thousands: "1.234,56"
        txt = txt.replace('.', '').replace(',', '.')
    elif ',' in txt:
        # BR decimal-only: "1234,56"
        txt = txt.replace(',', '.')
    try:
        return float(txt)
    except:
        return 0.0

def normalizar_previsao_status(previsao_raw, parcial_raw=""):
    """Normalizes col H/R value to canonical SIM / NÃO / PARCIAL."""
    v = str(previsao_raw).strip().upper()
    # Normalize accents
    v = v.replace('Ã', 'A').replace('À', 'A').replace('Â', 'A')
    if v == 'SIM':     return 'SIM'
    if v in ('NAO', 'NÃO', 'NÃO'): return 'NÃO'
    if v == 'PARCIAL': return 'PARCIAL'
    # Infer PARCIAL from a non-zero parcial value (backward-compat with date-based system)
    if parcial_raw and para_float(parcial_raw) > 0:
        return 'PARCIAL'
    return 'NÃO'

def preparar_aba_logs(planilha):
    """Opens or creates the LOGS tab, ensuring col K (Previsão) header exists."""
    try:
        aba = planilha.worksheet("LOGS")
        header = aba.row_values(1)
        if len(header) < 11 or not header[10].strip():
            log("  Adicionando cabeçalho col K (Previsão) nas LOGS...")
            aba.update_acell('K1', 'Previsão')
            aba.format('K1', {"textFormat": {"bold": True},
                               "backgroundColor": {"red": 0.8, "green": 0.8, "blue": 0.8}})
    except gspread.exceptions.WorksheetNotFound:
        log("  Aba LOGS não encontrada. Criando...")
        aba = planilha.add_worksheet(title="LOGS", rows="10000", cols="11")
        cab = ["Timestamp", "Data", "Categoria", "UG", "Responsável", "PI", "ND",
               "NE", "Valor Principal", "Valor Previsão", "Previsão"]
        aba.update(values=[cab], range_name="A1", value_input_option="USER_ENTERED")
        aba.format("A1:K1", {"textFormat": {"bold": True},
                              "backgroundColor": {"red": 0.8, "green": 0.8, "blue": 0.8}})
    return aba

def extract_controles(planilha, aba_nome, categoria, timestamp, data_hoje):
    """
    Reads EMP control tabs and returns:
      - linhas_log   : 11-column rows ready to be appended to LOGS (incl. col K = previsao)
      - sheet_infos  : dicts with sheet row index + previsao/parcial/saldo for write-back
    """
    linhas_extraidas = []
    sheet_infos = []
    try:
        aba = planilha.worksheet(aba_nome)
        dados = aba.get_values("A3:S")

        for idx, row in enumerate(dados):
            sheet_row = idx + 3  # 1-indexed Google Sheet row

            # ── Bloco 160443 (cols A–I) ──
            if len(row) > 5 and row[5].strip():
                pi           = row[0].strip()
                ne           = row[1].strip()
                saldo        = row[4].strip()               # Col E
                resp         = row[5].strip()               # Col F
                previsao_raw = row[7].strip() if len(row) > 7 else ""   # Col H
                parcial_raw  = row[8].strip() if len(row) > 8 else ""   # Col I

                prev_status = normalizar_previsao_status(previsao_raw, parcial_raw)
                parcial_num = para_float(parcial_raw)
                saldo_num   = para_float(saldo.replace('.', '').replace(',', '.') if ',' in saldo else saldo)

                if saldo and saldo not in ("0", "0,00", "R$ 0,00"):
                    linhas_extraidas.append([
                        timestamp, data_hoje, categoria, "160443",
                        resp, pi, "", ne,
                        normalizar_numero(saldo),      # col I LOGS: Valor Principal
                        normalizar_numero(parcial_raw),# col J LOGS: Valor Previsão (parcial)
                        prev_status                    # col K LOGS: SIM/NÃO/PARCIAL
                    ])
                    sheet_infos.append({
                        'ne': ne, 'ug': '160443', 'bloco': '160443',
                        'pi': pi, 'resp': resp,
                        'aba_nome': aba_nome, 'sheet_row': sheet_row,
                        'previsao': prev_status,
                        'parcial': parcial_num,
                        'saldo_atual': saldo_num,
                        'col_prev': 8,    # Col H (1-indexed) = previsão
                        'col_parcial': 9, # Col I (1-indexed) = parcial
                    })

            # ── Bloco 167443 (cols K–S) ──
            if len(row) > 15 and row[15].strip():
                pi           = row[10].strip()
                ne           = row[11].strip()
                saldo        = row[14].strip()               # Col O
                resp         = row[15].strip()               # Col P
                previsao_raw = row[17].strip() if len(row) > 17 else ""  # Col R
                parcial_raw  = row[18].strip() if len(row) > 18 else ""  # Col S

                prev_status = normalizar_previsao_status(previsao_raw, parcial_raw)
                parcial_num = para_float(parcial_raw)
                saldo_num   = para_float(saldo.replace('.', '').replace(',', '.') if ',' in saldo else saldo)

                if saldo and saldo not in ("0", "0,00", "R$ 0,00"):
                    linhas_extraidas.append([
                        timestamp, data_hoje, categoria, "167443",
                        resp, pi, "", ne,
                        normalizar_numero(saldo),
                        normalizar_numero(parcial_raw),
                        prev_status
                    ])
                    sheet_infos.append({
                        'ne': ne, 'ug': '167443', 'bloco': '167443',
                        'pi': pi, 'resp': resp,
                        'aba_nome': aba_nome, 'sheet_row': sheet_row,
                        'previsao': prev_status,
                        'parcial': parcial_num,
                        'saldo_atual': saldo_num,
                        'col_prev': 18,    # Col R (1-indexed) = previsão
                        'col_parcial': 19, # Col S (1-indexed) = parcial
                    })

    except Exception as e:
        log(f"  Erro ao ler {aba_nome}: {e}")

    return linhas_extraidas, sheet_infos

def extract_creditos(planilha, timestamp, data_hoje):
    """Returns 11-column log rows for credits (col K is empty — no SIM/NÃO for credits)."""
    linhas_extraidas = []
    try:
        aba = planilha.worksheet("Créditos na tela")
        dados = aba.get_values("A3:AA")

        for row in dados:
            # 160443
            if len(row) > 3:
                setor = row[0].strip()
                pi    = row[1].strip()
                saldo = row[3].strip()   # Col D
                nd    = row[10].strip() if len(row) > 10 else ""
                if pi and saldo and saldo not in ("0", "0,00", "R$ 0,00"):
                    linhas_extraidas.append([
                        timestamp, data_hoje, "Crédito Disponível", "160443",
                        setor, pi, nd, "", normalizar_numero(saldo), "", ""
                    ])

            # 167443
            if len(row) > 17:
                setor = row[14].strip()
                pi    = row[15].strip()
                saldo = row[17].strip()  # Col R
                nd    = row[24].strip() if len(row) > 24 else ""
                if pi and saldo and saldo not in ("0", "0,00", "R$ 0,00"):
                    linhas_extraidas.append([
                        timestamp, data_hoje, "Crédito Disponível", "167443",
                        setor, pi, nd, "", normalizar_numero(saldo), "", ""
                    ])
    except Exception as e:
        log(f"  Erro ao ler Créditos na Tela: {e}")

    return linhas_extraidas

def bootstrap_coluna_k(aba_logs, previsao_por_ne, data_hoje_str):
    """
    First-run: fills col K for ALL historical LOGS rows that are missing it.
    Uses today's previsão status for each NE as the backfill value.
    """
    try:
        todos = aba_logs.get_all_values()
        if len(todos) < 2:
            return

        updates = []
        for i, r in enumerate(todos[1:], start=2):  # i = 1-indexed sheet row
            if len(r) < 8: continue
            cat = r[2].strip() if len(r) > 2 else ''
            if 'Empenho' not in cat: continue

            ne = r[7].strip() if len(r) > 7 else ''
            if not ne: continue

            data_linha = r[1].strip() if len(r) > 1 else ''
            if data_linha == data_hoje_str: continue  # today already has K written

            k_val = r[10].strip() if len(r) > 10 else ''
            if k_val: continue  # already filled

            previsao = previsao_por_ne.get(ne)
            if previsao:
                updates.append({'range': f'K{i}', 'values': [[previsao]]})

        if not updates:
            log("  [Bootstrap] Col K já preenchida em todos os registros anteriores.")
            return

        log(f"  [Bootstrap] Preenchendo col K em {len(updates)} linhas de dias anteriores...")
        chunk = 500
        for start in range(0, len(updates), chunk):
            aba_logs.batch_update(updates[start:start + chunk])
            if start + chunk < len(updates):
                time.sleep(1.2)
        log("  [Bootstrap] Col K preenchida com sucesso.")

    except Exception as e:
        log(f"  [Bootstrap] Erro: {e}")

def calcular_e_aplicar_abatimento(planilha, aba_logs, sheet_infos, data_hoje_str):
    """
    For each PARCIAL NE in today's run:
      1. Finds yesterday's saldo in LOGS
      2. Computes liquidado_hoje = max(0, saldo_ontem - saldo_hoje)
      3. Decrements col I/S in the control sheet by that amount
      4. If remaining parcial <= 0: zeroes col I/S and changes col H/R to NÃO
    """
    parciais = [x for x in sheet_infos if x['previsao'] == 'PARCIAL']
    if not parciais:
        log("  [Abatimento] Nenhum NE com status PARCIAL nesta execução.")
        return

    log(f"  [Abatimento] Verificando {len(parciais)} NE(s) PARCIAL...")

    todos_logs = aba_logs.get_all_values()
    if len(todos_logs) < 2:
        log("  [Abatimento] LOGS vazia. Pulando.")
        return

    # Find most-recent previous date (not today)
    datas_ant = sorted(
        {r[1].strip() for r in todos_logs[1:]
         if len(r) > 1 and r[1].strip() and r[1].strip() != data_hoje_str},
        key=lambda d: datetime.strptime(d, '%d/%m/%Y') if d.count('/') == 2 else datetime.min,
        reverse=True
    )
    data_anterior = datas_ant[0] if datas_ant else None

    if not data_anterior:
        log("  [Abatimento] Sem dia anterior nas LOGS. Pulando.")
        return

    log(f"  [Abatimento] Comparando com dia anterior: {data_anterior}")

    # Map {ne: saldo_ontem} for previous day's empenho rows
    saldo_ontem_map = {}
    for r in todos_logs[1:]:
        if len(r) < 9: continue
        if r[1].strip() != data_anterior: continue
        if 'Empenho' not in r[2]: continue
        ne = r[7].strip()
        if ne:
            saldo_ontem_map[ne] = para_float(r[8])

    # Cache worksheet objects to avoid redundant API calls
    abas_cache = {}

    for info in parciais:
        ne            = info['ne']
        saldo_hoje    = info['saldo_atual']
        parcial_atual = info['parcial']

        if ne not in saldo_ontem_map:
            log(f"    NE {ne}: sem dado de ontem na LOGS. Pulando.")
            continue

        saldo_ontem   = saldo_ontem_map[ne]
        liquidado_hoje = max(0.0, saldo_ontem - saldo_hoje)

        if liquidado_hoje < 0.01:
            log(f"    NE {ne}: sem liquidação detectada hoje (saldo={saldo_hoje:.2f}).")
            continue

        novo_parcial = max(0.0, parcial_atual - liquidado_hoje)
        log(f"    NE {ne}: liquidado hoje={liquidado_hoje:.2f} | parcial {parcial_atual:.2f} → {novo_parcial:.2f}")

        aba_nome = info['aba_nome']
        if aba_nome not in abas_cache:
            abas_cache[aba_nome] = planilha.worksheet(aba_nome)
        aba_ctrl = abas_cache[aba_nome]

        row_idx     = info['sheet_row']
        col_prev    = info['col_prev']
        col_parcial = info['col_parcial']

        if novo_parcial < 0.01:
            # Parcial totalmente consumido → zerar e mudar para NÃO
            aba_ctrl.update_cell(row_idx, col_parcial, '')
            time.sleep(0.7)
            aba_ctrl.update_cell(row_idx, col_prev, 'NÃO')
            time.sleep(0.7)
            log(f"    NE {ne}: PARCIAL CONCLUÍDO → previsão: NÃO | parcial: zerado.")
        else:
            # Atualizar valor restante
            fmt = f'{novo_parcial:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
            aba_ctrl.update_cell(row_idx, col_parcial, fmt)
            time.sleep(0.7)
            log(f"    NE {ne}: parcial atualizado → {fmt}.")


def main():
    inicio = datetime.now()
    timestamp  = inicio.strftime("%d/%m/%Y %H:%M:%S")
    data_hoje  = inicio.strftime("%d/%m/%Y")

    print("=" * 60)
    print("  Atualizacao de Registros (LOGS)")
    print(f"  {timestamp}")
    print("=" * 60)

    planilha = get_sheet()
    aba_logs = preparar_aba_logs(planilha)

    # 1. Descobrir posição de escrita
    log("  Avaliando histórico de LOGS existente...")
    todas_datas = aba_logs.col_values(2)

    primeira_linha_hoje = -1
    for idx, dt in enumerate(todas_datas):
        if dt.strip() == data_hoje:
            primeira_linha_hoje = idx + 1
            break

    # 2. Coletar dados de hoje
    log("  Extraindo fotografia do Controle EMP 26...")
    linhas_emp26, infos_emp26 = extract_controles(
        planilha, "Controle EMP 26", "Empenho Corrente", timestamp, data_hoje)

    log("  Extraindo fotografia do Controle EMP RPNP...")
    linhas_rpnp, infos_rpnp = extract_controles(
        planilha, "Controle EMP RPNP", "Empenho RPNP", timestamp, data_hoje)

    log("  Extraindo fotografia dos Créditos...")
    linhas_creditos = extract_creditos(planilha, timestamp, data_hoje)

    all_sheet_infos = infos_emp26 + infos_rpnp
    previsao_por_ne = {info['ne']: info['previsao'] for info in all_sheet_infos}

    # Créditos já têm 11 colunas (col K vazia), empenhos também
    dump_total = linhas_creditos + linhas_emp26 + linhas_rpnp

    if not dump_total:
        log("  Nenhum dado ativo encontrado para registrar. Fim.")
        return

    log(f"  Montante de LOGS coletados hoje: {len(dump_total)} linhas")

    # 3. Sobrescrever dados de hoje
    if primeira_linha_hoje != -1:
        log(f"  Apagando execuções antigas do dia {data_hoje} (linha {primeira_linha_hoje})...")
        aba_logs.batch_clear([f"A{primeira_linha_hoje}:K"])
        alvo_escrita = primeira_linha_hoje
    else:
        alvo_escrita = len(todas_datas) + 1
        if alvo_escrita == 1:
            cab = ["Timestamp", "Data", "Categoria", "UG", "Responsável", "PI", "ND",
                   "NE", "Valor Principal", "Valor Previsão", "Previsão"]
            aba_logs.update(values=[cab], range_name="A1", value_input_option="USER_ENTERED")
            aba_logs.format("A1:K1", {"textFormat": {"bold": True},
                                       "backgroundColor": {"red": 0.8, "green": 0.8, "blue": 0.8}})
            alvo_escrita = 2

    # 4. Expandir grade se necessário
    total_linhas = alvo_escrita + len(dump_total)
    try:
        grid_atual = aba_logs.row_count
    except:
        grid_atual = 1000
    if total_linhas > grid_atual:
        excedente = total_linhas - grid_atual + 100
        log(f"  Expandindo grade + {excedente} linhas...")
        aba_logs.add_rows(excedente)

    # 5. Escrever LOGS (11 colunas A:K)
    log(f"  Escrevendo {len(dump_total)} logs na linha {alvo_escrita}...")
    aba_logs.update(values=dump_total, range_name=f"A{alvo_escrita}",
                    value_input_option="USER_ENTERED")

    # Formatter cols I e J como moeda
    aba_logs.format(f"I{alvo_escrita}:J{alvo_escrita+len(dump_total)}",
                    {"numberFormat": {"type": "NUMBER", "pattern": "\"R$\" #,##0.00"}})

    # 6. Bootstrap col K para dias anteriores (primeira execução)
    log("  Realizando bootstrap da col K nas LOGS anteriores...")
    bootstrap_coluna_k(aba_logs, previsao_por_ne, data_hoje)

    # 7. Abatimento de parciais
    log("  Verificando abatimento de parciais...")
    calcular_e_aplicar_abatimento(planilha, aba_logs, all_sheet_infos, data_hoje)

    duracao = (datetime.now() - inicio).seconds
    print("=" * 60)
    print(f"  Concluido em {duracao}s | {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()

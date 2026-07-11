# -*- coding: utf-8 -*-
import sys
import re
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
  "C1ENCONDETM":"ALMOX",
  "C1ENCONESPC":"ALMOX",
  "ESTRESCMS":"ALMOX", "00ESTRESCMS":"ALMOX", "FAOPPRESICO":"ALMOX", "D8SAMNTVTRA":"Saúde",
  "D7PESMIAPSE":"ALMOX"
}

ORDEM_SETORES = [
  "Aprovisionamento", "ALMOX", "Fiscalização", "PMT", "S3",
  "SFPC", "HT", "NPOR", "Saúde", "Of Cmb Inc", "NÃO MAPEADO"
]

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}")

def normalizar_numero(valor):
    if isinstance(valor, (int, float)): return valor
    if not valor: return 0.0
    txt = str(valor).replace('\xa0', '').replace(' ', '').replace('R$', '').replace('.', '').replace(',', '.')
    try:
        return float(txt)
    except:
        return 0.0

def get_sheet():
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    gc = gspread.authorize(creds)
    return gc.open_by_key(SHEET_ID), gc

def ler_ncs_banco(aba_banco):
    """
    Lê a seção 'NOTAS DE CREDITOS DETALHADAS' do BANCO (colunas U:AB = indices 0..7).
    Retorna dicionário indexado por (UG, PI, ND) -> lista de NCs:
      cada NC: {nc, ptres, nd, emissao, obs, valor_nc}
    Mapeamento (0-based dentro do range U:AB):
      0=UG, 1=EMISSÃO, 2=PTRES, 3=ND, 4=OBS, 5=NMR NC, 6=PI, 7=VALOR
    """
    dados = aba_banco.get_values('U3:AB2000')
    mapa = defaultdict(list)
    for r in dados:
        if len(r) < 8:
            continue
        ug    = r[0].strip()
        emiss = r[1].strip()
        ptres = r[2].strip()
        nd    = r[3].strip()
        obs   = r[4].strip()
        nc_raw = r[5].strip()
        pi    = r[6].strip()
        valor_nc = r[7].strip()
        # Extrair número da NC (padrão 20XXNCxxxxxx)
        m = re.search(r'20\d{2}NC\d{6}', nc_raw.upper())
        if not m or not pi:
            continue
        nc = m.group(0)
        chave = (ug, pi, nd)
        mapa[chave].append({
            'nc': nc,
            'ptres': ptres,
            'nd': nd,
            'emissao': emiss,
            'obs': obs,
            'valor_nc': valor_nc,
        })
    log(f"  [NCs] {sum(len(v) for v in mapa.values())} NCs carregadas de {len(mapa)} chaves (UG,PI,ND)")
    return mapa

def ler_grupos_usuario(aba, intervalo, pad_width=13):
    """
    Agrupa as linhas do usuário observando se a coluna B (PI) tem valor.
    Se estiver em branco, deduz que é célula mesclada pertencente ao PI logo acima.
    """
    dados = aba.get_values(intervalo)
    grupos = []
    current_group = []
    
    for row in dados:
        # Preenche com colunas vazias se precisar
        linha = row + [""] * (pad_width - len(row))
        linha = linha[:pad_width]
        
        pi = linha[1].strip()
        
        if pi:
            if current_group:
                grupos.append(current_group)
            current_group = [linha]
        else:
            # Tem algum conteúdo na linha? (evita adicionar blocos 100% vazios ao fantasma do topo)
            has_content = any(c.strip() for c in linha)
            if current_group and has_content:
                current_group.append(linha)
            elif not current_group and has_content:
                # Linha órfã, cria grupo fantasma
                current_group = [linha]
                
    if current_group:
        grupos.append(current_group)
        
    # Mapeia por PI + ND (para o match nunca apagar por variação de saldo)
    mapa = {}
    for g in grupos:
        pi = g[0][1].strip()
        nd = g[0][10].strip()
        chave = f"{pi}|||{nd}"
        if chave not in mapa:
            mapa[chave] = []
        mapa[chave].append(g)
        
    return mapa

def aplicar_formatacao_lote(planilha, sheet_id_da_aba, offset_start_row, offset_start_col, spans, merge_offsets, color_list):
    """Cria merges e aplica cores de fundo baseadas em prazos numa única chamada de API."""
    requests = []
    
    cursor = offset_start_row
    for idx, span in enumerate(spans):
        # 1. Merges
        if span > 1:
            for off in merge_offsets:
                col_index = offset_start_col + off
                req = {
                    "mergeCells": {
                        "range": {
                            "sheetId": sheet_id_da_aba,
                            "startRowIndex": cursor,
                            "endRowIndex": cursor + span,
                            "startColumnIndex": col_index,
                            "endColumnIndex": col_index + 1
                        },
                        "mergeType": "MERGE_COLUMNS"
                    }
                }
                requests.append(req)
        
        # 2. Cores — só aplica se houver cor definida (linhas com conteúdo e prazo)
        #    Se cor for None (sem prazo ou linha vazia) → limpa o fundo para o padrão da planilha
        cor = color_list[idx] if len(color_list) > idx else None
        if cor is not None:
            # Linha com prazo/cor → pintar
            req_color = {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id_da_aba,
                        "startRowIndex": cursor,
                        "endRowIndex": cursor + span,
                        "startColumnIndex": offset_start_col,
                        "endColumnIndex": offset_start_col + 13
                    },
                    "cell": {"userEnteredFormat": {"backgroundColor": cor}},
                    "fields": "userEnteredFormat.backgroundColor"
                }
            }
            requests.append(req_color)
        else:
            # Sem prazo / linha neutra → remover qualquer cor residual (fundo padrão)
            req_clear = {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id_da_aba,
                        "startRowIndex": cursor,
                        "endRowIndex": cursor + span,
                        "startColumnIndex": offset_start_col,
                        "endColumnIndex": offset_start_col + 13
                    },
                    "cell": {"userEnteredFormat": {}},
                    "fields": "userEnteredFormat.backgroundColor"
                }
            }
            requests.append(req_clear)

        cursor += span

    
    if requests:
        body = {"requests": requests}
        planilha.batch_update(body)

def calcular_cor_prazo(prazo_str, valor):
    """Retorna a cor de background baseada no prazo e valor do crédito."""
    if (prazo_str and "recolhimento" in prazo_str.lower()) or valor < 100:
        # Saldo residual ou Recolhimento -> Roxo
        return {"red": 0.9, "green": 0.8, "blue": 1.0}
    if prazo_str:
        try:
            dt = datetime.strptime(prazo_str, "%d/%m/%Y")
            dias = (dt - datetime.now()).days
            if dias < 0:
                return {"red": 0.98, "green": 0.8, "blue": 0.8}   # Vermelho (Vencido)
            elif dias <= 20:
                return {"red": 1.0, "green": 0.95, "blue": 0.65}  # Amarelo (Atenção)
            else:
                return {"red": 0.85, "green": 0.98, "blue": 0.85} # Verde (Folga)
        except:
            pass
    return None  # Branco padrão


def _nc_dentro_de_dias(emissao_str, dias=3):
    """Verifica se a data de emissão da NC está dentro dos últimos N dias.
    Aceita formatos DD/MM/YY e DD/MM/YYYY do SAG."""
    if not emissao_str or not emissao_str.strip():
        return False
    from datetime import timedelta
    hoje = datetime.now().date()
    limite = hoje - timedelta(days=dias)
    txt = emissao_str.strip().split()[0]  # pega só a parte da data (ignora hora se houver)
    for fmt in ("%d/%m/%y", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(txt, fmt).date()
            return dt >= limite
        except ValueError:
            continue
    return False


def processar_bloco(aba_banco, aba_tela, planilha, ug, banco_range, tel_range, tel_start_col, merge_offsets, mapa_ncs):
    """
    Processa um bloco de créditos (160443 ou 167443):
    - Lê crédito disponível do BANCO
    - Cruza com NCs pelo índice (UG, PI, ND)
    - Monta linhas com NC preenchida automaticamente (1 linha por NC)
    - Preserva Prazo OM (col 8) e Providência (col 12) que são campos manuais
    - Gera merges e cores corretamente
    """
    log(f"  > Processando Créditos {ug}...")

    # ── 1. Ler Crédito Disponível do BANCO ──────────────────────────────────
    # Colunas: 0=UG, 1=PROGRAMA, 2=ACAO, 3=UGR, 4=PTRES, 5=PI, 6=ND, 7=FONTE, 8=DISPONIVEL
    dados_banco = aba_banco.get_values(banco_range)
    saldo_por_credito = []

    for row in dados_banco:
        if len(row) < 9:
            continue
        r_ug   = row[0].strip()
        r_ptres = row[4].strip()
        r_pi   = row[5].strip()
        r_nd   = row[6].strip()
        r_val  = normalizar_numero(row[8])

        if r_ug != ug or not r_pi or r_val <= 0:
            continue

        setor = FILTRO_PI_RESP_LIST.get(r_pi, "NÃO MAPEADO")
        saldo_por_credito.append({
            "setor": setor,
            "pi": r_pi,
            "ptres": r_ptres,
            "nd": r_nd,
            "valor": r_val,
            "chave": f"{r_pi}|||{r_nd}"
        })

    def idx_setor(s):
        return ORDEM_SETORES.index(s) if s in ORDEM_SETORES else 999
    saldo_por_credito.sort(key=lambda x: (idx_setor(x["setor"]), x["pi"], x["nd"]))

    # ── 2. Ler estado atual da Tela (preservar campos manuais) ──────────────
    # mapa_grupos_usuario[chave] = lista de grupos (cada grupo = lista de linhas)
    mapa_grupos_usuario = ler_grupos_usuario(aba_tela, tel_range)

    # ── 3. Montar Linhas de Saída ────────────────────────────────────────────
    linhas_saida = []
    spans = []
    colors = []

    for cred in saldo_por_credito:
        chave     = cred["chave"]
        pi        = cred["pi"]
        nd        = cred["nd"]
        val_fmt   = f'{cred["valor"]:,.2f}'.replace(",", "X").replace(".", ",").replace("X", ".")

        # Recuperar grupo existente para preservar campos manuais
        grupo_existente = None
        if chave in mapa_grupos_usuario and len(mapa_grupos_usuario[chave]) > 0:
            grupo_existente = mapa_grupos_usuario[chave].pop(0)

        # Recuperar NCs cruzadas pelo índice (UG, PI, ND)
        todas_ncs = mapa_ncs.get((ug, pi, nd), [])

        # Determinar o prazo OM e a providência (campos manuais) da primeira linha existente
        prazo_om   = ""
        providencia = ""
        ncs_existentes = []
        if grupo_existente:
            primeira = grupo_existente[0]
            prazo_om    = primeira[8].strip()  if len(primeira) > 8  else ""
            providencia = primeira[12].strip() if len(primeira) > 12 else ""
            ncs_existentes = [l[4].strip() for l in grupo_existente if len(l) > 4 and l[4].strip()]

        ncs_recentes = [
            nc for nc in todas_ncs
            if _nc_dentro_de_dias(nc["emissao"], 3)
        ]
        
        novas_ncs = [nc for nc in ncs_recentes if nc["nc"] not in ncs_existentes]

        # ── Se existe na tela e NÃO tem nova NC → PRESERVAR SEM ALTERAÇÃO ──────────────
        if grupo_existente and not novas_ncs:
            grupo_existente[0][0] = cred["setor"]
            grupo_existente[0][1] = pi
            grupo_existente[0][3] = val_fmt
            grupo_existente[0][9] = cred["ptres"]
            grupo_existente[0][10] = nd
            linhas_saida.extend(grupo_existente)
            spans.append(len(grupo_existente))
            colors.append(calcular_cor_prazo(prazo_om, cred["valor"]))
            log(f"    PI={pi} ND={nd}: existente → preservado.")
            continue

        # ── Se tem NOVA NC ou é CRÉDITO NOVO → RECONSTRUIR BLOCO ──────────
        ncs_final = []
        if grupo_existente:
            # Manter as que já estavam na tela
            for ex in ncs_existentes:
                 matched = next((x for x in todas_ncs if x["nc"] == ex), None)
                 if matched: ncs_final.append(matched)
                 else: ncs_final.append({"nc": ex, "valor_nc": 0, "emissao": "", "ptres": cred["ptres"], "nd": nd, "obs": ""})
            ncs_final.extend(novas_ncs)
        else:
            ncs_final = ncs_recentes

        cor_grupo = calcular_cor_prazo(prazo_om, cred["valor"])

        if ncs_final:
            num_ncs  = len(ncs_final)
            soma_ncs = sum(normalizar_numero(nc["valor_nc"]) for nc in ncs_final)
            soma_fmt = f'{soma_ncs:,.2f}'.replace(",", "X").replace(".", ",").replace("X", ".")
            g_val    = soma_ncs - cred["valor"]
            g_fmt    = f'{g_val:,.2f}'.replace(",", "X").replace(".", ",").replace("X", ".")
            
            tipo_log = "NOVO" if not grupo_existente else "ATUALIZADO (Bypass)"
            log(f"    PI={pi} ND={nd}: {tipo_log} | {num_ncs} NC(s) → soma={soma_fmt}, disp={val_fmt}, G={g_fmt}")

            for i, nc_info in enumerate(ncs_final):
                if i == 0:
                    linha = [
                        cred["setor"],       # A/O  col 0: Responsável (mesclado)
                        pi,                  # B/P  col 1: PI (mesclado)
                        str(num_ncs),        # C/Q  col 2: Qtd NCs (mesclado)
                        val_fmt,             # D/R  col 3: Valor disponível (mesclado)
                        nc_info["nc"],       # E/S  col 4: N° NC
                        soma_fmt,            # F/T  col 5: Soma total NCs (mesclado)
                        g_fmt,               # G/U  col 6: Valor Emp = soma - disp (mesclado)
                        nc_info["emissao"],  # H/V  col 7: Data chegada
                        prazo_om,            # I/W  col 8: Prazo OM (PRESERVADO)
                        nc_info["ptres"],    # J/X  col 9: PTRES
                        nc_info["nd"],       # K/Y  col 10: ND
                        nc_info["obs"],      # L/Z  col 11: OBS NC
                        providencia,         # M/AA col 12: Providência (PRESERVADO)
                    ]
                else:
                    linha = [
                        "",                  # A/O (mesclado)
                        "",                  # B/P (mesclado)
                        "",                  # C/Q (mesclado)
                        "",                  # D/R (mesclado)
                        nc_info["nc"],       # E/S  col 4: N° NC
                        "",                  # F/T (mesclado com linha 0)
                        "",                  # G/U (mesclado com linha 0)
                        nc_info["emissao"],  # H/V  col 7: Data chegada
                        "",                  # I/W (mesclado)
                        nc_info["ptres"],    # J/X  col 9: PTRES
                        nc_info["nd"],       # K/Y  col 10: ND
                        nc_info["obs"],      # L/Z  col 11: OBS NC
                        "",                  # M/AA (mesclado)
                    ]
                linhas_saida.append(linha)

            spans.append(num_ncs)
            colors.append(cor_grupo)

        else:
            # Sem NCs recentes e vazia
            if todas_ncs:
                log(f"    PI={pi} ND={nd}: NOVO | {len(todas_ncs)} NCs existem mas nenhuma dos últimos 3 dias → linha em branco")
            else:
                log(f"    PI={pi} ND={nd}: NOVO | sem NCs → linha em branco")
            linha = [cred["setor"], pi, "", val_fmt, "", "", "", "", prazo_om, cred["ptres"], nd, "", providencia]
            linhas_saida.append(linha)
            spans.append(1)
            colors.append(cor_grupo)



    # Se não tiver nada, bota uma linha vazia
    if not linhas_saida:
        linhas_saida = [[""] * 13]
        spans = [1]
        colors = [None]

    # ── 4. Escrever na Tela ──────────────────────────────────────────────────
    log(f"    Escrevendo {len(linhas_saida)} linhas na tela ({ug})...")

    # Desmesclar para evitar "Cannot overwrite merged cells"
    aba_tela.unmerge_cells(tel_range)
    aba_tela.batch_clear([tel_range])

    range_nome = tel_range.split(':')[0]  # 'A3' ou 'O3'
    aba_tela.update(values=linhas_saida, range_name=range_nome, value_input_option="USER_ENTERED")

    # ── 5. Merges + Cores ────────────────────────────────────────────────────
    log(f"    Aplicando formatação para {ug}...")
    aplicar_formatacao_lote(
        planilha, aba_tela.id,
        offset_start_row=2,
        offset_start_col=tel_start_col,
        spans=spans,
        merge_offsets=merge_offsets,
        color_list=colors
    )

    log(f"  OK {ug} concluído. ({len(linhas_saida)} linhas, {len(spans)} grupos)")

def main():
    inicio = datetime.now()
    print("=" * 60)
    print("  Atualizacao aba de Créditos")
    print(f"  {inicio.strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

    planilha, gc = get_sheet()
    aba_banco = planilha.worksheet("BANCO")
    aba_tela  = planilha.worksheet("Créditos na tela")

    # ── Carregar todas as NCs uma única vez para ambos os blocos ──
    log("Carregando NCs do BANCO...")
    mapa_ncs = ler_ncs_banco(aba_banco)

    # UG 160443 (Bloco Esquerdo do BANCO: A3:I / Tela: A3:M)
    # Colunas mescladas: Setor(0), PI(1), QtdNCs(2), ValDisp(3), ValorInicialNC(5), ValorEmp(6)
    # NOTA: col 5 (F) adicionado ao merge_offsets para teste de mesclagem da soma de NCs
    processar_bloco(
        aba_banco, aba_tela, planilha,
        ug="160443",
        banco_range="A3:I1000",
        tel_range="A3:M1000",
        tel_start_col=0,
        merge_offsets=[0, 1, 2, 3, 5, 6],
        mapa_ncs=mapa_ncs
    )

    # UG 167443 (Bloco Direito do BANCO: K3:S / Tela: O3:AA)
    # Colunas mescladas relativas a O: Setor(0), PI(1), QtdNCs(2), ValDisp(3), ValorInicialNC(5), ValorEmp(6)
    # NOTA: col 5 (T) adicionado ao merge_offsets para teste de mesclagem da soma de NCs
    processar_bloco(
        aba_banco, aba_tela, planilha,
        ug="167443",
        banco_range="K3:S1000",
        tel_range="O3:AA1000",
        tel_start_col=14,
        merge_offsets=[0, 1, 2, 3, 5, 6],
        mapa_ncs=mapa_ncs
    )
    
    duracao = (datetime.now() - inicio).seconds
    print("=" * 60)
    print(f"  Concluido em {duracao}s | {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()

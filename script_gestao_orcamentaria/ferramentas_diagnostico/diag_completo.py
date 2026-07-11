# -*- coding: utf-8 -*-
"""
diag_completo.py - Diagnóstico completo das abas para replicar GAS exatamente.
"""
import gspread
from google.oauth2.service_account import Credentials
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scopes = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
creds = Credentials.from_service_account_file(
    os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json"), scopes=scopes)
gc = gspread.authorize(creds)
ss = gc.open_by_key('1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww')

# ── 1. CONTROLE EMP 26 ── Mostrar TODOS os tipos de dado nas cols H e R
print('=== CONTROLE EMP 26 — amostra colunas E,F,H,I,O,P,R,S ===')
ws = ss.worksheet('Controle EMP 26')
rows = ws.get_values('A3:S', value_render_option='UNFORMATTED_VALUE')
setores_160 = {}
setores_167 = {}
for i, r in enumerate(rows):
    pad = r + [None]*19
    # 160443
    s160 = str(pad[5]).strip() if pad[5] else ''
    if s160:
        e = float(pad[4]) if isinstance(pad[4], (int,float)) else 0
        h = pad[7]   # raw: data serial ou texto 'SIM'/'NÃO'
        ii = float(pad[8]) if isinstance(pad[8], (int,float)) else 0
        if s160 not in setores_160: setores_160[s160] = {'emp':0,'parc':0,'rows':[]}
        setores_160[s160]['emp'] += e
        setores_160[s160]['parc'] += ii
        if i < 5:  # show first few
            setores_160[s160]['rows'].append(f'E={e} H={repr(h)} I={ii}')
    # 167443
    s167 = str(pad[15]).strip() if pad[15] else ''
    if s167:
        e = float(pad[14]) if isinstance(pad[14], (int,float)) else 0
        r17 = pad[17]
        s18 = float(pad[18]) if isinstance(pad[18], (int,float)) else 0
        if s167 not in setores_167: setores_167[s167] = {'emp':0,'parc':0}
        setores_167[s167]['emp'] += e
        setores_167[s167]['parc'] += s18

print('\n--- Totais 160443 por setor (emp_sum, parc_sum, primeiras linhas) ---')
for s, v in sorted(setores_160.items()):
    print(f'  {s:20} emp={v["emp"]:>12.2f}  parc={v["parc"]:>12.2f}  {v["rows"][:2]}')

print('\n--- Totais 167443 por setor ---')
for s, v in sorted(setores_167.items()):
    print(f'  {s:20} emp={v["emp"]:>12.2f}  parc={v["parc"]:>12.2f}')

print('\n--- Total geral Controle EMP 26 ---')
emp160_total = sum(v['emp'] for v in setores_160.values())
emp167_total = sum(v['emp'] for v in setores_167.values())
parc160_total = sum(v['parc'] for v in setores_160.values())
parc167_total = sum(v['parc'] for v in setores_167.values())
print(f'  EMP-160   total = {emp160_total:>14.2f}   (×100 = {emp160_total*100:>14.2f})')
print(f'  EMP-167   total = {emp167_total:>14.2f}   (×100 = {emp167_total*100:>14.2f})')
print(f'  PARC-160  total = {parc160_total:>14.2f}   (×100 = {parc160_total*100:>14.2f})')
print(f'  PARC-167  total = {parc167_total:>14.2f}   (×100 = {parc167_total*100:>14.2f})')
print(f'  EMP TOTAL       = {emp160_total+emp167_total:>14.2f}   (×100 = {(emp160_total+emp167_total)*100:>14.2f})')

# 2. Valores esperados do BANCO para comparação
print('\n=== BANCO corrente (valores ×100) para comparar ===')
banco = ss.worksheet('BANCO')
br = banco.get_values('AD3:AM4', value_render_option='UNFORMATTED_VALUE')
for row in br:
    ug = row[0]
    emp = (float(row[4])+float(row[5])+float(row[6])+float(row[7]))*100 if len(row)>7 else 0
    liq = (float(row[5])+float(row[6])+float(row[7]))*100 if len(row)>7 else 0
    print(f'  UG={ug}  EMPENHADO={emp:>14.2f}  LIQUIDADO={liq:>14.2f}')

# 3. Tipo da coluna H — verificar se existe algum serial numérico
print('\n=== Coluna H — tipos de valores (primeiras 30 linhas) ===')
tipo_h = {}
for r in rows[:30]:
    pad = r + [None]*19
    h = pad[7]
    t = type(h).__name__
    if t not in tipo_h: tipo_h[t] = []
    if str(h) not in tipo_h[t]: tipo_h[t].append(repr(h))
for t, vals in tipo_h.items():
    print(f'  {t}: {vals[:5]}')

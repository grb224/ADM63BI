# -*- coding: utf-8 -*-
"""
validar_projecao.py - Compara os valores calculados com os da screenshot correta.
Replica exatamente o que o JavaScript faz no browser, mas em Python.
"""
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scopes = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
creds  = Credentials.from_service_account_file(
    os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json"), scopes=scopes)
gc = gspread.authorize(creds)
ss = gc.open_by_key('1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww')

SCALE = 100.0

def nn(v):
    if v is None or v == '': return 0.0
    if isinstance(v, bool): return 0.0
    if isinstance(v, (int, float)): return float(v)
    s = str(v).strip().replace('R$','').replace('%','').replace('\xa0','').replace(' ','')
    if not s or s == '-': return 0.0
    if ',' in s: s = s.replace('.','').replace(',','.')
    try: return float(s)
    except: return 0.0

def calcular_previsto(emp, data, parcial):
    """Replica GAS calcularPrevisto exatamente."""
    e, p = emp, parcial
    if p > 0:
        return min(p, e if e > 0 else p)
    # date check: se data for serial numérico e <= meta
    # Na planilha atual, data é sempre 'SIM'/'NÃO' → nunca será número → retorna 0
    if isinstance(data, (int, float)) and data > 0:
        # converter serial Sheets para datetime
        from datetime import timedelta
        epoch = datetime(1899, 12, 30)
        dt = epoch + timedelta(days=int(data))
        meta = datetime(2026, 4, 30)  # meta padrão
        if dt <= meta:
            return e
    return 0.0

# ── Extrair Controle EMP 26 ──────────────────────────────────────────────────
print('\n=== CONTROLE EMP 26 (SCALE=100) ===')
ws = ss.worksheet('Controle EMP 26')
rows = ws.get_values('A3:S', value_render_option='UNFORMATTED_VALUE')
setores = {}
for r in rows:
    pad = r + [None]*19
    # 160443
    s160 = str(pad[5]).strip() if pad[5] else ''
    if s160:
        emp  = nn(pad[4]) * SCALE
        parc = nn(pad[8]) * SCALE
        prev = calcular_previsto(emp, pad[7], parc)
        if s160 not in setores: setores[s160] = {'emp160':0,'prev160':0,'emp167':0,'prev167':0}
        setores[s160]['emp160']  += emp
        setores[s160]['prev160'] += prev
    # 167443
    s167 = str(pad[15]).strip() if pad[15] else ''
    if s167:
        emp  = nn(pad[14]) * SCALE
        parc = nn(pad[18]) * SCALE
        prev = calcular_previsto(emp, pad[17], parc)
        if s167 not in setores: setores[s167] = {'emp160':0,'prev160':0,'emp167':0,'prev167':0}
        setores[s167]['emp167']  += emp
        setores[s167]['prev167'] += prev

print(f'\n{"Setor":22} {"SaldoEmp":>14} {"ProjLiq":>14}')
print('-'*55)
for s in sorted(setores):
    v = setores[s]
    emp_total  = v['emp160'] + v['emp167']
    prev_total = v['prev160'] + v['prev167']
    print(f'{s:22} {emp_total:>14,.2f} {prev_total:>14,.2f}')

emp_total_uge  = sum(v['emp160']+v['emp167'] for v in setores.values())
prev_total_uge = sum(v['prev160']+v['prev167'] for v in setores.values())
print(f'\n{"TOTAL UGE":22} {emp_total_uge:>14,.2f} {prev_total_uge:>14,.2f}')

# ── Extrair Créditos ─────────────────────────────────────────────────────────
print('\n\n=== CRÉDITOS NA TELA (SCALE=100) ===')
wc = ss.worksheet('Créditos na tela')
crows = wc.get_values('A3:AA', value_render_option='UNFORMATTED_VALUE')
creditos = {}
setor160a = None; setor167a = None
for r in crows:
    pad = r + [None]*27
    s160 = str(pad[0]).strip() if pad[0] else ''
    if s160: setor160a = s160
    if setor160a:
        v = nn(pad[3]) * SCALE
        if v > 0:
            if setor160a not in creditos: creditos[setor160a] = {'c160':0,'c167':0}
            creditos[setor160a]['c160'] += v
    s167 = str(pad[14]).strip() if pad[14] else ''
    if s167: setor167a = s167
    if setor167a:
        v = nn(pad[17]) * SCALE
        if v > 0:
            if setor167a not in creditos: creditos[setor167a] = {'c160':0,'c167':0}
            creditos[setor167a]['c167'] += v

print(f'\n{"Setor":22} {"Cred160":>14} {"Cred167":>14} {"Total":>14}')
print('-'*68)
for s in sorted(creditos):
    c = creditos[s]
    print(f'{s:22} {c["c160"]:>14,.2f} {c["c167"]:>14,.2f} {c["c160"]+c["c167"]:>14,.2f}')

# ── BANCO ────────────────────────────────────────────────────────────────────
print('\n\n=== BANCO CORRENTE (SCALE=100) ===')
print(f'{"UG":8} {"Base":>15} {"Empenhado":>15} {"Liquidado":>15}')
print('-'*56)
# 160443: disp=278085.71 aLiq=346410.18 emLiq=0 liqPag=143214.85 pago=90609.77
dados_corr = {
    '160443': {'disp':27808571,'aLiq':34641018,'emLiq':0,'liqPag':14321485,'pago':9060977},
    '167443': {'disp': 7324417,'aLiq': 8468766,'emLiq':0,'liqPag':  625659,'pago':   43657},
}
for ug, d in dados_corr.items():
    base = d['disp']+d['aLiq']+d['emLiq']+d['liqPag']+d['pago']
    emp  = d['aLiq']+d['emLiq']+d['liqPag']+d['pago']
    liq  = d['emLiq']+d['liqPag']+d['pago']
    print(f'{ug:8} {base:>15,.2f} {emp:>15,.2f} {liq:>15,.2f}')

# Valores esperados da screenshot
print('\n=== COMPARAÇÃO COM SCREENSHOT ===')
expected = {
    'panorama_corr': {
        '160443': {'base':85832051,'emp':58023480,'liq':23382462},
        '167443': {'base':16462406,'emp': 9138082,'liq':  669316},
    },
    'setores': {
        'Aprovisionamento': {'emp':15462569,'proj': 9359762},
        'ALMOX':            {'emp': 1117521,'proj':  869246},
        'HT':               {'emp':  725667,'proj':  621627},
        'Saúde':            {'emp':  238384,'proj':  238384},
        'Fiscalização':     {'emp': 3006148,'proj':    2000},
    }
}
print('\nSetores esperados vs calculados:')
print(f'{"Setor":22} {"Emp(exp)":>12} {"Emp(calc)":>12} {"Proj(exp)":>12} {"Proj(calc)":>12} {"OK?":>5}')
for s, exp in expected['setores'].items():
    calc_emp  = setores.get(s,{}).get('emp160',0)+setores.get(s,{}).get('emp167',0)
    calc_proj = setores.get(s,{}).get('prev160',0)+setores.get(s,{}).get('prev167',0)
    ok = '✓' if abs(calc_emp-exp['emp'])<2 and abs(calc_proj-exp['proj'])<2 else '✗'
    print(f'{s:22} {exp["emp"]:>12,.0f} {calc_emp:>12,.0f} {exp["proj"]:>12,.0f} {calc_proj:>12,.0f} {ok:>5}')

# -*- coding: utf-8 -*-
import gspread
from google.oauth2.service_account import Credentials
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scopes = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
creds = Credentials.from_service_account_file(
    os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json"), scopes=scopes)
gc = gspread.authorize(creds)
ss = gc.open_by_key('1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww')

ws = ss.worksheet('Créditos na tela')
dados = ws.get_values('A3:AA', value_render_option='UNFORMATTED_VALUE')

def normalizar_numero(valor):
    if valor is None or valor == '' or valor is False: return 0.0
    if isinstance(valor, (int, float)) and not isinstance(valor, bool):
        return float(valor)
    txt = str(valor).strip().replace('\xa0','').replace(' ','').replace('R$','').replace('%','')
    if not txt or txt == '-': return 0.0
    if ',' in txt:
        txt = txt.replace('.', '').replace(',', '.')
    try: return float(txt)
    except Exception as e:
        print(f"Error parsing {valor}: {e}")
        return 0.0

setor160_atual = None
setor167_atual = None
mapa = {}

for idx, r in enumerate(dados):
    pad = r + [None] * max(0, 27 - len(r))
    s160 = str(pad[0]).strip() if pad[0] else ''
    s167 = str(pad[14]).strip() if pad[14] else ''
    
    val3 = pad[3]
    val17 = pad[17]
    
    norm3 = normalizar_numero(val3)
    norm17 = normalizar_numero(val17)
    
    print(f"Linha {idx+3}: s160={repr(s160)}, pad[3]={repr(val3)} -> norm={norm3} | s167={repr(s167)}, pad[17]={repr(val17)} -> norm={norm17}")
    
    if s160:
        setor160_atual = s160
    if setor160_atual:
        v = norm3
        if v > 0:
            if setor160_atual not in mapa:
                mapa[setor160_atual] = {'c160': 0.0, 'c167': 0.0}
            mapa[setor160_atual]['c160'] += v

    if s167:
        setor167_atual = s167
    if setor167_atual:
        v = norm17
        if v > 0:
            if setor167_atual not in mapa:
                mapa[setor167_atual] = {'c160': 0.0, 'c167': 0.0}
            mapa[setor167_atual]['c167'] += v

print(f"Resultado final: {mapa}")

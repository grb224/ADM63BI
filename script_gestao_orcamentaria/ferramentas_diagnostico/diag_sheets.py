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

print('=== CREDITOS NA TELA: A3:AA (primeiras 35 linhas) ===')
ws = ss.worksheet('Créditos na tela')
rows = ws.get_values('A3:AA', value_render_option='UNFORMATTED_VALUE')
for i, r in enumerate(rows[:35]):
    pad = r + [None]*27
    a   = repr(pad[0])[:20]
    b   = repr(pad[1])[:20]
    d   = repr(pad[3])
    o   = repr(pad[14])[:20]
    r17 = repr(pad[17])
    print(f'  [{i+3:02d}] A={a:22} B={b:22} D={d:18} | O={o:22} R={r17}')

print()
print('=== CONTROLE EMP 26: A3:S (primeiras 20 linhas) ===')
ws2 = ss.worksheet('Controle EMP 26')
rows2 = ws2.get_values('A3:S', value_render_option='UNFORMATTED_VALUE')
for i, r in enumerate(rows2[:20]):
    pad = r + [None]*19
    ne  = repr(str(pad[1]))[:14]
    e   = repr(pad[4])
    f   = repr(pad[5])
    h   = repr(pad[7])
    ii  = repr(pad[8])
    o   = repr(pad[14])
    p   = repr(pad[15])
    rv  = repr(pad[17])
    s   = repr(pad[18])
    print(f'  [{i+3:02d}] NE={ne:16} E={e:14} F={f:20} H={h:12} I={ii:10} | O={o:14} P={p:20} R={rv:12} S={s}')

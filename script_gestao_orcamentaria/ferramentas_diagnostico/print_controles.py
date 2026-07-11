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

ws = ss.worksheet('Controle EMP RPNP')
print("=== CONTROLE EMP RPNP - UG 160443 (A3:I) ===")
rows160 = ws.get_values('A3:I100')
for idx, r in enumerate(rows160):
    print(f"Linha {idx+3}: PI={r[0] if len(r)>0 else ''}, NE={r[1] if len(r)>1 else ''}, DIAS={r[3] if len(r)>3 else ''}, SETOR={r[5] if len(r)>5 else ''}")

print("\n=== CONTROLE EMP RPNP - UG 167443 (K3:S) ===")
rows167 = ws.get_values('K3:S100')
for idx, r in enumerate(rows167):
    print(f"Linha {idx+3}: PI={r[0] if len(r)>0 else ''}, NE={r[1] if len(r)>1 else ''}, DIAS={r[3] if len(r)>3 else ''}, SETOR={r[5] if len(r)>5 else ''}")

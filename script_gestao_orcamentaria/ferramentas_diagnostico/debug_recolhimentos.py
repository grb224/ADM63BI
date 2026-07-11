# -*- coding: utf-8 -*-
import gspread
from google.oauth2.service_account import Credentials
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scopes = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
creds = Credentials.from_service_account_file(
    os.path.join(BASE_DIR, "auth", "adm63bi-c5651faf4cdb.json"), scopes=scopes)
gc = gspread.authorize(creds)
ss = gc.open_by_key('1ToRibNcO5GJ7oXZ0oeGpBXFmIE17gTUWNYA5B-oy7Ww')

ws = ss.worksheet('BANCO')
rows = ws.get_values('U3:AB1000')

# Build a mapping of NC -> PI
nc_to_pi = {}
for r in rows:
    if len(r) >= 7:
        nc = r[5].strip()
        pi = r[6].strip()
        if nc and pi:
            nc_to_pi[nc] = pi

print("=== MAPA NC -> PI ===")
for nc, pi in list(nc_to_pi.items())[:15]:
    print(f"  {nc} -> {pi}")

print("\n=== ANALISANDO LINHAS COM PI EM BRANCO ===")
for idx, r in enumerate(rows):
    if len(r) >= 7:
        nc = r[5].strip()
        pi = r[6].strip()
        obs = r[4].strip()
        if nc and not pi:
            print(f"Linha {idx+3}: NC={nc}, OBS={repr(obs)}")
            # Search for NC references in OBS
            found_ncs = re.findall(r'2026NC\d{6}', obs.upper())
            for ref_nc in found_ncs:
                ref_pi = nc_to_pi.get(ref_nc, "NÃO ENCONTRADO")
                print(f"  -> Referência encontrada: {ref_nc} (PI={ref_pi})")

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

ws = ss.worksheet('BANCO')

# Check DISPONIVEL 160443 (A3:I)
rows_160 = ws.get_values('A3:I1000')
print(f"=== DISPONIVEL 160443 (A3:I) - Total {len(rows_160)} rows ===")
for idx, r in enumerate(rows_160):
    for col_idx, val in enumerate(r):
        if not val.strip():
            print(f"Row {idx+3}, Col {chr(65+col_idx)} is blank: {r}")

# Check DISPONIVEL 167443 (K3:S)
rows_167 = ws.get_values('K3:S1000')
print(f"\n=== DISPONIVEL 167443 (K3:S) - Total {len(rows_167)} rows ===")
for idx, r in enumerate(rows_167):
    for col_idx, val in enumerate(r):
        if not val.strip():
            print(f"Row {idx+3}, Col {chr(75+col_idx)} is blank: {r}")

# Check NC Documentos (U3:AB)
rows_nc = ws.get_values('U3:AB1000')
print(f"\n=== NC Documentos (U3:AB) - Total {len(rows_nc)} rows ===")
blank_nc_count = 0
for idx, r in enumerate(rows_nc):
    for col_idx, val in enumerate(r):
        if not val.strip():
            blank_nc_count += 1
            if blank_nc_count <= 20: # show first few
                print(f"Row {idx+3}, Col {chr(85+col_idx)} is blank: {r}")
print(f"Total blank cells in U3:AB: {blank_nc_count}")

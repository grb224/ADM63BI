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
print("=== PRIMEIRAS 10 LINHAS DE U3:AB IN BANCO ===")
rows = ws.get_values('U3:AB15')
for idx, r in enumerate(rows):
    print(f"Linha {idx+3}: {r}")

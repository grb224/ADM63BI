# -*- coding: utf-8 -*-
import requests
import re
import json
from datetime import datetime

SAG_LOGIN = "https://sag.eb.mil.br/login.php"
SAG_CHAMADAS = "https://sag.eb.mil.br/php/chamadas/"
SAG_CPF = "04019136009"
SAG_SENHA = " 040191"

def strip_html(text):
    return re.sub(r'<[^>]+>', '', str(text)).strip()

def strip_row(row):
    return [strip_html(c) for c in row]

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
    "Referer": "https://sag.eb.mil.br/"
})

print("Fazendo login no SAG...")
r = session.post(SAG_LOGIN, data={"cpf": SAG_CPF, "senha": SAG_SENHA}, timeout=15)
print(f"Login response: {r.text.strip()}")

print("\n--- TESTANDO DISPONIVEL 160443 ---")
params = [("tipo", "disponivel"), ("ug", "160443"),
          ("sEcho", "1"), ("iColumns", "9"),
          ("iDisplayStart", "0"), ("iDisplayLength", "5")]
r = session.get(SAG_CHAMADAS + "saldos_basicos.php", params=params, timeout=30)
data = r.json().get("data", [])
for idx, row in enumerate(data):
    print(f"Row {idx}: {strip_row(row)}")

print("\n--- TESTANDO NC DOCUMENTOS (iDisplayLength=5) ---")
NC_COLUNAS = ["DESTINO_UG_FAV", "DATA_EMISSAO", "DESTINO_PTRES", "DESTINO_ND", "OBS", "NUMERO_NC", "DESTINO_PI", "DESTINO_VALOR_ITEM"]
params = ([("metodo", "tela"), ("fase", "load"), ("iDisplayStart", "0"), ("iDisplayLength", "5")] +
          [("coluna[]", c) for c in NC_COLUNAS] +
          [("UG_FAV[]", "160443"), ("UG_FAV[]", "167443")])
r = session.get(SAG_CHAMADAS + "docNcuq1.php", params=params, timeout=60)
data = r.json().get("data", [])
for idx, row in enumerate(data):
    print(f"Row {idx}: {strip_row(row)}")

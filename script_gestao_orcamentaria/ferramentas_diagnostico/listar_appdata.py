# -*- coding: utf-8 -*-
import os

app_data_dir = r"C:\Users\guilh\.gemini\antigravity-ide"
print(f"Listando todos os arquivos em {app_data_dir}:")
for root, dirs, files in os.walk(app_data_dir):
    for file in files:
        print(os.path.join(root, file))

# -*- coding: utf-8 -*-
import json
import os

transcript_path = r"C:\Users\guilh\.gemini\antigravity-ide\brain\85213334-f250-48ed-8fb8-d32e3c938e85\.system_generated\logs\transcript.jsonl"

if not os.path.exists(transcript_path):
    print("Transcript não encontrado.")
    exit(1)

print("Buscando no transcript...")
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            step = json.loads(line)
            content = step.get("content", "")
            if "30/04" in content or "porcentagem" in content or "fotografia" in content or "empenho" in content:
                print(f"Linha {idx}: [{step.get('type')}] - {content[:200]}...")
        except:
            pass

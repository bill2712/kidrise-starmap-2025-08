import json

ui_ts_path = 'src/i18n/ui.ts'

with open(ui_ts_path, 'r') as f:
    text = f.read()

lines = text.split('\n')
lang_data = {}
current_lang = None
for line in lines:
    line_strip = line.strip()
    if line_strip.startswith("'") and "': {" in line_strip:
        current_lang = line_strip.split("'")[1]
        lang_data[current_lang] = []
    elif line_strip.startswith('"') and '": {' in line_strip:
        current_lang = line_strip.split('"')[1]
        lang_data[current_lang] = []
    
    if current_lang and "': '" in line_strip:
        key = line_strip.split("': '")[0].replace("'", "")
        val = line_strip.split("': '")[1].rsplit("'", 1)[0]
        lang_data[current_lang].append((key, val))

for lang, items in lang_data.items():
    if lang in ['es', 'ja', 'fr']:
        print(f"--- {lang} ---")
        for key, val in items:
            if key.startswith('about') or key.startswith('privacy') or key.startswith('terms'):
                print(f"{key}: {val[:50]}...")

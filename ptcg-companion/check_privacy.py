import json

ui_ts_path = 'src/i18n/ui.ts'

with open(ui_ts_path, 'r') as f:
    text = f.read()

lines = text.split('\n')
current_lang = None
for line in lines:
    if line.strip().startswith("'") and "': {" in line:
        current_lang = line.split("'")[1]
    elif line.strip().startswith('"') and '": {' in line:
        current_lang = line.split('"')[1]
    
    if current_lang == 'fr' and 'privacy.' in line:
        print(line.strip())


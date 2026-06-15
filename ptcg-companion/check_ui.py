import re

with open('src/i18n/ui.ts', 'r') as f:
    text = f.read()

# find all blocks of languages
langs = ['zh-TW', 'en', 'fr', 'ja', 'de', 'zh-CN', 'es', 'pt', 'ru', 'hi', 'bn', 'ar', 'ur']

for lang in langs:
    print(f"--- Checking {lang} ---")
    # find lines for this language
    # naive approach: split by lang string
    if f"'{lang}': {{" in text:
        block = text.split(f"'{lang}': {{")[1].split("},")[0]
        # check for English phrases in 'es' or 'ja'
        for line in block.split('\n'):
            if 'privacy' in line or 'terms' in line or 'about' in line:
                if 'Privacy Policy' in line and lang != 'en':
                    print(line.strip())

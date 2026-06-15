import re

file_path = 'src/i18n/ui.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

locales_regex = re.compile(r"('|\"|`)([a-zA-Z-]+)\1\s*:\s*{(.*?)}", re.DOTALL)
chinese_pattern = re.compile(r'[\u4e00-\u9fa5]')

allowed_chinese = ['zh-TW', 'zh-CN', 'ja']
errors = []

for match in locales_regex.finditer(content):
    lang = match.group(2)
    block = match.group(3)
    
    if lang not in allowed_chinese:
        lines = block.split('\n')
        for i, line in enumerate(lines):
            # Ignore comments if any
            if line.strip().startswith('//'): continue
            if chinese_pattern.search(line):
                errors.append(f"[{lang}]: {line.strip()}")

if errors:
    print("FAILED: Found Chinese character leaks in locales:")
    for e in errors:
        print(e)
else:
    print("SUCCESS: No Chinese character leaks detected in western/middle-eastern locales.")

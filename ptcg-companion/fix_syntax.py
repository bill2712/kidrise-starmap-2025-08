import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # 1. Fix Layout props
    content = re.sub(r'title="(\{t\([^}]+\)\})"', r'title=\1', content)
    content = re.sub(r'description="(\{t\([^}]+\)\})"', r'description=\1', content)

    # 2. Fix jsonLd object strings
    content = re.sub(r'"name":\s*"\{t\((.*?)\)\}"', r'"name": t(\1)', content)
    content = re.sub(r'"description":\s*"\{t\((.*?)\)\}"', r'"description": t(\1)', content)
    
    # 3. Any other jsonLd properties that might have been wrapped
    # e.g. "text": "{t('...')}"
    content = re.sub(r'"([a-zA-Z0-9_]+)":\s*"\{t\((.*?)\)\}"', r'"\1": t(\2)', content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)

src_dir = 'src/pages/[lang]'
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.astro'):
            filepath = os.path.join(root, file)
            fix_file(filepath)

# Also check Layout.astro and SEO.astro
if os.path.exists('src/layouts/Layout.astro'):
    fix_file('src/layouts/Layout.astro')
if os.path.exists('src/components/SEO.astro'):
    fix_file('src/components/SEO.astro')

print("Syntax sweep complete.")

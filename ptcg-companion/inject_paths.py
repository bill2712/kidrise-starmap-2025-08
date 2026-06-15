import os

paths_code = """
import { getLanguagePaths } from '../../i18n/routes.ts';
export function getStaticPaths() {
  return getLanguagePaths();
}
"""

def process_file(filepath, levels_up):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # If it already has getStaticPaths, skip
    if "getStaticPaths" in content:
        return
        
    import_path = "../" * levels_up + "i18n/routes.ts"
    
    inject_code = f"""
import {{ getLanguagePaths }} from '{import_path}';
export function getStaticPaths() {{
  return getLanguagePaths();
}}
"""
    
    # Prepend after ---
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            parts[1] = parts[1] + inject_code
            new_content = '---'.join(parts)
            with open(filepath, 'w') as f:
                f.write(new_content)
                
pages_dir = "src/pages/[lang]"
for root, dirs, files in os.walk(pages_dir):
    for file in files:
        if file.endswith('.astro'):
            filepath = os.path.join(root, file)
            # calculate levels up to src/
            rel_path = os.path.relpath(filepath, "src/")
            levels_up = rel_path.count('/')
            
            # don't inject in dynamic routes like [slug].astro yet
            if "[" in file and "]" in file and "lang" not in file:
                continue
                
            process_file(filepath, levels_up)

print("Injected getStaticPaths into static pages.")

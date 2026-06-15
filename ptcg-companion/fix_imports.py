import os
import re

def fix():
    for root, dirs, files in os.walk('src/pages/[lang]'):
        for file in files:
            if file.endswith('.astro'):
                filepath = os.path.join(root, file)
                
                # Get depth relative to src/pages/
                # src/pages/[lang]/about.astro -> root is 'src/pages/[lang]', depth from 'src/pages' is 1
                # src/pages/[lang]/tools/about.astro -> root is 'src/pages/[lang]/tools', depth is 2
                
                rel_dir = os.path.relpath(root, 'src/pages')
                # rel_dir is '[lang]' or '[lang]/tools'
                depth = len(rel_dir.split(os.sep))
                # For `[lang]`, depth is 1. We need `../` for components (since components is at `src/components`).
                # Wait, from `src/pages/[lang]/about.astro` to `src/components/`, we need `../../components/`.
                # If it was in `src/pages/about.astro`, it was `../components/`.
                # So we just need to replace all `../../../` with `../../` for depth 1, or just recalculate them.
                
                with open(filepath, 'r') as f:
                    content = f.read()
                
                def replacer(match):
                    # match.group(1) is the import path
                    path = match.group(1)
                    if not path.startswith('.'):
                        return match.group(0)
                    
                    # Resolve the path relative to the ORIGINAL location (src/pages)
                    # Let's say the original file was at `src/pages/about.astro`.
                    # Then `../layouts/Layout.astro` resolved to `src/layouts/Layout.astro`.
                    # Now the file is at `src/pages/[lang]/about.astro`.
                    # So we need to prepend one `../` to the path!
                    # Wait, if we just prepend `../`, then `../layouts` becomes `../../layouts`.
                    
                    # Since I previously messed up and ran `s|from '../|from '../../|` which replaced `../` with `../../` AND `../../` with `../../../`, let me just strip all `../` and re-add them based on depth.
                    
                    # Find the target name (e.g. `layouts/Layout.astro`, `components/AdSlot.astro`, `i18n/routes.ts`, `config.js`)
                    # We know all of these are in `src/`.
                    # So the target is `src/TARGET`.
                    
                    target = path.lstrip('./')
                    # e.g., `layouts/Layout.astro`
                    
                    # For a file at `src/pages/[lang]/about.astro`, depth to `src/` is 3.
                    # Wait, `src/pages/[lang]` is 3 levels deep? No:
                    # 1. src
                    # 2. pages
                    # 3. [lang]
                    # So from `about.astro` (inside `[lang]`), we need `../../` to reach `src`.
                    # From `tools/v60.astro` (inside `[lang]/tools`), we need `../../../` to reach `src`.
                    
                    num_up = depth + 1
                    new_path = '../' * num_up + target
                    
                    return f"from '{new_path}'"

                # Wait, I used single quotes and double quotes. Let's handle both.
                content = re.sub(r"from\s+['\"]([^'\"]+)['\"]", replacer, content)
                
                with open(filepath, 'w') as f:
                    f.write(content)

fix()

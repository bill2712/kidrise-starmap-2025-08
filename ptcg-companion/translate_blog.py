import os
import re
import time
from deep_translator import GoogleTranslator

SOURCE_DIR = 'src/content/blog/en'
TARGET_LANGS = ['fr', 'ja', 'de', 'es', 'pt', 'ru', 'hi', 'bn', 'ar', 'ur', 'zh-TW', 'zh-CN', 'en']

# Define a mapping because some deep-translator codes might differ from our lang codes
LANG_MAP = {
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
    'ja': 'ja',
    'en': 'en',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'pt': 'pt',
    'ru': 'ru',
    'hi': 'hi',
    'bn': 'bn',
    'ar': 'ar',
    'ur': 'ur'
}

def translate_text(text, dest_lang):
    if not text.strip():
        return text
    
    # Simple rate limiting protection
    time.sleep(0.5)
    
    try:
        translator = GoogleTranslator(source='auto', target=dest_lang)
        
        # deep-translator has a 5000 character limit. Let's chunk if necessary.
        if len(text) > 4500:
            chunks = []
            paragraphs = text.split('\n\n')
            current_chunk = ""
            for p in paragraphs:
                if len(current_chunk) + len(p) < 4500:
                    current_chunk += p + '\n\n'
                else:
                    chunks.append(translator.translate(current_chunk))
                    current_chunk = p + '\n\n'
            if current_chunk:
                chunks.append(translator.translate(current_chunk))
            return '\n\n'.join(chunks)
        else:
            return translator.translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

def parse_mdx(content):
    # Extracts frontmatter and body
    match = re.match(r'^---\s*(.*?)\s*---\s*(.*)', content, re.DOTALL)
    if not match:
        return None, content
    
    frontmatter = match.group(1)
    body = match.group(2)
    
    fm_dict = {}
    for line in frontmatter.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            fm_dict[key.strip()] = val.strip()
            
    return fm_dict, body

def build_mdx(fm_dict, body):
    fm_str = "---\n"
    for k, v in fm_dict.items():
        fm_str += f"{k}: {v}\n"
    fm_str += "---\n"
    return fm_str + body

def main():
    files = [f for f in os.listdir(SOURCE_DIR) if f.endswith('.mdx')]
    
    for lang in TARGET_LANGS:
        dest_dir = os.path.join('src/content/blog', lang)
        os.makedirs(dest_dir, exist_ok=True)
        
        dest_code = LANG_MAP.get(lang, lang)
        print(f"Translating to {lang}...")
        
        for file in files:
            source_path = os.path.join(SOURCE_DIR, file)
            dest_path = os.path.join(dest_dir, file)
            
            # If the language is zh-TW and the original files are already zh-TW, we might just copy
            # But the original files are inside `en/`. Let's just always run it. If it's already zh-TW, Google will just return it.
            
            with open(source_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            fm_dict, body = parse_mdx(content)
            
            if fm_dict is None:
                # Not a valid MDX with frontmatter
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                continue
                
            # Translate Title and Description in frontmatter
            if 'title' in fm_dict:
                # Remove quotes for translation
                raw_title = fm_dict['title'].strip('"\'')
                translated_title = translate_text(raw_title, dest_code)
                fm_dict['title'] = f'"{translated_title}"'
                
            if 'description' in fm_dict:
                raw_desc = fm_dict['description'].strip('"\'')
                translated_desc = translate_text(raw_desc, dest_code)
                fm_dict['description'] = f'"{translated_desc}"'
                
            # Translate body
            # We must be careful not to translate Markdown/JSX components.
            # But GoogleTranslator handles simple HTML/Markdown mostly fine.
            # Let's preserve <Content components={{ AdSlot }} /> and <AdSlot ... /> if any.
            # Wait, components are injected in [slug].astro, not inside the .mdx itself!
            # Let's check `agitation.mdx` - there's no JSX components inside it. It's just markdown.
            translated_body = translate_text(body, dest_code)
            
            final_content = build_mdx(fm_dict, translated_body)
            
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(final_content)
                
            print(f"  {file} translated.")

if __name__ == '__main__':
    main()

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAudit() {
  const uiContent = fs.readFileSync(join(__dirname, 'src/i18n/ui.ts'), 'utf-8');
  
  // Create a temporary file to import
  const tmpPath = join(__dirname, 'src/i18n/ui.mjs');
  let transformed = uiContent.replace(/export const /g, 'export const ').replace(/as const;/g, ';');
  // To import TS as JS we might have issues if it has types, but ui.ts has no types!
  fs.writeFileSync(tmpPath, transformed);
  
  try {
    const { ui, languages, defaultLang, rtlLanguages } = await import('./src/i18n/ui.mjs');
    
    const zhTwKeys = Object.keys(ui['zh-TW']);
    console.log(`Master (zh-TW) has ${zhTwKeys.length} keys.`);
    
    let needsUpdate = false;
    
    for (const lang of Object.keys(languages)) {
      if (lang === 'zh-TW') continue;
      const langKeys = Object.keys(ui[lang] || {});
      const missing = zhTwKeys.filter(k => !langKeys.includes(k));
      console.log(`Locale ${lang} has ${langKeys.length} keys. Missing: ${missing.length}`);
      
      if (missing.length > 0) {
        needsUpdate = true;
        if (!ui[lang]) ui[lang] = {};
        for (const m of missing) {
          ui[lang][m] = ui['zh-TW'][m];
        }
      }
    }
    
    if (needsUpdate) {
      console.log('Writing back exact symmetry to ui.ts...');
      let newUiTs = `export const languages = ${JSON.stringify(languages, null, 2)};\n\n`;
      newUiTs += `export const rtlLanguages = ${JSON.stringify(rtlLanguages, null, 2)};\n\n`;
      newUiTs += `export const defaultLang = '${defaultLang}';\n\n`;
      newUiTs += `export const ui = {\n`;
      
      for (const lang of Object.keys(languages)) {
        newUiTs += `  "${lang}": {\n`;
        for (const key of zhTwKeys) {
          const val = ui[lang][key] || ui['zh-TW'][key];
          newUiTs += `    "${key}": ${JSON.stringify(val)},\n`;
        }
        newUiTs += `  },\n`;
      }
      newUiTs += `} as const;\n`;
      
      fs.writeFileSync(join(__dirname, 'src/i18n/ui.ts'), newUiTs);
      console.log('ui.ts fully synchronized across 13 locales!');
    } else {
      console.log('100% Dictionary Symmetry Confirmed.');
    }
    
  } catch (e) {
    console.error(e);
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

runAudit();

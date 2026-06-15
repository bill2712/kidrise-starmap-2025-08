import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addKeys() {
  const uiContent = fs.readFileSync(join(__dirname, 'src/i18n/ui.ts'), 'utf-8');
  
  const tmpPath = join(__dirname, 'src/i18n/ui.mjs');
  let transformed = uiContent.replace(/export const /g, 'export const ').replace(/as const;/g, ';');
  fs.writeFileSync(tmpPath, transformed);
  
  const { ui, languages, defaultLang, rtlLanguages } = await import('./src/i18n/ui.mjs');
  
  const newKeys = {
    'form.errWeight': '請輸入有效的正數',
    'form.errRatio': '請輸入有效的比例',
    'form.toastDefault': '通知訊息',
    'form.errWeightReset': '咖啡粉量必須為正數，已重置',
    'form.errRatioReset': '粉水比例必須為正數，已重置',
    'form.customBean': '自訂精品咖啡豆',
    'form.grindMedium': '中等',
    'form.shareSuccess': '網址已複製！快分享給朋友吧 ☕',
    'form.shareFail': '複製失敗，請手動複製網址。',
    'form.sharedRecipe': '分享的配方',
    'form.loadedShared': '已載入朋友分享的配方！',
    'form.savedFavorite': '配方已儲存至我的最愛！',
    'form.emptyHistory': '目前沒有儲存的配方',
    'form.emptyHistoryDesc': '調整參數並點擊「存入我的最愛」即可儲存！',
    'form.gPowder': 'g 粉',
    'form.deleteBtn': '刪除',
    'form.loadedSuccess': '配方已載入！',
    
    'search.placeholder': '搜尋知識庫與百科... (例如: 悶蒸, 通道效應)',
    'search.noResult': '找不到符合',
    'search.tagWiki': '百科',
    'search.tagArticle': '文章',
    
    'timer.soundToggle': '切換聲音提示',
    'timer.taste1': '平淡',
    'timer.taste2': '明亮',
    'timer.taste3': '柔和',
    'timer.taste4': '強烈',
    'timer.taste5': '清爽 (Tea-like)',
    'timer.taste6': '濃郁 (Syrupy)',
    'timer.roastLight': '淺度烘焙 (Roast: Light)',
    'timer.roastMedium': '中度烘焙 (Roast: Medium)',
    'timer.roastDark': '深度烘焙 (Roast: Dark)',
    'timer.expectedWater': '預期注水量 (g)',
    'timer.voiceEnabled': '語音提示已開啟'
  };

  // Merge into zh-TW
  for (const [k, v] of Object.entries(newKeys)) {
    ui['zh-TW'][k] = v;
  }
  
  // Merge into all others (fallback to zh-TW)
  for (const lang of Object.keys(languages)) {
    if (!ui[lang]) ui[lang] = {};
    for (const [k, v] of Object.entries(newKeys)) {
      if (!ui[lang][k]) {
        ui[lang][k] = v; // English can be manually updated later if needed
      }
    }
  }

  // Rewrite ui.ts
  let newUiTs = `export const languages = ${JSON.stringify(languages, null, 2)};\n\n`;
  newUiTs += `export const rtlLanguages = ${JSON.stringify(rtlLanguages, null, 2)};\n\n`;
  newUiTs += `export const defaultLang = '${defaultLang}';\n\n`;
  newUiTs += `export const ui = {\n`;
  
  for (const lang of Object.keys(languages)) {
    newUiTs += `  "${lang}": {\n`;
    const keys = Object.keys(ui[lang]);
    for (const key of keys) {
      newUiTs += `    "${key}": ${JSON.stringify(ui[lang][key])},\n`;
    }
    newUiTs += `  },\n`;
  }
  newUiTs += `} as const;\n`;
  
  fs.writeFileSync(join(__dirname, 'src/i18n/ui.ts'), newUiTs);
  console.log('Added ' + Object.keys(newKeys).length + ' new keys to ui.ts');
  fs.unlinkSync(tmpPath);
}

addKeys();

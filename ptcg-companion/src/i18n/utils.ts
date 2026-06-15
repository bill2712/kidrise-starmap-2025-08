import { ui, defaultLang, rtlLanguages } from './ui';

export { rtlLanguages };

export function getLangFromUrl(url: URL) {
  const basePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL;
  let pathWithoutBase = url.pathname;
  if (basePath && pathWithoutBase.startsWith(basePath)) {
    pathWithoutBase = pathWithoutBase.slice(basePath.length);
  }
  const [, lang] = pathWithoutBase.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang], params?: Record<string, string | number>) {
    // @ts-ignore
    let str: string = ui[lang]?.[key] || ui['en']?.[key] || ui[defaultLang][key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }
}

import { languages } from './ui';
export function getLanguagePaths() {
  return Object.keys(languages).map(lang => ({ params: { lang } }));
}

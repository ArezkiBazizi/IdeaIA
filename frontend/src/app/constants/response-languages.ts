/** Codes alignés avec `backend/src/utils/responseLanguage.js` */
export const RESPONSE_LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'it', label: 'IT' },
  { code: 'pt', label: 'PT' },
] as const;

export type ResponseLanguageCode = (typeof RESPONSE_LANGUAGES)[number]['code'];

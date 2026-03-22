/**
 * Langue des réponses modèle — alignée avec le sélecteur front (codes ISO courts).
 */
const ALLOWED = new Set(['fr', 'en', 'es', 'de', 'it', 'pt']);

export function normalizeResponseLanguage(value) {
  if (value == null || value === '') return 'fr';
  const v = String(value).toLowerCase().trim();
  if (ALLOWED.has(v)) return v;
  return 'fr';
}

/** Instruction système pour le chat (réponse assistant). */
export function chatLanguageInstruction(code) {
  const m = {
    fr: 'Réponds toujours en français.',
    en: 'Always respond in English.',
    es: 'Responde siempre en español.',
    de: 'Antworte immer auf Deutsch.',
    it: 'Rispondi sempre in italiano.',
    pt: 'Responda sempre em português.',
  };
  return m[code] ?? m.fr;
}

/** Rappel pour la génération JSON : textes utilisateur dans la langue choisie, clés JSON en anglais. */
export function projectGenerationLanguageInstruction(code) {
  const m = {
    fr:
      'Toutes les valeurs textuelles (title, description, titres de phases, titres et descriptions de tâches) doivent être rédigées en français. Les clés JSON restent en anglais comme indiqué. Les durées estimatedTime : format court lisible (ex. « 2h », « 1 jour »).',
    en:
      'All human-readable string values must be in English. JSON keys stay in English as specified. Use short readable durations for estimatedTime (e.g. "2h", "1 day").',
    es:
      'Todos los textos (title, description, fases y tareas) deben estar en español. Las claves JSON siguen en inglés. estimatedTime en formato breve (p. ej. "2h", "1 día").',
    de:
      'Alle lesbaren Texte (title, description, Phasen und Aufgaben) auf Deutsch. JSON-Schlüssel bleiben auf Englisch. estimatedTime kurz und lesbar (z. B. "2h", "1 Tag").',
    it:
      'Tutti i testi visibili (title, description, fasi e attività) in italiano. Le chiavi JSON restano in inglese. estimatedTime in formato breve (es. "2h", "1 giorno").',
    pt:
      'Todos os textos (title, description, fases e tarefas) em português. As chaves JSON permanecem em inglês. estimatedTime em formato curto (ex.: "2h", "1 dia").',
  };
  return m[code] ?? m.fr;
}

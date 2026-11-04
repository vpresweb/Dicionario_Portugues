// Загрузка словаря и поиск по нему.
import { conjugate, allForms } from './conjugation.js';

// Приводит строку к виду для сравнения: нижний регистр, без диакритики (ação → acao, ё → е).
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ё/g, 'е')
    .trim();
}

export function prepareEntries(entries) {
  return entries.map((entry) => {
    const prepared = {
      ...entry,
      _pt: normalize(entry.word),
      _ru: entry.translations.map(normalize),
      _forms: [],
    };
    if (entry.pos === 'verb') {
      prepared.conjugated = conjugate(entry.word, entry.conjugation);
      prepared._forms = [...new Set(allForms(prepared.conjugated).map(normalize))];
    }
    return prepared;
  });
}

export async function loadDictionary(url = 'data/dictionary.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось загрузить словарь: ${response.status}`);
  return prepareEntries(await response.json());
}

// Ранг совпадения: 0 — точное, 1 — начало слова, 2 — подстрока, null — нет совпадения.
function rank(candidate, query) {
  if (candidate === query) return 0;
  if (candidate.startsWith(query)) return 1;
  if (candidate.includes(query)) return 2;
  return null;
}

function bestRank(candidates, query) {
  let best = null;
  for (const candidate of candidates) {
    const r = rank(candidate, query);
    if (r !== null && (best === null || r < best)) best = r;
  }
  return best;
}

// mode: 'all' | 'pt' | 'ru'
export function search(entries, rawQuery, mode = 'all', limit = 50) {
  const query = normalize(rawQuery);
  if (!query) return [];

  const found = [];
  for (const entry of entries) {
    const ranks = [];
    if (mode !== 'ru') {
      ranks.push(rank(entry._pt, query));
      // Точное совпадение с формой глагола ставим сразу после точного совпадения слова.
      if (entry._forms.includes(query)) ranks.push(0.5);
    }
    if (mode !== 'pt') ranks.push(bestRank(entry._ru, query));
    const valid = ranks.filter((r) => r !== null);
    if (valid.length) found.push({ entry, score: Math.min(...valid) });
  }

  found.sort((a, b) => a.score - b.score || a.entry.word.localeCompare(b.entry.word, 'pt'));
  return found.slice(0, limit).map((f) => f.entry);
}

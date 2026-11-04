// Общие подписи и экранирование для словаря и карточек.

export const POS_LABELS = {
  noun: 'сущ.',
  verb: 'гл.',
  adj: 'прил.',
  adv: 'нареч.',
  prep: 'предл.',
  pron: 'мест.',
  conj: 'союз',
  interj: 'межд.',
  num: 'числ.',
  phrase: 'выражение',
};

export const GENDER_LABELS = { m: 'м. р.', f: 'ж. р.' };

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export function entryMeta(entry) {
  return [POS_LABELS[entry.pos] ?? entry.pos, GENDER_LABELS[entry.gender]]
    .filter(Boolean)
    .join(', ');
}

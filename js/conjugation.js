// Спряжение глаголов (европейский вариант португальского).
// Правильные глаголы спрягаются по окончанию инфинитива (-ar, -er, -ir),
// неправильные формы задаются в словаре полем "conjugation" и заменяют сгенерированные.

export const PERSONS = ['eu', 'tu', 'ele/ela/você', 'nós', 'eles/elas/vocês'];

export const TENSES = [
  { key: 'presente', label: 'Presente', ru: 'настоящее время' },
  { key: 'perfeito', label: 'Pretérito perfeito', ru: 'прошедшее завершённое' },
  { key: 'imperfeito', label: 'Pretérito imperfeito', ru: 'прошедшее незавершённое' },
  { key: 'futuro', label: 'Futuro', ru: 'будущее время' },
  { key: 'condicional', label: 'Condicional', ru: 'условное наклонение' },
  { key: 'conjuntivo', label: 'Presente do conjuntivo', ru: 'сослагательное наклонение' },
];

const ER_IR_IMPERFEITO = ['ia', 'ias', 'ia', 'íamos', 'iam'];
const ER_IR_CONJUNTIVO = ['a', 'as', 'a', 'amos', 'am'];

const ENDINGS = {
  ar: {
    presente: ['o', 'as', 'a', 'amos', 'am'],
    perfeito: ['ei', 'aste', 'ou', 'ámos', 'aram'],
    imperfeito: ['ava', 'avas', 'ava', 'ávamos', 'avam'],
    conjuntivo: ['e', 'es', 'e', 'emos', 'em'],
    participio: 'ado',
    gerundio: 'ando',
  },
  er: {
    presente: ['o', 'es', 'e', 'emos', 'em'],
    perfeito: ['i', 'este', 'eu', 'emos', 'eram'],
    imperfeito: ER_IR_IMPERFEITO,
    conjuntivo: ER_IR_CONJUNTIVO,
    participio: 'ido',
    gerundio: 'endo',
  },
  ir: {
    presente: ['o', 'es', 'e', 'imos', 'em'],
    perfeito: ['i', 'iste', 'iu', 'imos', 'iram'],
    imperfeito: ER_IR_IMPERFEITO,
    conjuntivo: ER_IR_CONJUNTIVO,
    participio: 'ido',
    gerundio: 'indo',
  },
};

// Будущее и условное образуются от инфинитива целиком.
const FUTURO = ['ei', 'ás', 'á', 'emos', 'ão'];
const CONDICIONAL = ['ia', 'ias', 'ia', 'íamos', 'iam'];

// Орфографические замены на стыке основы и окончания:
// ficar → fiquei, chegar → cheguei, começar → comecei,
// conhecer → conheço, proteger → protejo, erguer → ergo.
function join(stem, ending, group) {
  const first = ending[0];
  if (group === 'ar' && first === 'e') {
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'qu' + ending;
    if (stem.endsWith('ç')) return stem.slice(0, -1) + 'c' + ending;
    if (stem.endsWith('g')) return stem + 'u' + ending;
  }
  if (group !== 'ar' && (first === 'a' || first === 'o')) {
    if (stem.endsWith('gu')) return stem.slice(0, -2) + 'g' + ending;
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'ç' + ending;
    if (stem.endsWith('g')) return stem.slice(0, -1) + 'j' + ending;
  }
  return stem + ending;
}

// Возвращает { presente: [5 форм], ..., participio, gerundio }.
// Для инфинитивов вне трёх групп (pôr) берутся только явно заданные формы.
export function conjugate(infinitive, overrides = {}) {
  const group = infinitive.slice(-2);
  const regular = ENDINGS[group];
  const stem = infinitive.slice(0, -2);
  const result = {};

  for (const { key } of TENSES) {
    if (overrides[key]) result[key] = overrides[key];
    else if (!regular) continue;
    else if (key === 'futuro') result[key] = FUTURO.map((e) => infinitive + e);
    else if (key === 'condicional') result[key] = CONDICIONAL.map((e) => infinitive + e);
    else result[key] = regular[key].map((e) => join(stem, e, group));
  }

  result.participio = overrides.participio ?? (regular ? stem + regular.participio : undefined);
  result.gerundio = overrides.gerundio ?? (regular ? stem + regular.gerundio : undefined);
  return result;
}

// Все формы глагола одним списком — для поиска по формам (fiz → fazer).
export function allForms(conjugation) {
  const forms = TENSES.flatMap(({ key }) => conjugation[key] ?? []);
  if (conjugation.participio) forms.push(conjugation.participio);
  if (conjugation.gerundio) forms.push(conjugation.gerundio);
  return forms;
}

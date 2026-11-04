// Тест на спряжение: показывается глагол, время и лицо — пользователь вводит форму.
// Логика вопросов и проверки ответов вынесена в чистые функции (их покрывают автотесты),
// initQuiz подключает её к странице.
import { PERSONS, IMPERATIVE_PERSONS, TENSES, IMPERATIVES } from './conjugation.js';
import { normalize } from './dictionary.js';
import { escapeHtml } from './format.js';
import { speak } from './speech.js';

export const QUIZ_TENSES = [...TENSES, IMPERATIVES[0]];

const SETTINGS_KEY = 'dicionario.quiz.settings';
const DEFAULT_SETTINGS = { tenses: ['presente', 'perfeito'], set: 'all', vos: false };
const ACCENTS = ['á', 'à', 'â', 'ã', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç'];

// Неправильным считаем глагол, у которого в словаре задана хотя бы одна форма времени.
export function isIrregular(entry) {
  const overrides = entry.conjugation ?? {};
  return QUIZ_TENSES.some(({ key }) => key in overrides);
}

export function filterVerbs(entries, set) {
  const verbs = entries.filter((e) => e.pos === 'verb');
  if (set === 'irregular') return verbs.filter(isIrregular);
  if (set === 'regular') return verbs.filter((e) => !isIrregular(e));
  return verbs;
}

// Возвращает { entry, tense, persons, personIndex, answer } или null, если выбирать не из чего.
export function makeQuestion(verbs, { tenses, vos }, random = Math.random) {
  const pickFrom = (list) => list[Math.floor(random() * list.length)];
  const enabled = QUIZ_TENSES.filter((t) => tenses.includes(t.key));
  if (!verbs.length || !enabled.length) return null;

  const entry = pickFrom(verbs);
  const available = enabled.filter((t) => entry.conjugated[t.key]);
  if (!available.length) return null;
  const tense = pickFrom(available);

  const imperative = tense.key === 'imperativo';
  const persons = imperative ? IMPERATIVE_PERSONS : PERSONS;
  const vosIndex = persons.indexOf('vós');
  const indices = persons.map((_, i) => i).filter((i) => vos || i !== vosIndex);
  const personIndex = pickFrom(indices);

  return { entry, tense, persons, personIndex, answer: entry.conjugated[tense.key][personIndex] };
}

// 'correct' — точное совпадение, 'accent' — верно без учёта диакритики, 'wrong' — неверно.
export function checkAnswer(expected, given) {
  const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean(given)) return 'wrong';
  if (clean(given) === clean(expected)) return 'correct';
  if (normalize(given).replace(/\s+/g, ' ') === normalize(expected)) return 'accent';
  return 'wrong';
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Хранилище недоступно — настройки действуют до перезагрузки.
  }
}

export function initQuiz(entries, root) {
  const tensesBox = root.querySelector('#quiz-tenses');
  const setSelect = root.querySelector('#quiz-set');
  const vosToggle = root.querySelector('#quiz-vos');
  const questionBox = root.querySelector('#quiz-question');
  const form = root.querySelector('#quiz-form');
  const input = root.querySelector('#quiz-input');
  const accents = root.querySelector('#quiz-accents');
  const revealButton = root.querySelector('#quiz-reveal');
  const submitButton = root.querySelector('#quiz-submit');
  const feedback = root.querySelector('#quiz-feedback');
  const scoreLine = root.querySelector('#quiz-score');
  const resetButton = root.querySelector('#quiz-reset');

  const settings = loadSettings();
  const score = { correct: 0, total: 0, streak: 0 };
  let question = null;
  let answered = false;

  tensesBox.innerHTML = QUIZ_TENSES.map(({ key, label, ru }) => `
    <label class="checkbox" title="${ru}">
      <input type="checkbox" value="${key}" ${settings.tenses.includes(key) ? 'checked' : ''}>
      <span lang="pt">${label}</span>
    </label>`).join('');
  setSelect.value = settings.set;
  vosToggle.checked = settings.vos;
  accents.innerHTML = ACCENTS.map((c) => `<button type="button" tabindex="-1">${c}</button>`).join('');

  function renderScore() {
    const percent = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    scoreLine.textContent = score.total
      ? `Верно ${score.correct} из ${score.total} (${percent}%) · серия ${score.streak}`
      : 'Ответьте на первый вопрос';
  }

  function next() {
    question = makeQuestion(filterVerbs(entries, settings.set), settings);
    answered = false;
    feedback.className = 'quiz-feedback';
    feedback.innerHTML = '';
    input.value = '';
    input.readOnly = false;
    submitButton.textContent = 'Проверить';
    revealButton.disabled = false;

    if (!question) {
      questionBox.innerHTML = '<p class="quiz-empty">Выберите хотя бы одно время в настройках теста.</p>';
      input.disabled = submitButton.disabled = revealButton.disabled = true;
      return;
    }
    input.disabled = submitButton.disabled = false;

    const { entry, tense, persons, personIndex } = question;
    questionBox.innerHTML = `
      <span class="quiz-verb speak" lang="pt" title="Прослушать">${escapeHtml(entry.word)}</span>
      <span class="quiz-translation">${escapeHtml(entry.translations.join(', '))}</span>
      <span class="quiz-tags">
        <span class="quiz-tag" lang="pt" title="${tense.ru}">${tense.label}</span>
        <span class="quiz-tag quiz-person" lang="pt">${persons[personIndex]}</span>
      </span>`;
    input.focus();
  }

  function finish(result) {
    answered = true;
    score.total += 1;
    if (result === 'wrong') score.streak = 0;
    else {
      score.correct += 1;
      score.streak += 1;
    }

    const answer = `<b class="speak" lang="pt">${escapeHtml(question.answer)}</b>`;
    const table = `<a href="?q=${encodeURIComponent(question.entry.word)}">таблица спряжения</a>`;
    const messages = {
      correct: `Верно! ${answer}`,
      accent: `Верно, но обратите внимание на диакритику: ${answer}`,
      wrong: `Неверно. Правильно: ${answer} · ${table}`,
    };
    feedback.className = `quiz-feedback ${result}`;
    feedback.innerHTML = messages[result];
    input.readOnly = true;
    submitButton.textContent = 'Дальше →';
    revealButton.disabled = true;
    renderScore();
    speak(question.answer, feedback.querySelector('.speak'));
    submitButton.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!question) return;
    if (answered) {
      next();
      return;
    }
    if (!input.value.trim()) {
      input.focus();
      return;
    }
    finish(checkAnswer(question.answer, input.value));
  });

  revealButton.addEventListener('click', () => {
    if (question && !answered) finish('wrong');
  });

  // Вставка букв с диакритикой в позицию курсора; mousedown не забирает фокус у поля.
  accents.addEventListener('mousedown', (event) => event.preventDefault());
  accents.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || input.readOnly || input.disabled) return;
    const { selectionStart: start, selectionEnd: end, value } = input;
    input.value = value.slice(0, start) + button.textContent + value.slice(end);
    input.setSelectionRange(start + 1, start + 1);
    input.focus();
  });

  function updateSettings() {
    settings.tenses = [...tensesBox.querySelectorAll('input:checked')].map((i) => i.value);
    settings.set = setSelect.value;
    settings.vos = vosToggle.checked;
    saveSettings(settings);
    next();
  }
  tensesBox.addEventListener('change', updateSettings);
  setSelect.addEventListener('change', updateSettings);
  vosToggle.addEventListener('change', updateSettings);

  resetButton.addEventListener('click', () => {
    Object.assign(score, { correct: 0, total: 0, streak: 0 });
    renderScore();
    next();
  });

  renderScore();
  next();
}

// Интерфейс: поле поиска, переключатель направления, вывод карточек.
import { loadDictionary, search } from './dictionary.js';
import { PERSONS, TENSES } from './conjugation.js';

const POS_LABELS = {
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

const GENDER_LABELS = { m: 'м. р.', f: 'ж. р.' };

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const status = document.getElementById('status');
const results = document.getElementById('results');

let entries = [];

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function renderConjugation(conjugated) {
  const tables = TENSES.filter(({ key }) => conjugated[key])
    .map(({ key, label, ru }) => {
      const rows = conjugated[key]
        .map((form, i) => `<tr><td class="person">${PERSONS[i]}</td><td lang="pt">${escapeHtml(form)}</td></tr>`)
        .join('');
      return `
        <table class="tense">
          <caption><span lang="pt">${label}</span><small>${ru}</small></caption>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join('');

  const extra = [
    conjugated.participio && `Particípio: <b lang="pt">${escapeHtml(conjugated.participio)}</b>`,
    conjugated.gerundio && `Gerúndio: <b lang="pt">${escapeHtml(conjugated.gerundio)}</b>`,
  ].filter(Boolean).join(' · ');

  return `
    <details class="conjugation">
      <summary>Спряжение</summary>
      <div class="tenses">${tables}</div>
      ${extra ? `<p class="verb-forms">${extra}</p>` : ''}
    </details>`;
}

function renderEntry(entry) {
  const meta = [POS_LABELS[entry.pos] ?? entry.pos, GENDER_LABELS[entry.gender]]
    .filter(Boolean)
    .join(', ');

  const examples = (entry.examples ?? [])
    .map((ex) => `<li><span class="pt">${escapeHtml(ex.pt)}</span> — ${escapeHtml(ex.ru)}</li>`)
    .join('');

  return `
    <li class="entry">
      <div class="entry-head">
        <h2 class="entry-word" lang="pt">${escapeHtml(entry.word)}</h2>
        ${meta ? `<span class="entry-meta">${escapeHtml(meta)}</span>` : ''}
      </div>
      <p class="entry-translations">${entry.translations.map(escapeHtml).join(', ')}</p>
      ${examples ? `<ul class="entry-examples">${examples}</ul>` : ''}
      ${entry.conjugated ? renderConjugation(entry.conjugated) : ''}
    </li>`;
}

function currentMode() {
  return form.querySelector('input[name="mode"]:checked').value;
}

function update() {
  const query = input.value;
  const found = search(entries, query, currentMode());

  results.innerHTML = found.map(renderEntry).join('');
  if (!query.trim()) {
    status.textContent = `В словаре ${entries.length} слов. Начните вводить слово.`;
  } else if (!found.length) {
    status.textContent = 'Ничего не найдено.';
  } else {
    status.textContent = `Найдено: ${found.length}`;
  }

  const url = new URL(location.href);
  if (query.trim()) url.searchParams.set('q', query.trim());
  else url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

async function init() {
  status.textContent = 'Загрузка словаря…';
  try {
    entries = await loadDictionary();
  } catch (error) {
    status.textContent = error.message;
    return;
  }

  const initial = new URLSearchParams(location.search).get('q');
  if (initial) input.value = initial;

  input.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault());
  update();
}

init();

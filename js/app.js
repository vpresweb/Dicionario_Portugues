// Интерфейс: вкладки «Словарь» и «Карточки», поиск, вывод статей.
import { loadDictionary, search } from './dictionary.js';
import { PERSONS, IMPERATIVE_PERSONS, TENSES, IMPERATIVES } from './conjugation.js';
import { escapeHtml, entryMeta } from './format.js';
import { initCards } from './cards.js';
import { initSpeech } from './speech.js';

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const status = document.getElementById('status');
const results = document.getElementById('results');
const views = {
  dictionary: document.getElementById('dictionary-view'),
  cards: document.getElementById('cards-view'),
};
const tabs = document.querySelectorAll('[data-view]');

let entries = [];
let cardsStarted = false;

function renderTable({ label, ru }, forms, persons) {
  const rows = forms
    .map((form, i) => `<tr><td class="person">${persons[i]}</td><td class="speak" lang="pt">${escapeHtml(form)}</td></tr>`)
    .join('');
  return `
    <table class="tense">
      <caption><span lang="pt">${label}</span><small>${ru}</small></caption>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderConjugation(conjugated) {
  const tables = [
    ...TENSES.filter(({ key }) => conjugated[key]).map((t) => renderTable(t, conjugated[t.key], PERSONS)),
    ...IMPERATIVES.filter(({ key }) => conjugated[key]).map((t) => renderTable(t, conjugated[t.key], IMPERATIVE_PERSONS)),
  ].join('');

  const extra = [
    conjugated.participio && `Particípio: <b class="speak" lang="pt">${escapeHtml(conjugated.participio)}</b>`,
    conjugated.gerundio && `Gerúndio: <b class="speak" lang="pt">${escapeHtml(conjugated.gerundio)}</b>`,
  ].filter(Boolean).join(' · ');

  return `
    <details class="conjugation">
      <summary>Спряжение</summary>
      <div class="tenses">${tables}</div>
      ${extra ? `<p class="verb-forms">${extra}</p>` : ''}
    </details>`;
}

function renderEntry(entry) {
  const meta = entryMeta(entry);
  const examples = (entry.examples ?? [])
    .map((ex) => `<li><span class="pt speak" lang="pt">${escapeHtml(ex.pt)}</span> — ${escapeHtml(ex.ru)}</li>`)
    .join('');

  return `
    <li class="entry">
      <div class="entry-head">
        <h2 class="entry-word speak" lang="pt" tabindex="0" title="Прослушать">${escapeHtml(entry.word)}</h2>
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

// Вкладка выбирается по хэшу: #cards — карточки, иначе словарь.
function showView() {
  const name = location.hash === '#cards' ? 'cards' : 'dictionary';
  for (const [key, view] of Object.entries(views)) view.hidden = key !== name;
  for (const tab of tabs) tab.setAttribute('aria-current', tab.dataset.view === name ? 'page' : 'false');
  if (name === 'cards' && entries.length && !cardsStarted) {
    cardsStarted = true;
    initCards(entries, views.cards);
  }
}

async function init() {
  initSpeech(document.getElementById('speech-note'));
  showView();
  window.addEventListener('hashchange', showView);

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
  showView();
}

init();

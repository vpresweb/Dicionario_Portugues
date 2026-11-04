// Озвучивание португальского текста через Web Speech API браузера.
// Любой элемент с классом .speak озвучивается по нажатию (делегирование на document),
// элементы с tabindex — ещё и по Enter.

const PREFERRED_LANGS = ['pt-pt', 'pt-br'];

let voice = null;

const supported = () => 'speechSynthesis' in window;
const langOf = (v) => v.lang.replace('_', '-').toLowerCase();

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  for (const lang of PREFERRED_LANGS) {
    const found = voices.find((v) => langOf(v) === lang);
    if (found) return found;
  }
  return voices.find((v) => langOf(v).startsWith('pt')) ?? null;
}

export function speak(text, element) {
  if (!supported() || !text) return;
  voice ??= pickVoice();
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? 'pt-PT';
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;

  if (element) {
    element.classList.add('speaking');
    const done = () => element.classList.remove('speaking');
    utterance.addEventListener('end', done);
    utterance.addEventListener('error', done);
  }
  speechSynthesis.speak(utterance);
}

function speakElement(element) {
  speak(element.dataset.speak ?? element.textContent.trim(), element);
}

// note — элемент, который показывается, если в системе нет португальского голоса.
export function initSpeech(note) {
  if (!supported()) {
    document.documentElement.classList.add('no-speech');
    if (note) {
      note.textContent = 'Браузер не поддерживает озвучивание.';
      note.hidden = false;
    }
    return;
  }

  // Список голосов в Chrome приходит асинхронно, поэтому проверяем и сразу, и по событию.
  const checkVoices = () => {
    if (!speechSynthesis.getVoices().length) return;
    voice = pickVoice();
    if (note) note.hidden = Boolean(voice);
  };
  checkVoices();
  speechSynthesis.addEventListener('voiceschanged', checkVoices);

  document.addEventListener('click', (event) => {
    const element = event.target.closest('.speak');
    if (element) speakElement(element);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const element = event.target.closest('.speak[tabindex]');
    if (element) speakElement(element);
  });
}

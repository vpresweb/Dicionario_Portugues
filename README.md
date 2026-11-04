# Dicionario_Portugues

Интерактивный словарь португальского языка, работает через web.

## Возможности

- поиск в обе стороны: PT → RU и RU → PT;
- поиск без учёта регистра и диакритики (`acao` найдёт `ação`);
- части речи, род, примеры употребления;
- спряжение глаголов в шести временах и наклонениях, причастие и герундий;
- поиск по формам глагола (`fiz` найдёт `fazer`);
- ссылка на результат поиска (`?q=слово`).

Онлайн: https://vpresweb.github.io/Dicionario_Portugues/

## Структура

```
index.html            страница приложения
css/style.css         стили (светлая и тёмная тема)
js/app.js             интерфейс: поиск и вывод карточек
js/dictionary.js      загрузка словаря и логика поиска
js/conjugation.js     спряжение глаголов
data/dictionary.json  словарные статьи
```

## Формат статьи

```json
{
  "word": "casa",
  "pos": "noun",
  "gender": "f",
  "translations": ["дом", "жилище"],
  "examples": [{ "pt": "Vou para casa.", "ru": "Я иду домой." }]
}
```

`pos`: `noun`, `verb`, `adj`, `adv`, `prep`, `pron`, `conj`, `interj`, `num`, `phrase`. `gender` (`m`/`f`) и `examples` необязательны.

## Спряжение

Формы строятся по европейскому варианту португальского для лиц eu, tu, ele/ela/você, nós, eles/elas/vocês
(форма vós не выводится). Времена: presente, pretérito perfeito, pretérito imperfeito, futuro, condicional,
presente do conjuntivo.

Правильные глаголы на `-ar`, `-er`, `-ir` спрягаются автоматически, включая орфографические замены
(`ficar` → `fiquei`, `conhecer` → `conheço`). Для неправильных глаголов отличающиеся формы задаются
в поле `conjugation`, остальные генерируются:

```json
{
  "word": "fazer",
  "pos": "verb",
  "translations": ["делать"],
  "conjugation": {
    "presente": ["faço", "fazes", "faz", "fazemos", "fazem"],
    "participio": "feito"
  }
}
```

Ключи: `presente`, `perfeito`, `imperfeito`, `futuro`, `condicional`, `conjuntivo` (по пять форм), `participio`, `gerundio`.

## Запуск

Приложение статическое, сборка не нужна. Словарь загружается через `fetch`, поэтому страницу нужно открывать через локальный сервер, а не как файл:

```
python -m http.server 8000
```

Затем откройте http://localhost:8000.

## Лицензия

[MIT](LICENSE)

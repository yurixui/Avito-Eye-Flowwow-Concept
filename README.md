# Avito Eye — кликабельный прототип

Веб-прототип фичи визуального поиска Avito: наводишь камеру на вещь → приложение находит похожие объявления. 3 экрана флоу: Start → Home → Camera.

Источник дизайна: [Figma](https://www.figma.com/design/qwv5EppCL3wkJk7vq87qnu/?node-id=677-4810), дизайн-система — Avito Nephakt.

## Стек

- Vite + React + TypeScript
- react-router-dom — роутинг между экранами (`/`, `/home`, `/camera`)
- CSS Modules + CSS custom properties (`src/shared/tokens`) — без Tailwind, токены 1:1 с Figma variables
- zustand — общее состояние (сфотканное изображение, избранное)
- framer-motion — переходы между экранами (пока не подключены)
- `getUserMedia` — реальный доступ к камере устройства на экране Camera

## Структура

```
src/
├── app/            # роутер, App shell, PhoneShell (рамка «как в телефоне» на десктопе)
├── screens/        # 1 экран Figma = 1 папка (start/home/camera)
├── shared/
│   ├── ui/         # переиспользуемые примитивы дизайн-системы
│   ├── icons/      # SVG-иконки из Figma как React-компоненты
│   ├── tokens/     # colors/typography/spacing.css — токены из Figma variables
│   └── hooks/      # useCamera и т.п.
├── entities/       # доменные сущности (product) + моки данных
├── state/          # zustand store
└── styles/         # global.css, fonts.css (@font-face)
```

## Статус экранов

- **Start** — заглушка с CTA «Начать» → переход на Home. Полная вёрстка (градиент, лого) — TODO.
- **Home** — заглушка с FAB-кнопкой «Eye» → переход на Camera. SearchBar/CategoryGrid/ProductGrid/TabBar — TODO.
- **Camera** — рабочий `getUserMedia`-видоискатель + кнопка закрытия → назад на Home. Рамка кадрирования и нижняя панель инструментов — TODO.

## Шрифты

`Manrope Cut 008` (Medium/ExtraBold) и `Aeroport` (trial-версия) лежат в `public/fonts`, подключены через `src/styles/fonts.css`. ⚠️ Aeroport — trial-файлы, для продакшена нужна лицензия.

## Запуск

```bash
npm install
npm run dev
```

Для теста камеры на реальном телефоне через `--host`: браузеры разрешают `getUserMedia` только на `localhost` или по HTTPS — при тесте по LAN IP понадобится HTTPS-туннель (например `vite --host` + ngrok) либо `chrome://inspect` port forwarding с ноутбука.

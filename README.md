# Chomsky Grammar

Приложение для работы с грамматиками Хомского.

## Сборка проекта

### Установка зависимостей

```bash
npm install
```

### Команды для разработки

- `npm run build` - Обычная сборка для разработки
- `npm run dev` - Запуск в режиме отладки с hot-reload

### Команды для создания исполняемых файлов

- `npm run pack:windows` - Создание портативной версии для Windows
- `npm run pack:linux` - Создание портативной версии для Linux (AppImage)
- `npm run pack:mac` - Создание портативной версии для macOS

## Запуск готового приложения

### Windows

1. Запустите команду `npm run pack:windows`
2. Перейдите в папку `release/win-unpacked/`
3. Запустите файл `Chomsky Grammar.exe`

### Linux

1. Запустите команду `npm run pack:linux`
2. Перейдите в папку `release/`
3. Запустите файл `Chomsky Grammar-*.AppImage`

### macOS

1. Запустите команду `npm run pack:mac`
2. Перейдите в папку `release/mac/`
3. Запустите приложение `Chomsky Grammar.app`

## Особенности

- Все файлы в папке `win-unpacked` необходимы для работы приложения
- Для распространения можно архивировать всю папку `win-unpacked`
- AppImage для Linux является самодостаточным файлом
- Приложение не требует установки, является портативным

## Технологии

- Electron
- React
- TypeScript
- Webpack

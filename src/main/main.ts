import { app, BrowserWindow, Menu, dialog } from "electron";
import * as path from "path";

let mainWindow: BrowserWindow;

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Инфо",
      submenu: [
        {
          label: "Использование",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Использование",
              message: "Инструкция по использованию",
              detail:
                "Это приложение предназначено для работы с грамматикой Хомского.\n\n" +
                "1. Введите свои данные на стартовой странице\n" +
                '2. Выберите "Ввод грамматики" для определения правил\n' +
                '3. Выберите "Построение слов" для генерации слов по правилам',
            });
          },
        },
        {
          label: "О программе",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "О программе",
              message: "Грамматика Хомского",
              detail:
                "Лабораторная работа по изучению формальных грамматик.\n\n" +
                "Версия: 1.0.0\n" +
                "Технологии: Electron, React, TypeScript",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  // Создание окна браузера
  mainWindow = new BrowserWindow({
    height: 1000,
    width: 600,
    resizable: false, // Запрет изменения размера
    maximizable: false, // Запрет разворачивания на весь экран
    center: true, // Центрирование окна
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Создание меню
  createMenu();

  // Загрузка index.html приложения
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Открытие DevTools в режиме разработки
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

// Этот метод будет вызван, когда Electron завершит инициализацию
app.whenReady().then(createWindow);

// Завершение работы, когда все окна закрыты
app.on("window-all-closed", () => {
  // На macOS приложения и их строка меню остаются активными
  // пока пользователь не завершит их явно с помощью Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // На macOS обычно пересоздают окно в приложении,
  // когда иконка в доке нажата и других окон не открыто
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

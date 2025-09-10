import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Создание окна браузера
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    resizable: false, // Запрет изменения размера
    maximizable: false, // Запрет разворачивания на весь экран
    center: true, // Центрирование окна
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

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

// IPC примеры
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

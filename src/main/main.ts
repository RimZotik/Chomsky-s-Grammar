import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";

// Отключаем GPU на Windows для избежания ошибок (ДО инициализации)
if (process.platform === "win32") {
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-gpu-sandbox");
  app.commandLine.appendSwitch("disable-software-rasterizer");
}

let mainWindow: BrowserWindow;

function setupIpcHandlers() {
  // Очищаем существующие обработчики перед регистрацией новых
  ipcMain.removeAllListeners("get-app-version");
  ipcMain.removeAllListeners("save-app-data");
  ipcMain.removeAllListeners("load-app-data");

  // IPC обработчики
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("save-app-data", async (event, data) => {
    try {
      const result = (await dialog.showSaveDialog(mainWindow, {
        title: "Сохранить данные приложения",
        defaultPath: "grammar-data.json",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      })) as unknown as { canceled: boolean; filePath?: string };

      if (result.canceled || !result.filePath) {
        return { success: false, cancelled: true };
      }

      await fs.promises.writeFile(
        result.filePath,
        JSON.stringify(data, null, 2),
        "utf8"
      );
      return { success: true, path: result.filePath };
    } catch (error: any) {
      console.error("Ошибка при сохранении файла:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("load-app-data", async () => {
    try {
      const result = (await dialog.showOpenDialog(mainWindow, {
        title: "Открыть данные приложения",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile"],
      })) as unknown as { canceled: boolean; filePaths: string[] };

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, cancelled: true };
      }

      const filePath = result.filePaths[0];
      const fileContent = await fs.promises.readFile(filePath, "utf8");
      const data = JSON.parse(fileContent);

      return { success: true, data, path: filePath };
    } catch (error: any) {
      console.error("Ошибка при загрузке файла:", error);
      return { success: false, error: error.message };
    }
  });
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Файл",
      submenu: [
        {
          label: "Сохранить",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow.webContents.send("menu-save");
          },
        },
        {
          label: "Открыть",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            mainWindow.webContents.send("menu-open");
          },
        },
        { type: "separator" },
        {
          label: "Выход",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Инфо",
      click: () => {
        dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "Информация о программе",
          message: "Грамматика Хомского",
          detail:
            "Это приложение предназначено для работы с формальными грамматиками.\n\n" +
            "Инструкция по использованию:\n" +
            "1. Введите свои данные на стартовой странице\n" +
            "2. Выберите 'Ввод грамматики' для определения четверки (VT, VN, P, S)\n" +
            "3. Выберите 'Построение слов' для генерации слов по правилам грамматики\n\n" +
            "Особенности символов:\n" +
            "• ъ преобразуется в 'ε' (эпсилон)\n" +
            "• Пробел преобразуется в '_'\n" +
            "Используйте меню 'Файл' для сохранения и загрузки данных.\n\n" +
            "Разработал Ефремов Никита Александрович ИВТб-3302 и \nМартьянов Максим Владиславович ИВТб-3302",
        });
      },
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  // Создание окна браузера
  mainWindow = new BrowserWindow({
    height: 800,
    width: 600,
    resizable: true, // Запрет изменения размера
    maximizable: false, // Запрет разворачивания на весь экран
    center: true, // Центрирование окна
    show: false, // Не показывать окно до полной загрузки
    backgroundColor: "#f8fafc", // Цвет фона для избежания мигания
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Показать окно только после полной загрузки
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
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
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
});

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

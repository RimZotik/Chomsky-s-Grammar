import { contextBridge, ipcRenderer } from "electron";

// Определение API для рендер-процесса
const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  // Методы для работы с файлами
  saveAppData: (data: any) => ipcRenderer.invoke("save-app-data", data),
  loadAppData: () => ipcRenderer.invoke("load-app-data"),

  // Слушатели событий меню
  onMenuSave: (callback: () => void) => {
    // Удаляем все предыдущие обработчики этого события перед добавлением нового
    ipcRenderer.removeAllListeners("menu-save");
    ipcRenderer.on("menu-save", callback);
    return () => ipcRenderer.removeAllListeners("menu-save");
  },
  onMenuOpen: (callback: () => void) => {
    // Удаляем все предыдущие обработчики этого события перед добавлением нового
    ipcRenderer.removeAllListeners("menu-open");
    ipcRenderer.on("menu-open", callback);
    return () => ipcRenderer.removeAllListeners("menu-open");
  },
};

// Экспорт API в window объект
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Типы для TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

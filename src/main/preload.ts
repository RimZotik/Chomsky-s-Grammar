import { contextBridge, ipcRenderer } from "electron";

// Определение API для рендер-процесса
const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  // Методы для работы с файлами
  saveAppData: (data: any) => ipcRenderer.invoke("save-app-data", data),
  loadAppData: () => ipcRenderer.invoke("load-app-data"),

  // Слушатели событий меню
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on("menu-save", callback);
    return () => ipcRenderer.removeListener("menu-save", callback);
  },
  onMenuOpen: (callback: () => void) => {
    ipcRenderer.on("menu-open", callback);
    return () => ipcRenderer.removeListener("menu-open", callback);
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

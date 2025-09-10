import { contextBridge, ipcRenderer } from "electron";

// Определение API для рендер-процесса
const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  // Добавьте здесь другие методы для взаимодействия между процессами
};

// Экспорт API в window объект
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// Типы для TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

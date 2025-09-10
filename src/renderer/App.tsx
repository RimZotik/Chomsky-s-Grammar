import React, { useState, useEffect } from "react";

const App: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    // Получение версии приложения через IPC
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then((version: string) => {
        setAppVersion(version);
      });
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chomsky's Grammar</h1>
        <p>Добро пожаловать в приложение Electron + React + TypeScript!</p>
        {appVersion && <p>Версия приложения: {appVersion}</p>}
      </header>
      <main className="app-main">
        <div className="content">
          <h2>Начальная настройка готова!</h2>
          <p>Теперь вы можете начать разработку вашего приложения.</p>
          <ul>
            <li>✅ Electron настроен</li>
            <li>✅ React настроен</li>
            <li>✅ TypeScript настроен</li>
            <li>✅ Webpack настроен</li>
            <li>✅ Режим разработки готов</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default App;

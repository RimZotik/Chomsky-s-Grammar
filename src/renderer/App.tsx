import React, { useState, useEffect, useCallback, useRef } from "react";
import { UserData, AppPage, Grammar, AppData } from "./types";
import AuthPage from "./pages/AuthPage";
import MenuPage from "./pages/MenuPage";
import GrammarPage from "./pages/GrammarPage";
import WordGenerationPage from "./pages/WordGenerationPage";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>("auth");
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [grammar, setGrammar] = useState<Grammar | undefined>(undefined);
  const [loadedAppData, setLoadedAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentUserRef = useRef<UserData | null>(null);
  const saveAppDataRef = useRef<(() => Promise<void>) | null>(null);
  const loadAppDataRef = useRef<(() => Promise<void>) | null>(null);

  // Обновляем ref при изменении currentUser
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const saveAppData = useCallback(async () => {
    if (!currentUser || !window.electronAPI) return;

    const appData: AppData = {
      user: currentUser,
      grammar,
      settings: {
        // Здесь можно добавить настройки генерации слов и другие параметры
        wordGenerationState: sessionStorage.getItem("wordGenerationState"),
      },
      version: "1.0.0",
    };

    try {
      const result = await window.electronAPI.saveAppData(appData);
      if (result.success) {
        console.log("Данные сохранены:", result.path);
        // Можно добавить уведомление пользователю
      } else if (!result.cancelled) {
        console.error("Ошибка сохранения:", result.error);
        alert("Ошибка при сохранении файла: " + result.error);
      }
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert("Произошла ошибка при сохранении данных");
    }
  }, [currentUser, grammar]);

  // Обновляем ref при изменении функции
  useEffect(() => {
    saveAppDataRef.current = saveAppData;
  }, [saveAppData]);

  const loadAppData = useCallback(async () => {
    if (!window.electronAPI || isLoading) return;

    setIsLoading(true);
    try {
      const result = await window.electronAPI.loadAppData();
      if (result.success) {
        const appData: AppData = result.data;

        // Проверяем версию данных для совместимости
        if (appData.version && appData.user) {
          // Сохраняем все загруженные данные
          setLoadedAppData(appData);
          setCurrentUser(appData.user);
          if (appData.grammar) {
            setGrammar(appData.grammar);
          }
          if (appData.settings?.wordGenerationState) {
            sessionStorage.setItem(
              "wordGenerationState",
              appData.settings.wordGenerationState
            );
          }
          // Переходим на главное меню после успешной загрузки
          setCurrentPage("menu");
          console.log("Данные загружены:", result.path);
          console.log("Пользователь:", appData.user);
          console.log("Грамматика:", appData.grammar);
        } else {
          alert("Неверный формат файла данных");
        }
      } else if (!result.cancelled) {
        console.error("Ошибка загрузки:", result.error);
        alert("Ошибка при загрузке файла: " + result.error);
      }
    } catch (error) {
      console.error("Ошибка при загрузке:", error);
      alert("Произошла ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Обновляем ref при изменении функции
  useEffect(() => {
    loadAppDataRef.current = loadAppData;
  }, [loadAppData]);

  // Очищаем только состояние генерации слов при запуске приложения
  useEffect(() => {
    sessionStorage.removeItem("wordGenerationState");
  }, []);

  // Подписываемся на события меню всегда, независимо от авторизации
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleMenuSave = () => {
      if (currentUserRef.current && saveAppDataRef.current) {
        saveAppDataRef.current();
      } else {
        alert("Для сохранения необходимо авторизоваться");
      }
    };

    const handleMenuOpen = () => {
      if (loadAppDataRef.current) {
        loadAppDataRef.current();
      }
    };

    const unsubscribeSave = window.electronAPI.onMenuSave(handleMenuSave);
    const unsubscribeOpen = window.electronAPI.onMenuOpen(handleMenuOpen);

    return () => {
      unsubscribeSave();
      unsubscribeOpen();
    };
  }, []); // Убираем все зависимости - подписка должна быть только один раз

  const handleLogin = (userData: UserData) => {
    setCurrentUser(userData);
    setCurrentPage("menu");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setGrammar(undefined);
    setLoadedAppData(null);
    sessionStorage.clear(); // Полная очистка при выходе
    setCurrentPage("auth");
  };

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  const handleSaveGrammar = (newGrammar: Grammar) => {
    setGrammar(newGrammar);
    console.log("Грамматика сохранена:", newGrammar);
  };

  const renderCurrentPage = () => {
    if (!currentUser && currentPage !== "auth") {
      return <AuthPage onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case "auth":
        return <AuthPage onLogin={handleLogin} />;

      case "menu":
        return (
          <MenuPage
            user={currentUser!}
            grammar={grammar}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );

      case "grammar":
        return (
          <GrammarPage
            user={currentUser!}
            onNavigate={handleNavigate}
            onSaveGrammar={handleSaveGrammar}
            initialGrammar={grammar}
          />
        );

      case "word-generation":
        return (
          <WordGenerationPage
            user={currentUser!}
            grammar={grammar}
            onNavigate={handleNavigate}
          />
        );

      default:
        return <AuthPage onLogin={handleLogin} />;
    }
  };

  return <div className="app">{renderCurrentPage()}</div>;
};

export default App;

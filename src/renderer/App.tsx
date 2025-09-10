import React, { useState, useEffect } from "react";
import { UserData, AppPage, Grammar } from "./types";
import AuthPage from "./pages/AuthPage";
import MenuPage from "./pages/MenuPage";
import GrammarPage from "./pages/GrammarPage";
import WordGenerationPage from "./pages/WordGenerationPage";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>("auth");
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [grammar, setGrammar] = useState<Grammar | undefined>(undefined);

  // Очищаем sessionStorage при запуске приложения
  useEffect(() => {
    sessionStorage.clear();
  }, []);

  const handleLogin = (userData: UserData) => {
    setCurrentUser(userData);
    setCurrentPage("menu");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setGrammar(undefined);
    sessionStorage.clear();
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

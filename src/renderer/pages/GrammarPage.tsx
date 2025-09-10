import React from "react";
import { UserData, AppPage, Grammar } from "../types";

interface GrammarPageProps {
  user: UserData;
  onNavigate: (page: AppPage) => void;
  onSaveGrammar: (grammar: Grammar) => void;
}

const GrammarPage: React.FC<GrammarPageProps> = ({
  user,
  onNavigate,
  onSaveGrammar,
}) => {
  return (
    <div className="grammar-page">
      <div className="page-container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate("menu")}>
            ← Назад
          </button>
          <h1>Ввод грамматики</h1>
          <div className="user-info-small">
            {user.lastName} {user.firstName}
          </div>
        </div>

        <div className="page-content">
          <p>Здесь будет форма для ввода грамматики (четверки) и правил...</p>
          {/* TODO: Добавить компоненты для ввода грамматики */}
        </div>
      </div>
    </div>
  );
};

export default GrammarPage;

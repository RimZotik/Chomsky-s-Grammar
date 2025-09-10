import React from "react";
import { UserData, AppPage, Grammar } from "../types";

interface WordGenerationPageProps {
  user: UserData;
  grammar?: Grammar;
  onNavigate: (page: AppPage) => void;
}

const WordGenerationPage: React.FC<WordGenerationPageProps> = ({
  user,
  grammar,
  onNavigate,
}) => {
  return (
    <div className="word-generation-page">
      <div className="page-container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate("menu")}>
            ← Назад
          </button>
          <h1>Построение слов</h1>
        </div>

        <div className="page-content">
          {!grammar ? (
            <div className="no-grammar">
              <p>Сначала необходимо определить грамматику</p>
              <button
                className="primary-button"
                onClick={() => onNavigate("grammar")}
              >
                Перейти к вводу грамматики
              </button>
            </div>
          ) : (
            <div>
              <p>
                Здесь будет интерфейс для построения слов по правилам
                грамматики...
              </p>
              {/* TODO: Добавить компоненты для построения слов */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGenerationPage;

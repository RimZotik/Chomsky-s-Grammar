import React from "react";
import { UserData, AppPage } from "../types";

interface MenuPageProps {
  user: UserData;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ user, onNavigate, onLogout }) => {
  return (
    <div className="menu-page">
      <div className="menu-container">
        <div className="menu-header">
          <h1>Грамматика Хомского</h1>
          <div className="user-info">
            <p>
              {user.lastName} {user.firstName} {user.patronymic}
            </p>
            <p className="user-group">Группа: {user.group}</p>
          </div>
        </div>

        <div className="menu-content">
          <h2>Выберите действие</h2>

          <div className="menu-buttons">
            <button
              className="menu-button menu-button--primary"
              onClick={() => onNavigate("grammar")}
            >
              <div className="menu-button-icon">📝</div>
              <div className="menu-button-content">
                <h3>Ввод грамматики</h3>
                <p>Определите четверку и правила грамматики</p>
              </div>
            </button>

            <button
              className="menu-button menu-button--secondary"
              onClick={() => onNavigate("word-generation")}
            >
              <div className="menu-button-icon">🔤</div>
              <div className="menu-button-content">
                <h3>Построение слов</h3>
                <p>Генерация слов по правилам грамматики</p>
              </div>
            </button>
          </div>
        </div>

        <div className="menu-footer">
          <button
            className="logout-button logout-button--danger"
            onClick={onLogout}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;

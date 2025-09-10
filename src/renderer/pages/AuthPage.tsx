import React from "react";
import { UserData } from "../types";

interface AuthPageProps {
  onLogin: (userData: UserData) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [formData, setFormData] = React.useState<UserData>({
    lastName: "",
    firstName: "",
    patronymic: "",
    group: "",
  });

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      formData.lastName.trim() &&
      formData.firstName.trim() &&
      formData.patronymic.trim() &&
      formData.group.trim()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      const userData = {
        lastName: formData.lastName.trim(),
        firstName: formData.firstName.trim(),
        patronymic: formData.patronymic.trim(),
        group: formData.group.trim(),
      };

      console.log("Пользователь авторизован:", {
        user: userData,
        timestamp: new Date().toISOString(),
      });

      onLogin(userData);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Грамматика Хомского</h1>
        <p className="auth-subtitle">Лабораторная работа</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="lastName">Фамилия</label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Введите фамилию"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="firstName">Имя</label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Введите имя"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patronymic">Отчество</label>
            <input
              id="patronymic"
              type="text"
              value={formData.patronymic}
              onChange={(e) => handleInputChange("patronymic", e.target.value)}
              placeholder="Введите отчество"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="group">Группа</label>
            <input
              id="group"
              type="text"
              value={formData.group}
              onChange={(e) => handleInputChange("group", e.target.value)}
              placeholder="Введите группу"
              required
            />
          </div>

          <button
            type="submit"
            className={`auth-button ${
              isFormValid() ? "auth-button--active" : ""
            }`}
            disabled={!isFormValid()}
          >
            Продолжить
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

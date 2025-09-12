import React from "react";
import { UserData } from "../types";
import FieldNotification from "../components/grammar/FieldNotification";

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

  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const validateNameField = (
    value: string,
    fieldName: string
  ): string | null => {
    if (!value.trim()) {
      return `${fieldName} не может быть пустым`;
    }

    // Проверяем, что в поле только русские буквы и пробелы
    const russianLettersRegex = /^[а-яА-ЯёЁ\s]+$/;
    if (!russianLettersRegex.test(value)) {
      return `${fieldName} должно содержать только русские буквы`;
    }

    return null;
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем только русские буквы, пробел и служебные клавиши
    const char = e.key;
    if (
      !/[а-яА-ЯёЁ\s]/.test(char) &&
      char !== "Backspace" &&
      char !== "Delete" &&
      char !== "ArrowLeft" &&
      char !== "ArrowRight" &&
      char !== "Tab"
    ) {
      e.preventDefault();
    }
  };

  const handleNameInputChange = (field: keyof UserData, value: string) => {
    // Фильтруем недопустимые символы - оставляем только русские буквы и пробелы
    const filteredValue = value.replace(/[^а-яА-ЯёЁ\s]/g, "");

    // Обновляем значение в форме только отфильтрованным значением
    setFormData((prev) => ({
      ...prev,
      [field]: filteredValue,
    }));

    // Валидация отфильтрованного значения
    const newErrors = { ...errors };

    let fieldName = "";
    if (field === "lastName") {
      fieldName = "Фамилия";
    } else if (field === "firstName") {
      fieldName = "Имя";
    } else if (field === "patronymic") {
      fieldName = "Отчество";
    }

    const error = validateNameField(filteredValue, fieldName);
    if (error) {
      newErrors[field] = error;
    } else {
      delete newErrors[field];
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    // Для полей ФИО используем специальный обработчик
    if (
      field === "lastName" ||
      field === "firstName" ||
      field === "patronymic"
    ) {
      handleNameInputChange(field, value);
      return;
    }

    // Для остальных полей (группа) - обычная обработка
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    const newErrors = { ...errors };

    if (field === "group") {
      if (!value.trim()) {
        newErrors.group = "Группа не может быть пустой";
      } else {
        delete newErrors.group;
      }
    }

    setErrors(newErrors);
  };

  const isFormValid = () => {
    // Проверяем, что все поля заполнены
    const isAllFieldsFilled =
      formData.lastName.trim() &&
      formData.firstName.trim() &&
      formData.patronymic.trim() &&
      formData.group.trim();

    // Проверяем, что нет ошибок и все поля содержат только допустимые символы
    const hasNoErrors = Object.keys(errors).length === 0;

    // Дополнительная проверка на русские буквы в полях ФИО
    const isNameFieldsValid =
      /^[а-яА-ЯёЁ\s]+$/.test(formData.lastName) &&
      /^[а-яА-ЯёЁ\s]+$/.test(formData.firstName) &&
      /^[а-яА-ЯёЁ\s]+$/.test(formData.patronymic);

    return isAllFieldsFilled && hasNoErrors && isNameFieldsValid;
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
              onKeyPress={handleNameKeyPress}
              placeholder="Фамилия"
              className={errors.lastName ? "error" : ""}
              required
            />
            {errors.lastName && (
              <FieldNotification type="error" message={errors.lastName} />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="firstName">Имя</label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onKeyPress={handleNameKeyPress}
              placeholder="Имя"
              className={errors.firstName ? "error" : ""}
              required
            />
            {errors.firstName && (
              <FieldNotification type="error" message={errors.firstName} />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="patronymic">Отчество</label>
            <input
              id="patronymic"
              type="text"
              value={formData.patronymic}
              onChange={(e) => handleInputChange("patronymic", e.target.value)}
              onKeyPress={handleNameKeyPress}
              placeholder="Отчество"
              className={errors.patronymic ? "error" : ""}
              required
            />
            {errors.patronymic && (
              <FieldNotification type="error" message={errors.patronymic} />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="group">Группа</label>
            <input
              id="group"
              type="text"
              value={formData.group}
              onChange={(e) => handleInputChange("group", e.target.value)}
              placeholder="Введите группу"
              className={errors.group ? "error" : ""}
              required
            />
            {errors.group && (
              <FieldNotification type="error" message={errors.group} />
            )}
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

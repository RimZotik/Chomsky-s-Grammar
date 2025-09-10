import React, { useState, useRef, useEffect } from "react";
import { UserData, AppPage, Grammar, ProductionRule } from "../types";
import FieldNotification from "../components/grammar/FieldNotification";

interface GrammarPageProps {
  user: UserData;
  onNavigate: (page: AppPage) => void;
  onSaveGrammar: (grammar: Grammar) => void;
}

interface GrammarForm {
  terminals: string;
  nonTerminals: string;
  startSymbol: string;
  rules: ProductionRule[];
}

interface NewRule {
  left: string;
  right: string;
}

const GrammarPage: React.FC<GrammarPageProps> = ({
  user,
  onNavigate,
  onSaveGrammar,
}) => {
  const terminalsInputRef = useRef<HTMLInputElement>(null);
  const nonTerminalsInputRef = useRef<HTMLInputElement>(null);

  const [grammarForm, setGrammarForm] = useState<GrammarForm>({
    terminals: "ъ",
    nonTerminals: "S",
    startSymbol: "S",
    rules: [],
  });

  const [newRule, setNewRule] = useState<NewRule>({
    left: "",
    right: "",
  });

  const [showAddRule, setShowAddRule] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Функции для сохранения и загрузки грамматики (отключены)
  const saveGrammarToStorage = (grammar: GrammarForm) => {
    // Сохранение отключено по требованию
    console.log("Сохранение грамматики отключено");
  };

  const loadGrammarFromStorage = (): GrammarForm | null => {
    // Загрузка отключена по требованию
    console.log("Загрузка грамматики отключена");
    return null;
  };

  // Загружаем сохраненную грамматику при монтировании компонента
  useEffect(() => {
    const savedGrammar = loadGrammarFromStorage();
    if (savedGrammar) {
      // Убеждаемся, что S всегда присутствует в нетерминалах
      if (!savedGrammar.nonTerminals.includes("S")) {
        savedGrammar.nonTerminals = savedGrammar.nonTerminals
          ? `S, ${savedGrammar.nonTerminals}`
          : "S";
      }
      savedGrammar.startSymbol = "S"; // Фиксируем начальный символ как S
      setGrammarForm(savedGrammar);
    }
  }, []);

  // Автосохранение при изменении грамматики
  useEffect(() => {
    if (
      grammarForm.terminals ||
      grammarForm.nonTerminals !== "S" ||
      grammarForm.rules.length > 0
    ) {
      saveGrammarToStorage(grammarForm);
    }
  }, [grammarForm]);

  // Валидация терминальных символов (русские строчные буквы + ъ для эпсилон)
  const validateTerminals = (char: string): boolean => {
    return /^[а-я]$/.test(char);
  };

  // Валидация нетерминальных символов (английские заглавные буквы)
  const validateNonTerminals = (char: string): boolean => {
    return /^[A-Z]$/.test(char);
  };

  // Функция для отображения ъ как ε (эпсилон)
  const displayEpsilon = (text: string): string => {
    return text.replace(/ъ/g, "ε");
  };

  // Проверка уникальности символов
  const checkSymbolUniqueness = (
    symbols: string[]
  ): { isUnique: boolean; duplicates: string[] } => {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const symbol of symbols) {
      if (seen.has(symbol)) {
        if (!duplicates.includes(symbol)) {
          duplicates.push(symbol);
        }
      } else {
        seen.add(symbol);
      }
    }

    return { isUnique: duplicates.length === 0, duplicates };
  };

  // Проверка уникальности правил
  const checkRuleUniqueness = (
    rules: ProductionRule[],
    newRule: ProductionRule
  ): boolean => {
    return !rules.some(
      (rule) => rule.left === newRule.left && rule.right === newRule.right
    );
  };

  // Форматирование строки символов с запятыми
  const formatSymbolString = (symbols: string[]): string => {
    return symbols.join(", ");
  };

  // Получение массива символов из строки
  const parseSymbolString = (str: string): string[] => {
    return str.split(", ").filter((s) => s.length > 0);
  };

  // Функция для прокрутки поля к позиции курсора
  const scrollToCursor = (
    inputRef: React.RefObject<HTMLInputElement>,
    cursorPos: number
  ) => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    // Создаем временный span для измерения ширины текста до курсора
    const span = document.createElement("span");
    span.style.font = window.getComputedStyle(input).font;
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.textContent = input.value.substring(0, cursorPos);
    document.body.appendChild(span);

    const textWidth = span.offsetWidth;
    document.body.removeChild(span);

    const inputWidth = input.clientWidth;
    const scrollLeft = Math.max(0, textWidth - inputWidth / 2);
    input.scrollLeft = scrollLeft;
  };

  // Обработка ввода терминальных символов
  const handleTerminalsInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    const key = e.key;
    const cursorPos = input.selectionStart || 0;

    if (key === "Backspace") {
      e.preventDefault();

      if (cursorPos === 0) return; // Нечего удалять слева

      const symbols = parseSymbolString(value);
      if (symbols.length === 0) return;

      // Исправленная логика: находим символ строго слева от курсора
      let targetIndex = -1;
      let currentPos = 0;

      // Проходим по всем символам и находим тот, который заканчивается перед курсором
      for (let i = 0; i < symbols.length; i++) {
        const symbolStart = currentPos;
        const symbolEnd = currentPos + symbols[i].length;
        const nextPos = symbolEnd + (i < symbols.length - 1 ? 2 : 0); // +2 для ", " если есть следующий символ

        // Если курсор находится в пределах символа или сразу после него (включая запятую и пробел)
        if (cursorPos > symbolStart && cursorPos <= nextPos) {
          targetIndex = i;
          break;
        }

        currentPos = nextPos;
      }

      // Если не нашли символ в цикле, значит курсор в самом конце - удаляем последний символ
      if (targetIndex === -1 && symbols.length > 0) {
        targetIndex = symbols.length - 1;
      }

      if (targetIndex >= 0) {
        symbols.splice(targetIndex, 1);
        const newValue = formatSymbolString(symbols);
        setGrammarForm((prev) => ({ ...prev, terminals: newValue }));

        // Устанавливаем курсор в позицию удаленного символа
        setTimeout(() => {
          if (terminalsInputRef.current) {
            const newPos =
              targetIndex === 0
                ? 0
                : symbols.slice(0, targetIndex).join(", ").length +
                  (targetIndex > 0 ? 2 : 0);
            terminalsInputRef.current.setSelectionRange(newPos, newPos);
            scrollToCursor(terminalsInputRef, newPos);
          }
        }, 0);
      }
      return;
    }

    if (key === "Delete") {
      e.preventDefault();

      const symbols = parseSymbolString(value);
      if (symbols.length === 0) return;

      // Простая логика: удаляем символ справа от курсора
      let targetIndex = -1;
      let currentPos = 0;

      // Находим символ, который находится справа от курсора
      for (let i = 0; i < symbols.length; i++) {
        const symbolStart = currentPos;
        const symbolEnd = currentPos + symbols[i].length + (i > 0 ? 2 : 0); // +2 для ", "

        if (cursorPos >= symbolStart && cursorPos < symbolEnd) {
          targetIndex = i;
          break;
        } else if (cursorPos <= symbolStart) {
          targetIndex = i;
          break;
        }
        currentPos = symbolEnd;
      }

      if (targetIndex >= 0) {
        symbols.splice(targetIndex, 1);
        const newValue = formatSymbolString(symbols);
        setGrammarForm((prev) => ({ ...prev, terminals: newValue }));

        // Курсор остается на том же месте
        setTimeout(() => {
          if (terminalsInputRef.current) {
            const newPos =
              targetIndex === 0
                ? 0
                : symbols.slice(0, targetIndex).join(", ").length +
                  (targetIndex > 0 ? 2 : 0);
            terminalsInputRef.current.setSelectionRange(newPos, newPos);
            scrollToCursor(terminalsInputRef, newPos);
          }
        }, 0);
      }
      return;
    }

    if (key.length === 1) {
      e.preventDefault();

      if (validateTerminals(key)) {
        const symbols = parseSymbolString(value);

        // Специальная обработка для символа ъ (эпсилон)
        if (key === "ъ") {
          setErrors((prev) => ({
            ...prev,
            terminals: `Символ "ъ" (эпсилон) уже существует в множестве терминальных символов`,
          }));
          setTimeout(() => {
            setErrors((prev) => ({ ...prev, terminals: "" }));
          }, 3000);
          return;
        }

        // Проверяем дублирование
        if (symbols.includes(key)) {
          setErrors((prev) => ({
            ...prev,
            terminals: `Символ "${key}" уже существует в множестве терминальных символов`,
          }));
          setTimeout(() => {
            setErrors((prev) => ({ ...prev, terminals: "" }));
          }, 3000);
          return;
        }

        // Находим позицию вставки на основе курсора
        let insertIndex = symbols.length;
        let currentPos = 0;

        for (let i = 0; i < symbols.length; i++) {
          const symbolEnd = currentPos + symbols[i].length + (i > 0 ? 2 : 0);
          if (cursorPos <= currentPos + (i > 0 ? 2 : 0)) {
            insertIndex = i;
            break;
          }
          currentPos = symbolEnd;
        }

        symbols.splice(insertIndex, 0, key);
        const newValue = formatSymbolString(symbols);
        setGrammarForm((prev) => ({ ...prev, terminals: newValue }));
        setErrors((prev) => ({ ...prev, terminals: "" }));

        // Устанавливаем курсор после вставленного символа
        setTimeout(() => {
          if (terminalsInputRef.current) {
            const symbolsBeforeAndIncluding = symbols.slice(0, insertIndex + 1);
            const newPos =
              symbolsBeforeAndIncluding.join(", ").length +
              (insertIndex < symbols.length - 1 ? 2 : 0);
            terminalsInputRef.current.setSelectionRange(newPos, newPos);
            scrollToCursor(terminalsInputRef, newPos);
          }
        }, 0);
      } else {
        setErrors((prev) => ({
          ...prev,
          terminals: "Можно вводить только символы из множества русских строчных букв (а-я)",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, terminals: "" }));
        }, 3000);
      }
    }
  };

  // Обработка ввода нетерминальных символов
  const handleNonTerminalsInput = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const input = e.currentTarget;
    const value = input.value;
    const key = e.key;
    const cursorPos = input.selectionStart || 0;

    if (key === "Backspace") {
      e.preventDefault();

      if (cursorPos === 0) return; // Нечего удалять слева

      const symbols = parseSymbolString(value);
      if (symbols.length === 0) return;

      // Исправленная логика: находим символ строго слева от курсора
      let targetIndex = -1;
      let currentPos = 0;

      // Проходим по всем символам и находим тот, который заканчивается перед курсором
      for (let i = 0; i < symbols.length; i++) {
        const symbolStart = currentPos;
        const symbolEnd = currentPos + symbols[i].length;
        const nextPos = symbolEnd + (i < symbols.length - 1 ? 2 : 0); // +2 для ", " если есть следующий символ

        // Если курсор находится в пределах символа или сразу после него (включая запятую и пробел)
        if (cursorPos > symbolStart && cursorPos <= nextPos) {
          targetIndex = i;
          break;
        }

        currentPos = nextPos;
      }

      // Если не нашли символ в цикле, значит курсор в самом конце - удаляем последний символ
      if (targetIndex === -1 && symbols.length > 0) {
        targetIndex = symbols.length - 1;
      }

      // Запрещаем удаление символа S
      if (targetIndex >= 0 && symbols[targetIndex] === "S") {
        setErrors((prev) => ({
          ...prev,
          nonTerminals: "Символ S (начальный символ) нельзя удалять",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, nonTerminals: "" }));
        }, 3000);
        return;
      }

      if (targetIndex >= 0) {
        symbols.splice(targetIndex, 1);
        const newValue = formatSymbolString(symbols);
        setGrammarForm((prev) => ({ ...prev, nonTerminals: newValue }));

        // Устанавливаем курсор в позицию удаленного символа
        setTimeout(() => {
          if (nonTerminalsInputRef.current) {
            const newPos =
              targetIndex === 0
                ? 0
                : symbols.slice(0, targetIndex).join(", ").length +
                  (targetIndex > 0 ? 2 : 0);
            nonTerminalsInputRef.current.setSelectionRange(newPos, newPos);
            scrollToCursor(nonTerminalsInputRef, newPos);
          }
        }, 0);
      }
      return;
    }

    if (key === "Delete") {
      e.preventDefault();

      const symbols = parseSymbolString(value);
      if (symbols.length === 0) return;

      // Простая логика: удаляем символ справа от курсора
      let targetIndex = -1;
      let currentPos = 0;

      // Находим символ, который находится справа от курсора
      for (let i = 0; i < symbols.length; i++) {
        const symbolStart = currentPos;
        const symbolEnd = currentPos + symbols[i].length + (i > 0 ? 2 : 0); // +2 для ", "

        if (cursorPos >= symbolStart && cursorPos < symbolEnd) {
          targetIndex = i;
          break;
        } else if (cursorPos <= symbolStart) {
          targetIndex = i;
          break;
        }
        currentPos = symbolEnd;
      }

      // Запрещаем удаление символа S
      if (targetIndex >= 0 && symbols[targetIndex] === "S") {
        setErrors((prev) => ({
          ...prev,
          nonTerminals: "Символ S (начальный символ) нельзя удалять",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, nonTerminals: "" }));
        }, 3000);
        return;
      }

      if (targetIndex >= 0) {
        symbols.splice(targetIndex, 1);
        const newValue = formatSymbolString(symbols);
        setGrammarForm((prev) => ({ ...prev, nonTerminals: newValue }));

        // Курсор остается на том же месте
        setTimeout(() => {
          if (nonTerminalsInputRef.current) {
            const newPos =
              targetIndex === 0
                ? 0
                : symbols.slice(0, targetIndex).join(", ").length +
                  (targetIndex > 0 ? 2 : 0);
            nonTerminalsInputRef.current.setSelectionRange(newPos, newPos);
            scrollToCursor(nonTerminalsInputRef, newPos);
          }
        }, 0);
      }
      return;
    }

    if (key.length === 1) {
      e.preventDefault();

      if (validateNonTerminals(key)) {
        const symbols = parseSymbolString(value);

        // Проверяем дублирование
        if (symbols.includes(key)) {
          setErrors((prev) => ({
            ...prev,
            nonTerminals: `Символ "${key}" уже существует в множестве нетерминальных символов`,
          }));
          setTimeout(() => {
            setErrors((prev) => ({ ...prev, nonTerminals: "" }));
          }, 3000);
          return;
        }

        // Находим позицию вставки на основе курсора
        let insertIndex = symbols.length;
        let currentPos = 0;

        for (let i = 0; i < symbols.length; i++) {
          const symbolEnd = currentPos + symbols[i].length + (i > 0 ? 2 : 0);
          if (cursorPos <= currentPos + (i > 0 ? 2 : 0)) {
            insertIndex = i;
            break;
          }
          currentPos = symbolEnd;
        }

        symbols.splice(insertIndex, 0, key);
        const newValue = formatSymbolString(symbols);
        setGrammarForm((prev) => ({ ...prev, nonTerminals: newValue }));
        setErrors((prev) => ({ ...prev, nonTerminals: "" }));

        // Устанавливаем курсор после вставленного символа
        setTimeout(() => {
          if (nonTerminalsInputRef.current) {
            const symbolsBeforeAndIncluding = symbols.slice(0, insertIndex + 1);
            const newPos =
              symbolsBeforeAndIncluding.join(", ").length +
              (insertIndex < symbols.length - 1 ? 2 : 0);
            nonTerminalsInputRef.current.setSelectionRange(newPos, newPos);
            scrollToCursor(nonTerminalsInputRef, newPos);
          }
        }, 0);
      } else {
        setErrors((prev) => ({
          ...prev,
          nonTerminals: "Можно вводить только символы из множества английских заглавных букв (A-Z)",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, nonTerminals: "" }));
        }, 3000);
      }
    }
  };

  // Валидация начального символа
  const handleStartSymbolInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "Backspace") {
      setGrammarForm((prev) => ({ ...prev, startSymbol: "" }));
      setErrors((prev) => ({ ...prev, startSymbol: "" }));
      return;
    }

    if (key.length === 1) {
      e.preventDefault();

      if (validateNonTerminals(key)) {
        const nonTerminals = parseSymbolString(grammarForm.nonTerminals);
        if (nonTerminals.includes(key)) {
          setGrammarForm((prev) => ({ ...prev, startSymbol: key }));
          setErrors((prev) => ({ ...prev, startSymbol: "" }));
        } else {
          setErrors((prev) => ({
            ...prev,
            startSymbol: "Символ должен существовать в множестве нетерминальных символов",
          }));
          setTimeout(() => {
            setErrors((prev) => ({ ...prev, startSymbol: "" }));
          }, 3000);
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          startSymbol: "Можно вводить только символы из множества английских заглавных букв (A-Z)",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, startSymbol: "" }));
        }, 3000);
      }
    }
  };

  const getTerminalsList = (): string[] => {
    return parseSymbolString(grammarForm.terminals);
  };

  const getNonTerminalsList = (): string[] => {
    return parseSymbolString(grammarForm.nonTerminals);
  };

  const validateRuleLeft = (value: string): boolean => {
    const nonTerminals = getNonTerminalsList();
    return value.length === 1 && nonTerminals.includes(value);
  };

  const validateRuleRight = (value: string): boolean => {
    const terminals = getTerminalsList();
    const nonTerminals = getNonTerminalsList();
    const allSymbols = [...terminals, ...nonTerminals];

    // Проверяем каждый символ в правой части
    for (let char of value) {
      if (char !== " " && !allSymbols.includes(char)) {
        return false;
      }
    }
    return true;
  };

  const handleRuleInputChange = (field: "left" | "right", value: string) => {
    const newErrors = { ...errors };
    let isValid = true;

    if (field === "left") {
      isValid = validateRuleLeft(value);
      if (!isValid && value.length > 0) {
        newErrors.ruleLeft = "Введите символ из множества нетерминальных символов";
        return;
      } else {
        delete newErrors.ruleLeft;
      }
    } else {
      isValid = validateRuleRight(value);
      if (!isValid) {
        newErrors.ruleRight =
          "Используйте только символы из множеств терминальных и нетерминальных символов";
        return;
      } else {
        delete newErrors.ruleRight;
      }
    }

    if (isValid) {
      setNewRule((prev) => ({
        ...prev,
        [field]: value,
      }));
      setErrors(newErrors);
    }
  };

  const addRule = () => {
    if (newRule.left && newRule.right) {
      // Проверяем циклическое правило (A → A)
      if (newRule.left === newRule.right) {
        setErrors((prev) => ({
          ...prev,
          ruleGeneral: "Нельзя создавать правило из символа в этот же символ",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, ruleGeneral: "" }));
        }, 3000);
        return;
      }

      // Проверяем уникальность правила
      if (!checkRuleUniqueness(grammarForm.rules, newRule)) {
        setErrors((prev) => ({
          ...prev,
          ruleGeneral: `Правило "${newRule.left} → ${newRule.right}" уже существует`,
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, ruleGeneral: "" }));
        }, 3000);
        return;
      }

      // Проверяем ограничение на количество правил (максимум 99)
      if (grammarForm.rules.length >= 99) {
        setErrors((prev) => ({
          ...prev,
          ruleGeneral: "Максимальное количество правил: 99",
        }));
        setTimeout(() => {
          setErrors((prev) => ({ ...prev, ruleGeneral: "" }));
        }, 3000);
        return;
      }

      setGrammarForm((prev) => ({
        ...prev,
        rules: [...prev.rules, { ...newRule }],
      }));
      setNewRule({ left: "", right: "" });
      setShowAddRule(false);
      // Очищаем ошибки при успешном добавлении
      setErrors((prev) => ({
        ...prev,
        ruleLeft: "",
        ruleRight: "",
        ruleGeneral: "",
      }));
    }
  };

  const removeRule = (index: number) => {
    setGrammarForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const clearGrammar = () => {
    const defaultGrammar = {
      terminals: "ъ",
      nonTerminals: "S",
      startSymbol: "S",
      rules: [],
    };
    setGrammarForm(defaultGrammar);
    setNewRule({ left: "", right: "" });
    setShowAddRule(false);
    setErrors({});
    // localStorage.removeItem удален - сохранение отключено
  };

  const saveGrammar = () => {
    const grammar: Grammar = {
      terminals: getTerminalsList(),
      nonTerminals: getNonTerminalsList(),
      startSymbol: grammarForm.startSymbol,
      rules: grammarForm.rules,
    };

    onSaveGrammar(grammar);
    onNavigate("menu");
  };

  const isFormValid = () => {
    // Проверяем, что есть непустые ошибки
    const hasErrors = Object.values(errors).some(
      (error) => error && error.trim().length > 0
    );

    return (
      grammarForm.terminals.length > 0 &&
      grammarForm.nonTerminals.length > 0 &&
      grammarForm.startSymbol.length > 0 &&
      grammarForm.rules.length > 0 &&
      !hasErrors
    );
  };

  return (
    <div className="grammar-page">
      <div className="page-container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate("menu")}>
            ← Назад
          </button>
          <h1>Ввод грамматики</h1>
        </div>

        <div className="page-content">
          <div className="grammar-form">
            <h2>Определение грамматики G = ⟨VT, VN, P, S⟩</h2>

            {/* Терминальные символы */}
            <div className="form-row">
              <label className="form-label">VT (терминальные символы):</label>
              <div className="input-container">
                <input
                  ref={terminalsInputRef}
                  type="text"
                  className={`form-input ${errors.terminals ? "error" : ""}`}
                  value={grammarForm.terminals}
                  onKeyDown={handleTerminalsInput}
                  onChange={() => {}} // Пустая функция, так как изменения обрабатываются в onKeyDown
                  placeholder="а, б, в...."
                />
                {errors.terminals && (
                  <FieldNotification
                    type="error"
                    message={errors.terminals}
                    show={true}
                  />
                )}
              </div>
            </div>

            {/* Нетерминальные символы */}
            <div className="form-row">
              <label className="form-label">VN (нетерминальные символы):</label>
              <div className="input-container">
                <input
                  ref={nonTerminalsInputRef}
                  type="text"
                  className={`form-input ${errors.nonTerminals ? "error" : ""}`}
                  value={grammarForm.nonTerminals}
                  onKeyDown={handleNonTerminalsInput}
                  onChange={() => {}} // Пустая функция, так как изменения обрабатываются в onKeyDown
                  placeholder="A, B, C..."
                />
                {errors.nonTerminals && (
                  <FieldNotification
                    type="error"
                    message={errors.nonTerminals}
                    show={true}
                  />
                )}
              </div>
            </div>

            {/* Начальный символ */}
            <div className="form-row">
              <label className="form-label">S (начальный символ):</label>
              <div className="input-container">
                <input
                  type="text"
                  className="form-input start-symbol readonly"
                  value={grammarForm.startSymbol}
                  readOnly
                  placeholder="S (фиксированный)"
                />
              </div>
            </div>

            {/* Правила вывода */}
            <div className="form-row">
              <label className="form-label">P (правила вывода):</label>
              <div className="rules-container">
                {grammarForm.rules.map((rule, index) => (
                  <div key={index} className="rule-item">
                    <span className="rule-number">{index + 1}.</span>
                    <span className="rule-text">
                      {rule.left} → {displayEpsilon(rule.right)}
                    </span>
                    <button
                      className="remove-rule-btn"
                      onClick={() => removeRule(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {!showAddRule ? (
                  <button
                    className="add-rule-btn"
                    onClick={() => setShowAddRule(true)}
                    disabled={
                      !grammarForm.nonTerminals ||
                      !grammarForm.terminals ||
                      grammarForm.rules.length >= 99
                    }
                  >
                    + Добавить правило
                    {grammarForm.rules.length >= 99 ? " (макс. 99)" : ""}
                  </button>
                ) : (
                  <div className="add-rule-container">
                    {(errors.ruleLeft ||
                      errors.ruleRight ||
                      errors.ruleGeneral) && (
                      <div className="rule-errors-outside">
                        {errors.ruleLeft && (
                          <FieldNotification
                            type="error"
                            message={errors.ruleLeft}
                            show={true}
                          />
                        )}
                        {errors.ruleRight && (
                          <FieldNotification
                            type="error"
                            message={errors.ruleRight}
                            show={true}
                          />
                        )}
                        {errors.ruleGeneral && (
                          <FieldNotification
                            type="error"
                            message={errors.ruleGeneral}
                            show={true}
                          />
                        )}
                      </div>
                    )}
                    <div className="add-rule-form">
                      <input
                        type="text"
                        className={`rule-input left ${
                          errors.ruleLeft ? "error" : ""
                        }`}
                        value={newRule.left}
                        onChange={(e) =>
                          handleRuleInputChange("left", e.target.value)
                        }
                        placeholder="A"
                        maxLength={1}
                      />
                      <span className="arrow">→</span>
                      <input
                        type="text"
                        className={`rule-input right ${
                          errors.ruleRight ? "error" : ""
                        }`}
                        value={newRule.right}
                        onChange={(e) =>
                          handleRuleInputChange("right", e.target.value)
                        }
                        placeholder="aB"
                      />
                      <button
                        className="confirm-rule-btn"
                        onClick={addRule}
                        disabled={!newRule.left || !newRule.right}
                      >
                        ✓
                      </button>
                      <button
                        className="cancel-rule-btn"
                        onClick={() => {
                          setShowAddRule(false);
                          setNewRule({ left: "", right: "" });
                          const newErrors = { ...errors };
                          delete newErrors.ruleLeft;
                          delete newErrors.ruleRight;
                          setErrors(newErrors);
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                className="save-grammar-btn"
                onClick={saveGrammar}
                disabled={!isFormValid()}
              >
                Сохранить грамматику
              </button>
              <button
                className="clear-grammar-btn"
                onClick={clearGrammar}
                title="Очистить все поля и правила"
              >
                Очистить грамматику
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarPage;

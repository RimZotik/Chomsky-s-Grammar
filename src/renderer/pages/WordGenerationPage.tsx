import React, { useState, useEffect, useRef } from "react";
import { UserData, AppPage, Grammar, ProductionRule } from "../types";
import "../styles/pages/word-generation.css";

interface WordGenerationPageProps {
  user: UserData;
  grammar?: Grammar;
  onNavigate: (page: AppPage) => void;
}

interface DerivationStep {
  result: string;
  ruleIndex?: number;
}

interface SavedDerivation {
  id: string;
  steps: DerivationStep[];
  timestamp: number;
  finalWord: string;
}

const WordGenerationPage: React.FC<WordGenerationPageProps> = ({
  user,
  grammar,
  onNavigate,
}) => {
  const [derivationSteps, setDerivationSteps] = useState<DerivationStep[]>([
    { result: "S" },
  ]);
  const [availableRules, setAvailableRules] = useState<ProductionRule[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedDerivations, setSavedDerivations] = useState<SavedDerivation[]>([]);
  const [showSavedWords, setShowSavedWords] = useState(false);
  const savedWordsRef = useRef<HTMLDivElement>(null);

  const derivationScrollRef = useRef<HTMLDivElement>(null);

  // Функция для преобразования номера правила в 16CC формат (1-9, A-Z)
  const numberToHex = (num: number): string => {
    if (num < 1) return "";
    if (num <= 9) return num.toString();
    if (num <= 35) return String.fromCharCode(65 + num - 10); // A-Z для 10-35
    return ""; // Больше 35 не поддерживается
  };

  // Функция для преобразования клавиши в номер правила
  const keyToRuleIndex = (key: string): number => {
    // Цифры 1-9
    if (key >= "1" && key <= "9") {
      return parseInt(key) - 1; // -1 так как индексы начинаются с 0
    }
    // Буквы A-Z (как верхний, так и нижний регистр)
    const upperKey = key.toUpperCase();
    if (upperKey >= "A" && upperKey <= "Z") {
      return upperKey.charCodeAt(0) - 65 + 9; // A=9, B=10, ..., Z=34
    }
    return -1; // Недопустимая клавиша
  };

  // Обработчик нажатий клавиш
  const handleKeyPress = (event: KeyboardEvent) => {
    // Игнорируем если деривация завершена
    if (isCompleted || !grammar) return;

    const ruleIndex = keyToRuleIndex(event.key);
    if (ruleIndex === -1 || ruleIndex >= grammar.rules.length) return;

    const rule = grammar.rules[ruleIndex];
    
    // Применяем правило - функция applyRule сама проверит доступность
    applyRule(rule, ruleIndex);
  };

  // Добавляем и убираем обработчик клавиатуры
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isCompleted, grammar]); // Убрали derivationSteps из зависимостей

  // Функции для сохранения и загрузки состояния генерации
  const saveGenerationState = (
    steps: DerivationStep[],
    derivations: SavedDerivation[],
    completed: boolean
  ) => {
    try {
      const state = {
        derivationSteps: steps,
        savedDerivations: derivations,
        isCompleted: completed,
        grammarId: grammar ? JSON.stringify(grammar.rules) : null, // ID для связи с грамматикой
      };
      sessionStorage.setItem("wordGenerationState", JSON.stringify(state));
    } catch (error) {
      console.log("Ошибка сохранения состояния генерации:", error);
    }
  };

  const loadGenerationState = () => {
    try {
      const savedState = sessionStorage.getItem("wordGenerationState");
      if (savedState && grammar) {
        const state = JSON.parse(savedState);
        const currentGrammarId = JSON.stringify(grammar.rules);

        // Проверяем, что состояние соответствует текущей грамматике
        if (state.grammarId === currentGrammarId) {
          return {
            derivationSteps: state.derivationSteps || [
              { result: grammar.startSymbol || "S" },
            ],
            savedDerivations: state.savedDerivations || [],
            isCompleted: state.isCompleted || false,
          };
        }
      }
    } catch (error) {
      console.log("Ошибка загрузки состояния генерации:", error);
    }
    return null;
  };

  const clearGenerationState = () => {
    sessionStorage.removeItem("wordGenerationState");
  };

  // Функция для отображения ъ как ε (эпсилон) и пробелов как _ в правилах
  const displayEpsilon = (text: string): string => {
    return text.replace(/ъ/g, "ε").replace(/ /g, "_");
  };

  // Функция для отображения финальных слов (пробелы остаются как есть)
  const displayFinalWord = (
    text: string,
    completed: boolean = false
  ): string => {
    const processedText = text.replace(/ъ/g, "ε").replace(/ /g, "\u00A0"); // Заменяем обычные пробелы на неразрывные
    return completed ? processedText + "." : processedText; // Добавляем точку для завершенных слов
  };

  // Функция для отображения слов в списке сохраненных (пробелы остаются пробелами)
  const displaySavedWord = (text: string): string => {
    console.log(
      "Отображение слова:",
      JSON.stringify(text),
      "длина:",
      text.length,
      "коды символов:",
      Array.from(text).map((c) => c.charCodeAt(0))
    );
    // В списке сохраненных слов точка уже должна быть частью слова
    return text.replace(/ъ/g, "ε"); // Заменяем только ъ на ε, пробелы оставляем как есть
  };

  // Инициализация начального состояния при загрузке грамматики
  useEffect(() => {
    if (grammar) {
      // Пытаемся загрузить сохраненное состояние
      const savedState = loadGenerationState();

      if (savedState) {
        setDerivationSteps(savedState.derivationSteps);
        setSavedDerivations(savedState.savedDerivations);
        setIsCompleted(savedState.isCompleted);
        updateAvailableRules(
          savedState.derivationSteps[savedState.derivationSteps.length - 1]
            .result
        );
      } else {
        // Если нет сохраненного состояния, начинаем с начального символа
        const startSymbol = grammar.startSymbol || "S";
        setDerivationSteps([{ result: startSymbol }]);
        setSavedDerivations([]);
        setIsCompleted(false);
        updateAvailableRules(startSymbol);
      }
    }
  }, [grammar]);

  // Автосохранение состояния при изменениях
  useEffect(() => {
    if (grammar && derivationSteps.length > 0) {
      saveGenerationState(derivationSteps, savedDerivations, isCompleted);
    }
  }, [derivationSteps, savedDerivations, isCompleted, grammar]);

  // Обновление доступных правил на основе текущего результата
  const updateAvailableRules = (currentResult: string) => {
    if (!grammar) return;

    // Разделяем правила на доступные и недоступные
    const availableRules: ProductionRule[] = [];
    const unavailableRules: ProductionRule[] = [];

    grammar.rules.forEach((rule) => {
      if (currentResult.includes(rule.left)) {
        availableRules.push(rule);
      } else {
        unavailableRules.push(rule);
      }
    });

    // Объединяем: сначала доступные, потом недоступные
    setAvailableRules([...availableRules, ...unavailableRules]);

    // Проверяем, есть ли нетерминальные символы
    const hasNonTerminals = grammar.nonTerminals.some((nt) =>
      currentResult.includes(nt)
    );
    setIsCompleted(!hasNonTerminals);
  };

  // Автоматическое сохранение завершенных деривации
  useEffect(() => {
    if (isCompleted && derivationSteps.length > 1) {
      const lastResult = derivationSteps[derivationSteps.length - 1].result;
      const derivationId = `${Date.now()}-${Math.random()}`;
      
      const newDerivation: SavedDerivation = {
        id: derivationId,
        steps: [...derivationSteps],
        timestamp: Date.now(),
        finalWord: lastResult,
      };

      // Проверяем, не существует ли уже такая же деривация (по финальному слову и количеству шагов)
      const isDuplicate = savedDerivations.some(
        (saved) => 
          saved.finalWord === lastResult && 
          saved.steps.length === derivationSteps.length &&
          JSON.stringify(saved.steps) === JSON.stringify(derivationSteps)
      );

      if (!isDuplicate) {
        console.log("Сохраняем новую деривацию:", newDerivation);
        setSavedDerivations((prev) => [...prev, newDerivation]);
      } else {
        console.log("Деривация уже сохранена");
      }
    }
  }, [isCompleted, derivationSteps]);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        savedWordsRef.current &&
        !savedWordsRef.current.contains(event.target as Node)
      ) {
        setShowSavedWords(false);
      }
    };

    if (showSavedWords) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSavedWords]);

  // Обработчик применения правила
  const applyRule = (rule: ProductionRule, ruleIndex: number) => {
    if (isCompleted) return;

    setDerivationSteps((prev) => {
      const currentResult = prev[prev.length - 1].result;

      // Проверяем, доступно ли правило
      if (!currentResult.includes(rule.left)) return prev;

      // Обрабатываем ъ и ε как эпсилон (пустую строку)
      const replacementText =
        rule.right === "ъ" || rule.right === "ε" ? "" : rule.right;
      const newResult = currentResult.replace(rule.left, replacementText);

      const newSteps = [
        ...prev,
        { result: newResult, ruleIndex: ruleIndex + 1 }, // Сохраняем 1-based номер правила
      ];

      // Обновляем доступные правила асинхронно
      setTimeout(() => {
        updateAvailableRules(newResult);
      }, 0);

      return newSteps;
    });

    // Автопрокрутка к последнему элементу
    setTimeout(() => {
      if (derivationScrollRef.current) {
        derivationScrollRef.current.scrollLeft =
          derivationScrollRef.current.scrollWidth;
      }
    }, 0);
  };

  // Сброс деривации
  const resetDerivation = () => {
    const startSymbol = grammar?.startSymbol || "S";
    setDerivationSteps([{ result: startSymbol }]);
    updateAvailableRules(startSymbol);
    setIsCompleted(false);
    // Очищаем сохраненное состояние при сбросе
    clearGenerationState();
  };

  // Отмена последнего шага
  const undoLastStep = () => {
    if (derivationSteps.length <= 1) return;

    const newSteps = derivationSteps.slice(0, -1);
    setDerivationSteps(newSteps);

    const lastResult = newSteps[newSteps.length - 1].result;
    updateAvailableRules(lastResult);
    setIsCompleted(false);
  };

  // Переключение отображения сохраненных слов
  const toggleSavedWords = () => {
    setShowSavedWords(!showSavedWords);
  };

  // Функция для удаления сохраненной деривации
  const removeSavedDerivation = (derivationId: string) => {
    setSavedDerivations((prev) => prev.filter((d) => d.id !== derivationId));
  };

  // Компонент для отображения сохраненной деривации
  const renderSavedDerivation = (derivation: SavedDerivation, index: number) => {
    return (
      <div key={derivation.id} className="saved-derivation-item">
        <div className="saved-derivation-content">
          <span className="derivation-number">{index + 1}.</span>
          <div 
            className="derivation-chain"
            ref={(el) => {
              if (el) {
                // Прокручиваем в конец, чтобы сразу был виден результат
                el.scrollLeft = el.scrollWidth;
              }
            }}
          >
            {derivation.steps.map((step, stepIndex) => (
              <React.Fragment key={stepIndex}>
                {/* Результат шага */}
                <span className="derivation-step">
                  <span className={`derivation-step-result ${stepIndex === derivation.steps.length - 1 ? 'final-result' : ''}`}>
                    {displayFinalWord(step.result, stepIndex === derivation.steps.length - 1)}
                  </span>
                </span>

                {/* Стрелка и номер правила (если не последний элемент) */}
                {stepIndex < derivation.steps.length - 1 && (
                  <span className="derivation-transition">
                    {numberToHex(derivation.steps[stepIndex + 1].ruleIndex || 1)}→
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <button
            className="delete-derivation-btn"
            onClick={() => removeSavedDerivation(derivation.id)}
            title="Удалить деривацию"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="word-generation-page">
      <div className="page-container">
        {/* Верхняя панель */}
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate("menu")}>
            ← Назад
          </button>
          <h1>Построение слов</h1>
        </div>

        <div className="grammar-work-container">
          {/* Поле для отображения деривации */}
          <div className="derivation-display-field">
            <div
              className="derivation-scroll-container"
              ref={derivationScrollRef}
            >
              <div className="derivation-steps-line">
                {derivationSteps.map((step, index) => (
                  <React.Fragment key={index}>
                    {/* Результат шага */}
                    <div className="derivation-step-result">
                      {displayFinalWord(
                        step.result,
                        isCompleted && index === derivationSteps.length - 1
                      )}
                    </div>

                    {/* Стрелка и номер правила (если не последний элемент) */}
                    {index < derivationSteps.length - 1 && (
                      <div className="derivation-arrow-container">
                        <div className="derivation-rule-number">
                          {numberToHex(
                            derivationSteps[index + 1].ruleIndex || 1
                          )}
                        </div>
                        <div className="derivation-arrow">→</div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {/* Сообщение о завершении деривации */}
            {isCompleted && (
              <div className="completion-message">
                ✅ Деривация завершена! Слово принадлежит языку грамматики.
              </div>
            )}
          </div>

          {/* Секция с правилами */}
          <div className="rules-section">
            <div className="rules-list">
              <h3>Доступные правила:</h3>
              <div className="keyboard-hint">
                💡 Используйте клавиши 1-9, A-Z для быстрого применения правил
              </div>

              <div className="rules-content">
                {availableRules.length === 0 ? (
                  <div className="no-rules-message">
                    Нет правил для данной грамматики
                  </div>
                ) : (
                  <div className="rules-grid">
                    {availableRules.map((rule, index) => {
                      const globalIndex = grammar.rules.findIndex(
                        (r) => r.left === rule.left && r.right === rule.right
                      );
                      const currentResult =
                        derivationSteps[derivationSteps.length - 1].result;
                      const isRuleAvailable =
                        currentResult.includes(rule.left) && !isCompleted;

                      return (
                        <button
                          key={`${rule.left}-${rule.right}-${index}`}
                          className={`rule-btn ${
                            !isRuleAvailable ? "disabled" : ""
                          }`}
                          onClick={() => applyRule(rule, globalIndex)}
                          disabled={!isRuleAvailable}
                          title={`Нажмите ${numberToHex(globalIndex + 1)} для быстрого применения`}
                        >
                          <span className="rule-number">{numberToHex(globalIndex + 1)}</span>
                          <span className="rule-content">
                            {rule.left} → {displayEpsilon(rule.right)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Кнопки управления */}
              <div className="control-buttons">
                <button
                  className={isCompleted ? "new-word-btn" : "reset-btn"}
                  onClick={resetDerivation}
                >
                  {isCompleted ? "Новое слово" : "Сбросить"}
                </button>
                <button
                  className={`undo-btn ${
                    derivationSteps.length <= 1 || isCompleted ? "disabled" : ""
                  }`}
                  onClick={undoLastStep}
                  disabled={derivationSteps.length <= 1 || isCompleted}
                >
                  Отменить
                </button>
              </div>
            </div>
          </div>

          {/* Кнопка сохраненных деривации */}
          <div className="saved-words-section" ref={savedWordsRef}>
            <button className="saved-words-btn" onClick={toggleSavedWords}>
              📝 Сохраненные деривации ({savedDerivations.length})
            </button>

            {/* Выпадающий список сохраненных деривации */}
            {showSavedWords && (
              <div className="saved-words-dropdown">
                <div className="saved-words-list">
                  {savedDerivations.length > 0 ? (
                    savedDerivations.map((derivation, index) =>
                      renderSavedDerivation(derivation, index)
                    )
                  ) : (
                    <div className="saved-word-item empty-state">
                      <span className="word-text">Нет сохраненных деривации</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordGenerationPage;

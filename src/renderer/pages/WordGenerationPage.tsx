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
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [showSavedWords, setShowSavedWords] = useState(false);
  const savedWordsRef = useRef<HTMLDivElement>(null);

  const derivationScrollRef = useRef<HTMLDivElement>(null);

  // Функции для сохранения и загрузки состояния генерации
  const saveGenerationState = (
    steps: DerivationStep[],
    words: string[],
    completed: boolean
  ) => {
    try {
      const state = {
        derivationSteps: steps,
        savedWords: words,
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
            savedWords: state.savedWords || [],
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
  const displayFinalWord = (text: string): string => {
    return text.replace(/ъ/g, "ε").replace(/ /g, "\u00A0"); // Заменяем обычные пробелы на неразрывные
  };

  // Инициализация начального состояния при загрузке грамматики
  useEffect(() => {
    if (grammar) {
      // Пытаемся загрузить сохраненное состояние
      const savedState = loadGenerationState();

      if (savedState) {
        setDerivationSteps(savedState.derivationSteps);
        setSavedWords(savedState.savedWords);
        setIsCompleted(savedState.isCompleted);
        updateAvailableRules(
          savedState.derivationSteps[savedState.derivationSteps.length - 1]
            .result
        );
      } else {
        // Если нет сохраненного состояния, начинаем с начального символа
        const startSymbol = grammar.startSymbol || "S";
        setDerivationSteps([{ result: startSymbol }]);
        setSavedWords([]);
        setIsCompleted(false);
        updateAvailableRules(startSymbol);
      }
    }
  }, [grammar]);

  // Автосохранение состояния при изменениях
  useEffect(() => {
    if (grammar && derivationSteps.length > 0) {
      saveGenerationState(derivationSteps, savedWords, isCompleted);
    }
  }, [derivationSteps, savedWords, isCompleted, grammar]);

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

  // Автоматическое сохранение завершенных слов
  useEffect(() => {
    if (isCompleted && derivationSteps.length > 1) {
      const lastResult = derivationSteps[derivationSteps.length - 1].result;
      if (!savedWords.includes(lastResult)) {
        setSavedWords((prev) => [...prev, lastResult]);
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

    const currentResult = derivationSteps[derivationSteps.length - 1].result;

    // Проверяем, доступно ли правило
    if (!currentResult.includes(rule.left)) return;

    // Обрабатываем ъ и ε как эпсилон (пустую строку)
    const replacementText =
      rule.right === "ъ" || rule.right === "ε" ? "" : rule.right;
    const newResult = currentResult.replace(rule.left, replacementText);

    setDerivationSteps((prev) => [
      ...prev,
      { result: newResult, ruleIndex: ruleIndex + 1 },
    ]);

    updateAvailableRules(newResult);

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
                      {displayFinalWord(step.result)}
                    </div>

                    {/* Стрелка и номер правила (если не последний элемент) */}
                    {index < derivationSteps.length - 1 && (
                      <div className="derivation-arrow-container">
                        <div className="derivation-rule-number">
                          {step.ruleIndex ||
                            derivationSteps[index + 1].ruleIndex}
                        </div>
                        <div className="derivation-arrow">→</div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Секция с правилами */}
          <div className="rules-section">
            <div className="rules-list">
              <h3>Доступные правила:</h3>

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
                        >
                          <span className="rule-number">{globalIndex + 1}</span>
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

          {/* Кнопка сохраненных слов */}
          <div className="saved-words-section" ref={savedWordsRef}>
            <button className="saved-words-btn" onClick={toggleSavedWords}>
              📝 Сохраненные слова ({savedWords.length})
            </button>

            {/* Выпадающий список сохраненных слов */}
            {showSavedWords && (
              <div className="saved-words-dropdown">
                <div className="saved-words-list">
                  {savedWords.length > 0 ? (
                    savedWords.map((word, index) => (
                      <div key={index} className="saved-word-item">
                        <span className="word-number">{index + 1}.</span>
                        <span className="word-text">
                          {displayFinalWord(word)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="saved-word-item empty-state">
                      <span className="word-text">Нет сохраненных слов</span>
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

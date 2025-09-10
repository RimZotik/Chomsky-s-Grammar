export interface UserData {
  lastName: string;
  firstName: string;
  patronymic: string;
  group: string;
}

export type AppPage = "auth" | "menu" | "grammar" | "word-generation";

export interface Grammar {
  terminals: string[];
  nonTerminals: string[];
  startSymbol: string;
  rules: ProductionRule[];
}

export interface ProductionRule {
  left: string;
  right: string;
}

export interface Challenge {
  teamA: string;
  teamB: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  alternativeAnswer?: string;
}

export interface GameHistoryItem {
  level: number;
  score: number;
  teamA: string;
  teamB: string;
  playerAnswer: string;
  isCorrect: boolean;
}

export enum GameStatus {
  START = 'START',
  LOADING_CHALLENGE = 'LOADING_CHALLENGE',
  PLAYING = 'PLAYING',
  VALIDATING = 'VALIDATING',
  ROUND_FEEDBACK = 'ROUND_FEEDBACK',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface GameState {
  status: GameStatus;
  level: number;
  score: number;
  currentChallenge: Challenge | null;
  history: GameHistoryItem[];
  lastFeedback: ValidationResult | null;
}

import { initialState, parseState, type Question, type State } from "./model";
export const STORAGE_KEY = "part5-studio-v1";
export function loadState(questions: Question[]): {
  state: State;
  error: string | null;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      state: raw ? parseState(raw, questions) : initialState(),
      error: null,
    };
  } catch {
    return {
      state: initialState(),
      error:
        "学習記録を読み込めませんでした。元の記録を保護するため保存を止めています。設定から記録ファイルを読み込むか、このタブで練習できます。",
    };
  }
}
export function saveState(state: State): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

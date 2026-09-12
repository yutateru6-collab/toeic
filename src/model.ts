export const categories = [
  "品詞",
  "動詞",
  "接続・関係詞",
  "代名詞・数量",
  "前置詞・語法",
  "語彙",
] as const;
export type Category = (typeof categories)[number];
export interface Question {
  id: string;
  version: number;
  family: string;
  category: Category;
  pool: "practice" | "assessment";
  sentence: string;
  choices: string[];
  answer: number;
  translation: string;
  takeaway: string;
  reasons: string[];
  status: "beta";
  collection?: "analysis";
  examSet?: "analysis";
  skill?: string;
  steps?: string[];
}
export interface Attempt {
  id: string;
  questionId: string;
  version: number;
  choice: number;
  correct: boolean;
  first: boolean;
  seconds: number;
  guessed: boolean;
  at: number;
  sessionId: string;
}
export interface Session {
  id: string;
  mode: "daily" | "review" | "category" | "exam";
  title: string;
  ids: string[];
  index: number;
  spent: Record<string, number>;
  answers: Record<
    string,
    { choice: number; seconds: number; guessed: boolean }
  >;
  startedAt: number;
  deadline: number | null;
  finishedAt: number | null;
}
export interface State {
  schema: 1;
  attempts: Attempt[];
  bookmarks: string[];
  exposures: Record<string, number>;
  session: Session | null;
  settings: { largeText: boolean; goal: number };
}
export const initialState = (): State => ({
  schema: 1,
  attempts: [],
  bookmarks: [],
  exposures: {},
  session: null,
  settings: { largeText: false, goal: 10 },
});
export const dayKey = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export function firstAttempts(state: State) {
  return state.attempts.filter((a) => a.first);
}
export function rate(attempts: Attempt[]): number | null {
  return attempts.length
    ? Math.round(
        (100 * attempts.filter((a) => a.correct).length) / attempts.length,
      )
    : null;
}
export function dueAt(state: State, id: string): number {
  const history = state.attempts.filter((a) => a.questionId === id);
  if (!history.length) return Infinity;
  const last = history[history.length - 1];
  if (!last.correct || last.guessed || last.seconds > 45)
    return last.at + 86400000;
  const successfulDays = new Set<string>();
  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i].correct || history[i].guessed || history[i].seconds > 45)
      break;
    successfulDays.add(dayKey(history[i].at));
  }
  return (
    last.at + [1, 3, 7, 14, 30][Math.min(successfulDays.size - 1, 4)] * 86400000
  );
}
export function dueQuestions(
  state: State,
  questions: Question[],
  now = Date.now(),
) {
  return questions
    .filter((q) => dueAt(state, q.id) <= now)
    .sort((a, b) => dueAt(state, a.id) - dueAt(state, b.id));
}
export function chooseQuestions(
  state: State,
  questions: Question[],
  mode: Session["mode"],
  category?: Category,
  now = Date.now(),
): Question[] {
  if (mode === "exam") return getExamSet(questions, "starter");
  if (mode === "review")
    return dueQuestions(state, questions, now).slice(0, state.settings.goal);
  const seen = new Set(state.attempts.map((a) => a.questionId));
  const pool = questions.filter(
    (q) => q.pool === "practice" && (!category || q.category === category),
  );
  const ordered = [
    ...pool.filter((q) => !seen.has(q.id)),
    ...pool
      .filter((q) => seen.has(q.id))
      .sort((a, b) => dueAt(state, a.id) - dueAt(state, b.id)),
  ];
  // Round-robin categories keeps a daily session varied without random answer-order mutations.
  if (category) return ordered.slice(0, state.settings.goal);
  const result: Question[] = [];
  const buckets = categories.map((c) =>
    ordered.filter((q) => q.category === c),
  );
  while (result.length < state.settings.goal && buckets.some((b) => b.length))
    for (const b of buckets) {
      if (b.length && result.length < state.settings.goal)
        result.push(b.shift()!);
    }
  return result;
}
export function getExamSet(questions: Question[], set: "starter" | "analysis") {
  const items = questions.filter(
    (q) => q.pool === "assessment" && (q.examSet ?? "starter") === set,
  );
  if (set === "starter") return items;
  // Fixed mixed sequence: stable on resume, without grouping all vocabulary at the end.
  const order = [
    0, 5, 3, 0, 4, 5, 0, 2, 5, 1, 0, 5, 2, 0, 4, 5, 3, 0, 5, 2, 0, 1, 5, 4, 0,
    5, 2, 0, 5, 5,
  ];
  const buckets = categories.map((c) => items.filter((q) => q.category === c));
  return order.flatMap((c) => {
    const q = buckets[c].shift();
    return q ? [q] : [];
  });
}
export function startSession(
  mode: Session["mode"],
  title: string,
  questions: Question[],
  now = Date.now(),
): Session {
  return {
    id: crypto.randomUUID(),
    mode,
    title,
    ids: questions.map((q) => q.id),
    index: 0,
    spent: {},
    answers: {},
    startedAt: now,
    deadline: mode === "exam" ? now + 600000 : null,
    finishedAt: null,
  };
}
export function recordAttempt(
  state: State,
  q: Question,
  choice: number,
  seconds: number,
  guessed: boolean,
  sessionId: string,
  at = Date.now(),
): State {
  if (
    state.attempts.some(
      (a) => a.sessionId === sessionId && a.questionId === q.id,
    )
  )
    return state;
  const a: Attempt = {
    id: `${sessionId}:${q.id}`,
    questionId: q.id,
    version: q.version,
    choice,
    correct: choice === q.answer,
    seconds: Math.max(0, Math.round(seconds)),
    guessed,
    sessionId,
    at,
    first:
      !state.attempts.some((a) => a.questionId === q.id) &&
      state.exposures[q.id] === undefined,
  };
  return { ...state, attempts: [...state.attempts, a] };
}
export function finishExam(
  state: State,
  questions: Question[],
  now = Date.now(),
): State {
  if (!state.session || state.session.finishedAt) return state;
  const session = state.session;
  let next = state;
  for (const id of session.ids) {
    const q = questions.find((q) => q.id === id);
    if (!q) continue;
    const a = session.answers[id];
    next = recordAttempt(
      next,
      q,
      a?.choice ?? -1,
      a?.seconds ?? 0,
      a?.guessed ?? false,
      session.id,
      now,
    );
  }
  return { ...next, session: { ...session, finishedAt: now } };
}
export function parseState(raw: string, questions: Question[]): State {
  const v = JSON.parse(raw);
  const validIds = new Set(questions.map((q) => q.id));
  if (
    v?.schema !== 1 ||
    !Array.isArray(v.attempts) ||
    !Array.isArray(v.bookmarks) ||
    v.attempts.length > 100000
  )
    throw new Error("形式が対応していません");
  const validNumber = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (
    v.attempts.some(
      (a: Attempt) =>
        !a ||
        !validIds.has(a.questionId) ||
        typeof a.id !== "string" ||
        typeof a.sessionId !== "string" ||
        !Number.isInteger(a.choice) ||
        a.choice < -1 ||
        a.choice > 3 ||
        !validNumber(a.at) ||
        !validNumber(a.seconds) ||
        typeof a.correct !== "boolean" ||
        typeof a.first !== "boolean" ||
        typeof a.guessed !== "boolean" ||
        !Number.isInteger(a.version),
    )
  )
    throw new Error("回答データが正しくありません");
  if (
    v.bookmarks.some(
      (id: unknown) => typeof id !== "string" || !validIds.has(id),
    )
  )
    throw new Error("保存した問題が正しくありません");
  const settings = {
    largeText: v.settings?.largeText === true,
    goal: [5, 10, 15].includes(v.settings?.goal) ? v.settings.goal : 10,
  };
  let session: Session | null = null;
  const s = v.session;
  if (
    s &&
    typeof s.id === "string" &&
    typeof s.title === "string" &&
    ["daily", "review", "category", "exam"].includes(s.mode) &&
    Array.isArray(s.ids) &&
    s.ids.length > 0 &&
    s.ids.length <= 90 &&
    new Set(s.ids).size === s.ids.length &&
    s.ids.every((id: string) => validIds.has(id)) &&
    Number.isInteger(s.index) &&
    s.index >= 0 &&
    s.index < s.ids.length &&
    validNumber(s.startedAt) &&
    (s.deadline === null || validNumber(s.deadline)) &&
    (s.finishedAt === null || validNumber(s.finishedAt)) &&
    s.answers &&
    typeof s.answers === "object" &&
    !Array.isArray(s.answers) &&
    Object.entries(s.answers).every(
      ([id, a]: [string, any]) =>
        s.ids.includes(id) &&
        a &&
        Number.isInteger(a.choice) &&
        a.choice >= 0 &&
        a.choice < 4 &&
        validNumber(a.seconds) &&
        typeof a.guessed === "boolean",
    )
  )
    session = s;
  if (session && session.mode === "exam" && session.deadline === null)
    session = null;
  if (session)
    session = {
      ...session,
      spent: Object.fromEntries(
        Object.entries(s.spent ?? {}).filter(
          ([id, n]) => validIds.has(id) && validNumber(n),
        ) as [string, number][],
      ),
    };
  const exposures: Record<string, number> = Object.fromEntries(
    Object.entries(v.exposures ?? {}).filter(
      ([id, n]) => validIds.has(id) && validNumber(n),
    ) as [string, number][],
  );
  // Recompute correctness and first exposure; imported flags cannot inflate achievement.
  const seen = new Set<string>();
  const ids = new Set<string>();
  const attempts: Attempt[] = v.attempts
    .filter((a: Attempt) => {
      if (ids.has(a.id)) return false;
      ids.add(a.id);
      return true;
    })
    .sort((a: Attempt, b: Attempt) => a.at - b.at)
    .map((a: Attempt) => {
      const first =
        !seen.has(a.questionId) &&
        !(
          exposures[a.questionId] !== undefined &&
          exposures[a.questionId] <= a.at
        );
      seen.add(a.questionId);
      return {
        ...a,
        first,
        correct:
          a.choice === questions.find((q) => q.id === a.questionId)!.answer,
      };
    });
  return {
    schema: 1,
    attempts,
    bookmarks: [...new Set<string>(v.bookmarks)],
    exposures,
    settings,
    session,
  };
}

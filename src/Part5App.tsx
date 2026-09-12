import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Flame,
  GraduationCap,
  Home,
  Info,
  LayoutGrid,
  ListChecks,
  Moon,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import {
  categories,
  chooseQuestions,
  getExamSet,
  dayKey,
  dueAt,
  dueQuestions,
  finishExam,
  firstAttempts,
  parseState,
  rate,
  recordAttempt,
  startSession,
  type Category,
  type Question,
  type Session,
  type State,
} from "./model";
import { questions } from "./questions";
import LearningHub from "./LearningHub";
import { loadState, saveState } from "./storage";
import "./styles.css";

type Page = "home" | "practice" | "review" | "stats" | "settings" | "session";
const questionMap = new Map(questions.map((q) => [q.id, q]));
const practiceCount = questions.filter((q) => q.pool === "practice").length;
const assessmentCount = questions.length - practiceCount;
type Selection = { ids: string[]; title: string };
const letters = ["A", "B", "C", "D"];
const icons = [BookOpen, Zap, LayoutGrid, GraduationCap, ListChecks, Sparkles];
const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;
const getModeName = (mode: Session["mode"]) =>
  ({
    daily: "今日のトレーニング",
    review: "復習",
    category: "分野別トレーニング",
    exam: "30問チャレンジ",
  })[mode];

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={onClose}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-btn" aria-label="閉じる" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Empty({
  icon: Icon = BookOpen,
  title,
  text,
  children,
}: {
  icon?: typeof BookOpen;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
function Explanation({
  q,
  choice,
  onReport,
}: {
  q: Question;
  choice?: number;
  onReport: () => void;
}) {
  return (
    <section className="explanation" aria-label="解答と解説">
      <div className="eyebrow green">ANSWER & INSIGHT</div>
      <h3>
        正解は {letters[q.answer]} <span lang="en">{q.choices[q.answer]}</span>
      </h3>
      <div className="takeaway">
        <Zap size={19} />
        <p>{q.takeaway}</p>
      </div>
      <p className="completed-sentence" lang="en">
        {q.sentence.split("-------")[0]}
        <mark>{q.choices[q.answer]}</mark>
        {q.sentence.split("-------")[1]}
      </p>
      <p className="translation">{q.translation}</p>
      {q.steps && (
        <div className="decision-path">
          <span className="eyebrow green">{q.skill} · 解く順番</span>
          <ol>
            {q.steps.map((step, i) => (
              <li key={i}>
                <span>{["見る", "判断", "確認"][i]}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
      <details className="reason-details">
        <summary>
          4つの選択肢を比べる
          <ChevronRight size={18} />
        </summary>
        <div>
          {q.choices.map((c, i) => (
            <div
              className={`reason ${i === q.answer ? "answer-reason" : ""}`}
              key={c}
            >
              <span className="reason-letter">{letters[i]}</span>
              <div>
                <strong lang="en">{c}</strong>
                {choice === i && <small>あなたの回答</small>}
                <p>{q.reasons[i]}</p>
              </div>
              {i === q.answer && <Check size={18} />}
            </div>
          ))}
        </div>
      </details>
      <div className="explanation-foot">
        <small>
          {q.id} · v{q.version} · 試作問題
        </small>
        <button className="text-btn" onClick={onReport}>
          問題・解説を報告
        </button>
      </div>
    </section>
  );
}

function StudyScreen({
  state,
  setState,
  onHome,
  onReport,
  onBookmark,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  onHome: () => void;
  onReport: (q: Question) => void;
  onBookmark: (id: string) => void;
}) {
  const session = state.session!;
  const q = questionMap.get(session.ids[session.index])!;
  const isExam = session.mode === "exam";
  const [selected, setSelected] = useState<number | null>(
    session.answers[q.id]?.choice ?? null,
  );
  const [guessed, setGuessed] = useState(
    session.answers[q.id]?.guessed ?? false,
  );
  const [now, setNow] = useState(Date.now());
  const [exit, setExit] = useState(false);
  const [submit, setSubmit] = useState(false);
  const initialTime =
    session.spent[q.id] ?? session.answers[q.id]?.seconds ?? 0;
  const seconds = useRef(initialTime);
  const [displaySeconds, setDisplaySeconds] = useState(initialTime);
  const lastTick = useRef(performance.now());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const revealed = !isExam && Boolean(session.answers[q.id]);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const persist = () =>
      setState((prev) =>
        prev.session?.id === session.id
          ? {
              ...prev,
              session: {
                ...prev.session,
                spent: { ...prev.session.spent, [q.id]: seconds.current },
              },
            }
          : prev,
      );
    const tick = () => {
      const t = performance.now();
      const delta = (t - lastTick.current) / 1000;
      lastTick.current = t;
      if (!document.hidden && !revealedRef.current) {
        seconds.current += Math.min(delta, 2);
        setDisplaySeconds(seconds.current);
      }
      setNow(Date.now());
    };
    const timer = setInterval(tick, 1000);
    const saver = setInterval(persist, 5000);
    const visibility = () => {
      lastTick.current = performance.now();
      persist();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      clearInterval(saver);
      document.removeEventListener("visibilitychange", visibility);
      persist();
    };
  }, [q.id, session.id, setState]);
  const commit = (choice: number, guess: boolean, practice: boolean) => {
    const time = seconds.current;
    setState((prev) => {
      if (
        !prev.session ||
        prev.session.id !== session.id ||
        prev.session.finishedAt
      )
        return prev;
      let next = {
        ...prev,
        session: {
          ...prev.session,
          answers: {
            ...prev.session.answers,
            [q.id]: { choice, seconds: time, guessed: guess },
          },
          spent: { ...prev.session.spent, [q.id]: time },
        },
      };
      return practice
        ? recordAttempt(next, q, choice, time, guess, session.id)
        : next;
    });
  };
  const select = (i: number) => {
    setSelected(i);
    if (isExam) commit(i, guessed, false);
  };
  const next = () => {
    if (session.index === session.ids.length - 1) {
      if (isExam) setSubmit(true);
      else
        setState((p) => ({
          ...p,
          session: { ...p.session!, finishedAt: Date.now() },
        }));
    } else
      setState((p) => ({
        ...p,
        session: { ...p.session!, index: p.session!.index + 1 },
      }));
    window.scrollTo({ top: 0 });
  };
  const jump = (index: number) => {
    setState((p) => ({ ...p, session: { ...p.session!, index } }));
    window.scrollTo({ top: 0 });
  };
  const completed = Object.keys(session.answers).length;
  return (
    <div className="study-wrap">
      <div className="study-top">
        <button className="quiet-btn" onClick={() => setExit(true)}>
          <ArrowLeft size={18} />
          中断
        </button>
        <span>{session.title}</span>
        <span
          className={
            isExam && session.deadline! - now < 60000 ? "timer urgent" : "timer"
          }
        >
          <Clock size={16} />
          {isExam
            ? fmt(Math.max(0, (session.deadline! - now) / 1000))
            : fmt(displaySeconds)}
        </span>
      </div>
      <div className="progress-track">
        <div style={{ width: `${(completed / session.ids.length) * 100}%` }} />
      </div>
      <div className="question-meta">
        <span>
          QUESTION <b>{String(session.index + 1).padStart(2, "0")}</b>
          <span className="muted"> / {session.ids.length}</span>
        </span>
        <button
          className={`icon-btn ${state.bookmarks.includes(q.id) ? "bookmarked" : ""}`}
          onClick={() => onBookmark(q.id)}
          aria-label={
            state.bookmarks.includes(q.id) ? "保存を解除" : "あとで見るに保存"
          }
          aria-pressed={state.bookmarks.includes(q.id)}
        >
          <Bookmark
            fill={state.bookmarks.includes(q.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="question-card">
        <p className="question-instruction">
          空所に入る最も適切な語句を選んでください。
        </p>
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="question-sentence"
          lang="en"
        >
          {q.sentence.split("-------")[0]}
          <span className="blank" aria-label={revealed ? undefined : "空所"}>
            {revealed ? q.choices[q.answer] : "-------"}
          </span>
          {q.sentence.split("-------")[1]}
        </h2>
        <div className="choices" role="group" aria-label="選択肢">
          {q.choices.map((c, i) => {
            const status = revealed
              ? i === q.answer
                ? "correct"
                : i === selected
                  ? "incorrect"
                  : ""
              : selected === i
                ? "selected"
                : "";
            return (
              <button
                key={c}
                className={`choice ${status}`}
                aria-pressed={selected === i}
                disabled={revealed}
                onClick={() => select(i)}
              >
                <span className="choice-letter">{letters[i]}</span>
                <span lang="en">{c}</span>
                {revealed && i === q.answer ? (
                  <span className="choice-status">
                    <CheckCircle2 size={18} />
                    正解
                  </span>
                ) : revealed && i === selected ? (
                  <span className="choice-status">
                    <X size={18} />
                    あなたの回答
                  </span>
                ) : selected === i ? (
                  <Check size={19} />
                ) : null}
              </button>
            );
          })}
        </div>
        {!revealed && (
          <label className="guess-label">
            <input
              type="checkbox"
              checked={guessed}
              onChange={(e) => {
                setGuessed(e.target.checked);
                if (isExam && selected !== null)
                  commit(selected, e.target.checked, false);
              }}
            />
            少し迷った・勘で選んだ<span>復習の目印に</span>
          </label>
        )}
        {!revealed && !isExam && (
          <div className="answer-action">
            <button
              className="primary-btn"
              disabled={selected === null}
              onClick={() => commit(selected!, guessed, true)}
            >
              解答を確認する
              <ArrowRight size={18} />
            </button>
            <small>選んだ後も、確定するまで変更できます。</small>
          </div>
        )}
        {revealed && (
          <div
            className={`feedback ${selected === q.answer ? "success" : "retry"}`}
            role="status"
          >
            <strong>
              {selected === q.answer
                ? "正解です。"
                : "ここで覚え直しましょう。"}
            </strong>
            <span>
              {selected === q.answer
                ? guessed
                  ? "迷った問題は、明日もう一度。"
                  : "決め手を確認して、次の一問へ。"
                : "明日の復習に追加しました。"}
            </span>
          </div>
        )}
      </div>
      {revealed && (
        <Explanation
          q={q}
          choice={selected ?? undefined}
          onReport={() => onReport(q)}
        />
      )}
      <div className="study-footer">
        {isExam && (
          <button
            className="secondary-btn"
            disabled={session.index === 0}
            onClick={() => jump(session.index - 1)}
          >
            <ArrowLeft size={18} />
            前へ
          </button>
        )}
        {(revealed || isExam) && (
          <button className="primary-btn" onClick={next}>
            {session.index === session.ids.length - 1
              ? isExam
                ? "回答を確認して終了"
                : "結果を見る"
              : isExam && selected === null
                ? "保留して次へ"
                : "次の問題へ"}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
      {isExam && (
        <details className="question-navigator" open>
          <summary>
            回答一覧 <span>{completed} / 30 問</span>
          </summary>
          <div>
            {session.ids.map((id, i) => (
              <button
                aria-label={`問題${i + 1}${session.answers[id] ? " 回答済み" : " 未回答"}`}
                aria-current={i === session.index ? "step" : undefined}
                className={`${session.answers[id] ? "answered" : ""} ${i === session.index ? "current" : ""}`}
                key={id}
                onClick={() => jump(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button className="text-btn" onClick={() => setSubmit(true)}>
            ここまでで採点する
          </button>
        </details>
      )}
      {exit && (
        <Dialog title="途中で中断しますか？" onClose={() => setExit(false)}>
          <p>
            回答は保存されています。ホームの「続きから」で再開できます。
            {isExam
              ? "30問チャレンジの残り時間は中断中も進みます。"
              : "練習の計測時間は中断中に進みません。"}
          </p>
          <div className="dialog-actions">
            <button className="secondary-btn" onClick={() => setExit(false)}>
              続ける
            </button>
            <button className="primary-btn" onClick={onHome}>
              保存してホームへ
            </button>
          </div>
        </Dialog>
      )}
      {submit && (
        <Dialog title="30問チャレンジを終了" onClose={() => setSubmit(false)}>
          <p>
            {completed === 30
              ? "すべて回答済みです。採点して解説を確認しましょう。"
              : `未回答が${30 - completed}問あります。未回答は不正解として採点します。`}
          </p>
          <div className="dialog-actions">
            <button className="secondary-btn" onClick={() => setSubmit(false)}>
              見直す
            </button>
            <button
              className="primary-btn"
              onClick={() => setState((p) => finishExam(p, questions))}
            >
              採点する
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ResultScreen({
  state,
  onHome,
  onRead,
}: {
  state: State;
  onHome: () => void;
  onRead: (q: Question) => void;
}) {
  const s = state.session!;
  const attempts = state.attempts.filter((a) => a.sessionId === s.id);
  const correct = attempts.filter((a) => a.correct).length;
  const first = attempts.filter((a) => a.first);
  const review = attempts.filter(
    (a) => !a.correct || a.guessed || a.seconds > 45,
  ).length;
  return (
    <div className="result-page">
      <div className="result-orbit">
        <CheckCircle2 size={36} />
      </div>
      <p className="eyebrow green">SESSION COMPLETE</p>
      <h1>一歩、前へ。</h1>
      <p className="muted">{s.title}を終えました。決め手を振り返りましょう。</p>
      <div className="result-score">
        <strong>{correct}</strong>
        <span> / {s.ids.length} 問正解</span>
      </div>
      <div className="result-metrics">
        <div>
          <span>初見の正答率</span>
          <b>
            {rate(first) ?? "—"}
            {first.length ? "%" : ""}
          </b>
          <small>{first.length}問が初見</small>
        </div>
        <div>
          <span>復習したい問題</span>
          <b>
            {review}
            <small>問</small>
          </b>
          <small>不正解・迷い・45秒超</small>
        </div>
      </div>
      <button className="primary-btn" onClick={onHome}>
        ホームへ戻る
        <ArrowRight size={18} />
      </button>
      <div className="result-list">
        <h2>今回の問題</h2>
        {s.ids.map((id, i) => {
          const q = questionMap.get(id)!;
          const a = attempts.find((a) => a.questionId === id);
          return (
            <button className="result-row" key={id} onClick={() => onRead(q)}>
              <span className={a?.correct ? "green" : "orange"}>
                {a?.correct ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <RotateCcw size={20} />
                )}
              </span>
              <span>
                <b>
                  {String(i + 1).padStart(2, "0")}　{q.category}
                </b>
                <small lang="en">{q.sentence}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>
      {s.mode === "exam" && (
        <p className="fine-print">
          このセットは試作問題です。本番のスコア換算や難易度の実測比較は行っていません。再挑戦は初見成績に加算しません。
        </p>
      )}
    </div>
  );
}

export default function Part5App() {
  const [loaded] = useState(() => loadState(questions));
  const [state, setState] = useState<State>(loaded.state);
  const [storageBlocked, setStorageBlocked] = useState(Boolean(loaded.error));
  const [error, setError] = useState(loaded.error);
  const [page, setPage] = useState<Page>("home");
  const [modal, setModal] = useState<"exam" | "about" | null>(null);
  const [examSet, setExamSet] = useState<"starter" | "analysis">("analysis");
  const examItems = getExamSet(questions, examSet);
  const [readQuestion, setReadQuestion] = useState<Question | null>(null);
  const [reportQuestion, setReportQuestion] = useState<Question | null>(null);
  const [toast, setToast] = useState("");
  const [pendingStart, setPendingStart] = useState<{
    mode: Session["mode"];
    category?: Category;
    selection?: Selection;
  } | null>(null);
  const [reviewTab, setReviewTab] = useState<"due" | "saved" | "all">("due");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [importData, setImportData] = useState<State | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [clock, setClock] = useState(Date.now());
  const readExplanation = (q: Question) => {
    setState((s) =>
      s.exposures[q.id] !== undefined
        ? s
        : { ...s, exposures: { ...s.exposures, [q.id]: Date.now() } },
    );
    setReadQuestion(q);
  };
  useEffect(() => {
    if (!storageBlocked && !saveState(state)) {
      setError(
        "保存容量が足りないため、この変更を保存できません。設定から学習記録を書き出してください。",
      );
    }
  }, [state, storageBlocked]);
  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (
      state.session?.mode === "exam" &&
      !state.session.finishedAt &&
      state.session.deadline &&
      clock >= state.session.deadline
    ) {
      setState((s) => finishExam(s, questions));
      setToast("制限時間になったため、30問チャレンジを採点しました。");
    }
  }, [clock, state.session]);
  useEffect(() => {
    const fn = () => setOnline(navigator.onLine);
    const install = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("online", fn);
    window.addEventListener("offline", fn);
    window.addEventListener("beforeinstallprompt", install);
    return () => {
      window.removeEventListener("online", fn);
      window.removeEventListener("offline", fn);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [page]);
  const first = firstAttempts(state);
  const today = state.attempts.filter((a) => dayKey(a.at) === dayKey(clock));
  const due = dueQuestions(state, questions, clock);
  const unseen = questions.filter(
    (q) =>
      q.pool === "practice" &&
      !state.attempts.some((a) => a.questionId === q.id),
  ).length;
  const active = state.session && !state.session.finishedAt;
  const todayPercent = Math.min(
    100,
    (today.length / state.settings.goal) * 100,
  );
  const bookmark = (id: string) =>
    setState((s) => ({
      ...s,
      bookmarks: s.bookmarks.includes(id)
        ? s.bookmarks.filter((x) => x !== id)
        : [...s.bookmarks, id],
    }));
  const begin = (
    mode: Session["mode"],
    category?: Category,
    replace = false,
    selection?: Selection,
  ) => {
    if (active && !replace) {
      setPendingStart({ mode, category, selection });
      setModal(null);
      return;
    }
    const chosen = selection
      ? selection.ids.flatMap((id) =>
          questionMap.has(id) ? [questionMap.get(id)!] : [],
        )
      : chooseQuestions(state, questions, mode, category);
    if (!chosen.length) {
      setToast("今は復習期限の問題がありません。新しい問題を進めましょう。");
      return;
    }
    setState((s) => ({
      ...s,
      session: startSession(
        mode,
        selection?.title ?? category ?? getModeName(mode),
        chosen,
      ),
    }));
    setPage("session");
    setModal(null);
    setPendingStart(null);
  };
  const download = (payload: unknown, name: string) => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const report = (q: Question) => {
    setReadQuestion(null);
    setReportQuestion(q);
  };
  const navItems = [
    { id: "home", name: "ホーム", Icon: Home },
    { id: "practice", name: "トレーニング", Icon: LayoutGrid },
    { id: "review", name: "復習ノート", Icon: BookOpen },
    { id: "stats", name: "学習の記録", Icon: TrendingUp },
  ] as const;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(clock);
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString("ja-JP", { weekday: "short" }),
      count: state.attempts.filter((a) => dayKey(a.at) === dayKey(d.getTime()))
        .length,
      current: i === 6,
    };
  });
  const categoryStats = categories.map((c) => {
    const ids = new Set(
      questions.filter((q) => q.category === c).map((q) => q.id),
    );
    const a = first.filter((a) => ids.has(a.questionId));
    return { category: c, rate: rate(a), count: a.length };
  });
  const weakest = categoryStats
    .filter((c) => c.count >= 3)
    .sort((a, b) => a.rate! - b.rate!)[0];
  const reviewList = questions
    .filter((q) =>
      reviewTab === "saved"
        ? state.bookmarks.includes(q.id)
        : reviewTab === "due"
          ? due.some((x) => x.id === q.id)
          : state.attempts.some((a) => a.questionId === q.id),
    )
    .filter((q) => filter === "all" || q.category === filter);
  return (
    <div
      className={`app-shell ${state.settings.largeText ? "large-text" : ""}`}
    >
      <a href="#main" className="skip-link">
        本文へ移動
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setPage("home")}
          aria-label="PART5 STUDIO ホーム"
        >
          <span className="brand-symbol">
            5<span />
          </span>
          <span>
            PART5<span className="brand-sub">S T U D I O</span>
          </span>
        </button>
        <span className="sidebar-label">YOUR LEARNING SPACE</span>
        <nav aria-label="メインナビゲーション">
          {navItems.map(({ id, name, Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={20} />
              {name}
              {id === "review" && due.length > 0 && (
                <span className="nav-count">{due.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="daily-quote">
            <span className="quote-mark">“</span>
            <p>
              わかる、を
              <br />
              迷わず解ける、へ。
            </p>
            <small>A LITTLE, EVERY DAY.</small>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => setPage("settings")}
          >
            <Settings size={19} />
            設定とアプリについて
          </button>
          <span className="beta-label">
            BETA 02 <span>·</span> ORIGINAL PRACTICE
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="mobile-brand">
            <span className="mini-brand">5</span>PART5 STUDIO
          </span>
          <span className="breadcrumb">
            TOEIC® L&R <span>/</span> Part 5 トレーニング
          </span>
          <div className="topbar-right">
            <span className="streak">
              <Flame size={17} />
              {today.length}
              <span>問 / 今日</span>
            </span>
            <button
              className="avatar"
              aria-label="設定を開く"
              onClick={() => setPage("settings")}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>
        {!online && (
          <div className="connection-notice" role="status">
            オフラインで学習中。記録はこの端末に保存されます。
          </div>
        )}
        {error && (
          <div className="storage-error" role="alert">
            {error}
          </div>
        )}
        <main
          id="main"
          className={
            page === "session" ? "main-content session-content" : "main-content"
          }
        >
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">MAKE TODAY COUNT</p>
                  <h1 ref={titleRef} tabIndex={-1}>
                    今日も、一問ずつ。
                  </h1>
                  <p className="subtitle">小さな積み重ねを、確かな解答力に。</p>
                </div>
                <span className="date-label">
                  {new Date(clock).toLocaleDateString("ja-JP", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
              </div>
              <div className="dashboard-grid">
                <section className="hero-card">
                  <div className="hero-copy">
                    <span className="hero-label">
                      <span className="pulse-dot" /> DAILY TRAINING
                    </span>
                    <h2>
                      {active ? (
                        "続きの一問から。"
                      ) : (
                        <>
                          解ける理由が、
                          <br />
                          自信になる。
                        </>
                      )}
                    </h2>
                    <p>
                      {active
                        ? `${state.session!.title} · ${Object.keys(state.session!.answers).length} / ${state.session!.ids.length}問 回答済み`
                        : `${state.settings.goal}問のトレーニングで、文法と語彙を磨こう。`}
                    </p>
                    <button
                      className="hero-button"
                      onClick={() =>
                        active ? setPage("session") : begin("daily")
                      }
                    >
                      {active
                        ? "続きから始める"
                        : `今日の${state.settings.goal}問を始める`}
                      <ArrowRight size={20} />
                    </button>
                    <span className="hero-note">
                      <Clock size={14} />
                      {active && state.session!.mode === "exam"
                        ? "チャレンジの制限時間は進行中"
                        : "自分のペースで · 途中で中断できます"}
                    </span>
                  </div>
                  <div className="hero-art" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <span className="art-spark spark-one">✦</span>
                    <span className="art-spark spark-two">✧</span>
                    <div className="floating-card card-back">
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="floating-card card-front">
                      <span className="art-card-label">PART 5</span>
                      <b>
                        Make it
                        <br />
                        <span>clear.</span>
                      </b>
                      <div className="art-answer">
                        <span>C</span>
                        <div />
                        <Check size={20} />
                      </div>
                    </div>
                    <div className="art-badge">
                      <Check size={18} />
                      <span>One step forward</span>
                    </div>
                  </div>
                </section>
                <section className="goal-card">
                  <div className="card-heading">
                    <span>今日の積み重ね</span>
                    <Target size={19} />
                  </div>
                  <div
                    className="goal-ring"
                    style={
                      {
                        "--progress": `${todayPercent}%`,
                      } as React.CSSProperties
                    }
                  >
                    <div>
                      <strong>
                        {today.length}
                        <small> / {state.settings.goal}</small>
                      </strong>
                      <span>問 解きました</span>
                    </div>
                  </div>
                  <p>
                    {today.length >= state.settings.goal
                      ? "今日の目標を達成しました。"
                      : "あと" +
                        Math.max(0, state.settings.goal - today.length) +
                        "問で、今日の目標達成。"}
                  </p>
                  <div className="week-dots">
                    {week.map((d, i) => (
                      <div key={i} className={d.current ? "today" : ""}>
                        <span className={d.count ? "done" : ""}>
                          {d.count ? <Check size={12} /> : null}
                        </span>
                        <small>{d.day}</small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              {state.session?.finishedAt && (
                <button
                  className="recent-result"
                  onClick={() => setPage("session")}
                >
                  <CheckCircle2 size={17} />
                  前回の結果と解説を見る
                  <ChevronRight size={17} />
                </button>
              )}
              <div className="stat-strip">
                <div>
                  <span className="stat-icon teal">
                    <Target size={21} />
                  </span>
                  <div>
                    <small>初見の正答率</small>
                    <strong>
                      {rate(first) ?? "—"}
                      {first.length ? <em>%</em> : null}
                    </strong>
                  </div>
                  <span className="stat-caption">
                    {first.length
                      ? `${first.length}問の初回回答`
                      : "最初の一問から記録"}
                  </span>
                </div>
                <div>
                  <span className="stat-icon amber">
                    <RotateCcw size={21} />
                  </span>
                  <div>
                    <small>今日の復習</small>
                    <strong>
                      {due.length}
                      <em>問</em>
                    </strong>
                  </div>
                  <button
                    className="arrow-button"
                    aria-label="復習ノートを見る"
                    onClick={() => setPage("review")}
                  >
                    <ArrowRight size={19} />
                  </button>
                </div>
                <div>
                  <span className="stat-icon blue">
                    <BookOpen size={21} />
                  </span>
                  <div>
                    <small>未回答のトレーニング問題</small>
                    <strong>
                      {unseen}
                      <em>問</em>
                    </strong>
                  </div>
                  <span className="stat-caption">
                    トレーニング用 {practiceCount}問
                  </span>
                </div>
              </div>
              <div className="section-heading">
                <h2>自分に合った学び方で</h2>
                <span>CHOOSE YOUR NEXT STEP</span>
              </div>
              <div className="learning-cards">
                <button
                  className="learning-card"
                  onClick={() => setPage("practice")}
                >
                  <div className="mode-icon teal">
                    <LayoutGrid size={23} />
                  </div>
                  <span className="mode-label">FOCUS</span>
                  <h3>苦手を、得意に。</h3>
                  <p>
                    品詞・動詞・語彙など、
                    <br />
                    6つの分野から集中トレーニング。
                  </p>
                  <span className="card-link">
                    分野を選ぶ
                    <ArrowRight size={17} />
                  </span>
                </button>
                <button
                  className="learning-card"
                  onClick={() => setPage("review")}
                >
                  <div className="mode-icon amber">
                    <BookOpen size={23} />
                  </div>
                  <span className="mode-label">REVIEW</span>
                  <h3>思い出すほど、身につく。</h3>
                  <p>
                    間違いも、迷った正解も。
                    <br />
                    もう一度向き合って、理解を深める。
                  </p>
                  <span className="card-link">
                    復習ノートを開く
                    <ArrowRight size={17} />
                  </span>
                </button>
                <button
                  className="learning-card challenge-card"
                  onClick={() => setModal("exam")}
                >
                  <div className="mode-icon ink">
                    <Clock size={23} />
                  </div>
                  <span className="mode-label">CHALLENGE</span>
                  <h3>30問で、今の力を。</h3>
                  <p>
                    初見用のセットに10分で挑戦。
                    <br />
                    正確さとスピードを確かめよう。
                  </p>
                  <span className="card-link">
                    チャレンジする
                    <ArrowRight size={17} />
                  </span>
                </button>
              </div>
              <div className="editorial-note">
                <ShieldCheck size={19} />
                <p>
                  すべて解答・日本語解説付きのオリジナル試作問題です。
                  <button
                    className="text-btn"
                    onClick={() => setModal("about")}
                  >
                    問題の制作方針
                  </button>
                </p>
              </div>
            </>
          )}
          {page === "practice" && (
            <>
              <PageHeading
                title="苦手を、ひとつずつ。"
                subtitle="解説を読みながら、自分のペースで進められます。"
                label="FOCUSED PRACTICE"
                titleRef={titleRef}
              />
              <div className="practice-banner">
                <div>
                  <h2>バランスよく練習したいなら</h2>
                  <p>6分野から、まだ解いていない問題を優先して出題。</p>
                </div>
                <button className="primary-btn" onClick={() => begin("daily")}>
                  今日の{state.settings.goal}問<ArrowRight size={18} />
                </button>
              </div>
              <LearningHub
                state={state}
                questions={questions}
                onStart={(ids, title) =>
                  begin("daily", undefined, false, { ids, title })
                }
              />
              <h2 className="all-units-heading">分野全体を練習する</h2>
              <div className="category-grid">
                {categories.map((c, i) => {
                  const Icon = icons[i];
                  const cs = categoryStats[i];
                  const remaining = questions.filter(
                    (q) =>
                      q.category === c &&
                      q.pool === "practice" &&
                      !state.attempts.some((a) => a.questionId === q.id),
                  ).length;
                  return (
                    <button
                      className="category-card"
                      key={c}
                      onClick={() => begin("category", c)}
                    >
                      <span className={`mode-icon ${i % 2 ? "blue" : "teal"}`}>
                        <Icon size={25} />
                      </span>
                      <div>
                        <span className="eyebrow">
                          UNIT {String(i + 1).padStart(2, "0")}
                        </span>
                        <h2>{c}</h2>
                        <p>
                          {
                            [
                              "名詞・形容詞・副詞の役割を見抜く",
                              "時制・態・動詞の形を捉える",
                              "文と文、語と節のつながりを読む",
                              "指すものと数の関係を整理する",
                              "語句の組み合わせを身につける",
                              "文脈に合う意味を選び取る",
                            ][i]
                          }
                        </p>
                      </div>
                      <div className="category-bottom">
                        <span>
                          {
                            questions.filter(
                              (q) => q.category === c && q.pool === "practice",
                            ).length
                          }
                          問 <i>·</i> 未回答 {remaining}問
                        </span>
                        <ChevronRight size={19} />
                      </div>
                      {cs.count > 0 && (
                        <div className="mini-progress">
                          <span style={{ width: `${cs.rate}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="fine-print">
                分野別の初見成績は「学習の記録」で確認できます。難易度・出題配分は試作段階です。
              </p>
            </>
          )}
          {page === "review" && (
            <>
              <PageHeading
                title="もう一度が、力になる。"
                subtitle="間違えた問題も、迷った問題も、ここから。"
                label="YOUR REVIEW NOTE"
                titleRef={titleRef}
              />
              <div className="review-toolbar">
                <div className="segmented" role="group" aria-label="復習の種類">
                  {(
                    [
                      { id: "due", label: `今日の復習 ${due.length}` },
                      {
                        id: "saved",
                        label: `あとで見る ${state.bookmarks.length}`,
                      },
                      { id: "all", label: "解いた問題" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      aria-pressed={reviewTab === t.id}
                      className={reviewTab === t.id ? "active" : ""}
                      onClick={() => setReviewTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <select
                  aria-label="復習の分野"
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value as Category | "all")
                  }
                >
                  <option value="all">すべての分野</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {due.length > 0 && reviewTab === "due" && (
                <div className="practice-banner">
                  <div>
                    <h2>{due.length}問が復習のタイミングです</h2>
                    <p>
                      期限の古い問題から、最大{state.settings.goal}
                      問を出題します。
                    </p>
                  </div>
                  <button
                    className="primary-btn"
                    onClick={() => begin("review")}
                  >
                    復習を始める
                    <RotateCcw size={18} />
                  </button>
                </div>
              )}
              {reviewList.length ? (
                <div className="review-list">
                  {reviewList.map((q) => {
                    const a = state.attempts
                      .filter((a) => a.questionId === q.id)
                      .at(-1);
                    return (
                      <button
                        className="review-row"
                        key={q.id}
                        onClick={() => readExplanation(q)}
                      >
                        <div className="review-row-top">
                          <span className="pill">{q.category}</span>
                          <span className="muted">
                            {a
                              ? a.correct
                                ? a.guessed
                                  ? "正解・迷いあり"
                                  : "前回正解"
                                : "前回不正解"
                              : "保存した問題"}
                          </span>
                        </div>
                        <p lang="en">{q.sentence}</p>
                        <div className="review-row-bottom">
                          <span>
                            {q.id}
                            {a
                              ? ` · 次の復習 ${new Date(dueAt(state, q.id)).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}`
                              : ""}
                          </span>
                          <span>
                            解説を読む
                            <ChevronRight size={17} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  title={
                    reviewTab === "due"
                      ? "今日の復習は、まだありません。"
                      : reviewTab === "saved"
                        ? "気になる一問を、残しておこう。"
                        : "最初の一問から、始めよう。"
                  }
                  text={
                    reviewTab === "due"
                      ? "解いた問題は翌日以降、回答に応じたタイミングでここに並びます。"
                      : reviewTab === "saved"
                        ? "問題画面のしおりを押すと、いつでも解説を読み返せます。"
                        : "トレーニングを始めると、解いた問題がここに並びます。"
                  }
                >
                  <button
                    className="primary-btn"
                    onClick={() => begin("daily")}
                  >
                    トレーニングを始める
                    <ArrowRight size={18} />
                  </button>
                </Empty>
              )}
            </>
          )}
          {page === "stats" && (
            <>
              <PageHeading
                title="積み重ねが、見えてくる。"
                subtitle="初めて解いた問題の成績と、復習の成績を分けて記録。"
                label="YOUR PROGRESS"
                titleRef={titleRef}
              />
              <div className="metric-grid">
                <Metric
                  label="初見の正答率"
                  value={rate(first) === null ? "—" : `${rate(first)}%`}
                  sub={`${first.length}問の初回回答`}
                />
                <Metric
                  label="復習の正答率"
                  value={
                    rate(state.attempts.filter((a) => !a.first)) === null
                      ? "—"
                      : `${rate(state.attempts.filter((a) => !a.first))}%`
                  }
                  sub={`${state.attempts.filter((a) => !a.first).length}回の再挑戦`}
                />
                <Metric
                  label="初見正解の平均時間"
                  value={
                    first.some((a) => a.correct)
                      ? `${Math.round(first.filter((a) => a.correct).reduce((n, a) => n + a.seconds, 0) / first.filter((a) => a.correct).length)}秒`
                      : "—"
                  }
                  sub="正解した問題のみ"
                />
              </div>
              <div className="stats-columns">
                <section className="panel">
                  <h2>分野ごとの初見正答率</h2>
                  <p className="muted small">
                    各分野3問未満は、まだ判断材料が少ない状態です。
                  </p>
                  <div className="skill-bars">
                    {categoryStats.map((c) => (
                      <div key={c.category}>
                        <div>
                          <b>{c.category}</b>
                          <span>
                            {c.rate === null ? "未回答" : `${c.rate}%`}{" "}
                            <small> / {c.count}問</small>
                          </span>
                        </div>
                        <div className="skill-track">
                          <span style={{ width: `${c.rate ?? 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {weakest && (
                    <button
                      className="recommendation"
                      onClick={() => begin("category", weakest.category)}
                    >
                      <Zap size={20} />
                      <span>次は「{weakest.category}」を練習しよう</span>
                      <ChevronRight size={18} />
                    </button>
                  )}
                </section>
                <section className="panel">
                  <h2>この7日間の学習</h2>
                  <div className="week-chart">
                    {week.map((d, i) => (
                      <div key={i}>
                        <b>{d.count}</b>
                        <div>
                          <span
                            style={{
                              height: `${d.count ? Math.max(5, (d.count / Math.max(...week.map((x) => x.count), 10)) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <small className={d.current ? "green" : ""}>
                          {d.day}
                        </small>
                      </div>
                    ))}
                  </div>
                  <p className="muted small">
                    初回・再挑戦を含む解答数。日付は端末の時刻で集計します。
                  </p>
                </section>
              </div>
              {!state.attempts.length && (
                <p className="fine-print">
                  まだ学習記録がありません。数値は問題を解くと表示されます。
                </p>
              )}
              <div className="editorial-note">
                <Info size={19} />
                <p>
                  この記録はアプリ内の学習状況です。TOEICの予測スコアや本番難易度の保証ではありません。
                </p>
              </div>
            </>
          )}
          {page === "settings" && (
            <>
              <PageHeading
                title="自分のペースに、合わせよう。"
                subtitle="学習の設定と、大切な記録のバックアップ。"
                label="SETTINGS"
                titleRef={titleRef}
              />
              <section className="panel settings-panel">
                <h2>学習と表示</h2>
                <div className="setting-row">
                  <div>
                    <b>1回のトレーニング</b>
                    <p>今日の目標にも反映されます。</p>
                  </div>
                  <select
                    aria-label="1回の問題数"
                    value={state.settings.goal}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        settings: {
                          ...s.settings,
                          goal: Number(e.target.value),
                        },
                      }))
                    }
                  >
                    {[5, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n}問
                      </option>
                    ))}
                  </select>
                </div>
                <div className="setting-row">
                  <div>
                    <b>英文を大きく表示</b>
                    <p>問題と選択肢を読みやすいサイズに。</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={state.settings.largeText}
                    aria-label="英文を大きく表示"
                    className={`switch ${state.settings.largeText ? "on" : ""}`}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        settings: {
                          ...s.settings,
                          largeText: !s.settings.largeText,
                        },
                      }))
                    }
                  >
                    <span />
                  </button>
                </div>
              </section>
              <section className="panel settings-panel">
                <h2>学習記録を持ち運ぶ</h2>
                <p className="muted">
                  記録はこのブラウザに保存されます。端末変更やブラウザのデータ削除に備えて、定期的に書き出してください。アカウント登録・クラウド同期はありません。
                </p>
                <div className="button-row">
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      download(
                        state,
                        `part5-backup-${new Date().toISOString().slice(0, 10)}.json`,
                      )
                    }
                  >
                    <Download size={18} />
                    記録を書き出す
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={18} />
                    記録を読み込む
                  </button>
                  <input
                    ref={fileRef}
                    className="sr-only"
                    type="file"
                    accept=".json,application/json"
                    aria-label="学習記録ファイル"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        if (f.size > 10_000_000) throw new Error();
                        setImportData(parseState(await f.text(), questions));
                      } catch {
                        setToast(
                          "このファイルは読み込めません。PART5 STUDIOから書き出したJSONを選んでください。",
                        );
                      }
                      e.target.value = "";
                    }}
                  />
                </div>
              </section>
              <section className="panel settings-panel">
                <h2>ホーム画面から、すぐ学習</h2>
                <p className="muted">
                  iPhoneはSafariの共有メニューから「ホーム画面に追加」。Androidはブラウザのメニューから「アプリをインストール」を選んでください。一度読み込んだ後はオフラインでも学習できます。
                </p>
                {installEvent && (
                  <button
                    className="secondary-btn"
                    onClick={async () => {
                      await installEvent.prompt();
                      setInstallEvent(null);
                    }}
                  >
                    <Download size={18} />
                    ホーム画面に追加
                  </button>
                )}
              </section>
              <section className="panel settings-panel">
                <h2>問題とアプリについて</h2>
                <p className="muted">
                  練習{practiceCount}問・チャレンジ{assessmentCount}
                  問（2セット）のオリジナル試作問題を収録。全問に正解・日本語訳・選択肢別の説明があります。追加90問には3段階の解き方も用意しました。
                </p>
                <button
                  className="setting-link"
                  onClick={() => setModal("about")}
                >
                  制作方針・検証状況
                  <ChevronRight size={19} />
                </button>
                <p className="fine-print">
                  TOEIC® is a registered trademark of ETS. This product is not
                  endorsed or approved by ETS.
                  本アプリはETSの公式教材ではありません。
                </p>
              </section>
            </>
          )}
          {page === "session" &&
            state.session &&
            (state.session.finishedAt ? (
              <ResultScreen
                state={state}
                onHome={() => setPage("home")}
                onRead={readExplanation}
              />
            ) : (
              <StudyScreen
                key={`${state.session.id}:${state.session.index}`}
                state={state}
                setState={setState}
                onHome={() => setPage("home")}
                onReport={report}
                onBookmark={bookmark}
              />
            ))}
        </main>
        <footer className="page-footer">
          <span>PART5 STUDIO</span>
          <span>少しずつ、確実に。</span>
          <button onClick={() => setModal("about")}>このアプリについて</button>
        </footer>
      </div>
      {page !== "session" && (
        <nav className="mobile-nav" aria-label="モバイルナビゲーション">
          {navItems.map(({ id, name, Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => setPage(id)}
            >
              <span>
                <Icon size={21} />
                {id === "review" && due.length > 0 && <i />}
              </span>
              {name}
            </button>
          ))}
        </nav>
      )}
      {modal === "exam" && (
        <Dialog title="30問チャレンジ" onClose={() => setModal(null)}>
          <div className="exam-intro">
            <span className="mode-icon ink">
              <Clock size={28} />
            </span>
            <strong>
              30問 <span>/</span> 10分
            </strong>
          </div>
          <p>
            トレーニングに出ない30問で、今の理解を確認します。途中の解説・ヒントはなく、終了後にまとめて確認できます。
          </p>
          <fieldset className="exam-set-picker">
            <legend>セットを選ぶ</legend>
            {(["analysis", "starter"] as const).map((set) => {
              const items = getExamSet(questions, set);
              const seen = items.filter(
                (q) =>
                  state.exposures[q.id] !== undefined ||
                  state.attempts.some((a) => a.questionId === q.id),
              ).length;
              return (
                <label key={set} className={examSet === set ? "selected" : ""}>
                  <input
                    type="radio"
                    name="exam-set"
                    value={set}
                    checked={examSet === set}
                    onChange={() => setExamSet(set)}
                  />
                  <span>
                    <strong>
                      {set === "analysis"
                        ? "セット02 · 分析を反映した30問"
                        : "セット01 · はじめの30問"}
                    </strong>
                    <small>
                      {set === "analysis"
                        ? "語彙・品詞を中心に6分野"
                        : "6分野を各5問"}{" "}
                      · 未閲覧 {30 - seen}問
                    </small>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <ul className="plain-list">
            <li>未回答の問題は保留して、後で戻れます。</li>
            <li>画面を閉じても制限時間は進みます。</li>
            <li>10分はこのアプリ独自の練習目標です。</li>
          </ul>
          {examItems.some(
            (q) =>
              state.exposures[q.id] !== undefined ||
              state.attempts.some((a) => a.questionId === q.id),
          ) && (
            <p className="notice">
              このセットには解いた問題や解説を見た問題が含まれます。その問題への再挑戦は初見成績には加算しません。
            </p>
          )}
          <p className="fine-print">
            試作問題のため、本番の出題配分・難易度を再現した模試ではありません。
          </p>
          <button
            className="primary-btn full-width"
            onClick={() =>
              begin("exam", undefined, false, {
                ids: examItems.map((q) => q.id),
                title:
                  examSet === "analysis"
                    ? "30問チャレンジ · セット02"
                    : "30問チャレンジ · セット01",
              })
            }
          >
            チャレンジを始める
            <ArrowRight size={18} />
          </button>
        </Dialog>
      )}
      {modal === "about" && (
        <Dialog
          title="一問ずつ、根拠のある学びを。"
          onClose={() => setModal(null)}
        >
          <div className="about-badge">
            <ShieldCheck size={20} />
            オリジナル試作問題 · BETA 02
          </div>
          <p>
            公開されているETS・IIBCのPart
            5サンプルを参考に、文法・語彙・構文・誤答の理由を整理して作成しました。公式問題の転載や単語の置き換えではありません。
          </p>
          <p>
            <strong>手元の資料7〜10のPart 5、240問を分析しました。</strong>
            8セットの分類と正解を確認し、オリジナル90問を追加しました。巻数はフォルダー名による識別です。表紙・奥付の確認、専門家による全問校閲、受験者データによる難易度比較は未実施です。
          </p>
          <p>
            難易度・出題割合・10分という目標は本番の保証ではありません。問題ごとに疑問点を報告でき、内容を更新できます。
          </p>
          <a
            className="setting-link"
            href="https://www.iibc-global.org/toeic/test/lr/about/format/sample05.html"
            target="_blank"
            rel="noreferrer"
          >
            IIBCの公式サンプルを見る
            <ArrowRight size={18} />
          </a>
          <p className="fine-print">
            学習記録は端末内に保存。氏名やメールアドレスの登録、広告、学習履歴の外部送信は行いません。公開基盤の通常のアクセスログはこの説明の対象外です。
          </p>
        </Dialog>
      )}
      {readQuestion && (
        <Dialog
          title={`${readQuestion.category} · 解説`}
          onClose={() => setReadQuestion(null)}
        >
          <Explanation
            q={readQuestion}
            choice={
              state.attempts
                .filter((a) => a.questionId === readQuestion.id)
                .at(-1)?.choice
            }
            onReport={() => report(readQuestion)}
          />
        </Dialog>
      )}
      {reportQuestion && (
        <Dialog
          title="問題・解説の気になる点"
          onClose={() => setReportQuestion(null)}
        >
          <p>
            問題IDと内容をファイルにまとめます。作成者にこのファイルを渡してください。自動送信はされません。
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              download(
                {
                  questionId: reportQuestion.id,
                  version: reportQuestion.version,
                  category: reportQuestion.category,
                  comment: data.get("comment"),
                  createdAt: new Date().toISOString(),
                },
                `${reportQuestion.id}-report.json`,
              );
              setReportQuestion(null);
              setToast("報告ファイルを書き出しました。");
            }}
          >
            <label className="field-label" htmlFor="report-comment">
              気になる箇所・理由
            </label>
            <textarea
              id="report-comment"
              name="comment"
              required
              maxLength={2000}
              rows={4}
              placeholder="例：選択肢Bも入るように感じました。"
            />
            <button type="submit" className="primary-btn full-width">
              <Download size={18} />
              報告ファイルを作る
            </button>
          </form>
        </Dialog>
      )}
      {pendingStart && (
        <Dialog
          title="別のトレーニングを始めますか？"
          onClose={() => setPendingStart(null)}
        >
          <p>
            進行中の「{state.session?.title}
            」があります。新しく始めると、今のセッションの続きは再開できません。確定済みの練習成績は残ります。未採点のチャレンジ回答は成績に入りません。
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-btn"
              onClick={() => {
                setPendingStart(null);
                setModal(null);
                setPage("session");
              }}
            >
              続きに戻る
            </button>
            <button
              className="primary-btn"
              onClick={() =>
                begin(
                  pendingStart.mode,
                  pendingStart.category,
                  true,
                  pendingStart.selection,
                )
              }
            >
              新しく始める
            </button>
          </div>
        </Dialog>
      )}
      {importData && (
        <Dialog
          title="学習記録を読み込みますか？"
          onClose={() => setImportData(null)}
        >
          <p>
            現在の{state.attempts.length}件の回答を、ファイル内の
            {importData.attempts.length}
            件で置き換えます。現在の記録を残す場合は、先に書き出してください。
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-btn"
              onClick={() => download(state, "part5-before-import.json")}
            >
              現在の記録を書き出す
            </button>
            <button
              className="primary-btn"
              onClick={() => {
                setState(importData);
                setStorageBlocked(false);
                setError(null);
                setImportData(null);
                setToast("学習記録を読み込みました。");
              }}
            >
              置き換えて読み込む
            </button>
          </div>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
function PageHeading({
  title,
  subtitle,
  label,
  titleRef,
}: {
  title: string;
  subtitle: string;
  label: string;
  titleRef: React.RefObject<HTMLHeadingElement>;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{label}</p>
        <h1 ref={titleRef} tabIndex={-1}>
          {title}
        </h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

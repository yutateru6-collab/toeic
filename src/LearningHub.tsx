import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Search,
  BarChart3,
  ListChecks,
} from "lucide-react";
import {
  categories,
  chooseQuestions,
  type Category,
  type Question,
  type State,
} from "./model";
import { allTopics, getTopicQuestions, topicGroups } from "./topicTraining";
import { part5Tips, part5Timing } from "./part5Tips";
import "./part5-tips.css";
import "./topic-training.css";

export const corpusCounts = [69, 15, 33, 13, 27, 83];

export type HubView = "select" | "topics" | "guide" | "analysis";

export default function LearningHub({
  state,
  questions,
  onStart,
  initialView = "select",
}: {
  initialView?: HubView;
  state: State;
  questions: Question[];
  onStart: (ids: string[], title: string) => void;
}) {
  const [view, setView] = useState<HubView>(initialView);
  useEffect(() => setView(initialView), [initialView]);
  const [category, setCategory] = useState<Category | "all">("all");
  const [skill, setSkill] = useState("all");
  const [collection, setCollection] = useState("analysis");

  const practice = questions.filter(
    (q) =>
      q.pool === "practice" &&
      (collection === "all" || q.collection === "analysis") &&
      (category === "all" || q.category === category),
  );
  const skills = [
    ...new Set(practice.flatMap((q) => (q.skill ? [q.skill] : []))),
  ];
  const filtered = practice.filter((q) => skill === "all" || q.skill === skill);
  const selected = chooseQuestions(
    state,
    filtered,
    "daily",
    category === "all" ? undefined : category,
  );
  const seen = new Set([
    ...state.attempts.map((a) => a.questionId),
    ...Object.keys(state.exposures),
  ]);

  const startTopic = (topicId: string, topicLabel: string) => {
    const pool = getTopicQuestions(questions, topicId);
    const picked = chooseQuestions(state, pool, "daily");
    if (!picked.length) return;
    onStart(
      picked.map((q) => q.id),
      `${topicLabel} · 論点別特訓`,
    );
  };

  const topicAccuracy = (ids: Set<string>) => {
    const attempts = state.attempts.filter(
      (attempt) => attempt.first && ids.has(attempt.questionId),
    );
    if (!attempts.length) return null;
    return Math.round(
      (100 * attempts.filter((attempt) => attempt.correct).length) /
        attempts.length,
    );
  };

  return (
    <section className="learning-hub" aria-label="問題選択と学び方">
      <div className="hub-heading">
        <span className="eyebrow green">DEEPEN YOUR PRACTICE</span>
        <h2>解き方から、身につける。</h2>
        <p>
          分野だけでなく、時制・受動態・関係詞など論点ごとにも反復できます。
        </p>
      </div>
      <div className="hub-tabs" role="group" aria-label="学習コンテンツの表示">
        {(
          [
            ["select", "問題を選ぶ", Search],
            ["topics", "論点別特訓", ListChecks],
            ["guide", "Part 5のコツ・注意点", BookOpen],
            ["analysis", "分析の内容", BarChart3],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            aria-pressed={view === id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {view === "select" && (
        <div className="hub-panel">
          <div className="hub-filters">
            <label>
              問題の範囲
              <select
                value={collection}
                onChange={(e) => {
                  setCollection(e.target.value);
                  setSkill("all");
                }}
              >
                <option value="analysis">新しく追加した60問</option>
                <option value="all">すべての練習120問</option>
              </select>
            </label>
            <label>
              分野
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category | "all");
                  setSkill("all");
                }}
              >
                <option value="all">すべての分野</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              論点
              <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option value="all">すべての論点</option>
                {skills.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="hub-start">
            <div>
              <strong>{filtered.length}問</strong>
              <span>
                うち未閲覧 {filtered.filter((q) => !seen.has(q.id)).length}問
              </span>
              <small>未回答を優先。1回の問題数は設定で変更できます。</small>
            </div>
            <button
              disabled={!selected.length}
              className="primary-btn"
              onClick={() =>
                onStart(
                  selected.map((q) => q.id),
                  `${collection === "analysis" ? "追加問題" : "論点別練習"} · ${skill !== "all" ? skill : category === "all" ? "ミックス" : category}`,
                )
              }
            >
              {selected.length}問を始める
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {view === "topics" && (
        <div className="hub-panel topic-training-panel">
          <div className="topic-training-lead">
            <div>
              <span className="eyebrow green">FOCUS DRILL</span>
              <h3>苦手な論点だけ、連続で解く。</h3>
              <p>
                「時制」なら時制だけ。「受動態」なら受動態だけ。未閲覧の問題を優先して、設定した問題数まで出題します。
              </p>
            </div>
            <span className="topic-goal">1回 {state.settings.goal}問</span>
          </div>

          <div className="topic-groups">
            {topicGroups.map((group) => {
              const availableTopics = group.topics
                .map((topic) => {
                  const pool = getTopicQuestions(questions, topic.id);
                  const ids = new Set(pool.map((q) => q.id));
                  return {
                    topic,
                    pool,
                    unseen: pool.filter((q) => !seen.has(q.id)).length,
                    accuracy: topicAccuracy(ids),
                  };
                })
                .filter(({ pool }) => pool.length > 0);

              if (!availableTopics.length) return null;

              return (
                <section className="topic-group" key={group.category}>
                  <div className="topic-group-heading">
                    <div>
                      <span>{group.category}</span>
                      <p>{group.description}</p>
                    </div>
                    <small>{availableTopics.length}論点</small>
                  </div>
                  <div className="topic-card-grid">
                    {availableTopics.map(
                      ({ topic, pool, unseen, accuracy }) => {
                        const count = Math.min(
                          state.settings.goal,
                          pool.length,
                        );
                        return (
                          <button
                            className="topic-card"
                            key={topic.id}
                            onClick={() => startTopic(topic.id, topic.label)}
                            aria-label={`${topic.label}を${count}問始める`}
                          >
                            <div className="topic-card-top">
                              <strong>{topic.label}</strong>
                              <span>{pool.length}問</span>
                            </div>
                            <p>{topic.description}</p>
                            <div className="topic-card-meta">
                              <span>未閲覧 {unseen}問</span>
                              <span>
                                {accuracy === null
                                  ? "初見成績 —"
                                  : `初見 ${accuracy}%`}
                              </span>
                            </div>
                            <div className="topic-card-action">
                              {count}問を始める
                              <ArrowRight size={16} />
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="fine-print topic-note">
            1問に複数の論点が含まれる場合は、複数の特訓に入ることがあります。分類は問題の解説・構文・選択肢を基準にしています。
          </p>
        </div>
      )}

      {view === "guide" && (
        <div className="hub-panel guide-list part5-tips">
          <div className="tips-intro">
            <span className="eyebrow green">READ · REASON · PRACTICE</span>
            <h3>Part 5のコツ・注意点</h3>
            <p>
              形で絞り、意味で確かめる。例文の根拠を理解したら、同じ論点を特訓しましょう。
            </p>
            <small>
              例文はすべて本アプリの自作教材です。公式問題ではありません。
            </small>
          </div>
          <details className="tips-timing">
            <summary>
              <div>
                <small>試験構成と練習の目安</small>
                <strong>時間配分は、正答率と残り時間で調整</strong>
              </div>
            </summary>
            <div className="guide-body">
              <p>
                <strong>公式の試験構成</strong>
                <br />
                {part5Timing.official}
              </p>
              <p>
                <strong>このアプリからの練習案</strong>
                <br />
                {part5Timing.practice}
              </p>
              <p>{part5Timing.review}</p>
              <a
                className="setting-link"
                href={part5Timing.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {part5Timing.sourceLabel}
                <ArrowRight size={16} />
              </a>
              <small>試験構成の確認日：{part5Timing.checkedAt}</small>
            </div>
          </details>
          {part5Tips.map((tip, i) => (
            <details key={tip.id}>
              <summary>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{tip.title}</strong>
                </div>
              </summary>
              <div className="guide-body">
                <ol>
                  {tip.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {tip.examples.map((example) => (
                  <section
                    className="tip-example"
                    key={example.sentence}
                    aria-label="自作例文と解説"
                  >
                    <p className="guide-example" lang="en">
                      {example.sentence}
                    </p>
                    <p className="tip-answer">
                      <strong>
                        正解：<span lang="en">{example.answer}</span>
                      </strong>
                      <br />
                      {example.reason}
                    </p>
                    <p className="tip-translation">
                      和訳：{example.translation}
                    </p>
                    <h4>他の選択肢が合わない理由</h4>
                    <dl className="tip-distractors">
                      {example.wrong.map((choice) => (
                        <div key={choice.word}>
                          <dt lang="en">{choice.word}</dt>
                          <dd>{choice.reason}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
                <div className="tip-practice" aria-label="関連する論点別特訓">
                  {tip.topicIds.map((topicId) => {
                    const topic = allTopics.find((item) => item.id === topicId);
                    if (!topic) return null;
                    const pool = getTopicQuestions(questions, topicId);
                    return (
                      <button
                        className="text-btn"
                        key={topicId}
                        disabled={!pool.length}
                        onClick={() => startTopic(topic.id, topic.label)}
                      >
                        {topic.label}を特訓
                        <ArrowRight size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {view === "analysis" && (
        <div className="hub-panel corpus-panel">
          <div className="corpus-lead">
            <strong>
              240<span>問</span>
            </strong>
            <p>
              手元の問題資料7〜10
              <br />
              8セットのPart 5を分析
            </p>
          </div>
          <p>
            空欄の役割・文脈・誤答の作り方を分類し、各問の正解を解答資料と照合しました。
          </p>
          <div className="corpus-bars">
            {categories.map((c, i) => (
              <div key={c}>
                <span>{c}</span>
                <div>
                  <i style={{ width: `${(corpusCounts[i] / 83) * 100}%` }} />
                </div>
                <b>
                  {corpusCounts[i]}問{" "}
                  <small>{((corpusCounts[i] / 240) * 100).toFixed(1)}%</small>
                </b>
              </div>
            ))}
          </div>
          <p>
            語彙と品詞を厚くし、追加90問を制作。うち30問はチャレンジ専用です。解説では「見る
            → 判断 → 確認」の順に根拠をたどれます。
          </p>
          <p className="fine-print">
            この内訳は分析対象の観測値で、本番の固定配分ではありません。巻数はフォルダー名による識別です。追加問題の難易度は受験者データで校正していません。
          </p>
          <a
            className="setting-link"
            href="https://github.com/yutateru6-collab/toeic/blob/main/docs/local-corpus-analysis.md"
            target="_blank"
            rel="noreferrer"
          >
            分析方法・出典範囲を読む
            <ArrowRight size={16} />
          </a>
        </div>
      )}
    </section>
  );
}

import { useState } from "react";
import { ArrowRight, BookOpen, Search, BarChart3 } from "lucide-react";
import {
  categories,
  chooseQuestions,
  type Category,
  type Question,
  type State,
} from "./model";

const guides = [
  {
    title: "語尾より先に、文の中の役割を見る",
    steps: [
      "空欄の前後に冠詞・所有格・名詞があるか探す。",
      "名詞が必要か、名詞や動詞を修飾する語が必要か決める。",
      "副詞なら修飾先まで確認。数値や比較級にかかる場合もある。",
    ],
    example: "The estimate is considerably lower.",
    note: "considerablyは比較級lowerを修飾。副詞は動詞だけを修飾するわけではありません。",
  },
  {
    title: "主語の中心と、述語を見つける",
    steps: [
      "長い主語では中心の名詞を探す。直前の複数名詞に引かれない。",
      "すでに述語があるなら、空欄が分詞・不定詞の修飾ではないか確認する。",
      "主語が動作をする側か、される側か。時の表現と一致も確認する。",
    ],
    example: "The number of visitors has doubled.",
    note: "主語の中心は単数のnumber。visitorsにつられてhaveを選ばない。",
  },
  {
    title: "空欄の後ろは、節か名詞句か",
    steps: [
      "主語と動詞がそろった節か、名詞だけの句かを見る。",
      "理由・対比・条件など、前後の関係を確かめる。",
      "関係詞なら、後ろの節に欠けている主語・目的語・所有関係を見る。",
    ],
    example: "Despite the fog, the road remained open.",
    note: "the fogは名詞句。Althoughを使うなら、例えばalthough it was foggyという節にする。",
  },
  {
    title: "指す相手と、数えられるかを確かめる",
    steps: [
      "代名詞が誰・何を指すか確認する。",
      "主語・目的語・所有のどの役割かを見る。",
      "数量表現では、名詞の可算性と単数・複数を確認する。",
    ],
    example: "We need a few chairs and a little space.",
    note: "chairsは可算複数、spaceはここでは不可算。意味だけでfewとlittleを選ばない。",
  },
  {
    title: "前後の語を、ひとまとまりで読む",
    steps: [
      "前置詞の直前の動詞・形容詞・名詞を見る。",
      "決まった組み合わせか、時間・場所の意味を問うか判断する。",
      "期限ならby、継続の終点ならuntilなど、文全体で確認する。",
    ],
    example: "The counter stays open until six.",
    note: "営業状態が6時まで続く。提出を6時までに完了するならsubmit it by six。",
  },
  {
    title: "4語とも入る形なら、文意で絞る",
    steps: [
      "選択肢が同じ品詞か確認する。語尾だけでは決めない。",
      "目的語、理由節、対比や言い換えなど、決め手になる情報を探す。",
      "選んだ語を入れ、前置詞や目的語との組み合わせも自然か確かめる。",
    ],
    example: "Please retain the label as proof of origin.",
    note: "proofとして後で使うのでretain（保管する）。理由・目的の部分まで読む。",
  },
];
export const corpusCounts = [69, 15, 33, 13, 27, 83];
export default function LearningHub({
  state,
  questions,
  onStart,
}: {
  state: State;
  questions: Question[];
  onStart: (ids: string[], title: string) => void;
}) {
  const [view, setView] = useState("select");
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
  const startCategory = (c: Category) => {
    const selected = chooseQuestions(state, questions, "category", c);
    onStart(
      selected.map((q) => q.id),
      `${c} · ガイドの実践`,
    );
  };
  return (
    <section className="learning-hub" aria-label="問題選択と学び方">
      <div className="hub-heading">
        <span className="eyebrow green">DEEPEN YOUR PRACTICE</span>
        <h2>解き方から、身につける。</h2>
        <p>追加60問の練習と、6分野の読み方ガイド。</p>
      </div>
      <div className="hub-tabs" role="group" aria-label="学習コンテンツの表示">
        {(
          [
            ["select", "問題を選ぶ", Search],
            ["guide", "解き方ガイド", BookOpen],
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
      {view === "guide" && (
        <div className="hub-panel guide-list">
          {guides.map((g, i) => (
            <details key={g.title}>
              <summary>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <small>{categories[i]}</small>
                  <strong>{g.title}</strong>
                </div>
              </summary>
              <div className="guide-body">
                <ol>
                  {g.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className="guide-example" lang="en">
                  {g.example}
                </p>
                <p>{g.note}</p>
                <button
                  className="text-btn"
                  onClick={() => startCategory(categories[i])}
                >
                  この分野で試す
                  <ArrowRight size={16} />
                </button>
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

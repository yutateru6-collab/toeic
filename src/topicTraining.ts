import type { Category, Question } from "./model";

export type TrainingTopic = {
  id: string;
  label: string;
  category: Category;
  description: string;
};

export type TrainingTopicGroup = {
  category: Category;
  description: string;
  topics: TrainingTopic[];
};

export const topicGroups: TrainingTopicGroup[] = [
  {
    category: "品詞",
    description: "空所の位置と修飾関係から、必要な品詞を見抜く。",
    topics: [
      { id: "pos-noun", label: "名詞", category: "品詞", description: "冠詞・所有格・主語・目的語の位置を集中練習。" },
      { id: "pos-adjective", label: "形容詞", category: "品詞", description: "名詞修飾と補語になる形容詞を見抜く。" },
      { id: "pos-adverb", label: "副詞", category: "品詞", description: "動詞・形容詞・副詞・数値の修飾を練習。" },
      { id: "pos-comparison", label: "比較級・最上級", category: "品詞", description: "than、more、mostなど比較表現に絞る。" },
    ],
  },
  {
    category: "動詞",
    description: "時制・一致・態・準動詞を分けて反復する。",
    topics: [
      { id: "verb-tense", label: "時制", category: "動詞", description: "現在・過去・未来・完了形を時の手がかりから判断。" },
      { id: "verb-agreement", label: "主語と動詞の一致", category: "動詞", description: "単数・複数、Each、Neitherなどの一致を集中練習。" },
      { id: "verb-passive", label: "受動態", category: "動詞", description: "する側・される側を見て能動／受動を判断。" },
      { id: "verb-nonfinite", label: "不定詞・動名詞・分詞", category: "動詞", description: "to do / -ing / 過去分詞の使い分け。" },
      { id: "verb-condition", label: "条件・仮定", category: "動詞", description: "if / unless と未来・反実仮想の形を確認。" },
    ],
  },
  {
    category: "接続・関係詞",
    description: "後ろが節か名詞句か、文同士の関係は何かを見抜く。",
    topics: [
      { id: "link-clause", label: "節 vs 名詞句", category: "接続・関係詞", description: "While / During、Although / Despiteなどを整理。" },
      { id: "link-relative", label: "関係詞", category: "接続・関係詞", description: "who / which / whoseなど、節の欠け方から判断。" },
      { id: "link-logic", label: "論理関係・接続詞", category: "接続・関係詞", description: "理由・逆接・条件・時間のつながりに集中。" },
      { id: "link-correlative", label: "相関表現", category: "接続・関係詞", description: "both A and B / either A or Bなどを反復。" },
      { id: "link-indirect", label: "間接疑問", category: "接続・関係詞", description: "whether / where など疑問詞節・疑問詞＋to do。" },
    ],
  },
  {
    category: "代名詞・数量",
    description: "代名詞の役割と、可算・不可算／単数・複数を整理する。",
    topics: [
      { id: "pronoun-case", label: "代名詞の格", category: "代名詞・数量", description: "主格・目的格・所有格・所有代名詞を使い分ける。" },
      { id: "pronoun-reflexive", label: "再帰代名詞", category: "代名詞・数量", description: "myself / themselvesなど、主語との対応を確認。" },
      { id: "quantifiers", label: "数量表現", category: "代名詞・数量", description: "many / much / few / little / each / anotherなど。" },
    ],
  },
  {
    category: "前置詞・語法",
    description: "前置詞の意味と、決まった語の組み合わせを分けて覚える。",
    topics: [
      { id: "prep-choice", label: "前置詞の使い分け", category: "前置詞・語法", description: "by / until / between / among / exceptなどを文脈で判断。" },
      { id: "prep-collocation", label: "語法・コロケーション", category: "前置詞・語法", description: "be responsible for、in accordance withなどを反復。" },
    ],
  },
  {
    category: "語彙",
    description: "文脈と語の組み合わせから、同じ品詞の選択肢を絞る。",
    topics: [
      { id: "vocab-context", label: "文脈語彙", category: "語彙", description: "語彙問題全体を文脈の手がかりで解く。" },
      { id: "vocab-verb", label: "動詞語彙", category: "語彙", description: "目的語や後続表現から適切な動詞を選ぶ。" },
      { id: "vocab-noun", label: "名詞語彙", category: "語彙", description: "状況に合う名詞・ビジネス語彙を確認。" },
      { id: "vocab-adjective", label: "形容詞語彙", category: "語彙", description: "名詞や補語に合う形容詞を文脈で判断。" },
      { id: "vocab-adverb", label: "副詞語彙", category: "語彙", description: "動作や程度に合う副詞を選ぶ。" },
      { id: "vocab-collocation", label: "語の組み合わせ", category: "語彙", description: "reset a passwordなど自然な組み合わせを覚える。" },
    ],
  },
];

export const allTopics = topicGroups.flatMap((group) => group.topics);

const cue = (q: Question) =>
  `${q.skill ?? ""} ${q.takeaway} ${q.translation} ${q.sentence}`.toLowerCase();

const skillIs = (q: Question, skill: string) => q.skill === skill;
const categoryIs = (q: Question, category: Category) => q.category === category;
const has = (q: Question, pattern: RegExp) => pattern.test(cue(q));

function matchesPos(q: Question, topicId: string) {
  if (!categoryIs(q, "品詞")) return false;
  const takeaway = q.takeaway;
  if (topicId === "pos-comparison")
    return skillIs(q, "比較の形") || /比較級|最上級|\bthan\b|moreとthan|more .* than|most /.test(cue(q));
  if (topicId === "pos-noun")
    return skillIs(q, "名詞の位置") || (!q.skill && /名詞が必要|名詞を選ぶ|主語になる名詞|目的語となる名詞|冠詞.*名詞|所有格.*名詞|単数の可算名詞/.test(takeaway));
  if (topicId === "pos-adjective")
    return skillIs(q, "形容詞の位置") || (!q.skill && /形容詞を選ぶ|補語.*形容詞|名詞.*修飾.*形容詞|状態を表す形容詞|形容詞が必要/.test(takeaway));
  if (topicId === "pos-adverb")
    return skillIs(q, "副詞の修飾先") || (!q.skill && /副詞を選ぶ|修飾するのは副詞|副詞で|動詞.*修飾|動作.*副詞/.test(takeaway));
  return false;
}

function matchesVerb(q: Question, topicId: string) {
  if (!categoryIs(q, "動詞")) return false;
  const c = cue(q);
  const timeCue = /現在完了|過去完了|過去形|現在形|未来|時制|since |last |by the time|next year|by now|yesterday|tomorrow|already|before .* arrived/;
  const agreementCue = /主語の中心|主語.*一致|単数|複数|neither|each of|the number of|team leaders|三単現/;
  if (topicId === "verb-tense")
    return (skillIs(q, "時制・一致") && timeCue.test(c)) || (!q.skill && timeCue.test(c));
  if (topicId === "verb-agreement")
    return (skillIs(q, "時制・一致") && agreementCue.test(c)) || (!q.skill && agreementCue.test(c));
  if (topicId === "verb-passive")
    return skillIs(q, "能動・受動") || (!q.skill && /受動|される側|受ける必要|受動の|be approved|is updated|過去分詞で始める/.test(c));
  if (topicId === "verb-nonfinite")
    return skillIs(q, "非定形動詞") || (!q.skill && /動名詞|不定詞|分詞|to do|to不定詞|使役|have＋物＋過去分詞|accustomed to|require＋人/.test(c));
  if (topicId === "verb-condition")
    return /反実仮想|仮定|条件節|unless |\bif\b/.test(c);
  return false;
}

function matchesLink(q: Question, topicId: string) {
  if (!categoryIs(q, "接続・関係詞")) return false;
  if (topicId === "link-clause") return skillIs(q, "節と名詞句") || (!q.skill && /節|名詞句/.test(q.takeaway));
  if (topicId === "link-relative") return skillIs(q, "関係詞") || (!q.skill && /関係代名詞|関係詞|先行詞/.test(q.takeaway));
  if (topicId === "link-logic") return skillIs(q, "論理関係") || (!q.skill && /逆接|理由|条件|接続詞|時間.*節/.test(q.takeaway));
  if (topicId === "link-correlative") return skillIs(q, "相関表現") || (!q.skill && /both|either|neither|相関/.test(cue(q)));
  if (topicId === "link-indirect") return skillIs(q, "間接疑問") || (!q.skill && /間接疑問|疑問詞/.test(q.takeaway));
  return false;
}

function matchesPronoun(q: Question, topicId: string) {
  if (!categoryIs(q, "代名詞・数量")) return false;
  if (topicId === "pronoun-case") return skillIs(q, "代名詞の格") || (!q.skill && /主格|目的格|所有格|所有代名詞/.test(q.takeaway));
  if (topicId === "pronoun-reflexive") return skillIs(q, "再帰代名詞") || (!q.skill && /再帰代名詞|自身|自分/.test(cue(q)));
  if (topicId === "quantifiers") return skillIs(q, "数量表現") || (!q.skill && /可算|不可算|数量|複数名詞|単数名詞|few|little|many|much|each|another/.test(cue(q)));
  return false;
}

function matchesPrep(q: Question, topicId: string) {
  if (!categoryIs(q, "前置詞・語法")) return false;
  if (topicId === "prep-choice") return skillIs(q, "前置詞の選択") || !q.skill;
  if (topicId === "prep-collocation") return skillIs(q, "語法の組み合わせ") || (!q.skill && /語法|組み合わせ|responsible|accordance|emphasis|depend|interested|apply|comply/.test(cue(q)));
  return false;
}

function matchesVocab(q: Question, topicId: string) {
  if (!categoryIs(q, "語彙")) return false;
  if (topicId === "vocab-context") return true;
  if (topicId === "vocab-verb") return skillIs(q, "文脈で選ぶ動詞");
  if (topicId === "vocab-noun") return skillIs(q, "文脈で選ぶ名詞");
  if (topicId === "vocab-adjective") return skillIs(q, "文脈で選ぶ形容詞");
  if (topicId === "vocab-adverb") return skillIs(q, "文脈で選ぶ副詞");
  if (topicId === "vocab-collocation") return skillIs(q, "語の組み合わせ") || (!q.skill && /組み合わせ|\b[a-z]+ a \b|\b[a-z]+ an \b/.test(cue(q)));
  return false;
}

export function questionMatchesTopic(q: Question, topicId: string): boolean {
  return (
    matchesPos(q, topicId) ||
    matchesVerb(q, topicId) ||
    matchesLink(q, topicId) ||
    matchesPronoun(q, topicId) ||
    matchesPrep(q, topicId) ||
    matchesVocab(q, topicId)
  );
}

export function getTopicQuestions(questions: Question[], topicId: string): Question[] {
  return questions.filter((q) => q.pool === "practice" && questionMatchesTopic(q, topicId));
}

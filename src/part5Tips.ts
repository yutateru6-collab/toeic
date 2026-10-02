export type TipExample = {
  sentence: string;
  answer: string;
  translation: string;
  reason: string;
  wrong: { word: string; reason: string }[];
};

export type Part5Tip = {
  id: string;
  title: string;
  steps: string[];
  examples: TipExample[];
  topicIds: string[];
};

// All examples below are original teaching examples, not official test items.
export const part5Tips: Part5Tip[] = [
  {
    id: "word-class",
    title: "品詞は、語尾より文の中の役割で判断",
    steps: [
      "選択肢が同じ語の派生形なら、空所に必要な品詞を先に考える。冠詞・所有格、名詞、動詞との関係を見る。",
      "語尾は手がかり。副詞は動詞だけでなく形容詞や比較級も修飾するので、修飾先まで確認する。",
    ],
    examples: [
      {
        sentence: "The team needs your ------- before Friday.",
        answer: "approval",
        translation: "チームは金曜日より前にあなたの承認を必要としています。",
        reason:
          "needsの目的語で、所有格yourの後に来る名詞が必要。approvalは「承認」。",
        wrong: [
          {
            word: "approve",
            reason: "動詞なので、yourに続く名詞の位置に置けない。",
          },
          {
            word: "approves",
            reason:
              "動詞の三人称単数現在形で、所有格yourの後の名詞にはならない。",
          },
          { word: "approvingly", reason: "副詞で、needsの目的語にならない。" },
        ],
      },
    ],
    topicIds: ["pos-noun", "pos-adjective", "pos-adverb"],
  },
  {
    id: "reading-scope",
    title: "空所前後で絞り、必要なら文全体へ",
    steps: [
      "品詞や定型表現は空所前後から候補を絞れる。ただし、選んだ語を入れて文全体の構造と意味を確かめる。",
      "同じ品詞の語彙、時制、接続詞は、理由・対比・時間の手がかりまで読む。「意味を読まない」を万能則にしない。",
    ],
    examples: [
      {
        sentence:
          "The outdoor tour was ------- because a severe storm was approaching.",
        answer: "canceled",
        translation: "激しい嵐が近づいていたため、屋外ツアーは中止されました。",
        reason:
          "because以下が理由。荒天への対応として「中止された」が文全体に合う。",
        wrong: [
          {
            word: "extended",
            reason:
              "「延長された」。荒天が迫ることを延長の理由にするのは、この文脈に合わない。",
          },
          {
            word: "celebrated",
            reason: "「祝われた」。嵐の接近との因果関係に合わない。",
          },
          {
            word: "printed",
            reason: "「印刷された」。ここでのtourは印刷物ではなく屋外ツアー。",
          },
        ],
      },
    ],
    topicIds: ["vocab-context", "link-logic"],
  },
  {
    id: "agreement",
    title: "主語と動詞の一致は、主語の中心を見る",
    steps: [
      "前置詞句などの修飾をいったん外し、主語の中心が単数か複数かを確認する。動詞の直前の名詞だけで決めない。",
      "each、the number ofなどはまとまりごとに確認。時制も別に確かめる。",
    ],
    examples: [
      {
        sentence: "Each of the printers ------- a monthly inspection.",
        answer: "requires",
        translation: "そのプリンターはそれぞれ、毎月の点検が必要です。",
        reason:
          "主語の中心は単数扱いのEach。現在の定期的な必要性なのでrequires。",
        wrong: [
          {
            word: "require",
            reason:
              "現在形では単数主語Eachに一致しない。printersにつられない。",
          },
          {
            word: "requiring",
            reason: "分詞だけでは、この文の述語動詞にならない。",
          },
          {
            word: "to require",
            reason: "不定詞だけでは、この文の述語動詞にならない。",
          },
        ],
      },
    ],
    topicIds: ["verb-agreement"],
  },
  {
    id: "tense-voice",
    title: "時制と態は、時間と主語の役割を分けて確認",
    steps: [
      "yesterday、since、by the timeなどを探し、出来事の前後関係を見る。単語1つだけで機械的に時制を決めない。",
      "主語が行為をする側か、受ける側かを確認する。受動態は基本的にbe動詞＋過去分詞。",
    ],
    examples: [
      {
        sentence: "The invoices ------- by the accountant yesterday.",
        answer: "were checked",
        translation: "請求書は昨日、会計担当者によって確認されました。",
        reason:
          "yesterdayは完了した過去の時点。複数のinvoicesは確認される側なので、過去の受動態were checked。",
        wrong: [
          {
            word: "are checked",
            reason: "現在形は、この文のyesterdayという過去の時点に合わない。",
          },
          {
            word: "checked",
            reason: "能動態になり、請求書が確認する側になってしまう。",
          },
          {
            word: "were checking",
            reason: "能動の進行形。請求書が確認作業をする意味になり合わない。",
          },
        ],
      },
    ],
    topicIds: ["verb-tense", "verb-passive"],
  },
  {
    id: "nonfinite",
    title: "準動詞は、前の語と文中の役割をセットで",
    steps: [
      "述語動詞がすでにあるかを確認し、to do・動名詞・分詞のどの役割が必要か考える。",
      "toが不定詞の印とは限らない。look forward toのtoは前置詞で、その後は名詞や動名詞。動詞ごとの後続形も覚える。",
    ],
    examples: [
      {
        sentence: "We look forward to ------- you at the workshop.",
        answer: "meeting",
        translation: "ワークショップでお会いするのを楽しみにしています。",
        reason:
          "look forward toのtoは前置詞。動作を続けるなら動名詞meetingを使う。",
        wrong: [
          {
            word: "meet",
            reason: "このtoは不定詞のtoではないので、動詞の原形は続かない。",
          },
          {
            word: "met",
            reason:
              "過去形・過去分詞で、この前置詞の目的語となる動作を表せない。",
          },
          {
            word: "to meet",
            reason: "toが重なり、look forward to to meetという形になる。",
          },
        ],
      },
    ],
    topicIds: ["verb-nonfinite", "prep-collocation"],
  },
  {
    id: "pronouns-quantifiers",
    title: "代名詞・限定詞は、役割と名詞の数を確認",
    steps: [
      "代名詞は指す相手を確認し、主語・目的語・所有のどれかを判断する。再帰代名詞は主語との対応を見る。",
      "数量表現は、後ろの名詞が可算か不可算か、単数か複数かを確認する。a fewとfewのような意味の違いも読む。",
    ],
    examples: [
      {
        sentence: "Please send ------- the revised schedule.",
        answer: "us",
        translation: "修正した予定表を私たちに送ってください。",
        reason: "send＋人＋物の形。人を表す目的格usが必要。",
        wrong: [
          { word: "we", reason: "主格なのでsendの目的語にならない。" },
          {
            word: "our",
            reason:
              "所有格なので、後ろに直接名詞が必要。our the scheduleとはしない。",
          },
          {
            word: "ours",
            reason: "「私たちのもの」という所有代名詞で、送る相手を表さない。",
          },
        ],
      },
      {
        sentence: "There is very ------- space left in the storage room.",
        answer: "little",
        translation: "倉庫には空きスペースがほとんど残っていません。",
        reason: "spaceはここでは不可算名詞。very littleで「ごくわずかの」。",
        wrong: [
          {
            word: "few",
            reason: "可算名詞の複数形に使うため、このspaceには合わない。",
          },
          {
            word: "many",
            reason: "可算名詞の複数形に使うため、このspaceには合わない。",
          },
          {
            word: "each",
            reason: "単数の可算名詞に使い、very eachという形にもできない。",
          },
        ],
      },
    ],
    topicIds: ["pronoun-case", "pronoun-reflexive", "quantifiers"],
  },
  {
    id: "prepositions-conjunctions",
    title: "前置詞か接続詞かは、後ろの形と意味で",
    steps: [
      "後ろが名詞句か、主語と動詞を持つ節かを確認する。そのうえで原因・対比・条件などの関係を読む。",
      "期限のbyと継続のuntilなど、前置詞同士でも意味が違う。品詞だけで選び切らない。",
    ],
    examples: [
      {
        sentence: "------- the heavy rain, the delivery arrived on time.",
        answer: "Despite",
        translation: "大雨にもかかわらず、配達は時間どおりに到着しました。",
        reason:
          "the heavy rainは名詞句。Despite＋名詞句で、悪天候と定刻到着の対比を表す。",
        wrong: [
          {
            word: "Although",
            reason:
              "この形では後ろに節が必要。Although it rained heavilyなら使える。",
          },
          {
            word: "Because",
            reason:
              "becauseの後ろは節。原因を表す点でも、ここでの対比とは異なる。",
          },
          {
            word: "Unless",
            reason:
              "条件を表す接続詞で、この名詞句だけをそのまま続けられない。",
          },
        ],
      },
    ],
    topicIds: ["link-clause", "link-logic", "prep-choice"],
  },
  {
    id: "vocabulary",
    title: "語彙は、意味と自然な組み合わせの両方で",
    steps: [
      "同じ品詞の選択肢なら、目的語や理由の部分まで読んで意味を絞る。日本語の訳語だけで決めない。",
      "動詞＋目的語、形容詞＋前置詞などを短いまとまりで覚え、選んだ語が周りの語と自然につながるか確かめる。",
    ],
    examples: [
      {
        sentence:
          "Please ------- a reservation before visiting the restaurant.",
        answer: "make",
        translation: "レストランを訪れる前に予約してください。",
        reason: "make a reservationで「予約する」という自然な組み合わせ。",
        wrong: [
          {
            word: "do",
            reason:
              "「予約する」はdo a reservationとは通常言わず、makeを使う。",
          },
          {
            word: "spend",
            reason:
              "時間やお金などを費やす語で、reservationをこの意味の目的語に取らない。",
          },
          {
            word: "reach",
            reason: "到達するという意味で、予約を行うという意味にならない。",
          },
        ],
      },
    ],
    topicIds: ["vocab-collocation", "vocab-context", "prep-collocation"],
  },
  {
    id: "negation-comparison",
    title: "否定の範囲と比較の形を見落とさない",
    steps: [
      "not、hardly、few、unlessなどが、文のどの部分を否定・制限するか確認する。not allは「すべてではない」。",
      "than、as ... asなどで比較する対象と形を確認する。比較級を修飾するmuch・farなどと、veryを区別する。",
    ],
    examples: [
      {
        sentence: "The new printer is ------- faster than the old one.",
        answer: "much",
        translation: "新しいプリンターは古いものよりもずっと速いです。",
        reason: "muchは比較級fasterを強められる。thanの後のold oneが比較対象。",
        wrong: [
          {
            word: "very",
            reason: "very fastとは言えるが、通常very fasterとはしない。",
          },
          {
            word: "more",
            reason: "faster自体が比較級なので、moreを重ねない。",
          },
          { word: "most", reason: "比較級fasterに最上級のmostを重ねない。" },
        ],
      },
      {
        sentence:
          "You cannot enter the laboratory ------- you have a valid pass.",
        answer: "unless",
        translation: "有効な入室証がなければ、その実験室には入れません。",
        reason:
          "unlessは「～でない限り」。cannotと合わせ、入室には入室証が必要だと表す。",
        wrong: [
          {
            word: "despite",
            reason: "この形では主語＋動詞の節を直接続けられない。",
          },
          { word: "during", reason: "前置詞で、この節を直接続けられない。" },
          {
            word: "because of",
            reason:
              "後ろに名詞句が必要で、you have ...という節を直接続けられない。",
          },
        ],
      },
    ],
    topicIds: ["pos-comparison", "verb-condition", "quantifiers"],
  },
];

export const part5Timing = {
  official:
    "公式の試験構成：Readingは75分・100問。そのうちPart 5は30問です。Part 5だけの制限時間は設定されていません。",
  practice:
    "このアプリでの練習案：まず時間を気にせず、正解と誤答の理由を説明する練習を。慣れたら30問を15分程度で解くことを仮の目安にし、正答率とPart 6・7に必要な時間を見て調整しましょう。これは公式の規定や推奨ではありません。",
  review:
    "難しい1問に止まり続けず、残り時間に応じて候補を絞って進む練習も有効です。1問ごとに必ず同じ秒数で解く必要はありません。復習では正解の根拠と、他の選択肢が合わない理由を確認します。",
  sourceUrl:
    "https://www.iibc-global.org/english/toeic/test/lr/about/format.html",
  sourceLabel: "IIBC：TOEIC L&Rの試験構成",
  checkedAt: "2026-10-02",
};

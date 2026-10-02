# 監査対象・版の照合（2026-10-02）

- 対象: https://github.com/yutateru6-collab/toeic
- 開始時main: `3812068` (Remove all-topics option from topic selector)
- 独立branch: `audit/part5-quality-tips-20261002`
- 公開URL: https://toeic.itisnowornever271.workers.dev
- 公開HTMLのJS: `index-DoKr8RL2.js`、CSS: `index-hYVTz3SB.css`
- 変更前mainをlockfile固定でbuildし、公開JS/CSSとSHA-256一致を確認。
  - JS: `BC777E6AA7474549E2B94B727D97894A7C060A60FE6FC8D94A79E701E1374293`
  - CSS: `DD8059F112675D4D870E571D2471D771C48B7301F8E135C9EB72CD0D1D852C48`
- 公開版とmainの問題データ・機能を含む配信アセットが一致。旧版で公開版を上書きする状況ではない。
- checkoutにAGENTS.md、.agents/skillsはなし。ローカルmemory_summary.mdにTOEIC/Part 5一致なし。
- 編集・検証は専用checkout、localhost:4178、独立Playwright browser/contextで実施。他タスクの作業フォルダー・サーバー・Desktopは未使用。

|分野|問題数|
|---|---:|
|品詞|42|
|動詞|21|
|接続・関係詞|27|
|代名詞・数量|21|
|前置詞・語法|24|
|語彙|45|
|計|180|

初期90問 + 追加90問。練習120問、評価60問（固定30問×2セット）。日々の練習、分野別、論点別、選択練習、復習、チャレンジ。全問に和訳・要点・4択それぞれの理由、追加90問に3段階解説。現行ID、並び、正答位置、pool、family、採点ロジック、localStorageキーを保つ。

監査は、4択をすべて英文に戻して判定し、文法的成立と文脈上の最適性を区別する。全件の自然さ、文法、正答一意性、誤答理由、和訳、解説、難度・場面、重複を記録。修正前後を機械差分で残し、その後別担当が再QAする。難度は編集上の見立てであり、受験者データによる校正ではない。全問題は自主制作の試作問題として維持し、公式問題本文を取り込まない。

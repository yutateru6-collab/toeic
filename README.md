# PART5 STUDIO

スマホで使うTOEIC Part 5の学習PWA。180問のオリジナル試作問題、解答・日本語訳・4択それぞれの説明を収録。

[アプリを開く](https://toeic.itisnowornever271.workers.dev)

## 学習機能

- 今日の5/10/15問：6分野の未回答問題を優先。
- 分野別練習：品詞、動詞、接続・関係詞、代名詞・数量、前置詞・語法、語彙。
- 追加問題・分野・論点の絞り込み、6分野の解き方ガイド、240問の分析内容の表示。
- 30問・10分チャレンジ×2セット：練習と別の問題プール。未閲覧数、保留、見直し、自動採点、途中再開。
- 解説：決め手、正答を入れた英文、日本語訳、全選択肢の理由。
- 追加90問は「見る・判断・確認」の3段階で解き方を説明。
- 復習：不正解、迷った正解、45秒超の回答を翌日以降に再出題。安定して正解すると間隔を延長。
- 初回／再挑戦を分けた正答率、分野別成績、7日間の学習履歴。
- しおり、文字拡大、記録JSONのエクスポート／インポート、問題報告ファイル。
- 初回読み込み完了後のオフライン利用、ホーム画面への追加。

## 問題の検証範囲

**本番難易度との同等性は未検証です。** ユーザー提供の手元資料7〜10のPart 5を8セット240問分析し、全問の正解を照合しました。巻数はフォルダー名による識別で表紙・奥付は未確認。専門家による全問校閲、受験者を使った実測比較は未実施です。

既存90問に練習60問・チャレンジ30問を追加。セット02の配分は品詞9／動詞2／接続・関係詞4／代名詞・数量2／前置詞・語法3／語彙10です。観測を参考にした編集配分で、本番の固定割合ではありません。10分もアプリ独自の練習目標です。TOEIC総合スコアへの換算機能はありません。

[240問の詳細分析](docs/local-corpus-analysis.md) · [初期の公開サンプル分析](docs/public-sample-analysis.md) · [問題更新の手順](docs/content-workflow.md) · [検証記録](docs/qa.md)

## 開発

Node.js 24を推奨。pnpm 11.19.0を使用します。

```sh
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm preview
```

React + TypeScript + Vite。学習データは`part5-studio-v1`キーのlocalStorageに保存します。登録・サーバーDB・外部AI APIは使用しません。APIキーは不要です。

`src/model.ts`に出題・採点・復習・読み込み検証、`src/questions.ts`に問題、`src/Part5App.tsx`に画面、`src/styles.css`に表示設計があります。

## Cloudflare

Workers Static Assetsを使用。リポジトリ名・Worker名ともに`toeic`。

```sh
pnpm build
pnpm exec wrangler deploy --dry-run
pnpm exec wrangler deploy
```

Git連携は`yutateru6-collab/toeic`の`main`を対象に設定。ビルドコマンド`pnpm test && pnpm run build`、デプロイコマンド`pnpm exec wrangler deploy`、ルート`/`、Node.js 24を使用します。テスト失敗時は公開しません。資格情報をGitへコミットしないでください。

## 運用上の制約

- 記録はこの端末・このブラウザのみ。クラウド同期はありません。ブラウザデータ削除前・端末変更前にJSONを書き出してください。
- 問題報告はダウンロードするファイルです。自動で作成者へ送信されません。
- 初見は「解説を読む前の初回回答」として記録します。別端末で既に見た問題などは検出できません。
- チャレンジは各30問の固定2セットです。2回目以降の同一問題を初見として加算しません。
- 管理者向け公開CMSはありません。Git上の問題データを校閲して更新します。
- 練習時は非表示タブの時間を除外し、約5秒ごとに経過を保存。突然の端末終了では最大約5秒の計測が失われる場合があります。チャレンジの期限は絶対時刻で保存し、中断・再読み込みでもリセットしません。

TOEIC® is a registered trademark of ETS. This product is not endorsed or approved by ETS.

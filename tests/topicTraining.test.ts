import test from "node:test";
import assert from "node:assert/strict";
import { questions } from "../src/questions";
import { getTopicQuestions } from "../src/topicTraining";

const ids = (topicId: string) =>
  new Set(getTopicQuestions(questions, topicId).map((q) => q.id));

test("時制特訓に明確な時制問題が入る", () => {
  const tense = ids("verb-tense");
  assert.ok(tense.has("p5-017"), "過去完了問題を時制に含める");
  assert.ok(tense.has("p5-019"), "last April の過去形問題を時制に含める");
  assert.ok(tense.has("p5-022"), "since を使う現在完了問題を時制に含める");
});

test("受動態と準動詞を別々に集中練習できる", () => {
  const passive = ids("verb-passive");
  const nonfinite = ids("verb-nonfinite");
  assert.ok(passive.has("p5-018"), "must be approved を受動態に含める");
  assert.ok(nonfinite.has("p5-020"), "suggest obtaining を準動詞に含める");
  assert.ok(nonfinite.has("p5-023"), "require visitors to show を準動詞に含める");
});

test("論点別特訓には練習用問題だけを出す", () => {
  for (const topicId of [
    "verb-tense",
    "verb-passive",
    "pos-noun",
    "link-relative",
    "quantifiers",
    "prep-choice",
    "vocab-context",
  ]) {
    assert.ok(
      getTopicQuestions(questions, topicId).every((q) => q.pool === "practice"),
      `${topicId} に assessment 問題を混ぜない`,
    );
  }
});

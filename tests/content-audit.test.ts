import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { questions } from "../src/questions";
import {
  initialState,
  parseState,
  recordAttempt,
  startSession,
} from "../src/model";
import { revisedQuestionIds } from "../src/contentRevisions";

const before = JSON.parse(
  readFileSync(
    new URL("../docs/audit-20261002/inventory-before.json", import.meta.url),
    "utf8",
  ),
);
test("audit keeps all 180 identities, order, pools and correct answer positions", () => {
  assert.deepEqual(
    questions.map((q) => q.id),
    before.map((q: { id: string }) => q.id),
  );
  for (const [i, q] of questions.entries()) {
    assert.equal(q.pool, before[i].pool, q.id);
    assert.equal(q.category, before[i].category, q.id);
    assert.equal(q.answer, before[i].answer, q.id);
    assert.equal(q.choices[q.answer], before[i].choices[q.answer], q.id);
    assert.equal(q.family, q.id);
    assert.equal(q.version, revisedQuestionIds.has(q.id) ? 2 : 1, q.id);
  }
});
test("old attempts, bookmarks and interrupted sessions survive revised content", () => {
  for (const q of questions.filter((q) => revisedQuestionIds.has(q.id))) {
    const old = { ...q, version: 1 };
    let state = recordAttempt(
      initialState(),
      old,
      q.answer,
      20,
      false,
      `old-${q.id}`,
      1000,
    );
    state.bookmarks = [q.id];
    state.session = startSession("daily", "保存済み", [old], 2000);
    state.session.answers[q.id] = {
      choice: q.answer,
      seconds: 20,
      guessed: false,
    };
    const loaded = parseState(JSON.stringify(state), questions);
    assert.deepEqual(loaded.attempts, state.attempts, q.id);
    assert.deepEqual(loaded.bookmarks, state.bookmarks, q.id);
    assert.deepEqual(loaded.session, state.session, q.id);
  }
});
test("each audited item has a four-choice review tied to the final displayed choices", () => {
  const reviews = ["legacy-review.json", "expanded-review.json"].flatMap(
    (file) =>
      JSON.parse(
        readFileSync(
          new URL(`../docs/audit-20261002/${file}`, import.meta.url),
          "utf8",
        ),
      ),
  );
  assert.equal(reviews.length, 180);
  assert.equal(new Set(reviews.map((r) => r.id)).size, 180);
  for (const q of questions) {
    const row = reviews.find((r) => r.id === q.id);
    assert.ok(row, q.id);
    assert.deepEqual(
      row.distractors.map((r: { choice: string }) => r.choice),
      q.choices,
      q.id,
    );
    for (const field of [
      "naturalness",
      "grammar",
      "uniqueness",
      "translation",
      "explanation",
      "difficultyContext",
      "duplicate",
    ]) {
      assert.ok(row[field], `${q.id} ${field}`);
    }
  }
});

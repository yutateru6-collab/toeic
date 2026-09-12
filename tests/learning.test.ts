import { test } from "node:test";
import assert from "node:assert/strict";
import { questions, legacyQuestions } from "../src/questions";
import { expandedQuestions } from "../src/expandedQuestions";
import {
  categories,
  chooseQuestions,
  getExamSet,
  dueAt,
  dueQuestions,
  finishExam,
  initialState,
  parseState,
  recordAttempt,
  startSession,
} from "../src/model";

test("180 complete original items, 120 practice / 60 assessment, with distinct stems", () => {
  assert.equal(questions.length, 180);
  assert.equal(new Set(questions.map((q) => q.id)).size, 180);
  assert.equal(
    new Set(questions.map((q) => q.sentence.toLowerCase())).size,
    180,
  );
  assert.equal(questions.filter((q) => q.pool === "practice").length, 120);
  assert.equal(questions.filter((q) => q.pool === "assessment").length, 60);
  for (const q of questions) {
    assert.equal(q.choices.length, 4, q.id);
    assert.equal(q.reasons.length, 4, q.id);
    assert.equal(new Set(q.choices).size, 4, q.id);
    assert.equal(q.sentence.split("-------").length, 2, q.id);
    assert.ok(
      Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4,
      q.id,
    );
    assert.ok(q.translation.length > 10 && q.takeaway.length > 10, q.id);
    assert.ok(
      q.reasons.every((r) => r.length >= 10),
      q.id,
    );
    assert.ok(categories.includes(q.category), q.id);
    assert.equal(q.status, "beta");
  }
  for (const category of categories) {
    assert.equal(
      legacyQuestions.filter(
        (q) => q.category === category && q.pool === "practice",
      ).length,
      10,
    );
    assert.equal(
      legacyQuestions.filter(
        (q) => q.category === category && q.pool === "assessment",
      ).length,
      5,
    );
  }
  const practiceFamilies = new Set(
    questions.filter((q) => q.pool === "practice").map((q) => q.family),
  );
  assert.ok(
    questions
      .filter((q) => q.pool === "assessment")
      .every((q) => !practiceFamilies.has(q.family)),
  );
});
test("new sets follow the observed-category blueprint and keep assessment separate", () => {
  const analysis = getExamSet(questions, "analysis"),
    starter = getExamSet(questions, "starter");
  assert.equal(analysis.length, 30);
  assert.equal(starter.length, 30);
  assert.ok(analysis.every((q) => !starter.some((s) => s.id === q.id)));
  assert.deepEqual(
    categories.map((c) => analysis.filter((q) => q.category === c).length),
    [9, 2, 4, 2, 3, 10],
  );
  assert.deepEqual(
    categories.map(
      (c) =>
        expandedQuestions.filter(
          (q) => q.category === c && q.pool === "practice",
        ).length,
    ),
    [18, 4, 8, 4, 6, 20],
  );
  for (const q of expandedQuestions) {
    assert.ok(q.skill);
    assert.equal(q.steps?.length, 3);
    assert.ok(q.steps?.every((s) => s.length >= 10));
    // A missing/extra row delimiter must not silently truncate an explanation.
    assert.ok(
      !q.sentence.includes("|") && q.reasons.every((r) => !r.includes("|")),
    );
  }
  const vocabulary = expandedQuestions.filter(
    (q) => q.pool === "practice" && q.skill === "文脈で選ぶ名詞",
  );
  const filtered = chooseQuestions(initialState(), vocabulary, "daily");
  assert.ok(
    filtered.length > 0 &&
      filtered.every(
        (q) => q.skill === "文脈で選ぶ名詞" && q.pool === "practice",
      ),
  );
});
test("expansion preserves old backups and a partially answered original exam", () => {
  let old = initialState();
  old = recordAttempt(
    old,
    legacyQuestions[0],
    legacyQuestions[0].answer,
    18,
    false,
    "legacy",
    100,
  );
  old.bookmarks = [legacyQuestions[0].id];
  old.session = startSession(
    "exam",
    "original exam",
    getExamSet(legacyQuestions, "starter"),
    200,
  );
  const q = getExamSet(legacyQuestions, "starter")[0];
  old.session.answers[q.id] = { choice: q.answer, seconds: 9, guessed: false };
  const restored = parseState(JSON.stringify(old), questions);
  assert.deepEqual(restored, old);
  assert.equal(finishExam(restored, questions, 300).attempts.length, 31);
});
test("daily questions do not expose reserved assessment items and cover all six categories", () => {
  const selected = chooseQuestions(initialState(), questions, "daily");
  assert.equal(selected.length, 10);
  assert.ok(selected.every((q) => q.pool === "practice"));
  assert.equal(new Set(selected.map((q) => q.category)).size, 6);
});
test("first attempt cannot be counted twice; subsequent session is a review", () => {
  const q = questions[0];
  let s = recordAttempt(
    initialState(),
    q,
    q.answer,
    12,
    false,
    "session-1",
    100,
  );
  s = recordAttempt(s, q, q.answer, 14, false, "session-1", 101);
  assert.equal(s.attempts.length, 1);
  s = recordAttempt(s, q, q.answer, 14, false, "session-2", 102);
  assert.equal(s.attempts.length, 2);
  assert.deepEqual(
    s.attempts.map((a) => a.first),
    [true, false],
  );
});
test("uncertain correct answer becomes due the next day, confident repeats extend interval", () => {
  const q = questions[0],
    day = 86400000;
  let s = recordAttempt(initialState(), q, q.answer, 15, true, "one", 1000);
  assert.equal(dueAt(s, q.id), 1000 + day);
  assert.equal(dueQuestions(s, questions, 1000 + day - 1).length, 0);
  assert.equal(dueQuestions(s, questions, 1000 + day).length, 1);
  s = recordAttempt(s, q, q.answer, 15, false, "two", 1000 + day);
  assert.equal(dueAt(s, q.id), 1000 + 2 * day);
  s = recordAttempt(s, q, q.answer, 15, false, "three", 1000 + 2 * day);
  assert.equal(dueAt(s, q.id), 1000 + 5 * day);
});
test("daily prioritizes unattempted questions within every category", () => {
  const q = questions[0];
  const s = recordAttempt(initialState(), q, q.answer, 12, false, "one");
  const selected = chooseQuestions(s, questions, "daily");
  assert.ok(!selected.some((x) => x.id === q.id));
});
test("exam finalization marks unanswered items incorrect and is idempotent", () => {
  const exam = chooseQuestions(initialState(), questions, "exam");
  let s = initialState();
  s.session = startSession("exam", "Test", exam, 1000);
  s.session.answers[exam[0].id] = {
    choice: exam[0].answer,
    seconds: 9,
    guessed: false,
  };
  const finished = finishExam(s, questions, 2000);
  assert.equal(finished.attempts.length, 30);
  assert.equal(finished.attempts.filter((a) => a.correct).length, 1);
  assert.equal(finished.attempts.filter((a) => a.choice === -1).length, 29);
  assert.equal(finished.session?.finishedAt, 2000);
  assert.deepEqual(finishExam(finished, questions, 3000), finished);
});
test("backup round-trips session, bookmarks, and elapsed time", () => {
  let s = initialState();
  s.session = startSession("daily", "Today", questions.slice(0, 5));
  s.session.spent[questions[0].id] = 12;
  s.bookmarks = [questions[1].id];
  s = recordAttempt(
    s,
    questions[0],
    questions[0].answer,
    12,
    false,
    s.session.id,
  );
  assert.deepEqual(parseState(JSON.stringify(s), questions), s);
});
test("corrupted backups are rejected; invalid resumable session is dropped", () => {
  assert.throws(() => parseState("{broken", questions));
  assert.throws(() =>
    parseState(
      JSON.stringify({ schema: 2, attempts: [], bookmarks: [] }),
      questions,
    ),
  );
  const s = initialState();
  s.session = startSession("daily", "x", questions.slice(0, 5));
  s.session.index = 99;
  assert.equal(parseState(JSON.stringify(s), questions).session, null);
});
test("import cannot forge correctness or first exposure", () => {
  const q = questions[0];
  let s = recordAttempt(
    initialState(),
    q,
    (q.answer + 1) % 4,
    10,
    false,
    "one",
  );
  s = recordAttempt(s, q, q.answer, 10, false, "two");
  s.attempts[0].correct = true;
  s.attempts[1].first = true;
  const p = parseState(JSON.stringify(s), questions);
  assert.equal(p.attempts[0].correct, false);
  assert.equal(p.attempts[1].first, false);
});
test("answer-position distribution contains all positions in both pools", () => {
  for (const pool of ["practice", "assessment"]) {
    const counts = [0, 0, 0, 0];
    questions.filter((q) => q.pool === pool).forEach((q) => counts[q.answer]++);
    assert.ok(
      counts.every((n) => n >= 3),
      `${pool}: ${counts}`,
    );
  }
});
test("reading an explanation before answering excludes that answer from first-exposure results", () => {
  const q = questions[0];
  let s = initialState();
  s.exposures[q.id] = 100;
  s = recordAttempt(s, q, q.answer, 12, false, "one", 200);
  assert.equal(s.attempts[0].first, false);
  assert.equal(
    parseState(JSON.stringify(s), questions).attempts[0].first,
    false,
  );
});
test("assessment mistakes become reviewable after the first sitting", () => {
  const q = questions.find((q) => q.pool === "assessment")!;
  const s = recordAttempt(
    initialState(),
    q,
    (q.answer + 1) % 4,
    10,
    false,
    "exam",
    1000,
  );
  assert.ok(
    dueQuestions(s, questions, 1000 + 86400000).some((x) => x.id === q.id),
  );
  assert.ok(
    !chooseQuestions(s, questions, "daily").some(
      (x) => x.pool === "assessment",
    ),
  );
});
test("repeating on the same day does not promote the review interval", () => {
  const q = questions[0];
  let s = recordAttempt(initialState(), q, q.answer, 10, false, "one", 1000);
  s = recordAttempt(s, q, q.answer, 10, false, "two", 2000);
  assert.equal(dueAt(s, q.id), 2000 + 86400000);
});

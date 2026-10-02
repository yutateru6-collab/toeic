import { readFileSync, writeFileSync } from "node:fs";
import { questions } from "../src/questions";
import { allTopics, questionMatchesTopic } from "../src/topicTraining";

const dir = new URL("../docs/audit-20261002/", import.meta.url);
const before = JSON.parse(
  readFileSync(new URL("inventory-before.json", dir), "utf8"),
);
const fields = [
  "sentence",
  "choices",
  "answer",
  "translation",
  "takeaway",
  "reasons",
  "skill",
  "evidence",
];
const after = questions.map((q) => ({
  ...q,
  evidence: q.steps?.[0] ?? "",
  skill: q.skill ?? "",
  topics: allTopics
    .filter((t) => questionMatchesTopic(q, t.id))
    .map((t) => t.id),
  modes:
    q.pool === "assessment"
      ? [
          q.examSet === "analysis" ? "チャレンジ02" : "チャレンジ01",
          "回答後の復習",
        ]
      : ["日々の練習", "分野別", "問題選択", "論点別", "復習"],
}));
const changes = after.flatMap((q) => {
  const old = before.find((b: { id: string }) => b.id === q.id);
  const changed = fields.filter(
    (k) => JSON.stringify(old[k]) !== JSON.stringify(q[k as keyof typeof q]),
  );
  return changed.length
    ? [{ id: q.id, fields: changed, before: old, after: q }]
    : [];
});
const changedIds = new Set(changes.map((q) => q.id));
after.forEach((q) => {
  q.version = changedIds.has(q.id) ? 2 : 1;
});
writeFileSync(
  new URL("inventory-after.json", dir),
  JSON.stringify(after, null, 2) + "\n",
);
writeFileSync(
  new URL("changes.json", dir),
  JSON.stringify(changes, null, 2) + "\n",
);
writeFileSync(
  new URL("../src/contentRevisions.ts", import.meta.url),
  "// Content audit 2026-10-02. IDs and answer positions stay stable.\nexport const revisedQuestionIds = new Set<string>(" +
    JSON.stringify(
      changes.map((q) => q.id),
      null,
      2,
    ) +
    ");\n",
);
console.log(
  JSON.stringify({
    count: after.length,
    revised: changes.length,
    ids: changes.map((q) => q.id),
  }),
);

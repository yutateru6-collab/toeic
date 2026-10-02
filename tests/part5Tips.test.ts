import test from "node:test";
import assert from "node:assert/strict";
import { part5Tips } from "../src/part5Tips";
import { allTopics, getTopicQuestions } from "../src/topicTraining";
import { questions } from "../src/questions";

test("すべてのコツから実際の練習問題がある論点へ移動できる", () => {
  for (const tip of part5Tips) {
    assert.ok(tip.topicIds.length > 0, tip.id);
    for (const topicId of tip.topicIds) {
      assert.ok(
        allTopics.some((topic) => topic.id === topicId),
        `${tip.id}: ${topicId}`,
      );
      assert.ok(
        getTopicQuestions(questions, topicId).length > 0,
        `${tip.id}: ${topicId} has practice questions`,
      );
    }
  }
});

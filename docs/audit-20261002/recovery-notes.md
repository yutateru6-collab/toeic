# Dedicated recovery — 2026-10-02

Source: saved commit `9880b8a93437c000c8f5c45e975a956044f592c6`. A read-only Git archive and history bundle were exported into task-5, then cloned onto local branch `recovery/part5-quality-20261002`. The original checkout was clean at the same HEAD before and after export. All 64 saved tracked files were verified against the archive (CRLF/LF normalized; the report script was checked through its explicit patch). No original branch, main, remote branch, PR or deployment was modified. No checkout AGENTS.md or .agents/skills instructions were present in the inspected repository/ancestor paths.

## Corrections

- CSV keeps the actual Japanese translation in `translation`; review commentary has its own `translationReview` column. All 180 rows and unique headers are checked by `scripts/audit-verify.py`.
- p5-028 scopes the accustomed-to explanation to this sentence and its four choices. The answer remains keeping; to keep produces the duplicated to to keep.
- p5-a-6-16 changes the abroad reason from 今夜の雨 to 予報されている雨. The stem specifies an evening, not tonight. The answer remains indoors.
- The original 180-question / 720-choice review, 34 revised IDs, 9 tips and 11 examples are retained. This recovery performs incremental checks, not another full editorial review.

## Source hash reconciliation

The saved imported source objects matched every field of the reviewed `inventory-after.json` before editing. All 720 independent candidate sentences/choices/answer judgments still match the final source. The only recovery source-data differences are p5-028's takeaway and p5-a-6-16's abroad reason; both were re-read with all four substitutions.

The prior questions.ts hash `6aab49da590e10d81a69bea5426c16f3f8ee2552386d99be2706ddd738e81891` does not match the saved committed file, whose LF hash was `e26100708f427d0403875f4ba1e943b345312e0fc61df7d283940e8006e368ba`. The earlier bytes behind that recorded hash are not available in committed snapshots. Its historical cause therefore remains unproven; no source/inventory content difference was found. The old hashes remain in `previousSourceHashes` rather than being silently discarded. part5Tips.ts previously matched only with LF normalization; expandedQuestions.ts previously matched raw CRLF bytes.

The final convention is SHA-256 over UTF-8 source bytes with CRLF replaced by LF. Every other byte, including the final newline, is retained. No BOM stripping or formatting normalization. `independent-qa.json` and `source-hashes.json` contain the final hashes. This binds current evidence to current source without claiming recovery of unavailable historical bytes.

## Verification

- `npm test`: 22/22 passing; identities, answer keys, pools, order, migration, scoring and topic links.
- `npm run check` and `npm run build`: passing.
- `python scripts/audit-verify.py`: 180 translations and reviews, unique CSV headers, all three hashes, live source/snapshot match and 720 existing independent candidate records.
- Fresh Edge contexts: desktop 1440×1000; mobile 390×844 and 320×740; tips, examples, topic practice, feedback, resume, challenge scoring, deadlines and no duplicate scoring.
- Final production build: service worker, offline reload, practice and saved history.
- Recovery-specific UI: both corrected explanations, old version-1 attempt, bookmarks, large text, supported daily goal, dark theme and reload persistence. Evidence is in recovery-ui-results.json and screenshots.

Dependencies were copied into the dedicated workspace and their junctions remapped entirely inside it. An initial flattened-copy dependency error was repaired before successful test/build runs. No manifest or lockfile change was needed. A synthetic test initially used unsupported goal 20; existing parsing correctly normalized it to 10. The regression fixture uses supported goal 5 and does not change application behavior.

## Library and submission boundary

The current Library materialization helper downloaded bytes but failed on Windows because Python's `os.setxattr` is unavailable. That incomplete download was not used; source recovery used the authorized local saved commit. The replacement targets the existing Library identity with observed version 0 as an optimistic guard. Its confirmed outcome is recorded separately in the task-5 delivery receipt, since the archive cannot contain its own subsequent upload result.

Remote writes remain paused. After the parent resolves the original transfer: read branches/PRs and compare their exact heads; reuse the original branch/PR if it contains the saved audit; submit only the corrective commit(s) with an expected-head guard. If nothing exists, obtain the parent's release of the pause before transferring the complete reviewed history. Recheck the resulting diff and required checks, then open/update a draft PR. Do not merge or deploy.

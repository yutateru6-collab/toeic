"""Verify evidence integrity, not English correctness. Run after audit-export/report."""
import csv
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
out = root / 'docs/audit-20261002'
read = lambda name: json.loads((out / name).read_text(encoding='utf-8'))
questions = read('inventory-after.json')
reviews = {r['id']: r for r in read('legacy-review.json') + read('expanded-review.json')}
qa = read('independent-qa.json')

with (out / 'audit-table.csv').open(encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    assert len(reader.fieldnames) == len(set(reader.fieldnames)), 'duplicate CSV header'
    rows = list(reader)
assert len(rows) == len(questions) == 180
assert [r['id'] for r in rows] == [q['id'] for q in questions]
for row, q in zip(rows, questions):
    assert row['translation'] == q['translation'], q['id']
    review = reviews[q['id']]['translation']
    expected = json.dumps(review, ensure_ascii=False) if isinstance(review, (list, dict)) else review
    assert row['translationReview'] == expected, q['id']

for file, expected in qa['sourceHashes'].items():
    assert hashlib.sha256((root / file).read_bytes().replace(b'\r\n', b'\n')).hexdigest() == expected, file

live = json.loads(subprocess.check_output([
    'node', 'node_modules/tsx/dist/cli.mjs', '--eval',
    "import {questions} from './src/questions.ts'; console.log(JSON.stringify(questions));"
], cwd=root, encoding='utf-8'))
for q, snapshot in zip(live, questions):
    assert all(snapshot[k] == v for k, v in q.items()), q['id']

saved = json.loads(subprocess.check_output([
    'git', 'show', '9880b8a93437c000c8f5c45e975a956044f592c6:docs/audit-20261002/inventory-after.json'
], cwd=root, encoding='utf-8'))
delta = [(q['id'], k) for old, q in zip(saved, questions) for k in q if old.get(k) != q[k]]
assert delta == [('p5-028', 'takeaway'), ('p5-a-6-16', 'reasons')], delta
assert len(read('changes.json')) == 34
assert len(qa['questions']) == 180
for q, reviewed in zip(questions, qa['questions']):
    assert q['id'] == reviewed['id']
    candidates = reviewed['candidatesChecked']
    assert [c['choice'] for c in candidates] == q['choices'], q['id']
    for i, c in enumerate(candidates):
        assert c['completedSentence'] == q['sentence'].replace('-------', q['choices'][i]), q['id']
        assert (c['judgment'] == 'best_answer') == (i == q['answer']), q['id']

print(json.dumps({'status': 'pass', 'csvRows': len(rows), 'uniqueCsvHeaders': True,
    'translationsRetained': 180, 'separateTranslationReviews': 180,
    'sourceHashesVerified': len(qa['sourceHashes']), 'liveSourceRowsMatchInventory': 180,
    'existingIndependentChoiceRecordsMatchSource': 720, 'revisedIds': 34,
    'recoveryDelta': delta}, indent=2))

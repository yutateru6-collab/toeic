import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { Packer } from 'docx';
import { questions } from '../src/questions';
import { parseWordSelection, selectedWordQuestions } from '../src/wordSelection';
import { createWordDocument, WORD_DEFAULTS } from '../src/wordDocument';

test('numbers, ranges, full-width digits and IDs preserve requested order and deduplicate', () => {
  assert.deepEqual(parseWordSelection(`３, 1-2、${questions[0].id} 5〜6`, questions), [2,0,1,4,5].map(i => questions[i].id));
});
test('invalid, empty, reversed, out-of-bounds and unknown IDs fail without partial success', () => {
  for (const s of ['', '0', '181', '6-3', '1-9999999999', '1 abc', 'p5-999', '-1', '1.5', 'NaN']) assert.throws(() => parseWordSelection(s, questions), Error, s);
});
test('selection preserves source objects, validates contents and rejects unknown IDs', () => {
  const snapshot = JSON.stringify(questions);
  const selected = selectedWordQuestions([questions[3].id, questions[0].id, questions[3].id], questions);
  assert.deepEqual(selected.map(q => q.id), [questions[3].id, questions[0].id]);
  assert.equal(selected[0], questions[3]);
  assert.equal(JSON.stringify(questions), snapshot);
  assert.throws(() => selectedWordQuestions([], questions));
  assert.throws(() => selectedWordQuestions(['unknown'], questions));
});
test('DOCX defaults are JIS B4 landscape, two columns, UDP font, and separate answer section', async () => {
  const data = await Packer.toBuffer(createWordDocument([questions[0].id, questions[179].id], questions));
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml')!.async('string');
  const styles = await zip.file('word/styles.xml')!.async('string');
  assert.equal((xml.match(/<w:sectPr[> ]/g) || []).length, 2);
  assert.equal((xml.match(/w:orient="landscape"/g) || []).length, 2);
  assert.equal((xml.match(/w:num="2"/g) || []).length, 2);
  assert.equal((xml.match(/w:w="20636"/g) || []).length, 2);
  assert.equal((xml.match(/w:h="14570"/g) || []).length, 2);
  assert.match(xml, /<w:type w:val="nextPage"\/>/);
  assert.match(styles, /BIZ UDPGothic/);
  assert.equal(WORD_DEFAULTS.fontSizePt, 11);
  const split = xml.indexOf('TOEIC Part 5 解答と解説');
  assert.ok(split > 0);
  const questionXml = xml.slice(0, split);
  assert.ok(!questionXml.includes('正解 ('));
  assert.ok(!questionXml.includes('日本語訳'));
  assert.ok(!questionXml.includes(questions[0].takeaway));
  assert.ok(xml.slice(split).includes(questions[0].translation));
});
test('all 180 question IDs, choices, answer positions and explanation text survive DOCX export', async () => {
  const before = JSON.stringify(questions);
  const data = await Packer.toBuffer(createWordDocument(questions.map(q => q.id), questions));
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml')!.async('string');
  const decode = (s: string) => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'");
  const text = decode(xml.replace(/<[^>]+>/g, ''));
  for (const q of questions) {
    assert.ok(text.includes(q.sentence), q.id);
    assert.ok(text.includes(q.translation), q.id);
    assert.ok(text.includes(q.takeaway), q.id);
    for (const reason of q.reasons) assert.ok(text.includes(reason), q.id);
    assert.ok(text.includes(`正解 (${'ABCD'[q.answer]}) ${q.choices[q.answer]}  ［${q.id}］`), q.id);
  }
  assert.equal(JSON.stringify(questions), before);
});

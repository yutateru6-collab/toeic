import { Document, Paragraph, TextRun, Packer, SectionType, PageOrientation, Footer, AlignmentType, PageNumber, HeadingLevel } from 'docx';
import type { Question } from './model';
import { selectedWordQuestions } from './wordSelection';

export const WORD_DEFAULTS = { widthMm: 364, heightMm: 257, columns: 2, font: 'BIZ UDPGothic', fontSizePt: 11 } as const;
const mm = (n: number) => Math.round(n * 1440 / 25.4);
const letters = ['A', 'B', 'C', 'D'];
const p = (text: string, bold = false, keepNext = false, after = 90) => new Paragraph({
  children: [new TextRun({ text, bold })], keepNext, keepLines: true, spacing: { after, line: 264 },
});
const footer = (label: string) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
  children: [new TextRun({ text: `${label}  `, size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 })] })] });
// docx accepts portrait dimensions here and swaps them for LANDSCAPE.
const page = { size: { width: mm(257), height: mm(364), orientation: PageOrientation.LANDSCAPE },
  margin: { top: mm(14), bottom: mm(14), left: mm(16), right: mm(16), header: mm(6), footer: mm(7) } };

export function createWordDocument(ids: readonly string[], catalogue: readonly Question[]): Document {
  const selected = selectedWordQuestions(ids, catalogue);
  const questionParagraphs: Paragraph[] = [
    new Paragraph({ text: 'TOEIC Part 5 練習問題', heading: HeadingLevel.TITLE, spacing: { after: 140 } }),
    p(`全${selected.length}問  氏名 ____________________`, false, false, 160),
    p('各文の空所に入る最も適切な選択肢を一つ選んでください。', false, false, 180),
  ];
  const answerParagraphs: Paragraph[] = [
    new Paragraph({ text: 'TOEIC Part 5 解答と解説', heading: HeadingLevel.TITLE, spacing: { after: 180 } }),
  ];
  selected.forEach((q, index) => {
    const number = index + 1;
    questionParagraphs.push(p(`${number}.  ${q.sentence}`, true, true));
    q.choices.forEach((choice, c) => questionParagraphs.push(p(`(${letters[c]}) ${choice}`, false, c < 3, c === 3 ? 150 : 25)));
    answerParagraphs.push(p(`${number}.  正解 (${letters[q.answer]}) ${q.choices[q.answer]}  ［${q.id}］`, true, true));
    answerParagraphs.push(p(`日本語訳  ${q.translation}`, false, true));
    answerParagraphs.push(p(`解き方  ${q.takeaway}`, false, true));
    q.reasons.forEach((reason, c) => answerParagraphs.push(p(`(${letters[c]}) ${q.choices[c]}  ${reason}`, false, c < 3 || !!q.steps?.length, 70)));
    if (q.steps?.length) answerParagraphs.push(p(`考える順序  ${q.steps.join(' → ')}`, false, false, 70));
    answerParagraphs.push(p('', false, false, 110));
  });
  return new Document({ creator: 'PART5 STUDIO', title: 'TOEIC Part 5 練習問題と解答解説',
    styles: { default: { document: { run: { font: { ascii: WORD_DEFAULTS.font, hAnsi: WORD_DEFAULTS.font, eastAsia: WORD_DEFAULTS.font, cs: WORD_DEFAULTS.font }, size: 22, color: '000000' }, paragraph: { spacing: { line: 264, after: 80 } } } },
      paragraphStyles: [{ id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font: WORD_DEFAULTS.font, size: 32, bold: true, color: '000000' }, paragraph: { keepNext: true, spacing: { after: 160 } } }] },
    sections: [
      { properties: { page, column: { count: 2, space: mm(10), equalWidth: true } }, footers: { default: footer('問題') }, children: questionParagraphs },
      { properties: { type: SectionType.NEXT_PAGE, page, column: { count: 2, space: mm(10), equalWidth: true } }, footers: { default: footer('解答・解説') }, children: answerParagraphs },
    ],
  });
}

export async function wordDocumentBlob(ids: readonly string[], catalogue: readonly Question[]): Promise<Blob> {
  return Packer.toBlob(createWordDocument(ids, catalogue));
}

import { mkdir, writeFile } from 'node:fs/promises';
import { Packer } from 'docx';
import { questions } from '../src/questions';
import { createWordDocument } from '../src/wordDocument';
await mkdir('../outputs', { recursive: true });
for (const count of [1, 10, 180]) {
  const ids = questions.slice(0, count).map(q => q.id);
  await writeFile(`../outputs/TOEIC_Part5_${count}問_動作確認.docx`, await Packer.toBuffer(createWordDocument(ids, questions)));
  console.log(`Generated ${count} questions`);
}

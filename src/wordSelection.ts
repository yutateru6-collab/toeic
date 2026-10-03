import type { Question } from './model';

/** Display numbers always refer to the complete source catalogue, never a filtered list. */
export function parseWordSelection(input: string, catalogue: readonly Question[]): string[] {
  const tokens = input.normalize('NFKC').trim().split(/[\s,、，]+/).filter(Boolean);
  if (!tokens.length) throw new Error('問題番号または問題IDを入力してください。');
  if (tokens.length > 1000) throw new Error('指定が多すぎます。範囲指定をご利用ください。');
  const known = new Set(catalogue.map(q => q.id));
  const result: string[] = [];
  const add = (id: string) => { if (!result.includes(id)) result.push(id); };
  const byNumber = (n: number) => {
    if (!Number.isSafeInteger(n) || n < 1 || n > catalogue.length) throw new Error(`問題番号は1〜${catalogue.length}で指定してください。`);
    add(catalogue[n - 1].id);
  };
  for (const token of tokens) {
    if (known.has(token)) { add(token); continue; }
    if (/^\d+$/.test(token)) { byNumber(Number(token)); continue; }
    const range = token.match(/^(\d+)[\-–〜~～](\d+)$/);
    if (range) {
      const from = Number(range[1]), to = Number(range[2]);
      if (from < 1 || to > catalogue.length || from > to) throw new Error(`範囲「${token}」を確認してください。`);
      for (let n = from; n <= to; n++) byNumber(n);
      continue;
    }
    throw new Error(`「${token}」は問題番号・範囲・既存の問題IDとして読み取れません。`);
  }
  return result;
}

export function selectedWordQuestions(ids: readonly string[], catalogue: readonly Question[]): Question[] {
  if (!ids.length) throw new Error('出力する問題を1問以上選んでください。');
  const map = new Map(catalogue.map(q => [q.id, q]));
  const unique = [...new Set(ids)];
  return unique.map(id => {
    const q = map.get(id);
    if (!q) throw new Error(`問題ID「${id}」が見つかりません。選び直してください。`);
    if (q.choices.length !== 4 || q.reasons.length !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3)
      throw new Error(`問題ID「${id}」の解答データを確認してください。`);
    return q;
  });
}

import { useRef, useState } from 'react';
import { categories, type Question } from './model';
import { parseWordSelection } from './wordSelection';
import './word-export.css';

export default function WordExport({ questions }: { questions: Question[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('all');
  const [pool, setPool] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const visible = questions.filter(q => (category === 'all' || category === q.category) &&
    (pool === 'all' || (pool === 'practice' ? q.pool === 'practice' : q.pool === 'assessment' && (q.examSet === 'analysis' ? 'exam2' : 'exam1') === pool)) &&
    `${q.id} ${q.sentence} ${q.skill || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const applyInput = () => {
    try { const ids = parseWordSelection(input, questions); setSelected(ids); setError(''); setMessage(`${ids.length}問を入力した順番で選択しました。`); }
    catch (e) { setError(e instanceof Error ? e.message : '指定を確認してください。'); }
  };
  const toggle = (id: string) => { setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); setMessage(''); };
  const download = async () => {
    if (busyRef.current || !selected.length) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    const ids = [...selected];
    try {
      const { wordDocumentBlob } = await import('./wordDocument');
      const blob = await wordDocumentBlob(ids, questions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `TOEIC_Part5_${ids.length}問.docx`; document.body.append(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(`${ids.length}問のWordファイルを作成しました。ダウンロード先をご確認ください。`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Wordを作成できませんでした。もう一度お試しください。'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <div className="word-export">
    <h3>指定した問題をWordにする</h3>
    <p>B4横向き・2段組み・BIZ UDPゴシック。問題の後で必ず改ページし、解答・日本語訳・解説を続けます。</p>
    <p className="word-export-note">フォントが端末にない場合、Wordで代替フォントになります。番号は全問題の一覧番号です。絞り込んでも番号は変わりません。</p>
    <fieldset disabled={busy}>
      <legend>問題を選ぶ</legend>
      <label htmlFor="word-numbers">番号・範囲・問題ID（例：1-5, 12, p5-004）</label>
      <div className="word-export-input"><input id="word-numbers" value={input} onChange={e => setInput(e.target.value)} placeholder="1-5, 12" /><button type="button" onClick={applyInput}>入力で選び直す</button></div>
      <div className="word-export-filters">
        <label>問題群<select value={pool} onChange={e => setPool(e.target.value)}><option value="all">全問題</option><option value="practice">練習問題</option><option value="exam1">チャレンジ01</option><option value="exam2">チャレンジ02</option></select></label>
        <label>分野<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">全分野</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>英文・IDを検索<input value={search} onChange={e => setSearch(e.target.value)} /></label>
      </div>
      <div className="word-export-actions"><button type="button" disabled={!visible.length} onClick={() => { setSelected(visible.map(q => q.id)); setError(''); setMessage('表示中の問題で選び直しました。'); }}>表示中の{visible.length}問で選び直す</button><button type="button" disabled={!selected.length} onClick={() => { setSelected([]); setMessage('選択を解除しました。'); }}>全選択を解除</button></div>
      <p>選択済み {selected.length}問。チェックした順に出力します。絞り込みの変更では選択は消えません。</p>
      <ol className="word-export-list" aria-label="出力する問題の一覧">{visible.map(q => <li key={q.id}><label><input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggle(q.id)} /><span><strong>{questions.indexOf(q) + 1}. {q.id}</strong><small>{q.category}・{q.pool === 'practice' ? '練習' : 'チャレンジ'}</small><span>{q.sentence}</span></span></label></li>)}</ol>
      {!visible.length && <p>条件に合う問題がありません。検索や絞り込みを変更してください。</p>}
    </fieldset>
    <button type="button" className="word-export-download" disabled={!selected.length || busy} onClick={download}>{busy ? 'Wordを作成中…' : `選択した${selected.length}問をWordでダウンロード`}</button>
    {error && <p role="alert" className="word-export-error">{error}</p>}
    <p role="status" aria-live="polite">{message}</p>
  </div>;
}

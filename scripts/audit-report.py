"""Render the manually reviewed evidence; this script does not judge English."""
import csv, html, json, pathlib

root=pathlib.Path(__file__).resolve().parents[1]
out=root/'docs'/'audit-20261002'
read=lambda name:json.loads((out/name).read_text(encoding='utf-8'))
questions=read('inventory-after.json')
reviews=read('legacy-review.json')+read('expanded-review.json')
by_id={r['id']:r for r in reviews}
changes={r['id']:r for r in read('changes.json')}
labels={'naturalness':'英文の自然さ','grammar':'文法・語法','uniqueness':'正答の一意性','translation':'和訳の検証','explanation':'解説との整合','difficultyContext':'難度・TOEIC場面','duplicate':'重複・類題','sources':'辞書・資料の根拠','independentQa':'独立QA後の再修正','independentQA':'独立QA後の再修正'}
esc=lambda v:html.escape(str(v))
def render(v):
    if isinstance(v,dict):return '<dl>'+''.join('<dt>'+esc(k)+'</dt><dd>'+render(x)+'</dd>' for k,x in v.items())+'</dl>'
    if isinstance(v,list):return '<ul>'+''.join('<li>'+render(x)+'</li>' for x in v)+'</ul>' if v else '<p>なし</p>'
    if isinstance(v,str) and v.startswith('https://'):return '<a href="'+esc(v)+'">'+esc(v)+'</a>'
    return esc(v)

with (out/'audit-table.csv').open('w',encoding='utf-8-sig',newline='') as f:
    review_columns={k:('translationReview' if k=='translation' else k) for k in labels}
    fields=['id','category','pool','modes','topics','sentence','choices','answer','translation','takeaway','reasons','revised']+list(review_columns.values())
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for q in questions:
        r=by_id[q['id']]
        row={k:q.get(k,'') for k in fields if k not in review_columns.values()}
        row['revised']=q['id'] in changes
        for k,column in review_columns.items():row[column]=r.get(k,'')
        writer.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in row.items()})

parts=['''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TOEIC Part 5 全180問監査</title><style>
*{box-sizing:border-box}body{font:16px/1.8 system-ui,sans-serif;color:#183b2c;background:#f4f7f5;margin:0}main{max-width:1100px;margin:auto;padding:32px 18px}h1{line-height:1.3}h2{font-size:23px}h3{font-size:17px}article{background:white;padding:25px;margin:18px 0;border:1px solid #c8d8ce;border-radius:12px}input{font:inherit;padding:10px;max-width:100%;width:420px}label{margin:0 15px 0 0}small{color:#586c60}details{border-top:1px solid #d9e4dc;padding:12px 0}summary{cursor:pointer;font-weight:bold}dt{font-weight:bold}dd{margin:0 0 10px 18px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5f2;padding:12px;font:14px/1.8 monospace}.stem{font-size:19px}.changed{border-left:6px solid #ae6419}.toolbar{position:sticky;top:0;background:#edf4eff5;padding:12px;border-radius:9px}a{color:#155983}li{margin:6px 0}.badge{font-size:13px;background:#e9f1ec;padding:4px 9px;border-radius:12px}table{border-collapse:collapse}td,th{padding:5px 16px;border:1px solid #c8d8ce}@media print{.toolbar{display:none}article{break-inside:avoid}details{display:block}}
</style><main><h1>Part 5 全180問の内容監査</h1>''',
f'<p>2026-10-02 ／ 全180問・720選択肢を一次監査し、別担当が再QA。<strong>{len(changes)}問を改善</strong>しました。</p>',
'<p>練習120問・チャレンジ60問。ID・配列順・正答位置・正答語・モードを維持。自主制作問題であり、公式問題の転載はありません。難度は編集上の判断で、受験者データによる校正・専門家承認ではありません。</p>',
'<p>開始時main <code>3812068</code> と公開JS/CSSのSHA-256一致を確認。<a href="https://toeic.itisnowornever271.workers.dev">現在の公開版</a>への本番反映は行っていません。</p>',
'<p><a href="independent-qa.json">独立QA（全件＋コツ例文）</a> ／ <a href="changes.json">全修正前後JSON</a> ／ <a href="audit-table.csv">監査表CSV</a> ／ <a href="README.md">提出概要</a></p>',
'<div class="toolbar"><label>検索 <input id="search" placeholder="ID・英文・分野・監査所見"></label><label><input style="width:auto" type="checkbox" id="changed">修正問だけ</label><span id="count">180問</span></div>'
]
for q in questions:
    r=by_id[q['id']];changed=q['id'] in changes
    parts.append(f'<article class="{"changed" if changed else ""}" data-changed="{str(changed).lower()}"><h2>{esc(q["id"])} <span class="badge">{esc(q["category"])}・{esc(q["pool"])}・v{q["version"]}</span></h2>')
    parts.append('<small>'+esc(' / '.join(q['modes']))+' ／ 論点: '+esc(', '.join(q['topics']))+'</small>')
    parts.append('<p class="stem" lang="en">'+esc(q['sentence'])+'</p><ol type="A">')
    for i,(choice,reason) in enumerate(zip(q['choices'],q['reasons'])):
        parts.append('<li><strong>'+esc(choice)+(' 【正答】' if i==q['answer'] else '')+'</strong> — '+esc(reason)+'</li>')
    parts.append('</ol><p><b>和訳:</b> '+esc(q['translation'])+'</p><p><b>要点:</b> '+esc(q['takeaway'])+'</p>')
    parts.append('<details><summary>全項目の監査所見・4択検討・根拠</summary>')
    for field,label in labels.items():
        if field in r:parts.append('<h3>'+label+'</h3>'+render(r[field]))
    parts.append('<h3>各選択肢の独立検討</h3>'+render(r['distractors'])+'</details>')
    if changed:
        c=changes[q['id']];parts.append('<details><summary>修正前 → 修正後</summary>')
        for field in c['fields']:
            parts.append('<h3>'+esc(field)+'</h3><b>前</b><pre>'+esc(json.dumps(c['before'].get(field),ensure_ascii=False,indent=2))+'</pre><b>後</b><pre>'+esc(json.dumps(c['after'].get(field),ensure_ascii=False,indent=2))+'</pre>')
        parts.append('</details>')
    parts.append('</article>')
parts.append('''</main><script>const search=document.querySelector('#search'),changed=document.querySelector('#changed');function filter(){let n=0;for(const el of document.querySelectorAll('article')){const show=(!changed.checked||el.dataset.changed==='true')&&el.textContent.toLowerCase().includes(search.value.toLowerCase());el.hidden=!show;if(show)n++}document.querySelector('#count').textContent=n+'問'}search.addEventListener('input',filter);changed.addEventListener('change',filter);</script></html>''')
(out/'audit-report.html').write_text(''.join(parts),encoding='utf-8')
print(f'Rendered {len(questions)} audit rows and {len(changes)} before/after records.')

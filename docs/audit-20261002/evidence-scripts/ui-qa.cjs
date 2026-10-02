const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const out=require('node:path').resolve(__dirname, '../screenshots');fs.mkdirSync(out,{recursive:true});
const reports=[];
async function state(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('part5-studio-v1')));}
async function checkLayout(page,label){
 const size=await page.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));
 assert.ok(size.content<=size.viewport,`${label}: horizontal overflow ${JSON.stringify(size)}`);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 for(const mobile of [false,true]){
  const label=mobile?'mobile':'desktop';
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.DEV_URL || 'http://127.0.0.1:4178');
  const nav=page.getByRole('navigation',{name:mobile?'モバイルナビゲーション':'メインナビゲーション',exact:true});
  await nav.getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
  await page.locator('.part5-tips').waitFor();
  assert.equal(await page.locator('.part5-tips > details').count(),10);
  await checkLayout(page,label+' tips');
  await page.screenshot({path:`${out}/${label}-tips.png`,fullPage:true});
  const firstTip=page.locator('.part5-tips > details').nth(1);
  await firstTip.locator('summary').click();
  assert.equal(await firstTip.locator('.tip-distractors > div').count(),3);
  await firstTip.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/${label}-example.png`,fullPage:true});
  await firstTip.locator('.tip-practice button').first().click();
  await page.locator('.question-sentence').waitFor();
  const data=await page.evaluate(async()=> (await import('/src/questions.ts')).questions);
  let s=await state(page);const firstId=s.session.ids[0];const q=data.find(q=>q.id===firstId);
  await page.locator('.choice').nth(q.answer).click();
  await page.getByRole('button',{name:'解答を確認する'}).click();
  await page.getByText('正解です。',{exact:true}).waitFor();
  await page.getByText('4つの選択肢を比べる',{exact:true}).click();
  assert.equal(await page.locator('.reason').count(),4);
  assert.equal(await page.locator('.reason:visible').count(),4);
  assert.equal((await state(page)).attempts.length,1);
  await checkLayout(page,label+' answer');
  await page.screenshot({path:`${out}/${label}-correct.png`,fullPage:true});
  await page.getByRole('button',{name:'中断',exact:true}).click();
  await page.getByRole('button',{name:'保存してホームへ',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'続きから始める',exact:true}).click();
  await page.getByText('正解です。',{exact:true}).waitFor();
  assert.equal((await state(page)).session.ids[0],firstId);
  assert.equal((await state(page)).attempts.length,1);
  await page.getByRole('button',{name:'次の問題へ',exact:true}).click();
  s=await state(page);const second=data.find(q=>q.id===s.session.ids[s.session.index]);
  await page.locator('.choice').nth((second.answer+1)%4).click();
  await page.getByRole('button',{name:'解答を確認する'}).click();
  await page.getByText('ここで覚え直しましょう。',{exact:true}).waitFor();
  assert.equal(await page.locator('.choice.correct').count(),1);
  assert.equal(await page.locator('.choice.incorrect').count(),1);
  assert.equal((await state(page)).attempts.length,2);
  await page.screenshot({path:`${out}/${label}-incorrect.png`,fullPage:true});
  await page.getByRole('button',{name:'中断',exact:true}).click();
  await page.getByRole('button',{name:'保存してホームへ',exact:true}).click();
  await nav.getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
  await firstTip.locator('summary').click();
  await firstTip.locator('.tip-practice button').first().click();
  await page.getByRole('button',{name:'新しく始める',exact:true}).click();
  await page.locator('.question-sentence').waitFor();
  assert.equal((await state(page)).attempts.length,2);
  await page.reload();
  await nav.getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
  await page.evaluate(()=>{localStorage.setItem('part5-ui-theme','dark');});
  await page.reload();
  await nav.getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
  await firstTip.locator('summary').click();
  await checkLayout(page,label+' dark');
  await page.screenshot({path:`${out}/${label}-dark.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  reports.push({viewport:label,checks:['menu','9 tips + timing','example + 3 wrong reasons','topic training','correct answer + 4 reasons','pause','reload + resume','no duplicate attempt','next + incorrect feedback','restart with history retained','dark theme','no horizontal overflow'],pageErrors:errors});
  await context.close();
 }
 fs.writeFileSync(require('node:path').resolve(__dirname, '../ui-results.json'),JSON.stringify(reports,null,2));
 console.log(JSON.stringify(reports,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

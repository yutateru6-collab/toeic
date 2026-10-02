const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out=require('node:path').resolve(__dirname, '..');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const ctx=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('part5-studio-v1')));
 await page.goto(process.env.DEV_URL || 'http://127.0.0.1:4178');
 const nav=page.getByRole('navigation',{name:'モバイルナビゲーション',exact:true});
 await nav.getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
 await page.locator('.part5-tips').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 for(const detail of await page.locator('.part5-tips > details').all()){
   await detail.locator('summary').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 assert.equal(await page.locator('.tip-example').count(),11);
 assert.equal(await page.locator('.tip-distractors > div').count(),33);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.locator('h1').blur();
 await page.screenshot({path:`${out}/screenshots/mobile-320-tips.png`});
 await nav.getByRole('button',{name:'ホーム',exact:true}).click();
 await page.getByRole('button',{name:/チャレンジする/}).click();
 await page.getByRole('button',{name:'チャレンジを始める',exact:true}).click();
 await page.locator('.question-sentence').waitFor();
 const data=await page.evaluate(async()=> (await import('/src/questions.ts')).questions);
 let s=await state();const firstId=s.session.ids[0],deadline=s.session.deadline;
 const q=data.find(q=>q.id===firstId);
 await page.locator('.choice').nth(q.answer).click();
 await page.getByRole('button',{name:'次の問題へ',exact:true}).click();
 await page.getByRole('button',{name:'前へ',exact:true}).click();
 assert.equal(await page.locator('.choice[aria-pressed="true"]').count(),1);
 assert.equal(await page.locator('.explanation').count(),0);
 await page.reload();
 await page.getByRole('button',{name:'続きから始める',exact:true}).click();
 s=await state();assert.equal(s.session.deadline,deadline);assert.equal(s.session.answers[firstId].choice,q.answer);
 await page.getByRole('button',{name:'ここまでで採点する',exact:true}).click();
 await page.getByRole('button',{name:'採点する',exact:true}).click();
 await page.locator('.result-page').waitFor();
 s=await state();assert.equal(s.attempts.length,30);assert.equal(s.attempts.filter(a=>a.correct).length,1);
 await page.screenshot({path:`${out}/screenshots/mobile-exam-result.png`,fullPage:true});
 await page.reload();assert.equal((await state()).attempts.length,30);
 assert.deepEqual(errors,[]);
 const result={viewport:'320x740',checks:['all 9 tips and 11 examples / 33 distractor reasons','no horizontal overflow','challenge start','next / back retains choice','answers hidden before scoring','reload / resume keeps answer and deadline','30 scored including 29 unanswered','reload does not duplicate scoring'],pageErrors:errors};
 fs.writeFileSync(`${out}/exam-ui-results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

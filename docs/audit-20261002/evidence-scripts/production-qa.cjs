const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.STATIC_URL || 'http://127.0.0.1:4180');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();
 await page.getByRole('navigation',{name:'モバイルナビゲーション',exact:true}).getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
 await page.locator('.part5-tips').waitFor();
 assert.equal(await page.locator('.part5-tips > details').count(),10);
 await ctx.setOffline(true);
 await page.reload();
 await page.getByRole('navigation',{name:'モバイルナビゲーション',exact:true}).getByRole('button',{name:'Part 5のコツ・注意点',exact:true}).click();
 await page.locator('.part5-tips > details').nth(1).locator('summary').click();
 await page.locator('.tip-practice button').first().click();
 await page.locator('.choice').first().click();
 await page.getByRole('button',{name:'解答を確認する'}).click();
 await page.locator('.explanation').waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('part5-studio-v1')).attempts.length),1);
 assert.deepEqual(errors,[]);
 const result={build:'production',checks:['built tips/menu renders','service worker ready','offline reload','offline topic start and answer','offline history persisted'],pageErrors:errors};
 fs.writeFileSync(require('node:path').resolve(__dirname, '../production-ui-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

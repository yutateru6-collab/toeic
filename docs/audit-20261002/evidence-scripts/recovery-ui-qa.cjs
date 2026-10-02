const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.DEV_URL || 'http://127.0.0.1:4178');
    const seeded = await page.evaluate(async () => {
      const { questions } = await import('/src/questions.ts');
      const { initialState, recordAttempt, startSession } = await import('/src/model.ts');
      const items = ['p5-028', 'p5-a-6-16'].map(id => questions.find(q => q.id === id));
      let state = recordAttempt(initialState(), { ...items[0], version: 1 },
        (items[0].answer + 1) % 4, 20, false, 'recovery-old-attempt', 1000);
      state.bookmarks = ['p5-028'];
      state.settings = { largeText: true, goal: 5 };
      state.session = startSession('review', '保存済みの復習', items);
      localStorage.setItem('part5-studio-v1', JSON.stringify(state));
      localStorage.setItem('part5-ui-theme', 'dark');
      return { oldAttempt: state.attempts[0], answers: items.map(q => q.answer) };
    });
    await page.reload();
    await page.getByRole('button', { name: '続きから始める', exact: true }).click();
    await page.locator('.choice').nth(seeded.answers[0]).click();
    await page.getByRole('button', { name: '解答を確認する' }).click();
    await page.getByText('この文ではbe accustomed toのtoを前置詞として、後ろに動名詞keepingを続ける。', { exact: true }).waitFor();
    await page.getByText('4つの選択肢を比べる', { exact: true }).click();
    assert.equal(await page.locator('.reason:visible').count(), 4);
    await page.screenshot({ path: path.join(out, 'screenshots/recovery-p5-028.png'), fullPage: true });
    await page.getByRole('button', { name: '次の問題へ', exact: true }).click();
    await page.locator('.choice').nth(seeded.answers[1]).click();
    await page.getByRole('button', { name: '解答を確認する' }).click();
    await page.getByText('4つの選択肢を比べる', { exact: true }).click();
    await page.getByText('abroadは「外国へ」。予報されている雨への移動先に合わない。', { exact: true }).waitFor();
    assert.equal(await page.getByText('今夜の雨', { exact: false }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(out, 'screenshots/recovery-p5-a-6-16.png'), fullPage: true });
    await page.reload();
    const finalState = await page.evaluate(() => ({
      state: JSON.parse(localStorage.getItem('part5-studio-v1')),
      theme: localStorage.getItem('part5-ui-theme'),
    }));
    assert.deepEqual(finalState.state.attempts[0], seeded.oldAttempt);
    assert.equal(finalState.state.attempts.length, 3);
    assert.deepEqual(finalState.state.bookmarks, ['p5-028']);
    assert.deepEqual(finalState.state.settings, { largeText: true, goal: 5 });
    assert.equal(finalState.theme, 'dark');
    assert.deepEqual(errors, []);
    const result = { status: 'pass', viewport: '390x844', checks: [
      'p5-028 scoped takeaway displayed', 'p5-a-6-16 forecast-rain reason displayed',
      'four visible choice reasons', 'old version-1 attempt unchanged',
      'bookmarks/settings/theme preserved', 'resume saved review',
      'reload does not duplicate attempts', 'no horizontal overflow',
    ], pageErrors: errors };
    fs.writeFileSync(path.join(out, 'recovery-ui-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    await context.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

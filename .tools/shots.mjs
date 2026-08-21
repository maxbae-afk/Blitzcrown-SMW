/**
 * 시퀀스 아래 홈 섹션들을 하나씩 찍는다.
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run shots.mjs            # 데스크톱
 *   bun run shots.mjs --mobile   # 390px
 */

import { open, OUT } from './page.mjs';

const mobile = process.argv.includes('--mobile');
const IDS = ['release', 'games', 'build', 'journey', 'news', 'partners', 'trust', 'contact'];

const { browser, page } = await open();

if (mobile) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

const tag = mobile ? 'm' : 'd';
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

for (const id of IDS) {
  const box = await page.evaluate((key) => {
    const el = document.getElementById(key);
    if (!el) return null;
    el.scrollIntoView();
    return { top: el.offsetTop, height: el.offsetHeight };
  }, id);

  if (!box) {
    console.log(`${id}: 없음`);
    continue;
  }

  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/sec-${tag}-${id}.png` });
  console.log(`sec-${tag}-${id}.png  (높이 ${box.height}px)`);
}

// 푸터까지 확인한다.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${OUT}/sec-${tag}-foot.png` });
console.log(`sec-${tag}-foot.png`);

if (errors.length) console.log('\n스크립트 오류:\n' + errors.join('\n'));

await browser.close();

/**
 * games.html 확인용. 카테고리 · 검색 · 없는 결과를 차례로 눌러 보고 화면을 찍는다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run games-shot.mjs                # 데스크톱 1440
 *   bun run games-shot.mjs 390 mobile     # 모바일
 */

import { open, OUT } from './page.mjs';

const width = Number(process.argv[2] ?? 1440);
const tag = process.argv[3] ?? 'desktop';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const { browser, page, errors } = await open({ width, height: 900 });
await page.goto('http://127.0.0.1:4321/games.html', { waitUntil: 'networkidle0' });

// 리빌은 화면에 들어와야 켜진다. 상태를 읽기 전에 먼저 훑는다.
const sweep = () =>
  page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 400));
  });

const read = () =>
  page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    const shown = cards.filter((c) => !c.hidden);
    return {
      cards: shown.length,
      count: document.getElementById('gameCount').textContent,
      pressed: document.querySelector('.chip[aria-pressed="true"]')?.textContent,
      empty: document.getElementById('gameEmpty').hidden ? '(숨김)' : '표시',
      url: location.search || '(없음)',
      first: shown[0]?.querySelector('h3')?.textContent ?? '(없음)',
      // 켜지지 않은 카드가 남아 있으면 그 카드는 끝까지 흐리게 보인다.
      dim: shown.filter((c) => Number(getComputedStyle(c).opacity) < 0.99).length,
    };
  });

const rows = [];

await sweep();
rows.push({ step: '첫 화면', ...(await read()) });
await page.screenshot({ path: `${OUT}/games-${tag}-top.png` });
await page.screenshot({ path: `${OUT}/games-${tag}-full.png`, fullPage: true });

await page.evaluate(() => document.querySelector('.chip[data-category="CRASH"]').click());
await wait(300);
await sweep();
rows.push({ step: 'CRASH 필터', ...(await read()) });
await page.screenshot({ path: `${OUT}/games-${tag}-filter.png` });

// 필터를 건 상태에서 검색까지 걸면 둘이 함께 걸러야 한다.
await page.evaluate(() => document.querySelector('.chip[data-category="ALL"]').click());
await page.type('#gameSearch', 'plinko');
await wait(300);
await sweep();
rows.push({ step: '검색 plinko', ...(await read()) });

await page.evaluate(() => {
  const input = document.getElementById('gameSearch');
  input.value = 'zzzz';
  input.dispatchEvent(new Event('input'));
});
await wait(300);
rows.push({ step: '결과 없음', ...(await read()) });
await page.screenshot({ path: `${OUT}/games-${tag}-empty.png` });

console.table(rows);
console.log(errors.length ? errors.join('\n') : '오류 없음');

await browser.close();

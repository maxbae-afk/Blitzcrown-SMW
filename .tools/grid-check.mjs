/**
 * 기획서(docs/FIGMA_MAKE_STRUCTURE_PROMPT.md 4장)의 그리드 기준과 실제 렌더 결과를 비교한다.
 *
 *   Desktop Large  1920px 프레임 / 콘텐츠 1600px / 좌우 여백 160px / 12칼럼 / 거터 24px
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run grid-check.mjs
 */

import { open } from './page.mjs';

const FRAME = 1920;
const CONTENT = 1600;
const MARGIN = 160;
const COLS = 12;
const GUTTER = 24;

const colWidth = (CONTENT - GUTTER * (COLS - 1)) / COLS;
// n번째 칼럼이 시작하는 x. 0-indexed.
const colStart = (n) => MARGIN + n * (colWidth + GUTTER);

const { browser, page } = await open({ width: FRAME, height: 1080 });

const boxes = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right) };
  };

    const cols = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { track: s.gridTemplateColumns, gap: s.columnGap };
  };

  return {
    wrap: pick('.release .wrap'),
    tracks: {
      feature: cols('.feature'),
      cards: cols('.card-grid'),
      rows: cols('.row'),
      timeline: cols('.timeline'),
      news: cols('.news-grid'),
      logos: cols('.logo-grid'),
      trust: cols('.trust-row'),
      outro: cols('.outro-grid'),
      foot: cols('.foot-top'),
    },
    lead: pick('.release .sec-lead'),
    premise: pick('.feature-premise'),
    topbar: pick('.topbar'),
  };
});

console.log(`기준  프레임 ${FRAME} · 콘텐츠 ${CONTENT} · 여백 ${MARGIN} · ${COLS}칼럼 · 거터 ${GUTTER}`);
console.log(`      칼럼 폭 ${colWidth.toFixed(2)}px\n`);

const w = boxes.wrap;
console.log('콘텐츠 폭 (.wrap)');
console.log(`  실제   left ${w.left}  width ${w.width}  right ${w.right}`);
console.log(`  기준   left ${MARGIN}  width ${CONTENT}  right ${FRAME - MARGIN}`);
console.log(`  차이   폭 ${w.width - CONTENT}px · 좌여백 ${w.left - MARGIN}px\n`);

console.log('상단바 좌우 여백');
console.log(`  실제   left ${boxes.topbar.left}  right ${FRAME - boxes.topbar.right}`);
console.log(`  콘텐츠 left ${w.left}  (${boxes.topbar.left === w.left ? '일치' : '불일치'})\n`);

console.log('읽기 영역 (기준 최대 680px)');
for (const [name, box] of [['섹션 리드', boxes.lead], ['featured 프레미스', boxes.premise]]) {
  if (!box) continue;
  console.log(`  ${name.padEnd(18)} ${box.width}px  ${box.width <= 680 ? 'OK' : '초과'}`);
}

// 각 그리드의 칼럼 경계가 12칼럼 격자 위에 떨어지는지 본다.
// 각 트랙이 12칼럼 격자의 몇 칸에 해당하는지 환산한다.
// 정수에서 멀수록 격자와 무관하게 잡힌 비율이라는 뜻이다.
console.log('\n칼럼 환산 (실제 폭을 1600 기준으로 스케일)');
console.log('  이름       거터   칼럼 수');
const scale = CONTENT / w.width;
for (const [name, info] of Object.entries(boxes.tracks)) {
  if (!info) continue;
  const parts = info.track.split(' ').map(parseFloat);
  if (parts.some(Number.isNaN)) {
    console.log(`  ${name.padEnd(9)} ${info.track}`);
    continue;
  }
  const gap = parseFloat(info.gap);
  const spans = parts.map((px) => ((px * scale + GUTTER) / (colWidth + GUTTER)).toFixed(2));
  const off = spans.some((s) => Math.abs(Number(s) - Math.round(Number(s))) > 0.1);
  const gapOff = Math.abs(gap * scale - GUTTER) > 1;
  console.log(
    `  ${name.padEnd(9)} ${String(Math.round(gap)).padStart(3)}px${gapOff ? '*' : ' '}  ${spans.join(
      ' + ',
    )}${off ? '   ← 격자 밖' : ''}`,
  );
}
console.log('\n  * 거터가 기준 24px 과 다름');

await browser.close();

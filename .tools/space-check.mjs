/**
 * 시퀀스 아래 문서 구간의 세로 간격을 실측한다.
 *
 * 간격은 CSS 를 읽어서는 알 수 없다. margin 상쇄, 빈 요소, gap 과 padding 이 겹치는
 * 자리 때문에 선언값과 화면에 찍히는 값이 자주 다르다. 그래서 렌더된 사각형 사이의
 * 실제 빈 픽셀을 잰다.
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run space-check.mjs
 *   bun run space-check.mjs 390    # 모바일 폭
 */

import { open } from './page.mjs';

const width = Number(process.argv[2] ?? 1440);

const { browser, page, errors } = await open({ width, height: 900 });

// reveal 은 스크롤로 켜진다. 켜 두지 않으면 26px 이동분이 그대로 측정값에 섞인다.
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.reveal')) el.classList.add('in');
  for (const el of document.querySelectorAll('.milestone')) el.classList.add('in');
});
await new Promise((r) => setTimeout(r, 600));

const data = await page.evaluate(() => {
  const px = (n) => Math.round(n * 10) / 10;
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, left: r.left, width: r.width };
  };

  // marquee 는 div 라 section 선택자에 안 잡히지만 세로 리듬에는 그대로 참여한다.
  const sections = [
    ...document.querySelectorAll('main > section, main > .marquee, main > footer, body > footer'),
  ].filter((el) => el.id !== 'sequence' && el.id !== 'reel');

  const outer = [];
  for (const el of sections) {
    const cs = getComputedStyle(el);
    const b = box(el);
    outer.push({
      name: el.id || el.className.split(' ')[0],
      top: px(b.top),
      bottom: px(b.bottom),
      padTop: px(parseFloat(cs.paddingTop)),
      padBottom: px(parseFloat(cs.paddingBottom)),
      left: px(b.left),
      width: px(b.width),
    });
  }

  // 섹션 사이의 실제 빈 픽셀
  const between = [];
  for (let i = 1; i < outer.length; i += 1) {
    between.push({
      pair: `${outer[i - 1].name} → ${outer[i].name}`,
      gap: px(outer[i].top - outer[i - 1].bottom),
      // 시각적으로 느끼는 간격 = 앞 섹션 아래 여백 + 사이 빈 픽셀 + 뒤 섹션 위 여백
      felt: px(outer[i - 1].padBottom + (outer[i].top - outer[i - 1].bottom) + outer[i].padTop),
    });
  }

  // 섹션 내부: 머리말 → 인트로 → 본문 사이 간격
  const inner = [];
  for (const el of sections) {
    const name = el.id || el.className.split(' ')[0];
    const head = el.querySelector('.sec-head');
    const intro = el.querySelector('.sec-intro');
    const bodyEl = [...el.querySelector('.wrap')?.children ?? []].find(
      (c) => !c.classList.contains('sec-head') && !c.classList.contains('sec-intro'),
    );
    if (head && intro) inner.push({ name, step: 'head→intro', gap: px(box(intro).top - box(head).bottom) });
    if (intro && bodyEl) inner.push({ name, step: 'intro→body', gap: px(box(bodyEl).top - box(intro).bottom) });
    else if (head && bodyEl && !intro)
      inner.push({ name, step: 'head→body', gap: px(box(bodyEl).top - box(head).bottom) });
  }

  // 그리드/플렉스 gap
  const grids = [];
  for (const sel of [
    '.card-grid', '.rail-items', '.rows', '.timeline', '.news-grid',
    '.news-list', '.logo-grid', '.trust-row', '.chips', '.actions', '.meta', '.foot-top',
  ]) {
    for (const el of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      grids.push({
        sel,
        row: px(parseFloat(cs.rowGap) || 0),
        col: px(parseFloat(cs.columnGap) || 0),
        cols: cs.gridTemplateColumns === 'none' ? '—' : cs.gridTemplateColumns.split(' ').length,
      });
      break; // 같은 선택자는 하나만
    }
  }

  // 세로만 맞고 좌우가 어긋나면 여전히 흔들려 보인다. 기준선이 하나인지 같이 본다.
  const edges = [];
  for (const sel of ['.wrap', '.topbar', '.foot .wrap']) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    const b = box(el);
    edges.push({
      sel,
      left: px(b.left + parseFloat(cs.paddingLeft)),
      right: px(window.innerWidth - (b.left + b.width - parseFloat(cs.paddingRight))),
    });
  }

  return { outer, between, inner, grids, edges, vw: window.innerWidth };
});

await browser.close();

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log(`\n뷰포트 ${data.vw}px\n`);

console.log('섹션 세로 여백 (padding)');
console.log(`  ${pad('섹션', 12)}${num('위', 7)}${num('아래', 7)}${num('좌', 7)}${num('폭', 7)}`);
for (const s of data.outer) {
  console.log(`  ${pad(s.name, 12)}${num(s.padTop, 7)}${num(s.padBottom, 7)}${num(s.left, 7)}${num(s.width, 7)}`);
}

console.log('\n섹션 사이 (체감 = 앞 아래여백 + 빈틈 + 뒤 위여백)');
console.log(`  ${pad('구간', 26)}${num('빈틈', 7)}${num('체감', 7)}`);
for (const b of data.between) console.log(`  ${pad(b.pair, 26)}${num(b.gap, 7)}${num(b.felt, 7)}`);

console.log('\n섹션 내부 리듬');
console.log(`  ${pad('섹션', 12)}${pad('단계', 12)}${num('간격', 7)}`);
for (const i of data.inner) console.log(`  ${pad(i.name, 12)}${pad(i.step, 12)}${num(i.gap, 7)}`);

console.log('\n그리드 gap');
console.log(`  ${pad('선택자', 14)}${num('행', 7)}${num('열', 7)}${num('칸수', 7)}`);
for (const g of data.grids) console.log(`  ${pad(g.sel, 14)}${num(g.row, 7)}${num(g.col, 7)}${num(g.cols, 7)}`);

console.log('\n좌우 기준선 (내용이 시작하는 x)');
console.log(`  ${pad('대상', 14)}${num('왼쪽', 7)}${num('오른쪽', 8)}`);
for (const e of data.edges) console.log(`  ${pad(e.sel, 14)}${num(e.left, 7)}${num(e.right, 8)}`);

const felt = data.between.map((b) => b.felt);
console.log(`\n섹션 간 체감 간격 종류: ${[...new Set(felt)].sort((a, b) => a - b).join(', ')}`);
const inners = data.inner.map((i) => i.gap);
console.log(`내부 간격 종류: ${[...new Set(inners)].sort((a, b) => a - b).join(', ')}`);

if (errors.length) console.log(`\n오류\n  ${errors.join('\n  ')}`);

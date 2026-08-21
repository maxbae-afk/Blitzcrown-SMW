/**
 * 좁은 화면 동작을 확인한다.
 *
 * 모바일은 스크롤 시퀀스를 재생하지 않고 슬라이드 롤링으로 간다. 그래서 여기서 볼 것은
 * "시퀀스가 잘 도는가"가 아니라 "시퀀스를 아예 건드리지 않는가"다.
 * 프레임 요청이 한 건이라도 나가면 모바일 회선에 36MB 를 지우게 되므로 실패로 본다.
 *
 *   bun run serve.mjs         # 별도 터미널
 *   bun run mobile-check.mjs
 */

import { open, OUT } from './page.mjs';

const HOLD = 5200; // reel.js 의 HOLD 와 같은 값
const { browser, page, errors } = await open({ width: 390, height: 844, dpr: 3, mobile: true });

/* 프레임 요청 감시. open() 안에서 켜면 늦으므로 여기서 문서 전체를 다시 받는다. */
const frameHits = [];
page.on('request', (r) => {
  if (/frames\/(main|bridge|ascent)\//.test(r.url())) frameHits.push(r.url());
});
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => document.body.classList.contains('ready'), { timeout: 60000 });

const view = await page.evaluate(() => {
  const el = (sel) => document.querySelector(sel);
  const shown = (node) => Boolean(node) && getComputedStyle(node).display !== 'none';
  return {
    mode: window.__sequence?.mode,
    sequenceShown: shown(el('#sequence')),
    reelShown: shown(el('#reel')),
    slides: document.querySelectorAll('.reel-slide').length,
    segments: document.querySelectorAll('.reel-seg').length,
    docHeight: document.documentElement.scrollHeight,
    vh: window.innerHeight,
  };
});

console.log('구성');
console.log(`  모드            ${view.mode}`);
console.log(`  시퀀스 표시      ${view.sequenceShown ? '보임 (문제)' : '숨김'}`);
console.log(`  롤링 표시        ${view.reelShown ? '보임' : '숨김 (문제)'}`);
console.log(`  슬라이드 / 진행칸 ${view.slides} / ${view.segments}`);
console.log(`  문서 높이        ${view.docHeight} (${(view.docHeight / view.vh).toFixed(1)}화면)`);

/*
 * 이미지가 실제로 그려졌는지. 파일이 없으면 naturalWidth 가 0 이다.
 * 0 이 아닌 값은 픽셀 크기가 아니라 배율로 나눈 값이라(srcset w 서술자) 그대로 읽지 않는다.
 * 어느 파일을 골랐는지는 currentSrc 로 본다.
 */
const images = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.reel-img')).map((img) => ({
    src: (img.currentSrc || '').split('/').pop(),
    loaded: img.naturalWidth > 0,
  })),
);

console.log('\n슬라이드 이미지');
for (const [i, img] of images.entries()) {
  console.log(`  ${i + 1}  ${img.loaded ? `OK · ${img.src}` : '없음'}`);
}

/* 자동 넘김. 한 장 머무는 시간을 조금 넘겨 두 번 재고 번호가 올라갔는지 본다. */
const active = () =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.reel-slide')).findIndex((s) =>
      s.classList.contains('is-active'),
    ),
  );

const first = await active();
await new Promise((r) => setTimeout(r, HOLD + 1200));
const second = await active();

console.log('\n자동 넘김');
console.log(`  ${HOLD}ms 후  ${first} → ${second}  ${second === first ? '(멈춤 · 문제)' : 'OK'}`);

await page.screenshot({ path: `${OUT}/mobile-reel.png` });
console.log(`\n${OUT}/mobile-reel.png`);

console.log('\n시퀀스 프레임 요청');
console.log(`  ${frameHits.length ? `${frameHits.length}건 (문제)` : '0건'}`);
for (const url of frameHits.slice(0, 5)) console.log(`    ${url}`);

const problems = [
  ...errors,
  view.sequenceShown ? '좁은 화면에서 시퀀스가 보입니다' : null,
  view.reelShown ? null : '롤링이 보이지 않습니다',
  second === first ? '슬라이드가 자동으로 넘어가지 않습니다' : null,
  frameHits.length ? `시퀀스 프레임을 ${frameHits.length}건 내려받았습니다` : null,
  images.some((i) => !i.loaded) ? '아직 없는 슬라이드 이미지가 있습니다' : null,
].filter(Boolean);

console.log('');
if (problems.length) problems.forEach((p) => console.log(`문제: ${p}`));
else console.log('문제 없음');

await browser.close();

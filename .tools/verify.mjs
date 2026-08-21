/**
 * 이어 붙인 시퀀스가 끊김 없이 재생되는지 확인한다.
 *
 * 계기판이 한 벌뿐이라 지금 보이는 시퀀스의 숫자만 읽힌다. 그게 곧 사용자가 보는 것이므로
 * 검증도 그 기준으로 한다. 캔버스 투명도를 같이 읽어 교차가 실제로 일어나는지 본다.
 *
 *   bun run serve.mjs   # 별도 터미널
 *   bun run verify.mjs
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'http://127.0.0.1:4321/';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

const RANGES = ['scene', 'scene2', 'scene3'];
const CANVASES = ['sceneCanvas', 'sceneCanvas2', 'sceneCanvas3'];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
page.on('response', (r) => {
  // favicon 은 두지 않았다. 재생과 무관하므로 넘긴다.
  if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) {
    errors.push(`http ${r.status()}: ${r.url()}`);
  }
});

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.classList.contains('ready'), { timeout: 180000 });

// 마지막 시퀀스까지 배경 로딩이 끝나야 전 구간을 볼 수 있다.
await page.waitForFunction(
  (last) => Number(getComputedStyle(document.getElementById(last)).opacity) >= 0,
  { timeout: 180000 },
  CANVASES.at(-1),
);
await page.waitForFunction(
  () => document.querySelectorAll('canvas.scene-canvas').length === 3,
  { timeout: 180000 },
);

const layout = await page.evaluate((ranges) => {
  const g = (id) => {
    const el = document.getElementById(id);
    return { id, top: el.offsetTop, height: el.offsetHeight };
  };
  return {
    ranges: ranges.map(g),
    after: document.getElementById('release').offsetTop,
    docHeight: document.documentElement.scrollHeight,
    vh: window.innerHeight,
  };
}, RANGES);

console.log('레이아웃 (구간 자)');
for (const r of layout.ranges) {
  console.log(`  ${r.id.padEnd(7)} top ${String(r.top).padStart(6)}  height ${r.height}`);
}
console.log(`  이후 문서 top ${layout.after}`);
console.log(`  문서 총 높이 ${layout.docHeight} (${(layout.docHeight / layout.vh).toFixed(1)}vh)`);

// 다음 자는 앞 자의 "이동 거리"(height − 화면)만큼만 내려가야 한다.
// 어긋나면 그 차이가 그대로 멈춰 있는 스크롤 구간이 된다.
console.log('\n구간 자 이음새');
for (let i = 0; i + 1 < layout.ranges.length; i += 1) {
  const a = layout.ranges[i];
  const b = layout.ranges[i + 1];
  const expected = a.top + a.height - layout.vh;
  const gap = b.top - expected;
  console.log(
    `  ${a.id} → ${b.id}: 기대 ${expected}, 실제 ${b.top}, 차이 ${gap}px` +
      `${gap === 0 ? '' : gap > 0 ? '  ← 멈추는 구간' : '  ← 겹침'}`,
  );
}

async function read() {
  return page.evaluate(
    (canvases) => {
      const text = document.getElementById('hudFrame')?.textContent ?? '';
      return {
        y: window.scrollY,
        seq: document.getElementById('hudSequence')?.textContent ?? '—',
        frame: Number(text.split('/')[0].trim()),
        total: Number(text.split('/')[1]?.trim() ?? 0),
        opacity: canvases.map((id) =>
          Number(getComputedStyle(document.getElementById(id)).opacity).toFixed(2),
        ),
      };
    },
    CANVASES,
  );
}

// html { scroll-behavior: smooth } 때문에 scrollTo 는 곧바로 도착하지 않는다.
// 위치가 멈출 때까지 기다린 다음, 감쇠 보간이 따라붙을 시간을 더 준다.
async function seek(y) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForFunction(
    (v) =>
      Math.abs(window.scrollY - v) < 2 ||
      window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 2,
    { timeout: 5000 },
    y,
  );
  await new Promise((r) => setTimeout(r, 420));
  return read();
}

console.log('\n스크롤    보이는 시퀀스     프레임      캔버스 투명도');
const STEPS = 40;
const samples = [];
for (let i = 0; i <= STEPS; i += 1) {
  const y = Math.round(((layout.after - layout.vh) * i) / STEPS);
  const s = await seek(y);
  samples.push(s);
  console.log(
    `${String(s.y).padStart(7)}  ${s.seq.padEnd(15)} ${String(s.frame).padStart(3)} / ${String(
      s.total,
    ).padEnd(3)}  ${s.opacity.join('  ')}`,
  );
}

// 각 시퀀스 안에서 프레임이 뒤로 가지 않는지, 그리고 셋 다 끝까지 재생되는지.
console.log('');
for (const seq of [...new Set(samples.map((s) => s.seq))]) {
  const run = samples.filter((s) => s.seq === seq);
  const ok = run.every((s, i) => i === 0 || s.frame >= run[i - 1].frame);
  console.log(
    `${seq}: 단조 증가 ${ok ? 'OK' : '깨짐'} · ${run[0].frame} → ${run.at(-1).frame} / ${
      run.at(-1).total
    }`,
  );
}

// 이음매 스크린샷
const shots = [];
for (let i = 0; i + 1 < layout.ranges.length; i += 1) {
  const edge = layout.ranges[i].top + layout.ranges[i].height - layout.vh;
  shots.push([`seam${i + 1}-before`, edge - 320], [`seam${i + 1}-mid`, edge + 90], [
    `seam${i + 1}-after`,
    edge + 420,
  ]);
}
shots.push(['tail-orbit', layout.after - layout.vh - 200]);

console.log('');
for (const [name, y] of shots) {
  const s = await seek(Math.round(y));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${name.padEnd(14)} y=${String(s.y).padStart(6)}  ${s.seq}  frame ${s.frame}`);
}

console.log(errors.length ? `\n오류 ${errors.length}건\n  ${errors.join('\n  ')}` : '\n오류 없음');

await browser.close();

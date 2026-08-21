import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

mkdirSync(OUT, { recursive: true });

const W = 1440;
const H = 900;

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'load' });
await page.waitForFunction(() => document.body.classList.contains('ready'), { timeout: 120000 });
await new Promise((r) => setTimeout(r, 1500));

async function readVars() {
  return page.evaluate(() => {
    const s = document.querySelector('.scene-sticky').style;
    return {
      scale: s.getPropertyValue('--scene-scale'),
      px: s.getPropertyValue('--scene-px'),
      py: s.getPropertyValue('--scene-py'),
      textPx: s.getPropertyValue('--text-px'),
    };
  });
}

/** 포인터를 목표 지점까지 여러 단계로 옮겨 감쇠 추적이 수렴하게 한다. */
async function settlePointer(x, y) {
  await page.mouse.move(x, y, { steps: 12 });
  await new Promise((r) => setTimeout(r, 1400));
}

const poses = [
  { name: 'center', x: W / 2, y: H / 2 },
  { name: 'left', x: 90, y: H / 2 },
  { name: 'right', x: W - 90, y: H / 2 },
  { name: 'topright', x: W - 120, y: 110 },
];

for (const pose of poses) {
  await settlePointer(pose.x, pose.y);
  console.log(`${pose.name.padEnd(9)}`, await readVars());
  await page.screenshot({ path: `${OUT}/hero-${pose.name}.png` });
}

// 스크롤을 조금만 내려 원근감과 먼지가 걷히는지 확인
await settlePointer(W - 120, 110);
for (const p of [0.02, 0.05, 0.1]) {
  await page.evaluate((s) => {
    const scene = document.getElementById('scene');
    window.scrollTo(0, scene.offsetTop + (scene.offsetHeight - window.innerHeight) * s);
  }, p);
  await new Promise((r) => setTimeout(r, 1500));
  const label = String(Math.round(p * 100)).padStart(3, '0');
  console.log(`scroll ${label}`, await readVars());
  await page.screenshot({ path: `${OUT}/hero-scroll-${label}.png` });
}

await browser.close();
console.log('done');

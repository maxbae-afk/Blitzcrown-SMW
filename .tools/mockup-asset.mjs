/*
  폰 목업 PNG 를 웹에서 쓸 수 있는 형태로 만든다.

  게임은 목업 아래에 깔리고 목업이 그 위를 덮는다. 그래야 화면 모서리 곡선과
  노치가 게임 위로 자연스럽게 얹힌다. 그러려면 화면 자리가 뚫려 있어야 하는데,
  받은 파일은 그 자리가 검게 칠해져 있다. 여기서 그 자리를 투명하게 만든다.

  화면 자리는 마스크 파일(빨간 사각형)에서 읽는다. 눈대중으로 찍지 않기 위해서다.
  노치는 화면 안에 있으므로 함께 지워지는데, 지운 뒤 다시 얹어 살려 둔다.

  사용법:
    bun run mockup-asset.mjs <목업.png> <마스크.png>

  결과:
    ../srolling/assets/mockup/phone.png   화면이 뚫린 목업
    ../srolling/js/mockup.geometry.js     화면 자리 좌표(백분율)
*/

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// 프로젝트 경로에 공백이 있어서 URL 을 그대로 쓰면 %20 이 섞인다.
const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));

const [mockupPath, maskPath] = process.argv.slice(2);
if (!mockupPath || !maskPath) {
  console.error('목업과 마스크 파일 경로가 필요하다.');
  process.exit(1);
}

/* 화면 자리: 마스크의 빨간 영역 */
const mask = sharp(maskPath);
const maskMeta = await mask.metadata();
const { data: maskData } = await mask.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

let minX = maskMeta.width;
let minY = maskMeta.height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < maskMeta.height; y += 1) {
  for (let x = 0; x < maskMeta.width; x += 1) {
    const i = (y * maskMeta.width + x) * 4;
    if (maskData[i] > 180 && maskData[i + 1] < 80 && maskData[i + 2] < 80) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const mockup = sharp(mockupPath);
const meta = await mockup.metadata();
// 두 파일 크기가 다를 수 있으므로 마스크 좌표를 목업 크기로 옮긴다.
const kx = meta.width / maskMeta.width;
const ky = meta.height / maskMeta.height;
const screen = {
  x: Math.round(minX * kx),
  y: Math.round(minY * ky),
  w: Math.round((maxX - minX + 1) * kx),
  h: Math.round((maxY - minY + 1) * ky),
};

const { data, info } = await mockup.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alphaAt = (x, y) => (y * info.width + x) * 4 + 3;
const grey = (x, y) => {
  const i = (y * info.width + x) * 4;
  return (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
};

/*
  노치를 먼저 찾아 둔다. 화면 위쪽 가운데에서 순수한 검정보다 아주 조금 밝은 덩어리다.
  차이가 1~2 밖에 나지 않아 문턱을 바짝 낮춰 잡는다.
  기기 테두리의 밝은 금속선에 걸리지 않도록 가운데 절반만 본다.
*/
const band = {
  x0: screen.x + Math.round(screen.w * 0.2),
  x1: screen.x + Math.round(screen.w * 0.8),
  y0: screen.y + Math.round(screen.h * 0.01),
  y1: screen.y + Math.round(screen.h * 0.14),
};

/*
  화면 위쪽 테두리에도 옅은 자국이 남아 있어서 밝은 점을 전부 모으면 노치가 아닌 것까지 딸려 온다.
  그래서 노치 한가운데에서 시작해 이어진 덩어리만 따라간다.
*/
const seed = [screen.x + Math.round(screen.w / 2), screen.y + Math.round(screen.h * 0.045)];
const seen = new Set();
const queue = [seed];
let nx0 = Infinity;
let ny0 = Infinity;
let nx1 = -Infinity;
let ny1 = -Infinity;
while (queue.length) {
  const [x, y] = queue.pop();
  if (x < band.x0 || x > band.x1 || y < band.y0 || y > band.y1) continue;
  const key = y * info.width + x;
  if (seen.has(key) || grey(x, y) < 1) continue;
  seen.add(key);
  if (x < nx0) nx0 = x;
  if (y < ny0) ny0 = y;
  if (x > nx1) nx1 = x;
  if (y > ny1) ny1 = y;
  queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}
const notch = seen.size > 100 ? { x: nx0, y: ny0, w: nx1 - nx0 + 1, h: ny1 - ny0 + 1 } : null;

/* 화면 자리를 둥근 모서리로 뚫는다. 반경은 기기 화면의 곡률에 맞춘 값이다. */
const radius = Math.round(screen.w * 0.125);
const inRounded = (x, y, rect, r) => {
  if (x < rect.x || y < rect.y || x >= rect.x + rect.w || y >= rect.y + rect.h) return false;
  const dx = Math.min(x - rect.x, rect.x + rect.w - 1 - x);
  const dy = Math.min(y - rect.y, rect.y + rect.h - 1 - y);
  if (dx >= r || dy >= r) return true;
  return (r - dx) ** 2 + (r - dy) ** 2 <= r * r;
};

for (let y = screen.y; y < screen.y + screen.h; y += 1) {
  for (let x = screen.x; x < screen.x + screen.w; x += 1) {
    if (inRounded(x, y, screen, radius)) data[alphaAt(x, y)] = 0;
  }
}

// 노치는 화면 위에 계속 떠 있어야 한다. 지운 자리를 다시 덮는다.
if (notch) {
  const r = Math.round(notch.h / 2);
  for (let y = notch.y; y < notch.y + notch.h; y += 1) {
    for (let x = notch.x; x < notch.x + notch.w; x += 1) {
      if (inRounded(x, y, notch, r)) data[alphaAt(x, y)] = 255;
    }
  }
}

await mkdir(here('../srolling/assets/mockup/'), { recursive: true });
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(here('../srolling/assets/mockup/phone.png'));

const pct = (v, total) => Number(((v / total) * 100).toFixed(4));
const geometry = {
  image: { width: info.width, height: info.height },
  screen: {
    left: pct(screen.x, info.width),
    top: pct(screen.y, info.height),
    width: pct(screen.w, info.width),
    height: pct(screen.h, info.height),
  },
  radius: pct(radius, info.width),
};

await writeFile(
  here('../srolling/js/mockup.geometry.js'),
  `/* mockup-asset.mjs 가 만든 값이다. 목업 그림을 바꾸면 그 도구를 다시 돌린다.\n   숫자는 목업 그림 크기에 대한 백분율이라 어떤 크기로 줄여도 그대로 맞는다. */\nexport const MOCKUP = ${JSON.stringify(geometry, null, 2)};\n`,
);

console.log('화면 자리', JSON.stringify(screen), '노치', JSON.stringify(notch));
console.log('백분율', JSON.stringify(geometry.screen), '반경', geometry.radius);

/**
 * 모바일 롤링 슬라이드 이미지를 굽는다.
 *
 * 원본: blitzcrown-v2/_source-reel/slide-1.png … slide-6.png  (1290×2796 세로)
 * 결과: srolling/frames/reel/slide-N-{860,1290}.avif
 *
 * 두 폭을 만드는 이유는 화면마다 필요한 픽셀이 두 배 넘게 차이 나기 때문이다.
 * 360pt·DPR2 기기는 720px 이면 충분한데 1290 을 보내면 3배를 버린다.
 * 어느 쪽을 받을지는 브라우저가 srcset 을 보고 고른다.
 *
 *   bun run reel.mjs
 *   bun run reel.mjs --placeholder   # 원본이 오기 전까지 기존 프레임으로 임시 채우기
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { SEQUENCES, listSource } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const SRC = `${ROOT}/_source-reel`;
const OUT = `${ROOT}/srolling/frames/reel`;

// index.html 의 슬라이드 수와 같아야 한다.
const COUNT = 6;

// 세로 화면 기준 폭. 높이는 원본 비율(1290:2796)을 따른다.
const WIDTHS = [860, 1290];
const RATIO = 2796 / 1290;

// 프레임과 달리 한 장이 오래 머무르므로 조금 더 후하게 준다.
const QUALITY = 76;

const PLACEHOLDER = process.argv.includes('--placeholder');

/**
 * 임시 슬라이드. 가로 프레임을 세로 화면에 맞추면 좌우가 거의 다 잘리므로,
 * 흐리게 늘린 같은 그림을 배경으로 깔고 원본은 가운데에 온전히 얹는다.
 * 배치와 글 가독성을 미리 보기 위한 것이지 최종 결과물이 아니다.
 */
const STAND_INS = [
  ['main', 0.04],
  ['main', 0.24],
  ['main', 0.46],
  ['main', 0.62],
  ['main', 0.95],
  ['ascent', 0.96],
];

async function placeholderSource(slot) {
  const [seqId, at] = STAND_INS[slot];
  const seq = SEQUENCES.find((s) => s.id === seqId);
  const files = listSource(`${ROOT}/${seq.src}`);
  const file = `${ROOT}/${seq.src}/${files[Math.floor(files.length * at)]}`;

  const W = 1290;
  const H = 2796;
  const inner = await sharp(file).resize(W, Math.round((W * 9) / 16), { fit: 'cover' }).toBuffer();
  const back = await sharp(file)
    .resize(W, H, { fit: 'cover' })
    .blur(48)
    .modulate({ brightness: 0.5 })
    .toBuffer();

  return sharp(back)
    .composite([{ input: inner, top: Math.round(H * 0.3), left: 0 }])
    .png()
    .toBuffer();
}

if (!PLACEHOLDER && !existsSync(SRC)) {
  console.error(`원본 폴더가 없습니다: ${SRC}`);
  console.error(`slide-1.png … slide-${COUNT}.png (1290×2796) 를 넣고 다시 실행하세요.`);
  console.error('먼저 배치만 보고 싶다면: bun run reel.mjs --placeholder');
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

if (PLACEHOLDER) console.log('임시 슬라이드를 만듭니다. 실제 원본이 오면 --placeholder 없이 다시 실행하세요.\n');

let total = 0;

for (let i = 1; i <= COUNT; i += 1) {
  const file = `${SRC}/slide-${i}.png`;
  const real = existsSync(file);

  if (!real && !PLACEHOLDER) {
    console.log(`slide-${i}.png 없음 — 건너뜁니다.`);
    continue;
  }

  // 실제 원본이 있으면 임시 모드라도 그쪽을 쓴다. 이미 받은 장면을 덮어 버리면 안 된다.
  const input = real ? file : await placeholderSource(i - 1);
  const meta = await sharp(input).metadata();
  const sizes = [];

  for (const width of WIDTHS) {
    const out = await sharp(input)
      .resize(width, Math.round(width * RATIO), { fit: 'cover' })
      // 세로 이미지는 화면에서 거의 원본 크기로 보이므로 샤프닝은 약하게만 건다.
      .sharpen({ sigma: 0.6, m1: 0, m2: 2 })
      .avif({ quality: QUALITY, effort: 9, chromaSubsampling: '4:4:4' })
      .toFile(`${OUT}/slide-${i}-${width}.avif`);
    sizes.push(`${width}px ${(out.size / 1024).toFixed(0)}KB`);
    total += out.size;
  }

  const tag = real ? '원본' : '임시';
  console.log(`slide-${i}  ${tag} ${meta.width}×${meta.height}  →  ${sizes.join(' · ')}`);
}

console.log(`\n합계 ${(total / 1024 / 1024).toFixed(2)}MB  →  ${OUT}`);

/**
 * 1920 마스터를 화면 폭별로 확대했을 때 생기는 선명도 손실을 눈으로 비교한다.
 * 압축 품질과 무관한, 순수 해상도 문제만 보여준다.
 */

import sharp from 'sharp';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames/img-sroll060.png';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots/upscale-demo.png';

// 1920 기준 관심 영역
const REGION = { left: 1010, top: 190, width: 300, height: 190 };
const TILE_W = 900;
const TILE_H = Math.round((TILE_W * REGION.height) / REGION.width);

const screens = [
  { label: '1920 화면 — 마스터와 1:1', width: 1920 },
  { label: '2560 화면 — 1.33배 확대 (현재)', width: 2560 },
  { label: '3840 화면 — 2배 확대', width: 3840 },
];

const master = await sharp(SRC).resize(1920, 1080, { fit: 'cover' }).png().toBuffer();
const tiles = [];

for (const screen of screens) {
  const scale = screen.width / 1920;

  // 브라우저가 캔버스에 그리는 것과 같은 확대를 거친 뒤, 같은 물리 영역을 잘라낸다.
  const scaled = await sharp(master)
    .resize(screen.width, Math.round(1080 * scale))
    .png()
    .toBuffer();

  const crop = await sharp(scaled)
    .extract({
      left: Math.round(REGION.left * scale),
      top: Math.round(REGION.top * scale),
      width: Math.round(REGION.width * scale),
      height: Math.round(REGION.height * scale),
    })
    .resize(TILE_W, TILE_H)
    .png()
    .toBuffer();

  const caption = Buffer.from(
    `<svg width="${TILE_W}" height="42">
       <text x="14" y="29" font-family="Consolas, monospace" font-size="21" fill="#32dab4">${screen.label}</text>
     </svg>`,
  );

  tiles.push(
    await sharp({
      create: { width: TILE_W, height: TILE_H + 42, channels: 3, background: '#050708' },
    })
      .composite([
        { input: crop, top: 42, left: 0 },
        { input: caption, top: 0, left: 0 },
      ])
      .png()
      .toBuffer(),
  );
}

const th = TILE_H + 42;
await sharp({
  create: { width: TILE_W, height: th * 3 + 20, channels: 3, background: '#050708' },
})
  .composite(tiles.map((input, i) => ({ input, left: 0, top: i * (th + 10) })))
  .png()
  .toFile(OUT);

console.log('upscale-demo.png 생성 완료');

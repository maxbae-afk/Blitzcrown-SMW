import sharp from 'sharp';

// 사용법: bun run compare.mjs [frame] [left] [top] [width] [height] [zoom] [outName]
const [frame = 'img-sroll132.png', left = 780, top = 330, width = 480, height = 270, zoom = 2, outName = 'quality-compare'] =
  process.argv.slice(2);

const SRC = `C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames/${frame}`;
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

const CROP = { left: +left, top: +top, width: +width, height: +height };
const ZOOM = +zoom;

const variants = [
  { label: 'SOURCE PNG (무손실)', encode: null },
  { label: 'WEBP q86  (현재)', encode: (s) => s.webp({ quality: 86, effort: 5, smartSubsample: true }) },
  { label: 'WEBP q92', encode: (s) => s.webp({ quality: 92, effort: 6, smartSubsample: true }) },
  { label: 'AVIF q60', encode: (s) => s.avif({ quality: 60, effort: 4 }) },
];

const tiles = [];

for (const v of variants) {
  const base = sharp(SRC).resize(1920, 1080, { fit: 'cover' });
  const full = v.encode ? await v.encode(base).toBuffer() : await base.png().toBuffer();
  const kb = Math.round(full.length / 1024);

  const crop = await sharp(full)
    .extract(CROP)
    .resize(CROP.width * ZOOM, CROP.height * ZOOM, { kernel: 'nearest' })
    .png()
    .toBuffer();

  const caption = Buffer.from(
    `<svg width="${CROP.width * ZOOM}" height="44">
       <rect width="100%" height="100%" fill="#05070800"/>
       <text x="14" y="30" font-family="Consolas, monospace" font-size="22" fill="#32dab4">${v.label}</text>
       <text x="${CROP.width * ZOOM - 14}" y="30" text-anchor="end" font-family="Consolas, monospace" font-size="22" fill="#f2f7f5">${v.encode ? `${kb}KB / frame` : `${kb}KB`}</text>
     </svg>`,
  );

  tiles.push(
    await sharp({
      create: {
        width: CROP.width * ZOOM,
        height: CROP.height * ZOOM + 44,
        channels: 3,
        background: '#050708',
      },
    })
      .composite([
        { input: crop, top: 44, left: 0 },
        { input: caption, top: 0, left: 0 },
      ])
      .png()
      .toBuffer(),
  );
}

const tw = CROP.width * ZOOM;
const th = CROP.height * ZOOM + 44;

await sharp({
  create: { width: tw * 2 + 12, height: th * 2 + 12, channels: 3, background: '#050708' },
})
  .composite([
    { input: tiles[0], left: 0, top: 0 },
    { input: tiles[1], left: tw + 12, top: 0 },
    { input: tiles[2], left: 0, top: th + 12 },
    { input: tiles[3], left: tw + 12, top: th + 12 },
  ])
  .png()
  .toFile(`${OUT}/${outName}.png`);

console.log(`${outName}.png 생성 완료`);

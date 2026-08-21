import sharp from 'sharp';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';
const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';

const [frame = 'img-sroll132.png', left = 780, top = 330, width = 480, height = 270, zoom = 2, outName = 'sharpen-compare'] =
  process.argv.slice(2);

const CROP = { left: +left, top: +top, width: +width, height: +height };
const Z = +zoom;

const variants = [
  { label: '현재 (샤프닝 없음)', sharpen: null },
  { label: '약하게  sigma 0.6', sharpen: { sigma: 0.6, m1: 0, m2: 2.5 } },
  { label: '보통    sigma 1.0', sharpen: { sigma: 1.0, m1: 0, m2: 3 } },
  { label: '강하게  sigma 1.5', sharpen: { sigma: 1.5, m1: 0, m2: 3.5 } },
];

// 용량 영향은 시퀀스 전체 평균으로 따로 잰다.
const sizeSamples = ['img-sroll000.png', 'img-sroll060.png', 'img-sroll132.png', 'img-sroll250.png'];

const tiles = [];

for (const v of variants) {
  let avgKb = 0;
  for (const f of sizeSamples) {
    let pipe = sharp(`${SRC}/${f}`).resize(1920, 1080, { fit: 'cover' });
    if (v.sharpen) pipe = pipe.sharpen(v.sharpen);
    const buf = await pipe.webp({ quality: 86, effort: 5, smartSubsample: true }).toBuffer();
    avgKb += buf.length / 1024 / sizeSamples.length;
  }

  let pipe = sharp(`${SRC}/${frame}`).resize(1920, 1080, { fit: 'cover' });
  if (v.sharpen) pipe = pipe.sharpen(v.sharpen);
  const full = await pipe.webp({ quality: 86, effort: 5, smartSubsample: true }).toBuffer();

  const crop = await sharp(full)
    .extract(CROP)
    .resize(CROP.width * Z, CROP.height * Z, { kernel: 'nearest' })
    .png()
    .toBuffer();

  const caption = Buffer.from(
    `<svg width="${CROP.width * Z}" height="42">
       <text x="14" y="29" font-family="Consolas, monospace" font-size="21" fill="#32dab4">${v.label}</text>
       <text x="${CROP.width * Z - 14}" y="29" text-anchor="end" font-family="Consolas, monospace" font-size="21" fill="#f2f7f5">평균 ${avgKb.toFixed(0)}KB</text>
     </svg>`,
  );

  tiles.push(
    await sharp({
      create: { width: CROP.width * Z, height: CROP.height * Z + 42, channels: 3, background: '#050708' },
    })
      .composite([
        { input: crop, top: 42, left: 0 },
        { input: caption, top: 0, left: 0 },
      ])
      .png()
      .toBuffer(),
  );
}

const tw = CROP.width * Z;
const th = CROP.height * Z + 42;

await sharp({ create: { width: tw * 2 + 12, height: th * 2 + 12, channels: 3, background: '#050708' } })
  .composite([
    { input: tiles[0], left: 0, top: 0 },
    { input: tiles[1], left: tw + 12, top: 0 },
    { input: tiles[2], left: 0, top: th + 12 },
    { input: tiles[3], left: tw + 12, top: th + 12 },
  ])
  .png()
  .toFile(`${OUT}/${outName}.png`);

console.log(`${outName}.png 생성 완료`);

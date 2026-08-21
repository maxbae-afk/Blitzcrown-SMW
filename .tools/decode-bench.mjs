/**
 * WebP vs AVIF 디코딩 속도 측정.
 *
 * AVIF 는 같은 용량에서 화질이 좋지만 디코딩이 느리다. 264장을 미리 디코딩해 두는
 * 구조라 이 차이가 로딩 시간에 그대로 쌓인다. 채택 여부는 여기서 갈린다.
 *
 *   bun run decode-bench.mjs
 */

import sharp from 'sharp';
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { listSource } from './pacing.mjs';
import { applyGrade } from './grade.mjs';

const SRC = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/_source-frames';
const SITE = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling';
const DIR = `${SITE}/_bench`;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const N = 12;
const files = listSource(SRC);

mkdirSync(DIR, { recursive: true });

console.log(`테스트 프레임 ${N}장 인코딩 중…`);
for (let i = 0; i < N; i += 1) {
  const { data } = await sharp(`${SRC}/${files[i * 8]}`)
    .resize(1920, 1080, { fit: 'cover' })
    .sharpen({ sigma: 1.0, m1: 0, m2: 3 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  applyGrade(data);

  const raw = { raw: { width: 1920, height: 1080, channels: 3 } };
  await sharp(data, raw)
    .webp({ quality: 86, effort: 5, smartSubsample: true })
    .toFile(`${DIR}/f${i}.webp`);
  await sharp(data, raw)
    .avif({ quality: 70, effort: 4, chromaSubsampling: '4:4:4' })
    .toFile(`${DIR}/f${i}.avif`);
}

writeFileSync(`${DIR}/index.html`, '<!doctype html><meta charset="utf-8"><title>bench</title>');

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--hide-scrollbars'],
});
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8123/_bench/', { waitUntil: 'load' });

const result = await page.evaluate(async (n) => {
  async function run(ext) {
    // 네트워크를 캐시에 올려두고 디코딩 시간만 잰다.
    const buffers = [];
    for (let i = 0; i < n; i += 1) {
      const res = await fetch(`f${i}.${ext}`);
      buffers.push(await res.blob());
    }

    const t0 = performance.now();
    for (const blob of buffers) {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      await img.decode();
      URL.revokeObjectURL(url);
    }
    return (performance.now() - t0) / n;
  }

  const support = document
    .createElement('canvas')
    .toDataURL('image/avif')
    .startsWith('data:image/avif');

  await run('webp');
  await run('avif');

  return {
    webp: await run('webp'),
    avif: await run('avif'),
    encodeSupport: support,
  };
}, N);

await browser.close();

console.log(`\nWebP  프레임당 ${result.webp.toFixed(1)}ms`);
console.log(`AVIF  프레임당 ${result.avif.toFixed(1)}ms  (${(result.avif / result.webp).toFixed(2)}x)`);
console.log(`\n264장 전체 디코딩 추정`);
console.log(`  WebP  ${((result.webp * 264) / 1000).toFixed(1)}초`);
console.log(`  AVIF  ${((result.avif * 264) / 1000).toFixed(1)}초`);

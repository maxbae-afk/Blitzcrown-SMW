/**
 * 뉴스 사진 한 장을 사이트에 넣을 형태로 바꾼다.
 *
 * 원본은 blitzcrown-v2/_source-news/ 에 둔다. 설정을 바꿔 다시 뽑을 일이 생기기 때문이다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run news-image.mjs news-03-stand          # _source-news/news-03-stand.png 를 읽는다
 *   bun run news-image.mjs news-03-stand <원본경로>  # 다른 곳에서 읽을 때
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const [name, srcArg] = process.argv.slice(2);
if (!name) {
  console.error('사용법: bun run news-image.mjs <출력이름> [원본경로]');
  process.exit(1);
}

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const OUT = `${ROOT}/srolling/assets/news`;
const src = srcArg ?? `${ROOT}/_source-news/${name}.png`;

mkdirSync(OUT, { recursive: true });

/*
  화면에서 실제로 쓰이는 폭에 맞춘 세 단계다.
  목록 썸네일은 260px 자리라 배율 2 화면에서 520px 이면 충분하고,
  기사 키비주얼은 1328px 자리라 배율 1 에서 1360px, 배율 2 에서 2656px 을 요구한다.
*/
const TIERS = [
  { suffix: '-sm', width: 520 },
  { suffix: '', width: 1360 },
  { suffix: '-2x', width: 2720 },
];

/* 원본보다 두 배를 넘겨 늘리지 않는다. 그 위로는 없는 화소를 지어내며 용량만 커진다. */
const MAX_UPSCALE = 2;

const meta = await sharp(src).metadata();
if (meta.format !== 'png') {
  console.log(`참고: 원본이 ${meta.format} 이다. 이미 한 번 압축된 그림이라 여기서 더 좋아질 수는 없다.`);
}

const seen = new Set();

for (const { suffix, width: want } of TIERS) {
  const width = Math.min(want, Math.round(meta.width * MAX_UPSCALE));
  // 상한에 걸려 아래 단계와 같은 폭이 되면 파일만 늘어난다.
  if (seen.has(width)) {
    console.log(`${name}${suffix}.webp  건너뜀 (${want}px 는 원본 ${meta.width}px 로 감당 못 함)`);
    continue;
  }
  seen.add(width);

  const scale = width / meta.width;

  /*
    늘려 그릴수록 윤곽이 뭉개진다. 브라우저가 알아서 늘리게 두면 보간만 하고 끝이라 더 흐리다.
    여기서 라체오스로 늘리고 언샤프를 걸어 두면 최종 화면에서 그만큼 또렷하게 남는다.
    m1 은 0 으로 둔다. 평탄한 영역까지 세우면 이 사진처럼 어두운 곳에서 노이즈가 같이 뜬다.
  */
  const sigma = scale > 1.6 ? 1.2 : scale > 1.05 ? 0.9 : 0.6;
  const m2 = scale > 1.6 ? 2 : scale > 1.05 ? 1.6 : 1.2;

  const out = `${OUT}/${name}${suffix}.webp`;
  const info = await sharp(src)
    .resize({ width, kernel: 'lanczos3' })
    .sharpen({ sigma, m1: 0, m2 })
    // 네온 간판처럼 채도 높은 경계는 색 정보를 줄이면 먼저 뭉개진다. smartSubsample 이 그걸 막는다.
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(out);

  console.log(
    `${name}${suffix}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB  ` +
      `(원본의 ${scale.toFixed(2)}배, 언샤프 ${sigma})`,
  );
}

console.log(`원본 ${meta.width}x${meta.height} ${meta.format}`);

/*
  뉴스 사진을 img 에 채운다. 목록과 기사 페이지가 같은 파일을 쓰기 때문에 한 곳에 모아 둔다.

  파일은 .tools/news-image.mjs 가 한 이름에서 세 벌을 만든다.
  브라우저는 sizes 로 계산한 필요 폭에 맞는 것을 고르므로, 목록 썸네일이 큰 파일을 받는 일은 없다.
*/

const TIERS = [
  { suffix: '-sm', width: 520 },
  { suffix: '', width: 1360 },
  { suffix: '-2x', width: 2048 },
];

export function fillImage(img, image, sizes) {
  // srcset 을 못 읽는 경우를 대비한 기본값. 가장 큰 것을 두면 그런 환경에서 과하게 받는다.
  img.src = `${image.base}.webp`;
  img.srcset = TIERS.map(({ suffix, width }) => `${image.base}${suffix}.webp ${width}w`).join(', ');
  img.sizes = sizes;
  img.alt = image.alt;
  img.style.objectPosition = image.focus ?? '50% 40%';
  img.decoding = 'async';
}

/**
 * 뉴스 사진이 실제로 몇 화소로 그려지는지, 그리고 어떻게 보이는지 확인한다.
 * 화면 배율을 올리면 브라우저가 어떤 파일을 고르는지가 달라져서, 두 배율을 모두 본다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run news-quality.mjs 03 before
 */

import { open } from './page.mjs';

const id = process.argv[2] ?? '03';
const tag = process.argv[3] ?? 'now';

for (const dpr of [1, 2]) {
  const { browser, page, errors } = await open({ width: 1440, height: 900, dpr });
  await page.goto(`http://127.0.0.1:4321/article.html?id=${id}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  /*
    naturalWidth 는 srcset 의 w 서술자로 보정된 값이라 파일의 실제 화소가 아니다.
    늘려 그리는 배율을 알려면 파일을 직접 받아 재야 한다.
  */
  const info = await page.evaluate(async () => {
    const img = document.querySelector('.article-hero-img');
    const r = img.getBoundingClientRect();
    const bmp = await createImageBitmap(await (await fetch(img.currentSrc)).blob());
    return { cssW: Math.round(r.width), picked: img.currentSrc.split('/').pop(), realW: bmp.width };
  });

  const el = await page.$('.article-hero-img');
  await el.screenshot({ path: `shots/q-${tag}-dpr${dpr}.png` });

  const deviceW = info.cssW * dpr;
  const stretch = (deviceW / info.realW).toFixed(2);
  console.log(
    `dpr ${dpr}  고른파일 ${info.picked} (${info.realW}px)  필요 ${deviceW}px  늘림 ${stretch}배` +
      (errors.length ? `  오류 ${errors.length}` : ''),
  );

  await browser.close();
}

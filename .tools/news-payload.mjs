/**
 * 뉴스 사진을 어떤 크기로 받아 가는지 본다.
 * 목록은 작은 것만, 기사는 화면 배율에 맞는 것만 받아야 한다.
 * 여기서 큰 파일이 목록에 잡히면 sizes 가 잘못된 것이다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run news-payload.mjs
 */

import { open } from './page.mjs';

const PAGES = [
  { label: '목록', url: 'news.html' },
  { label: '기사', url: 'article.html?id=03' },
];

for (const dpr of [1, 2]) {
  for (const { label, url } of PAGES) {
    const { browser, page } = await open({ width: 1440, height: 900, dpr });

    const got = new Map();
    page.on('response', (r) => {
      if (!r.url().includes('/assets/news/')) return;
      const name = r.url().split('/').pop();
      got.set(name, Number(r.headers()['content-length'] ?? 0));
    });

    await page.goto(`http://127.0.0.1:4321/${url}`, { waitUntil: 'networkidle0' });
    // 목록 썸네일은 lazy 라 화면에 들어와야 받는다.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await new Promise((r) => setTimeout(r, 400));

    const total = [...got.values()].reduce((a, b) => a + b, 0);
    console.log(
      `dpr ${dpr}  ${label}  합계 ${(total / 1024).toFixed(0)}KB  ` +
        [...got.keys()].sort().join(', '),
    );

    await browser.close();
  }
}

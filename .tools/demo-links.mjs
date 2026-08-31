/*
  공식 사이트에서 게임별 데모 주소를 뽑아 남긴다.

  목록의 카드는 링크가 아니라 눌러야 주소가 바뀌는 요소이고,
  game_info 도 자바스크립트로 그려져서 정적 HTML 에는 게임 주소가 없다.
  그래서 브라우저를 띄워 실제로 눌러 보고, 뜬 iframe 을 읽는다.

  결과는 demo-links.json 으로 남긴다. 사이트가 바뀌면 이 파일만 다시 돌리면 된다.
*/

import puppeteer from 'puppeteer-core';
import { writeFile } from 'node:fs/promises';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const HOST = 'https://blitzcrown.massivegaming.io';
const GAME_HOST = 'games.ntcc.massivegaming.io';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });

/* 1) 목록의 카드를 하나씩 눌러 슬러그를 모은다. */
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 2400 });

const openList = async () => {
  await page.goto(`${HOST}/games`, { waitUntil: 'networkidle2', timeout: 60000 });
  await wait(5000);
};

await openList();
const cardCount = await page.$$eval('.bubble-element.group-item', (nodes) => nodes.length);
console.log('카드', cardCount);

const games = [];
for (let index = 0; index < cardCount; index += 1) {
  await page.$$eval(
    '.bubble-element.group-item',
    (nodes, i) => nodes[i]?.querySelector('.clickable-element')?.click(),
    index,
  );
  await wait(3500);

  const url = new URL(page.url());
  const slug = url.searchParams.get('title');
  if (slug) games.push({ slug, title: null });
  console.log(index, slug ?? `이동 없음(${page.url()})`);

  await openList();
}
await page.close();

/* 2) 게임마다 데모를 열어 실제 주소를 잡는다. */
for (const game of games) {
  const detail = await browser.newPage();
  await detail.setViewport({ width: 1440, height: 900 });

  const seen = new Set();
  detail.on('request', (req) => {
    if (req.url().includes(GAME_HOST)) seen.add(req.url());
  });

  try {
    await detail.goto(`${HOST}/game_info?title=${game.slug}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(3000);

    game.title = await detail.evaluate(() => document.title || null);

    // 연령 확인이나 데모 버튼 문구가 게임마다 조금씩 다르다. 있는 것만 눌린다.
    for (const word of ['I AM OVER', 'ENTER', 'AGREE', 'YES', 'PLAY DEMO', 'DEMO']) {
      const hit = await detail.evaluate((text) => {
        const node = Array.from(document.querySelectorAll('button, a, .clickable-element')).find((el) =>
          el.textContent.trim().toUpperCase().startsWith(text),
        );
        if (!node) return false;
        node.click();
        return true;
      }, word);
      if (hit) await wait(3000);
    }
    await wait(5000);

    const frames = await detail.$$eval('iframe', (nodes) => nodes.map((node) => node.src).filter(Boolean));
    game.embed = frames.find((url) => url.includes(GAME_HOST)) ?? Array.from(seen)[0] ?? null;
    game.frames = frames;
    console.log(game.slug, game.embed ?? '없음');
  } catch (error) {
    game.embed = null;
    game.error = String(error.message ?? error);
    console.log(game.slug, '실패', game.error);
  }

  await detail.close();
}

await browser.close();

await writeFile(
  new URL('./demo-links.json', import.meta.url),
  `${JSON.stringify({ checked: new Date().toISOString().slice(0, 10), host: HOST, games }, null, 2)}\n`,
);
console.log('저장 완료', games.filter((game) => game.embed).length, '/', games.length);

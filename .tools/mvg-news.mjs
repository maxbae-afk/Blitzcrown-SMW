/*
  매시브게이밍 뉴스에서 블리츠크라운 기사를 긁어 온다.

  뉴스 페이지는 자바스크립트로 그려지지만, 목록 자체는 블로그 쪽 API 두 개에서 온다.
    /_functions/categories  갈래 이름과 아이디
    /_functions/articles    기사 목록(제목·갈래·썸네일·요약·날짜·본문 주소)
  본문은 그 주소(Wix 블로그)를 열어 읽는다.

  회사망에서 인증서가 가로채여 bun 의 fetch 가 막히므로 내려받기도 브라우저 안에서 한다.

  결과:
    mvg-news.json                    기사 자료
    ../_source-news/mvg-*.png|jpg    원본 사진
*/

import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
  원본 사이트가 붙여 둔 BLITZCROWN 갈래만 가져온다.
  제목에 이름이 나오는 기사까지 넓히면 매시브게이밍 전체 소식이 절반 가까이 딸려 온다.

  기사 끝에는 어느 글에나 같은 홍보 꼬리가 붙는다. 우리 지면에서는 군더더기라 떼어 낸다.
*/
const BOILERPLATE = [
  /^unconventional by design/i,
  /official social media$/i,
  /^linkedin/i,
  /^explore blitzcrown/i,
  /head over to massivegaming\.io/i,
  /^💼/,
];

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });

/* ---------- 1) 목록 ---------- */

const list = await browser.newPage();
const feeds = new Map();
list.on('response', async (res) => {
  if (!res.url().includes('_functions/')) return;
  try {
    feeds.set(res.url().split('_functions/')[1], await res.json());
  } catch {
    /* 본문을 못 읽는 응답은 넘긴다 */
  }
});
await list.goto('https://massivegaming.io/news/', { waitUntil: 'networkidle2', timeout: 90000 });
await wait(8000);
await list.close();

const categories = Object.fromEntries(feeds.get('categories').categories.map((c) => [c.id, c.name]));
const posts = feeds.get('articles').posts;

const picked = posts.filter((post) => post.category.some((id) => categories[id] === 'Blitzcrown'));
console.log(`전체 ${posts.length}건 중 블리츠크라운 ${picked.length}건`);

/* ---------- 2) 본문 ---------- */

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 2400 });

const articles = [];
for (const post of picked) {
  await page.goto(post.publicUrl.replace('http://', 'https://'), {
    waitUntil: 'networkidle2',
    timeout: 90000,
  });
  await wait(4000);

  const read = await page.evaluate(() => {
    /* 제목에서 위로 올라가 본문 덩어리를 찾는다. 문단이 여럿 들어 있는 첫 조상이다. */
    const h1 = document.querySelector('h1');
    let root = h1?.parentElement;
    while (root && root.querySelectorAll('p').length < 5) root = root.parentElement;
    if (!root) return null;

    const meta = Array.from(root.querySelectorAll('li'))
      .map((li) => li.textContent.trim())
      .find((text) => /min read/i.test(text));

    /*
      이 블로그는 소제목도 p 로 적는다. 그래서 태그가 아니라 글자 크기와 굵기로 가른다.
      본문 문단의 크기를 기준 삼아 그보다 크거나 굵으면 소제목으로 본다.
    */
    const nodes = Array.from(root.querySelectorAll('p, h2, h3, h4, blockquote, ul, ol, img'));
    const sizes = nodes
      .filter((node) => node.tagName === 'P' && node.textContent.trim().length > 120)
      .map((node) => parseFloat(getComputedStyle(node).fontSize));
    const bodySize = sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)] || 16;

    const blocks = [];
    for (const node of nodes) {
      if (node.closest('nav, header, footer')) continue;

      if (node.tagName === 'IMG') {
        const src = node.currentSrc || node.src;
        if (!src || node.naturalWidth < 400) continue;
        blocks.push({ kind: 'image', src, alt: node.alt || '' });
        continue;
      }

      if (node.tagName === 'UL' || node.tagName === 'OL') {
        const items = Array.from(node.querySelectorAll('li'))
          .map((li) => li.textContent.trim())
          .filter(Boolean);
        if (items.length > 1) blocks.push({ kind: 'list', items });
        continue;
      }

      const text = node.textContent.trim();
      if (!text || node.querySelector('img, ul, ol')) continue;

      if (node.tagName === 'BLOCKQUOTE') {
        blocks.push({ kind: 'quote', text });
        continue;
      }

      const style = getComputedStyle(node);
      const big = parseFloat(style.fontSize) > bodySize + 1;
      const bold = Number(style.fontWeight) >= 600;
      const short = text.length < 90;
      blocks.push({ kind: (big || bold) && short ? 'heading' : 'p', text });
    }
    return { meta, blocks };
  });

  /*
    앞머리 사진은 목록 썸네일과 같은 것이라 본문에서 뺀다.
    꼬리의 홍보 문구와 그 위 배너도 뺀다. 문구를 지우고 나면 배너가 맨 끝에 남는다.
  */
  const blocks = (read?.blocks ?? []).filter(
    (block) => !(block.kind === 'p' && BOILERPLATE.some((rule) => rule.test(block.text))),
  );
  if (blocks[0]?.kind === 'image') blocks.shift();
  while (blocks.at(-1)?.kind === 'image') blocks.pop();

  articles.push({
    title: post.title.trim(),
    slug: post.slug,
    date: post.first_published_at.slice(0, 10),
    tags: post.category.map((id) => categories[id]).filter(Boolean),
    excerpt: post.excerpt,
    url: post.publicUrl,
    readTime: read?.meta ?? null,
    hero: post.thumbnail,
    blocks,
  });
  console.log(`${post.first_published_at.slice(0, 10)} ${post.title} — 덩어리 ${blocks.length}`);
}

/* ---------- 3) 사진 ---------- */

// Wix 주소의 /v1/... 은 잘라 낸 판본이다. 그 앞까지가 원본이다.
// 뒤에 붙는 #originWidth=… 같은 꼬리표는 파일 이름에 섞이므로 함께 떼어 낸다.
const original = (url) => url.split('/v1/')[0].split(/[#?]/)[0];

const source = here('../_source-news/');
await mkdir(source, { recursive: true });

const saved = new Map();
async function download(url, name) {
  const clean = original(url);
  if (saved.has(clean)) return saved.get(clean);

  const res = await page.goto(clean, { waitUntil: 'networkidle0', timeout: 90000 });
  const ext = clean.split('.').pop().split('?')[0].toLowerCase();
  const file = `${name}.${ext === 'jpeg' ? 'jpg' : ext}`;
  await writeFile(`${source}${file}`, await res.buffer());
  saved.set(clean, file);
  console.log('내려받음', file);
  return file;
}

for (const [i, article] of articles.entries()) {
  const tag = `mvg-${String(i + 1).padStart(2, '0')}`;
  article.heroFile = await download(article.hero, `${tag}-hero`);

  let n = 0;
  for (const block of article.blocks) {
    if (block.kind !== 'image') continue;
    n += 1;
    block.file = await download(block.src, `${tag}-body-${String(n).padStart(2, '0')}`);
  }
}

await browser.close();

await writeFile(here('./mvg-news.json'), `${JSON.stringify(articles, null, 2)}\n`);
console.log('저장 완료', articles.length);

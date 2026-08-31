/*
  mvg-news.json 에 담긴 원문을 우리 지면 형식으로 옮긴다.

    cd blitzcrown-v2/.tools
    bun run mvg-apply.mjs

  하는 일
    1) 아래 PLAN 에 적은 기사만 골라 news.data.js 맨 위에 붙인다
    2) 원본 사진을 news-<번호>-… 이름으로 옮기고 news-image.mjs 로 세 벌씩 뽑는다
    3) 기존 기사는 순서 그대로 아래에 남긴다

  원문을 그대로 쓰지 않고 PLAN 을 따로 둔 까닭:
  블로그는 소제목도 그냥 문단으로 적어 둔 곳이 있어 글자 크기만으로는 갈리지 않는다.
  또 우리 갈래(NEW RELEASES/PARTNERSHIPS/LICENSING/EVENTS)는 원본에 없는 값이라
  사람이 정해 주어야 한다. 문장 자체는 손대지 않는다.
*/

import sharp from 'sharp';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const SOURCE = here('../_source-news/');
const DATA = here('../srolling/js/news.data.js');

/*
  slug 로 고른다. 순서가 곧 지면 순서다.

  cut  : 통째로 뺄 문단. 제목과 겹치거나 링크만 있는 줄이다.
  head : 소제목으로 올릴 문단. 원본에서 굵게만 되어 있어 문단으로 읽힌 것들이다.
  pull : 큰따옴표로 뽑아 둘 문단.
  skip : 쓰지 않을 사진. 키비주얼과 겹치거나 로고 띠라 본문에서 의미가 없다.
*/
/* 어느 기사에나 붙는 홍보 꼬리. 우리 지면에서는 어디에도 이어지지 않는 줄이라 뺀다. */
const TRAILER = [/official social media$/i, /^linkedin/i, /^unconventional by design/i];

const PLAN = [
  {
    slug: 'massive-gaming-goes-live-with-superbet-brazil-via-bragg-gaming-group',
    id: '13',
    category: 'PARTNERSHIPS',
    alt: '슈퍼벳 브라질에 나간 블리츠크라운 여덟 작품을 모아 둔 배너.',
    cut: [/^massive gaming goes live with superbet brazil/i],
    skip: ['mvg-01-hero.png'],
  },
  {
    slug: 'massive-gaming-secures-mga-b2b-licence',
    id: '14',
    category: 'LICENSING',
    alt: '몰타 게이밍 어소리티 B2B 라이선스를 알리는 MVG 배너.',
  },
  {
    slug: 'blitzcrown-2026-outlook-a-trilogy-for-the-new-era-of-instant-win',
    id: '15',
    category: 'EVENTS',
    alt: '블리츠크라운 2026 전망을 알리는 배너.',
    pull: [/^"We don.t just create genres/i, /^"Reinterpreting established grammars/i],
    head: [
      /^2025: A Season of Experimentation/i,
      /^The 2026 Shift/i,
      /^Act 1\./i,
      /^Act 2\./i,
      /^Act 3\./i,
    ],
    captions: [
      ['NINE KNIGHTS · NEW PLINKO', '2025 — 실험의 해'],
      ['SUPER CARD RUSH', 'ACT 1 — 재미의 번역'],
      ['DRAGON & WIZARD SERIES', 'ACT 2 — 이야기의 힘'],
    ],
  },
  {
    slug: 'the-magic-continues-dragon-wizard-series-universe',
    id: '16',
    category: 'NEW RELEASES',
    alt: '드래곤 앤 위저드 시리즈의 마법사와 용을 그린 키비주얼.',
    cut: [/^try dragon & wizard series/i],
  },
  {
    slug: 'blitzcrown-unveils-new-release-snowball-plinko-promises-avalanche-of-wins',
    id: '17',
    category: 'NEW RELEASES',
    alt: '눈 덮인 산장을 배경으로 한 스노볼 플링코 보드.',
  },
  {
    slug: 'blitzcrown-completes-rng-certification-from-gli',
    id: '18',
    category: 'LICENSING',
    alt: 'GLI RNG 인증 완료를 알리는 블리츠크라운 배너.',
    cut: [/^visit our website/i, /^contact us for more information/i],
    skip: ['mvg-08-body-01.png'],
  },
];

/* ---------- 옮기기 ---------- */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const stamp = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

/* 목록 한 줄에 두 줄로 앉는 길이다. 문장 도중에 자르지 않고 마침표에서 끊는다. */
function shorten(text, limit = 150) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '));
  return stop > 60 ? cut.slice(0, stop + 1) : `${cut.replace(/[,\s]+\S*$/, '')}…`;
}

const raw = JSON.parse(await readFile(here('./mvg-news.json'), 'utf8'));
const made = [];

for (const plan of PLAN) {
  const post = raw.find((item) => item.slug === plan.slug);
  if (!post) throw new Error(`원문을 찾지 못했습니다: ${plan.slug}`);

  const hit = (rules, text) => (rules ?? []).some((rule) => rule.test(text));
  const body = [];
  let shots = 0;

  for (const block of post.blocks) {
    if (block.kind === 'image') {
      if (plan.skip?.includes(block.file)) continue;
      shots += 1;
      const name = `news-${plan.id}-body-${String(shots).padStart(2, '0')}`;
      const [label, note] = plan.captions?.[shots - 1] ?? [null, null];
      body.push({
        type: 'media',
        ...(label ? { label } : {}),
        ...(note ? { note } : {}),
        image: { base: `assets/news/${name}`, alt: block.alt || plan.alt },
        source: block.file,
      });
      continue;
    }

    if (block.kind === 'list') {
      body.push({ type: 'list', items: block.items });
      continue;
    }

    const text = block.text.replace(/\s+/g, ' ').trim();
    if (hit(TRAILER, text) || hit(plan.cut, text)) continue;
    if (hit(plan.pull, text)) {
      body.push({ type: 'quote', text: text.replace(/^"|"$/g, ''), by: 'BLITZCROWN' });
      continue;
    }
    if (block.kind === 'heading' || hit(plan.head, text)) {
      body.push({ type: 'h', text: text.replace(/\.$/, '').toUpperCase() });
      continue;
    }
    body.push({ type: 'p', text });
  }

  // 머리글은 본문 첫 문단이 맡는다. 같은 문장이 두 번 나오지 않도록 본문에서는 뺀다.
  const first = body.findIndex((block) => block.type === 'p' || block.type === 'quote');
  const lead = shorten(body[first].text, 200);
  body.splice(first, 1);

  /*
    발췌문이 제목과 같은 문장으로 시작하는 기사가 있다.
    목록에서는 제목 바로 아래에 붙는 자리라 같은 말이 두 번 보인다. 그 첫 문장만 걷어 낸다.
  */
  const title = post.title.replace(/\s+/g, ' ').trim();
  const excerpt = post.excerpt.replace(/\s+/g, ' ').trim();
  const dropped = excerpt.toLowerCase().startsWith(title.toLowerCase())
    ? excerpt.slice(title.length).replace(/^[.\s]+/, '')
    : excerpt;

  made.push({
    id: plan.id,
    category: plan.category,
    date: stamp(post.date),
    readTime: (post.readTime ?? '2 min read').toUpperCase(),
    title: title.toUpperCase(),
    summary: shorten(dropped || excerpt),
    lead,
    body,
    image: { base: `assets/news/news-${plan.id}-hero`, alt: plan.alt },
    heroSource: post.heroFile,
  });
}

/* ---------- 사진 ---------- */

for (const article of made) {
  const jobs = [[`news-${article.id}-hero`, article.heroSource]];
  for (const block of article.body) {
    if (block.type === 'media') jobs.push([block.image.base.split('/').pop(), block.source]);
  }

  for (const [name, file] of jobs) {
    const from = `${SOURCE}${file}`;
    const to = `${SOURCE}${name}.${file.split('.').pop()}`;

    /*
      긁어 온 mvg-*.png 는 한 번 옮기고 나면 지워도 된다. 쓰이는 것은 여기 옮긴 판본이다.
      그래서 원본이 없더라도 옮겨 둔 것이 있으면 그대로 다시 뽑는다.
    */
    if (existsSync(from)) await copyFile(from, to);
    else if (!existsSync(to)) throw new Error(`원본이 없습니다: ${from}`);

    const meta = await sharp(to).metadata();
    if (meta.width < 900) console.log(`  주의 ${name} 원본이 ${meta.width}px 로 작다`);
    await $`bun run news-image.mjs ${name}`.quiet();
    console.log(`  사진 ${name} (${meta.width}x${meta.height})`);
  }

  delete article.heroSource;
  for (const block of article.body) delete block.source;
}

/* ---------- 자료 ---------- */

const text = await readFile(DATA, 'utf8');
const head = text.slice(0, text.indexOf('export const ARTICLES'));
const old = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));

// 새 기사가 위, 예전 기사는 순서 그대로 아래. 사진이 있는 03·12 만 먼저 세운다.
// 이미 한 번 붙인 뒤에 다시 돌려도 겹치지 않도록, 이 도구가 맡는 번호는 먼저 걷어 낸다.
const mine = new Set(PLAN.map((plan) => plan.id));
const lift = ['03', '12'];
const kept = old.filter((item) => !mine.has(item.id));
const rest = [
  ...lift.map((id) => kept.find((item) => item.id === id)).filter(Boolean),
  ...kept.filter((item) => !lift.includes(item.id)),
];

await writeFile(DATA, `${head}export const ARTICLES = ${JSON.stringify([...made, ...rest], null, 2)};\n`);
console.log(`\n기사 ${made.length}건을 위에 붙였습니다. 전체 ${made.length + rest.length}건.`);

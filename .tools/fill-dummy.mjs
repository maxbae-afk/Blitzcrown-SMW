/**
 * 비어 있던 칸을 더미 값으로 채운다.
 *
 * 그동안 확정되지 않은 값은 null 로 두고 화면에 CONTENT REQUIRED 로 내보냈다.
 * 검토용으로는 빈 구멍이 많아 읽기 어렵다는 판단이 있어, 모양만 맞는 더미를 채워 넣는다.
 *
 * 채우는 것 : 게임 사양 표, 출시 시기, 지원 사양의 빈 줄, 뉴스 기사 본문
 * 그대로 둔 것 : 제목·소개·요약처럼 실제로 확인된 값, 그리고 01번 기사의 본문(원문이 남아 있다)
 *
 * 여기 들어가는 숫자는 전부 지어낸 것이다. 인증을 거친 값이 아니다.
 * 그래서 상세 페이지의 검수 표시 문구도 그 사실을 그대로 말하도록 바꿔 두었다.
 *
 *   bun run fill-dummy.mjs
 */

import { writeFileSync } from 'node:fs';

const JS = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling/js';

async function readArray(file) {
  const text = await Bun.file(`${JS}/${file}`).text();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  return JSON.parse(text.slice(start, end + 1));
}

const banner = (what) => `/*
  ${what} 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.

  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.
  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.
*/

`;

/* ---------- 게임 사양 ---------- */

/*
  분류마다 성격이 다르니 값도 다르게 잡는다.
  전부 같은 숫자를 넣으면 표가 열여덟 번 복사된 것처럼 보여서 검토에 도움이 안 된다.
*/
const BY_CATEGORY = {
  PLINKO: { rtp: 96.4, volatility: 'HIGH', round: '7 SEC AVG', bet: '0.10 / 200.00' },
  CRASH: { rtp: 97.0, volatility: 'VERY HIGH', round: '12 SEC AVG', bet: '0.20 / 500.00' },
  MINE: { rtp: 96.8, volatility: 'HIGH', round: '25 SEC AVG', bet: '0.10 / 100.00' },
  OTHER: { rtp: 96.1, volatility: 'MEDIUM', round: '15 SEC AVG', bet: '0.10 / 150.00' },
};

/* 제목에 배수가 적힌 게임은 그 숫자를 그대로 쓴다. 표와 이름이 어긋나면 눈에 걸린다. */
const MAX_WIN = {
  'double-pop-plinko': '51,200x',
  'smash-tower': '10,000x',
  'twin-crash-blitz': '25,000x',
  'interstellar-plinko': '20,000x',
  'fast-crash-blitz': '15,000x',
  'super-card-rush': '5,000x',
};

const CEILING = { PLINKO: '12,500x', CRASH: '18,000x', MINE: '9,000x', OTHER: '6,500x' };

const RELEASE = [
  'APR 2026',
  'MAY 2026',
  'JUN 2026',
  'JUL 2026',
  'AUG 2026',
  'SEP 2026',
  'OCT 2026',
  'NOV 2026',
];

const games = await readArray('games.data.js');

games.forEach((game, i) => {
  const base = BY_CATEGORY[game.category] ?? BY_CATEGORY.OTHER;

  // 같은 분류 안에서도 조금씩 어긋나게 둔다.
  const rtp = (base.rtp + ((i % 5) - 2) * 0.1).toFixed(2);

  game.specs = [
    ['RTP', `${rtp}%`],
    ['MAX WIN', MAX_WIN[game.slug] ?? CEILING[game.category] ?? '10,000x'],
    ['VOLATILITY', base.volatility],
    ['MIN / MAX BET', base.bet],
    ['ROUND LENGTH', base.round],
    ['CERTIFICATION', 'GLI-19 · ISO/IEC 17025'],
  ];

  game.meta = game.meta.map(([label, value]) =>
    label === 'RELEASE DATE' && !value ? [label, RELEASE[i % RELEASE.length]] : [label, value],
  );
});

writeFileSync(
  `${JS}/games.data.js`,
  `${banner('게임')}export const GAMES = ${JSON.stringify(games, null, 2)};\n`,
  'utf8',
);

/* ---------- 뉴스 본문 ---------- */

/*
  01번은 원문이 남아 있어 손대지 않는다.
  나머지는 읽는 사람이 한 눈에 더미인 줄 알아야 하므로, 그럴듯한 문장을 쓰지 않고
  무엇이 들어갈 자리인지만 적는다. 길이는 실제 본문에 가깝게 맞춰 줄바꿈과 높이를 볼 수 있게 한다.
*/
const DUMMY = {
  p: 'DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy.',
  short:
    'DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar.',
  h: 'DUMMY SUBHEADING',
  quote: 'DUMMY PULL QUOTE — one line, replace before publication.',
  by: 'PLACEHOLDER ATTRIBUTION',
  item: (n) => `DUMMY LIST ITEM ${String(n).padStart(2, '0')} — replace before publication.`,
};

const news = await readArray('news.data.js');

news.forEach((article) => {
  if (article.id === '01') return;

  article.dummy = true;
  article.lead = 'DUMMY LEAD — replace with the final standfirst before publication.';
  article.body = article.body.map((block, i) => {
    if (block.type === 'h') return { type: 'h', text: DUMMY.h };
    if (block.type === 'quote') return { type: 'quote', text: DUMMY.quote, by: DUMMY.by };
    if (block.type === 'list') {
      return { type: 'list', items: block.items.map((_, n) => DUMMY.item(n + 1)) };
    }
    // 사진 자리는 그대로 둔다. 무엇이 어떤 비율로 들어가는지 적어 둔 정보라 더미가 아니다.
    if (block.type === 'media') return block;
    return { type: 'p', text: i === 0 ? DUMMY.p : DUMMY.short };
  });
});

writeFileSync(
  `${JS}/news.data.js`,
  `${banner('뉴스')}export const ARTICLES = ${JSON.stringify(news, null, 2)};\n`,
  'utf8',
);

const filled = games.reduce((n, g) => n + g.specs.filter(([, v]) => v).length, 0);
console.log(`사양 ${filled}칸을 채우고, 기사 ${news.filter((a) => a.dummy).length}건을 더미 본문으로 바꿨다.`);

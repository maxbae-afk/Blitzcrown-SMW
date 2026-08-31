import { GAMES, badgeTone } from './game-data.js';
import { ARTICLES } from './news-data.js';
import { fillThumb } from './thumb.js';
import { fillImage } from './news-image.js';
import { demoButton } from './demo-player.js';

/*
  홈의 게임 칸과 뉴스 칸을 자료에서 그린다.

  전에는 같은 제목과 문구가 index.html 과 game-data.js / news-data.js 양쪽에 적혀 있었다.
  실제로 어긋나 있었다. 홈 카드에는 "SMASH, CLIMB OR CASH OUT." 이라고 적혀 있었는데
  자료의 소개는 "SMASH. CLIMB. CASH OUT." 이었고, 데모가 없는 게임이 홈에서만
  PLAY DEMO 버튼을 달고 있었다. 이제 한 군데만 고치면 둘 다 따라온다.

  관리자 페이지가 고치는 것도 이 자료다. 홈이 여기서 그려지지 않으면
  관리자에서 무엇을 바꾸든 정작 첫 화면은 그대로였을 것이다.

  마크업은 원래 손으로 적혀 있던 것과 같은 모양을 유지한다. 스타일과 스크롤 연출이
  그 구조를 보고 동작하기 때문이다(.reveal, .rail-item, .card ...).
*/

const RAIL = 6; // 아래 가로 레일에 늘어놓을 수
const CARDS = 6; // 02 / POPULAR GAMES 격자
const NEWS = 4; // 홈 뉴스 칸: 큰 것 하나 + 목록 셋

const live = () => GAMES.filter((game) => !game.pending);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const metaValue = (game, label) => game.meta.find(([key]) => key === label)?.[1] ?? null;

function arrowLink(className, href, label) {
  const link = el('a', className);
  link.href = href;
  link.append(label, document.createElement('i'));
  return link;
}

/* ---------- 01 / NEW RELEASE ---------- */

function renderFeature(host, game) {
  const article = el('article', 'feature reveal');

  const ph = el('div', 'ph--wide');
  fillThumb(ph, game, {
    label: `[IMAGE] ${game.title} KEY ART`,
    note: '2:1 · full-bleed layered environment',
  });

  const body = el('div', 'feature-body');
  const head = el('div', 'feature-head');
  if (game.badge) head.append(el('span', `badge${badgeTone(game.badge)}`, game.badge));
  head.append(el('h3', 'feature-title', game.title), el('p', 'feature-premise', game.premise));

  const actions = el('div', 'actions');
  actions.append(demoButton(game), arrowLink('btn', `game.html?title=${game.slug}`, 'VIEW GAME'));
  head.append(actions);

  // 홈에서는 세 줄만 보여 준다. 나머지는 상세 페이지 몫이다.
  const meta = el('dl', 'meta');
  ['GAME TYPE', 'KEY MECHANIC', 'RELEASE DATE'].forEach((label) => {
    const value = metaValue(game, label);
    const row = document.createElement('div');
    const dd = el('dd', value ? null : 'pending', value ?? 'CONTENT REQUIRED');
    row.append(el('dt', null, label), dd);
    meta.append(row);
  });

  body.append(head, meta);
  article.append(ph, body);
  host.append(article);
}

function renderRail(host, list) {
  host.textContent = '';
  list.forEach((game, i) => {
    const item = el('button', 'rail-item');
    item.type = 'button';
    if (i === 0) {
      item.classList.add('is-current');
      item.setAttribute('aria-current', 'true');
    }

    // 레일 칸은 button 안이라 div 를 쓸 수 없다. span 으로 같은 상자를 만든다.
    const ph = el('span', 'ph--16x9');
    fillThumb(ph, game, { label: `[IMAGE] ${game.title}`, note: '16:9' });

    item.append(ph, el('span', 'rail-name', game.title));
    host.append(item);
  });
}

/* ---------- 02 / POPULAR GAMES ---------- */

function renderCards(host, list) {
  host.textContent = '';
  list.forEach((game) => {
    const card = el('article', 'card reveal');

    const ph = el('div', 'ph--16x10');
    fillThumb(ph, game, { note: '16:10 · hover scale 1.03' });

    const body = el('div', 'card-body');
    // 뱃지가 없는 게임도 자리는 만든다. 빼면 옆 카드와 제목 높이가 어긋난다.
    const badge = el(
      'span',
      game.badge ? `badge badge--soft${badgeTone(game.badge)}` : 'badge badge--soft badge--empty',
    );
    badge.textContent = game.badge ?? 'NEW';

    const key = metaValue(game, 'KEY MECHANIC');
    const actions = el('div', 'actions actions--compact');
    actions.append(
      demoButton(game),
      arrowLink('signal', `game.html?title=${game.slug}`, 'VIEW GAME'),
    );

    body.append(
      badge,
      el('h3', null, game.title),
      el('p', null, game.premise),
      el('p', 'tags', key ? `${game.category} · ${key}` : game.category),
      actions,
    );

    card.append(ph, body);
    host.append(card);
  });
}

/* ---------- 05 / FROM THE CROWN ---------- */

function renderNews(host, list) {
  host.textContent = '';
  const [lead, ...rest] = list;
  if (!lead) return;

  const big = el('article', 'news-lead reveal');

  /*
    사진이 있으면 그것을 쓰고, 없는 기사면 지금까지처럼 자리표를 남긴다.
    이 칸은 데스크톱에서 545px, 그 아래로는 화면 폭에서 좌우 여백을 뺀 만큼이다.
  */
  let media;
  if (lead.image?.base) {
    media = el('img', 'news-lead-img');
    fillImage(media, lead.image, '(max-width: 1080px) calc(100vw - 32px), 545px');
    media.loading = 'lazy';
  } else {
    media = el('div', 'ph--16x9');
    fillThumb(media, { title: lead.title }, { label: `[IMAGE] ${lead.title}`, note: '16:9' });
  }

  big.append(
    media,
    el('p', 'news-meta', `${lead.category} · ${lead.date}`),
    el('h3', null, lead.title),
    el('p', 'news-summary', lead.summary),
    arrowLink('signal', `article.html?id=${lead.id}`, 'READ NEWS'),
  );

  const ul = el('ul', 'news-list');
  rest.forEach((article) => {
    const li = el('li', 'reveal');
    li.append(
      el('p', 'news-meta', `${article.category} · ${article.date}`),
      el('h3', null, article.title),
      arrowLink('signal', `article.html?id=${article.id}`, 'READ NEWS'),
    );
    ul.append(li);
  });

  host.append(big, ul);
}

export function renderHome() {
  const feature = document.querySelector('#homeFeature');
  if (!feature) return; // 홈이 아니다

  const games = live();
  renderFeature(feature, games[0]);
  renderRail(document.querySelector('#homeRail'), games.slice(0, RAIL));
  renderCards(document.querySelector('#homeCards'), games.slice(0, CARDS));
  renderNews(document.querySelector('#homeNews'), ARTICLES.slice(0, NEWS));
}

import { GAMES, GAME_CATEGORIES, badgeTone } from './game-data.js';
import { setupChrome } from './chrome.js';
import { fillThumb } from './thumb.js';
import { demoButton } from './demo-player.js';

/*
  게임 목록.
  홈의 GAMES 섹션과 같은 카드를 쓰되, 홈에서는 장식이던 검색과 칩이 여기서는 실제로 동작한다.

  카드는 처음에 한 번만 만들고 그다음부터는 숨기고 보이기만 한다.
  글자를 칠 때마다 다시 만들면 카드가 매번 처음부터 나타나서 화면이 들뜬다.
*/

const $ = (sel) => document.querySelector(sel);

const grid = $('#gameGrid');
const empty = $('#gameEmpty');
const count = $('#gameCount');
const chips = $('#gameChips');
const search = $('#gameSearch');
const flag = $('#gameFlag');

/* 주소에 카테고리를 실어 두면 걸러 놓은 목록을 그대로 공유할 수 있다. */
const fromUrl = new URLSearchParams(location.search).get('category');
let active = GAME_CATEGORIES.includes(fromUrl) ? fromUrl : 'ALL';

const mechanic = (game) => game.meta.find(([label]) => label === 'KEY MECHANIC')?.[1] ?? null;

/* ---------- 카드 ---------- */

function buildCard(game) {
  const card = document.createElement('article');
  card.className = 'card reveal';

  const ph = document.createElement('div');
  ph.className = 'ph--16x10';
  fillThumb(ph, game, { note: '16:10 · hover scale 1.03' });

  const body = document.createElement('div');
  body.className = 'card-body';

  // 뱃지가 없는 게임도 자리는 만든다. 빼면 옆 카드와 제목 높이가 어긋난다.
  const badge = document.createElement('span');
  badge.className = game.badge
    ? `badge badge--soft${badgeTone(game.badge)}`
    : 'badge badge--soft badge--empty';
  badge.textContent = game.badge ?? 'NEW';
  body.append(badge);

  const title = document.createElement('h3');
  title.textContent = game.title;

  const premise = document.createElement('p');
  premise.textContent = game.premise;

  const tags = document.createElement('p');
  tags.className = 'tags';
  const key = mechanic(game);
  tags.textContent = key ? `${game.category} · ${key}` : game.category;

  const actions = document.createElement('div');
  actions.className = 'actions actions--compact';

  const view = document.createElement('a');
  view.className = 'signal';
  view.href = `game.html?title=${game.slug}`;
  view.append('VIEW GAME', document.createElement('i'));

  actions.append(demoButton(game), view);
  body.append(title, premise, tags, actions);
  card.append(ph, body);
  return card;
}

/* 검색에 쓸 문자열은 카드마다 한 번만 만들어 둔다. */
const cards = GAMES.map((game) => ({
  game,
  el: buildCard(game),
  haystack: [game.title, game.premise, game.summary, game.category, mechanic(game)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase(),
}));

/* ---------- 거르기 ---------- */

function apply() {
  const query = search.value.trim().toLowerCase();
  let hits = 0;

  cards.forEach(({ game, el, haystack }) => {
    const byCategory = active === 'ALL' || game.category === active;
    const byText = !query || haystack.includes(query);
    el.hidden = !(byCategory && byText);
    if (!el.hidden) hits += 1;
  });

  count.textContent = `${String(hits).padStart(2, '0')} ${hits === 1 ? 'GAME' : 'GAMES'}`;
  empty.hidden = hits > 0;
  // 카드가 줄면 문서 높이도 줄어든다. 진행선을 새 높이로 다시 계산한다.
  chrome.paint();
}

function setCategory(next) {
  active = next;
  Array.from(chips.children).forEach((chip) =>
    chip.setAttribute('aria-pressed', String(chip.dataset.category === next)),
  );

  // 뒤로 가기로 이전 카테고리에 돌아올 수 있게 주소만 갈아 끼운다. 화면은 다시 그리지 않는다.
  const url = new URL(location.href);
  if (next === 'ALL') url.searchParams.delete('category');
  else url.searchParams.set('category', next);
  history.replaceState(null, '', url);

  apply();
}

function renderChips() {
  chips.textContent = '';
  GAME_CATEGORIES.forEach((category) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.category = category;
    chip.textContent = category;
    chip.setAttribute('aria-pressed', String(category === active));
    chip.addEventListener('click', () => setCategory(category));
    chips.append(chip);
  });
}

/*
  발표된 것과 자리표가 섞여 있다는 사실을 화면에 남긴다.
  숫자를 세어 쓰므로, game-data.js 에서 pending 을 지우면 표시도 저절로 줄어든다.
*/
function renderFlag() {
  const waiting = GAMES.filter((game) => game.pending).length;
  flag.textContent = waiting
    ? `${String(GAMES.length - waiting).padStart(2, '0')} ANNOUNCED · ` +
      `${String(waiting).padStart(2, '0')} PLACEHOLDER TITLES — NAMES AND COPY NOT FINAL`
    : 'ALL TITLES CONFIRMED';
}

search.addEventListener('input', apply);

cards.forEach(({ el }) => grid.append(el));

const chrome = setupChrome();
renderChips();
renderFlag();
apply();

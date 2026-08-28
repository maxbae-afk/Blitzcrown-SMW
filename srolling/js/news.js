import { ARTICLES, CATEGORIES, PAGE_SIZE } from './news-data.js';
import { fillImage } from './news-image.js';
import { setupChrome } from './chrome.js';

/*
  뉴스 목록.
  카테고리로 거르고, 한 번에 PAGE_SIZE 줄씩 아래로 이어 붙인다.
*/

const $ = (sel) => document.querySelector(sel);

const rows = $('#newsRows');
const empty = $('#newsEmpty');
const more = $('#newsMore');
const count = $('#newsCount');
const chips = $('#newsChips');

/* 주소에 카테고리를 실어 두면 목록을 그대로 공유할 수 있다. */
const fromUrl = new URLSearchParams(location.search).get('category');
let active = CATEGORIES.includes(fromUrl) ? fromUrl : 'ALL';
let shown = PAGE_SIZE;

/* 목록 맨 위에 세워 두는 기사. 적은 순서 그대로 올라간다. */
const PINNED = ['03', '12'];

/*
  ALL 목록에서만 순서를 바꾼다.
  원본 배열을 바꾸면 홈의 최신 뉴스 네 칸과 EVENTS 카테고리 순서까지 함께 바뀌므로,
  여기서 복사본의 표시 순서만 조정한다.
*/
const visible = () => {
  if (active !== 'ALL') return ARTICLES.filter((article) => article.category === active);

  const pinned = PINNED.map((id) => ARTICLES.find((article) => article.id === id)).filter(Boolean);
  return [...pinned, ...ARTICLES.filter((article) => !pinned.includes(article))];
};

/* ---------- 한 줄 ---------- */

/* 사진이 아직 없는 기사. 무엇이 들어올 자리인지 적어 둔다. */
function buildPlaceholder(id) {
  const ph = document.createElement('span');
  ph.className = 'ph ph--16x9';
  const type = document.createElement('span');
  type.className = 'ph-type';
  type.textContent = `[IMAGE] ARTICLE ${id}`;
  const meta = document.createElement('span');
  meta.className = 'ph-meta';
  meta.textContent = '16:9';
  ph.append(type, meta);
  return ph;
}

/*
  목록에서 쓰는 폭은 데스크톱 260px, 태블릿 200px, 모바일은 화면 전체다.
  sizes 를 적어 두지 않으면 브라우저가 전체 폭으로 가정해 큰 파일만 받는다.
*/
function buildThumb(image) {
  const img = document.createElement('img');
  img.className = 'news-row-thumb';
  fillImage(img, image, '(max-width: 560px) 100vw, (max-width: 1080px) 200px, 260px');
  img.loading = 'lazy';
  return img;
}

function buildRow(article) {
  const li = document.createElement('li');
  li.className = 'reveal';

  const link = document.createElement('a');
  link.className = 'news-row';
  link.href = `article.html?id=${article.id}`;

  const media = article.image ? buildThumb(article.image) : buildPlaceholder(article.id);

  const body = document.createElement('span');
  body.className = 'news-row-body';

  const meta = document.createElement('span');
  meta.className = 'news-meta';
  meta.textContent = `${article.category} · ${article.date || 'DATE'}`;

  const title = document.createElement('span');
  title.className = 'news-row-title';
  title.textContent = article.title;

  const summary = document.createElement('span');
  summary.className = 'news-row-summary';
  summary.textContent = article.summary;

  body.append(meta, title, summary);

  const signal = document.createElement('span');
  signal.className = 'signal';
  signal.append('READ NEWS', document.createElement('i'));

  link.append(media, body, signal);
  li.append(link);
  return li;
}

/* ---------- 목록 ---------- */

function render() {
  const list = visible();
  const page = list.slice(0, shown);

  rows.textContent = '';
  page.forEach((article) => rows.append(buildRow(article)));

  const total = list.length;
  count.textContent = `${String(total).padStart(2, '0')} ${total === 1 ? 'ARTICLE' : 'ARTICLES'}`;

  empty.hidden = total > 0;
  // 남은 줄이 없으면 버튼을 흐리게 두지 않고 아예 치운다. 누를 게 없는 버튼은 길을 막는다.
  more.parentElement.hidden = shown >= total;
  more.textContent = '';
  more.append(`LOAD MORE (${total - page.length})`, document.createElement('i'));

  chrome.observe(rows);
  // 줄 수가 바뀌면 문서 높이도 바뀐다. 진행선을 새 높이로 다시 계산한다.
  chrome.paint();
}

function setCategory(next) {
  active = next;
  shown = PAGE_SIZE;
  Array.from(chips.children).forEach((chip) =>
    chip.setAttribute('aria-pressed', String(chip.dataset.category === next)),
  );

  // 뒤로 가기로 이전 카테고리에 돌아올 수 있게 주소만 갈아 끼운다. 화면은 다시 그리지 않는다.
  const url = new URL(location.href);
  if (next === 'ALL') url.searchParams.delete('category');
  else url.searchParams.set('category', next);
  history.replaceState(null, '', url);

  render();
}

function renderChips() {
  chips.textContent = '';
  CATEGORIES.forEach((category) => {
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

more.addEventListener('click', () => {
  const before = rows.children.length;
  shown += PAGE_SIZE;
  render();
  // 새로 붙은 첫 줄로 초점을 옮긴다. 키보드 사용자가 목록 맨 위로 튕기지 않아야 한다.
  rows.children[before]?.querySelector('a')?.focus({ preventScroll: true });
});

const chrome = setupChrome();
renderChips();
render();

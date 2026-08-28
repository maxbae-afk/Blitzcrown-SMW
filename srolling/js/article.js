import { ARTICLES, findArticle } from './news-data.js';
import { fillImage } from './news-image.js';
import { setupChrome } from './chrome.js';

/*
  기사 본문.
  news-data.js 의 body 배열을 그대로 화면으로 옮긴다. 블록 종류는 다섯 가지뿐이고,
  종류가 늘면 여기 BLOCKS 에 한 줄만 더하면 된다.
*/

const $ = (sel) => document.querySelector(sel);

const id = new URLSearchParams(location.search).get('id');
const article = findArticle(id);

const index = ARTICLES.indexOf(article);

/* ---------- 본문 블록 ---------- */

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const BLOCKS = {
  p: (block) => el('p', null, block.text),

  h: (block) => el('h2', 'article-h', block.text),

  quote: (block) => {
    const figure = el('figure', 'article-quote');
    figure.append(el('blockquote', null, block.text));
    if (block.by) figure.append(el('figcaption', null, block.by));
    return figure;
  },

  list: (block) => {
    const list = el('ul', 'article-list');
    block.items.forEach((item) => list.append(el('li', null, item)));
    return list;
  },

  /* 실제 사진이 있으면 그리고, 아직 없으면 필요한 사진의 자리표를 남긴다. */
  media: (block) => {
    const figure = el('figure', 'article-figure');
    if (block.image?.base) {
      const img = el('img', 'article-figure-img');
      fillImage(img, block.image, '(max-width: 1080px) calc(100vw - 32px), 720px');
      figure.append(img);

      if (block.label || block.note) {
        const caption = el('figcaption', 'article-figure-caption');
        if (block.label) caption.append(el('span', null, block.label));
        if (block.note) caption.append(el('small', null, block.note));
        figure.append(caption);
      }
    } else {
      const ph = el('div', 'ph ph--16x9');
      ph.append(el('span', 'ph-type', `[IMAGE] ${block.label}`));
      ph.append(el('span', 'ph-meta', block.note || '16:9'));
      figure.append(ph);
    }
    return figure;
  },
};

function renderBody() {
  const body = $('#articleBody');

  /*
    본문이 더미인 기사는 첫 줄에서 그렇다고 말한다.
    글의 모양이 실제 기사와 같아서, 표시가 없으면 검토하는 사람이 승인된 문안으로 읽는다.
  */
  if (article.dummy) {
    const mark = el('p', 'article-flag reveal');
    mark.append(el('span', 'flag', 'PLACEHOLDER BODY — NOT APPROVED COPY'));
    body.append(mark);
  }

  article.body.forEach((block) => {
    const build = BLOCKS[block.type];
    if (!build) return;
    const node = build(block);
    node.classList.add('reveal');
    body.append(node);
  });
}

/* ---------- 머리와 옆줄 ---------- */

function renderHead() {
  document.title = `${article.title} — BLITZCROWN`;
  document
    .querySelector('meta[name="description"]')
    .setAttribute('content', article.summary);

  $('#articleLabel').textContent = `01 / ${article.category}`;
  $('#articleMeta').textContent = `${article.category} · ${article.date} · ${article.readTime}`;
  $('#articleTitle').textContent = article.title;
  $('#articleLead').textContent = article.lead;

  // 목록으로 돌아갈 때 보던 카테고리를 그대로 유지한다.
  $('#articleBack').href =
    article.category === 'ALL'
      ? 'news.html'
      : `news.html?category=${encodeURIComponent(article.category)}`;

  const hero = $('#articleHero');
  if (article.image) {
    const img = el('img', 'article-hero-img');
    fillImage(img, article.image, '(max-width: 1080px) 100vw, 1360px');
    hero.append(img);
  } else {
    const ph = el('div', 'ph ph--wide');
    ph.append(el('span', 'ph-type', `[IMAGE] ${article.title}`));
    ph.append(el('span', 'ph-meta', '21:9 · article key visual'));
    hero.append(ph);
  }

  const facts = $('#articleFacts');
  [
    ['CATEGORY', article.category],
    ['PUBLISHED', article.date],
    ['LENGTH', article.readTime],
  ].forEach(([term, value]) => {
    const row = document.createElement('div');
    row.append(el('dt', null, term), el('dd', null, value));
    facts.append(row);
  });
}

function setupCopy() {
  const button = $('#articleCopy');
  const label = button.firstChild;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      label.textContent = 'LINK COPIED';
    } catch {
      // 보안 컨텍스트가 아니면 클립보드를 쓸 수 없다. 실패를 조용히 넘기지 않는다.
      label.textContent = 'COPY FAILED';
    }
    setTimeout(() => (label.textContent = 'COPY LINK'), 1600);
  });
}

/* ---------- 앞뒤 기사 ---------- */

function renderNav() {
  const nav = $('#articleNav');
  // 배열이 최신순이라 앞이 더 최신이다. 왼쪽에 최신, 오른쪽에 이전을 둔다.
  [
    { item: ARTICLES[index - 1], role: 'NEWER' },
    { item: ARTICLES[index + 1], role: 'OLDER' },
  ].forEach(({ item, role }) => {
    if (!item) {
      // 자리를 비워 두면 남은 하나가 가운데로 밀린다. 빈 칸을 그대로 둔다.
      nav.append(el('span', 'article-nav-empty'));
      return;
    }
    const link = el('a', `article-nav-item article-nav-item--${role.toLowerCase()}`);
    link.href = `article.html?id=${item.id}`;

    // 화살표는 글이 놓인 방향을 가리킨다. 최신은 왼쪽, 이전은 오른쪽이다.
    const label = el('span', 'article-nav-role');
    const arrow = el('i');
    label.append(...(role === 'NEWER' ? [arrow, role] : [role, arrow]));

    link.append(label);
    link.append(el('span', 'article-nav-title', item.title));
    nav.append(link);
  });
}

/*
  없는 기사 번호로 들어오면 빈 화면 대신 목록으로 돌려보낸다.
  location.replace 는 그 자리에서 실행을 멈추지 않으므로, 그리는 일을 감싸 두어야 한다.
  감싸지 않으면 이동이 시작되기 전에 undefined 를 읽고 오류가 난다.
*/
if (!article) {
  location.replace('news.html');
} else {
  renderHead();
  renderBody();
  renderNav();
  setupCopy();
  setupChrome();
}

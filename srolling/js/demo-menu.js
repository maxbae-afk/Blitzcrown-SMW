import { GAMES } from './game-data.js';
import { fillThumb } from './thumb.js';
import { demoButton } from './demo-player.js';

/*
  상단 PLAY DEMO 에 걸리는 게임 목록.

  패널을 헤더 안에 넣지 않고 헤더 바로 뒤에 붙인다.
  .topbar 는 mix-blend-mode: difference 라서 그 안에 두면 배경과 뒤섞여
  글자가 반전돼 보인다. 헤더 밖으로 빼되 DOM 순서는 헤더 다음이라
  Tab 키 순서는 그대로 자연스럽다.

  자리표(pending) 게임은 넣지 않는다. 이름조차 확정되지 않은 것을
  데모 목록에 올려 두면 눌러 볼 수 있는 것처럼 보인다.
*/

const LEAVE_DELAY = 200; // 버튼에서 패널로 마우스를 옮길 짬
const SHOWN = 3; // 나머지는 아래 ALL GAMES 로 넘긴다

/*
  눌러 볼 수 있는 것을 앞에 세운다.
  세 자리뿐이라 순서를 그대로 두면 데모가 하나도 없는 화면이 나올 수 있다.
  sort 는 안정적이라 데모 유무가 같으면 원래 순서를 지킨다.
*/
const picked = () =>
  GAMES.filter((game) => !game.pending)
    .sort((a, b) => Number(Boolean(b.demo || b.embed)) - Number(Boolean(a.demo || a.embed)))
    .slice(0, SHOWN);

const mechanic = (game) => game.meta.find(([label]) => label === 'KEY MECHANIC')?.[1] ?? null;

const pad = (n) => String(n).padStart(2, '0');

function buildItem(game, index) {
  const item = document.createElement('article');
  item.className = 'demo-item';

  const ph = document.createElement('a');
  ph.className = 'ph--16x10 demo-thumb';
  ph.href = `game.html?title=${game.slug}`;
  ph.setAttribute('aria-label', game.title);
  // 자리표 안에는 짧게만 적는다. 제목은 바로 아래 줄에 다시 나온다.
  fillThumb(ph, game, { label: '[IMAGE]', note: '16:10' });

  const num = document.createElement('span');
  num.className = 'demo-index';
  num.textContent = pad(index + 1);
  ph.prepend(num);

  const name = document.createElement('a');
  name.className = 'demo-name';
  name.href = `game.html?title=${game.slug}`;
  name.textContent = game.title;

  const tag = document.createElement('p');
  tag.className = 'demo-tag';
  const key = mechanic(game);
  tag.textContent = key ? `${game.category} · ${key}` : game.category;

  item.append(ph, name, tag, demoButton(game));
  return item;
}

function buildPanel(list) {
  const panel = document.createElement('div');
  panel.className = 'demo-menu';
  panel.id = 'demoMenu';
  panel.inert = true;

  // 본문 섹션 머리와 같은 짜임(라벨 · 가는 선 · 민트 대시)을 쓴다.
  const head = document.createElement('header');
  head.className = 'demo-menu-head';
  const label = document.createElement('span');
  label.className = 'sec-label';
  label.textContent = 'PLAY DEMO';
  const line = document.createElement('span');
  line.className = 'sec-line';
  const dash = document.createElement('span');
  dash.className = 'sec-dash';
  head.append(label, line, dash);

  const grid = document.createElement('div');
  grid.className = 'demo-menu-grid';
  list.forEach((game, i) => grid.append(buildItem(game, i)));

  const foot = document.createElement('div');
  foot.className = 'demo-menu-foot';
  const all = document.createElement('a');
  all.className = 'signal';
  all.href = 'games.html';
  all.append('ALL GAMES', document.createElement('i'));
  foot.append(all);

  panel.append(head, grid, foot);
  return panel;
}

export function setupDemoMenu() {
  const trigger = document.querySelector('.top-cta');
  const topbar = document.querySelector('.topbar');
  const list = picked();
  if (!trigger || !topbar || !list.length) return;

  const panel = buildPanel(list);
  topbar.insertAdjacentElement('afterend', panel);

  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', 'false');

  const hoverable = matchMedia('(hover: hover) and (pointer: fine)');
  let open = false;
  let timer = 0;

  /*
    버튼 위치를 재서 맞춘다. 헤더 안쪽 여백이 화면 폭에 따라 변하고
    로고 크기도 바뀌기 때문에 CSS 로 고정해 두면 어느 폭에선가 어긋난다.
    fixed 요소의 기준은 스크롤바를 뺀 폭이라 innerWidth 가 아니라 clientWidth 를 쓴다.
  */
  function place() {
    const rect = trigger.getBoundingClientRect();
    panel.style.top = `${Math.round(rect.bottom + 10)}px`;
    panel.style.right = `${Math.round(document.documentElement.clientWidth - rect.right)}px`;
  }

  function show() {
    clearTimeout(timer);
    if (open) return;
    open = true;
    place();
    panel.inert = false;
    panel.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function hide() {
    clearTimeout(timer);
    if (!open) return;
    open = false;
    panel.inert = true;
    panel.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  const hideSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(hide, LEAVE_DELAY);
  };

  if (hoverable.matches) {
    [trigger, panel].forEach((el) => {
      el.addEventListener('pointerenter', show);
      el.addEventListener('pointerleave', hideSoon);
    });
  }

  /*
    링크라서 그냥 두면 눌리는 순간 페이지를 옮긴다.
    자바스크립트가 없을 때를 위해 href 는 남겨 두고, 여기서는 열고 닫기만 한다.
    Enter 키도 anchor 에서는 click 으로 들어오므로 이 하나로 키보드까지 덮인다.

    마우스가 있는 화면에서는 누르는 동작이 곧 호버라 이미 열려 있다.
    거기서 토글을 하면 누르는 순간 닫혀서, 열려고 누른 사람에게는 고장으로 보인다.
    그래서 마우스 쪽은 여는 쪽으로만 두고(닫기는 벗어나기·Esc·바깥 누르기),
    호버가 없는 화면에서만 누를 때마다 열고 닫는다.
  */
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    if (open && !hoverable.matches) hide();
    else show();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !open) return;
    hide();
    trigger.focus();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!open || panel.contains(event.target) || trigger.contains(event.target)) return;
    hide();
  });

  // 헤더는 고정이라 스크롤해도 따라오지만, 폭이 바뀌면 버튼 위치가 달라진다.
  addEventListener('resize', () => {
    if (open) place();
  });
}

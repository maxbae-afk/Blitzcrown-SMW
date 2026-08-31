import { MOCKUP } from './mockup.geometry.js';
import { qrMatrix, qrPath } from './qr.js';

/*
  데모를 페이지 안에서 띄운다.

  게임은 창을 얼마나 넓게 잡아 주느냐로 가로형·세로형을 스스로 고른다.
  기기 종류나 브라우저 이름을 보지 않는다. 그래서 PC 에서도 폰 크기만큼만
  자리를 주면 폰에서 여는 것과 같은 화면이 나온다.

  목업 안에서는 그 점을 이용한다. 틀을 402x874 로 고정해 두고 화면이 좁으면
  전체를 축소한다. 틀 자체를 줄이면 게임이 더 작은 폰으로 알고 다시 배치하므로
  실제 폰 화면과 달라진다.

  폰으로 들어온 사람에게는 목업을 보여 주지 않는다. 이미 폰이다.
*/

const SCREEN = { w: 402, h: 874 }; // 목업 안 화면의 논리 크기
const NARROW = matchMedia('(max-width: 900px)');

const device = {
  width: Math.round(SCREEN.w / (MOCKUP.screen.width / 100)),
  height: Math.round(SCREEN.h / (MOCKUP.screen.height / 100)),
};

const QUIET = 4; // QR 둘레의 여백. 규격이 요구하는 만큼 두지 않으면 잘 읽히지 않는다.

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/*
  QR 그림 한 장.
  칸을 그대로 그리므로 어떤 크기로 늘려도 흐려지지 않는다. 폰 카메라에는 이쪽이 낫다.
*/
function qrSvg(text) {
  const matrix = qrMatrix(text);
  if (!matrix) return null;

  const ns = 'http://www.w3.org/2000/svg';
  const span = matrix.size + QUIET * 2;
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${span} ${span}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', text);

  const back = document.createElementNS(ns, 'rect');
  back.setAttribute('width', String(span));
  back.setAttribute('height', String(span));
  back.setAttribute('fill', '#fff');

  const cells = document.createElementNS(ns, 'path');
  cells.setAttribute('transform', `translate(${QUIET} ${QUIET})`);
  cells.setAttribute('fill', '#000');
  cells.setAttribute('d', qrPath(matrix));

  svg.append(back, cells);
  return svg;
}

let ui = null;
let lastFocus = null;
let mode = 'pc';
let current = null;

function build() {
  const root = el('div', 'demoplay');
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'GAME DEMO');

  const bar = el('div', 'demoplay-bar');

  // 화면 전환은 왼쪽 위에 둔다. 오른쪽은 닫기 자리다.
  const modes = el('div', 'demoplay-modes');
  modes.setAttribute('role', 'group');
  modes.setAttribute('aria-label', 'VIEW');
  const buttons = ['pc', 'mobile'].map((name) => {
    const button = el('button', 'demoplay-mode', name.toUpperCase());
    button.type = 'button';
    button.dataset.mode = name;
    button.addEventListener('click', () => setMode(name));
    modes.append(button);
    return button;
  });

  const title = el('p', 'demoplay-title');

  const tools = el('div', 'demoplay-tools');

  /*
    QR. 세일즈 자리에서 상대 폰으로 바로 넘겨 주려고 둔 것이다.
    마우스를 올리면 뜨고, 누르면 고정된다. 화면을 가리키며 이야기할 때
    마우스를 계속 붙들고 있을 수 없어서 고정을 함께 둔다.
  */
  const qr = el('div', 'demoplay-qr');
  const qrButton = el('button', 'demoplay-tool demoplay-tool--icon');
  qrButton.type = 'button';
  qrButton.setAttribute('aria-label', 'SHOW QR CODE');
  qrButton.setAttribute('aria-expanded', 'false');
  const qrIcon = el('img');
  qrIcon.src = 'assets/qr.svg';
  qrIcon.alt = '';
  qrButton.append(qrIcon);

  const qrToast = el('div', 'demoplay-toast');
  const qrCode = el('div', 'demoplay-toast-code');
  const qrLink = el('p', 'demoplay-toast-link');
  qrToast.append(el('p', 'demoplay-toast-label', 'SCAN TO PLAY ON MOBILE'), qrCode, qrLink);
  qr.append(qrButton, qrToast);

  /*
    마우스를 올렸을 때 뜨는 것과 키보드 초점으로 뜨는 것은 CSS(:hover, :focus-within)가 맡는다.
    자바스크립트로 잡으려 했더니 바로 아래가 게임 iframe 이라, 마우스가 그 위로 넘어갈 때
    떠나는 사건이 오지 않아 토스트가 남는 일이 있었다. 브라우저가 직접 판정하게 두는 편이 확실하다.
    여기서는 눌러서 고정하는 것만 다룬다.
  */
  let pinned = false;
  const pin = (on) => {
    pinned = on;
    qr.classList.toggle('is-pinned', on);
    qrButton.setAttribute('aria-expanded', String(on));
  };
  qrButton.addEventListener('click', () => pin(!pinned));

  const tab = el('a', 'demoplay-tool', 'NEW TAB');
  tab.target = '_blank';
  tab.rel = 'noreferrer';
  const close = el('button', 'demoplay-tool', 'CLOSE');
  close.type = 'button';
  close.addEventListener('click', closeDemo);
  tools.append(qr, tab, close);

  bar.append(modes, title, tools);

  const stage = el('div', 'demoplay-stage');
  const box = el('div', 'demoplay-device');

  const frame = el('iframe', 'demoplay-frame');
  frame.title = 'GAME DEMO';
  frame.allow = 'autoplay; fullscreen; clipboard-write';

  /*
    목업 좌표는 요소에 직접 쓰지 않고 변수로 넘긴다.
    직접 쓰면 PC 화면에서 목업을 걷을 때 규칙이 이를 이기지 못한다.
  */
  root.style.setProperty('--device-w', `${device.width}px`);
  root.style.setProperty('--device-h', `${device.height}px`);
  root.style.setProperty('--screen-x', `${MOCKUP.screen.left}%`);
  root.style.setProperty('--screen-y', `${MOCKUP.screen.top}%`);
  root.style.setProperty('--screen-w', `${MOCKUP.screen.width}%`);
  root.style.setProperty('--screen-h', `${MOCKUP.screen.height}%`);

  // 목업은 게임 위를 덮는다. 화면 자리가 뚫려 있어 모서리 곡선과 노치가 게임 위에 얹힌다.
  const shell = el('img', 'demoplay-shell');
  shell.src = 'assets/mockup/phone.png';
  shell.alt = '';
  shell.setAttribute('aria-hidden', 'true');

  box.append(frame, shell);
  stage.append(box);
  // QR 이 열려 있는 동안만 게임을 덮는 투명한 판. 아래 styles.css 에 까닭을 적어 두었다.
  root.append(bar, stage, el('div', 'demoplay-guard'));
  document.body.append(root);

  root.addEventListener('pointerdown', (event) => {
    if (event.target === stage) closeDemo();
  });

  return {
    root,
    bar,
    modes,
    buttons,
    title,
    tab,
    close,
    stage,
    box,
    frame,
    qr,
    qrCode,
    qrLink,
    resetQr: () => pin(false),
  };
}

/* 목업이 화면을 넘으면 통째로 줄인다. 키우지는 않는다. 캔버스가 흐려진다. */
function fit() {
  if (!ui || mode !== 'mobile') return;
  const room = ui.stage.getBoundingClientRect();
  const scale = Math.min(1, room.width / device.width, room.height / device.height);
  ui.box.style.transform = `scale(${scale.toFixed(4)})`;
}

/*
  틀 크기가 바뀌면 게임이 그 자리에서 다시 배치되는데, 중간 상태가 남을 때가 있다.
  판이 이어지는 것보다 매번 같은 화면으로 시작하는 편이 낫다.
*/
function reload() {
  if (!ui || !current) return;
  ui.frame.src = current.embed;
}

function setMode(next, refresh = true) {
  if (!ui || mode === next) return;
  mode = next;
  ui.root.dataset.mode = next;
  ui.buttons.forEach((button) => {
    const on = button.dataset.mode === next;
    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', String(on));
  });
  if (next === 'pc') ui.box.style.transform = '';
  else fit();
  if (refresh) reload();
}

export function openDemo(game) {
  if (!game?.embed) return;
  ui = ui || build();
  current = game;
  lastFocus = document.activeElement;

  ui.title.textContent = `${game.title} · DEMO`;
  ui.tab.href = game.embed;

  /*
    QR 은 볼 때마다 다시 그린다. 게임마다 주소가 다르고 관리자에서 바뀌기도 한다.
    담기지 않는 주소면 아예 단추를 감춘다. 눌러도 빈 칸이 뜨는 편이 더 나쁘다.
  */
  ui.resetQr();
  const code = qrSvg(game.embed);
  ui.qr.hidden = !code || NARROW.matches;
  if (code) {
    ui.qrCode.replaceChildren(code);
    ui.qrLink.textContent = game.embed.replace(/^https?:\/\//, '');
  }

  // 폰으로 들어온 사람에게는 목업도 전환 버튼도 필요 없다. 이미 폰이다.
  ui.modes.hidden = NARROW.matches;

  // 언제나 PC 화면으로 연다. 아래 setMode 가 실제로 돌도록 값을 비워 둔다.
  mode = null;
  setMode('pc', false);
  ui.frame.src = game.embed;

  ui.root.hidden = false;
  document.body.classList.add('is-locked');
  requestAnimationFrame(() => {
    ui.root.classList.add('is-open');
    ui.close.focus();
    fit();
  });
}

export function closeDemo() {
  if (!ui || ui.root.hidden) return;
  ui.root.classList.remove('is-open');
  ui.resetQr();
  document.body.classList.remove('is-locked');
  setTimeout(() => {
    ui.root.hidden = true;
    ui.frame.removeAttribute('src'); // 닫은 뒤에도 소리가 나지 않도록 비운다
    current = null;
    lastFocus?.focus();
  }, 200);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDemo();
});

addEventListener('resize', fit);

/** 눌렀을 때 데모를 여는 요소로 만든다. 주소는 남겨 둔다. 새 탭으로 여는 길도 막지 않는다. */
export function attachDemo(node, game) {
  if (!node || !game?.embed) return;
  node.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
    event.preventDefault();
    openDemo(game);
  });
}

/*
  데모 버튼 하나.
  홈·목록·상세·헤더 패널이 모두 같은 버튼을 쓴다. 네 군데에 같은 코드를 두었더니
  한 곳만 고쳐져 홈에만 없는 버튼이 생기는 일이 있었다.

  주소가 없으면 눌리는 버튼을 두지 않는다. 눌렀는데 아무 일도 없는 편이 더 나쁘다.
*/
export function demoButton(game) {
  if (!game.demo && !game.embed) {
    const off = el('span', 'btn is-disabled', 'DEMO UNAVAILABLE');
    off.setAttribute('aria-disabled', 'true');
    return off;
  }

  const link = el('a', 'btn btn--primary');
  link.href = game.embed ?? game.demo;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.append('PLAY DEMO', el('i'));
  // 페이지 안에서 열 수 있는 게임이면 새 탭 대신 목업이 있는 화면으로 연다.
  attachDemo(link, game);
  return link;
}

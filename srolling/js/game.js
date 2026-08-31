import { PLATFORM, findGame, badgeTone } from './game-data.js';
import { setupChrome } from './chrome.js';
import { attachDemo, demoButton } from './demo-player.js';

/*
  게임 상세 페이지.
  주소의 title 로 게임 하나를 골라 화면을 채운다.
*/

const $ = (sel) => document.querySelector(sel);
const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const slug = new URLSearchParams(location.search).get('title');
const game = findGame(slug);

/* ---------- 자리표와 실제 에셋을 같은 틀로 만든다 ---------- */

/**
 * src 가 있으면 이미지나 영상을, 없으면 홈과 같은 .ph 자리표를 만든다.
 * 어느 쪽이든 .gd-frame 이라 무대 안에서 같은 크기로 놓인다.
 */
function buildFrame(item) {
  if (item.src && item.type === 'video') {
    const video = document.createElement('video');
    video.className = 'gd-frame';
    video.src = item.src;
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    if (item.poster) video.poster = item.poster;
    return video;
  }

  if (item.src) {
    const img = document.createElement('img');
    img.className = 'gd-frame';
    img.src = item.src;
    img.alt = item.label;
    return img;
  }

  const ph = document.createElement('span');
  ph.className = 'ph gd-frame';
  const type = document.createElement('span');
  type.className = 'ph-type';
  type.textContent = `[${item.type === 'video' ? 'VIDEO' : 'IMAGE'}] ${item.label}`;
  const meta = document.createElement('span');
  meta.className = 'ph-meta';
  meta.textContent = item.note || '16:9';
  ph.append(type, meta);
  return ph;
}

/* 아직 확정되지 않은 값은 지어내지 않고 눈에 띄게 비워 둔다. */
function fillMeta(list, rows) {
  list.textContent = '';
  rows.forEach(([term, value]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    if (value) dd.textContent = value;
    else {
      const pending = document.createElement('span');
      pending.className = 'pending';
      pending.textContent = 'CONTENT REQUIRED';
      dd.append(pending);
    }
    row.append(dt, dd);
    list.append(row);
  });
}

/* ---------- 왼쪽 위 미디어 ---------- */

const stage = $('#gameStage');
const stageNote = $('#gameStageNote');
const thumbs = $('#gameThumbs');
const expand = $('#gameExpand');

let current = 0;

function renderStage(index) {
  current = clamp(index, 0, game.media.length - 1);
  const item = game.media[current];

  stage.querySelector('.gd-frame')?.remove();
  stage.prepend(buildFrame(item));
  stageNote.textContent = item.label;

  Array.from(thumbs.children).forEach((thumb, i) => {
    const on = i === current;
    thumb.classList.toggle('is-current', on);
    thumb.setAttribute('aria-selected', String(on));
    thumb.tabIndex = on ? 0 : -1;
  });
}

function renderThumbs() {
  thumbs.textContent = '';
  game.media.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gd-thumb';
    button.setAttribute('role', 'tab');

    // 썸네일에는 '게임명 · 장면' 중 장면만 남긴다. 같은 줄이 네 번 반복되면 구분이 안 된다.
    const scene = item.label.split(' · ').pop();

    const frame = buildFrame({ ...item, label: scene });
    frame.classList.add('gd-thumb-frame');
    if (frame.tagName === 'VIDEO') {
      frame.removeAttribute('autoplay');
      frame.autoplay = false;
    }

    const name = document.createElement('span');
    name.className = 'gd-thumb-name';
    name.textContent = scene;

    button.append(frame, name);
    button.addEventListener('click', () => renderStage(index));
    thumbs.append(button);
  });
}

/* ---------- 전체 보기 ---------- */

const lightbox = $('#lightbox');
const lightboxStage = $('#lightboxStage');
const lightboxLabel = $('#lightboxLabel');
const lightboxCount = $('#lightboxCount');

let lastFocus = null;

function renderLightbox(index) {
  current = (index + game.media.length) % game.media.length;
  const item = game.media[current];
  lightboxStage.textContent = '';
  lightboxStage.append(buildFrame(item));
  lightboxLabel.textContent = item.label;
  lightboxCount.textContent = `${String(current + 1).padStart(2, '0')} / ${String(game.media.length).padStart(2, '0')}`;
}

function openLightbox() {
  lastFocus = document.activeElement;
  lightbox.hidden = false;
  document.body.classList.add('is-locked');
  renderLightbox(current);
  requestAnimationFrame(() => {
    lightbox.classList.add('is-open');
    $('#lightboxClose').focus();
  });
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  if (document.fullscreenElement) document.exitFullscreen?.();
  const done = () => {
    lightbox.hidden = true;
    lightboxStage.textContent = '';
    renderStage(current);
    lastFocus?.focus();
  };
  if (reducedMotion) done();
  else setTimeout(done, 200);
}

function setupLightbox() {
  expand.addEventListener('click', openLightbox);
  $('#lightboxClose').addEventListener('click', closeLightbox);

  $('#lightboxFull').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else lightbox.requestFullscreen?.();
  });

  lightbox.querySelectorAll('.lightbox-nav').forEach((button) => {
    button.addEventListener('click', () => renderLightbox(current + Number(button.dataset.direction)));
  });

  // 사진 바깥의 빈 곳을 누르면 닫힌다. 사진 위를 누른 것과 구분해야 한다.
  $('.lightbox-body').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') renderLightbox(current - 1);
    if (e.key === 'ArrowRight') renderLightbox(current + 1);
  });
}

/* ---------- 오른쪽 정보 ---------- */

function renderInfo() {
  document.title = `${game.title} — BLITZCROWN`;
  $('#gameLabel').textContent = `01 / ${game.title}`;
  const badge = $('#gameBadge');
  badge.className = `badge${badgeTone(game.badge)}`;
  badge.textContent = game.badge;
  $('#gameTitle').textContent = game.title;
  $('#gamePremise').textContent = game.premise;
  $('#gameSummary').textContent = game.summary;

  const actions = $('#gameActions');
  actions.textContent = '';

  const demo = demoButton(game);
  actions.append(demo);

  // 상단 CTA 도 지금 보고 있는 게임의 데모를 가리키게 맞춘다.
  if (demo.href) {
    const top = $('#topDemo');
    top.href = demo.href;
    top.target = '_blank';
    top.rel = 'noreferrer';
    attachDemo(top, game);
  }

  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'btn';
  view.append('VIEW SCREENS', document.createElement('i'));
  view.addEventListener('click', openLightbox);
  actions.append(view);

  fillMeta($('#gameMeta'), game.meta);
  fillMeta($('#gameSpecs'), game.specs);
  fillMeta($('#gamePlatform'), PLATFORM);
}

renderInfo();
renderThumbs();
renderStage(0);
setupLightbox();
setupChrome();

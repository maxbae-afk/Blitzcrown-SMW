import { resolveRenderer, createEngine } from './scroll-sequence.js';
import { createDust } from './dust.js';
import { createReel } from './reel.js';

const $ = (sel) => document.querySelector(sel);

const boot = $('#boot');
const bootBar = $('#bootBar');
const bootPct = $('#bootPct');
const bootLabel = $('#bootLabel');

const dustCanvas = $('#dustCanvas');
const sticky = $('.scene-sticky');
const cue = $('#cue');

/**
 * 페이지에 붙는 순서대로. 앞 시퀀스가 끝나는 지점에서 다음이 0부터 시작한다.
 *
 * head 는 재생을 시작하기 전에 받아 둘 비율이다. 첫 시퀀스는 부팅을 붙잡으므로 작게,
 * 뒤쪽은 어차피 배경에서 받으므로 크게 잡는다.
 */
const SEQUENCES = [
  { id: 'main', canvas: '#sceneCanvas', range: '#scene', name: '01 / DESCENT', head: 0.25 },
  { id: 'bridge', canvas: '#sceneCanvas2', range: '#scene2', name: '02 / CROSSING', head: 0.5 },
  { id: 'ascent', canvas: '#sceneCanvas3', range: '#scene3', name: '03 / ASCENT', head: 0.12 },
];

/**
 * 시퀀스 구간의 시작선이 화면 위로 이만큼 지나가는 동안 앞뒤 캔버스를 교차시킨다.
 *
 * 짧아야 한다. 시퀀스끼리는 이어지는 컷이지 겹치는 컷이 아니라서, 교차하는 동안
 * 앞 시퀀스는 이미 마지막 프레임에 도달해 멈춰 있다. 교차를 길게 잡으면 그만큼
 * 멈춘 그림이 화면을 덮고 있어서 스크롤이 걸리는 느낌이 든다.
 *
 * 길이가 필요 없다는 근거는 boundary.mjs 에 있다. 경계를 넘는 그림 차이가 같은 클립 안
 * 이웃 프레임 사이의 차이보다 작다(0.36x · 1.19x). 넘어가는 순간이 평범한 프레임 진행과
 * 구별되지 않으므로 가려 줄 것이 없다.
 *
 * 클립 톤이 안 맞아 경계가 튄다면 이 값을 늘릴 게 아니라 pacing.mjs 의 match 로 잡는다.
 */
const SEAM_PX = 24;

/**
 * 카피는 시퀀스를 모두 이어 붙인 하나의 타임라인으로 돌아간다.
 * 앞이 1에 닿는 지점에서 다음이 0부터 시작하므로, 진행도를 더하면 0~3으로 이어진다.
 * 덕분에 한 카피가 이음매를 걸쳐 계속 떠 있을 수 있다.
 */
const progress = SEQUENCES.map(() => 0);
const states = SEQUENCES.map(() => null);
const engines = SEQUENCES.map(() => null);
// 엔진이 붙었는지. states 는 첫 틱에서야 차므로 붙자마자 여기에 표시한다.
const mounted = SEQUENCES.map(() => false);
// 교차 정도. 0번은 항상 깔려 있으므로 1로 둔다.
const seam = SEQUENCES.map((_, i) => (i === 0 ? 1 : 0));

let renderChapters = () => {};

function renderCopy() {
  renderChapters(progress.reduce((a, b) => a + b, 0));
}

/*
  진단 도구(.tools/*.mjs)가 시퀀스별 상태를 읽는 통로.
  계기판은 한 벌뿐이라 화면에서는 지금 보이는 시퀀스의 숫자만 읽힌다.
  페이지 동작은 여기에 아무것도 의존하지 않는다.
*/
window.__sequence = {
  list: SEQUENCES,
  progress,
  states,
  seam,
  mounted,
  settled: false,
  // 좁은 화면에서는 시퀀스를 아예 돌리지 않는다. 도구가 헛되이 기다리지 않도록 알려 준다.
  mode: 'sequence',
};

/** 지금 화면을 차지하고 있는 시퀀스. 교차가 절반을 넘긴 것 중 가장 뒤엣것이다. */
function activeIndex() {
  let active = 0;
  for (let i = 1; i < SEQUENCES.length; i += 1) {
    if (seam[i] >= 0.5) active = i;
  }
  return active;
}

const topline = $('#topline');
const footMode = $('#footMode');

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const pad3 = (n) => String(Math.round(n)).padStart(3, '0');

/* ---------- 챕터 타이밍 ---------- */

// 모바일에서는 모든 챕터를 왼쪽 정렬하므로 진입 방향도 통일한다.
const compact = window.matchMedia('(max-width: 900px)');

/**
 * 챕터 묶음을 진행도에 맞춰 여닫는 함수를 만든다.
 *
 * @param {Element} container
 * @param {number} max 타임라인의 끝값. 시퀀스를 이어 붙인 개수와 같다.
 */
function createChapters(container, max = 1) {
  const timeline = Array.from(container.querySelectorAll('.chapter')).map((el) => ({
    el,
    start: Number(el.dataset.start ?? 0),
    end: Number(el.dataset.end ?? max),
    align: el.dataset.align ?? 'center',
    // 첫 챕터는 진입 시, 마지막 챕터는 종료 시 이미 자리를 잡고 있어야 한다.
    holdIn: Number(el.dataset.start ?? 0) <= 0,
    holdOut: Number(el.dataset.end ?? max) >= max,
  }));

  return function renderChapters(progress) {
    for (const item of timeline) {
      const span = Math.max(item.end - item.start, 0.001);
      const local = (progress - item.start) / span;

      let amount = 0;
      if (local >= -0.25 && local <= 1.25) {
        const fadeIn = item.holdIn ? 1 : clamp(local / 0.22, 0, 1);
        const fadeOut = item.holdOut ? 1 : clamp((1 - local) / 0.22, 0, 1);
        const inRange = local >= -0.05 && local <= 1.05;
        amount = inRange ? easeInOut(clamp(Math.min(fadeIn, fadeOut), 0, 1)) : 0;
      }

      const dir = item.align === 'right' && !compact.matches ? -1 : 1;
      const slide = (1 - amount) * 46 * dir;
      const rise = (1 - amount) * 26;

      item.el.style.setProperty('--amount', amount.toFixed(4));
      item.el.style.setProperty('--slide', `${slide.toFixed(2)}px`);
      item.el.style.setProperty('--rise', `${rise.toFixed(2)}px`);
      item.el.style.visibility = amount < 0.01 ? 'hidden' : 'visible';
    }
  };
}

/* ---------- 히어로 포인터 원근감 · 먼지 ---------- */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const dust = reducedMotion ? null : createDust(dustCanvas);

// 이 진행도를 넘으면 원근감과 먼지가 완전히 걷힌다. 대략 화면 높이의 3분의 1쯤 스크롤한 지점.
const IDLE_FADE_END = 0.05;

const pointer = { tx: 0, ty: 0, x: 0, y: 0 };

if (finePointer && !reducedMotion) {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.tx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
      pointer.ty = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
    },
    { passive: true },
  );
  // 창 밖으로 나가면 천천히 중앙으로 복귀시킨다.
  document.addEventListener('pointerleave', () => {
    pointer.tx = 0;
    pointer.ty = 0;
  });
}

function renderHero(progress) {
  if (reducedMotion) return;

  const idle = easeInOut(clamp(1 - progress / IDLE_FADE_END, 0, 1));

  // 낮은 감쇠값으로 마우스의 미세한 좌표 변화를 한 번 더 걸러 이미지 떨림을 막는다.
  pointer.x += (pointer.tx - pointer.x) * 0.04;
  pointer.y += (pointer.ty - pointer.y) * 0.04;

  const px = pointer.x * idle;
  const py = pointer.y * idle;

  // 배경은 커서 반대로, 카피는 커서 방향으로 조금만. 둘의 어긋남이 거리감을 만든다.
  sticky.style.setProperty('--scene-scale', (1 + 0.06 * idle).toFixed(4));
  sticky.style.setProperty('--scene-px', `${(-px * 26).toFixed(2)}px`);
  sticky.style.setProperty('--scene-py', `${(-py * 18).toFixed(2)}px`);
  // 마우스 쪽으로 화면 평면이 아주 조금 기울어진다. 각도를 작게 제한해 어지러움과
  // 이미지 재보간에 따른 화질 저하를 최소화한다.
  sticky.style.setProperty('--tilt-x', `${(-py * 0.75).toFixed(4)}deg`);
  sticky.style.setProperty('--tilt-y', `${(px * 1).toFixed(4)}deg`);
  sticky.style.setProperty('--text-px', `${(px * 9).toFixed(2)}px`);
  sticky.style.setProperty('--text-py', `${(py * 6).toFixed(2)}px`);

  dust?.render(idle, px, py);
}

/* ---------- HUD ---------- */

const hudFrame = $('#hudFrame');
const hudProgress = $('#hudProgress');
const hudVelocity = $('#hudVelocity');
const hudSequence = $('#hudSequence');
const railFill = $('#railFill');
const railKnob = $('#railKnob');

/**
 * 계기판은 한 벌뿐이라 지금 보이는 시퀀스의 숫자만 쓴다.
 * 프레임 번호와 짝이 맞아야 하므로 PROGRESS 도 그 시퀀스 안에서의 값이다.
 */
function renderHUD(state, index) {
  hudFrame.textContent = `${pad3(state.frameIndex + 1)} / ${pad3(state.frameCount)}`;
  hudProgress.textContent = state.progress.toFixed(3);
  hudVelocity.textContent = pad3(state.velocity * 320);
  hudSequence.textContent = SEQUENCES[index].name;

  // 레일만은 시퀀스 전체를 가로지르는 하나의 눈금이다. 이음매에서 0으로 되돌아가지 않는다.
  const overall = progress.reduce((a, b) => a + b, 0) / SEQUENCES.length;
  railFill.style.transform = `scaleY(${overall.toFixed(4)})`;
  railKnob.style.top = `${(overall * 100).toFixed(2)}%`;
}

function renderTopline() {
  const doc = document.documentElement;
  const total = doc.scrollHeight - window.innerHeight;
  const p = total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;
  topline.style.transform = `scaleX(${p.toFixed(4)})`;
}

/* ---------- 하단 섹션 리빌 ---------- */

function setupReveal() {
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${i * 70}ms`;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- 탐색 컨트롤 ---------- */

/**
 * 카테고리 칩과 릴리스 레일의 선택 상태만 다룬다.
 * 현재 카드는 정적 마크업이라 카테고리별 목록 필터링은 아직 연결하지 않는다.
 * 상태를 aria 로도 알려야 해서 클래스만 바꾸고 끝내지 않는다.
 */
function setupControls() {
  document.querySelectorAll('.chips').forEach((group) => {
    const chips = Array.from(group.querySelectorAll('.chip'));
    group.addEventListener('click', (e) => {
      const hit = e.target.closest('.chip');
      if (!hit) return;
      chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip === hit)));
    });
  });

  document.querySelectorAll('.rail-items').forEach((group) => {
    const items = Array.from(group.querySelectorAll('.rail-item'));
    const nav = group.parentElement?.querySelector('.rail-nav');
    const prev = nav?.querySelector('[data-direction="-1"]');
    const next = nav?.querySelector('[data-direction="1"]');
    let active = Math.max(
      0,
      items.findIndex((item) => item.classList.contains('is-current')),
    );

    const update = (index, scroll = false) => {
      active = clamp(index, 0, items.length - 1);
      items.forEach((item, i) => {
        const on = i === active;
        item.classList.toggle('is-current', on);
        if (on) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
      if (prev) prev.disabled = active === 0;
      if (next) next.disabled = active === items.length - 1;

      if (!scroll) return;
      const item = items[active];
      const left =
        item.getBoundingClientRect().left - group.getBoundingClientRect().left + group.scrollLeft;
      group.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    group.addEventListener('click', (e) => {
      const hit = e.target.closest('.rail-item');
      const index = items.indexOf(hit);
      if (index >= 0) update(index, true);
    });

    nav?.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      update(active + Number(button.dataset.direction), true);
    });

    // 트랙패드·터치로 직접 밀었을 때도 가장 왼쪽에 가까운 카드를 현재 항목으로 맞춘다.
    let scrollFrame = 0;
    group.addEventListener(
      'scroll',
      () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => {
          const left = group.getBoundingClientRect().left;
          const closest = items.reduce(
            (best, item, index) => {
              const distance = Math.abs(item.getBoundingClientRect().left - left);
              return distance < best.distance ? { index, distance } : best;
            },
            { index: active, distance: Number.POSITIVE_INFINITY },
          );
          update(closest.index);
        });
      },
      { passive: true },
    );

    update(active);
  });
}

/* ---------- 시퀀스 처음 / 끝 이동 ---------- */

function setupSequenceControls() {
  const sequence = $('#sequence');
  const replay = $('#replaySequence');
  const skip = $('#skipSequence');
  if (!sequence || !replay || !skip) return;

  const limits = () => {
    const start = sequence.offsetTop;
    // sticky 화면 하나를 뺀 지점이 마지막 프레임이 화면을 채우는 마지막 스크롤 위치다.
    const end = Math.max(start, start + sequence.offsetHeight - window.innerHeight - 1);
    return { start, end };
  };

  const update = () => {
    const { start, end } = limits();
    replay.disabled = window.scrollY <= start + 2;
    skip.disabled = window.scrollY >= end - 2;
  };

  const jump = (toEnd) => {
    const { start, end } = limits();
    window.scrollTo({ top: toEnd ? end : start, behavior: 'instant' });
    requestAnimationFrame(() => {
      engines.forEach((engine) => engine?.sync());
      update();
    });
  };

  replay.addEventListener('click', () => jump(false));
  skip.addEventListener('click', () => jump(true));
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ---------- 앵커 이동 ---------- */

function setupAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      requestAnimationFrame(() => {
        window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
      });
    });
  });
}

/* ---------- 부팅 ---------- */

function setBootProgress(ratio) {
  const pct = clamp(ratio, 0, 1);
  bootBar.style.transform = `scaleX(${pct.toFixed(4)})`;
  bootPct.textContent = `${Math.round(pct * 100)}%`;
}

/** 한 시퀀스를 자기 구간 자에 물려 재생을 시작한다. */
function mount(index, renderer) {
  const seq = SEQUENCES[index];
  const canvas = $(seq.canvas);
  const scrollHost = $(seq.range);
  if (!renderer || !canvas || !scrollHost) return;
  mounted[index] = true;

  engines[index] = createEngine({
    canvas,
    scrollHost,
    renderer,
    onTick(state) {
      progress[index] = state.progress;
      states[index] = state;
      renderCopy();

      if (index === 0) {
        // 히어로의 원근감과 먼지, 스크롤 유도는 첫 시퀀스에만 걸려 있다.
        renderHero(state.progress);
        cue.style.opacity = String(clamp(1 - state.progress * 9, 0, 1));
      } else {
        const value = clamp(-state.hostTop / SEAM_PX, 0, 1);
        if (Math.abs(value - seam[index]) > 0.002) {
          seam[index] = value;
          canvas.style.opacity = value.toFixed(4);
        }
      }

      // 계기판은 한 벌뿐이므로 지금 보이는 시퀀스만 쓴다.
      if (index === activeIndex()) renderHUD(state, index);
    },
  });
}

function finishBoot(label) {
  bootLabel.textContent = label;
  setBootProgress(1);
  setTimeout(() => {
    boot.classList.add('done');
    document.body.classList.add('ready');
  }, 260);
}

async function start() {
  setupReveal();
  setupControls();
  setupSequenceControls();
  setupAnchors();
  window.addEventListener('scroll', renderTopline, { passive: true });
  renderTopline();

  // 화면 폭에 따라 둘 중 하나만 돌린다. styles.css 의 900px 과 같은 값이어야 한다.
  return compact.matches ? startReel() : startSequence();
}

/**
 * 좁은 화면. 시퀀스는 건드리지 않는다.
 *
 * 프레임을 한 장도 요청하지 않는 게 핵심이다. 세로 화면에서는 16:9 프레임의 좌우가
 * 통째로 잘려 장면을 알아볼 수 없는 데다, 518장 39MB 를 모바일 회선에 지울 이유도 없다.
 */
function startReel() {
  window.__sequence.mode = 'reel';
  window.__sequence.settled = true;

  createReel($('#reel'));
  footMode.textContent = 'RENDER MODE — MOBILE REEL';
  // 어느 경로로 그렸는지는 푸터의 footMode 가 알려 준다. 로딩 문구는 브랜드 카피로 둔다.
  finishBoot('WORLD READY');
}

async function startSequence() {
  const first = SEQUENCES[0];
  const renderer = await resolveRenderer(first.id, setBootProgress, first.head);

  const sourceLabel =
    renderer.kind === 'sequence' ? `IMAGE SEQUENCE · ${renderer.label}` : 'PROCEDURAL SCENE';
  footMode.textContent = `RENDER MODE — ${sourceLabel}`;

  renderChapters = createChapters($('#chapters'), SEQUENCES.length);
  mount(0, renderer);

  finishBoot('WORLD READY');

  loadRest(renderer);
}

/**
 * 뒤 시퀀스들은 부팅을 붙잡지 않는다.
 * 첫 시퀀스만 1000vh 넘게 스크롤해야 도달하는 위치라, 그동안 배경에서 다 받아 둔다.
 *
 * 순서를 지켜 하나씩 받는 게 중요하다. 뒤엣것을 먼저 받으면 앞 시퀀스의 남은 프레임이
 * 밀리고, 아직 도착하지 않은 자리는 가장 가까운 프레임으로 때워져 엉뚱한 컷이 멈춰 보인다.
 */
async function loadRest(first) {
  let previous = first;
  for (let i = 1; i < SEQUENCES.length; i += 1) {
    await previous?.complete;
    const seq = SEQUENCES[i];
    // 못 찾으면 그 구간은 비워 둔다. 앞 시퀀스의 마지막 컷이 그대로 남아 있는 편이,
    // 영상 한가운데에 대체 씬이 끼어드는 것보다 낫다.
    const renderer = await resolveRenderer(seq.id, () => {}, seq.head, false);
    if (!renderer) continue;
    mount(i, renderer);
    previous = renderer;
  }
  window.__sequence.settled = true;
}

start();

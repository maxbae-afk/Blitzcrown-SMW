/**
 * 스크롤 → 프레임 재생 엔진.
 *
 * 핵심은 두 가지다.
 *  1) 프레임 전량 사전 디코딩: 스크럽 중 네트워크 대기를 없앤다.
 *  2) 감쇠 보간: 원시 스크롤 값을 그대로 쓰면 휠의 계단식 입력이 그대로 보인다.
 *     매 rAF 마다 목표값에 일정 비율로 따라붙여 관성을 만든다.
 */

import { createProceduralScene } from './procedural-scene.js';

const MANIFEST_URL = 'frames/manifest.json';
const CONCURRENCY = 6;
const MOBILE_BREAKPOINT = 900;
// 캔버스가 요구하는 가로 픽셀이 이보다 크면 1920 세트로는 확대가 발생한다.
const RETINA_THRESHOLD = 2200;
// 뷰포트에서 이만큼 벗어나면 그 씬의 그리기를 쉰다.
const VIEW_MARGIN = 240;

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function pad(num, len) {
  return String(num).padStart(len, '0');
}

function frameURL(set, index, ext = set.ext) {
  const n = set.start + index;
  return `${set.path}${set.prefix}${pad(n, set.pad)}.${ext}`;
}

let manifestPromise = null;

/**
 * 시퀀스가 여러 개라도 매니페스트는 한 번만 받는다.
 *
 * 캐시를 재검증 없이 쓰면 안 된다. 이 파일은 어떤 시퀀스가 몇 장 있는지를 담고 있어서,
 * 프레임을 다시 변환한 뒤 예전 것을 그대로 쓰면 새로 붙인 시퀀스를 통째로 놓친다.
 * 몇 KB짜리라 매번 재검증해도 비용이 거의 없다. 프레임 이미지는 그대로 캐시된다.
 */
function readManifest() {
  manifestPromise ??= (async () => {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  })();
  return manifestPromise;
}

function pickSet(manifest, sequenceId) {
  const sets = manifest?.sequences?.find((s) => s.id === sequenceId)?.sets;
  if (!sets) return null;

  // 캔버스가 실제로 그려야 할 가로 픽셀 수. 이보다 원본이 작으면 확대되어 흐려진다.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const needed = window.innerWidth * dpr;

  let set = null;
  let label = 'DESKTOP SET';
  if (window.innerWidth < MOBILE_BREAKPOINT && sets.mobile) {
    set = sets.mobile;
    label = 'MOBILE SET';
  } else if (needed > RETINA_THRESHOLD && sets.retina) {
    set = sets.retina;
    label = 'RETINA SET';
  }
  set = set || sets.desktop || sets.mobile;
  if (!set || !set.count) return null;

  return {
    path: set.path ?? `frames/${sequenceId}/desktop/`,
    prefix: set.prefix ?? 'frame_',
    pad: set.pad ?? 4,
    start: set.start ?? 1,
    count: set.count,
    formats: set.formats?.length ? set.formats : [set.ext ?? 'webp'],
    pacing: Array.isArray(set.pacing) && set.pacing.length === set.count ? set.pacing : null,
    label,
  };
}

/**
 * 브라우저가 실제로 디코딩할 수 있는 포맷을 고른다.
 *
 * 포맷 지원 여부를 base64 조각으로 검사하는 방법도 있지만, canvas.toDataURL 은 인코딩
 * 지원만 알려주고(크롬은 AVIF 인코딩을 못 한다) 판정을 틀린다. 어차피 첫 프레임은
 * 반드시 받아 봐야 하므로, 실제 파일을 순서대로 시도해서 성공하는 포맷을 채택한다.
 */
async function resolveFormat(set) {
  for (const ext of set.formats) {
    try {
      return { ext, first: await loadImage(frameURL(set, 0, ext)) };
    } catch {
      /* 다음 후보로 */
    }
  }
  return null;
}

/**
 * 균일 매핑은 움직임이 큰 컷에서 프레임이 건너뛰는 것처럼 보인다.
 * 변환 단계에서 만든 누적 곡선을 역으로 조회해, 빠른 구간에 스크롤을 더 준다.
 */
function indexFromPacing(cum, t) {
  if (t <= 0) return 0;
  if (t >= 1) return cum.length - 1;

  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= t) lo = mid;
    else hi = mid;
  }

  const span = cum[hi] - cum[lo];
  const frac = span > 0 ? (t - cum[lo]) / span : 0;
  return frac < 0.5 ? lo : hi;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          /* decode 실패해도 onload 된 이미지는 그릴 수 있다 */
        }
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`frame load failed: ${url}`));
    img.src = url;
  });
}

async function preloadSet(set, first, onProgress, headRatio) {
  const frames = new Array(set.count).fill(null);
  let done = 0;

  // 포맷을 고르면서 이미 받아 둔 첫 프레임을 그대로 쓴다.
  frames[0] = first;
  done = 1;
  onProgress(done / set.count);

  function run(indices) {
    let cursor = 0;
    async function worker() {
      while (cursor < indices.length) {
        const i = indices[cursor];
        cursor += 1;
        try {
          frames[i] = await loadImage(frameURL(set, i));
        } catch {
          /* 빈 칸은 draw 단계에서 가장 가까운 프레임으로 대체한다 */
        }
        done += 1;
        onProgress(done / set.count);
      }
    }
    return Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  // 도입부만 받고 재생을 시작한 뒤, 나머지는 사용자가 읽는 동안 배경에서 채운다.
  const head = Math.min(set.count, Math.max(24, Math.ceil(set.count * headRatio)));
  const indices = Array.from({ length: set.count - 1 }, (_, k) => k + 1);
  await run(indices.slice(0, head - 1));

  return { frames, complete: run(indices.slice(head - 1)) };
}

/** 아직 도착하지 않은 프레임은 가장 가까운 이웃으로 대체해 공백을 만들지 않는다. */
function nearestFrame(frames, index) {
  if (frames[index]) return frames[index];
  for (let d = 1; d < frames.length; d += 1) {
    if (frames[index - d]) return frames[index - d];
    if (frames[index + d]) return frames[index + d];
  }
  return null;
}

function createSequenceRenderer(frames, label, pacing, complete) {
  return {
    kind: 'sequence',
    label,
    frameCount: frames.length,
    paced: Boolean(pacing),
    // 배경 로딩까지 끝나는 시점. 다음 시퀀스를 언제 받기 시작할지 정하는 데 쓴다.
    complete,
    indexAt(t) {
      if (pacing) return indexFromPacing(pacing, t);
      return clamp(Math.round(t * (frames.length - 1)), 0, frames.length - 1);
    },
    draw(ctx, w, h, index) {
      const img = nearestFrame(frames, index);
      if (!img) return false;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return img === frames[index];
    },
  };
}

/**
 * 매니페스트에서 해당 시퀀스를 찾으면 실제 프레임 렌더러를, 없으면 절차적 씬을 돌려준다.
 *
 * @param {string} sequenceId manifest.sequences 의 id
 * @param {(ratio:number)=>void} onProgress 로딩 진행도
 * @param {number} headRatio 재생을 시작하기 전에 미리 받아 둘 비율.
 *   첫 시퀀스는 부팅을 빨리 끝내야 하므로 작게, 뒤 시퀀스는 어차피 배경에서 받으므로 크게 잡는다.
 * @param {boolean} fallback 못 찾았을 때 절차적 씬으로 대체할지.
 *   첫 시퀀스는 빈 화면보다 낫지만, 이어 붙는 시퀀스는 영상 한가운데에 전혀 다른 장면이
 *   끼어드는 꼴이라 오히려 나쁘다. 그럴 땐 null 을 돌려 그 자리를 비운다.
 */
export async function resolveRenderer(sequenceId, onProgress, headRatio = 0.25, fallback = true) {
  const set = pickSet(await readManifest(), sequenceId);
  if (set) {
    const picked = await resolveFormat(set);
    if (picked) {
      set.ext = picked.ext;
      const { frames, complete } = await preloadSet(set, picked.first, onProgress, headRatio);
      const label = `${set.label} · ${picked.ext.toUpperCase()}`;
      return createSequenceRenderer(frames, label, set.pacing, complete);
    }
    /* 어떤 포맷도 못 읽음 → 아래 처리 */
  }

  if (!fallback) {
    console.warn(`[sequence] "${sequenceId}" 를 불러오지 못했습니다. 이 구간은 비워 둡니다.`);
    return null;
  }

  onProgress(1);
  const scene = createProceduralScene();
  scene.label = 'PROCEDURAL';
  return scene;
}

/**
 * 캔버스 리사이즈 · rAF 루프 · 감쇠 보간을 담당한다.
 */
export function createEngine({ canvas, scrollHost, renderer, onTick, easing = 0.09 }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = reduced ? 1 : easing;

  let cssW = 0;
  let cssH = 0;
  let dirty = true;
  let current = 0;
  let target = 0;
  let velocity = 0;
  let lastFrameIndex = -1;
  let endHoldPx = 0;
  let onscreen = true;
  let hostTop = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 캔버스 크기를 바꾸면 컨텍스트 상태가 초기화된다. 기본값 'low' 는 축소 시 계단이 생긴다.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // CSS의 vh 값을 픽셀로 환산한다. 이 거리는 시퀀스가 끝난 뒤 마지막 프레임으로 머문다.
    const endHoldVh = Number.parseFloat(
      getComputedStyle(scrollHost).getPropertyValue('--end-hold'),
    );
    endHoldPx = Number.isFinite(endHoldVh) ? (window.innerHeight * endHoldVh) / 100 : 0;
    dirty = true;
  }

  function readTarget() {
    const rect = scrollHost.getBoundingClientRect();
    hostTop = rect.top;
    onscreen = rect.bottom > -VIEW_MARGIN && rect.top < window.innerHeight + VIEW_MARGIN;
    // 마지막 홀드 거리를 진행도 계산에서 빼야 기존 프레임별 재생 속도가 바뀌지 않는다.
    const travel = rect.height - window.innerHeight - endHoldPx;
    if (travel <= 0) return 0;
    return clamp(-rect.top / travel, 0, 1);
  }

  function tick() {
    target = readTarget();
    const delta = target - current;

    // 씬이 여러 개라 루프도 여러 개 돈다. 화면 밖에서 이미 자리를 잡았다면 아무것도 하지 않는다.
    if (!onscreen && !dirty && Math.abs(delta) < 0.00015) {
      current = target;
      requestAnimationFrame(tick);
      return;
    }

    current += delta * ease;
    if (Math.abs(delta) < 0.00015) current = target;

    // 속도는 별도로 한 번 더 감쇠시켜 스트릭/블러가 갑자기 튀지 않게 한다.
    const instant = clamp(Math.abs(delta) * 26, 0, 1);
    velocity += (instant - velocity) * 0.12;

    let frameIndex = Math.round(current * (renderer.frameCount - 1));
    if (renderer.kind === 'procedural') {
      renderer.draw(ctx, cssW, cssH, current, velocity);
    } else {
      frameIndex = renderer.indexAt(current);
      if (frameIndex !== lastFrameIndex || dirty) {
        const exact = renderer.draw(ctx, cssW, cssH, frameIndex);
        // 대체 프레임을 그렸다면 원본이 도착했을 때 다시 그리도록 캐시를 비운다.
        lastFrameIndex = exact ? frameIndex : -1;
      }
    }
    dirty = false;

    onTick?.({
      progress: current,
      rawProgress: target,
      velocity,
      frameIndex,
      frameCount: renderer.frameCount,
      // 구간 시작선이 뷰포트 위쪽에서 얼마나 떨어져 있는지. 씬 교차 타이밍에 쓴다.
      hostTop,
    });
    requestAnimationFrame(tick);
  }

  // 스킵·다시 보기처럼 스크롤 위치가 한 번에 크게 바뀔 때 감쇠 구간을 거치지 않고
  // 해당 위치의 프레임을 즉시 그리도록 내부 진행도를 맞춘다.
  function sync() {
    target = readTarget();
    current = target;
    velocity = 0;
    dirty = true;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('orientationchange', resize);

  resize();
  current = readTarget();
  requestAnimationFrame(tick);

  return { resize, sync };
}

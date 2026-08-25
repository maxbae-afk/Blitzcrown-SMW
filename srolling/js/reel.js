/**
 * 모바일용 슬라이드 롤링.
 *
 * 좁은 화면에서는 스크롤 시퀀스를 재생하지 않는다. 518장을 내려받게 할 수도 없고,
 * 세로 화면에서 16:9 프레임을 꽉 채우면 화면 대부분이 잘려 나가 장면을 알아볼 수 없다.
 * 대신 세로로 촬영한 장면 몇 장을 텍스트와 함께 자동으로 넘긴다.
 *
 * 진행도는 rAF 로 직접 누적한다. CSS 애니메이션에 맡기면 탭을 벗어났다 돌아왔을 때
 * 막대와 실제 남은 시간이 어긋난다.
 */

const HOLD = 5200; // 한 장이 머무는 시간(ms)
const SWIPE_MIN = 40; // 이만큼 끌어야 넘김으로 친다(px)

/**
 * @param {HTMLElement} root .reel 컨테이너
 * @returns {{destroy():void}|null}
 */
export function createReel(root) {
  const slides = Array.from(root.querySelectorAll('.reel-slide'));
  if (!slides.length) return null;

  const bar = root.querySelector('.reel-bar');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 진행 막대는 장수만큼 칸을 나눠 만든다. 마크업에 박아 두면 장수를 바꿀 때마다 같이 고쳐야 한다.
  const segments = slides.map(() => {
    const seg = document.createElement('i');
    seg.className = 'reel-seg';
    seg.innerHTML = '<b></b>';
    bar?.appendChild(seg);
    return seg.firstElementChild;
  });

  let index = 0;
  let elapsed = 0;
  let last = 0;
  let running = false;
  let raf = 0;

  function paint() {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      // 지나간 장면은 반대 방향으로 비켜 둔다. 되돌아올 때 들어오는 방향이 자연스러워진다.
      slide.classList.toggle('is-past', i < index);
    });
    segments.forEach((fill, i) => {
      fill.style.transform = `scaleX(${i < index ? 1 : i === index ? 0 : 0})`;
    });
  }

  function go(next, { manual = false } = {}) {
    index = (next + slides.length) % slides.length;
    elapsed = 0;
    paint();
    if (manual) root.classList.add('is-touched');
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!running) {
      last = now;
      return;
    }

    const dt = Math.min(now - last, 100); // 탭 복귀 시 한 번에 건너뛰지 않도록 상한을 둔다
    last = now;
    elapsed += dt;

    const ratio = Math.min(elapsed / HOLD, 1);
    segments[index].style.transform = `scaleX(${ratio.toFixed(4)})`;

    if (ratio >= 1) go(index + 1);
  }

  /* 화면 밖이거나 탭이 가려져 있으면 세운다. 보이지 않는 동안 장면이 지나가 버리면 안 된다. */
  let onScreen = true;

  function sync() {
    running = onScreen && !document.hidden;
    last = performance.now();
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    },
    { threshold: 0.5 },
  );
  io.observe(root);
  document.addEventListener('visibilitychange', sync);

  /* 스와이프. 세로로 끄는 동작은 페이지 스크롤이므로 건드리지 않는다. */
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onDown = (e) => {
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  };

  const onUp = (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    go(index + (dx < 0 ? 1 : -1), { manual: true });
  };

  root.addEventListener('pointerdown', onDown, { passive: true });
  root.addEventListener('pointerup', onUp, { passive: true });
  root.addEventListener('pointercancel', () => { tracking = false; }, { passive: true });

  if (still) root.classList.add('is-still');

  paint();
  raf = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    },
  };
}

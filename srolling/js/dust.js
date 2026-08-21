/**
 * 히어로 구간에만 떠 있는 먼지 레이어.
 *
 * 입자마다 깊이(depth)를 주고 포인터 이동량을 깊이에 비례해 곱한다.
 * 배경 이미지보다 앞쪽 입자가 더 크게 움직이면서 원근감이 생긴다.
 * 스크롤이 시작되면 idle 이 0 으로 내려가 통째로 사라진다.
 */

const DESKTOP_COUNT = 130;
const MOBILE_COUNT = 50;
const SPRITE_SIZE = 64;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

/** 입자 하나를 미리 그려두고 재사용한다. 매 프레임 그라디언트를 새로 만들면 느리다. */
function createSprite() {
  const c = document.createElement('canvas');
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const g = c.getContext('2d');
  const r = SPRITE_SIZE / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.18, 'rgba(238, 255, 250, 0.82)');
  grad.addColorStop(0.42, 'rgba(175, 238, 224, 0.28)');
  grad.addColorStop(0.72, 'rgba(140, 215, 205, 0.07)');
  grad.addColorStop(1, 'rgba(120, 200, 190, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

function seedParticle(p) {
  p.x = Math.random();
  p.y = Math.random();
  p.depth = rand(0.25, 1);
  p.size = rand(1.2, 3.4) * (0.5 + p.depth);
  p.rise = rand(0.008, 0.028) * p.depth;
  p.drift = rand(-0.014, 0.014);
  p.phase = rand(0, Math.PI * 2);
  p.wobble = rand(0.25, 0.9);
  p.amp = rand(0.004, 0.018);
  p.twinkle = rand(0.5, 1.6);
  p.alpha = rand(0.35, 1);
}

export function createDust(canvas) {
  const ctx = canvas.getContext('2d');
  const sprite = createSprite();

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let particles = [];
  let lastTime = 0;
  let cleared = true;

  function populate() {
    const count = window.innerWidth < 900 ? MOBILE_COUNT : DESKTOP_COUNT;
    if (particles.length === count) return;
    particles = Array.from({ length: count }, () => {
      const p = {};
      seedParticle(p);
      return p;
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    populate();
    cleared = false;
  }

  /**
   * @param {number} idle  1 = 스크롤 전, 0 = 스크롤 시작됨
   * @param {number} px    포인터 가로 위치 (-1 ~ 1)
   * @param {number} py    포인터 세로 위치 (-1 ~ 1)
   */
  function render(idle, px, py) {
    if (idle <= 0.001) {
      // 완전히 사라진 뒤에는 매 프레임 지우지 않는다.
      if (!cleared) {
        ctx.clearRect(0, 0, cssW, cssH);
        cleared = true;
      }
      return;
    }
    cleared = false;

    const now = performance.now();
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;
    const t = now / 1000;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.globalCompositeOperation = 'lighter';

    const shiftX = px * 46;
    const shiftY = py * 30;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];

      p.y -= p.rise * dt;
      p.x += p.drift * dt;
      if (p.y < -0.05) {
        seedParticle(p);
        p.y = 1.05;
      }
      if (p.x < -0.05) p.x = 1.05;
      else if (p.x > 1.05) p.x = -0.05;

      const wobbleX = Math.sin(t * p.wobble + p.phase) * p.amp;
      const x = (p.x + wobbleX) * cssW + shiftX * p.depth;
      const y = p.y * cssH + shiftY * p.depth;

      const flicker = 0.65 + 0.35 * Math.sin(t * p.twinkle + p.phase * 2);
      const size = p.size * (2.6 + p.depth);

      ctx.globalAlpha = p.alpha * flicker * idle;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  return { render, resize };
}

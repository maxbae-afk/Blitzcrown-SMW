/**
 * 실제 프레임 시퀀스가 아직 없을 때 재생되는 대체 씬.
 * 스크롤 진행도 t(0~1)를 시간축으로 삼아 매 프레임 실시간 렌더링한다.
 * 실제 시퀀스를 frames/ 에 넣으면 이 모듈은 사용되지 않는다.
 */

const NIGHT = [4, 7, 12];
const DUSK = [16, 26, 34];
const DAWN = [58, 44, 46];
const HOT = [214, 132, 92];

const STAR_COUNT = 220;
const RIDGE_LAYERS = 3;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function mixRGB(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function rgba([r, g, b], alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 결정적 난수 — 프레임마다 별/능선이 흔들리지 않도록 시드 고정 */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildStars() {
  const rand = seeded(20260820);
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push({
      x: rand(),
      y: rand() * 0.62,
      r: 0.4 + rand() * 1.5,
      tw: rand() * Math.PI * 2,
    });
  }
  return stars;
}

function buildRidges() {
  const layers = [];
  for (let l = 0; l < RIDGE_LAYERS; l += 1) {
    const rand = seeded(9001 + l * 733);
    const points = [];
    const steps = 26;
    let height = 0.4 + rand() * 0.2;
    for (let i = 0; i <= steps; i += 1) {
      height += (rand() - 0.5) * 0.34;
      height = clamp(height, 0.12, 1);
      points.push(height);
    }
    layers.push(points);
  }
  return layers;
}

export function createProceduralScene() {
  const stars = buildStars();
  const ridges = buildRidges();

  /** 도로 평면 위 한 점을 화면 좌표로 투영 */
  function makeProjector(w, h, state) {
    const focal = h * 0.92;
    const camY = 1.55 + state.lift;
    const cx = w * 0.5 + state.drift;
    const horizon = h * 0.545 + state.pitch;
    return {
      horizon,
      cx,
      focal,
      project(x, z) {
        if (z < 0.35) return null;
        const s = focal / z;
        const bend = state.curve * z * z * 0.0016;
        return {
          x: cx + (x + bend) * s,
          y: horizon + camY * s,
          s,
        };
      },
    };
  }

  function drawSky(ctx, w, h, t, tone) {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    grad.addColorStop(0, rgba(mixRGB(NIGHT, DUSK, tone * 0.7)));
    grad.addColorStop(0.55, rgba(mixRGB(NIGHT, DAWN, tone)));
    grad.addColorStop(1, rgba(mixRGB(DUSK, HOT, tone * 0.85)));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawStars(ctx, w, h, t, tone) {
    const alpha = clamp(1 - tone * 1.35, 0, 1);
    if (alpha <= 0.01) return;
    for (let i = 0; i < stars.length; i += 1) {
      const st = stars[i];
      const twinkle = 0.55 + 0.45 * Math.sin(st.tw + t * 22 + i);
      ctx.globalAlpha = alpha * twinkle * 0.9;
      ctx.fillStyle = '#eef6ff';
      const px = ((st.x + t * 0.05) % 1) * w;
      ctx.fillRect(px, st.y * h, st.r, st.r);
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(ctx, w, h, t, proj, tone) {
    const rise = clamp((t - 0.08) / 0.72, 0, 1);
    const cx = proj.cx - proj.focal * 0.0006 * proj.cx;
    const cy = proj.horizon - h * 0.02 - rise * h * 0.16;
    const r = h * (0.085 + rise * 0.035);

    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 6);
    glow.addColorStop(0, `rgba(255, 186, 120, ${0.42 + tone * 0.24})`);
    glow.addColorStop(0.35, `rgba(255, 128, 96, ${0.14 + tone * 0.12})`);
    glow.addColorStop(1, 'rgba(255, 90, 60, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    disc.addColorStop(0, '#ffe9c4');
    disc.addColorStop(0.5, '#ffb066');
    disc.addColorStop(1, '#ff5f4d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = disc;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    // 레트로 스캔 슬릿
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i += 1) {
      const sy = cy - r * 0.1 + i * (r * 0.16);
      ctx.fillRect(cx - r, sy, r * 2, r * 0.035 + i * r * 0.008);
    }
    ctx.restore();
  }

  function drawRidges(ctx, w, h, proj, tone) {
    for (let l = 0; l < ridges.length; l += 1) {
      const pts = ridges[l];
      const depth = (l + 1) / ridges.length;
      const base = proj.horizon + 2;
      const amp = h * (0.13 - l * 0.03);
      const shift = (proj.cx - w * 0.5) * (0.35 * depth);
      const shade = mixRGB([6, 10, 14], [26, 20, 30], tone * (1 - depth * 0.4));

      ctx.beginPath();
      ctx.moveTo(-w * 0.2, base);
      const steps = pts.length - 1;
      for (let i = 0; i <= steps; i += 1) {
        const x = -w * 0.2 + ((w * 1.4) / steps) * i - shift;
        const y = base - pts[i] * amp;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w * 1.2, base);
      ctx.closePath();
      ctx.fillStyle = rgba(shade, 0.94 - l * 0.12);
      ctx.fill();
    }
  }

  function drawGround(ctx, w, h, proj, tone) {
    const grad = ctx.createLinearGradient(0, proj.horizon, 0, h);
    grad.addColorStop(0, rgba(mixRGB([8, 12, 16], [30, 20, 24], tone), 1));
    grad.addColorStop(1, '#04070a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, proj.horizon, w, h - proj.horizon);
  }

  function drawRoad(ctx, w, h, proj, state) {
    const HALF = 5.2;
    const FAR = 150;
    // 카메라 바로 앞은 투영 폭이 화면을 넘어서 가로줄처럼 보이므로 잘라낸다.
    const NEAR = 1.15;

    // 노면
    ctx.beginPath();
    let started = false;
    for (let z = FAR; z >= NEAR; z -= 1.6) {
      const p = proj.project(-HALF, z);
      if (!p) continue;
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else ctx.lineTo(p.x, p.y);
    }
    for (let z = NEAR; z <= FAR; z += 1.6) {
      const p = proj.project(HALF, z);
      if (!p) continue;
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    const road = ctx.createLinearGradient(0, proj.horizon, 0, h);
    road.addColorStop(0, 'rgba(12, 18, 22, 0.9)');
    road.addColorStop(1, 'rgba(3, 6, 8, 1)');
    ctx.fillStyle = road;
    ctx.fill();

    // 가로 그리드
    const spacing = 4;
    const offset = state.travel % spacing;
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i += 1) {
      const z = NEAR + i * spacing - offset;
      if (z < NEAR) continue;
      const a = proj.project(-HALF, z);
      const b = proj.project(HALF, z);
      if (!a || !b) continue;
      const fade = clamp(1 - z / FAR, 0, 1) * clamp((z - NEAR) / 14, 0, 1);
      ctx.strokeStyle = `rgba(50, 218, 180, ${0.06 + fade * 0.34})`;
      ctx.lineWidth = clamp(a.s * 0.012, 0.5, 3);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // 세로 레인
    for (const lane of [-HALF, -HALF / 3, HALF / 3, HALF]) {
      const edge = Math.abs(lane) === HALF;
      ctx.beginPath();
      let first = true;
      for (let z = FAR; z >= NEAR; z -= 1) {
        const p = proj.project(lane, z);
        if (!p) continue;
        if (first) {
          ctx.moveTo(p.x, p.y);
          first = false;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = edge ? 'rgba(50, 218, 180, 0.55)' : 'rgba(180, 210, 205, 0.12)';
      ctx.lineWidth = edge ? 2 : 1;
      ctx.stroke();
      if (edge) {
        ctx.strokeStyle = 'rgba(50, 218, 180, 0.16)';
        ctx.lineWidth = 8;
        ctx.stroke();
      }
    }

    // 중앙 파선
    const dashSpacing = 6;
    const dashOffset = state.travel % dashSpacing;
    for (let i = 0; i < 40; i += 1) {
      const z0 = NEAR + i * dashSpacing - dashOffset;
      const z1 = z0 + 2.4;
      if (z1 < NEAR) continue;
      const quad = [
        proj.project(-0.12, z0),
        proj.project(0.12, z0),
        proj.project(0.12, z1),
        proj.project(-0.12, z1),
      ];
      if (quad.some((p) => !p)) continue;
      ctx.beginPath();
      ctx.moveTo(quad[0].x, quad[0].y);
      for (let k = 1; k < 4; k += 1) ctx.lineTo(quad[k].x, quad[k].y);
      ctx.closePath();
      ctx.fillStyle = `rgba(235, 245, 240, ${clamp(1 - z0 / 90, 0.05, 0.7)})`;
      ctx.fill();
    }
  }

  function drawGates(ctx, w, h, proj, state) {
    const spacing = 18;
    const HALF = 6.6;
    const baseIndex = Math.floor(state.travel / spacing);
    const offset = state.travel % spacing;

    for (let i = 8; i >= 0; i -= 1) {
      const z = 0.6 + i * spacing - offset;
      if (z < 3 || z > 170) continue;
      const idx = baseIndex + i;
      const height = 5.6 + ((idx * 37) % 5) * 0.5;

      const l0 = proj.project(-HALF, z);
      const r0 = proj.project(HALF, z);
      if (!l0 || !r0) continue;
      const topY = l0.y - height * l0.s;
      // 게이트가 화면보다 크게 벌어지면 가로줄처럼 보이므로 뷰포트 폭 기준으로 흐린다.
      const span = r0.x - l0.x;
      const fade = clamp(1 - z / 150, 0.05, 1) * clamp((w * 1.15 - span) / (w * 0.45), 0, 1);
      if (fade < 0.02) continue;
      const thick = clamp(l0.s * 0.05, 1, 26);

      ctx.globalAlpha = fade;
      ctx.fillStyle = 'rgba(10, 16, 20, 0.92)';
      ctx.fillRect(l0.x - thick, topY, thick * 2, l0.y - topY);
      ctx.fillRect(r0.x - thick, topY, thick * 2, r0.y - topY);

      // 상단 라이트 바
      const bar = ctx.createLinearGradient(l0.x, topY, r0.x, topY);
      bar.addColorStop(0, 'rgba(50, 218, 180, 0.9)');
      bar.addColorStop(0.5, 'rgba(120, 255, 226, 0.35)');
      bar.addColorStop(1, 'rgba(50, 218, 180, 0.9)');
      ctx.fillStyle = bar;
      ctx.fillRect(l0.x, topY - thick * 0.7, r0.x - l0.x, thick * 0.7);

      ctx.fillStyle = `rgba(50, 218, 180, ${0.35 * fade})`;
      ctx.fillRect(l0.x - thick * 1.6, topY, thick * 0.5, l0.y - topY);
      ctx.fillRect(r0.x + thick * 1.1, topY, thick * 0.5, l0.y - topY);
      ctx.globalAlpha = 1;
    }
  }

  function drawStreaks(ctx, w, h, proj, state) {
    const speed = clamp(state.velocity, 0, 1);
    if (speed < 0.02) return;
    const rand = seeded(4242);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i += 1) {
      const side = rand() > 0.5 ? 1 : -1;
      const lane = side * (6.2 + rand() * 5);
      const yOff = -0.4 - rand() * 5.4;
      const spacing = 9;
      const z = 0.8 + ((rand() * 40 + state.travel * (1.4 + rand())) % (spacing * 9));
      const p = proj.project(lane, z);
      if (!p) continue;
      const len = clamp(p.s * 0.35 * speed, 2, 420);
      const y = p.y + yOff * p.s;
      ctx.strokeStyle = `rgba(120, 255, 226, ${0.05 + speed * 0.22})`;
      ctx.lineWidth = clamp(p.s * 0.006, 0.6, 3.5);
      ctx.beginPath();
      ctx.moveTo(p.x, y);
      ctx.lineTo(p.x + side * len * 0.35, y + len * 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHaze(ctx, w, h, proj, tone) {
    const haze = ctx.createLinearGradient(0, proj.horizon - h * 0.12, 0, proj.horizon + h * 0.14);
    haze.addColorStop(0, 'rgba(255, 150, 110, 0)');
    haze.addColorStop(0.5, `rgba(255, 150, 110, ${0.1 + tone * 0.16})`);
    haze.addColorStop(1, 'rgba(255, 150, 110, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, proj.horizon - h * 0.12, w, h * 0.26);
  }

  function drawSpeedBlur(ctx, w, h, state) {
    const speed = clamp(state.velocity, 0, 1);
    if (speed < 0.05) return;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.2, w * 0.5, h * 0.5, h * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0, 0, 0, ${speed * 0.5})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  return {
    kind: 'procedural',
    frameCount: 150,
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w  CSS 픽셀 기준 너비
     * @param {number} h  CSS 픽셀 기준 높이
     * @param {number} t  0~1 진행도
     * @param {number} velocity 정규화된 스크롤 속도(0~1)
     */
    draw(ctx, w, h, t, velocity = 0) {
      const tone = clamp(t * 1.05, 0, 1);
      const state = {
        travel: t * 420,
        curve: Math.sin(t * Math.PI * 2.4) * 2.2 + Math.sin(t * Math.PI * 6.1) * 0.6,
        drift: Math.sin(t * Math.PI * 3.1) * w * 0.035,
        pitch: Math.sin(t * Math.PI * 4.6) * h * 0.012 - t * h * 0.02,
        lift: Math.sin(t * Math.PI * 5.3) * 0.08,
        velocity,
      };
      const proj = makeProjector(w, h, state);
      proj.drift = state.drift;

      ctx.clearRect(0, 0, w, h);
      drawSky(ctx, w, h, t, tone);
      drawStars(ctx, w, h, t, tone);
      drawSun(ctx, w, h, t, proj, tone);
      drawRidges(ctx, w, h, proj, tone);
      drawGround(ctx, w, h, proj, tone);
      drawRoad(ctx, w, h, proj, state);
      drawGates(ctx, w, h, proj, state);
      drawStreaks(ctx, w, h, proj, state);
      drawHaze(ctx, w, h, proj, tone);
      drawSpeedBlur(ctx, w, h, state);
    },
  };
}

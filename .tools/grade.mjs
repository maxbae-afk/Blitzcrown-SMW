/**
 * 컬러 그레이딩. 변환 단계에서 굽기 때문에 재생 시 비용이 0이다.
 *
 * 시퀀스 전체에 "똑같은" 변환만 건다. 프레임마다 다른 보정(자동 레벨 등)을 걸면
 * 밝기가 프레임 단위로 출렁여서 영상이 깜빡인다.
 *
 * 측정 결과(analyze-color.mjs) 요약:
 *  - 화이트 포인트 평균 208, 최소 146. 계조 위쪽이 비어 있다.
 *  - 다만 251까지 닿는 프레임도 있어서 전역 레벨 확장은 1.6%밖에 못 번다.
 *  → 레벨을 늘리는 대신 S커브로 중간 대비를 세우고, 색으로 깊이를 만든다.
 */

export const GRADE = {
  // 블랙 크러시. 이 값 이하를 0으로 눌러 검정을 진짜 검정으로 만든다.
  // 이미 0까지 내려간 프레임이 있어 크게 잡으면 그림자 디테일이 뭉갠다.
  blackPoint: 4,

  // S커브 강도. 중간 대비를 세우되 양 끝은 클리핑하지 않는다.
  contrast: 0.18,

  // S커브는 그림자를 통째로 눌러서 어두운 장면(대홀 내부)의 바닥·기둥 디테일을 잡아먹는다.
  // 가장 어두운 쪽만 되돌려 형태를 남긴다. 중간톤 이상에는 거의 영향이 없다.
  shadowLift: 0.03,

  // 중간톤 밝기. 1보다 크면 어두워진다.
  gamma: 0.97,

  // 채도. 원본 평균 채도가 0.42 로 여유가 있다.
  saturation: 1.14,

  // 스플릿 토닝: 그림자는 청록으로, 하이라이트는 호박색으로 민다.
  // 원본이 이미 불꽃(주황)과 민트(청록)로 이뤄져 있어 그 대비를 강조하는 방향이다.
  shadowTint: { r: -3, g: 1, b: 7 },
  highlightTint: { r: 7, g: 2, b: -5 },
  tintStrength: 1,
};

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * 클립 맞추기. 시퀀스마다 원본의 톤이 다를 때 공용 그레이딩 "앞"에서 기준을 맞춘다.
 *
 * 순서가 중요하다. 공용 그레이딩은 모든 시퀀스에 같은 look 을 입히는 단계라,
 * 서로 다른 출발점에 걸면 차이가 그대로 남고 채도·대비 때문에 오히려 벌어진다.
 * 먼저 여기서 출발점을 맞춘 다음 같은 look 을 입혀야 이음매에서 색이 튀지 않는다.
 *
 * 채널마다 out = v * gain + lift 인 1차식이다. 게인은 밝기(노출), 리프트는 검정 수준을 옮긴다.
 * 계수는 match-fit.mjs 가 이웃 시퀀스의 경계 프레임에서 뽑아 준다.
 *
 * @param {Buffer} data raw RGB
 * @param {{gain:[number,number,number], lift:[number,number,number]}} [match]
 */
export function applyMatch(data, match) {
  if (!match) return data;

  const { gain, lift } = match;
  // 채널당 256칸 표. 픽셀마다 곱셈을 도는 것보다 빠르고 결과는 같다.
  const lut = [0, 1, 2].map((c) => {
    const table = new Uint8Array(256);
    for (let v = 0; v < 256; v += 1) table[v] = clamp255(Math.round(v * gain[c] + lift[c]));
    return table;
  });

  for (let p = 0; p < data.length; p += 3) {
    data[p] = lut[0][data[p]];
    data[p + 1] = lut[1][data[p + 1]];
    data[p + 2] = lut[2][data[p + 2]];
  }

  return data;
}

/** 양 끝을 고정한 채 가운데 기울기만 세우는 곡선. */
function sCurve(x, amount) {
  const s = x * x * (3 - 2 * x);
  return x + (s - x) * amount;
}

/** 톤 커브는 채널과 무관하므로 256칸 표로 미리 계산해 둔다. */
function buildToneLUT(g) {
  const lut = new Uint8Array(256);
  const scale = 255 / (255 - g.blackPoint);
  for (let v = 0; v < 256; v += 1) {
    let x = ((v - g.blackPoint) * scale) / 255;
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    x = sCurve(x, g.contrast);
    x += g.shadowLift * (1 - x) ** 3;
    x = x ** g.gamma;
    lut[v] = clamp255(Math.round(x * 255));
  }
  return lut;
}

/**
 * 라인 버퍼(RGB 연속)를 제자리에서 보정한다.
 * @param {Buffer} data raw RGB
 */
export function applyGrade(data, g = GRADE) {
  const lut = buildToneLUT(g);
  const sat = g.saturation;
  const ts = g.tintStrength;
  const sh = g.shadowTint;
  const hl = g.highlightTint;

  for (let p = 0; p < data.length; p += 3) {
    let r = lut[data[p]];
    let gr = lut[data[p + 1]];
    let b = lut[data[p + 2]];

    const luma = 0.2126 * r + 0.7152 * gr + 0.0722 * b;

    if (sat !== 1) {
      r = luma + (r - luma) * sat;
      gr = luma + (gr - luma) * sat;
      b = luma + (b - luma) * sat;
    }

    if (ts !== 0) {
      const n = luma / 255;
      // 양 끝에서 가장 세고 중간톤은 건드리지 않는다. 얼굴색이 틀어지는 걸 막는다.
      const shadow = (1 - n) ** 2;
      const high = n ** 2;
      r += (sh.r * shadow + hl.r * high) * ts;
      gr += (sh.g * shadow + hl.g * high) * ts;
      b += (sh.b * shadow + hl.b * high) * ts;
    }

    data[p] = clamp255(r);
    data[p + 1] = clamp255(gr);
    data[p + 2] = clamp255(b);
  }

  return data;
}

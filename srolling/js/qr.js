/*
  QR 부호를 만든다.

  세일즈 자리에서 폰을 대면 바로 열리도록 데모 창이 게임 주소를 QR 로 보여 준다.
  주소는 관리자에서 언제든 바뀌므로 그림 파일로 미리 만들어 두지 않고 그 자리에서 만든다.

  담을 범위를 좁혀 두었다. 규격 전부를 옮기면 표만 몇 배로 늘어나는데 쓸 일이 없다.
    · 바이트 방식만 쓴다. 주소는 아스키라 숫자·영숫자 방식이 이득을 주지 않는다.
    · 정정 수준은 M(15%) 하나다. 화면에 띄우고 폰으로 읽는 거리라 이보다 높일 이유가 없다.
    · 1~10 판까지만 만든다. 213 글자까지 담기고, 게임 주소는 그 절반에도 못 미친다.
  그보다 긴 글이 오면 null 을 준다. 부르는 쪽이 QR 을 감추면 된다.

  규격: ISO/IEC 18004. 마스크 고르기와 벌점 규칙까지 그대로 따랐다.
*/

/*
  판별 그릇. 정정 수준 M 기준이다.
  [정정 코드워드 수, 1군 블록 수, 1군 자료 코드워드, 2군 블록 수, 2군 자료 코드워드]
*/
const BLOCKS = [
  null,
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
];

/* 정렬 무늬의 가로·세로 좌표. 이 값들을 교차시킨 자리마다 무늬가 하나씩 놓인다. */
const ALIGN = [
  null,
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/* 자료를 다 놓고도 자리가 남으면 이 두 값을 번갈아 채운다. */
const PAD = [0xec, 0x11];

/* ---------- 갈루아 체 GF(256) ---------- */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

for (let i = 0, x = 1; i < 255; i += 1) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d; // 원시 다항식
}
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];

const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/* 정정 다항식 g(x) = (x-α⁰)(x-α¹)…(x-α^(n-1)). 높은 차수가 앞이다. */
function generator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j]; // x 를 곱한 쪽
      next[j + 1] ^= mul(poly[j], EXP[i]); // α^i 를 곱한 쪽
    }
    poly = next;
  }
  return poly;
}

/* 자료 코드워드를 g(x) 로 나눈 나머지가 곧 정정 코드워드다. */
function correction(data, length) {
  const gen = generator(length);
  const out = new Uint8Array(length);

  for (const byte of data) {
    const factor = byte ^ out[0];
    out.copyWithin(0, 1);
    out[length - 1] = 0;
    if (factor !== 0) {
      for (let i = 0; i < length; i += 1) out[i] ^= mul(gen[i + 1], factor);
    }
  }
  return out;
}

/* ---------- 자료 ---------- */

const capacity = (version) => {
  const [, b1, d1, b2, d2] = BLOCKS[version];
  // 방식 4 비트 + 글자 수 8 또는 16 비트를 뺀 나머지가 본문 몫이다.
  return b1 * d1 + b2 * d2 - (version >= 10 ? 3 : 2);
};

function codewords(bytes, version) {
  const bits = [];
  const put = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };

  put(0b0100, 4); // 바이트 방식
  put(bytes.length, version >= 10 ? 16 : 8);
  for (const byte of bytes) put(byte, 8);

  const [, b1, d1, b2, d2] = BLOCKS[version];
  const total = b1 * d1 + b2 * d2;

  // 끝 표시는 네 비트지만 자리가 모자라면 있는 만큼만 넣는다.
  for (let i = 0; i < 4 && bits.length < total * 8; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);

  const out = [];
  for (let i = 0; i < bits.length; i += 8) {
    out.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  // 남은 자리는 정해진 두 값을 번갈아 채운다.
  for (let i = 0; out.length < total; i += 1) out.push(PAD[i % 2]);
  return out;
}

/*
  블록마다 정정 코드워드를 붙인 뒤, 자료끼리 한 바퀴 정정끼리 한 바퀴 섞는다.
  한 군데가 뭉개져도 여러 블록에 흩어지도록 규격이 정한 순서다.
*/
function interleave(data, version) {
  const [ecLength, b1, d1, b2, d2] = BLOCKS[version];

  const blocks = [];
  let at = 0;
  for (const [count, size] of [
    [b1, d1],
    [b2, d2],
  ]) {
    for (let i = 0; i < count; i += 1) {
      const part = data.slice(at, at + size);
      at += size;
      blocks.push({ data: part, ec: correction(part, ecLength) });
    }
  }

  const out = [];
  for (let i = 0; i < Math.max(d1, d2); i += 1) {
    for (const block of blocks) if (i < block.data.length) out.push(block.data[i]);
  }
  for (let i = 0; i < ecLength; i += 1) {
    for (const block of blocks) out.push(block.ec[i]);
  }
  return out;
}

/* ---------- 판 ---------- */

/* 규격이 자리를 정해 둔 칸들. 자료가 침범하면 안 되므로 따로 표시해 둔다. */
function frame(version) {
  const size = version * 4 + 17;
  const grid = new Uint8Array(size * size);
  const fixed = new Uint8Array(size * size);

  const set = (row, col, value) => {
    if (row < 0 || row >= size || col < 0 || col >= size) return;
    grid[row * size + col] = value;
    fixed[row * size + col] = 1;
  };

  // 탐지 무늬 세 개와 그 둘레의 빈 띠
  const finder = (top, left) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const edge = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        set(top + r, left + c, edge === 2 || edge > 3 ? 0 : 1);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  // 시간 무늬. 두 무늬 사이를 한 칸씩 번갈아 잇는다.
  for (let i = 8; i < size - 8; i += 1) {
    const on = i % 2 === 0 ? 1 : 0;
    set(6, i, on);
    set(i, 6, on);
  }

  /*
    정렬 무늬. 탐지 무늬와 겹치는 세 자리만 뺀다.
    시간 무늬와 겹치는 자리는 빼지 않는다. 규격상 그 위에 그대로 얹힌다.
  */
  const last = size - 7;
  for (const row of ALIGN[version]) {
    for (const col of ALIGN[version]) {
      if ((row === 6 && (col === 6 || col === last)) || (row === last && col === 6)) continue;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          const edge = Math.max(Math.abs(r), Math.abs(c));
          set(row + r, col + c, edge === 1 ? 0 : 1);
        }
      }
    }
  }

  // 형식 정보 자리를 미리 잡아 둔다. 값은 마스크를 고른 뒤에 넣는다.
  for (const [row, col] of formatSlots(size).flat()) set(row, col, 0);
  set(size - 8, 8, 1); // 늘 검은 칸

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const info = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const bit = (info >>> i) & 1;
      const far = size - 11 + (i % 3);
      const near = Math.floor(i / 3);
      set(near, far, bit);
      set(far, near, bit);
    }
  }

  return { size, grid, fixed };
}

/* 형식 정보 15 비트가 놓이는 자리. 배열 순서가 곧 비트 순서(0 이 최하위)다. */
function formatSlots(size) {
  const first = [];
  for (let i = 0; i <= 5; i += 1) first.push([i, 8]);
  first.push([7, 8], [8, 8], [8, 7]);
  for (let i = 9; i <= 14; i += 1) first.push([8, 14 - i]);

  const second = [];
  for (let i = 0; i <= 7; i += 1) second.push([8, size - 1 - i]);
  for (let i = 8; i <= 14; i += 1) second.push([size - 15 + i, 8]);

  return [first, second];
}

/* 오른쪽 아래에서 두 칸 폭으로 지그재그를 그리며 올라갔다 내려온다. */
function place(state, stream) {
  const { size, grid, fixed } = state;
  let at = 0;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // 세로 시간 무늬는 건너뛴다
    for (let step = 0; step < size; step += 1) {
      for (let j = 0; j < 2; j += 1) {
        const col = right - j;
        const up = ((right + 1) & 2) === 0;
        const row = up ? size - 1 - step : step;
        if (fixed[row * size + col] || at >= stream.length * 8) continue;
        grid[row * size + col] = (stream[at >>> 3] >>> (7 - (at & 7))) & 1;
        at += 1;
      }
    }
  }
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/*
  벌점. 낮을수록 읽기 쉽다.
  규격이 정한 네 가지를 그대로 센다. 한 줄로 길게 이어진 같은 색, 2x2 덩어리,
  탐지 무늬로 오인될 배열, 그리고 검은 칸이 절반에서 얼마나 치우쳤는지다.
*/
const RUN = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];

function penalty(size, grid) {
  const at = (row, col) => grid[row * size + col];
  let score = 0;

  for (let i = 0; i < size; i += 1) {
    for (const line of [
      (k) => at(i, k),
      (k) => at(k, i),
    ]) {
      let run = 1;
      for (let k = 1; k < size; k += 1) {
        if (line(k) === line(k - 1)) {
          run += 1;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else {
          run = 1;
        }
      }

      for (let k = 0; k + RUN.length <= size; k += 1) {
        let head = true;
        let tail = true;
        for (let m = 0; m < RUN.length; m += 1) {
          if (line(k + m) !== RUN[m]) head = false;
          if (line(k + m) !== RUN[RUN.length - 1 - m]) tail = false;
        }
        if (head) score += 40;
        if (tail) score += 40;
      }
    }
  }

  for (let row = 0; row + 1 < size; row += 1) {
    for (let col = 0; col + 1 < size; col += 1) {
      const value = at(row, col);
      if (value === at(row, col + 1) && value === at(row + 1, col) && value === at(row + 1, col + 1)) {
        score += 3;
      }
    }
  }

  const dark = grid.reduce((sum, cell) => sum + cell, 0);
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
}

function applyFormat(state, mask) {
  const { size, grid } = state;
  let rem = mask; // 정정 수준 M 은 00 이라 마스크 번호가 곧 값이다
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const info = (((mask << 10) | rem) ^ 0x5412) & 0x7fff;

  for (const slots of formatSlots(size)) {
    slots.forEach(([row, col], i) => {
      grid[row * size + col] = (info >>> i) & 1;
    });
  }
}

/**
 * 글을 QR 판으로 바꾼다. 담기지 않으면 null.
 *
 * @param {string} text
 * @returns {{ size: number, cells: Uint8Array } | null}
 */
export function qrMatrix(text) {
  const bytes = new TextEncoder().encode(text);
  const version = BLOCKS.findIndex((row, i) => i >= 1 && capacity(i) >= bytes.length);
  if (version < 1) return null;

  const stream = interleave(codewords(bytes, version), version);

  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    const state = frame(version);
    place(state, stream);

    // 자투리 칸은 이미 0 이다. 마스크는 자료 칸에만 건다.
    for (let row = 0; row < state.size; row += 1) {
      for (let col = 0; col < state.size; col += 1) {
        const i = row * state.size + col;
        if (!state.fixed[i] && MASKS[mask](row, col)) state.grid[i] ^= 1;
      }
    }
    applyFormat(state, mask);

    const score = penalty(state.size, state.grid);
    if (!best || score < best.score) best = { score, size: state.size, cells: state.grid };
  }

  return { size: best.size, cells: best.cells };
}

/** 판을 SVG 조각의 d 속성으로 바꾼다. 한 칸이 1 단위다. */
export function qrPath({ size, cells }) {
  let d = '';
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (cells[row * size + col]) d += `M${col} ${row}h1v1h-1z`;
    }
  }
  return d;
}

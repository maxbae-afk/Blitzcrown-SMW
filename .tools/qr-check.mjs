/*
  qr.js 가 만든 부호를 진짜 해독기(jsQR)로 읽어 본다.

    cd blitzcrown-v2/.tools
    bun run qr-check.mjs

  규격 구현은 눈으로 봐서는 맞는지 알 수 없다. 읽히는지가 유일한 판정이다.
  실제 게임 주소와, 판이 바뀌는 경계 길이를 함께 넣어 1~10 판을 모두 지나가게 했다.
*/

import jsQR from 'jsqr';
import { qrMatrix } from '../srolling/js/qr.js';
import { GAMES } from '../srolling/js/games.data.js';

const SCALE = 4;
const QUIET = 4; // 규격이 요구하는 여백. 없으면 해독기가 못 찾는다.

/* 판을 흑백 그림으로 펴서 해독기에 넘긴다. */
function decode({ size, cells }) {
  const width = (size + QUIET * 2) * SCALE;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!cells[row * size + col]) continue;
      for (let y = 0; y < SCALE; y += 1) {
        for (let x = 0; x < SCALE; x += 1) {
          const at = (((row + QUIET) * SCALE + y) * width + (col + QUIET) * SCALE + x) * 4;
          pixels[at] = 0;
          pixels[at + 1] = 0;
          pixels[at + 2] = 0;
        }
      }
    }
  }

  return jsQR(pixels, width, width)?.data ?? null;
}

const samples = [
  ...GAMES.map((game) => game.embed).filter(Boolean),
  'https://games.dq.ntcc.massivegaming.io/mb-limbo-arts2/',
  'A',
  'https://blitzcrown.massivegaming.io/',
];

/* 판이 올라가는 지점마다 하나씩. 1 판 14 글자부터 10 판 213 글자까지가 범위다. */
for (const length of [14, 15, 26, 27, 42, 43, 62, 63, 84, 85, 106, 107, 122, 123, 152, 153, 180, 181, 213]) {
  samples.push('https://games.ntcc.massivegaming.io/x/'.padEnd(length, 'ab').slice(0, length));
}

let bad = 0;
const seen = new Set();

for (const text of samples) {
  const matrix = qrMatrix(text);
  if (!matrix) {
    console.log(`실패 담기지 않음 (${text.length}자)`);
    bad += 1;
    continue;
  }

  const version = (matrix.size - 17) / 4;
  seen.add(version);
  const read = decode(matrix);

  if (read !== text) {
    console.log(`실패 ${version}판 ${matrix.size}칸 (${text.length}자)\n  넣은 값 ${text}\n  읽은 값 ${read}`);
    bad += 1;
  } else {
    console.log(`통과 ${String(version).padStart(2)}판 ${matrix.size}칸 ${String(text.length).padStart(3)}자  ${text.slice(0, 52)}`);
  }
}

/* 담을 수 없는 길이는 조용히 틀린 부호를 주지 말고 null 이어야 한다. */
const tooLong = qrMatrix('x'.repeat(214));
console.log(`\n214자 처리: ${tooLong === null ? '통과 (null)' : '실패 (부호를 만들었다)'}`);
if (tooLong !== null) bad += 1;

console.log(`거친 판: ${[...seen].sort((a, b) => a - b).join(', ')}`);
console.log(bad === 0 ? `\n전부 통과 (${samples.length}건)` : `\n실패 ${bad}건`);
process.exit(bad === 0 ? 0 : 1);

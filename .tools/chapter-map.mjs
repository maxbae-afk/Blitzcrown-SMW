/**
 * 프레임 번호 ↔ 스크롤 진행도 환산기.
 *
 * 챕터 카피의 data-start / data-end 는 진행도(0~1) 기준인데,
 * 페이싱 곡선이 바뀌면 같은 진행도가 다른 프레임을 가리키게 된다.
 * 영상 컷 전환점(프레임 번호)을 넣으면 넣어야 할 진행도를 알려준다.
 *
 *   bun run chapter-map.mjs
 */

import { readFileSync } from 'node:fs';
import { SEQUENCES, report } from './pacing.mjs';

const SITE = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling';
const manifest = JSON.parse(readFileSync(`${SITE}/frames/manifest.json`, 'utf8'));

// 카피를 띄울 구간 (시퀀스별 0-based 프레임 번호)
//
// index.html 의 data-start/end 는 세 시퀀스를 이어 붙인 0~3 타임라인이다.
// 아래 출력에 이미 시퀀스 순번이 더해져 있으므로 그대로 옮겨 적으면 된다.
// 05 처럼 이음매를 걸치는 카피는 시작을 main 에서, 끝을 ascent 에서 읽는다.
//
// bridge 는 카피를 두지 않는다. 76vh 뿐이라 여닫을 거리가 안 나오고,
// 05 가 이 구간을 그대로 지나가며 덮는다.
const CHAPTERS = {
  main: [
    ['00 / IGNITION', 0, 34],
    ['01 / THE REALM', 52, 78],
    ['02 / GRAND HALL', 84, 121],
    ['03 / LIVE DEALER', 127, 143],
    ['04 / THE DEAL', 150, 190],
    ['05 / TAKE OFF', 218, 263],
  ],
  ascent: [
    ['05 / TAKE OFF (끝)', 0, 30],
    ['06 / REBUILT', 48, 92],
    ['07 / ORBIT', 116, 143],
  ],
};

for (const sequence of SEQUENCES) {
  const set = manifest.sequences?.find((s) => s.id === sequence.id)?.sets?.desktop;
  const cum = set?.pacing;

  if (!cum) {
    console.error(`[${sequence.id}] pacing 이 없습니다. convert.mjs 를 먼저 실행하세요.`);
    continue;
  }

  const toProgress = (frame) => cum[Math.min(Math.max(frame, 0), cum.length - 1)];

  // 이어 붙인 타임라인에서 이 시퀀스가 차지하는 구간의 시작값
  const base = SEQUENCES.findIndex((s) => s.id === sequence.id);

  console.log(`\n=== ${sequence.id} · 데스크톱 세트 ${set.count}장 · 타임라인 +${base} ===\n`);
  console.log('챕터                    프레임      data-start   data-end   균일이었다면');

  for (const [label, from, to] of CHAPTERS[sequence.id] ?? []) {
    const start = base + (from === 0 ? 0 : toProgress(from));
    const end = base + (to >= set.count - 1 ? 1.001 : toProgress(to));
    const uniformStart = base + from / (set.count - 1);
    console.log(
      `${label.padEnd(22)} ${String(from).padStart(3)}–${String(to).padEnd(3)}  ${start
        .toFixed(3)
        .padStart(10)}  ${end.toFixed(3).padStart(9)}   ${uniformStart.toFixed(3).padStart(8)}`,
    );
  }

  report(cum, set.count, sequence.sections);
}

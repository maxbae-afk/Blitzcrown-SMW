/**
 * figma-spec.json 을 한 줄에 하나씩 읽기 좋은 형태로 뿌린다.
 * Figma 로 옮길 때 이 목록을 보고 그대로 만든다.
 *
 *   bun run figma-print.mjs                 # 목차
 *   bun run figma-print.mjs "02 POPULAR"    # 해당 섹션 상세
 */

import { readFileSync } from 'node:fs';

const spec = JSON.parse(readFileSync(new URL('figma-spec.json', import.meta.url), 'utf8'));
const want = process.argv[2];

const hex = (c) => {
  if (!c) return '없음';
  const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}${c.a < 1 ? `/${c.a}` : ''}`;
};

let y = 0;
for (const s of spec) {
  if (!want) {
    console.log(
      `${s.name.padEnd(18)} y ${String(Math.round(y)).padStart(5)}  높이 ${String(
        Math.round(s.height),
      ).padStart(5)}  배경 ${hex(s.background).padEnd(12)} 도형 ${s.items.length}`,
    );
    y += s.height;
    continue;
  }

  if (!s.name.toLowerCase().includes(want.toLowerCase())) continue;

  console.log(`# ${s.name}  ${Math.round(s.width)}x${Math.round(s.height)}  배경 ${hex(s.background)}\n`);
  s.items.forEach((it, i) => {
    const at = `${String(Math.round(it.x)).padStart(4)},${String(Math.round(it.y)).padStart(4)}`;
    if (it.kind === 'box') {
      const size = `${Math.round(it.w)}x${Math.round(it.h)}`;
      const paint = it.stroke
        ? `테두리 ${hex(it.stroke)} ${it.strokeWeight}px`
        : `채움 ${hex(it.fill)}`;
      console.log(`${String(i).padStart(3)} box  ${at} ${size.padEnd(11)} ${paint}   ${it.name}`);
    } else {
      console.log(
        `${String(i).padStart(3)} text ${at} ${String(Math.round(it.size)).padStart(3)}/${
          it.weight
        }${it.mono ? ' mono' : '     '} ${hex(it.fill).padEnd(12)} "${it.text}"`,
      );
    }
  });
}

/**
 * 이미지는 그대로 두고 manifest.json 의 pacing 만 다시 계산한다.
 * 구간 속도(pacing.mjs 의 SECTIONS)를 조절할 때 쓴다. 재인코딩이 없어 몇 초면 끝난다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run repacing.mjs           # 전체 시퀀스
 *   bun run repacing.mjs ascent    # 한 시퀀스만
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { SEQUENCES, listSource, motionSeries, buildPacing, report } from './pacing.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const manifestPath = `${ROOT}/srolling/frames/manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const targets = only.length ? SEQUENCES.filter((s) => only.includes(s.id)) : SEQUENCES;

for (const sequence of targets) {
  const entry = manifest.sequences?.find((s) => s.id === sequence.id);
  if (!entry) {
    console.warn(`[${sequence.id}] manifest 에 없습니다. convert.mjs 를 먼저 실행하세요.`);
    continue;
  }

  const src = `${ROOT}/${sequence.src}`;
  const files = listSource(src);
  if (!files.length) {
    console.error(`원본을 찾지 못했습니다: ${src}`);
    process.exit(1);
  }

  console.log(`\n[${sequence.id}] 원본 ${files.length}장 · 움직임 측정…`);
  const motion = await motionSeries(src, files);

  for (const [name, set] of Object.entries(entry.sets)) {
    // 세트가 원본 몇 장당 한 장을 썼는지 되짚는다.
    const step = Math.max(1, Math.round(files.length / set.count));
    const pacing = buildPacing(motion, step, sequence.sections);

    if (!pacing || pacing.length !== set.count) {
      console.warn(`  ${name}: 페이싱 길이 불일치로 건너뜀 (${pacing?.length} vs ${set.count})`);
      continue;
    }

    set.pacing = pacing;
    console.log(`  ${name}: ${set.count}장 · step ${step} · 페이싱 갱신`);
  }

  report(entry.sets.desktop.pacing, entry.sets.desktop.count, sequence.sections);
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('\nmanifest.json 갱신 완료. chapter-map.mjs 로 챕터 타이밍을 다시 확인하세요.');

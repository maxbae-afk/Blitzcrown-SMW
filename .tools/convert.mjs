/**
 * 원본 시퀀스를 웹 재생용 이미지 세트로 변환하고 frames/manifest.json 을 갱신한다.
 * 변환 대상은 pacing.mjs 의 SEQUENCES 에 정의되어 있다.
 *
 * 각 프레임은 리사이즈 → 샤프닝 → 클립 맞추기 → 컬러 그레이딩 → 인코딩 순서를 거친다.
 * 보정을 여기서 구워 두므로 재생 중에는 아무 비용도 들지 않는다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run convert.mjs            # 전체 시퀀스
 *   bun run convert.mjs ascent     # 한 시퀀스만 (나머지는 manifest 그대로 둔다)
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { SEQUENCES, listSource, motionSeries, buildPacing, report } from './pacing.mjs';
import { applyGrade, applyMatch } from './grade.mjs';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2';
const SITE = `${ROOT}/srolling`;
const MANIFEST = `${SITE}/frames/manifest.json`;

/**
 * 포맷은 앞에서부터 우선순위다. 브라우저가 첫 프레임을 못 읽으면 다음 포맷으로 넘어간다.
 *
 * AVIF 하나만 굽는다. WebP 는 AVIF 를 못 읽는 사파리 16.4 미만(2023년 3월 이전)용
 * 대비책이었는데, AVIF 를 읽는 브라우저는 이 파일을 한 장도 내려받지 않는다.
 * 즉 사용자 다운로드 용량에는 아무 보탬이 없으면서 저장 공간만 45MB 를 쓰고 있었다.
 */
const formats = [
  {
    ext: 'avif',
    encode: (pipe, job) =>
      pipe.avif({ quality: job.avifQuality, effort: job.effort, chromaSubsampling: '4:4:4' }),
  },
];

/*
 * 여기만 고치면 화질·용량·장수가 바뀐다. step 은 "원본 몇 장당 한 장"을 쓸지.
 * retina 는 원본이 2560 이상일 때만 생성한다. 원본보다 키워봐야 없는 디테일은 생기지 않는다.
 *
 * sharpen: 원본 렌더가 소프트해서 넣는 언샤프 마스크. sigma 는 이미지 크기에 비례해 잡는다.
 * 1.5 를 넘기면 머리카락·윤곽에 흰 테두리(헤일로)가 보이기 시작한다.
 *
 * effort 9 + quality 71 은 encode-sweep.mjs 로 고른 조합이다. effort 는 결과 화질 목표를
 * 그대로 둔 채 압축 방법을 더 오래 찾는 설정이라, 같은 화질에서 파일이 작아진다.
 * 그 이득만큼 quality 를 낮춰 상쇄했더니 평균 오차와 최악 블록 오차가 둘 다 예전
 * (q74 effort4) 보다 낮으면서 용량이 7.9% 줄었다. 대신 변환이 프레임당 0.4초에서 2.4초로 늘어난다.
 *
 * 모바일 세트는 없다. 좁은 화면은 시퀀스를 재생하지 않고 reel(슬라이드 롤링)로 간다.
 */
const jobs = [
  {
    name: 'retina',
    width: 2560,
    height: 1440,
    avifQuality: 68,
    effort: 9,
    step: 1,
    minSource: 2560,
    sharpen: { sigma: 1.2, m1: 0, m2: 3 },
  },
  {
    name: 'desktop',
    width: 1920,
    height: 1080,
    avifQuality: 71,
    effort: 9,
    step: 1,
    sharpen: { sigma: 1.0, m1: 0, m2: 3 },
  },
];

const pad = (n) => String(n).padStart(4, '0');

async function pool(tasks, size) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (cursor < tasks.length) {
        const i = cursor;
        cursor += 1;
        await tasks[i]();
      }
    }),
  );
}

/** 한 시퀀스를 모든 해상도로 변환하고 manifest 항목을 만들어 돌려준다. */
async function convertSequence(sequence) {
  const src = `${ROOT}/${sequence.src}`;
  const files = listSource(src);

  if (!files.length) {
    console.error(`원본을 찾지 못했습니다: ${src}`);
    process.exit(1);
  }

  const source = await sharp(`${src}/${files[0]}`).metadata();
  console.log(
    `\n[${sequence.id}] 원본 ${files.length}장 · ${source.width}×${source.height} · ` +
      `${files[0]} … ${files.at(-1)}`,
  );

  const active = jobs.filter((job) => !job.minSource || source.width >= job.minSource);
  for (const job of jobs.filter((j) => !active.includes(j))) {
    console.log(`  ${job.name} 건너뜀: 원본 가로가 ${job.minSource}px 미만입니다.`);
    // 원본이 작아졌다면 예전 고해상도 세트가 남아 잘못 선택되지 않도록 지운다.
    rmSync(`${SITE}/frames/${sequence.id}/${job.name}`, { recursive: true, force: true });
  }

  // jobs 에서 빠진 세트(예전 mobile)가 디스크에 남아 있으면 지운다.
  // 매니페스트에는 안 적히지만 용량은 그대로 차지한다.
  const seqDir = `${SITE}/frames/${sequence.id}`;
  if (existsSync(seqDir)) {
    for (const entry of readdirSync(seqDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || jobs.some((j) => j.name === entry.name)) continue;
      console.log(`  더 이상 쓰지 않는 세트 삭제: ${entry.name}`);
      rmSync(`${seqDir}/${entry.name}`, { recursive: true, force: true });
    }
  }

  console.log('  움직임 측정 중…');
  const motion = await motionSeries(src, files);

  const sets = {};

  for (const job of active) {
    const outDir = `${SITE}/frames/${sequence.id}/${job.name}`;
    // 이전 시퀀스가 더 길었을 경우 남은 프레임이 섞이지 않도록 비우고 시작한다.
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const picked = files.filter((_, i) => i % job.step === 0);
    const sizes = Object.fromEntries(formats.map((f) => [f.ext, new Array(picked.length).fill(0)]));

    const tasks = picked.map((file, i) => async () => {
      let pipe = sharp(`${src}/${file}`).resize(job.width, job.height, { fit: 'cover' });
      if (job.sharpen) pipe = pipe.sharpen(job.sharpen);

      // 그레이딩은 픽셀을 직접 만져야 해서 한 번 raw 로 내린다.
      // 샤프닝을 먼저 거는 이유는, 대비를 올린 뒤 샤프닝하면 헤일로가 더 두드러지기 때문.
      const { data, info } = await pipe.removeAlpha().raw().toBuffer({ resolveWithObject: true });
      // 클립 맞추기가 먼저다. 출발점을 맞춰 놓아야 뒤따르는 공용 look 이 같은 결과를 낸다.
      applyMatch(data, sequence.match);
      applyGrade(data);

      const raw = { raw: { width: info.width, height: info.height, channels: 3 } };
      for (const format of formats) {
        // 삭제 대기 중인 이전 실행 파일이 목록에 남는 경우가 있어, 용량은 인코딩 결과에서 직접 받는다.
        const out = await format
          .encode(sharp(data, raw), job)
          .toFile(`${outDir}/frame_${pad(i + 1)}.${format.ext}`);
        sizes[format.ext][i] = out.size;
      }
    });

    await pool(tasks, 8);

    const pacing = buildPacing(motion, job.step, sequence.sections);

    sets[job.name] = {
      path: `frames/${sequence.id}/${job.name}/`,
      prefix: 'frame_',
      pad: 4,
      start: 1,
      count: picked.length,
      formats: formats.map((f) => f.ext),
      pacing: pacing && pacing.length === picked.length ? pacing : undefined,
    };

    for (const format of formats) {
      const list = sizes[format.ext];
      const total = list.reduce((sum, n) => sum + n, 0);
      console.log(
        `  ${job.name} ${format.ext.padEnd(4)}: ${picked.length}장 · ${(
          total /
          1024 /
          1024
        ).toFixed(2)}MB · 평균 ${(total / picked.length / 1024).toFixed(1)}KB · 최대 ${Math.round(
          Math.max(...list) / 1024,
        )}KB`,
      );
    }
  }

  return { id: sequence.id, sets };
}

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const targets = only.length ? SEQUENCES.filter((s) => only.includes(s.id)) : SEQUENCES;

if (!targets.length) {
  console.error(`대상 시퀀스가 없습니다. 사용 가능: ${SEQUENCES.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

// 일부만 변환할 때도 나머지 시퀀스 정보는 살려 둔다.
const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const kept = new Map((previous.sequences ?? []).map((s) => [s.id, s]));

for (const sequence of targets) {
  kept.set(sequence.id, await convertSequence(sequence));
}

const manifest = {
  sequences: SEQUENCES.map((s) => kept.get(s.id)).filter(Boolean),
};

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

for (const sequence of targets) {
  const desktop = manifest.sequences.find((s) => s.id === sequence.id)?.sets?.desktop;
  if (!desktop?.pacing) continue;
  console.log(`\n[${sequence.id}] 페이싱`);
  report(desktop.pacing, desktop.count, sequence.sections);
}

console.log('\nmanifest.json 갱신 완료');

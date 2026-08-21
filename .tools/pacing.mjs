/**
 * 스크롤 페이싱 계산기.
 *
 * 프레임마다 "스크롤을 얼마나 배분할지" 가중치를 정하고, 그 누적합을 manifest 의
 * pacing 배열로 내보낸다. 가중치가 크면 그 프레임을 지나는 데 스크롤이 더 필요하므로
 * 화면에서는 느리게 재생된다.
 *
 * 가중치는 두 단계로 만든다.
 *   1. 자동 - 프레임 간 실제 변화량을 재서 움직임이 큰 구간에 더 배분한다.
 *   2. 수동 - SECTIONS 의 speed 로 연출 의도를 덮어쓴다.
 */

import sharp from 'sharp';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CACHE = fileURLToPath(new URL('./.motion-cache.json', import.meta.url));

export const SOURCE_EXT = /\.(png|jpe?g|webp|tiff?)$/i;

/** 파일명 끝의 숫자를 기준으로 정렬한다. 자릿수가 안 맞아도(frame_9 → frame_10) 순서가 유지된다. */
export function frameNumber(name) {
  const match = name.replace(SOURCE_EXT, '').match(/(\d+)\D*$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function listSource(srcDir) {
  return readdirSync(srcDir)
    .filter((f) => SOURCE_EXT.test(f))
    .sort((a, b) => frameNumber(a) - frameNumber(b) || a.localeCompare(b));
}

/* ---------- 구간 정의 ---------- */

// 원본 프레임 번호(0-based) 기준. 컨택트 시트로 확인한 컷 경계.
// speed 1 보다 크면 느리게, 작으면 빠르게 지나간다. speed 를 적지 않으면 자동 페이싱에 맡긴다.

const MAIN_SECTIONS = [
  { name: '코인 정지', from: 0, to: 7 },
  { name: '동전 폭발', from: 8, to: 36, speed: 1.55 },
  { name: '워프', from: 37, to: 44 },
  { name: '성 등장', from: 45, to: 79, speed: 1.55 },
  { name: '성문 진입', from: 80, to: 91 },
  { name: '대홀 진입', from: 92, to: 123, speed: 0.55 },
  { name: '딜러 등장', from: 124, to: 144, speed: 2.4 },
  { name: '카드 딜링', from: 145, to: 179, speed: 1.65 },
  { name: '카드 뒤집기', from: 180, to: 203, speed: 3 },
  { name: '구름', from: 204, to: 212 },
  // 51장으로 가장 긴 구간이라 자동 페이싱에 맡기면 빠른 속도가 오래 지속된다.
  { name: '비행', from: 213, to: 263, speed: 1.45 },
];

// 1번 시퀀스 끝의 프로펠러기와 2번 시퀀스의 편대 사이를 메우는 다리.
const BRIDGE_SECTIONS = [{ name: '전환', from: 0, to: 21 }];

// 1번 시퀀스의 프로펠러기에서 그대로 이어져, 제트기를 거쳐 우주로 올라간다.
const ASCENT_SECTIONS = [
  { name: '편대 비행', from: 0, to: 6 },
  { name: '폭발', from: 7, to: 31, speed: 1.5 },
  { name: '엔진 클로즈업', from: 32, to: 47 },
  { name: '기체 전환', from: 48, to: 71, speed: 0.75 },
  { name: '제트 점화', from: 72, to: 95, speed: 1.6 },
  { name: '노즐 클로즈업', from: 96, to: 111, speed: 1.2 },
  { name: '제트 분사', from: 112, to: 127, speed: 0.9 },
  { name: '우주 진입', from: 128, to: 143, speed: 1.8 },
];

/**
 * 시퀀스 목록. 페이지에 붙는 순서대로 둔다.
 * src 는 blitzcrown-v2 기준 상대 경로, out 은 srolling/frames 아래 폴더 이름이다.
 *
 * match 는 원본 렌더의 톤이 시퀀스마다 다를 때 쓰는 클립 맞추기 계수다.
 * 공용 그레이딩 앞에서 걸린다. 값은 match-fit.mjs 로 뽑는다.
 */
export const SEQUENCES = [
  { id: 'main', src: '_source-frames', out: 'desktop', sections: MAIN_SECTIONS },
  {
    id: 'bridge',
    src: '_source-frames-bridge',
    out: 'bridge',
    sections: BRIDGE_SECTIONS,
    // 이 클립만 그림자가 눌린 채로 렌더돼서 이음매에서 화면이 어둡게 꺼졌다.
    // 검정 수준을 앞뒤 시퀀스에 맞춰 들어 올린다.
    match: { gain: [0.9154, 0.9259, 1], lift: [15.4, 13.33, 11] },
  },
  { id: 'ascent', src: '_source-frames-2', out: 'ascent', sections: ASCENT_SECTIONS },
];

export const SECTIONS = MAIN_SECTIONS;

export function sequenceById(id) {
  const hit = SEQUENCES.find((s) => s.id === id);
  if (!hit) throw new Error(`알 수 없는 시퀀스: ${id}`);
  return hit;
}

/* ---------- 자동 페이싱 파라미터 ---------- */

const MOTION_W = 160;
const MOTION_H = 90;
// 하드컷은 "움직임"이 아니라 장면 전환이다. 여기에 스크롤을 몰아주면 오히려 어색해진다.
const WEIGHT_MIN = 0.45;
const WEIGHT_MAX = 2.4;
// 0 이면 완전 균일, 1 이면 측정값 그대로. 구간 내부의 강약에만 관여한다.
const PACING_STRENGTH = 0.5;
// 구간 경계에서 속도가 뚝 끊기면 스크롤이 걸리는 느낌이 난다. 이 프레임 수만큼 걸쳐 갈아탄다.
const BLEND_RADIUS = 4;

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export function speedAt(frame, sections = SECTIONS) {
  const hit = sections.find((s) => frame >= s.from && frame <= s.to);
  return hit?.speed ?? 1;
}

/**
 * 구간마다 평균이 1이 되도록 자동 가중치를 눌러 맞춘다.
 *
 * 이 과정이 없으면 움직임이 적은 구간은 자동 가중치가 낮게 깔려서, "느리게" 로 지정해도
 * 결국 평범한 속도로 지나가 버린다. 정규화하고 나면 구간의 총 길이는 speed 가 온전히
 * 결정하고, 자동 가중치는 구간 안에서 어느 프레임에 더 머물지만 정한다.
 */
function normalizeWithinSections(weights, step, sections) {
  for (const s of sections) {
    const from = Math.ceil(s.from / step);
    const to = Math.min(Math.floor(s.to / step), weights.length - 1);
    if (to < from) continue;

    let sum = 0;
    for (let i = from; i <= to; i += 1) sum += weights[i];
    const mean = sum / (to - from + 1);
    if (mean <= 0) continue;

    for (let i = from; i <= to; i += 1) weights[i] /= mean;
  }
  return weights;
}

/** 박스 블러 두 번. 계단처럼 끊기는 값을 완만한 경사로 바꾼다. */
function smooth(values, radius) {
  let cur = values;
  for (let pass = 0; pass < 2; pass += 1) {
    const out = new Array(cur.length);
    for (let i = 0; i < cur.length; i += 1) {
      let sum = 0;
      let n = 0;
      for (let k = -radius; k <= radius; k += 1) {
        sum += cur[clamp(i + k, 0, cur.length - 1)];
        n += 1;
      }
      out[i] = sum / n;
    }
    cur = out;
  }
  return cur;
}

/**
 * 프레임 간 변화량 측정. 원본 장수가 그대로면 캐시를 쓴다.
 * 측정에만 10초 넘게 걸려서 페이싱만 손볼 때 매번 다시 재면 느리다.
 */
export async function motionSeries(srcDir, files) {
  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
  // 시퀀스가 여러 개라 원본 폴더별로 따로 담아 둔다.
  const key = srcDir;
  const hit = cache[key];
  if (hit && hit.count === files.length && hit.first === files[0]) return hit.series;

  const series = [];
  let prev = null;
  for (const file of files) {
    const { data } = await sharp(`${srcDir}/${file}`)
      .resize(MOTION_W, MOTION_H)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (prev) {
      let sum = 0;
      for (let p = 0; p < data.length; p += 1) sum += Math.abs(data[p] - prev[p]);
      series.push(sum / data.length);
    }
    prev = data;
  }

  cache[key] = { count: files.length, first: files[0], series };
  writeFileSync(CACHE, JSON.stringify(cache));
  return series;
}

/**
 * 프레임별 변화량을 누적 분포로 바꾼다.
 * 반환값 cum[i] 는 "i번 프레임이 놓이는 스크롤 위치(0~1)".
 *
 * @param {number[]} motion 원본 기준 프레임 간 변화량
 * @param {number} step 원본 몇 장당 한 장을 쓰는지
 * @param {object[]} sections 구간 정의
 */
export function buildPacing(motion, step, sections = SECTIONS) {
  // step 이 2면 원본 두 장의 변화량을 합쳐 한 구간으로 본다.
  const merged = [];
  for (let i = 0; i + step <= motion.length; i += step) {
    let sum = 0;
    for (let k = 0; k < step; k += 1) sum += motion[i + k];
    merged.push(sum);
  }
  if (!merged.length) return null;

  const avg = merged.reduce((a, b) => a + b, 0) / merged.length;
  const auto = normalizeWithinSections(
    merged.map((m) => {
      const rel = clamp(m / avg, WEIGHT_MIN, WEIGHT_MAX);
      return 1 + (rel - 1) * PACING_STRENGTH;
    }),
    step,
    sections,
  );

  // 수동 배속은 경계를 문질러서 적용한다.
  const manual = smooth(
    merged.map((_, i) => speedAt(i * step, sections)),
    Math.max(1, Math.round(BLEND_RADIUS / step)),
  );

  const weights = auto.map((w, i) => w * manual[i]);

  const total = weights.reduce((a, b) => a + b, 0);
  const cum = [0];
  let acc = 0;
  for (const w of weights) {
    acc += w;
    cum.push(Number((acc / total).toFixed(5)));
  }
  cum[cum.length - 1] = 1;
  return cum;
}

/** 구간별로 스크롤이 어떻게 나뉘었는지 표로 찍는다. */
export function report(cum, count, sections = SECTIONS) {
  const at = (frame) => cum[clamp(frame, 0, cum.length - 1)];

  console.log('\n구간          지정    프레임비중  스크롤비중   결과');
  for (const s of sections) {
    const frameShare = (s.to - s.from + 1) / count;
    const scrollShare = at(s.to + 1) - at(s.from);
    const ratio = scrollShare / frameShare;
    const want = s.speed ? (s.speed > 1 ? '느리게' : '빠르게') : '자동';
    const got = ratio > 1.08 ? '느리게' : ratio < 0.92 ? '빠르게' : '보통';
    console.log(
      `${s.name.padEnd(12)}${want.padEnd(8)}${(frameShare * 100).toFixed(1).padStart(7)}%${(
        scrollShare * 100
      )
        .toFixed(1)
        .padStart(10)}%   ${ratio.toFixed(2)}x ${got}`,
    );
  }
}

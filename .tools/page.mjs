/**
 * 브라우저 진단 도구들이 공유하는 준비 과정.
 *
 * 페이지를 띄우고, 모든 시퀀스 엔진이 붙을 때까지 기다리고, 정확한 위치로 스크롤한다.
 * 각 도구가 이걸 따로 들고 있으면 마크업이 바뀔 때마다 여기저기서 조용히 멈춘다.
 */

import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

export const URL = 'http://127.0.0.1:4321/';
export const OUT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/.tools/shots';
export const TIMEOUT = 180000;

mkdirSync(OUT, { recursive: true });

/**
 * @param {{width?:number, height?:number, dpr?:number, mobile?:boolean}} viewport
 * @returns {Promise<{browser:import('puppeteer-core').Browser, page:import('puppeteer-core').Page, errors:string[]}>}
 */
export async function open({ width = 1440, height = 900, dpr = 1, mobile = false } = {}) {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'new',
    args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: dpr, isMobile: mobile });

  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    // favicon 은 두지 않았다. 재생과 무관하므로 넘긴다.
    if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) {
      errors.push(`http ${r.status()}: ${r.url()}`);
    }
  });

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.classList.contains('ready'), { timeout: TIMEOUT });

  // 뒤 시퀀스는 앞 시퀀스를 다 받은 뒤에야 붙는다. 전 구간을 훑으려면 로딩이 끝나야 한다.
  // 못 붙은 시퀀스가 있어도 여기서 멈추지 않는다. 그 상태의 화면을 찍어 보는 것도 진단이므로,
  // 오류 목록에만 남기고 도구는 계속 진행한다.
  await page.waitForFunction(
    () => {
      const s = window.__sequence;
      // 붙은 엔진이 한 번씩은 그려 놔야 프레임 번호를 읽을 수 있다.
      return (s?.settled ?? false) && s.mounted.every((m, i) => !m || s.states[i]);
    },
    { timeout: TIMEOUT },
  );

  // 좁은 화면은 시퀀스를 쓰지 않으므로 "빠졌다"고 볼 게 없다.
  const missing = await page.evaluate(() =>
    window.__sequence.mode !== 'sequence'
      ? []
      : window.__sequence.list.filter((_, i) => !window.__sequence.mounted[i]).map((s) => s.id),
  );
  for (const id of missing) errors.push(`sequence missing: ${id}`);

  return { browser, page, errors };
}

/**
 * html { scroll-behavior: smooth } 때문에 scrollTo 는 곧바로 도착하지 않는다.
 * 위치가 멈출 때까지 기다린 다음, 감쇠 보간이 따라붙을 시간을 더 준다.
 */
export async function seek(page, y, settle = 420) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), Math.round(y));
  await page.waitForFunction(
    (v) =>
      Math.abs(window.scrollY - v) < 2 ||
      window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 2,
    { timeout: 5000 },
    Math.round(y),
  );
  await new Promise((r) => setTimeout(r, settle));
}

/** 시퀀스별 프레임 번호·진행도·교차 정도를 한 번에 읽는다. */
export function state(page) {
  return page.evaluate(() => {
    const s = window.__sequence;
    return {
      y: window.scrollY,
      frames: s.states.map((st) => (st ? st.frameIndex : -1)),
      counts: s.states.map((st) => (st ? st.frameCount : 0)),
      progress: s.progress.slice(),
      seam: s.seam.slice(),
      ids: s.list.map((q) => q.id),
    };
  });
}

/** 구간 자의 위치와 높이. 이음매 계산에 쓴다. */
export function layout(page) {
  return page.evaluate(() => {
    const ids = ['scene', 'scene2', 'scene3'];
    return {
      ranges: ids.map((id) => {
        const el = document.getElementById(id);
        return { id, top: el.offsetTop, height: el.offsetHeight };
      }),
      // 시퀀스가 끝나고 일반 문서가 시작되는 지점
      after: document.getElementById('release').offsetTop,
      vh: window.innerHeight,
      docHeight: document.documentElement.scrollHeight,
    };
  });
}

/**
 * 챕터 카피가 실제 폭 안에 들어가는지 잰다.
 *
 * .ch-title 은 <br> 로 줄을 직접 나눠 놓기 때문에, 한 줄이 상자보다 길면 그 줄만 조용히
 * 한 번 더 접힌다. 화면을 눈으로 보기 전에는 잘 안 보이고, 접힌 줄 때문에 아래 HUD 와
 * 겹치기 시작한다. 그래서 후보 문구를 넣어 보고 "의도한 줄 수" 와 "실제 줄 수" 를 비교한다.
 *
 *   bun run copy-fit.mjs            # index.html 에 들어 있는 카피를 검사
 *   bun run copy-fit.mjs draft.json # 후보 카피 파일을 검사
 *
 * draft.json 형식: [{ "label": "...", "title": "A<br />B", "body": "..." }, ...]
 */

import { readFileSync } from 'node:fs';
import { open } from './page.mjs';

const file = process.argv[2];
// 윈도우 편집기가 붙이는 BOM 은 JSON.parse 가 토큰으로 읽고 그대로 터진다.
const draft = file ? JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) : null;

const { browser, page, errors } = await open({ width: 1920, height: 1080 });

const rows = await page.evaluate((candidates) => {
  const host = document.querySelector('.chapter');
  const title = host.querySelector('.ch-title');
  const body = host.querySelector('.ch-body');
  const label = host.querySelector('.ch-label');

  // 측정하는 동안만 보이게 한다. opacity 0 이어도 레이아웃은 잡히지만,
  // data-align 을 바꿔 가며 재려면 실제로 그려진 상태가 안전하다.
  host.style.setProperty('--amount', '1');

  /** 텍스트 노드를 훑어 실제로 그려진 줄 상자를 센다. */
  const lineBoxes = (el) => {
    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const tops = [];
    let widest = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 1) continue;
        // 같은 줄에 걸친 여러 텍스트 노드(em 등)는 top 이 같다.
        const hit = tops.find((t) => Math.abs(t.top - r.top) < 4);
        if (hit) hit.width += r.width;
        else tops.push({ top: r.top, width: r.width });
      }
    }
    for (const t of tops) widest = Math.max(widest, t.width);
    return { lines: tops.length, widest };
  };

  const box = host.getBoundingClientRect().width;
  const out = [];

  const list =
    candidates ??
    [...document.querySelectorAll('.chapters .chapter')].map((c) => ({
      label: c.querySelector('.ch-label').textContent.trim(),
      title: c.querySelector('.ch-title').innerHTML,
      body: c.querySelector('.ch-body').textContent.trim(),
      align: c.dataset.align,
    }));

  for (const c of list) {
    label.lastChild.textContent = c.label;
    title.innerHTML = c.title;
    body.textContent = c.body;
    host.dataset.align = c.align ?? 'left';

    const intended = c.title.split(/<br\s*\/?>/i).length;
    const t = lineBoxes(title);
    const b = lineBoxes(body);

    out.push({
      label: c.label,
      box: Math.round(box),
      intended,
      lines: t.lines,
      widest: Math.round(t.widest),
      titleH: Math.round(title.getBoundingClientRect().height),
      bodyLines: b.lines,
      blockH: Math.round(host.getBoundingClientRect().height),
    });
  }

  return out;
}, draft);

const vh = 1080;
// 챕터는 top:44% 에서 위로 절반 올라간다. 아래쪽 HUD 상단이 대략 여기쯤이다.
const floor = vh * 0.44 + vh * 0.5 - 96;

console.log(`상자 폭 ${rows[0].box}px · 뷰포트 1920×${vh}\n`);
console.log('카피                 줄(의도/실제)  가장 긴 줄   제목높이  본문줄  블록높이');

let bad = 0;
for (const r of rows) {
  const wrapped = r.lines > r.intended;
  const bottom = vh * 0.44 + r.blockH / 2;
  const low = bottom > floor;
  if (wrapped || low) bad += 1;
  console.log(
    `${r.label.padEnd(20)} ${String(r.intended)}/${String(r.lines).padEnd(11)} ${String(
      r.widest,
    ).padStart(6)}px${r.widest > r.box ? ' ✗' : '  '} ${String(r.titleH).padStart(8)} ${String(
      r.bodyLines,
    ).padStart(6)} ${String(r.blockH).padStart(9)}${wrapped ? '  ← 줄이 접힘' : ''}${
      low ? '  ← HUD 와 겹칠 수 있음' : ''
    }`,
  );
}

console.log(bad ? `\n${bad}건 확인 필요` : '\n전부 의도한 줄 수 안에 들어갑니다');
for (const e of errors) console.log(e);

await browser.close();

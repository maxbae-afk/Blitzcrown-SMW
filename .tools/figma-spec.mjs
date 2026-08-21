/**
 * 실제로 렌더된 화면을 재료 삼아 Figma 로 옮길 도형 목록을 뽑는다.
 *
 * 손으로 좌표를 옮겨 적으면 어긋나기 때문에, 브라우저가 계산한 박스를 그대로 읽는다.
 * 결과는 figma-spec.json 으로 저장한다.
 *
 *   bun run serve.mjs      # 별도 터미널
 *   bun run figma-spec.mjs
 */

import { writeFileSync } from 'node:fs';
import { open } from './page.mjs';

const WIDTH = 1920;
const SECTIONS = [
  ['01 NEW RELEASE', '#release'],
  ['02 POPULAR GAMES', '#games'],
  ['03 WHAT WE BUILD', '#build'],
  ['04 OUR JOURNEY', '#journey'],
  ['MARQUEE', '.marquee'],
  ['05 NEWS', '#news'],
  ['06 PARTNERS', '#partners'],
  ['LEGAL TRUST', '#trust'],
  ['CONTACT CTA', '#contact'],
  ['FOOTER', '.foot'],
];

const { browser, page } = await open({ width: WIDTH, height: 1080 });

const spec = await page.evaluate((list) => {
  // 스크롤로 나타나는 요소들이 투명한 채로 잡히면 안 된다. 전부 드러낸 상태로 고정한다.
  const style = document.createElement('style');
  style.textContent = `.reveal{opacity:1!important;transform:none!important}
    *{transition:none!important;animation:none!important}`;
  document.head.appendChild(style);

  const px = (v) => Math.round(v * 100) / 100;

  /** rgb(a) 문자열을 0~1 채널로 바꾼다. 투명하면 null. */
  const color = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[,/]/).map((s) => parseFloat(s));
    if (!a) return null;
    return { r: px(r / 255), g: px(g / 255), b: px(b / 255), a: px(a) };
  };

  const same = (a, b) =>
    a && b && a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;

  const results = [];

  for (const [name, selector] of list) {
    const root = document.querySelector(selector);
    if (!root) continue;

    const base = root.getBoundingClientRect();
    const originX = base.left + window.scrollX;
    const originY = base.top + window.scrollY;
    const items = [];

    const walk = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;

      const r = el.getBoundingClientRect();
      const x = px(r.left + window.scrollX - originX);
      const y = px(r.top + window.scrollY - originY);
      const w = px(r.width);
      const h = px(r.height);

      if (w > 0 && h > 0) {
        const bg = color(cs.backgroundColor);
        // 섹션 자체의 배경은 프레임 색으로 쓰므로 도형으로 또 만들지 않는다.
        if (bg && el !== root) {
          items.push({ kind: 'box', name: label(el), x, y, w, h, fill: bg });
        }

        // 테두리는 변마다 얇은 사각형으로 옮긴다. 네 변이 같으면 한 번에 처리한다.
        const sides = [
          ['Top', 'borderTopWidth', 'borderTopColor', x, y, w, null],
          ['Bottom', 'borderBottomWidth', 'borderBottomColor', x, null, w, null],
          ['Left', 'borderLeftWidth', 'borderLeftColor', x, y, null, h],
          ['Right', 'borderRightWidth', 'borderRightColor', null, y, null, h],
        ];
        const widths = sides.map((s) => parseFloat(cs[s[1]]) || 0);
        const colors = sides.map((s) => color(cs[s[2]]));
        const uniform =
          widths.every((v) => v === widths[0] && v > 0) &&
          colors.every((c) => same(c, colors[0]));

        if (uniform) {
          items.push({
            kind: 'box',
            name: `${label(el)} border`,
            x,
            y,
            w,
            h,
            fill: null,
            stroke: colors[0],
            strokeWeight: widths[0],
          });
        } else {
          widths.forEach((bw, i) => {
            if (!bw || !colors[i]) return;
            const side = sides[i][0];
            const rect =
              side === 'Top'
                ? { x, y, w, h: bw }
                : side === 'Bottom'
                  ? { x, y: px(y + h - bw), w, h: bw }
                  : side === 'Left'
                    ? { x, y, w: bw, h }
                    : { x: px(x + w - bw), y, w: bw, h };
            items.push({ kind: 'box', name: `${label(el)} ${side}`, ...rect, fill: colors[i] });
          });
        }
      }

      // 글자는 가장 안쪽 요소에서만 가져온다. 부모까지 가져오면 같은 글자가 두 번 그려진다.
      // <br> 로 나뉜 조각은 각각 별개의 텍스트 노드다. 노드마다 따로 줄을 잘라야
      // 가운데 줄이 통째로 빠지지 않는다.
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;

        const range = document.createRange();
        range.selectNodeContents(node);
        const lines = Array.from(range.getClientRects()).filter(
          (r) => r.width >= 1 && r.height >= 1,
        );
        range.detach();
        if (!lines.length) continue;

        // 한 줄이면 원문 그대로, 여러 줄이면 화면에서 접힌 위치대로 잘라 담는다.
        const texts =
          lines.length > 1
            ? splitByLines(node, lines.length)
            : [node.textContent.replace(/\s+/g, ' ').trim()];

        lines.forEach((rect, i) => {
          const t = texts[i];
          if (!t) return;
          items.push({
            kind: 'text',
            name: label(el),
            text: t,
            x: px(rect.left + window.scrollX - originX),
            y: px(rect.top + window.scrollY - originY),
            w: px(rect.width),
            h: px(rect.height),
            size: px(parseFloat(cs.fontSize)),
            weight: Number(cs.fontWeight) || 400,
            spacing: cs.letterSpacing === 'normal' ? 0 : px(parseFloat(cs.letterSpacing)),
            mono: cs.fontFamily.toLowerCase().includes('mono'),
            upper: cs.textTransform === 'uppercase',
            fill: color(cs.color),
          });
        });
      }

      for (const child of el.children) walk(child);
    };

    /** 줄 개수에 맞춰 글자를 나눈다. 브라우저가 어디서 접었는지 한 글자씩 다시 재 본다. */
    function splitByLines(node, count) {
      const text = node.textContent;
      const range = document.createRange();
      const out = [];
      let start = 0;
      let line = 0;

      for (let i = 1; i <= text.length; i += 1) {
        range.setStart(node, start);
        range.setEnd(node, i);
        const count = range.getClientRects().length;
        if (count > line + 1) {
          out.push(text.slice(start, i - 1).trim());
          start = i - 1;
          line += 1;
        }
      }
      out.push(text.slice(start).trim());
      range.detach();
      return out.filter(Boolean).slice(0, count);
    }

    function label(el) {
      const cls = String(el.className || '').split(' ')[0];
      return cls || el.tagName.toLowerCase();
    }

    walk(root);

    results.push({
      name,
      selector,
      width: px(base.width),
      height: px(base.height),
      top: px(originY),
      background: color(getComputedStyle(root).backgroundColor),
      items,
    });
  }

  return results;
}, SECTIONS);

let total = 0;
for (const s of spec) {
  total += s.items.length;
  console.log(`${s.name.padEnd(18)} ${String(s.height).padStart(7)}px   도형 ${s.items.length}개`);
}
console.log(`\n총 높이 ${spec.reduce((a, s) => a + s.height, 0)}px · 도형 ${total}개`);

writeFileSync(
  new URL('figma-spec.json', import.meta.url),
  JSON.stringify(spec, null, 2),
);
console.log('figma-spec.json 저장');

await browser.close();

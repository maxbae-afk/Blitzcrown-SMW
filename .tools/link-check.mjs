/**
 * 페이지끼리 거는 링크가 실제 파일을 가리키는지 본다.
 * 페이지가 늘어날수록 오타 하나가 조용히 남는다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run link-check.mjs
 */

import { readdirSync, existsSync } from 'node:fs';

const SITE = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling';
const pages = readdirSync(SITE).filter((f) => f.endsWith('.html'));

let bad = 0;

for (const page of pages) {
  const html = await Bun.file(`${SITE}/${page}`).text();

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(https?:|data:|mailto:|#)/.test(value)) continue;

    const file = value.split('#')[0].split('?')[0];
    if (!file) continue;

    if (!existsSync(`${SITE}/${file}`)) {
      console.log(`없음  ${page} -> ${value}`);
      bad += 1;
    }
  }
}

console.log(bad ? `깨진 링크 ${bad}개` : `깨진 링크 없음 (${pages.length}개 페이지 확인)`);

/**
 * 브라우저에서 잰 레이아웃(figma-spec.json)을 Figma 플러그인으로 보낸다.
 * MCP 를 한 도형씩 부르면 335번이라, 소켓에 직접 붙여 같은 채널로 밀어 넣는다.
 *
 *   bun run figma-draw.mjs
 */

import { readFileSync } from 'node:fs';

const CHANNEL = 'u0afzadm';
const SOCKET = 'ws://127.0.0.1:3055';
const SPEC = JSON.parse(readFileSync(new URL('figma-spec.json', import.meta.url), 'utf8'));

const PAGE_X = 5800;
const PAGE_Y = 3378;
const PAGE_W = 1920;
const PAGE_H = Math.ceil(SPEC.reduce((sum, s) => sum + s.height, 0));

const pending = new Map();
let currentChannel = null;

const ws = new WebSocket(SOCKET);

function send(command, params = {}, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) {
      reject(new Error('소켓이 닫혀 있습니다.'));
      return;
    }
    const id = crypto.randomUUID();
    const request = {
      id,
      type: command === 'join' ? 'join' : 'message',
      channel: command === 'join' ? params.channel : currentChannel,
      message: { id, command, params: { ...params, commandId: id } },
    };
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${command} 시간 초과`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify(request));
  });
}

ws.addEventListener('message', (event) => {
  const payload = JSON.parse(String(event.data));
  const message = payload.message ?? payload;
  const id = message.id ?? payload.id;
  if (!id || !pending.has(id)) return;
  const { resolve, reject, timeout } = pending.get(id);
  pending.delete(id);
  clearTimeout(timeout);
  if (message.error) reject(new Error(message.error));
  else resolve(message.result ?? message);
});

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

await send('join', { channel: CHANNEL });
currentChannel = CHANNEL;
console.log(`채널 ${CHANNEL} 연결`);

const nodeId = (result) => result?.id ?? result?.nodeId ?? result?.node?.id;

const page = await send('create_frame', {
  x: PAGE_X,
  y: PAGE_Y,
  width: PAGE_W,
  height: PAGE_H,
  name: 'BLITZCROWN / Home / Below Sequence / Desktop 1920',
  fillColor: { r: 0.02, g: 0.027, b: 0.031, a: 1 },
});
const pageId = nodeId(page);
if (!pageId) throw new Error(`페이지 프레임 id 없음: ${JSON.stringify(page)}`);
console.log(`페이지 ${pageId}  ${PAGE_W}×${PAGE_H}`);

let y = 0;
let drawn = 0;
let failed = 0;

for (const section of SPEC) {
  const height = Math.round(section.height);
  const bg = section.background ?? { r: 0.03, g: 0.04, b: 0.04, a: 1 };
  const frame = await send('create_frame', {
    x: 0,
    y,
    width: PAGE_W,
    height,
    name: section.name,
    parentId: pageId,
    fillColor: bg,
  });
  const sectionId = nodeId(frame);
  if (!sectionId) {
    console.log(`섹션 실패 ${section.name}`);
    failed += 1;
    y += height;
    continue;
  }

  for (const item of section.items) {
    try {
      if (item.kind === 'box') {
        const params = {
          x: item.x,
          y: item.y,
          width: Math.max(item.w, 1),
          height: Math.max(item.h, 1),
          name: item.name,
          parentId: sectionId,
        };
        if (item.fill) params.fillColor = item.fill;
        if (item.stroke) {
          params.strokeColor = item.stroke;
          params.strokeWeight = item.strokeWeight || 1;
        }
        await send('create_frame', params);
      } else if (item.kind === 'text') {
        await send('create_text', {
          x: item.x,
          y: item.y,
          text: item.text,
          fontSize: item.size || 14,
          fontWeight: item.weight >= 700 ? 700 : item.weight >= 500 ? 600 : 400,
          fontColor: item.fill || { r: 0.95, g: 0.97, b: 0.96, a: 1 },
          name: item.name,
          parentId: sectionId,
        });
      }
      drawn += 1;
    } catch (error) {
      failed += 1;
      console.log(`  실패 ${item.name}: ${error.message}`);
    }
  }

  y += height;
  console.log(`${section.name.padEnd(18)} 도형 ${section.items.length}개`);
}

await send('set_focus', { nodeId: pageId }).catch(() => {});
console.log(`\n완료  그린 ${drawn}개 · 실패 ${failed}개`);
ws.close();

/**
 * 관리자 비밀번호를 바꾼다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run set-admin-pass.mjs 새비밀번호
 *
 * 비밀번호 자체는 어디에도 적지 않는다. SHA-256 만 admin-gate.js 에 들어간다.
 * 그래도 해시는 공개 저장소에 올라가므로, 짧거나 흔한 말은 대조표로 금방 풀린다.
 * 아래에서 그런 비밀번호는 받지 않는다.
 *
 * 이 가림막이 막아 주는 것은 지나가다 눌러 보는 사람까지다.
 * 배포된 사이트에서는 관리자로 들어가도 브라우저 안에만 남는 임시 저장뿐이고,
 * 실제 파일을 고치는 것은 내 컴퓨터에서 관리자 서버를 켰을 때뿐이다.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const GATE = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling/js/admin-gate.js';

const password = process.argv[2];

if (!password) {
  console.error('쓰는 법: bun run set-admin-pass.mjs 새비밀번호');
  process.exit(1);
}

/* 해시가 공개되는 전제라 여기서 한 번 걸러 준다. */
const WEAK = ['crown-2026', 'password', 'admin', 'blitzcrown', '1234', 'qwerty'];

if (password.length < 12) {
  console.error(`너무 짧습니다 (${password.length}자). 12자 이상으로 두세요.`);
  process.exit(1);
}

if (WEAK.some((w) => password.toLowerCase().includes(w))) {
  console.error('흔한 말이 들어 있습니다. 대조표로 바로 풀리니 다른 말로 두세요.');
  process.exit(1);
}

const hasher = new Bun.CryptoHasher('sha256');
hasher.update(password);
const hash = hasher.digest('hex');

const before = readFileSync(GATE, 'utf8');
const after = before.replace(/export const PASS_HASH = '[0-9a-f]{64}';/, `export const PASS_HASH = '${hash}';`);

if (after === before) {
  console.error('admin-gate.js 에서 PASS_HASH 줄을 찾지 못했습니다. 파일이 바뀐 것 같습니다.');
  process.exit(1);
}

writeFileSync(GATE, after, 'utf8');

console.log('바꿨습니다. 해시', `${hash.slice(0, 12)}…`);
console.log('이미 열어 둔 관리자 탭이 있으면 닫았다 다시 들어가세요.');

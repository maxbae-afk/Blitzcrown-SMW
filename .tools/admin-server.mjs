/**
 * 관리자 서버.
 *
 * serve.mjs 와 똑같이 srolling/ 을 띄우되, 관리자 페이지가 부를 API 를 더 얹는다.
 * 이걸 켜고 admin.html 에 들어가면 고친 내용이 실제 파일(games.data.js, news.data.js)에 바로 저장된다.
 * 안 켜져 있으면 관리자 페이지는 브라우저 임시 저장으로 넘어간다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run admin-server.mjs        # http://127.0.0.1:4321
 *
 * 127.0.0.1 에만 붙이므로 같은 공유기 안의 다른 기기도 접근하지 못한다.
 * x-admin-key 는 그 위에 얹은 실수 방지용이지 보안 장치가 아니다.
 * 값이 브라우저 코드에 들어 있어 마음먹고 보면 누구나 읽을 수 있다.
 */

import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling';
const JS = `${ROOT}/js`;
const PORT = Number(process.argv[2] ?? 4321);

/** js/admin-gate.js 의 PASS_HASH 와 같아야 한다. 비밀번호를 바꾸면 둘 다 바꾼다. */
const KEY = 'f18cac4952fc553e4f09c2539530e98996f653d80fd6ae3b7eced261ce6b79bf';

const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  avif: 'image/avif',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': TYPES.json, 'cache-control': 'no-store' },
  });

const banner = (what) => `/*
  ${what} 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.

  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.
  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.
*/

`;

/*
  자료 파일을 글자로 읽어 배열만 떼어낸다.

  import() 를 쓰면 저장한 직후에도 옛 값이 돌아온다. 주소에 ?t= 를 붙여도 마찬가지다.
  모듈 캐시가 물음표 뒤를 무시하기 때문이다. 그래서 파일을 그냥 읽는다.
  형식은 우리가 쓰는 것이라("export const X = [ ... ];") 이렇게 잘라도 안전하다.
*/
async function readArray(file) {
  const text = await Bun.file(`${JS}/${file}`).text();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < 0) throw new Error(`${file} 에서 배열을 찾지 못했다`);
  return JSON.parse(text.slice(start, end + 1));
}

const readData = async () => ({
  games: await readArray('games.data.js'),
  news: await readArray('news.data.js'),
});

async function writeData({ games, news }, { force = false } = {}) {
  if (!Array.isArray(games) || !Array.isArray(news)) throw new Error('games 와 news 는 배열이어야 한다');
  if (!games.length || !news.length) throw new Error('빈 배열로 덮어쓰지 않는다');

  /*
    한 번에 절반 넘게 사라지는 저장은 막는다.
    관리자 화면에서 그런 일이 생기려면 한 항목씩 여러 번 지워야 하고, 그때는 저장도 여러 번 한다.
    한 요청에 통째로 줄어드는 건 실수이거나 잘못 만든 요청이다.
    실제로 이 도구를 시험하다 자료 파일 두 개를 통째로 날린 적이 있어서 넣어 둔 빗장이다.
  */
  if (!force) {
    const now = await readData();
    const shrink = [
      ['games', now.games.length, games.length],
      ['news', now.news.length, news.length],
    ].find(([, before, after]) => before >= 4 && after < before / 2);

    if (shrink) {
      const [what, before, after] = shrink;
      throw new Error(
        `${what} 가 ${before}개에서 ${after}개로 줄어듭니다. 일부러 그런 것이면 ?force=1 을 붙이세요.`,
      );
    }
  }

  await writeFile(
    `${JS}/games.data.js`,
    `${banner('게임')}export const GAMES = ${JSON.stringify(games, null, 2)};\n`,
    'utf8',
  );
  await writeFile(
    `${JS}/news.data.js`,
    `${banner('뉴스')}export const ARTICLES = ${JSON.stringify(news, null, 2)};\n`,
    'utf8',
  );
}

const safeName = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';

/*
  게임 썸네일은 한 벌이면 된다. 카드가 화면에서 400px 안쪽이라 1200px 이면 고해상도 화면에서도 남는다.
  뉴스는 news-image.js 가 세 벌을 골라 쓰므로 같은 이름으로 세 벌을 만든다.
*/
async function saveGameImage(buffer, name) {
  mkdirSync(`${ROOT}/assets/games`, { recursive: true });
  const file = `assets/games/${name}.webp`;
  await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true, kernel: 'lanczos3' })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(`${ROOT}/${file}`);
  return { src: file };
}

async function saveNewsImage(buffer, name) {
  mkdirSync(`${ROOT}/assets/news`, { recursive: true });
  const base = `assets/news/${name}`;
  const tiers = [
    { suffix: '-sm', width: 520 },
    { suffix: '', width: 1360 },
    { suffix: '-2x', width: 2048 },
  ];

  for (const { suffix, width } of tiers) {
    await sharp(buffer)
      .resize({ width, withoutEnlargement: false, kernel: 'lanczos3' })
      .sharpen({ sigma: 0.7, m1: 0.4, m2: 0.9 })
      .webp({ quality: 88, effort: 6, smartSubsample: true })
      .toFile(`${ROOT}/${base}${suffix}.webp`);
  }
  return { base };
}

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(req) {
    const url = new URL(req.url);
    const path = decodeURIComponent(url.pathname);

    if (path.startsWith('/api/')) {
      // 읽기는 열어 두고 쓰기만 열쇠를 본다. 어차피 같은 자료가 사이트에도 실려 있다.
      const writing = req.method !== 'GET';
      if (writing && req.headers.get('x-admin-key') !== KEY) {
        return json({ error: '열쇠가 맞지 않습니다.' }, 401);
      }

      try {
        if (path === '/api/ping') return json({ ok: true });

        if (path === '/api/data' && req.method === 'GET') return json(await readData());

        if (path === '/api/data' && req.method === 'PUT') {
          await writeData(await req.json(), { force: url.searchParams.get('force') === '1' });
          return json({ ok: true, savedAt: new Date().toISOString() });
        }

        if (path === '/api/upload' && req.method === 'POST') {
          const form = await req.formData();
          const file = form.get('file');
          if (!(file instanceof File)) return json({ error: '파일이 없습니다.' }, 400);

          const buffer = Buffer.from(await file.arrayBuffer());
          const name = safeName(form.get('name') || file.name.replace(/\.[^.]+$/, ''));
          const kind = form.get('kind');
          return json(
            kind === 'news' ? await saveNewsImage(buffer, name) : await saveGameImage(buffer, name),
          );
        }

        return json({ error: '없는 주소입니다.' }, 404);
      } catch (error) {
        return json({ error: String(error.message ?? error) }, 500);
      }
    }

    // 종류는 실제로 보내는 파일 이름에서 고른다.
    // 넘어온 주소로 고르면 "/" 는 확장자가 없어 내려받기 파일이 되고, 브라우저가 화면을 열지 않는다.
    const name = path.endsWith('/') ? `${path}index.html` : path;
    const file = Bun.file(`${ROOT}${name}`);
    if (!(await file.exists())) return new Response('not found', { status: 404 });

    return new Response(file, {
      headers: {
        'content-type': TYPES[name.split('.').pop().toLowerCase()] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      },
    });
  },
});

console.log(`관리자 서버 http://127.0.0.1:${PORT}  (관리자 화면: /admin.html)`);

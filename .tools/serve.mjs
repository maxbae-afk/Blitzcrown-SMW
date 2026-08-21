/**
 * srolling/ 을 정적으로 띄우는 개발 서버.
 * bunx serve 캐시가 깨지는 일이 잦아 필요한 만큼만 직접 만든다.
 *
 *   cd blitzcrown-v2/.tools
 *   bun run serve.mjs          # http://127.0.0.1:4321
 */

const ROOT = 'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling';
const PORT = Number(process.argv[2] ?? 4321);

const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  avif: 'image/avif',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
};

Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path.endsWith('/')) path += 'index.html';

    const file = Bun.file(`${ROOT}${path}`);
    if (!(await file.exists())) return new Response('not found', { status: 404 });

    const ext = path.split('.').pop().toLowerCase();
    return new Response(file, {
      headers: {
        'content-type': TYPES[ext] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      },
    });
  },
});

console.log(`http://127.0.0.1:${PORT}`);

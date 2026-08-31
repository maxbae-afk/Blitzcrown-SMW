import { GAMES as PUBLISHED } from './games.data.js';
import { overlay } from './store.js';

/*
  홈·목록·상세·헤더 패널이 함께 읽는 유일한 게임 자료.

  값은 games.data.js 에 있고 이 파일은 규칙과 도우미만 갖는다.
  관리자 페이지가 저장할 때 자료 파일만 통째로 다시 쓰기 때문이다.

  값이 아직 확정되지 않았으면 지어내지 않고 null 로 둔다.
  null 은 화면에서 CONTENT REQUIRED 로 표시된다. 홈의 연혁·뉴스와 같은 규칙이다.
  RTP·최대 배수·변동성처럼 규제 검수를 거쳐야 하는 숫자가 특히 여기에 해당한다.

  pending: true 는 제목과 소개가 아직 확정되지 않았다는 뜻이다.
  games.html 아래쪽 표시가 이 값을 세어 몇 개가 미확정인지 알리고,
  헤더의 PLAY DEMO 패널은 이런 게임을 아예 보여 주지 않는다.

  image 를 두면 카드·레일·헤더 패널이 자리표 대신 그 사진을 쓴다.
  없으면 지금까지처럼 [IMAGE] 자리표가 나온다.

    image: { src: 'assets/uploads/smash-tower.png', alt: 'Smash Tower key art' }

  demo 는 공식 사이트의 안내 페이지, embed 는 게임이 실제로 돌아가는 주소다.
  안내 페이지는 연령 확인이 앞에 걸려 있어 페이지 안에 넣을 수 없으므로 둘을 따로 둔다.
  embed 가 있으면 데모를 페이지 안에서 열고, 없으면 지금까지처럼 새 탭으로 넘긴다.
  주소 목록은 저장소 뿌리의 DEMO_LINKS.md 에 있다.

  media 는 상세 페이지의 스크린샷 자리다. 실제 파일이 오기 전까지 src 를 null 로 둔다.

    { type: 'image', src: 'assets/games/smash-tower/key-art.jpg', label: 'KEY ART' }
    { type: 'video', src: 'assets/games/smash-tower/loop.mp4', poster: '...', label: 'GAMEPLAY' }
*/

/** @typedef {{ src: string, alt?: string }} Thumb */
/** @typedef {{ type: 'image' | 'video', src: string | null, poster?: string | null, label: string, note?: string }} Media */
/** @typedef {{ slug: string, title: string, badge: string | null, category: string, pending?: boolean,
 *              premise: string, summary: string, demo: string | null, embed?: string | null, image?: Thumb,
 *              media: Media[], meta: [string, string | null][], specs: [string, string | null][] }} Game */

/** @type {Game[]} */
export const GAMES = overlay('games', PUBLISHED);

export const GAME_CATEGORIES = ['ALL', 'PLINKO', 'CRASH', 'MINE', 'OTHER'];

/*
  지원 사양은 게임별로 다르지 않으므로 한 벌만 둔다.
  아래 언어·통화·관할은 검토용 더미다. 실제로 확정된 목록이 아니다.
*/
export const PLATFORM = [
  ['DEVICES', 'DESKTOP · MOBILE · TABLET'],
  ['ORIENTATION', 'PORTRAIT · LANDSCAPE'],
  ['INTEGRATION', 'SINGLE API'],
  ['LANGUAGES', 'EN · KO · JA · ZH · ES · PT · DE'],
  ['CURRENCIES', 'EUR · USD · GBP · KRW · JPY · BRL'],
  ['JURISDICTIONS', 'MALTA · ROMANIA · ONTARIO'],
];

export const findGame = (slug) => GAMES.find((game) => game.slug === slug) || GAMES[0];

/*
  뱃지 색.
  NEW 와 POPULAR 는 눈에 띄라고 다는 것이고, BETA 는 아직 검수 중이라는 표시다.
  둘을 같은 민트로 두면 시험판을 추천작으로 읽는다. 그래서 BETA 만 회색으로 뺀다.
*/
export const badgeTone = (badge) => (badge === 'BETA' ? ' badge--beta' : '');

/** 상세 페이지의 자리표 문구. 새 게임을 만들 때 media 를 이걸로 채운다. */
export const mediaSlots = (name) =>
  [
    { type: 'image', src: null, label: 'KEY ART', note: '16:9 · full-bleed key visual' },
    { type: 'video', src: null, poster: null, label: 'GAMEPLAY', note: '16:9 · loop, no audio' },
    { type: 'image', src: null, label: 'SCREENSHOT 01', note: '16:9 · in-game capture' },
    { type: 'image', src: null, label: 'SCREENSHOT 02', note: '16:9 · win moment' },
  ].map((item) => ({ ...item, label: `${name} · ${item.label}` }));

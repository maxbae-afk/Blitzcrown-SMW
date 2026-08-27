import { ARTICLES as PUBLISHED } from './news.data.js';
import { overlay } from './store.js';

/*
  홈의 뉴스 칸, 목록(news.html), 기사 본문(article.html)이 함께 읽는 자료.

  값은 news.data.js 에 있고 이 파일은 규칙과 도우미만 갖는다.
  관리자 페이지가 저장할 때 자료 파일만 통째로 다시 쓰기 때문이다.

  기획서(docs/FIGMA_MAKE_STRUCTURE_PROMPT.md 8-9)는 "사실처럼 보이는 가짜 발표를 만들지 말 것"
  을 못 박았다. 그래서 본문은 다 쓰되, 확인할 수 없는 사실은 만들지 않는 선을 지켰다.

    쓰지 않은 것 : 제휴사·거래처 이름, 매출·이용자 수, 수상 내역,
                   실존하는 박람회 이름과 부스 번호
    쓴 것       : 우리 게임 이름과 그 게임의 규칙, 만드는 방식,
                   이미 사이트에 공개된 규제 정보(MGA/B2B/1088/2025 등)

  날짜는 배열 순서와 같은 내림차순이다. SMASH TOWER 기사만 2026-04 로 두었는데,
  홈의 RELEASE DATE 가 APR 2026 이라 어긋나면 안 되기 때문이다.
*/

/**
 * image 를 두면 목록 썸네일과 기사 키비주얼이 자리표 대신 그 사진을 쓴다.
 * 없으면 지금까지처럼 [IMAGE] 자리표가 나온다.
 *
 * @typedef {{ type: 'p' | 'h' | 'quote' | 'list' | 'media', text?: string, by?: string,
 *             items?: string[], label?: string, note?: string }} Block
 *
 * base 는 확장자와 크기 꼬리표를 뺀 경로다. 화면 크기별 파일 세 벌은 news-image.js 가 조립한다.
 * focus 는 잘라 낼 때 어디를 남길지다. 기사 키비주얼은 21:9 라 세로가 많이 잘리는데,
 * 가운데를 기준으로 자르면 사진마다 중요한 부분이 사라진다. 기본값은 위쪽 40% 지점이다.
 *
 * @typedef {{ base: string, alt: string, focus?: string }} Image
 * @typedef {{ id: string, category: string, date: string, title: string, summary: string,
 *             readTime: string, lead: string, image?: Image, body: Block[] }} Article
 */

/* 기획서가 정한 네 갈래. ALL 은 필터에만 쓰는 값이라 기사에는 붙지 않는다. */
export const CATEGORIES = ['ALL', 'NEW RELEASES', 'PARTNERSHIPS', 'LICENSING', 'EVENTS'];

/** @type {Article[]} */
export const ARTICLES = overlay('news', PUBLISHED);

export const PAGE_SIZE = 6;

export const findArticle = (id) => ARTICLES.find((a) => a.id === id);

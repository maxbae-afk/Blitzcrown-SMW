/*
  상단 차림표에서 지금 보고 있는 곳에 밑줄을 남긴다.

  자기 자신을 가리키는 링크만 칠하면 상세 화면이 비게 된다.
  게임 상세는 games.html 이 아니라 game.html 이고, 기사도 news.html 이 아니라 article.html 이라
  둘 다 목록 쪽 항목에 붙여 준다. 읽는 사람에게는 같은 갈래이기 때문이다.
*/
const SECTIONS = [
  ['games.html', ['games.html', 'game.html']],
  ['news.html', ['news.html', 'article.html']],
];

export function markCurrentNav() {
  const nav = document.querySelector('.topnav');
  if (!nav) return;

  // 주소가 폴더로 끝나면 서버가 index.html 을 내준다. 이름이 비므로 그때만 채워 준다.
  const here = location.pathname.split('/').pop() || 'index.html';

  const section = SECTIONS.find(([, pages]) => pages.includes(here));
  if (!section) return;

  const link = nav.querySelector(`a[href="${section[0]}"]`);
  if (!link) return;

  link.classList.add('is-here');
  link.setAttribute('aria-current', 'page');
}

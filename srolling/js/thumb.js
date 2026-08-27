/*
  게임 썸네일 한 칸.

  사진이 아직 없는 게임이 대부분이라 화면 곳곳에 [IMAGE] 자리표가 서 있다.
  사진이 들어오면 같은 자리에 그대로 갈아 끼워야 하므로, 두 경우를 한 군데서 다룬다.
  자리표든 사진이든 테두리와 비율이 같아 레이아웃은 흔들리지 않는다.
*/

/**
 * @param {HTMLElement} box 비율 class(ph--16x10 등)가 이미 붙은 상자
 * @param {{ image?: { src: string, alt?: string }, title: string }} game
 * @param {{ label?: string, note?: string }} [text] 자리표에 적을 문구
 */
export function fillThumb(box, game, text = {}) {
  box.classList.add('ph');

  const src = game.image?.src;
  if (src) {
    box.classList.add('ph--filled');
    const img = document.createElement('img');
    img.src = src;
    img.alt = game.image.alt ?? game.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    box.append(img);
    return box;
  }

  const type = document.createElement('span');
  type.className = 'ph-type';
  type.textContent = text.label ?? `[IMAGE] ${game.title}`;
  box.append(type);

  if (text.note) {
    const note = document.createElement('span');
    note.className = 'ph-meta';
    note.textContent = text.note;
    box.append(note);
  }

  return box;
}

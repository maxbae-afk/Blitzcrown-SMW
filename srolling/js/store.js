/*
  관리자 페이지가 고친 내용을 담아 두는 곳.

  이 사이트는 서버 없이 올라가므로 저장할 데가 두 군데다.

    로컬 관리자 서버가 켜져 있을 때 : 서버가 games.data.js / news.data.js 를 직접 다시 쓴다.
                                     그때는 여기 임시 저장이 필요 없다.
    그 외(배포된 사이트 등)         : 브라우저 안에만 남는다. 이 파일이 그 몫이다.

  임시 저장이 있으면 사이트 전체가 그것을 먼저 본다. 관리자에서 제목을 고치면
  홈·목록·상세가 새로고침 즉시 바뀐 제목으로 나온다. 대신 그 브라우저에서만 그렇다.
  실제로 반영하려면 관리자에서 파일을 내려받아 커밋해야 한다.
*/

const KEY = 'blitzcrown:draft';

/** @returns {{games?: unknown[], news?: unknown[], savedAt?: string} | null} */
export function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    // 손상된 값이 남아 있어도 사이트는 그대로 떠야 한다. 원본으로 돌아간다.
    return null;
  }
}

export function writeDraft(next) {
  localStorage.setItem(KEY, JSON.stringify({ ...next, savedAt: new Date().toISOString() }));
}

export function clearDraft() {
  localStorage.removeItem(KEY);
}

export const hasDraft = () => Boolean(readDraft());

/** 임시 저장이 있으면 그것을, 없으면 파일에 있는 것을 준다. */
export function overlay(kind, published) {
  const draft = readDraft();
  const saved = draft?.[kind];
  return Array.isArray(saved) && saved.length ? saved : published;
}

/*
  푸터의 관리자 버튼과 비밀번호 창.

  먼저 분명히 해 둘 것: 이건 자물쇠가 아니라 가림막이다.
  서버 없이 올라가는 사이트라 확인이 브라우저 안에서 끝난다. 아래 해시도, 이 코드도
  누구나 개발자 도구로 열어볼 수 있다. 지나가다 눌러 보는 사람을 막을 뿐,
  마음먹고 들어오려는 사람은 막지 못한다.

  그래서 관리자 화면에서 할 수 있는 일도 그 전제에 맞춰 두었다.
  배포된 사이트에서는 브라우저 안에만 남는 임시 저장과 파일 내려받기까지고,
  실제 파일을 고치는 것은 내 컴퓨터에서 관리자 서버를 켰을 때뿐이다.

  비밀번호를 바꾸려면 아래를 쓴다. 비밀번호 자체는 어디에도 남기지 않는다.

    cd blitzcrown-v2/.tools
    bun run set-admin-pass.mjs 새비밀번호

  해시는 공개 저장소에 그대로 올라간다. 짧거나 흔한 말은 대조표로 풀리므로
  위 도구가 12자 미만과 흔한 말을 받지 않는다.
*/

export const PASS_HASH = 'f18cac4952fc553e4f09c2539530e98996f653d80fd6ae3b7eced261ce6b79bf';

const SESSION_KEY = 'blitzcrown:admin';

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 비밀번호가 맞으면 그 해시를, 아니면 null 을 준다. 해시는 관리자 서버에 낼 열쇠로도 쓴다. */
export async function verify(password) {
  const hash = await sha256(password);
  return hash === PASS_HASH ? hash : null;
}

/*
  탭을 닫으면 풀린다. localStorage 를 쓰면 남의 컴퓨터에서 한 번 들어간 뒤로
  계속 열린 채가 된다. 임시 저장(store.js)과 열쇠고리를 나눠 두는 이유이기도 하다.
*/
export const readKey = () => sessionStorage.getItem(SESSION_KEY);
export const hasAccess = () => Boolean(readKey());
export const grantAccess = (hash) => sessionStorage.setItem(SESSION_KEY, hash);
export const revokeAccess = () => sessionStorage.removeItem(SESSION_KEY);

/**
 * 비밀번호 창을 띄우고 통과하면 true 를 준다.
 * 이미 통과한 세션이면 묻지 않는다.
 */
export async function ask({ force = false } = {}) {
  if (!force && hasAccess()) return true;

  const dialog = document.createElement('dialog');
  dialog.className = 'gate';
  dialog.innerHTML = `
    <form method="dialog" class="gate-form">
      <p class="gate-label">ADMIN ACCESS</p>
      <label class="gate-field">
        <span class="sr-only">비밀번호</span>
        <input type="password" name="password" autocomplete="current-password" placeholder="PASSWORD" required />
      </label>
      <p class="gate-error" hidden>비밀번호가 맞지 않습니다.</p>
      <p class="gate-note">브라우저 안에서만 확인합니다. 보안 장치가 아니라 실수로 들어오는 것을 막는 정도입니다.</p>
      <div class="gate-actions">
        <button type="button" class="btn" data-close>취소</button>
        <button type="submit" class="btn btn--primary">들어가기</button>
      </div>
    </form>
  `;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const input = dialog.querySelector('input');
  const error = dialog.querySelector('.gate-error');

  return new Promise((resolve) => {
    let passed = false;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const hash = await verify(input.value);
      if (!hash) {
        error.hidden = false;
        input.select();
        return;
      }
      grantAccess(hash);
      passed = true;
      dialog.close();
    });

    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(passed);
    });

    dialog.showModal();
    input.focus();
  });
}

/** 푸터 맨 아랫줄에 관리자 버튼을 놓는다. 페이지마다 마크업을 복제하지 않으려고 여기서 붙인다. */
export function setupAdminGate() {
  const bottom = document.querySelector('.foot-bottom');
  if (!bottom || bottom.querySelector('.admin-link')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'admin-link';
  button.textContent = 'ADMIN';
  button.addEventListener('click', async () => {
    if (await ask()) location.href = 'admin.html';
  });

  bottom.append(button);
}

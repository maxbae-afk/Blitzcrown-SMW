import { setupDemoMenu } from './demo-menu.js';
import { setupAdminGate } from './admin-gate.js';
import { markCurrentNav } from './nav.js';

/*
  페이지 맨 위 진행선과 스크롤 리빌, 헤더의 PLAY DEMO 패널, 푸터의 관리자 버튼.

  홈(app.js)은 스크롤 시퀀스와 한 루프에 묶여 있어 따로 두고,
  나머지 페이지가 이 모듈을 함께 쓴다. 같은 코드를 페이지마다 복제하던 것을 모은 것이다.
*/

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export function setupChrome() {
  const topline = document.querySelector('#topline');

  setupDemoMenu();
  setupAdminGate();
  markCurrentNav();

  const paint = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const p = total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;
    topline.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  window.addEventListener('scroll', paint, { passive: true });
  window.addEventListener('resize', paint);
  paint();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${i * 70}ms`;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
  );

  /*
    목록을 다시 그린 뒤 새로 생긴 요소를 등록할 때 쓴다.
    이미 켜진 것(.in)은 건너뛴다. 다시 등록하면 화면에 있던 것이 한 번 더 나타난다.
  */
  const observe = (root = document) =>
    root.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));

  observe();

  return { observe, paint };
}

import { setupChrome } from './chrome.js';

/*
  문의 서식.

  아직 받는 곳이 정해지지 않았다. 접수 서비스(Formspree 등)에 가입하고
  주소를 ENDPOINT 에 적어 넣으면 그때부터 그리로 보낸다.
  비어 있는 동안에는 쓴 내용을 메일 앱으로 넘겨 준다.

  주의: 접수 주소를 넣기 전까지 "보냈습니다"라고 말하지 않는다.
  메일 앱을 열어 준 것과 우리가 받은 것은 다른 일이고,
  거기서 보내기를 한 번 더 눌러야 한다는 것을 알려 주지 않으면 글이 그대로 사라진다.
*/

const ENDPOINT = null;
const MAILBOX = 'maxbae@neowiz.com';
const LIMIT = 2000;

const $ = (sel) => document.querySelector(sel);

const form = $('#contactForm');
const done = $('#contactDone');
const status = $('#cfStatus');
const submit = $('#cfSubmit');
const message = $('#cfMessage');
const counter = $('#cfCount');
const chips = form.querySelector('.chips--start');

setupChrome();

/* ---------- 검사 ---------- */

/*
  칸마다 무엇이 잘못됐는지 한 줄로 적는다. "필수 항목입니다" 하나로 뭉뚱그리면
  주소를 안 쓴 것인지 잘못 쓴 것인지 구분이 안 된다.

  address@host.tld 만 통과시킨다. 규격을 그대로 옮긴 정규식은 훨씬 길지만
  여기서 걸러야 하는 것은 오탈자이지 희귀한 주소 형식이 아니다.
*/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RULES = [
  {
    id: 'cfName',
    error: 'cfNameError',
    check: (v) => (v.trim() ? null : 'ENTER YOUR NAME.'),
  },
  {
    id: 'cfCompany',
    error: 'cfCompanyError',
    check: (v) => (v.trim() ? null : 'ENTER YOUR COMPANY.'),
  },
  {
    id: 'cfEmail',
    error: 'cfEmailError',
    check: (v) => {
      if (!v.trim()) return 'ENTER YOUR BUSINESS EMAIL.';
      return EMAIL.test(v.trim()) ? null : 'THIS EMAIL ADDRESS LOOKS INCOMPLETE.';
    },
  },
  {
    id: 'cfMessage',
    error: 'cfMessageError',
    check: (v) => {
      if (!v.trim()) return 'TELL US WHAT YOU ARE BUILDING.';
      if (v.length > LIMIT) return `KEEP IT UNDER ${LIMIT} CHARACTERS.`;
      return null;
    },
  },
];

function say(id, text) {
  const el = document.getElementById(id);
  el.textContent = text ?? '';
  el.hidden = !text;
}

/*
  검사에 걸린 칸 중 첫 번째를 돌려준다.
  긴 서식에서는 잘못된 칸이 화면 밖에 있는 경우가 많고,
  그러면 눌러도 아무 일이 없는 것처럼 보인다.
*/
function validate() {
  let first = null;

  RULES.forEach((rule) => {
    const input = document.getElementById(rule.id);
    const bad = rule.check(input.value);
    input.classList.toggle('is-bad', Boolean(bad));
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    say(rule.error, bad);
    if (bad && !first) first = input;
  });

  const inquiry = form.querySelector('input[name="inquiry"]:checked');
  chips.classList.toggle('is-bad', !inquiry);
  say('cfInquiryError', inquiry ? null : 'CHOOSE ONE.');
  if (!inquiry && !first) first = form.querySelector('input[name="inquiry"]');

  const consent = $('#cfConsent');
  consent.closest('.consent').classList.toggle('is-bad', !consent.checked);
  say('cfConsentError', consent.checked ? null : 'TICK THE BOX TO CONTINUE.');
  if (!consent.checked && !first) first = consent;

  return first;
}

/* 고친 즉시 경고를 지운다. 다 채운 뒤에도 표시가 남아 있으면 무엇이 남았는지 헷갈린다. */
RULES.forEach((rule) => {
  const input = document.getElementById(rule.id);
  input.addEventListener('input', () => {
    if (!input.classList.contains('is-bad')) return;
    if (rule.check(input.value)) return;
    input.classList.remove('is-bad');
    input.setAttribute('aria-invalid', 'false');
    say(rule.error, null);
  });
});

chips.addEventListener('change', () => {
  chips.classList.remove('is-bad');
  say('cfInquiryError', null);
});

$('#cfConsent').addEventListener('change', (e) => {
  if (!e.target.checked) return;
  e.target.closest('.consent').classList.remove('is-bad');
  say('cfConsentError', null);
});

/* 쓴 글자 수. 넘긴 뒤에 알리면 늦으므로 쓰는 동안 계속 보여 준다. */
message.addEventListener('input', () => {
  counter.textContent = String(message.value.length);
  counter.parentElement.style.color = message.value.length > LIMIT ? '#e0a94f' : '';
});

/* ---------- 보내기 ---------- */

function values() {
  const data = new FormData(form);
  return {
    name: String(data.get('name') || '').trim(),
    company: String(data.get('company') || '').trim(),
    email: String(data.get('email') || '').trim(),
    inquiry: String(data.get('inquiry') || ''),
    message: String(data.get('message') || '').trim(),
    website: String(data.get('website') || '').trim(),
  };
}

function report(text, bad = false) {
  status.textContent = text;
  status.classList.toggle('is-bad', bad);
  status.hidden = false;
}

/*
  안내문은 누른 그 순간의 이야기다. 고치기 시작하면 이미 옛말이 되므로 치운다.
  다 채웠는데도 "빠진 칸이 있습니다"가 남아 있으면 무엇이 남았는지 다시 찾게 된다.
*/
form.addEventListener('input', () => {
  status.hidden = true;
});
form.addEventListener('change', () => {
  status.hidden = true;
});

function finish() {
  form.hidden = true;
  done.hidden = false;
  done.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* 메일 앱으로 넘길 때 쓰는 본문. 받는 쪽이 읽을 순서대로 줄을 세운다. */
function draft(v) {
  const body = [
    `Name: ${v.name}`,
    `Company: ${v.company}`,
    `Email: ${v.email}`,
    `Inquiry type: ${v.inquiry}`,
    '',
    v.message,
  ].join('\n');

  const subject = `[${v.inquiry}] ${v.company}`;
  return `mailto:${MAILBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const first = validate();
  if (first) {
    report('SOME FIELDS NEED ATTENTION.', true);
    first.focus({ preventScroll: true });
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const v = values();

  // 미끼 칸이 채워졌다면 사람이 아니다. 통과한 척하고 아무 데도 보내지 않는다.
  if (v.website) {
    finish();
    return;
  }

  if (!ENDPOINT) {
    window.location.href = draft(v);
    report(`YOUR MAIL APP IS OPENING WITH THIS ENQUIRY. PRESS SEND THERE TO REACH ${MAILBOX}.`);
    return;
  }

  submit.classList.add('is-disabled');
  submit.firstChild.textContent = 'SENDING';
  report('SENDING YOUR ENQUIRY.');

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    if (!res.ok) throw new Error(String(res.status));
    finish();
  } catch {
    // 왜 실패했는지는 우리도 모른다. 대신 글이 사라지지 않게 다른 길을 남긴다.
    report(`WE COULD NOT SEND THIS. WRITE TO ${MAILBOX} AND WE WILL PICK IT UP.`, true);
    submit.classList.remove('is-disabled');
    submit.firstChild.textContent = 'SEND ENQUIRY';
  }
});

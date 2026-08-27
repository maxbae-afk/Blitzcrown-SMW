import { GAMES, GAME_CATEGORIES, mediaSlots } from './game-data.js';
import { ARTICLES, CATEGORIES } from './news-data.js';
import { writeDraft, clearDraft, hasDraft } from './store.js';
import { ask, readKey } from './admin-gate.js';

/*
  관리자 화면.

  저장이 두 갈래라는 것이 이 화면의 전제다.

    관리자 서버가 켜져 있으면  : games.data.js / news.data.js 를 서버가 바로 다시 쓴다.
    꺼져 있으면(배포본 포함)   : 브라우저 안에만 남는다. 사이트를 새로고침하면 보이지만
                                내 브라우저에서만 그렇다. 실제로 반영하려면
                                "파일 내려받기" 로 두 파일을 받아 커밋해야 한다.

  지금 어느 쪽인지 위쪽에 늘 적어 둔다. 그걸 모르고 고치면 날린다.

  고친 값은 data 안의 객체를 그 자리에서 바꾼다. 입력할 때마다 화면을 다시 그리면
  글자를 칠 때 커서가 튄다. 목록에 보이는 값(제목·미확정)만 따로 다시 그린다.
*/

const $ = (sel) => document.querySelector(sel);

const shell = $('#adm');
const modeLabel = $('#admMode');
const statusLabel = $('#admStatus');
const itemsHost = $('#admItems');
const countLabel = $('#admCount');
const editorHost = $('#admEditor');

/** @type {'server' | 'browser'} */
let mode = 'browser';
let data = { games: [], news: [] };
let tab = 'games';
let index = 0;
let dirty = false;

const list = () => data[tab];
const current = () => list()[index];

/* ---------- 작은 도구 ---------- */

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const slugify = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function setStatus(text, tone = '') {
  statusLabel.textContent = text;
  statusLabel.style.color = tone === 'bad' ? '#e0705f' : tone === 'good' ? 'var(--mint)' : '';
}

function touch() {
  dirty = true;
  setStatus('저장하지 않은 변경이 있습니다.');
}

/* ---------- 입력칸 ---------- */

function field(label, control, hint) {
  const wrap = el('label', 'f');
  wrap.append(el('span', 'f-label', label), control);
  if (hint) wrap.append(el('span', 'f-hint', hint));
  return wrap;
}

function textField(label, value, onInput, options = {}) {
  const { hint, multiline, type = 'text', placeholder, onCommit } = options;
  const input = document.createElement(multiline ? 'textarea' : 'input');
  if (!multiline) input.type = type;
  input.value = value ?? '';
  if (placeholder) input.placeholder = placeholder;
  input.addEventListener('input', () => {
    onInput(input.value);
    touch();
    onCommit?.();
  });
  return field(label, input, hint);
}

function selectField(label, value, options, onInput, hint) {
  const select = document.createElement('select');
  options.forEach(([val, text]) => {
    const option = document.createElement('option');
    option.value = val;
    option.textContent = text;
    select.append(option);
  });
  select.value = value ?? '';
  select.addEventListener('change', () => {
    onInput(select.value);
    touch();
    renderList();
  });
  return field(label, select, hint);
}

function checkField(label, value, onInput, hint) {
  const wrap = el('div', 'f');
  const row = el('label', 'f-check');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(value);
  input.addEventListener('change', () => {
    onInput(input.checked);
    touch();
    renderList();
  });

  row.append(input, el('span', 'f-label', label));
  wrap.append(row);
  // 설명은 아래 줄로 내린다. 같은 줄에 두면 체크칸과 글이 서로 밀린다.
  if (hint) wrap.append(el('span', 'f-hint', hint));
  return wrap;
}

function group(title, ...children) {
  const box = el('section', 'adm-group');
  box.append(el('p', 'adm-group-title', title), ...children);
  return box;
}

const grid = (wide, ...children) => {
  const box = el('div', wide ? 'adm-grid adm-grid--wide' : 'adm-grid');
  box.append(...children);
  return box;
};

/*
  이름-값 표. 값을 비우면 null 로 저장하고, 화면에서는 CONTENT REQUIRED 로 나온다.
  아직 확정되지 않은 숫자를 지어내지 않는다는 규칙이 자료에 적혀 있어 그대로 따른다.
*/
function pairsEditor(rows) {
  const host = el('div', 'adm-pairs');

  const draw = () => {
    host.textContent = '';
    rows.forEach((row, i) => {
      const line = el('div', 'adm-pair');

      const label = document.createElement('input');
      label.type = 'text';
      label.value = row[0] ?? '';
      label.addEventListener('input', () => {
        row[0] = label.value;
        touch();
      });

      const value = document.createElement('input');
      value.type = 'text';
      value.value = row[1] ?? '';
      value.placeholder = 'CONTENT REQUIRED';
      value.dataset.empty = String(!row[1]);
      value.addEventListener('input', () => {
        row[1] = value.value.trim() ? value.value : null;
        value.dataset.empty = String(!row[1]);
        touch();
      });

      const remove = el('button', 'adm-x', '✕');
      remove.type = 'button';
      remove.title = '이 줄 지우기';
      remove.addEventListener('click', () => {
        rows.splice(i, 1);
        touch();
        draw();
      });

      line.append(label, value, remove);
      host.append(line);
    });

    const add = el('button', 'adm-add', '+ 줄 추가');
    add.type = 'button';
    add.addEventListener('click', () => {
      rows.push(['', null]);
      touch();
      draw();
    });
    host.append(add);
  };

  draw();
  return host;
}

/* ---------- 사진 ---------- */

/**
 * 게임 썸네일은 파일 하나, 뉴스 사진은 화면 크기별 세 벌이다.
 * 세 벌 만드는 일은 서버가 하므로, 서버가 없으면 경로를 직접 적는 것만 된다.
 */
function imageEditor(target, kind) {
  const box = el('div', 'adm-image');
  const preview = el('div', 'adm-preview');
  const fields = el('div', 'adm-image-fields');

  const pathOf = () =>
    kind === 'news' ? (target.image?.base ? `${target.image.base}.webp` : '') : target.image?.src ?? '';

  const drawPreview = () => {
    preview.textContent = '';
    const src = pathOf();
    if (!src) {
      preview.append(el('span', null, '사진 없음 · 자리표로 나옵니다'));
      return;
    }
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.addEventListener('error', () => {
      preview.textContent = '';
      preview.append(el('span', null, '파일을 찾을 수 없습니다'));
    });
    preview.append(img);
  };

  const setPath = (value) => {
    const clean = value.trim();
    if (!clean) {
      delete target.image;
      drawPreview();
      return;
    }
    target.image = target.image ?? {};
    if (kind === 'news') target.image.base = clean.replace(/\.webp$/, '');
    else target.image.src = clean;
    target.image.alt = target.image.alt ?? '';
    drawPreview();
  };

  fields.append(
    textField(
      kind === 'news' ? '경로 (확장자·크기 꼬리표 없이)' : '경로',
      kind === 'news' ? target.image?.base ?? '' : target.image?.src ?? '',
      setPath,
      {
        placeholder: kind === 'news' ? 'assets/news/이름' : 'assets/games/이름.webp',
        hint:
          kind === 'news'
            ? '뉴스 사진은 -sm / (없음) / -2x 세 벌을 쓴다. 여기에는 그 꼬리표를 뺀 이름만 적는다.'
            : null,
      },
    ),
    textField('대체 텍스트', target.image?.alt ?? '', (v) => {
      if (!target.image) return;
      target.image.alt = v;
    }, { hint: '사진이 안 뜨거나 화면을 못 보는 사람에게 읽히는 설명이다.' }),
  );

  if (mode === 'server') {
    const row = el('div', 'adm-file');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    const note = el('span', 'f-hint', '올리면 알맞은 크기로 변환해 저장합니다.');

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      note.textContent = '올리는 중…';

      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      form.append('name', kind === 'news' ? `${target.id}-${slugify(target.title)}` : target.slug);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-admin-key': readKey() ?? '' },
          body: form,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? '올리지 못했습니다.');

        target.image = { ...(target.image ?? {}), ...body };
        target.image.alt = target.image.alt || target.title;
        note.textContent = '올렸습니다. 저장을 눌러야 반영됩니다.';
        touch();
        renderEditor();
      } catch (error) {
        note.textContent = String(error.message ?? error);
      }
    });

    row.append(input, note);
    fields.append(row);
  } else {
    fields.append(
      el(
        'p',
        'f-hint',
        '파일 올리기는 관리자 서버를 켰을 때만 됩니다. 지금은 이미 올려 둔 파일의 경로만 적을 수 있습니다.',
      ),
    );
  }

  drawPreview();
  box.append(preview, fields);
  return box;
}

/* ---------- 게임 ---------- */

function gameEditor(game) {
  const frag = document.createDocumentFragment();

  frag.append(
    group(
      '기본',
      grid(
        false,
        textField('제목', game.title, (v) => {
          game.title = v;
        }, { onCommit: renderList }),
        textField('주소 이름 (slug)', game.slug, (v) => {
          game.slug = slugify(v);
        }, { hint: 'game.html?title= 뒤에 붙는 값이다. 영문 소문자와 - 만 쓴다.' }),
        selectField(
          '분류',
          game.category,
          GAME_CATEGORIES.filter((c) => c !== 'ALL').map((c) => [c, c]),
          (v) => {
            game.category = v;
          },
        ),
        selectField(
          '뱃지',
          game.badge ?? '',
          [
            ['', '없음'],
            ['NEW', 'NEW'],
            ['POPULAR', 'POPULAR'],
          ],
          (v) => {
            game.badge = v || null;
          },
        ),
      ),
      checkField(
        '아직 발표하지 않은 제목',
        game.pending,
        (v) => {
          if (v) game.pending = true;
          else delete game.pending;
        },
        '켜 두면 목록 아래 "미확정" 개수에 들어가고, 헤더의 PLAY DEMO 패널에는 나오지 않는다.',
      ),
    ),

    group(
      '문구',
      grid(
        true,
        textField('한 줄 소개', game.premise, (v) => {
          game.premise = v;
        }, { hint: '카드와 상세 페이지 제목 아래 큰 글씨로 나온다.' }),
        textField('설명', game.summary, (v) => {
          game.summary = v;
        }, { multiline: true }),
        textField('데모 주소', game.demo ?? '', (v) => {
          game.demo = v.trim() || null;
        }, {
          type: 'url',
          placeholder: 'https://…',
          hint: '비워 두면 버튼이 DEMO UNAVAILABLE 로 바뀌고 눌리지 않는다.',
        }),
      ),
    ),

    group('썸네일', imageEditor(game, 'game')),
    group('요약 정보', pairsEditor(game.meta)),
    group('사양', pairsEditor(game.specs)),
  );

  return frag;
}

/* ---------- 뉴스 ---------- */

const BLOCK_NAMES = {
  p: '문단',
  h: '소제목',
  quote: '인용',
  list: '목록',
  media: '사진 자리',
};

function blockBody(block) {
  const body = el('div', 'adm-block-body');

  const area = (value, onInput, placeholder) => {
    const node = document.createElement('textarea');
    node.value = value ?? '';
    if (placeholder) node.placeholder = placeholder;
    node.addEventListener('input', () => {
      onInput(node.value);
      touch();
    });
    return node;
  };

  const line = (value, onInput, placeholder) => {
    const node = document.createElement('input');
    node.type = 'text';
    node.value = value ?? '';
    if (placeholder) node.placeholder = placeholder;
    node.addEventListener('input', () => {
      onInput(node.value);
      touch();
    });
    return node;
  };

  if (block.type === 'p' || block.type === 'quote') {
    body.append(area(block.text, (v) => {
      block.text = v;
    }));
    if (block.type === 'quote') {
      body.append(line(block.by, (v) => {
        block.by = v;
      }, '말한 사람'));
    }
  } else if (block.type === 'h') {
    body.append(line(block.text, (v) => {
      block.text = v;
    }, '소제목'));
  } else if (block.type === 'list') {
    body.append(
      area(
        (block.items ?? []).join('\n'),
        (v) => {
          block.items = v.split('\n').filter((item) => item.trim());
        },
        '한 줄에 하나씩',
      ),
    );
  } else if (block.type === 'media') {
    body.append(
      line(block.label, (v) => {
        block.label = v;
      }, '자리표에 적을 이름'),
      line(block.note, (v) => {
        block.note = v;
      }, '비율과 설명 (예: 16:9 · in-game capture)'),
    );
  }

  return body;
}

function blocksEditor(article) {
  const host = el('div', 'adm-blocks');

  const draw = () => {
    host.textContent = '';

    article.body.forEach((block, i) => {
      const box = el('div', 'adm-block');
      const bar = el('div', 'adm-block-bar');
      bar.append(el('span', 'adm-block-kind', BLOCK_NAMES[block.type] ?? block.type));

      const tools = el('div', 'adm-block-tools');
      const move = (to) => {
        const [moved] = article.body.splice(i, 1);
        article.body.splice(to, 0, moved);
        touch();
        draw();
      };

      const up = el('button', null, '↑');
      up.type = 'button';
      up.title = '위로';
      up.disabled = i === 0;
      up.addEventListener('click', () => move(i - 1));

      const down = el('button', null, '↓');
      down.type = 'button';
      down.title = '아래로';
      down.disabled = i === article.body.length - 1;
      down.addEventListener('click', () => move(i + 1));

      const drop = el('button', null, '✕');
      drop.type = 'button';
      drop.title = '지우기';
      drop.addEventListener('click', () => {
        article.body.splice(i, 1);
        touch();
        draw();
      });

      tools.append(up, down, drop);
      bar.append(tools);
      box.append(bar, blockBody(block));
      host.append(box);
    });

    const add = el('div', 'adm-block-add');
    Object.entries(BLOCK_NAMES).forEach(([type, name]) => {
      const button = el('button', 'adm-add', `+ ${name}`);
      button.type = 'button';
      button.addEventListener('click', () => {
        article.body.push(
          type === 'list'
            ? { type, items: [''] }
            : type === 'media'
              ? { type, label: '', note: '' }
              : { type, text: '' },
        );
        touch();
        draw();
      });
      add.append(button);
    });
    host.append(add);
  };

  draw();
  return host;
}

function newsEditor(article) {
  const frag = document.createDocumentFragment();

  frag.append(
    group(
      '기본',
      grid(
        false,
        textField('제목', article.title, (v) => {
          article.title = v;
        }, { onCommit: renderList }),
        textField('번호 (id)', article.id, (v) => {
          article.id = v.trim();
        }, { hint: 'article.html?id= 뒤에 붙는 값이다. 겹치지 않게 둔다.' }),
        selectField(
          '갈래',
          article.category,
          CATEGORIES.filter((c) => c !== 'ALL').map((c) => [c, c]),
          (v) => {
            article.category = v;
          },
        ),
        textField('날짜', article.date, (v) => {
          article.date = v;
        }, { placeholder: '18 AUG 2026' }),
        textField('읽는 시간', article.readTime, (v) => {
          article.readTime = v;
        }, { placeholder: '4 MIN READ' }),
      ),
      checkField(
        '본문이 아직 더미',
        article.dummy,
        (v) => {
          article.dummy = v;
        },
        '켜 두면 기사 첫 줄에 승인 전이라는 표시가 붙는다. 실제 원고를 넣었으면 끈다.',
      ),
    ),

    group(
      '요약',
      grid(
        true,
        textField('목록에 나올 한 문단', article.summary, (v) => {
          article.summary = v;
        }, { multiline: true }),
        textField('머리글 (기사 첫 줄)', article.lead, (v) => {
          article.lead = v;
        }, { multiline: true }),
      ),
    ),

    group('키비주얼', imageEditor(article, 'news')),
    group('본문', blocksEditor(article)),
  );

  return frag;
}

/* ---------- 목록 ---------- */

function renderList() {
  const rows = list();
  countLabel.textContent = `${String(rows.length).padStart(2, '0')} ${tab === 'games' ? '게임' : '기사'}`;
  itemsHost.textContent = '';

  rows.forEach((row, i) => {
    const item = el('li');
    const button = el('button', 'adm-item');
    button.type = 'button';
    if (i === index) button.setAttribute('aria-current', 'true');
    if (tab === 'games' && row.pending) button.dataset.pending = 'true';

    button.append(
      el('span', 'adm-item-no', String(i + 1).padStart(2, '0')),
      el('span', 'adm-item-name', row.title || '(제목 없음)'),
      el(
        'span',
        'adm-item-tag',
        tab === 'games' ? (row.pending ? '미확정' : row.category) : row.category,
      ),
    );
    button.addEventListener('click', () => {
      index = i;
      renderList();
      renderEditor();
    });

    item.append(button);
    itemsHost.append(item);
  });
}

function renderEditor() {
  editorHost.textContent = '';
  const row = current();
  if (!row) {
    editorHost.append(el('p', 'adm-empty', '왼쪽에서 하나를 고르거나 새로 만드세요.'));
    return;
  }

  const head = el('div', 'adm-head');
  head.append(el('h2', null, row.title || '(제목 없음)'));

  const tools = el('div', 'adm-head-tools');
  const move = (to) => {
    if (to < 0 || to >= list().length) return;
    const [moved] = list().splice(index, 1);
    list().splice(to, 0, moved);
    index = to;
    touch();
    renderList();
  };

  const up = el('button', 'adm-ghost', '↑ 위로');
  up.type = 'button';
  up.addEventListener('click', () => move(index - 1));

  const down = el('button', 'adm-ghost', '↓ 아래로');
  down.type = 'button';
  down.addEventListener('click', () => move(index + 1));

  const copy = el('button', 'adm-ghost', '복제');
  copy.type = 'button';
  copy.addEventListener('click', () => {
    const clone = structuredClone(row);
    if (tab === 'games') {
      clone.slug = `${clone.slug}-copy`;
      clone.title = `${clone.title} (COPY)`;
      clone.pending = true;
    } else {
      clone.id = String(Date.now()).slice(-4);
      clone.title = `${clone.title} (COPY)`;
    }
    list().splice(index + 1, 0, clone);
    index += 1;
    touch();
    renderList();
    renderEditor();
  });

  const drop = el('button', 'adm-ghost', '삭제');
  drop.type = 'button';
  drop.addEventListener('click', () => {
    if (list().length <= 1) {
      setStatus('마지막 하나는 지울 수 없습니다.', 'bad');
      return;
    }
    if (!confirm(`"${row.title}" 을(를) 지웁니다. 되돌릴 수 없습니다.`)) return;
    list().splice(index, 1);
    index = Math.max(0, index - 1);
    touch();
    renderList();
    renderEditor();
  });

  tools.append(up, down, copy, drop);
  head.append(tools);

  editorHost.append(head, tab === 'games' ? gameEditor(row) : newsEditor(row));
}

/* ---------- 새로 만들기 ---------- */

function blankGame() {
  return {
    slug: 'new-game',
    title: 'NEW GAME',
    badge: null,
    category: 'OTHER',
    pending: true,
    premise: '',
    summary: '',
    demo: null,
    media: mediaSlots('NEW GAME'),
    meta: [
      ['GAME TYPE', 'INSTANT WIN'],
      ['KEY MECHANIC', null],
      ['CATEGORY', 'OTHER'],
      ['RELEASE DATE', null],
    ],
    specs: [
      ['RTP', null],
      ['MAX WIN', null],
      ['VOLATILITY', null],
      ['MIN / MAX BET', null],
      ['ROUND LENGTH', null],
      ['CERTIFICATION', null],
    ],
  };
}

function blankArticle() {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const used = new Set(data.news.map((a) => a.id));
  let n = data.news.length + 1;
  while (used.has(String(n).padStart(2, '0'))) n += 1;

  return {
    id: String(n).padStart(2, '0'),
    category: 'NEW RELEASES',
    date: `${String(now.getDate()).padStart(2, '0')} ${month} ${now.getFullYear()}`,
    readTime: '3 MIN READ',
    title: '새 기사',
    summary: '',
    lead: '',
    body: [{ type: 'p', text: '' }],
  };
}

/* ---------- 저장 ---------- */

function fileText(what, name, value) {
  const banner = `/*\n  ${what} 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.\n\n  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.\n  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.\n*/\n\n`;
  return `${banner}export const ${name} = ${JSON.stringify(value, null, 2)};\n`;
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function save() {
  if (mode === 'server') {
    setStatus('저장 중…');
    try {
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-key': readKey() ?? '' },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? '저장하지 못했습니다.');

      // 파일이 진짜 값이 되었으니 브라우저에 남은 임시본은 치운다. 두면 서로 다른 값이 남는다.
      clearDraft();
      dirty = false;
      setStatus('파일에 저장했습니다.', 'good');
    } catch (error) {
      setStatus(String(error.message ?? error), 'bad');
    }
    return;
  }

  writeDraft({ games: data.games, news: data.news });
  dirty = false;
  setStatus('이 브라우저에만 저장했습니다. 반영하려면 파일을 내려받아 커밋하세요.', 'good');
}

/* ---------- 시작 ---------- */

async function detectMode() {
  try {
    const res = await fetch('/api/ping', { cache: 'no-store' });
    return res.ok ? 'server' : 'browser';
  } catch {
    return 'browser';
  }
}

async function boot() {
  mode = await detectMode();

  if (mode === 'server') {
    const res = await fetch('/api/data', { cache: 'no-store' });
    data = await res.json();
    modeLabel.textContent = '관리자 서버 연결됨 · 저장하면 파일이 바뀝니다';
    modeLabel.dataset.mode = 'server';
    if (hasDraft()) {
      setStatus('브라우저에 남은 임시 저장은 무시합니다. 저장하면 지워집니다.');
    }
  } else {
    // game-data.js 는 임시 저장을 이미 얹어서 준다. 이어서 고칠 수 있게 그대로 받는다.
    data = { games: structuredClone(GAMES), news: structuredClone(ARTICLES) };
    modeLabel.textContent = '브라우저 임시 저장 · 파일은 바뀌지 않습니다';
    modeLabel.dataset.mode = 'browser';
  }

  shell.hidden = false;
  renderList();
  renderEditor();
}

document.querySelectorAll('.adm-tab').forEach((button) => {
  button.addEventListener('click', () => {
    tab = button.dataset.tab;
    index = 0;
    document
      .querySelectorAll('.adm-tab')
      .forEach((other) => other.setAttribute('aria-selected', String(other === button)));
    renderList();
    renderEditor();
  });
});

$('#admNew').addEventListener('click', () => {
  list().unshift(tab === 'games' ? blankGame() : blankArticle());
  index = 0;
  touch();
  renderList();
  renderEditor();
});

$('#admSave').addEventListener('click', save);

$('#admDownload').addEventListener('click', () => {
  download('games.data.js', fileText('게임', 'GAMES', data.games));
  download('news.data.js', fileText('뉴스', 'ARTICLES', data.news));
  setStatus('두 파일을 받았습니다. srolling/js/ 에 덮어쓰고 커밋하세요.', 'good');
});

$('#admReset').addEventListener('click', () => {
  if (!confirm('브라우저에 저장해 둔 내용을 지웁니다. 파일에 있는 원래 값으로 돌아갑니다.')) return;
  clearDraft();
  location.reload();
});

addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

if (await ask()) boot();
else location.replace('index.html');

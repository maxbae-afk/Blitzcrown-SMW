/**
 * games.data.js 되살리기.
 *
 * 관리자 서버를 시험하다 자료 파일을 덮어써서 다시 만든다.
 * 발표된 6종은 사이트 화면과 원래 모듈에서 확인한 값 그대로다.
 * summary 만은 원문이 남아 있지 않아 다시 썼고, 어느 것이 그런지는 아래 주석에 적었다.
 */

import { writeFileSync } from 'node:fs';

const slots = (name) =>
  [
    { type: 'image', src: null, label: 'KEY ART', note: '16:9 · full-bleed key visual' },
    { type: 'video', src: null, poster: null, label: 'GAMEPLAY', note: '16:9 · loop, no audio' },
    { type: 'image', src: null, label: 'SCREENSHOT 01', note: '16:9 · in-game capture' },
    { type: 'image', src: null, label: 'SCREENSHOT 02', note: '16:9 · win moment' },
  ].map((item) => ({ ...item, label: `${name} · ${item.label}` }));

const specs = () => [
  ['RTP', null],
  ['MAX WIN', null],
  ['VOLATILITY', null],
  ['MIN / MAX BET', null],
  ['ROUND LENGTH', null],
  ['CERTIFICATION', null],
];

const game = (o) => ({
  slug: o.slug,
  title: o.title,
  badge: o.badge ?? null,
  category: o.category,
  ...(o.pending ? { pending: true } : {}),
  premise: o.premise,
  summary: o.summary,
  demo: o.demo ?? null,
  media: slots(o.media ?? o.title),
  meta: [
    ['GAME TYPE', o.type ?? 'INSTANT WIN'],
    ['KEY MECHANIC', o.mechanic],
    ['CATEGORY', o.category],
    ['RELEASE DATE', o.release ?? null],
  ],
  specs: specs(),
});

const GAMES = [
  /* ---- 발표된 6종 ---- */
  game({
    slug: 'smash-tower',
    title: 'SMASH TOWER',
    badge: 'NEW',
    category: 'MINE',
    mechanic: 'PICK & REVEAL',
    release: 'APR 2026',
    premise: 'SMASH. CLIMB. CASH OUT.',
    // 원문 그대로
    summary:
      'Break a floor, take what is behind it, and decide whether the next one is worth the climb. Every level raises the multiplier and the cost of being wrong.',
    demo: 'https://blitzcrown.massivegaming.io/game_info?title=smash-tower',
  }),
  game({
    slug: 'double-pop-plinko',
    title: 'DOUBLE POP PLINKO 51200X',
    badge: 'NEW',
    category: 'PLINKO',
    mechanic: 'MULTI-BALL',
    media: 'DOUBLE POP PLINKO',
    premise: 'MULTI-BALL PLINKO WITH RE-LAUNCHES.',
    // 다시 씀
    summary:
      'One ball becomes many. Balls pop, split and re-launch across the board, so a single drop can turn into a chain of drops before the round settles.',
  }),
  game({
    slug: 'twin-crash-blitz',
    title: 'TWIN CRASH: BLITZ',
    badge: 'NEW',
    category: 'CRASH',
    mechanic: 'DUAL MULTIPLIER',
    media: 'TWIN CRASH',
    premise: 'TWO PLANES. TWO MULTIPLIERS.',
    // 다시 씀
    summary:
      'Two planes climb together and crash apart. Every round asks whether to split the stake between them or commit everything to one curve.',
  }),
  game({
    slug: 'super-card-rush',
    title: 'SUPER CARD RUSH',
    badge: 'POPULAR',
    category: 'OTHER',
    mechanic: 'CARD',
    premise: 'CARD STRATEGY IN A SINGLE ROUND.',
    // 다시 씀
    summary:
      'A full hand of decisions compressed into one round. Each card you keep changes what the next one is worth, and the round ends the moment you stop.',
  }),
  game({
    slug: 'interstellar-plinko',
    title: 'INTERSTELLAR PLINKO',
    badge: 'POPULAR',
    category: 'PLINKO',
    mechanic: 'MULTIPLIER',
    premise: 'COSMIC DROPS AND CHARGED PLANETS.',
    // 다시 씀
    summary:
      'The pegs are charged planets that pull and push the ball on its way down. The same drop from the same slot does not read the same twice.',
  }),
  game({
    slug: 'fast-crash-blitz',
    title: 'FAST CRASH: BLITZ',
    badge: 'POPULAR',
    category: 'CRASH',
    mechanic: 'MULTIPLIER',
    media: 'FAST CRASH: BLITZ',
    premise: 'FAST ROUNDS. INSTANT CASHOUT.',
    // 다시 씀
    summary:
      'A crash round stripped to its shortest form. The curve moves fast, the cashout is one tap, and the next round starts before you have finished thinking about the last one.',
  }),

  /* ---- 미확정 자리표 12종 ---- */
  game({
    slug: 'deep-reef-plinko',
    title: 'DEEP REEF PLINKO',
    badge: 'NEW',
    category: 'PLINKO',
    mechanic: 'CURRENT DRIFT',
    pending: true,
    premise: 'THE BOARD MOVES WITH THE TIDE.',
    summary:
      'Pegs sit in a current that shifts between drops, so the path you learned on the last ball is not the path this one takes.',
  }),
  game({
    slug: 'foundry-plinko',
    title: 'FOUNDRY PLINKO',
    category: 'PLINKO',
    mechanic: 'MOLTEN PEGS',
    pending: true,
    premise: 'PEGS MELT WHERE THE BALL LANDS.',
    summary:
      'Every hit softens the board. Late drops fall through gaps the early ones opened, so the round rewrites itself as it goes.',
  }),
  game({
    slug: 'glacier-plinko',
    title: 'GLACIER PLINKO',
    category: 'PLINKO',
    mechanic: 'SPLIT DROP',
    pending: true,
    premise: 'ONE BALL IN. TWO BALLS DOWN.',
    summary:
      'The ice splits what falls through it. A single drop becomes two halves, and each half keeps a share of the multiplier.',
  }),
  game({
    slug: 'storm-chaser-blitz',
    title: 'STORM CHASER: BLITZ',
    badge: 'NEW',
    category: 'CRASH',
    type: 'CRASH',
    mechanic: 'WEATHER MULTIPLIER',
    media: 'STORM CHASER',
    pending: true,
    premise: 'FLY INTO IT OR TURN BACK.',
    summary:
      'The multiplier climbs fastest inside the storm and the storm is where the curve breaks. Distance and risk are the same number.',
  }),
  game({
    slug: 'deep-dive-blitz',
    title: 'DEEP DIVE: BLITZ',
    category: 'CRASH',
    type: 'CRASH',
    mechanic: 'DESCENT MULTIPLIER',
    media: 'DEEP DIVE',
    pending: true,
    premise: 'THE CURVE GOES DOWN, NOT UP.',
    summary:
      'A crash game read upside down. Pressure builds as you descend, and the multiplier grows with every metre you refuse to surface.',
  }),
  game({
    slug: 'relay-crash-blitz',
    title: 'RELAY CRASH: BLITZ',
    badge: 'POPULAR',
    category: 'CRASH',
    type: 'CRASH',
    mechanic: 'HANDOVER MULTIPLIER',
    media: 'RELAY CRASH',
    pending: true,
    premise: 'THREE RUNNERS. ONE CURVE.',
    summary:
      'The multiplier is handed between three runners mid-round. Each handover is a moment where it can climb or drop everything.',
  }),
  game({
    slug: 'sunken-vault',
    title: 'SUNKEN VAULT',
    badge: 'NEW',
    category: 'MINE',
    mechanic: 'PICK & REVEAL',
    pending: true,
    premise: 'OPEN DOORS UNTIL THE WATER WINS.',
    summary:
      'Each door you open floods the room a little further. Take what is behind it, or stop while there is still air in the corridor.',
  }),
  game({
    slug: 'ember-mine',
    title: 'EMBER MINE',
    category: 'MINE',
    mechanic: 'CASCADE REVEAL',
    pending: true,
    premise: 'EVERY TILE YOU OPEN LIGHTS THE NEXT.',
    summary:
      'Revealed tiles stay lit and show you a little of what surrounds them. Information is the reward, and it costs a pick to get.',
  }),
  game({
    slug: 'hollow-crown',
    title: 'HOLLOW CROWN',
    badge: 'POPULAR',
    category: 'MINE',
    mechanic: 'RISK LADDER',
    pending: true,
    premise: 'TAKE THE CROWN OR TAKE THE ROOM.',
    summary:
      'Every room holds one crown and one way out. Leaving with the crown ends the run; leaving it raises what the next room is worth.',
  }),
  game({
    slug: 'spin-court',
    title: 'SPIN COURT',
    badge: 'NEW',
    category: 'OTHER',
    mechanic: 'WHEEL',
    pending: true,
    premise: 'ONE WHEEL. FOUR VERDICTS.',
    summary:
      'The wheel does not pay directly. It decides which of four judges rules on your round, and each one reads the same result differently.',
  }),
  game({
    slug: 'keystone',
    title: 'KEYSTONE',
    category: 'OTHER',
    mechanic: 'BUILD & HOLD',
    pending: true,
    premise: 'PLACE THE ARCH BEFORE IT FALLS.',
    summary:
      'Build upward one stone at a time. The arch holds only when the last stone lands, and every stone before it raises what holding is worth.',
  }),
  game({
    slug: 'lantern-draw',
    title: 'LANTERN DRAW',
    badge: 'POPULAR',
    category: 'OTHER',
    mechanic: 'DRAW & KEEP',
    pending: true,
    premise: 'LIGHT ONE, KEEP ONE, RELEASE ONE.',
    summary:
      'Three lanterns per round and only one can be kept. What you release does not disappear — it sets the value of the next draw.',
  }),
];

const banner = `/*
  게임 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.

  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.
  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.
*/

`;

writeFileSync(
  'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling/js/games.data.js',
  `${banner}export const GAMES = ${JSON.stringify(GAMES, null, 2)};\n`,
  'utf8',
);

console.log(`게임 ${GAMES.length}개를 되살렸다.`);

/**
 * news.data.js 되살리기.
 *
 * 관리자 서버를 시험하다 자료 파일을 덮어써서 다시 만든다.
 *
 *   화면 기록에서 글자 그대로 되찾은 것 : id, 갈래, 날짜, 제목, 요약, 사진 경로
 *   원문이 남아 있는 것                : 01번의 머리글과 본문 앞 일곱 덩이
 *   다시 쓴 것                        : 나머지 열한 건의 머리글과 본문
 *
 * 다시 쓸 때도 원래 자료가 지키던 선을 그대로 지켰다.
 * 확인할 수 없는 사실은 만들지 않는다. 제휴사 이름, 매출·이용자 수, 수상 내역,
 * 실존하는 박람회 이름과 부스 번호는 쓰지 않았다.
 * 쓴 것은 우리 게임과 그 규칙, 만드는 방식, 이미 사이트에 공개된 규제 정보뿐이다.
 */

import { writeFileSync } from 'node:fs';

const p = (text) => ({ type: 'p', text });
const h = (text) => ({ type: 'h', text });
const list = (...items) => ({ type: 'list', items });
const quote = (text, by) => ({ type: 'quote', text, by });
const media = (label, note = '16:9 · in-game capture') => ({ type: 'media', label, note });

const ARTICLES = [
  {
    id: '01',
    category: 'NEW RELEASES',
    date: '18 AUG 2026',
    readTime: '4 MIN READ',
    title: 'INTERSTELLAR PLINKO TURNS THE BOARD INTO A SKY',
    summary:
      'Our second plinko world replaces the static peg board with charged planets that bend every drop.',
    lead: 'Most plinko boards are a grid with a picture behind them. We wanted the picture to be the grid.',
    body: [
      p(
        'Interstellar Plinko began with a complaint about our own genre. A plinko board is one of the most readable objects in instant win: you drop, it bounces, it lands. But once you have watched twenty drops, the board stops telling you anything. The art sits behind the pegs and never participates.',
      ),
      h('THE BOARD IS THE WORLD'),
      p(
        'In Interstellar Plinko the pegs are charged planets. They pull, they push, and they change the line the ball takes on the way down. The same drop from the same slot does not read the same twice, because the board is not a fixed lattice — it is a system that reacts.',
      ),
      media('INTERSTELLAR PLINKO — CHARGED PLANET'),
      h('WHAT CHANGES FOR THE PLAYER'),
      list(
        'Multiplier values travel with the board instead of sitting still in a bottom row.',
        'A drop can be redirected after it has already started falling.',
        'Art, motion and payout table are one scene, so nothing has to be explained twice.',
      ),
      quote(
        'If the background can be removed without changing the game, it was never part of the game.',
        'BLITZCROWN GAME DESIGN',
      ),
      p(
        'That rule is why the release took longer than a reskin would have. A board that reacts has to stay readable at speed, on a phone, to someone who has never seen it before. Every planet we added had to earn its place against that test.',
      ),
    ],
  },

  {
    id: '02',
    category: 'PARTNERSHIPS',
    date: '04 AUG 2026',
    readTime: '3 MIN READ',
    title: 'ONE INTEGRATION, EVERY WORLD WE BUILD',
    summary:
      'Every Blitzcrown title ships behind a single API, so adding the next game is a configuration change.',
    lead: 'The hardest part of adding a game should never be the adding.',
    body: [
      p(
        'Integration cost quietly decides what players get to see. When every title arrives with its own contract, its own certification bundle and its own set of edge cases, an operator stops asking whether a game is good and starts asking whether it is worth the week. Variety loses that argument almost every time.',
      ),
      h('ONE CONTRACT, MANY WORLDS'),
      p(
        'We build every Blitzcrown title behind the same interface. Smash Tower and Interstellar Plinko are very different games to play, but they are the same game to integrate. Once the first one is live, the second is a configuration change rather than a project.',
      ),
      h('WHAT STAYS THE SAME'),
      list(
        'One set of endpoints for launch, session and settlement.',
        'One reporting shape, so a new title does not need a new dashboard.',
        'One certification path, run before a game reaches a partner rather than after.',
      ),
      quote(
        'A catalogue is only as wide as its slowest integration.',
        'BLITZCROWN PLATFORM',
      ),
      p(
        'The point of the constraint is not tidiness. It is that a studio which can ship a new world cheaply can afford to make worlds that are strange. Standardising the plumbing is what buys the freedom upstream.',
      ),
    ],
  },

  {
    id: '03',
    category: 'EVENTS',
    date: '21 JUL 2026',
    readTime: '3 MIN READ',
    title: 'FOUR WORLDS ON ONE WALL',
    summary:
      'We built the stand around four key visuals and one question: can you tell these games apart from ten metres away?',
    lead: 'A stand is a readability test with a carpet.',
    image: {
      base: 'assets/news/news-03-stand',
      alt: 'Blitzcrown 전시 부스 전경. 정면 대형 화면에 네 개의 게임 키비주얼이 나란히 걸려 있다.',
    },
    body: [
      p(
        'We did not build the stand to explain our games. We built it to find out whether they explain themselves. Four key visuals went up side by side on one wall, at the size a passer-by would actually see them, and everything else on the stand was kept deliberately quiet.',
      ),
      h('THE TEN METRE RULE'),
      p(
        'The question we kept asking was simple: from ten metres away, can you tell these four apart? Not name them — tell them apart. If two worlds read as the same blue rectangle at that distance, the difference we spent months on is a difference only we can see.',
      ),
      media('STAND — FOUR KEY VISUALS ON ONE WALL', '21:9 · venue photography'),
      h('WHAT THE WALL TOLD US'),
      list(
        'Silhouette separates faster than colour. A tower, a board, a curve and a hand read apart before the palette does.',
        'Motion helps less than we assumed. At that distance a loop reads as texture, not as gameplay.',
        'The titles people walked toward were the ones where the art already implied the rule.',
      ),
      quote(
        'If you have to stand next to a screen to explain it, the screen is not finished.',
        'BLITZCROWN ART DIRECTION',
      ),
      p(
        'That is a harsher test than a trailer, and a more useful one. We came back with a shorter list of things to fix than we expected, and a longer list of things to stop doing.',
      ),
    ],
  },

  {
    id: '04',
    category: 'NEW RELEASES',
    date: '07 JUL 2026',
    readTime: '4 MIN READ',
    title: 'TWIN CRASH: BLITZ PUTS TWO CURVES IN ONE ROUND',
    summary:
      'Two planes climb together and crash apart, so every round asks whether to split the stake or commit.',
    lead: 'One curve is a nerve test. Two curves is a decision.',
    body: [
      p(
        'A crash round is one of the cleanest shapes in instant win. A line goes up, and at some point it stops. The tension is real, but it is a single question asked over and over: out now, or later. After enough rounds, the question stops changing.',
      ),
      h('TWO PLANES, ONE ROUND'),
      p(
        'Twin Crash: Blitz puts two planes in the air at the same time. They climb together and they break apart, and neither one tells you which will go further. The stake can sit on both or on one, and that choice happens before the curve gives you anything to go on.',
      ),
      media('TWIN CRASH: BLITZ — TWO CURVES DIVERGING'),
      h('WHY IT PLAYS DIFFERENTLY'),
      list(
        'Splitting the stake trades the ceiling for a second chance at the round.',
        'Committing to one plane keeps the full multiplier and removes the safety net.',
        'Watching one curve break tells you nothing certain about the other, which is the entire point.',
      ),
      quote(
        'We did not want a harder crash game. We wanted one where the hard part is a choice, not a reflex.',
        'BLITZCROWN GAME DESIGN',
      ),
      p(
        'The round is still short and still readable at a glance. What changed is that the moment of most tension moved earlier — from the cashout to the decision that comes before it.',
      ),
    ],
  },

  {
    id: '05',
    category: 'LICENSING',
    date: '23 JUN 2026',
    readTime: '4 MIN READ',
    title: 'HOW A GAME GETS FROM OUR BUILD TO A CERTIFIED RELEASE',
    summary:
      'A plain description of the steps every Blitzcrown title passes before it can appear in a lobby.',
    lead: 'Certification is not a stamp at the end. It is a shape the game has to hold from the start.',
    body: [
      p(
        'People outside the industry tend to picture certification as a final inspection: the game is finished, someone checks it, it goes live. In practice it works the other way round. The requirements decide how the game is built, and the review at the end is where you find out whether you understood them.',
      ),
      h('THE ORDER THINGS HAPPEN IN'),
      list(
        'The maths model is written down and fixed before the art is final, because the model is what gets tested.',
        'The build is instrumented so that every round can be reconstructed from its record, not from a screenshot.',
        'An independent test house reviews the model and the build against the rules of the market we are entering.',
        'Only then does the title become something a partner can put in a lobby.',
      ),
      h('WHY WE DO NOT PUBLISH NUMBERS EARLY'),
      p(
        'Return to player, maximum win and volatility are not marketing lines. They are values that belong to a specific certified build, and they can change between the version we are playing internally and the version that passes review. Publishing them before that point would mean publishing something we might have to take back.',
      ),
      quote(
        'A number you have to correct later was never information. It was decoration.',
        'BLITZCROWN COMPLIANCE',
      ),
      p(
        'That is why the specification panel on our game pages shows blanks rather than estimates. The blanks are honest, and they fill in the moment there is something real to put there.',
      ),
    ],
  },

  {
    id: '06',
    category: 'PARTNERSHIPS',
    date: '09 JUN 2026',
    readTime: '3 MIN READ',
    title: 'WHAT WE ASK BEFORE WE AGREE TO A LOBBY',
    summary:
      'Distribution is a design decision. These are the questions we ask before a title goes anywhere.',
    lead: 'Where a game sits changes what the game is.',
    body: [
      p(
        'It is tempting to treat distribution as the part that happens after the work. Build the game, then find it a home. But a title that is discovered inside a wall of thumbnails is a different product from one that arrives with a placement and a moment, even if the build is identical.',
      ),
      h('THE QUESTIONS'),
      list(
        'How will a player arrive at this title — searching for it, or scrolling past it?',
        'What is next to it, and does our art still separate at that size?',
        'Does the lobby support the way this game opens, or will the first ten seconds be cut off?',
        'If the title does well, is there room for the second and third world in the same family?',
      ),
      h('WHAT WE WILL NOT TRADE'),
      p(
        'We will change a thumbnail, a title treatment, an aspect ratio, a load order. We will not change the rule at the centre of a game to make it resemble the title next to it. That is the difference between preparing a game commercially and compromising it, and it is a line we would rather draw before a contract than after.',
      ),
      quote(
        'Every lobby is an argument about what players want. We would rather join the argument than win it by blending in.',
        'BLITZCROWN STUDIO',
      ),
    ],
  },

  {
    id: '07',
    category: 'NEW RELEASES',
    date: '26 MAY 2026',
    readTime: '3 MIN READ',
    title: 'DOUBLE POP PLINKO 51200X: WHEN ONE BALL BECOMES MANY',
    summary:
      'Balls pop, split and re-launch across the board, so a single drop can turn into a chain of drops.',
    lead: 'The drop is not the round. The drop is what starts the round.',
    body: [
      p(
        'Plinko is usually a single event with a delay attached. You commit, you watch, you find out. Double Pop Plinko 51200X keeps the commitment and removes the certainty that one drop equals one outcome.',
      ),
      h('POP, SPLIT, RE-LAUNCH'),
      p(
        'A ball that meets the right condition pops. Popping does not end it — it splits into balls that carry on falling, and some of those re-launch back up the board. A round that begins as one line down the screen can become a board full of movement before anything settles.',
      ),
      media('DOUBLE POP PLINKO 51200X — CHAIN OF DROPS'),
      h('READING A BOARD THAT IS STILL MOVING'),
      list(
        'Each split carries a share of what the parent ball was worth, so the board is doing arithmetic in front of you.',
        'Re-launches change the shape of the round rather than just extending it.',
        'The ceiling in the title is reachable through chains, not through a single lucky slot.',
      ),
      quote(
        'We wanted the moment after the drop to be worth watching, not just worth waiting through.',
        'BLITZCROWN GAME DESIGN',
      ),
    ],
  },

  {
    id: '08',
    category: 'EVENTS',
    date: '12 MAY 2026',
    readTime: '3 MIN READ',
    title: 'BUILDING A WORLD BEFORE BUILDING A GAME',
    summary: 'An open session on how a Blitzcrown title starts as a place rather than as a mechanic.',
    lead: 'We start with somewhere, not with something.',
    body: [
      p(
        'The usual order is mechanic first. Pick a shape that works, then dress it. It is efficient, and it is why so much of the category looks like the same three games wearing different coats. We run the order backwards, and this session was about what that costs and what it buys.',
      ),
      h('PLACE FIRST'),
      p(
        'A world comes with rules before anyone writes any. A flooded vault implies that time is against you. A tower implies that height is worth something and that falling is the price. Once the place is real, the mechanic is a question of listening to it rather than inventing from nothing.',
      ),
      h('WHERE IT GOES WRONG'),
      list(
        'A place can be beautiful and say nothing about how to play. Those get cut early.',
        'A place can say too much, and the game becomes a simulation nobody asked for.',
        'The test is whether a player can guess the rule before being told it.',
      ),
      quote(
        'If the art is a costume, you can take it off. If the art is the rule, you cannot.',
        'BLITZCROWN ART DIRECTION',
      ),
      p(
        'The session was open on purpose, including the parts where the method fails. The failures are more instructive than the finished titles, and they are the half of the process that usually goes unmentioned.',
      ),
    ],
  },

  {
    id: '09',
    category: 'LICENSING',
    date: '28 APR 2026',
    readTime: '3 MIN READ',
    title: 'LICENSED AND REGULATED BY THE MALTA GAMING AUTHORITY',
    summary: 'The licence, the entity behind it, and where to verify both.',
    lead: 'Regulatory information should be findable in one read, not assembled from a footer.',
    body: [
      p(
        'Licensing details are usually printed small, at the bottom, in the hope that nobody needs them. We would rather state them plainly, because the people who do need them — partners, regulators, players checking who they are dealing with — should not have to hunt.',
      ),
      h('THE DETAILS'),
      list(
        'Licensed and regulated by the Malta Gaming Authority.',
        'Licence number MGA/B2B/1088/2025.',
        'Operated by Massive Gaming Malta Limited.',
        'Registration number C109221.',
        'Registered address: 97, Triq Windsor, Sliema, SLM 1853, Malta.',
      ),
      h('WHY THE B2B DISTINCTION MATTERS'),
      p(
        'A business-to-business licence means we supply games to operators rather than taking bets ourselves. The player relationship, the account and the wallet sit with the operator. What sits with us is the game: its maths, its build, and the obligation to have both tested before either reaches anyone.',
      ),
      quote(
        'The licence is not a badge. It is a description of what we are responsible for.',
        'BLITZCROWN COMPLIANCE',
      ),
    ],
  },

  {
    id: '10',
    category: 'NEW RELEASES',
    date: '14 APR 2026',
    readTime: '4 MIN READ',
    title: 'SMASH TOWER: SMASH, CLIMB OR CASH OUT',
    summary:
      'Our first tower title turns every floor into a single decision, and every decision into a bigger one.',
    lead: 'Every floor asks the same question. The question just gets more expensive.',
    body: [
      p(
        'Smash Tower is built on one repeated moment. You break a floor, you take what is behind it, and you decide whether the next one is worth the climb. Nothing about that sentence is complicated, which is exactly why it took the longest to get right.',
      ),
      h('ONE DECISION, REPEATED'),
      p(
        'A game made of one decision lives or dies on how that decision escalates. Each level raises the multiplier and raises what you lose by being wrong. The rule never changes; the weight of it does. By the upper floors the same tap that felt casual at the start is the hardest input in the game.',
      ),
      media('SMASH TOWER — BREAKING A FLOOR'),
      h('WHAT WE CUT'),
      list(
        'Side mechanics that gave players something to do other than choose.',
        'A second currency that made the climb legible as maths instead of nerve.',
        'Any animation long enough that the player stopped feeling the pace of their own decisions.',
      ),
      quote(
        'The temptation is always to add a second thing. The work is proving the first thing is enough.',
        'BLITZCROWN GAME DESIGN',
      ),
      p(
        'Smash Tower shipped as our first tower world and set the shape for the ones that followed it. The tower changes. The question does not.',
      ),
    ],
  },

  {
    id: '11',
    category: 'PARTNERSHIPS',
    date: '31 MAR 2026',
    readTime: '3 MIN READ',
    title: 'COMMERCIALLY PREPARED, NOT COMMERCIALLY COMPROMISED',
    summary:
      'What we mean when we say a title is partner-ready, and what we refuse to change to get there.',
    lead: 'Being ready for a partner and being shaped by one are not the same thing.',
    body: [
      p(
        'Partner-ready is a phrase that can mean almost anything, which is usually a sign it means nothing. For us it is a checklist, and the checklist is deliberately about the outside of the game rather than the inside.',
      ),
      h('WHAT PREPARED MEANS'),
      list(
        'The title integrates through the same interface as everything else we ship.',
        'The maths model is fixed, documented and tested before the conversation starts.',
        'Art is delivered in the sizes a lobby actually uses, not only the sizes that flatter it.',
        'Reporting matches the shape a partner already reads, so nothing needs a special case.',
      ),
      h('WHAT COMPROMISED WOULD MEAN'),
      p(
        'It would mean changing the rule at the centre of a game because a similar title performed well somewhere else. It would mean widening a world until it stops being a place. We have made those changes before, early in the studio, and the result was a game that offended nobody and interested nobody.',
      ),
      quote(
        'We will fit any lobby. We will not become the lobby.',
        'BLITZCROWN STUDIO',
      ),
      p(
        'The distinction matters most when a title is doing well. That is when the pressure to make the next one resemble it is strongest, and when saying no is worth the most.',
      ),
    ],
  },

  {
    id: '12',
    category: 'EVENTS',
    date: '17 MAR 2026',
    readTime: '3 MIN READ',
    title: 'MANY WORLDS, ONE CROWN: WHERE THE STUDIO STARTED',
    summary: 'The founding idea, put on a wall in public and tested by people who owe us nothing.',
    lead: 'An idea you have only tested on yourselves is not an idea yet. It is a preference.',
    image: {
      base: 'assets/news/news-12-worlds',
      alt: 'Blitzcrown 전시 부스. 로고 아래로 게임 화면이 늘어선 벽 앞에 관람객이 모여 있다.',
    },
    body: [
      p(
        'Blitzcrown started from one sentence: many worlds, one crown. Every title is its own place with its own rules, and what holds them together is a standard of craft rather than a house style. It is easy to say in a room full of people who already agree.',
      ),
      h('PUTTING IT WHERE IT CAN FAIL'),
      p(
        'So we put it on a wall in public, next to the games it produced, in front of people who owe us nothing. Visitors did not arrive knowing our titles, and they had no reason to be generous. That is the only condition under which the answer is worth having.',
      ),
      media('STAND — GAME WALL AND VISITORS', '21:9 · venue photography'),
      h('WHAT HELD AND WHAT DID NOT'),
      list(
        'Held: people could tell the worlds apart without being told they were meant to be different.',
        'Held: the games that read fastest were the ones where the art already implied the rule.',
        'Did not hold: our assumption that a shared visual signature would help. It mostly flattened them.',
      ),
      quote(
        'One crown does not mean one look. It means one standard.',
        'BLITZCROWN STUDIO',
      ),
      p(
        'That correction is the most useful thing we took away, and it changed how the next four titles were art directed. The founding sentence survived. Our interpretation of it did not.',
      ),
    ],
  },
];

const banner = `/*
  뉴스 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.

  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.
  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.
*/

`;

writeFileSync(
  'C:/Users/maxbae/Desktop/ArtCraft. web/blitzcrown-v2/srolling/js/news.data.js',
  `${banner}export const ARTICLES = ${JSON.stringify(ARTICLES, null, 2)};\n`,
  'utf8',
);

const blocks = ARTICLES.reduce((sum, a) => sum + a.body.length, 0);
console.log(`기사 ${ARTICLES.length}건, 본문 ${blocks}덩이를 썼다.`);

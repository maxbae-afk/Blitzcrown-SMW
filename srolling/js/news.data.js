/*
  뉴스 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.

  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.
  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.
*/

export const ARTICLES = [
  {
    "id": "01",
    "category": "NEW RELEASES",
    "date": "18 AUG 2026",
    "readTime": "4 MIN READ",
    "title": "INTERSTELLAR PLINKO TURNS THE BOARD INTO A SKY",
    "summary": "Our second plinko world replaces the static peg board with charged planets that bend every drop.",
    "lead": "Most plinko boards are a grid with a picture behind them. We wanted the picture to be the grid.",
    "body": [
      {
        "type": "p",
        "text": "Interstellar Plinko began with a complaint about our own genre. A plinko board is one of the most readable objects in instant win: you drop, it bounces, it lands. But once you have watched twenty drops, the board stops telling you anything. The art sits behind the pegs and never participates."
      },
      {
        "type": "h",
        "text": "THE BOARD IS THE WORLD"
      },
      {
        "type": "p",
        "text": "In Interstellar Plinko the pegs are charged planets. They pull, they push, and they change the line the ball takes on the way down. The same drop from the same slot does not read the same twice, because the board is not a fixed lattice — it is a system that reacts."
      },
      {
        "type": "media",
        "label": "INTERSTELLAR PLINKO — CHARGED PLANET",
        "note": "21:9 · AI-generated concept image",
        "image": {
          "base": "assets/news/news-01-body-01",
          "alt": "빛나는 행성과 중력 궤적 사이를 통과하는 인터스텔라 플링코 공."
        }
      },
      {
        "type": "h",
        "text": "WHAT CHANGES FOR THE PLAYER"
      },
      {
        "type": "list",
        "items": [
          "Multiplier values travel with the board instead of sitting still in a bottom row.",
          "A drop can be redirected after it has already started falling.",
          "Art, motion and payout table are one scene, so nothing has to be explained twice."
        ]
      },
      {
        "type": "quote",
        "text": "If the background can be removed without changing the game, it was never part of the game.",
        "by": "BLITZCROWN GAME DESIGN"
      },
      {
        "type": "p",
        "text": "That rule is why the release took longer than a reskin would have. A board that reacts has to stay readable at speed, on a phone, to someone who has never seen it before. Every planet we added had to earn its place against that test."
      }
    ],
    "image": {
      "base": "assets/news/news-01-hero",
      "alt": "우주의 행성들이 핀 역할을 하는 인터스텔라 플링코 보드."
    }
  },
  {
    "id": "02",
    "category": "PARTNERSHIPS",
    "date": "04 AUG 2026",
    "readTime": "3 MIN READ",
    "title": "ONE INTEGRATION, EVERY WORLD WE BUILD",
    "summary": "Every Blitzcrown title ships behind a single API, so adding the next game is a configuration change.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-02-hero",
      "alt": "하나의 연결선에서 네 개의 게임 세계로 확장되는 블리츠크라운 통합 화면."
    }
  },
  {
    "id": "03",
    "category": "EVENTS",
    "date": "21 JUL 2026",
    "readTime": "3 MIN READ",
    "title": "FOUR WORLDS ON ONE WALL",
    "summary": "We built the stand around four key visuals and one question: can you tell these games apart from ten metres away?",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "image": {
      "base": "assets/news/news-03-stand",
      "alt": "Blitzcrown 전시 부스 전경. 정면 대형 화면에 네 개의 게임 키비주얼이 나란히 걸려 있다."
    },
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "media",
        "label": "STAND — FOUR KEY VISUALS ON ONE WALL",
        "note": "21:9 · AI-generated concept image",
        "image": {
          "base": "assets/news/news-03-body-01",
          "alt": "네 개의 게임 키비주얼과 블리츠크라운 로고가 보이는 전시 공간."
        }
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true
  },
  {
    "id": "04",
    "category": "NEW RELEASES",
    "date": "07 JUL 2026",
    "readTime": "4 MIN READ",
    "title": "TWIN CRASH: BLITZ PUTS TWO CURVES IN ONE ROUND",
    "summary": "Two planes climb together and crash apart, so every round asks whether to split the stake or commit.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "media",
        "label": "TWIN CRASH: BLITZ — TWO CURVES DIVERGING",
        "note": "16:9 · in-game capture",
        "image": {
          "base": "assets/news/news-04-body-01",
          "alt": "TWIN CRASH: BLITZ — TWO CURVES DIVERGING"
        }
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-04-hero",
      "alt": "TWIN CRASH: BLITZ PUTS TWO CURVES IN ONE ROUND"
    }
  },
  {
    "id": "05",
    "category": "LICENSING",
    "date": "23 JUN 2026",
    "readTime": "4 MIN READ",
    "title": "HOW A GAME GETS FROM OUR BUILD TO A CERTIFIED RELEASE",
    "summary": "A plain description of the steps every Blitzcrown title passes before it can appear in a lobby.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication.",
          "DUMMY LIST ITEM 04 — replace before publication."
        ]
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-05-hero",
      "alt": "게임 빌드와 출시 검증 과정을 다루는 블리츠크라운 품질 관리 공간."
    }
  },
  {
    "id": "06",
    "category": "PARTNERSHIPS",
    "date": "09 JUN 2026",
    "readTime": "3 MIN READ",
    "title": "WHAT WE ASK BEFORE WE AGREE TO A LOBBY",
    "summary": "Distribution is a design decision. These are the questions we ask before a title goes anywhere.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication.",
          "DUMMY LIST ITEM 04 — replace before publication."
        ]
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-06-hero",
      "alt": "네 개의 게임 세계와 통합 환경을 함께 검토하는 파트너 미팅 공간."
    }
  },
  {
    "id": "07",
    "category": "NEW RELEASES",
    "date": "26 MAY 2026",
    "readTime": "3 MIN READ",
    "title": "DOUBLE POP PLINKO 51200X: WHEN ONE BALL BECOMES MANY",
    "summary": "Balls pop, split and re-launch across the board, so a single drop can turn into a chain of drops.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "media",
        "label": "DOUBLE POP PLINKO 51200X — CHAIN OF DROPS",
        "note": "21:9 · AI-generated concept image",
        "image": {
          "base": "assets/news/news-07-body-01",
          "alt": "하나의 공이 여러 색상의 공으로 증식하며 이어지는 플링코 낙하 장면."
        }
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-07-hero",
      "alt": "여러 개로 증식하는 공이 플링코 보드로 떨어지는 더블 팝 플링코 장면."
    }
  },
  {
    "id": "08",
    "category": "EVENTS",
    "date": "12 MAY 2026",
    "readTime": "3 MIN READ",
    "title": "BUILDING A WORLD BEFORE BUILDING A GAME",
    "summary": "An open session on how a Blitzcrown title starts as a place rather than as a mechanic.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-08-hero",
      "alt": "게임 제작 전 여러 세계관의 키비주얼을 검토하는 블리츠크라운 스튜디오."
    }
  },
  {
    "id": "09",
    "category": "LICENSING",
    "date": "28 APR 2026",
    "readTime": "3 MIN READ",
    "title": "LICENSED AND REGULATED BY THE MALTA GAMING AUTHORITY",
    "summary": "The licence, the entity behind it, and where to verify both.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication.",
          "DUMMY LIST ITEM 04 — replace before publication.",
          "DUMMY LIST ITEM 05 — replace before publication."
        ]
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-09-hero",
      "alt": "블리츠크라운 로고와 검증 설비가 배치된 라이선싱 및 컴플라이언스 공간."
    }
  },
  {
    "id": "10",
    "category": "NEW RELEASES",
    "date": "14 APR 2026",
    "readTime": "4 MIN READ",
    "title": "SMASH TOWER: SMASH, CLIMB OR CASH OUT",
    "summary": "Our first tower title turns every floor into a single decision, and every decision into a bigger one.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "media",
        "label": "SMASH TOWER — BREAKING A FLOOR",
        "note": "21:9 · AI-generated concept image",
        "image": {
          "base": "assets/news/news-10-body-01",
          "alt": "해머 충격으로 타워 바닥이 갈라지고 아래 보상 공간이 드러나는 장면."
        }
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-10-hero",
      "alt": "전사가 해머로 타워의 바닥을 부수는 스매시 타워의 핵심 장면."
    }
  },
  {
    "id": "11",
    "category": "PARTNERSHIPS",
    "date": "31 MAR 2026",
    "readTime": "3 MIN READ",
    "title": "COMMERCIALLY PREPARED, NOT COMMERCIALLY COMPROMISED",
    "summary": "What we mean when we say a title is partner-ready, and what we refuse to change to get there.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication.",
          "DUMMY LIST ITEM 04 — replace before publication."
        ]
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true,
    "image": {
      "base": "assets/news/news-11-hero",
      "alt": "게임 세계를 중심으로 파트너십을 논의하는 블리츠크라운 프레젠테이션 룸."
    }
  },
  {
    "id": "12",
    "category": "EVENTS",
    "date": "17 MAR 2026",
    "readTime": "3 MIN READ",
    "title": "MANY WORLDS, ONE CROWN: WHERE THE STUDIO STARTED",
    "summary": "The founding idea, put on a wall in public and tested by people who owe us nothing.",
    "lead": "DUMMY LEAD — replace with the final standfirst before publication.",
    "image": {
      "base": "assets/news/news-12-worlds",
      "alt": "Blitzcrown 전시 부스. 로고 아래로 게임 화면이 늘어선 벽 앞에 관람객이 모여 있다."
    },
    "body": [
      {
        "type": "p",
        "text": "DUMMY COPY — body paragraph. Replace this with the final article text before publication. The length here is set to roughly the word count the layout expects, so that line breaks, column height and the gap to the next block match the finished page. None of this is approved copy."
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      },
      {
        "type": "media",
        "label": "STAND — GAME WALL AND VISITORS",
        "note": "21:9 · venue photography",
        "image": {
          "base": "assets/news/12-body-04-many-worlds-one-crown-where-the-studi"
        }
      },
      {
        "type": "h",
        "text": "DUMMY SUBHEADING"
      },
      {
        "type": "list",
        "items": [
          "DUMMY LIST ITEM 01 — replace before publication.",
          "DUMMY LIST ITEM 02 — replace before publication.",
          "DUMMY LIST ITEM 03 — replace before publication."
        ]
      },
      {
        "type": "quote",
        "text": "DUMMY PULL QUOTE — one line, replace before publication.",
        "by": "PLACEHOLDER ATTRIBUTION"
      },
      {
        "type": "p",
        "text": "DUMMY COPY — closing paragraph. Replace before publication. Kept shorter than the opening block so the end of the article does not run level with the sidebar."
      }
    ],
    "dummy": true
  }
];

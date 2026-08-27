/*
  게임 자료. 관리자 페이지(admin.html)가 통째로 덮어쓰는 파일이다.

  손으로 고쳐도 되지만, 관리자에서 저장하면 이 파일 전체가 다시 쓰인다.
  그래서 주석이나 도우미 함수를 여기 두지 않는다. 그런 것은 옆 모듈에 있다.
*/

export const GAMES = [
  {
    "slug": "smash-tower",
    "title": "SMASH TOWER",
    "badge": "NEW",
    "category": "MINE",
    "premise": "SMASH. CLIMB. CASH OUT.",
    "summary": "Break a floor, take what is behind it, and decide whether the next one is worth the climb. Every level raises the multiplier and the cost of being wrong.",
    "demo": "https://blitzcrown.massivegaming.io/game_info?title=smash-tower",
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "SMASH TOWER · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "SMASH TOWER · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "SMASH TOWER · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "SMASH TOWER · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "PICK & REVEAL"
      ],
      [
        "CATEGORY",
        "MINE"
      ],
      [
        "RELEASE DATE",
        "APR 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.60%"
      ],
      [
        "MAX WIN",
        "10,000x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 100.00"
      ],
      [
        "ROUND LENGTH",
        "25 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "double-pop-plinko",
    "title": "DOUBLE POP PLINKO 51200X",
    "badge": "NEW",
    "category": "PLINKO",
    "premise": "MULTI-BALL PLINKO WITH RE-LAUNCHES.",
    "summary": "One ball becomes many. Balls pop, split and re-launch across the board, so a single drop can turn into a chain of drops before the round settles.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "DOUBLE POP PLINKO · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "DOUBLE POP PLINKO · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "DOUBLE POP PLINKO · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "DOUBLE POP PLINKO · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "MULTI-BALL"
      ],
      [
        "CATEGORY",
        "PLINKO"
      ],
      [
        "RELEASE DATE",
        "MAY 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.30%"
      ],
      [
        "MAX WIN",
        "51,200x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 200.00"
      ],
      [
        "ROUND LENGTH",
        "7 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "twin-crash-blitz",
    "title": "TWIN CRASH: BLITZ",
    "badge": "NEW",
    "category": "CRASH",
    "premise": "TWO PLANES. TWO MULTIPLIERS.",
    "summary": "Two planes climb together and crash apart. Every round asks whether to split the stake between them or commit everything to one curve.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "TWIN CRASH · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "TWIN CRASH · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "TWIN CRASH · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "TWIN CRASH · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "DUAL MULTIPLIER"
      ],
      [
        "CATEGORY",
        "CRASH"
      ],
      [
        "RELEASE DATE",
        "JUN 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "97.00%"
      ],
      [
        "MAX WIN",
        "25,000x"
      ],
      [
        "VOLATILITY",
        "VERY HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.20 / 500.00"
      ],
      [
        "ROUND LENGTH",
        "12 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "super-card-rush",
    "title": "SUPER CARD RUSH",
    "badge": "POPULAR",
    "category": "OTHER",
    "premise": "CARD STRATEGY IN A SINGLE ROUND.",
    "summary": "A full hand of decisions compressed into one round. Each card you keep changes what the next one is worth, and the round ends the moment you stop.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "SUPER CARD RUSH · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "SUPER CARD RUSH · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "SUPER CARD RUSH · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "SUPER CARD RUSH · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "CARD"
      ],
      [
        "CATEGORY",
        "OTHER"
      ],
      [
        "RELEASE DATE",
        "JUL 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.20%"
      ],
      [
        "MAX WIN",
        "5,000x"
      ],
      [
        "VOLATILITY",
        "MEDIUM"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 150.00"
      ],
      [
        "ROUND LENGTH",
        "15 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "interstellar-plinko",
    "title": "INTERSTELLAR PLINKO",
    "badge": "POPULAR",
    "category": "PLINKO",
    "premise": "COSMIC DROPS AND CHARGED PLANETS.",
    "summary": "The pegs are charged planets that pull and push the ball on its way down. The same drop from the same slot does not read the same twice.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "INTERSTELLAR PLINKO · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "INTERSTELLAR PLINKO · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "INTERSTELLAR PLINKO · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "INTERSTELLAR PLINKO · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "MULTIPLIER"
      ],
      [
        "CATEGORY",
        "PLINKO"
      ],
      [
        "RELEASE DATE",
        "AUG 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.60%"
      ],
      [
        "MAX WIN",
        "20,000x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 200.00"
      ],
      [
        "ROUND LENGTH",
        "7 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "fast-crash-blitz",
    "title": "FAST CRASH: BLITZ",
    "badge": "POPULAR",
    "category": "CRASH",
    "premise": "FAST ROUNDS. INSTANT CASHOUT.",
    "summary": "A crash round stripped to its shortest form. The curve moves fast, the cashout is one tap, and the next round starts before you have finished thinking about the last one.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "FAST CRASH: BLITZ · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "FAST CRASH: BLITZ · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "FAST CRASH: BLITZ · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "FAST CRASH: BLITZ · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "MULTIPLIER"
      ],
      [
        "CATEGORY",
        "CRASH"
      ],
      [
        "RELEASE DATE",
        "SEP 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.80%"
      ],
      [
        "MAX WIN",
        "15,000x"
      ],
      [
        "VOLATILITY",
        "VERY HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.20 / 500.00"
      ],
      [
        "ROUND LENGTH",
        "12 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "deep-reef-plinko",
    "title": "DEEP REEF PLINKO",
    "badge": "NEW",
    "category": "PLINKO",
    "pending": true,
    "premise": "THE BOARD MOVES WITH THE TIDE.",
    "summary": "Pegs sit in a current that shifts between drops, so the path you learned on the last ball is not the path this one takes.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "DEEP REEF PLINKO · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "DEEP REEF PLINKO · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "DEEP REEF PLINKO · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "DEEP REEF PLINKO · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "CURRENT DRIFT"
      ],
      [
        "CATEGORY",
        "PLINKO"
      ],
      [
        "RELEASE DATE",
        "OCT 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.30%"
      ],
      [
        "MAX WIN",
        "12,500x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 200.00"
      ],
      [
        "ROUND LENGTH",
        "7 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "foundry-plinko",
    "title": "FOUNDRY PLINKO",
    "badge": null,
    "category": "PLINKO",
    "pending": true,
    "premise": "PEGS MELT WHERE THE BALL LANDS.",
    "summary": "Every hit softens the board. Late drops fall through gaps the early ones opened, so the round rewrites itself as it goes.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "FOUNDRY PLINKO · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "FOUNDRY PLINKO · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "FOUNDRY PLINKO · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "FOUNDRY PLINKO · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "MOLTEN PEGS"
      ],
      [
        "CATEGORY",
        "PLINKO"
      ],
      [
        "RELEASE DATE",
        "NOV 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.40%"
      ],
      [
        "MAX WIN",
        "12,500x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 200.00"
      ],
      [
        "ROUND LENGTH",
        "7 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "glacier-plinko",
    "title": "GLACIER PLINKO",
    "badge": null,
    "category": "PLINKO",
    "pending": true,
    "premise": "ONE BALL IN. TWO BALLS DOWN.",
    "summary": "The ice splits what falls through it. A single drop becomes two halves, and each half keeps a share of the multiplier.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "GLACIER PLINKO · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "GLACIER PLINKO · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "GLACIER PLINKO · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "GLACIER PLINKO · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "SPLIT DROP"
      ],
      [
        "CATEGORY",
        "PLINKO"
      ],
      [
        "RELEASE DATE",
        "APR 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.50%"
      ],
      [
        "MAX WIN",
        "12,500x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 200.00"
      ],
      [
        "ROUND LENGTH",
        "7 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "storm-chaser-blitz",
    "title": "STORM CHASER: BLITZ",
    "badge": "NEW",
    "category": "CRASH",
    "pending": true,
    "premise": "FLY INTO IT OR TURN BACK.",
    "summary": "The multiplier climbs fastest inside the storm and the storm is where the curve breaks. Distance and risk are the same number.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "STORM CHASER · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "STORM CHASER · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "STORM CHASER · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "STORM CHASER · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "CRASH"
      ],
      [
        "KEY MECHANIC",
        "WEATHER MULTIPLIER"
      ],
      [
        "CATEGORY",
        "CRASH"
      ],
      [
        "RELEASE DATE",
        "MAY 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "97.20%"
      ],
      [
        "MAX WIN",
        "18,000x"
      ],
      [
        "VOLATILITY",
        "VERY HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.20 / 500.00"
      ],
      [
        "ROUND LENGTH",
        "12 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "deep-dive-blitz",
    "title": "DEEP DIVE: BLITZ",
    "badge": null,
    "category": "CRASH",
    "pending": true,
    "premise": "THE CURVE GOES DOWN, NOT UP.",
    "summary": "A crash game read upside down. Pressure builds as you descend, and the multiplier grows with every metre you refuse to surface.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "DEEP DIVE · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "DEEP DIVE · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "DEEP DIVE · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "DEEP DIVE · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "CRASH"
      ],
      [
        "KEY MECHANIC",
        "DESCENT MULTIPLIER"
      ],
      [
        "CATEGORY",
        "CRASH"
      ],
      [
        "RELEASE DATE",
        "JUN 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.80%"
      ],
      [
        "MAX WIN",
        "18,000x"
      ],
      [
        "VOLATILITY",
        "VERY HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.20 / 500.00"
      ],
      [
        "ROUND LENGTH",
        "12 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "relay-crash-blitz",
    "title": "RELAY CRASH: BLITZ",
    "badge": "POPULAR",
    "category": "CRASH",
    "pending": true,
    "premise": "THREE RUNNERS. ONE CURVE.",
    "summary": "The multiplier is handed between three runners mid-round. Each handover is a moment where it can climb or drop everything.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "RELAY CRASH · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "RELAY CRASH · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "RELAY CRASH · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "RELAY CRASH · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "CRASH"
      ],
      [
        "KEY MECHANIC",
        "HANDOVER MULTIPLIER"
      ],
      [
        "CATEGORY",
        "CRASH"
      ],
      [
        "RELEASE DATE",
        "JUL 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.90%"
      ],
      [
        "MAX WIN",
        "18,000x"
      ],
      [
        "VOLATILITY",
        "VERY HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.20 / 500.00"
      ],
      [
        "ROUND LENGTH",
        "12 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "sunken-vault",
    "title": "SUNKEN VAULT",
    "badge": "NEW",
    "category": "MINE",
    "pending": true,
    "premise": "OPEN DOORS UNTIL THE WATER WINS.",
    "summary": "Each door you open floods the room a little further. Take what is behind it, or stop while there is still air in the corridor.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "SUNKEN VAULT · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "SUNKEN VAULT · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "SUNKEN VAULT · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "SUNKEN VAULT · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "PICK & REVEAL"
      ],
      [
        "CATEGORY",
        "MINE"
      ],
      [
        "RELEASE DATE",
        "AUG 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.80%"
      ],
      [
        "MAX WIN",
        "9,000x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 100.00"
      ],
      [
        "ROUND LENGTH",
        "25 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "ember-mine",
    "title": "EMBER MINE",
    "badge": null,
    "category": "MINE",
    "pending": true,
    "premise": "EVERY TILE YOU OPEN LIGHTS THE NEXT.",
    "summary": "Revealed tiles stay lit and show you a little of what surrounds them. Information is the reward, and it costs a pick to get.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "EMBER MINE · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "EMBER MINE · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "EMBER MINE · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "EMBER MINE · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "CASCADE REVEAL"
      ],
      [
        "CATEGORY",
        "MINE"
      ],
      [
        "RELEASE DATE",
        "SEP 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.90%"
      ],
      [
        "MAX WIN",
        "9,000x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 100.00"
      ],
      [
        "ROUND LENGTH",
        "25 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "hollow-crown",
    "title": "HOLLOW CROWN",
    "badge": "POPULAR",
    "category": "MINE",
    "pending": true,
    "premise": "TAKE THE CROWN OR TAKE THE ROOM.",
    "summary": "Every room holds one crown and one way out. Leaving with the crown ends the run; leaving it raises what the next room is worth.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "HOLLOW CROWN · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "HOLLOW CROWN · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "HOLLOW CROWN · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "HOLLOW CROWN · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "RISK LADDER"
      ],
      [
        "CATEGORY",
        "MINE"
      ],
      [
        "RELEASE DATE",
        "OCT 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "97.00%"
      ],
      [
        "MAX WIN",
        "9,000x"
      ],
      [
        "VOLATILITY",
        "HIGH"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 100.00"
      ],
      [
        "ROUND LENGTH",
        "25 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "spin-court",
    "title": "SPIN COURT",
    "badge": "NEW",
    "category": "OTHER",
    "pending": true,
    "premise": "ONE WHEEL. FOUR VERDICTS.",
    "summary": "The wheel does not pay directly. It decides which of four judges rules on your round, and each one reads the same result differently.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "SPIN COURT · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "SPIN COURT · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "SPIN COURT · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "SPIN COURT · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "WHEEL"
      ],
      [
        "CATEGORY",
        "OTHER"
      ],
      [
        "RELEASE DATE",
        "NOV 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "95.90%"
      ],
      [
        "MAX WIN",
        "6,500x"
      ],
      [
        "VOLATILITY",
        "MEDIUM"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 150.00"
      ],
      [
        "ROUND LENGTH",
        "15 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "keystone",
    "title": "KEYSTONE",
    "badge": null,
    "category": "OTHER",
    "pending": true,
    "premise": "PLACE THE ARCH BEFORE IT FALLS.",
    "summary": "Build upward one stone at a time. The arch holds only when the last stone lands, and every stone before it raises what holding is worth.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "KEYSTONE · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "KEYSTONE · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "KEYSTONE · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "KEYSTONE · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "BUILD & HOLD"
      ],
      [
        "CATEGORY",
        "OTHER"
      ],
      [
        "RELEASE DATE",
        "APR 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.00%"
      ],
      [
        "MAX WIN",
        "6,500x"
      ],
      [
        "VOLATILITY",
        "MEDIUM"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 150.00"
      ],
      [
        "ROUND LENGTH",
        "15 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  },
  {
    "slug": "lantern-draw",
    "title": "LANTERN DRAW",
    "badge": "POPULAR",
    "category": "OTHER",
    "pending": true,
    "premise": "LIGHT ONE, KEEP ONE, RELEASE ONE.",
    "summary": "Three lanterns per round and only one can be kept. What you release does not disappear — it sets the value of the next draw.",
    "demo": null,
    "media": [
      {
        "type": "image",
        "src": null,
        "label": "LANTERN DRAW · KEY ART",
        "note": "16:9 · full-bleed key visual"
      },
      {
        "type": "video",
        "src": null,
        "poster": null,
        "label": "LANTERN DRAW · GAMEPLAY",
        "note": "16:9 · loop, no audio"
      },
      {
        "type": "image",
        "src": null,
        "label": "LANTERN DRAW · SCREENSHOT 01",
        "note": "16:9 · in-game capture"
      },
      {
        "type": "image",
        "src": null,
        "label": "LANTERN DRAW · SCREENSHOT 02",
        "note": "16:9 · win moment"
      }
    ],
    "meta": [
      [
        "GAME TYPE",
        "INSTANT WIN"
      ],
      [
        "KEY MECHANIC",
        "DRAW & KEEP"
      ],
      [
        "CATEGORY",
        "OTHER"
      ],
      [
        "RELEASE DATE",
        "MAY 2026"
      ]
    ],
    "specs": [
      [
        "RTP",
        "96.10%"
      ],
      [
        "MAX WIN",
        "6,500x"
      ],
      [
        "VOLATILITY",
        "MEDIUM"
      ],
      [
        "MIN / MAX BET",
        "0.10 / 150.00"
      ],
      [
        "ROUND LENGTH",
        "15 SEC AVG"
      ],
      [
        "CERTIFICATION",
        "GLI-19 · ISO/IEC 17025"
      ]
    ]
  }
];

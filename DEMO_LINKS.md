# 게임 데모 주소 목록

공식 사이트(`blitzcrown.massivegaming.io`)의 게임 25개를 하나씩 열어 실제로 뜬 iframe 주소를 뽑은 것이다.
2026-08-31 기준이며, `.tools/demo-links.mjs` 를 돌리면 다시 뽑아 `.tools/demo-links.json` 을 갱신한다.

주소 규칙이 게임마다 달라서 이름으로 계산해 낼 수 없다. 그래서 하나씩 적어 둔다.
`?operator=demo` 가 붙지 않은 것은 사이트가 실제로 그렇게 띄우고 있어서 그대로 옮긴 것이다.

이 주소들은 `X-Frame-Options` 나 CSP `frame-ancestors` 제한이 없어 우리 페이지 안에 그대로 넣을 수 있다.

MASSIVE LIMBO 만 공식 목록이 아니라 따로 받은 베타 주소다. 호스트도 `games.dq.ntcc…` 로 다르다.
그래서 `demo-links.mjs` 를 다시 돌려도 이 줄은 나오지 않는다.

## 우리 사이트에 실린 게임

| 게임 | 슬러그 | 데모 주소 |
| --- | --- | --- |
| SMASH TOWER | `smash-tower` | https://games.ntcc.massivegaming.io/st-mine/ |
| MASSIVE LIMBO (베타) | `massive-limbo` | https://games.dq.ntcc.massivegaming.io/mb-limbo-arts2/ |
| TWIN CRASH BLITZ | `twin-crash-blitz` | https://games.ntcc.massivegaming.io/twin-crash-blitz/?operator=demo |
| SUPER CARD RUSH | `super-card-rush` | https://games.ntcc.massivegaming.io/scr-collect/ |
| INTERSTELLAR PLINKO | `interstellar-plinko` | https://games.ntcc.massivegaming.io/is-plinko/ |
| FAST CRASH BLITZ | `fast-crash-blitz` | https://games.ntcc.massivegaming.io/fast-crash-blitz/?operator=demo |

## 아직 우리 사이트에 없는 게임

| 슬러그 | 데모 주소 |
| --- | --- |
| `pumpkin-pop-plinko` | https://games.ntcc.massivegaming.io/pp-plinko-hw/?operator=demo |
| `poker-stadium` | https://games.ntcc.massivegaming.io/ps-table/?operator=demo |
| `multiplier-baccarat` | https://games.ntcc.massivegaming.io/mb-table/?operator=demo |
| `dark-horse` | https://games.ntcc.massivegaming.io/dh-table/ |
| `double-pop-plinko` | https://games.ntcc.massivegaming.io/dp-plinko/?operator=demo |
| `double-pop-plinko-51200` | https://games.ntcc.massivegaming.io/dp-plinko-51k/ |
| `nine-knights-strikers` | https://games.ntcc.massivegaming.io/nk-table-wc/?operator=demo |
| `double-pop-plinko-goals` | https://games.ntcc.massivegaming.io/dp-plinko-wc/?operator=demo |
| `dragon-wizard-fly2win` | https://games.ntcc.massivegaming.io/dwf2w-crash/ |
| `dragon-and-wizard-jump2win` | https://games.ntcc.massivegaming.io/dwj2w-crash/ |
| `dragon-and-wizard` | https://games.ntcc.massivegaming.io/dw-crash/?operator=demo&lang=en |
| `epic-strike-tower-of-zeus` | https://games.ntcc.massivegaming.io/zeus-tower/?operator=demo |
| `lollypop-plinko` | https://games.ntcc.massivegaming.io/lp-plinko/ |
| `snowball-plinko` | https://games.ntcc.massivegaming.io/sb-plinko/?operator=demo |
| `nine-knights` | https://games.ntcc.massivegaming.io/nine-knights/ |
| `fortune-ball-plinko` | https://games.ntcc.massivegaming.io/fb-plinko/?operator=demo |
| `boom-boom-hit-plinko` | https://games.ntcc.massivegaming.io/bbh-plinko/?operator=demo |
| `twin-crash` | https://games.ntcc.massivegaming.io/twin-crash/?operator=demo |
| `fastcrash` | https://games.ntcc.massivegaming.io/fast-crash/ |
| `crash` | https://games.ntcc.massivegaming.io/crash/?operator=demo |

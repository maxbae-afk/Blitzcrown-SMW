/*
  데모 플레이어를 세 경우로 확인한다.
  PC 기본(가로형), PC 에서 목업으로 전환, 폰으로 접속.

  목업 쪽에서는 게임이 받은 창 크기가 402x874 인지도 함께 본다.
  그 크기라야 실제 폰에서 여는 것과 같은 화면이 나온다.
*/

import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PAGE = 'http://127.0.0.1:4321/game.html?title=smash-tower';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--hide-scrollbars'] });

const inner = (page) => {
  const frame = page.frames().find((f) => f.url().includes('ntcc'));
  return frame
    ? frame.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))
    : Promise.resolve(null);
};

/* 1) PC */
const desk = await browser.newPage();
await desk.setViewport({ width: 1680, height: 950 });
await desk.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await wait(2500);
await desk.$$eval('#gameActions a', (nodes) => nodes[0]?.click());
await wait(14000);
console.log('PC 기본, 게임이 받은 창', JSON.stringify(await inner(desk)));
await desk.screenshot({ path: 'shots/demo-pc.png' });

/* 2) PC 에서 목업으로 */
await desk.$$eval('.demoplay-mode', (nodes) =>
  nodes.find((node) => node.dataset.mode === 'mobile')?.click(),
);
await wait(15000);
console.log('목업, 게임이 받은 창', JSON.stringify(await inner(desk)));
console.log(
  '목업 배치',
  JSON.stringify(
    await desk.evaluate(() => {
      const box = document.querySelector('.demoplay-device').getBoundingClientRect();
      const frame = document.querySelector('.demoplay-frame').getBoundingClientRect();
      return {
        box: [Math.round(box.width), Math.round(box.height)],
        frame: [Math.round(frame.width), Math.round(frame.height)],
        scale: getComputedStyle(document.querySelector('.demoplay-device')).transform,
      };
    }),
  ),
);
await desk.screenshot({ path: 'shots/demo-mockup.png' });

// 목업 안에서 마우스로 실제로 눌러 본다.
const box = await (await desk.$('.demoplay-frame')).boundingBox();
await desk.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await wait(3000);
await desk.mouse.click(box.x + box.width / 2, box.y + box.height * 0.85);
await wait(6000);
await desk.screenshot({ path: 'shots/demo-mockup-play.png' });
await desk.close();

/* 3) 폰으로 접속 */
const phone = await browser.newPage();
await phone.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await phone.setUserAgent(
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
);
await phone.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await wait(2500);
await phone.$$eval('#gameActions a', (nodes) => nodes[0]?.click());
await wait(15000);
console.log('폰, 게임이 받은 창', JSON.stringify(await inner(phone)));
console.log(
  '폰에서 전환 버튼 숨김',
  await phone.$eval('.demoplay-modes', (node) => node.hidden),
);
await phone.screenshot({ path: 'shots/demo-phone.png' });
await phone.close();

await browser.close();

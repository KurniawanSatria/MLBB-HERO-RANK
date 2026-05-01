import puppeteer from 'puppeteer';

const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
 // executablePath: '/usr/bin/chromium-browser',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();

await page.goto('https://www.mobilelegends.com/rank', {
  waitUntil: 'networkidle2'
});

await page.setViewport({ width: 1204, height: 789 });

// close modal
try {
  await page.click('.mt-cb-policy-close', { timeout: 5000 });
} catch {}

// reject cookies
try {
  await page.click('#mt-cb-s', { timeout: 5000 });
} catch {}

// tunggu list muncul (pakai yang stabil)
await page.waitForSelector('.mt-list-layout');

// WIN RATE
let elWin = await page.$('.mt-list-layout');
await elWin.screenshot({ path: 'rank-by-winrate.png' });

// helper klik by text (lebih clean)
async function clickTwice(text) {
  for (let i = 0; i < 2; i++) {
    await page.evaluate((t) => {
      const el = [...document.querySelectorAll('span')]
        .find(e => e.textContent.includes(t));
      el?.click();
    }, text);
    await delay(700);
  }
  await delay(1200);
}

// BAN RATE
await clickTwice('BAN RATE');
let elBan = await page.$('.mt-list-layout');
await elBan.screenshot({ path: 'rank-by-ban.png' });

// PICK RATE
await clickTwice('PICK RATE');
let elPick = await page.$('.mt-list-layout');
await elPick.screenshot({ path: 'rank-by-pick.png' });

await browser.close();

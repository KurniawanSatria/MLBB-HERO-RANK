import puppeteer from 'puppeteer';

const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();

await page.setViewport({
  width: 1204,
  height: 789
});

await page.goto('https://www.mobilelegends.com/rank', {
  waitUntil: 'domcontentloaded'
});

  try {
    await page.locator(".mt-cb-policy-close").click({ timeout: 3000 });
  } catch {}

  try {
    await page.locator("#mt-cb-s").click({ timeout: 3000 });
  } catch {}

await page.waitForSelector('.mt-list-layout', {
  visible: true,
  timeout: 15000
});

await page.evaluate(() => {
  const dropdown = [...document.querySelectorAll('.mt-dropdown')].find(el =>
    el.textContent.includes('ALL') &&
    el.querySelector('.mt-dropdown-list')
  );

  if (!dropdown) return;

  const trigger =
    dropdown.querySelector('[style*="cursor: pointer"]') ||
    dropdown;

  trigger.click();
});

await page.waitForFunction(() => {
  return [...document.querySelectorAll('.mt-list-item')]
    .some(el => el.textContent.includes('Mythical Glory+'));
}, {
  timeout: 10000
});

await page.evaluate(() => {
  const target = [...document.querySelectorAll('.mt-list-item')]
    .find(el => el.textContent.includes('Mythical Glory+'));

  target?.click();
});

await delay(1500);

async function getContainer() {
  const ul = await page.waitForSelector('.mt-list-layout', {
    visible: true
  });

  return await ul.evaluateHandle(e => {
    let current = e;

    for (let i = 0; i < 3; i++) {
      if (current.parentElement) current = current.parentElement;
    }

    return current;
  });
}

async function clickTwice(text) {
  for (let i = 0; i < 2; i++) {
    await page.evaluate(t => {
      const el = [...document.querySelectorAll('span')]
        .find(e => e.textContent.includes(t));

      el?.click();
    }, text);

    await delay(700);
  }

  await delay(1200);
}

let container = await getContainer();
await container.screenshot({
  path: 'rank-by-winrate.png'
});

await clickTwice('BAN RATE');

container = await getContainer();
await container.screenshot({
  path: 'rank-by-ban.png'
});

await clickTwice('PICK RATE');

container = await getContainer();
await container.screenshot({
  path: 'rank-by-pick.png'
});

await browser.close();

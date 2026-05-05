import puppeteer from 'puppeteer';

const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.goto('https://www.mobilelegends.com/rank', { waitUntil: 'networkidle2' });
await page.setViewport({ width: 1204, height: 789 });

try { await page.click('.mt-cb-policy-close', { timeout: 5000 }); } catch { }
try { await page.click('#mt-cb-s', { timeout: 5000 }); } catch { }

await page.waitForSelector('.mt-list-layout');

// ============================================
// TAMBAHAN: Buka dropdown & pilih Mythical Glory+
// ============================================

// 1. Klik dropdown untuk membuka list (elemen yang menampilkan "ALL")
// Cari elemen yang punya class mt-dropdown dan ada span "ALL" di dalamnya
await page.evaluate(() => {
    const dropdown = [...document.querySelectorAll('.mt-dropdown')].find(el => 
        el.textContent.includes('ALL') && el.querySelector('.mt-dropdown-list')
    );
    if (dropdown) {
        // Klik bagian trigger (elemen yang style cursor: pointer di luar list)
        const trigger = dropdown.querySelector('[style*="cursor: pointer"]') || dropdown;
        trigger.click();
    }
});
await delay(1000); // Tunggu list muncul

// 2. Klik opsi "Mythical Glory+"
await page.evaluate(() => {
    const items = [...document.querySelectorAll('.mt-list-item')];
    const target = items.find(el => el.textContent.includes('Mythical Glory+'));
    if (target) target.click();
});
await delay(1500); // Tunggu data reload

// ============================================

async function getContainer() {
    const ul = await page.$('.mt-list-layout');
    return await ul.evaluateHandle(e => {
        let current = e;
        for (let i = 0; i < 3; i++) { if (current.parentElement) current = current.parentElement; }
        return current;
    });
}

async function clickTwice(text) {
    for (let i = 0; i < 2; i++) {
        await page.evaluate(t => {
            const el = [...document.querySelectorAll('span')].find(e => e.textContent.includes(t));
            el?.click();
        }, text);
        await delay(700);
    }
    await delay(1200);
}

let el = await getContainer();
await el.screenshot({ path: 'rank-by-winrate.png' });

await clickTwice('BAN RATE');
el = await getContainer();
await el.screenshot({ path: 'rank-by-ban.png' });

await clickTwice('PICK RATE');
el = await getContainer();
await el.screenshot({ path: 'rank-by-pick.png' });

await browser.close();

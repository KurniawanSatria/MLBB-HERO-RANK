import puppeteer from 'puppeteer';
import fs from 'fs';
import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1501247949240533103/qxeWTc6XL_kgATUNuowR7jLof_NOuXjfe7QZ2qqvbdNNwoGhU2S6OW-RlyWlxmim8x3v';
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

// Buka dropdown & pilih Mythical Glory+
await page.evaluate(() => {
    const dropdown = [...document.querySelectorAll('.mt-dropdown')].find(el => 
        el.textContent.includes('ALL') && el.querySelector('.mt-dropdown-list')
    );
    if (dropdown) {
        const trigger = dropdown.querySelector('[style*="cursor: pointer"]') || dropdown;
        trigger.click();
    }
});
await delay(1000);

await page.evaluate(() => {
    const items = [...document.querySelectorAll('.mt-list-item')];
    const target = items.find(el => el.textContent.includes('Mythical Glory+'));
    if (target) target.click();
});
await delay(1500);

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

// Screenshot & simpan
const screenshots = [];

let el = await getContainer();
await el.screenshot({ path: 'rank-by-winrate.png' });
screenshots.push({ label: 'Winrate', path: 'rank-by-winrate.png' });

await clickTwice('BAN RATE');
el = await getContainer();
await el.screenshot({ path: 'rank-by-ban.png' });
screenshots.push({ label: 'Ban Rate', path: 'rank-by-ban.png' });

await clickTwice('PICK RATE');
el = await getContainer();
await el.screenshot({ path: 'rank-by-pick.png' });
screenshots.push({ label: 'Pick Rate', path: 'rank-by-pick.png' });

await browser.close();

// ============================================
// UPLOAD KE DISCORD CDN & KIRIM COMPONENTS V2
// ============================================

async function uploadToDiscordCDN(filePath) {
    const form = new FormData();
    const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' });
    form.append('file', blob, filePath);
    
    const response = await fetch(`${WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        body: form
    });
    
    const data = await response.json();
    return data.attachments[0].url; // URL gambar di Discord CDN
}

async function sendComponentsV2() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Upload semua gambar ke Discord CDN dulu
    console.log('Uploading images to Discord CDN...');
    const imageUrls = [];
    for (const img of screenshots) {
        const url = await uploadToDiscordCDN(img.path);
        imageUrls.push({ label: img.label, url });
        console.log(`Uploaded ${img.label}: ${url}`);
    }

    // Build Components V2 payload
    const payload = {
        username: 'MLBB Rank Tracker',
        avatar_url: 'https://i.pinimg.com/736x/d8/03/70/d803702e747282b84e6bb11addb8d408.jpg',
        flags: 32768, // IS_COMPONENTS_V2
        
        components: [
            // Header Container
            {
                type: 17, // Container
                components: [
                    {
                        type: 10, // Text Display
                        content: `## 🏆 MLBB Hero Rank — Mythical Glory+\n-# 📅 ${timeString}`
                    },
                    { type: 14 } // Separator
                ]
            },
            
             // Pick Rate Section
            {
                type: 17,
                components: [
                    {
                        type: 10,
                        content: `### Pick Rate`
                    },
                    {
                        type: 12,
                        items: [{
                            media: { url: imageUrls[2].url }
                        }]
                    }
                ]
            },
            
            // Winrate Section
            {
                type: 17,
                components: [
                    {
                        type: 10,
                        content: `### Win Rate`
                    },
                    {
                        type: 12, // Media Gallery
                        items: [{
                            media: { url: imageUrls[0].url }
                        }]
                    }
                ]
            },
            
            { type: 14 }, // Separator
            
            // Ban Rate Section
            {
                type: 17,
                components: [
                    {
                        type: 10,
                        content: `### Ban Rate`
                    },
                    {
                        type: 12,
                        items: [{
                            media: { url: imageUrls[1].url }
                        }]
                    }
                ]
            },
            
            { type: 14 }, // Separator
            
            // Footer
            {
                type: 17,
                components: [
                    { type: 14 },
                    {
                        type: 10,
                        content: `-# <a:code:1438255594854289419> Auto-scraped from [mobilelegends.com](https://www.mobilelegends.com/rank)`
                    }
                ]
            }
        ]
    };

    // Kirim payload Components V2
    const response = await fetch(`${WEBHOOK_URL}?with_components=true`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log('Discord response:', response.status, result);

    // Cleanup file lokal
    for (const img of screenshots) {
        fs.unlinkSync(img.path);
        console.log(`Deleted ${img.path}`);
    }
}

await sendComponentsV2();
console.log('Done! Components V2 sent to Discord.');

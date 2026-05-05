import fs from 'fs';
import FormData from 'form-data';

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const screenshots = [
{ label: 'Win Rate',  path: 'rank-by-winrate.png' },
{ label: 'Ban Rate',  path: 'rank-by-ban.png' },
{ label: 'Pick Rate', path: 'rank-by-pick.png' },
];

const timeString = new Date().toLocaleString('en-US', {
weekday: 'long', day: 'numeric',
month: 'long', hour: '2-digit', minute: '2-digit'
});

const payload = {
username: 'MLBB Rank Tracker',
avatar_url: 'https://i.pinimg.com/736x/d8/03/70/d803702e747282b84e6bb11addb8d408.jpg',
flags: 32768,
attachments: screenshots.map((img, id) => ({ id, filename: img.path })),
components: [
{
type: 17,
components: [
{ type: 10, content: `## 🏆 MLBB Hero Rank — Mythical Glory+\n-# 📅 ${timeString}` },
]
},
{
type: 17,
components: [
{ type: 10, content: `### 🎯 Pick Rate` },
{ type: 12, items: [{ media: { url: `attachment://${screenshots[2].path}` } }] }
]
},
{
type: 17,
components: [
{ type: 10, content: `### 🏅 Win Rate` },
{ type: 12, items: [{ media: { url: `attachment://${screenshots[0].path}` } }] }
]
},
{
type: 17,
components: [
{ type: 10, content: `### 🚫 Ban Rate` },
{ type: 12, items: [{ media: { url: `attachment://${screenshots[1].path}` } }] }
]
},
{
type: 17,
components: [
{ type: 10, content: `-# <a:code:1438255594854289419> Auto-scraped from [mobilelegends.com](https://www.mobilelegends.com/rank)` }
]
}
]
};

const form = new FormData();
form.append('payload_json', JSON.stringify(payload));
screenshots.forEach((img, i) => {
form.append(`files[${i}]`, fs.readFileSync(img.path), {
filename: img.path,
contentType: 'image/png'
});
console.log(`📎 ${img.label}`);
});

const res = await fetch(`${WEBHOOK_URL}?with_components=true`, {
method: 'POST',
body: form.getBuffer(),       
headers: form.getHeaders()   
});


if (!res.ok) throw new Error(`Discord error: ${res.status} — ${await res.text()}`);
console.log('✅ Sent to Discord!');

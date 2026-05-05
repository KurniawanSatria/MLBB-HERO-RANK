const { GITHUB_REPOSITORY, GITHUB_REF_NAME, WEBHOOK_URL } = process.env;

// Raw GitHub URL — otomatis ambil dari env GitHub Actions
const raw = (file) =>
    `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_REF_NAME}/${file}`;

const timeString = new Date().toLocaleString('en-US', {
    weekday: 'long', day: 'numeric',
    month: 'long', hour: '2-digit', minute: '2-digit'
});

const payload = {
    username: 'MLBB Rank Tracker',
    avatar_url: 'https://i.pinimg.com/736x/d8/03/70/d803702e747282b84e6bb11addb8d408.jpg',
    flags: 32768,
    components: [
        {
            type: 17,
            components: [
                {
                    type: 10,
                    content: `## 🏆 MLBB Hero Rank — Mythical Glory+\n-# 📅 ${timeString}`
                },
                { type: 14 }
            ]
        },
        {
            type: 17,
            components: [
                { type: 10, content: `### 🎯 Pick Rate` },
                { type: 12, items: [{ media: { url: raw('rank-by-pick.png') } }] }
            ]
        },
        {
            type: 17,
            components: [
                { type: 10, content: `### 🏅 Win Rate` },
                { type: 12, items: [{ media: { url: raw('rank-by-winrate.png') } }] }
            ]
        },
        { type: 14 },
        {
            type: 17,
            components: [
                { type: 10, content: `### 🚫 Ban Rate` },
                { type: 12, items: [{ media: { url: raw('rank-by-ban.png') } }] }
            ]
        },
        { type: 14 },
        {
            type: 17,
            components: [
                {
                    type: 10,
                    content: `-# <a:code:1438255594854289419> Auto-scraped from [mobilelegends.com](https://www.mobilelegends.com/rank)`
                }
            ]
        }
    ]
};

const res = await fetch(`${WEBHOOK_URL}?with_components=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});

if (!res.ok) throw new Error(`Discord error: ${res.status} — ${await res.text()}`);
console.log('✅ Sent to Discord!');

const fs = require('fs');
const FormData = require('form-data');

const WEBHOOKS = {
  winrate: process.env.WEBHOOK_WINRATE,
  pickrate: process.env.WEBHOOK_PICKRATE,
  banrate: process.env.WEBHOOK_BANRATE,
};

const data = [
  {
    key: 'winrate',
    title: 'Win Rate',
    icon: '<:trophy:1523775943792001205>',
    file: 'rank-by-winrate.png'
  },
  {
    key: 'pickrate',
    title: 'Pick Rate',
    icon: '<:target:1523776778856824953>',
    file: 'rank-by-pick.png'
  },
  {
    key: 'banrate',
    title: 'Ban Rate',
    icon: '<:prohibited:1523776846553022464>',
    file: 'rank-by-ban.png'
  }
];

const timeString = `<t:${Math.floor(Date.now() / 1000)}:F>`;

async function sendRank(item) {
  const payload = {
    username: 'MLBB Rank Tracker',
    avatar_url: 'https://i.pinimg.com/736x/d8/03/70/d803702e747282b84e6bb11addb8d408.jpg',
    flags: 32768,
    attachments: [
      {
        id: 0,
        filename: item.file
      }
    ],
    components: [
      {
        type: 17,
        components: [
          {
            type: 10,
            content: `## ${item.icon} ${item.title}\n-# <:calendar:1523776798918447115> ${timeString}`
          },
          {
            type: 14
          },
          {
            type: 12,
            items: [
              {
                media: {
                  url: `attachment://${item.file}`
                }
              }
            ]
          },
          {
            type: 14
          },
          {
            type: 10,
            content: `-# <:arrowrotate:1523776867675537488> data from [mobilelegends.com](https://www.mobilelegends.com/rank)`
          }
        ]
      }
    ]
  };

  const form = new FormData();

  form.append(
    'payload_json',
    JSON.stringify(payload)
  );

  form.append(
    'files[0]',
    fs.readFileSync(item.file),
    {
      filename: item.file,
      contentType: 'image/png'
    }
  );

  const res = await fetch(
    `${WEBHOOKS[item.key]}?with_components=true`,
    {
      method: 'POST',
      body: form.getBuffer(),
      headers: form.getHeaders()
    }
  );

  if (!res.ok) {
    throw new Error(`${item.key}: ${res.status} ${await res.text()}`);
  }

  console.log(`✅ ${item.title}`);
}

(async () => {
  for (const item of data) {
    await sendRank(item);
  }
})();

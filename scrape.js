const { chromium } = require("playwright");
const fs = require("fs");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[''.]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.goto("https://www.mobilelegends.com/hero", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  try {
    await page.locator(".mt-cb-policy-close").click({
      timeout: 3000,
    });
  } catch {}

  try {
    await page.locator("#mt-cb-s").click({
      timeout: 3000,
    });
  } catch {}

  await page.waitForSelector('[data-node="2680270"] .mt-list-item', {
    timeout: 30000,
  });

await page.mouse.move(1000, 700);

let lastCount = 0;
let same = 0;

while (true) {
  await page.mouse.wheel(0, 1500);

  await page.waitForTimeout(1500);

  const count = await page.locator('[data-node="2680270"] .mt-list-item').count();

  console.log("Loaded hero:", count);

  if (count === lastCount) {
    same++;
  } else {
    same = 0;
  }

  lastCount = count;

  const atBottom = await page.evaluate(() => {
    return window.innerHeight + window.scrollY >= document.body.scrollHeight - 5;
  });

  if (atBottom && same >= 3) {
    break;
  }
}

  const rawDebug = await page.locator(
    '[data-node="2680270"] .mt-list-item:nth-child(1)'
  ).evaluateAll((items) => {
    const img = items[0]?.querySelector(".mt-image img");
    const div = items[0]?.querySelector(".mt-image");
    return {
      outer: items[0]?.querySelector(".mt-image")?.innerHTML?.substring(0, 1000),
      imgOuter: img?.outerHTML?.substring(0, 1000),
      allAttrs: img ? Array.from(img.attributes).map(a => `${a.name}=${a.value}`) : [],
      divAttrs: div ? Array.from(div.attributes).map(a => `${a.name}=${a.value}`) : [],
    };
  });
  console.log("DEBUG IMG:", JSON.stringify(rawDebug, null, 2));

  const heroes = await page.locator(
    '[data-node="2680270"] .mt-list-item'
  ).evaluateAll((items) => {
    return items.map((item) => {
      // Name
      let name = item.querySelector(".mt-text span")?.textContent?.trim();
      if (!name) name = item.querySelector(".mt-text")?.textContent?.trim();
      if (!name) name = item.textContent?.trim();

      // Image — coba SEMUA kemungkinan atribut
      let img = item.querySelector(".mt-image img");
      let image = "";
      if (img) {
        image = img.src
          || img.getAttribute("data-src")
          || img.getAttribute("data-lazy-src")
          || img.getAttribute("data-original")
          || img.getAttribute("data-url")
          || img.getAttribute("srcset")?.split(",")[0]?.trim()?.split(" ")[0]
          || "";
      }
      // Fallback: img lain di item
      if (!image) {
        const anyImg = item.querySelector("img");
        if (anyImg) {
          image = anyImg.src
            || anyImg.getAttribute("data-src")
            || anyImg.getAttribute("data-lazy-src")
            || anyImg.getAttribute("data-original")
            || anyImg.getAttribute("data-url")
            || "";
        }
      }

      return { name, image };
    }).filter((hero) => hero.name && hero.image);
  });

  console.log(`Total hero: ${heroes.length}`);

  // Fetch counter data for each hero
  const result = [];
  for (let i = 0; i < heroes.length; i++) {
    const hero = heroes[i];
    const slug = slugify(hero.name);
    console.log(`[${i + 1}/${heroes.length}] Fetching ${hero.name} (${slug})...`);

    try {
      const response = await fetch(
        `https://mlbb.tools/api/counter?heroSlug=${slug}&rankTier=all`
      );
      const data = await response.json();

      result.push({
        name: hero.name,
        image: hero.image,
        slug: data.hero?.slug || slug,
        roles: data.hero?.roles || [],
        lanes: data.hero?.lanes || [],
        counters: (data.counters || []).map((c) => ({
          name: c.hero_a?.name,
          slug: c.hero_a?.slug,
          win_rate: c.win_rate,
          increase_win_rate: c.increase_win_rate,
        })),
        counteredBy: (data.counteredBy || []).map((c) => ({
          name: c.hero_b?.name,
          slug: c.hero_b?.slug,
          win_rate: c.win_rate,
          increase_win_rate: c.increase_win_rate,
        })),
      });
    } catch (err) {
      console.error(`Failed to fetch ${hero.name}: ${err.message}`);
      result.push({
        name: hero.name,
        image: hero.image,
        slug,
        roles: [],
        lanes: [],
        counters: [],
        counteredBy: [],
      });
    }

    // Rate limit delay
    await new Promise((r) => setTimeout(r, 500));
  }

  fs.writeFileSync("result.json", JSON.stringify(result, null, 2));
  console.log("Done! result.json written.");

  await browser.close();
})();
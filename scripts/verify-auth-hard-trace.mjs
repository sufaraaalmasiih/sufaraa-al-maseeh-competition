import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const routes = ["/facilitator", "/team", "/login"];

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
});
const page = await browser.newPage();
const hardTraces = [];
const pageErrors = [];

page.on("console", (msg) => {
  const text = msg.text();
  if (text.includes("[AUTH HARD TRACE]")) {
    hardTraces.push(text);
  }
});
page.on("pageerror", (error) => {
  pageErrors.push(error.message);
});

for (const route of routes) {
  hardTraces.length = 0;
  pageErrors.length = 0;

  console.log(`\n=== ${route} ===`);
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(6000);

  const bodyText = await page.locator("body").innerText();
  const panelText =
    (await page.locator('[data-testid="real-loading-debug-panel"]').count()) > 0
      ? await page.locator('[data-testid="real-loading-debug-panel"]').innerText()
      : "";

  console.log("Stuck loading:", bodyText.includes("جاري التحميل"));
  console.log("Hard trace count:", hardTraces.length);
  console.log("Last 8 hard traces:");
  hardTraces.slice(-8).forEach((line) => console.log(" ", line));
  if (pageErrors.length) {
    console.log("Page errors:", pageErrors.join(" | "));
  }
  if (panelText) {
    console.log("Debug panel excerpt:\n", panelText.slice(0, 800));
  }
}

await browser.close();

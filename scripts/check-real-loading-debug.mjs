import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const routes = ["/login", "/team", "/facilitator"];
const storagePath = path.resolve("scripts/.auth-storage.json");
const hasStorage = fs.existsSync(storagePath);

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
});

const context = await browser.newContext(
  hasStorage ? { storageState: storagePath } : undefined,
);
const page = await context.newPage();
const debugLogs = [];

page.on("console", (msg) => {
  const text = msg.text();
  if (text.includes("[REAL LOADING DEBUG]")) {
    debugLogs.push(text);
  }
});
page.on("pageerror", (error) => {
  debugLogs.push(`[pageerror] ${error.message}`);
});

for (const route of routes) {
  debugLogs.length = 0;
  console.log(`\n=== ${route} ===`);
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(8000);

  const bodyText = await page.locator("body").innerText();
  const hasLoading = bodyText.includes("جاري التحميل");
  const hasDebugPanel = (await page.locator('[data-testid="real-loading-debug-panel"]').count()) > 0;
  const debugPanelText = hasDebugPanel
    ? await page.locator('[data-testid="real-loading-debug-panel"]').innerText()
    : "";

  console.log("URL:", page.url());
  console.log("Stuck on loading:", hasLoading);
  console.log("Debug panel visible:", hasDebugPanel);
  if (debugPanelText) {
    console.log("Debug panel:\n", debugPanelText);
  }

  const lastFive = debugLogs.slice(-5);
  console.log("Last [REAL LOADING DEBUG] logs:");
  if (lastFive.length === 0) {
    console.log("(none captured — open Chrome DevTools on the real session)");
  } else {
    lastFive.forEach((line) => console.log(line));
  }
}

await browser.close();

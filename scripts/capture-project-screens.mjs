import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("apps/web/public/projects");

const shots = [
  {
    url: "https://www.kidstoreperu.com/",
    out: path.join(root, "kidstore", "storefront-desktop.png"),
    viewport: { width: 1440, height: 900 },
    fullPage: false,
  },
  {
    url: "https://www.kidstoreperu.com/",
    out: path.join(root, "kidstore", "storefront-mobile.png"),
    viewport: { width: 390, height: 844 },
    fullPage: false,
  },
  {
    url: "https://home.licita-agent.com/",
    out: path.join(root, "licita-agent", "landing-desktop.png"),
    viewport: { width: 1440, height: 900 },
    fullPage: false,
  },
  {
    url: "https://home.licita-agent.com/",
    out: path.join(root, "licita-agent", "landing-mobile.png"),
    viewport: { width: 390, height: 844 },
    fullPage: false,
  },
  {
    url: "https://home.licita-agent.com/",
    out: path.join(root, "licita-agent", "landing-full.png"),
    viewport: { width: 1440, height: 900 },
    fullPage: true,
  },
];

await mkdir(path.join(root, "kidstore"), { recursive: true });
await mkdir(path.join(root, "licita-agent"), { recursive: true });

const browser = await chromium.launch({ headless: true });
for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  try {
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: shot.out, fullPage: shot.fullPage });
    console.log("ok", shot.out);
  } catch (error) {
    console.error("fail", shot.url, error instanceof Error ? error.message : error);
  } finally {
    await page.close();
  }
}
await browser.close();

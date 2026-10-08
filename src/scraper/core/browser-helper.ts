import type { Browser } from "playwright";
import { ScraperOptions } from "./types";

export const DEFAULT_TIMEOUT_MS = 30000;
export const DEFAULT_WAIT_DELAY_MS = 3000;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let sharedBrowser: Browser | null = null;
let sharedBrowserPromise: Promise<Browser> | null = null;

/**
 * Attempts to launch a Playwright browser using installed browser channels (msedge, chrome)
 * or bundled Chromium with anti-bot evasion flags.
 */
export async function launchStealthBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright");

  const launchConfigs: Array<{ channel?: string; args: string[] }> = [
    {
      channel: "msedge",
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    },
    {
      channel: "chrome",
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    },
    {
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-setuid-sandbox"],
    },
  ];

  let lastError: unknown = null;

  for (const config of launchConfigs) {
    try {
      const browser = await chromium.launch({
        headless: true,
        channel: config.channel,
        args: config.args,
      });
      return browser;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `No se pudo iniciar el navegador de Playwright (ni msedge, ni chrome, ni chromium). Detalle: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

/**
 * Returns a warm, reusable browser instance to avoid the overhead of launching
 * a fresh browser process on every single scrape.
 */
export async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    return sharedBrowser;
  }

  if (!sharedBrowserPromise) {
    sharedBrowserPromise = launchStealthBrowser()
      .then((b) => {
        sharedBrowser = b;
        b.on("disconnected", () => {
          sharedBrowser = null;
          sharedBrowserPromise = null;
        });
        return b;
      })
      .catch((err) => {
        sharedBrowser = null;
        sharedBrowserPromise = null;
        throw err;
      });
  }

  return sharedBrowserPromise;
}

/**
 * Closes the shared browser process if active.
 */
export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => {});
    sharedBrowser = null;
    sharedBrowserPromise = null;
  }
}

/**
 * Fetches page HTML using a stealth browser instance.
 * Navigates directly with anti-detection flags, avoiding HTTP 403 Forbidden responses.
 */
export async function fetchPageHtmlWithBrowser(
  url: string,
  options?: ScraperOptions
): Promise<string> {
  const timeout = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const waitDelay = options?.waitDelayMs ?? DEFAULT_WAIT_DELAY_MS;

  const browser = await getSharedBrowser();

  // Create an isolated context for this request (fast, ~15ms)
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "es-CL",
  });

  try {
    const page = await context.newPage();

    // Prevent detection of automated navigator.webdriver property
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    // Abort heavy media streaming (video/audio) to save bandwidth and speed up navigation
    await page.route(/\.(mp4|webm|avi|mkv|mp3|ogg|wav)(\?.*)?$/i, (route) => route.abort());

    // Navigate with specified timeout
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });

    // Wait timeout for Cloudflare challenge check or client-side DOM hydration
    if (waitDelay > 0) {
      await page.waitForTimeout(waitDelay);
    }

    const html = await page.content();
    return html;
  } finally {
    await context.close().catch(() => {});
  }
}

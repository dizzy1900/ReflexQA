import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import type { Fault } from "./events";

/** Real headless Chromium. Every click is a true OS-level mouse event on the live DOM. */
export async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    // The bundled build is missing or still downloading: fall back to any headless shell already in the Playwright cache.
    const fallback = cachedHeadlessShell();
    if (!fallback) throw err;
    return chromium.launch({ headless: true, executablePath: fallback });
  }
}

function cachedHeadlessShell(): string | null {
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse() : [];
  for (const d of dirs) {
    for (const sub of ["chrome-headless-shell-mac-arm64", "chrome-headless-shell-mac-x64", "chrome-headless-shell-linux64"]) {
      const exe = path.join(cache, d, sub, "chrome-headless-shell");
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}

export async function openTarget(browser: Browser, origin: string, faults: Fault[]): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/target?faults=${faults.join(",")}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-target-viewport]");
  await page.waitForTimeout(900); // entrance springs settle
  return page;
}

export async function screenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: "jpeg", quality: 70 });
  return buf.toString("base64");
}

export async function click(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y, { steps: 6 });
  await page.mouse.click(x, y);
  await page.waitForTimeout(900);
}

/** Visible text after the action, so the Judge sees DOM state as well as pixels. */
export async function domText(page: Page): Promise<string> {
  const text = await page.locator("main").innerText().catch(() => "");
  return text.replace(/\s+/g, " ").slice(0, 2000);
}

/** Ground truth for scoring the Judge. The agent never reads it. */
export async function orderConfirmed(page: Page): Promise<boolean> {
  return (await page.locator("main").getAttribute("data-order-confirmed")) === "true";
}

/** A numbered, clickable element drawn on the Driver's screenshot (set-of-marks grounding). */
export interface Mark {
  id: number;
  x: number;
  y: number;
  label: string;
}

/**
 * Draws a numbered box on every visible interactive element, screenshots, then removes the boxes.
 * Covered elements are marked too, so the Driver can still make (and learn from) the mistake of clicking under a modal.
 */
export async function markedScreenshot(page: Page): Promise<{ image: string; marks: Mark[] }> {
  const marks = await page.evaluate(() => {
    const found: { id: number; x: number; y: number; label: string }[] = [];
    const nodes = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]');
    let id = 1;
    nodes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
      const st = window.getComputedStyle(el);
      if (st.visibility === "hidden" || st.display === "none" || Number(st.opacity) === 0) return;
      const raw = el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.getAttribute("placeholder") || el.tagName;
      const label = raw.trim().replace(/\s+/g, " ").slice(0, 40);
      const box = document.createElement("div");
      box.setAttribute("data-reflex-mark", "");
      box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;outline:2px solid #f43f5e;z-index:2147483646;pointer-events:none;border-radius:6px`;
      const tag = document.createElement("div");
      tag.setAttribute("data-reflex-mark", "");
      tag.textContent = String(id);
      tag.style.cssText = `position:fixed;left:${Math.max(0, r.left - 2)}px;top:${Math.max(0, r.top - 18)}px;z-index:2147483647;background:#f43f5e;color:#fff;font:700 12px ui-monospace,monospace;padding:1px 5px;border-radius:4px;pointer-events:none`;
      document.body.append(box, tag);
      found.push({ id, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), label });
      id += 1;
    });
    return found;
  });
  const image = await screenshot(page);
  await page.evaluate(() => document.querySelectorAll("[data-reflex-mark]").forEach((n) => n.remove()));
  return { image, marks };
}

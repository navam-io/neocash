/**
 * Screenshot capture script for README documentation.
 * Run: npx tsx scripts/take-screenshots.ts
 * Requires: dev server running at localhost:3000
 */
import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = "http://localhost:3000";
const OUT_DIR = join(__dirname, "..", "docs", "screenshots");
const VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Desktop context
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // ── Step 0: Load sample data ────────────────────
  console.log("Loading sample data...");
  await page.goto(`${BASE_URL}/chat/new`);
  await page.waitForTimeout(1500);

  // Click Personal profile button
  const personalBtn = page.locator('button:has-text("Personal")');
  await personalBtn.click();
  await page.waitForTimeout(500);

  // Click "Load Sample Data"
  const loadBtn = page.locator('button:has-text("Load Sample Data")');
  await loadBtn.click();
  await page.waitForTimeout(500);

  // Click "Load" confirmation
  const confirmLoad = page.locator('button:has-text("Load")').last();
  await confirmLoad.click();
  await page.waitForTimeout(2000);

  // Refresh to pick up new data
  await page.goto(`${BASE_URL}/chat/new`);
  await page.waitForTimeout(2000);

  // Helper: wait for sidebar to populate
  async function waitForSidebar() {
    await page.waitForSelector("text=MEMORY", { timeout: 8000 }).catch(() => {});
    await page.waitForSelector("text=GOALS", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }

  // ── Screenshot 1: hero.png ──────────────────────
  console.log("1/7: hero.png");
  await waitForSidebar();
  await page.screenshot({ path: join(OUT_DIR, "hero.png") });

  // ── Screenshot 2: chat.png ──────────────────────
  console.log("2/7: chat.png");
  // Scroll sidebar down to see chats section, then click
  const budgetLink = page.locator('button:has-text("Budget Review")').first();
  await budgetLink.scrollIntoViewIfNeeded();
  await budgetLink.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT_DIR, "chat.png") });

  // ── Screenshot 3: goal-dashboard.png ────────────
  console.log("3/7: goal-dashboard.png");
  const emergencyGoal = page.locator('button:has-text("Build 6-Month")').first();
  await emergencyGoal.scrollIntoViewIfNeeded();
  await emergencyGoal.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT_DIR, "goal-dashboard.png") });

  // ── Screenshot 4: signals.png ───────────────────
  console.log("4/7: signals.png");
  const taxGoal = page.locator('button:has-text("Maximize Tax")').first();
  await taxGoal.scrollIntoViewIfNeeded();
  await taxGoal.click();
  await page.waitForTimeout(1500);
  // Try to expand signals if there's a toggle
  const signalExpand = page.locator('button:has-text("signal"), button:has-text("Signal"), [aria-label*="signal"]').first();
  if (await signalExpand.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signalExpand.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: join(OUT_DIR, "signals.png") });

  // ── Screenshot 5: context-menu.png ──────────────
  console.log("5/7: context-menu.png");
  await page.goto(`${BASE_URL}/chat/new`);
  await waitForSidebar();
  // Click the "+" (Add context) button in the chat input area
  const addContext = page.locator('button[aria-label="Add context"]').first();
  if (await addContext.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addContext.click();
  } else {
    // Fallback: look for a "+" button near the textarea
    const plusBtns = page.locator('button').filter({ hasText: /^\+$/ });
    const count = await plusBtns.count();
    if (count > 0) {
      await plusBtns.first().click();
    }
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT_DIR, "context-menu.png") });

  // ── Screenshot 6: memory.png ────────────────────
  console.log("6/7: memory.png");
  // Close any open menu first
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  // Click "View all..." in the Memory section to open Memory Editor
  const viewAll = page.locator('button:has-text("View all")').first();
  if (await viewAll.isVisible({ timeout: 3000 }).catch(() => false)) {
    await viewAll.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: join(OUT_DIR, "memory.png") });

  // ── Screenshot 7: mobile.png ────────────────────
  console.log("7/7: mobile.png");
  await page.close();
  const mobileCtx = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE_URL}/chat/new`);
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: join(OUT_DIR, "mobile.png") });

  await browser.close();
  console.log("Done! Screenshots saved to docs/screenshots/");
}

main().catch(console.error);

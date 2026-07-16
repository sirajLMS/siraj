import { chromium } from "playwright";
import { DEMO_USERS, loginAsDemoUser } from "@/test/ui/e2e/helpers";
const logger = console;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, baseURL: "http://localhost:3000" });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);

  try {
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
  } catch (e) {
    const err = e as Error;
    logger.error("login failed:", err.message);
  }

  await page.waitForLoadState("networkidle").catch(() => {});
  const nav = page.locator('nav, [aria-label*="nav"i], aside');
  const navVisible = await nav.isVisible().catch(() => false);
  const navText = await page.locator('nav').first().innerText().catch(() => "<no nav>");
  logger.info("URL after login:", page.url());
  logger.info("nav visible:", navVisible);
  logger.info("nav text (first 800):", (navText as string).slice(0, 800));

  logger.info("=== Checking 'بحث الجدول' nav item ===");
  const item = page.getByText("بحث الجدول");
  const itemVisible = await item.isVisible().catch(() => false);
  logger.info("'بحث الجدول' visible:", itemVisible);

  const allNavTextareas = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, li, [role="menuitem"], [role="link"]'));
    return els.map(el => ({ tag: el.tagName, text: (el.textContent || "").trim().slice(0, 40), href: el.getAttribute("href") })).filter(e => e.text);
  });
  logger.info("=== all link/menu texts ===");
  for (const e of allNavTextareas.slice(0, 60)) logger.info(`  <${e.tag}> href=${e.href} text="${e.text}"`);

  logger.info("=== navigating to /ar/search-schedule ===");
  await page.goto("/ar/search-schedule");
  await page.waitForLoadState("networkidle").catch(() => {});
  logger.info("URL:", page.url());
  await page.waitForTimeout(2000);

  const h = page.getByText("البحث عن توفر الجدول");
  logger.info("pageTitle 'البحث عن توفر الجدول' visible:", await h.isVisible().catch(() => false));
  const dr = page.getByLabel("نطاق التاريخ");
  logger.info("dateRange 'نطاق التاريخ' visible:", await dr.isVisible().catch(() => false));
  const tr = page.getByLabel("نطاق الوقت");
  logger.info("timeRange 'نطاق الوقت' visible:", await tr.isVisible().catch(() => false));
  const fBtn = page.getByRole("button", { name: "الفلاتر" });
  logger.info("filtersBtn 'الفلاتر' visible:", await fBtn.isVisible().catch(() => false));
  const sBtn = page.getByRole("button", { name: "بحث" });
  logger.info("searchBtn 'بحث' visible:", await sBtn.isVisible().catch(() => false));

  const allBtns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => ({ text: (b.textContent || "").trim(), aria: b.getAttribute("aria-label") })).filter(b => b.text || b.aria));
  logger.info("=== all buttons on search-schedule page ===");
  for (const b of allBtns.slice(0, 40)) logger.info(`  btn text="${b.text}" aria="${b.aria}"`);
  const allLabels = await page.evaluate(() => Array.from(document.querySelectorAll('label')).map(l => (l.textContent || "").trim()).filter(Boolean));
  logger.info("=== all labels ===");
  for (const l of allLabels.slice(0, 40)) logger.info(`  label="${l}"`);
  const headings = await page.evaluate(() => Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).map(h => ({ tag: h.tagName, text: (h.textContent || "").trim() })));
  logger.info("=== all headings ===");
  for (const hh of headings.slice(0, 20)) logger.info(`  <${hh.tag}> "${hh.text}"`);

  await browser.close();
}

main().catch(e => { console.error("probe crashed", e); process.exit(1); });

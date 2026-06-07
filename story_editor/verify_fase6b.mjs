// Single-session follow-up: create fresh data, then expand Dashboard sections and
// verify emotion/action distributions + incomplete-scenes click-to-navigate
// (loading a previously-saved project hit a snapshot/autosave mismatch — easier
// to just build the data fresh in the same running session).
import { _electron as electron } from "playwright-core";
import * as path from "node:path";
import * as fs from "node:fs";

const APP_DIR = path.resolve(import.meta.dirname);
const SHOT_DIR = path.join(APP_DIR, "verify_shots");
fs.mkdirSync(SHOT_DIR, { recursive: true });
let shotIndex = 20;
function shotPath(name) {
  shotIndex += 1;
  return path.join(SHOT_DIR, `${String(shotIndex).padStart(2, "0")}-${name}.png`);
}

const electronBin = path.join(APP_DIR, "node_modules", "electron", "dist", "electron.exe");
const app = await electron.launch({ executablePath: electronBin, args: [APP_DIR], timeout: 60_000 });
const page = await app.firstWindow();
await page.waitForLoadState("domcontentloaded");
await page.waitForTimeout(1500);

async function ss(name) {
  const f = shotPath(name);
  await page.screenshot({ path: f });
  console.log("screenshot:", f);
}
async function clickText(text, selector = "button") {
  const ok = await page.evaluate(({ text, selector }) => {
    const els = [...document.querySelectorAll(selector)];
    const el = els.find((e) => e.textContent && e.textContent.trim() === text);
    if (!el) return false;
    el.click();
    return true;
  }, { text, selector });
  if (!ok) throw new Error(`click-text not found: "${text}"`);
}

await clickText("New project");
await page.waitForTimeout(300);
await page.fill("#input-project-title", "Fase 6 Sections Check");
await clickText("Create", "button[type=submit]");
await page.waitForTimeout(500);

await page.click("#btn-add-character");
await page.waitForTimeout(300);
await page.fill("#character-name", "Elena");
await page.click("#btn-save-character");
await page.waitForTimeout(300);

await page.click("#btn-add-story");
await page.waitForTimeout(300);
await page.fill("#story-title", "Chapter 1");
await page.click("#btn-save-story");
await page.waitForTimeout(300);

// Scene A: complete, tagged "Rookie Optimism" / "Dialogue", references Elena.
await page.click("#btn-add-scene");
await page.waitForTimeout(400);
await page.fill("#scene-title", "The Meeting");
const elenaId = await page.locator("#scene-add-character-ref option").first().getAttribute("value");
await page.selectOption("#scene-add-character-ref", elenaId);
await page.click("#btn-add-character-ref");
await page.waitForTimeout(200);
await page.fill("#scene-content", "Elena arrives at the gate.");
await page.selectOption("#scene-emotion-tag", "Rookie Optimism");
await page.fill("#scene-action-tag", "Dialogue");
await page.click("#btn-save-scene");
await page.waitForTimeout(400);

// Scene B: complete, tagged "Threshold Dread" / "Confrontation", references Elena too.
await page.click("#btn-back-to-story");
await page.waitForTimeout(300);
await page.click("#btn-add-scene");
await page.waitForTimeout(400);
await page.fill("#scene-title", "The Standoff");
await page.selectOption("#scene-add-character-ref", elenaId);
await page.click("#btn-add-character-ref");
await page.waitForTimeout(200);
await page.fill("#scene-content", "Elena faces her rival.");
await page.selectOption("#scene-emotion-tag", "Threshold Dread");
await page.fill("#scene-action-tag", "Confrontation");
await page.click("#btn-save-scene");
await page.waitForTimeout(400);

// Scene C: deliberately incomplete (blank title/content/tags).
await page.click("#btn-back-to-story");
await page.waitForTimeout(300);
await page.click("#btn-add-scene");
await page.waitForTimeout(400);
await page.click("#btn-save-scene");
await page.waitForTimeout(400);

await ss("dashboard-collapsed");

await page.evaluate(() => {
  for (const id of ["dashboard-emotion-distribution", "dashboard-action-distribution", "dashboard-incomplete-scenes"]) {
    const details = document.getElementById(id)?.closest("details");
    if (details && !details.open) details.open = true;
  }
});
await page.waitForTimeout(400);
await ss("dashboard-sections-expanded");

await page.evaluate(() => {
  const list = document.getElementById("dashboard-incomplete-scenes");
  const item = list && list.querySelector("li:not(.dashboard-rows-empty)");
  if (item) item.click();
});
await page.waitForTimeout(600);
await ss("incomplete-scene-navigation");

await app.close();
console.log("done");

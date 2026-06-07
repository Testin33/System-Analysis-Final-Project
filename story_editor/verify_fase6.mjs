// Throwaway driver to manually verify Fase 6 (Dashboard/Validate/Compile/Search) end to end.
// Run with: node verify_fase6.mjs   (delete once verified)
import { _electron as electron } from "playwright-core";
import * as path from "node:path";
import * as fs from "node:fs";

const APP_DIR = path.resolve(import.meta.dirname);
const SHOT_DIR = path.join(APP_DIR, "verify_shots");
fs.mkdirSync(SHOT_DIR, { recursive: true });
let shotIndex = 0;

function shotPath(name) {
  shotIndex += 1;
  return path.join(SHOT_DIR, `${String(shotIndex).padStart(2, "0")}-${name}.png`);
}

const electronBin = path.join(APP_DIR, "node_modules", "electron", "dist", "electron.exe");
const app = await electron.launch({
  executablePath: electronBin,
  args: [APP_DIR],
  timeout: 60_000,
});
const page = await app.firstWindow();
await page.waitForLoadState("domcontentloaded");
await page.waitForTimeout(1500);
console.log("launched. windows:", app.windows().map((w) => w.url()));

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

// ---------- 1. Create a fresh project ----------
await clickText("New project");
await page.waitForTimeout(300);
await page.fill("#input-project-title", "Fase 6 Verification");
await clickText("Create", "button[type=submit]");
await page.waitForTimeout(500);
await ss("project-created-empty-dashboard");

// ---------- 2. Add characters & locations ----------
await page.click("#btn-add-character");
await page.waitForTimeout(300);
await page.fill("#character-name", "Elena");
await page.click("#btn-save-character");
await page.waitForTimeout(300);

await page.click("#btn-add-character");
await page.waitForTimeout(300);
await page.fill("#character-name", "Marco");
await page.click("#btn-save-character");
await page.waitForTimeout(300);

await page.click("#btn-add-location");
await page.waitForTimeout(300);
await page.fill("#location-name", "Castillo del Norte");
await page.click("#btn-save-location");
await page.waitForTimeout(300);

// ---------- 3. Add a story with a complete scene + an incomplete one ----------
await page.click("#btn-add-story");
await page.waitForTimeout(300);
await page.fill("#story-title", "Chapter 1");
await page.click("#btn-save-story");
await page.waitForTimeout(300);

await page.click("#btn-add-scene");
await page.waitForTimeout(400);
await page.fill("#scene-title", "The Meeting");
const charOptions = await page.locator("#scene-add-character-ref option").all();
const elenaId = await charOptions[0].getAttribute("value");
const marcoId = await charOptions[1].getAttribute("value");
await page.selectOption("#scene-add-character-ref", elenaId);
await page.click("#btn-add-character-ref");
await page.waitForTimeout(200);
await page.selectOption("#scene-add-character-ref", marcoId);
await page.click("#btn-add-character-ref");
await page.waitForTimeout(200);
const castleId = await page.locator("#scene-add-location-ref option").first().getAttribute("value");
await page.selectOption("#scene-add-location-ref", castleId);
await page.click("#btn-add-location-ref");
await page.waitForTimeout(200);
await page.fill("#scene-content", `[CHAR:${elenaId}] se encontro con [CHAR:${marcoId}] en [LOC:${castleId}].`);
await page.selectOption("#scene-emotion-tag", "Rookie Optimism");
await page.fill("#scene-action-tag", "Dialogue");
await page.click("#btn-save-scene");
await page.waitForTimeout(400);

// Go back to the story to add a second, deliberately blank scene (with an unresolved ref).
await page.click("#btn-back-to-story");
await page.waitForTimeout(300);
await page.click("#btn-add-scene");
await page.waitForTimeout(400);
await page.fill("#scene-content", "An unresolved reference: [CHAR:does-not-exist].");
await page.click("#btn-save-scene");
await page.waitForTimeout(400);

await ss("dashboard-populated");

// ---------- 4. Validate ----------
await page.click("#btn-validate");
await page.waitForTimeout(500);
await ss("validation-report");
await page.click("#dialog-validation-report button[type=submit]");
await page.waitForTimeout(300);

// ---------- 5. Compile ----------
await page.click("#btn-compile");
await page.waitForTimeout(500);
await page.click("#btn-compile-preview");
await page.waitForTimeout(500);
await ss("compile-preview");
await page.click("#btn-cancel-compile");
await page.waitForTimeout(300);

// ---------- 6. Search ----------
await page.click("#btn-search");
await page.waitForTimeout(400);
await page.selectOption("#search-emotion-tag", "Rookie Optimism");
await page.click("#btn-run-search");
await page.waitForTimeout(500);
await ss("search-results");
await page.click("#btn-cancel-search");

await page.waitForTimeout(300);
await ss("final-state");

await app.close();
console.log("done — screenshots in", SHOT_DIR);

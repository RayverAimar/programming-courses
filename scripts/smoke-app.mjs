// End-to-end check of the desktop app with Playwright's Electron driver: launch, open a lesson,
// solve an exercise, quit, launch again and find the progress still there.
//   node scripts/smoke-app.mjs                 the app from this folder (needs `pnpm build` first)
//   node scripts/smoke-app.mjs <path to app>   a packaged app (…/Loop.app, the .exe, the AppImage)
import { _electron as electron } from "playwright";
import { mkdtempSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
const shots = process.env.SMOKE_SHOTS || join(ROOT, ".cache", "smoke");
mkdirSync(shots, { recursive: true });
const userData = mkdtempSync(join(tmpdir(), "loop-smoke-"));

function launchOptions() {
  const env = { ...process.env, APP_USER_DATA: userData };
  if (!target) return { args: [ROOT], env };
  let exe = target;
  if (target.endsWith(".app")) exe = join(target, "Contents", "MacOS", target.split("/").pop().replace(/\.app$/, ""));
  if (!existsSync(exe)) throw new Error(`No app at ${exe}`);
  return { executablePath: exe, env };
}

const step = (msg) => console.log(`· ${msg}`);
async function open() {
  const app = await electron.launch(launchOptions());
  const page = await app.firstWindow();
  await page.waitForSelector(".course-card, .resume", { timeout: 30000 });
  return { app, page };
}
const go = (page, hash) => page.evaluate((h) => (location.hash = h), hash);
// A fresh install opens with the welcome: three steps, here with a name and the default goal.
async function welcome(page) {
  await page.waitForSelector(".sheet-welcome", { timeout: 10000 });
  await page.click(".w-next");
  await page.fill("[name=name]", "Smoke");
  await page.click(".w-next");
  await page.click(".w-next");
  await page.waitForSelector(".sheet-welcome", { state: "detached" });
  return page.textContent(".hello h1");
}

let failed = false;
try {
  let { app, page } = await open();
  step(`launched: ${await page.title()} (${await page.evaluate(() => location.href)})`);
  if (!(await page.evaluate(() => document.body.classList.contains("app")))) throw new Error("the page doesn't know it runs in the app");
  await page.screenshot({ path: join(shots, "0-welcome.png") });
  step(`welcome done: "${await welcome(page)}"`);
  await page.screenshot({ path: join(shots, "1-home.png") });

  await go(page, "#/c/js/01-valores/lo-minimo");
  await page.waitForSelector(".lmain h1");
  step(`lesson open: ${await page.textContent(".lmain h1")}`);
  await page.click(".mark");
  await page.screenshot({ path: join(shots, "2-lesson.png") });

  await go(page, "#/c/js/01-valores/practica/3");
  await page.waitForSelector(".ws-tool .ex-run");
  await page.evaluate(() => document.querySelector(".ex-use").click());
  await page.click(".ws-tool .ex-run");
  await page.waitForSelector(".ws-after:not([hidden])", { timeout: 15000 });
  const solved = await page.evaluate(() => document.querySelector(".ex .ex-t")?.textContent);
  step(`exercise solved: ${solved}`);
  await page.screenshot({ path: join(shots, "3-solved.png") });

  await app.close();
  step("quit");

  ({ app, page } = await open());
  await page.waitForTimeout(800);
  if (await page.$(".sheet-welcome")) throw new Error("the welcome came back after a relaunch");
  const greeting = await page.textContent(".hello h1");
  if (!greeting.includes("Smoke")) throw new Error(`the profile did not survive the restart: "${greeting}"`);
  const resume = await page.textContent(".resume h2");
  await go(page, "#/c/js/01-valores/practica/3");
  await page.waitForSelector(".ws-tool .ex-run");
  const still = await page.evaluate(() => ({ passed: document.querySelector(".ex")?.classList.contains("passed"), after: !document.querySelector(".ws-after")?.hidden }));
  await go(page, "#/c/js");
  await page.waitForSelector(".mine");
  const read = await page.evaluate(() => [document.querySelector(".lrow")?.querySelector(".st").className, document.querySelector('.lrow[href$="/lo-minimo"] .st')?.className || ""]);
  await page.screenshot({ path: join(shots, "4-relaunch.png") });
  await app.close();
  step(`relaunched: continue card "${resume}", exercise passed: ${still.passed}, lesson states: ${read.join(" / ")}`);
  if (!still.passed || !still.after || !read[1].includes("st-done")) throw new Error("progress did not survive the restart");
  console.log(`✓ smoke test passed · screenshots in ${shots}`);
} catch (e) {
  failed = true;
  console.error(`✗ ${e.message}`);
} finally {
  rmSync(userData, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);

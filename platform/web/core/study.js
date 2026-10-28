// Study time: while a lesson or workshop is on screen, the tab is visible and you touched
// something in the last two minutes, every 15 seconds count.
import { addStudy } from "./progress.js";

const TICK = 15;
const IDLE = 120 * 1000;

export function startStudyClock(studying) {
  let last = Date.now();
  const poke = () => (last = Date.now());
  for (const ev of ["pointerdown", "keydown", "scroll", "wheel", "touchstart"]) addEventListener(ev, poke, { passive: true, capture: true });
  setInterval(() => {
    if (document.visibilityState !== "visible" || Date.now() - last > IDLE || !studying()) return;
    addStudy(TICK);
  }, TICK * 1000);
}

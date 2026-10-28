// Arrows for figures drawn in the browser, with chart.js's marker() (the one arrowhead). Give each
// drawing its own id; paths end 2 units short of the point they reach, where the head's tip lands.
import { marker } from "../platform/web/core/chart.js";

export { marker };
let n = 0;
export const markerId = () => `ah${++n}`;
export const rope = (id, d, hot) => `<path class="rfa${hot ? " hot" : ""}" marker-end="url(#${id}${hot ? "a" : ""})" d="${d}"/>`;

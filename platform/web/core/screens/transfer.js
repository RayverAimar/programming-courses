// Export and import progress as one .sqlite file: the same file opens on the web and in the app.
// Importing merges, so nothing already here is lost.
import { esc } from "../dom.js";
import { t } from "../i18n.js";
import { button, toast } from "../ui.js";
import { getStore, mergeBytes, flush } from "../boot.js";
import { desktop, getBridge } from "../caps.js";
import { site, dayKey } from "../progress.js";

export const transferButtons = () => `<div class="btns">${button({ label: t("transfer.export"), icon: "download", cls: "tx-export" })}${button({ label: t("transfer.import"), icon: "upload", cls: "tx-import" })}</div>
  <input type="file" class="tx-file" accept=".sqlite,.db,application/vnd.sqlite3,application/x-sqlite3" hidden aria-label="${esc(t("transfer.import"))}">`;

const fileName = () => `${site().name.toLowerCase()}-progreso-${dayKey()}.sqlite`;

export async function exportProgress() {
  await flush();
  const bytes = getStore().export();
  if (desktop()) {
    const where = await getBridge().files.save(bytes, fileName());
    if (where) toast(t("transfer.exported", { where }));
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.sqlite3" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName();
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(t("transfer.exportedWeb"));
}

async function importBytes(bytes) {
  try {
    const r = await mergeBytes(bytes, { silent: true });
    toast(t("transfer.imported", { n: (r.counts.item_state || 0) + (r.counts.lesson_state || 0) }), { icon: "upload" });
  } catch (e) {
    toast(t("transfer.failed", { why: e.message }), { icon: "circle-alert", ms: 7000 });
  }
}

export function wireTransfer(root) {
  root.querySelectorAll(".tx-export").forEach((b) => b.addEventListener("click", exportProgress));
  root.querySelectorAll(".tx-import").forEach((b) => b.addEventListener("click", async () => {
    if (desktop()) {
      const bytes = await getBridge().files.open();
      if (bytes) importBytes(new Uint8Array(bytes));
      return;
    }
    root.querySelector(".tx-file").click();
  }));
  root.querySelectorAll(".tx-file").forEach((input) => input.addEventListener("change", async () => {
    const f = input.files[0];
    if (!f) return;
    importBytes(new Uint8Array(await f.arrayBuffer()));
    input.value = "";
  }));
}

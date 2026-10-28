// A case's answer ships as this hash, so it isn't readable in the page source.
export function answerHash(s) {
  const norm = String(s).trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ");
  let h = 0x811c9dc5;
  for (const ch of norm) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

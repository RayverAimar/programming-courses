// Inline Markdown for text that comes from content (titles, captions, labels, messages): `code`,
// **bold**, *italic*, [links](url). One renderer for every surface, so a title reads the same in a
// heading, a list, the sidebar and a figure. Pure: the build and the browser both import it.
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ESCAPABLE = /\\([\\`*_{}[\]()#+\-.!|~])/g;
const CODE = /(`+)([\s\S]*?[^`])\1(?!`)/g;
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const BOLD = /(\*\*|__)(?=\S)([\s\S]*?\S)\1/g;
const STAR = /(^|[\s(["“«¿¡—-])\*(?=[\p{L}\p{N}"“«'(¿¡])([^*\n]*?[\p{L}\p{N}.!?"”»')])\*(?![\p{L}\p{N}*])/gu;
const SCORE = /(^|[\s(["“«¿¡—-])_(?=[\p{L}\p{N}"“«'(¿¡])([^_\n]*?[\p{L}\p{N}.!?"”»')])_(?![\p{L}\p{N}_])/gu;

const SAFE_URL = /^(?:https?:|mailto:|#|\/|\.{0,2}\/|[\w-]+(?:\/|\.|$))/i;

// Inline Markdown to HTML. Everything else is escaped.
export function md(src) {
  const stash = [];
  const keep = (html) => `\u0000${stash.push(html) - 1}\u0000`;
  let x = String(src ?? "")
    .replace(ESCAPABLE, (_m, c) => keep(escape(c)))
    .replace(CODE, (_m, _t, c) => keep(`<code>${escape(c.trim())}</code>`));
  x = escape(x)
    .replace(LINK, (m, text, url) => {
      const href = url.replace(/&amp;/g, "&");
      if (!SAFE_URL.test(href)) return m;
      const out = /^https?:/i.test(href);
      return `<a href="${escape(href)}"${out ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
    })
    .replace(BOLD, "<b>$2</b>")
    .replace(STAR, "$1<em>$2</em>")
    .replace(SCORE, "$1<em>$2</em>");
  return x.replace(/\u0000(\d+)\u0000/g, (_m, i) => stash[i]);
}

// The same text with the marks taken out, for places that only hold plain text (<title>, aria-label,
// the search index, a toast).
export function mdPlain(src) {
  const stash = [];
  const keep = (t) => `\u0000${stash.push(t) - 1}\u0000`;
  const x = String(src ?? "")
    .replace(ESCAPABLE, (_m, c) => keep(c))
    .replace(CODE, (_m, _t, c) => keep(c.trim()))
    .replace(LINK, (_m, text) => text)
    .replace(BOLD, "$2")
    .replace(STAR, "$1$2")
    .replace(SCORE, "$1$2");
  return x.replace(/\u0000(\d+)\u0000/g, (_m, i) => stash[i]);
}

const BASE = "https://ge.xhamster.com";
const VIDEO_RE = /^https:\/\/(?:[a-z0-9-]+\.)*xhamster\.com\/videos?\//i;

function decode(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\\u0026/gi, "&").replace(/\\u002f/gi, "/").replace(/\\\//g, "/");
}
function absolute(value) {
  const raw = decode(value).trim();
  if (/^https:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return "https:" + raw;
  if (raw.startsWith("/")) return BASE + raw;
  return "";
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function textFromHtml(value) {
  return decode(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}
function videoLinks(html) {
  const links = [];
  const re = /(?:href|data-href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = absolute(m[1]).split(/[?#]/)[0];
    if (VIDEO_RE.test(url)) links.push(url);
  }
  return unique(links).slice(0, 30);
}
function metaTag(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp('<meta[^>]+property=["\\']' + escaped + '["\\'][^>]+content=["\\']([^"\\']+)["\\']', "i"),
    new RegExp('<meta[^>]+content=["\\']([^"\\']+)["\\'][^>]+property=["\\']' + escaped + '["\\']', "i")
  ];
  for (const re of patterns) { const m = html.match(re); if (m) return decode(m[1]); }
  return "";
}
async function getHtml(url) {
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "de,en;q=0.8" },
    redirect: "follow"
  });
  if (!response.ok) return "";
  return response.text();
}
function makeId(url) { return "xh:" + Buffer.from(url).toString("base64url"); }
function urlFromId(id) {
  if (!String(id).startsWith("xh:")) return "";
  try {
    const url = Buffer.from(String(id).slice(3), "base64url").toString("utf8");
    return VIDEO_RE.test(url) ? url : "";
  } catch (_) { return ""; }
}
async function pageMeta(url) {
  const html = await getHtml(url);
  if (!html) return null;
  const name = metaTag(html, "og:title") || textFromHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1]);
  if (!name) return null;
  const poster = metaTag(html, "og:image");
  const description = metaTag(html, "og:description");
  return {
    id: makeId(url), type: "movie", name, poster: poster || undefined,
    description: description || undefined, posterShape: "landscape",
    background: poster || undefined, url
  };
}
async function catalog(args) {
  const search = String(args.extra?.search || "").trim();
  const skip = Math.max(0, Number(args.extra?.skip || 0));
  if (!search) {
    // The front page is a public, ordinary listing; no access controls are bypassed.
    const html = await getHtml(BASE + "/");
    const links = videoLinks(html);
    const metas = await Promise.all(links.slice(skip, skip + 20).map(pageMeta));
    return { metas: metas.filter(Boolean), cacheMaxAge: 900 };
  }
  const html = await getHtml(BASE + "/search/" + encodeURIComponent(search));
  const links = videoLinks(html);
  const metas = await Promise.all(links.slice(skip, skip + 20).map(pageMeta));
  return { metas: metas.filter(Boolean), cacheMaxAge: 300 };
}
async function metadata(id) {
  const url = urlFromId(id);
  if (!url) return { meta: {} };
  const meta = await pageMeta(url);
  return { meta: meta || {} };
}
async function streams(id) {
  const url = urlFromId(id);
  if (!url) return { streams: [] };
  const html = await getHtml(url);
  const candidates = [];
  const patterns = [
    /["'](?:contentUrl|src|file|videoUrl|url)["']\s*:\s*["']([^"']+\.m3u8(?:\?[^"']*)?)["']/gi,
    /<(?:source|video)[^>]+(?:src|data-src)\s*=\s*["']([^"']+\.m3u8(?:\?[^"']*)?)["']/gi
  ];
  for (const re of patterns) { let m; while ((m = re.exec(html)) !== null) candidates.push(decode(m[1])); }
  const urls = unique(candidates).filter(u => /^https:\/\//i.test(u));
  const title = metaTag(html, "og:title") || "xHamster";
  return { streams: urls.slice(0, 5).map(u => ({ name: "CVN xHamster", title, url: u })) };
}
module.exports = { catalog, metadata, streams, videoLinks, urlFromId };

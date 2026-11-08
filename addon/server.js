const http = require("node:http");
const xhamster = require("./scraper");

const manifest = {
  id: "community.nuvio.xhamster-links",
  version: "1.8.0",
  name: "CVN xHamster Links",
  description: "xHamster-Suche mit externen Links. Keine direkten Medienstreams.",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["xhlink:"],
  catalogs: [
    { type: "movie", id: "xh_search", name: "xHamster Suche", extra: [{ name: "search", isRequired: true }] }
  ],
  behaviorHints: { adult: true, configurable: false }
};

function decodeSegment(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}
function parseRoute(pathname, searchParams) {
  const parts = pathname.split("/").filter(Boolean).map(decodeSegment);
  const resource = parts[0] || "";
  if (resource === "manifest.json" && parts.length === 1) return { resource };
  if (!["catalog", "meta", "stream"].includes(resource) || parts.length < 3) return null;
  const type = parts[1];
  const idPart = parts[2];
  const id = idPart.endsWith(".json") ? idPart.slice(0, -5) : idPart;
  const extra = {};
  if (resource === "catalog") {
    const extraParts = parts.slice(3);
    if (extraParts.length) {
      const last = extraParts.length - 1;
      extraParts[last] = extraParts[last].replace(/\.json$/, "");
      for (const entry of extraParts) {
        const separator = entry.indexOf("=");
        if (separator > 0) extra[entry.slice(0, separator)] = entry.slice(separator + 1);
      }
    }
    for (const [key, value] of searchParams) extra[key] = value;
  }
  return { resource, type, id, extra };
}
function sendJson(res, statusCode, payload, maxAge = 0) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=" + Math.max(0, Number(maxAge) || 0),
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  });
  res.end(JSON.stringify(payload));
}
function createServer() {
  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "86400"
      });
      return res.end();
    }
    if (req.method !== "GET") {
      res.setHeader("allow", "GET, OPTIONS");
      return sendJson(res, 405, { error: "Method not allowed" });
    }
    let url;
    try { url = new URL(req.url, "http://localhost"); }
    catch { return sendJson(res, 400, { error: "Invalid request URL" }); }
    const route = parseRoute(url.pathname, url.searchParams);
    if (!route) return sendJson(res, 404, { error: "Not found" });
    if (route.resource === "manifest.json") return sendJson(res, 200, manifest, 3600);
    try {
      const args = { type: route.type, id: route.id, extra: route.extra || {} };
      if (route.resource === "catalog") {
        const result = await xhamster.catalog(args);
        return sendJson(res, 200, result || { metas: [] }, result?.cacheMaxAge ?? 60);
      }
      if (route.resource === "meta") {
        const result = await xhamster.metadata(route.id);
        return sendJson(res, 200, result || { meta: null }, 300);
      }
      if (route.resource === "stream") {
        const result = await xhamster.streams(route.id);
        return sendJson(res, 200, result || { streams: [] }, 60);
      }
      return sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      console.error("[CVN " + route.resource + "] request failed:", error?.stack || error);
      return sendJson(res, 502, route.resource === "catalog" ? { metas: [] } :
        route.resource === "meta" ? { meta: null } : { streams: [] }, 30);
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  server.maxHeadersCount = 50;
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT || 7000);
  createServer().listen(port, "0.0.0.0", () => {
    console.log("[Nuvio] CVN xHamster Links addon listening on", port);
  });
}
module.exports = { manifest, createServer, parseRoute };

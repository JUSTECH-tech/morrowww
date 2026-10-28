/* ==========================================================================
   Tundara — zero-dependency static server
   Run: node server.js   →   http://localhost:4173
   ========================================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf",
};

function send(res, status, body, headers) {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...headers,
  });
  res.end(body);
}

function sendFile(req, res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const isAsset = /[\\/]assets[\\/]/.test(filePath);
  const cache = isAsset ? "public, max-age=86400" : "no-cache";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    send(res, status, req.method === "HEAD" ? "" : data, {
      "Content-Type": type,
      "Content-Length": data.length,
      "Cache-Control": cache,
    });
  });
}

function resolveTarget(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  // Normalise and keep every request inside the project directory.
  const relative = decoded.replace(/^[/\\]+/, "");
  const target = path.resolve(ROOT, relative);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed", {
      "Content-Type": "text/plain; charset=utf-8",
      Allow: "GET, HEAD",
    });
    return;
  }

  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    send(res, 400, "Bad request", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const target = resolveTarget(pathname);
  if (!target) {
    send(res, 400, "Bad request", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const index = path.join(target, "index.html");
      return fs.stat(index, (indexErr, indexStat) => {
        if (indexErr || !indexStat.isFile()) {
          sendFile(req, res, path.join(ROOT, "404.html"), 404);
          return;
        }
        sendFile(req, res, index);
      });
    }

    if (!err && stat.isFile()) {
      sendFile(req, res, target);
      return;
    }

    // Pretty URLs: /shop → shop.html; /help/ → help.html
    const trimmed = target.replace(/[\\/]+$/, "");
    if (!path.extname(trimmed)) {
      const htmlFile = trimmed + ".html";
      return fs.stat(htmlFile, (htmlErr, htmlStat) => {
        if (!htmlErr && htmlStat.isFile()) {
          sendFile(req, res, htmlFile);
          return;
        }
        sendFile(req, res, path.join(ROOT, "404.html"), 404);
      });
    }

    sendFile(req, res, path.join(ROOT, "404.html"), 404);
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use.`);
    console.error(`  Try:  PORT=4174 npm start\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Tundara is running`);
  console.log(`  →  http://localhost:${PORT}\n`);
  console.log(`  Serving ${ROOT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});

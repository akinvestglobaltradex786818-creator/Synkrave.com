const fs = require("node:fs");
const path = require("node:path");

const STATIC_ROOT = path.resolve(process.cwd(), "static-build");
const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  "server",
  "templates",
  "landing-page.html",
);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "'");
}

function toScriptString(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function getAppName() {
  try {
    const appJson = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "app.json"), "utf8"),
    );

    return typeof appJson.expo?.name === "string"
      ? appJson.expo.name
      : "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function send(res, status, contentType, body) {
  res.statusCode = status;
  res.setHeader("content-type", contentType);
  res.end(body);
}

function serveLandingPage(req, res) {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `exps://${host}`;

  const html = template
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_ATTRIBUTE_PLACEHOLDER/g, escapeHtml(expsUrl))
    .replace(/EXPS_URL_JSON_PLACEHOLDER/g, toScriptString(expsUrl))
    .replace(/APP_NAME_PLACEHOLDER/g, escapeHtml(getAppName()));

  send(res, 200, "text/html; charset=utf-8", html);
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    send(
      res,
      404,
      "application/json; charset=utf-8",
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  send(
    res,
    200,
    "application/json; charset=utf-8",
    fs.readFileSync(manifestPath),
  );
}

function serveStaticFile(pathname, res) {
  const relativePath = path.normalize(pathname).replace(/^[/\\]+/, "");
  const filePath = path.resolve(STATIC_ROOT, relativePath);

  if (
    filePath !== STATIC_ROOT &&
    !filePath.startsWith(`${STATIC_ROOT}${path.sep}`)
  ) {
    send(res, 403, "text/plain; charset=utf-8", "Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "text/plain; charset=utf-8", "Not Found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  send(
    res,
    200,
    MIME_TYPES[extension] || "application/octet-stream",
    fs.readFileSync(filePath),
  );
}

module.exports = (req, res) => {
  const requestUrl = new URL(
    req.url || "/",
    `https://${req.headers.host || "localhost"}`,
  );
  const pathname = requestUrl.pathname;
  const platform = req.headers["expo-platform"];

  if (pathname === "/" || pathname === "/manifest") {
    if (platform === "ios" || platform === "android") {
      serveManifest(platform, res);
      return;
    }

    if (pathname === "/") {
      serveLandingPage(req, res);
      return;
    }
  }

  serveStaticFile(pathname, res);
};

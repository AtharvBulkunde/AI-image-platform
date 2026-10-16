import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const imageDirectory = path.join(__dirname, "generated");
const sessionCookie = "aivision_session";
const sessionLifetimeSeconds = 60 * 60 * 8;

const accessPassword = process.env.AIVISION_ACCESS_PASSWORD || "";
const sessionSecret = process.env.AIVISION_SESSION_SECRET || "";
const apiKey = process.env.OPENAI_API_KEY || "";

if (isProduction && (!accessPassword || !sessionSecret || sessionSecret.length < 32 || !apiKey)) {
  throw new Error("Production requires OPENAI_API_KEY, AIVISION_ACCESS_PASSWORD, and AIVISION_SESSION_SECRET (32+ characters).");
}
if (sessionSecret && sessionSecret.length < 32) {
  throw new Error("AIVISION_SESSION_SECRET must be at least 32 characters.");
}
if (!accessPassword) {
  console.warn("AIVISION_ACCESS_PASSWORD is unset: image generation is locked until you configure it.");
}
if (!apiKey) {
  console.warn("OPENAI_API_KEY is unset: image generation will return a configuration error.");
}

const openai = apiKey ? new OpenAI({ apiKey, timeout: 120_000, maxRetries: 1 }) : null;
await fs.mkdir(imageDirectory, { recursive: true });

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: "12kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "4kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please wait 15 minutes and try again." }
});
const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Generation limit reached for this hour. Please try again later." }
});

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(body).digest("base64url");
  return body + "." + signature;
}
function verifySession(token) {
  if (!sessionSecret || typeof token !== "string" || token.length > 2048) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac("sha256", sessionSecret).update(parts[0]).digest("base64url");
  if (!safeEqual(parts[1], expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) && payload.iss === "aivision";
  } catch { return false; }
}
function getCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const pair of header.split(";")) {
    const index = pair.indexOf("=");
    if (index < 0) continue;
    if (pair.slice(0, index).trim() === name) return decodeURIComponent(pair.slice(index + 1).trim());
  }
  return "";
}
function setSessionCookie(res, value, maxAge = sessionLifetimeSeconds) {
  res.setHeader("Set-Cookie", [
    `${sessionCookie}=${encodeURIComponent(value)}`,
    "Path=/", "HttpOnly", "SameSite=Strict",
    `Max-Age=${maxAge}`,
    ...(isProduction ? ["Secure"] : [])
  ].join("; "));
}
function hasSession(req) {
  return verifySession(getCookie(req, sessionCookie));
}
function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return next();
  const expected = `${req.protocol}://${req.get("host")}`;
  if (origin !== expected) return res.status(403).json({ error: "Cross-origin requests are not allowed." });
  next();
}
function requireSession(req, res, next) {
  if (!accessPassword || !sessionSecret) return res.status(503).json({ error: "Server access is not configured. Set AIVISION_ACCESS_PASSWORD and AIVISION_SESSION_SECRET." });
  if (!hasSession(req)) return res.status(401).json({ error: "Please unlock your private studio first.", code: "AUTH_REQUIRED" });
  next();
}
function parseSize(value) {
  const allowed = new Set(["1024x1024", "1536x1024", "1024x1536"]);
  return allowed.has(value) ? value : "1024x1024";
}
function safeFilename() {
  return crypto.randomBytes(18).toString("hex") + ".png";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "aivision", imageProviderConfigured: Boolean(openai) });
});
app.get("/api/auth/status", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ authenticated: hasSession(req), accessRequired: Boolean(accessPassword && sessionSecret) });
});
app.post("/api/auth/login", sameOrigin, loginLimiter, (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const password = req.body?.password;
  if (!accessPassword || !sessionSecret) return res.status(503).json({ error: "Set AIVISION_ACCESS_PASSWORD and AIVISION_SESSION_SECRET in your server environment first." });
  if (typeof password !== "string" || password.length > 512 || !safeEqual(password, accessPassword)) {
    return res.status(401).json({ error: "That password was not accepted." });
  }
  const now = Math.floor(Date.now() / 1000);
  const token = signSession({ iss: "aivision", iat: now, exp: now + sessionLifetimeSeconds });
  setSessionCookie(res, token);
  res.json({ ok: true, authenticated: true });
});
app.post("/api/auth/logout", sameOrigin, (req, res) => {
  setSessionCookie(res, "", 0);
  res.json({ ok: true });
});

app.post("/api/images/generate", sameOrigin, generationLimiter, requireSession, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!openai) return res.status(503).json({ error: "Image generation is not configured. Add OPENAI_API_KEY to the server environment." });
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (prompt.length < 3 || prompt.length > 1200) {
    return res.status(400).json({ error: "Prompt must be between 3 and 1,200 characters." });
  }
  const allowedStyles = new Set(["anime", "photorealistic", "3d render", "fantasy art", "watercolor", "cyberpunk", "minimalist", "digital illustration"]);
  const style = allowedStyles.has(req.body?.style) ? req.body.style : "anime";
  const size = parseSize(req.body?.size);
  const quality = req.body?.quality === "high" ? "high" : "medium";
  try {
    const result = await openai.images.generate({
      model: imageModel,
      prompt: `Create an original image. Art direction: ${style}. User's description: ${prompt}`,
      size,
      quality,
      n: 1
    });
    const image = result.data?.[0];
    if (!image?.b64_json) {
      return res.status(502).json({ error: "The image provider did not return image bytes. Check the configured model and account access." });
    }
    const bytes = Buffer.from(image.b64_json, "base64");
    if (bytes.length < 100 || bytes.length > 20 * 1024 * 1024) {
      return res.status(502).json({ error: "The image provider returned an invalid image payload." });
    }
    const filename = safeFilename();
    await fs.writeFile(path.join(imageDirectory, filename), bytes, { flag: "wx", mode: 0o600 });
    res.json({
      imageUrl: `/generated/${filename}`,
      prompt,
      style,
      size,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    const status = error?.status;
    if (status === 401 || status === 403) {
      console.error("Image provider authentication/permission error.");
      return res.status(502).json({ error: "The image provider rejected the server credentials or model access. Check your server configuration." });
    }
    if (status === 429) return res.status(429).json({ error: "The image provider is busy or its quota has been reached. Try again later." });
    if (status === 400) return res.status(400).json({ error: "The provider could not process this request. Try adjusting your prompt or image settings." });
    console.error("Image generation failed:", error?.name || "ProviderError", status || "no status");
    return res.status(502).json({ error: "Image generation failed upstream. Please try again later." });
  }
});

app.get("/generated/:filename", requireSession, async (req, res) => {
  if (!/^[a-f0-9]{36}\.png$/.test(req.params.filename)) return res.status(404).end();
  const filePath = path.join(imageDirectory, req.params.filename);
  try {
    await fs.access(filePath);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(filePath);
  } catch {
    res.status(404).json({ error: "Image not found." });
  }
});

app.use(express.static(__dirname, {
  index: "index.html",
  dotfiles: "ignore",
  setHeaders(res, filePath) {
    if (path.basename(filePath) === "index.html") res.setHeader("Cache-Control", "no-cache");
  }
}));
app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "Request body is too large." });
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ error: "Invalid JSON request body." });
  console.error("Unhandled server error:", error?.name || "Error");
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(port, () => {
  console.log(`AIVISION listening on port ${port}`);
  console.log(`Open http://localhost:${port}`);
});

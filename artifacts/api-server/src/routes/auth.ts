import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const router: IRouter = Router();

const SESSION_COOKIE = "ll_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_TTL_SECS = 7 * 24 * 60 * 60;

const SECRET = process.env.SESSION_SECRET;
const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

const isProduction = process.env.NODE_ENV === "production";

if (!SECRET || !ADMIN_USER || !ADMIN_PASS) {
  if (isProduction) {
    console.error("[auth] FATAL: SESSION_SECRET, ADMIN_USERNAME, and ADMIN_PASSWORD env vars are required in production.");
    process.exit(1);
  } else {
    if (!SECRET) console.warn("[auth] SESSION_SECRET not set — using insecure dev default. Set it before deploying.");
    if (!ADMIN_USER || !ADMIN_PASS) console.warn("[auth] ADMIN_USERNAME / ADMIN_PASSWORD not set — login will not work until configured.");
  }
}

const EFFECTIVE_SECRET = SECRET ?? "laakso-dev-only-not-for-production";

interface TokenPayload { user: string; exp: number }

function signToken(payload: TokenPayload): string {
  const data = JSON.stringify(payload);
  const b64 = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", EFFECTIVE_SECRET).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const b64 = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", EFFECTIVE_SECRET).update(b64).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (
    !ADMIN_USER || !ADMIN_PASS ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== ADMIN_USER ||
    password !== ADMIN_PASS
  ) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECS;
  const token = signToken({ user: username, exp });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
  res.json({ ok: true });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ ok: true, user: payload.user });
});

export default router;

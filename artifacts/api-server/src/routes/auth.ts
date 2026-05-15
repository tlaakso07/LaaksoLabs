import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const router: IRouter = Router();

const SESSION_COOKIE = "ll_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const SECRET = process.env.SESSION_SECRET ?? "laakso-labs-dev-secret-change-in-prod";
const ADMIN_USER = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "laakso2024";

function signToken(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return payload;
}

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== ADMIN_USER ||
    password !== ADMIN_PASS
  ) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const payload = `user:${username}:${Date.now()}`;
  const token = signToken(payload);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
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
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ ok: true, user: ADMIN_USER });
});

export default router;

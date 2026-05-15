import { type Request, type Response, type NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "ll_session";
const EFFECTIVE_SECRET =
  process.env.SESSION_SECRET ?? "laakso-dev-only-not-for-production";

interface TokenPayload {
  user: string;
  exp: number;
}

function verifyToken(token: string): TokenPayload | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const b64 = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", EFFECTIVE_SECRET)
    .update(b64)
    .digest("hex");
  try {
    if (
      !timingSafeEqual(
        Buffer.from(sig, "hex"),
        Buffer.from(expected, "hex"),
      )
    )
      return null;
  } catch {
    return null;
  }
  let payload: TokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(b64, "base64url").toString("utf8"),
    ) as TokenPayload;
  } catch {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

import crypto from "node:crypto";
import type { Request, Response } from "express";

const SESSION_COOKIE = "fixnet_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const activeSessions = new Map<string, number>(); // token -> expiresAt

function purgeExpired(): void {
  const now = Date.now();
  for (const [token, expiresAt] of activeSessions) {
    if (expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
}

export function createAdminSession(res: Response): void {
  purgeExpired();
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, Date.now() + SESSION_TTL_MS);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
  });
}

export function destroyAdminSession(req: Request, res: Response): void {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string") {
    activeSessions.delete(token);
  }
  res.clearCookie(SESSION_COOKIE);
}

export function isAdminAuthenticated(req: Request): boolean {
  purgeExpired();
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") {
    return false;
  }
  return activeSessions.has(token);
}

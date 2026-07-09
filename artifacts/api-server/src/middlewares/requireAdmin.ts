import type { NextFunction, Request, Response } from "express";
import { isAdminAuthenticated } from "../lib/adminSession";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

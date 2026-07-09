import type { NextFunction, Request, Response } from "express";

// Express identifies error-handling middleware by its 4-argument signature;
// the unused parameters must stay in place for that to work.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  req.log?.error({ err }, "Unhandled request error");

  if (res.headersSent) {
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

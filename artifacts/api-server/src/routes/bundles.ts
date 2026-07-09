import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bundlesTable } from "@workspace/db";
import { ListBundlesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bundles", async (_req, res): Promise<void> => {
  const bundles = await db
    .select()
    .from(bundlesTable)
    .where(eq(bundlesTable.active, true));

  res.json(ListBundlesResponse.parse(bundles));
});

export default router;

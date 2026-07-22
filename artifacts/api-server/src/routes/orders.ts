import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
} from "@workspace/api-zod";

function toOrderTracking(order: {
  id: number;
  network: string;
  voucherType: string;
  status: string;
  createdAt: Date;
}) {
  return {
    id: order.id,
    network: order.network,
    voucherType: order.voucherType,
    status: order.status,
    createdAt: order.createdAt,
  };
}

const router: IRouter = Router();

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Reject if the same PIN has already been submitted (and isn't cancelled)
  const [existing] = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.voucherPin, parsed.data.voucherPin),
        ne(ordersTable.status, "Cancelled")
      )
    );

  if (existing) {
    res.status(409).json({ error: "This voucher PIN has already been redeemed." });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CreateOrderResponse.parse(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(toOrderTracking(order)));
});

export default router;

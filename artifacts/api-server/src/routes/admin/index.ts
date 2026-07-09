import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, bundlesTable, ordersTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminSessionResponse,
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  UpdateAdminOrderParams,
  UpdateAdminOrderBody,
  UpdateAdminOrderResponse,
  DeleteAdminOrderParams,
  GetAdminStatsResponse,
  ListAdminBundlesResponse,
  CreateBundleBody,
  CreateBundleResponse,
  UpdateBundleParams,
  UpdateBundleBody,
  UpdateBundleResponse,
  DeleteBundleParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../../middlewares/requireAdmin";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminAuthenticated,
} from "../../lib/adminSession";

const router: IRouter = Router();

router.post("/admin/login", (req, res): void => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  createAdminSession(res);
  res.json(AdminLoginResponse.parse({ authenticated: true }));
});

router.post("/admin/logout", (req, res): void => {
  destroyAdminSession(req, res);
  res.sendStatus(204);
});

router.get("/admin/session", (req, res): void => {
  res.json(
    GetAdminSessionResponse.parse({
      authenticated: isAdminAuthenticated(req),
    }),
  );
});

router.get(
  "/admin/orders",
  requireAdmin,
  async (req, res): Promise<void> => {
    const query = ListAdminOrdersQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const search = query.data.search?.trim();
    const whereClause = search
      ? or(
          ilike(ordersTable.phone, `%${search}%`),
          ilike(ordersTable.whatsapp, `%${search}%`),
          ilike(ordersTable.network, `%${search}%`),
          ilike(ordersTable.voucherType, `%${search}%`),
          ilike(ordersTable.voucherPin, `%${search}%`),
          ilike(ordersTable.status, `%${search}%`),
        )
      : undefined;

    const orders = await db
      .select()
      .from(ordersTable)
      .where(whereClause ? and(whereClause) : undefined)
      .orderBy(desc(ordersTable.createdAt));

    res.json(ListAdminOrdersResponse.parse(orders));
  },
);

router.patch(
  "/admin/orders/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAdminOrderParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateAdminOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [order] = await db
      .update(ordersTable)
      .set(parsed.data)
      .where(eq(ordersTable.id, params.data.id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(UpdateAdminOrderResponse.parse(order));
  },
);

router.delete(
  "/admin/orders/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteAdminOrderParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [order] = await db
      .delete(ordersTable)
      .where(eq(ordersTable.id, params.data.id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.sendStatus(204);
  },
);

router.get(
  "/admin/stats",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const orders = await db.select().from(ordersTable);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;
    const processingOrders = orders.filter(
      (o) => o.status === "Processing",
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === "Completed",
    ).length;
    const totalRevenue = completedOrders * 130;

    res.json(
      GetAdminStatsResponse.parse({
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalRevenue,
      }),
    );
  },
);

router.get(
  "/admin/bundles",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const bundles = await db
      .select()
      .from(bundlesTable)
      .orderBy(desc(bundlesTable.id));

    res.json(ListAdminBundlesResponse.parse(bundles));
  },
);

router.post(
  "/admin/bundles",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateBundleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [bundle] = await db
      .insert(bundlesTable)
      .values(parsed.data)
      .returning();

    res.status(201).json(CreateBundleResponse.parse(bundle));
  },
);

router.patch(
  "/admin/bundles/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateBundleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateBundleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [bundle] = await db
      .update(bundlesTable)
      .set(parsed.data)
      .where(eq(bundlesTable.id, params.data.id))
      .returning();

    if (!bundle) {
      res.status(404).json({ error: "Bundle not found" });
      return;
    }

    res.json(UpdateBundleResponse.parse(bundle));
  },
);

router.delete(
  "/admin/bundles/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteBundleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [bundle] = await db
      .delete(bundlesTable)
      .where(eq(bundlesTable.id, params.data.id))
      .returning();

    if (!bundle) {
      res.status(404).json({ error: "Bundle not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;

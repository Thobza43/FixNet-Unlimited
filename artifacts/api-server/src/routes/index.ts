import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import bundlesRouter from "./bundles";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(bundlesRouter);
router.use(adminRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/articles", articlesRouter);
router.use("/stats", statsRouter);

export default router;

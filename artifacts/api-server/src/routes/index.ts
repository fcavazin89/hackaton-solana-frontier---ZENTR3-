import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini/index";
import agentsRouter from "./agents/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/gemini", geminiRouter);
router.use("/agents", agentsRouter);

export default router;

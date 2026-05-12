import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tasksRouter from "./tasks";
import deploymentsRouter from "./deployments";
import integrationsRouter from "./integrations";
import dashboardRouter from "./dashboard";
import agentRouter from "./agent";
import terminalRouter from "./terminal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tasksRouter);
router.use(deploymentsRouter);
router.use(integrationsRouter);
router.use(dashboardRouter);
router.use(agentRouter);
router.use(terminalRouter);

export default router;

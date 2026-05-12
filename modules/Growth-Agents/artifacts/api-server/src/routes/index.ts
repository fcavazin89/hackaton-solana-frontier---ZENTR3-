import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import agentsRouter from "./agents";
import tasksRouter from "./tasks";
import insightsRouter from "./insights";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(agentsRouter);
router.use(tasksRouter);
router.use(insightsRouter);
router.use(dashboardRouter);

export default router;

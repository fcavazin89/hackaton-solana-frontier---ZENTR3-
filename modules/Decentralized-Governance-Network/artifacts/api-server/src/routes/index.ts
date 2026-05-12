import { Router, type IRouter } from "express";
import healthRouter from "./health";
import daosRouter from "./daos";
import membersRouter from "./members";
import proposalsRouter from "./proposals";
import statsRouter from "./stats";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(daosRouter);
router.use(membersRouter);
router.use(proposalsRouter);
router.use(statsRouter);
router.use(aiRouter);

export default router;

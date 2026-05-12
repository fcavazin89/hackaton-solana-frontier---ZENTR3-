import { Router, type IRouter } from "express";
import healthRouter from "./health";
import capital3Router from "./capital3";
import { mvpRouter } from "./mvp";
import { bizmodelRouter } from "./bizmodel";
import { pitchRouter } from "./pitch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(capital3Router);
router.use("/mvp", mvpRouter);
router.use("/bizmodel", bizmodelRouter);
router.use("/pitch", pitchRouter);

export default router;

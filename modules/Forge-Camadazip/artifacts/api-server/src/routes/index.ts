import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentsRouter from "./agents";
import conversationsRouter from "./conversations";
import openaiChatRouter from "./openai-chat";
import statsRouter from "./stats";
import auditRouter from "./audit";
import contractGenerateRouter from "./contract-generate";
import forgeAgentRouter from "./forge-agent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentsRouter);
router.use(conversationsRouter);
router.use(openaiChatRouter);
router.use(statsRouter);
router.use(auditRouter);
router.use(contractGenerateRouter);
router.use(forgeAgentRouter);

export default router;

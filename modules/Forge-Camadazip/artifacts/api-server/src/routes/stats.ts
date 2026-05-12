import { Router } from "express";
import { db, conversations, messages } from "@workspace/db";
import { count, eq, sql } from "drizzle-orm";
import { AGENTS } from "./agents.js";

const router = Router();

router.get("/stats/overview", async (req, res) => {
  try {
    const [totalConvRow] = await db.select({ count: count() }).from(conversations);
    const [totalMsgRow] = await db.select({ count: count() }).from(messages);

    const agentBreakdown = await Promise.all(
      AGENTS.map(async (agent) => {
        const [convCount] = await db
          .select({ count: count() })
          .from(conversations)
          .where(eq(conversations.agentId, agent.id));

        const [msgCount] = await db
          .select({ count: count() })
          .from(messages)
          .where(
            sql`${messages.conversationId} IN (
              SELECT id FROM conversations WHERE agent_id = ${agent.id}
            )`
          );

        return {
          agentId: agent.id,
          agentName: agent.name,
          domain: agent.domain,
          conversationCount: Number(convCount?.count ?? 0),
          messageCount: Number(msgCount?.count ?? 0),
        };
      })
    );

    res.json({
      totalConversations: Number(totalConvRow?.count ?? 0),
      totalMessages: Number(totalMsgRow?.count ?? 0),
      agentBreakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting stats overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

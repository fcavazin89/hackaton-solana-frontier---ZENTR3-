import { Router } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { CreateConversationBody } from "@workspace/api-zod";

const router = Router();

router.get("/conversations", async (req, res) => {
  try {
    const agentId = req.query.agentId as string | undefined;

    const baseQuery = db
      .select({
        id: conversations.id,
        agentId: conversations.agentId,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        messageCount: count(messages.id),
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt));

    const rows = agentId
      ? await baseQuery.where(eq(conversations.agentId, agentId))
      : await baseQuery;

    const { AGENTS } = await import("./agents.js");

    const result = rows.map((row) => {
      const agent = AGENTS.find((a) => a.id === row.agentId);
      return {
        id: String(row.id),
        agentId: row.agentId,
        agentName: agent?.name ?? "Agente",
        agentDomain: agent?.domain ?? "architecture",
        title: row.title,
        messageCount: Number(row.messageCount),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const parsed = CreateConversationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { agentId, title } = parsed.data;

    const [conv] = await db
      .insert(conversations)
      .values({
        agentId,
        title: title ?? "Nova conversa",
      })
      .returning();

    const { AGENTS } = await import("./agents.js");
    const agent = AGENTS.find((a) => a.id === agentId);

    res.status(201).json({
      id: String(conv!.id),
      agentId: conv!.agentId,
      agentName: agent?.name ?? "Agente",
      agentDomain: agent?.domain ?? "architecture",
      title: conv!.title,
      messageCount: 0,
      createdAt: conv!.createdAt.toISOString(),
      updatedAt: conv!.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json({
      id: String(conv.id),
      agentId: conv.agentId,
      title: conv.title,
      messages: msgs.map((m) => ({
        id: String(m.id),
        conversationId: String(m.conversationId),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting conversation" );
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation id" });
      return;
    }

    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

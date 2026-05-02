import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

router.get("/conversations", async (req, res) => {
  try {
    const convs = await db
      .select()
      .from(conversations)
      .orderBy(conversations.createdAt);
    res.json(convs);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const body = CreateGeminiConversationBody.parse(req.body);
    const [conv] = await db
      .insert(conversations)
      .values({ title: body.title })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(400).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const params = GetGeminiConversationParams.parse({
      id: req.params.id,
    });
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.id));
    if (!conv) return void res.status(404).json({ error: "Not found" });

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.id))
      .orderBy(messages.createdAt);

    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const params = DeleteGeminiConversationParams.parse({
      id: req.params.id,
    });
    const [deleted] = await db
      .delete(conversations)
      .where(eq(conversations.id, params.id))
      .returning();
    if (!deleted) return void res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const params = ListGeminiMessagesParams.parse({ id: req.params.id });
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.id))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const params = SendGeminiMessageParams.parse({ id: req.params.id });
    const body = SendGeminiMessageBody.parse(req.body);

    const [userMsg] = await db
      .insert(messages)
      .values({
        conversationId: params.id,
        role: "user",
        content: body.content,
      })
      .returning();

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.id))
      .orderBy(messages.createdAt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: params.id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    req.log.info({ convId: params.id }, "Message sent");
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
    res.end();
  }
});

export default router;

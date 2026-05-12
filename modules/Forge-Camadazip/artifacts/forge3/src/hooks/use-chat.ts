import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetConversationQueryKey, Message } from "@workspace/api-client-react";

export function useChat(conversationId: string, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      conversationId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const assistantMessageId = `temp-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        conversationId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${BASE}/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                setMessages((prev) => 
                  prev.map((msg) => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  )
                );
              }
              if (data.done) {
                // Invalidate query to get real IDs and synced history
                queryClient.invalidateQueries({
                  queryKey: getGetConversationQueryKey(conversationId),
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Remove temporary assistant message if error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, isTyping, queryClient]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
      // Invalidate to make sure we're in sync with what was generated
      queryClient.invalidateQueries({
        queryKey: getGetConversationQueryKey(conversationId),
      });
    }
  }, [conversationId, queryClient]);

  // Sync with initialMessages when they update (from query)
  // This allows the initial fetch to set the real history, overriding temp messages
  useCallback(() => {
    if (!isTyping) {
      setMessages(initialMessages);
    }
  }, [initialMessages, isTyping]);

  return { messages, isTyping, sendMessage, stopGeneration, setMessages };
}

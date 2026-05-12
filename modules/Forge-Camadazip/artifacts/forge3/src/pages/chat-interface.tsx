import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetConversation, getGetConversationQueryKey } from "@workspace/api-client-react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Terminal, ShieldAlert, Cpu, Server, Activity, Loader2 } from "lucide-react";

export default function ChatInterface() {
  const { conversationId } = useParams();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: loadingConversation, isError } = useGetConversation(conversationId || "", {
    query: { enabled: !!conversationId, queryKey: getGetConversationQueryKey(conversationId || "") }
  });

  const { messages, isTyping, sendMessage, stopGeneration } = useChat(
    conversationId || "", 
    conversation?.messages || []
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-mono text-destructive uppercase tracking-widest">Connection Failed</h2>
        <Button onClick={() => setLocation("/")} variant="outline" className="font-mono uppercase">
          Return to Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full absolute inset-0">
      {/* Chat Header */}
      <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center px-6 shrink-0 z-10">
        {loadingConversation ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground leading-tight">{conversation?.title || 'Active Session'}</h2>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Uplink established with {conversation?.agentId}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loadingConversation ? (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            <Skeleton className="h-24 w-3/4 ml-auto rounded-2xl rounded-tr-none" />
            <Skeleton className="h-32 w-3/4 rounded-2xl rounded-tl-none" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <Activity className="h-12 w-12 opacity-20" />
            <p className="font-mono uppercase tracking-widest text-sm">Link established. Awaiting input.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto w-full pb-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-sm ${
                      isUser 
                        ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tr-sm' 
                        : 'bg-card border border-border/50 text-foreground rounded-tl-sm'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-3 w-3 text-secondary" />
                        <span className="text-[10px] font-mono text-secondary uppercase tracking-wider font-bold">System Response</span>
                      </div>
                    )}
                    <div className={`prose prose-sm dark:prose-invert max-w-none ${isUser ? 'prose-p:text-foreground' : ''}`}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className="my-1 whitespace-pre-wrap font-sans leading-relaxed">{line}</p>
                      ))}
                      {!isUser && isTyping && index === messages.length - 1 && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-secondary animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border/50 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-card border border-border/50 rounded-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all p-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Transmit instructions..."
              className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent py-3 px-3 font-sans text-base shadow-none"
              disabled={isTyping || loadingConversation}
            />
            {isTyping ? (
              <Button 
                type="button" 
                onClick={stopGeneration}
                variant="destructive" 
                size="icon" 
                className="h-10 w-10 shrink-0 rounded-lg mb-1 mr-1"
              >
                <div className="h-3 w-3 bg-current rounded-sm" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={!input.trim() || loadingConversation} 
                size="icon" 
                className="h-10 w-10 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground mb-1 mr-1 shadow-glow-primary"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
          <div className="absolute -top-6 left-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            {isTyping ? (
              <><Loader2 className="h-3 w-3 animate-spin text-secondary" /> Processing...</>
            ) : (
              'Ready for input. Press Shift+Enter for new line.'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

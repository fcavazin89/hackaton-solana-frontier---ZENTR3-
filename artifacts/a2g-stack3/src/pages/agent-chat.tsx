import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { AGENTS, getAgentColorClass } from "@/lib/agents";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Terminal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AgentChat() {
  const { id } = useParams();
  const agent = AGENTS.find(a => a.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (!agent) {
    return <div className="p-6 text-destructive">Agent not found</div>;
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);
    setStreamingContent("");

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          agentRole: agent.role,
          systemPrompt: agent.systemPrompt || `You are ${agent.name}, acting as ${agent.role}. ${agent.description}`,
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                setMessages(prev => [...prev, { role: 'model', content: fullContent }]);
                setStreamingContent("");
                setIsTyping(false);
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }
      
      // Safety catch in case 'done' event was missed
      if (fullContent && isTyping) {
         setMessages(prev => [...prev, { role: 'model', content: fullContent }]);
         setStreamingContent("");
         setIsTyping(false);
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] gap-4 animate-in fade-in duration-500">
      
      {/* Left Sidebar - Agent Info */}
      <div className="w-full md:w-64 lg:w-80 flex flex-col gap-4">
        <Card className={`bg-card/40 backdrop-blur border p-4 ${getAgentColorClass(agent.color)}`}>
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="p-2 rounded-md bg-background/50 border border-border/30">
              <agent.icon className="w-5 h-5" />
            </div>
          </div>
          <h2 className="font-display font-bold text-lg">{agent.name}</h2>
          <p className="text-xs font-mono text-muted-foreground mb-4">{agent.role}</p>
          <div className="text-sm text-muted-foreground/80 space-y-2">
            <p>{agent.description}</p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <div className={`w-2 h-2 rounded-full ${agent.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
              <span className="text-xs font-mono">{agent.status}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col bg-card/40 backdrop-blur border-border/50 overflow-hidden">
        <div className="h-10 border-b border-border/50 bg-muted/20 flex items-center px-4">
          <Terminal className="w-4 h-4 text-primary mr-2" />
          <span className="text-xs font-mono text-muted-foreground">SECURE_CHANNEL_ESTABLISHED // {agent.id}</span>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground font-mono text-sm mt-10">
                Initiate connection with {agent.name}...
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary/20 border border-primary/30 text-foreground' 
                    : 'bg-muted/30 border border-border/50 text-foreground prose prose-invert max-w-none'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 bg-muted/30 border border-border/50 text-foreground prose prose-invert max-w-none">
                  <div className="text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle"></span>
                </div>
              </div>
            )}
            
            {isTyping && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-lg p-3 bg-muted/30 border border-border/50 text-foreground flex gap-1 items-center h-10">
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-background/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter transmission..." 
              className="font-mono bg-input/50 border-border focus-visible:ring-primary focus-visible:border-primary"
              disabled={isTyping || agent.status === 'OFFLINE'}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!input.trim() || isTyping || agent.status === 'OFFLINE'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
      
    </div>
  );
}

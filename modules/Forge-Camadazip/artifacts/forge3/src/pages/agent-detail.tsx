import { useLocation, useParams } from "wouter";
import { useGetAgent, useListConversations, useCreateConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, Clock, Trash2, Cpu, ShieldAlert, Server, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AgentDetail() {
  const { agentId } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: agent, isLoading: loadingAgent } = useGetAgent(agentId || "", {
    query: { enabled: !!agentId, queryKey: [`/api/agents/${agentId || ""}`] }
  });

  const { data: conversations, isLoading: loadingConversations } = useListConversations(
    { agentId },
    { query: { enabled: !!agentId, queryKey: getListConversationsQueryKey({ agentId }) } }
  );

  const createConversation = useCreateConversation();

  const handleStartConversation = () => {
    if (!agentId) return;
    createConversation.mutate({ data: { agentId } }, {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey({ agentId }) });
        setLocation(`/chat/${newConv.id}`);
      }
    });
  };

  const getDomainIcon = (domain?: string) => {
    switch (domain) {
      case 'architecture': return <Cpu className="h-5 w-5 text-secondary" />;
      case 'smart-contracts': return <ShieldAlert className="h-5 w-5 text-primary" />;
      case 'infrastructure': return <Server className="h-5 w-5 text-chart-4" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getDomainColor = (domain?: string) => {
    switch (domain) {
      case 'architecture': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'smart-contracts': return 'bg-primary/10 text-primary border-primary/20';
      case 'infrastructure': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loadingAgent) {
    return (
      <div className="container max-w-4xl mx-auto p-6 md:p-12 space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold font-mono text-muted-foreground uppercase tracking-widest">Agent Not Found</h2>
        <Button onClick={() => setLocation("/")} variant="outline" className="font-mono uppercase tracking-wider">
          Return to Command Center
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 md:p-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        <div className="p-6 bg-card border border-border/50 rounded-2xl shadow-lg shrink-0">
          <span className="text-6xl">{agent.icon}</span>
        </div>
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground font-sans">
              {agent.name}
            </h1>
            <Badge variant="outline" className={`font-mono text-xs uppercase ${getDomainColor(agent.domain)}`}>
              {agent.domain}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground font-mono">
            {agent.description}
          </p>
          <div className="pt-4 flex gap-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Operations</p>
              <p className="text-xl font-bold font-mono">{agent.totalConversations}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Data Exchanged</p>
              <p className="text-xl font-bold font-mono">{agent.totalMessages}</p>
            </div>
          </div>
          <Button 
            size="lg" 
            className="mt-4 font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleStartConversation}
            disabled={createConversation.isPending}
          >
            <Activity className="mr-2 h-4 w-4" />
            Initialize Link
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-mono uppercase tracking-widest text-foreground flex items-center gap-3 border-b border-border/50 pb-4">
          <span className="h-px w-8 bg-secondary/50"></span>
          Recent Operations
        </h2>
        
        {loadingConversations ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !conversations?.length ? (
          <Card className="bg-card/30 border-dashed border-border/50">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground font-mono">No operations recorded for this agent.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {conversations.map(conv => (
              <Card 
                key={conv.id} 
                className="bg-card/30 border-border/50 hover:bg-card/50 hover:border-secondary/50 transition-all cursor-pointer group"
                onClick={() => setLocation(`/chat/${conv.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                      {conv.title || 'Untitled Session'}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {conv.messageCount} exchanges
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-secondary hover:bg-secondary/10">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

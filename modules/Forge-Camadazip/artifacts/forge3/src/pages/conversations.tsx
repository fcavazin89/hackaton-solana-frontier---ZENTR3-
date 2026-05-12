import { useState } from "react";
import { useLocation } from "wouter";
import { useListConversations, useDeleteConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, Clock, Trash2, ArrowRight, Database } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ConversationsList() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: conversations, isLoading } = useListConversations();
  const deleteConversation = useDeleteConversation();

  const filteredConversations = conversations?.filter(conv => 
    conv.title?.toLowerCase().includes(search.toLowerCase()) ||
    conv.agentName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      }
    });
  };

  const getDomainColor = (domain?: string) => {
    switch (domain) {
      case 'architecture': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'smart-contracts': return 'text-primary bg-primary/10 border-primary/20';
      case 'infrastructure': return 'text-chart-4 bg-chart-4/10 border-chart-4/20';
      default: return 'text-muted-foreground bg-muted border-muted-foreground/20';
    }
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Operations Log
          </h1>
          <p className="text-muted-foreground font-mono mt-2">Historical database of all agent interactions.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search records..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono bg-card/50 border-border/50 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : !filteredConversations?.length ? (
          <div className="text-center py-20 bg-card/30 border border-dashed border-border/50 rounded-xl">
            <Database className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-mono text-muted-foreground uppercase tracking-widest">No records found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredConversations.map(conv => (
              <Card 
                key={conv.id} 
                className="bg-card/30 border-border/50 hover:bg-card/50 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setLocation(`/chat/${conv.id}`)}
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {conv.title || 'Untitled Session'}
                      </h3>
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase ${getDomainColor(conv.agentDomain)}`}>
                        {conv.agentName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {conv.messageCount} exchanges
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(conv.updatedAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Purge Record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this conversation log. This action cannot be reversed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => handleDelete(conv.id, e as any)}
                          >
                            Purge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

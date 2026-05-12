import { FC, PropsWithChildren, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger
} from "./ui/sidebar";
import {
  MessageSquare, Activity, Search, User, Code2, Shield, Layers, Globe, ShieldCheck,
  ChevronDown, ChevronRight, Bot, Trash2
} from "lucide-react";
import { useListAgents, useListConversations, useDeleteConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function Forge3Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { forge: "text-xs", three: "text-xs", sub: "text-[8px]", mark: "h-6 w-6 text-xs" },
    md: { forge: "text-sm", three: "text-sm", sub: "text-[9px]", mark: "h-8 w-8 text-sm" },
    lg: { forge: "text-xl", three: "text-xl", sub: "text-[11px]", mark: "h-10 w-10 text-base" },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${sizes.mark} flex items-center justify-center rounded-md border border-primary/30 bg-primary/10 font-display font-black text-primary glow-primary shrink-0`}>
        3
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-0">
          <span className={`font-display font-bold tracking-wider uppercase text-foreground ${sizes.forge}`}>FORGE</span>
          <span className={`font-display font-black text-primary ${sizes.three}`}>3</span>
        </div>
        <span className={`font-mono uppercase tracking-[0.2em] text-muted-foreground leading-none mt-0.5 ${sizes.sub}`}>
          Engenharia
        </span>
      </div>
    </div>
  );
}

const DOMAIN_COLORS: Record<string, string> = {
  architecture: "text-secondary",
  "smart-contracts": "text-primary",
  infrastructure: "text-[#7A00FF]",
  "blockchain-engineering": "text-cyan-400",
  defi: "text-emerald-400",
  economics: "text-amber-400",
  econometrics: "text-blue-400",
  "graph-theory": "text-pink-400",
  taxonomy: "text-orange-300",
  ontology: "text-violet-400",
  econophysics: "text-teal-400",
  "devops-web3": "text-lime-400",
};

export const AppLayout: FC<PropsWithChildren> = ({ children }) => {
  const [location] = useLocation();
  const { data: agents } = useListAgents();
  const { data: recentConversations } = useListConversations({ agentId: undefined });
  const [agentsExpanded, setAgentsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const deleteConversation = useDeleteConversation();

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
    });
  };

  const isWeb3Active = location.startsWith("/web3");
  const visibleAgents = agentsExpanded ? (agents ?? []) : (agents ?? []).slice(0, 5);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background dark text-foreground">
        <Sidebar className="border-r border-border/50 bg-sidebar/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-border/50 p-4">
            <Link href="/" className="flex items-center gap-2 px-1 hover:opacity-80 transition-opacity">
              <Forge3Logo size="md" />
            </Link>
          </SidebarHeader>

          <SidebarContent className="overflow-y-auto">
            {/* Platform */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-primary/60 font-mono">Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/"}>
                      <Link href="/" className="font-mono text-sm">
                        <Activity size={16} className="text-primary/70" />
                        <span>Command Center</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/conversations"}>
                      <Link href="/conversations" className="font-mono text-sm">
                        <Search size={16} className="text-primary/70" />
                        <span>All Operations</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Web3 Layer */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-secondary/60 font-mono">Web3 Layer</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/web3"}>
                      <Link href="/web3" className="font-mono text-sm">
                        <Globe size={16} className="text-secondary" />
                        <span>The Forge</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/web3/forge"}>
                      <Link href="/web3/forge" className="font-mono text-sm">
                        <Code2 size={16} className="text-primary" />
                        <span>Contract Forge</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/web3/identity"}>
                      <Link href="/web3/identity" className="font-mono text-sm">
                        <Shield size={16} className="text-secondary" />
                        <span>Smart Account</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/web3/networks"}>
                      <Link href="/web3/networks" className="font-mono text-sm">
                        <Layers size={16} className="text-[#7A00FF]" />
                        <span>L2 Networks</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/web3/audit"}>
                      <Link href="/web3/audit" className="font-mono text-sm">
                        <ShieldCheck size={16} className="text-red-400" />
                        <span>Audit Studio</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* A2G Agents */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-primary/60 font-mono flex items-center justify-between pr-2">
                <span>Agents</span>
                {agents && agents.length > 5 && (
                  <span className="text-[9px] text-muted-foreground/50 normal-case tracking-normal">
                    {agents.length} total
                  </span>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAgents.map(agent => {
                    const color = DOMAIN_COLORS[agent.domain] ?? "text-muted-foreground";
                    return (
                      <SidebarMenuItem key={agent.id}>
                        <SidebarMenuButton asChild isActive={location === `/agent/${agent.id}`}>
                          <Link href={`/agent/${agent.id}`} className="font-mono text-sm">
                            <span className="text-base leading-none w-4 shrink-0">{agent.icon}</span>
                            <span className={`truncate ${color}`}>{agent.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {agents && agents.length > 5 && (
                    <SidebarMenuItem>
                      <button
                        onClick={() => setAgentsExpanded(v => !v)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        {agentsExpanded ? (
                          <><ChevronDown size={12} /> Mostrar menos</>
                        ) : (
                          <><ChevronRight size={12} /> +{agents.length - 5} agentes</>
                        )}
                      </button>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Recent Sessions */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-primary/60 font-mono">Recent Sessions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {recentConversations?.slice(0, 5).map(conv => (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton asChild isActive={location === `/chat/${conv.id}`}>
                        <Link href={`/chat/${conv.id}`} className="font-mono text-xs text-muted-foreground hover:text-foreground truncate max-w-[200px]">
                          <MessageSquare size={14} className="opacity-50 shrink-0" />
                          <span className="truncate">{conv.title || 'Untitled Session'}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        title="Deletar sessão"
                      >
                        <Trash2 size={13} />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40 p-3">
            <p className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest text-center">
              Do código à realidade.
            </p>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col relative w-full overflow-hidden">
          <header className="h-14 border-b border-border/50 flex items-center px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-primary transition-colors" />
            <div className="flex-1" />
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {isWeb3Active && (
                <span className="flex items-center gap-1.5 text-secondary/70">
                  <Globe size={12} />
                  Web3 Layer
                </span>
              )}
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                System Online
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto relative">
            <div className="absolute inset-0 pointer-events-none opacity-[0.025] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIi8+Cjwvc3ZnPg==')]" />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

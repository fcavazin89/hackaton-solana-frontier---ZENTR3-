import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, TerminalSquare, Rocket, Network, Menu, X, Bot, Cpu } from "lucide-react";
import { useHealthCheck, useGetAgentStatus } from "@workspace/api-client-react";

const navigation = [
  { name: "MISSION CTRL",  href: "/",             icon: LayoutDashboard },
  { name: "AGENT FLEET",   href: "/agent",        icon: Bot },
  { name: "DIRECTIVES",    href: "/tasks",        icon: TerminalSquare },
  { name: "DEPLOYS",       href: "/deployments",  icon: Rocket },
  { name: "INTEGRATIONS",  href: "/integrations", icon: Network },
];

function Scr3pLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <span className={`font-display font-black tracking-wider ${textSize}`} style={{ fontFamily: "var(--app-font-display)" }}>
      <span className="text-foreground">SCR</span>
      <span className="text-primary">3</span>
      <span className="text-foreground">P</span>
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: health } = useHealthCheck({ query: { refetchInterval: 10000 } });
  const { data: agentStatus } = useGetAgentStatus({ query: { refetchInterval: 5000 } });

  const awaitingCount = agentStatus?.awaitingApprovalCount ?? 0;
  const isOnline = health?.status === "ok";

  return (
    <div className="flex h-screen bg-background text-foreground font-mono overflow-hidden">
      <div className="scanline" />
      <div className="noise-overlay" />

      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-50 flex transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="fixed inset-0 bg-black/85" onClick={() => setMobileMenuOpen(false)} />
        <div className="relative flex w-64 flex-col bg-card border-r border-border z-10">
          <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-border">
            <Scr3pLogo />
            <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <SidebarNav location={location} awaitingCount={awaitingCount} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
          <SidebarFooter isOnline={isOnline} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-10 border-r border-border" style={{ background: "hsl(220 30% 4%)" }}>
        <div className="flex flex-col px-5 pt-6 pb-4 border-b border-border gap-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <Scr3pLogo />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-[0.2em] pl-9">
            BUILD WITHOUT PERMISSION.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] px-2 mb-3">
            — MODULES —
          </p>
          <SidebarNav location={location} awaitingCount={awaitingCount} />
        </div>

        {agentStatus && (
          <div className="px-3 pb-2">
            <div className="rounded-sm border border-border bg-muted/30 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">ORCHESTRATOR</span>
                <div className="flex items-center gap-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${agentStatus.isRunning ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                  <span className={`text-[9px] font-mono ${agentStatus.isRunning ? "text-primary" : "text-muted-foreground/50"}`}>
                    {agentStatus.isRunning ? "ACTIVE" : "IDLE"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/50">
                <span>{agentStatus.runningTaskCount} running</span>
                <span>{agentStatus.pendingTaskCount} queued</span>
                <span className={awaitingCount > 0 ? "text-yellow-500 font-bold" : ""}>{awaitingCount} pending</span>
              </div>
            </div>
          </div>
        )}

        <SidebarFooter isOnline={isOnline} />
      </aside>

      <div className="flex flex-1 flex-col md:pl-60 h-full relative z-0">
        {/* Mobile topbar */}
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/90 backdrop-blur-sm px-4 md:hidden">
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Scr3pLogo size="sm" />
        </div>

        <main className="flex-1 overflow-y-auto grid-bg">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ location, awaitingCount, onNavigate }: { location: string; awaitingCount: number; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 px-3 py-2.5 text-xs font-mono font-medium transition-all duration-150 rounded-sm ${
              isActive
                ? "bg-primary/10 text-primary border border-primary/25"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent"
            }`}
          >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />}
            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"}`} />
            <span className="tracking-widest text-[11px]">{item.name}</span>
            {item.href === "/agent" && awaitingCount > 0 && (
              <span className="ml-auto bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded-sm text-[9px] animate-pulse">{awaitingCount}</span>
            )}
            {isActive && awaitingCount === 0 && <div className="ml-auto h-1 w-1 rounded-full bg-primary animate-pulse" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="p-3 border-t border-border">
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse-ring" : "bg-red-500"}`} />
          <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">CORE NODE</span>
        </div>
        <span className={`text-[10px] font-mono font-bold ${isOnline ? "text-primary" : "text-destructive"}`}>
          {isOnline ? "ONLINE" : "ERR"}
        </span>
      </div>
      <p className="text-center text-[8px] font-mono text-muted-foreground/25 tracking-widest mt-1 uppercase">
        FROM SCRAP TO PROTOCOL
      </p>
    </div>
  );
}

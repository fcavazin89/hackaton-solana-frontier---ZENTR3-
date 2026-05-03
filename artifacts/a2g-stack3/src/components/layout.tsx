import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Terminal, LayoutDashboard, ClipboardList, Activity,
  LayoutTemplate, Flame, Map,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/",        label: "COMMAND",   icon: LayoutDashboard },
    { href: "/plan",    label: "PLAN",      icon: LayoutTemplate  },
    { href: "/tasks",   label: "TASKS",     icon: ClipboardList   },
    { href: "/sprint",  label: "SPRINT",    icon: Flame           },
    { href: "/roadmap", label: "ROADMAP",   icon: Map             },
    { href: "/protocol",label: "PROTOCOL",  icon: Activity        },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-display font-bold tracking-wider text-primary neon-text">Spr1nt3</span>
          <span className="text-xs font-mono text-muted-foreground ml-2 border border-border/50 px-1.5 py-0.5 rounded bg-muted/30">v2.0.0</span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/10 text-primary neon-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 flex flex-col p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

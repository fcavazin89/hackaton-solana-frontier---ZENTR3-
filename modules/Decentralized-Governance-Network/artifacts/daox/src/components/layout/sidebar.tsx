import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Activity, BarChart3, Box, BrainCircuit, ChevronRight, Command, LayoutDashboard, Plus, Users } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "DAOs", href: "/daos", icon: Box },
    { name: "AI Advisor", href: "/advisor", icon: BrainCircuit },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Command className="h-6 w-6 text-primary mr-2" />
        <span className="font-sans font-bold tracking-tight text-lg text-sidebar-foreground">DAOX</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors",
                  location === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/70"
                )}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none text-sidebar-foreground">Jane Doe</span>
            <span className="text-xs text-sidebar-foreground/60 mt-1">0x12...34</span>
          </div>
        </div>
      </div>
    </div>
  );
}

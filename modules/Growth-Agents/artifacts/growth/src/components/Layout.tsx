import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bot, CheckSquare, Lightbulb, FolderKanban, Activity } from "lucide-react";
import { useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-[72px] flex flex-col justify-center px-4 border-b border-sidebar-border">
          <div
            className="text-[22px] font-black tracking-wide leading-none"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            <span className="text-white">GROWTH</span>
            <span
              style={{
                color: "#00FF9C",
                textShadow: "0 0 16px #00FF9C99, 0 0 32px #00FF9C44",
              }}
            >
              3
            </span>
          </div>
          <p
            className="text-[9px] tracking-[0.2em] uppercase mt-1.5"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "#00FF9C99" }}
          >
            GROWTH. SCALE. IMPACT.
          </p>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all font-medium ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={
                    isActive
                      ? { color: "#00FF9C", filter: "drop-shadow(0 0 5px #00FF9C88)" }
                      : undefined
                  }
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          <p
            className="text-[8px] tracking-[0.25em] uppercase"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "#00FF9C55" }}
          >
            THE STACK3 ECOSYSTEM
          </p>
          <div className="flex items-center gap-2 text-xs font-mono">
            <Activity
              className="w-3 h-3"
              style={{ color: "#00FF9C", filter: "drop-shadow(0 0 5px #00FF9C)" }}
            />
            <span style={{ color: "#00FF9C" }} className="font-bold tracking-widest text-[10px]">
              ONLINE
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, History, BarChart3, FlaskConical, BarChart2, Presentation, ChevronDown, Menu, X } from "lucide-react";

const AGENTS = [
  { href: "/analyze", label: "Funding Agent", icon: Terminal, desc: "Web3 Funding & Tokenomics" },
  { href: "/mvp", label: "MVP Validator", icon: FlaskConical, desc: "Problem-Solution FIT" },
  { href: "/bizmodel", label: "Biz Model", icon: BarChart2, desc: "Business Model Architect" },
  { href: "/pitch", label: "Pitch Builder", icon: Presentation, desc: "Investor Pitch Deck" },
];

export function Navbar() {
  const [location] = useLocation();
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAgentRoute = AGENTS.some((a) => location.startsWith(a.href) && a.href !== "/");

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="absolute inset-0 carbon-grid pointer-events-none opacity-50" />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-10 h-10 gold-gradient-bg flex items-center justify-center font-mono font-black text-sm text-black tracking-wider relative overflow-hidden">
            <span className="relative z-10">C3</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono font-black text-xl tracking-widest gold-gradient-text" style={{ fontFamily: "Orbitron, sans-serif" }}>
              CAPITAL3
            </span>
            <span className="text-[9px] text-muted-foreground tracking-[0.25em] font-sans uppercase">
              FUNDING. SCALE. DOMINATE.
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs">
          {/* Agents dropdown */}
          <div className="relative">
            <button
              onClick={() => setAgentsOpen((o) => !o)}
              onBlur={() => setTimeout(() => setAgentsOpen(false), 150)}
              className={`flex items-center gap-1.5 transition-all uppercase tracking-wider ${
                isAgentRoute ? "text-primary gold-glow" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              AGENTES
              <ChevronDown className={`w-3 h-3 transition-transform ${agentsOpen ? "rotate-180" : ""}`} />
            </button>

            {agentsOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border/60 shadow-xl z-50">
                <div className="absolute inset-0 carbon-grid opacity-30 pointer-events-none" />
                {AGENTS.map(({ href, label, icon: Icon, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setAgentsOpen(false)}
                    className={`relative flex items-start gap-3 px-4 py-3 hover:bg-primary/5 border-b border-border/40 last:border-0 transition-colors group ${
                      location.startsWith(href) ? "bg-primary/5" : ""
                    }`}
                  >
                    <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 group-hover:gold-glow" />
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">{label}</p>
                      <p className="font-sans text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/history"
            className={`flex items-center gap-2 transition-all uppercase tracking-wider ${
              location === "/history" ? "text-primary gold-glow" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 transition-all uppercase tracking-wider ${
              location === "/dashboard" ? "text-primary gold-glow" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileOpen((o) => !o)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {AGENTS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${location.startsWith(href) ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
            <div className="border-t border-border/40 mt-2 pt-2 space-y-1">
              <Link href="/history" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${location === "/history" ? "text-primary" : "text-muted-foreground"}`}>
                <History className="w-4 h-4" />History
              </Link>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${location === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}>
                <BarChart3 className="w-4 h-4" />Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

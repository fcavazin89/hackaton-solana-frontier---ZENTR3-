import {
  Search,
  Coins,
  ShieldCheck,
  Cpu,
  Rocket,
  Hammer,
  Code2,
  FileText,
  LayoutDashboard,
  Users,
  Target,
  FastForward,
  Briefcase,
  UserCheck,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  Binary,
  Activity,
  Layers,
  Fingerprint,
  Megaphone,
} from "lucide-react";

export type AgentStatus = 'ONLINE' | 'OFFLINE';

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: any; // LucideIcon
  color: string;
  status: AgentStatus;
  systemPrompt?: string;
  permissions?: string[];
}

export const AGENTS: Agent[] = [
  { id: '1', name: 'Research Market', role: 'RESEARCHER', description: 'Trend Analysis & Dune Queries', icon: Search, color: 'emerald', status: 'ONLINE' },
  { id: '2', name: 'Tokenomics Design', role: 'TOKENOMICS', description: 'Sustainability & Vesting', icon: Coins, color: 'amber', status: 'ONLINE' },
  { id: '3', name: 'Legal/Compliance', role: 'COMPLIANCE', description: 'ERC-8004 Verification', icon: ShieldCheck, color: 'rose', status: 'OFFLINE' },
  { id: '4', name: 'Techno-Architect', role: 'ARCHITECT', description: 'Services & Blockchain Docs', icon: Cpu, color: 'cyan', status: 'ONLINE' },
  { id: '5', name: 'GTM Strategist', role: 'GTM', description: 'Marketing & Growth Hacking', icon: Rocket, color: 'violet', status: 'ONLINE' },
  { id: '6', name: 'Contract Forge', role: 'FORGE', description: 'Protocol Synthesis & Verification', icon: Hammer, color: 'orange', status: 'ONLINE' },
  { id: '6s', name: 'Solana Forge', role: 'SOLANA_FORGE', description: 'Anchor/Rust Program Synthesis', icon: Code2, color: 'cyan', status: 'ONLINE' },
  { id: '6a', name: 'Solana Auditor', role: 'SOLANA_AUDITOR', description: 'Rust/Anchor Security Audit', icon: ShieldCheck, color: 'emerald', status: 'ONLINE' },
  { id: '7', name: 'Strategy Architect', role: 'BLUEPRINT', description: 'Protocols, Docs & Diagrams', icon: FileText, color: 'blue', status: 'ONLINE' },
  { id: '8', name: 'STACK3 ERP', role: 'ERP', description: 'Strategic Planning & Operations', icon: LayoutDashboard, color: 'indigo', status: 'ONLINE' },
  { id: '9', name: 'CRM & Marketing', role: 'CRM', description: 'Sales, Creatives & Advertising', icon: Users, color: 'pink', status: 'ONLINE' },
  { id: '10', name: 'Web3 PM', role: 'PM', description: 'Product Strategy & Web3 Roadmap', icon: Target, color: 'emerald', status: 'ONLINE' },
  { id: '11', name: 'Scrum Master', role: 'SCRUM', description: 'Agile Ops & Team Velocity', icon: FastForward, color: 'orange', status: 'ONLINE' },
  { id: '12', name: 'Product Owner', role: 'PO', description: 'Value Maximization & Backlog', icon: Briefcase, color: 'yellow', status: 'ONLINE' },
  { id: 'audit', name: 'Project Auditor', role: 'PROJECT_AUDITOR', description: 'Protocol Audit & Sign-off', icon: UserCheck, color: 'emerald', status: 'ONLINE' },
  { id: '13', name: 'Token Analyst', role: 'ANALYST', description: 'Viability, ROI & Risk Assessment', icon: TrendingUp, color: 'cyan', status: 'ONLINE' },
  { id: '14', name: 'Risk Architect', role: 'RISK', description: 'ECDM & Systemic Mitigation', icon: ShieldAlert, color: 'rose', status: 'ONLINE' },
  { id: '15', name: 'Utility Validator', role: 'POV', description: 'PoV Consensus & Utility Flows', icon: CheckCircle, color: 'blue', status: 'OFFLINE' },
  { id: '16', name: 'Ontology Architect', role: 'OVP', description: 'Programmable Value Ontology', icon: Binary, color: 'purple', status: 'ONLINE' },
  { id: '17', name: 'Stress Tester', role: 'STRESS_TESTER', description: 'Protocol Resilience Testing', icon: Activity, color: 'red', status: 'ONLINE' },
  { id: '18', name: 'Meta Architect', role: 'META_ARCHITECT', description: 'Meta-Protocol Design', icon: Layers, color: 'indigo', status: 'ONLINE' },
  { id: '19', name: 'Sovereign AA', role: 'SOVEREIGN_AA', description: 'ERC-4337 Account Abstraction', icon: Fingerprint, color: 'violet', status: 'ONLINE' },
  { id: '20', name: 'Social Media', role: 'SOCIAL_MEDIA', description: 'Web3 Community Growth', icon: Megaphone, color: 'pink', status: 'ONLINE' },
  { id: '21', name: 'Investor Relations', role: 'INVESTOR_RELATIONS', description: 'Pitch Decks & IR Strategy', icon: TrendingUp, color: 'gold', status: 'ONLINE' },
];

export const getAgentColorClass = (color: string) => {
  const map: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/50 hover:border-emerald-400 shadow-emerald-500/20',
    amber: 'text-amber-400 border-amber-500/50 hover:border-amber-400 shadow-amber-500/20',
    rose: 'text-rose-400 border-rose-500/50 hover:border-rose-400 shadow-rose-500/20',
    cyan: 'text-cyan-400 border-cyan-500/50 hover:border-cyan-400 shadow-cyan-500/20',
    violet: 'text-violet-400 border-violet-500/50 hover:border-violet-400 shadow-violet-500/20',
    orange: 'text-orange-400 border-orange-500/50 hover:border-orange-400 shadow-orange-500/20',
    blue: 'text-blue-400 border-blue-500/50 hover:border-blue-400 shadow-blue-500/20',
    indigo: 'text-indigo-400 border-indigo-500/50 hover:border-indigo-400 shadow-indigo-500/20',
    pink: 'text-pink-400 border-pink-500/50 hover:border-pink-400 shadow-pink-500/20',
    gold: 'text-yellow-500 border-yellow-500/50 hover:border-yellow-500 shadow-yellow-500/20',
    red: 'text-red-500 border-red-500/50 hover:border-red-500 shadow-red-500/20',
    purple: 'text-purple-400 border-purple-500/50 hover:border-purple-400 shadow-purple-500/20',
  };
  return map[color] || 'text-primary border-primary/50 hover:border-primary shadow-primary/20';
};

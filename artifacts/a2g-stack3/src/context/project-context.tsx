import { createContext, useContext, useState, ReactNode } from "react";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  progress: number;
  assignedTo: string;
}

export interface BusinessPlanData {
  projectName: string;
  description: string;
  research: string;
  tokenomics: string;
  architecture: string;
  gtm: string;
  compliance: string;
}

export type ActivationState = 'idle' | 'ready' | 'activating' | 'active';

export interface AgentOutput {
  agentId: string;
  content: string;
  status: 'pending' | 'generating' | 'done' | 'error';
}

interface ProjectContextType {
  businessPlan: BusinessPlanData | null;
  setBusinessPlan: (plan: BusinessPlanData) => void;
  agentOutputs: Record<string, AgentOutput>;
  setAgentOutput: (agentId: string, output: AgentOutput) => void;
  tasks: ProjectTask[];
  setTasks: (tasks: ProjectTask[]) => void;
  activationState: ActivationState;
  setActivationState: (state: ActivationState) => void;
  resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function createTasksFromPlan(plan: BusinessPlanData): ProjectTask[] {
  return [
    { id: 't1', title: `Market Research — ${plan.projectName}`, description: 'Competitor analysis & DeFi trend mapping complete.', status: 'COMPLETED', priority: 'HIGH', progress: 100, assignedTo: '1' },
    { id: 't2', title: 'Token Distribution Model', description: 'Finalize vesting schedule, allocation & emission curve.', status: 'IN_PROGRESS', priority: 'HIGH', progress: 70, assignedTo: '2' },
    { id: 't3', title: 'Smart Contract Architecture', description: 'Design, document & specify core protocol contracts.', status: 'IN_PROGRESS', priority: 'HIGH', progress: 45, assignedTo: '4' },
    { id: 't4', title: 'Legal & Compliance Review', description: 'Jurisdictional analysis, ERC-8004 & regulatory mapping.', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: '3' },
    { id: 't5', title: 'GTM Campaign Strategy', description: 'Multi-channel launch plan, KOL outreach & community growth.', status: 'PENDING', priority: 'MEDIUM', progress: 0, assignedTo: '5' },
    { id: 't6', title: 'Testnet Contract Deployment', description: 'Deploy, test & verify all protocol contracts on testnet.', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: '6' },
    { id: 't7', title: 'Full Security Audit', description: 'Third-party audit of smart contracts & protocol logic.', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: 'audit' },
    { id: 't8', title: 'Investor Pitch Deck & IR Strategy', description: 'Prepare materials for seed/Series A fundraise.', status: 'PENDING', priority: 'MEDIUM', progress: 0, assignedTo: '21' },
    { id: 't9', title: 'Protocol Stress Test', description: 'Simulate edge cases, flash loan attacks & extreme market conditions.', status: 'PENDING', priority: 'MEDIUM', progress: 0, assignedTo: '17' },
    { id: 't10', title: 'Community & Social Launch', description: 'Discord, Twitter, Telegram community setup & launch campaign.', status: 'PENDING', priority: 'LOW', progress: 0, assignedTo: '20' },
  ];
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [businessPlan, setBusinessPlanState] = useState<BusinessPlanData | null>(null);
  const [agentOutputs, setAgentOutputsState] = useState<Record<string, AgentOutput>>({});
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [activationState, setActivationState] = useState<ActivationState>('idle');

  const setBusinessPlan = (plan: BusinessPlanData) => {
    setBusinessPlanState(plan);
  };

  const setAgentOutput = (agentId: string, output: AgentOutput) => {
    setAgentOutputsState(prev => ({ ...prev, [agentId]: output }));
  };

  const resetProject = () => {
    setBusinessPlanState(null);
    setAgentOutputsState({});
    setTasks([]);
    setActivationState('idle');
  };

  return (
    <ProjectContext.Provider value={{
      businessPlan, setBusinessPlan,
      agentOutputs, setAgentOutput,
      tasks, setTasks,
      activationState, setActivationState,
      resetProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

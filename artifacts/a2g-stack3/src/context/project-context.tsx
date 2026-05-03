import { createContext, useContext, useState, ReactNode } from "react";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  progress: number;
  assignedTo: string;
  storyPoints?: number;
  sprint?: number;
  type?: 'STORY' | 'BUG' | 'EPIC' | 'TASK' | 'SPIKE';
  epicId?: string;
  acceptanceCriteria?: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
}

export interface RoadmapPhase {
  id: string;
  name: string;
  phase: 'DISCOVERY' | 'DESIGN' | 'ARCHITECTURE' | 'DEVELOPMENT' | 'TESTING' | 'LAUNCH';
  startWeek: number;
  durationWeeks: number;
  storyPoints: number;
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED';
  milestone?: string;
  agentIds: string[];
  deliverables: string[];
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
  active?: boolean;
}

interface ProjectContextType {
  businessPlan: BusinessPlanData | null;
  setBusinessPlan: (plan: BusinessPlanData) => void;
  agentOutputs: Record<string, AgentOutput>;
  setAgentOutput: (agentId: string, output: AgentOutput) => void;
  setAgentActive: (agentId: string, active: boolean) => void;
  tasks: ProjectTask[];
  setTasks: (tasks: ProjectTask[]) => void;
  sprints: Sprint[];
  setSprints: (sprints: Sprint[]) => void;
  roadmapPhases: RoadmapPhase[];
  setRoadmapPhases: (phases: RoadmapPhase[]) => void;
  activationState: ActivationState;
  setActivationState: (state: ActivationState) => void;
  resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function createTasksFromPlan(plan: BusinessPlanData): ProjectTask[] {
  return [
    { id: 't1', title: `Market Research — ${plan.projectName}`, description: 'Competitor analysis & DeFi trend mapping complete.', status: 'COMPLETED', priority: 'HIGH', progress: 100, assignedTo: '1', storyPoints: 5, sprint: 1, type: 'STORY', acceptanceCriteria: 'Competitor matrix with top 5 protocols documented.' },
    { id: 't2', title: 'Token Distribution Model', description: 'Finalize vesting schedule, allocation & emission curve.', status: 'IN_PROGRESS', priority: 'HIGH', progress: 70, assignedTo: '2', storyPoints: 8, sprint: 1, type: 'STORY', acceptanceCriteria: 'Vesting schedule approved and documented.' },
    { id: 't3', title: 'Smart Contract Architecture', description: 'Design, document & specify core protocol contracts.', status: 'IN_PROGRESS', priority: 'HIGH', progress: 45, assignedTo: '4', storyPoints: 13, sprint: 1, type: 'EPIC', acceptanceCriteria: 'Contract specs reviewed by Security team.' },
    { id: 't4', title: 'Legal & Compliance Review', description: 'Jurisdictional analysis, ERC-8004 & regulatory mapping.', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: '3', storyPoints: 8, sprint: 2, type: 'STORY', acceptanceCriteria: 'Legal memo covering top 3 jurisdictions.' },
    { id: 't5', title: 'GTM Campaign Strategy', description: 'Multi-channel launch plan, KOL outreach & community growth.', status: 'PENDING', priority: 'MEDIUM', progress: 0, assignedTo: '5', storyPoints: 5, sprint: 2, type: 'STORY', acceptanceCriteria: 'GTM plan with 90-day calendar.' },
    { id: 't6', title: 'Testnet Contract Deployment', description: 'Deploy, test & verify all protocol contracts on testnet.', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: '6', storyPoints: 13, sprint: 2, type: 'STORY', acceptanceCriteria: 'All contracts deployed and passing integration tests.' },
    { id: 't7', title: 'Full Security Audit', description: 'Third-party audit of smart contracts & protocol logic.', status: 'PENDING', priority: 'HIGH', progress: 0, assignedTo: 'audit', storyPoints: 21, sprint: 3, type: 'EPIC', acceptanceCriteria: 'Audit report with zero critical findings.' },
    { id: 't8', title: 'Investor Pitch Deck & IR Strategy', description: 'Prepare materials for seed/Series A fundraise.', status: 'PENDING', priority: 'MEDIUM', progress: 0, assignedTo: '21', storyPoints: 5, sprint: 2, type: 'STORY', acceptanceCriteria: 'Deck reviewed and approved by founders.' },
    { id: 't9', title: 'Protocol Stress Test', description: 'Simulate edge cases, flash loan attacks & extreme market conditions.', status: 'PENDING', priority: 'MEDIUM', progress: 0, assignedTo: '17', storyPoints: 8, sprint: 3, type: 'SPIKE', acceptanceCriteria: 'Stress test report with resilience score ≥ 85.' },
    { id: 't10', title: 'Community & Social Launch', description: 'Discord, Twitter, Telegram community setup & launch campaign.', status: 'PENDING', priority: 'LOW', progress: 0, assignedTo: '20', storyPoints: 3, sprint: 3, type: 'TASK', acceptanceCriteria: 'Community channels live with 500+ members.' },
  ];
}

export function createSprintsFromPlan(plan: BusinessPlanData): Sprint[] {
  const now = new Date();
  const w = (weeks: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: 1, name: 'Sprint 1 — Foundation', goal: `Establish ${plan.projectName} research, tokenomics baseline and architecture blueprint`, startDate: w(0), endDate: w(2), capacity: 26, status: 'ACTIVE' },
    { id: 2, name: 'Sprint 2 — Build', goal: 'Legal compliance, smart contract deployment on testnet and GTM strategy', startDate: w(2), endDate: w(4), capacity: 31, status: 'PLANNING' },
    { id: 3, name: 'Sprint 3 — Validate', goal: 'Security audit, stress testing and community launch', startDate: w(4), endDate: w(6), capacity: 32, status: 'PLANNING' },
  ];
}

export function createRoadmapFromPlan(plan: BusinessPlanData): RoadmapPhase[] {
  return [
    { id: 'ph1', name: 'Discovery', phase: 'DISCOVERY', startWeek: 0, durationWeeks: 2, storyPoints: 13, status: 'DONE', milestone: 'Market Validated', agentIds: ['1', '10', '12'], deliverables: ['Competitor matrix', 'User personas', 'Problem statement'] },
    { id: 'ph2', name: 'Design & Architecture', phase: 'DESIGN', startWeek: 1, durationWeeks: 3, storyPoints: 21, status: 'IN_PROGRESS', milestone: 'Design Approved', agentIds: ['4', '7', '12', '11'], deliverables: ['System design doc', 'Tokenomics v1', 'Wireframes'] },
    { id: 'ph3', name: 'Smart Contract Dev', phase: 'ARCHITECTURE', startWeek: 3, durationWeeks: 4, storyPoints: 34, status: 'IN_PROGRESS', milestone: 'Contracts Deployed', agentIds: ['6', '4', '3', '11'], deliverables: ['Core contracts', 'ERC-20 token', 'Vesting contract'] },
    { id: 'ph4', name: 'Backend & APIs', phase: 'DEVELOPMENT', startWeek: 4, durationWeeks: 4, storyPoints: 34, status: 'PLANNED', milestone: 'API Live', agentIds: ['4', '7', '10', '11'], deliverables: ['REST API', 'Indexer', 'SDK'] },
    { id: 'ph5', name: 'Security & Testing', phase: 'TESTING', startWeek: 7, durationWeeks: 3, storyPoints: 21, status: 'PLANNED', milestone: 'Audit Passed', agentIds: ['audit', '14', '17'], deliverables: ['Audit report', 'Pentest results', 'QA sign-off'] },
    { id: 'ph6', name: 'Launch & Growth', phase: 'LAUNCH', startWeek: 9, durationWeeks: 3, storyPoints: 13, status: 'PLANNED', milestone: `${plan.projectName} Mainnet`, agentIds: ['5', '9', '20', '21'], deliverables: ['Mainnet deploy', 'Token launch', 'Community live'] },
  ];
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [businessPlan, setBusinessPlanState] = useState<BusinessPlanData | null>(null);
  const [agentOutputs, setAgentOutputsState] = useState<Record<string, AgentOutput>>({});
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [roadmapPhases, setRoadmapPhases] = useState<RoadmapPhase[]>([]);
  const [activationState, setActivationState] = useState<ActivationState>('idle');

  const setBusinessPlan = (plan: BusinessPlanData) => {
    setBusinessPlanState(plan);
  };

  const setAgentOutput = (agentId: string, output: AgentOutput) => {
    setAgentOutputsState(prev => ({ ...prev, [agentId]: output }));
  };

  const setAgentActive = (agentId: string, active: boolean) => {
    setAgentOutputsState(prev => ({
      ...prev,
      [agentId]: {
        agentId,
        content: prev[agentId]?.content || "",
        status: prev[agentId]?.status || "pending",
        active,
      },
    }));
  };

  const resetProject = () => {
    setBusinessPlanState(null);
    setAgentOutputsState({});
    setTasks([]);
    setSprints([]);
    setRoadmapPhases([]);
    setActivationState('idle');
  };

  return (
    <ProjectContext.Provider value={{
      businessPlan, setBusinessPlan,
      agentOutputs, setAgentOutput,
      setAgentActive,
      tasks, setTasks,
      sprints, setSprints,
      roadmapPhases, setRoadmapPhases,
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

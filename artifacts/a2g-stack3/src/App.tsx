import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import AgentChat from "@/pages/agent-chat";
import BusinessPlan from "@/pages/business-plan";
import TaskBoard from "@/pages/task-board";
import ProtocolSim from "@/pages/protocol-simulator";
import { ProjectProvider } from "@/context/project-context";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/agent/:id" component={AgentChat} />
        <Route path="/plan" component={BusinessPlan} />
        <Route path="/tasks" component={TaskBoard} />
        <Route path="/protocol" component={ProtocolSim} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProjectProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ProjectProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

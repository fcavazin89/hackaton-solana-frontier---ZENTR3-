import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DaosList from "@/pages/daos";
import DaoDetail from "@/pages/daos/detail";
import MembersList from "@/pages/daos/members";
import NewProposal from "@/pages/daos/proposals/new";
import ProposalDetail from "@/pages/daos/proposals/detail";
import Advisor from "@/pages/advisor";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/advisor" component={Advisor} />
      <Route path="/daos" component={DaosList} />
      <Route path="/daos/:id" component={DaoDetail} />
      <Route path="/daos/:id/members" component={MembersList} />
      <Route path="/daos/:id/proposals/new" component={NewProposal} />
      <Route path="/daos/:id/proposals/:proposalId" component={ProposalDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout";
import Home from "@/pages/home";
import AgentDetail from "@/pages/agent-detail";
import ChatInterface from "@/pages/chat-interface";
import ConversationsList from "@/pages/conversations";
import Web3Hub from "@/pages/web3-hub";
import ContractForge from "@/pages/contract-forge";
import SmartAccount from "@/pages/smart-account";
import Networks from "@/pages/networks";
import AuditStudio from "@/pages/audit-studio";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/agent/:agentId" component={AgentDetail} />
        <Route path="/chat/:conversationId" component={ChatInterface} />
        <Route path="/conversations" component={ConversationsList} />
        <Route path="/web3" component={Web3Hub} />
        <Route path="/web3/forge" component={ContractForge} />
        <Route path="/web3/identity" component={SmartAccount} />
        <Route path="/web3/networks" component={Networks} />
        <Route path="/web3/audit" component={AuditStudio} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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

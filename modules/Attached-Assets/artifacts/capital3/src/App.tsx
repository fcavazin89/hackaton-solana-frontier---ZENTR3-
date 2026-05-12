import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/navbar";

import Home from "@/pages/home";
import Analyze from "@/pages/analyze";
import Result from "@/pages/result";
import History from "@/pages/history";
import Dashboard from "@/pages/dashboard";
import MvpForm from "@/pages/mvp-form";
import MvpResult from "@/pages/mvp-result";
import BizModelForm from "@/pages/bizmodel-form";
import BizModelResult from "@/pages/bizmodel-result";
import PitchForm from "@/pages/pitch-form";
import PitchResult from "@/pages/pitch-result";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/results/:id" component={Result} />
        <Route path="/history" component={History} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/mvp" component={MvpForm} />
        <Route path="/mvp/results/:id" component={MvpResult} />
        <Route path="/bizmodel" component={BizModelForm} />
        <Route path="/bizmodel/results/:id" component={BizModelResult} />
        <Route path="/pitch" component={PitchForm} />
        <Route path="/pitch/results/:id" component={PitchResult} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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

import { useState } from "react";
import { useListDeployments, useCreateDeployment, useDeleteDeployment, getListDeploymentsQueryKey, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Rocket, Plus, Trash2, Box, Activity, AlertTriangle, CheckCircle2, Loader2, Copy } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const createDeploymentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  network: z.string().min(1, "Network is required"),
  contractAddress: z.string().optional(),
  txHash: z.string().optional()
});

type CreateDeploymentFormValues = z.infer<typeof createDeploymentSchema>;

export default function Deployments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: deployments, isLoading } = useListDeployments();
  const createDeployment = useCreateDeployment();
  const deleteDeployment = useDeleteDeployment();

  const form = useForm<CreateDeploymentFormValues>({
    resolver: zodResolver(createDeploymentSchema),
    defaultValues: {
      name: "",
      network: "ethereum",
      contractAddress: "",
      txHash: ""
    }
  });

  const onSubmit = (data: CreateDeploymentFormValues) => {
    createDeployment.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Deployment Initialized", description: "Contract propagation sequence started." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to initialize deployment.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteDeployment.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey() });
        toast({ title: "Deployment Record Purged", description: `Record ${id} has been removed.` });
      }
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Clipboard", description: `${type} copied: ${text.substring(0, 10)}...` });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono text-[10px] uppercase">PENDING</Badge>;
      case "deploying": return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px] uppercase"><Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> DEPLOYING</Badge>;
      case "success": return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono text-[10px] uppercase"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> SUCCESS</Badge>;
      case "failed": return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono text-[10px] uppercase"><AlertTriangle className="w-3 h-3 mr-1 inline" /> FAILED</Badge>;
      default: return <Badge variant="outline" className="bg-muted text-muted-foreground font-mono text-[10px] uppercase">UNKNOWN</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase border-b border-primary/30 pb-2 inline-block">Deploys</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">On-chain propagation — from scrap to protocol</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-mono uppercase tracking-wider">
              <Plus className="h-4 w-4" /> New Deployment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest text-primary font-mono border-b border-primary/20 pb-2">Register Deployment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Contract Name</FormLabel>
                      <FormControl>
                        <Input className="bg-background border-border focus-visible:ring-primary" placeholder="e.g. ScripToken" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Network</FormLabel>
                      <FormControl>
                        <Input className="bg-background border-border focus-visible:ring-primary font-mono" placeholder="e.g. ethereum, base-sepolia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Contract Address (Optional)</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border focus-visible:ring-primary font-mono text-xs" placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="txHash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-mono text-xs uppercase">TX Hash (Optional)</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border focus-visible:ring-primary font-mono text-xs" placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-4" disabled={createDeployment.isPending}>
                  {createDeployment.isPending ? "Processing..." : "Register Deployment"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse h-40" />
          ))}
        </div>
      ) : deployments?.length === 0 ? (
        <Card className="bg-card border-dashed border-border py-16 flex flex-col items-center justify-center">
          <Rocket className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground uppercase tracking-widest font-mono">No Deployments</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">No active or historical contract deployments found in the registry.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deployments?.map((deployment) => (
            <Card key={deployment.id} className="bg-card border-border overflow-hidden group">
              <div className="md:flex items-stretch">
                <div className="p-4 md:p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-border bg-background/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        {deployment.name}
                      </h3>
                      {getStatusDisplay(deployment.status)}
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase bg-card border-border text-muted-foreground mb-4">
                      NET: {deployment.network}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground font-mono">
                      INIT: {format(new Date(deployment.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(deployment.id)}
                      disabled={deleteDeployment.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 md:w-2/3 space-y-4 flex flex-col justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider flex items-center justify-between">
                        Contract Address
                        {deployment.contractAddress && (
                          <button onClick={() => copyToClipboard(deployment.contractAddress!, "Contract Address")} className="text-primary hover:text-primary/70">
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </p>
                      <div className="bg-background border border-border rounded p-2 text-xs font-mono text-foreground/80 break-all h-8 flex items-center">
                        {deployment.contractAddress || <span className="text-muted-foreground/50 italic">AWAITING_DEPLOYMENT</span>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider flex items-center justify-between">
                        Transaction Hash
                        {deployment.txHash && (
                          <button onClick={() => copyToClipboard(deployment.txHash!, "TX Hash")} className="text-primary hover:text-primary/70">
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </p>
                      <div className="bg-background border border-border rounded p-2 text-xs font-mono text-foreground/80 break-all h-8 flex items-center">
                        {deployment.txHash || <span className="text-muted-foreground/50 italic">AWAITING_BROADCAST</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Gas Used</p>
                      <p className="text-sm font-mono mt-1 text-foreground/90">
                        {deployment.gasUsed ? <span className="text-primary">{deployment.gasUsed}</span> : <span className="text-muted-foreground/50">--</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Confirmed At</p>
                      <p className="text-sm font-mono mt-1 text-foreground/90">
                        {deployment.deployedAt ? format(new Date(deployment.deployedAt), "HH:mm:ss.SSS") : <span className="text-muted-foreground/50">--</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useListIntegrations, useCreateIntegration, useDeleteIntegration, useUpdateIntegration, getListIntegrationsQueryKey, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Network, Plus, Trash2, Power, PowerOff, Database, Wallet, Globe, Key, Settings, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const createIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["rpc_provider", "wallet", "oracle", "storage", "indexer", "bridge", "dex", "other"]),
  network: z.string().optional(),
  endpoint: z.string().optional()
});

type CreateIntegrationFormValues = z.infer<typeof createIntegrationSchema>;

export default function Integrations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: integrations, isLoading } = useListIntegrations();
  const createIntegration = useCreateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const updateIntegration = useUpdateIntegration();

  const form = useForm<CreateIntegrationFormValues>({
    resolver: zodResolver(createIntegrationSchema),
    defaultValues: {
      name: "",
      type: "rpc_provider",
      network: "",
      endpoint: ""
    }
  });

  const onSubmit = (data: CreateIntegrationFormValues) => {
    createIntegration.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Integration Configured", description: "Service connected to execution matrix." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to configure integration.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteIntegration.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Integration Removed", description: `Service connection ${id} severed.` });
      }
    });
  };

  const toggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    updateIntegration.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Status Updated", description: `Service ${id} is now ${newStatus.toUpperCase()}.` });
      }
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'rpc_provider': return <Database className="h-5 w-5 text-primary" />;
      case 'wallet': return <Wallet className="h-5 w-5 text-blue-400" />;
      case 'oracle': return <Globe className="h-5 w-5 text-green-400" />;
      case 'storage': return <Database className="h-5 w-5 text-yellow-400" />;
      case 'indexer': return <Network className="h-5 w-5 text-purple-400" />;
      default: return <Settings className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase border-b border-primary/30 pb-2 inline-block">Integrations</h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm">External service routing — infrastructure layer</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-mono uppercase tracking-wider">
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest text-primary font-mono border-b border-primary/20 pb-2">Configure Integration</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Service Name</FormLabel>
                      <FormControl>
                        <Input className="bg-background border-border focus-visible:ring-primary" placeholder="e.g. Alchemy Mainnet RPC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Integration Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rpc_provider">RPC Provider</SelectItem>
                          <SelectItem value="wallet">Wallet / Signer</SelectItem>
                          <SelectItem value="oracle">Oracle</SelectItem>
                          <SelectItem value="storage">Decentralized Storage</SelectItem>
                          <SelectItem value="indexer">Indexer</SelectItem>
                          <SelectItem value="bridge">Bridge</SelectItem>
                          <SelectItem value="dex">DEX / Liquidity</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Network (Optional)</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border focus-visible:ring-primary font-mono" placeholder="e.g. ethereum" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-mono text-xs uppercase">Endpoint / URL (Optional)</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border focus-visible:ring-primary font-mono" placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-4" disabled={createIntegration.isPending}>
                  {createIntegration.isPending ? "Connecting..." : "Initialize Connection"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse h-48" />
          ))}
        </div>
      ) : integrations?.length === 0 ? (
        <Card className="bg-card border-dashed border-border py-16 flex flex-col items-center justify-center">
          <Network className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground uppercase tracking-widest font-mono">No Integrations</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">Execution matrix lacks external service connections.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations?.map((integration) => (
            <Card key={integration.id} className={`bg-card border-border overflow-hidden transition-all duration-300 relative ${integration.status === 'active' ? 'border-primary/30 shadow-[0_0_15px_rgba(0,255,255,0.05)]' : 'opacity-70 grayscale-[50%]'}`}>
              {integration.status === 'active' && (
                <div className="absolute top-0 right-0 p-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
              )}
              <CardHeader className="pb-4 border-b border-border bg-background/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-background border border-border">
                    {getIconForType(integration.type)}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold line-clamp-1" title={integration.name}>{integration.name}</CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase bg-background border-border text-muted-foreground">
                      TYPE:{integration.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-2 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Network</p>
                  <p className="text-sm font-mono text-foreground">{integration.network || "--"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider">Endpoint</p>
                  <p className="text-sm font-mono text-foreground truncate" title={integration.endpoint || "Not configured"}>
                    {integration.endpoint ? integration.endpoint.replace(/^https?:\/\//, '') : "--"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex items-center justify-between border-t border-border bg-background/30 mt-auto">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2 font-mono text-[10px] uppercase tracking-wider ${
                      integration.status === 'active' 
                        ? 'border-primary/50 text-primary hover:bg-primary/10' 
                        : 'border-muted text-muted-foreground hover:bg-muted/20'
                    }`}
                    onClick={() => toggleStatus(integration.id, integration.status)}
                    disabled={updateIntegration.isPending}
                  >
                    {integration.status === 'active' ? (
                      <><Power className="w-3 h-3 mr-1" /> ACTIVE</>
                    ) : (
                      <><PowerOff className="w-3 h-3 mr-1" /> INACTIVE</>
                    )}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(integration.id)}
                  disabled={deleteIntegration.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

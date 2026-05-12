import { useState } from "react";
import { useListDaos, getListDaosQueryKey, useCreateDao } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Users, FileText, ArrowRight, Box, LayoutGrid, Lock, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const MODEL_COLORS: Record<string, string> = {
  "token-based": "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "reputation-based": "text-teal-500 bg-teal-500/10 border-teal-500/20",
  "multisig": "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "hybrid": "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

const MODEL_LABELS: Record<string, string> = {
  "token-based": "Token",
  "reputation-based": "Reputation",
  "multisig": "Multi-Sig",
  "hybrid": "Hybrid",
};

const createDaoSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().min(10, "Description must be at least 10 characters"),
  mission: z.string().min(10, "Mission must be at least 10 characters"),
  tokenSymbol: z.string().min(2, "Symbol must be at least 2 characters").max(10).toUpperCase(),
  totalSupply: z.coerce.number().min(1, "Total supply must be greater than 0"),
});

type CreateDaoFormValues = z.infer<typeof createDaoSchema>;

export default function DaosList() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: daos, isLoading } = useListDaos({
    query: { queryKey: getListDaosQueryKey() }
  });

  const createDaoMutation = useCreateDao();

  const form = useForm<CreateDaoFormValues>({
    resolver: zodResolver(createDaoSchema),
    defaultValues: {
      name: "",
      description: "",
      mission: "",
      tokenSymbol: "",
      totalSupply: 1000000,
    },
  });

  const onSubmit = async (data: CreateDaoFormValues) => {
    try {
      await createDaoMutation.mutateAsync({
        data: {
          ...data,
          status: "active"
        }
      });
      
      queryClient.invalidateQueries({ queryKey: getListDaosQueryKey() });
      toast({
        title: "DAO Created",
        description: `${data.name} has been successfully created.`,
      });
      setIsCreateOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create DAO.",
        variant: "destructive"
      });
    }
  };

  const filteredDaos = daos?.filter(dao => 
    dao.name.toLowerCase().includes(search.toLowerCase()) || 
    dao.tokenSymbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Organizations</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">Directory of all decentralized organizations</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono">
                <Plus className="mr-2 h-4 w-4" /> Create DAO
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-sans text-xl">Initialize New Organization</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  Deploy a new DAO with its governance token.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corp DAO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the organization" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Statement</FormLabel>
                        <FormControl>
                          <Input placeholder="The core mission or thesis" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tokenSymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="ACME" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalSupply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Supply</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1000000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createDaoMutation.isPending}>
                      {createDaoMutation.isPending ? "Deploying..." : "Deploy DAO"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search DAOs by name or symbol..."
            className="pl-9 font-mono text-sm bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col h-full">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="flex-1 mt-auto">
                  <div className="flex gap-4 mt-6">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDaos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed bg-muted/20">
            <Box className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No DAOs found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 font-mono text-center max-w-sm">
              No organizations matched your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDaos.map((dao) => (
              <Card key={dao.id} className="flex flex-col hover:border-primary/50 transition-colors group">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{dao.name}</CardTitle>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                        ${dao.tokenSymbol}
                      </span>
                      {dao.governanceModel && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${MODEL_COLORS[dao.governanceModel] ?? "text-muted-foreground bg-muted/30 border-border"}`}>
                          {MODEL_LABELS[dao.governanceModel] ?? dao.governanceModel}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2 h-10 text-sm">
                    {dao.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{dao.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>{dao.proposalCount} proposals</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t pt-4">
                    <span className="text-xs text-muted-foreground font-mono">
                      Created {format(new Date(dao.createdAt), "MMM d, yyyy")}
                    </span>
                    <Link href={`/daos/${dao.id}`}>
                      <Button variant="ghost" size="sm" className="font-mono text-xs gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Enter <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

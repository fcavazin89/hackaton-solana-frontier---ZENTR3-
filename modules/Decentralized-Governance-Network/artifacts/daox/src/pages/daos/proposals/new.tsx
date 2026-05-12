import { useRoute, useLocation } from "wouter";
import { useGetDao, getGetDaoQueryKey, useCreateProposal } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { addDays, formatISO } from "date-fns";

const createProposalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: z.enum(["governance", "treasury", "membership", "protocol", "other"]),
  quorum: z.coerce.number().min(1).max(100),
  creatorName: z.string().min(2, "Creator name is required"),
  votingStartsAt: z.string(),
  votingEndsAt: z.string(),
});

type CreateProposalFormValues = z.infer<typeof createProposalSchema>;

export default function NewProposal() {
  const [, params] = useRoute("/daos/:id/proposals/new");
  const daoId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: dao } = useGetDao(daoId, {
    query: { enabled: !!daoId, queryKey: getGetDaoQueryKey(daoId) }
  });

  const createProposalMutation = useCreateProposal();

  const now = new Date();
  const defaultEndsAt = addDays(now, 7);

  const form = useForm<CreateProposalFormValues>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "governance",
      quorum: 51,
      creatorName: "Current User",
      votingStartsAt: formatISO(now),
      votingEndsAt: formatISO(defaultEndsAt),
    },
  });

  const onSubmit = async (data: CreateProposalFormValues) => {
    try {
      const result = await createProposalMutation.mutateAsync({
        daoId,
        data
      });
      
      toast({
        title: "Proposal Created",
        description: "Your proposal is now active for voting.",
      });
      
      setLocation(`/daos/${daoId}/proposals/${result.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create proposal.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href={`/daos/${daoId}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-3">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to DAO
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Draft Proposal</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Submit a new proposal for {dao?.name || 'this organization'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
            <CardDescription>Provide clear, actionable details for voters to consider.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Allocate 50,000 USDC to Marketing Q3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposal Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="governance">Governance</SelectItem>
                            <SelectItem value="treasury">Treasury</SelectItem>
                            <SelectItem value="membership">Membership</SelectItem>
                            <SelectItem value="protocol">Protocol</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="quorum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quorum Required (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description & Rationale</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why this proposal is necessary and what it aims to achieve..." 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4 border-t">
                  <Button type="button" variant="outline" className="mr-4" onClick={() => setLocation(`/daos/${daoId}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProposalMutation.isPending}>
                    {createProposalMutation.isPending ? "Submitting..." : "Submit Proposal"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

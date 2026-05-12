import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetProposal, getGetProposalQueryKey,
  useGetProposalResults, getGetProposalResultsQueryKey,
  useCastVote,
  useGetDao, getGetDaoQueryKey
} from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ThumbsUp, ThumbsDown, MinusCircle, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ProposalDetail() {
  const [, params] = useRoute("/daos/:id/proposals/:proposalId");
  const daoId = parseInt(params?.id || "0", 10);
  const proposalId = parseInt(params?.proposalId || "0", 10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const { data: dao } = useGetDao(daoId, {
    query: { enabled: !!daoId, queryKey: getGetDaoQueryKey(daoId) }
  });

  const { data: proposal, isLoading: proposalLoading } = useGetProposal(daoId, proposalId, {
    query: { enabled: !!(daoId && proposalId), queryKey: getGetProposalQueryKey(daoId, proposalId) }
  });

  const { data: results, isLoading: resultsLoading } = useGetProposalResults(daoId, proposalId, {
    query: { enabled: !!(daoId && proposalId), queryKey: getGetProposalResultsQueryKey(daoId, proposalId) }
  });

  const castVoteMutation = useCastVote();

  const handleVote = async (choice: "for" | "against" | "abstain") => {
    setIsVoting(true);
    try {
      await castVoteMutation.mutateAsync({
        daoId,
        proposalId,
        data: {
          memberName: "Current User",
          choice,
          weight: 100 // Mocking weight for now
        }
      });
      
      queryClient.invalidateQueries({ queryKey: getGetProposalQueryKey(daoId, proposalId) });
      queryClient.invalidateQueries({ queryKey: getGetProposalResultsQueryKey(daoId, proposalId) });
      
      toast({
        title: "Vote Cast",
        description: `Successfully voted ${choice} on proposal.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cast vote.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (proposalLoading || resultsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-40" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!proposal || !results) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20">
          <h2 className="text-xl font-bold">Proposal not found</h2>
          <Link href={`/daos/${daoId}`}>
            <Button variant="link" className="mt-4">Return to DAO</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const chartData = [
    { name: "For", value: results.forVotes, color: "hsl(160, 80%, 40%)" },
    { name: "Against", value: results.againstVotes, color: "hsl(0, 84%, 60%)" },
    { name: "Abstain", value: results.abstainVotes, color: "hsl(220, 15%, 45%)" },
  ];

  const totalChartVotes = results.forVotes + results.againstVotes + results.abstainVotes || 1; // prevent div by zero

  const isActive = proposal.status === "active";

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href={`/daos/${daoId}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {dao?.name || 'DAO'}
          </Button>
        </Link>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`font-mono uppercase tracking-wider
              ${proposal.status === 'active' ? 'border-primary text-primary bg-primary/5' : 
                proposal.status === 'passed' ? 'border-green-500 text-green-500 bg-green-500/5' : 
                proposal.status === 'rejected' ? 'border-destructive text-destructive bg-destructive/5' : ''}`}>
              {proposal.status}
            </Badge>
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              {proposal.type}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{proposal.title}</h1>
          <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground mt-2">
            <span>By {proposal.creatorName}</span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {isActive 
                ? `Ends ${format(new Date(proposal.votingEndsAt), "MMM d, yyyy")}`
                : `Ended ${format(new Date(proposal.votingEndsAt), "MMM d, yyyy")}`
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-none bg-transparent">
              <div className="prose dark:prose-invert max-w-none text-foreground/90 font-sans leading-relaxed">
                {proposal.description.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Card>

            <Separator />
            
            <div>
              <h3 className="text-xl font-bold mb-6">Votes ({results.votes.length})</h3>
              {results.votes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-mono text-sm">No votes cast yet.</div>
              ) : (
                <div className="space-y-4">
                  {results.votes.map((vote) => (
                    <div key={vote.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                          {vote.memberName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium font-sans">{vote.memberName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-muted-foreground">{vote.weight.toLocaleString()} votes</span>
                        <Badge variant="outline" className={`w-24 justify-center capitalize font-mono
                          ${vote.choice === 'for' ? 'border-green-500 text-green-500' : 
                            vote.choice === 'against' ? 'border-destructive text-destructive' : ''}`}>
                          {vote.choice}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Voting Results</CardTitle>
                <CardDescription>
                  Quorum: {results.quorum}% • Reached: {results.quorumReached ? 'Yes' : 'No'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <XAxis type="number" hide domain={[0, totalChartVotes]} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} className="font-mono text-xs" width={60} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', fontFamily: 'var(--font-mono)' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#00cc88]"></div> For</span>
                    <span className="font-bold">{results.forVotes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-destructive"></div> Against</span>
                    <span className="font-bold">{results.againstVotes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-muted-foreground"></div> Abstain</span>
                    <span className="font-bold">{results.abstainVotes.toLocaleString()}</span>
                  </div>
                </div>

                {isActive && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <p className="text-sm font-medium mb-2">Cast your vote</p>
                      <Button 
                        className="w-full justify-start bg-green-500 hover:bg-green-600 text-white border-0" 
                        variant="outline"
                        onClick={() => handleVote("for")}
                        disabled={isVoting || castVoteMutation.isPending}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" /> Vote For
                      </Button>
                      <Button 
                        className="w-full justify-start bg-destructive hover:bg-destructive/90 text-white border-0" 
                        variant="outline"
                        onClick={() => handleVote("against")}
                        disabled={isVoting || castVoteMutation.isPending}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" /> Vote Against
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => handleVote("abstain")}
                        disabled={isVoting || castVoteMutation.isPending}
                      >
                        <MinusCircle className="mr-2 h-4 w-4" /> Abstain
                      </Button>
                    </div>
                  </>
                )}

                {!isActive && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 border text-center">
                    <p className="font-mono text-sm flex flex-col items-center gap-2">
                      {results.passed ? (
                        <><CheckCircle2 className="h-6 w-6 text-green-500" /> Proposal Passed</>
                      ) : (
                        <><XCircle className="h-6 w-6 text-destructive" /> Proposal Rejected</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

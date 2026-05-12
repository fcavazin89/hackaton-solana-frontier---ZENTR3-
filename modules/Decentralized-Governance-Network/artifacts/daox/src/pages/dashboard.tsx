import { useGetGovernanceOverview, getGetGovernanceOverviewQueryKey } from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Box, CheckCircle2, FileText, Vote } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: overview, isLoading } = useGetGovernanceOverview({
    query: { queryKey: getGetGovernanceOverviewQueryKey() }
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Governance Overview</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Platform-wide statistics and recent activity across all DAOs</p>
        </div>

        {isLoading || !overview ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total DAOs</CardTitle>
                  <Box className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalDaos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalMembers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.activeProposals} / {overview.totalProposals}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
                  <Vote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalVotesCast}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(overview.avgParticipationRate * 100).toFixed(1)}% avg participation
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold tracking-tight mb-4">Recent Proposals</h2>
              <div className="grid gap-4">
                {overview.recentProposals.length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <p className="text-muted-foreground font-mono text-sm">No recent proposals</p>
                    </CardContent>
                  </Card>
                ) : (
                  overview.recentProposals.map((proposal) => (
                    <Link key={proposal.id} href={`/daos/${proposal.daoId}/proposals/${proposal.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer cursor-pointer hover:bg-muted/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{proposal.title}</CardTitle>
                              <CardDescription className="mt-1 font-mono text-xs">
                                DAO #{proposal.daoId} • Created by {proposal.creatorName}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                ${proposal.status === 'active' ? 'bg-primary/10 text-primary' : 
                                  proposal.status === 'passed' ? 'bg-green-500/10 text-green-500' : 
                                  proposal.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                                  'bg-muted text-muted-foreground'}`}>
                                {proposal.status}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Vote className="h-3.5 w-3.5" />
                                {proposal.totalVotes} votes
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {proposal.forVotes} for
                              </span>
                            </div>
                            <div className="font-mono text-xs">
                              Ends {format(new Date(proposal.votingEndsAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

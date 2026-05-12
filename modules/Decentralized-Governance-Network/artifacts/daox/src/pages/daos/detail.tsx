import { useRoute, Link } from "wouter";
import { 
  useGetDao, getGetDaoQueryKey,
  useGetDaoStats, getGetDaoStatsQueryKey,
  useGetDaoActivity, getGetDaoActivityQueryKey,
  useListProposals, getListProposalsQueryKey
} from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, CheckCircle2, Clock, Plus, ArrowRight, Activity, Wallet } from "lucide-react";
import { format } from "date-fns";

export default function DaoDetail() {
  const [, params] = useRoute("/daos/:id");
  const daoId = parseInt(params?.id || "0", 10);

  const { data: dao, isLoading: daoLoading } = useGetDao(daoId, {
    query: { enabled: !!daoId, queryKey: getGetDaoQueryKey(daoId) }
  });

  const { data: stats, isLoading: statsLoading } = useGetDaoStats(daoId, {
    query: { enabled: !!daoId, queryKey: getGetDaoStatsQueryKey(daoId) }
  });

  const { data: activity, isLoading: activityLoading } = useGetDaoActivity(daoId, {
    query: { enabled: !!daoId, queryKey: getGetDaoActivityQueryKey(daoId) }
  });

  const { data: proposals, isLoading: proposalsLoading } = useListProposals(daoId, {
    query: { enabled: !!daoId, queryKey: getListProposalsQueryKey(daoId) }
  });

  if (daoLoading || statsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!dao || !stats) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20">
          <h2 className="text-xl font-bold">Organization not found</h2>
          <Link href="/daos">
            <Button variant="link" className="mt-4">Return to Directory</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const activeProposals = proposals?.filter(p => p.status === 'active') || [];
  const pastProposals = proposals?.filter(p => p.status !== 'active') || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">{dao.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                ${dao.tokenSymbol}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 max-w-3xl">{dao.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/daos/${daoId}/members`}>
              <Button variant="outline" className="font-mono">
                <Users className="mr-2 h-4 w-4" /> Manage Members
              </Button>
            </Link>
            <Link href={`/daos/${daoId}/proposals/new`}>
              <Button className="font-mono">
                <Plus className="mr-2 h-4 w-4" /> New Proposal
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.treasuryBalance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">${dao.tokenSymbol}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProposals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Participation</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.avgParticipationRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalVotesCast} total votes cast
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="proposals" className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Active Proposals
              </h3>
              {proposalsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : activeProposals.length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <p className="text-muted-foreground font-mono text-sm">No active proposals right now</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeProposals.map(proposal => (
                    <Link key={proposal.id} href={`/daos/${daoId}/proposals/${proposal.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">{proposal.title}</CardTitle>
                              <CardDescription className="mt-1 font-mono text-xs">
                                Proposed by {proposal.creatorName}
                              </CardDescription>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Active
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-muted-foreground font-mono text-xs">
                              Ends {format(new Date(proposal.votingEndsAt), "MMM d, yyyy")}
                            </div>
                            <div className="font-mono text-xs">
                              {proposal.totalVotes} votes cast
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> Past Proposals
              </h3>
              {proposalsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : pastProposals.length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <p className="text-muted-foreground font-mono text-sm">No past proposals</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastProposals.map(proposal => (
                    <Link key={proposal.id} href={`/daos/${daoId}/proposals/${proposal.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer group bg-muted/10">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base font-medium group-hover:text-primary transition-colors">{proposal.title}</CardTitle>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                              ${proposal.status === 'passed' || proposal.status === 'executed' ? 'bg-green-500/10 text-green-500' : 
                                proposal.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                                'bg-muted text-muted-foreground'}`}>
                              {proposal.status}
                            </span>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : !activity || activity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                ) : (
                  <div className="space-y-6">
                    {activity.map((event, i) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                          {i !== activity.length - 1 && <div className="w-px h-full bg-border mt-2"></div>}
                        </div>
                        <div className="pb-6">
                          <p className="text-sm font-medium">{event.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">{format(new Date(event.timestamp), "MMM d, h:mm a")}</span>
                            <span className="text-xs text-muted-foreground font-mono">•</span>
                            <span className="text-xs text-muted-foreground font-mono">{event.actorName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{dao.mission}</p>
                <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Token Details</h4>
                    <p className="font-mono text-sm">${dao.tokenSymbol} ({dao.totalSupply.toLocaleString()} total supply)</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                    <p className="font-mono text-sm capitalize">{dao.status}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Deployed</h4>
                    <p className="font-mono text-sm">{format(new Date(dao.createdAt), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

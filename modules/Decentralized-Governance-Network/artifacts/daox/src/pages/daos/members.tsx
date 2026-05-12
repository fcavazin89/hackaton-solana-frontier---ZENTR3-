import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useListMembers, getListMembersQueryKey,
  useAddMember,
  useGetDao, getGetDaoQueryKey
} from "@workspace/api-client-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Users, Search, ShieldAlert, Award } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const addMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  walletAddress: z.string().min(10, "Valid wallet address required").startsWith("0x", "Must be a valid hex address"),
  role: z.enum(["admin", "council", "member"]),
  tokenBalance: z.coerce.number().min(0, "Balance must be positive"),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export default function MembersList() {
  const [, params] = useRoute("/daos/:id/members");
  const daoId = parseInt(params?.id || "0", 10);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dao } = useGetDao(daoId, {
    query: { enabled: !!daoId, queryKey: getGetDaoQueryKey(daoId) }
  });

  const { data: members, isLoading } = useListMembers(daoId, {
    query: { enabled: !!daoId, queryKey: getListMembersQueryKey(daoId) }
  });

  const addMemberMutation = useAddMember();

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: "",
      walletAddress: "",
      role: "member",
      tokenBalance: 0,
    },
  });

  const onSubmit = async (data: AddMemberFormValues) => {
    try {
      await addMemberMutation.mutateAsync({
        daoId,
        data
      });
      
      queryClient.invalidateQueries({ queryKey: getListMembersQueryKey(daoId) });
      toast({
        title: "Member Added",
        description: `${data.name} has been added to the DAO.`,
      });
      setIsAddOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add member.",
        variant: "destructive"
      });
    }
  };

  const filteredMembers = members?.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.walletAddress.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <Link href={`/daos/${daoId}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to DAO
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Members</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              Manage members and voting power for {dao?.name || 'organization'}
            </p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-mono">
                <UserPlus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Register a new wallet address to the organization and assign initial tokens.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member Name or Alias</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Satoshi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." className="font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="council">Council</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tokenBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Tokens</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={addMemberMutation.isPending}>
                      {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Directory
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search members..."
                  className="pl-9 h-9 font-mono text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-mono text-sm">
                No members found matching your search.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Balance ({dao?.tokenSymbol})</TableHead>
                    <TableHead className="text-right">Voting Power</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          {member.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {member.walletAddress.substring(0, 6)}...{member.walletAddress.substring(38)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize
                          ${member.role === 'admin' ? 'bg-destructive/10 text-destructive' : 
                            member.role === 'council' ? 'bg-primary/10 text-primary' : 
                            'bg-muted text-muted-foreground'}`}>
                          {member.role === 'admin' && <ShieldAlert className="h-3 w-3" />}
                          {member.role === 'council' && <Award className="h-3 w-3" />}
                          {member.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {member.tokenBalance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(member.votingPower * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {format(new Date(member.joinedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

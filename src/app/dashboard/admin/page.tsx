
"use client"

import { useMemo, useState, useEffect } from "react";
import { collection, doc, updateDoc, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Ticket, UserProfile, TicketStatus, TicketCategory, UserRole } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  Ticket as TicketIcon, 
  CheckCircle2, 
  Clock, 
  Search,
  ArrowUpRight,
  ShieldAlert,
  Settings,
  Lock,
  Unlock,
  Eye,
  UserCircle
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import DashboardPage from "../page";
import AgentDashboardPage from "../agent/page";

const ADMIN_EMAIL = "sountharyar.ad23@bitsathy.ac.in";

export default function AdminDashboardPage() {
  const { user } = useStore();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL && user.role !== 'admin') {
      router.push("/dashboard");
    }
  }, [user, router]);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'tickets');
  }, [db]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'users');
  }, [db]);

  const { data: tickets, loading: ticketsLoading } = useCollection<Ticket>(ticketsQuery);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const agents = useMemo(() => {
    return users.filter(u => u.role !== 'user' && u.role !== 'admin');
  }, [users]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    
    const deptChartData = Object.entries(tickets.reduce((acc: any, t) => {
      acc[t.issueCategory] = (acc[t.issueCategory] || 0) + 1;
      return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    return { total, open, inProgress, resolved, deptChartData };
  }, [tickets]);

  const agentPerformance = useMemo(() => {
    return agents.map(agent => {
      const assignedTickets = tickets.filter(t => t.assignedAgentId === agent.uid || t.issueCategory.includes(agent.role.replace(' Agent', '')));
      const resolvedCount = assignedTickets.filter(t => t.status === 'Resolved').length;
      return {
        ...agent,
        assigned: assignedTickets.length,
        resolved: resolvedCount,
        efficiency: assignedTickets.length > 0 ? Math.round((resolvedCount / assignedTickets.length) * 100) : 0
      };
    });
  }, [agents, tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.issueCategory === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  const toggleUserStatus = (userId: string, currentStatus?: string) => {
    if (!db) return;
    const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    const userRef = doc(db, "users", userId);
    
    updateDoc(userRef, { status: newStatus })
      .then(() => {
        toast({ title: `User ${newStatus === 'disabled' ? 'Disabled' : 'Enabled'}` });
      })
      .catch(error => {
        console.error(error);
      });
  };

  const COLORS = ['#538CC6', '#4DDEE1', '#F4A261', '#E76F51', '#2A9D8F', '#264653'];

  if (!user || (user.email !== ADMIN_EMAIL && user.role !== 'admin')) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">System Administration</h1>
          <p className="text-muted-foreground">Global monitoring of tickets, agents, and performance</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50">
          <TabsTrigger value="analytics" className="flex gap-2"><Settings className="w-4 h-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="tickets" className="flex gap-2"><TicketIcon className="w-4 h-4" /> Global Tickets</TabsTrigger>
          <TabsTrigger value="agents" className="flex gap-2"><Users className="w-4 h-4" /> Staff Management</TabsTrigger>
          <TabsTrigger value="customer-view" className="flex gap-2"><Eye className="w-4 h-4" /> Customer Perspective</TabsTrigger>
          <TabsTrigger value="agent-view" className="flex gap-2"><ShieldAlert className="w-4 h-4" /> Agent Perspective</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <TicketIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Across entire platform</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground">{stats.total > 0 ? Math.round((stats.resolved/stats.total)*100) : 0}% resolution rate</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Ongoing investigation</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-muted-foreground">Department-assigned agents</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-none shadow-sm">
              <CardHeader>
                <CardTitle>Department Load</CardTitle>
                <CardDescription>Volume of tickets per category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} interval={0} />
                    <YAxis fontSize={10} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3 border-none shadow-sm">
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
                <CardDescription>Percentage share by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.deptChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.deptChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="pt-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search globally..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">#{ticket.id.slice(0, 6)}</TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{ticket.userEmail}</TableCell>
                    <TableCell className="text-xs font-medium">{ticket.issueCategory}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === 'High' ? 'destructive' : 'outline'} className="text-[10px]">
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(ticket.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tickets/${ticket.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="pt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Staff Management & Performance</CardTitle>
              <CardDescription>Monitor resolution rates and account statuses</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Assigned</TableHead>
                  <TableHead className="text-center">Resolved</TableHead>
                  <TableHead className="text-center">Efficiency</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentPerformance.map((agent) => (
                  <TableRow key={agent.uid}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{agent.displayName}</span>
                        <span className="text-xs text-muted-foreground">{agent.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{agent.role}</TableCell>
                    <TableCell className="text-center font-bold">{agent.assigned}</TableCell>
                    <TableCell className="text-center font-bold text-emerald-600">{agent.resolved}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-medium">{agent.efficiency}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${agent.efficiency}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={agent.status === 'disabled' ? 'destructive' : 'secondary'}>
                        {agent.status === 'disabled' ? 'Disabled' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={agent.status === 'disabled' ? "text-emerald-600" : "text-destructive"}
                        onClick={() => toggleUserStatus(agent.uid, agent.status)}
                      >
                        {agent.status === 'disabled' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="customer-view" className="pt-6">
          <div className="bg-muted/30 p-4 rounded-xl border border-dashed mb-6 flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium">Viewing platform as a standard Customer.</p>
          </div>
          <DashboardPage />
        </TabsContent>

        <TabsContent value="agent-view" className="pt-6">
          <div className="bg-muted/30 p-4 rounded-xl border border-dashed mb-6 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium">Viewing platform as a Department Agent (Filtered view).</p>
          </div>
          <AgentDashboardPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

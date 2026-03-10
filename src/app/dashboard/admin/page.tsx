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
  UserCircle,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import DashboardPage from "../page";
import AgentDashboardPage from "../agent/page";
import AnalyticsPage from "../../analytics/page";

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

  if (!user || (user.email !== ADMIN_EMAIL && user.role !== 'admin')) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">System Command Center</h1>
          <p className="text-muted-foreground">Unified management across all platform roles and departments</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 mb-6">
          <TabsTrigger value="analytics" className="flex gap-2"><BarChart3 className="w-4 h-4" /> Global Analytics</TabsTrigger>
          <TabsTrigger value="tickets" className="flex gap-2"><TicketIcon className="w-4 h-4" /> Global Tickets</TabsTrigger>
          <TabsTrigger value="agents" className="flex gap-2"><Users className="w-4 h-4" /> Staff Management</TabsTrigger>
          <TabsTrigger value="customer-view" className="flex gap-2"><Eye className="w-4 h-4" /> Customer View</TabsTrigger>
          <TabsTrigger value="agent-view" className="flex gap-2"><ShieldAlert className="w-4 h-4" /> Agent View</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="animate-in fade-in slide-in-from-top-4 duration-500">
          <AnalyticsPage />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search globally by email or description..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Technical Support">Technical Support</SelectItem>
                      <SelectItem value="Billing Inquiry">Billing Inquiry</SelectItem>
                      <SelectItem value="Account Management">Account Management</SelectItem>
                      <SelectItem value="Bug Report">Bug Report</SelectItem>
                      <SelectItem value="Feature Request">Feature Request</SelectItem>
                      <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading tickets...</TableCell></TableRow>
                ) : filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">#{ticket.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{ticket.userEmail}</TableCell>
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

        <TabsContent value="agents" className="pt-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Monitor resolution efficiency and account status across departments</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Account Status</TableHead>
                  <TableHead className="text-right">Access Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading staff records...</TableCell></TableRow>
                ) : agents.map((agent) => (
                  <TableRow key={agent.uid}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{agent.displayName}</span>
                        <span className="text-xs text-muted-foreground">{agent.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{agent.role}</TableCell>
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
                        {agent.status === 'disabled' ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        {agent.status === 'disabled' ? 'Enable' : 'Disable'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="customer-view" className="pt-2">
          <div className="bg-muted/30 p-4 rounded-xl border border-dashed mb-6 flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium">Viewing platform as a standard Customer. Actions here will affect your actual user account data.</p>
          </div>
          <DashboardPage />
        </TabsContent>

        <TabsContent value="agent-view" className="pt-2">
          <div className="bg-muted/30 p-4 rounded-xl border border-dashed mb-6 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium">Viewing platform as an Agent. You can manage tickets across all departments from here.</p>
          </div>
          <AgentDashboardPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

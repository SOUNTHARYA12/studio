
"use client"

import { useMemo } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { 
  Ticket as TicketIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  History,
  Loader2
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useStore();
  const db = useFirestore();

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    const ticketsRef = collection(db, 'tickets');
    if (user.role === 'admin') {
      return ticketsRef;
    }
    return query(ticketsRef, where('userId', '==', user.uid));
  }, [db, user?.uid, user?.role]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  const tickets = useMemo(() => {
    return [...rawTickets].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [rawTickets]);

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const openTickets = tickets.filter(t => t.status === 'Open').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Overview</h1>
          <p className="text-muted-foreground">Monitor and manage your support activity</p>
        </div>
        <Button asChild>
          <Link href="/tickets/new">
            <TicketIcon className="w-4 h-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Tickets" 
          value={isLoading ? "..." : totalTickets} 
          icon={TicketIcon} 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Resolved" 
          value={isLoading ? "..." : resolvedTickets} 
          icon={CheckCircle2} 
          iconClassName="bg-emerald-500/10 text-emerald-500"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard 
          title="In Progress" 
          value={isLoading ? "..." : inProgressTickets} 
          icon={Clock} 
          iconClassName="bg-amber-500/10 text-amber-500"
        />
        <StatCard 
          title="Open" 
          value={isLoading ? "..." : openTickets} 
          icon={AlertCircle} 
          iconClassName="bg-destructive/10 text-destructive"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest support requests and status changes</CardDescription>
              </div>
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                  <TicketIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="max-w-[250px]">
                  <p className="font-semibold">No tickets yet</p>
                  <p className="text-sm text-muted-foreground">Submit your first support request to get started.</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/tickets/new">Create Ticket</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} href={`/tickets`}>
                    <div className="group relative flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-all cursor-pointer">
                      <div className="flex gap-4 overflow-hidden">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          ticket.status === 'Resolved' ? "bg-emerald-500/10 text-emerald-500" :
                          ticket.status === 'In Progress' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                        )}>
                          <TicketIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt)) : "Some time"} ago
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium text-primary truncate">{ticket.issueCategory}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <Badge variant={getPriorityColor(ticket.priority)} className="hidden sm:inline-flex">{ticket.priority}</Badge>
                        <Badge variant="secondary" className="hidden sm:inline-flex">{ticket.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                <Button variant="link" className="w-full text-primary" asChild>
                  <Link href="/tickets">View all tickets</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Support efficiency metrics</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resolution Rate</span>
                <span className="font-bold">{totalTickets > 0 ? Math.round((resolvedTickets/totalTickets)*100) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${totalTickets > 0 ? (resolvedTickets/totalTickets)*100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. Response Time</span>
                <span className="font-bold">4.2 hrs</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: '85%' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer Satisfaction</span>
                <span className="font-bold">98%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000" 
                  style={{ width: '98%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

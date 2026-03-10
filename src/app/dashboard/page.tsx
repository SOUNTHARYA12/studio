
"use client"

import { useMemo, useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { 
  Ticket as TicketIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  History,
  Sparkles,
  ArrowRight
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
import { Ticket, roleToCategoryMap } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useStore();
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    const ticketsRef = collection(db, 'tickets');
    
    // Admin sees everything
    if (user.role === 'admin') {
      return ticketsRef;
    }
    
    // Staff roles see only their department
    if (user.role !== 'user') {
      const assignedCategory = roleToCategoryMap[user.role as string];
      if (assignedCategory) {
        return query(ticketsRef, where('issueCategory', '==', assignedCategory));
      }
      // If we are staff but unrecognized, return an empty set for safety
      return query(ticketsRef, where('issueCategory', '==', 'UNASSIGNED_DEPARTMENT'));
    }
    
    // Standard users see only their own tickets
    return query(ticketsRef, where('userId', '==', user.uid));
  }, [db, user?.uid, user?.role]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  const sortedTickets = useMemo(() => {
    return [...rawTickets].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [rawTickets]);

  const totalTickets = sortedTickets.length;
  const resolvedTickets = sortedTickets.filter(t => t.status === 'Resolved').length;
  const inProgressTickets = sortedTickets.filter(t => t.status === 'In Progress').length;
  const openTickets = sortedTickets.filter(t => t.status === 'Open').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const canCreateTicket = user?.role === 'user';

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 via-background to-background border border-white/5 p-8 md:p-12">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              Intelligence Powered
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Hello, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg">
              {user?.role === 'user' 
                ? "Welcome back to your support ecosystem. Monitor and manage your requests."
                : `Command Center: Overseeing the ${user?.role.replace(' Agent', '')} department.`}
            </p>
          </div>
          {canCreateTicket && (
            <Button size="lg" className="glow-coral h-14 px-8 rounded-2xl text-lg font-bold group" asChild>
              <Link href="/tickets/new">
                <TicketIcon className="w-5 h-5 mr-2" />
                New Support Ticket
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Requests" 
          value={isLoading ? "..." : totalTickets} 
          icon={TicketIcon} 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Successfully Resolved" 
          value={isLoading ? "..." : resolvedTickets} 
          icon={CheckCircle2} 
          iconClassName="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard 
          title="Work in Progress" 
          value={isLoading ? "..." : inProgressTickets} 
          icon={Clock} 
          iconClassName="bg-amber-500/10 text-amber-400 border-amber-500/20"
        />
        <StatCard 
          title="Pending Queue" 
          value={isLoading ? "..." : openTickets} 
          icon={AlertCircle} 
          iconClassName="bg-destructive/10 text-destructive border-destructive/20"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              <CardDescription>Live stream of support interactions</CardDescription>
            </div>
            <History className="w-5 h-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />)}
              </div>
            ) : sortedTickets.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-white/5 p-6 rounded-3xl">
                  <TicketIcon className="w-12 h-12 text-muted-foreground opacity-20" />
                </div>
                <div className="max-w-[250px]">
                  <p className="font-semibold text-muted-foreground">The queue is currently empty</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="group relative flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex gap-5 overflow-hidden">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                          ticket.status === 'Resolved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          ticket.status === 'In Progress' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                          "bg-primary/10 text-primary border-primary/20"
                        )}>
                          <TicketIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="font-bold text-base truncate group-hover:text-primary transition-colors">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground font-medium">
                              {isMounted && ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt)) : "..."} ago
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-xs font-bold text-primary uppercase tracking-tighter">{ticket.issueCategory}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <Badge variant={getPriorityColor(ticket.priority)} className="hidden sm:inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                <Button variant="ghost" className="w-full text-primary font-bold hover:bg-primary/5 rounded-xl h-12 mt-2" asChild>
                  <Link href="/tickets">Explore All Tickets</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 glass-card flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Health Metrics</CardTitle>
                <CardDescription>Platform solve rate efficiency</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Resolution Accuracy</span>
                <span className="text-4xl font-black text-primary">
                  {totalTickets > 0 ? Math.round((resolvedTickets/totalTickets)*100) : 0}%
                </span>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000 glow-coral" 
                  style={{ width: `${totalTickets > 0 ? (resolvedTickets/totalTickets)*100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground italic text-center">
                Calculated based on {resolvedTickets} resolved out of {totalTickets} total tickets.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Efficiency</span>
                <span className="text-2xl font-bold text-emerald-400">High</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Uptime</span>
                <span className="text-2xl font-bold text-primary">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

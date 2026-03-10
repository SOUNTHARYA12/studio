
"use client"

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, eachDayOfInterval, subDays, isSameDay } from "date-fns";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Ticket } from "@/lib/types";

export default function AnalyticsPage() {
  const { user } = useStore();
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    const ticketsRef = collection(db, 'tickets');
    if (user.role === 'admin' || user.role !== 'user') {
      return ticketsRef;
    }
    return query(ticketsRef, where('userId', '==', user.uid));
  }, [db, user]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  const categoryData = useMemo(() => {
    if (!rawTickets) return [];
    const counts: Record<string, number> = {};
    rawTickets.forEach(t => {
      counts[t.issueCategory] = (counts[t.issueCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rawTickets]);

  const priorityData = useMemo(() => {
    if (!rawTickets) return [];
    const counts = { Low: 0, Medium: 0, High: 0 };
    rawTickets.forEach(t => {
      if (t.priority in counts) {
        counts[t.priority as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rawTickets]);

  const timeSeriesData = useMemo(() => {
    if (!isMounted || !rawTickets) return [];
    
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map(date => {
      const dateStr = format(date, 'MMM d');
      const count = rawTickets.filter(t => {
        if (!t.createdAt) return false;
        const ticketDate = new Date(t.createdAt);
        return isSameDay(ticketDate, date);
      }).length;
      return { date: dateStr, count };
    });
  }, [rawTickets, isMounted]);

  const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  if (!user) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-primary uppercase">Analytics Vault</h1>
        <p className="text-muted-foreground text-lg">Intelligent metrics and platform performance overview</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass-card overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/2">
            <CardTitle className="text-xl font-bold">Ticket Volume Dynamics</CardTitle>
            <CardDescription>Live frequency of support requests over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            {isLoading || !isMounted ? <Skeleton className="w-full h-full bg-white/5" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 900 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorCount)"
                    activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/2">
            <CardTitle className="text-xl font-bold">Category Weight</CardTitle>
            <CardDescription>Global distribution of issue types</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            {isLoading || !isMounted ? <Skeleton className="w-full h-full bg-white/5" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', paddingTop: '30px', fontWeight: 700, textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-card overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/2">
            <CardTitle className="text-xl font-bold">Priority Spectrum</CardTitle>
            <CardDescription>Urgency levels across all active inquiries</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            {isLoading || !isMounted ? <Skeleton className="w-full h-full bg-white/5" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '16px' }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'High' ? 'hsl(var(--primary))' : 
                              entry.name === 'Medium' ? 'hsl(var(--chart-2))' : 
                              'hsl(var(--chart-3))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tighter uppercase">Platform Solve Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col">
              <span className="text-6xl font-black text-primary leading-none">
                {rawTickets.length > 0 ? Math.round((rawTickets.filter(t => t.status === 'Resolved').length / rawTickets.length) * 100) : 0}%
              </span>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Overall Resolution Efficiency</span>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Queue</span>
                <span className="text-2xl font-black">{rawTickets.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

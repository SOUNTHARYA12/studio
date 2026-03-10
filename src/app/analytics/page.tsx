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
  Legend
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
    // Admins see all for global analytics, agents see all, users see their own
    if (user.role === 'admin' || user.role !== 'user') {
      return ticketsRef;
    }
    return query(ticketsRef, where('userId', '==', user.uid));
  }, [db, user]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  // Real-time calculation of category distribution
  const categoryData = useMemo(() => {
    if (!rawTickets) return [];
    const counts: Record<string, number> = {};
    rawTickets.forEach(t => {
      counts[t.issueCategory] = (counts[t.issueCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rawTickets]);

  // Real-time calculation of priority distribution
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

  // Real-time calculation of volume trends
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

  const COLORS = ['#538CC6', '#4DDEE1', '#F4A261', '#E76F51', '#2A9D8F', '#264653'];

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Support Performance</h1>
        <p className="text-muted-foreground">Real-time resolution metrics and demand trends</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle>Ticket Volume Trend</CardTitle>
            <CardDescription>Frequency of requests submitted in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            {isLoading || !isMounted ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle>Department Load</CardTitle>
            <CardDescription>Live distribution across issue categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            {isLoading || !isMounted ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle>Urgency Breakdown</CardTitle>
            <CardDescription>Current tickets grouped by priority level</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            {isLoading || !isMounted ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'High' ? 'hsl(var(--destructive))' : 
                              entry.name === 'Medium' ? 'hsl(var(--primary))' : 
                              'hsl(var(--accent))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden">
          <CardHeader className="bg-white/5">
            <CardTitle>Resolution Efficiency</CardTitle>
            <CardDescription className="text-primary-foreground/70">Calculated from total ticket status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Total Queue Size</p>
              <p className="text-4xl font-black">{rawTickets.length}</p>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">System-wide Solve Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black">
                  {rawTickets.length > 0 ? Math.round((rawTickets.filter(t => t.status === 'Resolved').length / rawTickets.length) * 100) : 0}%
                </p>
                <span className="text-xs opacity-70">of tickets closed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

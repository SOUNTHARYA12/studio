
"use client"

import { useEffect, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { getTicketsAction } from "@/app/actions/tickets";
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
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfDay, eachDayOfInterval, subDays } from "date-fns";

export default function AnalyticsPage() {
  const { user, tickets, setTickets } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getTicketsAction(user.uid, user.role === 'admin').then(fetchedTickets => {
        setTickets(fetchedTickets);
        setIsLoading(false);
      });
    }
  }, [user, setTickets]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.issueCategory] = (counts[t.issueCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const priorityData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    tickets.forEach(t => {
      counts[t.priority]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const timeSeriesData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map(date => {
      const dateStr = format(date, 'MMM d');
      const count = tickets.filter(t => 
        format(new Date(t.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length;
      return { date: dateStr, count };
    });
  }, [tickets]);

  const COLORS = ['#538CC6', '#4DDEE1', '#F4A261', '#E76F51', '#2A9D8F', '#264653'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Analytics</h1>
        <p className="text-muted-foreground">Visualizing performance and issue distributions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Tickets Over Time</CardTitle>
            <CardDescription>Volume of requests received in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Issue Categories</CardTitle>
            <CardDescription>Distribution of ticket types</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
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
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Breakdown of urgency levels</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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

        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription className="text-primary-foreground/70">Efficiency recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-sm font-medium">Most Frequent Category</p>
              <p className="text-2xl font-bold">Technical Support</p>
              <p className="text-xs mt-1 text-primary-foreground/70">Increase FAQ documentation for this area.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-sm font-medium">Resolution Efficiency</p>
              <p className="text-2xl font-bold">+14%</p>
              <p className="text-xs mt-1 text-primary-foreground/70">Since implementing AI auto-summaries.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

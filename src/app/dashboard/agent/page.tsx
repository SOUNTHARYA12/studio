"use client"

import { useMemo, useState, useEffect } from "react";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Ticket, TicketStatus, TicketCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Mail, 
  Tag, 
  Calendar,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from "next/link";

export default function AgentDashboardPage() {
  const { user } = useStore();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Role protection - ensure user is an agent
    if (user && user.role === 'user') {
      router.push("/dashboard");
    }
  }, [user, router]);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'tickets');
  }, [db]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  // Department mapping logic
  const departmentMapping: Record<string, TicketCategory> = {
    'Billing Agent': 'Billing Inquiry',
    'Technical Support Agent': 'Technical Support',
    'Customer Support Agent': 'General Inquiry',
    'Account Management Agent': 'Account Management',
    'Developer Agent': 'Bug Report',
    'Product Team Agent': 'Feature Request',
  };

  const filteredTickets = useMemo(() => {
    if (!user) return [];
    
    // Admin sees everything, specific agents see their category
    let filtered = rawTickets;
    
    if (user.role !== 'admin') {
      const allowedCategory = departmentMapping[user.role];
      if (allowedCategory) {
        filtered = filtered.filter(t => t.issueCategory === allowedCategory);
      } else {
        // If they have an unknown agent role, show nothing for security
        return [];
      }
    }

    return filtered
      .filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.issueCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawTickets, searchTerm, user]);

  const updateStatus = (ticketId: string, status: TicketStatus) => {
    if (!db) return;
    const ticketRef = doc(db, "tickets", ticketId);
    
    updateDoc(ticketRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    })
      .then(() => {
        toast({
          title: "Status Updated",
          description: `Ticket is now marked as ${status}.`,
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: ticketRef.path,
          operation: 'update',
          requestResourceData: { status },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-primary" />;
    }
  };

  if (!isMounted || !user) return null;

  if (user.role === 'user') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          This dashboard is reserved for support agents only.
        </p>
        <Button asChild>
          <Link href="/dashboard">Return to My Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{user.role} Dashboard</h1>
          <p className="text-muted-foreground">
            {user.role === 'admin' 
              ? "Monitor global support activity across all departments" 
              : `Managing ${departmentMapping[user.role]} tickets`}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse h-64 bg-muted/50" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">No tickets found in your department</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="group border-none shadow-sm hover:shadow-md transition-all flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(ticket.status)}
                    <span className="text-xs font-medium uppercase">{ticket.status}</span>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2 min-h-[3rem] mt-2">
                  {ticket.description}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  {ticket.issueCategory}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">User ID: {ticket.userId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  ID: {ticket.id}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateStatus(ticket.id!, 'Open')}
                    disabled={ticket.status === 'Open'}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateStatus(ticket.id!, 'In Progress')}
                    disabled={ticket.status === 'In Progress'}
                  >
                    In Progress
                  </Button>
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => updateStatus(ticket.id!, 'Resolved')}
                  disabled={ticket.status === 'Resolved'}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button variant="ghost" className="w-full h-8 text-xs" asChild>
                  <Link href={`/tickets/${ticket.id}`}>
                    Open Conversation
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

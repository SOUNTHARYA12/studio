"use client"

import { useMemo, useState, useEffect } from "react";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Ticket, TicketStatus, TicketCategory, UserRole } from "@/lib/types";
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
  Filter,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AgentDashboardPage() {
  const { user } = useStore();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Role protection - ensure user is an agent (role matches a category) or admin
    if (user && user.role === 'user') {
      router.push("/dashboard");
    }
  }, [user, router]);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'tickets');
  }, [db]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  const filteredTickets = useMemo(() => {
    if (!user) return [];
    
    // Filter logic: 
    // 1. Admins see everything.
    // 2. Agents see tickets matching their department/role mapping (which are now identical strings).
    let filtered = rawTickets;
    
    if (user.role !== 'admin' && user.role !== 'user') {
      filtered = filtered.filter(t => t.issueCategory === user.role);
    } else if (user.role === 'user') {
      return [];
    }

    // Apply search filter
    return filtered
      .filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
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
          description: `Ticket #${ticketId.slice(0, 8)} is now marked as ${status}.`,
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
  if (user.role === 'user') return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {user.role} Department
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Support Queue</h1>
          <p className="text-muted-foreground">
            {user.role === 'admin' 
              ? "Global oversight of all departmental inquiries" 
              : `Managing the ${user.role} queue`}
          </p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by ID, email, or issue..." 
            className="pl-10 h-11 border-none bg-muted/50 focus-visible:ring-primary shadow-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse h-72 bg-muted/50 border-none" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed flex flex-col items-center">
          <Filter className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-xl font-semibold text-muted-foreground">No active tickets found</h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
            All caught up! There are currently no tickets matching your department criteria or search.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col bg-card overflow-hidden">
              <div className={cn(
                "h-1.5 w-full",
                ticket.priority === 'High' ? "bg-destructive" : 
                ticket.priority === 'Medium' ? "bg-primary" : "bg-muted"
              )} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge variant={getPriorityColor(ticket.priority)} className="text-[10px] font-bold">
                    {ticket.priority} PRIORITY
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(ticket.status)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{ticket.status}</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-2 min-h-[3rem]">
                  {ticket.description}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 text-primary font-medium text-xs">
                  <Tag className="w-3.5 h-3.5" />
                  {ticket.issueCategory}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pb-4">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Customer Email</span>
                    <span className="text-xs truncate font-medium">{ticket.userEmail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Submitted On</span>
                    <span className="text-xs font-medium">{format(new Date(ticket.createdAt), "MMM d, yyyy • HH:mm")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/5 flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "flex-1 text-[10px] font-bold h-9",
                      ticket.status === 'Open' && "bg-primary/10 border-primary/20 text-primary"
                    )}
                    onClick={() => updateStatus(ticket.id!, 'Open')}
                    disabled={ticket.status === 'Open'}
                  >
                    OPEN
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "flex-1 text-[10px] font-bold h-9",
                      ticket.status === 'In Progress' && "bg-amber-500/10 border-amber-500/20 text-amber-600"
                    )}
                    onClick={() => updateStatus(ticket.id!, 'In Progress')}
                    disabled={ticket.status === 'In Progress'}
                  >
                    PROGRESS
                  </Button>
                </div>
                <Button 
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                  onClick={() => updateStatus(ticket.id!, 'Resolved')}
                  disabled={ticket.status === 'Resolved'}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  RESOLVE TICKET
                </Button>
                <Button variant="ghost" className="w-full h-8 text-[10px] font-bold hover:bg-primary/5 hover:text-primary group/link" asChild>
                  <Link href={`/tickets/${ticket.id}`}>
                    VIEW FULL CONVERSATION
                    <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover/link:translate-x-1" />
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

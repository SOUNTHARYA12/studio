"use client"

import { useState, useMemo, useEffect } from "react";
import { collection, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Trash2,
  ExternalLink,
  MessageSquare,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { TicketStatus, Ticket } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TicketManagementPage() {
  const { user } = useStore();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    const ticketsRef = collection(db, 'tickets');
    if (user.role === 'agent') {
      return ticketsRef;
    }
    return query(ticketsRef, where('userId', '==', user.uid));
  }, [db, user?.uid, user?.role]);

  const { data: rawTickets, loading: isLoading } = useCollection<Ticket>(ticketsQuery);

  const filteredTickets = useMemo(() => {
    return rawTickets
      .filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.issueCategory.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawTickets, searchTerm]);

  const handleStatusUpdate = (ticketId: string, status: TicketStatus) => {
    if (!db) return;
    const ticketRef = doc(db, "tickets", ticketId);
    updateDoc(ticketRef, { status, updatedAt: new Date().toISOString() })
      .then(() => {
        toast({ title: "Status updated", description: `Ticket marked as ${status}` });
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

  const handleDelete = (ticketId: string) => {
    if (!db) return;
    if (confirm("Are you sure you want to delete this ticket?")) {
      const ticketRef = doc(db, "tickets", ticketId);
      deleteDoc(ticketRef)
        .then(() => {
          toast({ title: "Ticket deleted" });
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: ticketRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'In Progress': return <Clock className="w-3 h-3 mr-1" />;
      case 'Open': return <AlertCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Management</h1>
          <p className="text-muted-foreground">{user?.role === 'agent' ? "Reviewing all platform inquiries" : "Review and track your support inquiries"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tickets..." 
              className="pl-9 w-[250px]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{ticket.id?.slice(0, 6)}
                  </TableCell>
                  <TableCell className="font-medium">{ticket.issueCategory}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{ticket.description}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center w-fit">
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {isMounted && ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tickets/${ticket.id}`} className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        {user?.role === 'agent' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(ticket.id!, "In Progress")}>
                              <Clock className="w-4 h-4 mr-2" /> Mark Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(ticket.id!, "Resolved")}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ticket.id!)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
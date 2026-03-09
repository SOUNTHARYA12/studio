
"use client"

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getTicketsAction, updateTicketStatusAction, deleteTicketAction } from "@/app/actions/tickets";
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
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { TicketStatus } from "@/lib/types";

export default function TicketManagementPage() {
  const { user, tickets, setTickets, updateTicketStatus, deleteTicket } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      getTicketsAction(user.uid, user.role === 'admin').then(fetchedTickets => {
        setTickets(fetchedTickets);
        setIsLoading(false);
      });
    }
  }, [user, setTickets]);

  const handleStatusUpdate = async (ticketId: string, status: TicketStatus) => {
    const result = await updateTicketStatusAction(ticketId, status);
    if (result.success) {
      updateTicketStatus(ticketId, status);
      toast({ title: "Status updated", description: `Ticket marked as ${status}` });
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      const result = await deleteTicketAction(ticketId);
      if (result.success) {
        deleteTicket(ticketId);
        toast({ title: "Ticket deleted" });
      }
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.issueCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'In Progress': return <Clock className="w-3 h-3 mr-1" />;
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
          <p className="text-muted-foreground">Review and track your support inquiries</p>
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
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="max-w-[300px]">Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No tickets found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{ticket.id.slice(0, 6)}
                  </TableCell>
                  <TableCell className="font-medium">{ticket.issueCategory}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm truncate font-medium">{ticket.summary || ticket.description.slice(0, 100)}</p>
                      {ticket.summary && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          AI Summary available
                        </span>
                      )}
                    </div>
                  </TableCell>
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
                    {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => handleStatusUpdate(ticket.id, "In Progress")}
                        >
                          <Clock className="w-4 h-4" /> Mark Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-emerald-500 focus:text-emerald-500"
                          onClick={() => handleStatusUpdate(ticket.id, "Resolved")}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                          onClick={() => handleDelete(ticket.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete Ticket
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

"use client"

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { useStore } from "@/lib/store";
import { useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Ticket, Message, TicketStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldAlert,
  MessageSquare,
  Loader2,
  Sparkles
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useStore();
  const db = useFirestore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ticketRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "tickets", id as string);
  }, [db, id]);

  const { data: ticket, loading: ticketLoading } = useDoc<Ticket>(ticketRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(
      collection(db, "tickets", id as string, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [db, id]);

  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !db || !id || isSending) return;

    setIsSending(true);
    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || user.email || "Anonymous",
      senderRole: user.role,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const messagesRef = collection(db, "tickets", id as string, "messages");
    
    addDoc(messagesRef, messageData)
      .then(() => {
        setNewMessage("");
        setIsSending(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `tickets/${id}/messages`,
          operation: 'create',
          requestResourceData: messageData,
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsSending(false);
      });
  };

  const updateStatus = (status: TicketStatus) => {
    if (!ticketRef) return;
    
    updateDoc(ticketRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    })
      .then(() => {
        toast({
          title: "Status updated",
          description: `Ticket is now ${status}`,
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

  if (ticketLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading ticket conversation...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="text-xl font-semibold">Ticket not found</p>
        <Button asChild variant="outline">
          <Link href="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tickets">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ticket Detail</h1>
            <p className="text-sm text-muted-foreground">#{id?.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getPriorityColor(ticket.priority)} className="px-3 py-1">
            {ticket.priority} Priority
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {ticket.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ticket Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Initial information provided</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
                <p className="font-medium">{ticket.issueCategory}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Submitted By</Label>
                <p className="font-medium">{ticket.userName}</p>
                <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                <p className="text-sm leading-relaxed mt-1">{ticket.description}</p>
              </div>
              {ticket.summary && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Summary</span>
                  </div>
                  <p className="text-sm italic">{ticket.summary}</p>
                </div>
              )}
            </CardContent>
            {user?.role === 'admin' && (
              <CardFooter className="flex flex-col gap-2 pt-0">
                <p className="text-xs text-muted-foreground mb-2 w-full">Agent Actions</p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateStatus('In Progress')}
                    disabled={ticket.status === 'In Progress'}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    In Progress
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateStatus('Resolved')}
                    disabled={ticket.status === 'Resolved'}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Resolve
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-2 h-[70vh] flex flex-col">
          <Card className="border-none shadow-sm flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Conversation</CardTitle>
                </div>
                {isMounted && (
                  <span className="text-xs text-muted-foreground">
                    Last updated {formatDistanceToNow(new Date(ticket.updatedAt))} ago
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{msg.senderName}</span>
                          {msg.senderRole === 'admin' && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/5 text-primary border-primary/20">AGENT</Badge>
                          )}
                        </div>
                        <div 
                          className={cn(
                            "rounded-2xl px-4 py-2 text-sm shadow-sm",
                            msg.senderId === user?.uid 
                              ? "bg-primary text-primary-foreground rounded-tr-none" 
                              : "bg-muted rounded-tl-none"
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {isMounted && format(new Date(msg.timestamp), "h:mm a")}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                <Input 
                  placeholder="Type your message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={ticket.status === 'Resolved'}
                  className="flex-1 bg-muted/50 border-none focus-visible:ring-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.trim() || isSending || ticket.status === 'Resolved'}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={cn("block font-semibold mb-1", className)}>{children}</span>;
}
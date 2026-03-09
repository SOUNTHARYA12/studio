"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TicketCategory, TicketPriority } from "@/lib/types";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { summarizeTicket } from '@/ai/flows/automated-ticket-summary';

const categories: TicketCategory[] = [
  'Technical Support',
  'Billing Inquiry',
  'Account Management',
  'General Inquiry',
  'Bug Report',
  'Feature Request'
];

export default function CreateTicketPage() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("General Inquiry");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setIsSubmitting(true);
    try {
      // Get AI Summary
      const { summary } = await summarizeTicket({ description });

      const ticketData = {
        userName: user.displayName || "Unknown User",
        userEmail: user.email || "",
        description,
        summary,
        issueCategory: category,
        priority,
        status: 'Open',
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ticketsRef = collection(db, 'tickets');
      
      addDoc(ticketsRef, ticketData)
        .then(() => {
          toast({
            title: "Ticket created successfully",
            description: "Our team will review your request shortly.",
          });
          router.push("/tickets");
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: 'tickets',
            operation: 'create',
            requestResourceData: ticketData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Support Ticket</h1>
          <p className="text-muted-foreground">Describe your issue and we'll help you solve it</p>
        </div>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <CardTitle>AI-Enhanced Creation</CardTitle>
          </div>
          <CardDescription>Our AI will summarize your ticket and route it to the right department automatically.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Issue Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as TicketCategory)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TicketPriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea 
                id="description" 
                placeholder="Please describe your issue in detail. The more info, the faster we can help!" 
                className="min-h-[200px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                AI Tip: Include error codes or specific steps you took.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-6">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" className="px-8 h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing & Creating...
                </>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

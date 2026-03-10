"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
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
import { 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Wrench, 
  CreditCard, 
  UserCog, 
  Bug, 
  Lightbulb 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { summarizeTicket } from '@/ai/flows/automated-ticket-summary';
import { SelectionCard } from "@/components/ui/selection-card";

const categoryOptions = [
  { id: 'General Inquiry', title: 'General Inquiry', description: 'Standard questions or feedback', icon: MessageSquare },
  { id: 'Technical Support', title: 'Technical Support', description: 'Hardware or software issues', icon: Wrench },
  { id: 'Billing Inquiry', title: 'Billing Inquiry', description: 'Invoices, payments, and refunds', icon: CreditCard },
  { id: 'Account Management', title: 'Account Management', description: 'Access, security, or profile updates', icon: UserCog },
  { id: 'Bug Report', title: 'Bug Report', description: 'Report technical errors or crashes', icon: Bug },
  { id: 'Feature Request', title: 'Feature Request', description: 'Suggest new platform capabilities', icon: Lightbulb },
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
            title: "Transmission Success",
            description: "Your support request has been logged in the system vault.",
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
        title: "Transmission Failure",
        description: error.message || "Something went wrong during data upload.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 border-white/10 hover:bg-white/5 transition-all" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">Initialize Ticket</h1>
          <p className="text-muted-foreground text-lg">Your technical request will be analyzed by our intelligence engine.</p>
        </div>
      </div>

      <Card className="glass-card border-primary/20 p-4 md:p-8">
        <CardHeader className="text-center pb-10">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/20 p-4 rounded-3xl glow-coral border border-primary/30">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tight">AI-Enhanced Processing</CardTitle>
          <CardDescription className="text-base">Our neural networks will automatically route your request to the relevant department based on your input.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-10">
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-primary/80">Issue Classification</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryOptions.map((opt) => (
                  <SelectionCard
                    key={opt.id}
                    title={opt.title}
                    description={opt.description}
                    icon={opt.icon}
                    selected={category === opt.id}
                    onClick={() => setCategory(opt.id as TicketCategory)}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="priority" className="text-xs font-black uppercase tracking-widest text-primary/80">Urgency Protocol</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as TicketPriority)}>
                  <SelectTrigger id="priority" className="h-14 rounded-2xl bg-white/5 border-white/10 text-base font-bold">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="Low" className="font-bold py-3">Low Urgency</SelectItem>
                    <SelectItem value="Medium" className="font-bold py-3">Standard Response</SelectItem>
                    <SelectItem value="High" className="font-bold py-3">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-primary/80">Detailed Technical Log</Label>
              <Textarea 
                id="description" 
                placeholder="Provide a comprehensive breakdown of the issue. Be as detailed as possible for optimal AI routing." 
                className="min-h-[200px] rounded-2xl bg-white/5 border-white/10 text-base font-medium p-6 resize-none focus:border-primary/50 transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest text-primary/60">
                <Sparkles className="w-3 h-3" />
                Neural network is ready for analysis
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/10">
            <Button type="button" variant="ghost" className="text-muted-foreground font-bold rounded-xl h-12" asChild>
              <Link href="/dashboard">Abort Process</Link>
            </Button>
            <Button type="submit" className="glow-coral h-14 px-12 rounded-2xl text-lg font-black uppercase tracking-tight disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  Transmit Request
                  <Send className="w-5 h-5 ml-3" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

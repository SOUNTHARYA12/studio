
"use client"

import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { useAuth, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Shield, 
  Loader2, 
  CheckCircle2, 
  UserCircle,
  Wrench,
  CreditCard,
  MessageSquare,
  UserCog,
  Bug,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/lib/types";
import { SelectionCard } from "@/components/ui/selection-card";

const roleOptions = [
  { id: 'user', title: 'Customer', description: 'Access support and track tickets', icon: User },
  { id: 'Customer Support Agent', title: 'Customer Support', description: 'Handle general inquiries', icon: MessageSquare },
  { id: 'Technical Support Agent', title: 'Technical Support', description: 'Hardware or software issues', icon: Wrench },
  { id: 'Billing Agent', title: 'Billing Agent', description: 'Invoices, payments, and refunds', icon: CreditCard },
  { id: 'Account Management Agent', title: 'Account Manager', description: 'Security and profile updates', icon: UserCog },
  { id: 'Developer Agent', title: 'Developer Agent', description: 'Report technical errors or bug reports', icon: Bug },
  { id: 'Product Team Agent', title: 'Product Team', description: 'Suggest new platform features', icon: Lightbulb },
];

export default function ProfilePage() {
  const { user, setUser } = useStore();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [role, setRole] = useState<UserRole>(user?.role || "user");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setRole(user.role);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser || !db) return;

    setIsUpdating(true);
    try {
      // 1. Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      });

      // 2. Update Firestore Document
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        displayName: displayName,
        role: role,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, updateData)
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw error;
        });

      // 3. Update Global Store
      setUser({
        ...user,
        displayName,
        role,
      });

      toast({
        title: "Profile Updated",
        description: "Your alterations have been synchronized with the network.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-primary uppercase">Identity Management</h1>
        <p className="text-muted-foreground text-lg">Manage your personal credentials and platform permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card border-primary/10 h-fit">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center overflow-hidden">
                  <UserCircle className="w-16 h-16 text-primary/40" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-xl font-bold">{user.displayName || "User"}</CardTitle>
            <CardDescription className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
              {user.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">ID: {user.uid.slice(0, 12)}...</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Account Alterations</CardTitle>
            <CardDescription>Update your public identity and platform access level</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</Label>
                <Input 
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
                  placeholder="Your display name"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Role Permissions</Label>
                {isAdmin ? (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <p className="text-sm font-bold text-primary uppercase">
                      Administrator account privileges are locked.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roleOptions.map((opt) => (
                      <SelectionCard
                        key={opt.id}
                        title={opt.title}
                        description={opt.description}
                        icon={opt.icon}
                        selected={role === opt.id}
                        onClick={() => setRole(opt.id as UserRole)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
              <Button 
                type="submit" 
                className="h-12 px-8 rounded-xl font-black uppercase tracking-tight glow-coral group" 
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Alterations
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

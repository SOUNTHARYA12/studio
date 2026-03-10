"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  User, 
  Shield, 
  CreditCard, 
  Wrench, 
  Headset, 
  UserCog, 
  Code, 
  Layout 
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { UserRole, UserProfile } from "@/lib/types";
import { SelectionCard } from "@/components/ui/selection-card";

const ADMIN_EMAIL = "sountharyar.ad23@bitsathy.ac.in";

const roleOptions = [
  { id: 'user', title: 'Customer', description: 'Access support and track tickets', icon: User },
  { id: 'admin', title: 'Admin', description: 'Full system oversight', icon: Shield },
  { id: 'Billing Agent', title: 'Billing Agent', description: 'Manage accounts and invoices', icon: CreditCard },
  { id: 'Technical Support Agent', title: 'Technical Support', description: 'Solve hardware/software issues', icon: Wrench },
  { id: 'Customer Support Agent', title: 'Support Agent', description: 'General customer inquiries', icon: Headset },
  { id: 'Account Management Agent', title: 'Account Manager', description: 'Manage profiles and access', icon: UserCog },
  { id: 'Developer Agent', title: 'Developer Agent', description: 'Handle bugs and technical ops', icon: Code },
  { id: 'Product Team Agent', title: 'Product Team', description: 'Manage feature requests', icon: Layout },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useStore();
  const { toast } = useToast();

  const auth = useAuth();
  const db = useFirestore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      const finalRole: UserRole = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : role;

      const userData: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: finalRole,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      const userRef = doc(db, "users", user.uid);
      
      setDoc(userRef, userData)
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

      setUser(userData);
      
      toast({
        title: "Account created",
        description: finalRole === 'admin' ? "Welcome back, Administrator." : "Registration successful.",
      });

      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "An error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      }

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const isDetectedAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-2xl glow-coral">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">Create Account</h1>
          <p className="text-muted-foreground">Join the SupportLens intelligence network</p>
        </div>

        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Personal Credentials</CardTitle>
            <CardDescription>Fill in your details and select your platform role</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister} autoComplete="off">
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                    autoComplete="off"
                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary">Email address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    autoComplete="off"
                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-primary">Security Key</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  autoComplete="off"
                  className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Platform Role Selection</Label>
                
                {isDetectedAdmin ? (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <p className="text-xs font-bold text-primary uppercase tracking-tight">
                      Authorized Administrator Email detected. System access will be set to Admin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <CardFooter className="flex flex-col gap-6 pt-6 border-t border-white/5 bg-white/[0.02]">
              <Button type="submit" className="w-full h-14 rounded-2xl glow-coral font-black uppercase tracking-tight text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : null}
                Initialize Account
              </Button>
              <p className="text-xs text-center text-muted-foreground font-medium uppercase tracking-widest">
                Already part of the network?{" "}
                <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

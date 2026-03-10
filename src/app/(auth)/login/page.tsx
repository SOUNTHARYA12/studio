
"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, Sparkles, LogIn } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useStore();
  const { toast } = useToast();
  
  const auth = useAuth();
  const db = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const fallbackData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          role: user.email === "sountharyar.ad23@bitsathy.ac.in" ? 'admin' : 'user',
        };
        setUser(fallbackData as any);
        router.push("/dashboard");
        return;
      }

      const userData = userDoc.data() as any;

      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || userData.displayName,
        role: userData.role,
      });

      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "Access denied. Verify your credentials.";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please verify your email and security key.";
      }

      toast({
        title: "Login Failure",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-3xl glow-coral">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-5xl font-black tracking-tighter text-white">LENS</h1>
            <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mt-1">Platform Access</span>
          </div>
        </div>

        <Card className="glass-card border-primary/20 p-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black uppercase tracking-tight">System Login</CardTitle>
            <CardDescription className="text-sm font-medium">Verify your credentials to initialize session</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin} autoComplete="off">
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-primary/80">Identifier</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50"
                  required 
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-primary/80">Security Key</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50"
                  required 
                  autoComplete="off"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 pt-6">
              <Button type="submit" className="w-full h-14 rounded-2xl glow-coral font-black uppercase tracking-tight text-lg group" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : (
                  <>
                    Initialize Session
                    <LogIn className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  New to SupportLens?
                </p>
                <Link href="/register" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline hover:text-primary/80 transition-all">
                  Create Account Vault
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center justify-center gap-2 text-primary/30">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Encrypted Data Transmission</span>
        </div>
      </div>
    </div>
  );
}

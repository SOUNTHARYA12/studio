
"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { UserRole, UserProfile } from "@/lib/types";

const ADMIN_EMAIL = "sountharyar.ad23@bitsathy.ac.in";

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
      
      // CRITICAL: Force Admin role if the specific email is used
      const finalRole: UserRole = email.trim() === ADMIN_EMAIL ? "admin" : role;

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">SupportLens</h1>
          <p className="text-muted-foreground">Create a new account</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Fill in your details and select your role</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-6">
              {email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <p className="text-xs font-medium text-primary">
                    Authorized Administrator Email detected. You will be registered as System Admin.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="role">Register as</Label>
                  <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Customer</SelectItem>
                      <SelectItem value="Billing Agent">Billing Agent</SelectItem>
                      <SelectItem value="Technical Support Agent">Technical Support Agent</SelectItem>
                      <SelectItem value="Customer Support Agent">Customer Support Agent</SelectItem>
                      <SelectItem value="Account Management Agent">Account Management Agent</SelectItem>
                      <SelectItem value="Developer Agent">Developer Agent</SelectItem>
                      <SelectItem value="Product Team Agent">Product Team Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="sountharyar.ad23@bitsathy.ac.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
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

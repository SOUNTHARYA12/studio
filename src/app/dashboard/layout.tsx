"use client"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ADMIN_EMAIL = "sountharyar.ad23@bitsathy.ac.in";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { user, setUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : { role: 'user' };
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (userData as any).displayName || 'User',
            role: (userData as any).role as any,
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'user',
          });
        }
      } else {
        setUser(null);
        router.push("/login");
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [setUser, router, auth, db]);

  // Security: Check for Admin Dashboard access
  const isAdminPath = pathname?.startsWith('/dashboard/admin');
  const isUnauthorizedAdmin = isAdminPath && user?.email !== ADMIN_EMAIL;

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (isUnauthorizedAdmin) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 gap-6">
        <div className="bg-destructive/10 p-6 rounded-full">
          <ShieldAlert className="w-16 h-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The Admin Dashboard is restricted to authorized administrative personnel only.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { user, setUser } = useStore();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch the full profile including the role
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : { role: 'user' };
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (userData as any).displayName || 'User',
            role: (userData as any).role as 'user' | 'admin',
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to basic auth info if firestore fetch fails
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
      // Only stop checking once we have attempted to load the profile
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [setUser, router, auth, db]);

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


"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase-config";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="bg-primary p-3 rounded-2xl animate-pulse">
        <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg" />
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Waking up SupportLens...</p>
    </div>
  );
}

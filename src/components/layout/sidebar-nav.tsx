
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Ticket as TicketIcon, 
  BarChart3, 
  LogOut,
  ShieldCheck,
  UserCog,
  Settings,
  Sparkles,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

const ADMIN_EMAIL = "sountharyar.ad23@bitsathy.ac.in";

export function SidebarNav() {
  const pathname = usePathname();
  const { user, setUser } = useStore();
  const auth = useAuth();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Vault", href: "/analytics", icon: BarChart3 },
    { name: "Queue", href: "/tickets", icon: TicketIcon },
    { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  ];

  if (user) {
    // Only standard users can create tickets
    if (user.role === 'user') {
      navItems.splice(3, 0, { name: "Create", href: "/tickets/new", icon: PlusCircle });
    }

    if (user.role === 'admin' || user.email === ADMIN_EMAIL) {
      navItems.push({ name: "Command", href: "/dashboard/admin", icon: Settings });
    }
    
    const isAgent = user.role !== 'user' && user.role !== 'admin';
    if (isAgent) {
      navItems.splice(1, 0, { name: "Mission", href: "/dashboard/agent", icon: UserCog });
    }
  }

  return (
    <Sidebar className="border-r border-white/5 bg-sidebar">
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-[1rem] glow-coral">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white">LENS</span>
            <span className="text-[10px] font-black text-primary tracking-widest uppercase -mt-1 opacity-80">Support</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className={cn(
                      "h-12 px-4 rounded-xl transition-all duration-300 group",
                      pathname === item.href 
                        ? "bg-primary text-white glow-coral" 
                        : "hover:bg-white/5 text-muted-foreground hover:text-white"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <item.icon className={cn(
                        "w-5 h-5",
                        pathname === item.href ? "text-white" : "group-hover:text-primary transition-colors"
                      )} />
                      <span className="font-bold text-sm">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 bg-white/[0.02] border-t border-white/5">
        <div className="flex flex-col gap-6">
          {user && (
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-primary/20 ring-4 ring-primary/5">
                  <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-4 border-sidebar flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-black text-white truncate leading-tight">{user.displayName || 'User'}</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-wider mt-0.5">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all font-bold"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Terminate Session</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


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
  Activity
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
    { name: "Support Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics & Trends", href: "/analytics", icon: BarChart3 },
    { name: "My Tickets", href: "/tickets", icon: TicketIcon },
    { name: "Submit New Ticket", href: "/tickets/new", icon: PlusCircle },
  ];

  // Admin and Agent restricted items
  if (user) {
    if (user.role === 'admin' || user.email === ADMIN_EMAIL) {
      navItems.push({ name: "System Command Center", href: "/dashboard/admin", icon: Settings });
    }
    
    if (user.role !== 'user') {
      navItems.splice(1, 0, { name: "Agent Dashboard", href: "/dashboard/agent", icon: UserCog });
    }
  }

  return (
    <Sidebar className="border-r shadow-sm">
      <SidebarHeader className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">SupportLens</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 font-semibold text-xs uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href} className="flex items-center gap-3 w-full group py-6">
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-6">
        <div className="flex flex-col gap-6">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <Avatar className="w-10 h-10 border-2 border-primary/10 shadow-sm">
                <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                <AvatarFallback className="bg-primary/5 text-primary">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">{user.displayName || 'User'}</span>
                <span className="text-[10px] font-black text-primary/70 truncate uppercase tracking-tighter">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

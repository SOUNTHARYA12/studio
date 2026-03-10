
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className,
  iconClassName
}: StatCardProps) {
  return (
    <Card className={cn("glass-card overflow-hidden transition-all duration-300 hover:border-primary/30", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={cn("p-2 rounded-xl bg-primary/10 border border-primary/20", iconClassName)}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "text-xs font-semibold mt-3 flex items-center gap-1",
            trend.isPositive ? "text-emerald-400" : "text-destructive"
          )}>
            <span>{trend.isPositive ? "+" : "-"}{trend.value}%</span>
            <span className="text-muted-foreground font-normal">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

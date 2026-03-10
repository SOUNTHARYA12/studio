"use client"

import * as React from "react"
import { LucideIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectionCardProps {
  title: string
  description: string
  icon: LucideIcon
  selected: boolean
  onClick: () => void
  className?: string
}

export function SelectionCard({
  title,
  description,
  icon: Icon,
  selected,
  onClick,
  className
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left w-full",
        "bg-slate-900/50 backdrop-blur-sm",
        selected 
          ? "border-primary shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)] bg-slate-800" 
          : "border-white/5 hover:border-white/10 hover:bg-slate-900",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors",
        selected ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400 group-hover:text-slate-300"
      )}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white text-sm leading-tight truncate">
          {title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
          {description}
        </p>
      </div>

      <div className={cn(
        "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
        selected 
          ? "bg-primary border-primary scale-110" 
          : "border-white/20 bg-transparent"
      )}>
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
      </div>
    </button>
  )
}

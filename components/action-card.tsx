"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface ActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  cta: string
  onClick?: () => void
}

export function ActionCard({ icon: Icon, title, description, cta, onClick }: ActionCardProps) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card p-6 card-premium hover:bg-gradient-to-br hover:from-card hover:to-primary/5">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2 text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="text-primary hover:bg-primary/10 font-medium transition-all duration-200"
      >
        {cta} →
      </Button>
    </div>
  )
}

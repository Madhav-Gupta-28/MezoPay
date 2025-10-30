interface StatCardProps {
  label: string
  value: string
  hint?: string
  accent?: boolean
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-4 transition-all duration-300 ${
        accent
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          : "bg-gradient-to-br from-muted/50 to-muted/25 border border-border/50"
      }`}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={`text-2xl font-bold mt-2 ${accent ? "text-primary" : "text-foreground"}`}
        suppressHydrationWarning
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
  )
}

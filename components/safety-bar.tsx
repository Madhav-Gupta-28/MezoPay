interface SafetyBarProps {
  percent: number
  band: "green" | "yellow" | "red"
}

export function SafetyBar({ percent, band }: SafetyBarProps) {
  const bandColors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  }

  const bandLabels = {
    green: "Safe",
    yellow: "Caution",
    red: "Risk",
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Safety</span>
        <span className="text-sm font-semibold text-foreground">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${bandColors[band]} transition-all duration-300`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{bandLabels[band]}</span>
    </div>
  )
}

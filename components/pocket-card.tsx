import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"

interface PocketCardProps {
  name: string
  balance: string
  dailyCap?: string
  emoji?: string
  spent?: string
  limit?: string
}

export function PocketCard({ name, balance, dailyCap, emoji, spent, limit }: PocketCardProps) {
  return (
    <div className="group rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-8 card-premium hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
            {emoji || "💼"}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">{name}</h3>
            {dailyCap && <p className="text-xs text-muted-foreground mt-1">Daily limit: {dailyCap}</p>}
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Balance */}
      <div className="mb-6">
        <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {balance}
        </p>
      </div>

      {/* Spending Progress */}
      {spent && limit && (
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Spent this month</span>
            <span className="font-semibold text-foreground">
              {spent} / {limit}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full" style={{ width: "65%" }} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 font-medium"
        >
          Move funds
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 font-medium"
        >
          Pay
        </Button>
      </div>
    </div>
  )
}

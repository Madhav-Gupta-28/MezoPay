import type { LucideIcon } from "lucide-react"

interface ActivityRowProps {
  icon: LucideIcon
  type: string
  counterparty: string
  amount: string
  status: "completed" | "pending" | "failed"
  explorerLink?: string
}

export function ActivityRow({ icon: Icon, type, counterparty, amount, status, explorerLink }: ActivityRowProps) {
  const statusColors = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{type}</p>
          <p className="text-sm text-muted-foreground">{counterparty}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-foreground">{amount}</p>
        </div>
          <div className={`text-xs px-2 py-1 rounded-md ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        {explorerLink && (

          <a href={explorerLink} className="text-primary hover:underline text-sm">
            View
          </a>
        )}
      </div>
    </div>
  )
}

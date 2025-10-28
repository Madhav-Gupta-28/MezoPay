"use client"

import { Navigation } from "@/components/navigation"
import { ActivityRow } from "@/components/activity-row"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, Coins, RefreshCw } from "lucide-react"

export default function ActivityPage() {
  const activities = [
    {
      icon: ArrowUpRight,
      type: "Mint",
      counterparty: "Deposited 0.05 BTC",
      amount: "+500 MUSD",
      status: "completed" as const,
      explorerLink: "#",
    },
    {
      icon: ArrowDownLeft,
      type: "Pay",
      counterparty: "Sent to merchant",
      amount: "-150 MUSD",
      status: "completed" as const,
      explorerLink: "#",
    },
    {
      icon: Coins,
      type: "Reward",
      counterparty: "Cashback earned",
      amount: "+25 MUSD",
      status: "completed" as const,
      explorerLink: "#",
    },
    {
      icon: RefreshCw,
      type: "Repay",
      counterparty: "Burned MUSD",
      amount: "-200 MUSD",
      status: "pending" as const,
      explorerLink: "#",
    },
    {
      icon: ArrowUpRight,
      type: "Receive",
      counterparty: "From friend",
      amount: "+75 MUSD",
      status: "completed" as const,
      explorerLink: "#",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground">Activity</h1>
          <p className="text-muted-foreground mt-2">Your recent transactions</p>
        </div>

        <Card className="p-8">
          {activities.length > 0 ? (
            <div>
              {activities.map((activity, index) => (
                <ActivityRow
                  key={index}
                  icon={activity.icon}
                  type={activity.type}
                  counterparty={activity.counterparty}
                  amount={activity.amount}
                  status={activity.status}
                  explorerLink={activity.explorerLink}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No activity yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

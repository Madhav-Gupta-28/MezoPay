"use client"

import { Navigation } from "@/components/navigation"
import { ActivityRow } from "@/components/activity-row"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, Coins, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { useBlockchainTransactions } from "@/hooks/use-blockchain-transactions"
import { Button } from "@/components/ui/button"

export default function ActivityPage() {
  const { transactions, loading, error, refetch } = useBlockchainTransactions()

  // Convert transactions to activity format
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'MINT':
      case 'RECEIVE':
        return ArrowUpRight
      case 'BURN':
      case 'TRANSFER':
        return ArrowDownLeft
      case 'CONTRACT_INTERACTION':
        return RefreshCw
      default:
        return Coins
    }
  }

  // Format activity status
  const getActivityStatus = (status: string): 'completed' | 'pending' | 'failed' => {
    switch (status) {
      case 'success':
        return 'completed'
      case 'reverted':
        return 'failed'
      default:
        return 'pending'
    }
  }

  // Format activity counterparty
  const getActivityCounterparty = (tx: any) => {
    const tokenSymbol = tx.tokenSymbol || 'Token'
    
    // If there's an operation classification, use it (especially for BTC transactions)
    if (tx.operation) {
      return tx.operation
    }
    
    switch (tx.type) {
      case 'MINT':
        return `${tokenSymbol} minted`
      case 'BURN':
        return `${tokenSymbol} burned`
      case 'TRANSFER':
        return `Sent to ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
      case 'RECEIVE':
        return `Received from ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
      case 'CONTRACT_INTERACTION':
        return 'Contract interaction'
      default:
        return 'Transaction'
    }
  }

  // Format transaction amount
  const formatAmount = (tx: any) => {
    const sign = ['MINT', 'RECEIVE'].includes(tx.type) ? '+' : '-'
    const tokenSymbol = tx.tokenSymbol || 'Token'
    return `${sign}${tx.formattedValue} ${tokenSymbol}`
  }

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  // Map transactions to activity format
  const activities = transactions.map((tx) => ({
    icon: getActivityIcon(tx.type),
    type: tx.operation || tx.type.charAt(0) + tx.type.slice(1).toLowerCase().replace('_', ' '),
    counterparty: getActivityCounterparty(tx),
    amount: formatAmount(tx),
    status: getActivityStatus(tx.status),
    explorerLink: `https://explorer.test.mezo.org/tx/${tx.hash}`,
  }))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground">Activity</h1>
          <p className="text-muted-foreground mt-2">Your recent transactions</p>
        </div>

        <Card className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
              <p className="text-muted-foreground mb-4">Failed to load transactions</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Try again
              </Button>
            </div>
          ) : activities.length > 0 ? (
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

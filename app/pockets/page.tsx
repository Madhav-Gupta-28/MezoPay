"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { PocketCard } from "@/components/pocket-card"
import { CreatePocketModal } from "@/components/modals/create-pocket-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Search, TrendingUp, Wallet } from "lucide-react"

export default function PocketsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for pockets
  const pockets = [
    {
      id: 1,
      name: "Travel",
      balance: "300 MUSD",
      emoji: "✈️",
      dailyCap: "50 MUSD",
      spent: "195 MUSD",
      limit: "300 MUSD",
    },
    {
      id: 2,
      name: "Rent",
      balance: "700 MUSD",
      emoji: "🏠",
      dailyCap: "100 MUSD",
      spent: "700 MUSD",
      limit: "700 MUSD",
    },
    {
      id: 3,
      name: "Groceries",
      balance: "120 MUSD",
      emoji: "🛒",
      dailyCap: "30 MUSD",
      spent: "80 MUSD",
      limit: "150 MUSD",
    },
    {
      id: 4,
      name: "Entertainment",
      balance: "150 MUSD",
      emoji: "🎬",
      dailyCap: "25 MUSD",
      spent: "45 MUSD",
      limit: "200 MUSD",
    },
  ]

  const filteredPockets = pockets.filter((pocket) => pocket.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const totalBalance = pockets.reduce((sum, pocket) => {
    const amount = Number.parseFloat(pocket.balance.replace(" MUSD", ""))
    return sum + amount
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Your Pockets</h1>
              <p className="text-lg text-muted-foreground">Organize and manage your MUSD spending</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200 w-full md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create Pocket
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6 border-border/50 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Total Balance</p>
                  <p className="text-3xl font-bold text-foreground">{totalBalance.toFixed(0)} MUSD</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Active Pockets</p>
                  <p className="text-3xl font-bold text-foreground">{pockets.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Monthly Spending</p>
                  <p className="text-3xl font-bold text-foreground">1,120 MUSD</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pockets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Pockets Grid */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {filteredPockets.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPockets.map((pocket) => (
                <PocketCard
                  key={pocket.id}
                  name={pocket.name}
                  balance={pocket.balance}
                  emoji={pocket.emoji}
                  dailyCap={pocket.dailyCap}
                  spent={pocket.spent}
                  limit={pocket.limit}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No pockets found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Create Pocket Modal */}
      <CreatePocketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { SafetyBar } from "@/components/safety-bar"
import { StatCard } from "@/components/stat-card"
import { ActionCard } from "@/components/action-card"
import { PocketCard } from "@/components/pocket-card"
import { QrPreview } from "@/components/qr-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Wallet, QrCode, ArrowUpRight, Shield, Coins, ScanLine, Zap } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { useRouter } from "next/navigation"

export default function Home() {
  const [qrAmount, setQrAmount] = useState("100")
  const { isConnected, balance } = useWallet()
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid gap-16 md:grid-cols-2 md:gap-20 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
                  Use <span className="text-gradient">Bitcoin</span> like money
                </h1>
                <p className="text-lg text-muted-foreground text-balance leading-relaxed max-w-md">
                  Spend in MUSD without selling your Bitcoin. Redeem anytime. Built on Mezo for self-custody and
                  fixed-rate borrowing.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/pockets')}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Explore Pockets
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/deposit')}
                  className="border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
                >
                  Deposit BTC
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/pay')}
                  className="gap-2 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
                >
                  <ScanLine className="h-4 w-4" />
                  Scan & Pay
                </Button>
              </div>
            </div>

            {/* Right Column - Wallet Snapshot */}
            <div className="rounded-2xl border border-border/50 bg-card p-8 card-premium space-y-8">
              <div className="space-y-4">
                <StatCard label="MUSD Balance" value={isConnected ? "1,240.00" : "Connect wallet"} accent />
                <StatCard 
                  label="BTC Collateral" 
                  value={isConnected ? (balance.formatted ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0 BTC") : "Connect wallet"} 
                  hint={isConnected ? "≈ $14,420" : ""} 
                />
              </div>

              <SafetyBar percent={isConnected ? 86 : 0} band={isConnected ? "green" : "red"} />

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/25 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group">
                  <ArrowUpRight className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">Pay</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/25 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group">
                  <ArrowUpRight className="h-6 w-6 text-primary rotate-180 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">Receive</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/25 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group">
                  <Coins className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-foreground">Repay</span>
                </button>
              </div>

              {/* Reassurance Row */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-4 border-t border-border/50">
                <span className="flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4 text-primary" />
                  Self-custody
                </span>
                <span className="text-border/50">•</span>
                <span className="font-medium">Fixed-rate borrow</span>
                <span className="text-border/50">•</span>
                <span className="font-medium">On-chain receipts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Quick Actions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to manage your Bitcoin and MUSD</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              icon={Wallet}
              title="Explore Pockets"
              description="Organize your MUSD across spending categories"
              cta="View pockets"
            />
            <ActionCard
              icon={Coins}
              title="Deposit BTC"
              description="Post BTC as collateral and mint MUSD"
              cta="Deposit now"
            />
            <ActionCard
              icon={Shield}
              title="Repay & Redeem"
              description="Burn MUSD to unlock your BTC"
              cta="Repay now"
            />
            <ActionCard
              icon={QrCode}
              title="Scan & Pay"
              description="Pay or request in MUSD instantly"
              cta="Open scanner"
            />
          </div>
        </div>
      </section>

      {/* Pockets Preview */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Your Pockets</h2>
              <p className="text-muted-foreground">Organize and track your spending</p>
            </div>
            <Button
              variant="outline"
              className="border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
            >
              Create Pocket
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PocketCard name="Travel" balance="300 MUSD" emoji="✈️" />
            <PocketCard name="Rent" balance="700 MUSD" emoji="🏠" />
            <PocketCard name="Groceries" balance="120 MUSD" emoji="🛒" />
          </div>
        </div>
      </section>

      {/* Scan & Pay */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Scan & Pay</h2>
            <p className="text-muted-foreground">Instant MUSD payments with on-chain receipts</p>
          </div>
          <div className="grid gap-12 md:grid-cols-2">
            {/* Generate */}
            <div className="space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Generate Payment QR</h3>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="amount" className="font-semibold text-foreground">
                    Amount (MUSD)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={qrAmount}
                    onChange={(e) => setQrAmount(e.target.value)}
                    placeholder="100"
                    className="mt-2 border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <Label htmlFor="memo" className="font-semibold text-foreground">
                    Memo (optional)
                  </Label>
                  <Input
                    id="memo"
                    type="text"
                    placeholder="Payment for..."
                    className="mt-2 border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* QR Preview */}
            <QrPreview amount={qrAmount} memo="Payment for services" />
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-primary/5 to-primary/0 rounded-xl border border-primary/20">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Instant Settlement</p>
                <p className="text-sm text-muted-foreground">
                  Pay or request in MUSD with instant settlement and on-chain receipts for transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Repay / Redeem */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Repay & Redeem</h2>
            <p className="text-muted-foreground">Burn MUSD to reduce debt and unlock your BTC</p>
          </div>
          <Card className="p-8 border-border/50 card-premium space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              Repaying burns MUSD to reduce your debt and unlock BTC. Your rewards are automatically applied first.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="repay-amount" className="font-semibold text-foreground">
                  Repay Amount (MUSD)
                </Label>
                <Input
                  id="repay-amount"
                  type="number"
                  placeholder="500"
                  className="mt-2 border-border/50 focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">We auto-apply your rewards first</p>
              </div>

              <div>
                <Label htmlFor="btc-unlock" className="font-semibold text-foreground">
                  Get my BTC back
                </Label>
                <Input
                  id="btc-unlock"
                  type="number"
                  placeholder="0.05 BTC"
                  className="mt-2 border-border/50 focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">Computed MUSD needed: 750 MUSD</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Repay Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 bg-transparent"
              >
                Calculate Needed MUSD
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Rewards */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <Card className="p-8 border-border/50 card-premium">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Rewards</h3>
                <p className="text-sm text-muted-foreground">Rewards used to offset interest this month</p>
              </div>
              <Button
                variant="ghost"
                className="text-primary hover:bg-primary/10 font-medium transition-all duration-200"
              >
                View activity →
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Cashback" value="45 MUSD" accent />
              <StatCard label="Merchant rewards" value="12 MUSD" accent />
              <StatCard label="MUSD Earn" value="8 MUSD" accent />
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-12 md:grid-cols-2 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70" />
                <span className="font-bold text-lg text-foreground">M-Pockets Pay</span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                Use Bitcoin like money. Spend in MUSD. Redeem anytime. Built on Mezo for self-custody and fixed-rate
                borrowing.
              </p>
            </div>
            <div className="flex justify-end gap-8">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                Security
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50">
            <p className="text-xs text-muted-foreground">© 2025 M-Pockets Pay. Built on Mezo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

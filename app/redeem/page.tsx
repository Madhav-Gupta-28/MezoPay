"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { SafetyBar } from "@/components/safety-bar"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RedeemModal } from "@/components/modals/redeem-modal"
import { ArrowRight, CheckCircle, Info, Lock, TrendingUp } from "lucide-react"

export default function RedeemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock data - in production, this would come from blockchain/API
  const lockedBtc = 0.215
  const musdDebt = 10240.0
  const btcPrice = 67000
  const collateralValue = lockedBtc * btcPrice
  const collateralizationRatio = (collateralValue / musdDebt) * 100
  const interestRate = 5
  const monthlyInterest = (musdDebt * (interestRate / 100)) / 12

  const recentRedemptions = [
    { id: 1, musd: "2,500", btc: "0.0373", date: "5 days ago", status: "confirmed" },
    { id: 2, musd: "1,000", btc: "0.0149", date: "1 week ago", status: "confirmed" },
    { id: 3, musd: "5,000", btc: "0.0746", date: "2 weeks ago", status: "confirmed" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Redeem BTC</h1>
            <p className="text-lg text-muted-foreground">
              Repay your MUSD debt and unlock your Bitcoin collateral. Redeem at any time with no penalties.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Redemption Card */}
            <div className="lg:col-span-2">
              <Card className="p-8 border-border/50 card-premium">
                <h2 className="text-2xl font-bold text-foreground mb-8">Your Current Position</h2>

                <div className="space-y-8">
                  {/* Position Summary */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-2">BTC Locked</p>
                      <p className="text-3xl font-bold text-foreground">{lockedBtc.toFixed(4)}</p>
                      <p className="text-sm text-muted-foreground mt-2">≈ ${collateralValue.toFixed(2)}</p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-2">MUSD Debt</p>
                      <p className="text-3xl font-bold text-foreground">{musdDebt.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Monthly interest: {monthlyInterest.toFixed(2)} MUSD
                      </p>
                    </div>
                  </div>

                  {/* Safety Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-foreground">Collateralization Ratio</p>
                      <p className="text-sm font-bold text-success">{collateralizationRatio.toFixed(1)}%</p>
                    </div>
                    <SafetyBar
                      percent={collateralizationRatio}
                      band={collateralizationRatio >= 150 ? "green" : "yellow"}
                    />
                  </div>

                  {/* Redemption Info */}
                  <div className="p-4 bg-info/5 rounded-lg border border-info/20 flex gap-3">
                    <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">How it works</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Repay your MUSD debt to unlock your BTC. You can redeem partially or fully at any time.
                      </p>
                    </div>
                  </div>

                  {/* Redeem Button */}
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium py-6 text-base"
                  >
                    Start Redemption
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <Card className="p-6 border-border/50 card-premium">
                <h3 className="font-semibold text-foreground mb-4">Key Metrics</h3>
                <div className="space-y-4">
                  <StatCard label="BTC Price" value="$67,000" hint="Current market" />
                  <StatCard label="Interest Rate" value="5% APY" hint="Fixed rate" />
                  <StatCard
                    label="Monthly Interest"
                    value={`${monthlyInterest.toFixed(2)} MUSD`}
                    hint="On current debt"
                  />
                </div>
              </Card>

              {/* Benefits */}
              <Card className="p-6 border-border/50 card-premium space-y-4">
                <div className="flex gap-3">
                  <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">No Penalties</p>
                    <p className="text-xs text-muted-foreground">Redeem anytime without fees</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Partial Redemption</p>
                    <p className="text-xs text-muted-foreground">Redeem any amount you want</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Instant Settlement</p>
                    <p className="text-xs text-muted-foreground">Get your BTC immediately</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

     

      {/* FAQ Section */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">Can I redeem partially?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can redeem any amount of BTC by repaying the corresponding MUSD. Your remaining position will
                be adjusted accordingly.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">Are there any fees?</h3>
              <p className="text-sm text-muted-foreground">
                No redemption fees. You only pay the interest on your outstanding MUSD debt until you fully redeem.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">How long does redemption take?</h3>
              <p className="text-sm text-muted-foreground">
                Redemptions are instant. Your BTC is transferred to your wallet immediately after confirmation.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">What if I can't repay?</h3>
              <p className="text-sm text-muted-foreground">
                If your collateralization drops below 120%, you'll need to deposit more BTC or repay MUSD to maintain
                safety.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lockedBtc={lockedBtc}
        musdDebt={musdDebt}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { SafetyBar } from "@/components/safety-bar"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Info, Lock, Zap } from "lucide-react"

export default function DepositPage() {
  const [btcAmount, setBtcAmount] = useState("")
  const [musdAmount, setMusdAmount] = useState("")
  const [step, setStep] = useState(1)

  const btcPrice = 67000
  const collateralizationRatio = 150
  const interestRate = 5

  // Calculate values
  const collateralValue = btcAmount ? Number.parseFloat(btcAmount) * btcPrice : 0
  const maxMusd = btcAmount ? Number.parseFloat(btcAmount) * (btcPrice / (collateralizationRatio / 100)) : 0
  const actualMusd = musdAmount ? Number.parseFloat(musdAmount) : 0
  const currentCollateralization = actualMusd > 0 ? (collateralValue / actualMusd) * 100 : 0

  const recentDeposits = [
    { id: 1, btc: "0.05", musd: "2,500", date: "2 hours ago", status: "confirmed" },
    { id: 2, btc: "0.1", musd: "5,000", date: "1 day ago", status: "confirmed" },
    { id: 3, btc: "0.02", musd: "1,000", date: "3 days ago", status: "confirmed" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Deposit & Mint</h1>
            <p className="text-lg text-muted-foreground">
              Post your Bitcoin as collateral and mint MUSD at a fixed 5% APY. Your BTC stays in your self-custody
              wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Deposit Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 border-border/50 card-premium">
                {/* Step Indicator */}
                <div className="flex gap-2 mb-8">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                          s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s}
                      </div>
                      {s < 3 && <div className={`h-1 w-8 transition-all ${s < step ? "bg-primary" : "bg-muted"}`} />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Deposit BTC */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-6">Step 1: Deposit BTC</h2>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="btc-amount" className="font-semibold text-foreground">
                            Amount (BTC)
                          </Label>
                          <Input
                            id="btc-amount"
                            type="number"
                            value={btcAmount}
                            onChange={(e) => setBtcAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.0001"
                            className="mt-2 border-border/50 focus:border-primary/50 text-lg"
                          />
                          <p className="text-xs text-muted-foreground mt-2">Available: 0.5 BTC</p>
                        </div>

                        {btcAmount && (
                          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Collateral Value</span>
                              <span className="font-semibold text-foreground">${collateralValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Max MUSD Available</span>
                              <span className="font-semibold text-foreground">{maxMusd.toFixed(2)} MUSD</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      disabled={!btcAmount || Number.parseFloat(btcAmount) <= 0}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Mint MUSD */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-6">Step 2: Mint MUSD</h2>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between">
                            <Label htmlFor="musd-amount" className="font-semibold text-foreground">
                              Amount (MUSD)
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              Max available: {maxMusd.toFixed(2)} MUSD
                            </div>
                          </div>
                          <div className="relative mt-2">
                            <Input
                              id="musd-amount"
                              type="number"
                              value={musdAmount}
                              onChange={(e) => setMusdAmount(e.target.value)}
                              placeholder="0.00"
                              className="border-border/50 focus:border-primary/50 text-lg pr-[180px]"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setMusdAmount((maxMusd * 0.25).toFixed(2))}
                                className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                              >
                                25%
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setMusdAmount((maxMusd * 0.5).toFixed(2))}
                                className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                              >
                                50%
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setMusdAmount(maxMusd.toFixed(2))}
                                className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary font-semibold"
                              >
                                MAX
                              </Button>
                            </div>
                          </div>
                        </div>

                        {musdAmount && (
                          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Collateralization Ratio</span>
                              <span
                                className={`font-semibold ${currentCollateralization >= 150 ? "text-success" : "text-warning"}`}
                              >
                                {currentCollateralization.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Interest Rate</span>
                              <span className="font-semibold text-foreground">{interestRate}% APY</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Monthly Interest</span>
                              <span className="font-semibold text-foreground">
                                {((actualMusd * (interestRate / 100)) / 12).toFixed(2)} MUSD
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5 bg-transparent"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!musdAmount || Number.parseFloat(musdAmount) <= 0}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Review
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-6">Step 3: Review & Confirm</h2>

                      <div className="space-y-4">
                        {/* Summary Card */}
                        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                          <h3 className="font-semibold text-foreground mb-4">Transaction Summary</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Deposit</span>
                              <span className="font-semibold text-foreground">{btcAmount} BTC</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Collateral Value</span>
                              <span className="font-semibold text-foreground">${collateralValue.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-primary/20 pt-3 flex justify-between">
                              <span className="text-muted-foreground">Mint</span>
                              <span className="font-semibold text-foreground">{musdAmount} MUSD</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Collateralization</span>
                              <span className="font-semibold text-success">{currentCollateralization.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Monthly Interest</span>
                              <span className="font-semibold text-foreground">
                                {((actualMusd * (interestRate / 100)) / 12).toFixed(2)} MUSD
                              </span>
                            </div>
                          </div>
                        </Card>

                        {/* Safety Info */}
                        <div className="p-4 bg-success/5 rounded-lg border border-success/20 flex gap-3">
                          <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Self-Custody</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your BTC remains in your self-custody wallet. You maintain full control.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setStep(2)}
                        variant="outline"
                        className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5 bg-transparent"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          setStep(1)
                          setBtcAmount("")
                          setMusdAmount("")
                        }}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
                      >
                        Confirm & Deposit
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Position */}
              <Card className="p-6 border-border/50 card-premium">
                <h3 className="font-semibold text-foreground mb-4">Your Position</h3>
                <div className="space-y-4">
                  <StatCard label="BTC Collateral" value="0.2150 BTC" hint="≈ $14,420" />
                  <StatCard label="MUSD Minted" value="1,240.00" />
                  <SafetyBar percent={86} band="green" />
                </div>
              </Card>

              {/* Key Info */}
              <Card className="p-6 border-border/50 card-premium space-y-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Fixed Rate</p>
                    <p className="text-xs text-muted-foreground">5% APY on all MUSD minted</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Self-Custody</p>
                    <p className="text-xs text-muted-foreground">Your BTC stays in your wallet</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Instant Mint</p>
                    <p className="text-xs text-muted-foreground">Get MUSD immediately</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Deposits */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Deposits</h2>
          <div className="space-y-3">
            {recentDeposits.map((deposit) => (
              <Card key={deposit.id} className="p-4 border-border/50 card-premium flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {deposit.btc} BTC → {deposit.musd} MUSD
                    </p>
                    <p className="text-xs text-muted-foreground">{deposit.date}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-success">Confirmed</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">What is collateralization?</h3>
              <p className="text-sm text-muted-foreground">
                Collateralization is the ratio of your BTC collateral value to the MUSD you mint. A 150% ratio means
                your BTC is worth 1.5x the MUSD you minted.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">Can I withdraw my BTC anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can redeem your BTC by burning MUSD. Your BTC is always in your self-custody wallet.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">What happens if my collateral drops?</h3>
              <p className="text-sm text-muted-foreground">
                If your collateralization ratio drops below 120%, you'll need to deposit more BTC or repay MUSD to
                maintain safety.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">Is there a minimum deposit?</h3>
              <p className="text-sm text-muted-foreground">
                The minimum deposit is 0.001 BTC. There's no maximum limit on how much you can deposit.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

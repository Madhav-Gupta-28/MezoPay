"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface CreatePocketModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePocketModal({ isOpen, onClose }: CreatePocketModalProps) {
  const [pocketName, setPocketName] = useState("")
  const [btcAmount, setBtcAmount] = useState("")
  const [musdAmount, setMusdAmount] = useState("")
  const [step, setStep] = useState(1)

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleCreate = () => {
    // Handle pocket creation
    onClose()
    setStep(1)
    setPocketName("")
    setBtcAmount("")
    setMusdAmount("")
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 card-premium">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Create Pocket</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {/* Step 1: Pocket Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="pocket-name" className="font-semibold text-foreground">
                  Pocket Name
                </Label>
                <Input
                  id="pocket-name"
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  placeholder="e.g., Travel, Rent, Groceries"
                  className="mt-2 border-border/50 focus:border-primary/50"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Give your pocket a memorable name to organize your spending
              </p>
            </div>
          )}

          {/* Step 2: Deposit BTC */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="btc-amount" className="font-semibold text-foreground">
                  Deposit BTC
                </Label>
                <Input
                  id="btc-amount"
                  type="number"
                  value={btcAmount}
                  onChange={(e) => setBtcAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.0001"
                  className="mt-2 border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-2">Available: 0.5 BTC</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Collateral Value:</span> $
                  {btcAmount ? (Number.parseFloat(btcAmount) * 67000).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Mint MUSD */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="musd-amount" className="font-semibold text-foreground">
                  Mint MUSD
                </Label>
                <Input
                  id="musd-amount"
                  type="number"
                  value={musdAmount}
                  onChange={(e) => setMusdAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-2 border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Max available: {btcAmount ? (Number.parseFloat(btcAmount) * 50000).toFixed(2) : "0.00"} MUSD
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Collateralization:</span> 150%
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Interest Rate:</span> 5% APY
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={step === 3 ? handleCreate : handleNext}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
            >
              {step === 3 ? "Create Pocket" : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

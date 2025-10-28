"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [btcAmount, setBtcAmount] = useState("")
  const [musdAmount, setMusdAmount] = useState("")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 card-premium">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Deposit & Mint</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-6">
            {/* BTC Deposit */}
            <div>
              <Label htmlFor="deposit-btc" className="font-semibold text-foreground">
                Deposit BTC
              </Label>
              <Input
                id="deposit-btc"
                type="number"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                className="mt-2 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-2">Available: 0.5 BTC</p>
            </div>

            {/* MUSD Mint */}
            <div>
              <Label htmlFor="mint-musd" className="font-semibold text-foreground">
                Mint MUSD
              </Label>
              <Input
                id="mint-musd"
                type="number"
                value={musdAmount}
                onChange={(e) => setMusdAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max: {btcAmount ? (Number.parseFloat(btcAmount) * 50000).toFixed(2) : "0.00"} MUSD
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateral Value</span>
                <span className="font-semibold text-foreground">
                  ${btcAmount ? (Number.parseFloat(btcAmount) * 67000).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateralization</span>
                <span className="font-semibold text-foreground">150%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-semibold text-foreground">5% APY</span>
              </div>
            </div>
          </div>

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
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
            >
              Deposit & Mint
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

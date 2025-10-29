"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRedeem } from "@/hooks/useRedeem"
import { useAccount } from "wagmi"
import { toast } from "sonner"

interface RedeemModalProps {
  isOpen: boolean
  onClose: () => void
  lockedBtc: number
  musdDebt: number
}

export function RedeemModal({ isOpen, onClose, lockedBtc, musdDebt }: RedeemModalProps) {
  const [musdRepay, setMusdRepay] = useState("")
  const { redeem, isPending, isConfirming, isConfirmed, error, hash } = useRedeem()
  const { isConnected } = useAccount()
 
  const btcToReceive = useMemo(() => {
    if (!musdRepay) return 0
    const repay = Number.parseFloat(musdRepay)
    if (repay <= 0) return 0
    return repay / (musdDebt / lockedBtc)
  }, [musdRepay, musdDebt, lockedBtc])

  if (!isOpen) return null

  const handleRedeem = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet")
      return
    }
    if (!musdRepay || Number.parseFloat(musdRepay) <= 0) {
      toast.error("Enter MUSD amount to repay")
      return
    }

    try {
      await redeem({ musdRepay })
      toast.success("Transaction submitted! Your BTC will be returned.", {
        description: "Check your wallet in a moment"
      })
      setMusdRepay("")
      onClose()
    } catch (e: any) {
      console.error("Redemption error:", e)
      toast.error("Transaction failed", { description: e?.message?.slice(0, 200) || "Unknown error" })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 card-premium">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Redeem BTC</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Locked BTC Info */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">BTC Locked</p>
              <p className="text-2xl font-bold text-foreground">{lockedBtc.toFixed(4)} BTC</p>
              <p className="text-xs text-muted-foreground mt-2">≈ ${(lockedBtc * 67000).toFixed(2)}</p>
            </div>

            {/* MUSD Repay Input */}
            <div>
              <Label htmlFor="redeem-musd" className="font-semibold text-foreground">
                Repay MUSD
              </Label>
              <Input
                id="redeem-musd"
                type="number"
                value={musdRepay}
                onChange={(e) => setMusdRepay(e.target.value)}
                placeholder="0.00"
                className="mt-2 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-2">Total debt: {musdDebt.toFixed(2)} MUSD</p>
            </div>

            {/* BTC to Receive */}
            {musdRepay && (
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">You will receive</p>
                <p className="text-2xl font-bold text-success">{btcToReceive.toFixed(4)} BTC</p>
                <p className="text-xs text-muted-foreground mt-2">≈ ${(btcToReceive * 67000).toFixed(2)}</p>
              </div>
            )}

            {/* Summary */}
            {musdRepay && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining MUSD Debt</span>
                  <span className="font-semibold text-foreground">
                    {(musdDebt - Number.parseFloat(musdRepay)).toFixed(2)} MUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining BTC Locked</span>
                  <span className="font-semibold text-foreground">{(lockedBtc - btcToReceive).toFixed(4)} BTC</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5 bg-transparent"
              disabled={isPending || isConfirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={!musdRepay || Number.parseFloat(musdRepay) <= 0 || isPending || isConfirming}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending || isConfirming ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  Repay & Get BTC Back
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

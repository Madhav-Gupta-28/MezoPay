"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useMintMusd } from "@/hooks/useMintMusd"
import { useAccount } from "wagmi"
import { toast } from "sonner"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [btcAmount, setBtcAmount] = useState("")
  const [musdAmount, setMusdAmount] = useState("")
  const { address, isConnected } = useAccount()
  const { mintMusd, isPending, isConfirming, isConfirmed, error, hash } = useMintMusd()

  // Calculate collateralization ratio
  const calculateCollRatio = () => {
    if (!btcAmount || !musdAmount) return "0"
    const btcValue = parseFloat(btcAmount) * 67000 // Assuming BTC price ~$67k
    const musdValue = parseFloat(musdAmount)
    if (musdValue === 0) return "0"
    return ((btcValue / musdValue) * 100).toFixed(0)
  }

  const collRatio = calculateCollRatio()
  const isHealthyRatio = parseFloat(collRatio) >= 150

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Successfully minted mUSD!", {
        description: `Deposited ${btcAmount} BTC and minted ${musdAmount} mUSD`,
      })
      // Reset form
      setBtcAmount("")
      setMusdAmount("")
      // Close modal after a brief delay
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }, [isConfirmed, btcAmount, musdAmount, onClose])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Transaction failed", {
        description: error.message || "An error occurred while minting mUSD",
      })
    }
  }, [error])

  const handleMint = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!btcAmount || !musdAmount) {
      toast.error("Please enter both BTC and mUSD amounts")
      return
    }

    if (parseFloat(btcAmount) <= 0 || parseFloat(musdAmount) <= 0) {
      toast.error("Amounts must be greater than zero")
      return
    }

    if (parseFloat(collRatio) < 150) {
      toast.error("Collateralization ratio must be at least 150%")
      return
    }

    try {
      await mintMusd({
        btcCollateral: btcAmount,
        musdToMint: musdAmount,
      })
    } catch (err) {
      console.error("Mint error:", err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 card-premium">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Deposit & Mint</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              disabled={isPending || isConfirming}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Transaction Status */}
          {isConfirmed && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-500">Transaction Confirmed!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  mUSD has been minted successfully
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">Transaction Failed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error.message?.slice(0, 100)}...
                </p>
              </div>
            </div>
          )}

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
                disabled={isPending || isConfirming}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {isConnected ? "Enter BTC amount to deposit" : "Connect wallet to see balance"}
              </p>
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
                disabled={isPending || isConfirming}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max: {btcAmount ? ((parseFloat(btcAmount) * 67000) / 1.5).toFixed(2) : "0.00"} MUSD (at 150% collateral)
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateral Value</span>
                <span className="font-semibold text-foreground">
                  ${btcAmount ? (parseFloat(btcAmount) * 67000).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collateralization</span>
                <span className={`font-semibold ${isHealthyRatio ? "text-green-500" : "text-red-500"}`}>
                  {collRatio}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-semibold text-foreground">~5% APY</span>
              </div>
              {!isHealthyRatio && musdAmount && (
                <p className="text-xs text-red-500">
                  ⚠️ Collateralization must be at least 150%
                </p>
              )}
            </div>

            {/* Transaction Hash */}
            {hash && (
              <div className="text-xs">
                <p className="text-muted-foreground mb-1">Transaction Hash:</p>
                <a
                  href={`https://explorer.test.mezo.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {hash}
                </a>
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
              onClick={handleMint}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
              disabled={isPending || isConfirming || !isConnected || !isHealthyRatio}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? "Confirming..." : "Processing..."}
                </>
              ) : (
                "Deposit & Mint"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

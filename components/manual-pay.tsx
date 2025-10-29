"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowRight, Send } from "lucide-react"

interface ManualPayProps {
  onSubmit: (data: {
    address: string
    amount: string
    memo: string
  }) => void
}

export function ManualPay({ onSubmit }: ManualPayProps) {
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")

  const [addressError, setAddressError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!address.trim()) {
      setAddressError("Address is required")
      return
    }
    
    // Example address validation for MUSD addresses (replace with actual validation logic)
    if (!address.startsWith("musd:") && !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setAddressError("Invalid MUSD address format")
      return
    }
    
    setAddressError("")
    onSubmit({ address, amount, memo })
  }

  return (
    <Card className="p-6 border-border/50 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="address" className="font-semibold text-foreground">
            Recipient Address
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="musd: address or 0x..."
            className="mt-2 border-border/50 focus:border-primary/50"
          />
          {addressError && (
            <p className="text-xs text-red-500 mt-1">{addressError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Enter a valid MUSD address to send funds
          </p>
        </div>

        <div>
          <Label htmlFor="manual-amount" className="font-semibold text-foreground">
            Amount (MUSD)
          </Label>
          <Input
            id="manual-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-2 border-border/50 focus:border-primary/50"
          />
        </div>

        <div>
          <Label htmlFor="manual-memo" className="font-semibold text-foreground">
            Memo (optional)
          </Label>
          <Input
            id="manual-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Payment for..."
            className="mt-2 border-border/50 focus:border-primary/50"
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-4 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium gap-2"
        >
          <Send className="h-4 w-4" />
          Send Payment
        </Button>
      </form>
    </Card>
  )
}

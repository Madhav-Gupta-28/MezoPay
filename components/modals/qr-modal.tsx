"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Copy } from "lucide-react"

interface QrModalProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  memo?: string
}

export function QrModal({ isOpen, onClose, amount, memo }: QrModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 card-premium">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Payment QR Code</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-6">
            <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-primary/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">QR Code</p>
                <p className="text-3xl font-bold text-foreground mt-4">{amount} MUSD</p>
                {memo && <p className="text-xs text-muted-foreground mt-2">{memo}</p>}
              </div>
            </div>

            {/* Copy Button */}
            <Button
              onClick={() => navigator.clipboard.writeText(`musd:${amount}`)}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Pay Link
            </Button>

            {/* Close Button */}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-border/50 hover:border-primary/30 hover:bg-primary/5 bg-transparent"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

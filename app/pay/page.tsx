"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { QrModal } from "@/components/modals/qr-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ScanLine, QrCode, Send } from "lucide-react"

export default function PayPage() {
  const [amount, setAmount] = useState("100")
  const [memo, setMemo] = useState("")
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-3">Scan & Pay</h1>
          <p className="text-lg text-muted-foreground">
            Pay or request in MUSD with instant settlement and on-chain receipts
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Generate Payment Section */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Generate Payment</h2>
              <Card className="p-8 border-border/50 card-premium space-y-6">
                <div>
                  <Label htmlFor="amount" className="font-semibold text-foreground text-base">
                    Amount (MUSD)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="mt-3 border-border/50 focus:border-primary/50 text-lg py-6"
                  />
                </div>

                <div>
                  <Label htmlFor="memo" className="font-semibold text-foreground text-base">
                    Memo (optional)
                  </Label>
                  <Input
                    id="memo"
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Payment for..."
                    className="mt-3 border-border/50 focus:border-primary/50 text-lg py-6"
                  />
                </div>

                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Total Amount:</span> {amount} MUSD
                  </p>
                </div>

                <Button
                  onClick={() => setIsQrModalOpen(true)}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200 gap-2 py-6"
                >
                  <QrCode className="h-5 w-5" />
                  Generate QR Code
                </Button>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="w-full border-border/50 hover:border-primary/30 hover:bg-primary/5 py-6 font-medium bg-transparent"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Payment
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border/50 hover:border-primary/30 hover:bg-primary/5 py-6 font-medium bg-transparent"
                >
                  <ScanLine className="h-4 w-4 mr-2" />
                  View Payment History
                </Button>
              </div>
            </div>
          </div>

          {/* Scan Section */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Scan to Pay</h2>
              <Card className="p-8 border-border/50 card-premium space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-full aspect-square max-w-sm bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-border/50">
                    <div className="text-center">
                      <ScanLine className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground font-medium">Scanner frame</p>
                      <p className="text-sm text-muted-foreground mt-2">Point camera at QR code</p>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-border/50 hover:border-primary/30 hover:bg-primary/5 gap-2 py-6 font-medium bg-transparent"
                  >
                    <ScanLine className="h-5 w-5" />
                    Open Camera
                  </Button>
                </div>

                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Tip:</span> Scan any MUSD payment QR code to pay
                    instantly
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <QrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} amount={amount} memo={memo} />
    </div>
  )
}

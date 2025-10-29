"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { QrModal } from "@/components/modals/qr-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScanLine, QrCode, Send, CreditCard, AlertCircle, Check } from "lucide-react"
import { QrScannerComponent } from "@/components/qr-scanner"
import { ManualPay } from "@/components/manual-pay"
import { useTransferMusd } from "@/hooks/useTransferMusd"
import { useAccount } from "wagmi"
import { toast } from "sonner"

export default function PayPage() {
  const [amount, setAmount] = useState("100")
  const [memo, setMemo] = useState("")
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState("")
  const { transfer, isPending, isConfirming, isConfirmed, error } = useTransferMusd()
  const { address, isConnected } = useAccount()

  const handleScan = async (data: string) => {
    console.log("Scan result received:", data)
    setScanResult(data)
    try {
      // Parse the QR code data
      let qrData;
      
      if (data.startsWith("musd:pay?to=")) {
        // Our simpler format
        const url = new URL(data.replace("musd:pay", "https://example.com"));
        qrData = {
          to: url.searchParams.get("to") || "",
          amount: url.searchParams.get("amount") || "0",
          memo: url.searchParams.get("memo") || ""
        }
      } else if (data.startsWith("musd:pay?data=")) {
        // Our legacy format
        qrData = JSON.parse(decodeURIComponent(data.replace("musd:pay?data=", "")))
      } else if (data.startsWith("bitcoin:") || data.startsWith("musd:")) {
        // Standard cryptocurrency URI format
        const url = new URL(data);
        qrData = {
          to: data.split(":")[1].split("?")[0],
          amount: url.searchParams.get("amount") || "1",
          memo: url.searchParams.get("message") || "",
        }
      } else {
        // Try to parse as JSON
        try {
          qrData = JSON.parse(data);
        } catch {
          // Assume it's just an address
          qrData = { 
            to: data,
            amount: "1", 
            memo: "Payment to address", 
          }
        }
      }
      
      if (!qrData.to || !qrData.amount) {
        throw new Error("Invalid QR: missing recipient or amount")
      }

      // Execute on-chain transfer
      await transfer(qrData.to as `0x${string}`, String(qrData.amount))
      setStatusMessage(`Sent ${qrData.amount} MUSD to ${qrData.to}`)
      setPaymentStatus('success')
      toast.success("Payment sent")
    } catch (error) {
      console.error("Failed to parse QR data:", error)
      setStatusMessage(error instanceof Error ? error.message : "Payment failed")
      setPaymentStatus('error')
      toast.error("Payment failed")
    }
  }

  const handleManualPayment = async (data: { address: string; amount: string; memo: string }) => {
    try {
      await transfer(data.address as `0x${string}`, data.amount)
      setStatusMessage(`Payment of ${data.amount} MUSD to ${data.address} successful!`)
      setPaymentStatus('success')
      toast.success("Payment sent")
    } catch (e: any) {
      setStatusMessage(e?.message || "Payment failed")
      setPaymentStatus('error')
      toast.error("Payment failed")
    }
  }

  const resetStatus = () => {
    setPaymentStatus('idle')
    setStatusMessage("")
    setScanResult(null)
  }

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

                <div className="p-4 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Total Amount:</span> {amount} MUSD
                  </p>
                </div>

                <Button
                  onClick={() => setIsQrModalOpen(true)}
                  size="lg"
                  className="w-full bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200 gap-2 py-6"
                  disabled={!isConnected}
                >
                  <QrCode className="h-5 w-5" />
                  Generate QR Code
                </Button>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-2">Connect your wallet to include your address in the QR.</p>
                )}
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

          {/* Pay Section with Tabs */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Pay</h2>
              
              {paymentStatus !== 'idle' ? (
                <Card className="p-8 border-border/50 card-premium space-y-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    {paymentStatus === 'success' ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold">Payment Successful</h3>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold">Payment Failed</h3>
                      </>
                    )}
                    <p className="text-muted-foreground">{statusMessage}</p>
                    <Button onClick={resetStatus} className="mt-4">
                      Back to Payment Options
                    </Button>
                  </div>
                </Card>
              ) : (
                <Tabs defaultValue="scan" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="scan" className="text-base py-3">
                      <ScanLine className="h-4 w-4 mr-2" />
                      Scan QR
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="text-base py-3">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay to Address
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="scan" className="mt-0">
                    <Card className="border-border/50 card-premium">
                      <div className="p-6">
                        <QrScannerComponent 
                          onScan={handleScan}
                          onError={(err) => console.error("Scanner error:", err)}
                        />
                        
                        <div className="mt-4 p-4 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Tip:</span> Scan any MUSD payment QR code to pay instantly
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-0">
                    <ManualPay onSubmit={handleManualPayment} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>

      <QrModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} amount={amount} memo={memo} />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Copy, Check, Download } from "lucide-react"
import QRCode from "react-qr-code"
import { useAccount } from "wagmi"

interface QrModalProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  memo?: string
}

export function QrModal({ isOpen, onClose, amount, memo }: QrModalProps) {
  const [copied, setCopied] = useState(false)
  const { address } = useAccount()

  if (!isOpen) return null

  // Create a simpler QR code that will be easier for scanners to read
  const paymentData = {
    amount,
    memo: memo || "",
    to: address || "",
    timestamp: new Date().toISOString(),
    currency: "MUSD"
  }
  
  // Use a simpler format that's easier to scan
  // Build params safely to avoid empty to=
  const params = new URLSearchParams()
  if (address) params.set("to", address)
  params.set("amount", amount)
  if (memo) params.set("memo", memo)
  const qrValue = `musd:pay?${params.toString()}`

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // Create canvas from the QR code
    const canvas = document.querySelector('#qr-code-modal canvas') as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `MUSD-${amount}-payment-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

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
            <div id="qr-code-modal" className="w-64 h-64 bg-white rounded-lg flex items-center justify-center p-2 border-2 border-primary/20">
              <QRCode
                size={240}
                value={qrValue}
                viewBox="0 0 256 256"
              />
            </div>
            
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{amount} MUSD</p>
              {memo && <p className="text-sm text-muted-foreground mt-1">{memo}</p>}
            </div>

            <div className="flex gap-3 w-full">
              {/* Copy Button */}
              <Button
                onClick={handleCopy}
                className="flex-1 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                className="flex-1 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

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

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import QRCode from "react-qr-code"
import { useAccount } from "wagmi"

interface QrPreviewProps {
  amount: string
  memo?: string
}

export function QrPreview({ amount, memo }: QrPreviewProps) {
  const [copied, setCopied] = useState(false)
  const { address } = useAccount()
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

  return (
    <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4">
      <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center p-2">
        <QRCode
          size={180}
          value={qrValue}
          viewBox="0 0 256 256"
        />
      </div>
      <div className="text-center mt-2">
        <p className="text-lg font-bold text-foreground">{amount} MUSD</p>
        {memo && <p className="text-xs text-muted-foreground mt-1">{memo}</p>}
      </div>
      <Button 
        onClick={handleCopy}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Pay Link
          </>
        )}
      </Button>
    </div>
  )
}

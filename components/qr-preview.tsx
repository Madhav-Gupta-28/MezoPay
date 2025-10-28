import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface QrPreviewProps {
  amount: string
  memo?: string
}

export function QrPreview({ amount, memo }: QrPreviewProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-4">
      <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">QR Code</p>
          <p className="text-2xl font-bold text-foreground mt-2">{amount} MUSD</p>
          {memo && <p className="text-xs text-muted-foreground mt-2">{memo}</p>}
        </div>
      </div>
      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
        <Copy className="h-4 w-4" />
        Copy Pay Link
      </Button>
    </div>
  )
}

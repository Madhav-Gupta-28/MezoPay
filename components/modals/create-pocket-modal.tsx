"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X, Loader2, Plane, Home, ShoppingCart, Gamepad2, Car, Utensils, Landmark, Plus } from "lucide-react"
import { useMintMusd } from "@/hooks/useMintMusd"
import { useAccount, useBalance } from "wagmi"
import { toast } from "sonner"
import { mezoTestnet } from "@/lib/config"

interface CreatePocketModalProps {
  isOpen: boolean
  onClose: () => void
}

// Constants
const MIN_MUSD_MINT_VALUE = 1800;

// Define preset pocket options
const POCKET_PRESETS = [
  { name: "Travel", emoji: "✈️", icon: Plane },
  { name: "Rent", emoji: "🏠", icon: Home },
  { name: "Groceries", emoji: "🛒", icon: ShoppingCart },
  { name: "Gaming", emoji: "🎮", icon: Gamepad2 },
  { name: "Transportation", emoji: "🚗", icon: Car },
  { name: "Dining", emoji: "🍽️", icon: Utensils },
  { name: "Savings", emoji: "🏦", icon: Landmark },
  { name: "Custom", emoji: "➕", icon: Plus }
]

export function CreatePocketModal({ isOpen, onClose }: CreatePocketModalProps) {
  const [pocketName, setPocketName] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("✈️")
  const [customMode, setCustomMode] = useState(false)
  const [btcAmount, setBtcAmount] = useState("")
  const [musdAmount, setMusdAmount] = useState("")
  const [step, setStep] = useState(1)
  
  // Get account and balance information
  const { address, isConnected } = useAccount()
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: mezoTestnet.id,
  })
  
  // Parse balance to number, default to 0 if unavailable
  const availableBtcBalance = balanceData?.formatted 
    ? parseFloat(balanceData.formatted) 
    : 0
    
  const { mintMusd, isPending, isConfirming, isConfirmed, error } = useMintMusd()
  
  const selectPreset = (preset: typeof POCKET_PRESETS[number]) => {
    if (preset.name === "Custom") {
      setCustomMode(true)
      setPocketName("")
    } else {
      setCustomMode(false)
      setPocketName(preset.name)
      setSelectedEmoji(preset.emoji)
    }
  }

  if (!isOpen) return null

  // Calculate the minimum BTC amount needed for the minimum MUSD
  const getBtcEquivalent = (musdAmount: number) => {
    // At 150% collateralization, 1 BTC = 67000 USD / 1.5 ≈ 44,666 MUSD
    // So for 1800 MUSD, we need 1800 * 1.5 / 67000 BTC ≈ 0.04 BTC
    return (musdAmount * 1.5) / 67000;
  }

  // Calculate max MUSD that can be minted from BTC
  const getMaxMusd = (btcAmount: number) => {
    return (btcAmount * 67000) / 1.5;
  }

  // Validation checks for each step
  const isStep1Valid = () => pocketName.trim() !== ""
  
  const isStep2Valid = () => {
    // Require enough BTC to mint at least the minimum MUSD
    const minBtcRequired = getBtcEquivalent(MIN_MUSD_MINT_VALUE);
    return btcAmount && parseFloat(btcAmount) >= minBtcRequired;
  }
  
  const isStep3Valid = () => {
    if (!isConnected || isPending || isConfirming) return false;
    
    const musdValue = musdAmount && parseFloat(musdAmount) > 0 
      ? parseFloat(musdAmount) 
      : getMaxMusd(parseFloat(btcAmount || "0"));
      
    return musdValue >= MIN_MUSD_MINT_VALUE;
  }
  
  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!pocketName || pocketName.trim() === "") {
      toast.error("Please enter a pocket name")
      return
    }

    if (!btcAmount || parseFloat(btcAmount) <= 0) {
      toast.error("Enter a valid BTC amount")
      return
    }

    // If user didn't specify mUSD, derive it at 150% collateralization
    let derivedMusd = musdAmount && parseFloat(musdAmount) > 0
      ? musdAmount
      : getMaxMusd(parseFloat(btcAmount)).toFixed(2)
      
    // Ensure minimum MUSD amount
    if (parseFloat(derivedMusd) < MIN_MUSD_MINT_VALUE) {
      toast.error(`Minimum MUSD mint value is ${MIN_MUSD_MINT_VALUE}`)
      return
    }

    try {
      // Store pocket data (we might need a separate API call for this in a real implementation)
      const pocketEmoji = customMode ? "💰" : selectedEmoji;
      console.log(`Creating pocket: ${pocketName} with emoji ${pocketEmoji}`);
      
      await mintMusd({
        btcCollateral: btcAmount,
        musdToMint: derivedMusd
      })

      toast.success(`${pocketName} pocket created`)
      onClose()
      setStep(1)
      setPocketName("")
      setSelectedEmoji("✈️")
      setCustomMode(false)
      setBtcAmount("")
      setMusdAmount("")
    } catch (e: any) {
      toast.error("Mint failed", { description: e?.message?.slice(0, 140) })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 card-premium">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Create Pocket</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {/* Step 1: Pocket Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="font-semibold text-foreground mb-2 block">
                  Select Pocket Type
                </Label>
                
                {/* Pocket presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {POCKET_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => selectPreset(preset)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200
                        ${pocketName === preset.name || (preset.name === "Custom" && customMode)
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-muted/30 border border-border/50 hover:border-primary/20 hover:bg-primary/5"
                        }`}
                      type="button"
                    >
                      <span className="text-2xl">
                        {preset.emoji}
                      </span>
                      <span className="text-xs font-medium">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Custom name input (shown always or when custom selected) */}
                {(customMode || pocketName) && (
                  <div>
                    <Label htmlFor="pocket-name" className="font-semibold text-foreground">
                      {customMode ? "Custom Pocket Name" : "Pocket Name"}
                    </Label>
                    <div className="relative mt-2">
                      {!customMode && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                          {selectedEmoji}
                        </div>
                      )}
                      <Input
                        id="pocket-name"
                        value={pocketName}
                        onChange={(e) => setPocketName(e.target.value)}
                        placeholder={customMode ? "Enter custom pocket name" : pocketName}
                        className={`border-border/50 focus:border-primary/50 ${!customMode ? "pl-10" : ""}`}
                      />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Give your pocket a memorable name to organize your spending
              </p>
            </div>
          )}

          {/* Step 2: Deposit BTC */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="btc-amount" className="font-semibold text-foreground">
                    Deposit BTC
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Available: {isBalanceLoading ? '...' : availableBtcBalance.toFixed(4)} BTC
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Min required:</span> {getBtcEquivalent(MIN_MUSD_MINT_VALUE).toFixed(4)} BTC (for {MIN_MUSD_MINT_VALUE} MUSD)
                </div>
                <div className="relative mt-2">
                  <Input
                    id="btc-amount"
                    type="number"
                    value={btcAmount}
                    onChange={(e) => setBtcAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    className="border-border/50 focus:border-primary/50 pr-[180px]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Ensure the amount is enough for minimum MUSD
                        const minBtc = getBtcEquivalent(MIN_MUSD_MINT_VALUE);
                        const amount = Math.max(availableBtcBalance * 0.25, minBtc);
                        setBtcAmount(amount.toFixed(4));
                      }}
                      className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const available = availableBtcBalance;
                        const minBtc = getBtcEquivalent(MIN_MUSD_MINT_VALUE);
                        const amount = Math.max(available * 0.5, minBtc);
                        setBtcAmount(amount.toFixed(4));
                      }}
                      className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBtcAmount(availableBtcBalance.toFixed(4))}
                      className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary font-semibold"
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Collateral Value:</span> $
                  {btcAmount ? (Number.parseFloat(btcAmount) * 67000).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Mint MUSD */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="musd-amount" className="font-semibold text-foreground">
                    Mint MUSD
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Max available: {btcAmount ? getMaxMusd(Number.parseFloat(btcAmount)).toFixed(2) : "0.00"} MUSD
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Minimum mint:</span> {MIN_MUSD_MINT_VALUE} MUSD
                </div>
                <div className="relative mt-2">
                  <Input
                    id="musd-amount"
                    type="number"
                    value={musdAmount}
                    onChange={(e) => setMusdAmount(e.target.value)}
                    placeholder="0.00"
                    className="border-border/50 focus:border-primary/50 pr-[180px]"
                  />
                  {btcAmount && Number.parseFloat(btcAmount) > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                          onClick={() => {
                          const maxAmount = getMaxMusd(Number.parseFloat(btcAmount));
                          const amount = Math.max(maxAmount * 0.25, MIN_MUSD_MINT_VALUE);
                          setMusdAmount(amount.toFixed(2));
                        }}
                        className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        25%
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const maxAmount = getMaxMusd(Number.parseFloat(btcAmount));
                          const amount = Math.max(maxAmount * 0.5, MIN_MUSD_MINT_VALUE);
                          setMusdAmount(amount.toFixed(2));
                        }}
                        className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        50%
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const maxAmount = getMaxMusd(Number.parseFloat(btcAmount));
                          setMusdAmount(maxAmount.toFixed(2));
                        }}
                        className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary font-semibold"
                      >
                        MAX
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Collateralization:</span> 150%
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Interest Rate:</span> 5% APY
                </p>
              </div>
            </div>
          )}

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
              onClick={step === 3 ? handleCreate : handleNext}
              className="flex-1 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
              disabled={
                (step === 1 && !isStep1Valid()) ||
                (step === 2 && !isStep2Valid()) ||
                (step === 3 && !isStep3Valid())
              }
            >
              {step === 3 ? (
                isPending || isConfirming ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Create Pocket"
                )
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

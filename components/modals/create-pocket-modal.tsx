"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X, Loader2, Plane, Home, ShoppingCart, Gamepad2, Car, Utensils, Landmark, Plus, CheckCircle } from "lucide-react"
import { useMintMusd } from "@/hooks/useMintMusd"
import { useAccount, useBalance } from "wagmi"
import { toast } from "sonner"
import { mezoTestnet } from "@/lib/config"
import { createPublicClient, http, formatUnits, parseUnits } from "viem"
import { ADDRESSES } from "@/lib/addresses"
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis"
import { TROVE_MANAGER_ABI } from "@/lib/troveManagerAbi"

interface CreatePocketModalProps {
  isOpen: boolean
  onClose: () => void
}

// Fallbacks; real values fetched on-chain when connected
const MIN_MUSD_MINT_VALUE_FALLBACK = 1800;

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
  const [mounted, setMounted] = useState(false)
  
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
    
  const { mintMusd, hash, isPending, isConfirming, isConfirmed, error } = useMintMusd()

  // On-chain params & derived limits
  const [minNetDebt, setMinNetDebt] = useState<number>(MIN_MUSD_MINT_VALUE_FALLBACK)
  const [borrowingRate, setBorrowingRate] = useState<number>(0.001)
  const [price, setPrice] = useState<number>(67000)
  const [CCR, setCCR] = useState<bigint>(BigInt(0))
  const [MCR, setMCR] = useState<bigint>(BigInt(0))
  const [gasComp, setGasComp] = useState<bigint>(BigInt(0))
  const [oldDebt, setOldDebt] = useState<bigint>(BigInt(0))
  const [oldColl, setOldColl] = useState<bigint>(BigInt(0))
  const [storedMaxCap, setStoredMaxCap] = useState<bigint>(BigInt(0))
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false)
  const [loadingLimits, setLoadingLimits] = useState<boolean>(false)
  
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

  // Do not early-return before hooks; we'll return null later after hooks

  // Calculate the minimum BTC amount needed for the given MUSD (150% collateral)
  const getBtcEquivalent = (musdAmount: number) => {
    return price > 0 ? (musdAmount * 1.5) / price : 0
  }

  // Max MUSD that can be minted from BTC at 150%, ignoring capacity (used for display only if no wallet)
  const getMaxMusdNaive = (btc: number) => (btc * price) / 1.5

  // Fetch on-chain params when open/connected
  useEffect(() => {
    if (!isOpen || !isConnected) return
    const run = async () => {
      try {
        setLoadingLimits(true)
        const pc = createPublicClient({ chain: mezoTestnet, transport: http() })
        const [minND, br, priceFeedAddr, ccr, mcr, gcomp] = await Promise.all([
          pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "minNetDebt" }) as Promise<bigint>,
          pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "borrowingRate" }) as Promise<bigint>,
          pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "priceFeed" }) as Promise<`0x${string}`>,
          pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "CCR" }) as Promise<bigint>,
          pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "MCR" }) as Promise<bigint>,
          pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "MUSD_GAS_COMPENSATION" }) as Promise<bigint>,
        ])
        const px = (await pc.readContract({ address: priceFeedAddr, abi: [
          { type: "function", stateMutability: "nonpayable", name: "fetchPrice", inputs: [], outputs: [{name: "", type: "uint256"}] },
        ] as const, functionName: "fetchPrice" })) as bigint

        const [debt, coll, maxCap] = await Promise.all([
          address ? (pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveDebt", args: [address] }) as Promise<bigint>) : Promise.resolve(BigInt(0)),
          address ? (pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveColl", args: [address] }) as Promise<bigint>) : Promise.resolve(BigInt(0)),
          address ? (pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveMaxBorrowingCapacity", args: [address] }) as Promise<bigint>) : Promise.resolve(BigInt(0)),
        ])

        const recovery = (await pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "checkRecoveryMode", args: [px] })) as boolean

        setMinNetDebt(Number(formatUnits(minND, 18)))
        setBorrowingRate(Number(formatUnits(br, 18)))
        setPrice(Number(formatUnits(px, 18)))
        setCCR(ccr)
        setMCR(mcr)
        setGasComp(gcomp)
        setStoredMaxCap(maxCap)
        setOldDebt(debt)
        setOldColl(coll)
        setIsRecoveryMode(recovery)
      } catch (e) {
        console.error("Failed to load on-chain limits", e)
      } finally {
        setLoadingLimits(false)
      }
    }
    run()
  }, [isOpen, isConnected, address])

  // Derived precise max mint based on added BTC
  const maxAvailableMint = useMemo(() => {
    try {
      const addedColl = btcAmount ? parseUnits(btcAmount, 18) : BigInt(0)
      const collPlus = oldColl + addedColl
      if (collPlus === BigInt(0)) return 0
      const priceBI = parseUnits(String(price), 18)

      // For existing troves: use stored maxBorrowingCapacity (doesn't auto-update when adding collateral)
      // For new troves: calculate based on new collateral
      let maxCapToUse: bigint
      if (oldDebt > BigInt(0)) {
        // Existing trove: use stored capacity (matches hook check)
        maxCapToUse = storedMaxCap
      } else {
        // New trove: calculate from collateral
        const numerator = collPlus * priceBI
        const denom = BigInt(110) * BigInt(1e16)
        maxCapToUse = numerator / denom
      }

      const capSub = oldDebt > BigInt(0) ? oldDebt : gasComp
      const remainingCap = maxCapToUse > capSub ? maxCapToUse - capSub : BigInt(0)
      if (remainingCap <= BigInt(0)) return 0
      const divider = isRecoveryMode ? 1 : (1 + borrowingRate)
      const mintMaxCapacity = Number(formatUnits(remainingCap, 18)) / divider

      // ICR bound
      const threshold = isRecoveryMode ? CCR : MCR
      if (threshold === BigInt(0)) return Math.max(0, mintMaxCapacity)
      const oldICR = oldDebt > BigInt(0) ? ((oldColl * priceBI) / oldDebt) : BigInt(0)
      const requiredThreshold = isRecoveryMode && oldICR > threshold ? oldICR : threshold
      const maxDebtByICR = (collPlus * priceBI) / requiredThreshold
      let addDebtAllowed = maxDebtByICR > oldDebt ? maxDebtByICR - oldDebt : BigInt(0)
      if (oldDebt === BigInt(0)) {
        addDebtAllowed = maxDebtByICR > gasComp ? maxDebtByICR - gasComp : BigInt(0)
      }
      const mintMaxICR = Number(formatUnits(addDebtAllowed, 18)) / divider
      
      // minNetDebt constraint ONLY applies to new troves (openTrove), NOT to existing troves (adjustTrove)
      // The contract's adjustTrove does NOT enforce minNetDebt when increasing debt
      if (oldDebt > BigInt(0)) {
        // Existing trove: no minNetDebt constraint, just return capacity/ICR limit
        return Math.max(0, Math.min(mintMaxCapacity, mintMaxICR))
      } else {
        // New trove: enforce minNetDebt requirement
        // Hook checks: netDebt = debtAmount + fee >= minNetDebt
        // So: debtAmount >= minNetDebt - fee = minNetDebt - (debtAmount * borrowingRate)
        // Solving: debtAmount >= minNetDebt / (1 + borrowingRate) in normal mode
        // For recovery mode: debtAmount >= minNetDebt (no fee)
        const minMintRequired = isRecoveryMode 
          ? minNetDebt 
          : minNetDebt / (1 + borrowingRate)
        
        const maxByCapacityAndICR = Math.min(mintMaxCapacity, mintMaxICR)
        // If capacity allows less than minNetDebt requirement, it's impossible to mint
        if (maxByCapacityAndICR < minMintRequired) {
          return 0 // Can't mint - capacity too low for minNetDebt
        }
        // Return the higher of: capacity/ICR limit OR minNetDebt requirement
        return Math.max(minMintRequired, maxByCapacityAndICR)
      }
    } catch {
      return 0
    }
  }, [btcAmount, oldColl, oldDebt, storedMaxCap, price, borrowingRate, isRecoveryMode, CCR, MCR, gasComp, minNetDebt])
  
  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert oldDebt to number for safe comparisons (avoid BigInt hydration issues)
  const hasExistingDebt = mounted && oldDebt > BigInt(0);

  // Move to step 4 when transaction is pending (user approved in wallet)
  useEffect(() => {
    if (isPending && step === 3) {
      setStep(4);
    }
  }, [isPending, step]);

  const isStep1Valid = () => pocketName.trim() !== ""
  
  const isStep2Valid = () => {
    // Just check if BTC amount is entered and valid
    return btcAmount && parseFloat(btcAmount) > 0;
  }
  
  const isStep3Valid = () => {
    if (!isConnected || isPending || isConfirming) return false;
    
    // Require explicit input for MUSD amount
    if (!musdAmount || musdAmount.trim() === "") {
      return false;
    }
    
    const musdValue = parseFloat(musdAmount);
    if (isNaN(musdValue)) return false;
    // For new trove: must be >= minNetDebt
    if (oldDebt === BigInt(0)) return musdValue >= minNetDebt;
    // Existing trove: must be <= maxAvailableMint
    return musdValue > 0 && musdValue <= maxAvailableMint;
  }
  
  // Step 4 is the transaction confirmation/success step
  const isStep4Valid = () => true; // Always valid as it's just showing results
  
  const handleNext = () => {
    // Only advance to next step if valid
    if (step === 1 && isStep1Valid()) setStep(2);
    else if (step === 2 && isStep2Valid()) setStep(3);
    // Step 3 goes to handleCreate which will advance to step 4
    // Step 4 closes the modal when done
  }
  
  const resetModal = () => {
    setStep(1);
    setPocketName("");
    setSelectedEmoji("✈️");
    setCustomMode(false);
    setBtcAmount("");
    setMusdAmount("");
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

    // We now require an explicit MUSD amount (per the isStep3Valid check)
    if (!musdAmount || musdAmount.trim() === "" || isNaN(parseFloat(musdAmount))) {
      toast.error("Please enter a valid MUSD amount")
      return
    }
    
    let derivedMusd = musdAmount
      
    const musdVal = parseFloat(derivedMusd)
    if (oldDebt === BigInt(0)) {
      if (musdVal < minNetDebt) {
        toast.error(`Minimum MUSD mint value is ${minNetDebt}`)
        return
      }
    } else {
      if (musdVal > maxAvailableMint) {
        toast.error(`Exceeds your current max capacity. Max: ${maxAvailableMint.toFixed(2)} MUSD`)
        return
      }
    }

    // Store pocket data (we might need a separate API call for this in a real implementation)
    const pocketEmoji = customMode ? "💰" : selectedEmoji;
    console.log(`Creating pocket: ${pocketName} with emoji ${pocketEmoji}`);
    
    try {
      // Mint the MUSD (this will trigger wallet popup)
      // Only move to step 4 after transaction is initiated (when isPending becomes true)
      await mintMusd({
        btcCollateral: btcAmount,
        musdToMint: derivedMusd
      });
      
      // If we get here, transaction was initiated successfully
      // Move to step 4 to show confirmation screen
      setStep(4);
      
      // The hash will be automatically available from the useMintMusd hook
      // We don't need to manually set it anymore
      
      toast.success(`${pocketName} pocket created`);
      
      // Don't close modal or reset state here - we'll stay on step 4
    } catch (e: any) {
      // Check if it's a user rejection (user denied transaction)
      const errorMessage = e?.message || String(e);
      const isUserRejection = 
        errorMessage.toLowerCase().includes('user rejected') ||
        errorMessage.toLowerCase().includes('user denied') ||
        errorMessage.toLowerCase().includes('user cancelled') ||
        errorMessage.toLowerCase().includes('rejected') ||
        errorMessage.toLowerCase().includes('denied') ||
        e?.code === 4001 || // MetaMask user rejection code
        e?.code === 'ACTION_REJECTED';
      
      if (isUserRejection) {
        // User rejected - silently stay on step 3, no error toast
        // Don't change step, we're already on step 3
        return;
      }
      
      // Validation error or other error before transaction - show toast, stay on step 3
      toast.error("Mint failed", { description: errorMessage.slice(0, 140) });
      // Stay on step 3, don't move to step 4
    }
  }

  // Now safe to conditional render after all hooks are declared
  if (!isOpen || !mounted) return null

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

          {/* Progress Steps */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`h-1 w-8 transition-all ${s < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
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
                  <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                    Available: {!mounted ? '...' : isBalanceLoading ? '...' : availableBtcBalance.toFixed(4)} BTC
                  </div>
                </div>
                {mounted && !hasExistingDebt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Note:</span> If you are minting for the first time, you need at least {getBtcEquivalent(minNetDebt).toFixed(4)} BTC (equivalent to {minNetDebt.toFixed(2)} MUSD)
                  </div>
                )}
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
                        setBtcAmount((availableBtcBalance * 0.25).toFixed(4));
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
                        setBtcAmount((availableBtcBalance * 0.5).toFixed(4));
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
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                  <span className="font-semibold text-foreground">Collateral Value:</span> $
                  {!mounted ? "0.00" : btcAmount ? (Number.parseFloat(btcAmount) * price).toFixed(2) : "0.00"}
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
                      <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {!mounted
                        ? "Calculating limits..."
                        : loadingLimits
                        ? "Calculating limits..."
                        : hasExistingDebt
                        ? maxAvailableMint === 0
                          ? <span className="text-red-500">Max available: 0 MUSD (increase BTC to meet minimum)</span>
                          : `Max available: ${maxAvailableMint.toFixed(2)} MUSD`
                        : `Max (at 150%): ${btcAmount ? getMaxMusdNaive(Number.parseFloat(btcAmount)).toFixed(2) : "0.00"} MUSD`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex justify-between" suppressHydrationWarning>
                    <span><span className="font-medium">Minimum mint:</span> {!mounted ? "0.00" : minNetDebt.toFixed(2)} MUSD</span>
                    <span className="text-primary cursor-pointer" onClick={() => {
                      const maxMusd = oldDebt > BigInt(0) ? maxAvailableMint : (btcAmount ? getMaxMusdNaive(Number.parseFloat(btcAmount)) : 0)
                      const defaultAmount = Math.max(maxMusd * 0.75, minNetDebt);
                      setMusdAmount(defaultAmount.toFixed(2));
                    }}>
                      Suggest amount
                    </span>
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
                  {mounted && btcAmount && Number.parseFloat(btcAmount) > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1" suppressHydrationWarning>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                          onClick={() => {
                          const maxAmount = oldDebt > BigInt(0) ? maxAvailableMint : getMaxMusdNaive(Number.parseFloat(btcAmount));
                          const amount = Math.max(maxAmount * 0.25, minNetDebt);
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
                          const maxAmount = oldDebt > BigInt(0) ? maxAvailableMint : getMaxMusdNaive(Number.parseFloat(btcAmount));
                          const amount = Math.max(maxAmount * 0.5, minNetDebt);
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
                          const maxAmount = oldDebt > BigInt(0) ? maxAvailableMint : getMaxMusdNaive(Number.parseFloat(btcAmount));
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

          {/* Step 4: Transaction Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-4">
                {isPending || isConfirming ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {isPending ? "Waiting for confirmation" : "Processing transaction"}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {isPending 
                        ? "Please confirm this transaction in your wallet..."
                        : "Your transaction is being processed on the blockchain..."}
                    </p>
                  </>
                ) : isConfirmed ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Pocket Created!</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Your {pocketName} pocket has been created successfully.
                    </p>

                    <div className="w-full mt-8 p-4 rounded-lg border border-border/50 bg-muted/30">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{selectedEmoji}</span>
                          <span className="font-bold">{pocketName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium">{musdAmount || getMaxMusdNaive(parseFloat(btcAmount)).toFixed(2)} MUSD</span>
                        </div>
                        {hash && (
                          <div className="pt-2 mt-2 border-t border-border/50">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Transaction</span>
                              <a 
                                href={`https://explorer.test.mezo.org/tx/${hash}`} 
                                target="_blank"
                                rel="noopener noreferrer" 
                                className="font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                View on Explorer
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : error ? (
                  // Error state - only show if there's an actual error from the hook
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                      <X className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Transaction Failed</h3>
                    <p className="text-sm text-red-500 text-center mb-2">
                      {error.message || "There was an error creating your pocket."}
                    </p>
                    <Button 
                      onClick={() => {
                        setStep(3);
                      }} 
                      variant="outline"
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </>
                ) : (
                  // Default state - waiting for transaction to start
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Preparing Transaction</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Please wait...
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step < 4 ? (
              // Steps 1-3: Show Cancel/Next buttons
              <>
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
              </>
            ) : (
              // Step 4: Show Done button if confirmed, otherwise just Close
              <Button
                onClick={() => {
                  // Close the modal and reset
                  resetModal();
                  onClose();
                }}
                className="w-full bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium"
                disabled={isPending || isConfirming}
              >
                {isConfirmed ? "Done" : "Close"}
              </Button>
            )}
          
          </div>
        </div>
      </Card>
    </div>
  )
}

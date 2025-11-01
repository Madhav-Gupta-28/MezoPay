"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useMintMusd } from "@/hooks/useMintMusd"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { createPublicClient, http, parseUnits, formatUnits } from "viem"
import { ADDRESSES } from "@/lib/addresses"
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis"
import { TROVE_MANAGER_ABI } from "@/lib/troveManagerAbi"
import { mezoTestnet } from "@/lib/config"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [btcAmount, setBtcAmount] = useState("")
  const [musdAmount, setMusdAmount] = useState("")
  const { address, isConnected } = useAccount()
  const { mintMusd, isPending, isConfirming, isConfirmed, error, hash } = useMintMusd()

  // On-chain derived limits and flags
  const [minNetDebt, setMinNetDebt] = useState<number>(1800)
  const [borrowingRate, setBorrowingRate] = useState<number>(0.001) // 0.1%
  const [price, setPrice] = useState<number>(67000)
  const [CCR, setCCR] = useState<bigint>(BigInt(0))
  const [MCR, setMCR] = useState<bigint>(BigInt(0))
  const [gasComp, setGasComp] = useState<bigint>(BigInt(0))
  const [oldDebt, setOldDebt] = useState<bigint>(BigInt(0))
  const [oldColl, setOldColl] = useState<bigint>(BigInt(0))
  const [storedMaxCap, setStoredMaxCap] = useState<bigint>(BigInt(0))
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false)
  const [loadingLimits, setLoadingLimits] = useState<boolean>(false)

  // Calculate collateralization ratio
  const calculateCollRatio = () => {
    if (!btcAmount || !musdAmount) return "0"
    const btcValue = parseFloat(btcAmount) * price
    const musdValue = parseFloat(musdAmount)
    if (musdValue === 0) return "0"
    return ((btcValue / musdValue) * 100).toFixed(0)
  }

  const collRatio = calculateCollRatio()
  const isHealthyRatio = parseFloat(collRatio) >= 150

  // Fetch limits when modal opens or wallet connects
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
        console.error("Failed loading limits", e)
      } finally {
        setLoadingLimits(false)
      }
    }
    run()
  }, [isOpen, isConnected, address])

  // Compute precise max available, depending on whether user has a trove
  const maxAvailableMint = useMemo(() => {
    try {
      const addedColl = btcAmount ? parseUnits(btcAmount, 18) : BigInt(0)
      const collPlus = oldColl + addedColl
      if (collPlus === BigInt(0)) return 0
      // max borrowing capacity formula: (coll * price) / (110 * 1e16)
      const priceBI = parseUnits(String(price), 18) // convert back to 1e18

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
      // In normal mode, netDebtChange = mint + fee = mint * (1 + rate). In recovery, fee = 0.
      const divider = isRecoveryMode ? 1 : (1 + borrowingRate)
      const mintMaxByCapacity = Number(formatUnits(remainingCap, 18)) / divider

      // ICR constraint
      const threshold = isRecoveryMode ? CCR : MCR
      if (threshold === BigInt(0)) return Math.max(0, mintMaxByCapacity)
      // oldICR for improvement requirement in recovery
      const oldICR = oldDebt > BigInt(0) ? ((oldColl * priceBI) / oldDebt) : BigInt(0)
      const requiredThreshold = isRecoveryMode && oldICR > threshold ? oldICR : threshold
      const maxDebtByICR = (collPlus * priceBI) / requiredThreshold
      let addDebtAllowed = maxDebtByICR > oldDebt ? maxDebtByICR - oldDebt : BigInt(0)
      // For new trove, account for gas compensation
      if (oldDebt === BigInt(0)) {
        addDebtAllowed = maxDebtByICR > gasComp ? maxDebtByICR - gasComp : BigInt(0)
      }
      const mintMaxByICR = Number(formatUnits(addDebtAllowed, 18)) / divider
      
      // minNetDebt constraint ONLY applies to new troves (openTrove), NOT to existing troves (adjustTrove)
      // The contract's adjustTrove does NOT enforce minNetDebt when increasing debt
      if (oldDebt > BigInt(0)) {
        // Existing trove: no minNetDebt constraint, just return capacity/ICR limit
        return Math.max(0, Math.min(mintMaxByCapacity, mintMaxByICR))
      } else {
        // New trove: enforce minNetDebt requirement
        // Hook checks: netDebt = debtAmount + fee >= minNetDebt
        // So: debtAmount >= minNetDebt / (1 + borrowingRate) in normal mode
        // For recovery mode: debtAmount >= minNetDebt (no fee)
        const minMintRequired = isRecoveryMode 
          ? minNetDebt 
          : minNetDebt / (1 + borrowingRate)
        
        const maxByCapacityAndICR = Math.min(mintMaxByCapacity, mintMaxByICR)
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

  // Clamp user input above max
  useEffect(() => {
    if (!musdAmount) return
    const val = Number(musdAmount)
    if (Number.isFinite(val) && maxAvailableMint > 0 && val > maxAvailableMint) {
      setMusdAmount(maxAvailableMint.toFixed(2))
      toast.info("Amount reduced to your current max borrowing capacity")
    }
  }, [musdAmount, maxAvailableMint])

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
                {loadingLimits
                  ? "Calculating limits..."
                  : oldDebt > BigInt(0)
                  ? maxAvailableMint === 0
                    ? <span className="text-red-500">Max available: 0 MUSD (increase BTC to meet minimum)</span>
                    : `Max available: ${maxAvailableMint.toFixed(2)} MUSD`
                  : `Minimum mint: ${minNetDebt.toFixed(2)} MUSD`}
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

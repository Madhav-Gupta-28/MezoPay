"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { SafetyBar } from "@/components/safety-bar"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RedeemModal } from "@/components/modals/redeem-modal"
import { ArrowRight, CheckCircle, Info, Lock, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { useDebtInfo } from "@/hooks/useDebtInfo"
import { useApproveMusd } from "@/hooks/useApproveMusd"
import { useCloseTrove } from "@/hooks/useCloseTrove"
import { toast } from "sonner"
import { useAccount, useReadContract } from "wagmi"
import { createPublicClient, http, formatUnits, parseUnits } from "viem"
import { ADDRESSES } from "@/lib/addresses"
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis"
import { TROVE_MANAGER_ABI } from "@/lib/troveManagerAbi"
import { mezoTestnet } from "@/lib/config"

// Minimal PriceFeed ABI
const PRICE_FEED_ABI = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "fetchPrice",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

export default function RedeemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [btcPrice, setBtcPrice] = useState<number>(67000) // Fallback value
  const [interestRate, setInterestRate] = useState<number>(5) // Fallback value (APY)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  
  // Fetch real debt info from blockchain
  const { debtInfo, hasTrove, isLoading, isError, refetch, isConnected } = useDebtInfo()
  const { address } = useAccount()
  
  // Get priceFeed address from BorrowerOperations
  const { data: priceFeedAddress } = useReadContract({
    address: ADDRESSES.BORROWER_OPERATIONS,
    abi: BORROWER_OPERATIONS_ABI,
    functionName: "priceFeed",
  })
  
  // Get interest rate for user's trove if they have one
  const { data: troveInterestRate } = useReadContract({
    address: ADDRESSES.TROVE_MANAGER,
    abi: TROVE_MANAGER_ABI,
    functionName: "getTroveInterestRate",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && hasTrove,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  })
  
  // Fetch BTC price and interest rate from contracts
  useEffect(() => {
    if (!isConnected) return
    
    const fetchMetrics = async () => {
      try {
        setIsLoadingMetrics(true)
        const pc = createPublicClient({ chain: mezoTestnet, transport: http() })
        
        // Fetch BTC price from priceFeed
        if (priceFeedAddress) {
          try {
            const price = await pc.readContract({
              address: priceFeedAddress as `0x${string}`,
              abi: PRICE_FEED_ABI,
              functionName: "fetchPrice",
            }) as bigint
            setBtcPrice(Number(formatUnits(price, 18)))
          } catch (error) {
            console.error("Error fetching BTC price:", error)
            // Keep fallback value
          }
        }
        
        // Fetch borrowing rate (this is the borrowing fee, not interest rate)
        // For interest rate, we use the trove-specific rate if available
        try {
          const borrowingRate = await pc.readContract({
            address: ADDRESSES.BORROWER_OPERATIONS,
            abi: BORROWER_OPERATIONS_ABI,
            functionName: "borrowingRate",
          }) as bigint
          
          // Convert interest rate from basis points to percentage (if stored as uint16)
          // Or use troveInterestRate if available
          if (troveInterestRate !== undefined && troveInterestRate !== null) {
            // Interest rate is typically stored as a uint16 representing basis points
            // For example, 500 = 5% APY
            const rateValue = Number(troveInterestRate)
            setInterestRate(rateValue / 100) // Convert from basis points to percentage
          } else {
            // Fallback: use borrowing rate as approximation (though it's not the same)
            // Or calculate from interest accrued
            const brValue = Number(formatUnits(borrowingRate, 18)) * 100
            // Borrowing rate is typically very small (0.1%), so we use a default
            setInterestRate(5) // Default APY if we can't determine
          }
        } catch (error) {
          console.error("Error fetching interest rate:", error)
          // Keep fallback value
        }
      } catch (error) {
        console.error("Error fetching metrics:", error)
        // Keep fallback values on error
      } finally {
        setIsLoadingMetrics(false)
      }
    }
    
    fetchMetrics()
    // Refetch metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [isConnected, priceFeedAddress, troveInterestRate])
  const { 
    approve, 
    isPending: isApproving, 
    isConfirming: isApprovingConfirm, 
    isConfirmed: isApproved,
    hash: approveHash,
    hasApproval,
    currentAllowance,
    refetchAllowance 
  } = useApproveMusd()
  const { 
    closeTrove, 
    isPending: isClosing, 
    isConfirming: isClosingConfirm, 
    isConfirmed: isClosed,
    hash: closeHash
  } = useCloseTrove()

  // Real data from blockchain
  const lockedBtc = debtInfo?.collateralFormatted || 0
  const principal = debtInfo?.principalFormatted || 0
  const interest = debtInfo?.interestFormatted || 0
  const musdDebt = debtInfo?.totalDebtFormatted || 0
  const collateralValue = lockedBtc * btcPrice
  const collateralizationRatio = musdDebt > 0 ? (collateralValue / musdDebt) * 100 : 0
  const monthlyInterest = (musdDebt * (interestRate / 100)) / 12
  
  // Check if approval is sufficient
  const totalDebtWei = debtInfo?.totalDebt || BigInt(0)
  const isApprovalSufficient = hasApproval(totalDebtWei)
  
  // Debug logging
  useEffect(() => {
    if (isConnected && hasTrove) {
      console.log('Approval Debug:', {
        totalDebtWei: totalDebtWei.toString(),
        currentAllowance: currentAllowance?.toString() || 'undefined',
        isApprovalSufficient,
        isApproved,
        hasEnoughAllowance: currentAllowance ? currentAllowance >= totalDebtWei : false
      })
    }
  }, [totalDebtWei, isApprovalSufficient, isApproved, isConnected, hasTrove, currentAllowance])
  
  // Handlers for approve and close
  const handleApprove = async () => {
    try {
      // Approve max uint256 to handle interest accrual
      // This prevents issues where debt increases between approval and closing
      const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
      await approve(MAX_UINT256)
      toast.success("Approval submitted!", {
        description: "Waiting for confirmation..."
      })
    } catch (error: any) {
      console.error("Approval error:", error)
      toast.error("Approval failed", {
        description: error?.message?.slice(0, 200) || "Unknown error"
      })
    }
  }
  
  const handleCloseTrove = async () => {
    try {
      await closeTrove()
      toast.success("Transaction submitted!", {
        description: "Your trove is being closed and collateral will be returned"
      })
    } catch (error: any) {
      console.error("Close trove error:", error)
      toast.error("Transaction failed", {
        description: error?.message?.slice(0, 200) || "Unknown error"
      })
    }
  }
  
  // Refetch after successful transactions
  useEffect(() => {
    if (isApproved) {
      // Refetch allowance after approval is confirmed
      const updateAllowance = async () => {
        await refetchAllowance()
        toast.success("Approval confirmed!", {
          description: "You can now close your trove"
        })
      }
      updateAllowance()
    }
  }, [isApproved, refetchAllowance])
  
  useEffect(() => {
    if (isClosed) {
      // Refetch debt info after trove is closed
      refetch()
    }
  }, [isClosed, refetch])

  const recentRedemptions = [
    { id: 1, musd: "2,500", btc: "0.0373", date: "5 days ago", status: "confirmed" },
    { id: 2, musd: "1,000", btc: "0.0149", date: "1 week ago", status: "confirmed" },
    { id: 3, musd: "5,000", btc: "0.0746", date: "2 weeks ago", status: "confirmed" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Redeem BTC</h1>
            <p className="text-lg text-muted-foreground">
              Repay your MUSD debt and unlock your Bitcoin collateral.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Redemption Card */}
            <div className="lg:col-span-2">
              <Card className="p-8 border-border/50 card-premium">
                <h2 className="text-2xl font-bold text-foreground mb-8">Your Current Position</h2>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading your position...</span>
                  </div>
                )}

                {/* No Wallet Connected */}
                {!isConnected && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-2">Connect Your Wallet</p>
                    <p className="text-sm text-muted-foreground">Please connect your wallet to view your position</p>
                  </div>
                )}

                {/* No Trove */}
                {isConnected && !isLoading && !hasTrove && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Info className="h-12 w-12 text-info mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-2">No Active Position</p>
                    <p className="text-sm text-muted-foreground text-center">
                      You don't have any BTC locked or MUSD debt. Visit the Deposit page to create a position.
                    </p>
                  </div>
                )}

                {/* Active Position */}
                {isConnected && !isLoading && hasTrove && debtInfo && (
                  <div className="space-y-8">
                    {/* Position Summary */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="p-6 bg-linear-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-2">BTC Locked (Collateral)</p>
                        <p className="text-3xl font-bold text-foreground">{lockedBtc.toFixed(4)}</p>
                        <p className="text-sm text-muted-foreground mt-2">≈ ${collateralValue.toFixed(2)}</p>
                      </div>

                      <div className="p-6 bg-linear-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20">
                        <p className="text-xs text-muted-foreground mb-2">Total MUSD Debt</p>
                        <p className="text-3xl font-bold text-foreground">{musdDebt.toFixed(2)}</p>
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Principal:</span>
                            <span className="font-medium">{principal.toFixed(2)} MUSD</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Interest:</span>
                            <span className="font-medium">{interest.toFixed(2)} MUSD</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Safety Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-semibold text-foreground">Collateralization Ratio</p>
                        <p className="text-sm font-bold text-success">{collateralizationRatio.toFixed(1)}%</p>
                      </div>
                      <SafetyBar
                        percent={collateralizationRatio}
                        band={collateralizationRatio >= 150 ? "green" : "yellow"}
                      />
                    </div>

                    {/* Redemption Info */}
                    <div className="p-4 bg-info/5 rounded-lg border border-info/20 flex gap-3">
                      <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">How it works</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Repay your MUSD debt to unlock your BTC. You can redeem partially or fully at any time.
                        </p>
                      </div>
                    </div>

                    {/* Redeem Button */}
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium py-6 text-base"
                    >
                      Start Redemption
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <Card className="p-6 border-border/50 card-premium">
                <h3 className="font-semibold text-foreground mb-4">Key Metrics</h3>
                <div className="space-y-4">
                  <StatCard 
                    label="BTC Price" 
                    value={isLoadingMetrics ? "Loading..." : `$${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                    hint="Current market" 
                  />
                  <StatCard 
                    label="Interest Rate" 
                    value={isLoadingMetrics ? "Loading..." : `${interestRate.toFixed(2)}% APY`} 
                    hint="Fixed rate" 
                  />
                  <StatCard
                    label="Monthly Interest"
                    value={isLoadingMetrics ? "Loading..." : `${monthlyInterest.toFixed(2)} MUSD`}
                    hint="On current debt"
                  />
                </div>
              </Card>

              {/* Benefits */}
              <Card className="p-6 border-border/50 card-premium space-y-4">
                <div className="flex gap-3">
                  <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">No Penalties</p>
                    <p className="text-xs text-muted-foreground">Redeem anytime without fees</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Partial Redemption</p>
                    <p className="text-xs text-muted-foreground">Redeem any amount you want</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Instant Settlement</p>
                    <p className="text-xs text-muted-foreground">Get your BTC immediately</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

     

      {/* FAQ Section */}
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">Can I redeem partially?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can redeem any amount of BTC by repaying the corresponding MUSD. Your remaining position will
                be adjusted accordingly.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">Are there any fees?</h3>
              <p className="text-sm text-muted-foreground">
                No redemption fees. You only pay the interest on your outstanding MUSD debt until you fully redeem.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">How long does redemption take?</h3>
              <p className="text-sm text-muted-foreground">
                Redemptions are instant. Your BTC is transferred to your wallet immediately after confirmation.
              </p>
            </Card>
            <Card className="p-6 border-border/50 card-premium">
              <h3 className="font-semibold text-foreground mb-2">What if I can't repay?</h3>
              <p className="text-sm text-muted-foreground">
                If your collateralization drops below 120%, you'll need to deposit more BTC or repay MUSD to maintain
                safety.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lockedBtc={lockedBtc}
        musdDebt={musdDebt}
      />
    </div>
  )
}

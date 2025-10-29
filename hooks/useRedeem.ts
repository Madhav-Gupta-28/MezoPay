"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi";
import { parseUnits, createPublicClient, http } from "viem";
import { ADDRESSES } from "@/lib/addresses";
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis";
import { TROVE_MANAGER_ABI } from "@/lib/troveManagerAbi";
import { mezoTestnet } from "@/lib/config";

const ZERO_ADDRESS: `0x${string}` = "0x0000000000000000000000000000000000000000";

// Minimal PriceFeed ABI
const PRICE_FEED_ABI = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "fetchPrice",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useRedeem() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { address } = useAccount();

  // Read the price feed address from BorrowerOperations
  const { data: priceFeedAddress } = useReadContract({
    address: ADDRESSES.BORROWER_OPERATIONS,
    abi: BORROWER_OPERATIONS_ABI,
    functionName: "priceFeed",
  });

  const redeem = async (params: { musdRepay: string }) => {
    if (!address) throw new Error("Wallet not connected");
    const { musdRepay } = params;

    const pc = createPublicClient({ chain: mezoTestnet, transport: http() });

    // Read current on-chain state
    const [debt, minNetDebt, gasComp, price] = await Promise.all([
      pc.readContract({
        address: ADDRESSES.TROVE_MANAGER,
        abi: TROVE_MANAGER_ABI,
        functionName: "getTroveDebt",
        args: [address],
      }) as Promise<bigint>,
      pc.readContract({
        address: ADDRESSES.BORROWER_OPERATIONS,
        abi: BORROWER_OPERATIONS_ABI,
        functionName: "minNetDebt",
      }) as Promise<bigint>,
      pc.readContract({
        address: ADDRESSES.BORROWER_OPERATIONS,
        abi: BORROWER_OPERATIONS_ABI,
        functionName: "MUSD_GAS_COMPENSATION",
      }) as Promise<bigint>,
      // Fetch current BTC price
      priceFeedAddress
        ? (pc.readContract({
            address: priceFeedAddress as `0x${string}`,
            abi: PRICE_FEED_ABI,
            functionName: "fetchPrice",
          }) as Promise<bigint>)
        : Promise.resolve(parseUnits("67000", 18)), // Fallback price if priceFeed not available
    ]);

    // Check if system is in Recovery Mode
    const isRecoveryMode = await pc.readContract({
      address: ADDRESSES.TROVE_MANAGER,
      abi: TROVE_MANAGER_ABI,
      functionName: "checkRecoveryMode",
      args: [price],
    }) as boolean;

    const repay = parseUnits(musdRepay, 18);
    const repayCap = debt - gasComp; // max repay for closeTrove
    const netDebt = debt - gasComp; // current net debt
    const newNetDebt = netDebt - repay; // remaining net debt after repayment

    // Decide between closeTrove and adjustTrove
    const isFullRepay = repay >= repayCap;

    if (isFullRepay && !isRecoveryMode) {
      // Full repayment in Normal Mode: use closeTrove
      await writeContract({
        address: ADDRESSES.BORROWER_OPERATIONS,
        abi: BORROWER_OPERATIONS_ABI,
        functionName: "closeTrove",
        args: [],
      });
      return;
    }

    // Partial repayment OR (full repayment in Recovery Mode): use adjustTrove
    // Client-side guard: ensure remaining net debt is >= minNetDebt (unless it's effectively a full repay)
    if (!isFullRepay && newNetDebt > BigInt(0) && newNetDebt < minNetDebt) {
      const minNetDebtNum = Number(minNetDebt) / 1e18;
      const remainingNum = Number(newNetDebt) / 1e18;
      const needToRepay = Number(netDebt - minNetDebt) / 1e18;
      throw new Error(
        `Partial repayment would leave remaining debt (${remainingNum.toFixed(2)} mUSD) below minimum (${minNetDebtNum} mUSD). Please repay at least ${needToRepay.toFixed(2)} mUSD to meet the minimum, or repay ${(Number(repayCap) / 1e18).toFixed(2)} mUSD to fully close.`
      );
    }

    // adjustTrove with repay-only (no collateral withdrawal)
    await writeContract({
      address: ADDRESSES.BORROWER_OPERATIONS,
      abi: BORROWER_OPERATIONS_ABI,
      functionName: "adjustTrove",
      args: [
        parseUnits("0", 18), // _collWithdrawal - set to 0 for repay-only
        repay, // _debtChange (repay amount)
        false, // _isDebtIncrease -> false = repay
        ZERO_ADDRESS, // upperHint
        ZERO_ADDRESS, // lowerHint
      ],
    });
  };

  return { redeem, hash, isPending, isConfirming, isConfirmed, error };
}

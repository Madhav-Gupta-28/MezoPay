"use client";

import { useAccount, useReadContract } from "wagmi";
import { ADDRESSES } from "@/lib/addresses";
import { TROVE_MANAGER_ABI } from "@/lib/troveManagerAbi";
import { formatUnits } from "viem";

/**
 * Hook to fetch complete debt and collateral information for the connected user
 * Uses getEntireDebtAndColl from TroveManager
 */
export function useDebtInfo() {
  const { address, isConnected } = useAccount();

  // Fetch debt and collateral data
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: ADDRESSES.TROVE_MANAGER,
    abi: TROVE_MANAGER_ABI,
    functionName: "getEntireDebtAndColl",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Parse the returned data
  // Returns: [coll, principal, interest, pendingCollateral, pendingPrincipal, pendingInterest]
  const debtInfo = data
    ? {
        // Collateral (in BTC/wei)
        collateral: data[0] as bigint,
        collateralFormatted: parseFloat(formatUnits(data[0] as bigint, 18)),

        // Principal debt (in MUSD/wei)
        principal: data[1] as bigint,
        principalFormatted: parseFloat(formatUnits(data[1] as bigint, 18)),

        // Interest debt (in MUSD/wei)
        interest: data[2] as bigint,
        interestFormatted: parseFloat(formatUnits(data[2] as bigint, 18)),

        // Pending collateral
        pendingCollateral: data[3] as bigint,
        pendingCollateralFormatted: parseFloat(formatUnits(data[3] as bigint, 18)),

        // Pending principal
        pendingPrincipal: data[4] as bigint,
        pendingPrincipalFormatted: parseFloat(formatUnits(data[4] as bigint, 18)),

        // Pending interest
        pendingInterest: data[5] as bigint,
        pendingInterestFormatted: parseFloat(formatUnits(data[5] as bigint, 18)),

        // Computed values
        totalDebt: (data[1] as bigint) + (data[2] as bigint),
        totalDebtFormatted:
          parseFloat(formatUnits(data[1] as bigint, 18)) +
          parseFloat(formatUnits(data[2] as bigint, 18)),
      }
    : null;

  const hasTrove = debtInfo ? debtInfo.totalDebt > BigInt(0) : false;

  return {
    debtInfo,
    hasTrove,
    isLoading,
    isError,
    refetch,
    isConnected,
  };
}


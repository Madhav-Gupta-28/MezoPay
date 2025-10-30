"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES } from "@/lib/addresses";
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis";

/**
 * Hook to close trove and repay all debt
 * Requires MUSD approval before calling
 */
export function useCloseTrove() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const closeTrove = async () => {
    await writeContract({
      address: ADDRESSES.BORROWER_OPERATIONS,
      abi: BORROWER_OPERATIONS_ABI,
      functionName: "closeTrove",
      args: [],
    });
  };

  return {
    closeTrove,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}


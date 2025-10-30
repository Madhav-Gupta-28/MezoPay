"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { ADDRESSES } from "@/lib/addresses";
import { ERC20_ABI_MIN } from "@/lib/erc20";

/**
 * Hook to approve MUSD tokens for spending by the BorrowerOperations contract
 * Used before calling closeTrove to repay debt
 */
export function useApproveMusd() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ADDRESSES.MUSD_TOKEN,
    abi: ERC20_ABI_MIN,
    functionName: "allowance",
    args: address ? [address, ADDRESSES.BORROWER_OPERATIONS] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000, // Refetch every 3 seconds to catch approval updates
    },
  });

  const approve = async (amount: bigint) => {
    await writeContract({
      address: ADDRESSES.MUSD_TOKEN,
      abi: ERC20_ABI_MIN,
      functionName: "approve",
      args: [ADDRESSES.BORROWER_OPERATIONS, amount],
    });
  };

  const currentAllowance = allowance as bigint | undefined;
  const hasApproval = (requiredAmount: bigint) => {
    return currentAllowance !== undefined && currentAllowance >= requiredAmount;
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    currentAllowance,
    hasApproval,
    refetchAllowance,
  };
}


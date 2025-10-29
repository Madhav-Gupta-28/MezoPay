"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ADDRESSES } from "@/lib/addresses";
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis";

const ZERO_ADDRESS: `0x${string}` = "0x0000000000000000000000000000000000000000";

export function useWithdrawColl() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (btcAmount: string) => {
    await writeContract({
      address: ADDRESSES.BORROWER_OPERATIONS,
      abi: BORROWER_OPERATIONS_ABI,
      functionName: "withdrawColl",
      args: [
        parseUnits(btcAmount, 18),
        ZERO_ADDRESS,
        ZERO_ADDRESS,
      ],
    });
  };

  return { withdraw, hash, isPending, isConfirming, isConfirmed, error };
}



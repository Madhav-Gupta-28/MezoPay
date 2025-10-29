"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ADDRESSES } from "@/lib/addresses";
import { ERC20_ABI_MIN } from "@/lib/erc20";

export function useTransferMusd() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = async (to: `0x${string}`, amount: string) => {
    const value = parseUnits(amount, 18);
    await writeContract({
      address: ADDRESSES.MUSD_TOKEN,
      abi: ERC20_ABI_MIN,
      functionName: "transfer",
      args: [to, value],
    });
  };

  return { transfer, hash, isPending, isConfirming, isConfirmed, error };
}



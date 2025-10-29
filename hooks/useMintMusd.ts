"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { ADDRESSES } from "@/lib/addresses";
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis";

const ZERO_ADDRESS: `0x${string}` = "0x0000000000000000000000000000000000000000";

export interface MintParams {
  btcCollateral: string; // e.g., "0.05"
  musdToMint: string; // e.g., "100"
  upperHint?: `0x${string}`;
  lowerHint?: `0x${string}`;
}

export function useMintMusd() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const mintMusd = async ({ btcCollateral, musdToMint, upperHint, lowerHint }: MintParams) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      // Parse amounts to wei (18 decimals)
      const debtAmount = parseUnits(musdToMint, 18);
      const collateralValue = parseUnits(btcCollateral, 18);

      // Call openTrove with collateral sent as msg.value
      await writeContract({
        address: ADDRESSES.BORROWER_OPERATIONS,
        abi: BORROWER_OPERATIONS_ABI,
        functionName: "openTrove",
        args: [
          debtAmount, // _debtAmount
          upperHint || ZERO_ADDRESS, // _upperHint
          lowerHint || ZERO_ADDRESS, // _lowerHint
        ],
        value: collateralValue, // BTC collateral sent as native value
      });
    } catch (err) {
      console.error("Error minting mUSD:", err);
      throw err;
    }
  };

  return {
    mintMusd,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}


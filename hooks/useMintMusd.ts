"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseUnits, createPublicClient, http } from "viem";
import { ADDRESSES } from "@/lib/addresses";
import { BORROWER_OPERATIONS_ABI } from "@/lib/abis";
import { TROVE_MANAGER_ABI } from "@/lib/troveManagerAbi";
import { mezoTestnet } from "@/lib/config";

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

      // Pre-flight checks to avoid reverts
      const pc = createPublicClient({ chain: mezoTestnet, transport: http() });

      const [minNetDebt, gasComp, borrowingRate, CCR, MCR, priceFeedAddr, totalColl, totalDebt, troveStatus] = await Promise.all([
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "minNetDebt" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "MUSD_GAS_COMPENSATION" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "borrowingRate" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "CCR" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "MCR" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "priceFeed" }) as Promise<`0x${string}`>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "getEntireSystemColl" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.BORROWER_OPERATIONS, abi: BORROWER_OPERATIONS_ABI, functionName: "getEntireSystemDebt" }) as Promise<bigint>,
        pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveStatus", args: [address] }) as Promise<bigint>,
      ]);

      const PRICE_FEED_ABI = [
        { type: "function", stateMutability: "nonpayable", name: "fetchPrice", inputs: [], outputs: [{ name: "", type: "uint256" }] },
      ] as const;

      const price = (await pc.readContract({ address: priceFeedAddr, abi: PRICE_FEED_ABI, functionName: "fetchPrice" })) as bigint;
      const isRecoveryMode = (await pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "checkRecoveryMode", args: [price] })) as boolean;

      // Fallback: treat as active if on-chain debt > 0 even if status read is unexpected
      const onChainDebt = (await pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveDebt", args: [address] })) as bigint;

      const DECIMALS = parseUnits("1", 18);
      const fee = (debtAmount * borrowingRate) / DECIMALS;
      const netDebt = debtAmount + (isRecoveryMode ? BigInt(0) : fee);
      if (netDebt < minNetDebt) {
        const need = Number((minNetDebt * DECIMALS) / (DECIMALS + (isRecoveryMode ? BigInt(0) : borrowingRate)) - debtAmount) / 1e18;
        throw new Error(`Minimum net debt is ${Number(minNetDebt) / 1e18} mUSD. Increase mint by at least ${need.toFixed(2)} mUSD.`);
      }

      const ACTIVE = BigInt(1);

      const isActive = troveStatus === ACTIVE || onChainDebt > BigInt(0);
      if (isActive) {
        // Existing trove: use adjustTrove to add debt (and optionally top-up collateral via msg.value)
        const [oldDebt, oldColl, maxCap] = await Promise.all([
          pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveDebt", args: [address] }) as Promise<bigint>,
          pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveColl", args: [address] }) as Promise<bigint>,
          pc.readContract({ address: ADDRESSES.TROVE_MANAGER, abi: TROVE_MANAGER_ABI, functionName: "getTroveMaxBorrowingCapacity", args: [address] }) as Promise<bigint>,
        ]);

        const netDebtChange = isRecoveryMode ? debtAmount : debtAmount + fee;
        const newDebt = oldDebt + netDebtChange;
        const newColl = oldColl + collateralValue;
        const oldICR = (oldColl * price) / oldDebt;
        const newICR = (newColl * price) / newDebt;

        // New system TCR after adjustment
        const newTotalColl = totalColl + collateralValue;
        const newTotalDebt = totalDebt + netDebtChange;
        const newTCR = (newTotalColl * price) / newTotalDebt;

        if (isRecoveryMode) {
          if (newICR < CCR) throw new Error(`New ICR must be >= ${Number(CCR) / 1e16}% in Recovery Mode.`);
          if (newICR < oldICR) throw new Error("New ICR must improve in Recovery Mode. Add more BTC or reduce mint.");
        } else {
          if (newICR < MCR) throw new Error(`New ICR must be >= ${Number(MCR) / 1e16}% in Normal Mode.`);
          if (newTCR < CCR) throw new Error(`This mint would drop system TCR below ${Number(CCR) / 1e16}%.`);
        }

        // Max borrowing capacity guard from contract
        if (maxCap < netDebtChange + oldDebt) {
          const short = Number(netDebtChange + oldDebt - maxCap) / 1e18;
          throw new Error(`Exceeds max borrowing capacity by ${short.toFixed(2)} mUSD. Add more BTC or reduce mint.`);
        }

        await writeContract({
          address: ADDRESSES.BORROWER_OPERATIONS,
          abi: BORROWER_OPERATIONS_ABI,
          functionName: "adjustTrove",
          args: [
            parseUnits("0", 18), // _collWithdrawal (we add via msg.value)
            debtAmount, // _debtChange (mint amount)
            true, // _isDebtIncrease
            upperHint || ZERO_ADDRESS,
            lowerHint || ZERO_ADDRESS,
          ],
          value: collateralValue,
        });
      } else {
        // New trove: validate ICR/TCR and open
        const compositeDebt = netDebt + gasComp;
        const icr = (collateralValue * price) / compositeDebt;
        const newTotalColl = totalColl + collateralValue;
        const newTotalDebt = totalDebt + compositeDebt;
        const newTCR = (newTotalColl * price) / newTotalDebt;

        if (isRecoveryMode) {
          if (icr < CCR) throw new Error(`ICR must be >= ${Number(CCR) / 1e16}% in Recovery Mode. Add more BTC or reduce mint.`);
        } else {
          if (icr < MCR) throw new Error(`ICR must be >= ${Number(MCR) / 1e16}% in Normal Mode. Add more BTC or reduce mint.`);
          if (newTCR < CCR) throw new Error(`This mint would drop system TCR below ${Number(CCR) / 1e16}%. Add more BTC or reduce mint.`);
        }

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
      }
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


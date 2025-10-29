# MezoPay BTC Deposit & mUSD Mint Integration Guide

This guide explains how the BTC deposit and mUSD minting functionality has been integrated into your MezoPay application.

## 📋 Overview

The integration allows users to:
1. **Deposit BTC** as collateral into the Mezo protocol
2. **Mint mUSD** stablecoins against their BTC collateral
3. **Track transactions** in real-time with proper error handling
4. **Maintain healthy collateralization** ratios (minimum 150%)

## 🏗️ Architecture

### File Structure

```
MezoPay/
├── lib/
│   ├── addresses.ts          # Contract addresses on Mezo Testnet
│   ├── abis.ts               # BorrowerOperations contract ABI
│   └── config.ts             # Wagmi & RainbowKit configuration (existing)
├── hooks/
│   └── useMintMusd.ts        # Custom React hook for minting mUSD
├── components/
│   └── modals/
│       └── deposit-modal.tsx # Updated modal with mint functionality
└── app/
    └── layout.tsx            # Root layout with WalletProvider (existing)
```

## 🔧 Components

### 1. Contract Addresses (`lib/addresses.ts`)

Contains the deployed contract addresses on Mezo Testnet.

**⚠️ IMPORTANT:** You must replace the placeholder addresses with your actual deployed contract addresses:

```typescript
export const ADDRESSES = {
  BORROWER_OPERATIONS: "0xYourActualBorrowerOperationsAddress" as `0x${string}`,
  MUSD_TOKEN: "0xYourActualMUSDTokenAddress" as `0x${string}`,
  TROVE_MANAGER: "0xYourActualTroveManagerAddress" as `0x${string}`,
} as const;
```

### 2. Contract ABI (`lib/abis.ts`)

Contains the full BorrowerOperations contract ABI. The key function we use is:

```solidity
function openTrove(
    uint256 _debtAmount,      // Amount of mUSD to mint
    address _upperHint,       // Sorted list hint (use 0x0 for MVP)
    address _lowerHint        // Sorted list hint (use 0x0 for MVP)
) external payable          // BTC sent as msg.value
```

### 3. Mint Hook (`hooks/useMintMusd.ts`)

A custom React hook that wraps the Wagmi `useWriteContract` hook for type-safe contract interactions:

```typescript
const { mintMusd, isPending, isConfirming, isConfirmed, error, hash } = useMintMusd();

await mintMusd({
  btcCollateral: "0.05",  // BTC amount
  musdToMint: "1000",     // mUSD amount
});
```

**Features:**
- ✅ Type-safe contract calls
- ✅ Automatic transaction tracking
- ✅ Error handling
- ✅ Transaction receipt confirmation

### 4. Deposit Modal (`components/modals/deposit-modal.tsx`)

Enhanced modal with full mint functionality:

**Features:**
- ✅ Real-time collateralization ratio calculation
- ✅ Input validation (min 150% collateralization)
- ✅ Transaction status indicators (pending, confirming, confirmed)
- ✅ Error messages with user-friendly descriptions
- ✅ Success notifications with Sonner toast
- ✅ Transaction hash display with block explorer link
- ✅ Disabled state during transactions

## 🚀 Usage

### Basic Usage in the App

The `DepositModal` is already integrated and ready to use. Users can:

1. Click the "Deposit" button in the app
2. Enter BTC amount to deposit
3. Enter mUSD amount to mint
4. See real-time collateralization ratio
5. Click "Deposit & Mint" button
6. Approve the transaction in their wallet
7. Wait for confirmation
8. See success message and transaction hash

### Programmatic Usage

You can also use the `useMintMusd` hook directly in any component:

```typescript
"use client";

import { useMintMusd } from "@/hooks/useMintMusd";
import { useAccount } from "wagmi";

export function MyComponent() {
  const { address, isConnected } = useAccount();
  const { mintMusd, isPending, isConfirmed, error } = useMintMusd();

  const handleMint = async () => {
    if (!isConnected) return;
    
    try {
      await mintMusd({
        btcCollateral: "0.1",
        musdToMint: "3000",
        // Optional: provide hints for gas optimization
        upperHint: "0x...",
        lowerHint: "0x...",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handleMint} disabled={isPending}>
      {isPending ? "Minting..." : "Mint mUSD"}
    </button>
  );
}
```

## ⚙️ Configuration

### Required Setup

1. **Install Dependencies** (already in your package.json):
   ```bash
   npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query sonner
   ```

2. **Set Contract Addresses**:
   Edit `lib/addresses.ts` with your deployed addresses.

3. **Verify Chain Configuration**:
   The Mezo Testnet is already configured in `lib/config.ts`:
   ```typescript
   export const mezoTestnet: Chain = {
     id: 31611,
     name: 'Mezo Testnet',
     rpcUrls: {
       default: { http: ['https://rpc.test.mezo.org'] }
     }
   }
   ```

### Optional Configuration

#### Collateralization Ratio

The minimum collateralization ratio is hardcoded to 150%. To change it, edit the validation in `deposit-modal.tsx`:

```typescript
if (parseFloat(collRatio) < 150) { // Change 150 to your desired minimum
  toast.error("Collateralization ratio must be at least 150%")
  return
}
```

#### BTC Price Feed

Currently uses a hardcoded BTC price ($67,000). For production, integrate with your price oracle:

```typescript
// In deposit-modal.tsx, replace:
const btcValue = parseFloat(btcAmount) * 67000

// With:
const { data: btcPrice } = useBtcPrice(); // Your price hook
const btcValue = parseFloat(btcAmount) * (btcPrice || 0);
```

## 🧪 Testing

### Testing the Integration

1. **Connect Wallet**: Use RainbowKit to connect a wallet with Mezo Testnet BTC
2. **Open Deposit Modal**: Click "Deposit" in the app
3. **Enter Amounts**:
   - BTC: 0.05
   - mUSD: 1500 (will give ~220% collateralization at $67k BTC)
4. **Submit Transaction**: Click "Deposit & Mint"
5. **Verify**: Check transaction on [Mezo Testnet Explorer](https://scan.testnet.mezo.network)

### Example Test Values

| BTC Amount | BTC Price | Collateral Value | mUSD to Mint | Coll. Ratio | Status |
|------------|-----------|------------------|--------------|-------------|--------|
| 0.05       | $67,000   | $3,350           | 2,000        | 167.5%      | ✅ Valid |
| 0.1        | $67,000   | $6,700           | 4,000        | 167.5%      | ✅ Valid |
| 0.05       | $67,000   | $3,350           | 2,500        | 134%        | ❌ Too low |
| 0.01       | $67,000   | $670             | 446          | 150%        | ✅ Valid (minimum) |

## 🔐 Security Considerations

1. **Contract Addresses**: Always verify contract addresses on the block explorer
2. **Hints Parameters**: Using `0x0` for hints is safe but less gas-efficient. Use `HintHelpers` contract for optimization
3. **Slippage**: The contract doesn't have a `maxFee` parameter in the public `openTrove`. Fee is calculated on-chain based on `borrowingRate`
4. **Front-running**: Consider implementing deadline parameters for production
5. **Rate Limiting**: Add user rate limiting to prevent spam transactions

## 🐛 Troubleshooting

### Common Issues

#### 1. "Transaction Failed: Insufficient Funds"
- **Cause**: Not enough BTC in wallet to cover collateral + gas
- **Solution**: Add more BTC or reduce collateral amount

#### 2. "Collateralization ratio must be at least 150%"
- **Cause**: mUSD amount too high for BTC collateral
- **Solution**: Reduce mUSD amount or increase BTC collateral

#### 3. "Trove is active"
- **Cause**: User already has an open trove (one per address)
- **Solution**: Use `adjustTrove` instead, or implement trove management UI

#### 4. "Network Error"
- **Cause**: RPC connection issues
- **Solution**: Check Mezo Testnet RPC status, try alternative RPC endpoint

#### 5. "Contract not deployed"
- **Cause**: Wrong contract address or wrong network
- **Solution**: Verify addresses in `lib/addresses.ts` and network in wallet

### Debug Mode

Enable debug logging:

```typescript
// In useMintMusd.ts
console.log("Minting with:", {
  debtAmount: parseUnits(musdToMint, 18).toString(),
  collateralValue: parseUnits(btcCollateral, 18).toString(),
  upperHint,
  lowerHint,
});
```

## 📚 Additional Resources

- [Mezo Documentation](https://docs.mezo.org)
- [Liquity Protocol Docs](https://docs.liquity.org) (similar architecture)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

## 🎯 Next Steps

### Recommended Enhancements

1. **Dynamic Price Feeds**: Integrate Mezo's price oracle contract
2. **Gas Estimation**: Show estimated gas costs before transaction
3. **Transaction History**: Store and display past mint transactions
4. **Hint Optimization**: Implement `HintHelpers` for gas savings
5. **Multi-Transaction Support**: Allow users to adjust existing troves
6. **Analytics**: Track minting volume, average collateralization, etc.

### Advanced Features

1. **Adjust Trove**: Implement `adjustTrove` for adding/removing collateral
2. **Close Trove**: Implement `closeTrove` for repaying and closing
3. **Refinance**: Implement `refinance` for changing interest rates
4. **Batch Operations**: Support multiple operations in one transaction
5. **Automation**: Add auto-refinancing based on rate changes

## 📝 License

This integration follows your project's license.

---

**Need Help?** Check the troubleshooting section or open an issue in the repository.


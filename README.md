# MezoPay

MezoPay is a Next.js application that allows users to use Bitcoin like money through the Mezo network.

## Features

- Bitcoin collateral with MUSD borrowing
- QR code payments
- Pocket system for organizing funds
- Wallet integration for Mezo Testnet

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Wallet Connect Project ID

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
bun install
```

3. Configure your Wallet Connect Project ID:

   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project and obtain your Project ID
   - Open `lib/config.ts` and replace `YOUR_WALLET_CONNECT_PROJECT_ID` with your actual Project ID

4. Start the development server:

```bash
npm run dev
# or
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Wallet Integration

MezoPay uses:
- **RainbowKit**: For the wallet connection UI
- **Wagmi**: For React hooks to interact with Ethereum
- **Mezo Testnet**: For Bitcoin Layer 2 transactions

### Using the wallet in components

```tsx
import { useWallet } from "@/hooks/use-wallet";

export function YourComponent() {
  const { isConnected, balance, address } = useWallet();
  
  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected to: {address}</p>
          <p>Balance: {balance.formatted} {balance.symbol}</p>
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}
```

## License

This project is licensed under the MIT License.

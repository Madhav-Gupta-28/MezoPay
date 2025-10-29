import { http, createConfig } from "wagmi";
import { 
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import type { Chain } from "wagmi/chains";

const APP_NAME = "MezoPay";
const PROJECT_ID = "cc35ac86a8ac54cb70c6611a9ea6eec3"; 

export const mezoTestnet: Chain = {
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: {
    name: 'Mezo',
    symbol: 'BTC',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.mezo.org']
    },
    public: {
      http: ['https://rpc.test.mezo.org']
    }
  },
  blockExplorers: {
    default: {
      name: 'MezoScan',
      url: 'https://scan.testnet.mezo.network'
    }
  },
  testnet: true
};



export const mezoMainnet: Chain = {
  id: 31612,
  name: 'Mezo Testnet',
  nativeCurrency: {
    name: 'Mezo',
    symbol: 'BTC',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-http.mezo.boar.network']
    },
    public: {
      http: ['https://rpc-http.mezo.boar.network']
    }
  },
  blockExplorers: {
    default: {
      name: 'MezoScan',
      url: 'https://explorer.mezo.org/'
    }
  },
  testnet: true
};
const { wallets } = getDefaultWallets({
  appName: APP_NAME,
  projectId: PROJECT_ID,
});

const connectors = connectorsForWallets(wallets, {
  projectId: PROJECT_ID,
  appName: APP_NAME,
});


export const config = createConfig({
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http()
  },
  connectors
});

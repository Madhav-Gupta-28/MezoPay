'use client'

import { 
  useAccount, 
  useBalance, 
  useConnect, 
  useDisconnect, 
  useEnsAvatar, 
  useEnsName 
} from 'wagmi'
import { mezoTestnet } from '@/lib/config'

export function useWallet() {
  // Get connection state and methods
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  
  // Get account information
  const account = useAccount()
  const { data: ensName } = useEnsName({ address: account.address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName ?? undefined })
  
  // Get balance information
  const { data: balance } = useBalance({
    address: account.address,
    chainId: mezoTestnet.id
  })

  return {
    // Connection
    connect,
    disconnect,
    connectors,
    isConnecting: isPending,
    
    // Account
    address: account.address,
    isConnected: account.isConnected,
    ensName,
    ensAvatar,
    
    // Balance
    balance: {
      formatted: balance?.formatted,
      symbol: balance?.symbol,
      value: balance?.value
    }
  }
}

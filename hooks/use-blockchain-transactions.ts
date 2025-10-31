'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { ADDRESSES } from '@/lib/addresses'

export interface BlockchainTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  status: 'success' | 'reverted';
  type: 'MINT' | 'BURN' | 'TRANSFER' | 'RECEIVE' | 'CONTRACT_INTERACTION' | 'OTHER';
  formattedValue: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  isNativeCurrency?: boolean;
  operation?: string; // e.g., "Create Pocket", "Deposit BTC", "Mint MUSD", etc.
}

// API response type based on typical explorer API structure
interface ExplorerTxItem {
  hash?: string;
  tx_hash?: string;
  from?: { hash?: string };
  to?: { hash?: string };
  from_address_hash?: string;
  to_address_hash?: string;
  value?: string;
  block_number?: number;
  block_timestamp?: number;
  timestamp?: number;
  status?: 'success' | 'reverted' | string;
  success?: boolean;
  token_transfers?: Array<{
    from?: { hash?: string };
    to?: { hash?: string };
    from_address_hash?: string;
    to_address_hash?: string;
    total?: { value?: string };
    amount?: string;
    token?: {
      symbol?: string;
      contract_address_hash?: string;
    };
  }>;
}

interface ExplorerApiResponse {
  items?: ExplorerTxItem[];
  entries?: ExplorerTxItem[];
  transactions?: ExplorerTxItem[];
  results?: ExplorerTxItem[];
}

// Helper function to classify operation type based on contract address and transaction data
function classifyOperation(
  toAddress: string,
  fromAddress: string,
  userAddress: string,
  value: string
): string | undefined {
  const lowerTo = toAddress.toLowerCase()
  const lowerFrom = fromAddress.toLowerCase()
  const lowerUser = userAddress.toLowerCase()
  const borrowerOps = ADDRESSES.BORROWER_OPERATIONS.toLowerCase()
  
  // If calling BorrowerOperations and sending value, classify based on likely operations
  if (lowerTo === borrowerOps && lowerFrom === lowerUser) {
    const hasValue = value && BigInt(value) > BigInt(0)
    if (hasValue) {
      // Most likely operations when sending BTC to BorrowerOperations:
      // - openTrove: Create pocket (first time)
      // - addColl: Deposit BTC (add collateral)
      // Could be openTrove, addColl, adjustTrove, etc.
      // We'll classify based on context - if user is sending BTC, likely deposit or create
      return 'Deposit BTC'
    }
  }
  
  // Receiving BTC from BorrowerOperations (withdrawing collateral)
  if (lowerFrom === borrowerOps && lowerTo === lowerUser && value && BigInt(value) > BigInt(0)) {
    return 'Withdraw BTC'
  }
  
  // Regular BTC transfers
  if (value && BigInt(value) > BigInt(0)) {
    if (lowerFrom === lowerUser) {
      return 'BTC Transfer'
    } else if (lowerTo === lowerUser) {
      return 'Receive BTC'
    }
  }
  
  return undefined
}

export function useBlockchainTransactions() {
  const { address } = useAccount()
  
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      // Fetch transactions from Mezo explorer API
      const apiUrl = `https://api.explorer.test.mezo.org/api/v2/addresses/${address}/transactions?filter=to%20%7C%20from`
      
      // Also fetch token transfers separately
      const tokenTransfersUrl = `https://api.explorer.test.mezo.org/api/v2/addresses/${address}/token-transfers`
      
      const [response, tokenTransfersResponse] = await Promise.all([
        fetch(apiUrl, {
          headers: {
            'accept': 'application/json',
          },
        }),
        fetch(tokenTransfersUrl, {
          headers: {
            'accept': 'application/json',
          },
        }).catch(() => null) // If token transfers endpoint doesn't exist, continue without it
      ])

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`)
      }

      const data: ExplorerApiResponse = await response.json()
      
      // Fetch token transfers if available
      let tokenTransfersData: any = null
      if (tokenTransfersResponse && tokenTransfersResponse.ok) {
        tokenTransfersData = await tokenTransfersResponse.json()
      }
      
      // Handle different possible response structures
      const txItems = data.items || data.entries || data.transactions || data.results || []
      
      // Handle token transfers data if available
      const tokenTransferItems = tokenTransfersData 
        ? (tokenTransfersData.items || tokenTransfersData.entries || tokenTransfersData.transactions || tokenTransfersData.results || [])
        : []
      
      // Debug: Log data structure
      console.log('Total transactions:', txItems.length)
      console.log('Total token transfers:', tokenTransferItems.length)
      if (txItems.length > 0) {
        console.log('Sample transaction from API:', txItems[0])
      }
      if (tokenTransferItems.length > 0) {
        console.log('Sample token transfer:', tokenTransferItems[0])
      }
      
      // Process transactions - flatten multiple token transfers into separate entries
      const txs: BlockchainTransaction[] = []
      
      // Create a map of transactions by hash for quick lookup
      const txMap = new Map<string, typeof txItems[0]>()
      txItems.forEach((tx) => {
        const hash = tx.hash || tx.tx_hash || ''
        if (hash) {
          txMap.set(hash, tx)
        }
      })
      
      txItems.forEach((item, txIndex) => {
        const txHash = item.hash || item.tx_hash || ''
        const fromAddr = item.from?.hash || item.from_address_hash || ''
        const toAddr = item.to?.hash || item.to_address_hash || ''
        const blockNumber = item.block_number || 0
        const timestamp = item.block_timestamp || item.timestamp || 0
        const status: 'success' | 'reverted' = item.success === false || item.status === 'reverted' ? 'reverted' : 'success'
        
        // Check if this transaction has token transfers
        const tokenTransfers = item.token_transfers || []
        const nativeValue = item.value || '0'
        
        // Process each token transfer as a separate transaction entry
        if (tokenTransfers.length > 0) {
          tokenTransfers.forEach((tokenTransfer, transferIndex) => {
            const transferFrom = tokenTransfer.from?.hash || tokenTransfer.from_address_hash || ''
            const transferTo = tokenTransfer.to?.hash || tokenTransfer.to_address_hash || ''
            const transferValue = tokenTransfer.total?.value || tokenTransfer.amount || '0'
            const tokenInfo = tokenTransfer.token
            
            const tokenSymbol = tokenInfo?.symbol || 'TOKEN'
            const tokenAddress = tokenInfo?.contract_address_hash || ''
            
            // Skip if transfer value is 0 or invalid
            if (!transferValue || transferValue === '0' || BigInt(transferValue) === BigInt(0)) {
              return
            }
            
            let formattedValue = '0'
            // Assume 18 decimals for most tokens, could be enhanced with token info
            try {
              formattedValue = formatUnits(BigInt(transferValue), 18)
            } catch {
              formattedValue = transferValue
            }
            
            // Determine type based on transfer direction
            let type: BlockchainTransaction['type'] = 'OTHER'
            const lowerAddress = address.toLowerCase()
            const lowerTransferFrom = transferFrom.toLowerCase()
            const lowerTransferTo = transferTo.toLowerCase()
            
            if (lowerTransferFrom === lowerAddress) {
              if (lowerTransferTo === ADDRESSES.BORROWER_OPERATIONS.toLowerCase()) {
                type = 'BURN'
              } else {
                type = 'TRANSFER'
              }
            } else if (lowerTransferTo === lowerAddress) {
              if (lowerTransferFrom === ADDRESSES.BORROWER_OPERATIONS.toLowerCase()) {
                type = 'MINT'
              } else {
                type = 'RECEIVE'
              }
            }
            
            // Debug log for token transfers
            console.log('Processing token transfer:', {
              txHash,
              tokenSymbol,
              tokenAddress,
              transferFrom: lowerTransferFrom,
              transferTo: lowerTransferTo,
              userAddress: lowerAddress,
              type,
              involvesUser: lowerTransferFrom === lowerAddress || lowerTransferTo === lowerAddress
            })
            
            // Only add if transaction involves the user's address and has a valid type
            if ((lowerTransferFrom === lowerAddress || lowerTransferTo === lowerAddress) && type !== 'OTHER') {
              txs.push({
                id: `${txHash}-${transferIndex}`,
                hash: txHash,
                from: transferFrom,
                to: transferTo,
                value: transferValue,
                formattedValue,
                blockNumber,
                timestamp: timestamp || 0,
                status,
                type,
                tokenSymbol,
                tokenAddress,
                isNativeCurrency: false,
              })
            }
          })
        } else if (nativeValue && BigInt(nativeValue) > BigInt(0)) {
          // Native BTC transaction with value
          let type: BlockchainTransaction['type'] = 'OTHER'
          const lowerAddress = address.toLowerCase()
          if (fromAddr.toLowerCase() === lowerAddress) {
            type = 'TRANSFER'
          } else if (toAddr.toLowerCase() === lowerAddress) {
            type = 'RECEIVE'
          }
          
          const formattedValue = formatUnits(BigInt(nativeValue), 18) // BTC uses 18 decimals on Mezo
          
          // Classify the operation
          const operation = classifyOperation(toAddr, fromAddr, address, nativeValue)
          
          txs.push({
            id: `${txHash}-native`,
            hash: txHash,
            from: fromAddr,
            to: toAddr,
            value: nativeValue,
            formattedValue,
            blockNumber,
            timestamp: timestamp || 0,
            status,
            type,
            tokenSymbol: 'BTC',
            tokenAddress: undefined,
            isNativeCurrency: true,
            operation,
          })
        }
      })
      
      // Process token transfers from the separate endpoint (for MUSD and other tokens)
      tokenTransferItems.forEach((tokenTransferItem: any, index: number) => {
        const txHash = tokenTransferItem.transaction_hash || tokenTransferItem.tx_hash || tokenTransferItem.hash || ''
        const transferFrom = tokenTransferItem.from?.hash || tokenTransferItem.from_address_hash || tokenTransferItem.from_address?.hash || ''
        const transferTo = tokenTransferItem.to?.hash || tokenTransferItem.to_address_hash || tokenTransferItem.to_address?.hash || ''
        const transferValue = tokenTransferItem.total?.value || tokenTransferItem.amount || tokenTransferItem.value || '0'
        const tokenInfo = tokenTransferItem.token || {}
        const blockNumber = tokenTransferItem.block_number || tokenTransferItem.transaction?.block_number || 0
        const timestamp = tokenTransferItem.block_timestamp || tokenTransferItem.transaction?.block_timestamp || tokenTransferItem.timestamp || 0
        
        // Get transaction status from the transaction if available
        const parentTx = txMap.get(txHash)
        const txStatus: 'success' | 'reverted' = parentTx 
          ? (parentTx.success === false || parentTx.status === 'reverted' ? 'reverted' : 'success')
          : 'success'
        
        const tokenSymbol = tokenInfo.symbol || 'TOKEN'
        const tokenAddress = tokenInfo.contract_address_hash || tokenInfo.address_hash || ''
        
        // Skip if transfer value is 0 or invalid
        if (!transferValue || transferValue === '0' || BigInt(transferValue) === BigInt(0)) {
          return
        }
        
        // Only process if it involves the user's address
        const lowerAddress = address.toLowerCase()
        const lowerTransferFrom = transferFrom.toLowerCase()
        const lowerTransferTo = transferTo.toLowerCase()
        
        if (lowerTransferFrom !== lowerAddress && lowerTransferTo !== lowerAddress) {
          return
        }
        
        let formattedValue = '0'
        try {
          formattedValue = formatUnits(BigInt(transferValue), 18)
        } catch {
          formattedValue = transferValue
        }
        
        // Determine type based on transfer direction
        let type: BlockchainTransaction['type'] = 'OTHER'
        if (lowerTransferFrom === lowerAddress) {
          if (lowerTransferTo === ADDRESSES.BORROWER_OPERATIONS.toLowerCase()) {
            type = 'BURN'
          } else {
            type = 'TRANSFER'
          }
        } else if (lowerTransferTo === lowerAddress) {
          if (lowerTransferFrom === ADDRESSES.BORROWER_OPERATIONS.toLowerCase()) {
            type = 'MINT'
          } else {
            type = 'RECEIVE'
          }
        }
        
        // Only add if transaction involves the user's address and has a valid type
        if (type !== 'OTHER') {
          txs.push({
            id: `${txHash}-token-${index}`,
            hash: txHash,
            from: transferFrom,
            to: transferTo,
            value: transferValue,
            formattedValue,
            blockNumber,
            timestamp: timestamp || 0,
            status: txStatus,
            type,
            tokenSymbol,
            tokenAddress,
            isNativeCurrency: false,
            operation: type === 'MINT' ? 'Mint MUSD' : type === 'BURN' ? 'Burn MUSD' : undefined,
          })
        }
      })
      
      // Debug: Log transaction counts
      console.log('Total transactions found:', txItems.length)
      console.log('Token transfers processed:', txs.length)
      console.log('Transactions by type:', {
        MUSD: txs.filter(tx => tx.tokenSymbol === 'MUSD' || tx.tokenAddress?.toLowerCase() === ADDRESSES.MUSD_TOKEN.toLowerCase()).length,
        BTC: txs.filter(tx => tx.tokenSymbol === 'BTC' || tx.isNativeCurrency).length,
        other: txs.filter(tx => tx.tokenSymbol !== 'MUSD' && tx.tokenSymbol !== 'BTC' && !tx.isNativeCurrency).length
      })
      
      // Filter out invalid transactions
      const validTxs = txs.filter((tx) => {
        return tx.hash && 
               tx.type !== 'OTHER' && 
               (tx.tokenSymbol || tx.isNativeCurrency || parseFloat(tx.formattedValue) > 0)
      })

      console.log('Valid transactions after filter:', validTxs.length)

      // Sort by block number (descending) and timestamp
      const sortedTxs = validTxs.sort((a, b) => {
        if (b.blockNumber !== a.blockNumber) {
          return b.blockNumber - a.blockNumber
        }
        return b.timestamp - a.timestamp
      })

      setTransactions(sortedTxs)
    } catch (err) {
      console.error('Error fetching blockchain transactions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchTransactions()
    }
  }, [address])

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  }
}


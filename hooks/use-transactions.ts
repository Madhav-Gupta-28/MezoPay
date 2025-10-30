'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface Transaction {
  id: string;
  type: 'MINT' | 'BURN' | 'TRANSFER' | 'RECEIVE' | 'POCKET_TRANSFER' | 'REPAY';
  status: 'PENDING' | 'CONFIRMING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  amount: string;
  btcAmount?: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  blockNumber?: number;
  memo?: string;
  category?: string;
  tags: string[];
  confirmedAt?: string;
  createdAt: string;
  pocket?: {
    id: string;
    name: string;
    emoji: string;
  };
}

export function useTransactions(pocketId?: string) {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }) => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ address });
      
      if (pocketId) params.append('pocketId', pocketId);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.type) params.append('type', options.type);

      const response = await fetch(`/api/transactions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const recordTransaction = async (txData: {
    pocketId?: string;
    type: Transaction['type'];
    amount: number | string;
    btcAmount?: number | string;
    fromAddress?: string;
    toAddress?: string;
    txHash?: string;
    blockNumber?: number;
    gasUsed?: number | string;
    memo?: string;
    category?: string;
    tags?: string[];
  }) => {
    if (!address) throw new Error('Wallet not connected');

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, ...txData }),
    });

    if (!response.ok) {
      throw new Error('Failed to record transaction');
    }

    const data = await response.json();
    await fetchTransactions(); // Refresh list
    return data.transaction;
  };

  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, pocketId]);

  return {
    transactions,
    total,
    loading,
    error,
    refetch: fetchTransactions,
    recordTransaction,
  };
}



'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface Pocket {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  musdBalance: string;
  btcCollateral: string;
  monthlyBudget?: string;
  dailyLimit?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function usePockets() {
  const { address } = useAccount();
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPockets = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pockets?address=${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pockets');
      }

      const data = await response.json();
      setPockets(data.pockets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createPocket = async (pocketData: {
    name: string;
    emoji: string;
    description?: string;
    musdBalance?: number;
    btcCollateral?: number;
    monthlyBudget?: number;
    dailyLimit?: number;
  }) => {
    if (!address) throw new Error('Wallet not connected');

    const response = await fetch('/api/pockets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, ...pocketData }),
    });

    if (!response.ok) {
      throw new Error('Failed to create pocket');
    }

    const data = await response.json();
    await fetchPockets(); // Refresh list
    return data.pocket;
  };

  const updatePocket = async (id: string, updates: Partial<Pocket>) => {
    const response = await fetch(`/api/pockets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update pocket');
    }

    const data = await response.json();
    await fetchPockets(); // Refresh list
    return data.pocket;
  };

  const deletePocket = async (id: string) => {
    const response = await fetch(`/api/pockets/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete pocket');
    }

    await fetchPockets(); // Refresh list
  };

  useEffect(() => {
    if (address) {
      fetchPockets();
    }
  }, [address]);

  return {
    pockets,
    loading,
    error,
    refetch: fetchPockets,
    createPocket,
    updatePocket,
    deletePocket,
  };
}



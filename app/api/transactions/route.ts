import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';

// GET /api/transactions - Get transactions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const pocketId = searchParams.get('pocketId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ transactions: [], total: 0 });
    }

    const where: any = { userId: user.id };
    
    if (pocketId) {
      where.pocketId = pocketId;
    }
    
    if (type) {
      where.type = type as TransactionType;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          pocket: {
            select: {
              id: true,
              name: true,
              emoji: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      pocketId,
      type,
      amount,
      btcAmount,
      fromAddress,
      toAddress,
      txHash,
      blockNumber,
      gasUsed,
      memo,
      category,
      tags,
    } = body;

    if (!address || !type || !amount) {
      return NextResponse.json(
        { error: 'Address, type, and amount are required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { address: address.toLowerCase() },
      });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        pocketId,
        type: type as TransactionType,
        status: txHash ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING,
        amount,
        btcAmount,
        fromAddress,
        toAddress,
        txHash,
        blockNumber,
        gasUsed,
        memo,
        category,
        tags: tags || [],
        confirmedAt: txHash ? new Date() : null,
      },
      include: {
        pocket: {
          select: {
            id: true,
            name: true,
            emoji: true,
          },
        },
      },
    });

    // Update pocket balance if applicable
    if (pocketId) {
      const pocket = await prisma.pocket.findUnique({
        where: { id: pocketId },
      });

      if (pocket) {
        let newBalance = parseFloat(pocket.musdBalance.toString());

        if (type === 'MINT' || type === 'RECEIVE') {
          newBalance += parseFloat(amount);
        } else if (type === 'BURN' || type === 'TRANSFER' || type === 'REPAY') {
          newBalance -= parseFloat(amount);
        }

        await prisma.pocket.update({
          where: { id: pocketId },
          data: {
            musdBalance: newBalance,
            ...(btcAmount && type === 'MINT' && {
              btcCollateral: {
                increment: parseFloat(btcAmount),
              },
            }),
            ...(btcAmount && type === 'BURN' && {
              btcCollateral: {
                decrement: parseFloat(btcAmount),
              },
            }),
          },
        });

        // Check budget alerts
        if (pocket.monthlyBudget && newBalance < parseFloat(pocket.monthlyBudget.toString()) * 0.2) {
          await prisma.budgetAlert.create({
            data: {
              pocketId: pocket.id,
              alertType: 'MONTHLY_BUDGET_WARNING',
              threshold: parseFloat(pocket.monthlyBudget.toString()),
              message: `${pocket.name} pocket is running low on funds`,
            },
          });
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `TRANSACTION_${type}`,
        resource: 'transaction',
        resourceId: transaction.id,
        metadata: { amount, txHash },
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}



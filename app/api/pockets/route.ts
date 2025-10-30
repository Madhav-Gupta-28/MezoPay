import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pockets - Get all pockets for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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

    // Get all pockets for the user
    const pockets = await prisma.pocket.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({ pockets });
  } catch (error) {
    console.error('Error fetching pockets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pockets' },
      { status: 500 }
    );
  }
}

// POST /api/pockets - Create a new pocket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      name,
      emoji,
      description,
      musdBalance,
      btcCollateral,
      monthlyBudget,
      dailyLimit,
    } = body;

    if (!address || !name) {
      return NextResponse.json(
        { error: 'Address and name are required' },
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

    // Create pocket
    const pocket = await prisma.pocket.create({
      data: {
        userId: user.id,
        name,
        emoji: emoji || '💰',
        description,
        musdBalance: musdBalance || 0,
        btcCollateral: btcCollateral || 0,
        monthlyBudget,
        dailyLimit,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'POCKET_CREATED',
        resource: 'pocket',
        resourceId: pocket.id,
        metadata: { pocketName: name },
      },
    });

    return NextResponse.json({ pocket }, { status: 201 });
  } catch (error) {
    console.error('Error creating pocket:', error);
    return NextResponse.json(
      { error: 'Failed to create pocket' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pockets/[id] - Get a specific pocket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pocket = await prisma.pocket.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        budgetAlerts: {
          where: { isRead: false },
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    if (!pocket) {
      return NextResponse.json({ error: 'Pocket not found' }, { status: 404 });
    }

    return NextResponse.json({ pocket });
  } catch (error) {
    console.error('Error fetching pocket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pocket' },
      { status: 500 }
    );
  }
}

// PATCH /api/pockets/[id] - Update a pocket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, emoji, description, monthlyBudget, dailyLimit, isArchived } = body;

    const pocket = await prisma.pocket.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(emoji && { emoji }),
        ...(description !== undefined && { description }),
        ...(monthlyBudget !== undefined && { monthlyBudget }),
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: pocket.userId,
        action: 'POCKET_UPDATED',
        resource: 'pocket',
        resourceId: pocket.id,
        metadata: { updates: Object.keys(body) },
      },
    });

    return NextResponse.json({ pocket });
  } catch (error) {
    console.error('Error updating pocket:', error);
    return NextResponse.json(
      { error: 'Failed to update pocket' },
      { status: 500 }
    );
  }
}

// DELETE /api/pockets/[id] - Delete a pocket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pocket = await prisma.pocket.findUnique({
      where: { id: params.id },
    });

    if (!pocket) {
      return NextResponse.json({ error: 'Pocket not found' }, { status: 404 });
    }

    // Soft delete by archiving
    await prisma.pocket.update({
      where: { id: params.id },
      data: { isArchived: true, isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: pocket.userId,
        action: 'POCKET_DELETED',
        resource: 'pocket',
        resourceId: pocket.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pocket:', error);
    return NextResponse.json(
      { error: 'Failed to delete pocket' },
      { status: 500 }
    );
  }
}



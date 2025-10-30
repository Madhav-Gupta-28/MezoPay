import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Example wallet address (replace with your test wallet)
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  // Create or find user
  const user = await prisma.user.upsert({
    where: { address: testAddress.toLowerCase() },
    update: {},
    create: {
      address: testAddress.toLowerCase(),
    },
  });

  console.log('✅ Created user:', user.address);

  // Create user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      emailNotifications: false,
      pushNotifications: true,
      transactionAlerts: true,
      budgetAlerts: true,
      currency: 'USD',
      defaultView: 'dashboard',
      theme: 'dark',
    },
  });

  console.log('✅ Created user settings');

  // Create sample pockets
  const travelPocket = await prisma.pocket.create({
    data: {
      userId: user.id,
      name: 'Travel',
      emoji: '✈️',
      description: 'Saving for my next adventure',
      musdBalance: 2500.00,
      btcCollateral: 0.05,
      monthlyBudget: 3000.00,
      dailyLimit: 100.00,
    },
  });

  const rentPocket = await prisma.pocket.create({
    data: {
      userId: user.id,
      name: 'Rent',
      emoji: '🏠',
      description: 'Monthly rent payments',
      musdBalance: 1800.00,
      btcCollateral: 0.04,
      monthlyBudget: 2000.00,
    },
  });

  const groceriesPocket = await prisma.pocket.create({
    data: {
      userId: user.id,
      name: 'Groceries',
      emoji: '🛒',
      description: 'Food and household items',
      musdBalance: 450.00,
      btcCollateral: 0.01,
      monthlyBudget: 600.00,
      dailyLimit: 50.00,
    },
  });

  console.log('✅ Created 3 sample pockets');

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        userId: user.id,
        pocketId: travelPocket.id,
        type: 'MINT',
        status: 'CONFIRMED',
        amount: 2500.00,
        btcAmount: 0.05,
        fromAddress: user.address,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: 1234567,
        memo: 'Initial deposit for travel fund',
        category: 'deposit',
        tags: ['travel', 'savings'],
        confirmedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        pocketId: rentPocket.id,
        type: 'MINT',
        status: 'CONFIRMED',
        amount: 1800.00,
        btcAmount: 0.04,
        fromAddress: user.address,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: 1234568,
        memo: 'Rent fund setup',
        category: 'deposit',
        tags: ['rent', 'recurring'],
        confirmedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        pocketId: groceriesPocket.id,
        type: 'TRANSFER',
        status: 'CONFIRMED',
        amount: 125.50,
        fromAddress: user.address,
        toAddress: '0x' + Math.random().toString(16).substr(2, 40),
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: 1234569,
        memo: 'Weekly grocery shopping',
        category: 'food',
        tags: ['groceries', 'weekly'],
        confirmedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${transactions.length} sample transactions`);

  // Create a budget alert
  await prisma.budgetAlert.create({
    data: {
      pocketId: groceriesPocket.id,
      alertType: 'MONTHLY_BUDGET_WARNING',
      threshold: 600.00,
      message: 'Groceries pocket is at 75% of monthly budget',
    },
  });

  console.log('✅ Created budget alert');

  // Create activity logs
  await Promise.all([
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'POCKET_CREATED',
        resource: 'pocket',
        resourceId: travelPocket.id,
        metadata: { pocketName: 'Travel' },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'TRANSACTION_MINT',
        resource: 'transaction',
        resourceId: transactions[0].id,
        metadata: { amount: 2500.00 },
      },
    }),
  ]);

  console.log('✅ Created activity logs');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 user`);
  console.log(`   - 3 pockets`);
  console.log(`   - ${transactions.length} transactions`);
  console.log(`   - 1 budget alert`);
  console.log(`   - 2 activity logs`);
  console.log('\n💡 Run "bun run db:studio" to view the data');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



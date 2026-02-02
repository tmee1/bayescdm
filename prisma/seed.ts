import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing database...');

  // ==========================================================================
  // ADMIN ACCOUNT (Thomas Mee - also the only approved reviewer for now)
  // ==========================================================================
  // The admin account is created by email only. Authentication is handled
  // by Auth.js (magic link or OAuth). No passwords are stored in the database.

  const adminUser = await prisma.user.upsert({
    where: { email: 'thomasmee777@gmail.com' },
    update: {
      role: 'ADMIN',
      accountTier: 'CONTRIBUTOR',
      reviewerStatus: 'APPROVED',
    },
    create: {
      email: 'thomasmee777@gmail.com',
      name: 'Thomas Mee',
      role: 'ADMIN',
      accountTier: 'CONTRIBUTOR',
      reviewerStatus: 'APPROVED',
    },
  });
  console.log('Admin user:', adminUser.email);

  // ==========================================================================
  // TEST ACCOUNT FOR DEVELOPMENT
  // ==========================================================================

  // Regular User - can browse tools, submit analyses, and apply to be a reviewer
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {
      role: 'USER',
      reviewerStatus: 'NONE',
    },
    create: {
      email: 'user@test.com',
      name: 'Test User',
      role: 'USER',
      accountTier: 'USER',
      reviewerStatus: 'NONE',
    },
  });
  console.log('Test user:', regularUser.email);

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  console.log('\n========================================');
  console.log('DATABASE INITIALIZED');
  console.log('========================================');
  console.log('');
  console.log('Admin & Approved Reviewer:');
  console.log('  Email: thomasmee777@gmail.com');
  console.log('  Name: Thomas Mee');
  console.log('  Role: ADMIN');
  console.log('  Reviewer Status: APPROVED');
  console.log('');
  console.log('Test User (for development):');
  console.log('  Email: user@test.com');
  console.log('  Role: USER');
  console.log('  Reviewer Status: NONE (can apply)');
  console.log('');
  console.log('========================================');
  console.log('');
  console.log('Notes:');
  console.log('- Thomas Mee is the only approved reviewer until more apply');
  console.log('- Test user can be used to test the reviewer application flow');
  console.log('- New reviewers will be added when applications are approved');
  console.log('- 2 approved reviewers are needed to assign to each submission');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

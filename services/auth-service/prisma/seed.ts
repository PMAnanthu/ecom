import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'superadmin@ecom.app' } });
  if (existing) {
    console.log('Super admin already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('superadmin123', 10);
  await prisma.user.create({
    data: {
      email: 'superadmin@ecom.app',
      passwordHash,
      role: Role.SUPERADMIN,
    },
  });
  console.log('Super admin created: superadmin@ecom.app / superadmin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

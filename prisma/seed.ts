import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  'postgresql://postgres:0806@localhost:5432/medx';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medx.com' },
    update: {
      password: adminPassword,
      role: 'admin'
    },
    create: {
      email: 'admin@medx.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'admin'
    }
  });

  console.log('Admin user seeded!');
  console.log('Email: admin@medx.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

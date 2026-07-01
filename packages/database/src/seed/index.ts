/* eslint-disable no-console */
import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';

import { VyoraDatabase } from '../client/db';
import { companies, users, settings } from '../schema/system';
import { hashPassword } from '../utils/password';

import { seedGstStates } from './states';

export const seedDatabase = async (db: VyoraDatabase) => {
  // Always run GST states seed (it handles duplicates)
  await seedGstStates(db);

  // Check if admin user exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).get();

  if (existingAdmin) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding initial data...');

  const companyId = randomUUID();
  const now = new Date();

  // Create default company
  await db.insert(companies).values({
    id: companyId,
    legalName: 'My Business',
    createdAt: now,
    updatedAt: now,
  });

  // Create default admin user
  const hashedPassword = await hashPassword('admin123');
  await db.insert(users).values({
    id: randomUUID(),
    fullName: 'System Admin',
    username: 'admin',
    passwordHash: hashedPassword,
    role: 'admin',
    createdAt: now,
  });

  // Create default settings
  await db.insert(settings).values({
    id: randomUUID(),
    theme: 'dark',
    defaultCompanyId: companyId,
    backupEnabled: false,
    createdAt: now,
  });

  console.log('Database seeded successfully.');
};

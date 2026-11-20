import { config } from 'dotenv';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d.js';
import contractJson from './contract.json' with { type: 'json' };

config({ path: '.env.local' });

export const contract = contractFromJson<Contract>(contractJson);

const url = process.env['DATABASE_URL'];

if (!url) {
  throw new Error('Set DATABASE_URL in .env.local or the environment.');
}

export const db = postgres({
  contract,
  url,
});

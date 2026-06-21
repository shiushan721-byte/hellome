import 'dotenv/config';
import { requirePrismaClient } from '../src/server/db/prisma';

async function main() {
  const p = requirePrismaClient();
  const rows = await p.skill.findMany({
    select: { id: true, name: true, slug: true, currentVersion: true, status: true },
    orderBy: { id: 'asc' },
  });
  console.log('total:', rows.length);
  rows.forEach((r) =>
    console.log(' ', r.id.padEnd(22), '|', r.slug.padEnd(22), '|v' + r.currentVersion, '|', r.status)
  );
  await p.$disconnect();
}
main();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUILT_IN_TEMPLATES = [
  { key: 'default', name: 'Top Nav', description: 'Clean top navigation bar with hero banner. Great for general stores.', preview: '/templates/topnav.png', enabled: true },
  { key: 'sidebar', name: 'Sidebar', description: 'Left sidebar with category/tag filters. Best for large catalogs.', preview: '/templates/sidebar.png', enabled: true },
  { key: 'card', name: 'Card Grid', description: 'Large card layout with gradient background. Bold and modern.', preview: '/templates/card.png', enabled: true },
];

async function main() {
  for (const t of BUILT_IN_TEMPLATES) {
    await prisma.storeTemplate.upsert({
      where: { key: t.key },
      update: { name: t.name, description: t.description },
      create: t,
    });
  }
  console.log('Templates seeded.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

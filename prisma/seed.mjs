import pkg from '@prisma/client'
import bcrypt from 'bcryptjs'

const { PrismaClient } = pkg
const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

  const passwordHash = await bcrypt.hash(adminPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', passwordHash, emailLower: adminEmail.toLowerCase() },
    create: { email: adminEmail, emailLower: adminEmail.toLowerCase(), name: 'Admin', role: 'ADMIN', passwordHash },
  })

  const count = await prisma.product.count()
  if (count === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Bananas', description: 'Fresh bananas', priceCents: 199, sku: 'BNN-001', category: 'Fruit', stock: 120, imageUrl: 'https://images.unsplash.com/photo-1571772805064-2076a4cacc0a?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Apples', description: 'Crisp apples', priceCents: 299, sku: 'APL-001', category: 'Fruit', stock: 80, imageUrl: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Milk 2% 1L', description: 'Dairy milk', priceCents: 249, sku: 'MLK-2-1L', category: 'Dairy', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1580983559361-9b3c5b8a76b4?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Bread Loaf', description: 'Whole wheat bread', priceCents: 349, sku: 'BRD-001', category: 'Bakery', stock: 40, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1200&auto=format&fit=crop' }
      ],
    })
  }

  console.log('Seed complete. Admin:', { email: admin.email, role: admin.role })

  // Backfill emailLower for any existing users missing it
  const toBackfill = await prisma.user.findMany({ where: { emailLower: null } })
  for (const u of toBackfill) {
    await prisma.user.update({ where: { id: u.id }, data: { emailLower: u.email.toLowerCase() } })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

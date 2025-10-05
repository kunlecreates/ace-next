import pkg from '@prisma/client'
const { PrismaClient } = pkg
const prisma = new PrismaClient()

async function run() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node scripts/make-admin.mjs <email>')
    process.exit(1)
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error('No user found with email', email)
    process.exit(2)
  }
  await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
  console.log('User promoted to ADMIN:', email)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { execSync } from 'child_process'

export default async function globalSetup() {
  // Reset database to a clean state, then seed baseline data.
  // Using prisma db push with --force-reset ensures the schema and data are reset even without migrations.
  try {
    execSync('npx prisma db push --force-reset --accept-data-loss', { stdio: 'inherit' })
  } catch (e) {
    // If this fails on Windows due to DLL unlink issues, proceed to attempt seeding anyway.
    console.warn('Warning: prisma db push force-reset encountered an error; continuing...')
  }
  try {
    execSync('npm run db:seed', { stdio: 'inherit' })
  } catch (e) {
    console.error('Seeding failed')
    throw e
  }
}

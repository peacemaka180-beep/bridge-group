import 'dotenv/config'
import db, { pool } from './db.js'
import { hashPassword, isStrongPassword, isValidEmail } from './auth.js'

const [, , fullName, rawEmail, password] = process.argv
const email = (rawEmail || '').trim().toLowerCase()

if (!fullName || !isValidEmail(email) || !isStrongPassword(password)) {
  console.error('Usage: node create-admin.js "Full Name" email@example.com "Password123"')
  console.error('The password needs at least 8 characters, including a letter and a number.')
  process.exit(1)
}

try {
  const passwordHash = await hashPassword(password)
  const existing = await db.prepare('SELECT id FROM users WHERE email = $1').get(email)

  if (existing) {
    await db
      .prepare(`UPDATE users SET role = 'admin', password_hash = $1, full_name = $2 WHERE id = $3`)
      .run(passwordHash, fullName, existing.id)
    console.log(`Existing account ${email} is now an admin, with the new password.`)
  } else {
    await db
      .prepare(`
        INSERT INTO users (full_name, email, password_hash, role, company, bio, avatar_url)
        VALUES ($1, $2, $3, 'admin', '', '', '')
      `)
      .run(fullName, email, passwordHash)
    console.log(`Admin account created for ${email}.`)
  }
} catch (error) {
  console.error('Could not create the admin:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
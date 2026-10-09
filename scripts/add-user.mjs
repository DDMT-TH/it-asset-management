// ใช้: node scripts/add-user.mjs <username> <password> "<ชื่อ-สกุล>" [admin|staff]
import fs from 'node:fs'
import crypto from 'node:crypto'

const [username, password, name, role = 'staff'] = process.argv.slice(2)
if (!username || !password || !name) {
  console.error('ใช้: node scripts/add-user.mjs <username> <password> "<ชื่อ-สกุล>" [admin|staff]')
  process.exit(1)
}
const file = new URL('../data/users.json', import.meta.url)
const users = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : []
const salt = crypto.randomBytes(16).toString('hex')
const hash = crypto.scryptSync(password, salt, 64).toString('hex')
const entry = { username, name, role, password: `${salt}:${hash}` }
const i = users.findIndex((u) => u.username === username)
i >= 0 ? (users[i] = entry) : users.push(entry)
fs.writeFileSync(file, JSON.stringify(users, null, 2))
console.log(`${i >= 0 ? 'อัปเดต' : 'เพิ่ม'}ผู้ใช้ ${username} (${role}) แล้ว`)

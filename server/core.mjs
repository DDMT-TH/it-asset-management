// แกนกลางของ API: ใช้ร่วมกันทั้ง local (vite/server.mjs) และ Vercel Functions
//  - session: token แบบเซ็นลายเซ็น HMAC (stateless) -> ใช้ได้กับ serverless
//  - ข้อมูล: Upstash Redis (เมื่อมี env) ไม่เช่นนั้นใช้ไฟล์ data/db.json (local)
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DB_FILE = path.join(ROOT, 'data/db.json')
const USERS_FILE = path.join(ROOT, 'data/users.json')
const SESSION_MS = 8 * 60 * 60 * 1000
const DB_KEY = 'itam:db'
const env = process.env

// ---------- token ----------
let devSecret
function secret() {
  if (env.AUTH_SECRET) return env.AUTH_SECRET
  if (env.VERCEL) throw new Error('MISSING_AUTH_SECRET')
  return (devSecret ??= crypto.randomBytes(32).toString('hex')) // local: สุ่มใหม่ทุกครั้งที่เปิดเซิร์ฟเวอร์
}
const hmac = (body) => crypto.createHmac('sha256', secret()).update(body).digest('base64url')

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${hmac(body)}`
}
function verifyToken(token) {
  const [body, sig] = String(token ?? '').split('.')
  if (!body || !sig) return null
  const a = Buffer.from(sig), b = Buffer.from(hmac(body))
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString())
    return p.exp > Date.now() ? p : null
  } catch { return null }
}
const sessionOf = (headers) => verifyToken(String(headers.authorization ?? '').replace('Bearer ', ''))

// ---------- users ----------
function loadUsers() {
  // บน Vercel จะใส่ผู้ใช้ผ่าน env USERS_JSON แทนไฟล์ได้ (ไม่ต้อง commit hash รหัสผ่านลง git)
  if (env.USERS_JSON) return JSON.parse(env.USERS_JSON)
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'))
}

// ---------- storage ----------
const redisUrl = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL
const redisToken = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN
let redis
async function getRedis() {
  if (!redisUrl || !redisToken) {
    if (env.VERCEL) throw new Error('NO_STORAGE') // Vercel เขียนไฟล์ถาวรไม่ได้
    return null
  }
  if (!redis) {
    const { Redis } = await import('@upstash/redis')
    redis = new Redis({ url: redisUrl, token: redisToken })
  }
  return redis
}
const readSeed = () => {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) } catch { return { assets: [], history: [] } }
}

async function loadDb() {
  const r = await getRedis()
  if (!r) return readSeed()
  let d = await r.get(DB_KEY)
  if (d == null) { d = readSeed(); await r.set(DB_KEY, d) } // ครั้งแรก: นำข้อมูลเริ่มต้นจาก data/db.json ไปเก็บ
  return typeof d === 'string' ? JSON.parse(d) : d
}
async function saveDb(db) {
  const r = await getRedis()
  if (r) await r.set(DB_KEY, db)
  else fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

// ---------- routes ----------
const ok = (data) => ({ status: 200, data })
const fail = (status, error) => ({ status, data: { error } })

export async function route(name, { method, headers, body }) {
  try {
    if (name === 'login') {
      if (method !== 'POST') return fail(405, 'method not allowed')
      const { username, password } = typeof body === 'string' ? JSON.parse(body || '{}') : body ?? {}
      const u = loadUsers().find((x) => x.username === username)
      if (!u || !verifyPassword(String(password ?? ''), u.password)) return fail(401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      const user = { username: u.username, name: u.name, role: u.role }
      return ok({ token: signToken({ ...user, exp: Date.now() + SESSION_MS }), user })
    }
    if (name === 'logout') return ok({ ok: true }) // token แบบ stateless: ฝั่ง client ลบทิ้ง

    const s = sessionOf(headers)
    if (!s) return fail(401, 'unauthorized')
    if (name === 'me') return ok({ username: s.username, name: s.name, role: s.role })

    if (name === 'db') {
      if (method === 'GET') return ok(await loadDb())
      if (method === 'PUT') {
        const db = typeof body === 'string' ? JSON.parse(body) : body
        if (!db || !Array.isArray(db.assets) || !Array.isArray(db.history)) return fail(400, 'รูปแบบข้อมูลไม่ถูกต้อง')
        await saveDb(db)
        return ok({ ok: true })
      }
    }
    return fail(404, 'not found')
  } catch (e) {
    const code = e instanceof Error ? e.message : ''
    if (code === 'MISSING_AUTH_SECRET') return fail(500, 'ยังไม่ได้ตั้งค่า AUTH_SECRET ใน Environment Variables ของ Vercel')
    if (code === 'NO_STORAGE') return fail(503, 'ยังไม่ได้เชื่อมต่อฐานข้อมูล (Upstash Redis) กับโปรเจกต์ Vercel')
    console.error(`[api:${name}]`, e)
    return fail(500, 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์')
  }
}

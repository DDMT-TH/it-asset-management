// เซิร์ฟเวอร์ production: เสิร์ฟไฟล์ใน dist + API (login / db)
// ใช้: npm run build && npm start   (เปลี่ยนพอร์ตด้วย PORT=8080 npm start)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './server/api.mjs'

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const PORT = Number(process.env.PORT) || 3000
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

function serveStatic(req, res) {
  const pathname = decodeURIComponent((req.url ?? '/').split('?')[0])
  let file = path.join(DIST, pathname)
  if (!file.startsWith(DIST)) { res.statusCode = 403; return res.end() }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html') // SPA fallback
  res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('ไม่พบโฟลเดอร์ dist — รัน `npm run build` ก่อน')
  process.exit(1)
}

http.createServer((req, res) => handleApi(req, res, () => serveStatic(req, res)))
  .listen(PORT, () => console.log(`IT Asset Management: http://localhost:${PORT}`))

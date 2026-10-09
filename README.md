# IT Asset Management
React + Vite + TypeScript + Tailwind (v4) · ข้อมูลเก็บใน `data/db.json`

    npm install
    npm run dev          # พัฒนา
    npm run build && npm start   # production (เสิร์ฟ dist + API ที่พอร์ต 3000, เปลี่ยนด้วย PORT=8080)

ข้อมูลทั้งหมดอ่าน/เขียนผ่าน middleware ใน `vite.config.ts` (`/api/db`) ลงไฟล์ `data/db.json` โดยตรง
(ใช้ได้กับ `npm run dev` และ `npm run preview`) หากต้อง deploy จริงควรย้ายไปใช้ backend/ฐานข้อมูล

## ระบบ Login
- ผู้ใช้เก็บใน `data/users.json` (รหัสผ่านเป็น hash แบบ scrypt ไม่เก็บ plain text)
- บัญชีตัวอย่าง: `admin / admin1234` และ `staff / staff1234` **ควรเปลี่ยนก่อนใช้งานจริง**
- เพิ่ม/เปลี่ยนรหัสผู้ใช้: `node scripts/add-user.mjs <username> <password> "<ชื่อ-สกุล>" [admin|staff]`
- API `/api/db` ต้องแนบ token ที่ได้จาก `/api/login` (session 8 ชั่วโมง เก็บในหน่วยความจำ — restart server แล้วต้อง login ใหม่)
- ไฟล์ใน `data/` ถูกบล็อกไม่ให้เปิดผ่านเบราว์เซอร์โดยตรง

## Import จาก CSV
เมนู "ลงทะเบียน Asset" → แท็บ "Import จาก CSV" → ดาวน์โหลด Template (UTF-8 เปิดด้วย Excel ได้) → กรอก → อัปโหลด
ระบบตรวจสอบก่อนนำเข้า: ฟิลด์บังคับ, รูปแบบวันที่, รหัสซ้ำทั้งในระบบและในไฟล์ แถวที่ผิดจะถูกข้าม

ฟิลด์ `price` และ `warrantyExpiry` เป็นข้อมูลเสริม (เว้นว่างได้) ข้อมูลเดิมที่ไม่มีฟิลด์นี้ยังใช้งานได้ปกติ

หน้า "ลงทะเบียน Asset" แสดงรายการทั้งหมดและกด "แก้ไข" ได้ (บันทึกประวัติชนิด "แก้ไขข้อมูล" พร้อมรายการฟิลด์ที่เปลี่ยน)

## จำหน่ายออก
เมนู "จำหน่ายออก" เปลี่ยนสถานะเป็น `retired` พร้อมบันทึกเหตุผลในประวัติ (ไม่ลบข้อมูล) เฉพาะเครื่องที่ "พร้อมใช้งาน" หรือ "ส่งซ่อม" เท่านั้น
เครื่องที่จำหน่ายออกแล้วไม่ถูกนับในมูลค่ารวมและการแจ้งเตือนประกัน

> ต้องใช้ `npm start` (server.mjs) หรือ `npm run preview` เท่านั้น การโฮสต์โฟลเดอร์ `dist` เป็นไฟล์ static อย่างเดียว (เช่น Nginx/`serve`/GitHub Pages) จะไม่มี API จึง login ไม่ได้

## Deploy บน Vercel
Vercel เขียนไฟล์ถาวรไม่ได้และไม่มีหน่วยความจำร่วมระหว่างคำขอ จึงปรับดังนี้:
- ข้อมูลเก็บเป็นเอกสาร JSON เดียว (key `itam:db`) ใน **Upstash Redis** — ครั้งแรกจะนำข้อมูลเริ่มต้นจาก `data/db.json` ไปใส่ให้
- Login ใช้ token เซ็นลายเซ็น (HMAC) ไม่ต้องเก็บ session ฝั่งเซิร์ฟเวอร์ → ตั้ง `AUTH_SECRET`
- API อยู่ใน `api/*.mjs` (Vercel Functions) ใช้โค้ดแกนกลางเดียวกับ local (`server/core.mjs`)

ขั้นตอน
1. push โปรเจกต์ขึ้น Git แล้ว Import เข้า Vercel (Framework: Vite — ค่าอยู่ใน `vercel.json` แล้ว)
2. Project → **Storage** → Create Database → **Upstash Redis** → เชื่อมกับโปรเจกต์ (env `KV_REST_API_URL/TOKEN` ถูกใส่ให้เอง)
3. Settings → Environment Variables → เพิ่ม `AUTH_SECRET` (สุ่มข้อความยาว เช่น `openssl rand -hex 32`)
4. (แนะนำ) เปลี่ยนรหัสผ่านตัวอย่าง: `node scripts/add-user.mjs admin <รหัสใหม่> "ผู้ดูแลระบบ" admin`
   แล้วใส่ผู้ใช้ผ่าน env `USERS_JSON` (เนื้อหาเดียวกับ `data/users.json`) แทนการ commit ไฟล์ผู้ใช้ — ดู `.env.example`
5. Redeploy

ข้อจำกัด: บันทึกแบบทับทั้งเอกสาร (last-write-wins) ถ้าหลายคนบันทึกพร้อมกันอาจทับกันได้ · ออกจากระบบคือลบ token ฝั่ง client (token ยังใช้ได้จนครบ 8 ชม. ถ้าถูกคัดลอกไป)

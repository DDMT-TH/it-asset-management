import type { Asset } from './types'

export const TEMPLATE_HEADERS = ['tag', 'name', 'category', 'brand', 'serial', 'purchaseDate', 'price', 'warrantyExpiry'] as const
export type ImportRow = Omit<Asset, 'id' | 'status'>

// อ่าน CSV รองรับ "ข้อความในเครื่องหมายคำพูด", ลูกน้ำในช่อง, CRLF และ BOM
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}

// รับ YYYY-MM-DD หรือ DD/MM/YYYY (รองรับปี พ.ศ.) คืนค่า YYYY-MM-DD หรือ null
export function normalizeDate(v: string): string | null {
  const s = v.trim()
  if (!s) return new Date().toISOString().slice(0, 10)
  let y: number, m: number, d: number
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (iso) [y, m, d] = [+iso[1], +iso[2], +iso[3]]
  else if (dmy) [d, m, y] = [+dmy[1], +dmy[2], +dmy[3]]
  else return null
  if (y > 2400) y -= 543
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return dt.toISOString().slice(0, 10)
}

export function downloadTemplate() {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    'NB-9999,Lenovo ThinkPad E14 (ตัวอย่าง ลบแถวนี้ก่อนนำเข้า),Notebook,Lenovo,SN123456789,2025-01-31,28900,2028-01-31',
  ]
  // ใส่ BOM เพื่อให้ Excel แสดงภาษาไทยถูกต้อง
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'asset-import-template.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

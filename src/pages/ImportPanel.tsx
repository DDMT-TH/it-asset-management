import { useRef, useState, type ChangeEvent } from 'react'
import { useStore } from '../store'
import { Empty, Notice } from '../components'
import { TEMPLATE_HEADERS, downloadTemplate, normalizeDate, parseCsv, type ImportRow } from '../csv'

interface Parsed { line: number; data: ImportRow; error?: string }

export default function ImportPanel() {
  const { db, addAssets } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Parsed[]>([])
  const [fatal, setFatal] = useState('')
  const [msg, setMsg] = useState('')

  const validate = (text: string) => {
    setFatal(''); setMsg('')
    const table = parseCsv(text)
    const header = (table[0] ?? []).map((h) => h.trim())
    const missing = TEMPLATE_HEADERS.filter((h) => !header.includes(h))
    if (missing.length) { setRows([]); return setFatal(`ไม่พบคอลัมน์: ${missing.join(', ')} — กรุณาใช้ไฟล์ Template`) }
    const idx = (k: string) => header.indexOf(k)
    const seen = new Set(db.assets.map((a) => a.tag.toLowerCase()))
    const out: Parsed[] = table.slice(1).map((r, i) => {
      const get = (k: string) => (r[idx(k)] ?? '').trim()
      const date = normalizeDate(get('purchaseDate'))
      const priceText = get('price').replace(/,/g, '')
      const price = priceText === '' ? undefined : Number(priceText)
      const wText = get('warrantyExpiry')
      const warranty = wText ? normalizeDate(wText) : undefined
      const data: ImportRow = {
        tag: get('tag'), name: get('name'), category: get('category') || 'อื่นๆ',
        brand: get('brand'), serial: get('serial'), purchaseDate: date ?? get('purchaseDate'),
        price: price !== undefined && Number.isFinite(price) ? price : undefined,
        warrantyExpiry: warranty ?? (wText || undefined),
      }
      let error: string | undefined
      if (!data.tag || !data.name || !data.serial) error = 'ต้องมี tag, name และ serial'
      else if (!date) error = 'รูปแบบวันที่ซื้อไม่ถูกต้อง (ใช้ YYYY-MM-DD)'
      else if (price !== undefined && (!Number.isFinite(price) || price < 0)) error = 'ราคาต้องเป็นตัวเลขไม่ติดลบ'
      else if (wText && !warranty) error = 'รูปแบบวันหมดประกันไม่ถูกต้อง'
      else if (warranty && warranty < date) error = 'วันหมดประกันต้องไม่ก่อนวันที่ซื้อ'
      else if (seen.has(data.tag.toLowerCase())) error = 'รหัสทรัพย์สินซ้ำ (ในระบบหรือในไฟล์)'
      if (!error) seen.add(data.tag.toLowerCase())
      return { line: i + 2, data, error }
    })
    setRows(out)
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    validate(await f.text())
  }

  const valid = rows.filter((r) => !r.error)
  const doImport = () => {
    addAssets(valid.map((r) => r.data))
    setMsg(`นำเข้า ${valid.length} รายการแล้ว`)
    setRows([]); setFileName('')
    if (input.current) input.current.value = ''
  }

  return (
    <>
      <Notice text={msg} />
      <div className="card mb-6 flex flex-wrap items-center gap-3 p-5">
        <button type="button" className="rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand/5" onClick={downloadTemplate}>
          ดาวน์โหลด Template
        </button>
        <label className="btn cursor-pointer">
          เลือกไฟล์ CSV
          <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
        </label>
        <span className="text-sm text-slate-500">{fileName || 'ยังไม่ได้เลือกไฟล์'}</span>
        <p className="w-full text-sm text-slate-500">
          คอลัมน์: {TEMPLATE_HEADERS.join(', ')} · บังคับ tag, name, serial · วันที่ใช้ YYYY-MM-DD หรือ DD/MM/YYYY (รองรับ พ.ศ.) · เว้นวันที่ซื้อ = วันนี้ · price และ warrantyExpiry เว้นว่างได้
        </p>
      </div>

      {fatal && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{fatal}</p>}

      {rows.length > 0 && (
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
            <span className="text-sm">พร้อมนำเข้า <b>{valid.length}</b> รายการ · ข้อผิดพลาด <b className={rows.length - valid.length ? 'text-red-700' : ''}>{rows.length - valid.length}</b> รายการ (จะถูกข้าม)</span>
            <button className="btn" disabled={!valid.length} onClick={doImport}>นำเข้า {valid.length} รายการ</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr><th className="p-3">แถว</th><th>รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>ยี่ห้อ</th><th>Serial</th><th>วันที่ซื้อ</th><th>ราคา</th><th>หมดประกัน</th><th>ผลตรวจ</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className={`border-t border-line ${r.error ? 'bg-red-50/60' : ''}`}>
                    <td className="p-3">{r.line}</td><td className="font-medium">{r.data.tag}</td><td>{r.data.name}</td>
                    <td>{r.data.category}</td><td>{r.data.brand}</td><td>{r.data.serial}</td><td>{r.data.purchaseDate}</td><td>{r.data.price?.toLocaleString('th-TH') ?? '-'}</td><td>{r.data.warrantyExpiry ?? '-'}</td>
                    <td className={r.error ? 'text-red-700' : 'text-emerald-700'}>{r.error ?? 'ถูกต้อง'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {!rows.length && !fatal && !msg && <Empty text="เลือกไฟล์ CSV เพื่อดูตัวอย่างข้อมูลก่อนนำเข้า" />}
    </>
  )
}

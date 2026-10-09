import { useState, type ReactNode } from 'react'
import { daysLeft } from './utils'
import { STATUS_LABEL, STATUS_STYLE, type Asset, type AssetStatus } from './types'

export const StatusBadge = ({ status }: { status: AssetStatus }) => (
  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
)

export const PageHeader = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-semibold">{title}</h1>
    {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
  </div>
)

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium">{label}</span>
    {children}
  </label>
)

export const Empty = ({ text }: { text: string }) => <p className="px-4 py-8 text-center text-sm text-slate-500">{text}</p>

export const Notice = ({ text }: { text: string }) =>
  text ? <p role="status" className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{text}</p> : null

export const AssetSelect = ({ assets, value, onChange }: { assets: Asset[]; value: string; onChange: (v: string) => void }) => (
  <select required className="input" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">เลือกทรัพย์สิน</option>
    {assets.map((a) => (
      <option key={a.id} value={a.id}>{a.tag} – {a.name}{a.holder ? ` (${a.holder})` : ''}</option>
    ))}
  </select>
)

export const WarrantyBadge = ({ date }: { date?: string }) => {
  if (!date) return <span className="text-slate-400">-</span>
  const d = daysLeft(date)
  const style = d < 0 ? 'bg-red-50 text-red-700' : d <= 90 ? 'bg-amber-50 text-amber-800' : 'text-slate-600'
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs ${style}`}>
      {date} {d < 0 ? `(หมดแล้ว ${-d} วัน)` : d <= 90 ? `(อีก ${d} วัน)` : ''}
    </span>
  )
}

// ตารางเลือกทรัพย์สิน: คลิกแถวเพื่อเลือก (ใช้ radio เพื่อรองรับคีย์บอร์ด)
export function AssetPicker({ assets, value, onChange, showHolder, showStatus, emptyText }: {
  assets: Asset[]; value: string; onChange: (id: string) => void; showHolder?: boolean; showStatus?: boolean; emptyText: string
}) {
  const [q, setQ] = useState('')
  const list = assets.filter((a) => [a.tag, a.name, a.serial, a.holder ?? ''].join(' ').toLowerCase().includes(q.toLowerCase()))
  const picked = assets.find((a) => a.id === value)
  return (
    <div className="card min-w-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
        <input className="input !w-auto min-w-48 flex-1" placeholder="ค้นหารหัส ชื่อ Serial" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-sm text-slate-500">{picked ? <>เลือก: <b className="text-ink">{picked.tag} – {picked.name}</b></> : `พร้อมใช้ ${assets.length} รายการ · คลิกแถวเพื่อเลือก`}</span>
      </div>
      <div className="max-h-[calc(100vh-17rem)] min-h-64 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white text-left text-slate-500">
            <tr><th className="w-10 p-3"><span className="sr-only">เลือก</span></th><th>รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>ยี่ห้อ</th><th>Serial</th><th>หมดประกัน</th>{showHolder && <th>ผู้ถือครอง</th>}{showStatus && <th>สถานะ</th>}</tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} onClick={() => onChange(a.id)}
                className={`cursor-pointer border-t border-line hover:bg-paper ${a.id === value ? 'bg-brand/10' : ''}`}>
                <td className="p-3"><input type="radio" name="asset" checked={a.id === value} onChange={() => onChange(a.id)} aria-label={`เลือก ${a.tag}`} /></td>
                <td className="font-medium">{a.tag}</td><td>{a.name}</td><td>{a.category}</td><td>{a.brand || '-'}</td><td>{a.serial}</td><td><WarrantyBadge date={a.warrantyExpiry} /></td>
                {showHolder && <td>{a.holder ?? '-'}</td>}
                {showStatus && <td><StatusBadge status={a.status} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty text={assets.length === 0 ? emptyText : 'ไม่พบรายการที่ตรงกับคำค้นหา'} />}
      </div>
    </div>
  )
}

// แผงฟอร์มด้านขวา (ติดอยู่กับหน้าจอเมื่อเลื่อน) แสดงเครื่องที่เลือกไว้ด้านบน
export function ActionPanel({ title, asset, children }: { title: string; asset?: Asset; children: ReactNode }) {
  return (
    <aside className="card grid content-start gap-4 p-5 xl:sticky xl:top-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className={`rounded-md border px-3 py-3 text-sm ${asset ? 'border-brand/40 bg-brand/5' : 'border-dashed border-line text-slate-500'}`}>
        {asset ? (
          <>
            <div className="font-semibold">{asset.tag}</div>
            <div>{asset.name}</div>
            <div className="mt-1 text-slate-500">S/N {asset.serial}{asset.holder ? ` · ถือครองโดย ${asset.holder}` : ''}</div>
          </>
        ) : 'ยังไม่ได้เลือกทรัพย์สิน — คลิกแถวในตารางด้านซ้าย'}
      </div>
      {children}
    </aside>
  )
}

// แถบแบ่งหน้า: เลือกจำนวนแถวต่อหน้า, ก่อนหน้า/ถัดไป และเลขหน้า (ย่อด้วย … เมื่อมีหลายหน้า)
export function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [10, 20, 50] }: {
  page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize: (n: number) => void; sizes?: number[]
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const nums = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const items: (number | '…')[] = []
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) items.push('…'); items.push(n) })
  const btn = 'min-w-9 rounded-md border px-2 py-1.5 text-sm disabled:opacity-40'
  return (
    <nav aria-label="แบ่งหน้า" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <div className="flex items-center gap-3 text-slate-600">
        <span>แสดง {from}–{to} จาก {total} รายการ</span>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">ต่อหน้า</span>
          <select className="input !w-auto !py-1" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={`${btn} border-line hover:bg-paper`} disabled={page <= 1} onClick={() => onPage(page - 1)}>ก่อนหน้า</button>
        {items.map((n, i) => n === '…'
          ? <span key={`e${i}`} className="px-1 text-slate-400">…</span>
          : <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}
              className={`${btn} ${n === page ? 'border-brand bg-brand font-medium text-white' : 'border-line hover:bg-paper'}`}>{n}</button>)}
        <button type="button" className={`${btn} border-line hover:bg-paper`} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>ถัดไป</button>
      </div>
    </nav>
  )
}

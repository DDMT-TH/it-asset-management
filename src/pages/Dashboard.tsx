import { useState } from 'react'
import { useStore } from '../store'
import { Empty, PageHeader, StatusBadge, WarrantyBadge } from '../components'
import { HISTORY_LABEL, STATUS_LABEL, type AssetStatus } from '../types'
import { baht, daysLeft } from '../utils'

export default function Dashboard() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<AssetStatus | 'all'>('all')
  const [within, setWithin] = useState(90)
  const count = (s: AssetStatus) => db.assets.filter((a) => a.status === s).length
  const name = (id: string) => db.assets.find((a) => a.id === id)?.name ?? '-'

  const active = db.assets.filter((a) => a.status !== 'retired')
  const totalValue = active.reduce((sum, a) => sum + (a.price ?? 0), 0)
  const expired = active.filter((a) => a.warrantyExpiry && daysLeft(a.warrantyExpiry) < 0)
  const expiring = active
    .filter((a) => a.warrantyExpiry && daysLeft(a.warrantyExpiry) >= 0 && daysLeft(a.warrantyExpiry) <= within)
    .sort((a, b) => daysLeft(a.warrantyExpiry!) - daysLeft(b.warrantyExpiry!))
  
  const rows = db.assets.filter((a) =>
    (filter === 'all' || a.status === filter) &&
    [a.tag, a.name, a.serial, a.holder ?? ''].join(' ').toLowerCase().includes(q.toLowerCase()))
  const recent = [...db.history].reverse().slice(0, 6)

  return (
    <>
      <PageHeader title="แดชบอร์ด" desc="ภาพรวมทรัพย์สิน IT ทั้งหมด" />
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[['all', 'ทั้งหมด', db.assets.length], ...(['available', 'in_use', 'repair', 'retired'] as AssetStatus[]).map((s) => [s, STATUS_LABEL[s], count(s)])]
          .map(([k, label, n]) => (
            <button key={k as string} onClick={() => setFilter(k as AssetStatus | 'all')}
              className={`card p-4 text-left ${filter === k ? 'ring-2 ring-brand' : ''}`}>
              <div className="text-3xl font-semibold">{n}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </button>
          ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-2xl font-semibold">{baht(totalValue)}</div>
          <div className="text-sm text-slate-500">มูลค่ารวมทรัพย์สิน (ไม่รวมจำหน่ายออก)</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-amber-700">{expiring.length}</div>
          <div className="text-sm text-slate-500">ใกล้หมดประกันภายใน {within} วัน</div>
        </div>
        <div className="card p-4">
          <div className={`text-2xl font-semibold ${expired.length ? 'text-red-700' : ''}`}>{expired.length}</div>
          <div className="text-sm text-slate-500">หมดประกันแล้ว</div>
        </div>
      </div>

      <section className="card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
          <h2 className="font-medium">เครื่องที่ใกล้หมดประกัน</h2>
          <select aria-label="ช่วงเวลา" className="input !w-auto" value={within} onChange={(e) => setWithin(Number(e.target.value))}>
            {[30, 60, 90, 180].map((d) => <option key={d} value={d}>ภายใน {d} วัน</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="p-3">รหัส</th><th>ชื่อ</th><th>ผู้ถือครอง</th><th>สถานะ</th><th>หมดประกัน</th></tr>
            </thead>
            <tbody>
              {expiring.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="p-3 font-medium">{a.tag}</td><td>{a.name}</td><td>{a.holder ?? '-'}</td>
                  <td><StatusBadge status={a.status} /></td><td><WarrantyBadge date={a.warrantyExpiry} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {expiring.length === 0 && <Empty text={`ไม่มีเครื่องที่ใกล้หมดประกันภายใน ${within} วัน`} />}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="border-b border-line p-3">
            <input className="input" placeholder="ค้นหารหัส ชื่อ Serial หรือผู้ถือครอง" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr><th className="p-3">รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>ผู้ถือครอง</th><th>ราคา</th><th>หมดประกัน</th><th>สถานะ</th></tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="p-3 font-medium">{a.tag}</td><td>{a.name}</td><td>{a.category}</td>
                    <td>{a.holder ?? '-'}</td>
                    <td className="whitespace-nowrap">{a.price !== undefined ? a.price.toLocaleString('th-TH') : '-'}</td>
                    <td><WarrantyBadge date={a.warrantyExpiry} /></td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <Empty text="ไม่พบทรัพย์สินที่ตรงกับเงื่อนไข" />}
          </div>
        </section>

        <section className="card">
          <h2 className="border-b border-line p-3 font-medium">กิจกรรมล่าสุด</h2>
          <ul>
            {recent.map((h) => (
              <li key={h.id} className="border-b border-line p-3 text-sm last:border-0">
                <div className="font-medium">{HISTORY_LABEL[h.type]} · {name(h.assetId)}</div>
                <div className="text-slate-500">{h.date}{h.person ? ` · ${h.person}` : ''}</div>
              </li>
            ))}
            {recent.length === 0 && <Empty text="ยังไม่มีกิจกรรม" />}
          </ul>
        </section>
      </div>
    </>
  )
}

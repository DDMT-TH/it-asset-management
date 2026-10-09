import { useState } from 'react'
import { useStore } from '../store'
import { Empty, PageHeader } from '../components'
import { HISTORY_LABEL, type HistoryType } from '../types'

export default function History() {
  const { db } = useStore()
  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState<HistoryType | ''>('')
  const asset = (id: string) => db.assets.find((a) => a.id === id)

  const rows = [...db.history].reverse().filter((h) => (!assetId || h.assetId === assetId) && (!type || h.type === type))

  return (
    <>
      <PageHeader title="ประวัติทั้งหมด" desc="ส่งมอบ รับคืน ส่งซ่อม ของทรัพย์สินทุกชิ้น" />
      <div className="mb-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <select className="input" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
          <option value="">ทุกทรัพย์สิน</option>
          {db.assets.map((a) => <option key={a.id} value={a.id}>{a.tag} – {a.name}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value as HistoryType | '')}>
          <option value="">ทุกประเภท</option>
          {Object.entries(HISTORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="p-3">วันที่</th><th>รายการ</th><th>ทรัพย์สิน</th><th>ผู้เกี่ยวข้อง</th><th>หมายเหตุ</th></tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-t border-line">
                <td className="p-3 whitespace-nowrap">{h.date}</td>
                <td className="font-medium">{HISTORY_LABEL[h.type]}</td>
                <td>{asset(h.assetId)?.tag} {asset(h.assetId)?.name}</td>
                <td>{h.person ?? '-'}</td><td>{h.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty text="ไม่พบประวัติ" />}
      </div>
    </>
  )
}

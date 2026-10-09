import { useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { AssetSelect, Field, Notice, PageHeader } from '../components'

export default function Repair() {
  const { db, sendRepair, finishRepair } = useStore()
  const [id, setId] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const sendable = db.assets.filter((a) => a.status === 'available' || a.status === 'in_use')
  const inRepair = db.assets.filter((a) => a.status === 'repair')

  const send = (e: FormEvent) => {
    e.preventDefault()
    sendRepair(id, note)
    setMsg('บันทึกการส่งซ่อมแล้ว')
    setId(''); setNote('')
  }
  const done = (assetId: string) => { finishRepair(assetId, 'ซ่อมเสร็จ รับกลับเข้าคลัง'); setMsg('รับกลับจากซ่อมแล้ว') }

  return (
    <>
      <PageHeader title="ส่งซ่อม / รับกลับ" desc="บันทึกการส่งซ่อมและรับเครื่องกลับเข้าคลัง" />
      <Notice text={msg} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={send} className="card grid gap-4 p-5">
          <h2 className="font-medium">ส่งซ่อม</h2>
          <Field label="ทรัพย์สิน"><AssetSelect assets={sendable} value={id} onChange={setId} /></Field>
          <Field label="อาการเสีย / ร้านที่ส่งซ่อม"><textarea required className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div><button className="btn" disabled={!id}>ส่งซ่อม</button></div>
        </form>
        <section className="card">
          <h2 className="border-b border-line p-4 font-medium">กำลังซ่อม ({inRepair.length})</h2>
          {inRepair.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-line p-4 text-sm last:border-0">
              <span><b>{a.tag}</b> {a.name}</span>
              <button className="btn" onClick={() => done(a.id)}>รับกลับ</button>
            </div>
          ))}
          {inRepair.length === 0 && <p className="p-4 text-sm text-slate-500">ไม่มีรายการที่อยู่ระหว่างซ่อม</p>}
        </section>
      </div>
    </>
  )
}

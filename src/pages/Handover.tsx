import { useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { ActionPanel, AssetPicker, Field, Notice, PageHeader } from '../components'

export default function Handover() {
  const { db, handover } = useStore()
  const [id, setId] = useState('')
  const [person, setPerson] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const available = db.assets.filter((a) => a.status === 'available')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    handover(id, person, note)
    setMsg(`ส่งมอบให้ ${person} แล้ว`)
    setId(''); setPerson(''); setNote('')
  }

  return (
    <>
      <PageHeader title="ส่งมอบ Asset" desc="เลือกทรัพย์สินที่พร้อมใช้งานจากตาราง แล้วระบุผู้รับมอบ" />
      <Notice text={msg} />
      <form onSubmit={submit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <AssetPicker assets={available} value={id} onChange={setId} emptyText="ไม่มีทรัพย์สินที่พร้อมส่งมอบ ลงทะเบียนใหม่หรือรับคืนก่อน" />
        <ActionPanel title="รายละเอียดการส่งมอบ" asset={available.find((a) => a.id === id)}>
          <Field label="ผู้รับมอบ (ชื่อ / แผนก)"><input required className="input" value={person} onChange={(e) => setPerson(e.target.value)} /></Field>
          <Field label="หมายเหตุ"><textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <button className="btn w-full" disabled={!id}>ส่งมอบ</button>
        </ActionPanel>
      </form>
    </>
  )
}

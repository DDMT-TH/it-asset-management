const DAY = 86_400_000

// จำนวนวันที่เหลือถึงวันที่กำหนด (ติดลบ = เลยกำหนดแล้ว)
export function daysLeft(date: string): number {
  const t = new Date(date + 'T00:00:00')
  const n = new Date(); n.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - n.getTime()) / DAY)
}

export const baht = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' บาท'

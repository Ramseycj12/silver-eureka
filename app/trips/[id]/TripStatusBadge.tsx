'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TripStatus } from '@/types/database'

const statuses: TripStatus[] = ['draft', 'pitched', 'locked', 'completed']
const statusConfig: Record<TripStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  pitched: { label: 'Pitched', className: 'bg-blue-100 text-blue-700' },
  locked: { label: 'Locked', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-purple-100 text-purple-700' },
}

export default function TripStatusBadge({ tripId, currentStatus }: { tripId: string; currentStatus: TripStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState<TripStatus>(currentStatus)
  const [open, setOpen] = useState(false)

  async function changeStatus(newStatus: TripStatus) {
    setOpen(false)
    if (newStatus === status) return
    const supabase = createClient()
    await supabase.from('trips').update({ status: newStatus }).eq('id', tripId)
    setStatus(newStatus)
    router.refresh()
  }

  const cfg = statusConfig[status]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className} cursor-pointer`}
      >
        {cfg.label} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[120px]">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${s === status ? 'font-medium' : ''}`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

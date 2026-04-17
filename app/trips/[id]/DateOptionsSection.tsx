'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DateOption } from '@/types/database'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default function DateOptionsSection({
  tripId,
  initialDateOptions,
}: {
  tripId: string
  initialDateOptions: DateOption[]
}) {
  const router = useRouter()
  const [dateOptions, setDateOptions] = useState<DateOption[]>(initialDateOptions)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('date_options')
      .insert({
        trip_id: tripId,
        label: label.trim(),
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single()

    if (data) {
      setDateOptions(d => [...d, data])
      setAdding(false)
      setLabel('')
      setStartDate('')
      setEndDate('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this date option?')) return
    const supabase = createClient()
    await supabase.from('date_options').delete().eq('id', id)
    setDateOptions(d => d.filter(x => x.id !== id))
    router.refresh()
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Date Options</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-green-600 font-medium hover:text-green-700"
          >
            + Add dates
          </button>
        )}
      </div>

      {dateOptions.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No date options yet.</p>
      )}

      <ul className="space-y-2">
        {dateOptions.map(opt => (
          <li key={opt.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(opt.start_date)} – {formatDate(opt.end_date)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(opt.id)}
              className="text-xs text-red-400 hover:text-red-600 ml-3 shrink-0"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={handleAdd} className="space-y-3 pt-3 mt-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
            <input
              required
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Option A"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date *</label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setLabel(''); setStartDate(''); setEndDate('') }}
              className="text-sm px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

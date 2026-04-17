'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateOption, Guest, AvailabilityResponseRow, Rsvp, AvailabilityResponse, RsvpStatus } from '@/types/database'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default function GuestForm({
  token,
  inviteId,
  inviteEmail,
  tripId,
  dateOptions,
  existingGuest,
  existingAvailability,
  existingRsvp,
}: {
  token: string
  inviteId: string
  inviteEmail: string
  tripId: string
  dateOptions: DateOption[]
  existingGuest: Guest | null
  existingAvailability: AvailabilityResponseRow[]
  existingRsvp: Rsvp | null
}) {
  const router = useRouter()
  const [name, setName] = useState(existingGuest?.name ?? '')
  const [availability, setAvailability] = useState<Record<string, AvailabilityResponse>>(() => {
    const map: Record<string, AvailabilityResponse> = {}
    for (const ar of existingAvailability) {
      map[ar.date_option_id] = ar.response
    }
    return map
  })
  const [rsvp, setRsvp] = useState<RsvpStatus | null>(existingRsvp?.status ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setSaved(false)

    const res = await fetch('/api/guest-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        name: name.trim(),
        tripId,
        availability,
        rsvp,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to save.')
      setLoading(false)
      return
    }

    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  const responseOptions: { value: AvailabilityResponse; label: string; className: string; active: string }[] = [
    { value: 'yes', label: 'Yes', className: 'border-gray-200 text-gray-600', active: 'border-green-500 bg-green-50 text-green-700 font-medium' },
    { value: 'maybe', label: 'Maybe', className: 'border-gray-200 text-gray-600', active: 'border-yellow-400 bg-yellow-50 text-yellow-700 font-medium' },
    { value: 'no', label: 'No', className: 'border-gray-200 text-gray-600', active: 'border-red-400 bg-red-50 text-red-600 font-medium' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {existingGuest ? `Welcome back, ${existingGuest.name}!` : 'Your Info'}
        </h3>
        {!existingGuest && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your name *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">{inviteEmail}</p>
      </div>

      {dateOptions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
          <ul className="space-y-3">
            {dateOptions.map(opt => (
              <li key={opt.id}>
                <div className="mb-1.5">
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{formatDate(opt.start_date)} – {formatDate(opt.end_date)}</p>
                </div>
                <div className="flex gap-2">
                  {responseOptions.map(ro => (
                    <button
                      key={ro.value}
                      type="button"
                      onClick={() => setAvailability(a => ({ ...a, [opt.id]: ro.value }))}
                      className={`flex-1 border rounded-lg py-2 text-sm transition-all ${
                        availability[opt.id] === ro.value ? ro.active : ro.className
                      }`}
                    >
                      {ro.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">RSVP</h3>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRsvp('in')}
            className={`flex-1 border rounded-lg py-2.5 text-sm font-medium transition-all ${
              rsvp === 'in'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            I&apos;m in!
          </button>
          <button
            type="button"
            onClick={() => setRsvp('out')}
            className={`flex-1 border rounded-lg py-2.5 text-sm font-medium transition-all ${
              rsvp === 'out'
                ? 'border-red-400 bg-red-50 text-red-600'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            Can&apos;t make it
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          Saved! Your responses have been recorded.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (!existingGuest && !name.trim())}
        className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving…' : existingGuest ? 'Update responses' : 'Submit'}
      </button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TripInvite } from '@/types/database'

export default function InviteSection({
  tripId,
  invites: initialInvites,
  appUrl,
}: {
  tripId: string
  invites: TripInvite[]
  appUrl: string
}) {
  const router = useRouter()
  const [invites, setInvites] = useState<TripInvite[]>(initialInvites)
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const emails = emailInput
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0)

    if (emails.length === 0) {
      setError('Enter at least one email address.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, emails }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to send invites.')
      setLoading(false)
      return
    }

    setSuccess(`${json.sent} invite${json.sent !== 1 ? 's' : ''} sent!`)
    setEmailInput('')
    setInvites(json.invites)
    router.refresh()
    setLoading(false)
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Invite Guests</h2>

      {invites.length > 0 && (
        <ul className="space-y-2 mb-4">
          {invites.map(invite => (
            <li key={invite.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{invite.email}</span>
              <div className="flex items-center gap-3">
                {invite.sent_at ? (
                  <span className="text-xs text-green-600">Invited</span>
                ) : (
                  <span className="text-xs text-gray-400">Not sent</span>
                )}
                <a
                  href={`${appUrl}/invite/${invite.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Link ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleInvite} className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Email addresses (comma or line separated)
          </label>
          <textarea
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="alice@example.com, bob@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !emailInput.trim()}
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending…' : 'Send invites'}
        </button>
      </form>
    </section>
  )
}

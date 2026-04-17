import { TripInvite, Guest, DateOption, AvailabilityResponseRow, Rsvp, AvailabilityResponse } from '@/types/database'

const responseConfig: Record<AvailabilityResponse, { label: string; className: string }> = {
  yes: { label: '✓', className: 'text-green-600 font-bold' },
  no: { label: '✗', className: 'text-red-500' },
  maybe: { label: '?', className: 'text-yellow-500 font-medium' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function AvailabilityGrid({
  invites,
  guests,
  dateOptions,
  availabilityResponses,
  rsvps,
}: {
  invites: TripInvite[]
  guests: Guest[]
  dateOptions: DateOption[]
  availabilityResponses: AvailabilityResponseRow[]
  rsvps: Rsvp[]
}) {
  if (invites.length === 0 || dateOptions.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Availability</h2>
        <p className="text-sm text-gray-400">
          {invites.length === 0
            ? 'Add guests to see availability responses.'
            : 'Add date options to collect availability.'}
        </p>
      </section>
    )
  }

  // Map invite id → guest
  const guestByInviteId = new Map(guests.map(g => [g.trip_invite_id, g]))
  // Map guest id → rsvp status
  const rsvpByGuestId = new Map(rsvps.map(r => [r.guest_id, r.status]))
  // Map `${guestId}-${dateOptionId}` → response
  const responseMap = new Map(
    availabilityResponses.map(r => [`${r.guest_id}-${r.date_option_id}`, r.response as AvailabilityResponse])
  )

  // Count yes responses per date option
  const yesCount: Record<string, number> = {}
  const maybeCount: Record<string, number> = {}
  for (const opt of dateOptions) {
    yesCount[opt.id] = 0
    maybeCount[opt.id] = 0
    for (const g of guests) {
      const resp = responseMap.get(`${g.id}-${opt.id}`)
      if (resp === 'yes') yesCount[opt.id]++
      if (resp === 'maybe') maybeCount[opt.id]++
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Availability</h2>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm border-collapse min-w-[320px]">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3 min-w-[120px]">Guest</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-2 min-w-[60px]">RSVP</th>
              {dateOptions.map(opt => (
                <th key={opt.id} className="text-center text-xs font-medium text-gray-500 pb-2 px-2 min-w-[60px]">
                  <div>{opt.label}</div>
                  <div className="font-normal text-gray-400">{formatDate(opt.start_date)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invites.map(invite => {
              const guest = guestByInviteId.get(invite.id)
              const rsvpStatus = guest ? rsvpByGuestId.get(guest.id) : undefined

              return (
                <tr key={invite.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-gray-800 text-sm truncate max-w-[140px]">
                      {guest ? guest.name : <span className="text-gray-400 italic">Pending</span>}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[140px]">{invite.email}</div>
                  </td>
                  <td className="py-2 pr-2">
                    {rsvpStatus ? (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${rsvpStatus === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {rsvpStatus === 'in' ? 'In' : 'Out'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  {dateOptions.map(opt => {
                    const resp = guest ? responseMap.get(`${guest.id}-${opt.id}`) : undefined
                    const cfg = resp ? responseConfig[resp] : null
                    return (
                      <td key={opt.id} className="py-2 px-2 text-center">
                        {cfg ? (
                          <span className={cfg.className}>{cfg.label}</span>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={2} className="py-2 text-xs font-medium text-gray-500">
                Yes / Maybe
              </td>
              {dateOptions.map(opt => (
                <td key={opt.id} className="py-2 text-center text-xs text-gray-500">
                  <span className="text-green-600 font-medium">{yesCount[opt.id]}</span>
                  <span className="text-gray-300"> / </span>
                  <span className="text-yellow-500">{maybeCount[opt.id]}</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

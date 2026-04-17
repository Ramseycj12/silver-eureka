import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Course, DateOption, TripInvite, Guest, AvailabilityResponseRow, Rsvp } from '@/types/database'
import GuestForm from './GuestForm'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const service = createServiceClient()

  // Validate token
  const { data: invite } = await service
    .from('trip_invites')
    .select('*, trips(*)')
    .eq('token', token)
    .single()

  if (!invite) notFound()

  const trip = invite.trips as {
    id: string
    title: string
    destination: string | null
    budget_per_person: number | null
    headcount_target: number | null
    status: string
  }

  const [coursesRes, dateOptionsRes] = await Promise.all([
    service.from('courses').select('*').eq('trip_id', trip.id).order('created_at'),
    service.from('date_options').select('*').eq('trip_id', trip.id).order('start_date'),
  ])

  const courses: Course[] = coursesRes.data ?? []
  const dateOptions: DateOption[] = dateOptionsRes.data ?? []

  // Check if guest already exists
  const { data: existingGuest } = await service
    .from('guests')
    .select('*')
    .eq('trip_invite_id', invite.id)
    .maybeSingle()

  let existingAvailability: AvailabilityResponseRow[] = []
  let existingRsvp: Rsvp | null = null

  if (existingGuest) {
    const [arRes, rsvpRes] = await Promise.all([
      service.from('availability_responses').select('*').eq('guest_id', existingGuest.id),
      service.from('rsvps').select('*').eq('guest_id', existingGuest.id).eq('trip_id', trip.id).maybeSingle(),
    ])
    existingAvailability = arRes.data ?? []
    existingRsvp = rsvpRes.data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-green-700">Golf Trip Planner</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 py-6 space-y-5">
        {/* Trip overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xl font-bold text-gray-900">{trip.title}</h2>
          {trip.destination && <p className="text-gray-500 text-sm mt-1">{trip.destination}</p>}
          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            {trip.budget_per_person && (
              <span><span className="text-gray-400">Budget:</span> ${trip.budget_per_person.toLocaleString()}/person</span>
            )}
            {trip.headcount_target && (
              <span><span className="text-gray-400">Players:</span> {trip.headcount_target}</span>
            )}
          </div>
        </div>

        {/* Courses */}
        {courses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Courses</h3>
            <ul className="space-y-3">
              {courses.map(c => (
                <li key={c.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.location && <p className="text-xs text-gray-500 mt-0.5">{c.location}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    {c.green_fee && <span>${c.green_fee.toLocaleString()} green fee</span>}
                    {c.rounds && <span>{c.rounds} round{c.rounds !== 1 ? 's' : ''}</span>}
                  </div>
                  {c.notes && <p className="text-xs text-gray-400 mt-1 italic">{c.notes}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guest form: name, availability, RSVP */}
        <GuestForm
          token={token}
          inviteId={invite.id}
          inviteEmail={invite.email}
          tripId={trip.id}
          dateOptions={dateOptions}
          existingGuest={existingGuest}
          existingAvailability={existingAvailability}
          existingRsvp={existingRsvp}
        />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Trip, TripStatus, Course, DateOption, TripInvite, Guest, AvailabilityResponseRow, Rsvp } from '@/types/database'
import CourseSection from './CourseSection'
import DateOptionsSection from './DateOptionsSection'
import InviteSection from './InviteSection'
import AvailabilityGrid from './AvailabilityGrid'
import TripStatusBadge from './TripStatusBadge'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('organizer_id', user.id)
    .single()

  if (!trip) notFound()

  const [coursesRes, dateOptionsRes, invitesRes] = await Promise.all([
    supabase.from('courses').select('*').eq('trip_id', id).order('created_at'),
    supabase.from('date_options').select('*').eq('trip_id', id).order('start_date'),
    supabase.from('trip_invites').select('*').eq('trip_id', id).order('created_at'),
  ])

  const courses: Course[] = coursesRes.data ?? []
  const dateOptions: DateOption[] = dateOptionsRes.data ?? []
  const invites: TripInvite[] = invitesRes.data ?? []

  // Load guests, availability, rsvps for the summary grid
  const guestEmails = invites.map(i => i.email)
  let guests: Guest[] = []
  let availabilityResponses: AvailabilityResponseRow[] = []
  let rsvps: Rsvp[] = []

  if (invites.length > 0) {
    const inviteIds = invites.map(i => i.id)
    const guestsRes = await supabase
      .from('guests')
      .select('*')
      .in('trip_invite_id', inviteIds)
    guests = guestsRes.data ?? []

    if (guests.length > 0) {
      const guestIds = guests.map(g => g.id)
      const [arRes, rsvpRes] = await Promise.all([
        supabase.from('availability_responses').select('*').in('guest_id', guestIds),
        supabase.from('rsvps').select('*').in('guest_id', guestIds).eq('trip_id', id),
      ])
      availabilityResponses = arRes.data ?? []
      rsvps = rsvpRes.data ?? []
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">
            ← Back
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium truncate max-w-[160px]">{trip.title}</span>
        </div>
        <TripStatusBadge tripId={id} currentStatus={trip.status as TripStatus} />
      </nav>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6 py-6">
        {/* Trip overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h1 className="text-xl font-bold text-gray-900">{trip.title}</h1>
          {trip.destination && <p className="text-gray-500 text-sm mt-1">{trip.destination}</p>}
          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            {trip.budget_per_person && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Budget:</span> ${trip.budget_per_person.toLocaleString()}/person
              </span>
            )}
            {trip.headcount_target && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Players:</span> {trip.headcount_target}
              </span>
            )}
          </div>
        </div>

        <CourseSection tripId={id} initialCourses={courses} />
        <DateOptionsSection tripId={id} initialDateOptions={dateOptions} />
        <InviteSection tripId={id} invites={invites} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ''} />
        <AvailabilityGrid
          invites={invites}
          guests={guests}
          dateOptions={dateOptions}
          availabilityResponses={availabilityResponses}
          rsvps={rsvps}
        />
      </div>
    </div>
  )
}

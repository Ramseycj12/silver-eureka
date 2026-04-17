import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trip, TripStatus } from '@/types/database'

const statusConfig: Record<TripStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  pitched: { label: 'Pitched', className: 'bg-blue-100 text-blue-700' },
  locked: { label: 'Locked', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-purple-100 text-purple-700' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('organizer_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Trips</h1>
        <Link
          href="/trips/new"
          className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          New trip
        </Link>
      </div>

      {trips && trips.length > 0 ? (
        <ul className="space-y-3">
          {trips.map((trip: Trip) => {
            const status = statusConfig[trip.status]
            return (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{trip.title}</p>
                      {trip.destination && (
                        <p className="text-sm text-gray-500 mt-0.5">{trip.destination}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  {(trip.budget_per_person || trip.headcount_target) && (
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      {trip.budget_per_person && (
                        <span>${trip.budget_per_person.toLocaleString()}/person</span>
                      )}
                      {trip.headcount_target && (
                        <span>{trip.headcount_target} players</span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base">No trips yet.</p>
          <p className="text-sm mt-1">Create your first golf trip to get started.</p>
        </div>
      )}
    </div>
  )
}

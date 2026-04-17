export type TripStatus = 'draft' | 'pitched' | 'locked' | 'completed'
export type AvailabilityResponse = 'yes' | 'no' | 'maybe'
export type RsvpStatus = 'in' | 'out'

export interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export interface Trip {
  id: string
  organizer_id: string
  title: string
  destination: string | null
  budget_per_person: number | null
  headcount_target: number | null
  status: TripStatus
  invite_token: string
  created_at: string
  updated_at: string
}

export interface TripInvite {
  id: string
  trip_id: string
  email: string
  token: string
  sent_at: string | null
  created_at: string
}

export interface DateOption {
  id: string
  trip_id: string
  label: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Course {
  id: string
  trip_id: string
  name: string
  location: string | null
  green_fee: number | null
  rounds: number | null
  notes: string | null
  created_at: string
}

export interface Guest {
  id: string
  trip_invite_id: string
  name: string
  email: string
  created_at: string
}

export interface AvailabilityResponseRow {
  id: string
  guest_id: string
  date_option_id: string
  response: AvailabilityResponse
  created_at: string
}

export interface Rsvp {
  id: string
  guest_id: string
  trip_id: string
  status: RsvpStatus
  payment_confirmed: boolean
  created_at: string
  updated_at: string
}

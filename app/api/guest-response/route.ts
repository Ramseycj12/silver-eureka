import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const { token, name, tripId, availability, rsvp } = await request.json()

  if (!token || !name || !tripId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createServiceClient()

  // Validate token
  const { data: invite } = await service
    .from('trip_invites')
    .select('id, email, trip_id')
    .eq('token', token)
    .single()

  if (!invite || invite.trip_id !== tripId) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 403 })
  }

  // Upsert guest
  const { data: existingGuest } = await service
    .from('guests')
    .select('id')
    .eq('trip_invite_id', invite.id)
    .maybeSingle()

  let guestId: string

  if (existingGuest) {
    await service
      .from('guests')
      .update({ name })
      .eq('id', existingGuest.id)
    guestId = existingGuest.id
  } else {
    const { data: newGuest, error } = await service
      .from('guests')
      .insert({ trip_invite_id: invite.id, name, email: invite.email })
      .select('id')
      .single()

    if (error || !newGuest) {
      return NextResponse.json({ error: 'Failed to create guest record' }, { status: 500 })
    }
    guestId = newGuest.id
  }

  // Upsert availability responses
  if (availability && typeof availability === 'object') {
    for (const [dateOptionId, response] of Object.entries(availability)) {
      if (!['yes', 'no', 'maybe'].includes(response as string)) continue

      const { data: existing } = await service
        .from('availability_responses')
        .select('id')
        .eq('guest_id', guestId)
        .eq('date_option_id', dateOptionId)
        .maybeSingle()

      if (existing) {
        await service
          .from('availability_responses')
          .update({ response })
          .eq('id', existing.id)
      } else {
        await service
          .from('availability_responses')
          .insert({ guest_id: guestId, date_option_id: dateOptionId, response })
      }
    }
  }

  // Upsert RSVP
  if (rsvp && ['in', 'out'].includes(rsvp)) {
    const { data: existingRsvp } = await service
      .from('rsvps')
      .select('id')
      .eq('guest_id', guestId)
      .eq('trip_id', tripId)
      .maybeSingle()

    if (existingRsvp) {
      await service
        .from('rsvps')
        .update({ status: rsvp })
        .eq('id', existingRsvp.id)
    } else {
      await service
        .from('rsvps')
        .insert({ guest_id: guestId, trip_id: tripId, status: rsvp, payment_confirmed: false })
    }
  }

  return NextResponse.json({ ok: true })
}

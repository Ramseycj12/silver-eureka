import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { v4 as uuidv4 } from 'uuid'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  // Verify organizer is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId, emails } = await request.json()
  if (!tripId || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify trip belongs to organizer
  const { data: trip } = await supabase
    .from('trips')
    .select('id, title, destination, organizer_id')
    .eq('id', tripId)
    .eq('organizer_id', user.id)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const service = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Fetch existing invites for this trip to avoid duplicates
  const { data: existingInvites } = await service
    .from('trip_invites')
    .select('email')
    .eq('trip_id', tripId)

  const existingEmails = new Set((existingInvites ?? []).map((i: { email: string }) => i.email))

  const newEmails = emails.filter((e: string) => !existingEmails.has(e))
  let sent = 0
  const createdInvites = []

  for (const email of newEmails) {
    const token = uuidv4()

    const { data: invite, error: insertError } = await service
      .from('trip_invites')
      .insert({ trip_id: tripId, email, token })
      .select()
      .single()

    if (insertError || !invite) continue

    const inviteUrl = `${appUrl}/invite/${token}`

    try {
      await resend.emails.send({
        from: 'Golf Trip Planner <noreply@golftrip.app>',
        to: email,
        subject: `You're invited: ${trip.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #15803d;">You're invited to a golf trip!</h2>
            <p><strong>${trip.title}</strong>${trip.destination ? ` — ${trip.destination}` : ''}</p>
            <p>Click the link below to view trip details, share your availability, and RSVP.</p>
            <a href="${inviteUrl}" style="display: inline-block; margin-top: 16px; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Trip & RSVP
            </a>
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              Or copy this link: ${inviteUrl}
            </p>
          </div>
        `,
      })

      await service
        .from('trip_invites')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', invite.id)

      invite.sent_at = new Date().toISOString()
      sent++
    } catch {
      // Email failed but invite record exists — continue
    }

    createdInvites.push(invite)
  }

  // Return all invites for the trip
  const { data: allInvites } = await service
    .from('trip_invites')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at')

  return NextResponse.json({ sent, invites: allInvites ?? [] })
}

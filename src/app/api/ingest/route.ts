import { assureAdminAuth, parseTapEvent } from '@atproto/tap'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { invalid_lexicons, valid_lexicons } from '@/db/schema'
import { isLexiconRecordEvent } from './types'
import { validateLexicon } from './validation'

const TAP_ADMIN_PASSWORD = process.env.TAP_ADMIN_PASSWORD

/**
 * Acknowledges receipt of a Tap event.
 * Tap considers events 'acked' when it receives a 200 response.
 */
function ackEvent(body?: BodyInit) {
  return new NextResponse(body, { status: 200 })
}

/**
 * Signals to Tap that the event should be sent again later.
 * Tap will retry events that receive any response other than 200.
 *
 * This should be used sparingly to avoid excessive retries.
 */
function retryEvent(body?: BodyInit) {
  return new NextResponse(body, { status: 500 })
}

export async function POST(request: NextRequest) {
  if (TAP_ADMIN_PASSWORD) {
    const authHeader = request.headers.get('authorization') ?? ''
    try {
      assureAdminAuth(TAP_ADMIN_PASSWORD, authHeader)
    } catch {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  try {
    const body = await request.json()

    let event
    try {
      event = parseTapEvent(body)
    } catch (error) {
      return ackEvent('Invalid event format')
    }

    /* NOTE(caidanw):
     * Tap sends a variety of event types: 'identity' events and 'record' events.
     * Tap always includes 'identity' events, currently no way to configure this.
     * We only want to process 'record' events.
     */
    if (event.type === 'identity') {
      return ackEvent('Event type not desired')
    }

    if (!isLexiconRecordEvent(event)) {
      return ackEvent('Not a valid lexicon record event')
    }

    const validationResult = await validateLexicon(event)

    if (validationResult.isValid) {
      await db
        .insert(valid_lexicons)
        .values({
          nsid: validationResult.lexiconDoc.id,
          cid: event.cid,
          repoDid: event.did,
          repoRev: event.rev,
          data: validationResult.lexiconDoc,
        })
        .onConflictDoNothing()

      console.log('Valid lexicon ingested:', {
        eventId: body.id,
        nsid: validationResult.lexiconDoc.id,
        cid: event.cid,
        repoDid: event.did,
        action: event.action,
      })

      return ackEvent('Valid lexicon ingested successfully')
    } else {
      await db
        .insert(invalid_lexicons)
        .values({
          nsid: event.record.id,
          cid: event.cid,
          repoDid: event.did,
          repoRev: event.rev,
          rawData: event.record,
          reasons: validationResult.reasons,
        })
        .onConflictDoNothing()

      console.warn('Invalid lexicon ingested:', {
        eventId: body.id,
        nsid: event.record.id,
        cid: event.cid,
        repoDid: event.did,
        reasonCount: validationResult.reasons.length,
        reasonTypes: validationResult.reasons.map((r) => r.type),
      })

      return ackEvent('Invalid lexicon stored for debugging')
    }
  } catch (error) {
    console.error('Error processing ingest request:', error)

    // Always acknowledge events that cause unknown errors to prevent potential loops
    return ackEvent('Failed to process request')
  }
}

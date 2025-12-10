import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { invalid_lexicons, valid_lexicons } from '@/db/schema'
import { isCommit, isNexusEvent, isUserEvent } from './types'
import { validateLexicon } from './validation'

/**
 * Acknowledges receipt of a Nexus event.
 * Nexus considers events 'acked' when it receives a 200 response.
 */
function ackEvent(body?: BodyInit) {
  return new NextResponse(body, { status: 200 })
}

/**
 * Signals to Nexus that the event should be sent again later.
 * Nexus will retry events that receive any response other than 200.
 *
 * This should be used sparingly to avoid excessive retries.
 */
function retryEvent(body?: BodyInit) {
  return new NextResponse(body, { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    /* NOTE(caidanw):
     * Nexus sends a variety of event types: 'user' events and 'record' events.
     * Nexus always includes 'user' events, currently no way to configure this.
     * We only want to process 'record' events.
     */
    if (!isNexusEvent(body) || isUserEvent(body)) {
      return ackEvent('Event type not desired')
    }

    const commit = body.record

    // Type guard: ensure commit.record is a LexiconSchemaRecord
    if (!isCommit(commit)) {
      return ackEvent('Not a valid commit')
    }

    // Now commit is typed as Commit (with LexiconSchemaRecord)
    const validationResult = await validateLexicon(commit)

    if (validationResult.isValid) {
      // Valid lexicon: store in valid_lexicons table
      await db
        .insert(valid_lexicons)
        .values({
          nsid: validationResult.lexiconDoc.id,
          cid: commit.cid,
          repoDid: commit.did,
          repoRev: commit.rev,
          data: validationResult.lexiconDoc,
        })
        .onConflictDoNothing()

      console.log('Valid lexicon ingested:', {
        eventId: body.id,
        nsid: validationResult.lexiconDoc.id,
        cid: commit.cid,
        repoDid: commit.did,
        action: commit.action,
      })

      return ackEvent('Valid lexicon ingested successfully')
    } else {
      // Invalid lexicon: store in invalid_lexicons table
      await db
        .insert(invalid_lexicons)
        .values({
          nsid: commit.record.id,
          cid: commit.cid,
          repoDid: commit.did,
          repoRev: commit.rev,
          rawData: commit.record,
          reasons: validationResult.reasons,
        })
        .onConflictDoNothing()

      console.warn('Invalid lexicon ingested:', {
        eventId: body.id,
        nsid: commit.record.id,
        cid: commit.cid,
        repoDid: commit.did,
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

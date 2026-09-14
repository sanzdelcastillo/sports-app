/* Pitchside → calendar file endpoint.
   The app builds the .ics on the phone, compresses it, and opens this URL. Serving it with a
   text/calendar type is what makes iOS show "Add to Calendar" — a home-screen web app cannot
   download a file it generated itself. Nothing is stored; the file lives in the URL. */

import { inflateRawSync } from 'node:zlib'

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

export default function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const compressed = url.searchParams.get('d')
  const raw = url.searchParams.get('r')
  const name = (url.searchParams.get('n') || 'pitchside').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 60) || 'pitchside'
  let body
  try {
    if (compressed) body = inflateRawSync(fromBase64Url(compressed)).toString('utf8')
    else if (raw) body = fromBase64Url(raw).toString('utf8')
  } catch {
    body = null
  }
  if (!body || !body.startsWith('BEGIN:VCALENDAR') || body.length > 200_000) {
    res.status(400).send('Bad calendar link')
    return
  }
  res.setHeader('content-type', 'text/calendar; charset=utf-8')
  res.setHeader('content-disposition', `attachment; filename="${name}.ics"`)
  res.setHeader('cache-control', 'private, max-age=300')
  res.status(200).send(body)
}

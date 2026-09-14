/* Pitchside → TheSportsDB proxy (Vercel serverless function).
   The premium key lives here as an environment variable (SPORTSDB_KEY) and never reaches the browser.
   vercel.json rewrites /api/sportsdb/<version>/<rest> to this function as ?version=&rest=.
   Client calls (no ".php" in the URL — Vercel blocks those at the edge; v1 gets it added here):
     /api/sportsdb/v1/eventsnext?id=133604   → https://www.thesportsdb.com/api/v1/json/<KEY>/eventsnext.php?id=133604
     /api/sportsdb/v2/livescore/soccer       → https://www.thesportsdb.com/api/v2/json/livescore/soccer  (X-API-KEY header)
   Without a key, v1 falls back to the free key and v2 answers 503 so the app knows live scores are off. */

const FREE_KEY = '123'
const UPSTREAM = 'https://www.thesportsdb.com/api'

// Only the endpoints the app uses. Anything else is refused so the key can't be used as a general relay.
const ALLOW_V1 = new Set(['eventsnext', 'eventslast', 'eventsnextleague', 'eventspastleague', 'lookuplineup', 'lookuptable', 'lookuptv', 'lookupevent', 'lookuptimeline', 'lookupeventstats'])
const ALLOW_V2_PREFIX = ['livescore/', 'lookup/event_tv/', 'lookup/event_highlights/', 'list/teams/', 'all/leagues', 'schedule/next/team/', 'schedule/previous/team/']

/** Edge cache per endpoint, in seconds. Live scores stay short; tables can sit for a while. */
function cacheFor(version, rest) {
  if (version === 'v2' && rest.startsWith('livescore/')) return 's-maxage=30, stale-while-revalidate=60'
  if (rest.startsWith('lookuptable')) return 's-maxage=300, stale-while-revalidate=900'
  if (rest.startsWith('lookuplineup')) return 's-maxage=120, stale-while-revalidate=600'
  if (rest.startsWith('lookuptimeline') || rest.startsWith('lookupeventstats')) return 's-maxage=60, stale-while-revalidate=300'
  if (rest.startsWith('lookuptv')) return 's-maxage=600, stale-while-revalidate=3600'
  if (rest.startsWith('lookup/event_highlights')) return 's-maxage=3600, stale-while-revalidate=86400'
  if (rest.startsWith('list/teams')) return 's-maxage=86400, stale-while-revalidate=604800'
  if (rest.startsWith('all/leagues')) return 's-maxage=86400, stale-while-revalidate=604800'
  return 's-maxage=60, stale-while-revalidate=300'
}

export default async function handler(req, res) {
  // The native apps load from capacitor://localhost / https://localhost, so allow cross-origin reads.
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-methods', 'GET, OPTIONS')
  res.setHeader('access-control-allow-headers', 'content-type')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET only' })
    return
  }
  const query = new URL(req.url, 'http://localhost').searchParams
  const version = query.get('version') || ''
  const rest = (query.get('rest') || '').replace(/^\/+|\/+$/g, '')
  query.delete('version')
  query.delete('rest')
  const qs = query.toString()
  const key = process.env.SPORTSDB_KEY

  let upstream
  const headers = { accept: 'application/json' }

  if (version === 'v1') {
    const endpoint = rest.replace(/\.php$/, '')
    if (!ALLOW_V1.has(endpoint)) {
      res.status(404).json({ error: 'Endpoint not allowed' })
      return
    }
    upstream = `${UPSTREAM}/v1/json/${key || FREE_KEY}/${endpoint}.php${qs ? `?${qs}` : ''}`
  } else if (version === 'v2') {
    if (!ALLOW_V2_PREFIX.some((p) => rest.startsWith(p))) {
      res.status(404).json({ error: 'Endpoint not allowed' })
      return
    }
    if (!key) {
      res.status(503).json({ error: 'Premium key not configured' })
      return
    }
    upstream = `${UPSTREAM}/v2/json/${rest}${qs ? `?${qs}` : ''}`
    headers['X-API-KEY'] = key
  } else {
    res.status(404).json({ error: 'Unknown API version' })
    return
  }

  try {
    const r = await fetch(upstream, { headers })
    const body = await r.text()
    res.status(r.status)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', r.ok ? cacheFor(version, rest) : 'no-store')
    res.setHeader('x-pitchside-key', key ? 'premium' : 'free')
    res.send(body)
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Upstream failed' })
  }
}

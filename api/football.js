/* Pitchside → API-Football proxy (Vercel serverless function).
   The key lives here as APIFOOTBALL_KEY and never reaches the browser.
   vercel.json rewrites /api/football/<path> to this function as ?path=<path>.
     /api/football/fixtures?live=all        → https://v3.football.api-sports.io/fixtures?live=all
     /api/football/fixtures/lineups?fixture=1 → .../fixtures/lineups?fixture=1 */

const UPSTREAM = 'https://v3.football.api-sports.io'

// Only what the app uses; the key must not become a general relay.
const ALLOW = new Set(['status', 'fixtures', 'fixtures/lineups', 'fixtures/events', 'fixtures/statistics', 'standings', 'teams', 'leagues'])

/** Edge cache per endpoint. Live data stays short; catalogues sit for a day. */
function cacheFor(path, query) {
  if (path === 'fixtures' && query.has('live')) return 's-maxage=30, stale-while-revalidate=60'
  if (path === 'fixtures') return 's-maxage=120, stale-while-revalidate=600'
  if (path === 'fixtures/lineups') return 's-maxage=120, stale-while-revalidate=600'
  if (path === 'fixtures/events' || path === 'fixtures/statistics') return 's-maxage=60, stale-while-revalidate=300'
  if (path === 'standings') return 's-maxage=600, stale-while-revalidate=3600'
  if (path === 'teams' || path === 'leagues') return 's-maxage=86400, stale-while-revalidate=604800'
  return 's-maxage=60'
}

export default async function handler(req, res) {
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
  const path = (query.get('path') || '').replace(/^\/+|\/+$/g, '')
  query.delete('path')
  if (!ALLOW.has(path)) {
    res.status(404).json({ error: 'Endpoint not allowed' })
    return
  }
  const key = process.env.APIFOOTBALL_KEY
  if (!key) {
    res.status(503).json({ error: 'Football data key not configured' })
    return
  }
  const qs = query.toString()
  try {
    const r = await fetch(`${UPSTREAM}/${path}${qs ? `?${qs}` : ''}`, { headers: { 'x-apisports-key': key, accept: 'application/json' } })
    const body = await r.text()
    res.status(r.status)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', r.ok ? cacheFor(path, query) : 'no-store')
    res.send(body)
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Upstream failed' })
  }
}

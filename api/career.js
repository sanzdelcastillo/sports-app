/* Pitchside → career totals from Wikipedia (Vercel serverless function).
   Fans update the "Career statistics" tables after every game and they count every competition, which
   is what Google shows. We parse the club "Career total" row and the senior international "Total" row.
   Query: name (required), birth (YYYY-MM-DD, used to pick the right person), club (hint for search). */

const API = 'https://en.wikipedia.org/w/api.php'
const UA = 'Pitchside/1.0 (career statistics; https://pitchside-multibrands1.vercel.app)'

function strip(wikitext) {
  // Remove refs, footnote templates and links so numbers stand alone.
  let t = wikitext.replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  for (let i = 0; i < 4; i += 1) t = t.replace(/\{\{[^{}]*\}\}/g, '')
  return t.replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
}

function ints(line) {
  return (line.match(/\d[\d,]*/g) || []).map((n) => Number(n.replace(/,/g, ''))).filter((n) => Number.isFinite(n))
}

/** Numbers of the table row that starts at `idx`: same line after the label, or following `!`/`|` lines until `|-`. */
function rowNumbers(text, idx) {
  const ends = ['\n|-', '\n|}', '\n\n'].map((m) => text.indexOf(m, idx)).filter((i) => i !== -1)
  const end = ends.length ? Math.min(...ends) : idx + 400
  const chunk = text.slice(idx, end)
  return ints(chunk.replace(/^[^\n]*?(Career total|Total)/, ''))
}

/** Text under a heading, up to the next heading of the same or a higher level. */
function sectionAfter(text, heading) {
  const src = `\n${text}`
  const re = new RegExp(`\\n(=+)[ \\t]*${heading}[ \\t]*\\1[ \\t]*\\n`, 'i')
  const m = re.exec(src)
  if (!m) return ''
  const level = m[1].length
  const rest = src.slice(m.index + m[0].length)
  const stop = new RegExp(`\\n={2,${level}}[^=]`).exec(rest)
  return rest.slice(0, stop ? stop.index : undefined)
}

export function parseCareer(rawWikitext) {
  const text = strip(rawWikitext)
  const stats = sectionAfter(text, 'Career statistics')
  if (!stats) return null
  const club = sectionAfter(stats, 'Club') || stats
  let clubApps = null
  let clubGoals = null
  const careerTotal = club.lastIndexOf('Career total')
  if (careerTotal !== -1) {
    const nums = rowNumbers(club, careerTotal)
    if (nums.length >= 2) [clubApps, clubGoals] = nums.slice(-2)
  }
  let intlApps = null
  let intlGoals = null
  const intl = sectionAfter(stats, 'International')
  if (intl) {
    const table = intl.slice(0, intl.indexOf('|}') === -1 ? undefined : intl.indexOf('|}'))
    // Senior team only: the last "Total" row before any all-teams "Career total" (youth sides are listed above it).
    const careerTotalAt = table.indexOf('Career total')
    const scope = careerTotalAt === -1 ? table : table.slice(0, careerTotalAt)
    let idx = -1
    let last = -1
    while ((idx = scope.indexOf('Total', idx + 1)) !== -1) last = idx
    if (last !== -1) {
      const nums = rowNumbers(scope, last)
      if (nums.length >= 2) [intlApps, intlGoals] = nums.slice(-2)
    }
  }
  const birth = /\{\{[Bb]irth[ _]date[^|]*\|(\d{4})\|(\d{1,2})\|(\d{1,2})/.exec(rawWikitext)
  const clubUpdate = /club-update\s*=\s*([^\n|}]+)/.exec(rawWikitext)
  const intlUpdate = /nationalteam-update\s*=\s*([^\n|}]+)/.exec(rawWikitext)
  if (clubApps === null && intlApps === null) return null
  return {
    clubApps,
    clubGoals,
    intlApps,
    intlGoals,
    birthDate: birth ? `${birth[1]}-${birth[2].padStart(2, '0')}-${birth[3].padStart(2, '0')}` : null,
    clubUpdated: clubUpdate ? clubUpdate[1].trim() : null,
    intlUpdated: intlUpdate ? intlUpdate[1].trim() : null,
  }
}

async function wiki(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } })
  if (!r.ok) throw new Error(`Wikipedia ${r.status}`)
  return r.json()
}

async function wikitext(title) {
  const d = await wiki({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: title, redirects: '1' })
  const page = d.query?.pages?.[0]
  return page?.revisions?.[0]?.slots?.main?.content ?? null
}

export async function lookupCareer(name, birth, club) {
  // The exact name first (redirects follow), then a search with disambiguation hints.
  const search = await wiki({ action: 'query', list: 'search', srlimit: '5', srsearch: `${name} footballer${club ? ` ${club}` : ''}` })
  const found = (search.query?.search ?? []).map((s) => s.title)
  const candidates = [name, `${name} (footballer)`, ...found].filter((t, i, all) => all.indexOf(t) === i)
  for (const title of candidates.slice(0, 5)) {
    const text = await wikitext(title)
    if (!text || !/\{\{Infobox football biography/i.test(text)) continue
    const parsed = parseCareer(text)
    if (!parsed) continue
    if (birth && parsed.birthDate && parsed.birthDate !== birth) continue
    return { title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`, ...parsed }
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  const q = new URL(req.url, 'http://localhost').searchParams
  const names = (q.get('names') || q.get('name') || '')
    .split('|')
    .map((n) => n.trim().slice(0, 80))
    .filter((n) => n.length >= 3)
    .slice(0, 4)
  const birth = (q.get('birth') || '').trim().slice(0, 10) || null
  const club = (q.get('club') || '').trim().slice(0, 60) || null
  if (!names.length) {
    res.status(400).json({ error: 'name required' })
    return
  }
  try {
    let result = null
    for (const name of names) {
      result = await lookupCareer(name, birth, club)
      if (result) break
    }
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', result ? 's-maxage=21600, stale-while-revalidate=86400' : 's-maxage=3600')
    res.status(200).json({ result, fetchedAt: new Date().toISOString() })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'lookup failed' })
  }
}

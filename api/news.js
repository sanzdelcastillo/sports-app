/* Pitchside → football headlines (Vercel serverless function).
   Fetches a small allowlist of public football RSS feeds server-side, returns headline + link + source + time.
   Never article text. Cached at the edge for 15 minutes so a thousand phones cost one fetch.
   Licensing note: publishers' RSS terms generally cover personal use; a paid app should hold a news
   license or use a licensed news API before launch. */

const FEEDS = [
  { source: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  { source: 'Sky Sports', url: 'https://www.skysports.com/rss/11095' },
]
const UA = 'Pitchside/1.0 (news headlines; contact via app settings)'
const MAX_ITEMS = 80

function decode(text) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decode(m[1]) : ''
}

/** Parse an RSS 2.0 document into plain headline records. Exported for the validation script. */
export function parseRss(xml, source) {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  return items
    .map((block) => {
      const title = tag(block, 'title')
      const link = tag(block, 'link') || (block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '')
      const published = tag(block, 'pubDate') || tag(block, 'dc:date')
      const ts = published ? Date.parse(published) : NaN
      return {
        title,
        link,
        source,
        publishedAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      }
    })
    .filter((it) => it.title && /^https?:\/\//.test(it.link))
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const r = await fetch(feed.url, { headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml' } })
      if (!r.ok) throw new Error(`${feed.source} ${r.status}`)
      return parseRss(await r.text(), feed.source)
    }),
  )
  const items = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, MAX_ITEMS)
  const failed = results.filter((r) => r.status === 'rejected').length
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', items.length ? 's-maxage=900, stale-while-revalidate=3600' : 'no-store')
  res.status(items.length ? 200 : 503).json({ items, sources: FEEDS.map((f) => f.source), failed, fetchedAt: new Date().toISOString() })
}

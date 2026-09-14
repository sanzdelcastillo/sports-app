import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { openExternal } from '../native/external'
import { fetchHeadlines, followKeywords, isForYou, type Headline } from '../services/news'
import { useAppState } from '../stores/AppState'

function ago(iso: string | null): string {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 60) return `${mins}m`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

function HeadlineRow({ h }: { h: Headline }) {
  return (
    <a
      className="headline"
      href={h.link}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        e.preventDefault()
        void openExternal(h.link)
      }}
    >
      <span className="headline-title">{h.title}</span>
      <span className="headline-meta mono-label">
        {h.source}
        {h.publishedAt ? ` · ${ago(h.publishedAt)}` : ''}
      </span>
    </a>
  )
}

export function News() {
  const { follows } = useAppState()
  const [items, setItems] = useState<Headline[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'mine' | 'all'>('mine')

  useEffect(() => {
    let cancelled = false
    fetchHeadlines()
      .then((d) => {
        if (!cancelled) setItems(d.items)
      })
      .catch(() => {
        if (!cancelled) setError('Headlines are unavailable right now.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const keywords = useMemo(() => followKeywords(follows), [follows])
  const mine = useMemo(() => (items ?? []).filter((h) => isForYou(h, keywords)), [items, keywords])
  const shown = tab === 'mine' ? mine : (items ?? [])

  return (
    <div>
      <AppHeader />
      <h1 className="page-title">News</h1>
      <div className="tabs two" role="tablist" aria-label="News filter">
        <button type="button" role="tab" aria-selected={tab === 'mine'} className={`tab${tab === 'mine' ? ' on' : ''}`} onClick={() => setTab('mine')}>
          Your clubs{items ? ` (${mine.length})` : ''}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'all'} className={`tab${tab === 'all' ? ' on' : ''}`} onClick={() => setTab('all')}>
          All football
        </button>
      </div>

      {error ? <p className="disclaimer">{error}</p> : null}
      {!items && !error ? <p className="disclaimer">Loading headlines…</p> : null}
      {items && shown.length === 0 ? (
        <p className="disclaimer">
          {tab === 'mine' ? 'Nothing about your clubs in the latest headlines. Try All football.' : 'No headlines right now.'}
        </p>
      ) : null}
      <div className="headlines">
        {shown.map((h) => (
          <HeadlineRow key={h.link} h={h} />
        ))}
      </div>
      {items ? (
        <p className="source-note">Headlines from BBC Sport and Sky Sports; tapping opens the source. Pitchside shows titles only.</p>
      ) : null}
    </div>
  )
}

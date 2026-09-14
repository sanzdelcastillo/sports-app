import { getLeague } from '../data/leagues'
import { getTeam } from '../data/teams'
import { accessFor } from '../data/watch'
import type { DestinationId, Fixture, Prediction, Team } from '../domain/types'
import { formatKickoff, zoneAbbr } from './time'

/** Public address of the web app; the shell sets VITE_API_BASE to the same origin. */
export const SITE_URL = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '')

export function gameShareUrl(fixture: Fixture): string {
  return `${SITE_URL}/game/${fixture.id}`
}

function whereLine(fixture: Fixture, subscribed: DestinationId[]): string {
  const access = accessFor(fixture, subscribed)
  if (access.state === 'unknown') return 'Where to watch: not confirmed yet'
  const name = access.destination.shortName
  if (access.state === 'free') return `Free on ${name}`
  return `On ${name}`
}

/** Plain text for WhatsApp / iMessage: kickoff in the sender's zone, where to watch, the call, a link. */
export function gameShareText(fixture: Fixture, subscribed: DestinationId[], prediction?: Prediction | null): string {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const league = getLeague(fixture.leagueId)
  const lines = [
    `${home?.name ?? 'Home'} vs ${away?.name ?? 'Away'} · ${league.name}`,
    `${kick.day} · ${kick.time} (${zoneAbbr()})`,
    whereLine(fixture, subscribed),
  ]
  if (prediction) lines.push(`My call: ${home?.shortName ?? 'Home'} ${prediction.home}–${prediction.away} ${away?.shortName ?? 'Away'}`)
  lines.push('', `Your time zone + where to watch: ${gameShareUrl(fixture)}`)
  return lines.join('\n')
}

/* ---------- image card (canvas, no external images, so it never taints) ---------- */

const W = 1080
const H = 1080
const PITCH_DEEP = '#0E3C29'
const PAPER = '#FBF8F0'
const AMBER = '#E5A62E'
const MUTED = 'rgba(251, 248, 240, 0.7)'

async function ensureFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('700 96px "Barlow Condensed"'),
      document.fonts.load('600 40px "Barlow Condensed"'),
      document.fonts.load('500 30px "IBM Plex Mono"'),
    ])
  } catch {
    /* system fonts will do */
  }
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.lineWidth = 6
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

function team(ctx: CanvasRenderingContext2D, t: Team | undefined, x: number, y: number, score?: number) {
  const color = t?.color ?? '#17643F'
  circle(ctx, x, y, 96, color, PAPER)
  ctx.fillStyle = PAPER
  ctx.font = '700 64px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText((t?.shortName ?? '?').slice(0, 4), x, y + 2)
  ctx.font = '600 44px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.textBaseline = 'alphabetic'
  const name = t?.name ?? ''
  ctx.fillText(name.length > 18 ? `${name.slice(0, 17)}…` : name, x, y + 150)
  if (score !== undefined) {
    ctx.font = '700 104px "Barlow Condensed", "Arial Narrow", sans-serif'
    ctx.fillStyle = AMBER
    ctx.fillText(String(score), x, y + 258)
  }
}

/** Renders the share card as a PNG blob. Text and shapes only — crests are cross-origin and would block export. */
export async function renderGameCard(fixture: Fixture, subscribed: DestinationId[], prediction?: Prediction | null): Promise<Blob | null> {
  await ensureFonts()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const league = getLeague(fixture.leagueId)

  // Background: deep pitch with a faint centre circle and halfway line
  ctx.fillStyle = PITCH_DEEP
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(251, 248, 240, 0.12)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(W / 2, H / 2 + 20, 250, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(W / 2, 0)
  ctx.lineTo(W / 2, H)
  ctx.stroke()

  // Wordmark
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 56px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.fillStyle = PAPER
  ctx.fillText('PITCH', 72, 108)
  const w = ctx.measureText('PITCH').width
  ctx.fillStyle = AMBER
  ctx.fillText('SIDE', 72 + w, 108)

  // League + date, top right
  ctx.textAlign = 'right'
  ctx.font = '500 30px "IBM Plex Mono", monospace'
  ctx.fillStyle = MUTED
  ctx.fillText(league.name.toUpperCase().slice(0, 34), W - 72, 84)
  ctx.fillText(kick.day.toUpperCase(), W - 72, 126)

  // Teams
  team(ctx, home, 270, 400, prediction?.home)
  team(ctx, away, 810, 400, prediction?.away)
  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED
  ctx.font = '600 44px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.fillText(prediction ? 'MY CALL' : 'VS', W / 2, prediction ? 676 : 415)

  // Kickoff time, big
  ctx.fillStyle = PAPER
  ctx.font = '700 132px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.fillText(kick.time.replace(/ [A-Z]{2,4}$/, ''), W / 2, 850)
  ctx.font = '500 30px "IBM Plex Mono", monospace'
  ctx.fillStyle = MUTED
  ctx.fillText(`${zoneAbbr()} · SHOWS IN YOUR TIME ZONE AT THE LINK`, W / 2, 896)

  // Where to watch band
  ctx.fillStyle = 'rgba(251, 248, 240, 0.08)'
  ctx.fillRect(72, 930, W - 144, 86)
  ctx.fillStyle = AMBER
  ctx.font = '600 40px "Barlow Condensed", "Arial Narrow", sans-serif'
  ctx.fillText(whereLine(fixture, subscribed).toUpperCase(), W / 2, 986)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

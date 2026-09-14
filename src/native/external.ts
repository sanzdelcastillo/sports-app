import { Browser } from '@capacitor/browser'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { isNative } from './platform'

/** Open a provider or highlight link outside the app (system browser / in-app browser sheet). */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    await Browser.open({ url, presentationStyle: 'popover' })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function canShare(): boolean {
  return isNative() || (typeof navigator !== 'undefined' && typeof navigator.share === 'function')
}

export async function shareText(title: string, text: string): Promise<void> {
  if (isNative()) {
    await Share.share({ title, text, dialogTitle: title })
    return
  }
  await navigator.share({ title, text })
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function deflate(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

/**
 * Hand a calendar file to the OS.
 * - In the shell: write to the cache folder and open the share sheet ("Add to Calendar" is right there).
 * - In a browser or home-screen web app: open a server link that serves the file as text/calendar, which is
 *   what makes iOS offer "Add to Calendar" and Android/desktop download it. A home-screen web app cannot
 *   download something it generated itself, so the round trip through the server is deliberate.
 */
export async function shareFile(filename: string, content: string, mime: string): Promise<void> {
  if (isNative()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ title: filename, url: uri, dialogTitle: 'Add to calendar' })
    return
  }
  if (mime.startsWith('text/calendar')) {
    const compressed = await deflate(content)
    const param = compressed ? `d=${toBase64Url(compressed)}` : `r=${toBase64Url(new TextEncoder().encode(content))}`
    const name = encodeURIComponent(filename.replace(/\.ics$/, ''))
    window.location.assign(`${apiOrigin()}/api/ics?${param}&n=${name}`)
    return
  }
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function apiOrigin(): string {
  return ((import.meta.env?.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '')
}

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

/**
 * Hand a generated file to the OS. In the shell we write it to the cache folder and open the share sheet,
 * where "Add to Calendar" / Files / Mail appear. In a browser this falls back to a normal download.
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

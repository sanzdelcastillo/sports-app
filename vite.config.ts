import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Local stand-in for api/sportsdb.js so `npm run dev` and `npm run preview`
 * behave like the deployed site. Reads SPORTSDB_KEY from .env.local (never bundled).
 */
function sportsDbProxy(key: string | undefined): Record<string, ProxyOptions> {
  return {
    '/api/sportsdb': {
      target: 'https://www.thesportsdb.com',
      changeOrigin: true,
      headers: key ? { 'X-API-KEY': key } : {},
      rewrite: (path) => {
        const m = path.match(/^\/api\/sportsdb\/(v1|v2)\/(.*)$/)
        if (!m) return path
        const [, version, rest] = m
        if (version === 'v2') return `/api/v2/json/${rest}`
        const [endpoint, qs] = rest.split('?')
        return `/api/v1/json/${key || '123'}/${endpoint.replace(/\.php$/, '')}.php${qs ? `?${qs}` : ''}`
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = sportsDbProxy(env.SPORTSDB_KEY)
  return {
    plugins: [react()],
    server: { host: '0.0.0.0', port: 5173, proxy },
    preview: { host: '0.0.0.0', port: 4173, proxy },
  }
})

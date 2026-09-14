import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Local stand-in for api/sportsdb.js so `npm run dev` and `npm run preview`
 * behave like the deployed site. Reads SPORTSDB_KEY from .env.local (never bundled).
 */
/** Local stand-in for api/news.js so the News tab works in `npm run dev` / `preview`. */
function newsDevMiddleware(): Plugin {
  const handle = async (_req: IncomingMessage, res: ServerResponse) => {
    try {
      // @ts-expect-error plain JS serverless function, typed at the call site
      const mod = (await import('./api/news.js')) as { default: (req: unknown, res: unknown) => Promise<void> }
      const shim = {
        setHeader: (k: string, v: string) => res.setHeader(k, v),
        status: (code: number) => {
          res.statusCode = code
          return shim
        },
        json: (body: unknown) => res.end(JSON.stringify(body)),
        end: () => res.end(),
      }
      await mod.default({ method: 'GET' }, shim)
    } catch (error) {
      res.statusCode = 502
      res.end(JSON.stringify({ error: String(error) }))
    }
  }
  return {
    name: 'pitchside-news-dev',
    configureServer(server) {
      server.middlewares.use('/api/news', (req, res) => void handle(req, res))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/news', (req, res) => void handle(req, res))
    },
  }
}

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
    plugins: [react(), newsDevMiddleware()],
    server: { host: '0.0.0.0', port: 5173, proxy },
    preview: { host: '0.0.0.0', port: 4173, proxy },
  }
})

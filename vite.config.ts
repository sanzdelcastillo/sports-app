import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Local stand-in for api/football.js so `npm run dev` and `npm run preview`
 * behave like the deployed site. Reads APIFOOTBALL_KEY from .env.local (never bundled).
 */
/** Local stand-in for api/news.js so the News tab works in `npm run dev` / `preview`. */
function newsDevMiddleware(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse, file: string) => {
    try {
      const mod = (await import(pathToFileURL(path.resolve(process.cwd(), file)).href)) as { default: (req: unknown, res: unknown) => Promise<void> | void }
      const shim = {
        setHeader: (k: string, v: string) => res.setHeader(k, v),
        status: (code: number) => {
          res.statusCode = code
          return shim
        },
        json: (body: unknown) => res.end(JSON.stringify(body)),
        send: (body: string) => res.end(body),
        end: () => res.end(),
      }
      await mod.default({ method: 'GET', url: req.url ?? '/' }, shim)
    } catch (error) {
      res.statusCode = 502
      res.end(JSON.stringify({ error: String(error) }))
    }
  }
  return {
    name: 'pitchside-news-dev',
    configureServer(server) {
      server.middlewares.use('/api/news', (req, res) => void handle(req, res, './api/news.js'))
      server.middlewares.use('/api/ics', (req, res) => void handle(req, res, './api/ics.js'))
      server.middlewares.use('/api/career', (req, res) => void handle(req, res, './api/career.js'))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/news', (req, res) => void handle(req, res, './api/news.js'))
      server.middlewares.use('/api/ics', (req, res) => void handle(req, res, './api/ics.js'))
      server.middlewares.use('/api/career', (req, res) => void handle(req, res, './api/career.js'))
    },
  }
}

function footballProxy(key: string | undefined): Record<string, ProxyOptions> {
  return {
    '/api/football': {
      target: 'https://v3.football.api-sports.io',
      changeOrigin: true,
      headers: key ? { 'x-apisports-key': key } : {},
      rewrite: (path) => path.replace(/^\/api\/football\//, '/'),
    },
  }
}


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = footballProxy(env.APIFOOTBALL_KEY)
  return {
    plugins: [react(), newsDevMiddleware()],
    server: { host: '0.0.0.0', port: 5173, proxy },
    preview: { host: '0.0.0.0', port: 4173, proxy },
  }
})

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.API_PORT || 3000)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const apiRoot = resolve(projectRoot, 'api')
const require = createRequire(import.meta.url)
const typescript = require('typescript')

require.extensions['.ts'] = (module, filename) => {
  const source = readFileSync(filename, 'utf8')
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText
  module._compile(compiled, filename)
}

async function loadLocalEnvironment() {
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = await readFile(resolve(projectRoot, filename), 'utf8')
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
        if (!match || process.env[match[1]] !== undefined) continue
        let value = match[2].trim()
        if (
          (value.startsWith('"') && value.endsWith('"'))
          || (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        process.env[match[1]] = value
      }
    } catch {
      // The file is optional for health checks.
    }
  }
}

await loadLocalEnvironment()

function findApiHandler(pathname, query) {
  if (!pathname.startsWith('/api/')) return null
  const route = pathname.slice('/api/'.length)
  const parts = route.split('/')
  if (parts.some((part) => !part || part === '.' || part === '..')) return null

  const exactPath = resolve(apiRoot, ...parts) + '.ts'
  if (!exactPath.startsWith(apiRoot)) return null
  try {
    return require(exactPath).default
  } catch (error) {
    if (error?.code !== 'MODULE_NOT_FOUND') throw error
  }

  if (parts.length === 2 && parts[0] === 'products') {
    const dynamicPath = resolve(apiRoot, 'products', '[id].ts')
    query.id = parts[1]
    try {
      return require(dynamicPath).default
    } catch (error) {
      if (error?.code !== 'MODULE_NOT_FOUND') throw error
    }
  }
  return null
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 1024 * 1024) throw new Error('Request body too large.')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return undefined
  const text = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON request body.')
  }
}

function createLocalHealthResponse() {
  const url = process.env.SUPABASE_URL?.trim()
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  const configured = Boolean(url && publishableKey)
  let supabaseReachable = false

  if (configured) {
    try {
      const probe = spawnSync('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        resolve(projectRoot, 'scripts/check-supabase.ps1'),
      ], {
        encoding: 'utf8',
        timeout: 20000,
        env: {
          ...process.env,
          SUPABASE_URL: url,
          SUPABASE_PUBLISHABLE_KEY: publishableKey,
        },
      })
      supabaseReachable = probe.status === 0 && probe.stdout.includes('reachable')
    } catch {
      supabaseReachable = false
    }
  }

  const status = !configured
    ? 'configuration_missing'
    : supabaseReachable
      ? 'ok'
      : 'supabase_unreachable'
  return {
    statusCode: status === 'ok' ? 200 : 503,
    body: {
      status,
      service: 'ismahub-api',
      timestamp: new Date().toISOString(),
      configuration: {
        supabase_url: Boolean(url),
        supabase_publishable_key: Boolean(publishableKey),
        supabase_secret_key: Boolean(process.env.SUPABASE_SECRET_KEY?.trim()),
      },
      supabase: { reachable: supabaseReachable },
    },
  }
}

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.status = (statusCode) => {
    response.statusCode = statusCode
    return response
  }
  response.json = (payload) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
    return response
  }

  const requestUrl = new URL(request.url || '/', `http://127.0.0.1:${port}`)
  const query = {}
  for (const [key, value] of requestUrl.searchParams) {
    if (key in query) {
      query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value]
    } else {
      query[key] = value
    }
  }

  try {
    if (requestUrl.pathname === '/api/health' && request.method === 'GET') {
      const health = createLocalHealthResponse()
      response.status(health.statusCode).json(health.body)
      return
    }

    request.query = query
    request.body = await readJsonBody(request)

    const handler = findApiHandler(requestUrl.pathname, query)
    if (!handler) {
      response.status(404).json({ error: 'API route not found.' })
      return
    }
    await handler(request, response)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const statusCode = message === 'Invalid JSON request body.' ? 400
      : message === 'Request body too large.' ? 413
        : 500
    response.status(statusCode).json({
      error: statusCode === 500 ? 'An unexpected server error occurred.' : message,
    })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`IsmaHub local API server listening at http://127.0.0.1:${port}`)
})

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ApiRequest = IncomingMessage & { body?: unknown }

const COOKIE_NAME = 'qg_admin_session'
const SESSION_TTL_SECONDS = 8 * 60 * 60

function getCredentials() {
  const password = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.ADMIN_SESSION_SECRET
  if (!password || password.length < 16 || !sessionSecret || sessionSecret.length < 32) return undefined
  return { password, sessionSecret }
}

function getConfigurationError(): string {
  const password = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.ADMIN_SESSION_SECRET
  if (!password || password.length < 16) return 'Configure ADMIN_PASSWORD com pelo menos 16 caracteres.'
  if (!sessionSecret || sessionSecret.length < 32) return 'Configure ADMIN_SESSION_SECRET com pelo menos 32 caracteres aleatórios.'
  return 'A autenticação administrativa não está configurada.'
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store, private')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.end(JSON.stringify(body))
}

function getCookie(request: ApiRequest): string | undefined {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return undefined
  const cookie = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`))
  return cookie?.slice(COOKIE_NAME.length + 1)
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function hasValidSession(request: ApiRequest, secret: string): boolean {
  const token = getCookie(request)
  if (!token || token.length > 512) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [expiresAt, nonce, receivedSignature] = parts
  if (!nonce || !receivedSignature) return false

  const payload = `${expiresAt}.${nonce}`
  const expectedSignature = sign(payload, secret)
  const received = Buffer.from(receivedSignature)
  const expected = Buffer.from(expectedSignature)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false

  const expiry = Number(expiresAt)
  return Number.isSafeInteger(expiry) && expiry > Math.floor(Date.now() / 1000)
}

function setSessionCookie(request: ApiRequest, response: ServerResponse, value: string, maxAge: number) {
  const forwardedProto = request.headers['x-forwarded-proto']
  const isHttps = forwardedProto === 'https' || (Array.isArray(forwardedProto) && forwardedProto.includes('https'))
  const host = request.headers.host ?? ''
  const isLocalHost = host.includes('localhost') || host.startsWith('127.0.0.1')
  const secure = isHttps || !isLocalHost ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`,
  )
}

function submittedPassword(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined
  const password = (body as { password?: unknown }).password
  return typeof password === 'string' ? password : undefined
}

export default async function handler(request: ApiRequest, response: ServerResponse) {
  const credentials = getCredentials()

  if (request.method === 'GET') {
    sendJson(response, 200, {
      configured: Boolean(credentials),
      authenticated: Boolean(credentials && hasValidSession(request, credentials.sessionSecret)),
      error: credentials ? undefined : getConfigurationError(),
    })
    return
  }

  if (request.method === 'POST') {
    if (!credentials) {
      sendJson(response, 503, { configured: false, error: getConfigurationError() })
      return
    }

    const password = submittedPassword(request.body)
    if (!password || password.length > 512) {
      sendJson(response, 400, { configured: true, error: 'Informe uma senha válida.' })
      return
    }

    const provided = Buffer.from(password)
    const expected = Buffer.from(credentials.password)
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      sendJson(response, 401, { configured: true, error: 'Senha incorreta.' })
      return
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
    const payload = `${expiresAt}.${randomUUID()}`
    const token = `${payload}.${sign(payload, credentials.sessionSecret)}`
    setSessionCookie(request, response, token, SESSION_TTL_SECONDS)
    sendJson(response, 200, { configured: true, authenticated: true })
    return
  }

  if (request.method === 'DELETE') {
    setSessionCookie(request, response, '', 0)
    sendJson(response, 200, { configured: Boolean(credentials), authenticated: false })
    return
  }

  response.setHeader('Allow', 'GET, POST, DELETE')
  sendJson(response, 405, { error: 'Método não permitido.' })
}

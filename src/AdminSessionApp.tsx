import { useEffect, useState } from 'react'
import App from './App'
import type { AdminAuth } from './auth'

type SessionResponse = {
  configured?: boolean
  authenticated?: boolean
  error?: string
}

async function readResponse(response: Response): Promise<SessionResponse> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('A função de autenticação não está disponível. Para testá-la localmente, use `npx vercel dev`.')
  }
  let payload: SessionResponse
  try {
    payload = await response.json() as SessionResponse
  } catch {
    throw new Error('O servidor retornou uma resposta inválida.')
  }
  if (!response.ok) throw new Error(payload.error || `Falha no servidor (${response.status}).`)
  return payload
}

export default function AdminSessionApp() {
  const [configured, setConfigured] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/admin-session', { cache: 'no-store' })
      .then(readResponse)
      .then(payload => {
        if (!active) return
        setConfigured(Boolean(payload.configured))
        setAuthorized(Boolean(payload.authenticated))
        setError(payload.configured ? '' : payload.error || '')
      })
      .catch(reason => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : String(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const login = async (password: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const payload = await readResponse(response)
      setConfigured(Boolean(payload.configured))
      setAuthorized(Boolean(payload.authenticated))
      if (!payload.authenticated) throw new Error('O servidor não confirmou o acesso administrativo.')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      setAuthorized(false)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin-session', { method: 'DELETE', cache: 'no-store' })
      await readResponse(response)
      setAuthorized(false)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const auth: AdminAuth = { configured, authorized, loading, error, login, logout }
  return <App auth={auth} />
}

export type AdminAuth = {
  configured: boolean
  authorized: boolean
  loading: boolean
  error?: string
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

import { apiGet, apiPost } from '../lib/api'

/** Which part of the site an account belongs to. Referral agent is not a role: it's a
 * profile a tourist account can switch on (see `isReferralAgent`). */
export type Role = 'tourist' | 'guide' | 'admin'

/** What every sign-in-shaped response says about the user. */
export interface AuthResult {
  role: Role
  isReferralAgent: boolean
  /** Where to land after signing in, decided by the server (it depends on whether the
   * user has bookings). Unprefixed: pass through localizeHome() before navigating. */
  home: string
}

interface AuthResultApiShape {
  role: Role
  is_referral_agent: boolean
  home: string
}

export interface MeResponse extends AuthResult {
  name: string
  email: string
}

interface MeApiShape extends AuthResultApiShape {
  name: string
  email: string
}

function mapAuthResult(raw: AuthResultApiShape): AuthResult {
  return { role: raw.role, isReferralAgent: raw.is_referral_agent, home: raw.home }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return mapAuthResult(await apiPost<AuthResultApiShape>('/api/auth/login/', { email, password }))
}

export function logout(): Promise<void> {
  return apiPost<void>('/api/auth/logout/')
}

export async function fetchMe(): Promise<MeResponse> {
  const raw = await apiGet<MeApiShape>('/api/auth/me/')
  return { ...mapAuthResult(raw), name: raw.name, email: raw.email }
}

interface RegisterInput {
  email: string
  name: string
  password: string
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  return mapAuthResult(await apiPost<AuthResultApiShape>('/api/auth/register/', input))
}

export async function setPassword(uid: string, token: string, password: string): Promise<AuthResult> {
  return mapAuthResult(await apiPost<AuthResultApiShape>('/api/auth/set-password/', { uid, token, password }))
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiPost<void>('/api/auth/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
  })
}

import { apiGet, apiPost } from '../lib/api'

export type Role = 'tourist' | 'guide' | 'sales' | 'operations' | 'admin'

interface RoleResponse {
  role: Role
}

export interface MeResponse {
  role: Role
  name: string
  email: string
}

export function login(email: string, password: string): Promise<RoleResponse> {
  return apiPost<RoleResponse>('/api/auth/login/', { email, password })
}

export function logout(): Promise<void> {
  return apiPost<void>('/api/auth/logout/')
}

export function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/api/auth/me/')
}

interface RegisterInput {
  email: string
  name: string
  password: string
}

export function register(input: RegisterInput): Promise<RoleResponse> {
  return apiPost<RoleResponse>('/api/auth/register/', input)
}

export function setPassword(uid: string, token: string, password: string): Promise<RoleResponse> {
  return apiPost<RoleResponse>('/api/auth/set-password/', { uid, token, password })
}

export const ROLE_HOME: Record<Role, string> = {
  tourist: '/account',
  guide: '/guide',
  sales: '/admin',
  operations: '/admin',
  admin: '/admin',
}

import { apiGet, apiPost } from '../lib/api'

export type Role = 'tourist' | 'guide' | 'sales' | 'operations' | 'admin'

interface RoleResponse {
  role: Role
}

export function login(email: string, password: string): Promise<RoleResponse> {
  return apiPost<RoleResponse>('/api/auth/login/', { email, password })
}

export function logout(): Promise<void> {
  return apiPost<void>('/api/auth/logout/')
}

export function fetchMe(): Promise<RoleResponse> {
  return apiGet<RoleResponse>('/api/auth/me/')
}

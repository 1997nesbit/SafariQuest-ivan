import { apiGet, apiPost } from '../lib/api'

export type StaffRole = 'sales' | 'operations' | 'admin' | 'guide'
export type InvitableRole = 'sales' | 'operations' | 'guide'

export interface AdminUserRecord {
  id: number
  name: string
  email: string
  role: StaffRole
}

export interface InviteUserInput {
  name: string
  email: string
  role: InvitableRole
}

export function getUsers(): Promise<AdminUserRecord[]> {
  return apiGet<AdminUserRecord[]>('/api/users/')
}

export function inviteUser(input: InviteUserInput): Promise<AdminUserRecord> {
  return apiPost<AdminUserRecord>('/api/users/', input)
}

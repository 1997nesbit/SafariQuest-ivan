import { apiGet, apiPost } from '../lib/api'

export type GuideRole = 'Senior Guide' | 'Expert Guide' | 'Driver-Guide' | 'Camp Chef' | 'Tour Helper'
export type GuideStatus = 'Available' | 'On Trip' | 'Off-Duty'

export interface Guide {
  id: number
  name: string
  role: GuideRole
  status: GuideStatus
  rating: number
}

export interface GuideInput {
  name: string
  role: GuideRole
  status: GuideStatus
}

interface GuideApiShape {
  id: number
  name: string
  role: GuideRole
  status: GuideStatus
  rating: string
}

function mapGuide(raw: GuideApiShape): Guide {
  return { id: raw.id, name: raw.name, role: raw.role, status: raw.status, rating: Number(raw.rating) }
}

export async function getGuides(): Promise<Guide[]> {
  const raw = await apiGet<GuideApiShape[]>('/api/guides/')
  return raw.map(mapGuide)
}

export async function createGuide(input: GuideInput): Promise<Guide> {
  const raw = await apiPost<GuideApiShape>('/api/guides/', input)
  return mapGuide(raw)
}

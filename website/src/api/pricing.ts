import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

export interface Season {
  id: number
  name: string
  startDate: string
  endDate: string
  multiplier: number
}

export interface SeasonInput {
  name: string
  startDate: string
  endDate: string
  multiplier: number
}

interface SeasonApiShape {
  id: number
  name: string
  start_date: string
  end_date: string
  multiplier: string
}

function mapSeason(raw: SeasonApiShape): Season {
  return {
    id: raw.id,
    name: raw.name,
    startDate: raw.start_date,
    endDate: raw.end_date,
    multiplier: Number(raw.multiplier),
  }
}

function toApiPayload(input: SeasonInput) {
  return {
    name: input.name,
    start_date: input.startDate,
    end_date: input.endDate,
    multiplier: input.multiplier,
  }
}

export async function getSeasons(): Promise<Season[]> {
  const raw = await apiGet<SeasonApiShape[]>('/api/pricing/seasons/')
  return raw.map(mapSeason)
}

export async function createSeason(input: SeasonInput): Promise<Season> {
  const raw = await apiPost<SeasonApiShape>('/api/pricing/seasons/', toApiPayload(input))
  return mapSeason(raw)
}

export async function updateSeason(id: number, input: SeasonInput): Promise<Season> {
  const raw = await apiPatch<SeasonApiShape>(`/api/pricing/seasons/${id}/`, toApiPayload(input))
  return mapSeason(raw)
}

export function deleteSeason(id: number): Promise<void> {
  return apiDelete(`/api/pricing/seasons/${id}/`)
}

import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

export interface Park {
  id: string
  region: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  about: string
  wildlife: string
  gettingThere: string
}

interface ParkApiShape {
  slug: string
  region: string
  name: string
  images: string[]
  image_alt: string
  badge: string
  tags: string[]
  best_time_to_visit: string
  highlight: string
  about: string
  wildlife: string
  getting_there: string
}

function mapPark(raw: ParkApiShape): Park {
  return {
    id: raw.slug,
    region: raw.region,
    name: raw.name,
    images: raw.images,
    imageAlt: raw.image_alt,
    badge: raw.badge,
    tags: raw.tags,
    bestTimeToVisit: raw.best_time_to_visit,
    highlight: raw.highlight,
    about: raw.about,
    wildlife: raw.wildlife,
    gettingThere: raw.getting_there,
  }
}

export async function getParks(): Promise<Park[]> {
  const raw = await apiGet<ParkApiShape[]>('/api/parks/')
  return raw.map(mapPark)
}

export async function getPark(id: string): Promise<Park> {
  const raw = await apiGet<ParkApiShape>(`/api/parks/${id}/`)
  return mapPark(raw)
}

export interface ParkInput {
  slug: string
  region: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  about: string
  wildlife: string
  gettingThere: string
}

function toApiShape(input: ParkInput): ParkApiShape {
  return {
    slug: input.slug,
    region: input.region,
    name: input.name,
    images: input.images,
    image_alt: input.imageAlt,
    badge: input.badge,
    tags: input.tags,
    best_time_to_visit: input.bestTimeToVisit,
    highlight: input.highlight,
    about: input.about,
    wildlife: input.wildlife,
    getting_there: input.gettingThere,
  }
}

export async function createPark(input: ParkInput): Promise<Park> {
  const raw = await apiPost<ParkApiShape>('/api/parks/', toApiShape(input))
  return mapPark(raw)
}

export async function updatePark(slug: string, input: ParkInput): Promise<Park> {
  const raw = await apiPatch<ParkApiShape>(`/api/parks/${slug}/`, toApiShape(input))
  return mapPark(raw)
}

export async function deletePark(slug: string): Promise<void> {
  await apiDelete(`/api/parks/${slug}/`)
}

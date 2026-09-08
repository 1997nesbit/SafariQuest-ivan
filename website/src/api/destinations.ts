import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

export interface DestinationExperience {
  name: string
  description: string
}

export interface Destination {
  id: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
  about: string
  wildlife: string
  gettingThere: string
  experiences: DestinationExperience[]
}

interface DestinationApiShape {
  slug: string
  name: string
  images: string[]
  image_alt: string
  badge: string
  tags: string[]
  best_time_to_visit: string
  highlight: string
  link_label: string
  about: string
  wildlife: string
  getting_there: string
  experiences: DestinationExperience[]
}

function mapDestination(raw: DestinationApiShape): Destination {
  return {
    id: raw.slug,
    name: raw.name,
    images: raw.images,
    imageAlt: raw.image_alt,
    badge: raw.badge,
    tags: raw.tags,
    bestTimeToVisit: raw.best_time_to_visit,
    highlight: raw.highlight,
    linkLabel: raw.link_label,
    about: raw.about,
    wildlife: raw.wildlife,
    gettingThere: raw.getting_there,
    experiences: raw.experiences,
  }
}

export async function getDestinations(): Promise<Destination[]> {
  const raw = await apiGet<DestinationApiShape[]>('/api/destinations/')
  return raw.map(mapDestination)
}

export async function getDestination(id: string): Promise<Destination> {
  const raw = await apiGet<DestinationApiShape>(`/api/destinations/${id}/`)
  return mapDestination(raw)
}

export interface DestinationInput {
  slug: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
  about: string
  wildlife: string
  gettingThere: string
  experiences: DestinationExperience[]
}

function toApiShape(input: DestinationInput): DestinationApiShape {
  return {
    slug: input.slug,
    name: input.name,
    images: input.images,
    image_alt: input.imageAlt,
    badge: input.badge,
    tags: input.tags,
    best_time_to_visit: input.bestTimeToVisit,
    highlight: input.highlight,
    link_label: input.linkLabel,
    about: input.about,
    wildlife: input.wildlife,
    getting_there: input.gettingThere,
    experiences: input.experiences,
  }
}

export async function createDestination(input: DestinationInput): Promise<Destination> {
  const raw = await apiPost<DestinationApiShape>('/api/destinations/', toApiShape(input))
  return mapDestination(raw)
}

export async function updateDestination(slug: string, input: DestinationInput): Promise<Destination> {
  const raw = await apiPatch<DestinationApiShape>(`/api/destinations/${slug}/`, toApiShape(input))
  return mapDestination(raw)
}

export async function deleteDestination(slug: string): Promise<void> {
  await apiDelete(`/api/destinations/${slug}/`)
}

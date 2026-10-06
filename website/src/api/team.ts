import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '../i18n/locales'

/** A site language that can carry its own translated text — every language
 * except English, which lives in TeamMember's plain fields. */
export type TranslationLocale = Exclude<Locale, 'en'>

/** Derived from the site's language list, so a new language shows up in the
 * admin form on its own. The backend keeps its own copy
 * (team.models.TRANSLATION_LOCALES) and rejects a language it doesn't know,
 * so adding one here without adding it there fails loudly on save. */
export const TRANSLATION_LOCALES = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE) as TranslationLocale[]

/** Field length limits, matching the backend (team.models / the serializer). The
 * form uses them so people are stopped while typing, not after a failed save. */
export const TEAM_LIMITS = { name: 150, title: 150, bio: 2000, photoAlt: 255, photoUrl: 500, phone: 30, email: 254 } as const

export interface TeamTexts {
  title: string
  bio: string
  photoAlt: string
}

/** A language's overrides. Any field left out falls back to the English text. */
export type TeamTranslations = Partial<Record<TranslationLocale, Partial<TeamTexts>>>

export interface TeamMember {
  id: number
  name: string
  title: string
  bio: string
  photo: string
  photoAlt: string
  /** Personal contact details. Both are optional; blank means not shared. */
  phone: string
  email: string
  translations: TeamTranslations
  order: number
  isPublished: boolean
}

interface TeamTextsApiShape {
  title?: string
  bio?: string
  photo_alt?: string
}

interface TeamMemberApiShape {
  id: number
  name: string
  title: string
  bio: string
  photo: string
  photo_alt: string
  phone: string
  email: string
  translations: Record<string, TeamTextsApiShape>
  order: number
  is_published: boolean
}

function mapTranslations(raw: Record<string, TeamTextsApiShape>): TeamTranslations {
  const translations: TeamTranslations = {}
  for (const locale of TRANSLATION_LOCALES) {
    const texts = raw[locale]
    if (texts) translations[locale] = { title: texts.title, bio: texts.bio, photoAlt: texts.photo_alt }
  }
  return translations
}

function mapTeamMember(raw: TeamMemberApiShape): TeamMember {
  return fromApiShape<TeamMemberApiShape, TeamMember>(raw, {
    translations: (r) => mapTranslations(r.translations),
  })
}

/** Published members, in display order — what visitors see. Pass
 * `includeUnpublished` from the admin content manager to see drafts too; the
 * server ignores it for anyone who isn't an admin. */
export async function getTeam(options: { includeUnpublished?: boolean } = {}): Promise<TeamMember[]> {
  const raw = await apiGet<TeamMemberApiShape[]>(`/api/team/${options.includeUnpublished ? '?all=true' : ''}`)
  return raw.map(mapTeamMember)
}

export async function getTeamMember(id: number | string): Promise<TeamMember> {
  const raw = await apiGet<TeamMemberApiShape>(`/api/team/${id}/`)
  return mapTeamMember(raw)
}

export interface TeamMemberInput {
  name: string
  title: string
  bio: string
  photo: string
  photoAlt: string
  phone: string
  email: string
  translations: TeamTranslations
  order: number
  isPublished: boolean
}

type TeamMemberWriteShape = Omit<TeamMemberApiShape, 'id'>

function toTeamMemberApiShape(input: TeamMemberInput): TeamMemberWriteShape {
  return toApiShape<TeamMemberInput, TeamMemberWriteShape>(input, {
    // Blank strings are sent as-is: the server drops empty entries, which is
    // what makes "left this language empty" mean "show the English text".
    translations: (i) => {
      const out: Record<string, TeamTextsApiShape> = {}
      for (const locale of TRANSLATION_LOCALES) {
        const texts = i.translations[locale]
        if (texts) out[locale] = { title: texts.title ?? '', bio: texts.bio ?? '', photo_alt: texts.photoAlt ?? '' }
      }
      return out
    },
  })
}

export async function createTeamMember(input: TeamMemberInput): Promise<TeamMember> {
  const raw = await apiPost<TeamMemberApiShape>('/api/team/', toTeamMemberApiShape(input))
  return mapTeamMember(raw)
}

export async function updateTeamMember(id: number, input: TeamMemberInput): Promise<TeamMember> {
  const raw = await apiPatch<TeamMemberApiShape>(`/api/team/${id}/`, toTeamMemberApiShape(input))
  return mapTeamMember(raw)
}

export async function deleteTeamMember(id: number): Promise<void> {
  await apiDelete(`/api/team/${id}/`)
}

/** The text to show for `locale`, falling back to English field by field — a
 * member translated into French but with no French photo description still
 * gets the English one, rather than a blank. `||` not `??` on purpose: an
 * empty string is "not translated" here, same as a missing key. */
export function localizedTeamTexts(member: TeamMember, locale: Locale): TeamTexts {
  const translated = locale === DEFAULT_LOCALE ? undefined : member.translations[locale as TranslationLocale]
  return {
    title: translated?.title || member.title,
    bio: translated?.bio || member.bio,
    photoAlt: translated?.photoAlt || member.photoAlt || member.name,
  }
}

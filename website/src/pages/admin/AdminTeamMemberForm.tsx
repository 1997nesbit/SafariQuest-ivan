import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Check } from '@phosphor-icons/react'
import {
  createTeamMember,
  getTeamMember,
  TEAM_LIMITS,
  TRANSLATION_LOCALES,
  updateTeamMember,
  type TeamMember,
  type TeamMemberInput,
  type TeamTexts,
  type TeamTranslations,
} from '../../api/team'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '../../i18n/locales'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { ToggleSwitch } from '../../components/admin/FormControls'
import { ImageDropzone } from '../../components/admin/ImageDropzone'

const BACK_TO_LIST = '/admin/content?tab=Team'

export function AdminTeamMemberForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { data: existing, loading, error } = useFetch(
    () => (id ? getTeamMember(id) : Promise.resolve(null)),
    [id],
  )

  if (isEditing && loading) {
    return <div className="py-20 text-center text-on-surface-variant">Loading team member…</div>
  }

  // Without this, a failed load (deleted in another tab, bad id) would fall through to an
  // empty form that looks like "add new" but PATCHes an id that doesn't exist.
  if (isEditing && (error || !existing)) {
    return (
      <div className="py-20 text-center">
        <p className="text-error mb-4">{error ?? 'Team member not found.'}</p>
        <Link to={BACK_TO_LIST} className="text-savanna-green font-label-md text-sm hover:underline">
          Back to Content Manager
        </Link>
      </div>
    )
  }

  return <TeamMemberFormFields key={id ?? 'new'} initial={existing} isEditing={isEditing} memberId={id ? Number(id) : undefined} />
}

type FormTexts = Record<Locale, TeamTexts>

function initialTexts(initial: TeamMember | null): FormTexts {
  const texts = {
    en: { title: initial?.title ?? '', bio: initial?.bio ?? '', photoAlt: initial?.photoAlt ?? '' },
  } as FormTexts
  for (const locale of TRANSLATION_LOCALES) {
    const translated = initial?.translations[locale]
    texts[locale] = { title: translated?.title ?? '', bio: translated?.bio ?? '', photoAlt: translated?.photoAlt ?? '' }
  }
  return texts
}

const fieldClass =
  'w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green'

function TeamMemberFormFields({
  initial,
  isEditing,
  memberId,
}: {
  initial: TeamMember | null
  isEditing: boolean
  memberId?: number
}) {
  const navigate = useNavigate()

  const [name, setName] = useState(initial?.name ?? '')
  const [order, setOrder] = useState(String(initial?.order ?? 0))
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true)
  const [photo, setPhoto] = useState(initial?.photo ?? '')
  const [texts, setTexts] = useState<FormTexts>(() => initialTexts(initial))
  const [activeLocale, setActiveLocale] = useState<Locale>('en')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const active = texts[activeLocale]
  const isEnglish = activeLocale === 'en'

  function updateText(field: keyof TeamTexts, value: string) {
    setTexts((current) => ({ ...current, [activeLocale]: { ...current[activeLocale], [field]: value } }))
  }

  function hasContent(locale: Locale) {
    const t = texts[locale]
    return Boolean(t.title.trim() || t.bio.trim() || t.photoAlt.trim())
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    // `required` on the name input lets a whitespace-only value through.
    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    // Checked here rather than with `required`: only the active language's inputs are
    // mounted, so the browser can't validate the English fields while another tab is open.
    if (!texts.en.title.trim() || !texts.en.bio.trim()) {
      setActiveLocale('en')
      setError(
        'English title and bio are required — they are what visitors see for any language without its own translation.',
      )
      return
    }

    const translations: TeamTranslations = {}
    for (const locale of TRANSLATION_LOCALES) translations[locale] = texts[locale]

    const input: TeamMemberInput = {
      name: name.trim(),
      title: texts.en.title.trim(),
      bio: texts.en.bio.trim(),
      photo,
      photoAlt: texts.en.photoAlt.trim(),
      translations,
      order: Number(order) || 0,
      isPublished,
    }

    setSaving(true)
    try {
      if (isEditing && memberId !== undefined) {
        await updateTeamMember(memberId, input)
      } else {
        await createTeamMember(input)
      }
      navigate(BACK_TO_LIST)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant mb-1">
          <Link to={BACK_TO_LIST} className="hover:text-savanna-green transition-colors">
            Content Manager
          </Link>
          <CaretRight size={12} />
          <span>Team</span>
          <CaretRight size={12} />
          <span className="text-on-surface font-semibold">{isEditing ? name || 'Edit' : 'Add Team Member'}</span>
        </nav>
        <h1 className="font-headline-md text-[22px] text-on-surface">{isEditing ? 'Edit Team Member' : 'Add Team Member'}</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Shown under &ldquo;Meet the Experts&rdquo; on the About page.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-error rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Name</h3>
            <div>
              <label htmlFor="tm-name" className="block font-label-sm text-label-sm mb-1.5">
                Full name
              </label>
              <input
                id="tm-name"
                required
                maxLength={TEAM_LIMITS.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
              <p className="text-on-surface-variant text-xs mt-1.5">The same in every language.</p>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <div>
              <h3 className="font-headline-md text-[18px] text-on-surface">Title &amp; bio by language</h3>
              <p className="text-on-surface-variant text-sm mt-1">
                English is required. Any other language you leave blank shows the English text to visitors reading the
                site in that language.
              </p>
            </div>

            <div role="tablist" aria-label="Language" className="flex flex-wrap gap-2 border-b border-sand-stone">
              {SUPPORTED_LOCALES.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  role="tab"
                  aria-selected={activeLocale === locale}
                  onClick={() => setActiveLocale(locale)}
                  className={`flex items-center gap-2 min-h-[44px] px-4 font-label-md text-sm border-b-2 -mb-px transition-colors ${
                    activeLocale === locale
                      ? 'text-savanna-green font-bold border-savanna-green'
                      : 'border-transparent text-on-surface-variant hover:text-savanna-green'
                  }`}
                >
                  {LOCALE_LABELS[locale]}
                  {/* Shows at a glance which languages have any text, without opening each tab. */}
                  {locale !== 'en' && (
                    <span
                      title={hasContent(locale) ? 'Has a translation' : 'Not translated — shows English'}
                      className={`w-2 h-2 rounded-full ${hasContent(locale) ? 'bg-savanna-green' : 'bg-sand-stone'}`}
                    />
                  )}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="space-y-5">
              <div>
                <label htmlFor="tm-title" className="block font-label-sm text-label-sm mb-1.5">
                  Title{isEnglish ? '' : ` (${LOCALE_LABELS[activeLocale]})`}
                </label>
                <input
                  id="tm-title"
                  maxLength={TEAM_LIMITS.title}
                  value={active.title}
                  onChange={(e) => updateText('title', e.target.value)}
                  placeholder={isEnglish ? 'e.g. Senior Field Guide & Tracker' : texts.en.title}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="tm-bio" className="block font-label-sm text-label-sm mb-1.5">
                  Bio{isEnglish ? '' : ` (${LOCALE_LABELS[activeLocale]})`}
                </label>
                <textarea
                  id="tm-bio"
                  rows={5}
                  maxLength={TEAM_LIMITS.bio}
                  value={active.bio}
                  onChange={(e) => updateText('bio', e.target.value)}
                  placeholder={isEnglish ? '' : texts.en.bio}
                  className={fieldClass}
                />
                <p className="text-on-surface-variant text-xs mt-1.5">
                  The card shows about three lines, so lead with what matters most.{' '}
                  <span aria-live="off">
                    {active.bio.length}/{TEAM_LIMITS.bio}
                  </span>
                </p>
              </div>
              <div>
                <label htmlFor="tm-photo-alt" className="block font-label-sm text-label-sm mb-1.5">
                  Photo description{isEnglish ? '' : ` (${LOCALE_LABELS[activeLocale]})`}
                </label>
                <input
                  id="tm-photo-alt"
                  maxLength={TEAM_LIMITS.photoAlt}
                  value={active.photoAlt}
                  onChange={(e) => updateText('photoAlt', e.target.value)}
                  placeholder={isEnglish ? 'e.g. Juma standing against a blurred acacia woodland' : texts.en.photoAlt}
                  className={fieldClass}
                />
                <p className="text-on-surface-variant text-xs mt-1.5">
                  Read aloud by screen readers. If left blank, their name is used.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <h3 className="font-headline-md text-sm font-bold text-on-surface">Photo</h3>
            {photo ? (
              <div className="relative h-64 rounded-xl overflow-hidden bg-surface-container border border-sand-stone">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto('')}
                  className="absolute top-2 right-2 min-h-[36px] px-3 rounded-lg bg-deep-earth/70 text-white text-xs font-label-md hover:bg-deep-earth/90 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <ImageDropzone
                onUploaded={(url) => {
                  setPhoto(url)
                  setUploadError(null)
                }}
                onError={setUploadError}
              />
            )}
            {uploadError && <p className="text-error text-xs">{uploadError}</p>}
            <div>
              <label htmlFor="tm-photo-url" className="block font-label-sm text-label-sm mb-1.5">
                Or paste an image URL
              </label>
              <input
                id="tm-photo-url"
                type="url"
                maxLength={TEAM_LIMITS.photoUrl}
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://..."
                className={fieldClass}
              />
            </div>
            <p className="text-on-surface-variant text-xs">
              Portrait or square works best, ideally under 1 MB. It is cropped to fit a tall card. Without a photo, their
              initials are shown.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-label-md text-sm text-on-surface font-semibold block">Published</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant block">
                  Off keeps this a draft, hidden from the About page
                </span>
              </div>
              <ToggleSwitch checked={isPublished} onChange={setIsPublished} />
            </div>
            <div>
              <label htmlFor="tm-order" className="block font-label-sm text-label-sm mb-1.5">
                Display order
              </label>
              <input
                id="tm-order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className={fieldClass}
              />
              <p className="text-on-surface-variant text-xs mt-1.5">Lowest first.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-savanna-green hover:opacity-90 disabled:opacity-60 text-on-primary font-label-md text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-opacity"
            >
              <Check size={18} weight="bold" />
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Team Member'}
            </button>
            <Link
              to={BACK_TO_LIST}
              className="block text-center min-h-[40px] leading-[40px] text-on-surface-variant px-5 rounded-lg font-label-md text-sm hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

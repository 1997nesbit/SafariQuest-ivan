import { useRef, useState } from 'react'
import { ArrowCounterClockwise, SpinnerGap, UploadSimple } from '@phosphor-icons/react'
import {
  getHomepageImages,
  HOMEPAGE_LIMITS,
  resetHomepageImage,
  updateHomepageImage,
  type HomepageSlot,
} from '../../api/homepage'
import { uploadVideo } from '../../api/uploads'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { ImageDropzone } from '../../components/admin/ImageDropzone'
import { SITE_IMAGE_DEFAULTS } from '../../data/siteImageDefaults'

interface SlotInfo {
  label: string
  hint: string
  /** Upload purpose: sets the server-enforced minimum resolution (backend/uploads/views.py). */
  purpose: string
  minDimensions: { width: number; height: number }
  /** Preview tile shape, so an admin can tell a full-bleed hero from a small avatar. */
  previewClass: string
}

const HERO = { purpose: 'homepage_hero', minDimensions: { width: 1600, height: 900 }, previewClass: 'aspect-video' }
const FEATURE = { purpose: 'homepage_feature', minDimensions: { width: 800, height: 600 }, previewClass: 'aspect-[4/3]' }
const AVATAR = { purpose: 'homepage_avatar', minDimensions: { width: 300, height: 300 }, previewClass: 'aspect-square' }
const PORTRAIT = { purpose: 'page_portrait', minDimensions: { width: 600, height: 800 }, previewClass: 'aspect-[3/4]' }

type PhotoSlot = Exclude<HomepageSlot, 'hero_video'>

const SLOT_INFO: Record<PhotoSlot, SlotInfo> = {
  hero_poster: {
    label: 'Hero video poster',
    hint: 'The still shown while the hero video loads, and instead of it for visitors who have turned motion off.',
    ...HERO,
  },
  why_choose: { label: '"Why Choose Us" photo', hint: 'Next to the "Why Choose Pande Wilderness Safari" text.', ...FEATURE },
  testimonial_sarah: { label: 'Testimonial avatar: Sarah', hint: 'The small round photo next to Sarah Jenkins’ quote.', ...AVATAR },
  testimonial_markus: { label: 'Testimonial avatar: Markus', hint: 'The small round photo next to Markus Weber’s quote.', ...AVATAR },
  about_hero: { label: 'Hero', hint: 'The full-width photo at the top of the About page.', ...HERO },
  about_story: { label: 'Our story photo', hint: 'The tall photo beside the "Our story" text.', ...FEATURE },
  safaris_hero: { label: 'Hero', hint: 'The full-width photo at the top of the Safaris page.', ...HERO },
  faqs_hero: { label: 'Hero', hint: 'The full-width photo at the top of the FAQs page.', ...HERO },
  sign_in: { label: 'Side photo', hint: 'The tall photo beside the sign-in form (computers only).', ...PORTRAIT },
  booking_confirmed_hero: { label: 'Main photo', hint: 'Beside the "Your safari journey begins today" message.', ...FEATURE },
  booking_confirmed_packing: { label: 'Packing guide photo', hint: 'The large "Packing for the Savanna" tile.', ...FEATURE },
  booking_confirmed_photography: { label: 'Photography tips photo', hint: 'The "Safari Photography Tips" tile.', ...FEATURE },
}

// Spots grouped by the page they appear on.
const PAGES: { title: string; slots: HomepageSlot[] }[] = [
  { title: 'Homepage', slots: ['hero_video', 'hero_poster', 'why_choose', 'testimonial_sarah', 'testimonial_markus'] },
  { title: 'About', slots: ['about_hero', 'about_story'] },
  { title: 'Safaris', slots: ['safaris_hero'] },
  { title: 'FAQs', slots: ['faqs_hero'] },
  { title: 'Sign in', slots: ['sign_in'] },
  { title: 'Booking confirmed', slots: ['booking_confirmed_hero', 'booking_confirmed_packing', 'booking_confirmed_photography'] },
]

function SlotCard({
  slot,
  image,
  alt,
  onChanged,
}: {
  slot: PhotoSlot
  /** The saved photo, or '' when the spot still shows its original. */
  image: string
  alt: string
  onChanged: () => void
}) {
  const info = SLOT_INFO[slot]
  const [draftImage, setDraftImage] = useState(image)
  const [draftAlt, setDraftAlt] = useState(alt)
  const [busy, setBusy] = useState<'saving' | 'resetting' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const dirty = draftImage !== image || draftAlt !== alt
  const isCustom = Boolean(image)

  async function handleSave() {
    setBusy('saving')
    setError(null)
    try {
      await updateHomepageImage(slot, { image: draftImage, alt: draftAlt })
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function handleReset() {
    if (!window.confirm('Remove this photo and go back to the original?')) return
    setBusy('resetting')
    setError(null)
    try {
      await resetHomepageImage(slot)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-5 space-y-4">
      <div>
        <h4 className="font-label-md text-sm text-on-surface font-semibold">{info.label}</h4>
        <p className="text-on-surface-variant text-xs mt-0.5">{info.hint}</p>
      </div>

      <div className={`w-full ${info.previewClass} max-w-xs rounded-lg overflow-hidden bg-surface-container border border-sand-stone`}>
        <img src={draftImage || SITE_IMAGE_DEFAULTS[slot]} alt="" className="w-full h-full object-cover" />
      </div>
      {!draftImage && (
        // Never replaced (or reset): the site is showing its original.
        <p className="text-xs text-on-surface-variant -mt-2">Original placeholder photo. Upload one to replace it.</p>
      )}

      <ImageDropzone
        variant="tile"
        purpose={info.purpose}
        minDimensions={info.minDimensions}
        onUploaded={(url) => {
          setDraftImage(url)
          setError(null)
        }}
        onError={setError}
      />

      <div>
        <label htmlFor={`slot-alt-${slot}`} className="block font-label-sm text-label-sm mb-1.5">
          Photo description
        </label>
        <input
          id={`slot-alt-${slot}`}
          maxLength={HOMEPAGE_LIMITS.alt}
          value={draftAlt}
          onChange={(e) => setDraftAlt(e.target.value)}
          placeholder="Read aloud by screen readers"
          className="w-full bg-ivory-base border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
      </div>

      {error && <p role="alert" className="text-error text-xs">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!dirty || !draftImage || busy !== null}
          onClick={handleSave}
          className="min-h-[40px] px-5 bg-savanna-green text-on-primary rounded-lg font-label-md text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {isCustom && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleReset}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 text-on-surface-variant hover:text-terracotta rounded-lg font-label-md text-sm disabled:opacity-50"
          >
            <ArrowCounterClockwise size={16} />
            {busy === 'resetting' ? 'Resetting…' : 'Reset to original'}
          </button>
        )}
      </div>
    </div>
  )
}

const MAX_VIDEO_MB = 50

/** The homepage hero is always a video; this card replaces it with another one. */
function HeroVideoCard({ video, onChanged }: { video: string; onChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(video)
  const [busy, setBusy] = useState<'uploading' | 'saving' | 'resetting' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isCustom = Boolean(video)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    // Fast feedback only; the server checks size and format again.
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`This video is ${Math.round(file.size / 1024 / 1024)}MB. Use one under ${MAX_VIDEO_MB}MB.`)
      return
    }
    setBusy('uploading')
    try {
      setDraft(await uploadVideo(file))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload the video.')
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleSave() {
    setBusy('saving')
    setError(null)
    try {
      // Decorative background (aria-hidden on the site), so there's no description to keep.
      await updateHomepageImage('hero_video', { image: draft, alt: '' })
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function handleReset() {
    if (!window.confirm('Remove this video and go back to the original homepage video?')) return
    setBusy('resetting')
    setError(null)
    try {
      await resetHomepageImage('hero_video')
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-5 space-y-4">
      <div>
        <h4 className="font-label-md text-sm text-on-surface font-semibold">Hero video</h4>
        <p className="text-on-surface-variant text-xs mt-0.5">
          The full-screen video at the top of the homepage. It plays muted and on a loop, so a short, landscape clip
          (10 to 30 seconds) works best.
        </p>
      </div>

      <video
        key={draft || 'original'}
        src={draft || SITE_IMAGE_DEFAULTS.hero_video}
        muted
        loop
        controls
        preload="metadata"
        className="w-full max-w-xs aspect-video rounded-lg bg-surface-container border border-sand-stone object-cover"
      />
      {!draft && <p className="text-xs text-on-surface-variant -mt-2">Original homepage video. Upload one to replace it.</p>}

      <label className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-sand-stone rounded-lg text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors cursor-pointer text-sm">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="sr-only"
          disabled={busy !== null}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {busy === 'uploading' ? <SpinnerGap size={18} className="animate-spin" /> : <UploadSimple size={18} />}
        {busy === 'uploading' ? 'Uploading…' : `Upload a video (MP4 or WebM, up to ${MAX_VIDEO_MB}MB)`}
      </label>

      {error && <p role="alert" className="text-error text-xs">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={draft === video || !draft || busy !== null}
          onClick={handleSave}
          className="min-h-[40px] px-5 bg-savanna-green text-on-primary rounded-lg font-label-md text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {isCustom && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleReset}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 text-on-surface-variant hover:text-terracotta rounded-lg font-label-md text-sm disabled:opacity-50"
          >
            <ArrowCounterClockwise size={16} />
            {busy === 'resetting' ? 'Resetting…' : 'Reset to original'}
          </button>
        )}
      </div>
    </div>
  )
}

/** Site Images: the website's fixed, built-in photos (page backgrounds and
 * decorative images), grouped by page. Anything that's created and deleted in
 * the admin (safari packages, regions, parks, team, partner hotels, sponsoring
 * events) keeps its photos in its own form, so it's deliberately not here. */
export function AdminSiteImages() {
  const { data: slots, loading, error, refetch } = useFetch(getHomepageImages, [])

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-md text-[26px] text-on-surface mb-1">Site Images</h2>
        <p className="font-body-lg text-on-surface-variant max-w-3xl">
          The website&rsquo;s fixed background video and page photos. Changes show on the site as soon as you save. Photos of
          safaris, regions, parks, team members, partner hotels and sponsoring events are edited where you manage those,
          under Content.
        </p>
      </div>

      {loading && <p className="text-on-surface-variant">Loading…</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && (
        <div className="space-y-10">
          {PAGES.map((page) => (
            <section key={page.title}>
              <h3 className="font-headline-md text-lg text-on-surface mb-4">{page.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {page.slots.map((slot) => {
                  const current = slots?.[slot]
                  if (slot === 'hero_video') {
                    return (
                      <HeroVideoCard
                        key={`${slot}-${current?.updatedAt ?? 'none'}`}
                        video={current?.image ?? ''}
                        onChanged={refetch}
                      />
                    )
                  }
                  return (
                    <SlotCard
                      // Remount after a save or reset so the card's draft matches the server.
                      key={`${slot}-${current?.updatedAt ?? 'none'}`}
                      slot={slot}
                      image={current?.image ?? ''}
                      alt={current?.alt ?? ''}
                      onChanged={refetch}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

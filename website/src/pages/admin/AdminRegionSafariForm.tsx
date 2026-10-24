import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Check } from '@phosphor-icons/react'
import {
  createRegionSafari,
  getRegionSafari,
  updateRegionSafari,
  type RegionSafari,
  type RegionSafariInput,
} from '../../api/regionSafaris'
import { getDestinations } from '../../api/destinations'
import { getParks } from '../../api/parks'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { ChipInput, ToggleSwitch } from '../../components/admin/FormControls'
import { MediaSection } from '../../components/admin/MediaSection'
import { ItineraryEditor } from '../../components/admin/ItineraryEditor'
import { slugify } from '../../lib/slugify'
import type { ItineraryDay } from '../../api/safaris'
import { formatMoney } from '../../lib/money'

export function AdminRegionSafariForm() {
  const { slug: existingSlug } = useParams<{ slug: string }>()
  const isEditing = Boolean(existingSlug)

  const { data: existing, loading: loadingExisting } = useFetch(
    () => (existingSlug ? getRegionSafari(existingSlug) : Promise.resolve(null)),
    [existingSlug],
  )

  if (isEditing && loadingExisting) {
    return <div className="py-20 text-center text-on-surface-variant">Loading mini safari…</div>
  }

  return (
    <RegionSafariFormFields
      key={existingSlug ?? 'new'}
      initial={existing}
      isEditing={isEditing}
      existingSlug={existingSlug}
    />
  )
}

function RegionSafariFormFields({
  initial,
  isEditing,
  existingSlug,
}: {
  initial: RegionSafari | null
  isEditing: boolean
  existingSlug?: string
}) {
  const navigate = useNavigate()
  const { data: destinations } = useFetch(getDestinations, [])
  const { data: parksList } = useFetch(getParks, [])

  const [slug, setSlug] = useState(initial?.id ?? '')
  const [slugTouched, setSlugTouched] = useState(false)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [image, setImage] = useState(initial?.image ?? '')
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? '')
  const [galleryImages, setGalleryImages] = useState<string[]>(initial?.galleryImages ?? [])
  const [rating, setRating] = useState(String(initial?.rating ?? '4.8'))
  const [days, setDays] = useState(String(initial?.days ?? ''))
  const [accommodation, setAccommodation] = useState(initial?.accommodation ?? '')
  const [price, setPrice] = useState(String(initial?.price ?? ''))
  // Optional: without a USD price the trip can only be booked in TZS.
  const [priceUsd, setPriceUsd] = useState(initial?.priceUsd == null ? '' : String(initial.priceUsd))
  const [badge, setBadge] = useState(initial?.badge ?? '')
  const [signature, setSignature] = useState(initial?.signature ?? false)
  const [region, setRegion] = useState<string>(initial?.region ?? '')
  const [parkIds, setParkIds] = useState<string[]>(initial?.parks ?? [])
  const [overview, setOverview] = useState(initial?.overview ?? '')
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? [])
  const [included, setIncluded] = useState<string[]>(initial?.included ?? [])
  const [excluded, setExcluded] = useState<string[]>(initial?.excluded ?? [])
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(initial?.itinerary ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const effectiveRegion = region || destinations?.[0]?.id || ''
  const parksInRegion = (parksList ?? []).filter((p) => p.region === effectiveRegion)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!isEditing && !slugTouched) {
      setSlug(slugify(value))
    }
  }

  function handleRegionChange(value: string) {
    setRegion(value)
    setParkIds((list) => list.filter((id) => (parksList ?? []).find((p) => p.id === id)?.region === value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const input: RegionSafariInput = {
      slug,
      title,
      image,
      imageAlt,
      galleryImages,
      rating: Number(rating),
      days: Number(days),
      accommodation,
      price: Number(price),
      priceUsd: priceUsd.trim() === '' ? null : Number(priceUsd),
      badge,
      signature,
      region: effectiveRegion,
      parks: parkIds,
      overview,
      highlights,
      included,
      excluded,
      itinerary: itinerary.filter((d) => d.title.trim() && d.description.trim()),
    }

    setSaving(true)
    try {
      if (isEditing && existingSlug) {
        await updateRegionSafari(existingSlug, input)
      } else {
        await createRegionSafari(input)
      }
      navigate('/admin/content?tab=Region+Safaris')
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
          <Link to="/admin/content?tab=Region+Safaris" className="hover:text-savanna-green transition-colors">
            Content Manager
          </Link>
          <CaretRight size={12} />
          <span>Region Safaris</span>
          <CaretRight size={12} />
          <span className="text-on-surface font-semibold">{isEditing ? title || existingSlug : 'Add New Mini Safari'}</span>
        </nav>
        <h1 className="font-headline-md text-[22px] text-on-surface">
          {isEditing ? 'Edit Mini Safari' : 'Add New Mini Safari'}
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          A region-scoped mini safari — a short, bookable experience within a single region's trip curator.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-error rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Basic Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rs-title" className="block font-label-sm text-label-sm mb-1.5">
                  Title
                </label>
                <input
                  id="rs-title"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="rs-slug" className="block font-label-sm text-label-sm mb-1.5">
                  URL Slug
                </label>
                <input
                  id="rs-slug"
                  required
                  disabled={isEditing}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rs-region" className="block font-label-sm text-label-sm mb-1.5">
                Region
              </label>
              <select
                id="rs-region"
                required
                value={effectiveRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              >
                {(destinations ?? []).length === 0 && <option value="">No regions yet</option>}
                {(destinations ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Unlike a cross-region safari package, a mini safari belongs to exactly one region and only appears in
                that region's trip curator.
              </p>
            </div>

            <div>
              <span className="block font-label-sm text-label-sm mb-1.5">Parks Visited (optional)</span>
              <div className="space-y-1 max-h-48 overflow-y-auto bg-surface-container-low rounded-lg p-3">
                {parksInRegion.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parkIds.includes(p.id)}
                      onChange={(e) =>
                        setParkIds((list) => (e.target.checked ? [...list, p.id] : list.filter((id) => id !== p.id)))
                      }
                      className="rounded border-sand-stone text-savanna-green focus:ring-savanna-green"
                    />
                    {p.name}
                  </label>
                ))}
                {parksInRegion.length === 0 && (
                  <p className="text-on-surface-variant text-sm">No parks in this region yet.</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="rs-accommodation" className="block font-label-sm text-label-sm mb-1.5">
                Accommodation Type
              </label>
              <input
                id="rs-accommodation"
                required
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                placeholder="e.g. Luxury Tents"
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="rs-days" className="block font-label-sm text-label-sm mb-1.5">
                  Duration (days)
                </label>
                <input
                  id="rs-days"
                  type="number"
                  min={1}
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="rs-price" className="block font-label-sm text-label-sm mb-1.5">
                  Price / Person (TZS)
                </label>
                <input
                  id="rs-price"
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="rs-price-usd" className="block font-label-sm text-label-sm mb-1.5">
                  Price / Person (USD) <span className="text-on-surface-variant font-normal">— optional</span>
                </label>
                <input
                  id="rs-price-usd"
                  type="number"
                  min={0}
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  placeholder="Leave empty if not sold in USD"
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="rs-rating" className="block font-label-sm text-label-sm mb-1.5">
                  Rating (0–5)
                </label>
                <input
                  id="rs-rating"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  required
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rs-badge" className="block font-label-sm text-label-sm mb-1.5">
                Badge (optional)
              </label>
              <input
                id="rs-badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Most Popular"
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>

            <div>
              <label htmlFor="rs-overview" className="block font-label-sm text-label-sm mb-1.5">
                Overview
              </label>
              <textarea
                id="rs-overview"
                required
                rows={4}
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>
          </section>

          <MediaSection
            image={image}
            onImageChange={setImage}
            imageAlt={imageAlt}
            onImageAltChange={setImageAlt}
            galleryImages={galleryImages}
            onGalleryImagesChange={setGalleryImages}
            uploadError={uploadError}
            onUploadError={setUploadError}
          />

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Highlights, Inclusions &amp; Exclusions</h3>
            <ChipInput
              label="Highlights"
              placeholder="+ Type & press Enter..."
              values={highlights}
              onAdd={(v) => setHighlights((list) => [...list, v])}
              onRemove={(i) => setHighlights((list) => list.filter((_, idx) => idx !== i))}
            />
            <ChipInput
              label="What's Included"
              placeholder="+ Type & press Enter..."
              values={included}
              onAdd={(v) => setIncluded((list) => [...list, v])}
              onRemove={(i) => setIncluded((list) => list.filter((_, idx) => idx !== i))}
            />
            <ChipInput
              label="What's Excluded"
              placeholder="+ Type & press Enter..."
              values={excluded}
              onAdd={(v) => setExcluded((list) => [...list, v])}
              onRemove={(i) => setExcluded((list) => list.filter((_, idx) => idx !== i))}
            />
          </section>

          <ItineraryEditor itinerary={itinerary} onChange={setItinerary} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <h3 className="font-headline-md text-sm font-bold text-on-surface">Live Card Preview</h3>
            <div className="rounded-xl overflow-hidden bg-surface-container-low shadow-sm">
              <div className="relative h-32 w-full bg-surface-container flex items-center justify-center text-outline overflow-hidden">
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs">No image yet</span>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur text-[10px] font-semibold text-on-surface shadow-sm">
                  {days || '—'} Days
                </span>
                {signature && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-golden-sun text-deep-earth text-[10px] font-bold shadow-sm">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-savanna-green font-bold">
                  {(destinations ?? []).find((d) => d.id === effectiveRegion)?.name ?? 'Select a region'}
                </div>
                <div className="font-headline-md text-sm font-bold text-on-surface leading-snug">{title || 'Untitled Mini Safari'}</div>
                <div className="pt-2 border-t border-sand-stone flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">From per person</span>
                    <span className="font-headline-md text-sm font-bold text-savanna-green">
                      {formatMoney(Number(price) || 0)}
                      {priceUsd.trim() !== '' && ` · ${formatMoney(Number(priceUsd) || 0, undefined, 'USD')}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-label-md text-sm text-on-surface font-semibold block">Featured</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant block">
                  Highlight this mini safari within its region's experiences
                </span>
              </div>
              <ToggleSwitch checked={signature} onChange={setSignature} />
            </div>
            <button
              type="submit"
              disabled={saving || !effectiveRegion}
              className="w-full py-3 px-4 rounded-xl bg-savanna-green hover:opacity-90 disabled:opacity-60 text-on-primary font-label-md text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-opacity"
            >
              <Check size={18} weight="bold" />
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Mini Safari'}
            </button>
            <Link
              to="/admin/content?tab=Region+Safaris"
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

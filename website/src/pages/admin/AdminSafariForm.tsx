import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Check, Plus, X } from '@phosphor-icons/react'
import {
  createSafari,
  getSafari,
  updateSafari,
  type ItineraryDay,
  type SafariPackage,
  type SafariPackageInput,
} from '../../api/safaris'
import { getDestinations } from '../../api/destinations'
import { getParks } from '../../api/parks'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { uploadImage } from '../../api/uploads'
import { ImageDropzone } from '../../components/admin/ImageDropzone'

const DESTINATION_OPTIONS = [
  'Serengeti National Park',
  'Ngorongoro Conservation Area',
  'Tarangire & Manyara',
  'Zanzibar Extensions',
] as const

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function ChipInput({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
}: {
  label: string
  placeholder: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
}) {
  const [draft, setDraft] = useState('')
  const inputId = useId()

  function submit() {
    const trimmed = draft.trim()
    if (trimmed) {
      onAdd(trimmed)
      setDraft('')
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low rounded-xl">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm text-sm flex items-center gap-1.5 break-all"
          >
            {v}
            <button type="button" onClick={() => onRemove(i)} className="hover:text-error shrink-0">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          onBlur={submit}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant px-2 py-1 min-w-[160px] flex-1"
        />
      </div>
    </div>
  )
}

function UrlAddField({ label, placeholder, onAdd }: { label: string; placeholder: string; onAdd: (value: string) => void }) {
  const [value, setValue] = useState('')
  const inputId = useId()

  function submit() {
    const trimmed = value.trim()
    if (trimmed) {
      onAdd(trimmed)
      setValue('')
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
        <button
          type="button"
          onClick={submit}
          className="flex items-center gap-1 bg-surface-container-low border border-sand-stone px-4 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none ${checked ? 'bg-savanna-green' : 'bg-sand-stone'}`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

export function AdminSafariForm() {
  const { slug: existingSlug } = useParams<{ slug: string }>()
  const isEditing = Boolean(existingSlug)

  const { data: existing, loading: loadingExisting } = useFetch(
    () => (existingSlug ? getSafari(existingSlug) : Promise.resolve(null)),
    [existingSlug],
  )

  if (isEditing && loadingExisting) {
    return <div className="py-20 text-center text-on-surface-variant">Loading safari package…</div>
  }

  return (
    <SafariFormFields key={existingSlug ?? 'new'} initial={existing} isEditing={isEditing} existingSlug={existingSlug} />
  )
}

function SafariFormFields({
  initial,
  isEditing,
  existingSlug,
}: {
  initial: SafariPackage | null
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
  const [badge, setBadge] = useState(initial?.badge ?? '')
  const [signature, setSignature] = useState(initial?.signature ?? false)
  const [destination, setDestination] = useState<string>(initial?.destination ?? DESTINATION_OPTIONS[0])
  const [parkIds, setParkIds] = useState<string[]>(initial?.parks ?? [])
  const [overview, setOverview] = useState(initial?.overview ?? '')
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? [])
  const [included, setIncluded] = useState<string[]>(initial?.included ?? [])
  const [excluded, setExcluded] = useState<string[]>(initial?.excluded ?? [])
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(initial?.itinerary ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!isEditing && !slugTouched) {
      setSlug(slugify(value))
    }
  }

  function addDay() {
    setItinerary((list) => [...list, { day: list.length + 1, title: '', description: '' }])
  }

  function updateDay(index: number, field: 'title' | 'description', value: string) {
    setItinerary((list) => list.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  function removeDay(index: number) {
    setItinerary((list) => list.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 })))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const input: SafariPackageInput = {
      slug,
      title,
      image,
      imageAlt,
      galleryImages,
      rating: Number(rating),
      days: Number(days),
      accommodation,
      price: Number(price),
      badge,
      signature,
      destination,
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
        await updateSafari(existingSlug, input)
      } else {
        await createSafari(input)
      }
      navigate('/admin/content')
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
          <Link to="/admin/content" className="hover:text-savanna-green transition-colors">
            Content Manager
          </Link>
          <CaretRight size={12} />
          <span>Safaris</span>
          <CaretRight size={12} />
          <span className="text-on-surface font-semibold">{isEditing ? title || existingSlug : 'Add New Safari Package'}</span>
        </nav>
        <h1 className="font-headline-md text-[22px] text-on-surface">
          {isEditing ? 'Edit Safari Package' : 'Add New Safari Package'}
        </h1>
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
                <label htmlFor="safari-title" className="block font-label-sm text-label-sm mb-1.5">
                  Package Title
                </label>
                <input
                  id="safari-title"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="safari-slug" className="block font-label-sm text-label-sm mb-1.5">
                  URL Slug
                </label>
                <input
                  id="safari-slug"
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
              <label htmlFor="safari-destination" className="block font-label-sm text-label-sm mb-1.5">
                Destination
              </label>
              <select
                id="safari-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              >
                {DESTINATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block font-label-sm text-label-sm mb-1.5">Parks Visited</span>
              <p className="text-xs text-on-surface-variant mb-2">
                A safari can stop at multiple parks, even across different regions. Each park you check here makes
                this safari appear as a bookable experience for that park's region in the trip curator.
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto bg-surface-container-low rounded-lg p-3">
                {(destinations ?? []).map((d) => {
                  const parksInRegion = (parksList ?? []).filter((p) => p.region === d.id)
                  if (parksInRegion.length === 0) return null
                  return (
                    <div key={d.id}>
                      <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
                        {d.name}
                      </p>
                      <div className="flex flex-col gap-1">
                        {parksInRegion.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                            <input
                              type="checkbox"
                              checked={parkIds.includes(p.id)}
                              onChange={(e) =>
                                setParkIds((list) =>
                                  e.target.checked ? [...list, p.id] : list.filter((id) => id !== p.id),
                                )
                              }
                              className="rounded border-sand-stone text-savanna-green focus:ring-savanna-green"
                            />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {(parksList ?? []).length === 0 && (
                  <p className="text-on-surface-variant text-sm">No parks created yet.</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="safari-accommodation" className="block font-label-sm text-label-sm mb-1.5">
                Accommodation Type
              </label>
              <input
                id="safari-accommodation"
                required
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                placeholder="e.g. Luxury Tents"
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="safari-days" className="block font-label-sm text-label-sm mb-1.5">
                  Duration (days)
                </label>
                <input
                  id="safari-days"
                  type="number"
                  min={1}
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="safari-price" className="block font-label-sm text-label-sm mb-1.5">
                  Price / Person ($)
                </label>
                <input
                  id="safari-price"
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="safari-rating" className="block font-label-sm text-label-sm mb-1.5">
                  Rating (0–5)
                </label>
                <input
                  id="safari-rating"
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
              <label htmlFor="safari-badge" className="block font-label-sm text-label-sm mb-1.5">
                Badge (optional)
              </label>
              <input
                id="safari-badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Most Popular"
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>

            <div>
              <label htmlFor="safari-overview" className="block font-label-sm text-label-sm mb-1.5">
                Overview
              </label>
              <textarea
                id="safari-overview"
                required
                rows={4}
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Media</h3>
            <div>
              <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Hero Image</span>
              {image ? (
                <div className="relative h-48 rounded-xl overflow-hidden bg-surface-container border border-sand-stone group">
                  <img src={image} alt="" className="w-full h-full object-cover" />
                  <label
                    htmlFor="safari-image-upload"
                    className="absolute inset-0 flex items-center justify-center bg-deep-earth/0 group-hover:bg-deep-earth/50 text-white text-sm font-label-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    Replace image
                  </label>
                  <input
                    id="safari-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setImage(await uploadImage(file))
                      } catch (err) {
                        setUploadError(err instanceof ApiError ? err.message : 'Failed to upload image.')
                      } finally {
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
              ) : (
                <ImageDropzone onUploaded={setImage} onError={setUploadError} />
              )}
              {uploadError && <p className="text-error text-xs mt-2">{uploadError}</p>}
            </div>
            <div>
              <label htmlFor="safari-image" className="block font-label-sm text-label-sm mb-1.5">
                Or paste an image URL
              </label>
              <input
                id="safari-image"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="safari-image-alt" className="block font-label-sm text-label-sm mb-1.5">
                Image Alt Text
              </label>
              <input
                id="safari-image-alt"
                required
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                Gallery Images (optional)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {galleryImages.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative h-24 rounded-lg overflow-hidden bg-surface-container border border-sand-stone group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGalleryImages((list) => list.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-deep-earth/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <ImageDropzone
                  variant="tile"
                  onUploaded={(url) => setGalleryImages((list) => [...list, url])}
                  onError={setUploadError}
                />
              </div>
            </div>
            <UrlAddField
              label="Or paste a gallery image URL"
              placeholder="https://..."
              onAdd={(v) => setGalleryImages((list) => [...list, v])}
            />
          </section>

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

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <h3 className="font-headline-md text-[18px] text-on-surface">Day-by-Day Itinerary</h3>
            <div className="space-y-3">
              {itinerary.map((day, index) => (
                <div key={index} className="p-4 rounded-xl bg-surface-container-low space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-savanna-green text-on-primary font-label-md text-xs font-bold shrink-0">
                      DAY {day.day}
                    </span>
                    <input
                      value={day.title}
                      onChange={(e) => updateDay(index, 'title', e.target.value)}
                      placeholder="Day title, e.g. Arrival & transfer to camp"
                      className="flex-1 bg-transparent border-b border-sand-stone px-1 py-1 text-sm font-label-md text-on-surface focus:outline-none focus:border-savanna-green"
                    />
                    <button type="button" onClick={() => removeDay(index)} className="text-on-surface-variant hover:text-error p-1">
                      <X size={16} />
                    </button>
                  </div>
                  <textarea
                    value={day.description}
                    onChange={(e) => updateDay(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="Describe the day's activities..."
                    className="w-full bg-surface-container-lowest border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDay}
              className="w-full py-3 rounded-xl border-2 border-dashed border-sand-stone hover:border-savanna-green transition-colors flex items-center justify-center gap-2 text-on-surface-variant hover:text-savanna-green font-label-md text-sm"
            >
              <Plus size={18} />
              Append Day {itinerary.length + 1} to Itinerary
            </button>
          </section>
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
                <div className="text-[10px] uppercase tracking-wider text-savanna-green font-bold">{destination}</div>
                <div className="font-headline-md text-sm font-bold text-on-surface leading-snug">{title || 'Untitled Safari Package'}</div>
                <div className="pt-2 border-t border-sand-stone flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">From per person</span>
                    <span className="font-headline-md text-sm font-bold text-savanna-green">
                      ${price || '0'} <span className="text-[10px] text-on-surface-variant font-normal">USD</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-label-md text-sm text-on-surface font-semibold block">Featured on Homepage</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant block">
                  Show in the Signature Safari Packages section
                </span>
              </div>
              <ToggleSwitch checked={signature} onChange={setSignature} />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-savanna-green hover:opacity-90 disabled:opacity-60 text-on-primary font-label-md text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-opacity"
            >
              <Check size={18} weight="bold" />
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Safari Package'}
            </button>
            <Link
              to="/admin/content"
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

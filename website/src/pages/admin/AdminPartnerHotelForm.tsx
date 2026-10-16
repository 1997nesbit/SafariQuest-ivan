import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Check } from '@phosphor-icons/react'
import {
  createPartnerHotel,
  getPartnerHotel,
  PARTNER_HOTEL_LIMITS,
  updatePartnerHotel,
  type PartnerHotel,
  type PartnerHotelInput,
} from '../../api/homepage'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { ToggleSwitch } from '../../components/admin/FormControls'
import { ImageDropzone } from '../../components/admin/ImageDropzone'

const BACK_TO_LIST = '/admin/content?tab=Partner+Hotels'
// Shown as a small card on the homepage; matches backend/uploads/views.py's "partner_hotel".
const MIN_DIMENSIONS = { width: 400, height: 300 }

const fieldClass =
  'w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green'

type Field = 'name' | 'website'
type Errors = Partial<Record<Field, string>>

function validate(input: PartnerHotelInput): Errors {
  const errors: Errors = {}
  if (!input.name.trim()) errors.name = "Enter the hotel's name."
  if (!input.website.trim()) errors.website = "Enter the hotel's website."
  else if (!/^https?:\/\/\S+\.\S+/i.test(input.website.trim())) {
    errors.website = 'Use the full address, starting with https://'
  }
  return errors
}

export function AdminPartnerHotelForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const { data: existing, loading, error } = useFetch(() => (id ? getPartnerHotel(id) : Promise.resolve(null)), [id])

  if (isEditing && loading) {
    return <div className="py-20 text-center text-on-surface-variant">Loading hotel…</div>
  }

  // Without this, a failed load (deleted in another tab, bad id) would fall through to an
  // empty form that looks like "add new" but PATCHes an id that doesn't exist.
  if (isEditing && (error || !existing)) {
    return (
      <div className="py-20 text-center">
        <p className="text-error mb-4">{error ?? 'Hotel not found.'}</p>
        <Link to={BACK_TO_LIST} className="text-savanna-green font-label-md text-sm hover:underline">
          Back to Content Manager
        </Link>
      </div>
    )
  }

  return <PartnerHotelFormFields key={id ?? 'new'} initial={existing} hotelId={id ? Number(id) : undefined} />
}

function PartnerHotelFormFields({ initial, hotelId }: { initial: PartnerHotel | null; hotelId?: number }) {
  const navigate = useNavigate()
  const isEditing = hotelId !== undefined
  const [name, setName] = useState(initial?.name ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [image, setImage] = useState(initial?.image ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    const input: PartnerHotelInput = {
      name: name.trim(),
      location: location.trim(),
      website: website.trim(),
      image,
      order,
      isPublished,
    }
    const found = validate(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    try {
      if (hotelId !== undefined) await updatePartnerHotel(hotelId, input)
      else await createPartnerHotel(input)
      navigate(BACK_TO_LIST)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant mb-1">
          <Link to={BACK_TO_LIST} className="hover:text-savanna-green transition-colors">
            Content Manager
          </Link>
          <CaretRight size={12} />
          <span>Partner Hotels</span>
          <CaretRight size={12} />
          <span className="text-on-surface font-semibold">{isEditing ? name || 'Edit' : 'Add Partner Hotel'}</span>
        </nav>
        <h1 className="font-headline-md text-[22px] text-on-surface">{isEditing ? 'Edit Partner Hotel' : 'Add Partner Hotel'}</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Listed on the homepage under &ldquo;Our Partner Hotels&rdquo;, linking to the hotel&rsquo;s own website.
        </p>
      </div>

      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 space-y-6 border border-sand-stone/50">
        <div>
          <label htmlFor="hotel-name" className="block font-label-md text-sm text-on-surface mb-2">
            Hotel name
          </label>
          <input
            id="hotel-name"
            maxLength={PARTNER_HOTEL_LIMITS.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Zanzibar Beach Resort"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'hotel-name-error' : undefined}
            className={fieldClass}
          />
          {errors.name && <p id="hotel-name-error" className="text-error text-xs mt-1.5">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="hotel-location" className="block font-label-md text-sm text-on-surface mb-2">
            Location <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <input
            id="hotel-location"
            maxLength={PARTNER_HOTEL_LIMITS.location}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nungwi, Zanzibar"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="hotel-website" className="block font-label-md text-sm text-on-surface mb-2">
            Website
          </label>
          <input
            id="hotel-website"
            type="url"
            maxLength={PARTNER_HOTEL_LIMITS.website}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.hotel-website.com"
            aria-invalid={Boolean(errors.website)}
            aria-describedby={errors.website ? 'hotel-website-error' : undefined}
            className={fieldClass}
          />
          {errors.website && <p id="hotel-website-error" className="text-error text-xs mt-1.5">{errors.website}</p>}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 space-y-4 border border-sand-stone/50">
        <div>
          <p className="font-label-md text-sm text-on-surface">
            Logo or photo <span className="text-on-surface-variant font-normal">(optional)</span>
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Without one, the card shows a building icon and the hotel&rsquo;s name.
          </p>
        </div>
        {image && (
          <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border border-sand-stone">
            <img src={image} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImage('')}
              className="absolute top-2 right-2 min-h-[36px] px-3 rounded-lg bg-deep-earth/70 text-white text-xs font-label-md hover:bg-deep-earth/90 transition-colors"
            >
              Remove
            </button>
          </div>
        )}
        <ImageDropzone
          variant="tile"
          purpose="partner_hotel"
          minDimensions={MIN_DIMENSIONS}
          onUploaded={(url) => {
            setImage(url)
            setSaveError(null)
          }}
          onError={setSaveError}
        />
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 space-y-6 border border-sand-stone/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label-md text-sm text-on-surface">Show on the homepage</p>
            <p className="text-xs text-on-surface-variant">Turn off to hide it without deleting it.</p>
          </div>
          <ToggleSwitch checked={isPublished} onChange={setIsPublished} />
        </div>
        <div>
          <label htmlFor="hotel-order" className="block font-label-md text-sm text-on-surface mb-2">
            Display order
          </label>
          <input
            id="hotel-order"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="w-32 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
          <p className="text-xs text-on-surface-variant mt-1.5">Lowest first.</p>
        </div>
      </section>

      {saveError && (
        <p role="alert" className="text-error text-sm">
          {saveError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link to={BACK_TO_LIST} className="min-h-[44px] inline-flex items-center px-5 text-on-surface-variant hover:text-savanna-green">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-6 rounded-lg font-label-md text-sm hover:opacity-90 disabled:opacity-60"
        >
          <Check size={16} />
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add hotel'}
        </button>
      </div>
    </form>
  )
}

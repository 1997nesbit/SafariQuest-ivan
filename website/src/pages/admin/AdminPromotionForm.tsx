import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Check } from '@phosphor-icons/react'
import { createPromotion, getPromotion, PROMOTION_LIMITS, updatePromotion, type Promotion, type PromotionInput } from '../../api/promotions'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { ToggleSwitch } from '../../components/admin/FormControls'
import { ImageDropzone } from '../../components/admin/ImageDropzone'

const BACK_TO_LIST = '/admin/content?tab=Promotions'

type PromotionField = 'title' | 'description' | 'phone' | 'image' | 'order'
type PromotionErrors = Partial<Record<PromotionField, string>>

const PHONE_CHARS = /^\+?[0-9][0-9 ()-]*$/

/** Checks what the form can check before the server does. Returns one message per
 * bad field; an empty object means the form can be sent. Mirrors the backend rules
 * (promotions.serializers) so a visitor-visible mistake is caught on this screen. */
function validatePromotion(input: PromotionInput): PromotionErrors {
  const errors: PromotionErrors = {}
  const title = input.title.trim()
  const description = input.description.trim()
  const phoneDigits = input.phone.replace(/\D/g, '')

  if (!title) errors.title = 'Enter a title for the event.'
  else if (title.length > PROMOTION_LIMITS.title) errors.title = `Keep the title under ${PROMOTION_LIMITS.title} characters.`

  if (!description) errors.description = 'Enter a short description.'
  else if (description.length > PROMOTION_LIMITS.description)
    errors.description = `Keep the description under ${PROMOTION_LIMITS.description} characters.`

  if (!input.phone.trim()) errors.phone = 'Enter a phone number visitors can call or WhatsApp.'
  else if (!PHONE_CHARS.test(input.phone.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15)
    errors.phone = 'Use digits only, with an optional leading +, for example +255 725 377 625 (7 to 15 digits).'

  if (!input.image) errors.image = 'Upload an image for the event.'
  else if (!/^https?:\/\//.test(input.image)) errors.image = 'The image must be uploaded through the form.'

  if (!Number.isInteger(input.order) || input.order < 0) errors.order = 'Display order must be a whole number, 0 or more.'

  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-error text-xs mt-1.5">
      {message}
    </p>
  )
}

export function AdminPromotionForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const { data: existing, loading, error } = useFetch(
    () => (id ? getPromotion(id) : Promise.resolve(null)),
    [id],
  )

  if (isEditing && loading) {
    return <div className="py-20 text-center text-on-surface-variant">Loading event…</div>
  }

  // A failed load would otherwise show an empty form that PATCHes an id that doesn't exist.
  if (isEditing && (error || !existing)) {
    return (
      <div className="py-20 text-center">
        <p className="text-error mb-4">{error ?? 'Event not found.'}</p>
        <Link to={BACK_TO_LIST} className="text-savanna-green font-label-md text-sm hover:underline">
          Back to Content Manager
        </Link>
      </div>
    )
  }

  return <PromotionFormFields key={id ?? 'new'} initial={existing} isEditing={isEditing} promotionId={id ? Number(id) : undefined} />
}

function PromotionFormFields({
  initial,
  isEditing,
  promotionId,
}: {
  initial: Promotion | null
  isEditing: boolean
  promotionId: number | undefined
}) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [image, setImage] = useState(initial?.image ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [errors, setErrors] = useState<PromotionErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    const input: PromotionInput = { title, description, phone, image, order, isPublished }
    const found = validatePromotion(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    try {
      if (promotionId) await updatePromotion(promotionId, input)
      else await createPromotion(input)
      navigate(BACK_TO_LIST)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-8">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to={BACK_TO_LIST} className="hover:text-savanna-green">Sponsoring Events</Link>
        <CaretRight size={14} />
        <span className="text-on-surface">{isEditing ? 'Edit event' : 'New event'}</span>
      </nav>

      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 space-y-6 border border-sand-stone/50">
        <div>
          <label htmlFor="promo-image" className="block font-label-md text-sm text-on-surface mb-2">Image</label>
          <p className="text-xs text-on-surface-variant mb-3">Use an image only. It is shown as the event&apos;s main picture.</p>
          {image && <img src={image} alt="" className="w-full max-w-md aspect-[4/3] object-cover rounded-lg mb-3" />}
          <ImageDropzone variant="tile" onUploaded={(url) => { setImage(url); setErrors((e) => ({ ...e, image: undefined })) }} onError={setSaveError} />
          <FieldError id="promo-image-error" message={errors.image} />
        </div>

        <div>
          <label htmlFor="promo-title" className="block font-label-md text-sm text-on-surface mb-2">Title</label>
          <input
            id="promo-title"
            aria-invalid={Boolean(errors.title)}
            aria-describedby="promo-title-error"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kili Marathon 2027"
            className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
          <FieldError id="promo-title-error" message={errors.title} />
        </div>

        <div>
          <label htmlFor="promo-description" className="block font-label-md text-sm text-on-surface mb-2">Description</label>
          <textarea
            id="promo-description"
            rows={3}
            aria-invalid={Boolean(errors.description)}
            aria-describedby="promo-description-error"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Pande will be sponsoring. Call to get your ticket at a 20% discount."
            className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
          <FieldError id="promo-description-error" message={errors.description} />
        </div>

        <div>
          <label htmlFor="promo-phone" className="block font-label-md text-sm text-on-surface mb-2">Phone number</label>
          <p className="text-xs text-on-surface-variant mb-2">Visitors tap this to open a WhatsApp chat.</p>
          <input
            id="promo-phone"
            type="tel"
            maxLength={PROMOTION_LIMITS.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby="promo-phone-error"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255 725 377 625"
            className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
          <FieldError id="promo-phone-error" message={errors.phone} />
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 space-y-6 border border-sand-stone/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label-md text-sm text-on-surface">Show on the homepage</p>
            <p className="text-xs text-on-surface-variant">Turn off to hide the event without deleting it.</p>
          </div>
          <ToggleSwitch checked={isPublished} onChange={setIsPublished} />
        </div>
        <div>
          <label htmlFor="promo-order" className="block font-label-md text-sm text-on-surface mb-2">Display order</label>
          <input
            id="promo-order"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="w-32 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
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
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create event'}
        </button>
      </div>
    </form>
  )
}

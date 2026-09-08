import { useId, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Check, Plus, Trash, X } from '@phosphor-icons/react'
import {
  createDestination,
  getDestination,
  updateDestination,
  type Destination,
  type DestinationExperience,
  type DestinationInput,
} from '../../api/destinations'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { ImageDropzone } from '../../components/admin/ImageDropzone'

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

export function AdminDestinationForm() {
  const { slug: existingSlug } = useParams<{ slug: string }>()
  const isEditing = Boolean(existingSlug)

  const { data: existing, loading: loadingExisting } = useFetch(
    () => (existingSlug ? getDestination(existingSlug) : Promise.resolve(null)),
    [existingSlug],
  )

  if (isEditing && loadingExisting) {
    return <div className="py-20 text-center text-on-surface-variant">Loading destination…</div>
  }

  return (
    <DestinationFormFields key={existingSlug ?? 'new'} initial={existing} isEditing={isEditing} existingSlug={existingSlug} />
  )
}

function DestinationFormFields({
  initial,
  isEditing,
  existingSlug,
}: {
  initial: Destination | null
  isEditing: boolean
  existingSlug?: string
}) {
  const navigate = useNavigate()

  const [slug, setSlug] = useState(initial?.id ?? '')
  const [slugTouched, setSlugTouched] = useState(false)
  const [name, setName] = useState(initial?.name ?? '')
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? '')
  const [badge, setBadge] = useState(initial?.badge ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [bestTimeToVisit, setBestTimeToVisit] = useState(initial?.bestTimeToVisit ?? '')
  const [highlight, setHighlight] = useState(initial?.highlight ?? '')
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? '')
  const [about, setAbout] = useState(initial?.about ?? '')
  const [wildlife, setWildlife] = useState(initial?.wildlife ?? '')
  const [gettingThere, setGettingThere] = useState(initial?.gettingThere ?? '')
  const [experiences, setExperiences] = useState<DestinationExperience[]>(initial?.experiences ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function handleNameChange(value: string) {
    setName(value)
    if (!isEditing && !slugTouched) {
      setSlug(slugify(value))
    }
  }

  function addExperience() {
    setExperiences((list) => [...list, { name: '', description: '' }])
  }

  function updateExperience(index: number, field: keyof DestinationExperience, value: string) {
    setExperiences((list) => list.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)))
  }

  function removeExperience(index: number) {
    setExperiences((list) => list.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const input: DestinationInput = {
      slug,
      name,
      images,
      imageAlt,
      badge,
      tags,
      bestTimeToVisit,
      highlight,
      linkLabel,
      about,
      wildlife,
      gettingThere,
      experiences: experiences.filter((exp) => exp.name.trim() && exp.description.trim()),
    }

    setSaving(true)
    try {
      if (isEditing && existingSlug) {
        await updateDestination(existingSlug, input)
      } else {
        await createDestination(input)
      }
      navigate('/admin/content?tab=Regions')
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
          <Link to="/admin/content?tab=Regions" className="hover:text-savanna-green transition-colors">
            Content Manager
          </Link>
          <CaretRight size={12} />
          <span>Regions</span>
          <CaretRight size={12} />
          <span className="text-on-surface font-semibold">{isEditing ? name || existingSlug : 'Add New Destination'}</span>
        </nav>
        <h1 className="font-headline-md text-[22px] text-on-surface">
          {isEditing ? 'Edit Destination' : 'Add New Destination'}
        </h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-error rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Basic Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dest-name" className="block font-label-sm text-label-sm mb-1.5">
                  Region Name
                </label>
                <input
                  id="dest-name"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="dest-slug" className="block font-label-sm text-label-sm mb-1.5">
                  URL Slug
                </label>
                <input
                  id="dest-slug"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dest-badge" className="block font-label-sm text-label-sm mb-1.5">
                  Badge
                </label>
                <input
                  id="dest-badge"
                  required
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Safari Capital"
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="dest-best-time" className="block font-label-sm text-label-sm mb-1.5">
                  Best Time to Visit
                </label>
                <input
                  id="dest-best-time"
                  required
                  value={bestTimeToVisit}
                  onChange={(e) => setBestTimeToVisit(e.target.value)}
                  placeholder="e.g. June – October"
                  className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dest-highlight" className="block font-label-sm text-label-sm mb-1.5">
                Highlight
              </label>
              <input
                id="dest-highlight"
                required
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                placeholder="e.g. Cultural Markets, Coffee Plantations"
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>

            <div>
              <label htmlFor="dest-link-label" className="block font-label-sm text-label-sm mb-1.5">
                Card Link Label
              </label>
              <input
                id="dest-link-label"
                required
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="e.g. View Regional Tours"
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>

            <ChipInput
              label="Tags"
              placeholder="+ Type & press Enter..."
              values={tags}
              onAdd={(v) => setTags((list) => [...list, v])}
              onRemove={(i) => setTags((list) => list.filter((_, idx) => idx !== i))}
            />
          </section>

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Media</h3>
            <div>
              <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Images</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative h-24 rounded-lg overflow-hidden bg-surface-container border border-sand-stone group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((list) => list.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-deep-earth/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <ImageDropzone
                  variant="tile"
                  onUploaded={(url) => setImages((list) => [...list, url])}
                  onError={setUploadError}
                />
              </div>
              {uploadError && <p className="text-error text-xs mt-2">{uploadError}</p>}
            </div>
            <UrlAddField
              label="Or paste an image URL"
              placeholder="https://..."
              onAdd={(v) => setImages((list) => [...list, v])}
            />
            <div>
              <label htmlFor="dest-image-alt" className="block font-label-sm text-label-sm mb-1.5">
                Image Alt Text
              </label>
              <input
                id="dest-image-alt"
                required
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
            <h3 className="font-headline-md text-[18px] text-on-surface">Region Detail Page Content</h3>
            <div>
              <label htmlFor="dest-about" className="block font-label-sm text-label-sm mb-1.5">
                About
              </label>
              <textarea
                id="dest-about"
                required
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>
            <div>
              <label htmlFor="dest-wildlife" className="block font-label-sm text-label-sm mb-1.5">
                Wildlife
              </label>
              <textarea
                id="dest-wildlife"
                required
                rows={3}
                value={wildlife}
                onChange={(e) => setWildlife(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>
            <div>
              <label htmlFor="dest-getting-there" className="block font-label-sm text-label-sm mb-1.5">
                Getting There
              </label>
              <textarea
                id="dest-getting-there"
                required
                rows={3}
                value={gettingThere}
                onChange={(e) => setGettingThere(e.target.value)}
                className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <h3 className="font-headline-md text-[18px] text-on-surface">Experiences</h3>
            <div className="space-y-3">
              {experiences.map((exp, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-container-low space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      value={exp.name}
                      onChange={(e) => updateExperience(i, 'name', e.target.value)}
                      placeholder="Experience name"
                      className="flex-1 bg-surface-container-lowest border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
                    />
                    <button type="button" onClick={() => removeExperience(i)} className="text-on-surface-variant hover:text-error p-2">
                      <Trash size={16} />
                    </button>
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(i, 'description', e.target.value)}
                    rows={2}
                    placeholder="Short description"
                    className="w-full bg-surface-container-lowest border border-sand-stone rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="w-full py-3 rounded-xl border-2 border-dashed border-sand-stone hover:border-savanna-green transition-colors flex items-center justify-center gap-2 text-on-surface-variant hover:text-savanna-green font-label-md text-sm"
            >
              <Plus size={18} />
              Add Experience
            </button>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-savanna-green hover:opacity-90 disabled:opacity-60 text-on-primary font-label-md text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-opacity"
            >
              <Check size={18} weight="bold" />
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Destination'}
            </button>
            <Link
              to="/admin/content?tab=Regions"
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

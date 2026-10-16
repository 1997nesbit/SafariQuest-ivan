import { useId, useRef, useState } from 'react'
import { CloudArrowUp, Plus, SpinnerGap } from '@phosphor-icons/react'
import { uploadImage } from '../../api/uploads'
import { ApiError } from '../../lib/api'

interface MinDimensions {
  width: number
  height: number
}

interface ImageDropzoneProps {
  onUploaded: (url: string) => void
  onError?: (message: string) => void
  variant?: 'banner' | 'tile'
  /** Passed to the upload endpoint so it can enforce a minimum resolution for
   * this spot (see backend/uploads/views.py IMAGE_DIMENSION_REQUIREMENTS). */
  purpose?: string
  /** Shown in the hint text and checked in the browser before uploading, so a
   * too-small image is rejected instantly rather than after a round trip. This
   * is only a fast first check — the server re-checks the real file and is
   * what actually enforces it, since this one can't be trusted on its own. */
  minDimensions?: MinDimensions
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    img.src = url
  })
}

export function ImageDropzone({ onUploaded, onError, variant = 'banner', purpose, minDimensions }: ImageDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (minDimensions) {
        // A file that fails to decode as an image here will fail the server's own
        // check the same way, so it's let through to get that error instead.
        try {
          const { width, height } = await readImageDimensions(file)
          if (width < minDimensions.width || height < minDimensions.height) {
            onError?.(
              `This image is ${width}×${height}px, too small for this spot. Use one at least ${minDimensions.width}×${minDimensions.height}px so it doesn't look stretched or blurry.`,
            )
            return
          }
        } catch {
          // Fall through to the real upload, which will reject it with a clearer reason.
        }
      }
      const url = await uploadImage(file, purpose)
      onUploaded(url)
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : 'Failed to upload image.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      className="sr-only"
      onChange={(e) => handleFiles(e.target.files)}
    />
  )

  const dimensionHint = minDimensions ? ` — at least ${minDimensions.width}×${minDimensions.height}px` : ''

  if (variant === 'tile') {
    return (
      <label
        htmlFor={inputId}
        className="h-24 rounded-lg border-2 border-dashed border-sand-stone hover:border-savanna-green flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-savanna-green transition-colors cursor-pointer"
      >
        {input}
        {uploading ? <SpinnerGap size={18} className="animate-spin" /> : <Plus size={18} />}
        <span className="text-xs">{uploading ? 'Uploading…' : 'Add photo'}</span>
      </label>
    )
  }

  return (
    <label
      htmlFor={inputId}
      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-sand-stone rounded-xl py-10 text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors cursor-pointer"
    >
      {input}
      {uploading ? <SpinnerGap size={28} className="animate-spin" /> : <CloudArrowUp size={28} />}
      <span className="font-label-md text-sm">{uploading ? 'Uploading…' : 'Click to upload an image'}</span>
      <span className="text-xs">JPEG, PNG, WEBP, or GIF — up to 8MB{dimensionHint}</span>
    </label>
  )
}

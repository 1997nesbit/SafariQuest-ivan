import { useId, useRef, useState } from 'react'
import { CloudArrowUp, Plus, SpinnerGap } from '@phosphor-icons/react'
import { uploadImage } from '../../api/uploads'
import { ApiError } from '../../lib/api'

interface ImageDropzoneProps {
  onUploaded: (url: string) => void
  onError?: (message: string) => void
  variant?: 'banner' | 'tile'
}

export function ImageDropzone({ onUploaded, onError, variant = 'banner' }: ImageDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
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
      <span className="text-xs">JPEG, PNG, WEBP, or GIF — up to 8MB</span>
    </label>
  )
}

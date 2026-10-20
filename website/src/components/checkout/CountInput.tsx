import { useState } from 'react'

/** A whole-number field (guest counts) that behaves like typing a number should.
 *
 * Not `type="number"`: React leaves a typed "08" on screen because it still equals 8, and
 * the browser adds spinner arrows and scroll-to-change. This is a text field restricted
 * to digits with the numeric keypad on phones. While typing it holds its own text, so the
 * field can be cleared to type a new number; it settles back to `min` if left empty. */
export function CountInput({
  id,
  value,
  onChange,
  min = 0,
  required,
  className,
}: {
  id: string
  value: number
  onChange: (value: number) => void
  min?: number
  required?: boolean
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      required={required}
      value={draft ?? String(value)}
      onChange={(e) => {
        // Digits only, without leading zeros ("08" → "8", but "0" stays "0").
        const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
        setDraft(digits)
        if (digits !== '') onChange(Math.max(min, Number(digits)))
      }}
      onBlur={() => {
        if (draft === '') onChange(min)
        setDraft(null)
      }}
      className={className}
    />
  )
}

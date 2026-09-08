import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

interface GuideTopBarProps {
  title: string
  showBack?: boolean
  right?: ReactNode
}

export function GuideTopBar({ title, showBack, right }: GuideTopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 inset-x-0 h-16 z-40 flex items-center gap-3 px-4 bg-surface/80 backdrop-blur-md border-b border-surface-variant/60">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-2 -ml-2 text-on-surface-variant hover:text-primary rounded-full transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <h1 className="font-headline-md text-[18px] text-on-surface flex-1 truncate">{title}</h1>
      {right}
    </header>
  )
}

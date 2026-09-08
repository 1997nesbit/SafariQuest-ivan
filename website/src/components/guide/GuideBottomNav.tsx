import { Link } from 'react-router-dom'
import { Calendar, Star, User } from '@phosphor-icons/react'

const TABS = [
  { key: 'schedule', to: '/guide', label: 'Schedule', icon: Calendar },
  { key: 'reviews', to: '/guide/reviews', label: 'Reviews', icon: Star },
  { key: 'profile', to: '/guide/profile', label: 'Profile', icon: User },
] as const

export type GuideTabKey = (typeof TABS)[number]['key']

interface GuideBottomNavProps {
  active: GuideTabKey
}

export function GuideBottomNav({ active }: GuideBottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-surface-variant pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-stretch justify-around">
        {TABS.map(({ key, to, label, icon: Icon }) => {
          const isActive = key === active
          return (
            <Link
              key={key}
              to={to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
              <span className={`font-label-sm text-label-sm ${isActive ? 'font-bold' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

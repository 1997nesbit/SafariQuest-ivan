import { Link } from 'react-router-dom'
import { Star, Clock, Bed } from '@phosphor-icons/react'
import type { SafariPackage } from '../api/safaris'

interface SafariCardProps {
  safari: SafariPackage
}

export function SafariCard({ safari }: SafariCardProps) {
  return (
    <article className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={safari.image}
          alt={safari.imageAlt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {safari.badge && (
          <div className="absolute top-4 left-4 bg-savanna-green text-on-primary px-3 py-1 rounded-full text-label-sm font-label-md uppercase tracking-wider">
            {safari.badge}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col grow">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="font-headline-md text-[24px] text-on-surface">{safari.title}</h3>
          <div className="flex items-center text-golden-sun shrink-0" aria-label={`Rated ${safari.rating} out of 5`}>
            <Star size={18} weight="fill" />
            <span className="ml-1 font-label-md text-on-surface-variant">{safari.rating}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-6 text-on-surface-variant font-label-sm">
          <div className="flex items-center gap-1.5">
            <Clock size={18} />
            {safari.days} Days
          </div>
          <div className="flex items-center gap-1.5">
            <Bed size={18} />
            {safari.accommodation}
          </div>
        </div>
        <div className="border-t border-surface-variant pt-6 mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-tight">Starting From</p>
            <p className="font-headline-md text-savanna-green">${safari.price.toLocaleString()}</p>
          </div>
          <Link
            to={`/safaris/${safari.id}`}
            className="px-5 py-2.5 rounded-lg border border-savanna-green text-savanna-green font-label-md hover:bg-savanna-green hover:text-on-primary transition-colors min-h-[44px] flex items-center"
          >
            View Itinerary
          </Link>
        </div>
      </div>
    </article>
  )
}

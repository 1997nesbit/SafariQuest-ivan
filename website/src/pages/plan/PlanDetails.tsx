import { useTranslation } from 'react-i18next'
import {
  Minus,
  Plus,
  CalendarBlank,
  Users,
  Bed,
  NotePencil,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { useTripPlan, type AccommodationTier } from '../../components/plan/tripPlanStore'
import { todayISO } from '../../lib/date'

const TIERS: { value: AccommodationTier }[] = [{ value: 'Budget' }, { value: 'Mid-range' }, { value: 'Luxury' }]

export function PlanDetails() {
  const { t } = useTranslation('plan')
  const { plan, setDays, setTravelDates, setAdults, setChildren, setAccommodationTier, setNotes } = useTripPlan()
  const navigate = useNavigate()

  return (
    <div>
      <div className="mb-10 max-w-2xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          {t('details.heading')}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t('details.subtitle')}
        </p>
      </div>

      <div className="space-y-6 mb-14">
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <h3 className="font-headline-md text-[20px] text-on-surface flex items-center gap-3 mb-5">
            <CalendarBlank size={22} className="text-savanna-green" />
            {t('details.durationTiming')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                {t('details.numberOfDays')}
              </span>
              <div className="flex items-center justify-between bg-surface-container-low rounded-full p-2 max-w-[220px]">
                <button
                  type="button"
                  onClick={() => setDays(Math.max(1, plan.days - 1))}
                  aria-label={t('details.decreaseDays')}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="font-headline-md text-headline-md text-on-surface w-10 text-center">{plan.days}</span>
                <button
                  type="button"
                  onClick={() => setDays(plan.days + 1)}
                  aria-label={t('details.increaseDays')}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="plan-travel-dates"
                className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2"
              >
                {t('details.estimatedStartDate')}
              </label>
              <input
                id="plan-travel-dates"
                type="date"
                required
                min={todayISO()}
                value={plan.travelDates}
                onChange={(e) => setTravelDates(e.target.value)}
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <h3 className="font-headline-md text-[20px] text-on-surface flex items-center gap-3 mb-5">
            <Users size={22} className="text-savanna-green" />
            {t('details.groupSize')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-4">
              <div>
                <p className="font-label-md text-label-md text-on-surface">{t('details.adults')}</p>
                <p className="text-on-surface-variant text-xs">{t('details.adultsAge')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdults(Math.max(1, plan.adults - 1))}
                  aria-label={t('details.decreaseAdults')}
                  className="w-9 h-9 rounded-full border border-sand-stone flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="font-label-md text-on-surface w-6 text-center">{plan.adults}</span>
                <button
                  type="button"
                  onClick={() => setAdults(plan.adults + 1)}
                  aria-label={t('details.increaseAdults')}
                  className="w-9 h-9 rounded-full border border-sand-stone flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low rounded-xl p-4">
              <div>
                <p className="font-label-md text-label-md text-on-surface">{t('details.children')}</p>
                <p className="text-on-surface-variant text-xs">{t('details.childrenAge')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setChildren(Math.max(0, plan.children - 1))}
                  aria-label={t('details.decreaseChildren')}
                  className="w-9 h-9 rounded-full border border-sand-stone flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="font-label-md text-on-surface w-6 text-center">{plan.children}</span>
                <button
                  type="button"
                  onClick={() => setChildren(plan.children + 1)}
                  aria-label={t('details.increaseChildren')}
                  className="w-9 h-9 rounded-full border border-sand-stone flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <span className="font-headline-md text-[20px] text-on-surface flex items-center gap-3 mb-5">
            <Bed size={22} className="text-savanna-green" />
            {t('details.accommodationStyle')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TIERS.map((tier) => {
              const active = plan.accommodationTier === tier.value
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setAccommodationTier(tier.value)}
                  className={`relative rounded-xl border-2 p-5 text-center transition-all ${
                    active ? 'border-savanna-green bg-savanna-green/5' : 'border-sand-stone hover:border-outline'
                  }`}
                >
                  {active && <CheckCircle size={20} weight="fill" className="absolute top-3 right-3 text-savanna-green" />}
                  <p className="font-label-md text-label-md text-on-surface mb-1">{t(`details.tiers.${tier.value}.title`)}</p>
                  <p className="font-body-md text-[13px] text-on-surface-variant">{t(`details.tiers.${tier.value}.blurb`)}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <label htmlFor="plan-notes" className="font-headline-md text-[20px] text-on-surface flex items-center gap-3 mb-5">
            <NotePencil size={22} className="text-savanna-green" />
            {t('details.personalTouch')} <span className="font-body-md text-on-surface-variant font-normal text-[15px]">{t('details.optional')}</span>
          </label>
          <textarea
            id="plan-notes"
            value={plan.notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t('details.notesPlaceholder')}
            className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-sand-stone">
        <button
          type="button"
          onClick={() => navigate('/plan/experiences')}
          className="min-h-[44px] inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
        >
          <ArrowLeft size={18} />
          {t('details.back')}
        </button>
        <button
          type="button"
          disabled={!plan.travelDates}
          onClick={() => navigate('/plan/review')}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(30,142,62,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('details.next')}
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  )
}

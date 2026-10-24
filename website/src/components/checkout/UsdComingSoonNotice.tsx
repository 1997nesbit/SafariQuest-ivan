import { useTranslation } from 'react-i18next'
import { ArrowsLeftRight, Clock, Phone } from '@phosphor-icons/react'
import { contact } from '../../config/contact'

/** Shown wherever someone has chosen USD while card payments (Senjaropay) aren't live:
 * says plainly that they can't pay in USD yet, and offers the two ways forward — switch
 * the booking to TZS in one click, or call us. */
export function UsdComingSoonNotice({ onSwitchToTzs }: Readonly<{ onSwitchToTzs: () => void }>) {
  const { t } = useTranslation('booking')
  return (
    <div role="status" className="rounded-xl border-2 border-golden-sun bg-golden-sun/15 p-5">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-golden-sun text-on-surface shrink-0">
          <Clock size={22} weight="bold" />
        </span>
        <div className="space-y-1">
          <p className="font-label-md text-[16px] font-bold text-on-surface">{t('usdSoon.heading')}</p>
          <p className="text-sm text-on-surface leading-relaxed">{t('usdSoon.body')}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 sm:pl-[52px]">
        <button
          type="button"
          onClick={onSwitchToTzs}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-5 rounded-lg font-label-md hover:opacity-90 transition-opacity"
        >
          <ArrowsLeftRight size={18} weight="bold" />
          {t('usdSoon.switchToTzs')}
        </button>
        {contact.phoneHref && (
          <a
            href={contact.phoneHref}
            className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-lg font-label-md text-savanna-green hover:underline"
          >
            <Phone size={18} weight="bold" />
            {t('usdSoon.callUs', { phone: contact.phone })}
          </a>
        )}
      </div>
    </div>
  )
}

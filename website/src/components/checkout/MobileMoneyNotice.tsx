import { useTranslation } from 'react-i18next'
import { DeviceMobile } from '@phosphor-icons/react'

/** Shared by every checkout flow with a payment step: payment itself happens on Snippe's
 * hosted checkout (mobile money), so all this page collects is the click. */
export function MobileMoneyNotice() {
  const { t } = useTranslation('booking')
  return (
    <p className="flex items-start gap-3 bg-savanna-green/10 border border-savanna-green/20 rounded-xl p-4 text-on-surface-variant text-sm">
      <DeviceMobile size={20} className="text-savanna-green shrink-0 mt-0.5" />
      {t('payment.mobileMoneyNotice')}
    </p>
  )
}

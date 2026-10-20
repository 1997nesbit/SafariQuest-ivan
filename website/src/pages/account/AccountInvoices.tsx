import { useTranslation } from 'react-i18next'
import { CreditCard } from '@phosphor-icons/react'
import { getMyInvoices, type InvoiceStatus } from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'
import { formatMoney } from '../../lib/money'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  unpaid: 'bg-surface-container text-on-surface-variant',
  deposit_paid: 'bg-golden-sun/20 text-secondary',
  paid: 'bg-savanna-green/15 text-savanna-green',
  overdue: 'bg-error-container text-error',
}

export function AccountInvoices() {
  const { t, i18n } = useTranslation('account')
  const { data: invoices, loading, error } = useFetch(getMyInvoices, [])
  const allInvoices = invoices ?? []

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          {t('invoices.heading')}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          {t('invoices.subtitle')}
        </p>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">{t('invoices.loading')}</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && allInvoices.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant text-center">
          <CreditCard size={40} className="text-on-surface-variant mx-auto mb-4" />
          <p className="font-headline-md text-headline-md text-on-surface mb-2">{t('invoices.emptyHeading')}</p>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {t('invoices.emptyBody')}
          </p>
        </div>
      )}

      {!loading && !error && allInvoices.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">{t('invoices.package')}</th>
                  <th className="px-5 py-3 font-medium">{t('invoices.amount')}</th>
                  <th className="px-5 py-3 font-medium">{t('invoices.issued')}</th>
                  <th className="px-5 py-3 font-medium">{t('invoices.due')}</th>
                  <th className="px-5 py-3 font-medium">{t('invoices.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {allInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4 font-label-md text-sm text-on-surface">{invoice.packageTitle}</td>
                    <td className="px-5 py-4 text-sm text-on-surface">{formatMoney(invoice.amount, i18n.language)}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.issuedDate}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${STATUS_STYLES[invoice.status]}`}>
                        {t(`invoiceStatusLabels.${invoice.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

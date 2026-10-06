import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ScrollManager } from './components/ScrollManager'
import { Home } from './pages/Home'
import { Safaris } from './pages/Safaris'
import { SafariDetail } from './pages/SafariDetail'
import { RegionSafariDetail } from './pages/RegionSafariDetail'
import { Experiences } from './pages/Experiences'
import { Destinations } from './pages/Destinations'
import { DestinationDetail } from './pages/DestinationDetail'
import { About } from './pages/About'
import { SignIn } from './pages/SignIn'
import { SetPassword } from './pages/SetPassword'
import { Faqs } from './pages/Faqs'
import { Checkout } from './pages/Checkout'
import { BookingConfirmed } from './pages/BookingConfirmed'
import { ReferralSignup } from './pages/ReferralSignup'
import { AgentDashboard } from './pages/agent/AgentDashboard'
import { PlanLayout } from './components/plan/PlanLayout'
import { PlanDestinations } from './pages/plan/PlanDestinations'
import { PlanExperiences } from './pages/plan/PlanExperiences'
import { PlanDetails } from './pages/plan/PlanDetails'
import { PlanReview } from './pages/plan/PlanReview'
import { PlanAccount } from './pages/plan/PlanAccount'
import { PlanPayment } from './pages/plan/PlanPayment'
import { AccountLayout } from './components/account/AccountLayout'
import { MyTrips } from './pages/account/MyTrips'
import { AccountInvoices } from './pages/account/AccountInvoices'
import { AccountComplaints } from './pages/account/AccountComplaints'
import { AccountProfile } from './pages/account/AccountProfile'
import { TripProgress } from './pages/account/TripProgress'
import { RateExperience } from './pages/account/RateExperience'
import { ReportIssue } from './pages/account/ReportIssue'
import { GuideSchedule } from './pages/guide/GuideSchedule'
import { GuideTripDetail } from './pages/guide/GuideTripDetail'
import { GuideUpdateProgress } from './pages/guide/GuideUpdateProgress'
import { GuideProfile } from './pages/guide/GuideProfile'
import { GuideReviews } from './pages/guide/GuideReviews'
import { GuideSupport } from './pages/guide/GuideSupport'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminBookingsPipeline } from './pages/admin/AdminBookingsPipeline'
import { AdminBookingDetail } from './pages/admin/AdminBookingDetail'
import { AdminCustomers } from './pages/admin/AdminCustomers'
import { AdminCustomerDetail } from './pages/admin/AdminCustomerDetail'
import { AdminStaffGuides } from './pages/admin/AdminStaffGuides'
import { AdminGuideDetail } from './pages/admin/AdminGuideDetail'
import { AdminPricing } from './pages/admin/AdminPricing'
import { AdminContent } from './pages/admin/AdminContent'
import { AdminDestinationForm } from './pages/admin/AdminDestinationForm'
import { AdminParkForm } from './pages/admin/AdminParkForm'
import { AdminSafariForm } from './pages/admin/AdminSafariForm'
import { AdminRegionSafariForm } from './pages/admin/AdminRegionSafariForm'
import { AdminTeamMemberForm } from './pages/admin/AdminTeamMemberForm'
import { AdminPromotionForm } from './pages/admin/AdminPromotionForm'
import { AdminReferrals } from './pages/admin/AdminReferrals'
import { AdminFinance } from './pages/admin/AdminFinance'
import { AdminInvoices } from './pages/admin/AdminInvoices'
import { AdminInvoiceDocument } from './pages/admin/AdminInvoiceDocument'
import { AdminComplaints } from './pages/admin/AdminComplaints'
import { AdminAnalytics } from './pages/admin/AdminAnalytics'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AuthProvider } from './auth/AuthContext'
import { RequireRole } from './auth/RequireRole'
import { RequireAgent } from './auth/RequireAgent'
import { LocaleRoot } from './i18n/LocaleRoot'
import { SUPPORTED_LOCALES } from './i18n/locales'
import { detectPreferredLocale } from './i18n/detectLocale'

function LocaleRedirect() {
  const { pathname, search, hash } = useLocation()
  const target = `/${detectPreferredLocale()}${pathname === '/' ? '' : pathname}${search}${hash}`
  return <Navigate to={target} replace />
}

function MarketingLayout() {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function SkipLink() {
  const { t } = useTranslation('common')
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-savanna-green focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg"
    >
      {t('skipToMainContent')}
    </a>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ScrollManager />
      <SkipLink />
      <Routes>
        {SUPPORTED_LOCALES.map((lang) => (
          <Route key={lang} path={lang} element={<LocaleRoot />}>
            <Route element={<MarketingLayout />}>
              <Route index element={<Home />} />
              <Route path="safaris" element={<Safaris />} />
              <Route path="safaris/:id" element={<SafariDetail />} />
              <Route path="experiences" element={<Experiences />} />
              <Route path="destinations" element={<Destinations />} />
              <Route path="destinations/:id" element={<DestinationDetail />} />
              <Route path="about" element={<About />} />
              <Route path="faqs" element={<Faqs />} />
              <Route path="sign-in" element={<SignIn />} />
              <Route path="set-password" element={<SetPassword />} />
              <Route path="safaris/:id/book" element={<Checkout kind="safari" />} />
              <Route path="region-safaris/:id" element={<RegionSafariDetail />} />
              <Route path="region-safaris/:id/book" element={<Checkout kind="regionSafari" />} />
              <Route path="booking-confirmed" element={<BookingConfirmed />} />
              <Route path="become-agent" element={<ReferralSignup />} />
              <Route element={<PlanLayout />}>
                <Route path="plan" element={<PlanDestinations />} />
                <Route path="plan/experiences" element={<PlanExperiences />} />
                <Route path="plan/details" element={<PlanDetails />} />
                <Route path="plan/review" element={<PlanReview />} />
                <Route path="plan/account" element={<PlanAccount />} />
                <Route path="plan/payment" element={<PlanPayment />} />
              </Route>
            </Route>

            <Route element={<AccountLayout />}>
              <Route path="account" element={<MyTrips />} />
              <Route path="account/invoices" element={<AccountInvoices />} />
              <Route path="account/complaints" element={<AccountComplaints />} />
              <Route path="account/profile" element={<AccountProfile />} />
              <Route path="account/trips" element={<TripProgress />} />
              <Route path="account/trips/:tripId" element={<TripProgress />} />
              <Route path="account/trips/:tripId/rate" element={<RateExperience />} />
              <Route path="account/trips/:tripId/report-issue" element={<ReportIssue />} />
            </Route>
          </Route>
        ))}

        <Route path="/guide" element={<RequireRole allow={['guide']} />}>
          <Route index element={<GuideSchedule />} />
          <Route path="trips/:tripId" element={<GuideTripDetail />} />
          <Route path="trips/:tripId/progress" element={<GuideUpdateProgress />} />
          <Route path="profile" element={<GuideProfile />} />
          <Route path="reviews" element={<GuideReviews />} />
          <Route path="support" element={<GuideSupport />} />
        </Route>

        <Route path="/agent" element={<RequireAgent />}>
          <Route index element={<AgentDashboard />} />
        </Route>

        <Route element={<RequireRole allow={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="inquiries" element={<AdminBookingsPipeline />} />
            <Route path="inquiries/:id" element={<AdminBookingDetail />} />
            <Route path="clients" element={<AdminCustomers />} />
            <Route path="clients/:id" element={<AdminCustomerDetail />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="invoices/:invoiceId" element={<AdminInvoiceDocument />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="guides" element={<AdminStaffGuides />} />
            <Route path="guides/:id" element={<AdminGuideDetail />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="content/destinations/new" element={<AdminDestinationForm />} />
            <Route path="content/destinations/:slug/edit" element={<AdminDestinationForm />} />
            <Route path="content/safaris/new" element={<AdminSafariForm />} />
            <Route path="content/safaris/:slug/edit" element={<AdminSafariForm />} />
            <Route path="content/region-safaris/new" element={<AdminRegionSafariForm />} />
            <Route path="content/region-safaris/:slug/edit" element={<AdminRegionSafariForm />} />
            <Route path="content/team/new" element={<AdminTeamMemberForm />} />
            <Route path="content/team/:id/edit" element={<AdminTeamMemberForm />} />
            <Route path="content/promotions/new" element={<AdminPromotionForm />} />
            <Route path="content/promotions/:id/edit" element={<AdminPromotionForm />} />
            <Route path="content/parks/new" element={<AdminParkForm />} />
            <Route path="content/parks/:slug/edit" element={<AdminParkForm />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<LocaleRedirect />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ScrollManager } from './components/ScrollManager'
import { Home } from './pages/Home'
import { Safaris } from './pages/Safaris'
import { SafariDetail } from './pages/SafariDetail'
import { Experiences } from './pages/Experiences'
import { Destinations } from './pages/Destinations'
import { DestinationDetail } from './pages/DestinationDetail'
import { About } from './pages/About'
import { SignIn } from './pages/SignIn'
import { SetPassword } from './pages/SetPassword'
import { Faqs } from './pages/Faqs'
import { Checkout } from './pages/Checkout'
import { BookingConfirmed } from './pages/BookingConfirmed'
import { InquiryReceived } from './pages/InquiryReceived'
import { PlanLayout } from './components/plan/PlanLayout'
import { PlanDestinations } from './pages/plan/PlanDestinations'
import { PlanExperiences } from './pages/plan/PlanExperiences'
import { PlanReview } from './pages/plan/PlanReview'
import { MyTrips } from './pages/account/MyTrips'
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
import { AdminContentNew } from './pages/admin/AdminContentNew'
import { AdminFinance } from './pages/admin/AdminFinance'
import { AdminInvoices } from './pages/admin/AdminInvoices'
import { AdminInvoiceDocument } from './pages/admin/AdminInvoiceDocument'
import { AdminComplaints } from './pages/admin/AdminComplaints'
import { AdminAnalytics } from './pages/admin/AdminAnalytics'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AuthProvider } from './auth/AuthContext'
import { RequireRole } from './auth/RequireRole'

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ScrollManager />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-savanna-green focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/safaris" element={<Safaris />} />
          <Route path="/safaris/:id" element={<SafariDetail />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/safaris/:id/book" element={<Checkout />} />
          <Route path="/booking-confirmed" element={<BookingConfirmed />} />
          <Route path="/inquiry-received" element={<InquiryReceived />} />
          <Route element={<PlanLayout />}>
            <Route path="/plan" element={<PlanDestinations />} />
            <Route path="/plan/experiences" element={<PlanExperiences />} />
            <Route path="/plan/review" element={<PlanReview />} />
          </Route>
          <Route path="/account" element={<MyTrips />} />
          <Route path="/account/trips/:tripId" element={<TripProgress />} />
          <Route path="/account/trips/:tripId/rate" element={<RateExperience />} />
          <Route path="/account/trips/:tripId/report-issue" element={<ReportIssue />} />
        </Route>

        <Route path="/guide" element={<RequireRole allow={['guide']} />}>
          <Route index element={<GuideSchedule />} />
          <Route path="trips/:tripId" element={<GuideTripDetail />} />
          <Route path="trips/:tripId/progress" element={<GuideUpdateProgress />} />
          <Route path="profile" element={<GuideProfile />} />
          <Route path="reviews" element={<GuideReviews />} />
          <Route path="support" element={<GuideSupport />} />
        </Route>

        <Route element={<RequireRole allow={['sales', 'operations', 'admin']} />}>
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
            <Route path="content" element={<AdminContent />} />
            <Route path="content/new" element={<AdminContentNew />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

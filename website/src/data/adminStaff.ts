export type StaffRole = 'Senior Guide' | 'Expert Guide' | 'Driver-Guide' | 'Camp Chef' | 'Tour Helper'
export type StaffStatus = 'Available' | 'On Trip' | 'Off-Duty'

export interface StaffReview {
  guestName: string
  rating: number
  comment: string
  date: string
}

export interface AdminStaff {
  id: string
  name: string
  role: StaffRole
  status: StaffStatus
  rating: number
  reviewCount: number
  activeBookingIds: string[]
  upcomingBookingIds: string[]
  reviews: StaffReview[]
}

export const adminStaff: AdminStaff[] = [
  {
    id: 'staff-juma',
    name: 'Juma Mdoe',
    role: 'Senior Guide',
    status: 'On Trip',
    rating: 4.9,
    reviewCount: 48,
    activeBookingIds: ['bk-2041'],
    upcomingBookingIds: [],
    reviews: [
      { guestName: 'Mark Thompson', rating: 5, comment: 'Juma made our trip unforgettable.', date: '2026-08-05' },
      { guestName: 'Elena Fischer', rating: 5, comment: 'Warm, professional, and clearly loves what he does.', date: '2026-07-20' },
    ],
  },
  {
    id: 'staff-amina',
    name: 'Amina Hassan',
    role: 'Driver-Guide',
    status: 'On Trip',
    rating: 4.8,
    reviewCount: 32,
    activeBookingIds: ['bk-2042'],
    upcomingBookingIds: [],
    reviews: [{ guestName: 'Elena Fischer', rating: 5, comment: 'Excellent driving on rough roads, very reassuring.', date: '2026-07-18' }],
  },
  {
    id: 'staff-daniel',
    name: 'Daniel Nkosi',
    role: 'Expert Guide',
    status: 'Available',
    rating: 5.0,
    reviewCount: 12,
    activeBookingIds: [],
    upcomingBookingIds: ['bk-2044'],
    reviews: [{ guestName: 'Anonymous', rating: 5, comment: 'Best wildlife spotting we have ever experienced.', date: '2026-06-30' }],
  },
  {
    id: 'staff-sarah',
    name: 'Sarah Mrema',
    role: 'Driver-Guide',
    status: 'Available',
    rating: 4.9,
    reviewCount: 15,
    activeBookingIds: [],
    upcomingBookingIds: ['bk-2046'],
    reviews: [],
  },
  {
    id: 'staff-juma-mushi',
    name: 'Juma Mushi',
    role: 'Camp Chef',
    status: 'Off-Duty',
    rating: 4.7,
    reviewCount: 21,
    activeBookingIds: [],
    upcomingBookingIds: [],
    reviews: [],
  },
  {
    id: 'staff-kone',
    name: 'Kone Ole',
    role: 'Tour Helper',
    status: 'Available',
    rating: 4.9,
    reviewCount: 8,
    activeBookingIds: [],
    upcomingBookingIds: ['bk-2045'],
    reviews: [],
  },
]

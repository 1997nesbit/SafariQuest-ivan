export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  origin: string
  status: 'Lead' | 'Active' | 'VIP'
  totalSpend: number
  joinedDate: string
  bookingIds: string[]
}

export const adminCustomers: AdminCustomer[] = [
  {
    id: 'cust-mthompson',
    name: 'Mark Thompson',
    email: 'mark.thompson@email.com',
    phone: '+1 415 555 0182',
    origin: 'United States',
    status: 'VIP',
    totalSpend: 17000,
    joinedDate: '2026-07-12',
    bookingIds: ['bk-2041'],
  },
  {
    id: 'cust-efischer',
    name: 'Elena Fischer',
    email: 'elena.fischer@email.com',
    phone: '+49 30 555 0143',
    origin: 'Germany',
    status: 'Active',
    totalSpend: 5600,
    joinedDate: '2026-08-02',
    bookingIds: ['bk-2042'],
  },
  {
    id: 'cust-rchen',
    name: 'Robert Chen',
    email: 'robert.chen@email.com',
    phone: '+65 8555 0176',
    origin: 'Singapore',
    status: 'Active',
    totalSpend: 6400,
    joinedDate: '2026-06-20',
    bookingIds: ['bk-2043'],
  },
  {
    id: 'cust-jkallis',
    name: 'Jonas Kallis',
    email: 'jonas.kallis@email.com',
    phone: '+46 70 555 0198',
    origin: 'Sweden',
    status: 'Lead',
    totalSpend: 0,
    joinedDate: '2026-08-28',
    bookingIds: ['bk-2044'],
  },
  {
    id: 'cust-lmurphy',
    name: 'Laura Murphy',
    email: 'laura.murphy@email.com',
    phone: '+44 20 7555 0134',
    origin: 'United Kingdom',
    status: 'Lead',
    totalSpend: 0,
    joinedDate: '2026-09-01',
    bookingIds: ['bk-2045'],
  },
  {
    id: 'cust-tarangire-family',
    name: 'The Okafor Family',
    email: 'okafor.family@email.com',
    phone: '+234 803 555 0111',
    origin: 'Nigeria',
    status: 'Lead',
    totalSpend: 0,
    joinedDate: '2026-09-03',
    bookingIds: ['bk-2046'],
  },
]

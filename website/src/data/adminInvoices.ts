export type InvoiceStatus = 'Paid' | 'Deposit Paid' | 'Unpaid' | 'Overdue'

export interface InvoiceLineItem {
  label: string
  amount: number
}

export interface AdminInvoice {
  id: string
  bookingId: string
  customerName: string
  packageTitle: string
  amount: number
  status: InvoiceStatus
  issuedDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
}

export const adminInvoices: AdminInvoice[] = [
  {
    id: 'INV-2026-0041',
    bookingId: 'bk-2041',
    customerName: 'Mark Thompson',
    packageTitle: '7-Day Great Migration Quest',
    amount: 17000,
    status: 'Paid',
    issuedDate: '2026-07-15',
    dueDate: '2026-08-01',
    lineItems: [
      { label: 'Land Cruiser & driver-guide (7 days)', amount: 3360 },
      { label: 'Luxury tented camp (4 guests, 6 nights)', amount: 11040 },
      { label: 'Park & concession fees', amount: 2420 },
      { label: 'Service fee', amount: 180 },
    ],
  },
  {
    id: 'INV-2026-0042',
    bookingId: 'bk-2042',
    customerName: 'Elena Fischer',
    packageTitle: '3-Day Ngorongoro & Tarangire Escape',
    amount: 5600,
    status: 'Deposit Paid',
    issuedDate: '2026-08-03',
    dueDate: '2026-09-10',
    lineItems: [
      { label: 'Land Cruiser & driver-guide (3 days)', amount: 1440 },
      { label: 'Safari lodge (2 guests, 2 nights)', amount: 3220 },
      { label: 'Crater entry fees', amount: 660 },
      { label: 'Service fee', amount: 280 },
    ],
  },
  {
    id: 'INV-2026-0043',
    bookingId: 'bk-2043',
    customerName: 'Robert Chen',
    packageTitle: 'Zanzibar Coastal Retreat',
    amount: 6400,
    status: 'Paid',
    issuedDate: '2026-06-22',
    dueDate: '2026-07-01',
    lineItems: [
      { label: 'Beach transfer van', amount: 240 },
      { label: 'Resort accommodation (2 guests, 4 nights)', amount: 5520 },
      { label: 'Spice tour & dhow cruise', amount: 440 },
      { label: 'Service fee', amount: 200 },
    ],
  },
  {
    id: 'INV-2026-0044',
    bookingId: 'bk-2044',
    customerName: 'Jonas Kallis',
    packageTitle: 'The Big Five Pursuit',
    amount: 33600,
    status: 'Unpaid',
    issuedDate: '2026-08-30',
    dueDate: '2026-09-20',
    lineItems: [
      { label: '2x Land Cruiser & driver-guide (10 days)', amount: 9600 },
      { label: 'Luxury tented camp (6 guests, 9 nights)', amount: 20700 },
      { label: 'Park & concession fees', amount: 3300 },
    ],
  },
  {
    id: 'INV-2026-0039',
    bookingId: 'bk-2039',
    customerName: 'Amara Diallo',
    packageTitle: 'Ngorongoro Exclusive',
    amount: 5600,
    status: 'Overdue',
    issuedDate: '2026-07-01',
    dueDate: '2026-07-20',
    lineItems: [
      { label: 'Land Cruiser & driver-guide (5 days)', amount: 1680 },
      { label: 'Safari lodge (2 guests, 4 nights)', amount: 3360 },
      { label: 'Crater entry fees', amount: 560 },
    ],
  },
]

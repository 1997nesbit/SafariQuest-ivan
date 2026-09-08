export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved'

export interface AdminComplaint {
  id: string
  customerId: string
  customerName: string
  tripTitle: string
  milestone: string
  excerpt: string
  fullMessage: string
  date: string
  status: ComplaintStatus
  notes: { author: string; date: string; text: string }[]
}

export const adminComplaints: AdminComplaint[] = [
  {
    id: 'cmp-101',
    customerId: 'cust-rchen',
    customerName: 'Robert Chen',
    tripTitle: 'Zanzibar Coastal Retreat',
    milestone: 'Day 2 - Spice Farm Tour',
    excerpt: 'The morning start time was earlier than what we discussed...',
    fullMessage:
      'The morning start time for the spice farm tour was 6:30 AM but we had agreed on 8:00 AM during planning. It worked out fine but caught us off guard — would be great if changes like this were confirmed in advance.',
    date: '2026-08-19',
    status: 'Resolved',
    notes: [{ author: 'Ops', date: '2026-08-20', text: 'Apologized and offered a late checkout on the last night as a gesture.' }],
  },
  {
    id: 'cmp-102',
    customerId: 'cust-efischer',
    customerName: 'Elena Fischer',
    tripTitle: '3-Day Ngorongoro & Tarangire Escape',
    milestone: 'Day 1 - Lodge Check-in',
    excerpt: 'Our room was not the crater-view room we booked...',
    fullMessage:
      'We specifically booked a crater-view room but were initially placed in a garden-view room on arrival. The lodge did move us the next morning, but it meant we missed the sunrise view on our first day.',
    date: '2026-09-02',
    status: 'In Progress',
    notes: [{ author: 'Sarah (Sales)', date: '2026-09-03', text: 'Following up with the lodge manager about room-block confirmation process.' }],
  },
  {
    id: 'cmp-103',
    customerId: 'cust-mthompson',
    customerName: 'Mark Thompson',
    tripTitle: '7-Day Great Migration Quest',
    milestone: 'Day 3 - Mara River Crossing',
    excerpt: 'Vehicle had some mechanical trouble mid-drive...',
    fullMessage:
      'Our vehicle had a flat tire during the river crossing viewing, which cost us about 45 minutes of prime viewing time. The guide handled it well but we did miss a crossing that happened during the delay.',
    date: '2026-09-04',
    status: 'Open',
    notes: [],
  },
]

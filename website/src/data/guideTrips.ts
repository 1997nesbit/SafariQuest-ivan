export interface TripMilestone {
  id: string
  title: string
  day: string
  status: 'completed' | 'current' | 'upcoming'
  timestamp?: string
  description: string
}

export interface GuideGuest {
  name: string
  partySize: number
  phone: string
  whatsapp: string
  specialRequests: string[]
}

export interface GuideTrip {
  id: string
  packageTitle: string
  dateRange: string
  status: 'in-progress' | 'confirmed' | 'completed'
  statusLabel: string
  guest: GuideGuest
  vehicle: string
  pickup: string
  permitsStatus: string
  milestones: TripMilestone[]
}

export const guideTrips: GuideTrip[] = [
  {
    id: 'great-migration-quest',
    packageTitle: '7-Day Great Migration Quest',
    dateRange: 'Sep 1 - 7, 2026',
    status: 'in-progress',
    statusLabel: 'In Progress · Day 4 of 7',
    guest: {
      name: 'Mark Thompson',
      partySize: 4,
      phone: '+255700000000',
      whatsapp: '255700000000',
      specialRequests: ['Vegetarian x2', 'Wheelchair-accessible vehicle', '🎂 Anniversary surprise, Day 5'],
    },
    vehicle: 'Land Cruiser · Plate T 482 ABC',
    pickup: 'Central Serengeti Camp, 6:30 AM',
    permitsStatus: 'Confirmed',
    milestones: [
      {
        id: 'airport-pickup',
        title: 'Airport Pickup',
        day: 'Day 1',
        status: 'completed',
        timestamp: 'Completed at 8:42 AM',
        description: 'Guests greeted successfully, luggage loaded.',
      },
      {
        id: 'ngorongoro-gate',
        title: 'Ngorongoro Gate Check-in',
        day: 'Day 2',
        status: 'completed',
        timestamp: 'Completed Day 2, 9:15 AM',
        description: 'Permits validated at the gate.',
      },
      {
        id: 'central-serengeti',
        title: 'Central Serengeti Camp — Game Drive',
        day: 'Day 4',
        status: 'current',
        description: 'Exploring the Seronera valley for big cat sightings. Evening sundowners at camp.',
      },
      {
        id: 'ngorongoro-crater',
        title: 'Ngorongoro Crater Descent',
        day: 'Day 5-6',
        status: 'upcoming',
        description: 'Descent into the caldera for dense wildlife viewing.',
      },
      {
        id: 'arusha-departure',
        title: 'Arusha Departure',
        day: 'Day 7',
        status: 'upcoming',
        description: 'Transfer to Kilimanjaro International Airport.',
      },
    ],
  },
  {
    id: 'ngorongoro-tarangire-escape',
    packageTitle: '3-Day Ngorongoro & Tarangire Escape',
    dateRange: 'Sep 12 - 14, 2026',
    status: 'confirmed',
    statusLabel: 'Confirmed',
    guest: {
      name: 'Elena Fischer',
      partySize: 2,
      phone: '+255700000002',
      whatsapp: '255700000002',
      specialRequests: [],
    },
    vehicle: 'Land Cruiser · Plate T 210 XYZ',
    pickup: 'Arusha Hotel, 7:00 AM',
    permitsStatus: 'Confirmed',
    milestones: [
      {
        id: 'arusha-pickup',
        title: 'Arusha Pickup',
        day: 'Day 1',
        status: 'upcoming',
        description: 'Meet guests and transfer to Tarangire.',
      },
      {
        id: 'tarangire-drive',
        title: 'Tarangire Game Drive',
        day: 'Day 1-2',
        status: 'upcoming',
        description: 'Elephant herds and iconic baobab landscapes.',
      },
      {
        id: 'ngorongoro-descent',
        title: 'Ngorongoro Crater Descent',
        day: 'Day 3',
        status: 'upcoming',
        description: 'Full-day crater floor exploration.',
      },
    ],
  },
  {
    id: 'zanzibar-coastal-retreat',
    packageTitle: 'Zanzibar Coastal Retreat',
    dateRange: 'Aug 18 - 22, 2026',
    status: 'completed',
    statusLabel: 'Completed',
    guest: {
      name: 'Robert Chen',
      partySize: 2,
      phone: '+255700000003',
      whatsapp: '255700000003',
      specialRequests: [],
    },
    vehicle: 'N/A — Beach transfer van',
    pickup: 'Zanzibar Airport, 11:00 AM',
    permitsStatus: 'N/A',
    milestones: [
      {
        id: 'airport-transfer',
        title: 'Airport Transfer',
        day: 'Day 1',
        status: 'completed',
        timestamp: 'Completed Aug 18, 11:20 AM',
        description: 'Guests transferred to Stone Town resort.',
      },
      {
        id: 'spice-tour',
        title: 'Spice Farm Tour',
        day: 'Day 2',
        status: 'completed',
        timestamp: 'Completed Aug 19',
        description: 'Guided walk through local spice plantations.',
      },
      {
        id: 'departure',
        title: 'Departure Transfer',
        day: 'Day 5',
        status: 'completed',
        timestamp: 'Completed Aug 22',
        description: 'Guests transferred back to the airport.',
      },
    ],
  },
]

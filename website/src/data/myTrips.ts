import type { TripMilestone } from './guideTrips'

export interface MyTrip {
  id: string
  packageTitle: string
  image: string
  imageAlt: string
  dateRange: string
  status: 'in-progress' | 'upcoming' | 'completed'
  statusLabel: string
  guide: {
    name: string
    role: string
    whatsapp: string
    avatar: string
  }
  milestones: TripMilestone[]
}

export const myTrips: MyTrip[] = [
  {
    id: 'great-migration-quest',
    packageTitle: '7-Day Great Migration Quest',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBuI5OyQjW9raHxyRlAbmvWHJi3CybTwaIrZuOmdpOgYYprthtS9ZwcpmEqIMljBx2sE8EpTzeocODs8eFM_rSTODzFdumC6ReI8DGe_7YN_bNY1Iku4UI9jRSPbqae1c-0eyMCclcWtGbaWCuSawyKsgFvCkxyZAYrkoS_OOguukwZLw8gGQde_ASEnF1RODE0F65cNP3sNUOCncd4pKg7jHZVQMyDiHKdjlNlMSsZ8-3IQLToQXoD',
    imageAlt: 'A pride of lions resting in golden tall grass under a clear Serengeti morning sky.',
    dateRange: 'Sep 1 - 7, 2026',
    status: 'in-progress',
    statusLabel: 'In Progress · Day 4 of 7',
    guide: {
      name: 'Juma Mdoe',
      role: 'Lead Safari Guide',
      whatsapp: '255700000000',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD5enwguDy8qXqtZMfIG-73aAyI3euBWo3x4EDN22HTYzaDoMv2IhkJU6U6Z_r-Y3ERrwjnLaUH-Y6MZMbc7pfFrwtQVAM2aZTlZUBsqiaspB8IHAphQS5SRDKZ6XLzF5LWiByVNX8B4ckHipg5hBn8AHeRxGOw-8TQ31tD2pnv8w9n6eSjWZ-QnZAyFxS4AGzf03dyLGKySf3GbBoRsmRC_c5Tedm35c4NGC9r9iemG2YBZyna-0KM',
    },
    milestones: [
      { id: 'airport-pickup', title: 'Airport Pickup', day: 'Day 1', status: 'completed', timestamp: 'Completed at 8:42 AM', description: 'Guests greeted successfully, luggage loaded.' },
      { id: 'ngorongoro-gate', title: 'Ngorongoro Gate Check-in', day: 'Day 2', status: 'completed', timestamp: 'Completed Day 2, 9:15 AM', description: 'Permits validated at the gate.' },
      { id: 'central-serengeti', title: 'Central Serengeti Camp — Game Drive', day: 'Day 4', status: 'current', description: 'Exploring the Seronera valley for big cat sightings. Evening sundowners at camp.' },
      { id: 'ngorongoro-crater', title: 'Ngorongoro Crater Descent', day: 'Day 5-6', status: 'upcoming', description: 'Descent into the caldera for dense wildlife viewing.' },
      { id: 'arusha-departure', title: 'Arusha Departure', day: 'Day 7', status: 'upcoming', description: 'Transfer to Kilimanjaro International Airport.' },
    ],
  },
  {
    id: 'ngorongoro-tarangire-escape',
    packageTitle: '3-Day Ngorongoro & Tarangire Escape',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHkCl_Uhy40EKsr2G_L14Bjv6iTfTUXAnD8MGxbzUpmIaCm2yFqiiC2uEF1rbt2sH_BhKHvfW9QyaIYOZrwtT2QLkmBb0u-iTqzMcEfEQHgPs9ciAu8J5M8fAJrjnAXACNvztaVYLkXrJ--x5SFpgkpRR7pzT--MIGJWvJZ0KD4wuY5MZ30NZVeG8GiGZX-DyQD2lQzPUEHzue9PZrRYINZsauCi_nZcAuhRepvesIv7NZrPYrUehm',
    imageAlt: 'A luxury glamping tent on a wooden deck overlooking the Ngorongoro Crater at dawn.',
    dateRange: 'Sep 12 - 14, 2026',
    status: 'upcoming',
    statusLabel: 'Confirmed',
    guide: {
      name: 'Amina Hassan',
      role: 'Expert Driver-Guide',
      whatsapp: '255700000002',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB2gSq25f8PaKDrWwPErwUxswVJxrabBHpTwXuuqocSWMNhkUpFMXFIzgptK2_xYsBVXN0dZmAx-meHSEbUVy7qvGbqJfeRnI-m-M1JeMau5vmUAOkVYXfxny0nemPfj0ElZAbK2fEW7uDlUbXyW5F6eQi7ouDD_V4eCyax5kTEiZBIl5lQCKxIIYzAWcXYmQByA4sU0nA7AMPqR-p7uEtSOKS5qqto0DQvV-ON6LPH1oYTioFFR2Ns',
    },
    milestones: [
      { id: 'arusha-pickup', title: 'Arusha Pickup', day: 'Day 1', status: 'upcoming', description: 'Meet your guide and transfer to Tarangire.' },
      { id: 'tarangire-drive', title: 'Tarangire Game Drive', day: 'Day 1-2', status: 'upcoming', description: 'Elephant herds and iconic baobab landscapes.' },
      { id: 'ngorongoro-descent', title: 'Ngorongoro Crater Descent', day: 'Day 3', status: 'upcoming', description: 'Full-day crater floor exploration.' },
    ],
  },
  {
    id: 'zanzibar-coastal-retreat',
    packageTitle: 'Zanzibar Coastal Retreat',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcXaoVz8IIMFpsGih23HWzS_2AVGtPh5Fl4G4y88UaCgDumBl1U7rW7fmZSeJR6mL0UZZpQ4YWD8tBYpIhJ8AWqwO3XSB0nJsp92BGPTXaX4armd9iZ3eXNMcliKYU1aOMDmKrVXx4aV7xda17uDGKZ9K2QNox99l2hVxGRC6qvFyDrejtB8pEpA-kIHARgKkRNAkxHkaj1WeT4OUFJCU0A2_lVz55wKcR8_gWO53IPZHHLvfsN7qP',
    imageAlt: 'A white sand Zanzibar beach with turquoise water and a traditional wooden dhow sailboat.',
    dateRange: 'Aug 18 - 22, 2026',
    status: 'completed',
    statusLabel: 'Completed',
    guide: {
      name: 'Robert Chen',
      role: 'Coastal Specialist',
      whatsapp: '255700000003',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA9vfiPiRJgglE7Ui7OQsQ2_LbiHxT_UIEqyiXlDS5ttwg9tyJY-6X58OFp0aNIp7_ZZRZGKivgQZ2YGDwYtWbGc_Wl0M1e5GxRLxdQoVykc6TiHAaiTvWDesbSEX-0-GngyIPlkZkk8iWkgyQaX6gMW2GyOT7q2KOkJzLvp3lvVYp--L3EjlkVia8fi94yMyA3CH8tXf6_kxrp76vMxdCOzpu_GKDS-3Ly4LqM9C7G67SW06dUiQbs',
    },
    milestones: [
      { id: 'airport-transfer', title: 'Airport Transfer', day: 'Day 1', status: 'completed', timestamp: 'Completed Aug 18', description: 'Transferred to Stone Town resort.' },
      { id: 'spice-tour', title: 'Spice Farm Tour', day: 'Day 2', status: 'completed', timestamp: 'Completed Aug 19', description: 'Guided walk through local spice plantations.' },
      { id: 'departure', title: 'Departure Transfer', day: 'Day 5', status: 'completed', timestamp: 'Completed Aug 22', description: 'Transferred back to the airport.' },
    ],
  },
]

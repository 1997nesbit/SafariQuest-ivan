export interface ItineraryDay {
  day: number
  title: string
  description: string
}

export interface SafariPackage {
  id: string
  title: string
  image: string
  imageAlt: string
  rating: number
  days: number
  accommodation: string
  price: number
  badge?: string
  signature?: boolean
  destination: 'Serengeti National Park' | 'Ngorongoro Conservation Area' | 'Tarangire & Manyara' | 'Zanzibar Extensions'
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

export const safariPackages: SafariPackage[] = [
  {
    id: 'great-migration-path',
    title: 'Great Migration Path',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBuI5OyQjW9raHxyRlAbmvWHJi3CybTwaIrZuOmdpOgYYprthtS9ZwcpmEqIMljBx2sE8EpTzeocODs8eFM_rSTODzFdumC6ReI8DGe_7YN_bNY1Iku4UI9jRSPbqae1c-0eyMCclcWtGbaWCuSawyKsgFvCkxyZAYrkoS_OOguukwZLw8gGQde_ASEnF1RODE0F65cNP3sNUOCncd4pKg7jHZVQMyDiHKdjlNlMSsZ8-3IQLToQXoD',
    imageAlt: 'A pride of lions resting in golden tall grass under a clear Serengeti morning sky.',
    rating: 4.9,
    days: 8,
    accommodation: 'Luxury Tents',
    price: 4250,
    badge: 'Most Popular',
    signature: true,
    destination: 'Serengeti National Park',
    overview:
      "Follow the herds across the Serengeti's endless plains in this once-in-a-lifetime spectacle of nature's greatest journey, tracking the Great Migration from luxury tented camps.",
    highlights: ['Great Migration river crossings', 'Big cat tracking with expert guides', 'Hot air balloon safari add-on', 'Maasai cultural visit'],
    included: ['Private 4x4 Land Cruiser & driver-guide', 'All park fees & concession permits', 'Luxury tented camp accommodation', 'All meals & selected drinks'],
    excluded: ['International flights', 'Visa fees', 'Travel insurance', 'Gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival in Arusha', description: 'Airport pickup and transfer to a private lodge for a briefing dinner with your guide.' },
      { day: 2, title: 'Serengeti North', description: 'Fly to the northern Serengeti and settle into camp with an introductory evening game drive.' },
      { day: 3, title: 'Mara River Crossing', description: 'Full day tracking herds along the Mara River, watching for dramatic crossing attempts.' },
      { day: 4, title: 'Central Serengeti', description: 'Transfer south to the Seronera valley, prime territory for lion and leopard sightings.' },
      { day: 5, title: 'Balloon Safari & Game Drive', description: 'Optional sunrise balloon flight followed by a champagne breakfast and afternoon drive.' },
      { day: 6, title: 'Ngorongoro Crater', description: 'Descend into the crater floor for a full day among dense concentrations of wildlife.' },
      { day: 7, title: 'Maasai Cultural Visit', description: 'Morning visit to a local Maasai village followed by a relaxed afternoon at camp.' },
      { day: 8, title: 'Departure', description: 'Final morning game drive, then transfer to Kilimanjaro International Airport.' },
    ],
  },
  {
    id: 'ngorongoro-exclusive',
    title: 'Ngorongoro Exclusive',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHkCl_Uhy40EKsr2G_L14Bjv6iTfTUXAnD8MGxbzUpmIaCm2yFqiiC2uEF1rbt2sH_BhKHvfW9QyaIYOZrwtT2QLkmBb0u-iTqzMcEfEQHgPs9ciAu8J5M8fAJrjnAXACNvztaVYLkXrJ--x5SFpgkpRR7pzT--MIGJWvJZ0KD4wuY5MZ30NZVeG8GiGZX-DyQD2lQzPUEHzue9PZrRYINZsauCi_nZcAuhRepvesIv7NZrPYrUehm',
    imageAlt: 'A luxury glamping tent on a wooden deck overlooking the Ngorongoro Crater at dawn.',
    rating: 5.0,
    days: 5,
    accommodation: 'Safari Lodge',
    price: 2800,
    signature: true,
    destination: 'Ngorongoro Conservation Area',
    overview:
      'Descend into the caldera for unmatched wildlife density, returning to premium lodge comfort perched on the crater rim each evening.',
    highlights: ['Full-day Ngorongoro Crater floor drive', 'Black rhino tracking', 'Crater-rim lodge with panoramic views', 'Olduvai Gorge archaeological stop'],
    included: ['Private 4x4 Land Cruiser & driver-guide', 'Crater entry & conservation fees', 'Lodge accommodation, crater-view rooms', 'All meals'],
    excluded: ['International flights', 'Visa fees', 'Travel insurance', 'Gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival & Transfer', description: 'Pickup from Kilimanjaro International Airport and scenic drive to the crater rim.' },
      { day: 2, title: 'Olduvai Gorge', description: "Visit the site of some of humanity's earliest fossil discoveries en route to the highlands." },
      { day: 3, title: 'Crater Floor Descent', description: 'Full day exploring the caldera floor — lion prides, flamingo lakes, and black rhino.' },
      { day: 4, title: 'Lake Manyara Extension', description: 'Morning drive through the groundwater forest, famous for tree-climbing lions.' },
      { day: 5, title: 'Departure', description: 'Relaxed breakfast with crater views before transfer to the airport.' },
    ],
  },
  {
    id: 'tarangire-giants',
    title: 'Tarangire Giants',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVaSkzcE4rmmVcZ_y0bRiZRfjigj0BX7bYAzpDANOxbeKSWHTw7zPSbaoVo7st-6M6fxOGTTDoNGIgJY89x6gDAMTeGJBzTCITIszCTsxhgMDvrGPBLGKoZiwoGz0aL_hagm6YOCqoCyKtQnHxJJcRxy7OSlchD8Q9-ZxIT1LJk2lvX15KVszOP-hGawT9UIm-rdgc3t0p3jiswbyUjW5YKVa50d4DEgqeK-EEA7hqz4KMC5XXgLzK',
    imageAlt: 'A large herd of elephants gathering at a watering hole in Tarangire National Park among baobab trees.',
    rating: 4.8,
    days: 4,
    accommodation: 'Mobile Camp',
    price: 1950,
    signature: true,
    destination: 'Tarangire & Manyara',
    overview:
      'A short but spectacular escape to the land of giants, famous for its dense elephant populations and iconic baobab-studded landscapes.',
    highlights: ['Largest elephant herds in Tanzania', 'Iconic baobab tree landscapes', 'Mobile tented camp under the stars', 'Birdwatching along the Tarangire River'],
    included: ['Private 4x4 Land Cruiser & driver-guide', 'Park fees', 'Mobile tented camp accommodation', 'All meals'],
    excluded: ['International flights', 'Visa fees', 'Travel insurance', 'Gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival & Tarangire Entry', description: 'Transfer from Arusha into the park with an afternoon game drive along the river.' },
      { day: 2, title: 'Elephant Herds', description: 'Full day tracking Tarangire’s famous elephant herds among ancient baobabs.' },
      { day: 3, title: 'Silale Swamp', description: 'Explore the swamp area, a magnet for wildlife even in the dry season.' },
      { day: 4, title: 'Departure', description: 'Final morning drive, then transfer back to Arusha.' },
    ],
  },
  {
    id: 'big-five-pursuit',
    title: 'The Big Five Pursuit',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2zw_92y7yS-2USGDZlMKzwCMLUFRE2iPbW_15fQOmsbbAIjng7Rvo9O0gl4ma6zFI2o3KfP8Q2tlYzYwiBUeqBfeZ7GG9oRNPGvrTWqh9Cyis6sn2t_N1svhaZ8kpCgTBqrzMIfV9RD762fMSsCV50u1CwWVtpq-JuHya25-3qvmpclmRx30r7YifV45qoK611RxyIw_G7ANWrLVWmoIsPaDBZSfQdBe_7xLoFlY8JLVYuknFTBMe',
    imageAlt: 'A leopard draped over an acacia tree limb in the Seronera Valley with dappled sunlight.',
    rating: 4.9,
    days: 10,
    accommodation: 'Luxury Tents',
    price: 5600,
    destination: 'Serengeti National Park',
    overview:
      'An extended, expert-led pursuit of the Big Five across the Serengeti ecosystem, timed and routed for maximum sighting density.',
    highlights: ['Dedicated Big Five tracking specialist', 'Extended Seronera Valley stay', 'Private night-drive concession access', 'Small-group, low-density camps'],
    included: ['Private 4x4 Land Cruiser & driver-guide', 'All park & concession fees', 'Luxury tented camp accommodation', 'All meals & selected drinks'],
    excluded: ['International flights', 'Visa fees', 'Travel insurance', 'Gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival in Arusha', description: 'Briefing dinner with your Big Five tracking specialist.' },
      { day: 2, title: 'Seronera Valley', description: 'Fly into central Serengeti, prime leopard and lion territory.' },
      { day: 3, title: 'Leopard Tracking', description: 'Full day focused on the valley’s resident leopard population.' },
      { day: 4, title: 'Rhino Concession', description: 'Private concession access for a chance at the elusive black rhino.' },
      { day: 5, title: 'Buffalo Herds', description: 'Track large buffalo herds along the western corridor.' },
      { day: 6, title: 'Night Drive', description: 'Private concession night drive for nocturnal predator activity.' },
      { day: 7, title: 'Ngorongoro Crater', description: 'Full day crater floor drive rounding out the Big Five checklist.' },
      { day: 8, title: 'Elephant Herds', description: 'Transfer to Tarangire for a day among its famous elephant populations.' },
      { day: 9, title: 'Free Safari Day', description: 'Flexible day to revisit any sighting or simply relax at camp.' },
      { day: 10, title: 'Departure', description: 'Final game drive, then transfer to the airport.' },
    ],
  },
  {
    id: 'sky-and-savanna',
    title: 'Sky & Savanna',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOdxdmcdsiaZTDhsmPXUiUxjgQE1dpGXeCaG65nlmwXubLlSq4RAKTab-fXn3y-_2OHc6M0tkcsd7C2zo_cybSfhM86ycRE3AOQaQvXgZfEfWT6HBA8M74LN4IpjVJ6pm4GPBb3ay_BoCWhB86bblzSmx5QPehhuvJp6PCYgq7z65lyUvbBNTE7a5vz4iRDOX8gqiyKSQl6kq1Y19ABV7Wga9Fb0gIY6FyvY0anMDJCWeRu7M8BrA5',
    imageAlt: 'Hot air balloons floating over the Serengeti plains at sunrise above migrating wildebeest.',
    rating: 4.7,
    days: 6,
    accommodation: 'Premier Lodge',
    price: 3900,
    destination: 'Serengeti National Park',
    overview:
      'A scenic-first safari built around sunrise balloon flights, golden-hour game drives, and premier lodge comfort above the plains.',
    highlights: ['Two sunrise hot air balloon flights', 'Champagne bush breakfasts', 'Premier lodge with plains views', 'Golden-hour photography drives'],
    included: ['Private 4x4 Land Cruiser & driver-guide', 'Two balloon safari flights', 'Premier lodge accommodation', 'All meals & selected drinks'],
    excluded: ['International flights', 'Visa fees', 'Travel insurance', 'Gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival & Lodge Check-in', description: 'Transfer to your premier lodge overlooking the plains.' },
      { day: 2, title: 'Sunrise Balloon Flight', description: 'Dawn balloon safari followed by a champagne bush breakfast.' },
      { day: 3, title: 'Golden-Hour Game Drive', description: 'Photography-focused drive timed around the best light of the day.' },
      { day: 4, title: 'Second Balloon Flight', description: 'A second sunrise flight over a different stretch of the plains.' },
      { day: 5, title: 'Free Exploration', description: 'A relaxed day at your own pace, with an optional walking safari.' },
      { day: 6, title: 'Departure', description: 'Final breakfast with plains views, then transfer to the airport.' },
    ],
  },
  {
    id: 'bush-to-beach',
    title: 'Bush to Beach',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcXaoVz8IIMFpsGih23HWzS_2AVGtPh5Fl4G4y88UaCgDumBl1U7rW7fmZSeJR6mL0UZZpQ4YWD8tBYpIhJ8AWqwO3XSB0nJsp92BGPTXaX4armd9iZ3eXNMcliKYU1aOMDmKrVXx4aV7xda17uDGKZ9K2QNox99l2hVxGRC6qvFyDrejtB8pEpA-kIHARgKkRNAkxHkaj1WeT4OUFJCU0A2_lVz55wKcR8_gWO53IPZHHLvfsN7qP',
    imageAlt: 'A white sand Zanzibar beach with turquoise water and a traditional wooden dhow sailboat.',
    rating: 5.0,
    days: 12,
    accommodation: 'Resort & Tent',
    price: 6400,
    destination: 'Zanzibar Extensions',
    overview:
      'The complete Tanzanian journey: a week of classic safari across the northern circuit followed by five days unwinding on Zanzibar’s beaches.',
    highlights: ['Northern circuit safari (Serengeti, Ngorongoro, Tarangire)', 'Zanzibar beach resort extension', 'Stone Town history & spice tour', 'Sunset dhow cruise'],
    included: ['Private 4x4 Land Cruiser & driver-guide (safari leg)', 'Domestic flight to Zanzibar', 'Camp & resort accommodation', 'All meals on safari, breakfast on the coast'],
    excluded: ['International flights', 'Visa fees', 'Travel insurance', 'Gratuities'],
    itinerary: [
      { day: 1, title: 'Arrival in Arusha', description: 'Briefing dinner and safari preparation.' },
      { day: 2, title: 'Tarangire National Park', description: 'Game drives among elephant herds and baobab trees.' },
      { day: 3, title: 'Ngorongoro Crater', description: 'Full day crater floor exploration.' },
      { day: 4, title: 'Serengeti North', description: 'Fly to the Serengeti for migration tracking.' },
      { day: 5, title: 'Mara River', description: 'Full day at the river watching for crossings.' },
      { day: 6, title: 'Central Serengeti', description: 'Big cat tracking in the Seronera valley.' },
      { day: 7, title: 'Fly to Zanzibar', description: 'Domestic flight from the Serengeti to Zanzibar’s coast.' },
      { day: 8, title: 'Stone Town & Spice Tour', description: 'Guided walk through historic Stone Town and a local spice farm.' },
      { day: 9, title: 'Beach Day', description: 'Free day at your beach resort.' },
      { day: 10, title: 'Sunset Dhow Cruise', description: 'Traditional sailboat cruise along the coast at sunset.' },
      { day: 11, title: 'Free Beach Day', description: 'Relax, dive, or snorkel at your own pace.' },
      { day: 12, title: 'Departure', description: 'Transfer to Zanzibar International Airport.' },
    ],
  },
]

export const signaturePackages = safariPackages.filter((p) => p.signature)

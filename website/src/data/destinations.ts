export interface DestinationExperience {
  name: string
  description: string
}

export interface Destination {
  id: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
  about: string
  wildlife: string
  gettingThere: string
  experiences: DestinationExperience[]
}

export const destinations: Destination[] = [
  {
    id: 'arusha',
    name: 'Arusha',
    images: [
      '/images/destinations/arusha-1.jpg',
      '/images/destinations/arusha-2.jpg',
      '/images/destinations/arusha-3.jpeg',
    ],
    imageAlt: 'Arusha city view with Mount Meru rising in the background.',
    badge: 'Safari Capital',
    tags: ['Gateway to Northern Circuit', 'Mount Meru'],
    bestTimeToVisit: 'June – October',
    highlight: 'Cultural Markets, Coffee Plantations',
    linkLabel: 'View Regional Tours',
    about:
      "Arusha is the safari capital of Tanzania and the launchpad for the Northern Circuit — most journeys to the Serengeti and Ngorongoro begin here. Set at the foot of Mount Meru, it blends a working city with easy access to coffee country and cultural markets.",
    wildlife: 'Not a park itself, but the gateway to Arusha National Park nearby — giraffe, buffalo, and flamingo-lined crater lakes on Mount Meru\'s slopes.',
    gettingThere: 'Kilimanjaro International Airport (JRO) is 45 minutes away; most safaris transfer directly from here into the Northern Circuit.',
    experiences: [
      { name: 'Coffee Plantation Tour', description: 'Walk a working estate and learn the bean-to-cup process.' },
      { name: 'Cultural Market Visit', description: 'Browse local crafts and produce at the central market.' },
      { name: 'Mount Meru Day Hike', description: 'A shorter, less-crowded alternative to Kilimanjaro with big views.' },
    ],
  },
  {
    id: 'morogoro',
    name: 'Morogoro',
    images: [
      '/images/destinations/morogoro-1.jpeg',
      '/images/destinations/morogoro-2.jpg',
      '/images/destinations/morogoro-3.jpeg',
    ],
    imageAlt: 'The lush green Uluguru Mountains overlooking Morogoro.',
    badge: 'Uluguru Mountains',
    tags: ['Agricultural Hub'],
    bestTimeToVisit: 'June – September',
    highlight: 'Mountain Trekking, Waterfall Hikes',
    linkLabel: 'Explore Morogoro',
    about:
      "Morogoro sits beneath the lush Uluguru Mountains, a green, agricultural region known for its terraced farms, waterfalls, and cooler highland climate — a refreshing change of pace from the savanna.",
    wildlife: 'The Uluguru Mountains are a biodiversity hotspot with endemic birds, chameleons, and primates found nowhere else in Tanzania.',
    gettingThere: 'A 3-4 hour drive from Dar es Salaam, or a short domestic flight to Morogoro Airport.',
    experiences: [
      { name: 'Uluguru Mountain Trek', description: 'Guided hikes through terraced farmland to waterfall viewpoints.' },
      { name: 'Village Homestay', description: 'Spend a night with a local family to experience highland life.' },
      { name: 'Birdwatching Walk', description: 'Track endemic species with a specialist local guide.' },
    ],
  },
  {
    id: 'dar-es-salaam',
    name: 'Dar es Salaam',
    images: ['/images/destinations/dar-es-salaam-1.jpg', '/images/destinations/dar-es-salaam-2.jpg'],
    imageAlt: 'Dar es Salaam skyline and harbor at dusk.',
    badge: 'Coastal Capital',
    tags: ['Commercial Capital', 'Coastal City'],
    bestTimeToVisit: 'June – October',
    highlight: 'Seafood Markets, Nightlife, Beaches',
    linkLabel: 'City Guide',
    about:
      "Tanzania's commercial capital and largest city, Dar es Salaam mixes Swahili coast culture, a busy working harbor, and a growing food and nightlife scene — a natural stopover before or after a safari.",
    wildlife: 'Not a wildlife destination itself, but a short ferry from Zanzibar and within reach of the Selous/Nyerere ecosystem.',
    gettingThere: 'Julius Nyerere International Airport (DAR) is Tanzania\'s main international gateway.',
    experiences: [
      { name: 'Kivukoni Fish Market', description: 'Watch the daily catch come in at this bustling harborside market.' },
      { name: 'Coco Beach Sunset', description: 'Unwind at the city\'s most popular beach as the sun sets over the water.' },
      { name: 'Village Museum', description: 'An open-air museum of traditional homesteads from across Tanzania.' },
    ],
  },
  {
    id: 'zanzibar',
    name: 'Zanzibar',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzWaW1mOT0Rmwr8duuuG0x544AeRKj6SLEXQRZSVOqNi-56OFrLnTE59aBS5PKSlCulgYMVgCKfiLcCarXpk23HGdgEaQMlHji8sTC0i7HgRGZl9jy_DXreiXt-dV6pd5pSgxLgkPmnEu-5E0enfsmU7EP8NLGJg1SndX554PkSAL4bpr1nZu69ttNlEct-zER_-gMe9qff-97HrUfH5BTSG_Zdcqpac0EdKGNR1eotkNZ07jbnRn5',
    ],
    imageAlt: 'Zanzibar beach with turquoise water and white sand.',
    badge: 'Spice Island',
    tags: ['Stone Town'],
    bestTimeToVisit: 'June – October',
    highlight: 'Diving, Spice Tours, History',
    linkLabel: 'Island Escapes',
    about:
      "Zanzibar's white-sand beaches and turquoise water make it the classic post-safari extension, while historic Stone Town and the island's spice farms give it a character all its own.",
    wildlife: 'World-class reef diving and snorkeling — turtles, reef sharks, and vibrant coral gardens off the northern and eastern coasts.',
    gettingThere: 'Abeid Amani Karume International Airport (ZNZ), or a short domestic flight from Arusha or Dar es Salaam after your safari.',
    experiences: [
      { name: 'Stone Town Walking Tour', description: 'Explore the winding alleys of this UNESCO World Heritage old town.' },
      { name: 'Spice Farm Tour', description: 'Walk a working plantation and sample cloves, nutmeg, and vanilla.' },
      { name: 'Sunset Dhow Cruise', description: 'Sail the coast at golden hour on a traditional wooden dhow.' },
    ],
  },
  {
    id: 'kilwa',
    name: 'Kilwa',
    images: ['/images/destinations/kilwa-1.jpeg', '/images/destinations/kilwa-2.jpg'],
    imageAlt: 'The historic ruins of Kilwa Kisiwani.',
    badge: 'UNESCO World Heritage',
    tags: ['Ancient Ruins'],
    bestTimeToVisit: 'June – October',
    highlight: 'Kilwa Kisiwani, Songo Mnara',
    linkLabel: 'Historical Tours',
    about:
      "Once a powerful medieval trading port, Kilwa's ruins are among the most significant Swahili coast heritage sites in East Africa — a quiet, little-visited counterpart to Zanzibar's history.",
    wildlife: 'Coastal waters here are less developed than Zanzibar\'s, with quieter reefs and dugong sightings occasionally reported offshore.',
    gettingThere: 'A scenic coastal drive or domestic flight south from Dar es Salaam.',
    experiences: [
      { name: 'Kilwa Kisiwani Ruins', description: 'Guided tour of the UNESCO-listed medieval trading city ruins.' },
      { name: 'Songo Mnara Island', description: 'A boat trip to a second, less-visited ruined Swahili settlement.' },
      { name: 'Local Fishing Village Visit', description: 'See traditional dhow-building and fishing practices firsthand.' },
    ],
  },
]

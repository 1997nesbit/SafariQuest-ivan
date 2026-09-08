export interface Faq {
  question: string
  answer: string
}

export interface FaqCategory {
  category: string
  items: Faq[]
}

export const faqCategories: FaqCategory[] = [
  {
    category: 'Booking & Payment',
    items: [
      {
        question: 'How do I book a safari?',
        answer:
          'Browse our safari packages or use the trip planner to build a custom itinerary, then submit an inquiry. A safari specialist will follow up within one business day with a tailored quote.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept bank transfer and major credit cards. A deposit secures your booking, with the balance due before departure.',
      },
      {
        question: 'Is a deposit required?',
        answer: 'Yes, a 30% deposit is required to confirm your booking, with the remaining balance due 60 days before your safari begins.',
      },
    ],
  },
  {
    category: 'Visas & Entry',
    items: [
      {
        question: 'Do I need a visa for Tanzania?',
        answer: 'Most visitors need a visa, available on arrival or in advance online through the official Tanzania e-Visa portal. We recommend applying at least two weeks before travel.',
      },
      {
        question: 'What documents do I need to travel?',
        answer: 'A passport valid for at least six months beyond your travel dates, your visa, and proof of yellow fever vaccination if arriving from an endemic country.',
      },
    ],
  },
  {
    category: 'Best Time to Visit',
    items: [
      {
        question: 'When is the best time to see the Great Migration?',
        answer: 'The Mara River crossings typically peak from July to September, while the calving season in the southern Serengeti runs from January to March.',
      },
      {
        question: 'What is the weather like?',
        answer: 'Tanzania has two rainy seasons (March-May and November) and is generally dry and sunny the rest of the year, with cooler evenings at higher elevations.',
      },
    ],
  },
  {
    category: 'Packing',
    items: [
      {
        question: 'What should I pack for a safari?',
        answer: 'Neutral-colored, lightweight clothing, a warm layer for early morning drives, sturdy closed shoes, sun protection, and binoculars. A detailed packing list is sent after booking.',
      },
      {
        question: 'Are there luggage restrictions on domestic flights?',
        answer: 'Yes — light aircraft transfers typically limit luggage to 15kg in a soft-sided bag. We\'ll confirm exact limits for your specific itinerary.',
      },
    ],
  },
  {
    category: 'Health & Safety',
    items: [
      {
        question: 'Do I need vaccinations?',
        answer: 'Yellow fever vaccination is required if arriving from an endemic country. We also recommend consulting a travel clinic about malaria prophylaxis and routine vaccinations.',
      },
      {
        question: 'Is Tanzania safe for travelers?',
        answer: 'Yes — all our safaris are led by licensed, experienced guides, and our vehicles and camps meet strict safety standards. We maintain 24/7 emergency contact throughout your trip.',
      },
    ],
  },
  {
    category: 'Cancellation Policy',
    items: [
      {
        question: 'What is your cancellation policy?',
        answer: 'Cancellations made more than 90 days before departure receive a full refund minus a small admin fee. Closer cancellations are subject to a sliding scale — full details are in your booking confirmation.',
      },
      {
        question: 'Do you recommend travel insurance?',
        answer: 'Yes, comprehensive travel insurance covering trip cancellation, medical evacuation, and personal belongings is required for all our safaris.',
      },
    ],
  },
]

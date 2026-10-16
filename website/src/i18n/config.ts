import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en_common from './locales/en/common.json'
import en_home from './locales/en/home.json'
import en_safaris from './locales/en/safaris.json'
import en_destinations from './locales/en/destinations.json'
import en_about from './locales/en/about.json'
import en_faqs from './locales/en/faqs.json'
import en_auth from './locales/en/auth.json'
import en_booking from './locales/en/booking.json'
import en_plan from './locales/en/plan.json'
import en_account from './locales/en/account.json'

import fr_common from './locales/fr/common.json'
import fr_home from './locales/fr/home.json'
import fr_safaris from './locales/fr/safaris.json'
import fr_destinations from './locales/fr/destinations.json'
import fr_about from './locales/fr/about.json'
import fr_faqs from './locales/fr/faqs.json'
import fr_auth from './locales/fr/auth.json'
import fr_booking from './locales/fr/booking.json'
import fr_plan from './locales/fr/plan.json'
import fr_account from './locales/fr/account.json'

import de_common from './locales/de/common.json'
import de_home from './locales/de/home.json'
import de_safaris from './locales/de/safaris.json'
import de_destinations from './locales/de/destinations.json'
import de_about from './locales/de/about.json'
import de_faqs from './locales/de/faqs.json'
import de_auth from './locales/de/auth.json'
import de_booking from './locales/de/booking.json'
import de_plan from './locales/de/plan.json'
import de_account from './locales/de/account.json'

import pt_common from './locales/pt/common.json'
import pt_home from './locales/pt/home.json'
import pt_safaris from './locales/pt/safaris.json'
import pt_destinations from './locales/pt/destinations.json'
import pt_about from './locales/pt/about.json'
import pt_faqs from './locales/pt/faqs.json'
import pt_auth from './locales/pt/auth.json'
import pt_booking from './locales/pt/booking.json'
import pt_plan from './locales/pt/plan.json'
import pt_account from './locales/pt/account.json'

import { DEFAULT_LOCALE } from './locales'

export const NAMESPACES = [
  'common',
  'home',
  'safaris',
  'destinations',
  'about',
  'faqs',
  'auth',
  'booking',
  'plan',
  'account',
] as const

void i18next.use(initReactI18next).init({
  resources: {
    en: {
      common: en_common,
      home: en_home,
      safaris: en_safaris,
      destinations: en_destinations,
      about: en_about,
      faqs: en_faqs,
      auth: en_auth,
      booking: en_booking,
      plan: en_plan,
      account: en_account,
    },
    fr: {
      common: fr_common,
      home: fr_home,
      safaris: fr_safaris,
      destinations: fr_destinations,
      about: fr_about,
      faqs: fr_faqs,
      auth: fr_auth,
      booking: fr_booking,
      plan: fr_plan,
      account: fr_account,
    },
    de: {
      common: de_common,
      home: de_home,
      safaris: de_safaris,
      destinations: de_destinations,
      about: de_about,
      faqs: de_faqs,
      auth: de_auth,
      booking: de_booking,
      plan: de_plan,
      account: de_account,
    },
    pt: {
      common: pt_common,
      home: pt_home,
      safaris: pt_safaris,
      destinations: pt_destinations,
      about: pt_about,
      faqs: pt_faqs,
      auth: pt_auth,
      booking: pt_booking,
      plan: pt_plan,
      account: pt_account,
    },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  debug: import.meta.env.DEV,
})

export default i18next

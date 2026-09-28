export const contact = {
  phone: import.meta.env.VITE_CONTACT_PHONE,
  phoneHref: import.meta.env.VITE_CONTACT_PHONE_HREF,
  email: import.meta.env.VITE_CONTACT_EMAIL,
  address: import.meta.env.VITE_CONTACT_ADDRESS,
  secondary: {
    name: import.meta.env.VITE_CONTACT_SECONDARY_NAME,
    email: import.meta.env.VITE_CONTACT_SECONDARY_EMAIL,
    phone: import.meta.env.VITE_CONTACT_SECONDARY_PHONE,
  },
  social: {
    instagram: import.meta.env.VITE_SOCIAL_INSTAGRAM,
    facebook: import.meta.env.VITE_SOCIAL_FACEBOOK,
    tiktok: import.meta.env.VITE_SOCIAL_TIKTOK,
    linkedin: import.meta.env.VITE_SOCIAL_LINKEDIN,
    whatsapp: import.meta.env.VITE_SOCIAL_WHATSAPP,
  },
}

/** A `tel:` link for a phone number, whether or not the env value already has the
 * prefix. A bare "+255…" used as an href is a relative URL: the browser navigates to
 * /current/page/+255… instead of dialling. */
function telHref(value: string | undefined): string | undefined {
  if (!value) return undefined
  const number = value.replace(/^tel:/i, '').replace(/[^\d+]/g, '')
  return number ? `tel:${number}` : undefined
}

export const contact = {
  phone: import.meta.env.VITE_CONTACT_PHONE,
  /** Always a complete `tel:` link — use it as the href directly. */
  phoneHref: telHref(import.meta.env.VITE_CONTACT_PHONE_HREF),
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

import { useState, type FormEvent } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import { useAuth } from '../../auth/AuthContext'

export function AccountProfile() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: wire up to a real profile-update endpoint once one exists.
    setSaved(true)
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Profile</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Keep your contact details up to date so we can reach you about your safaris.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant max-w-xl space-y-5"
      >
        {saved && (
          <div className="flex items-center gap-2 bg-savanna-green/10 text-savanna-green rounded-lg px-4 py-3">
            <CheckCircle size={20} weight="fill" />
            Profile updated.
          </div>
        )}
        <div>
          <label htmlFor="profile-name" className="block font-label-md text-label-md text-on-surface mb-2">
            Full Name
          </label>
          <input
            id="profile-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="block font-label-md text-label-md text-on-surface mb-2">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            disabled
            value={user?.email ?? ''}
            className="w-full min-h-[44px] bg-surface-container-low border border-sand-stone rounded-lg px-4 py-3 text-on-surface-variant cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="profile-phone" className="block font-label-md text-label-md text-on-surface mb-2">
            Phone / WhatsApp
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+255 700 000 000"
            className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <button
          type="submit"
          className="min-h-[44px] bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}

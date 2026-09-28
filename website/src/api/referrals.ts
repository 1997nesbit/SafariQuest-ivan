import { apiGet, apiPatch, apiPost } from '../lib/api'

export interface ReferralRedemptionSummary {
  bookingId: number
  commissionAmount: number
  commissionStatus: 'pending' | 'paid'
  createdAt: string
}

export interface ReferralCode {
  id: number
  code: string
  contactName: string
  status: 'active' | 'used' | 'expired'
  createdAt: string
  expiresAt: string
  usedAt: string | null
  redemption: ReferralRedemptionSummary | null
}

interface ReferralCodeApiShape {
  id: number
  code: string
  contact_name: string
  status: 'active' | 'used' | 'expired'
  created_at: string
  expires_at: string
  used_at: string | null
  redemption: {
    bookingId: number
    commission_amount: number
    commission_status: 'pending' | 'paid'
    created_at: string
  } | null
}

function normalizeCode(raw: ReferralCodeApiShape): ReferralCode {
  return {
    id: raw.id,
    code: raw.code,
    contactName: raw.contact_name,
    status: raw.status,
    createdAt: raw.created_at,
    expiresAt: raw.expires_at,
    usedAt: raw.used_at,
    redemption: raw.redemption
      ? {
          bookingId: raw.redemption.bookingId,
          commissionAmount: raw.redemption.commission_amount,
          commissionStatus: raw.redemption.commission_status,
          createdAt: raw.redemption.created_at,
        }
      : null,
  }
}

/** New visitors only: creates a tourist account with the agent profile already on,
 * and signs them in. Refuses an email that already has an account. */
export async function registerAgent(input: { email: string; name: string; password: string }): Promise<void> {
  await apiPost<unknown>('/api/referrals/agents/register/', input)
}

/** Switches the agent profile on for the signed-in tourist. Safe to call twice. */
export async function activateReferralAgent(): Promise<void> {
  await apiPost<unknown>('/api/referrals/agents/activate/')
}

export async function generateReferralCode(contactName?: string): Promise<ReferralCode> {
  const raw = await apiPost<ReferralCodeApiShape>('/api/referrals/codes/', { contact_name: contactName ?? '' })
  return normalizeCode(raw)
}

export async function getMyReferralCodes(): Promise<ReferralCode[]> {
  const raw = await apiGet<ReferralCodeApiShape[]>('/api/referrals/codes/mine/')
  return raw.map(normalizeCode)
}

export async function validateReferralCode(code: string): Promise<{ discountPercent: number }> {
  const raw = await apiPost<{ discountPercent: string }>('/api/referrals/codes/validate/', { code })
  return { discountPercent: Number(raw.discountPercent) }
}

export interface ReferralSettings {
  discountPercent: number
  commissionPercent: number
  codeExpiryDays: number
}

interface ReferralSettingsApiShape {
  discount_percent: string
  commission_percent: string
  code_expiry_days: number
}

function toReferralSettings(raw: ReferralSettingsApiShape): ReferralSettings {
  return {
    discountPercent: Number(raw.discount_percent),
    commissionPercent: Number(raw.commission_percent),
    codeExpiryDays: raw.code_expiry_days,
  }
}

/** Rates shown to visitors on the Refer & Earn pages — no auth required. */
export async function getPublicReferralSettings(): Promise<ReferralSettings> {
  return toReferralSettings(await apiGet<ReferralSettingsApiShape>('/api/referrals/settings/public/'))
}

export async function getReferralSettings(): Promise<ReferralSettings> {
  return toReferralSettings(await apiGet<ReferralSettingsApiShape>('/api/referrals/settings/'))
}

export async function updateReferralSettings(input: {
  discountPercent: number
  commissionPercent: number
  codeExpiryDays: number
}): Promise<ReferralSettings> {
  const raw = await apiPatch<ReferralSettingsApiShape>('/api/referrals/settings/', {
    discount_percent: input.discountPercent,
    commission_percent: input.commissionPercent,
    code_expiry_days: input.codeExpiryDays,
  })
  return toReferralSettings(raw)
}

export interface ReferralRedemption {
  id: number
  agentName: string
  agentEmail: string
  code: string
  bookingId: number
  customerName: string
  customerEmail: string
  tripTotal: number
  discountPercent: number
  commissionPercent: number
  commissionAmount: number
  commissionStatus: 'pending' | 'paid'
  createdAt: string
}

interface ReferralRedemptionApiShape {
  id: number
  agentName: string
  agentEmail: string
  code: string
  bookingId: number
  customerName: string
  customerEmail: string
  trip_total: number
  discount_percent: string
  commission_percent: string
  commission_amount: number
  commission_status: 'pending' | 'paid'
  created_at: string
}

function normalizeRedemption(raw: ReferralRedemptionApiShape): ReferralRedemption {
  return {
    id: raw.id,
    agentName: raw.agentName,
    agentEmail: raw.agentEmail,
    code: raw.code,
    bookingId: raw.bookingId,
    customerName: raw.customerName,
    customerEmail: raw.customerEmail,
    tripTotal: raw.trip_total,
    discountPercent: Number(raw.discount_percent),
    commissionPercent: Number(raw.commission_percent),
    commissionAmount: raw.commission_amount,
    commissionStatus: raw.commission_status,
    createdAt: raw.created_at,
  }
}

export async function getReferralRedemptions(): Promise<ReferralRedemption[]> {
  const raw = await apiGet<{ results: ReferralRedemptionApiShape[] } | ReferralRedemptionApiShape[]>(
    '/api/referrals/admin/redemptions/',
  )
  const list = Array.isArray(raw) ? raw : raw.results
  return list.map(normalizeRedemption)
}

export async function markCommissionPaid(id: number): Promise<ReferralRedemption> {
  const raw = await apiPost<ReferralRedemptionApiShape>(`/api/referrals/admin/redemptions/${id}/mark-paid/`)
  return normalizeRedemption(raw)
}

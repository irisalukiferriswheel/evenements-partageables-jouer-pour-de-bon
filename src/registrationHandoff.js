export function isZeffyCheckoutUrl(value) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    return url.protocol === 'https:' && (hostname === 'zeffy.com' || hostname.endsWith('.zeffy.com'))
  } catch {
    return false
  }
}

export function getGuestRegistrationHandoff(payload) {
  const data = payload?.data ?? payload
  const registration = data?.registration ?? data
  const registrationId = registration?.id ?? null
  const guestToken = data?.guestToken ?? data?.guest_token ?? null
  const checkout = data?.checkout ?? {}
  const checkoutUrl = checkout?.checkoutUrl ?? checkout?.checkout_url ?? data?.checkoutUrl ?? data?.checkout_url ?? null
  const paymentProvider = String(
    checkout?.provider ?? data?.paymentProvider ?? data?.payment_provider ?? '',
  ).toLowerCase()

  if (checkoutUrl) {
    if (paymentProvider && paymentProvider !== 'zeffy') {
      return { kind: 'payment_blocked', reason: 'unsupported_provider' }
    }
    if (!isZeffyCheckoutUrl(checkoutUrl)) {
      return { kind: 'payment_blocked', reason: 'untrusted_checkout_url' }
    }
    return { kind: 'redirect', checkoutUrl, provider: 'zeffy' }
  }

  if (registrationId && guestToken) {
    return {
      kind: 'guest_checkout',
      registrationId,
      guestToken,
    }
  }

  return {
    kind: 'registered',
    registrationId,
  }
}

export function getGuestRegistrationHandoff(payload) {
  const data = payload?.data ?? payload
  const registration = data?.registration ?? data
  const registrationId = registration?.id ?? null
  const guestToken = data?.guestToken ?? data?.guest_token ?? null
  const checkoutUrl = data?.checkout?.checkoutUrl ?? data?.checkout?.checkout_url ?? null

  if (checkoutUrl) {
    return { kind: 'redirect', checkoutUrl }
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

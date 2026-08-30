function moneyAmount(value) {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null
}

export function getCauseContributionBalance(event, registration = null) {
  const source =
    registration?.contributionBalance ??
    registration?.contribution_balance ??
    registration?.causeContributionBalance ??
    registration?.cause_contribution_balance ??
    registration

  if (!source) return unavailableBalance(event)

  const requiredCauseContribution = moneyAmount(
    source?.requiredCauseContribution ?? source?.required_cause_contribution,
  )
  const creditedCauseContribution = moneyAmount(
    source?.creditedCauseContribution ??
    source?.credited_cause_contribution ??
    source?.causeContributionCredited ??
    source?.cause_contribution_credited,
  )
  const causeDifference = moneyAmount(
    source?.causeDifference ?? source?.cause_difference,
  )
  const remainingRegistrationBalance = moneyAmount(
    source?.remainingRegistrationBalance ?? source?.remaining_registration_balance,
  )
  const winnerAllocationDifference = moneyAmount(
    source?.winnerAllocationDifference ?? source?.winner_allocation_difference,
  )

  const amounts = [
    requiredCauseContribution,
    creditedCauseContribution,
    causeDifference,
    remainingRegistrationBalance,
    winnerAllocationDifference,
  ]
  const authoritative = amounts.every((amount) => amount !== null && amount >= 0)

  if (!authoritative) return unavailableBalance(event)

  const expectedDifference = Math.max(requiredCauseContribution - creditedCauseContribution, 0)
  const registrationFee = moneyAmount(
    source?.registrationFee ??
    source?.registration_fee ??
    registration?.registrationFee ??
    registration?.registration_fee ??
    event?.entry_fee ??
    event?.feeAmount ??
    event?.fee_amount,
  )
  const paymentDeadline = source?.paymentDeadline ?? source?.payment_deadline ?? null
  const deadlineIsPresent = causeDifference === 0 || isValidDeadline(paymentDeadline)
  const valid =
    withinOneCent(causeDifference, expectedDifference) &&
    withinOneCent(winnerAllocationDifference, causeDifference) &&
    withinOneCent(remainingRegistrationBalance, causeDifference + winnerAllocationDifference) &&
    (registrationFee === null || withinOneCent(requiredCauseContribution, registrationFee / 2)) &&
    deadlineIsPresent

  return {
    available: true,
    valid,
    incomplete: valid && causeDifference > 0,
    currency: currencyCode(source?.currency ?? registration?.currency ?? event?.currency),
    requiredCauseContribution,
    creditedCauseContribution,
    remainingRegistrationBalance,
    causeDifference,
    winnerAllocationDifference,
    paymentDeadline,
  }
}

function withinOneCent(left, right) {
  return Math.abs(left - right) < 0.011
}

function isValidDeadline(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(new Date(value).getTime())
}

function currencyCode(value) {
  const currency = String(value ?? '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(currency) ? currency : 'CAD'
}

function unavailableBalance(event) {
  return {
    available: false,
    valid: false,
    incomplete: false,
    currency: currencyCode(event?.currency),
    requiredCauseContribution: null,
    creditedCauseContribution: null,
    remainingRegistrationBalance: null,
    causeDifference: null,
    winnerAllocationDifference: null,
    paymentDeadline: null,
  }
}

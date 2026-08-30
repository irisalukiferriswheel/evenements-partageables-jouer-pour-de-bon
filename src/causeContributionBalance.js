function moneyAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0
}

export function getCauseContributionBalance(event, registration = null) {
  const registrationFee = moneyAmount(
    registration?.registrationFee ??
    registration?.registration_fee ??
    event?.entry_fee ??
    event?.feeAmount ??
    event?.fee_amount,
  )
  const requiredCauseContribution = moneyAmount(
    registration?.requiredCauseContribution ??
    registration?.required_cause_contribution ??
    event?.requiredCauseContribution ??
    event?.required_cause_contribution ??
    registrationFee / 2,
  )
  const creditedCauseContribution = moneyAmount(
    registration?.creditedCauseContribution ??
    registration?.credited_cause_contribution ??
    registration?.causeContributionCredited ??
    registration?.cause_contribution_credited ??
    0,
  )
  const causeDifference = moneyAmount(
    Math.max(requiredCauseContribution - creditedCauseContribution, 0),
  )
  const remainingRegistrationBalance = moneyAmount(
    registration?.remainingRegistrationBalance ??
    registration?.remaining_registration_balance ??
    causeDifference * 2,
  )
  const winnerAllocationDifference = moneyAmount(
    registration?.winnerAllocationDifference ??
    registration?.winner_allocation_difference ??
    Math.max(remainingRegistrationBalance - causeDifference, 0),
  )

  return {
    incomplete: causeDifference > 0,
    currency: String(registration?.currency ?? event?.currency ?? 'CAD'),
    requiredCauseContribution,
    creditedCauseContribution,
    remainingRegistrationBalance,
    causeDifference,
    winnerAllocationDifference,
    paymentDeadline:
      registration?.paymentDeadline ??
      registration?.payment_deadline ??
      event?.paymentDeadline ??
      event?.payment_deadline ??
      event?.registration_deadline ??
      null,
  }
}

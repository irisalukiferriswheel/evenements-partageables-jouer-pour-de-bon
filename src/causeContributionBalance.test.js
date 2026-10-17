import test from 'node:test'
import assert from 'node:assert/strict'
import { getCauseContributionBalance } from './causeContributionBalance.js'

const authoritativeBalance = {
  requiredCauseContribution: 20,
  creditedCauseContribution: 15,
  remainingRegistrationBalance: 10,
  causeDifference: 5,
  winnerAllocationDifference: 5,
  paymentDeadline: '2026-09-15T23:59:59-04:00',
  currency: 'CAD',
}

test('does not infer a private player balance from a public event price', () => {
  const balance = getCauseContributionBalance({ entry_fee: 40, currency: 'CAD' })
  assert.equal(balance.available, false)
  assert.equal(balance.incomplete, false)
  assert.equal(balance.requiredCauseContribution, null)
})

test('shows the authoritative difference for this registration and event', () => {
  const balance = getCauseContributionBalance({ entry_fee: 40 }, authoritativeBalance)
  assert.equal(balance.available, true)
  assert.equal(balance.valid, true)
  assert.equal(balance.incomplete, true)
  assert.equal(balance.requiredCauseContribution, 20)
  assert.equal(balance.creditedCauseContribution, 15)
  assert.equal(balance.causeDifference, 5)
  assert.equal(balance.winnerAllocationDifference, 5)
  assert.equal(balance.remainingRegistrationBalance, 10)
})

test('accepts snake-case fields nested in the server contribution balance', () => {
  const balance = getCauseContributionBalance({ currency: 'CAD' }, {
    contribution_balance: {
      required_cause_contribution: 30,
      credited_cause_contribution: 20,
      remaining_registration_balance: 20,
      cause_difference: 10,
      winner_allocation_difference: 10,
      payment_deadline: '2026-10-01T20:00:00Z',
      currency: 'cad',
    },
  })
  assert.equal(balance.available, true)
  assert.equal(balance.currency, 'CAD')
  assert.equal(balance.paymentDeadline, '2026-10-01T20:00:00Z')
})

test('rejects incomplete values instead of calculating missing money in the browser', () => {
  const balance = getCauseContributionBalance({ entry_fee: 40 }, {
    requiredCauseContribution: 20,
    creditedCauseContribution: 15,
  })
  assert.equal(balance.available, false)
  assert.equal(balance.incomplete, false)
})

test('does not display inconsistent server arithmetic', () => {
  const balance = getCauseContributionBalance({ entry_fee: 40 }, {
    ...authoritativeBalance,
    remainingRegistrationBalance: 30,
  })
  assert.equal(balance.available, true)
  assert.equal(balance.valid, false)
  assert.equal(balance.incomplete, false)
})

test('accepts cent-level rounding for an odd registration price', () => {
  const balance = getCauseContributionBalance({ entry_fee: 25 }, {
    requiredCauseContribution: 12.5,
    creditedCauseContribution: 10,
    causeDifference: 2.5,
    winnerAllocationDifference: 2.5,
    remainingRegistrationBalance: 5,
    paymentDeadline: '2026-09-15T23:59:59-04:00',
    currency: 'CAD',
  })
  assert.equal(balance.valid, true)
  assert.equal(balance.incomplete, true)
})

test('marks a fully paid authoritative contribution as complete', () => {
  const balance = getCauseContributionBalance({ entry_fee: 40 }, {
    requiredCauseContribution: 20,
    creditedCauseContribution: 20,
    causeDifference: 0,
    winnerAllocationDifference: 0,
    remainingRegistrationBalance: 0,
  })
  assert.equal(balance.available, true)
  assert.equal(balance.valid, true)
  assert.equal(balance.incomplete, false)
})

test('does not show an incomplete balance without an authoritative deadline', () => {
  const balance = getCauseContributionBalance({ entry_fee: 40 }, {
    ...authoritativeBalance,
    paymentDeadline: null,
  })
  assert.equal(balance.available, true)
  assert.equal(balance.valid, false)
  assert.equal(balance.incomplete, false)
})

test('checks that the required cause amount is half this event registration price', () => {
  const balance = getCauseContributionBalance({ entry_fee: 60 }, authoritativeBalance)
  assert.equal(balance.valid, false)
  assert.equal(balance.incomplete, false)
})

test('treats null and blank monetary fields as absent', () => {
  for (const missing of [null, '']) {
    const balance = getCauseContributionBalance({ entry_fee: 40 }, {
      ...authoritativeBalance,
      remainingRegistrationBalance: missing,
    })
    assert.equal(balance.available, false)
  }
})

test('rejects negative, NaN, and infinite monetary values', () => {
  for (const invalid of [-1, 'not-money', Infinity]) {
    const balance = getCauseContributionBalance({ entry_fee: 40 }, {
      ...authoritativeBalance,
      creditedCauseContribution: invalid,
    })
    assert.equal(balance.available, false)
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { getCauseContributionBalance } from './causeContributionBalance.js'

test('splits an unpaid event registration equally between cause and winners', () => {
  assert.deepEqual(
    getCauseContributionBalance({ entry_fee: 40, currency: 'CAD' }),
    {
      incomplete: true,
      currency: 'CAD',
      requiredCauseContribution: 20,
      creditedCauseContribution: 0,
      remainingRegistrationBalance: 40,
      causeDifference: 20,
      winnerAllocationDifference: 20,
      paymentDeadline: null,
    },
  )
})

test('shows only the difference needed to equal other players in the same event', () => {
  const balance = getCauseContributionBalance(
    { entry_fee: 40, currency: 'CAD' },
    { creditedCauseContribution: 15 },
  )

  assert.equal(balance.requiredCauseContribution, 20)
  assert.equal(balance.causeDifference, 5)
  assert.equal(balance.winnerAllocationDifference, 5)
  assert.equal(balance.remainingRegistrationBalance, 10)
  assert.equal(balance.incomplete, true)
})

test('does not compare contribution prices between different events', () => {
  const inexpensiveEvent = getCauseContributionBalance({ entry_fee: 40 })
  const expensiveEvent = getCauseContributionBalance({ entry_fee: 60 })

  assert.equal(inexpensiveEvent.requiredCauseContribution, 20)
  assert.equal(expensiveEvent.requiredCauseContribution, 30)
})

test('accepts server-authoritative balance fields for a returning player', () => {
  const balance = getCauseContributionBalance(
    { entry_fee: 40, currency: 'CAD' },
    {
      required_cause_contribution: 20,
      credited_cause_contribution: 15,
      remaining_registration_balance: 10,
      winner_allocation_difference: 5,
      payment_deadline: '2026-09-15T23:59:59-04:00',
    },
  )

  assert.equal(balance.causeDifference, 5)
  assert.equal(balance.remainingRegistrationBalance, 10)
  assert.equal(balance.paymentDeadline, '2026-09-15T23:59:59-04:00')
})

test('marks a fully equal contribution as complete', () => {
  const balance = getCauseContributionBalance(
    { entry_fee: 40 },
    { creditedCauseContribution: 20 },
  )

  assert.equal(balance.incomplete, false)
  assert.equal(balance.causeDifference, 0)
  assert.equal(balance.remainingRegistrationBalance, 0)
})

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCredit, validateCredit } from './credit.ts';

const base = { amount: 1_000_000, annualRate: 12, months: 12, paymentType: 'annuity' as const };

test('annuity matches the independent closed-form reference and reconciles every kopeck', () => {
  const result = calculateCredit(base);
  assert.equal(result.schedule.length, 12);
  assert.equal(result.firstPayment, 88_848.79);
  assert.ok(Math.abs(result.totalRepayment - 1_066_185.46) < .1);
  assert.equal(result.schedule.at(-1)?.balance, 0);
  const principalCents = result.schedule.reduce((sum, row) => sum + Math.round(row.principal * 100), 0);
  const paymentCents = result.schedule.reduce((sum, row) => sum + Math.round(row.payment * 100), 0);
  const interestCents = result.schedule.reduce((sum, row) => sum + Math.round(row.interest * 100), 0);
  assert.equal(principalCents, 100_000_000);
  assert.equal(paymentCents, principalCents + interestCents);
  assert.equal(Math.round(result.totalRepayment * 100), paymentCents);
});

test('zero-interest division adjusts the last payment without inventing interest', () => {
  const result = calculateCredit({ ...base, amount: 100_000, annualRate: 0 });
  assert.equal(result.firstPayment, 8_333.33);
  assert.equal(result.lastPayment, 8_333.37);
  assert.equal(result.totalRepayment, 100_000);
  assert.equal(result.totalInterest, 0);
});

test('differentiated payments decline and agree with a hand-calculated schedule', () => {
  const result = calculateCredit({ amount: 120_000, annualRate: 12, months: 12, paymentType: 'differentiated' });
  assert.equal(result.firstPayment, 11_200);
  assert.equal(result.lastPayment, 10_100);
  assert.equal(result.totalInterest, 7_800);
  assert.equal(result.totalRepayment, 127_800);
  assert.ok(result.schedule.every((row, index) => index === 0 || row.payment <= result.schedule[index - 1].payment));
});

test('one-month schedule repays principal and one month of nominal interest', () => {
  const result = calculateCredit({ ...base, amount: 100_000, months: 1 });
  assert.equal(result.firstPayment, 101_000);
  assert.equal(result.totalInterest, 1_000);
  assert.equal(result.schedule[0].balance, 0);
});

test('invalid and nonfinite inputs never generate financial results', () => {
  for (const patch of [{ amount: 0 }, { amount: 1_000_000_001 }, { amount: NaN }, { amount: 50.5 }, { annualRate: -1 }, { annualRate: Infinity }, { annualRate: 101 }, { months: 0 }, { months: 361 }, { months: 2.5 }, { paymentType: 'other' }]) {
    const value = { ...base, ...patch };
    assert.ok(Object.keys(validateCredit(value)).length > 0);
    assert.throws(() => calculateCredit(value), RangeError);
  }
});

test('large long-term loans and near-zero rates stay finite with no negative balance', () => {
  for (const annualRate of [0, 0.00000001, 24, 100]) {
    for (const paymentType of ['annuity', 'differentiated'] as const) {
      const result = calculateCredit({ amount: 1_000_000_000, annualRate, months: 360, paymentType });
      assert.ok(Number.isFinite(result.totalRepayment));
      assert.equal(result.schedule.at(-1)?.balance, 0);
      assert.ok(result.schedule.every(row => row.balance >= 0 && row.principal >= 0 && row.interest >= 0));
    }
  }
});

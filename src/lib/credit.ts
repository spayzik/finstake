export type PaymentType = 'annuity' | 'differentiated';
export type CreditInput = { amount: number; annualRate: number; months: number; paymentType: PaymentType | string };
export type CreditErrors = Partial<Record<keyof CreditInput, string>>;
export type PaymentRow = { month: number; payment: number; principal: number; interest: number; balance: number };
export type CreditResult = { firstPayment: number; lastPayment: number; totalRepayment: number; totalInterest: number; schedule: PaymentRow[] };

export function validateCredit(input: CreditInput): CreditErrors {
  const errors: CreditErrors = {};
  if (!Number.isSafeInteger(input.amount) || input.amount < 1 || input.amount > 1_000_000_000) errors.amount = 'Укажите целую сумму от 1 до 1 000 000 000 ₽.';
  if (!Number.isFinite(input.annualRate) || input.annualRate < 0 || input.annualRate > 100) errors.annualRate = 'Укажите ставку от 0 до 100% годовых.';
  if (!Number.isInteger(input.months) || input.months < 1 || input.months > 360) errors.months = 'Укажите срок от 1 до 360 месяцев.';
  if (input.paymentType !== 'annuity' && input.paymentType !== 'differentiated') errors.paymentType = 'Выберите тип платежей.';
  return errors;
}

export function calculateCredit(input: CreditInput): CreditResult {
  if (Object.keys(validateCredit(input)).length) throw new RangeError('Некорректные параметры расчёта.');
  const principalCents = input.amount * 100;
  const monthlyRate = input.annualRate / 100 / 12;
  const annuity = monthlyRate === 0
    ? principalCents / input.months
    : principalCents * monthlyRate / -Math.expm1(-input.months * Math.log1p(monthlyRate));
  const instalmentCents = Math.round(annuity);
  let balanceCents = principalCents;
  let paidPrincipalCents = 0;
  let totalInterestCents = 0;
  let totalPaymentCents = 0;
  const schedule: PaymentRow[] = [];
  for (let month = 1; month <= input.months; month++) {
    const interestCents = Math.round(balanceCents * monthlyRate);
    let repaidCents = input.paymentType === 'annuity'
      ? Math.max(0, instalmentCents - interestCents)
      : Math.round(principalCents * month / input.months) - paidPrincipalCents;
    repaidCents = month === input.months ? balanceCents : Math.min(balanceCents, repaidCents);
    const paymentCents = repaidCents + interestCents;
    balanceCents -= repaidCents;
    paidPrincipalCents += repaidCents;
    totalInterestCents += interestCents;
    totalPaymentCents += paymentCents;
    schedule.push({ month, payment: paymentCents / 100, principal: repaidCents / 100, interest: interestCents / 100, balance: balanceCents / 100 });
  }
  return { firstPayment: schedule[0].payment, lastPayment: schedule.at(-1)!.payment, totalRepayment: totalPaymentCents / 100, totalInterest: totalInterestCents / 100, schedule };
}

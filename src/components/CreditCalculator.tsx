import { useId, useMemo, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowUpRight, Calculator, Check, ChevronDown, Info } from 'lucide-react';
import { calculateCredit, validateCredit, type PaymentType } from '../lib/credit';
import { parseAmount, type LeadDraft } from '../lib/lead';
import './credit-calculator.css';
import { creditTerms as terms } from '../lib/terms';

export type CalculationPrefill = Pick<LeadDraft, 'amount' | 'term' | 'comment'>;
const rubles = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
const shortRubles = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });

export default function CreditCalculator({ onDiscuss }: { onDiscuss: (values: CalculationPrefill) => void }) {
  const prefix = useId();
  const [amountText, setAmountText] = useState('1 000 000');
  const [rateText, setRateText] = useState('24');
  const [months, setMonths] = useState(60);
  const [paymentType, setPaymentType] = useState<PaymentType>('annuity');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const amount = parseAmount(amountText);
  const annualRate = /^\d+(?:[.,]\d{1,4})?$/.test(rateText) ? Number(rateText.replace(',', '.')) : NaN;
  const input = { amount: amount ?? NaN, annualRate, months, paymentType };
  const errors = validateCredit(input);
  const valid = Object.keys(errors).length === 0;
  const result = useMemo(() => valid ? calculateCredit({ amount: amount!, annualRate, months, paymentType }) : null, [valid, amount, annualRate, months, paymentType]);
  const principalPercent = result ? amount! / result.totalRepayment * 100 : 0;
  const sliderMax = Math.max(5_000_000, Math.ceil((amount ?? 0) / 1_000_000) * 1_000_000);

  function discuss() {
    if (!result || amount === null) return;
    onDiscuss({ amount: String(amount), term: String(months), comment: `Предварительный расчёт: ${months} мес., ставка для расчёта ${annualRate}% годовых, ${paymentType === 'annuity' ? 'аннуитетные' : 'дифференцированные'} платежи. Первый платёж ${rubles.format(result.firstPayment)}. Без учёта страхования, комиссий и услуг брокера.` });
  }

  return <section className="section calculator-section" id="calculator" aria-labelledby="calculator-title">
    <div className="container">
      <div className="calculator-heading"><div><p className="eyebrow"><Calculator size={15} aria-hidden="true" /> Кредитный калькулятор</p><h2 id="calculator-title">Ваши планы.<br /><span>В понятных цифрах.</span></h2></div><p>Посмотрите, как сумма, срок и ставка<br className="desktop-break" /> влияют на платёж. Без регистрации.</p></div>
      <div className="calculator-card">
        <div className="calculator-controls">
          <fieldset className="calculator-payment-type"><legend className="sr-only">Тип платежей</legend>
            {([{ value: 'annuity', text: 'Равные платежи' }, { value: 'differentiated', text: 'Убывающие платежи' }] as const).map(option => <label key={option.value}><input type="radio" name={`${prefix}-type`} value={option.value} checked={paymentType === option.value} onChange={() => setPaymentType(option.value)} /><span>{option.text}{paymentType === option.value && <Check size={14} aria-hidden="true" />}</span></label>)}
          </fieldset>
          <div className="calculator-amount-field">
            <label htmlFor={`${prefix}-amount`}>Сумма кредита</label>
            <div className="calculator-number-wrap"><input id={`${prefix}-amount`} inputMode="numeric" value={amountText} maxLength={18} onChange={event => setAmountText(event.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? `${prefix}-amount-error` : undefined} /><span aria-hidden="true">₽</span></div>
            {errors.amount && <p className="calculator-field-error" id={`${prefix}-amount-error`}>{errors.amount}</p>}
            <input className="calculator-range" type="range" min={100_000} max={sliderMax} step={50_000} value={Math.min(sliderMax, Math.max(100_000, amount ?? 100_000))} style={{ '--range-progress': `${(Math.min(sliderMax, Math.max(100_000, amount ?? 100_000)) - 100_000) / (sliderMax - 100_000) * 100}%` } as CSSProperties} onChange={event => setAmountText(Number(event.target.value).toLocaleString('ru-RU'))} aria-label="Изменить сумму кредита ползунком" />
            <div className="calculator-range-labels" aria-hidden="true"><span>100 тыс. ₽</span><span>{shortRubles.format(sliderMax)} ₽</span></div>
          </div>
          <div className="calculator-field-pair">
            <div><label htmlFor={`${prefix}-term`}>Срок кредита</label><select id={`${prefix}-term`} value={months} onChange={event => setMonths(Number(event.target.value))}>{terms.map(term => <option key={term.months} value={term.months}>{term.title}</option>)}</select></div>
            <div><label htmlFor={`${prefix}-rate`}>Ставка для расчёта</label><div className="calculator-rate-wrap"><input id={`${prefix}-rate`} type="text" inputMode="decimal" value={rateText} maxLength={8} onChange={event => setRateText(event.target.value)} aria-invalid={Boolean(errors.annualRate)} aria-describedby={`${prefix}-rate-hint${errors.annualRate ? ` ${prefix}-rate-error` : ''}`} /><span aria-hidden="true">% годовых</span></div>{errors.annualRate && <p className="calculator-field-error" id={`${prefix}-rate-error`}>{errors.annualRate}</p>}</div>
          </div>
          <p className="calculator-rate-hint" id={`${prefix}-rate-hint`}><Info size={14} aria-hidden="true" /> Ставку задаёте вы. Это не предложение банка.</p>
          <div className="calculator-help"><span className="calculator-help-icon"><Calculator size={19} strokeWidth={1.5} aria-hidden="true" /></span><p>Не знаете, на какие условия рассчитывать?<br /><strong>Разберём вашу ситуацию лично.</strong></p><ArrowDown size={17} aria-hidden="true" /></div>
        </div>
        <div className="calculator-result" aria-live="polite" aria-atomic="true">
          <div className="calculator-result-kicker"><span className="status-dot" /> Предварительный расчёт<span className="calculator-result-symbol" aria-hidden="true">₽</span></div>
          {result ? <>
            <p className="calculator-result-label">{paymentType === 'annuity' ? 'Ежемесячный платёж' : 'Первый ежемесячный платёж'}</p>
            <p className="calculator-main-value">{rubles.format(result.firstPayment)}</p>
            <p className="calculator-result-detail">{paymentType === 'annuity' ? `${months} месяцев · равные платежи*` : `Снижается до ${rubles.format(result.lastPayment)} в последний месяц`}</p>
            <div className="calculator-cost-bar" aria-hidden="true"><span style={{ width: `${principalPercent}%` }} /><span /></div>
            <dl className="calculator-totals"><div><dt><span className="cost-dot principal-dot" /> Сумма кредита</dt><dd>{rubles.format(amount!)}</dd></div><div><dt><span className="cost-dot interest-dot" /> Проценты за весь срок</dt><dd>{rubles.format(result.totalInterest)}</dd></div><div className="calculator-total"><dt>Всего выплат по кредиту</dt><dd>{rubles.format(result.totalRepayment)}</dd></div></dl>
            <button className="button calculator-discuss" onClick={discuss}>Обсудить этот расчёт <ArrowUpRight size={18} aria-hidden="true" /></button>
          </> : <div className="calculator-empty"><Calculator size={36} strokeWidth={1.2} aria-hidden="true" /><h3>Уточните параметры</h3><p>Проверьте отмеченные поля, чтобы увидеть корректный расчёт.</p><button className="button calculator-discuss" disabled>Обсудить этот расчёт</button></div>}
          <p className="calculator-result-note">Без страхования, дополнительных комиссий и вознаграждения брокера. {paymentType === 'annuity' && '* Последний платёж может отличаться из-за округления.'}</p>
        </div>
      </div>
      {result && <details className="calculator-schedule" onToggle={event => setScheduleOpen(event.currentTarget.open)}><summary><span>График платежей <span className="schedule-count">{months} мес.</span></span><ChevronDown size={18} aria-hidden="true" /></summary>{scheduleOpen && <div className="calculator-table-scroll" tabIndex={0} role="region" aria-label="Прокручиваемый график платежей"><table><caption className="sr-only">Расчёт ежемесячных платежей по введённым параметрам</caption><thead><tr><th scope="col">Месяц</th><th scope="col">Платёж</th><th scope="col">Основной долг</th><th scope="col">Проценты</th><th scope="col">Остаток долга</th></tr></thead><tbody>{result.schedule.map(row => <tr key={row.month}><th scope="row">{row.month}</th><td>{rubles.format(row.payment)}</td><td>{rubles.format(row.principal)}</td><td>{rubles.format(row.interest)}</td><td>{rubles.format(row.balance)}</td></tr>)}</tbody></table></div>}</details>}
      <p className="calculator-disclaimer">Это предварительный расчёт по введённой ставке, а не предложение банка. Точные платежи и полная стоимость кредита зависят от индивидуальных условий и дополнительных услуг.</p>
    </div>
  </section>;
}

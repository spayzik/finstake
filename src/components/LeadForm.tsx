import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowLeftRight, ArrowRight, BriefcaseBusiness, Check, CheckCircle2, House, LoaderCircle, ShieldCheck, UserRound, X } from 'lucide-react';
import {
  LeadSubmissionError,
  parseAmount,
  resolveLeadConfig,
  submitLead,
  validateContact,
  validateDetails,
  type ContactErrors,
  type DetailsErrors,
  type LeadDraft,
  type LeadResult,
  type ServiceType,
} from '../lib/lead';
import './lead-form.css';

type LeadFormProps = {
  initialService?: ServiceType;
  initialValues?: Pick<LeadDraft, 'amount' | 'term' | 'comment'>;
  onClose: () => void;
  onPrivacy: () => void;
};

const serviceOptions = [
  { value: 'personal', title: 'Личные цели', icon: UserRound },
  { value: 'business', title: 'Для бизнеса', icon: BriefcaseBusiness },
  { value: 'secured', title: 'Под залог', icon: House },
  { value: 'refinancing', title: 'Рефинансирование', icon: ArrowLeftRight },
] as const;

const communicationOptions = [
  { value: 'phone', label: 'По телефону' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const;

const config = resolveLeadConfig({
  endpoint: import.meta.env.VITE_LEAD_ENDPOINT,
  privacyPolicyVersion: import.meta.env.VITE_PRIVACY_POLICY_VERSION,
  privacyPolicyUrl: import.meta.env.VITE_PRIVACY_POLICY_URL,
});

export function LeadForm({ initialService = 'personal', initialValues, onClose, onPrivacy }: LeadFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<LeadDraft>({
    service: initialService, amount: initialValues?.amount ?? '', term: initialValues?.term ?? '', comment: initialValues?.comment ?? '',
    name: '', phone: '', communication: 'phone', consent: false,
  });
  const [errors, setErrors] = useState<DetailsErrors & ContactErrors>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const prefix = useId();
  const reduceMotion = useReducedMotion();
  const isDemo = config.mode === 'demo';
  const id = (field: string) => `${prefix}-${field}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [step, result]);

  function update<K extends keyof LeadDraft>(field: K, value: LeadDraft[K]) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmitError('');
  }

  function showErrors(nextErrors: DetailsErrors & ContactErrors) {
    setErrors(nextErrors);
    setAnnouncement('Проверьте отмеченные поля.');
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    if (step === 1) {
      const nextErrors = validateDetails(draft);
      if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
      setErrors({});
      setAnnouncement('Шаг 2 из 2. Контактные данные.');
      setStep(2);
      return;
    }
    const nextErrors = validateContact(draft);
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
    if (config.mode === 'unavailable') return;
    busyRef.current = true;
    setPending(true);
    setSubmitError('');
    setAnnouncement(isDemo ? 'Проверяем данные в деморежиме.' : 'Отправляем заявку.');
    abortRef.current = new AbortController();
    try {
      const nextResult = await submitLead(draft, config, { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      setResult(nextResult);
      setAnnouncement(nextResult.status === 'demo' ? 'Данные проверены. Заявка не отправлена.' : 'Сервер подтвердил приём заявки.');
    } catch (error) {
      if (!mountedRef.current || (error instanceof LeadSubmissionError && error.code === 'cancelled')) return;
      setSubmitError(error instanceof LeadSubmissionError ? error.message : 'Отправка не подтверждена. Попробуйте ещё раз.');
      setAnnouncement('Отправка не подтверждена.');
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setPending(false);
    }
  }

  const amount = parseAmount(draft.amount);
  const selectedService = serviceOptions.find((service) => service.value === draft.service)?.title;

  return (
    <div className="lead-form-shell">
      <button type="button" className="lead-close" onClick={onClose} aria-label="Закрыть форму"><X size={21} strokeWidth={1.7} aria-hidden="true" /></button>
      <div className="lead-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
      {result ? (
        <div className="lead-result">
          <div className="lead-result-icon"><CheckCircle2 size={36} strokeWidth={1.5} aria-hidden="true" /></div>
          <p className="lead-eyebrow">{result.status === 'demo' ? 'Деморежим' : 'Подтверждено сервером'}</p>
          <h2 id="lead-form-title" ref={titleRef} tabIndex={-1}>{result.status === 'demo' ? 'Данные проверены' : 'Заявка принята'}</h2>
          <p className="lead-description">{result.status === 'demo'
            ? 'Данные проверены. Это деморежим — заявка не отправлена.'
            : 'Сервер подтвердил приём заявки. Сохраните номер вашего обращения.'}</p>
          {result.status === 'accepted' && <p className="lead-request-id">Номер обращения: <strong>{result.requestId}</strong></p>}
          <div className="lead-summary"><span>{selectedService}</span><strong>{amount?.toLocaleString('ru-RU')} ₽</strong></div>
          <button type="button" className="lead-button lead-button-primary" onClick={onClose}>Готово <Check size={18} aria-hidden="true" /></button>
        </div>
      ) : (
        <>
          <p className="lead-eyebrow">Ваш следующий шаг</p>
          <h2 id="lead-form-title" ref={titleRef} tabIndex={-1}>{step === 1 ? 'Расскажите о вашей задаче' : 'Как с вами связаться?'}</h2>
          <p className="lead-description">{step === 1 ? 'Проанализируем ситуацию и подберём решение под ваши цели. Без предоплаты.' : 'Оставьте контакты — обсудим путь от документов до получения кредита.'}</p>

          {isDemo && <div className="lead-mode-note"><ShieldCheck size={17} aria-hidden="true" /><p><strong>Деморежим.</strong> Данные проверяются только в браузере. Заявка не отправляется.</p></div>}
          {config.mode === 'unavailable' && <div className="lead-error-banner" role="status">Отправка недоступна. {config.reason}</div>}

          <ol className="lead-progress" aria-label={`Шаг ${step} из 2`}>
            <li aria-current={step === 1 ? 'step' : undefined} className={step === 2 ? 'lead-progress-complete' : ''}><span>{step === 2 ? <Check size={13} aria-hidden="true" /> : '01'}</span> Ваша задача</li>
            <li aria-current={step === 2 ? 'step' : undefined}><span>02</span> Контакты</li>
          </ol>

          <form ref={formRef} noValidate onSubmit={handleSubmit} aria-busy={pending}>
            <fieldset className="lead-fields" disabled={pending}>
              <AnimatePresence initial={false} mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduceMotion ? 0 : -8 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}>
                  {step === 1 ? (
                    <div className="lead-field-stack">
                      <fieldset className="lead-choice-field" aria-describedby={errors.service ? id('service-error') : undefined}>
                        <legend className="lead-label">Что вас интересует?</legend>
                        <div className="lead-service-grid">
                          {serviceOptions.map(({ value, title, icon: Icon }) => (
                            <label key={value} className="lead-choice-label">
                              <input className="lead-choice-input" type="radio" name={id('service')} value={value} checked={draft.service === value} onChange={() => update('service', value)} aria-invalid={Boolean(errors.service) || undefined} />
                              <span className="lead-service-card"><Icon size={18} strokeWidth={1.6} aria-hidden="true" /><span>{title}</span><span className="lead-radio-dot" /></span>
                            </label>
                          ))}
                        </div>
                        {errors.service && <p className="lead-field-error" id={id('service-error')}>{errors.service}</p>}
                      </fieldset>
                      <div className="lead-field">
                        <label className="lead-label" htmlFor={id('amount')}>Какая сумма нужна? <span className="lead-required" aria-hidden="true">*</span></label>
                        <div className="lead-input-wrap"><input id={id('amount')} name="amount" type="text" inputMode="numeric" autoComplete="off" placeholder="Например, 1 000 000" value={draft.amount} onChange={(event) => update('amount', event.target.value)} required maxLength={18} aria-invalid={Boolean(errors.amount) || undefined} aria-describedby={`${id('amount-hint')}${errors.amount ? ` ${id('amount-error')}` : ''}`} /><span className="lead-input-unit" aria-hidden="true">₽</span></div>
                        <p className="lead-hint" id={id('amount-hint')}>Сумма в рублях. Условия зависят от вашей ситуации.</p>
                        {errors.amount && <p className="lead-field-error" id={id('amount-error')}>{errors.amount}</p>}
                      </div>
                      <div className="lead-field">
                        <label className="lead-label" htmlFor={id('term')}>На какой срок? <span className="lead-optional">необязательно</span></label>
                        <select id={id('term')} name="term" value={draft.term} onChange={(event) => update('term', event.target.value)} aria-invalid={Boolean(errors.term) || undefined} aria-describedby={errors.term ? id('term-error') : undefined}>
                          <option value="">Пока не определился(ась)</option>
                          <option value="12">1 год</option><option value="24">2 года</option><option value="36">3 года</option><option value="60">5 лет</option><option value="84">7 лет</option><option value="120">10 лет</option>
                        </select>
                        {errors.term && <p className="lead-field-error" id={id('term-error')}>{errors.term}</p>}
                      </div>
                      <div className="lead-field">
                        <label className="lead-label" htmlFor={id('comment')}>Что ещё важно учесть? <span className="lead-optional">необязательно</span></label>
                        <textarea id={id('comment')} name="comment" rows={2} maxLength={1000} placeholder="Коротко о вашей задаче" value={draft.comment} onChange={(event) => update('comment', event.target.value)} aria-invalid={Boolean(errors.comment) || undefined} aria-describedby={errors.comment ? id('comment-error') : id('comment-hint')} />
                        <p className="lead-hint" id={id('comment-hint')}>До 1 000 символов. Не указывайте паспортные и платёжные данные.</p>
                        {errors.comment && <p className="lead-field-error" id={id('comment-error')}>{errors.comment}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="lead-field-stack">
                      <div className="lead-summary lead-summary-compact"><span>{selectedService}</span><strong>{amount?.toLocaleString('ru-RU')} ₽</strong></div>
                      <div className="lead-field">
                        <label className="lead-label" htmlFor={id('name')}>Как вас зовут? <span className="lead-required" aria-hidden="true">*</span></label>
                        <input id={id('name')} name="name" autoComplete="name" required maxLength={80} placeholder="Ваше имя" value={draft.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name) || undefined} aria-describedby={errors.name ? id('name-error') : undefined} />
                        {errors.name && <p className="lead-field-error" id={id('name-error')}>{errors.name}</p>}
                      </div>
                      <div className="lead-field">
                        <label className="lead-label" htmlFor={id('phone')}>Номер телефона <span className="lead-required" aria-hidden="true">*</span></label>
                        <input id={id('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} placeholder="+7 999 123-45-67" value={draft.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={Boolean(errors.phone) || undefined} aria-describedby={errors.phone ? id('phone-error') : undefined} />
                        {errors.phone && <p className="lead-field-error" id={id('phone-error')}>{errors.phone}</p>}
                      </div>
                      <fieldset className="lead-choice-field" aria-describedby={errors.communication ? id('communication-error') : undefined}>
                        <legend className="lead-label">Как удобнее общаться?</legend>
                        <div className="lead-channel-grid">
                          {communicationOptions.map(({ value, label }) => <label key={value} className="lead-choice-label"><input className="lead-choice-input" type="radio" name={id('communication')} value={value} checked={draft.communication === value} onChange={() => update('communication', value)} aria-invalid={Boolean(errors.communication) || undefined} /><span className="lead-channel-card">{label}</span></label>)}
                        </div>
                        {errors.communication && <p className="lead-field-error" id={id('communication-error')}>{errors.communication}</p>}
                      </fieldset>
                      <div className="lead-consent-field">
                        <label className="lead-consent-label" htmlFor={id('consent')}><input id={id('consent')} name="consent" type="checkbox" checked={draft.consent} onChange={(event) => update('consent', event.target.checked)} required aria-invalid={Boolean(errors.consent) || undefined} aria-describedby={errors.consent ? id('consent-error') : undefined} /><span>{isDemo ? 'Я понимаю, что это демоформа и данные не отправляются.' : 'Согласен(на) на обработку указанных данных для связи по обращению.'}</span></label>
                        {config.mode === 'live' ? <a className="lead-privacy-link" href={config.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Политика обработки данных ↗</a> : <button type="button" className="lead-privacy-link" onClick={onPrivacy}>Об обработке данных</button>}
                        {errors.consent && <p className="lead-field-error" id={id('consent-error')}>{errors.consent}</p>}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </fieldset>
            {submitError && <div className="lead-error-banner" role="alert" tabIndex={-1} ref={errorRef}>{submitError}</div>}
            <div className="lead-actions">
              {step === 2 && <button className="lead-button lead-button-back" type="button" disabled={pending} onClick={() => { setStep(1); setErrors({}); setSubmitError(''); setAnnouncement('Шаг 1 из 2. Ваша задача.'); }}><ArrowLeft size={17} aria-hidden="true" /> Назад</button>}
              <button className="lead-button lead-button-primary" type="submit" disabled={pending || (step === 2 && config.mode === 'unavailable')}>
                {pending ? <><LoaderCircle className="lead-spinner" size={18} aria-hidden="true" />{isDemo ? 'Проверяем…' : 'Отправляем…'}</> : <>{step === 1 ? 'Далее — контакты' : isDemo ? 'Проверить данные' : submitError ? 'Повторить отправку' : 'Отправить заявку'}<ArrowRight size={18} aria-hidden="true" /></>}
              </button>
            </div>
            <p className="lead-footer-note">{step === 1 ? '* — обязательное поле. Это обращение, без обязательств.' : isDemo ? 'В деморежиме данные никуда не передаются и не сохраняются.' : 'Отправка обращения не гарантирует одобрение финансирования.'}</p>
          </form>
        </>
      )}
    </div>
  );
}

export default LeadForm;
